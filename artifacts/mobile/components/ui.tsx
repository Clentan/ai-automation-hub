import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { serviceMeta } from '@/lib/data';

export function useHeaderTopInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'web' ? 67 : insets.top;
}

export function ScreenHeader({
  title,
  subtitle,
  showLogo,
}: {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}) {
  const c = useColors();
  const top = useHeaderTopInset();
  return (
    <View style={[styles.header, { paddingTop: top + 12 }]}>
      <View style={styles.headerRow}>
        {showLogo ? (
          <View style={[styles.logoBox, { backgroundColor: c.primary }]}>
            <Feather name="zap" size={18} color={c.primaryForeground} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.headerSubtitle, { color: c.mutedForeground }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function Badge({
  label,
  tone,
}: {
  label: string;
  tone?: 'primary' | 'muted' | 'success' | 'warning' | 'destructive';
}) {
  const c = useColors();
  const bg =
    tone === 'primary'
      ? c.secondary
      : tone === 'success'
        ? 'rgba(34,197,94,0.12)'
        : tone === 'warning'
          ? 'rgba(217,119,6,0.12)'
          : tone === 'destructive'
            ? 'rgba(239,68,68,0.12)'
            : c.muted;
  const fg =
    tone === 'primary'
      ? c.secondaryForeground
      : tone === 'success'
        ? c.success
        : tone === 'warning'
          ? c.warning
          : tone === 'destructive'
            ? c.destructive
            : c.mutedForeground;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function ServiceIcons({ services, size = 26 }: { services: string[]; size?: number }) {
  const c = useColors();
  return (
    <View style={styles.serviceRow}>
      {services.map((s) => {
        const meta = serviceMeta(s);
        return (
          <View
            key={s}
            style={[
              styles.serviceBubble,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: c.muted,
                borderColor: c.border,
              },
            ]}
          >
            <Feather name={meta.icon as never} size={size * 0.55} color={meta.color} />
          </View>
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
}) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.muted }]}>
        <Feather name={icon} size={26} color={c.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: c.mutedForeground }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 6,
  },
  serviceBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: colors.radius * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyMessage: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
});
