import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

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

  useEffect(() => {
    addLog('🔗 [Reset] Debug component mounted');
    addLog('🔗 [Reset] No longer expecting URL params');
    addLog('🔗 [Reset] Using Supabase session-based approach');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Password Reset Debug</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
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
