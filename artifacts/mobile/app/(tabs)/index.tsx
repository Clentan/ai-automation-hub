import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colorTokens from '@/constants/colors';
import { Badge, ScreenHeader, ServiceIcons } from '@/components/ui';
import { CATEGORIES, TEMPLATES, Template, formatUsage } from '@/lib/data';

export default function TemplatesScreen() {
  const c = useColors();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      if (category !== 'All' && !t.categories.includes(category)) return false;
      if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => b.usageCount - a.usageCount);
  }, [query, category]);

  const renderItem = ({ item }: { item: Template }) => (
    <Pressable
      testID={`template-${item.id}`}
      onPress={() => router.push(`/template/${item.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <ServiceIcons services={item.services} />
        <Badge label={item.type} tone="primary" />
      </View>
      <Text style={[styles.cardTitle, { color: c.cardForeground }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.cardDesc, { color: c.mutedForeground }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.cardBottom}>
        <Feather name="users" size={13} color={c.mutedForeground} />
        <Text style={[styles.cardMeta, { color: c.mutedForeground }]}>
          {formatUsage(item.usageCount)} uses
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenHeader title="Templates" subtitle="Browse ready-made automations" showLogo />
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.mutedForeground} />
          <TextInput
            testID="template-search"
            style={[styles.searchInput, { color: c.foreground }]}
            placeholder="Search templates"
            placeholderTextColor={c.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={16} color={c.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((cat) => {
            const active = cat === category;
            return (
              <Pressable
                key={cat}
                testID={`category-${cat}`}
                onPress={() => setCategory(cat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? c.primary : c.card,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? c.primaryForeground : c.mutedForeground },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        scrollEnabled={filtered.length > 0}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={[styles.noResults, { color: c.mutedForeground }]}>
            No templates match your search.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 21,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
