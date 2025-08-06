import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAnonymousTransformations } from '@/contexts/AnonymousTransformationsContext';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANONYMOUS_TRANSFORMS_KEY = 'anonymous_transformations';

export default function DebugMigration() {
  const { user } = useAuth();
  const { transformationsLeft, transformationsUsed, manualMigrate } = useAnonymousTransformations();
  const [asyncStorageData, setAsyncStorageData] = React.useState<string | null>(null);

  const checkAsyncStorage = async () => {
    try {
      const data = await AsyncStorage.getItem(ANONYMOUS_TRANSFORMS_KEY);
      setAsyncStorageData(data);
      console.log('🔍 [Debug] AsyncStorage data:', data);
    } catch (error) {
      console.error('🔍 [Debug] Error reading AsyncStorage:', error);
    }
  };

  const triggerMigration = async () => {
    console.log('🔍 [Debug] Manually triggering migration...');
    await manualMigrate();
  };

  React.useEffect(() => {
    checkAsyncStorage();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Migration</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>User: {user ? user.id : 'No user'}</Text>
        <Text style={styles.infoText}>Transformations Used: {transformationsUsed}</Text>
        <Text style={styles.infoText}>Transformations Left: {transformationsLeft}</Text>
        <Text style={styles.infoText}>AsyncStorage: {asyncStorageData ? 'Has data' : 'No data'}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkAsyncStorage}>
        <Text style={styles.buttonText}>Check AsyncStorage</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={triggerMigration}>
        <Text style={styles.buttonText}>Trigger Migration</Text>
      </TouchableOpacity>

      {asyncStorageData && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>AsyncStorage Data:</Text>
          <Text style={styles.dataText}>{asyncStorageData}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dataContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
}); 