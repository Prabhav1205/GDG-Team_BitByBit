/**
 * BenefitCard â€” card for displaying a service/scheme/benefit item.
 *
 * Used on the Benefits (/benefits) page.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';
import { StatusBadge, type StatusVariant } from './StatusBadge';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface BenefitItem {
  id: string;
  title: string;
  status: string;
  statusVariant: StatusVariant;
  description: string;
  category: 'bank' | 'hospital' | 'government' | 'all';
}

interface BenefitCardProps {
  item: BenefitItem;
  onViewDetails?: (id: string) => void;
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function BenefitCard({ item, onViewDetails }: BenefitCardProps) {
  return (
    <View style={styles.card} accessibilityRole="none">
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <StatusBadge label={item.status} variant={item.statusVariant} />
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <Pressable
        style={({ pressed }: any) => [
          styles.btn,
          pressed && styles.btnPressed,
        ]}
        onPress={() => onViewDetails?.(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${item.title}`}
      >
        <Text style={styles.btnLabel}>View Details</Text>
      </Pressable>
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  card: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: AccessSpacing.md,
    flexWrap: 'wrap',
  },
  title: {
    flex: 1,
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    lineHeight: 26,
  },
  description: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textSecondary,
    lineHeight: 24,
  },
  btn: {
    alignSelf: 'flex-start',
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.lg,
    borderRadius: AccessRadius.sm,
    borderWidth: 1.5,
    borderColor: AccessColors.navy,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { outlineStyle: 'none' },
      default: {},
    }),
  },
  btnPressed: {
    opacity: 0.7,
    backgroundColor: AccessColors.overlay,
  },
  btnFocused: {
    ...Platform.select({
      web: {
        outlineWidth: 3,
        outlineColor: AccessColors.focusRing,
        outlineStyle: 'solid',
        outlineOffset: 2,
      },
      default: {},
    }),
  } as any,
  btnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },
});


