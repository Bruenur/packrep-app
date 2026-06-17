import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import * as Location from "expo-location";
import { Builder, MembershipTier, VerificationStatus, distanceMiles, loadBuilders, loadProfile } from "../lib/storage";
import { colors, s } from "../ui/styles";

export default function BuildersScreen({ onBack, onRequestOpenHouse }: { onBack: () => void; onRequestOpenHouse: (builder: Builder) => void }) {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [userPoint, setUserPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [membershipTier, setMembershipTier] = useState<MembershipTier>("free");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");

  useEffect(() => {
    (async () => {
      const [list, profile] = await Promise.all([loadBuilders(), loadProfile()]);
      setBuilders(list.filter((b) => b.active !== false && !b.hidden));
      setRadiusMiles(profile?.defaultBuilderRadiusMiles || 25);
      setMembershipTier(profile?.membershipTier || "free");
      setVerificationStatus(profile?.verificationStatus || "unverified");
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserPoint({ latitude: current.coords.latitude, longitude: current.coords.longitude });
        }
      } catch {
      }
    })();
  }, []);

  const canRequest = membershipTier === "pro" && verificationStatus === "verified";

  const nearbyBuilders = useMemo(() => {
    if (!userPoint) return builders;
    return builders
      .map((b) => ({ ...b, milesAway: distanceMiles(userPoint, { latitude: b.locationLat, longitude: b.locationLon }) }))
      .filter((b) => b.milesAway <= radiusMiles)
      .sort((a, b) => a.milesAway - b.milesAway);
  }, [builders, userPoint, radiusMiles]);

  function directions(builder: Builder) {
    const label = encodeURIComponent(builder.communityName);
    const url = `http://maps.apple.com/?ll=${builder.locationLat},${builder.locationLon}&q=${label}`;
    Alert.alert("Directions", "Use the builder card from the map for direct turn-by-turn. This list is for browsing and requests.");
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={s.h1}>New Build Communities</Text>
        <Text style={s.small}>This list shows builder communities around your current area. Paid verified Realtors can request open houses in participating communities.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Nearby Builder Count</Text>
        <Text style={s.listSub}>{nearbyBuilders.length} communities within about {radiusMiles} miles.</Text>
        <View style={[s.listItem, { marginTop: 12, borderColor: canRequest ? colors.green : colors.red }]}> 
          <Text style={s.listTitle}>{canRequest ? "Open-House Requests Unlocked" : "Open-House Requests Locked"}</Text>
          <Text style={s.listSub}>{canRequest ? "You can request open houses in communities that accept them." : "Set membership to Pro + Verified in Settings for this prototype."}</Text>
        </View>
      </View>

      {nearbyBuilders.map((builder: Builder & { milesAway?: number }) => (
        <View key={builder.id} style={s.card}>
          <Text style={s.h2}>{builder.name}</Text>
          <Text style={s.listSub}>{builder.communityName}{typeof builder.milesAway === "number" ? ` • ${builder.milesAway.toFixed(1)} mi away` : ""}</Text>
          <Text style={[s.small, { marginTop: 10 }]}>Starting at ${Number(builder.minPrice || 0).toLocaleString()} • {builder.minBeds}+ beds • {(builder.schools || []).slice(0, 2).join(" • ")}</Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Pressable style={s.btnGhost} onPress={() => directions(builder)}><Text style={s.btnGhostText}>View Community</Text></Pressable>
            {builder.acceptsOpenHouseRequests !== false ? (
              <Pressable style={canRequest ? s.btn : s.btnGhost} onPress={() => canRequest ? onRequestOpenHouse(builder) : Alert.alert("Upgrade required", "Only paid verified users can request builder open houses.") }>
                <Text style={canRequest ? s.btnText : s.btnGhostText}>Request Open House</Text>
              </Pressable>
            ) : (
              <Pressable style={s.btnGhost}><Text style={s.btnGhostText}>Builder Not Accepting Requests</Text></Pressable>
            )}
          </View>
        </View>
      ))}

      <View style={{ marginHorizontal: 14, marginTop: 14 }}>
        <Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable>
      </View>
    </ScrollView>
  );
}
