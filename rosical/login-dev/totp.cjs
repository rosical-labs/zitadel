// RFC 6238 TOTP (SHA-1, 6 digits, 30 s), the defaults ZITADEL uses for its authenticator app factor.
// Usage: node totp.cjs <base32 secret>
const crypto = require("crypto");

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input) {
  const clean = input.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const value = BASE32.indexOf(char);
    if (value < 0) throw new Error(`invalid base32 character "${char}" in TOTP secret`);
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totp(secret, now = Date.now()) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / 30)));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
}

module.exports = { totp };

if (require.main === module) {
  const secret = process.argv[2];
  if (!secret) {
    console.error("usage: node totp.cjs <base32 secret>");
    process.exit(1);
  }
  console.log(totp(secret));
}
