// IndexedDB wrapper for FloodSaathi offline snapshot & data storage
// Follows PRD Section 7.2 storage retention and local privacy rules.

const DB_NAME = "floodsaathi_db";
const DB_VERSION = 1;

let dbInstance = null;

export async function openDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("snapshots")) {
        const snapStore = db.createObjectStore("snapshots", { keyPath: "id" });
        snapStore.createIndex("saved_at", "saved_at", { unique: false });
      }
      if (!db.objectStoreNames.contains("contacts")) {
        db.createObjectStore("contacts", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("observations")) {
        const obsStore = db.createObjectStore("observations", { keyPath: "id", autoIncrement: true });
        obsStore.createIndex("at", "at", { unique: false });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("estimate_log")) {
        db.createObjectStore("estimate_log", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// --- Snapshots ---

export async function saveSnapshot(snapshot) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["snapshots"], "readwrite");
    const store = tx.objectStore("snapshots");
    // Save as 'latest'
    store.put({ id: "latest", ...snapshot });
    // Also save timestamped version for retention history
    store.put({ id: snapshot.saved_at, ...snapshot });

    tx.oncomplete = () => {
      pruneOldSnapshots().catch(() => {});
      resolve(true);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLatestSnapshot() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["snapshots"], "readonly");
    const store = tx.objectStore("snapshots");
    const req = store.get("latest");
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllSnapshots() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["snapshots"], "readonly");
    const store = tx.objectStore("snapshots");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retention policy (PRD 7.2):
 * Keep all snapshots for 48 hours. Keep hourly snapshots for 14 days. Delete older.
 */
export async function pruneOldSnapshots() {
  const db = await openDB();
  const all = await getAllSnapshots();
  const now = Date.now();
  const fortyEightHoursMs = 48 * 3600 * 1000;
  const fourteenDaysMs = 14 * 24 * 3600 * 1000;

  const toDelete = [];
  const hourlyBuckets = new Set();

  for (const item of all) {
    if (item.id === "latest") continue;
    const itemTime = new Date(item.saved_at).getTime();
    const age = now - itemTime;

    if (age > fourteenDaysMs) {
      toDelete.push(item.id);
    } else if (age > fortyEightHoursMs) {
      // Retain only 1 per hour bucket (e.g. "2026-08-25T14")
      const bucket = item.saved_at.substring(0, 13);
      if (hourlyBuckets.has(bucket)) {
        toDelete.push(item.id);
      } else {
        hourlyBuckets.add(bucket);
      }
    }
  }

  if (toDelete.length > 0) {
    const tx = db.transaction(["snapshots"], "readwrite");
    const store = tx.objectStore("snapshots");
    for (const id of toDelete) {
      store.delete(id);
    }
  }
}

// --- Settings ---

export async function getSetting(key, defaultValue = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["settings"], "readonly");
    const store = tx.objectStore("settings");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : defaultValue);
    req.onerror = () => reject(req.error);
  });
}

export async function setSetting(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["settings"], "readwrite");
    const store = tx.objectStore("settings");
    store.put({ key, value });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// --- Emergency Contacts (SOS) ---

export async function getContacts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["contacts"], "readonly");
    const store = tx.objectStore("contacts");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function addContact(contact) {
  const existing = await getContacts();
  if (existing.length >= 5) {
    throw new Error("Maximum 5 emergency contacts allowed.");
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["contacts"], "readwrite");
    const store = tx.objectStore("contacts");
    store.add(contact);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteContact(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["contacts"], "readwrite");
    const store = tx.objectStore("contacts");
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// --- User Observations (Water reached / receding) ---

export async function addObservation(type) {
  const obs = {
    type,
    at: new Date().toISOString()
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["observations"], "readwrite");
    const store = tx.objectStore("observations");
    store.add(obs);
    tx.oncomplete = () => resolve(obs);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getObservations() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["observations"], "readonly");
    const store = tx.objectStore("observations");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
