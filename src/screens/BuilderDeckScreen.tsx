import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import BuilderBattleCard from "../components/BuilderBattleCard";
import { Builder, loadBuilders, upsertBuilder } from "../lib/storage";
import { colors } from "../ui/styles";

function shuffle<T>(list: T[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export default function BuilderDeckScreen({ onBack }: { onBack: () => void }) {
  const [allBuilders, setAllBuilders] = useState<Builder[]>([]);
  const [deck, setDeck] = useState<Builder[]>([]);
  const [customerTable, setCustomerTable] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleBuilders = useMemo(() => allBuilders.filter((b) => b.active !== false && !b.hidden), [allBuilders]);

  const refreshBuilders = useCallback(async () => {
    setLoading(true);
    const builders = await loadBuilders();
    setAllBuilders(builders);
    setLoading(false);
  }, []);

  const dealAnotherHand = useCallback(async () => {
    const builders = await loadBuilders();
    const visible = builders.filter((b) => b.active !== false && !b.hidden);
    setAllBuilders(builders);
    setDeck(shuffle(visible).slice(0, 10));
  }, []);

  useEffect(() => {
    refreshBuilders().then(dealAnotherHand);
  }, [refreshBuilders, dealAnotherHand]);

  const removeFromDeck = (id: string) => setDeck((prev) => prev.filter((b) => b.id !== id));

  const hideBuilder = async (builder: Builder) => {
    const next = { ...builder, hidden: true, engagement: "cold" as const };
    await upsertBuilder(next);
    setAllBuilders((prev) => prev.map((b) => (b.id === builder.id ? next : b)));
    removeFromDeck(builder.id);
  };

  const keepBuilder = async (builder: Builder) => {
    const next = { ...builder, engagement: "hot" as const };
    await upsertBuilder(next);
    setAllBuilders((prev) => prev.map((b) => (b.id === builder.id ? next : b)));
    setDeck((prev) => {
      const current = prev.find((b) => b.id === builder.id);
      const rest = prev.filter((b) => b.id !== builder.id);
      return current ? [...rest, next] : rest;
    });
  };

  const dealToCustomer = async (builder: Builder) => {
    const next = { ...builder, engagement: "hot" as const };
    await upsertBuilder(next);
    setAllBuilders((prev) => prev.map((b) => (b.id === builder.id ? next : b)));
    setCustomerTable((prev) => (prev.some((x) => x.id === builder.id) ? prev : [next, ...prev]));
    removeFromDeck(builder.id);
  };

  const topThree = deck.slice(0, 3);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Builder Deck</Text>
        <Text style={styles.sub}>Swipe left to remove the builders you do not want. Swipe right to keep them hot in the deck.</Text>

        <View style={styles.topButtons}>
          <Pressable style={styles.smallBtn} onPress={onBack}>
            <Text style={styles.smallBtnText}>Back</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={dealAnotherHand}>
            <Text style={styles.smallBtnText}>Another Hand</Text>
          </Pressable>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>CUSTOMER TABLE</Text>
          <Text style={styles.footerNote}>Active builders: {visibleBuilders.length}</Text>
        </View>

        <View style={styles.customerTable}>
          {customerTable.length === 0 ? (
            <Text style={styles.emptyText}>No cards dealt to customer yet.</Text>
          ) : (
            customerTable.slice(0, 4).map((b) => (
              <View key={b.id} style={styles.customerCard}>
                <Text style={styles.customerBuilder}>{b.name}</Text>
                <Text style={styles.customerCommunity}>{b.communityName || b.name}</Text>
                <Text style={styles.customerSmall}>{Number.isFinite(Number(b.minPrice)) ? `From $${Number(b.minPrice).toLocaleString()}+` : "From price"} • {b.minBeds}+ beds</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>{loading ? "Loading deck..." : `Deck (${deck.length}/10)`}</Text>

        <View style={styles.deckStack}>
          {topThree.slice().reverse().map((builder, i) => {
            const isTop = i === topThree.length - 1;
            return (
              <View key={builder.id} style={[styles.stackLayer, { top: i * 12, transform: [{ scale: 1 - i * 0.03 }] }]} pointerEvents={isTop ? "auto" : "none"}>
                <BuilderBattleCard builder={builder} index={i} onReject={hideBuilder} onKeep={keepBuilder} onDeal={dealToCustomer} />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  sub: { color: colors.muted, marginTop: 6, lineHeight: 20, fontSize: 14 },
  topButtons: { flexDirection: "row", gap: 10, marginTop: 16 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  smallBtnText: { color: colors.text, fontWeight: "800" },
  tableHeader: { marginTop: 18, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  tableHeaderText: { color: "#F8FAFC", fontWeight: "900", letterSpacing: 1 },
  customerTable: { minHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", padding: 12, gap: 10 },
  emptyText: { color: colors.muted, fontSize: 14 },
  customerCard: { borderRadius: 16, padding: 12, backgroundColor: "rgba(250,204,21,0.10)", borderWidth: 1, borderColor: "rgba(250,204,21,0.18)" },
  customerBuilder: { color: "#FEF08A", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  customerCommunity: { color: "#FFF", fontSize: 16, fontWeight: "900", marginTop: 2 },
  customerSmall: { color: "#E2E8F0", marginTop: 4, fontSize: 13 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900", marginTop: 20, marginBottom: 10 },
  deckStack: { minHeight: 560, justifyContent: "flex-start" },
  stackLayer: { position: "absolute", left: 0, right: 0 },
  footerNote: { color: colors.muted, fontSize: 12 },
});
