import React, { useMemo, useState } from 'react';
import { StatusBar, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/lib/AuthContext';
import PocketScreen from './src/screens/PocketScreen';
import IntakeScreen from './src/screens/IntakeScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import LeadDetailScreen from './src/screens/LeadDetailScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BuilderDeckScreen from './src/screens/BuilderDeckScreen';
import BuildersScreen from './src/screens/BuildersScreen';
import UsedHomesScreen from './src/screens/UsedHomesScreen';
import FollowUpsScreen from './src/screens/FollowUpsScreen';
import MortgageCalcScreen from './src/screens/MortgageCalcScreen';
import LegalDisclaimerScreen from './src/screens/LegalDisclaimerScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';
import CommunityWallScreen from './src/screens/CommunityWallScreen';
import OpenHouseRequestScreen from './src/screens/OpenHouseRequestScreen';
import { colors } from './src/ui/styles';
import { Builder } from './src/lib/storage';

export type ScreenKey =
  | 'home'
  | 'intake'
  | 'leads'
  | 'leadDetail'
  | 'favorites'
  | 'settings'
  | 'deck'
  | 'builders'
  | 'usedHomes'
  | 'followups'
  | 'mortgage'
  | 'legal'
  | 'appointment'
  | 'wall'
  | 'openHouseRequest';

type MenuItem = {
  key: string;
  label: string;
  onPress: () => void;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<ScreenKey>('home');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, loading } = useAuth();

  const title = useMemo(() => {
    switch (screen) {
      case 'home': return 'PackRep';
      case 'intake': return 'New Lead';
      case 'leads': return 'Leads';
      case 'leadDetail': return 'Lead Detail';
      case 'favorites': return 'Pins';
      case 'settings': return 'Settings';
      case 'deck': return 'Builder Deck';
      case 'builders': return 'New Builds';
      case 'usedHomes': return 'Used Homes';
      case 'followups': return 'Follow-ups';
      case 'mortgage': return 'Mortgage';
      case 'legal': return 'Legal';
      case 'appointment': return 'Schedule Appointment';
      case 'wall': return 'Community Wall';
      case 'openHouseRequest': return 'Open House Request';
      default: return 'PackRep';
    }
  }, [screen]);

  const go = (next: ScreenKey) => {
    setMenuOpen(false);
    setScreen(next);
  };

  const menuItems: MenuItem[] = [
    { key: 'home', label: 'Home', onPress: () => go('home') },
    { key: 'leads', label: 'Leads', onPress: () => go('leads') },
    { key: 'wall', label: 'Community Wall', onPress: () => go('wall') },
    { key: 'builders', label: 'New Builds', onPress: () => go('builders') },
    { key: 'usedHomes', label: 'Used Homes', onPress: () => go('usedHomes') },
    { key: 'pins', label: 'Pins', onPress: () => go('favorites') },
    { key: 'followups', label: 'Follow-ups', onPress: () => go('followups') },
    { key: 'settings', label: 'Settings', onPress: () => go('settings') },
    { key: 'legal', label: 'Legal', onPress: () => go('legal') },
  ];

  // Protected screens set
  const protectedScreens = new Set<ScreenKey>([
    'intake','leads','leadDetail','favorites','deck','builders','usedHomes','followups','appointment','wall','openHouseRequest'
  ]);

  function isProtected(s: ScreenKey) {
    return protectedScreens.has(s);
  }

  // If auth loading, show a simple loading message
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle='light-content' />
        <View style={[styles.body, { padding: 20 }]}>
          <Text style={{ color: colors.text }}>Loading authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle='light-content' />

      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen((v) => !v)}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        </View>

        {menuOpen && (
          <View style={styles.menuPanel}>
            {menuItems.map((item, idx) => (
              <Pressable
                key={item.key}
                style={[styles.menuItem, idx === menuItems.length - 1 && styles.menuItemLast]}
                onPress={item.onPress}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.body}>
        {screen === 'home' && (
          <PocketScreen
            onNewLead={() => setScreen('intake')}
            onOpenLeads={() => setScreen('leads')}
            onOpenFavorites={() => setScreen('favorites')}
            onOpenSettings={() => setScreen('settings')}
            onOpenDeck={() => setScreen('deck')}
            onOpenBuilders={() => setScreen('builders')}
            onOpenUsedHomes={() => setScreen('usedHomes')}
            onOpenWall={() => setScreen('wall')}
            onOpenLegal={() => setScreen('legal')}
            onOpenMortgage={() => setScreen('mortgage')}
            onOpenLead={(leadId) => { setSelectedLeadId(leadId); setScreen('leadDetail'); }}
            onScheduleBuilder={(builder) => { setSelectedBuilder(builder); setScreen('appointment'); }}
          />
        )}
        {screen === 'intake' && (isProtected('intake') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <IntakeScreen onCancel={() => setScreen('home')} onSaved={(leadId) => { setSelectedLeadId(leadId); setScreen('leadDetail'); }} />)}
        {screen === 'leads' && (isProtected('leads') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <LeadsScreen onBack={() => setScreen('home')} onOpenLead={(leadId) => { setSelectedLeadId(leadId); setScreen('leadDetail'); }} onNewLead={() => setScreen('intake')} />)}
        {screen === 'leadDetail' && (isProtected('leadDetail') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <LeadDetailScreen leadId={selectedLeadId} onBack={() => setScreen('leads')} />)}
        {screen === 'favorites' && (isProtected('favorites') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <FavoritesScreen onBack={() => setScreen('home')} />)}
        {screen === 'settings' && <SettingsScreen onBack={() => setScreen('home')} />}
        {screen === 'deck' && (isProtected('deck') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <BuilderDeckScreen onBack={() => setScreen('home')} />)}
        {screen === 'builders' && (isProtected('builders') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <BuildersScreen onBack={() => setScreen('home')} onRequestOpenHouse={(builder) => { setSelectedBuilder(builder); setScreen('openHouseRequest'); }} />)}
        {screen === 'usedHomes' && (isProtected('usedHomes') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <UsedHomesScreen onBack={() => setScreen('home')} />)}
        {screen === 'followups' && (isProtected('followups') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <FollowUpsScreen onBack={() => setScreen('home')} onOpenLead={(leadId) => { setSelectedLeadId(leadId); setScreen('leadDetail'); }} />)}
        {screen === 'mortgage' && <MortgageCalcScreen onBack={() => setScreen('home')} />}
        {screen === 'legal' && <LegalDisclaimerScreen onBack={() => setScreen('home')} />}
        {screen === 'appointment' && (isProtected('appointment') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <AppointmentScreen builder={selectedBuilder} onBack={() => setScreen('home')} onCreateLead={() => setScreen('intake')} />)}
        {screen === 'wall' && (isProtected('wall') && !user ? <SettingsScreen onBack={() => setScreen('home')} /> : <CommunityWallScreen onBack={() => setScreen('home')} />)}
        {screen === 'openHouseRequest' && (isProtected('openHouseRequest') && !user ? <SettingsScreen onBack={() => setScreen('builders')} /> : <OpenHouseRequestScreen builder={selectedBuilder} onBack={() => setScreen('builders')} />)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.text, fontSize: 36, fontWeight: '900' },
  menuBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  menuPanel: {
    position: 'absolute',
    top: 78,
    right: 16,
    width: 240,
    backgroundColor: '#081a2d',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  body: { flex: 1 },
});
