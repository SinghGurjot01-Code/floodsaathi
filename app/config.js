// FloodSaathi configuration
export const CONFIG = {
  VERSION: "1.0.0",
  DEFAULT_REGION: "punjab",
  DATA_BASE_URL: (typeof window !== "undefined" && window.location.hostname === "localhost") 
    ? "./data" 
    : "./data",
  CADENCE_MS: {
    SAFE: 60 * 60 * 1000,
    WATCH: 30 * 60 * 1000,
    WARNING: 15 * 60 * 1000,
    DANGER: 15 * 60 * 1000,
    ACTIVE_INTERVAL: 5 * 60 * 1000
  },
  HELPLINES: [
    { number: "112", name: "National Emergency", scope: "national", verified: true, last_verified: "2026-10-30" },
    { number: "1078", name: "NDMA Disaster Helpline", scope: "national", verified: true, last_verified: "2026-10-30" },
    { number: "1070", name: "Punjab State Emergency Control Room", scope: "state", state: "Punjab", verified: true, last_verified: "2026-10-30" },
    { number: "1077", name: "District Disaster Control Room", scope: "district", state: "Punjab", verified: true, last_verified: "2026-10-30" }
  ],
  STATUS_RANKS: {
    Safe: 0,
    Watch: 1,
    Warning: 2,
    Danger: 3
  }
};
