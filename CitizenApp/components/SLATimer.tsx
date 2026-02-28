import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  remaining: string;
  isBreached?: boolean;
  isResolved?: boolean;
  compact?: boolean;
}

export default function SLATimer({ remaining, isBreached, isResolved, compact }: Props) {
  const pad = compact ? s.cPad : s.nPad;

  if (isResolved)
    return (
      <View style={[s.box, s.resolved, pad]}>
        <Feather name="check-circle" size={compact ? 18 : 22} color="#16A34A" />
        <View>
          <Text style={[s.rTitle, compact && { fontSize: 13 }]}>Issue Resolved</Text>
          <Text style={s.rSub}>Resolved within SLA timeline</Text>
        </View>
      </View>
    );

  if (isBreached)
    return (
      <View style={[s.box, s.breached, pad]}>
        <Feather name="alert-triangle" size={compact ? 18 : 22} color="#DC2626" />
        <View style={{ flex: 1 }}>
          <Text style={[s.bTitle, compact && { fontSize: 13 }]}>SLA Breached</Text>
          <Text style={s.bSub}>Escalated to District Officer</Text>
        </View>
        <View style={s.overdue}><Text style={s.overdueT}>OVERDUE</Text></View>
      </View>
    );

  const warn = remaining.startsWith('0h') || remaining.startsWith('1h') || remaining.startsWith('2h');
  return (
    <View style={[s.box, warn ? s.warn : s.normal, pad]}>
      <Feather name="clock" size={compact ? 18 : 22} color={warn ? '#EA580C' : '#1E3A8A'} />
      <View>
        <Text style={[s.due, compact && { fontSize: 12 }]}>Resolution due in</Text>
        <Text style={[s.remain, warn && s.warnT, compact && { fontSize: 15 }]}>{remaining}</Text>
      </View>
      <View style={[s.badge, warn ? s.urgBadge : s.okBadge]}>
        <Text style={[s.badgeT, warn && s.urgT]}>{warn ? 'URGENT' : 'ON TRACK'}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nPad: { paddingVertical: 14, paddingHorizontal: 16 },
  cPad: { paddingVertical: 10, paddingHorizontal: 14 },
  resolved: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  rTitle: { fontSize: 14, fontWeight: '700', color: '#15803D' },
  rSub: { fontSize: 11, color: '#86EFAC' },
  breached: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
  bTitle: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  bSub: { fontSize: 11, color: '#FCA5A5' },
  overdue: { backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  overdueT: { color: 'white', fontSize: 10, fontWeight: '600' },
  normal: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  warn: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  due: { fontSize: 13, color: '#6B7280' },
  remain: { fontSize: 17, fontWeight: '700', color: '#1E3A8A' },
  warnT: { color: '#C2410C' },
  badge: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  okBadge: { backgroundColor: '#DBEAFE' },
  urgBadge: { backgroundColor: '#FED7AA' },
  badgeT: { fontSize: 10, fontWeight: '600', color: '#1D4ED8' },
  urgT: { color: '#C2410C' },
});
