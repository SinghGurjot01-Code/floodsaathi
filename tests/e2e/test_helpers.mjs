// tests/e2e/test_helpers.mjs
// Opaque-Box E2E Testing Helpers for FloodSaathi
// Zero external dependencies, pure ES modules compatible with Node 20+

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../..");

/**
 * Load and cache app/index.html
 */
let cachedHtml = null;
export function getAppHtml() {
  if (!cachedHtml) {
    const htmlPath = path.join(PROJECT_ROOT, "app", "index.html");
    cachedHtml = fs.readFileSync(htmlPath, "utf-8");
  }
  return cachedHtml;
}

/**
 * Load CSS files
 */
export function getAppCss() {
  const mainCssPath = path.join(PROJECT_ROOT, "app", "css", "main.css");
  const statusCssPath = path.join(PROJECT_ROOT, "app", "css", "status.css");
  return {
    main: fs.readFileSync(mainCssPath, "utf-8"),
    status: fs.readFileSync(statusCssPath, "utf-8")
  };
}

/**
 * Simple HTML Element Matcher for Opaque-Box DOM Inspection
 */
export class HtmlInspector {
  constructor(htmlContent = getAppHtml()) {
    this.html = htmlContent;
  }

  hasElementWithId(id) {
    const regex = new RegExp(`id=["']${id}["']`, "i");
    return regex.test(this.html);
  }

  hasElementWithClass(className) {
    const regex = new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["']`, "i");
    return regex.test(this.html);
  }

  hasElementWithAttr(attr, value = null) {
    if (value === null) {
      const regex = new RegExp(`\\s${attr}(?:=["'][^"']*["'])?`, "i");
      return regex.test(this.html);
    }
    const regex = new RegExp(`\\s${attr}=["']${value}["']`, "i");
    return regex.test(this.html);
  }

  extractElements(tagName) {
    const regex = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "gi");
    const matches = [];
    let match;
    while ((match = regex.exec(this.html)) !== null) {
      matches.push({
        full: match[0],
        attrs: match[1],
        content: match[2]
      });
    }
    return matches;
  }

  findElementById(id) {
    const regex = new RegExp(`<([a-zA-Z0-9]+)[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/\\1>`, "i");
    const match = this.html.match(regex);
    if (!match) return null;
    return {
      tagName: match[1],
      full: match[0],
      content: match[2]
    };
  }

  extractAttribute(rawAttrs, attrName) {
    const regex = new RegExp(`${attrName}=["']([^"']*)["']`, "i");
    const match = rawAttrs.match(regex);
    return match ? match[1] : null;
  }
}

/**
 * Setup a lightweight, robust Mock Browser Environment for Pure Module Testing
 */
export function setupMockBrowserEnv() {
  const store = new Map();
  const cacheStorage = new Map();

  const localStorageMock = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i) => Array.from(store.keys())[i] || null
  };

  class MockResponse {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = init.headers || {};
    }
    async json() {
      return typeof this._body === "string" ? JSON.parse(this._body) : this._body;
    }
    async text() {
      return typeof this._body === "string" ? this._body : JSON.stringify(this._body);
    }
  }

  const mockCaches = {
    open: async (cacheName) => {
      if (!cacheStorage.has(cacheName)) {
        cacheStorage.set(cacheName, new Map());
      }
      const cacheMap = cacheStorage.get(cacheName);
      return {
        put: async (request, response) => {
          const key = typeof request === "string" ? request : request.url;
          cacheMap.set(key, response);
        },
        match: async (request) => {
          const key = typeof request === "string" ? request : request.url;
          return cacheMap.get(key) || null;
        },
        delete: async (request) => {
          const key = typeof request === "string" ? request : request.url;
          return cacheMap.delete(key);
        },
        keys: async () => Array.from(cacheMap.keys()).map((k) => ({ url: k }))
      };
    },
    has: async (cacheName) => cacheStorage.has(cacheName),
    delete: async (cacheName) => cacheStorage.delete(cacheName)
  };

  // Attach to globalThis safely
  if (typeof globalThis.localStorage === "undefined") {
    globalThis.localStorage = localStorageMock;
  }
  if (typeof globalThis.Response === "undefined") {
    globalThis.Response = MockResponse;
  }
  if (typeof globalThis.caches === "undefined") {
    globalThis.caches = mockCaches;
  }
  if (typeof globalThis.navigator === "undefined") {
    globalThis.navigator = {
      onLine: true,
      storage: {
        estimate: async () => ({ quota: 1024 * 1024 * 1024, usage: 10 * 1024 * 1024 })
      },
      languages: ["en-US", "en"],
      language: "en"
    };
  }

  return {
    store,
    cacheStorage,
    cleanup: () => {
      store.clear();
      cacheStorage.clear();
    }
  };
}

/**
 * Haversine formula calculation for distance between coordinates (km)
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Determine hydrologic orientation relative to river flow
 */
export function determineOrientation(userLat, userLon, gaugeLat, gaugeLon) {
  // Northern rivers in Punjab (Beas, Sutlej, Ravi) generally flow North-East to South-West
  if (userLat < gaugeLat) {
    return "downstream";
  } else if (userLat > gaugeLat) {
    return "upstream";
  }
  return "vicinity";
}

/**
 * Load authoritative JSON files
 */
export function loadAuthoritativeJson(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}

/**
 * Load JSONL dataset
 */
export function loadJsonl(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  const content = fs.readFileSync(fullPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
}

/**
 * Execute command and return stdout/code
 */
export function runCmd(cmd, options = {}) {
  try {
    const stdout = execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      ...options
    });
    return { ok: true, stdout, exitCode: 0 };
  } catch (err) {
    return {
      ok: false,
      stdout: err.stdout ? err.stdout.toString() : "",
      stderr: err.stderr ? err.stderr.toString() : err.message,
      exitCode: err.status || 1
    };
  }
}
