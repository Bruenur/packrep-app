import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Linking, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import { categoryColor, categoryEmoji } from '../data/demoMapPins';
import { colors, s } from '../ui/styles';
import {
  Builder,
  FavoritePin,
  Lead,
  UsedHome,
  loadBuilders,
  loadFavoritePins,
  loadLeads,
  loadUsedHomes,
  parseFollowUpDate,
  DEFAULT_PIN_PREFS,
  PinLayerPrefs,
  loadPinLayerPrefs,
} from '../lib/storage';
import { fetchNearbyPlaces, NearbyPin } from '../lib/nearbyPlaces';

const HERO_HEIGHT = Math.round(Dimensions.get('window').height * 0.66);
const WORLD_REGION: Region = { latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 };

function isValidCoord(lat?: number, lon?: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180;
}

function isDue(lead: Lead) {
  const dt = parseFollowUpDate(lead.followUpAt);
  return !!dt && dt.getTime() <= Date.now();
}

function fmtMoney(v?: number | null) {
  return Number.isFinite(Number(v)) ? `$${Number(v).toLocaleString()}` : '—';
}

function directionsUrl(lat: number, lon: number, label?: string) {
  const encoded = encodeURIComponent(label || `${lat},${lon}`);
  if (Platform.OS === 'ios') return `http://maps.apple.com/?ll=${lat},${lon}&q=${encoded}`;
  return `geo:${lat},${lon}?q=${lat},${lon}(${encoded})`;
}

function countWithinBounds<T extends { latitude: number; longitude: number }>(items: T[], region: Region) {
  const latMin = region.latitude - region.latitudeDelta / 2;
  const latMax = region.latitude + region.latitudeDelta / 2;
  const lonMin = region.longitude - region.longitudeDelta / 2;
  const lonMax = region.longitude + region.longitudeDelta / 2;
  return items.filter((x) => x.latitude >= latMin && x.latitude <= latMax && x.longitude >= lonMin && x.longitude <= lonMax).length;
}

function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function withinRegion(lat: number, lon: number, region: Region) {
  const latMin = region.latitude - region.latitudeDelta / 2;
  const latMax = region.latitude + region.latitudeDelta / 2;
  const lonMin = region.longitude - region.longitudeDelta / 2;
  const lonMax = region.longitude + region.longitudeDelta / 2;
  return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
}

function PinBubble({ color, icon, active }: { color: string; icon: string; active?: boolean }) {
  return (
    <View style={[styles.pinWrap, active && styles.pinWrapActive]}>
      <View style={[styles.pinHead, { backgroundColor: color }]}>
        <Text style={styles.pinEmoji}>{icon}</Text>
      </View>
      <View style={[styles.pinTail, { borderTopColor: color }]} />
    </View>
  );
}

export default function PocketScreen({
  onNewLead,
  onOpenLeads,
  onOpenFavorites,
  onOpenBuilders,
  onOpenUsedHomes,
  onOpenWall,
  onOpenLegal,
  onScheduleBuilder,
}: {
  onNewLead: () => void;
  onOpenLeads: () => void;
  onOpenFavorites: () => void;
  onOpenSettings?: () => void;
  onOpenDeck?: () => void;
  onOpenBuilders?: () => void;
  onOpenUsedHomes?: () => void;
  onOpenWall?: () => void;
  onOpenLegal: () => void;
  onOpenMortgage?: () => void;
  onOpenLead?: (leadId: string) => void;
  onScheduleBuilder: (builder: Builder) => void;
}) {
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>(WORLD_REGION);
  const [userPoint, setUserPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [usedHomes, setUsedHomes] = useState<UsedHome[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [favoritePins, setFavoritePins] = useState<FavoritePin[]>([]);
  const [nearbyPins, setNearbyPins] = useState<NearbyPin[]>([]);
  const [layers, setLayers] = useState<PinLayerPrefs>(DEFAULT_PIN_PREFS);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [selectedBuilderFlip, setSelectedBuilderFlip] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    (async () => {
      const [b, homes, l, fav, prefs] = await Promise.all([loadBuilders(), loadUsedHomes(), loadLeads(), loadFavoritePins(), loadPinLayerPrefs()]);
      setBuilders((b || []).filter((x) => x.active !== false && !x.hidden && isValidCoord(x.locationLat, x.locationLon)));
      setUsedHomes((homes || []).filter((x) => x.active !== false && !x.hidden && isValidCoord(x.latitude, x.longitude)));
      setLeads(l || []);
      setFavoritePins((fav || []).filter((x) => isValidCoord(x.latitude, x.longitude)));
      setLayers(prefs);
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!alive) return;
        const next = { lat: current.coords.latitude, lon: current.coords.longitude };
        setUserPoint(next);
        const focused = { latitude: next.lat, longitude: next.lon, latitudeDelta: 0.12, longitudeDelta: 0.12 };
        setRegion(focused);
        requestAnimationFrame(() => mapRef.current?.animateToRegion(focused, 700));
        const pins = await fetchNearbyPlaces(next);
        if (!alive) return;
        setNearbyPins(pins);
      } catch {
      }
    })();
    return () => { alive = false; };
  }, []);

  const dueCount = useMemo(() => leads.filter(isDue).length, [leads]);
  const visibleBuilders = useMemo(() => builders.filter((b) => layers.builders && withinRegion(b.locationLat, b.locationLon, region)), [builders, layers, region]);
  const visibleUsedHomes = useMemo(() => usedHomes.filter((h) => layers.usedHomes && withinRegion(h.latitude, h.longitude, region)), [usedHomes, layers, region]);
  const shownNearby = useMemo(() => nearbyPins.filter((pin) => !!(layers as any)[pin.category] && withinRegion(pin.latitude, pin.longitude, region)), [nearbyPins, layers, region]);
  const shownFavorites = useMemo(() => favoritePins.filter((pin) => layers.favorite && withinRegion(pin.latitude, pin.longitude, region)), [favoritePins, layers, region]);

  const newBuildCount = countWithinBounds(visibleBuilders.map((b) => ({ latitude: b.locationLat, longitude: b.locationLon })), region);
  const usedHomeCount = countWithinBounds(visibleUsedHomes.map((h) => ({ latitude: h.latitude, longitude: h.longitude })), region);
  const pinCount = shownNearby.length + shownFavorites.length;

  const selectedBuilderGroup = useMemo(() => {
    if (!selectedBuilder) return [];
    return visibleBuilders
      .filter((b) => b.name === selectedBuilder.name && milesBetween(b.locationLat, b.locationLon, selectedBuilder.locationLat, selectedBuilder.locationLon) <= 3)
      .sort((a, b) => a.communityName.localeCompare(b.communityName));
  }, [visibleBuilders, selectedBuilder]);

  const selectedBuilderIndex = useMemo(() => {
    if (!selectedBuilder) return -1;
    return selectedBuilderGroup.findIndex((b) => b.id === selectedBuilder.id);
  }, [selectedBuilderGroup, selectedBuilder]);

  function jumpSelectedBuilder(step: number) {
    if (!selectedBuilderGroup.length || selectedBuilderIndex < 0) return;
    const nextIndex = (selectedBuilderIndex + step + selectedBuilderGroup.length) % selectedBuilderGroup.length;
    const next = selectedBuilderGroup[nextIndex];
    setSelectedBuilderFlip(false);
    setSelectedBuilder(next);
    requestAnimationFrame(() => mapRef.current?.animateToRegion({
      latitude: next.locationLat,
      longitude: next.locationLon,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    }, 300));
  }

  const cardSwipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx <= -30) jumpSelectedBuilder(1);
      else if (gestureState.dx >= 30) jumpSelectedBuilder(-1);
    },
  }), [selectedBuilderGroup, selectedBuilderIndex, region, selectedBuilder]);

  function openDirections(lat: number, lon: number, label: string) {
    Linking.openURL(directionsUrl(lat, lon, label));
  }

  function callBuilder(builder: Builder) {
    const phone = builder.salesCounselorPhone || '';
    if (phone) Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
  }

  return (
    <View style={s.screen}>
      <View style={styles.heroWrap}>
        <MapView
          ref={(r) => (mapRef.current = r)}
          style={styles.map}
          region={region}
          initialRegion={WORLD_REGION}
          showsUserLocation={false}
          toolbarEnabled={Platform.OS === 'android'}
          onRegionChangeComplete={(r) => setRegion(r)}
        >
          {userPoint && (
            <Marker coordinate={{ latitude: userPoint.lat, longitude: userPoint.lon }} anchor={{ x: 0.5, y: 1 }}>
              <PinBubble color={colors.accent} icon='📍' active />
            </Marker>
          )}

          {visibleBuilders.map((b) => (
            <Marker
              key={b.id}
              coordinate={{ latitude: b.locationLat, longitude: b.locationLon }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => { setSelectedBuilderFlip(false); setSelectedBuilder(b); }}
            >
              <PinBubble color={b.sponsored ? '#f59e0b' : '#D18A18'} icon='🏠' active={selectedBuilder?.id === b.id} />
            </Marker>
          ))}

          {visibleUsedHomes.map((home) => (
            <Marker key={home.id} coordinate={{ latitude: home.latitude, longitude: home.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <PinBubble color='#5AA35A' icon='🏡' />
            </Marker>
          ))}

          {shownFavorites.map((pin) => (
            <Marker key={pin.id} coordinate={{ latitude: pin.latitude, longitude: pin.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <PinBubble color={categoryColor(pin.category)} icon={categoryEmoji(pin.category)} />
            </Marker>
          ))}

          {shownNearby.map((pin) => (
            <Marker key={pin.id} coordinate={{ latitude: pin.latitude, longitude: pin.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <PinBubble color={categoryColor(pin.category)} icon={categoryEmoji(pin.category)} />
            </Marker>
          ))}
        </MapView>

        {selectedBuilder ? (
          <Pressable
            style={styles.mapDismissLayer}
            pointerEvents='box-only'
            onPress={() => { setSelectedBuilder(null); setSelectedBuilderFlip(false); }}
          />
        ) : null}

        {heroVisible && (
          <View style={styles.topOverlay}>
            <Pressable style={styles.closeBtn} onPress={() => setHeroVisible(false)}>
              <Text style={styles.closeTxt}>✕</Text>
            </Pressable>
            <Text style={styles.topBadge}>No mistakes. Just business.</Text>
            <Text style={styles.topSub}>Open app. Find location. Show new builds, schools, and what matters nearby.</Text>
            {!!userPoint && <Text style={styles.helperText}>You are here • nearby places auto-loaded</Text>}
          </View>
        )}

        {selectedBuilder ? (
          <View style={styles.selectedCard}>
            <View style={styles.cardSwipeArea} {...cardSwipeResponder.panHandlers}>
              <View style={styles.cardNavTopRow}>
                <Pressable style={styles.cardNavTapBtn} onPress={() => jumpSelectedBuilder(-1)}>
                  <Text style={styles.cardSwipeArrow}>‹</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTag}>{selectedBuilder.name}</Text>
                  <Text style={styles.cardCommunity}>{selectedBuilder.communityName}</Text>
                  <Text style={styles.cardSwipeHintText}>
                    {selectedBuilderGroup.length > 1
                      ? `${selectedBuilderIndex + 1} of ${selectedBuilderGroup.length} nearby communities`
                      : 'Community'}
                  </Text>
                </View>
                <Pressable style={styles.cardNavTapBtn} onPress={() => jumpSelectedBuilder(1)}>
                  <Text style={styles.cardSwipeArrow}>›</Text>
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.cardBodyArea} onPress={() => setSelectedBuilderFlip((v) => !v)}>
              {!selectedBuilderFlip ? (
                <>
                  <Text style={styles.cardMeta}>Schools: {(selectedBuilder.schools || []).slice(0, 2).join(' • ') || 'See details'}</Text>
                  <Text style={styles.cardPrice}>Starting at {fmtMoney(selectedBuilder.minPrice)}</Text>
                  <Text style={styles.tapHint}>
                    {selectedBuilderGroup.length > 1
                      ? 'Swipe the top or tap arrows for nearby communities • tap this section for actions'
                      : 'Tap this section for actions'}
                  </Text>
                </>
              ) : (
                <View style={{ gap: 10, marginTop: 2 }}>
                  <Pressable style={styles.viewBtn} onPress={() => callBuilder(selectedBuilder)}><Text style={styles.viewBtnTxt}>Call Builder</Text></Pressable>
                  <Pressable style={styles.viewBtn} onPress={() => openDirections(selectedBuilder.locationLat, selectedBuilder.locationLon, selectedBuilder.communityName)}><Text style={styles.viewBtnTxt}>Driving Directions</Text></Pressable>
                  <Pressable style={styles.viewBtn} onPress={() => onScheduleBuilder(selectedBuilder)}><Text style={styles.viewBtnTxt}>Schedule Appointment</Text></Pressable>
                </View>
              )}
            </Pressable>
          </View>
        ) : null}

        <View style={styles.fabColumn}>
          <Pressable style={styles.fabPrimary} onPress={onNewLead}><Text style={styles.fabPrimaryTxt}>+ New Lead</Text></Pressable>
        </View>
      </View>

      <View style={styles.bottomTray}>
        <View style={styles.liveBoardCard}>
          <View style={styles.kpiRow}>
            <Pressable style={[styles.kpiCard, styles.kpiBuild]} onPress={onOpenBuilders || (() => {})}>
              <Text style={styles.kpiTop}>New Builds</Text>
              <Text style={styles.kpiEmoji}>🏠</Text>
              <Text style={styles.kpiNum}>{newBuildCount}</Text>
            </Pressable>
            <Pressable style={[styles.kpiCard, styles.kpiPins]} onPress={onOpenFavorites}>
              <Text style={styles.kpiTop}>Pins</Text>
              <Text style={styles.kpiEmoji}>📍</Text>
              <Text style={styles.kpiNum}>{pinCount}</Text>
            </Pressable>
            <Pressable style={[styles.kpiCard, styles.kpiFollow]} onPress={onOpenWall || (() => {})}>
              <Text style={styles.kpiTop}>Community</Text>
              <Text style={styles.kpiEmoji}>💬</Text>
              <Text style={styles.kpiNum}>Wall</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: { height: HERO_HEIGHT },
  map: { ...StyleSheet.absoluteFillObject },
  mapDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  topOverlay: {
    position: 'absolute',
    zIndex: 3,
    left: 16, right: 16, top: 14,
    backgroundColor: 'rgba(4,15,30,0.84)',
    borderRadius: 28, borderWidth: 1, borderColor: 'rgba(44,73,118,0.55)',
    paddingHorizontal: 22, paddingVertical: 18,
  },
  closeBtn: { position: 'absolute', right: 14, top: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  topBadge: { color: colors.text, fontSize: 25, fontWeight: '900', paddingRight: 28 },
  topSub: { color: '#C9D6E7', marginTop: 8, fontSize: 15, lineHeight: 22 },
  helperText: { color: '#F4F7FB', marginTop: 14, fontSize: 13, fontWeight: '800' },
  pinWrap: { alignItems: 'center' },
  pinWrapActive: { transform: [{ scale: 1.08 }] },
  pinHead: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },
  pinEmoji: { fontSize: 16 },
  pinTail: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -3 },
  selectedCard: { position: 'absolute', right: 18, top: 165, width: 255, backgroundColor: 'rgba(5,16,33,0.93)', borderColor: 'rgba(44,73,118,0.55)', borderWidth: 1, borderRadius: 24, padding: 16, zIndex: 4 },
  cardTag: { color: '#E8C447', fontSize: 16, fontWeight: '800' },
  cardCommunity: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 2 },
  cardMeta: { color: '#D0DCEC', fontSize: 13, lineHeight: 18, marginTop: 6 },
  cardPrice: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 8 },
  tapHint: { color: '#AFC3DA', fontSize: 12, fontWeight: '700', marginTop: 8 },
  viewBtn: { backgroundColor: 'rgba(14,34,62,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  viewBtnTxt: { color: colors.text, fontSize: 15, fontWeight: '800' },
  fabColumn: { position: 'absolute', right: 18, bottom: 14, gap: 12, zIndex: 3 },
  fabPrimary: { backgroundColor: colors.accent, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 16, minWidth: 200, alignItems: 'center' },
  fabPrimaryTxt: { color: '#071526', fontSize: 17, fontWeight: '900' },
  bottomTray: { flex: 1, backgroundColor: colors.bg, paddingBottom: 18, justifyContent: 'flex-start' },
  liveBoardCard: { marginTop: 8, marginHorizontal: 16, backgroundColor: 'rgba(4,15,30,0.92)', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(44,73,118,0.55)', padding: 14 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  kpiCard: { flex: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1 },
  kpiBuild: { backgroundColor: 'rgba(209,138,24,0.18)', borderColor: 'rgba(209,138,24,0.45)' },
  kpiUsed: { backgroundColor: 'rgba(90,163,90,0.18)', borderColor: 'rgba(90,163,90,0.45)' },
  kpiPins: { backgroundColor: 'rgba(79,121,210,0.18)', borderColor: 'rgba(79,121,210,0.45)' },
  kpiFollow: { backgroundColor: 'rgba(135,92,214,0.18)', borderColor: 'rgba(135,92,214,0.45)' },
  kpiTop: { color: colors.text, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  kpiEmoji: { fontSize: 18, marginTop: 4 },
  kpiNum: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 6 },
  bottomQuickRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginHorizontal: 16, marginTop: 10 },
  bottomQuickBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 11, alignItems: 'center', backgroundColor: colors.panel },
  bottomQuickTxt: { color: colors.text, fontSize: 13, fontWeight: '800' },
});
