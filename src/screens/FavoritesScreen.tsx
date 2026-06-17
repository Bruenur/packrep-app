import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DEFAULT_PIN_PREFS, PinLayerPrefs, loadPinLayerPrefs, savePinLayerPrefs } from "../lib/storage";
import { s } from "../ui/styles";

const groups: { key: keyof PinLayerPrefs; label: string; hint?: string }[] = [
  { key: "builders", label: "New Build Communities", hint: "Show builder communities around you" },
  { key: "school", label: "Schools", hint: "Elementary, middle, and high school pins" },
  { key: "grocery", label: "Grocery Stores" },
  { key: "police", label: "Police Stations" },
  { key: "fire", label: "Fire Stations" },
  { key: "hospital", label: "Hospitals" },
  { key: "pharmacy", label: "Pharmacies" },
  { key: "postal", label: "Post Office / City Services" },
  { key: "park", label: "Parks" },
  { key: "coffee", label: "Coffee" },
  { key: "usedHomes", label: "Used Homes" },
  { key: "favorite", label: "Favorite Pins" },
];

export default function FavoritesScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<PinLayerPrefs>(DEFAULT_PIN_PREFS);

  useEffect(() => {
    loadPinLayerPrefs().then(setPrefs);
  }, []);

  async function toggle(key: keyof PinLayerPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await savePinLayerPrefs(next);
  }

  async function resetDefaults() {
    setPrefs(DEFAULT_PIN_PREFS);
    await savePinLayerPrefs(DEFAULT_PIN_PREFS);
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={s.h1}>Map Pins</Text>
        <Text style={s.small}>Choose what appears on the map. By default, PackRep opens with new build communities and schools only.</Text>
      </View>

      <View style={s.card}>
        {groups.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => toggle(item.key)}
            style={[s.listItem, { marginBottom: 10, borderColor: prefs[item.key] ? "#E8C447" : "rgba(255,255,255,0.10)" }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.listTitle}>{item.label}</Text>
              {!!item.hint && <Text style={s.listSub}>{item.hint}</Text>}
            </View>
            <View style={[s.chip, prefs[item.key] && { backgroundColor: "#E8C447", borderColor: "#E8C447" }]}>
              <Text style={[s.chipTxt, prefs[item.key] && { color: "#061326" }]}>{prefs[item.key] ? "ON" : "OFF"}</Text>
            </View>
          </Pressable>
        ))}

        <View style={{ marginTop: 8, gap: 10 }}>
          <Pressable style={s.btnGhost} onPress={resetDefaults}><Text style={s.btnGhostText}>Reset to Default</Text></Pressable>
          <Pressable style={s.btn} onPress={onBack}><Text style={s.btnText}>Done</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
