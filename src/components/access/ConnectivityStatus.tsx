import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { AccessColors, AccessAnimation, AccessFontWeight, AccessSpacing } from '@/constants/access-theme';
import { useSession } from '@/context/SessionContext';
import { UI_STRINGS } from '@/constants/i18n';

interface ConnectivityStatusProps {
  isNarrow: boolean;
}

export function ConnectivityStatus({ isNarrow }: ConnectivityStatusProps) {
  const { session } = useSession();
  const ui = UI_STRINGS[session.language] ?? UI_STRINGS.en;
  
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [pulseOpacity] = useState(() => new Animated.Value(0.7));

  useEffect(() => {
    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    
    // For web fallback, though NetInfo handles web, navigator is sometimes more reliable
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
      
      return () => {
        unsubscribe();
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.5,
              duration: AccessAnimation.pulse / 2,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: AccessAnimation.pulse / 2,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0);
    }
  }, [isOnline, pulseAnim, pulseOpacity]);

  const dotColor = isOnline ? AccessColors.statusGreen : '#F59E0B'; // Amber
  const pulseColor = isOnline ? AccessColors.statusGreenPulse : 'transparent';
  const label = isOnline ? ui.available : 'Offline mode — Core services available';

  if (isNarrow) {
    return (
      <View style={styles.statusDotWrapper}>
        <Animated.View
          style={[
            styles.statusRing,
            { backgroundColor: pulseColor, transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
          ]}
        />
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      </View>
    );
  }

  return (
    <View
      style={styles.statusPill}
      accessibilityLabel={isOnline ? 'Service status: online' : 'Service status: offline'}
      accessibilityRole="text"
    >
      <View style={styles.statusDotWrapper}>
        <Animated.View
          style={[
            styles.statusRing,
            { backgroundColor: pulseColor, transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
          ]}
        />
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      </View>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDotWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textOnDarkMuted,
  },
});
