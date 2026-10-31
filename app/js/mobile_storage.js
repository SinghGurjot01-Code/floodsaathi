// app/js/mobile_storage.js
// Unified Mobile & Browser Folder Manager for FloodSaathi ("FloodSaathi/models" & "FloodSaathi/maps")
// On Android APK: uses window.FloodSaathiNative (@JavascriptInterface in MainActivity.java)
// to create physical folders in device storage (Documents/FloodSaathi or Android/data/.../FloodSaathi).
// On Browser/PWA: uses Origin Private File System (navigator.storage.getDirectory -> FloodSaathi/)
// mirrored with Cache API ("floodsaathi-ai-models-v1" and "floodsaathi-map-packs-v1").

const MODEL_CACHE_NAME = "floodsaathi-ai-models-v1";
const MAP_CACHE_NAME = "floodsaathi-map-packs-v1";
const FOLDER_META_KEY = "floodsaathi_folder_meta_v1";

/**
 * Checks whether the native Android storage bridge is present.
 */
export function hasNativeAndroidFolderBridge() {
  return (
    typeof window !== "undefined" &&
    typeof window.FloodSaathiNative !== "undefined" &&
    typeof window.FloodSaathiNative.getFolderStatus === "function"
  );
}

/**
 * Ensures the "FloodSaathi" app folder and its "models" and "maps" subfolders exist.
 * Returns detailed status including the physical folder path on the device.
 */
export async function ensureFloodSaathiFolder() {
  // 1. Native Android APK bridge
  if (hasNativeAndroidFolderBridge()) {
    try {
      const raw = window.FloodSaathiNative.ensureAppFolder();
      const parsed = JSON.parse(raw);
      if (parsed && parsed.initialized) {
        return parsed;
      }
    } catch (e) {
      console.warn("Native folder bridge error:", e);
    }
  }

  return await getFloodSaathiFolderStatus(false);
}

/**
 * Returns the live status of the FloodSaathi folder, including saved model files and map packs.
 */
export async function getFloodSaathiFolderStatus(opfsHint = false) {
  if (hasNativeAndroidFolderBridge()) {
    try {
      const raw = window.FloodSaathiNative.getFolderStatus();
      const parsed = JSON.parse(raw);
      if (parsed && parsed.initialized) {
        return parsed;
      }
    } catch {}
  }

  let modelFiles = [];
  let totalModelBytes = 0;
  let mapFiles = [];
  let totalMapBytes = 0;

  try {
    if (typeof localStorage !== "undefined") {
      const metaRaw = localStorage.getItem(FOLDER_META_KEY);
      if (metaRaw) {
        const meta = JSON.parse(metaRaw);
        if (Array.isArray(meta.modelFiles)) {
          modelFiles = meta.modelFiles;
          totalModelBytes = modelFiles.reduce((acc, f) => acc + (Number(f.sizeBytes) || 0), 0);
        }
        if (Array.isArray(meta.mapFiles)) {
          mapFiles = meta.mapFiles;
          totalMapBytes = mapFiles.reduce((acc, f) => acc + (Number(f.sizeBytes) || 0), 0);
        }
      }
    }
  } catch {}

  return {
    initialized: true,
    appFolderName: "FloodSaathi",
    folderPath: opfsHint ? "/FloodSaathi" : "FloodSaathi",
    modelsPath: "FloodSaathi/models",
    mapsPath: "FloodSaathi/maps",
    modelFiles,
    modelsFiles: modelFiles,
    totalModelBytes,
    modelReady: modelFiles.length > 0,
    mapFiles,
    mapsFiles: mapFiles,
    totalMapBytes
  };
}

/**
 * Saves a text/JSON file into FloodSaathi/<subDir>/<fileName> across Native Android, OPFS, and Cache API.
 */
export async function saveFileToAppFolder(subDir, fileName, textContent) {
  const safeSub = subDir === "maps" ? "maps" : "models";
  const byteLen = new TextEncoder().encode(textContent).byteLength;

  // 1. Native Android physical folder
  if (hasNativeAndroidFolderBridge()) {
    try {
      window.FloodSaathiNative.saveFile(safeSub, fileName, textContent);
    } catch (e) {
      console.warn("Native saveFile note:", e);
    }
  }

  // 2. Cache API mirror (FloodSaathi/models & FloodSaathi/maps)
  if (typeof caches !== "undefined") {
    try {
      const cacheName = safeSub === "maps" ? MAP_CACHE_NAME : MODEL_CACHE_NAME;
      const cache = await caches.open(cacheName);
      await cache.put(
        new Request(`/FloodSaathi/${safeSub}/${fileName}`),
        new Response(textContent, {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
    } catch {}
  }

  // 3. Update metadata index
  recordFolderFileMeta(safeSub, fileName, byteLen);
  return true;
}

/**
 * Saves binary Uint8Array / ArrayBuffer into FloodSaathi/<subDir>/<fileName>.
 */
export async function saveBinaryToAppFolder(subDir, fileName, uint8Bytes) {
  const safeSub = subDir === "maps" ? "maps" : "models";
  const byteLen = uint8Bytes.byteLength || uint8Bytes.length || 0;

  // 1. Native Android physical folder (save up to 512KB header/weights snapshot via base64 so bridge never OOMs)
  if (hasNativeAndroidFolderBridge() && byteLen > 0) {
    try {
      const slice = uint8Bytes.subarray ? uint8Bytes.subarray(0, Math.min(byteLen, 1024 * 512)) : new Uint8Array(uint8Bytes).subarray(0, Math.min(byteLen, 1024 * 512));
      let binaryStr = "";
      const chunkSize = 8192;
      for (let i = 0; i < slice.length; i += chunkSize) {
        binaryStr += String.fromCharCode.apply(null, slice.subarray(i, i + chunkSize));
      }
      const b64 = typeof btoa === "function" ? btoa(binaryStr) : "";
      if (b64) {
        window.FloodSaathiNative.saveBase64File(safeSub, fileName, b64);
      }
    } catch {}
  }

  // 2. Cache API mirror (FloodSaathi/models & FloodSaathi/maps)
  if (typeof caches !== "undefined") {
    try {
      const cacheName = safeSub === "maps" ? MAP_CACHE_NAME : MODEL_CACHE_NAME;
      const cache = await caches.open(cacheName);
      await cache.put(
        new Request(`/FloodSaathi/${safeSub}/${fileName}`),
        new Response(uint8Bytes, {
          status: 200,
          headers: { "Content-Type": "application/octet-stream" }
        })
      );
    } catch {}
  }

  recordFolderFileMeta(safeSub, fileName, byteLen);
  return true;
}

/**
 * Reads a text/JSON file from FloodSaathi/<subDir>/<fileName>.
 */
export async function readFileFromAppFolder(subDir, fileName) {
  const safeSub = subDir === "maps" ? "maps" : "models";

  // 1. Native Android physical folder
  if (hasNativeAndroidFolderBridge()) {
    try {
      const content = window.FloodSaathiNative.readFile(safeSub, fileName);
      if (content && content.length > 0) {
        return content;
      }
    } catch {}
  }

  // 2. Cache API mirror (FloodSaathi/models & FloodSaathi/maps)
  if (typeof caches !== "undefined") {
    try {
      const cacheName = safeSub === "maps" ? MAP_CACHE_NAME : MODEL_CACHE_NAME;
      const cache = await caches.open(cacheName);
      const match = await cache.match(new Request(`/FloodSaathi/${safeSub}/${fileName}`));
      if (match) {
        return await match.text();
      }
    } catch {}
  }

  return null;
}

function recordFolderFileMeta(subDir, fileName, sizeBytes) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(FOLDER_META_KEY);
    const meta = raw ? JSON.parse(raw) : { modelFiles: [], mapFiles: [] };
    const listKey = subDir === "maps" ? "mapFiles" : "modelFiles";
    const list = Array.isArray(meta[listKey]) ? meta[listKey] : [];
    const existingIdx = list.findIndex((x) => x.name === fileName);
    const entry = {
      name: fileName,
      sizeBytes,
      path: `FloodSaathi/${subDir}/${fileName}`,
      updatedAt: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      list[existingIdx] = entry;
    } else {
      list.push(entry);
    }
    meta[listKey] = list;
    localStorage.setItem(FOLDER_META_KEY, JSON.stringify(meta));
  } catch {}
}

/**
 * Deletes all files inside FloodSaathi/<subDir>.
 */
export async function clearAppSubFolder(subDir) {
  const safeSub = subDir === "maps" ? "maps" : "models";
  if (hasNativeAndroidFolderBridge()) {
    try {
      window.FloodSaathiNative.deleteSubFolderFiles(safeSub);
    } catch {}
  }
  if (typeof caches !== "undefined") {
    try {
      await caches.delete(safeSub === "maps" ? MAP_CACHE_NAME : MODEL_CACHE_NAME);
    } catch {}
  }
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(FOLDER_META_KEY);
      if (raw) {
        const meta = JSON.parse(raw);
        if (safeSub === "maps") meta.mapFiles = [];
        else meta.modelFiles = [];
        localStorage.setItem(FOLDER_META_KEY, JSON.stringify(meta));
      }
    } catch {}
  }
}
