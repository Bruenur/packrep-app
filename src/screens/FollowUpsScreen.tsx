import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Lead, loadLeads, parseFollowUpDate } from "../lib/storage";
import { s } from "../ui/styles";

export default function FollowUpsScreen({ onBack, onOpenLead }: { onBack: () => void; onOpenLead: (leadId: string) => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  useEffect(() => { loadLeads().then(setLeads); }, []);

  const items = useMemo(() => leads.filter((l) => !!l.followUpAt).sort((a, b) => (parseFollowUpDate(a.followUpAt)?.getTime() || 0) - (parseFollowUpDate(b.followUpAt)?.getTime() || 0)), [leads]);

  return (
    <View style={s.screen}>
      <View style={s.card}><Text style={s.h1}>Follow-ups</Text><Text style={s.small}>Every lead with a saved follow-up date.</Text></View>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Pressable style={[s.listItem, { marginHorizontal: 14, marginTop: 10 }]} onPress={() => onOpenLead(item.id)}>
            <Text style={s.listTitle}>{item.buyerName}</Text>
            <Text style={s.listSub}>Follow-up: {item.followUpAt}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<View style={s.card}><Text style={s.small}>No follow-ups found.</Text></View>}
        ListFooterComponent={<View style={[s.card, { gap: 10 }]}><Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable></View>}
      />
    </View>
  );
}
