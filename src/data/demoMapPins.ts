export type PinCategory = "hospital" | "police" | "fire" | "pharmacy" | "grocery" | "school" | "park" | "postal" | "coffee" | "favorite";

export type DemoMapPin = {
  id: string;
  title: string;
  subtitle?: string;
  category: PinCategory;
  latitude: number;
  longitude: number;
};

export function categoryEmoji(category: PinCategory) {
  switch (category) {
    case "hospital": return "🏥";
    case "police": return "👮";
    case "fire": return "🚒";
    case "pharmacy": return "💊";
    case "grocery": return "🛒";
    case "school": return "🎓";
    case "park": return "🌳";
    case "postal": return "📮";
    case "coffee": return "☕";
    case "favorite": return "⭐";
    default: return "📍";
  }
}

export function categoryColor(category: PinCategory) {
  switch (category) {
    case "hospital": return "#ef4444";
    case "police": return "#3b82f6";
    case "fire": return "#f97316";
    case "pharmacy": return "#8b5cf6";
    case "grocery": return "#22c55e";
    case "school": return "#f59e0b";
    case "park": return "#10b981";
    case "postal": return "#64748b";
    case "coffee": return "#92400e";
    case "favorite": return "#facc15";
    default: return "#94a3b8";
  }
}

export function buildDemoPins(center?: { lat: number; lon: number }): DemoMapPin[] {
  const lat = center?.lat ?? 29.4241;
  const lon = center?.lon ?? -98.4936;
  return [
    { id: "pin-hospital", title: "Closest Hospital", subtitle: "Nearby care", category: "hospital", latitude: lat + 0.014, longitude: lon - 0.01 },
    { id: "pin-police", title: "Police Station", subtitle: "Public safety station", category: "police", latitude: lat + 0.01, longitude: lon + 0.012 },
    { id: "pin-fire", title: "Fire Station", subtitle: "Fire / EMS", category: "fire", latitude: lat - 0.011, longitude: lon + 0.007 },
    { id: "pin-pharmacy", title: "Pharmacy", subtitle: "Medication nearby", category: "pharmacy", latitude: lat + 0.005, longitude: lon - 0.018 },
    { id: "pin-grocery", title: "Grocery Store", subtitle: "Essentials nearby", category: "grocery", latitude: lat - 0.007, longitude: lon - 0.014 },
    { id: "pin-school", title: "School", subtitle: "Nearby school", category: "school", latitude: lat + 0.017, longitude: lon + 0.02 },
    { id: "pin-park", title: "Park", subtitle: "Green space", category: "park", latitude: lat - 0.016, longitude: lon + 0.02 },
    { id: "pin-postal", title: "USPS / City Services", subtitle: "Mail / city help", category: "postal", latitude: lat - 0.019, longitude: lon - 0.004 },
    { id: "pin-coffee", title: "Coffee", subtitle: "Starbucks style favorite", category: "coffee", latitude: lat + 0.008, longitude: lon + 0.025 },
  ];
}
