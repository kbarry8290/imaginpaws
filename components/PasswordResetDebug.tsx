import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';

type DebugInfo = {
  timestamp: string;
  message: string;
  data?: any;
};

export default function PasswordResetDebug() {
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);

  const addLog = (message: string, data?: any) => {
    const log: DebugInfo = {
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    setDebugLogs(prev => [log, ...prev.slice(0, 19)]); // Keep last 20 logs
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const checkSessionManually = async () => {
    try {
      addLog('🔗 [Reset] Manual session check triggered');
      const { data: { session }, error } = await supabase.auth.getSession();
      addLog('🔗 [Reset] Manual session result', {
        hasSession: !!session,
        hasError: !!error,
        errorMessage: error?.message,
        sessionUserId: session?.user?.id,
        sessionCreatedAt: session?.created_at
      });
    } catch (err) {
      addLog('🔗 [Reset] Manual session check error', err);
    }
  };

  useEffect(() => {
    addLog('🔗 [Reset] Debug component mounted');
    addLog('🔗 [Reset] Using Supabase session-based approach');
    addLog('🔗 [Reset] Deep link handler will establish session');
    
    // Check session status periodically
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        addLog('🔗 [Reset] Session check', {
          hasSession: !!session,
          hasError: !!error,
          errorMessage: error?.message,
          sessionUserId: session?.user?.id
        });
      } catch (err) {
        addLog('🔗 [Reset] Session check error', err);
      }
    };
    
    // Check immediately
    checkSession();
    
    // Check every 2 seconds for the first 10 seconds
    const interval = setInterval(checkSession, 2000);
    setTimeout(() => clearInterval(interval), 10000);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Password Reset Debug</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={checkSessionManually}>
            <Text style={styles.actionButtonText}>Check Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={false}>
        {debugLogs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <Text style={styles.timestamp}>{log.timestamp.split('T')[1].split('.')[0]}</Text>
            <Text style={styles.message}>{log.message}</Text>
            {log.data && (
              <Text style={styles.data}>
                {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    margin: 16,
    borderRadius: 8,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logContainer: {
    padding: 12,
  },
  logEntry: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  message: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  data: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
    marginTop: 4,
    backgroundColor: '#f9f9f9',
    padding: 4,
    borderRadius: 2,
  },
});

// Export the addLog function so it can be used from other components
export const addDebugLog = (message: string, data?: any) => {
  // This will be replaced with a proper state management solution
  console.log(`🔗 [Reset] ${message}`, data);
};
