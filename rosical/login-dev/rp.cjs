// Minimal OIDC relying parties (auth code + PKCE) for the apps in apps.cjs, one HTTP server per app.
// Client ids come from seed.out.env; the issuer is the same-origin proxy, so the login under test is used.
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { APPS } = require("./apps.cjs");

const ISSUER = process.env.ISSUER || "http://localhost:3200";
const SEED_OUT = path.join(__dirname, "seed.out.env");

function readClientId(app) {
  const name = `${app.slug.toUpperCase().replace(/-/g, "_")}_CLIENT_ID`;
  if (!fs.existsSync(SEED_OUT)) throw new Error(`${SEED_OUT} missing; run ./login.sh seed first`);
  const line = fs.readFileSync(SEED_OUT, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing in ${SEED_OUT}; re-run ./login.sh seed`);
  return line.slice(name.length + 1);
}

// Fetched per request so the RP can start before the proxy is up.
async function discovery() {
  const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`discovery at ${ISSUER} failed: HTTP ${res.status}`);
  return res.json();
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(res, status, title, body) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><meta charset="utf-8"><title>${escape(title)}</title><body style="font-family:sans-serif;margin:2rem"><h1>${escape(title)}</h1>${body}</body>`);
}

function cookie(req, name) {
  const match = (req.headers.cookie || "").split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

function createApp(app) {
  const clientId = readClientId(app);
  const redirectUri = `${app.origin}/callback`;
  // Cookies are not port-scoped, so each app needs its own cookie name.
  const cookieName = `rp_${app.slug}`;
  const pending = new Map(); // state -> code verifier
  const sessions = new Map(); // session id -> { user, idToken }

  async function signIn(res) {
    const config = await discovery();
    const state = b64url(crypto.randomBytes(16));
    const verifier = b64url(crypto.randomBytes(32));
    pending.set(state, verifier);
    const url = new URL(config.authorization_endpoint);
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      state,
      code_challenge: b64url(crypto.createHash("sha256").update(verifier).digest()),
      code_challenge_method: "S256",
    }).toString();
    res.writeHead(302, { location: url.toString() });
    res.end();
  }

  async function callback(url, res) {
    if (url.searchParams.get("error")) {
      return page(res, 400, `${app.name}: sign-in failed`, `<p>${escape(url.searchParams.get("error"))}: ${escape(url.searchParams.get("error_description") || "")}</p><p><a href="/">Back</a></p>`);
    }
    const verifier = pending.get(url.searchParams.get("state"));
    if (!verifier) return page(res, 400, `${app.name}: unknown state`, `<p>Start again from <a href="/">the start page</a>.</p>`);
    pending.delete(url.searchParams.get("state"));

    const config = await discovery();
    const tokenRes = await fetch(config.token_endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code: url.searchParams.get("code") || "", redirect_uri: redirectUri, client_id: clientId, code_verifier: verifier }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(`token exchange failed: HTTP ${tokenRes.status} ${JSON.stringify(tokens)}`);
    // ZITADEL keeps profile claims out of the id token by default, so the user name comes from userinfo.
    const userinfoRes = await fetch(config.userinfo_endpoint, { headers: { authorization: `Bearer ${tokens.access_token}` } });
    const userinfo = await userinfoRes.json();
    if (!userinfoRes.ok) throw new Error(`userinfo failed: HTTP ${userinfoRes.status} ${JSON.stringify(userinfo)}`);
    const sid = b64url(crypto.randomBytes(16));
    sessions.set(sid, { user: userinfo.preferred_username || userinfo.sub, idToken: tokens.id_token });
    res.writeHead(302, { location: "/", "set-cookie": `${cookieName}=${sid}; Path=/; HttpOnly; SameSite=Lax` });
    res.end();
  }

  async function signOut(req, res) {
    const sid = cookie(req, cookieName);
    const session = sessions.get(sid);
    sessions.delete(sid);
    const clear = `${cookieName}=; Path=/; Max-Age=0`;
    if (!session) {
      res.writeHead(302, { location: "/", "set-cookie": clear });
      return res.end();
    }
    const config = await discovery();
    const url = new URL(config.end_session_endpoint);
    url.search = new URLSearchParams({ id_token_hint: session.idToken, client_id: clientId, post_logout_redirect_uri: `${app.origin}/` }).toString();
    res.writeHead(302, { location: url.toString(), "set-cookie": clear });
    res.end();
  }

  function home(req, res) {
    const session = sessions.get(cookie(req, cookieName));
    if (session) return page(res, 200, `Signed in to ${app.name} as ${session.user}`, `<p><a href="/logout">Sign out</a></p>`);
    page(res, 200, app.name, `<p>Client id ${escape(clientId)}</p><p><a href="/login">Sign in</a></p>`);
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, app.origin);
    console.log(`${new Date().toISOString()} ${app.slug} ${req.method} ${url.pathname}`);
    try {
      if (url.pathname === "/") return home(req, res);
      if (url.pathname === "/login") return await signIn(res);
      if (url.pathname === "/callback") return await callback(url, res);
      if (url.pathname === "/logout") return await signOut(req, res);
      page(res, 404, "Not found", "");
    } catch (err) {
      console.error(`${app.slug} ${req.method} ${req.url}: ${err.message}`);
      page(res, 502, `${app.name}: error`, `<pre>${escape(err.message)}</pre>`);
    }
  });
}

for (const app of APPS) {
  const port = Number(new URL(app.origin).port);
  createApp(app).listen(port, "127.0.0.1", () => console.log(`${app.name} on ${app.origin}`));
}
