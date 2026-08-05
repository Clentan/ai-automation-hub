import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import colorTokens from '@/constants/colors';
import { ScreenHeader } from '@/components/ui';
import { KeyMeta, getKeys } from '@/lib/api';
import { TEMPLATES } from '@/lib/data';

export default function AccountScreen() {
  const c = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const keysQuery = useQuery<KeyMeta[]>({
    queryKey: ['keys'],
    queryFn: getKeys,
    enabled: !!isSignedIn,
  });

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const initials = (email[0] ?? '?').toUpperCase();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          queryClient.clear();
        },
      },
    ]);
  };

  const templateName = (id: string) => TEMPLATES.find((t) => t.id === id)?.name ?? id;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenHeader title="Account" showLogo />
      <ScrollView contentContainerStyle={styles.content}>
        {!isSignedIn ? (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.avatar, { backgroundColor: c.secondary }]}>
              <Feather name="user" size={24} color={c.secondaryForeground} />
            </View>
            <Text style={[styles.cardTitle, { color: c.cardForeground }]}>
              You're not signed in
            </Text>
            <Text style={[styles.cardText, { color: c.mutedForeground }]}>
              Sign in with your Automation Hub account to manage API keys and see your
              run history.
            </Text>
            <Pressable
              testID="account-sign-in"
              onPress={() => router.push('/(auth)/sign-in')}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.primaryButtonText, { color: c.primaryForeground }]}>
                Sign in
              </Text>
            </Pressable>
            <Pressable
              testID="account-sign-up"
              onPress={() => router.push('/(auth)/sign-up')}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={[styles.linkText, { color: c.primary }]}>
                Create an account
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.avatar, { backgroundColor: c.primary }]}>
                <Text style={[styles.avatarText, { color: c.primaryForeground }]}>
                  {initials}
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: c.cardForeground }]}>{email}</Text>
              <Text style={[styles.cardText, { color: c.mutedForeground }]}>
                Signed in to AI Automation Hub
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: c.foreground }]}>API keys</Text>
            {keysQuery.isLoading ? (
              <Text style={[styles.hint, { color: c.mutedForeground }]}>Loading…</Text>
            ) : keysQuery.isError ? (
              <Text style={[styles.hint, { color: c.destructive }]}>
                Couldn't load your API keys.
              </Text>
            ) : (keysQuery.data ?? []).length === 0 ? (
              <Text style={[styles.hint, { color: c.mutedForeground }]}>
                No API keys yet. Issue keys from the web app to run templates via the API.
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {(keysQuery.data ?? []).map((k) => (
                  <View
                    key={k.templateId}
                    style={[styles.keyRow, { backgroundColor: c.card, borderColor: c.border }]}
                  >
                    <View style={[styles.keyIcon, { backgroundColor: c.secondary }]}>
                      <Feather name="key" size={15} color={c.secondaryForeground} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[styles.keyTitle, { color: c.cardForeground }]}
                        numberOfLines={1}
                      >
                        {templateName(k.templateId)}
                      </Text>
                      <Text style={[styles.keyMeta, { color: c.mutedForeground }]}>
                        {k.keyPrefix}…
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              testID="sign-out"
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.signOutButton,
                { borderColor: c.border, backgroundColor: c.card, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="log-out" size={16} color={c.destructive} />
              <Text style={[styles.signOutText, { color: c.destructive }]}>Sign out</Text>
            </Pressable>
          </>
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
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  cardText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  linkText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 6,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    padding: 14,
  },
  keyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  keyMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  signOutButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: colorTokens.radius,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
