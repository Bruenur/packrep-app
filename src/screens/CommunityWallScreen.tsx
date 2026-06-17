import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MembershipTier, VerificationStatus, WallPost, addWallPost, loadProfile, loadWallPosts, makeId, nowStamp } from "../lib/storage";
import { colors, s } from "../ui/styles";

const categories = ["All", "Builder", "Realtor", "Loan Officer", "Credit Repair", "Open House", "Question"] as const;
type Filter = typeof categories[number];

type Role = WallPost["role"];
const roles: Role[] = ["Realtor", "Builder", "OSC", "Loan Officer", "Credit Repair", "Marketing"];

function borderFor(category: WallPost["category"]) {
  switch (category) {
    case "Builder": return "#4F8DFF";
    case "Loan Officer": return "#E05B5B";
    case "Credit Repair": return "#E8C447";
    case "Open House": return "#F28C28";
    case "Realtor": return "#55B36F";
    default: return "#6C7E95";
  }
}

export default function CommunityWallScreen({ onBack }: { onBack: () => void }) {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<WallPost["category"]>("Question");
  const [role, setRole] = useState<Role>("Realtor");
  const [name, setName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [membershipTier, setMembershipTier] = useState<MembershipTier>("free");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");

  useEffect(() => {
    (async () => {
      const [loadedPosts, profile] = await Promise.all([loadWallPosts(), loadProfile()]);
      setPosts(loadedPosts);
      setName(profile?.name || "");
      setBrokerage(profile?.brokerage || "");
      setMembershipTier(profile?.membershipTier || "free");
      setVerificationStatus(profile?.verificationStatus || "unverified");
    })();
  }, []);

  const canAccess = membershipTier === "pro" && verificationStatus === "verified";
  const filtered = useMemo(() => filter === "All" ? posts : posts.filter((p) => p.category === filter), [posts, filter]);

  async function submit() {
    if (!canAccess) {
      Alert.alert("Upgrade required", "This wall is for paid verified users. Set your profile to Pro + Verified in Settings for the prototype.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing", "Add a title and message.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const todaysPosts = posts.filter((p) => p.authorName === (name || "Verified User") && p.createdAt.slice(0, 10) === today);
    const limit = role === "Marketing" ? 1 : 2;
    if (todaysPosts.length >= limit) {
      Alert.alert("Posting limit reached", role === "Marketing" ? "Marketing accounts can post 1 time per day." : "Standard users can post up to 2 times per day.");
      return;
    }
    const item: WallPost = {
      id: makeId("POST"),
      createdAt: new Date().toISOString(),
      authorName: name || "Verified User",
      authorBrokerage: brokerage || undefined,
      category,
      role,
      title: title.trim(),
      body: body.trim(),
    };
    await addWallPost(item);
    setPosts(await loadWallPosts());
    setTitle("");
    setBody("");
    Alert.alert("Posted", "Your wall post is live.");
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={s.h1}>Community Wall</Text>
        <Text style={s.small}>Paid verified users can ask questions, promote themselves within posting limits, and interact with other verified professionals.</Text>
      </View>

      {!canAccess ? (
        <View style={s.card}>
          <Text style={s.h2}>Locked for Pro + Verified</Text>
          <Text style={s.small}>Set membership to $49 Pro and verification to Verified in Settings for this prototype. Final billing and verification still need backend wiring.</Text>
          <View style={{ marginTop: 12 }}>
            <Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable>
          </View>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.h2}>Create Post</Text>
          <Text style={s.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.filter((c) => c !== "All").map((item) => (
              <Pressable key={item} style={[s.chip, category === item && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setCategory(item)}>
                <Text style={[s.chipTxt, category === item && { color: colors.bg }]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={s.label}>Role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {roles.map((item) => (
              <Pressable key={item} style={[s.chip, role === item && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setRole(item)}>
                <Text style={[s.chipTxt, role === item && { color: colors.bg }]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={s.label}>Title</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Need a lender contact for VA buyers" placeholderTextColor="#7b92ae" />
          <Text style={s.label}>Message</Text>
          <TextInput style={[s.input, { minHeight: 100, textAlignVertical: "top" }]} multiline value={body} onChangeText={setBody} placeholder="Ask your question or promote your opportunity here." placeholderTextColor="#7b92ae" />
          <View style={{ marginTop: 14 }}>
            <Pressable style={s.btn} onPress={submit}><Text style={s.btnText}>Post to Wall</Text></Pressable>
          </View>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.h2}>Feed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
          {categories.map((item) => (
            <Pressable key={item} style={[s.chip, filter === item && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setFilter(item)}>
              <Text style={[s.chipTxt, filter === item && { color: colors.bg }]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {filtered.map((post) => (
        <View key={post.id} style={[s.card, { borderColor: borderFor(post.category), borderWidth: 1.5 }]}> 
          <Text style={s.listTitle}>{post.authorName}{post.authorBrokerage ? ` • ${post.authorBrokerage}` : ""}</Text>
          <Text style={s.listSub}>{post.role} • {post.category} • {new Date(post.createdAt).toLocaleString()}</Text>
          <Text style={[s.h2, { marginTop: 10 }]}>{post.title}</Text>
          <Text style={[s.small, { marginTop: 8 }]}>{post.body}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable style={s.btnGhost}><Text style={s.btnGhostText}>Reply</Text></Pressable>
            <Pressable style={s.btnGhost}><Text style={s.btnGhostText}>Message</Text></Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
