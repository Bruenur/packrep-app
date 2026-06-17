import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { colors, s } from '../ui/styles';
import { Builder, distanceMiles, Lead, loadBuilders, loadProfile, makeId, nowStamp, upsertBuilder, upsertLead } from '../lib/storage';
import { referralRealtors } from '../data/referralRealtors';

const DEFAULT_REGION: Region = { latitude: 29.4252, longitude: -98.4946, latitudeDelta: 0.2, longitudeDelta: 0.2 };
const STEPS = ['Find Area', 'Circle It', 'Distribution', 'Finish'];

function digitsOnly(v: string) { return (v || '').replace(/[^\d]/g, ''); }
function formatMoneyInput(v: string) { const d = digitsOnly(v); return d ? Number(d).toLocaleString() : ''; }
function safeText(part?: string | null) { return String(part || '').trim(); }
function metersFromMiles(miles: number) { return miles * 1609.34; }
function deltaForMiles(miles: number) { return Math.max(0.02, miles / 34); }

export default function IntakeScreen({ onCancel, onSaved }: { onCancel: () => void; onSaved: (leadId: string) => void }) {
  const mapRef = useRef<MapView | null>(null);
  const [step, setStep] = useState(0);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [centerLat, setCenterLat] = useState<number>(DEFAULT_REGION.latitude);
  const [centerLon, setCenterLon] = useState<number>(DEFAULT_REGION.longitude);
  const [buyerFirstName, setBuyerFirstName] = useState('');
  const [buyerLastName, setBuyerLastName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [stateName, setStateName] = useState('TX');
  const [county, setCounty] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [bedsMin, setBedsMin] = useState('3');
  const [bathsMin, setBathsMin] = useState('2');
  const [buildType, setBuildType] = useState('Any');
  const [builderRadiusMiles, setBuilderRadiusMiles] = useState(12);
  const [notes, setNotes] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [buyerPhotoUrl, setBuyerPhotoUrl] = useState('');
  const [followUpAt, setFollowUpAt] = useState('');
  const [realtorName, setRealtorName] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [realtorEmail, setRealtorEmail] = useState('');
  const [realtorPhone, setRealtorPhone] = useState('');
  const [distributionMode, setDistributionMode] = useState<'builders' | 'referral'>('builders');
  const [hiddenBuilderIds, setHiddenBuilderIds] = useState<string[]>([]);
  const [hiddenReferralIds, setHiddenReferralIds] = useState<string[]>([]);
  const [areaNote, setAreaNote] = useState('');

  const buyerName = useMemo(() => [buyerFirstName.trim(), buyerLastName.trim()].filter(Boolean).join(' '), [buyerFirstName, buyerLastName]);

  useEffect(() => {
    (async () => {
      const [profile, allBuilders] = await Promise.all([loadProfile(), loadBuilders()]);
      setBuilders((allBuilders || []).filter((x) => x.active !== false && !x.hidden));
      if (profile) {
        setRealtorName(profile.name || '');
        setBrokerage(profile.brokerage || '');
        setRealtorEmail(profile.email || '');
        setRealtorPhone(profile.phone || '');
        setCity((prev) => prev || profile.defaultArea || '');
        setStateName((prev) => prev || profile.defaultState || 'TX');
        setBuilderRadiusMiles(profile.defaultBuilderRadiusMiles || 12);
      }
      await pullCurrentLocation(false);
    })();
  }, []);

  async function pullCurrentLocation(forceMessage: boolean) {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (forceMessage) Alert.alert('Location needed', 'Allow location so PackRep can prefill city, ZIP, state, county, and find nearby builders.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = current.coords.latitude;
      const lon = current.coords.longitude;
      const nextRegion = { latitude: lat, longitude: lon, latitudeDelta: deltaForMiles(builderRadiusMiles), longitudeDelta: deltaForMiles(builderRadiusMiles) };
      setCenterLat(lat); setCenterLon(lon); setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 800);
      await fillPlace(lat, lon);
    } catch {
      if (forceMessage) Alert.alert('Location error', 'Could not pull your current location right now.');
    } finally { setLoadingLocation(false); }
  }

  async function fillPlace(lat: number, lon: number) {
    try {
      const lookup = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      const first = lookup?.[0];
      if (first) {
        const nextCity = safeText(first.city || first.subregion || first.district);
        const nextZip = safeText(first.postalCode);
        const nextState = safeText(first.region || first.isoCountryCode || stateName || 'TX');
        const nextCounty = safeText(first.subregion || first.district || first.city);
        if (nextCity) setCity(nextCity);
        if (nextZip) { setZip(nextZip); setZipCodes((prev) => Array.from(new Set([nextZip, ...prev.filter(Boolean)])).slice(0, 8)); }
        if (nextState) setStateName(nextState);
        if (nextCounty) setCounty(nextCounty);
      }
    } catch {
      // ignore
    }
  }

  function clearAreaPrefill() {
    setCity('');
    setZip('');
    setZipCodes([]);
    setCounty('');
    setStateName('');
  }

  const foundBuilders = useMemo(() => {
    const center = { latitude: centerLat, longitude: centerLon };
    return builders
      .map((b) => ({ builder: b, miles: distanceMiles(center, { latitude: b.locationLat, longitude: b.locationLon }) }))
      .filter((row) => row.miles <= builderRadiusMiles && !hiddenBuilderIds.includes(row.builder.id))
      .sort((a, b) => a.miles - b.miles);
  }, [builders, centerLat, centerLon, builderRadiusMiles, hiddenBuilderIds]);

  const foundReferrals = useMemo(() => {
    const stateKey = stateName.trim().toUpperCase();
    const cityKey = city.trim().toLowerCase();
    return referralRealtors
      .filter((r) => r.state.toUpperCase() === stateKey || !stateKey)
      .filter((r) => !hiddenReferralIds.includes(r.id))
      .sort((a, b) => Number(!(a.city.toLowerCase().includes(cityKey))) - Number(!(b.city.toLowerCase().includes(cityKey))));
  }, [stateName, city, hiddenReferralIds]);

  function removeZip(z: string) { setZipCodes((prev) => prev.filter((x) => x !== z)); }
  function removeBuilder(builderItem: Builder) { setHiddenBuilderIds((prev) => [...prev, builderItem.id]); }
  function removeReferral(id: string) { setHiddenReferralIds((prev) => [...prev, id]); }

  async function saveLead() {
    if (!buyerName.trim()) { Alert.alert('Missing', 'Buyer name is required.'); return; }
    const lead: Lead = {
      id: makeId('L'),
      createdAt: nowStamp(),
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim() || undefined,
      buyerEmail: buyerEmail.trim() || undefined,
      city: city.trim() || undefined,
      zip: zip.trim() || undefined,
      zipCodes: zipCodes,
      state: stateName.trim() || undefined,
      county: county.trim() || undefined,
      priceMax: digitsOnly(priceMax) || undefined,
      bedsMin: bedsMin.trim() || undefined,
      bathsMin: bathsMin.trim() || undefined,
      buildType: buildType.trim() || undefined,
      builderRadiusMiles,
      locationLat: centerLat,
      locationLon: centerLon,
      notes: [notes.trim(), areaNote.trim() ? `Area note: ${areaNote.trim()}` : '', `Distribution: ${distributionMode === 'builders' ? foundBuilders.map((x) => x.builder.communityName).join(', ') : foundReferrals.map((x) => `${x.name} (${x.city})`).join(', ')}`].filter(Boolean).join('\n\n') || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
      buyerPhotoUrl: buyerPhotoUrl.trim() || undefined,
      followUpAt: followUpAt.trim() || undefined,
      realtorName: realtorName.trim() || undefined,
      realtorEmail: realtorEmail.trim() || undefined,
      realtorPhone: realtorPhone.trim() || undefined,
      brokerage: brokerage.trim() || undefined,
      distributionMode,
      distributionTargets: distributionMode === 'builders' ? foundBuilders.map((x) => x.builder.id) : foundReferrals.map((x) => x.id),
      pack: { salesCounselor: true, creditRepair: false, loanOfficer: false, builder: true, custom: false },
    };
    await upsertLead(lead);
    onSaved(lead.id);
  }

  const prefillLine = [city || 'Area', zip || null, stateName || null, county ? `${county}` : null].filter(Boolean).join(' • ');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.card}>
          <Text style={s.h1}>New Lead</Text>
          <Text style={s.small}>Map first. Pull ZIPs and area info, circle the target, trim the distribution list, then finish the lead.</Text>
          <View style={styles.stepRow}>{STEPS.map((label, i) => <View key={label} style={[styles.stepChip, i === step && styles.stepChipActive]}><Text style={[styles.stepTxt, i === step && styles.stepTxtActive]}>{i + 1}. {label}</Text></View>)}</View>
        </View>

        {step === 0 && (
          <>
            <View style={s.card}>
              <Text style={s.h2}>Step 1 — Find Area</Text>
              <Text style={s.small}>Move the map under the center dot, then widen or tighten the search radius. PackRep prefills the town, ZIP, state, and county from that location.</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>First Name</Text>
                  <TextInput style={s.input} value={buyerFirstName} onChangeText={setBuyerFirstName} placeholder='First name' placeholderTextColor='#7b92ae' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Last Name</Text>
                  <TextInput style={s.input} value={buyerLastName} onChangeText={setBuyerLastName} placeholder='Last name' placeholderTextColor='#7b92ae' />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Phone</Text>
                  <TextInput style={s.input} value={buyerPhone} onChangeText={setBuyerPhone} placeholder='Phone' placeholderTextColor='#7b92ae' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Email</Text>
                  <TextInput style={s.input} value={buyerEmail} onChangeText={setBuyerEmail} placeholder='Email' autoCapitalize='none' placeholderTextColor='#7b92ae' />
                </View>
              </View>
              <View style={{ marginTop: 14, gap: 10 }}>
                <Pressable style={s.btn} onPress={() => pullCurrentLocation(true)}><Text style={s.btnText}>{loadingLocation ? 'Finding…' : 'Use My Current Location'}</Text></Pressable>
              </View>
              <View style={styles.mapWrap}>
                <MapView
                  ref={(r) => (mapRef.current = r)}
                  style={StyleSheet.absoluteFillObject}
                  region={region}
                  onRegionChangeStart={clearAreaPrefill}
                  onRegionChangeComplete={(r) => { setRegion(r); setCenterLat(r.latitude); setCenterLon(r.longitude); fillPlace(r.latitude, r.longitude); }}
                >
                  <Marker coordinate={{ latitude: centerLat, longitude: centerLon }} pinColor={colors.accent} />
                  <Circle center={{ latitude: centerLat, longitude: centerLon }} radius={metersFromMiles(builderRadiusMiles)} strokeColor='rgba(244,200,75,0.85)' fillColor='rgba(244,200,75,0.10)' />
                </MapView>
                <View pointerEvents='none' style={styles.centerDot}><View style={styles.centerDotInner} /></View>
              </View>
              <View style={styles.radiusRow}>
                <Pressable style={styles.radiusBtn} onPress={() => setBuilderRadiusMiles((m) => Math.max(2, m - 2))}><Text style={styles.radiusBtnTxt}>−</Text></Pressable>
                <Text style={styles.radiusLabel}>Radius: {builderRadiusMiles} miles</Text>
                <Pressable style={styles.radiusBtn} onPress={() => setBuilderRadiusMiles((m) => Math.min(75, m + 2))}><Text style={styles.radiusBtnTxt}>+</Text></Pressable>
              </View>
              <View style={[styles.prefillBox, { marginTop: 12 }]}><Text style={[s.small, { color: colors.text }]}>Prefilled: {prefillLine}</Text></View>
              {!!zipCodes.length && (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {zipCodes.map((z) => (
                    <Pressable key={z} style={[s.chip, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={() => removeZip(z)}><Text style={s.chipTxt}>{z}</Text><Text style={[s.chipTxt, { color: '#fda4af' }]}>✕</Text></Pressable>
                  ))}
                </View>
              )}
              <View style={{ gap: 10, marginTop: 14 }}>
                <Pressable style={s.btn} onPress={() => setStep(1)}><Text style={s.btnText}>Next — Circle It</Text></Pressable>
                <Pressable style={s.btnGhost} onPress={onCancel}><Text style={s.btnGhostText}>Cancel</Text></Pressable>
              </View>
            </View>
          </>
        )}

        {step === 1 && (
          <View style={s.card}>
            <Text style={s.h2}>Step 2 — Circle the Target Area</Text>
            <Text style={s.small}>This is the visual target area step. Pan and zoom until the circle frames the real search zone. The removable distribution list comes next.</Text>
            <View style={styles.mapWrap}>
              <MapView style={StyleSheet.absoluteFillObject} region={region} onRegionChangeComplete={(r) => setRegion(r)}>
                <Circle center={{ latitude: region.latitude, longitude: region.longitude }} radius={metersFromMiles(builderRadiusMiles)} strokeColor='rgba(255,75,75,0.95)' fillColor='rgba(255,75,75,0.10)' />
              </MapView>
              <View pointerEvents='none' style={styles.circleFrame} />
            </View>
            <Text style={s.label}>Area Notes</Text>
            <TextInput style={[s.input, { minHeight: 92, textAlignVertical: 'top' }]} multiline value={areaNote} onChangeText={setAreaNote} placeholder='North side of town, closer to schools, avoid east side, or any other area instructions.' placeholderTextColor='#7b92ae' />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable style={[s.btnGhost, { flex: 1 }]} onPress={() => setStep(0)}><Text style={s.btnGhostText}>Back</Text></Pressable>
              <Pressable style={[s.btn, { flex: 1 }]} onPress={() => setStep(2)}><Text style={s.btnText}>Next — Distribution</Text></Pressable>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={s.card}>
            <Text style={s.h2}>Step 3 — Distribution List</Text>
            <Text style={s.small}>Trim the list down. This is what gets pushed out after you finish the lead.</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable style={[s.chip, distributionMode === 'builders' && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setDistributionMode('builders')}><Text style={[s.chipTxt, distributionMode === 'builders' && { color: colors.bg }]}>Builders</Text></Pressable>
              <Pressable style={[s.chip, distributionMode === 'referral' && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setDistributionMode('referral')}><Text style={[s.chipTxt, distributionMode === 'referral' && { color: colors.bg }]}>Realtor Referral</Text></Pressable>
            </View>

            {distributionMode === 'builders' ? (
              <View style={{ gap: 10, marginTop: 14 }}>
                {foundBuilders.map(({ builder, miles }) => (
                  <View key={builder.id} style={styles.distRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.listTitle}>{builder.communityName}</Text>
                      <Text style={s.listSub}>{builder.name} • {Math.round(miles)} mi • {builder.address}</Text>
                    </View>
                    <Pressable style={styles.removeBtn} onPress={() => removeBuilder(builder)}><Text style={styles.removeTxt}>Remove</Text></Pressable>
                  </View>
                ))}
                {!foundBuilders.length && <Text style={[s.small, { marginTop: 8 }]}>No builders left in the list. Go back and widen the radius or reset hidden builders.</Text>}
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 14 }}>
                {foundReferrals.map((ref) => (
                  <View key={ref.id} style={styles.distRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.listTitle}>{ref.name}</Text>
                      <Text style={s.listSub}>{ref.brokerage} • {ref.city}, {ref.state}</Text>
                    </View>
                    <Pressable style={styles.removeBtn} onPress={() => removeReferral(ref.id)}><Text style={styles.removeTxt}>Remove</Text></Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable style={[s.btnGhost, { flex: 1 }]} onPress={() => setStep(1)}><Text style={s.btnGhostText}>Back</Text></Pressable>
              <Pressable style={[s.btn, { flex: 1 }]} onPress={() => setStep(3)}><Text style={s.btnText}>Next — Finish Lead</Text></Pressable>
            </View>
          </View>
        )}

        {step === 3 && (
          <>
            <View style={s.card}>
              <Text style={s.h2}>Step 4 — Finish Lead</Text>
              <Text style={s.small}>Town, ZIP, state, and county are already prefilled from the map steps above.</Text>
              <View style={[styles.prefillBox, { marginTop: 14 }]}><Text style={[s.small, { color: colors.text }]}>{prefillLine}</Text></View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>First Name *</Text>
                  <TextInput style={s.input} value={buyerFirstName} onChangeText={setBuyerFirstName} placeholder='First name' placeholderTextColor='#7b92ae' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Last Name</Text>
                  <TextInput style={s.input} value={buyerLastName} onChangeText={setBuyerLastName} placeholder='Last name' placeholderTextColor='#7b92ae' />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Phone</Text>
                  <TextInput style={s.input} value={buyerPhone} onChangeText={setBuyerPhone} placeholder='Phone' placeholderTextColor='#7b92ae' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Email</Text>
                  <TextInput style={s.input} value={buyerEmail} onChangeText={setBuyerEmail} placeholder='Email' autoCapitalize='none' placeholderTextColor='#7b92ae' />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Price Max</Text>
                  <TextInput style={s.input} value={priceMax} onChangeText={(v) => setPriceMax(formatMoneyInput(v))} placeholder='350,000' placeholderTextColor='#7b92ae' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Build Type</Text>
                  <TextInput style={s.input} value={buildType} onChangeText={setBuildType} placeholder='Any' placeholderTextColor='#7b92ae' />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Beds</Text>
                  <TextInput style={s.input} value={bedsMin} onChangeText={setBedsMin} placeholder='3' placeholderTextColor='#7b92ae' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Baths</Text>
                  <TextInput style={s.input} value={bathsMin} onChangeText={setBathsMin} placeholder='2' placeholderTextColor='#7b92ae' />
                </View>
              </View>
              <Text style={s.label}>Facebook / Profile Link</Text>
              <TextInput style={s.input} value={facebookUrl} onChangeText={setFacebookUrl} placeholder='https://facebook.com/...' autoCapitalize='none' placeholderTextColor='#7b92ae' />
              <Text style={s.label}>Photo URL</Text>
              <TextInput style={s.input} value={buyerPhotoUrl} onChangeText={setBuyerPhotoUrl} placeholder='https://image...' autoCapitalize='none' placeholderTextColor='#7b92ae' />
              <Text style={s.label}>Follow-up Date</Text>
              <TextInput style={s.input} value={followUpAt} onChangeText={setFollowUpAt} placeholder='2026-11-01 09:00' placeholderTextColor='#7b92ae' />
              <Text style={s.label}>Notes</Text>
              <TextInput style={[s.input, { minHeight: 88, textAlignVertical: 'top' }]} multiline value={notes} onChangeText={setNotes} placeholder='What the customer wants, schools, commute, objections, timing, or how to present it.' placeholderTextColor='#7b92ae' />
            </View>

            <View style={s.card}>
              <Text style={s.h2}>Realtor / Representation</Text>
              <Text style={s.label}>Realtor Name</Text>
              <TextInput style={s.input} value={realtorName} onChangeText={setRealtorName} placeholder='Your name' placeholderTextColor='#7b92ae' />
              <Text style={s.label}>Brokerage</Text>
              <TextInput style={s.input} value={brokerage} onChangeText={setBrokerage} placeholder='Brokerage' placeholderTextColor='#7b92ae' />
              <Text style={s.label}>Realtor Email</Text>
              <TextInput style={s.input} value={realtorEmail} onChangeText={setRealtorEmail} placeholder='Email' placeholderTextColor='#7b92ae' />
              <Text style={s.label}>Realtor Phone</Text>
              <TextInput style={s.input} value={realtorPhone} onChangeText={setRealtorPhone} placeholder='Phone' placeholderTextColor='#7b92ae' />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Pressable style={[s.btnGhost, { flex: 1 }]} onPress={() => setStep(2)}><Text style={s.btnGhostText}>Back</Text></Pressable>
                <Pressable style={[s.btn, { flex: 1 }]} onPress={saveLead}><Text style={s.btnText}>Save Lead</Text></Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  stepChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  stepChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  stepTxt: { color: colors.text, fontWeight: '800', fontSize: 12 },
  stepTxtActive: { color: colors.bg },
  mapWrap: { height: 300, overflow: 'hidden', borderRadius: 18, marginTop: 14, borderWidth: 1, borderColor: colors.border },
  centerDot: { position: 'absolute', left: '50%', top: '50%', marginLeft: -18, marginTop: -18, width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,18,32,0.4)' },
  centerDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  circleFrame: { position: 'absolute', left: '18%', top: '18%', width: '64%', height: '64%', borderRadius: 999, borderWidth: 5, borderColor: 'rgba(255,75,75,0.92)' },
  radiusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  radiusBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radiusBtnTxt: { color: colors.text, fontSize: 24, fontWeight: '900' },
  radiusLabel: { color: colors.text, fontWeight: '900', fontSize: 16 },
  prefillBox: { padding: 12, borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  distRow: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  removeBtn: { backgroundColor: 'rgba(239,68,68,0.16)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  removeTxt: { color: '#fecaca', fontWeight: '900' },
});
