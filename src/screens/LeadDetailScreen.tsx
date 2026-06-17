import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Share, Text, View } from "react-native";
import { addLeadActivity, buildPackText, Lead, loadLeads } from "../lib/storage";
import { s } from "../ui/styles";

function money(v?: string) {
  const n = Number(String(v || "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `$${n.toLocaleString()}`;
}

export default function LeadDetailScreen({ leadId, onBack }: { leadId: string | null; onBack: () => void }) {
  const [lead, setLead] = useState<Lead | null>(null);

  async function refresh() {
    const all = await loadLeads();
    setLead(all.find((x) => x.id === leadId) || null);
  }

  useEffect(() => {
    refresh();
  }, [leadId]);

  const packText = useMemo(() => (lead ? buildPackText(lead) : ""), [lead]);

  async function shareLead() {
    if (!lead || !packText) return;
    await addLeadActivity(lead.id, { type: "share", label: "Lead pack shared" });
    await Share.share({ message: packText });
    refresh();
  }

  if (!lead) {
    return <View style={s.screen}><View style={s.card}><Text style={s.h1}>Lead not found</Text></View></View>;
  }

  const packs = [
    lead.pack.salesCounselor ? "Sales Counselor" : null,
    lead.pack.creditRepair ? "Credit Repair" : null,
    lead.pack.loanOfficer ? "Loan Officer" : null,
    lead.pack.builder ? "Builder" : null,
    lead.pack.custom ? (lead.pack.customLabel || "Custom Pack") : null,
  ].filter(Boolean);

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={s.h1}>{lead.buyerName}</Text>
        <Text style={s.small}>{lead.city || "Area not set"}{lead.zip ? ` • ${lead.zip}` : ""}{lead.state ? ` • ${lead.state}` : ""} • {lead.createdAt}</Text>
        {!!lead.buyerPhotoUrl && (
          <Image source={{ uri: lead.buyerPhotoUrl }} style={{ width: "100%", height: 220, borderRadius: 18, marginTop: 14 }} resizeMode="cover" />
        )}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Buyer / Contact</Text>
        <Text style={s.listSub}>{lead.buyerPhone || "No phone saved"}</Text>
        <Text style={s.listSub}>{lead.buyerEmail || "No email saved"}</Text>
        <Text style={s.listSub}>{lead.facebookUrl || "No Facebook/profile link saved"}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Location Snapshot</Text>
        <Text style={s.listSub}>City / Town: {lead.city || "—"}</Text>
        <Text style={s.listSub}>ZIP: {lead.zip || "—"}</Text>
        <Text style={s.listSub}>County: {lead.county || "—"}</Text>
        <Text style={s.listSub}>State: {lead.state || "—"}</Text>
        <Text style={s.listSub}>Radius: {lead.builderRadiusMiles ? `${lead.builderRadiusMiles} miles` : "—"}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Criteria</Text>
        <Text style={s.listSub}>Max Price: {money(lead.priceMax)}</Text>
        <Text style={s.listSub}>Beds: {lead.bedsMin || "—"}</Text>
        <Text style={s.listSub}>Baths: {lead.bathsMin || "—"}</Text>
        <Text style={s.listSub}>Build Type: {lead.buildType || "Any"}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Realtor / Representation</Text>
        <Text style={s.listSub}>{lead.realtorName || "—"}{lead.brokerage ? ` • ${lead.brokerage}` : ""}</Text>
        <Text style={s.listSub}>{lead.realtorPhone || "No phone saved"}</Text>
        <Text style={s.listSub}>{lead.realtorEmail || "No email saved"}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Pack</Text>
        {packs.length ? packs.map((pack) => <Text key={pack} style={s.listSub}>• {pack}</Text>) : <Text style={s.small}>No pack parts selected.</Text>}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Notes</Text>
        <Text style={s.listSub}>{lead.notes || "No notes yet."}</Text>
        {!!lead.followUpAt && <Text style={[s.listSub, { marginTop: 8 }]}>Follow-up: {lead.followUpAt}</Text>}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Recent Activity</Text>
        {lead.activity && lead.activity.length ? lead.activity.map((item) => (
          <Text key={item.id} style={s.listSub}>• {item.at} — {item.label}</Text>
        )) : <Text style={s.small}>No activity logged yet.</Text>}
      </View>

      <View style={[s.card, { gap: 10 }]}> 
        <Pressable style={s.btn} onPress={shareLead}><Text style={s.btnText}>Share Lead Pack</Text></Pressable>
        <Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable>
      </View>
    </ScrollView>
  );
}
