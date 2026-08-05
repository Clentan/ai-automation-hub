import React from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colorTokens from '@/constants/colors';
import { Badge, EmptyState, ScreenHeader, ServiceIcons } from '@/components/ui';
import { Flow, useFlows } from '@/lib/flows-context';

export default function FlowsScreen() {
  const c = useColors();
  const { flows, isLoaded, toggleFlow, deleteFlow, templateFor } = useFlows();

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFlow(id);
  };

  const handleDelete = (flow: Flow) => {
    Alert.alert('Delete flow', `Remove "${flow.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteFlow(flow.id);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Flow }) => {
    const template = templateFor(item);
    const isOn = item.status === 'on';
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: c.card, borderColor: c.border, opacity: isOn ? 1 : 0.72 },
        ]}
      >
        <View style={styles.cardTop}>
          {template ? <ServiceIcons services={template.services} /> : <View />}
          <Switch
            testID={`toggle-${item.id}`}
            value={isOn}
            onValueChange={() => handleToggle(item.id)}
            trackColor={{ false: c.muted, true: c.primary }}
            thumbColor="#ffffff"
          />
        </View>
        <Text style={[styles.cardTitle, { color: c.cardForeground }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.cardBottom}>
          <Badge label={isOn ? 'Active' : 'Paused'} tone={isOn ? 'success' : 'muted'} />
          <Pressable
            testID={`delete-${item.id}`}
            onPress={() => handleDelete(item)}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="trash-2" size={17} color={c.mutedForeground} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenHeader
        title="My Flows"
        subtitle={`${flows.length} flow${flows.length === 1 ? '' : 's'} · ${flows.filter((f) => f.status === 'on').length} active`}
        showLogo
      />
      <FlatList
        data={flows}
        keyExtractor={(f) => f.id}
        renderItem={renderItem}
        scrollEnabled={flows.length > 0}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoaded ? (
            <EmptyState
              icon="layers"
              title="No flows yet"
              message="Browse templates and tap “Use this template” to create your first flow."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: colorTokens.radius,
    padding: 16,
    gap: 10,
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
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
