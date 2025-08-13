import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  VirtualizedList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { 
  logInfo, 
  logWarn, 
  logError, 
  getAll, 
  clear, 
  shareFile, 
  copyToClipboard,
  DEBUG_DIAGNOSTICS,
  LogEntry,
  time,
  duration
} from '@/utils/DebugLogger';
import { supabase } from '@/lib/supabase';
import NetInfo from '@react-native-async-storage/async-storage';
import { 
  Share, 
  Copy, 
  Trash2, 
  Play, 
  Pause, 
  ArrowLeft,
  Activity,
  Wifi,
  WifiOff,
  Shield,
  User,
  Navigation,
  Link,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react-native';

interface DeepLinkState {
  initialURL?: string;
  lastURL?: string;
  normalizedURL?: string;
  parsedTokens?: {
    code?: string;
    access_token?: string;
    refresh_token?: string;
  };
  handlerStatus: 'idle' | 'processing' | 'done' | 'error';
  lastError?: string;
  timestamps: {
    received?: number;
    processed?: number;
  };
}

interface AuthState {
  session?: any;
  userId?: string;
  expiresAt?: string;
  isRecoveryFlow?: boolean;
  lastChecked: number;
}

interface RouteTransition {
  from: string;
  to: string;
  timestamp: number;
  reason: string;
}

interface NetworkCall {
  url: string;
  method: string;
  status?: number;
  duration: number;
  timestamp: number;
}

export default function DiagnosticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const segments = useSegments();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [deepLinkState, setDeepLinkState] = useState<DeepLinkState>({
    handlerStatus: 'idle',
    timestamps: {},
  });
  const [authState, setAuthState] = useState<AuthState>({
    lastChecked: 0,
  });
  const [routeTransitions, setRouteTransitions] = useState<RouteTransition[]>([]);
  const [networkCalls, setNetworkCalls] = useState<NetworkCall[]>([]);
  const [networkStatus, setNetworkStatus] = useState<string>('unknown');
  const [refreshing, setRefreshing] = useState(false);
  const [simulateUrl, setSimulateUrl] = useState('');
  const [guardsPaused, setGuardsPaused] = useState(false);

  const logsRef = useRef<VirtualizedList<LogEntry>>(null);

  useEffect(() => {
    if (!DEBUG_DIAGNOSTICS) return;

    const updateLogs = () => {
      setLogs(getAll());
    };

    // Update logs every second
    const interval = setInterval(updateLogs, 1000);
    updateLogs(); // Initial load

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!DEBUG_DIAGNOSTICS) return;

    // Check auth state
    const checkAuthState = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        setAuthState({
          session,
          userId: session?.user?.id,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
          isRecoveryFlow: session?.user?.app_metadata?.provider === 'email',
          lastChecked: Date.now(),
        });

        if (error) {
          logError('DIAGNOSTICS', 'Failed to get auth session', { error });
        }
      } catch (error) {
        logError('DIAGNOSTICS', 'Error checking auth state', { error });
      }
    };

    checkAuthState();
    const authInterval = setInterval(checkAuthState, 5000);

    return () => clearInterval(authInterval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLogs(getAll());
    setRefreshing(false);
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clear();
            setLogs([]);
            logInfo('DIAGNOSTICS', 'Logs cleared by user');
          },
        },
      ]
    );
  };

  const handleShareLogs = async () => {
    try {
      await shareFile();
      logInfo('DIAGNOSTICS', 'Logs shared successfully');
    } catch (error) {
      logError('DIAGNOSTICS', 'Failed to share logs', { error });
      Alert.alert('Error', 'Failed to share logs');
    }
  };

  const handleCopyLogs = async () => {
    try {
      await copyToClipboard();
      logInfo('DIAGNOSTICS', 'Logs copied to clipboard');
      Alert.alert('Success', 'Logs copied to clipboard');
    } catch (error) {
      logError('DIAGNOSTICS', 'Failed to copy logs', { error });
      Alert.alert('Error', 'Failed to copy logs');
    }
  };

  const handleSimulateDeepLink = () => {
    if (!simulateUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL to simulate');
      return;
    }

    logInfo('DIAGNOSTICS', 'Simulating deep link', { url: simulateUrl });
    setDeepLinkState(prev => ({
      ...prev,
      lastURL: simulateUrl,
      handlerStatus: 'processing',
      timestamps: { ...prev.timestamps, received: Date.now() },
    }));

    // Simulate processing
    setTimeout(() => {
      setDeepLinkState(prev => ({
        ...prev,
        handlerStatus: 'done',
        timestamps: { ...prev.timestamps, processed: Date.now() },
      }));
    }, 2000);
  };

  const handlePauseGuards = () => {
    setGuardsPaused(true);
    logInfo('DIAGNOSTICS', 'Route guards paused for 10 seconds');
    
    setTimeout(() => {
      setGuardsPaused(false);
      logInfo('DIAGNOSTICS', 'Route guards resumed');
    }, 10000);
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <View style={[styles.logItem, { borderLeftColor: getLogLevelColor(item.level) }]}>
      <View style={styles.logHeader}>
        <Text style={[styles.logTimestamp, { color: colors.placeholderText }]}>
          {new Date(item.ts).toLocaleTimeString()}
        </Text>
        <Text style={[styles.logLevel, { color: getLogLevelColor(item.level) }]}>
          {item.level.toUpperCase()}
        </Text>
        <Text style={[styles.logTag, { color: colors.text }]}>
          {item.tag}
        </Text>
      </View>
      <Text style={[styles.logMessage, { color: colors.text }]}>
        {item.msg}
      </Text>
      {item.data && (
        <Text style={[styles.logData, { color: colors.placeholderText }]}>
          {JSON.stringify(item.data, null, 2)}
        </Text>
      )}
      {item.duration && (
        <Text style={[styles.logDuration, { color: colors.placeholderText }]}>
          Duration: {item.duration}ms
        </Text>
      )}
    </View>
  );

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#6b7280';
      default: return colors.text;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Activity size={16} color="#f59e0b" />;
      case 'done': return <CheckCircle size={16} color="#10b981" />;
      case 'error': return <AlertCircle size={16} color="#ef4444" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  if (!DEBUG_DIAGNOSTICS) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Diagnostics Disabled
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Diagnostics</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
            <Activity size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Deep Link Panel */}
        <View style={[styles.panel, { backgroundColor: colors.card }]}>
          <View style={styles.panelHeader}>
            <Link size={20} color={colors.text} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>Deep Link</Text>
            {getStatusIcon(deepLinkState.handlerStatus)}
          </View>
          
          <View style={styles.panelContent}>
            <Text style={[styles.label, { color: colors.placeholderText }]}>Status:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {deepLinkState.handlerStatus.toUpperCase()}
            </Text>
            
            {deepLinkState.lastURL && (
              <>
                <Text style={[styles.label, { color: colors.placeholderText }]}>Last URL:</Text>
                <Text style={[styles.value, { color: colors.text }]} numberOfLines={2}>
                  {deepLinkState.lastURL}
                </Text>
              </>
            )}
            
            {deepLinkState.parsedTokens && (
              <>
                <Text style={[styles.label, { color: colors.placeholderText }]}>Parsed Tokens:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {JSON.stringify(deepLinkState.parsedTokens, null, 2)}
                </Text>
              </>
            )}
            
            {deepLinkState.lastError && (
              <>
                <Text style={[styles.label, { color: colors.placeholderText }]}>Last Error:</Text>
                <Text style={[styles.value, { color: colors.error }]}>
                  {deepLinkState.lastError}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Auth Panel */}
        <View style={[styles.panel, { backgroundColor: colors.card }]}>
          <View style={styles.panelHeader}>
            <User size={20} color={colors.text} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>Auth State</Text>
          </View>
          
          <View style={styles.panelContent}>
            <Text style={[styles.label, { color: colors.placeholderText }]}>User ID:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {authState.userId || 'Not authenticated'}
            </Text>
            
            <Text style={[styles.label, { color: colors.placeholderText }]}>Expires At:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {authState.expiresAt || 'N/A'}
            </Text>
            
            <Text style={[styles.label, { color: colors.placeholderText }]}>Recovery Flow:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {authState.isRecoveryFlow ? 'Yes' : 'No'}
            </Text>
            
            <Text style={[styles.label, { color: colors.placeholderText }]}>Last Checked:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {new Date(authState.lastChecked).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Routing Panel */}
        <View style={[styles.panel, { backgroundColor: colors.card }]}>
          <View style={styles.panelHeader}>
            <Navigation size={20} color={colors.text} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>Routing</Text>
            {guardsPaused && <Pause size={16} color="#f59e0b" />}
          </View>
          
          <View style={styles.panelContent}>
            <Text style={[styles.label, { color: colors.placeholderText }]}>Current Path:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {segments.join('/')}
            </Text>
            
            <Text style={[styles.label, { color: colors.placeholderText }]}>Segments:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {JSON.stringify(segments)}
            </Text>
            
            <Text style={[styles.label, { color: colors.placeholderText }]}>Route Transitions:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {routeTransitions.length} transitions recorded
            </Text>
          </View>
        </View>

        {/* Network Panel */}
        <View style={[styles.panel, { backgroundColor: colors.card }]}>
          <View style={styles.panelHeader}>
            <Wifi size={20} color={colors.text} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>Network</Text>
          </View>
          
          <View style={styles.panelContent}>
            <Text style={[styles.label, { color: colors.placeholderText }]}>Status:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {networkStatus}
            </Text>
            
            <Text style={[styles.label, { color: colors.placeholderText }]}>Supabase Calls:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {networkCalls.length} calls recorded
            </Text>
          </View>
        </View>

        {/* Actions Panel */}
        <View style={[styles.panel, { backgroundColor: colors.card }]}>
          <View style={styles.panelHeader}>
            <Shield size={20} color={colors.text} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>Actions</Text>
          </View>
          
          <View style={styles.panelContent}>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={handleShareLogs} style={styles.actionButton}>
                <Share size={16} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleCopyLogs} style={styles.actionButton}>
                <Copy size={16} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>Copy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleClearLogs} style={styles.actionButton}>
                <Trash2 size={16} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handlePauseGuards} style={styles.actionButton}>
                <Pause size={16} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>Pause Guards</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.simulateSection}>
              <Text style={[styles.label, { color: colors.placeholderText }]}>Simulate Deep Link:</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                value={simulateUrl}
                onChangeText={setSimulateUrl}
                placeholder="Enter URL to simulate..."
                placeholderTextColor={colors.placeholderText}
              />
              <TouchableOpacity 
                onPress={handleSimulateDeepLink}
                style={[styles.simulateButton, { backgroundColor: colors.primary }]}
              >
                <Play size={16} color="white" />
                <Text style={styles.simulateButtonText}>Simulate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logs Panel */}
        <View style={[styles.panel, { backgroundColor: colors.card }]}>
          <View style={styles.panelHeader}>
            <Activity size={20} color={colors.text} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>Live Logs ({logs.length})</Text>
          </View>
          
          <View style={styles.logsContainer}>
            <VirtualizedList
              ref={logsRef}
              data={logs}
              renderItem={renderLogItem}
              keyExtractor={(item, index) => `${item.ts}-${index}`}
              getItemCount={() => logs.length}
              getItem={(data, index) => data[index]}
              style={styles.logsList}
              showsVerticalScrollIndicator={false}
              inverted
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: Layout.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: Layout.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  panel: {
    margin: Layout.spacing.m,
    borderRadius: 12,
    padding: Layout.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
    gap: Layout.spacing.xs,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  panelContent: {
    gap: Layout.spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    marginBottom: Layout.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.s,
    marginBottom: Layout.spacing.m,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    gap: Layout.spacing.xs,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  simulateSection: {
    gap: Layout.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    fontSize: 14,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xs,
    borderRadius: 8,
    gap: Layout.spacing.xs,
  },
  simulateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  logsContainer: {
    height: 300,
  },
  logsList: {
    flex: 1,
  },
  logItem: {
    padding: Layout.spacing.s,
    borderLeftWidth: 3,
    marginBottom: Layout.spacing.xs,
    backgroundColor: '#f9fafb',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  logTimestamp: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  logLevel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  logTag: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 12,
    marginBottom: Layout.spacing.xs,
  },
  logData: {
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    padding: Layout.spacing.xs,
    borderRadius: 4,
  },
  logDuration: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
});
