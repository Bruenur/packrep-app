import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { s } from "../ui/styles";

function n(v: string) { const x = Number(String(v).replace(/[,$\s]/g, "")); return Number.isFinite(x) ? x : 0; }
function fmt(x: number) { return x.toLocaleString(undefined, { style: "currency", currency: "USD" }); }
function monthlyPI(loan: number, annualRatePct: number, years: number) {
  const r = annualRatePct / 100 / 12; const m = years * 12; if (loan <= 0 || m <= 0) return 0; if (r === 0) return loan / m; return (loan * r) / (1 - Math.pow(1 + r, -m));
}

export default function MortgageCalcScreen({ onBack }: { onBack: () => void }) {
  const [price, setPrice] = useState("350000");
  const [down, setDown] = useState("10");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("30");
  const [tax, setTax] = useState("7200");
  const [ins, setIns] = useState("1800");
  const [hoa, setHoa] = useState("0");

  const result = useMemo(() => {
    const home = n(price); const downPct = Math.max(0, Math.min(100, n(down))); const loan = Math.max(0, home * (1 - downPct / 100)); const yrs = Math.max(1, Math.round(n(years) || 30)); const pi = monthlyPI(loan, n(rate), yrs); const total = pi + n(tax)/12 + n(ins)/12 + n(hoa); return { home, downPct, loan, yrs, pi, total };
  }, [price, down, rate, years, tax, ins, hoa]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.card}><Text style={s.h1}>Mortgage Calculator</Text><Text style={s.small}>Quick payment estimate.</Text></View>
        <View style={s.card}>
          {[["Home Price", price, setPrice], ["Down %", down, setDown], ["Rate %", rate, setRate], ["Years", years, setYears], ["Annual Tax", tax, setTax], ["Annual Insurance", ins, setIns], ["Monthly HOA", hoa, setHoa]].map(([label, value, setter]: any) => (
            <View key={label}>
              <Text style={s.label}>{label}</Text>
              <TextInput style={s.input} value={value} onChangeText={setter} keyboardType="decimal-pad" placeholderTextColor="#7b92ae" />
            </View>
          ))}
        </View>
        <View style={s.card}><Text style={s.h2}>Estimated Monthly</Text><Text style={s.listTitle}>{fmt(result.total)}</Text><Text style={s.listSub}>P&I: {fmt(result.pi)} • Loan: {fmt(result.loan)}</Text></View>
        <View style={[s.card, { gap: 10 }]}><Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
