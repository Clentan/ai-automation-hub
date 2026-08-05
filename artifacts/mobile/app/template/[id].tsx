import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colorTokens from '@/constants/colors';
import { Badge, ServiceIcons } from '@/components/ui';
import { TEMPLATES, formatUsage, serviceMeta } from '@/lib/data';
import { useFlows } from '@/lib/flows-context';

export default function TemplateDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { createFlow, flows } = useFlows();

  const template = TEMPLATES.find((t) => t.id === id);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!template) {
    return (
      <View style={[styles.container, { backgroundColor: c.background, paddingTop: topInset }]}>
        <Text style={[styles.title, { color: c.foreground, padding: 20 }]}>
          Template not found
        </Text>
      </View>
    );
  }

  const alreadyUsed = flows.some((f) => f.templateId === template.id);

  const handleUse = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createFlow(template.id);
    router.push('/(tabs)/flows');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.navBar, { paddingTop: topInset + 8 }]}>
        <Pressable
          testID="back-button"
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={18} color={c.foreground} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <ServiceIcons services={template.services} size={34} />
          <Badge label={template.type} tone="primary" />
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>{template.name}</Text>
        <Text style={[styles.description, { color: c.mutedForeground }]}>
          {template.description}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="users" size={13} color={c.mutedForeground} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>
              {formatUsage(template.usageCount)} uses
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="zap" size={13} color={c.mutedForeground} />
            <Text style={[styles.metaText, { color: c.mutedForeground }]}>
              {template.author}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: c.foreground }]}>How it works</Text>
        <View style={{ gap: 10 }}>
          {template.steps.map((step, i) => {
            const meta = serviceMeta(step.serviceId);
            return (
              <View
                key={`${step.title}-${i}`}
                style={[styles.stepCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={[styles.stepNumber, { backgroundColor: c.secondary }]}>
                  <Text style={[styles.stepNumberText, { color: c.secondaryForeground }]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.stepTitle, { color: c.cardForeground }]}>
                    {step.title}
                  </Text>
                  <Text style={[styles.stepDesc, { color: c.mutedForeground }]}>
                    {step.description}
                  </Text>
                </View>
                <Feather name={meta.icon as never} size={18} color={meta.color} />
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Categories</Text>
        <View style={styles.tagRow}>
          {template.categories.map((cat) => (
            <Badge key={cat} label={cat} tone="muted" />
          ))}
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: c.background,
            borderTopColor: c.border,
            paddingBottom: bottomInset + 12,
          },
        ]}
      >
        <Pressable
          testID="use-template"
          onPress={handleUse}
          style={({ pressed }) => [
            styles.useButton,
            { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="zap" size={16} color={c.primaryForeground} />
          <Text style={[styles.useButtonText, { color: c.primaryForeground }]}>
            {alreadyUsed ? 'Create another flow' : 'Use this template'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 21,
    fontFamily: 'Inter_700Bold',
    lineHeight: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 20,
    marginBottom: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    padding: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  stepDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  useButton: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  useButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
