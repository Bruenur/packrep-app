import type { PinCategory } from "../data/demoMapPins";

export type NearbyPin = {
  id: string;
  title: string;
  subtitle?: string;
  category: PinCategory;
  latitude: number;
  longitude: number;
  distanceMiles?: number;
};

const CATEGORY_CONFIG: Record<Exclude<PinCategory, "favorite">, { query: string[]; radiusMeters: number; limit: number }> = {
  hospital: {
    query: ['node(around:R,LAT,LON)[amenity=hospital];', 'way(around:R,LAT,LON)[amenity=hospital];'],
    radiusMeters: 12000,
    limit: 3,
  },
  police: {
    query: ['node(around:R,LAT,LON)[amenity=police];', 'way(around:R,LAT,LON)[amenity=police];'],
    radiusMeters: 12000,
    limit: 3,
  },
  fire: {
    query: ['node(around:R,LAT,LON)[amenity=fire_station];', 'way(around:R,LAT,LON)[amenity=fire_station];'],
    radiusMeters: 12000,
    limit: 3,
  },
  pharmacy: {
    query: ['node(around:R,LAT,LON)[amenity=pharmacy];', 'way(around:R,LAT,LON)[amenity=pharmacy];'],
    radiusMeters: 10000,
    limit: 4,
  },
  grocery: {
    query: ['node(around:R,LAT,LON)[shop=supermarket];', 'way(around:R,LAT,LON)[shop=supermarket];'],
    radiusMeters: 10000,
    limit: 4,
  },
  school: {
    query: ['node(around:R,LAT,LON)[amenity=school];', 'way(around:R,LAT,LON)[amenity=school];'],
    radiusMeters: 15000,
    limit: 6,
  },
  park: {
    query: ['node(around:R,LAT,LON)[leisure=park];', 'way(around:R,LAT,LON)[leisure=park];'],
    radiusMeters: 10000,
    limit: 4,
  },
  postal: {
    query: ['node(around:R,LAT,LON)[amenity=post_office];', 'way(around:R,LAT,LON)[amenity=post_office];'],
    radiusMeters: 12000,
    limit: 3,
  },
  coffee: {
    query: ['node(around:R,LAT,LON)[amenity=cafe];', 'way(around:R,LAT,LON)[amenity=cafe];'],
    radiusMeters: 8000,
    limit: 3,
  },
};

function milesBetween(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function sanitizeName(raw: any, category: PinCategory) {
  const v = String(raw || "").trim();
  if (v) return v;
  switch (category) {
    case "hospital":
      return "Hospital";
    case "police":
      return "Police Station";
    case "fire":
      return "Fire Station";
    case "pharmacy":
      return "Pharmacy";
    case "grocery":
      return "Grocery Store";
    case "school":
      return "School";
    case "park":
      return "Park";
    case "postal":
      return "Post Office";
    case "coffee":
      return "Coffee";
    default:
      return "Nearby Place";
  }
}

function subtitleFromTags(tags: Record<string, any> | undefined) {
  if (!tags) return undefined;
  const pieces = [tags["addr:street"], tags["addr:city"]].filter(Boolean);
  return pieces.length ? pieces.join(", ") : undefined;
}

export async function fetchNearbyPlaces(center: { lat: number; lon: number }): Promise<NearbyPin[]> {
  const parts: string[] = [];
  (Object.entries(CATEGORY_CONFIG) as [Exclude<PinCategory, "favorite">, (typeof CATEGORY_CONFIG)[Exclude<PinCategory, "favorite">]][]).forEach(
    ([category, cfg]) => {
      cfg.query.forEach((q) => {
        parts.push(q.replace(/R/g, String(cfg.radiusMeters)).replace(/LAT/g, String(center.lat)).replace(/LON/g, String(center.lon)));
      });
    }
  );

  const query = `[out:json][timeout:15];(${parts.join("")});out center tags;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: query,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);

  const json = await res.json();
  const elements = Array.isArray(json?.elements) ? json.elements : [];

  const buckets = new Map<PinCategory, NearbyPin[]>();
  elements.forEach((el: any, idx: number) => {
    const tags = el?.tags || {};
    let category: PinCategory | null = null;

    if (tags.amenity === "hospital") category = "hospital";
    else if (tags.amenity === "police") category = "police";
    else if (tags.amenity === "fire_station") category = "fire";
    else if (tags.amenity === "pharmacy") category = "pharmacy";
    else if (tags.shop === "supermarket") category = "grocery";
    else if (tags.amenity === "school") category = "school";
    else if (tags.leisure === "park") category = "park";
    else if (tags.amenity === "post_office") category = "postal";
    else if (tags.amenity === "cafe") category = "coffee";

    if (!category) return;
    const lat = Number(el?.lat ?? el?.center?.lat);
    const lon = Number(el?.lon ?? el?.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const pin: NearbyPin = {
      id: `${category}-${el.id || idx}`,
      title: sanitizeName(tags.name, category),
      subtitle: subtitleFromTags(tags),
      category,
      latitude: lat,
      longitude: lon,
      distanceMiles: milesBetween(center.lat, center.lon, lat, lon),
    };

    const arr = buckets.get(category) || [];
    arr.push(pin);
    buckets.set(category, arr);
  });

  const output: NearbyPin[] = [];
  (Object.entries(CATEGORY_CONFIG) as [Exclude<PinCategory, "favorite">, (typeof CATEGORY_CONFIG)[Exclude<PinCategory, "favorite">]][]).forEach(
    ([category, cfg]) => {
      const arr = (buckets.get(category) || [])
        .sort((a, b) => (a.distanceMiles || 0) - (b.distanceMiles || 0))
        .slice(0, cfg.limit);
      output.push(...arr);
    }
  );

  return output;
}
