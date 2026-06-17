import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Builder, MembershipTier, VerificationStatus, addOpenHouseRequest, loadProfile, makeId } from "../lib/storage";
import { colors, s } from "../ui/styles";

export default function OpenHouseRequestScreen({ builder, onBack }: { builder: Builder | null; onBack: () => void }) {
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [expectedTraffic, setExpectedTraffic] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [membershipTier, setMembershipTier] = useState<MembershipTier>("free");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");

  useEffect(() => {
    (async () => {
      const profile = await loadProfile();
      setName(profile?.name || "");
      setBrokerage(profile?.brokerage || "");
      setEmail(profile?.email || "");
      setPhone(profile?.phone || "");
      setMembershipTier(profile?.membershipTier || "free");
      setVerificationStatus(profile?.verificationStatus || "unverified");
    })();
  }, []);

  const canRequest = membershipTier === "pro" && verificationStatus === "verified";
  const builderAccepts = builder?.acceptsOpenHouseRequests !== false;

  async function submit() {
    if (!builder) return;
    if (!canRequest) {
      Alert.alert("Upgrade required", "Only paid verified users can request builder open houses in this prototype.");
      return;
    }
    if (!builderAccepts) {
      Alert.alert("Requests closed", "This builder is not currently accepting open-house requests for this community.");
      return;
    }
    if (!requestedDate.trim() || !requestedTime.trim()) {
      Alert.alert("Missing", "Please enter a requested date and time.");
      return;
    }
    await addOpenHouseRequest({
      id: makeId("REQ"),
      createdAt: new Date().toISOString(),
      builderId: builder.id,
      builderName: builder.name,
      communityName: builder.communityName,
      requestedDate: requestedDate.trim(),
      requestedTime: requestedTime.trim(),
      expectedTraffic: expectedTraffic.trim() || undefined,
      notes: notes.trim() || undefined,
      realtorName: name || undefined,
      brokerage: brokerage || undefined,
      email: email || undefined,
      phone: phone || undefined,
      status: "pending",
    });
    Alert.alert("Request sent", "Your open-house request was saved as pending for builder review.");
    onBack();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.card}>
          <Text style={s.h1}>Open House Request</Text>
          <Text style={s.small}>Trust-based premium feature for paid verified Realtors. Builder approval is always required.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.h2}>{builder?.name || "Builder"}</Text>
          <Text style={s.listSub}>{builder?.communityName || "Community"}</Text>
          <View style={[s.listItem, { marginTop: 12, borderColor: builderAccepts ? colors.green : colors.red }]}> 
            <Text style={s.listTitle}>{builderAccepts ? "Accepting Requests" : "Requests Turned Off"}</Text>
            <Text style={s.listSub}>{builderAccepts ? "This community can receive open-house requests." : "This builder is not taking open-house requests here right now."}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.h2}>Request Details</Text>
          <Text style={s.label}>Requested Date</Text><TextInput style={s.input} value={requestedDate} onChangeText={setRequestedDate} placeholder="2026-05-15" placeholderTextColor="#7b92ae" />
          <Text style={s.label}>Requested Time</Text><TextInput style={s.input} value={requestedTime} onChangeText={setRequestedTime} placeholder="12pm - 3pm" placeholderTextColor="#7b92ae" />
          <Text style={s.label}>Expected Traffic Plan</Text><TextInput style={s.input} value={expectedTraffic} onChangeText={setExpectedTraffic} placeholder="Facebook groups, sphere, flyers, signs" placeholderTextColor="#7b92ae" />
          <Text style={s.label}>Notes</Text><TextInput style={[s.input, { minHeight: 100, textAlignVertical: "top" }]} multiline value={notes} onChangeText={setNotes} placeholder="How you plan to represent the builder and who you expect to bring." placeholderTextColor="#7b92ae" />
        </View>

        <View style={s.card}>
          <Text style={s.h2}>Access Check</Text>
          <Text style={s.listSub}>Membership: {membershipTier} • Verification: {verificationStatus}</Text>
          <Text style={[s.small, { marginTop: 8 }]}>{canRequest ? "You are eligible to request this open house." : "Set your profile to Pro + Verified in Settings for this prototype."}</Text>
        </View>

        <View style={{ marginHorizontal: 14, marginTop: 14, gap: 10 }}>
          <Pressable style={s.btn} onPress={submit}><Text style={s.btnText}>Send Request</Text></Pressable>
          <Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
