import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { deleteLead, Lead, loadLeads } from "../lib/storage";
import { s } from "../ui/styles";

function money(v?: string) {
  const n = Number(String(v || "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";
  return `$${n.toLocaleString()}`;
}

export default function LeadsScreen({ onBack, onOpenLead, onNewLead }: { onBack: () => void; onOpenLead: (leadId: string) => void; onNewLead: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);

  async function refresh() {
    setLeads(await loadLeads());
  }

  useEffect(() => { refresh(); }, []);

  async function askDelete(id: string) {
    Alert.alert("Delete lead?", "This removes the lead from this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteLead(id); refresh(); } },
    ]);
  }

  return (
    <View style={s.screen}>
      <View style={s.card}><Text style={s.h1}>Leads</Text><Text style={s.small}>Open, review, or remove local lead cards.</Text></View>
      <View style={[s.card, { gap: 10 }]}> 
        <Pressable style={s.btn} onPress={onNewLead}><Text style={s.btnText}>Create New Lead</Text></Pressable>
        <Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable>
      </View>
      <FlatList
        data={leads}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={[s.listItem, { marginHorizontal: 14, marginTop: 10 }]}>
            <Pressable onPress={() => onOpenLead(item.id)}>
              <Text style={s.listTitle}>{item.buyerName}</Text>
              <Text style={s.listSub}>{item.city || "Area not set"}{item.zip ? ` • ${item.zip}` : ""}{item.county ? ` • ${item.county}` : ""}</Text>
              <Text style={s.listSub}>{money(item.priceMax) || "No price set"}{item.bedsMin ? ` • ${item.bedsMin}+ beds` : ""}{item.bathsMin ? ` • ${item.bathsMin}+ baths` : ""}</Text>
              <Text style={s.listSub}>{item.createdAt}</Text>
            </Pressable>
            <Pressable style={[s.btnGhost, { marginTop: 10 }]} onPress={() => askDelete(item.id)}><Text style={s.btnGhostText}>Delete</Text></Pressable>
          </View>
        )}
        ListEmptyComponent={<View style={s.card}><Text style={s.small}>No leads yet.</Text></View>}
      />
    </View>
  );
}
