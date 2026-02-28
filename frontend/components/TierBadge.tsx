import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export type TierLevel = 'Easy' | 'Medium' | 'Hard';

interface TierBadgeProps {
  tier: TierLevel;
  label?: string; // e.g., "Foundational", "Application", "Complex"
}

export default function TierBadge({ tier, label }: TierBadgeProps) {
  const getBackgroundColor = () => {
    switch (tier) {
      case 'Easy': return Colors.badges.easy;     // #3B82F6
      case 'Medium': return Colors.badges.medium; // #F59E0B
      case 'Hard': return Colors.badges.hard;     // #EF4444
      default: return Colors.textSecondary;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.text}>
        [{tier.toUpperCase()}] {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  text: {
    color: Colors.surface, // #FFFFFF
    fontSize: 12,
    fontWeight: 'bold',
  },
});