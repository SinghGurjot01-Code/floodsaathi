// SOS module for FloodSaathi (PRD Section 8.7)
import { getContacts, addContact, deleteContact } from "./store.js";

/**
 * Get battery level percentage if Battery Status API is supported.
 * @returns {Promise<number|null>}
 */
export async function getBatteryLevel() {
  if (typeof navigator !== "undefined" && "getBattery" in navigator) {
    try {
      const battery = await navigator.getBattery();
      return Math.round(battery.level * 100);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Build emergency SMS URI for contacts.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.contacts Array of { id, name, phone }
 * @param {number} params.lat User latitude
 * @param {number} params.lon User longitude
 * @param {number|null} [params.accuracy] Location accuracy in metres
 * @param {string} params.status Current status ("Safe", "Watch", "Warning", "Danger")
 * @param {string} params.statusAge Text age of status update
 * @returns {Promise<string>} sms: URI
 */
export async function buildSosSmsUri({
  contacts = [],
  lat = 31.634,
  lon = 74.872,
  accuracy = null,
  status = "Unknown",
  statusAge = "recently"
}) {
  const battery = await getBatteryLevel();

  let body = `SOS from FloodSaathi. Location: ${lat.toFixed(5)},${lon.toFixed(5)}`;
  if (accuracy !== null) {
    body += ` (accuracy ${Math.round(accuracy)} m)`;
  }
  body += `. Map: https://maps.google.com/?q=${lat.toFixed(5)},${lon.toFixed(5)}.`;
  if (battery !== null) {
    body += ` Battery: ${battery}%.`;
  }
  body += ` Status: ${status} (updated ${statusAge} ago).`;

  const phoneNumbers = contacts.map(c => c.phone.trim().replace(/[^0-9+]/g, "")).filter(Boolean);
  const recipients = phoneNumbers.join(",");

  // On iOS sms:recipient&body=text, on Android sms:recipient?body=text
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? "&" : "?";

  return `sms:${recipients}${separator}body=${encodeURIComponent(body)}`;
}
