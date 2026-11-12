// Idempotent seed of the local rosical-iam instance for login tests: project, two OIDC apps, three users, login and branding settings.
// Run through `./login.sh seed`, which passes the credentials below from the running stack.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { totp } = require("./totp.cjs");
const { APPS } = require("./apps.cjs");

const API = process.env.ZITADEL_API_URL || "http://localhost:8082";
const OUT = path.join(__dirname, "seed.out.env");
const PROJECT = "digisat-dev";
const ROLE = "user";
const PASSWORD = "Password1!";
const USERS = [
  { userName: "alice", givenName: "Alice", grant: true, totp: true },
  { userName: "bob", givenName: "Bob", grant: true, totp: false },
  { userName: "carol", givenName: "Carol", grant: false, totp: false },
];
const HUB_URL = APPS.find((app) => app.slug === "hub").origin + "/";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (run the seed through ./login.sh seed)`);
  return value;
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

// System API user JWT, the same credential the login app uses; aud must be the instance's external URL.
function loginClientToken() {
  const key = Buffer.from(requireEnv("LOGIN_CLIENT_PRIVATE_KEY"), "base64").toString("utf8");
  const user = requireEnv("LOGIN_CLIENT_USER_ID");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iss: user, sub: user, aud: API, iat: now, exp: now + 600 }));
  const signature = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), key);
  return `${header}.${payload}.${b64url(signature)}`;
}

async function call(token, method, apiPath, body) {
  const res = await fetch(API + apiPath, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${apiPath} -> HTTP ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

// Signs the instance admin in through the Console's own OIDC client (auth code + PKCE), finishing the
// auth request with the login client's Session API, exactly like the login UI does.
async function adminToken() {
  const loginToken = loginClientToken();
  const consoleEnv = await (await fetch(`${API}/ui/console/assets/environment.json`)).json();
  const redirectUri = `${API}/ui/console/auth/callback`;
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const authorize = new URL(`${API}/oauth/v2/authorize`);
  authorize.search = new URLSearchParams({
    client_id: consoleEnv.clientid,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid urn:zitadel:iam:org:project:id:zitadel:aud",
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  const authRes = await fetch(authorize, { redirect: "manual" });
  const location = authRes.headers.get("location") || "";
  const authRequestId = new URL(location, API).searchParams.get("authRequest");
  if (!authRequestId) throw new Error(`authorize did not redirect to the login with an authRequest (HTTP ${authRes.status}, location "${location}")`);

  const loginName = requireEnv("ADMIN_LOGIN_NAME");
  const session = await call(loginToken, "POST", "/v2/sessions", {
    checks: { user: { loginName }, password: { password: requireEnv("ADMIN_PASSWORD") } },
  });
  const callback = await call(loginToken, "POST", `/v2/oidc/auth_requests/${authRequestId}`, {
    session: { sessionId: session.sessionId, sessionToken: session.sessionToken },
  });
  const code = new URL(callback.callbackUrl).searchParams.get("code");
  if (!code) throw new Error(`auth request callback has no code: ${callback.callbackUrl}`);

  const tokenRes = await fetch(`${API}/oauth/v2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: consoleEnv.clientid, code_verifier: verifier }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(`token exchange for ${loginName} failed: HTTP ${tokenRes.status} ${JSON.stringify(tokens)}`);
  console.log(`admin: signed in as ${loginName}`);
  return { token: tokens.access_token, end: () => call(loginToken, "DELETE", `/v2/sessions/${session.sessionId}`, {}) };
}

async function ensureProject(token) {
  const wanted = { name: PROJECT, projectRoleAssertion: true, projectRoleCheck: true, hasProjectCheck: false };
  const found = await call(token, "POST", "/management/v1/projects/_search", {
    queries: [{ nameQuery: { name: PROJECT, method: "TEXT_QUERY_METHOD_EQUALS" } }],
  });
  let project = (found.result || [])[0];
  if (!project) {
    const created = await call(token, "POST", "/management/v1/projects", wanted);
    console.log(`project: created ${PROJECT} (${created.id})`);
    project = { id: created.id };
  } else if (!project.projectRoleCheck || !project.projectRoleAssertion || project.hasProjectCheck) {
    await call(token, "PUT", `/management/v1/projects/${project.id}`, wanted);
    console.log(`project: updated ${PROJECT} (${project.id})`);
  } else {
    console.log(`project: ${PROJECT} (${project.id}) up to date`);
  }

  const roles = await call(token, "POST", `/management/v1/projects/${project.id}/roles/_search`, {});
  if (!(roles.result || []).some((role) => role.key === ROLE)) {
    await call(token, "POST", `/management/v1/projects/${project.id}/roles`, { roleKey: ROLE, displayName: "User" });
    console.log(`project: added role ${ROLE}`);
  }
  return project.id;
}

async function ensureApp(token, projectId, app) {
  const config = {
    redirectUris: [`${app.origin}/callback`],
    responseTypes: ["OIDC_RESPONSE_TYPE_CODE"],
    grantTypes: ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE"],
    appType: "OIDC_APP_TYPE_USER_AGENT",
    authMethodType: "OIDC_AUTH_METHOD_TYPE_NONE",
    postLogoutRedirectUris: [`${app.origin}/`],
    // Dev mode allows plain http redirect URIs.
    devMode: true,
  };
  const found = await call(token, "POST", `/management/v1/projects/${projectId}/apps/_search`, {
    queries: [{ nameQuery: { name: app.name, method: "TEXT_QUERY_METHOD_EQUALS" } }],
  });
  const existing = (found.result || [])[0];
  if (!existing) {
    const created = await call(token, "POST", `/management/v1/projects/${projectId}/apps/oidc`, { name: app.name, ...config });
    console.log(`app: created "${app.name}" (client ${created.clientId})`);
    return created.clientId;
  }
  const current = existing.oidcConfig;
  const same = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...b].sort());
  if (!same(current.redirectUris, config.redirectUris) || !same(current.postLogoutRedirectUris, config.postLogoutRedirectUris)) {
    await call(token, "PUT", `/management/v1/projects/${projectId}/apps/${existing.id}/oidc_config`, config);
    console.log(`app: updated "${app.name}" redirect URIs`);
  } else {
    console.log(`app: "${app.name}" (client ${current.clientId}) up to date`);
  }
  return current.clientId;
}

async function ensureUser(token, orgId, spec) {
  const found = await call(token, "POST", "/v2/users", {
    queries: [{ userNameQuery: { userName: spec.userName, method: "TEXT_QUERY_METHOD_EQUALS" } }],
  });
  const existing = (found.result || [])[0];
  if (existing) {
    // Reset so the documented password always works, even after a manual change.
    await call(token, "POST", `/v2/users/${existing.userId}/password`, { newPassword: { password: PASSWORD, changeRequired: false } });
    console.log(`user: ${spec.userName} (${existing.userId}) exists, password reset`);
    return existing.userId;
  }
  const created = await call(token, "POST", "/v2/users/human", {
    username: spec.userName,
    organization: { orgId },
    profile: { givenName: spec.givenName, familyName: "Dev" },
    email: { email: `${spec.userName}@example.test`, isVerified: true },
    password: { password: PASSWORD, changeRequired: false },
  });
  console.log(`user: created ${spec.userName} (${created.userId})`);
  return created.userId;
}

async function ensureGrant(token, userId, projectId, spec) {
  const found = await call(token, "POST", "/management/v1/users/grants/_search", {
    queries: [{ userIdQuery: { userId } }, { projectIdQuery: { projectId } }],
  });
  const grants = found.result || [];
  if (spec.grant && grants.length === 0) {
    await call(token, "POST", `/management/v1/users/${userId}/grants`, { projectId, roleKeys: [ROLE] });
    console.log(`grant: ${spec.userName} -> ${PROJECT}:${ROLE}`);
  }
  if (!spec.grant) {
    for (const grant of grants) {
      await call(token, "DELETE", `/management/v1/users/${userId}/grants/${grant.id}`);
      console.log(`grant: removed ${spec.userName} -> ${PROJECT} so the no-access case stays reproducible`);
    }
  }
}

// Keeps the secret from the previous run when it is still the enrolled one, so authenticator apps keep working.
async function ensureTotp(token, userId, previousSecret) {
  const methods = await call(token, "GET", `/v2/users/${userId}/authentication_methods`);
  const enrolled = (methods.authMethodTypes || []).includes("AUTHENTICATION_METHOD_TYPE_TOTP");
  if (enrolled && previousSecret) {
    console.log("totp: alice already enrolled, keeping secret from seed.out.env");
    return previousSecret;
  }
  if (enrolled) {
    await call(token, "DELETE", `/v2/users/${userId}/totp`);
    console.log("totp: alice enrolled with an unknown secret, re-enrolling");
  }
  const registration = await call(token, "POST", `/v2/users/${userId}/totp`, {});
  await call(token, "POST", `/v2/users/${userId}/totp/verify`, { code: totp(registration.secret) });
  console.log("totp: alice enrolled");
  return registration.secret;
}

async function ensureDefaultRedirect(token) {
  const orgPolicy = await call(token, "GET", "/management/v1/policies/login");
  if (!orgPolicy.isDefault) throw new Error("the org has its own login policy, so the instance defaultRedirectUri would not apply; reset it in the Console first");
  const { policy } = await call(token, "GET", "/admin/v1/policies/login");
  if (policy.defaultRedirectUri === HUB_URL) {
    console.log(`login settings: defaultRedirectUri already ${HUB_URL}`);
    return;
  }
  const fields = [
    "allowUsernamePassword", "allowRegister", "allowExternalIdp", "forceMfa", "passwordlessType", "hidePasswordReset",
    "ignoreUnknownUsernames", "passwordCheckLifetime", "externalLoginCheckLifetime", "mfaInitSkipLifetime",
    "secondFactorCheckLifetime", "multiFactorCheckLifetime", "allowDomainDiscovery", "disableLoginWithEmail",
    "disableLoginWithPhone", "forceMfaLocalOnly",
  ];
  const update = Object.fromEntries(fields.filter((f) => policy[f] !== undefined).map((f) => [f, policy[f]]));
  await call(token, "PUT", "/admin/v1/policies/login", { ...update, defaultRedirectUri: HUB_URL });
  console.log(`login settings: defaultRedirectUri set to ${HUB_URL}`);
}

const BRANDING_FIELDS = [
  "primaryColor", "hideLoginNameSuffix", "warnColor", "backgroundColor", "fontColor", "primaryColorDark",
  "backgroundColorDark", "warnColorDark", "fontColorDark", "disableWatermark",
];
const BRANDING_ASSETS = ["logoUrl", "iconUrl", "logoUrlDark", "iconUrlDark", "fontUrl"];

// Theme mode AUTO lets the login follow the system theme and keeps the theme toggle; LIGHT or DARK force one.
// apiPrefix is /admin/v1 for the instance default or /management/v1 for the org's own branding.
async function ensureThemeModeAuto(token, apiPrefix, label) {
  const { policy: active } = await call(token, "GET", `${apiPrefix}/policies/label`);
  if (active.themeMode === "THEME_MODE_AUTO") {
    console.log(`branding (${label}): theme mode already AUTO`);
    return;
  }
  // Activation publishes the whole preview, so refuse when it holds other unpublished branding changes.
  const { policy: preview } = await call(token, "GET", `${apiPrefix}/policies/label/_preview`);
  const pending = [...BRANDING_FIELDS, ...BRANDING_ASSETS].filter((f) => (preview[f] ?? "") !== (active[f] ?? ""));
  if (pending.length) throw new Error(`the ${label} branding preview has unpublished changes (${pending.join(", ")}); activate or revert them in the Console first`);
  if (preview.themeMode !== "THEME_MODE_AUTO") {
    const update = Object.fromEntries(BRANDING_FIELDS.filter((f) => active[f] !== undefined).map((f) => [f, active[f]]));
    await call(token, "PUT", `${apiPrefix}/policies/label`, { ...update, themeMode: "THEME_MODE_AUTO" });
  }
  await call(token, "POST", `${apiPrefix}/policies/label/_activate`, {});
  console.log(`branding (${label}): theme mode set from ${active.themeMode || "unspecified"} to AUTO`);
}

// The login uses the org's own branding when it has one, so both levels are set.
async function ensureBrandingThemeMode(token) {
  await ensureThemeModeAuto(token, "/admin/v1", "instance");
  const { policy: orgPolicy } = await call(token, "GET", "/management/v1/policies/label");
  if (!orgPolicy.isDefault) await ensureThemeModeAuto(token, "/management/v1", "org");
}

function readPrevious(name) {
  if (!fs.existsSync(OUT)) return undefined;
  const line = fs.readFileSync(OUT, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).replace(/^'|'$/g, "") : undefined;
}

async function main() {
  const admin = await adminToken();
  try {
    const { org } = await call(admin.token, "GET", "/management/v1/orgs/me");
    const projectId = await ensureProject(admin.token);
    const clientIds = {};
    for (const app of APPS) clientIds[app.slug] = await ensureApp(admin.token, projectId, app);

    let totpSecret;
    for (const spec of USERS) {
      const userId = await ensureUser(admin.token, org.id, spec);
      await ensureGrant(admin.token, userId, projectId, spec);
      if (spec.totp) totpSecret = await ensureTotp(admin.token, userId, readPrevious("ALICE_TOTP_SECRET"));
    }
    await ensureDefaultRedirect(admin.token);
    await ensureBrandingThemeMode(admin.token);

    // Only product apps are mapped; the hub has no product.
    const productClients = Object.fromEntries(APPS.filter((app) => app.product).map((app) => [clientIds[app.slug], app.product]));
    const lines = [
      "# Generated by ./login.sh seed; local dev only.",
      `DIGISAT_PRODUCT_CLIENTS='${JSON.stringify(productClients)}'`,
      ...APPS.map((app) => `${app.slug.toUpperCase().replace(/-/g, "_")}_CLIENT_ID=${clientIds[app.slug]}`),
      `ALICE_TOTP_SECRET=${totpSecret}`,
    ];
    fs.writeFileSync(OUT, lines.join("\n") + "\n", { mode: 0o600 });
    console.log(`\nwrote ${OUT}`);
    console.log(lines.slice(1).join("\n"));
    console.log(`\nusers: ${USERS.map((u) => u.userName).join(", ")} / password ${PASSWORD}`);
    console.log(`alice TOTP: otpauth://totp/ZITADEL:alice?secret=${totpSecret}&issuer=ZITADEL  (code now: ${totp(totpSecret)})`);
  } finally {
    await admin.end();
  }
}

main().catch((err) => {
  console.error(`seed failed: ${err.message}`);
  process.exit(1);
});
