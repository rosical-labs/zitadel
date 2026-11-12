// The relying parties served by rp.cjs and registered by seed.cjs, one port each.
const APPS = [
  { slug: "endpoint-control", name: "endpoint control", origin: "http://localhost:4001", product: "endpoint-control" },
  { slug: "hub", name: "hub", origin: "http://localhost:4002", product: null },
];

module.exports = { APPS };
