import React, { useEffect, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { deleteUsedHome, loadUsedHomes, makeId, upsertUsedHome, UsedHome } from "../lib/storage";
import { s } from "../ui/styles";

export default function UsedHomesScreen({ onBack }: { onBack: () => void }) {
  const [homes, setHomes] = useState<UsedHome[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [listingAgent, setListingAgent] = useState("");
  const [link, setLink] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [locating, setLocating] = useState(false);

  async function refresh() {
    setHomes(await loadUsedHomes());
  }

  useEffect(() => {
    refresh();
  }, []);

  function clearForm() {
    setTitle("");
    setPrice("");
    setBeds("");
    setBaths("");
    setSqft("");
    setYearBuilt("");
    setAddress("");
    setCity("");
    setListingAgent("");
    setLink("");
    setPhotoUrl("");
    setNotes("");
    setLat("");
    setLon("");
  }

  async function useMyLocation() {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow location so PackRep can place this used-home pin where you are standing.");
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLat(String(Number(current.coords.latitude).toFixed(6)));
      setLon(String(Number(current.coords.longitude).toFixed(6)));
      Alert.alert("Location added", "Current latitude and longitude were filled in.");
    } catch {
      Alert.alert("Location error", "Could not get your current location right now.");
    } finally {
      setLocating(false);
    }
  }

  async function saveHome() {
    if (!title.trim() || !address.trim()) {
      Alert.alert("Missing", "Title and address are required.");
      return;
    }
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      Alert.alert("Missing", "Latitude and longitude are required so the used-home pin lands in the right place.");
      return;
    }

    const home: UsedHome = {
      id: makeId("U"),
      title: title.trim(),
      price: Number(price || 0),
      beds: Number(beds || 3),
      baths: Number(baths || 2),
      sqft: Number.isFinite(Number(sqft)) ? Number(sqft) : undefined,
      yearBuilt: Number.isFinite(Number(yearBuilt)) ? Number(yearBuilt) : undefined,
      address: address.trim(),
      city: city.trim() || undefined,
      listingAgent: listingAgent.trim() || undefined,
      link: link.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      latitude,
      longitude,
      active: true,
      hidden: false,
    };

    await upsertUsedHome(home);
    clearForm();
    refresh();
    Alert.alert("Saved", "Used home added.");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.card}>
          <Text style={s.h1}>Used Homes</Text>
          <Text style={s.small}>Separate used-home layer so Realtors can compare resale inventory without cluttering the new-build workflow. If you are standing at the home, tap Use My Current Location.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.h2}>Add Used Home</Text>

          <Text style={s.label}>Title</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Used Home • Alamo Ranch Area" placeholderTextColor="#7b92ae" />

          <Text style={s.label}>Address</Text>
          <TextInput style={s.input} value={address} onChangeText={setAddress} placeholder="123 Main St, San Antonio, TX" placeholderTextColor="#7b92ae" />

          <Text style={s.label}>City</Text>
          <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="San Antonio" placeholderTextColor="#7b92ae" />

          <View style={{ marginTop: 12, gap: 10 }}>
            <Pressable style={s.btnGhost} onPress={useMyLocation}>
              <Text style={s.btnGhostText}>{locating ? "Getting location..." : "Use My Current Location"}</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Latitude</Text>
              <TextInput style={s.input} value={lat} onChangeText={setLat} keyboardType="decimal-pad" placeholder="29.4241" placeholderTextColor="#7b92ae" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Longitude</Text>
              <TextInput style={s.input} value={lon} onChangeText={setLon} keyboardType="decimal-pad" placeholder="-98.4936" placeholderTextColor="#7b92ae" />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Price</Text>
              <TextInput style={s.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="329900" placeholderTextColor="#7b92ae" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Beds</Text>
              <TextInput style={s.input} value={beds} onChangeText={setBeds} keyboardType="numeric" placeholder="4" placeholderTextColor="#7b92ae" />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Baths</Text>
              <TextInput style={s.input} value={baths} onChangeText={setBaths} keyboardType="numeric" placeholder="2" placeholderTextColor="#7b92ae" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Sqft</Text>
              <TextInput style={s.input} value={sqft} onChangeText={setSqft} keyboardType="numeric" placeholder="2025" placeholderTextColor="#7b92ae" />
            </View>
          </View>

          <Text style={s.label}>Year Built</Text>
          <TextInput style={s.input} value={yearBuilt} onChangeText={setYearBuilt} keyboardType="numeric" placeholder="2004" placeholderTextColor="#7b92ae" />

          <Text style={s.label}>Listing Agent</Text>
          <TextInput style={s.input} value={listingAgent} onChangeText={setListingAgent} placeholder="Agent name" placeholderTextColor="#7b92ae" />

          <Text style={s.label}>Listing Link</Text>
          <TextInput style={s.input} value={link} onChangeText={setLink} autoCapitalize="none" placeholder="https://listing..." placeholderTextColor="#7b92ae" />

          <Text style={s.label}>Photo URL</Text>
          <TextInput style={s.input} value={photoUrl} onChangeText={setPhotoUrl} autoCapitalize="none" placeholder="https://image..." placeholderTextColor="#7b92ae" />

          <Text style={s.label}>Notes</Text>
          <TextInput style={[s.input, { minHeight: 84, textAlignVertical: "top" }]} multiline value={notes} onChangeText={setNotes} placeholder="Why this used home matters for the comparison." placeholderTextColor="#7b92ae" />

          <View style={{ marginTop: 14, gap: 10 }}>
            <Pressable style={s.btn} onPress={saveHome}>
              <Text style={s.btnText}>Add Used Home</Text>
            </Pressable>
            <Pressable style={s.btnGhost} onPress={onBack}>
              <Text style={s.btnGhostText}>Back</Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={homes}
          keyExtractor={(x) => x.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 8 }}
          renderItem={({ item }) => (
            <View style={[s.listItem, { marginHorizontal: 14, marginTop: 10 }]}>
              <Text style={s.listTitle}>{item.title}</Text>
              <Text style={s.listSub}>{item.address}</Text>
              <Text style={s.listSub}>${Number.isFinite(Number(item.price)) ? Number(item.price).toLocaleString() : "—"} • {Number.isFinite(Number(item.beds)) ? Number(item.beds) : "—"} beds • {Number.isFinite(Number(item.baths)) ? Number(item.baths) : "—"} baths{Number.isFinite(Number(item.sqft)) ? ` • ${Number(item.sqft).toLocaleString()} sqft` : ""}</Text>
              <Text style={s.listSub}>Lat/Lon: {item.latitude}, {item.longitude}</Text>
              <Pressable
                style={[s.btnGhost, { marginTop: 10 }]}
                onPress={async () => {
                  await deleteUsedHome(item.id);
                  refresh();
                }}
              >
                <Text style={s.btnGhostText}>Delete</Text>
              </Pressable>
            </View>
          )}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
