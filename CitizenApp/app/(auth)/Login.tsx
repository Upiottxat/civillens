import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CiviLensLogo from '../../components/Logo';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();

  const doSendOtp = async () => {
    if (phone.length !== 10) { Alert.alert('Invalid', 'Enter a 10-digit number'); return; }
    setBusy(true);
    try {
      const r = await sendOtp(phone);
      if (r.success) setStep('otp');
      else Alert.alert('Error', r.error || 'Failed');
    } catch { Alert.alert('Error', 'Network error'); }
    finally { setBusy(false); }
  };

  const doVerify = async () => {
    if (otp.length !== 6) { Alert.alert('Invalid', 'Enter 6-digit OTP'); return; }
    setBusy(true);
    try {
      const r = await verifyOtp(phone, otp);
      if (r.success) router.replace('/(tabs)');
      else Alert.alert('Invalid OTP', r.error || 'Try again');
    } catch { Alert.alert('Error', 'Verification failed'); }
    finally { setBusy(false); }
  };

  const quickLogin = async () => {
    setBusy(true);
    try {
      const s = await sendOtp('9876543210');
      if (s.success) {
        const v = await verifyOtp('9876543210', '123456');
        if (v.success) { router.replace('/(tabs)'); return; }
      }
      Alert.alert('Failed', 'Try again');
    } catch { Alert.alert('Failed'); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={st.container} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={['#1E3A8A', '#1E40AF', '#1D4ED8']} style={st.hero}>
        <CiviLensLogo />
        <Text style={st.appName}>CiviLens</Text>
        <Text style={st.tagline}>Report civic issues. Track resolution.{'\n'}Hold authorities accountable.</Text>
        <View style={st.badges}>
          {['Government Verified', 'ISO Secured', 'DPDP Compliant'].map((b) => (
            <View key={b} style={st.badge}><Text style={st.badgeT}>{b}</Text></View>
          ))}
        </View>
      </LinearGradient>

      <View style={st.form}>
        <Text style={st.welcome}>Welcome to CiviLens</Text>
        <Text style={st.desc}>Report civic issues with transparency</Text>

        {step === 'phone' ? (
          <>
            <Text style={st.label}>Mobile Number</Text>
            <View style={st.inputRow}>
              <View style={st.prefix}><Text style={{ fontSize: 16 }}>📱</Text></View>
              <TextInput placeholder="Enter 10-digit mobile number" keyboardType="number-pad"
                maxLength={10} value={phone} onChangeText={setPhone} style={st.input} />
            </View>
            <TouchableOpacity style={[st.primary, (busy || phone.length !== 10) && st.disabled]}
              onPress={doSendOtp} disabled={busy || phone.length !== 10}>
              {busy ? <ActivityIndicator color="white" /> : (
                <><Text style={st.primaryT}>Send OTP</Text><Ionicons name="arrow-forward" size={18} color="white" /></>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={st.label}>Enter OTP sent to +91 {phone}</Text>
            <View style={st.inputRow}>
              <View style={st.prefix}><Text style={{ fontSize: 16 }}>🔒</Text></View>
              <TextInput placeholder="Enter 6-digit OTP" keyboardType="number-pad"
                maxLength={6} value={otp} onChangeText={setOtp} style={st.input} autoFocus />
            </View>
            <TouchableOpacity style={[st.primary, (busy || otp.length !== 6) && st.disabled]}
              onPress={doVerify} disabled={busy || otp.length !== 6}>
              {busy ? <ActivityIndicator color="white" /> : (
                <><Text style={st.primaryT}>Verify & Login</Text><Ionicons name="checkmark-circle" size={18} color="white" /></>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }} style={st.back}>
              <Ionicons name="arrow-back" size={14} color="#1E3A8A" />
              <Text style={st.backT}>Change phone number</Text>
            </TouchableOpacity>
            <View style={st.hint}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={st.hintT}>Demo OTP: 123456</Text>
            </View>
          </>
        )}

        <View style={st.divider}><View style={st.line} /><Text style={st.divT}>or continue with</Text><View style={st.line} /></View>

        <TouchableOpacity style={[st.secondary, busy && st.disabled]} onPress={quickLogin} disabled={busy}>
          <Ionicons name="shield-checkmark" size={16} color="#1E3A8A" />
          <Text style={st.secondaryT}>Quick Demo Login</Text>
        </TouchableOpacity>

        <View style={st.security}>
          <Ionicons name="lock-closed" size={14} color="#6B7280" />
          <Text style={st.secText}>
            Your reports are tracked transparently. By continuing, you agree to our
            <Text style={st.link}> Terms of Service</Text> and
            <Text style={st.link}> Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { backgroundColor: '#F0F2F7', flexGrow: 1 },
  hero: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
  appName: { color: 'white', fontSize: 30, fontWeight: '700' },
  tagline: { color: 'rgba(186,210,253,0.9)', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  badges: { flexDirection: 'row', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeT: { fontSize: 10, color: 'rgba(186,210,253,0.9)', fontWeight: '500' },
  form: { paddingHorizontal: 24, paddingVertical: 24 },
  welcome: { fontSize: 22, fontWeight: '700', color: '#1A2340' },
  desc: { fontSize: 13, color: '#6B7280', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#374151' },
  inputRow: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', overflow: 'hidden', marginBottom: 16 },
  prefix: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, backgroundColor: '#FAFAFA', borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, color: '#1A2340' },
  primary: { backgroundColor: '#1E3A8A', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16 },
  primaryT: { color: 'white', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.6 },
  back: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  backT: { color: '#1E3A8A', fontWeight: '600', fontSize: 13 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, backgroundColor: '#FFF7ED', borderRadius: 8, marginTop: 4, marginBottom: 8 },
  hintT: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: '#E9ECF2' },
  divT: { fontSize: 12, color: '#9CA3AF' },
  secondary: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', padding: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  secondaryT: { fontSize: 14, fontWeight: '600', color: '#1A2340' },
  security: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: '#F8FAFF', borderRadius: 10, borderWidth: 1, borderColor: '#E8EEFF', marginTop: 16 },
  secText: { fontSize: 11, color: '#6B7280', flex: 1, lineHeight: 16 },
  link: { color: '#1E3A8A', fontWeight: '600' },
});
