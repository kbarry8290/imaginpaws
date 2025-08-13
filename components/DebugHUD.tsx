import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { DEBUG_DIAGNOSTICS, logInfo } from '@/utils/DebugLogger';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';

interface DebugHUDProps {
  deepLinkStatus: 'idle' | 'processing' | 'done' | 'error';
  lastError?: string;
}

export default function DebugHUD({ deepLinkStatus, lastError }: DebugHUDProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  useEffect(() => {
    if (!DEBUG_DIAGNOSTICS) return;

    const now = Date.now();
    if (now - lastTapTime > 2000) {
      setTapCount(1);
    } else {
      setTapCount(prev => prev + 1);
    }
    setLastTapTime(now);

    if (tapCount >= 4) {
      logInfo('DEBUG_HUD', 'Diagnostics screen accessed via HUD tap');
      router.push('/(diagnostics)/diagnostics' as any);
      setTapCount(0);
    }
  }, [tapCount, lastTapTime, router]);

  const handleTap = () => {
    if (!DEBUG_DIAGNOSTICS) return;
    setTapCount(prev => prev + 1);
  };

  const getStatusIcon = () => {
    switch (deepLinkStatus) {
      case 'processing': return <Activity size={12} color="#f59e0b" />;
      case 'done': return <CheckCircle size={12} color="#10b981" />;
      case 'error': return <AlertCircle size={12} color="#ef4444" />;
      default: return <Clock size={12} color="#6b7280" />;
    }
  };

  const getStatusText = () => {
    switch (deepLinkStatus) {
      case 'processing': return 'Processing deep link...';
      case 'done': return 'Deep link processed';
      case 'error': return `Error: ${lastError || 'Unknown'}`;
      default: return 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (deepLinkStatus) {
      case 'processing': return '#f59e0b';
      case 'done': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!DEBUG_DIAGNOSTICS) return null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.cardBackground,
          borderColor: getStatusColor(),
        }
      ]}
      onPress={handleTap}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {getStatusIcon()}
        <Text style={[styles.text, { color: colors.text }]}>
          {getStatusText()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 9999,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
