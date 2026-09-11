/**
 * StaffSidebar â€” left navigation panel for staff-facing pages.
 *
 * Shows navigation links and a session status summary.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';
import { KioskIcon, type IconName } from './KioskIcon';

// â”€â”€ Nav items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface NavItem {
  label: string;
  icon: IconName;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       icon: 'dashboard', route: '/staff'         },
  { label: 'Current Session', icon: 'session',   route: '/staff/session' },
  { label: 'Benefits',        icon: 'benefits',  route: '/benefits'      },
  { label: 'History',         icon: 'history',   route: '/staff'         },
  { label: 'Settings',        icon: 'settings',  route: '/settings'      },
];

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface StaffSidebarProps {
  sessionUser?: string;
  sessionStatus?: string;
}

export function StaffSidebar({
  sessionUser = 'User #1042',
  sessionStatus = 'Active',
}: StaffSidebarProps) {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      {/* Wordmark */}
      <View style={styles.brand}>
        <Text style={styles.brandText}>AccessAssist</Text>
        <Text style={styles.brandSub}>Staff Portal</Text>
      </View>

      {/* Nav */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.route;
          return (
            <Pressable
              key={item.label}
              style={({ pressed }: any) => [
                styles.navItem,
                isActive && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
              onPress={() => router.push(item.route as any)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
            >
              <KioskIcon
                name={item.icon}
                size={18}
                color={isActive ? AccessColors.teal : AccessColors.textSecondary}
              />
              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Session summary */}
      <View style={styles.sessionSummary}>
        <View style={styles.sessionDot} />
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionUser}>{sessionUser}</Text>
          <Text style={styles.sessionStatus}>{sessionStatus}</Text>
        </View>
      </View>
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: AccessColors.navy,
    paddingTop: AccessSpacing.xl,
    paddingBottom: AccessSpacing.lg,
    paddingHorizontal: AccessSpacing.md,
    gap: AccessSpacing.xl,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  brand: {
    paddingHorizontal: AccessSpacing.sm,
    gap: 2,
  },
  brandText: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textOnDark,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textOnDarkMuted,
    letterSpacing: 0.2,
  },
  nav: {
    gap: 2,
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.md,
    paddingVertical: AccessSpacing.sm + 2,
    paddingHorizontal: AccessSpacing.sm + 4,
    borderRadius: AccessRadius.sm,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  navItemActive: {
    backgroundColor: 'rgba(11, 123, 105, 0.25)',
  },
  navItemPressed: {
    opacity: 0.75,
  },
  navItemFocused: {
    ...Platform.select({
      web: {
        outlineWidth: 2,
        outlineColor: AccessColors.teal,
        outlineStyle: 'solid',
        outlineOffset: 1,
      },
      default: {},
    }),
  } as any,
  navLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textOnDarkMuted,
  },
  navLabelActive: {
    color: AccessColors.textOnDark,
  },
  sessionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AccessColors.statusGreen,
  },
  sessionInfo: {
    gap: 1,
  },
  sessionUser: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textOnDark,
  },
  sessionStatus: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textOnDarkMuted,
  },
});



