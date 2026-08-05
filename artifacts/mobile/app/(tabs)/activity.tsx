import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import colorTokens from '@/constants/colors';
import { Badge, EmptyState, ScreenHeader } from '@/components/ui';
import { Run, getAllRuns } from '@/lib/api';
import { TEMPLATES } from '@/lib/data';
import { useFlows } from '@/lib/flows-context';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function runTone(status: string): 'success' | 'warning' | 'destructive' | 'muted' {
  if (status === 'success' || status === 'completed') return 'success';
  if (status === 'queued' || status === 'running') return 'warning';
  if (status === 'failed' || status === 'error') return 'destructive';
  return 'muted';
}

export default function ActivityScreen() {
  const c = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { activity } = useFlows();

  const runsQuery = useQuery<Run[]>({
    queryKey: ['all-runs'],
    queryFn: getAllRuns,
    enabled: !!isSignedIn,
  });

  const templateName = (id: string) =>
    TEMPLATES.find((t) => t.id === id)?.name ?? id;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenHeader title="Activity" subtitle="Runs across your automations" showLogo />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={!!isSignedIn && runsQuery.isRefetching}
            onRefresh={() => runsQuery.refetch()}
            tintColor={c.primary}
          />
        }
      >
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>API runs</Text>
        {!isSignedIn ? (
          <View style={[styles.notice, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="lock" size={18} color={c.mutedForeground} />
            <Text style={[styles.noticeText, { color: c.mutedForeground }]}>
              Sign in to see run history from the Automation Hub API.
            </Text>
            <Pressable
              testID="activity-sign-in"
              onPress={() => router.push('/(auth)/sign-in')}
              style={({ pressed }) => [
                styles.noticeButton,
                { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.noticeButtonText, { color: c.primaryForeground }]}>
                Sign in
              </Text>
            </Pressable>
          </View>
        ) : runsQuery.isLoading ? (
          <Text style={[styles.hint, { color: c.mutedForeground }]}>Loading runs…</Text>
        ) : runsQuery.isError ? (
          <View style={[styles.notice, { backgroundColor: c.card, borderColor: c.border }]}>
            <Feather name="alert-circle" size={18} color={c.destructive} />
            <Text style={[styles.noticeText, { color: c.mutedForeground }]}>
              Couldn't load runs. {String((runsQuery.error as Error)?.message ?? '')}
            </Text>
            <Pressable
              onPress={() => runsQuery.refetch()}
              style={({ pressed }) => [
                styles.noticeButton,
                { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.noticeButtonText, { color: c.primaryForeground }]}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : (runsQuery.data ?? []).length === 0 ? (
          <Text style={[styles.hint, { color: c.mutedForeground }]}>
            No API runs yet. Issue an API key for a template and trigger a run to see it here.
          </Text>
        ) : (
          <View style={styles.list}>
            {(runsQuery.data ?? []).map((run) => (
              <View
                key={run.id}
                style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={[styles.rowTitle, { color: c.cardForeground }]}
                    numberOfLines={1}
                  >
                    {templateName(run.template_id)}
                  </Text>
                  <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>
                    {timeAgo(run.created_at)}
                  </Text>
                </View>
                <Badge label={run.status} tone={runTone(run.status)} />
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: c.foreground, marginTop: 24 }]}>
          Flow activity
        </Text>
        {activity.length === 0 ? (
          <EmptyState
            icon="activity"
            title="No flow activity"
            message="Activity from your flows on this device will appear here."
          />
        ) : (
          <View style={styles.list}>
            {activity.map((a) => (
              <View
                key={a.id}
                style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={[styles.rowTitle, { color: c.cardForeground }]}
                    numberOfLines={1}
                  >
                    {a.flowName}
                  </Text>
                  <Text style={[styles.rowMeta, { color: c.mutedForeground }]}>
                    {timeAgo(a.timestamp)} · {(a.durationMs / 1000).toFixed(1)}s
                  </Text>
                </View>
                <Badge
                  label={a.status}
                  tone={a.status === 'success' ? 'success' : 'destructive'}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    padding: 14,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  rowMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  notice: {
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  noticeButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
});
