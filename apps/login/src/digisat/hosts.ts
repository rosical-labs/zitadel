// Instance hosts that get the digisat look; every other host gets the instance's own branding.

// Lowercase, without surrounding whitespace and without a trailing `:port`.
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

/**
 * Parses DIGISAT_HOSTS, comma-separated hostnames such as `auth.digisat.cloud,digisat-abc.iam.svc.rosical.dev`.
 * Unset or blank means no host is digisat. A scheme, a path, inner whitespace or an empty item throws, so a broken
 * config is visible.
 */
export function parseDigisatHosts(raw: string | undefined): ReadonlySet<string> {
  if (!raw || raw.trim() === "") {
    return new Set();
  }

  const hosts = new Set<string>();
  for (const item of raw.split(",")) {
    const entry = item.trim();
    if (entry === "") {
      throw new Error(`DIGISAT_HOSTS has an empty entry; expected comma-separated hostnames, got: ${raw}`);
    }
    if (entry.includes("://") || entry.includes("/")) {
      throw new Error(`DIGISAT_HOSTS entry "${entry}" must be a bare hostname, without scheme or path`);
    }
    if (/\s/.test(entry)) {
      throw new Error(`DIGISAT_HOSTS entry "${entry}" contains whitespace`);
    }
    hosts.add(normalizeHost(entry));
  }
  return hosts;
}

let memo: { raw: string | undefined; hosts: ReadonlySet<string> } | undefined;

// DIGISAT_HOSTS parsed once; re-parsed only if the env value changes (tests).
export function getDigisatHosts(): ReadonlySet<string> {
  const raw = process.env.DIGISAT_HOSTS;
  if (!memo || memo.raw !== raw) {
    memo = { raw, hosts: parseDigisatHosts(raw) };
  }
  return memo.hosts;
}

// The instance host (serviceConfig.instanceHost) decides the look; an unknown host is never digisat.
export function isDigisatHost(host: string | undefined): boolean {
  if (!host) {
    return false;
  }
  return getDigisatHosts().has(normalizeHost(host));
}
