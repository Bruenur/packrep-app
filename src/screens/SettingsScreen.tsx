import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MembershipTier, VerificationStatus, loadProfile, saveProfile } from "../lib/storage";
import { colors, s } from "../ui/styles";

const tiers: MembershipTier[] = ["free", "verified", "pro"];
const statuses: VerificationStatus[] = ["unverified", "pending", "verified"];

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultArea, setDefaultArea] = useState("");
  const [defaultState, setDefaultState] = useState("TX");
  const [defaultBuilderRadiusMiles, setDefaultBuilderRadiusMiles] = useState("25");
  const [membershipTier, setMembershipTier] = useState<MembershipTier>("free");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (!p) return;
      setName(p.name || "");
      setBrokerage(p.brokerage || "");
      setEmail(p.email || "");
      setPhone(p.phone || "");
      setDefaultArea(p.defaultArea || "");
      setDefaultState(p.defaultState || "TX");
      setDefaultBuilderRadiusMiles(String(p.defaultBuilderRadiusMiles || 25));
      setMembershipTier(p.membershipTier || "free");
      setVerificationStatus(p.verificationStatus || "unverified");
    })();
  }, []);

  async function save() {
    await saveProfile({
      name,
      brokerage,
      email,
      phone,
      defaultArea,
      defaultState,
      defaultBuilderRadiusMiles: parseInt(defaultBuilderRadiusMiles || "25", 10) || 25,
      membershipTier,
      verificationStatus,
    });
    Alert.alert("Saved", "Profile and access settings updated.");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.card}>
          <Text style={s.h1}>Settings</Text>
          <Text style={s.small}>Set your PackRep profile, area defaults, and paid-access prototype settings.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.h2}>Profile</Text>
          <Text style={s.label}>Name</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#7b92ae" />
          <Text style={s.label}>Brokerage</Text><TextInput style={s.input} value={brokerage} onChangeText={setBrokerage} placeholder="Brokerage" placeholderTextColor="#7b92ae" />
          <Text style={s.label}>Email</Text><TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#7b92ae" autoCapitalize="none" />
          <Text style={s.label}>Phone</Text><TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#7b92ae" keyboardType="phone-pad" />
          <Text style={s.label}>Default Area</Text><TextInput style={s.input} value={defaultArea} onChangeText={setDefaultArea} placeholder="San Antonio / Boerne" placeholderTextColor="#7b92ae" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Default State</Text><TextInput style={s.input} value={defaultState} onChangeText={setDefaultState} placeholder="TX" placeholderTextColor="#7b92ae" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Builder Radius (mi)</Text><TextInput style={s.input} value={defaultBuilderRadiusMiles} onChangeText={setDefaultBuilderRadiusMiles} keyboardType="number-pad" placeholder="25" placeholderTextColor="#7b92ae" />
            </View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.h2}>Membership</Text>
          <Text style={s.small}>Target pricing: Free browse, $29 Verified, $49 Pro with open-house requests and community wall access.</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {tiers.map((tier) => (
              <Pressable key={tier} style={[s.chip, membershipTier === tier && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setMembershipTier(tier)}>
                <Text style={[s.chipTxt, membershipTier === tier && { color: colors.bg }]}>{tier === "free" ? "Free" : tier === "verified" ? "$29 Verified" : "$49 Pro"}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>Verification Status</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {statuses.map((status) => (
              <Pressable key={status} style={[s.chip, verificationStatus === status && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setVerificationStatus(status)}>
                <Text style={[s.chipTxt, verificationStatus === status && { color: colors.bg }]}>{status}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[s.listItem, { marginTop: 14 }]}> 
            <Text style={s.listTitle}>Paid Access Gates</Text>
            <Text style={s.listSub}>Pro + verified unlocks the community wall, direct promotion, and builder open-house requests in this prototype.</Text>
          </View>
        </View>

        <View style={{ marginHorizontal: 14, marginTop: 14, gap: 10 }}>
          <Pressable style={s.btn} onPress={save}><Text style={s.btnText}>Save Settings</Text></Pressable>
          <Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
