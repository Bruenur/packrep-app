import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { MembershipTier, ProfileRole, VerificationStatus, loadProfile, normalizeProfileRole, saveProfile } from "../lib/storage";
import { colors, s } from "../ui/styles";

const tiers: MembershipTier[] = ["free", "verified", "pro"];
const statuses: VerificationStatus[] = ["unverified", "pending", "verified"];
type AccountPath = "builder" | "broker";
type BuilderRole = "salesConsultant" | "marketing" | "builderAdmin";
type BrokerRole = "realtor" | "broker";

type AccountRole = BuilderRole | BrokerRole;

const builderRoleOptions: { key: BuilderRole; label: string }[] = [
  { key: "salesConsultant", label: "Sales Consultant" },
  { key: "builderAdmin", label: "Builder Admin" },
];

const brokerRoleOptions: { key: BrokerRole; label: string }[] = [
  { key: "broker", label: "Broker" },
  { key: "realtor", label: "Realtor®" },
];

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultArea, setDefaultArea] = useState("");
  const [defaultState, setDefaultState] = useState("TX");
  const [defaultBuilderRadiusMiles, setDefaultBuilderRadiusMiles] = useState("25");
  const [membershipTier, setMembershipTier] = useState<MembershipTier>("free");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");
  const [role, setRole] = useState<ProfileRole>("realtor");
  // Auth UI state
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authLocalLoading, setAuthLocalLoading] = useState(false);
  const [accountPath, setAccountPath] = useState<AccountPath>("builder");
  const [accountRole, setAccountRole] = useState<AccountRole>("builderAdmin");
  const [accountFirstName, setAccountFirstName] = useState("");
  const [accountLastName, setAccountLastName] = useState("");
  const [accountPhone, setAccountPhone] = useState("");
  const [accountBrokerage, setAccountBrokerage] = useState("");
  const [accountRealtorLicenseNumber, setAccountRealtorLicenseNumber] = useState("");
  const [accountBrokerEmailForVerification, setAccountBrokerEmailForVerification] = useState("");
  const [accountBrokerageName, setAccountBrokerageName] = useState("");
  const [accountBrokerLicenseNumber, setAccountBrokerLicenseNumber] = useState("");
  const [accountBuilderCompany, setAccountBuilderCompany] = useState("");
  const [accountDivisionName, setAccountDivisionName] = useState("");
  const [accountMarketingTeamEmail, setAccountMarketingTeamEmail] = useState("");
  const [accountCompanyEmail, setAccountCompanyEmail] = useState("");

  // useAuth may throw if AuthProvider isn't wired yet; handle gracefully
  let auth: any = null;
  try {
    auth = useAuth();
  } catch (e) {
    auth = null;
  }

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (!p) return;
      setName(p.name || "");
      setBrokerage(p.brokerage || "");
      setLicenseNumber(p.licenseNumber || "");
      setEmail(p.email || "");
      setPhone(p.phone || "");
      setDefaultArea(p.defaultArea || "");
      setDefaultState(p.defaultState || "TX");
      setDefaultBuilderRadiusMiles(String(p.defaultBuilderRadiusMiles || 25));
      setMembershipTier(p.membershipTier || "free");
      setVerificationStatus(p.verificationStatus || "unverified");
      setRole(normalizeProfileRole(p.role));
    })();
  }, []);

  function deriveRoleFromSelection(path: AccountPath, selectedRole: AccountRole): ProfileRole {
    return path === "builder" ? "builder" : "realtor";
  }

  async function save() {
    const existingProfile = await loadProfile();
    const nextRole = normalizeProfileRole(role || existingProfile?.role);
    await saveProfile({
      ...(existingProfile || {}),
      name,
      brokerage,
      licenseNumber,
      email,
      phone,
      defaultArea,
      defaultState,
      defaultBuilderRadiusMiles: parseInt(defaultBuilderRadiusMiles || "25", 10) || 25,
      membershipTier,
      verificationStatus,
      role: nextRole,
    });
    setRole(nextRole);
    Alert.alert("Saved", "Profile and access settings updated.");
  }

  const missingProfileFields = [
    !name.trim() ? "Realtor name" : null,
    !brokerage.trim() ? "Brokerage company" : null,
    !licenseNumber.trim() ? "Realtor license / ID" : null,
    !phone.trim() ? "Phone number" : null,
    !email.trim() ? "Email" : null,
  ].filter(Boolean) as string[];

  const profileComplete = missingProfileFields.length === 0;
  const isAuthenticated = !!auth?.user;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40, paddingTop: 24 }}>
        <View style={[s.card, { marginTop: 24 }]}>
          <Text style={s.h1}>Settings</Text>
          <Text style={s.small}>Set your PackRep profile, area defaults, and paid-access prototype settings.</Text>
        </View>

        {!isAuthenticated ? (
          <View style={[s.card, { marginTop: 8, paddingTop: 20, paddingBottom: 20 }]}> 
            <View style={{ alignItems: "center", marginBottom: 12, paddingTop: 8 }}>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: 1, textAlign: 'center' }}>PackRep</Text>
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "800", marginTop: 6, textAlign: 'center' }}>Connect. Collaborate. Close.</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={[s.btn, { flex: 1 }, authMode === 'signIn' ? {} : { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => { setAuthMode('signIn'); setAuthError(null); setAuthNotice(null); }}
              >
                <Text style={[s.btnText, authMode !== 'signIn' && { color: colors.text }]}>Sign In</Text>
              </Pressable>
              <Pressable
                style={[s.btn, { flex: 1 }, authMode === 'signUp' ? {} : { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => { setAuthMode('signUp'); setAuthError(null); setAuthNotice(null); }}
              >
                <Text style={[s.btnText, authMode !== 'signUp' && { color: colors.text }]}>Create Account</Text>
              </Pressable>
            </View>

            {authMode === 'signUp' ? (
              <View style={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 12 }}>
                <View style={{ backgroundColor: colors.panel, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
                  <Text style={s.h2}>Welcome to PackRep</Text>
                  <Text style={[s.small, { marginTop: 6, marginBottom: 10 }]}>Choose your account path and role to start your verification journey.</Text>

                  <Text style={s.label}>Account Path</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    {(["builder", "broker"] as AccountPath[]).map((path) => {
                      const selected = accountPath === path;
                      return (
                        <Pressable
                          key={path}
                          style={{ flex: 1, backgroundColor: selected ? colors.card : colors.panel, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.accent : colors.border, borderRadius: 14, padding: 12, minHeight: 78, justifyContent: 'center' }}
                          onPress={() => {
                            const nextPath = path;
                            const nextRole = nextPath === 'builder' ? 'builderAdmin' : 'realtor';
                            setAccountPath(nextPath);
                            setAccountRole(nextRole);
                            setRole(deriveRoleFromSelection(nextPath, nextRole));
                          }}
                        >
                          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 14 }}>{path === 'builder' ? 'Builder' : 'Broker or Realtor®'}</Text>
                          {selected ? <Text style={{ color: colors.accent, marginTop: 4, fontWeight: '700' }}>✓ Selected</Text> : null}
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={s.label}>Role</Text>
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {(accountPath === 'builder' ? builderRoleOptions : brokerRoleOptions).map((option) => {
                      const selected = accountRole === option.key;
                      return (
                        <Pressable
                          key={option.key}
                          style={{ backgroundColor: selected ? colors.card : colors.panel, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.accent : colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                          onPress={() => {
                            setAccountRole(option.key);
                            setRole(deriveRoleFromSelection(accountPath, option.key));
                          }}
                        >
                          <Text style={{ color: colors.text, fontWeight: '800' }}>{option.label}</Text>
                          {selected ? <Text style={{ color: colors.accent, fontWeight: '900' }}>✓</Text> : null}
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={s.label}>First Name</Text>
                  <TextInput style={s.input} value={accountFirstName} onChangeText={setAccountFirstName} placeholder="First Name" autoCapitalize="words" />

                  <Text style={s.label}>Last Name</Text>
                  <TextInput style={s.input} value={accountLastName} onChangeText={setAccountLastName} placeholder="Last Name" autoCapitalize="words" />

                  <Text style={s.label}>Email</Text>
                  <TextInput style={s.input} value={authEmail} onChangeText={setAuthEmail} placeholder="you@domain.com" autoCapitalize="none" keyboardType="email-address" />

                  <Text style={s.label}>Phone</Text>
                  <TextInput style={s.input} value={accountPhone} onChangeText={setAccountPhone} placeholder="Phone" keyboardType="phone-pad" />

                  {accountPath === 'broker' ? (
                    <>
                      {accountRole === 'realtor' ? (
                        <>
                          <Text style={s.label}>Brokerage</Text>
                          <TextInput style={s.input} value={accountBrokerage} onChangeText={setAccountBrokerage} placeholder="Brokerage" autoCapitalize="words" />
                          <Text style={s.label}>Realtor License Number</Text>
                          <TextInput style={s.input} value={accountRealtorLicenseNumber} onChangeText={setAccountRealtorLicenseNumber} placeholder="License Number" />
                          <Text style={s.label}>Broker Email for Verification</Text>
                          <TextInput style={s.input} value={accountBrokerEmailForVerification} onChangeText={setAccountBrokerEmailForVerification} placeholder="broker@company.com" autoCapitalize="none" keyboardType="email-address" />
                        </>
                      ) : (
                        <>
                          <Text style={s.label}>Brokerage Name</Text>
                          <TextInput style={s.input} value={accountBrokerageName} onChangeText={setAccountBrokerageName} placeholder="Brokerage Name" autoCapitalize="words" />
                          <Text style={s.label}>Broker License Number</Text>
                          <TextInput style={s.input} value={accountBrokerLicenseNumber} onChangeText={setAccountBrokerLicenseNumber} placeholder="License Number" />
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={s.label}>Builder Company</Text>
                      <TextInput style={s.input} value={accountBuilderCompany} onChangeText={setAccountBuilderCompany} placeholder="Builder Company" autoCapitalize="words" />
                      <Text style={s.label}>Division Name</Text>
                      <TextInput style={s.input} value={accountDivisionName} onChangeText={setAccountDivisionName} placeholder="San Antonio" autoCapitalize="words" />
                      {accountRole === 'salesConsultant' ? (
                        <>
                          <Text style={s.label}>Marketing Team Email for Verification</Text>
                          <TextInput style={s.input} value={accountMarketingTeamEmail} onChangeText={setAccountMarketingTeamEmail} placeholder="marketing@company.com" autoCapitalize="none" keyboardType="email-address" />
                          <Text style={[s.small, { marginTop: 6, color: colors.muted }]}>Required later for builder verification.</Text>
                        </>
                      ) : (
                        <>
                          <Text style={s.label}>Company Email</Text>
                          <TextInput style={s.input} value={accountCompanyEmail} onChangeText={setAccountCompanyEmail} placeholder="company@builder.com" autoCapitalize="none" keyboardType="email-address" />
                        </>
                      )}
                    </>
                  )}

                  <Text style={s.label}>Password</Text>
                  <TextInput style={s.input} value={authPassword} onChangeText={setAuthPassword} placeholder="Password" secureTextEntry />

                  <Text style={s.label}>Confirm Password</Text>
                  <TextInput style={s.input} value={authConfirmPassword} onChangeText={setAuthConfirmPassword} placeholder="Confirm Password" secureTextEntry />

                  {!auth && <Text style={[s.small, { marginTop: 10 }]}>AuthProvider not configured — sign-in unavailable.</Text>}
                  {authError ? <Text style={{ color: 'tomato', marginTop: 8 }}>{authError}</Text> : null}
                  {authNotice ? <Text style={{ color: '#86efac', marginTop: 8 }}>{authNotice}</Text> : null}
                  {authMode === 'signUp' ? (
                    <Text style={[s.small, { marginTop: 8, color: colors.muted }]}>Debug: signUp response will show user/session details after submit.</Text>
                  ) : null}

                  <Pressable
                    style={[s.btn, { marginTop: 12 }]}
                    onPress={async () => {
                      setAuthError(null);
                      if (!auth) { setAuthError('AuthProvider not configured'); return; }
                      if (!accountFirstName.trim()) { setAuthError('First name is required'); return; }
                      if (!accountLastName.trim()) { setAuthError('Last name is required'); return; }
                      if (!authEmail) { setAuthError('Email is required'); return; }
                      if (!accountPhone.trim()) { setAuthError('Phone is required'); return; }
                      if (!authPassword) { setAuthError('Password is required'); return; }
                      if (authPassword !== authConfirmPassword) { setAuthError('Passwords do not match'); return; }
                      if (accountPath === 'broker' && accountRole === 'realtor') {
                        if (!accountBrokerage.trim()) { setAuthError('Brokerage is required'); return; }
                        if (!accountRealtorLicenseNumber.trim()) { setAuthError('Realtor license number is required'); return; }
                        if (!accountBrokerEmailForVerification.trim()) { setAuthError('Broker email is required'); return; }
                      }
                      if (accountPath === 'broker' && accountRole === 'broker') {
                        if (!accountBrokerageName.trim()) { setAuthError('Brokerage name is required'); return; }
                        if (!accountBrokerLicenseNumber.trim()) { setAuthError('Broker license number is required'); return; }
                      }
                      if (accountPath === 'builder') {
                        if (!accountBuilderCompany.trim()) { setAuthError('Builder company is required'); return; }
                        if (!accountDivisionName.trim()) { setAuthError('Division name is required'); return; }
                        if (accountRole === 'builderAdmin' && !accountCompanyEmail.trim()) { setAuthError('Company email is required'); return; }
                      }
                      setAuthLocalLoading(true);
                      try {
                        const res = await auth.signUp(authEmail, authPassword);
                        if (res?.error) {
                          const errorMessage = res.error?.message || String(res.error);
                          setAuthError(`Create Account failed: ${errorMessage}`);
                        } else {
                          const userExists = Boolean(res?.data?.user);
                          const sessionExists = Boolean(res?.data?.session);
                          const nextRole = deriveRoleFromSelection(accountPath, accountRole);
                          setRole(nextRole);
                          const existingProfile = await loadProfile();
                          await saveProfile({
                            ...(existingProfile || {}),
                            role: nextRole,
                            email: authEmail,
                            phone: accountPhone,
                          });
                          setEmail(authEmail);
                          setAuthPassword('');
                          setAuthConfirmPassword('');
                          setAccountFirstName('');
                          setAccountLastName('');
                          setAccountPhone('');
                          setAccountBrokerage('');
                          setAccountRealtorLicenseNumber('');
                          setAccountBrokerEmailForVerification('');
                          setAccountBrokerageName('');
                          setAccountBrokerLicenseNumber('');
                          setAccountBuilderCompany('');
                          setAccountDivisionName('');
                          setAccountMarketingTeamEmail('');
                          setAccountCompanyEmail('');
                          if (sessionExists) {
                            setAuthNotice('');
                            setAuthError(null);
                            setAuthNotice('Account created. You are signed in.');
                          } else if (userExists) {
                            setAuthNotice('Account created, but login session was not returned. Please sign in.');
                          } else {
                            setAuthNotice(`Create Account response: user=${userExists ? 'yes' : 'no'}, session=${sessionExists ? 'yes' : 'no'}`);
                          }
                        }
                      } catch (err: any) {
                        setAuthError(`Create Account failed: ${String(err?.message ?? err)}`);
                      } finally {
                        setAuthLocalLoading(false);
                      }
                    }}
                  >
                    <Text style={s.btnText}>{authLocalLoading || (auth && auth.loading) ? 'Please wait...' : 'Create Account'}</Text>
                  </Pressable>

                  <Pressable style={{ alignItems: 'center', marginTop: 12 }} onPress={() => { setAuthMode('signIn'); setAuthError(null); setAuthNotice(null); }}>
                    <Text style={{ color: colors.accent, fontWeight: '800' }}>Already have an account? Sign In</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                {!auth && <Text style={[s.small, { marginTop: 12 }]}>AuthProvider not configured — sign-in unavailable.</Text>}

                <Text style={s.label}>Email</Text>
                <TextInput style={s.input} value={authEmail} onChangeText={setAuthEmail} placeholder="you@domain.com" autoCapitalize="none" keyboardType="email-address" />

                <Text style={s.label}>Password</Text>
                <TextInput style={s.input} value={authPassword} onChangeText={setAuthPassword} placeholder="Password" secureTextEntry />

                {authError ? <Text style={{ color: 'tomato', marginTop: 8 }}>{authError}</Text> : null}
                {authNotice ? <Text style={{ color: '#86efac', marginTop: 8 }}>{authNotice}</Text> : null}

                <Pressable
                  style={[s.btn, { marginTop: 12 }]}
                  onPress={async () => {
                    setAuthError(null);
                    if (!auth) { setAuthError('AuthProvider not configured'); return; }
                    if (!authEmail) { setAuthError('Email is required'); return; }
                    if (!authPassword) { setAuthError('Password is required'); return; }
                    setAuthLocalLoading(true);
                    try {
                      const res = await auth.signIn(authEmail, authPassword);
                      if (res?.error) {
                        const errorMessage = res.error?.message || String(res.error);
                        setAuthError(`Sign In failed: ${errorMessage}`);
                      } else {
                        const userExists = Boolean(res?.data?.user);
                        const sessionExists = Boolean(res?.data?.session);
                        setEmail(authEmail);
                        setAuthNotice(`Sign In response: user=${userExists ? 'yes' : 'no'}, session=${sessionExists ? 'yes' : 'no'}`);
                      }
                    } catch (err: any) {
                      setAuthError(`Sign In failed: ${String(err?.message ?? err)}`);
                    } finally {
                      setAuthLocalLoading(false);
                    }
                  }}
                >
                  <Text style={s.btnText}>{authLocalLoading || (auth && auth.loading) ? 'Please wait...' : 'Sign In'}</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <>
            <View style={s.card}>
              <Text style={s.h2}>Realtor Profile</Text>
              {!profileComplete && (
                <View style={[s.listItem, { marginBottom: 12, borderColor: "#f59e0b" }]}> 
                  <Text style={s.listTitle}>Complete your profile to unlock PackRep</Text>
                  <Text style={s.listSub}>Finish these required realtor fields before using Home, New Lead, follow-ups, or builder features: {missingProfileFields.join(", ")}.</Text>
                </View>
              )}
              <Text style={s.label}>Realtor Name</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#7b92ae" />
              <Text style={s.label}>Brokerage Company</Text>
              <TextInput style={s.input} value={brokerage} onChangeText={setBrokerage} placeholder="Brokerage" placeholderTextColor="#7b92ae" />
              <Text style={s.label}>Realtor License / ID</Text>
              <TextInput style={s.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="License / ID" placeholderTextColor="#7b92ae" />
              <Text style={s.label}>Email</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#7b92ae" autoCapitalize="none" keyboardType="email-address" />
              <Text style={s.label}>Phone</Text>
              <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#7b92ae" keyboardType="phone-pad" />
              <Text style={s.label}>Default Area</Text>
              <TextInput style={s.input} value={defaultArea} onChangeText={setDefaultArea} placeholder="San Antonio / Boerne" placeholderTextColor="#7b92ae" />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Default State</Text>
                  <TextInput style={s.input} value={defaultState} onChangeText={setDefaultState} placeholder="TX" placeholderTextColor="#7b92ae" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Builder Radius (mi)</Text>
                  <TextInput style={s.input} value={defaultBuilderRadiusMiles} onChangeText={setDefaultBuilderRadiusMiles} keyboardType="number-pad" placeholder="25" placeholderTextColor="#7b92ae" />
                </View>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.h2}>Membership</Text>
              <Text style={s.small}>Target pricing: Free browse, $29 Verified, $49 Pro with open-house requests and community wall access.</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {tiers.map((tier) => (
                  <Pressable key={tier} style={[s.chip, membershipTier === tier && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setMembershipTier(tier)}>
                    <Text style={[s.chipTxt, membershipTier === tier && { color: colors.bg }]}>{tier === "free" ? "Free" : tier === "verified" ? "$29 Verified" : "$49 Pro"}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.label}>Verification Status</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {statuses.map((status) => (
                  <Pressable key={status} style={[s.chip, verificationStatus === status && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setVerificationStatus(status)}>
                    <Text style={[s.chipTxt, verificationStatus === status && { color: colors.bg }]}>{status}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={[s.listItem, { marginTop: 14 }]}> 
                <Text style={s.listTitle}>Paid Access Gates</Text>
                <Text style={s.listSub}>Pro + verified unlocks the community wall, direct promotion, and builder open-house requests in this prototype.</Text>
              </View>
            </View>

            <View style={{ marginHorizontal: 14, marginTop: 14, gap: 10 }}>
              <Pressable style={s.btn} onPress={save}><Text style={s.btnText}>Save Settings</Text></Pressable>
              <Pressable
                style={[s.btn, { marginTop: 10 }]}
                onPress={async () => {
                  setAuthLocalLoading(true);
                  setAuthError(null);
                  try {
                    await auth.signOut();
                  } catch (err: any) {
                    setAuthError(String(err?.message ?? err));
                  } finally {
                    setAuthLocalLoading(false);
                  }
                }}
              >
                <Text style={s.btnText}>Sign Out</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={{ marginHorizontal: 14, marginTop: 14, gap: 10 }}>
          <Pressable style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostText}>Back</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
