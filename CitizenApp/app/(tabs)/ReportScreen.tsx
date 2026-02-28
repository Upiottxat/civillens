import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { complaintsAPI, classifyAPI } from '@/services/api';
import { formatTicketId } from '@/services/slaHelpers';

const CATEGORIES = [
  { key: 'Water Leakage', icon: '💧', label: 'Water Leakage' },
  { key: 'Road Damage', icon: '🚧', label: 'Road Damage' },
  { key: 'Garbage', icon: '🗑️', label: 'Garbage' },
  { key: 'Streetlight', icon: '💡', label: 'Streetlight' },
  { key: 'Public Safety', icon: '🛡️', label: 'Public Safety' },
  { key: 'Park / Open Space', icon: '🌳', label: 'Park / Open Space' },
  { key: 'Stray Animals', icon: '🐕', label: 'Stray Animals' },
  { key: 'Other', icon: '➕', label: 'Other' },
];

const SEVERITY_OPTS = [
  { key: 'LOW', label: 'Low', color: '#22C55E', bg: '#F0FDF4' },
  { key: 'MEDIUM', label: 'Medium', color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'HIGH', label: 'High', color: '#EF4444', bg: '#FEF2F2' },
  { key: 'CRITICAL', label: 'Critical', color: '#DC2626', bg: '#FEF2F2' },
];

type Step = 'category' | 'details' | 'location' | 'review' | 'success';

export default function ReportScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locLabel, setLocLabel] = useState('');
  const [locBusy, setLocBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // AI classify on description change
  useEffect(() => {
    if (description.length < 10) { setAiSuggestion(null); return; }
    const id = setTimeout(async () => {
      try {
        const r = await classifyAPI.classify(description);
        if (r.success && r.data?.suggestion?.issueType) setAiSuggestion(r.data.suggestion.issueType);
      } catch {}
    }, 800);
    return () => clearTimeout(id);
  }, [description]);

  const getLocation = async () => {
    setLocBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to mark issue position.');
        // Fallback demo coords
        setLoc({ lat: 28.6315, lng: 77.2167 });
        setLocLabel('Connaught Place, New Delhi (demo)');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ lat: coords.latitude, lng: coords.longitude });
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
        if (geo) setLocLabel([geo.street, geo.district, geo.city].filter(Boolean).join(', '));
      } catch {}
    } catch {
      setLoc({ lat: 28.6315, lng: 77.2167 });
      setLocLabel('Connaught Place, New Delhi (demo)');
    } finally { setLocBusy(false); }
  };

  const submit = async () => {
    if (!category || !loc) return;
    setSubmitting(true);
    try {
      const r = await complaintsAPI.submit({
        issueType: category,
        description: description || undefined,
        latitude: loc.lat,
        longitude: loc.lng,
        locationLabel: locLabel || undefined,
        severity,
      });
      if (r.success) {
        setSubmittedId(r.data?.complaint?.id || r.data?.id || 'NEW');
        setStep('success');
      } else Alert.alert('Error', r.error || 'Submission failed');
    } catch { Alert.alert('Error', 'Network error'); }
    finally { setSubmitting(false); }
  };

  const progressPct = step === 'category' ? 25 : step === 'details' ? 50 : step === 'location' ? 75 : 100;
  const stepLabel = step === 'category' ? 'Select Category' : step === 'details' ? 'Add Details' : step === 'location' ? 'Confirm Location' : step === 'review' ? 'Review & Submit' : 'Done';

  // ─── Success View ──────────────────────────────────────────────────────────
  if (step === 'success')
    return (
      <View style={s.successWrap}>
        <View style={s.successIcon}><Text style={{ fontSize: 48 }}>🎉</Text></View>
        <Text style={s.successTitle}>Issue Reported!</Text>
        <Text style={s.successSub}>Your complaint has been registered and auto-prioritized.</Text>
        <View style={s.successCard}>
          <Text style={s.ticketLabel}>Tracking ID</Text>
          <Text style={s.ticketVal}>{formatTicketId(submittedId)}</Text>
        </View>
        <TouchableOpacity style={s.trackBtn} onPress={() => router.push('/(tabs)/MyIssuesScreen')}>
          <Text style={s.trackBtnT}>Track My Issues</Text><Feather name="arrow-right" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={s.newBtn} onPress={() => { setStep('category'); setCategory(null); setDescription(''); setLoc(null); setLocLabel(''); setSubmittedId(''); }}>
          <Text style={s.newBtnT}>Report Another Issue</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Header + progress */}
      <View style={s.headerBar}>
        {step !== 'category' ? (
          <TouchableOpacity style={s.backBtn} onPress={() => { const m: Record<string, Step> = { details: 'category', location: 'details', review: 'location' }; setStep(m[step] || 'category'); }}>
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
        ) : <View style={{ width: 36 }} />}
        <Text style={s.headerTitle}>{stepLabel}</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.progressBg}><View style={[s.progressFill, { width: `${progressPct}%` }]} /></View>

      {/* Step: Category */}
      {step === 'category' && (
        <View style={s.body}>
          <Text style={s.q}>What type of issue?</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c.key} style={[s.catCard, category === c.key && s.catSel]} onPress={() => setCategory(c.key)}>
                <Text style={{ fontSize: 24 }}>{c.icon}</Text><Text style={s.catLabel}>{c.label}</Text>
                {category === c.key && <View style={s.catCheck}><Ionicons name="checkmark" size={12} color="white" /></View>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[s.nextBtn, !category && s.disabled]} onPress={() => setStep('details')} disabled={!category}>
            <Text style={s.nextBtnT}>Next: Add Details</Text><Feather name="arrow-right" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Details */}
      {step === 'details' && (
        <View style={s.body}>
          <Text style={s.q}>Describe the issue</Text>
          <TextInput style={s.textArea} placeholder="Describe what you see…" multiline numberOfLines={4} maxLength={500} value={description} onChangeText={setDescription} />
          {aiSuggestion && aiSuggestion !== category && (
            <View style={s.aiBox}>
              <View style={s.aiHead}><MaterialCommunityIcons name="brain" size={14} color="#7C3AED" /><Text style={s.aiTitle}>AI Suggestion</Text></View>
              <TouchableOpacity onPress={() => setCategory(aiSuggestion)}><Text style={s.aiBtn}>Switch to {aiSuggestion}?</Text></TouchableOpacity>
            </View>
          )}
          <Text style={[s.q, { marginTop: 20 }]}>Severity Level</Text>
          <View style={s.sevRow}>
            {SEVERITY_OPTS.map((o) => (
              <TouchableOpacity key={o.key} style={[s.sevCard, severity === o.key && { borderColor: o.color, backgroundColor: o.bg }]} onPress={() => setSeverity(o.key)}>
                <Text style={[s.sevLabel, severity === o.key && { color: o.color }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.nextBtn} onPress={() => { getLocation(); setStep('location'); }}>
            <Text style={s.nextBtnT}>Next: Location</Text><Feather name="arrow-right" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Location */}
      {step === 'location' && (
        <View style={s.body}>
          <Text style={s.q}>Confirm Issue Location</Text>
          {locBusy ? (
            <View style={s.locLoad}><ActivityIndicator color="#1E3A8A" /><Text style={{ marginTop: 8, color: '#6B7280', fontSize: 12 }}>Fetching GPS…</Text></View>
          ) : loc ? (
            <View style={s.locCard}>
              <View style={s.locIconWrap}><Ionicons name="location" size={20} color="#1E3A8A" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.locTitle}>{locLabel || 'Current Location'}</Text>
                <Text style={s.locCoord}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</Text>
              </View>
              <TouchableOpacity onPress={getLocation}><Feather name="refresh-ccw" size={16} color="#1E3A8A" /></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.getLocBtn} onPress={getLocation}><Ionicons name="location" size={18} color="#1E3A8A" /><Text style={s.getLocT}>Get Current Location</Text></TouchableOpacity>
          )}
          <TextInput style={[s.textArea, { height: 44 }]} placeholder="Or type location manually…" value={locLabel} onChangeText={(t) => { setLocLabel(t); if (!loc) setLoc({ lat: 28.6315, lng: 77.2167 }); }} />
          <TouchableOpacity style={[s.nextBtn, !loc && s.disabled]} onPress={() => setStep('review')} disabled={!loc}>
            <Text style={s.nextBtnT}>Next: Review</Text><Feather name="arrow-right" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <View style={s.body}>
          <Text style={s.q}>Review Your Report</Text>
          <View style={s.reviewCard}>
            {[{ l: 'Category', v: category }, { l: 'Severity', v: severity }, { l: 'Location', v: locLabel || `${loc?.lat.toFixed(4)}, ${loc?.lng.toFixed(4)}` }, ...(description ? [{ l: 'Description', v: description }] : [])].map((r) => (
              <View key={r.l} style={s.reviewRow}><Text style={s.reviewL}>{r.l}</Text><Text style={s.reviewV} numberOfLines={3}>{r.v}</Text></View>
            ))}
          </View>
          <TouchableOpacity style={[s.submitBtn, submitting && s.disabled]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="white" /> : <><Text style={s.submitT}>Submit Report</Text><Ionicons name="send" size={16} color="white" /></>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F7' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingBottom: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A2340' },
  progressBg: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#1E3A8A', borderRadius: 2 },
  body: { paddingHorizontal: 16, paddingTop: 12 },
  q: { fontSize: 16, fontWeight: '700', color: '#1A2340', marginBottom: 14 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  catCard: { width: '47%', backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#ECEEF2' },
  catSel: { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 6, textAlign: 'center' },
  catCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center' },
  textArea: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', padding: 14, fontSize: 14, color: '#1A2340', minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  aiBox: { backgroundColor: '#F5F3FF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#DDD6FE' },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  aiTitle: { fontSize: 11, fontWeight: '600', color: '#7C3AED' },
  aiBtn: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  sevRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sevCard: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: 'white' },
  sevLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  locLoad: { alignItems: 'center', paddingVertical: 24 },
  locCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  locIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  locTitle: { fontSize: 13, fontWeight: '600', color: '#1A2340' },
  locCoord: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace' },
  getLocBtn: { backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 12 },
  getLocT: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  reviewCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, gap: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ECEEF2' },
  reviewRow: {},
  reviewL: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  reviewV: { fontSize: 14, color: '#1A2340', fontWeight: '500' },
  nextBtn: { backgroundColor: '#1E3A8A', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 },
  nextBtnT: { color: 'white', fontWeight: '700', fontSize: 14 },
  submitBtn: { backgroundColor: '#0D9488', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitT: { color: 'white', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
  successWrap: { flex: 1, backgroundColor: '#F0F2F7', justifyContent: 'center', alignItems: 'center', padding: 30 },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#1A2340' },
  successSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  successCard: { backgroundColor: 'white', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#ECEEF2', width: '100%', alignItems: 'center', marginBottom: 20 },
  ticketLabel: { fontSize: 12, color: '#6B7280' },
  ticketVal: { fontSize: 22, fontWeight: '700', color: '#1E3A8A', fontFamily: 'monospace', marginTop: 4 },
  trackBtn: { backgroundColor: '#1E3A8A', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' },
  trackBtnT: { color: 'white', fontWeight: '700', fontSize: 15 },
  newBtn: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', marginTop: 10, width: '100%', alignItems: 'center' },
  newBtnT: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
