import React, { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { Builder } from "../lib/storage";

type Props = {
  builder: Builder;
  index?: number;
  onReject?: (builder: Builder) => void;
  onKeep?: (builder: Builder) => void;
  onDeal?: (builder: Builder) => void;
};

const THEMES: Record<string, { bg: string; edge: string; accent: string }> = {
  kb: { bg: "#17253c", edge: "#f4c84b", accent: "#fff1a8" },
  dr: { bg: "#143228", edge: "#22c55e", accent: "#dcfce7" },
  lennar: { bg: "#241742", edge: "#a78bfa", accent: "#ede9fe" },
  perry: { bg: "#372114", edge: "#fb923c", accent: "#ffedd5" },
  default: { bg: "#18263a", edge: "#f4c84b", accent: "#f8fbff" },
};

function themeFor(builder: Builder) {
  const key = String(builder.colorKey || builder.name || "default").toLowerCase();
  if (key.includes("kb")) return THEMES.kb;
  if (key.includes("dr")) return THEMES.dr;
  if (key.includes("lennar")) return THEMES.lennar;
  if (key.includes("perry")) return THEMES.perry;
  return THEMES.default;
}

export default function BuilderBattleCard({ builder, onReject, onKeep, onDeal }: Props) {
  const theme = useMemo(() => themeFor(builder), [builder]);
  const [back, setBack] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const front = flip.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] });
  const rear = flip.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] });
  const rotate = pan.x.interpolate({ inputRange: [-220, 0, 220], outputRange: ["-10deg", "0deg", "10deg"] });

  function toggle() {
    const next = !back;
    setBack(next);
    Animated.spring(flip, { toValue: next ? 180 : 0, friction: 8, tension: 65, useNativeDriver: true }).start();
  }

  function resetCard() {
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 7, tension: 70, useNativeDriver: false }).start();
  }

  function finish(dir: "left" | "right") {
    Animated.timing(pan.x, { toValue: dir === "right" ? 360 : -360, duration: 220, useNativeDriver: false }).start(() => {
      if (dir === "right") onKeep?.(builder);
      else onReject?.(builder);
      pan.setValue({ x: 0, y: 0 });
    });
  }

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_evt, g) => {
        if (g.dx < -110) return finish("left");
        if (g.dx > 110) return finish("right");
        resetCard();
      },
      onPanResponderTerminate: resetCard,
    })
  ).current;

  return (
    <Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }}>
      <View style={styles.wrap}>
        <Animated.View style={[styles.face, { backgroundColor: theme.bg, borderColor: theme.edge, transform: [{ perspective: 1000 }, { rotateY: front }] }]}> 
          <Pressable style={styles.inner} onPress={toggle}>
            <Text style={[styles.top, { color: theme.accent }]}>{builder.name}</Text>
            <Text style={styles.main}>{builder.communityName}</Text>
            <Text style={styles.price}>From $${money(builder.minPrice)}+</Text>
            <Text style={styles.sub}>{builder.minBeds}+ beds • {builder.bathsMin}+ baths</Text>
            <View style={styles.box}><Text style={styles.boxTitle}>Quick appeal</Text><Text style={styles.boxText}>{builder.quickAppeal}</Text></View>
            <View style={styles.actions}>
              <Pressable style={[styles.actionBtn, styles.reject]} onPress={() => onReject?.(builder)}><Text style={styles.actionTxt}>Hide</Text></Pressable>
              <Pressable style={[styles.actionBtn, styles.keep]} onPress={() => onKeep?.(builder)}><Text style={styles.actionTxt}>Keep</Text></Pressable>
              <Pressable style={[styles.actionBtn, styles.deal]} onPress={() => onDeal?.(builder)}><Text style={styles.actionTxt}>Customer</Text></Pressable>
            </View>
            <Text style={styles.tap}>Tap to flip</Text>
          </Pressable>
        </Animated.View>
        <Animated.View style={[styles.face, styles.back, { backgroundColor: theme.bg, borderColor: theme.edge, transform: [{ perspective: 1000 }, { rotateY: rear }] }]}> 
          <Pressable style={styles.inner} onPress={toggle}>
            <Text style={[styles.top, { color: theme.accent }]}>{builder.communityName}</Text>
            <View style={styles.box}><Text style={styles.boxTitle}>Schools</Text><Text style={styles.boxText}>{builder.schools.join(" • ")}</Text></View>
            <View style={styles.row}><View style={styles.mini}><Text style={styles.boxTitle}>Utility</Text><Text style={styles.boxText}>{builder.utilityType}</Text></View><View style={styles.mini}><Text style={styles.boxTitle}>Tax</Text><Text style={styles.boxText}>{builder.taxRate}%</Text></View></View>
            <View style={styles.row}><View style={styles.mini}><Text style={styles.boxTitle}>HOA</Text><Text style={styles.boxText}>{builder.hoa}</Text></View><View style={styles.mini}><Text style={styles.boxTitle}>Sqft</Text><Text style={styles.boxText}>{money(builder.sqftMin)}-{money(builder.sqftMax)}</Text></View></View>
            <Text style={styles.boxText}>{builder.address}</Text>
            <Text style={styles.tap}>Tap to flip back</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 320, height: 420 },
  face: { position: "absolute", inset: 0, borderRadius: 24, borderWidth: 1.5, overflow: "hidden", backfaceVisibility: "hidden" },
  back: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  inner: { flex: 1, padding: 18 },
  top: { fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  main: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 8 },
  price: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 22 },
  sub: { color: "#d6dceb", fontSize: 13, marginTop: 6 },
  box: { marginTop: 18, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 12 },
  boxTitle: { color: "#c6d2e5", fontWeight: "800", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  boxText: { color: "#fff", fontSize: 14, fontWeight: "700", lineHeight: 19, marginTop: 4 },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  mini: { flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  reject: { backgroundColor: "rgba(239,68,68,0.18)", borderWidth: 1, borderColor: "rgba(239,68,68,0.35)" },
  keep: { backgroundColor: "rgba(34,197,94,0.18)", borderWidth: 1, borderColor: "rgba(34,197,94,0.35)" },
  deal: { backgroundColor: "rgba(250,204,21,0.18)", borderWidth: 1, borderColor: "rgba(250,204,21,0.35)" },
  actionTxt: { color: "#fff", fontWeight: "900", fontSize: 12 },
  tap: { color: "#d2dae8", textAlign: "center", marginTop: "auto", fontWeight: "700" },
});
