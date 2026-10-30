// app/js/shelters.js
// Feature F5: Evacuation Advisor & Shelter Directory
// Pure ES module: runs offline, NO framework.

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
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
  return R * c;
}

export async function fetchShelters(userLat = 31.634, userLon = 74.872) {
  try {
    const res = await fetch("./corpus/shelters_punjab.json");
    if (!res.ok) throw new Error("Failed to load shelters JSON");
    const data = await res.json();
    const rawShelters = data.shelters || [];

    const enriched = rawShelters.map((s) => {
      const dist = haversineDistanceKm(userLat, userLon, s.lat, s.lon);
      return {
        ...s,
        distanceKm: Math.round(dist * 10) / 10,
        distanceFormatted: dist < 1.0 ? `${Math.round(dist * 1000)} m` : `${Math.round(dist * 10) / 10} km`
      };
    });

    enriched.sort((a, b) => a.distanceKm - b.distanceKm);
    return enriched;
  } catch (err) {
    console.warn("Could not load shelters from local file, using fallback cache:", err);
    return [];
  }
}

export function formatAmenities(amenityKeys = [], lang = "en") {
  const dictionary = {
    drinking_water: { en: "Drinking Water", hi: "पीने का पानी", pa: "ਪੀਣ ਵਾਲਾ ਪਾਣੀ" },
    medical_kit: { en: "First Aid", hi: "प्राथमिक चिकित्सा", pa: "ਮੁੱਢਲੀ ਸਹਾਇਤਾ" },
    doctor_on_site: { en: "Doctor Available", hi: "डॉक्टर उपलब्ध", pa: "ਡਾਕਟਰ ਉਪਲਬਧ" },
    power_backup: { en: "Generator Power", hi: "बिजली बैकअप", pa: "ਜਨਰੇਟਰ ਬੈਕਅੱਪ" },
    separate_toilets: { en: "Toilets", hi: "शौचालय", pa: "ਸ਼ੌਚਾਲਿਆ" },
    kitchen: { en: "Community Kitchen", hi: "रसोई", pa: "ਲੰਗਰ / ਰਸੋਈ" },
    food_ration: { en: "Food Supplies", hi: "राशन", pa: "ਰਾਸ਼ਨ" },
    blankets: { en: "Blankets", hi: "कंबल", pa: "ਕੰਬਲ" },
    emergency_ward: { en: "Emergency Ward", hi: "आपातकालीन वार्ड", pa: "ਐਮਰਜੈਂਸੀ ਵਾਰਡ" },
    ambulance: { en: "Ambulance on Site", hi: "एंबुलेंस", pa: "ਐਂਬੂਲੈਂਸ" },
    ndrf_station: { en: "NDRF / SDRF Post", hi: "राहत दल", pa: "ਰਾਹਤ ਟੀਮ" }
  };

  return amenityKeys.map((key) => {
    const item = dictionary[key];
    return item ? (item[lang] || item.en) : key;
  });
}
