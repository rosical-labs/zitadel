// Local same-origin test proxy: /ui/v2/login/* -> our build on 3100, everything else -> Traefik on 8082.
// The Host header is kept (localhost:3200) so ZITADEL resolves the instance and builds URLs for this origin.
const http = require("http");
const PORT = Number(process.env.PROXY_PORT || 3200);
const LOGIN = { host: "127.0.0.1", port: 3100 };
const STACK = { host: "127.0.0.1", port: 8082 };

function targetFor(url) {
  return url === "/ui/v2/login" || url.startsWith("/ui/v2/login/") || url.startsWith("/ui/v2/login?") ? LOGIN : STACK;
}

const server = http.createServer((req, res) => {
  const target = targetFor(req.url);
  const headers = { ...req.headers, "x-forwarded-proto": "http", "x-forwarded-host": req.headers.host };
  const upstream = http.request({ ...target, method: req.method, path: req.url, headers }, (up) => {
    res.writeHead(up.statusCode, up.rawHeaders.length ? rawToObj(up.rawHeaders) : up.headers);
    up.pipe(res);
  });
  upstream.on("error", (err) => {
    console.error(`upstream ${target.port} ${req.method} ${req.url}: ${err.message}`);
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end(`proxy: upstream ${target.host}:${target.port} failed: ${err.message}\n`);
  });
  req.pipe(upstream);
  console.log(`${new Date().toISOString()} ${target.port} ${req.method} ${req.url.slice(0, 160)}`);
});

// Keeps repeated headers such as set-cookie intact.
function rawToObj(raw) {
  const out = {};
  for (let i = 0; i < raw.length; i += 2) {
    const k = raw[i].toLowerCase();
    if (out[k] === undefined) out[k] = raw[i + 1];
    else out[k] = [].concat(out[k], raw[i + 1]);
  }
  return out;
}

server.listen(PORT, "127.0.0.1", () => console.log(`proxy on http://localhost:${PORT}`));
