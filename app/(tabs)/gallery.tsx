import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  useWindowDimensions
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Card from '@/components/ui/Card';
import { Wand as Wand2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import Button from '@/components/ui/Button';
import { TransformSettings } from '@/components/TransformOptions';
import DebugMigration from '@/components/DebugMigration';

type Transformation = {
  id: string;
  original_photo: string;
  result_photo: string;
  style: string;
  sex: string;
  personality: string;
  outfit: string; // Changed from clothing to outfit to match database
  background: string;
  age: string;
  created_at: string;
};

export default function GalleryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { credits, dailyScansUsed } = useCredits();
  const { width: screenWidth } = useWindowDimensions();
  
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransformations = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('transformations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTransformations(data || []);
    } catch (err) {
      console.error('Error fetching transformations:', err);
      setError('Failed to load transformations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransformations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransformations();
  };

  const handleNewTransform = () => {
    router.push('/(tabs)/transform');
  };

  const handleTransformationPress = (transformation: Transformation) => {
    const settings: TransformSettings = {
      style: transformation.style,
      gender: transformation.sex,
      personality: transformation.personality,
      clothing: transformation.outfit, // Map outfit back to clothing for TransformSettings
      background: transformation.background,
      age: transformation.age,
    };

    router.push({
      pathname: '/results',
      params: {
        originalPhoto: transformation.original_photo,
        resultPhoto: transformation.result_photo,
        settings: JSON.stringify(settings),
      },
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Sign in to view your transformations
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/login')}
            style={styles.signInButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Gallery</Text>
          <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
            Your magical transformations
          </Text>
        </View>
        <View style={[styles.creditsIndicator, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.creditsText, { color: colors.primary }]}>
            {credits + (2 - dailyScansUsed)} transformations left
          </Text>
        </View>
      </View>
      <Button
        title="New Transformation"
        onPress={handleNewTransform}
        icon={<Wand2 size={20} color="white" />}
        style={styles.newTransformButton}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.text }]}>
        Ready to see some magic? ✨
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.placeholderText }]}>
        Transform your first pet into their human persona!
      </Text>
      <Button
        title="Start First Transformation"
        onPress={handleNewTransform}
        icon={<Wand2 size={24} color="white" />}
        style={styles.startButton}
      />
    </View>
  );

  const renderTransformationList = () => (
    <View style={styles.list}>
      {transformations.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => handleTransformationPress(item)}
          activeOpacity={0.8}
        >
          <Card style={styles.transformationCard}>
            <View style={styles.imagesContainer}>
              <View style={styles.imageWrapper}>
                <Image 
                  source={{ uri: item.original_photo }} 
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.arrow, { backgroundColor: colors.cardBackground }]}>
                <Text style={styles.arrowText}>➡️</Text>
              </View>
              <View style={styles.imageWrapper}>
                <Image 
                  source={{ uri: item.result_photo }} 
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Button
            title="Try Again"
            onPress={fetchTransformations}
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading transformations...
          </Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Debug component - remove after testing */}
          <DebugMigration />
          
          {transformations.length > 0 ? renderTransformationList() : renderEmptyState()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Layout.spacing.m,
    paddingBottom: Layout.spacing.s,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.s,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  creditsIndicator: {
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 20,
  },
  creditsText: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
  },
  newTransformButton: {
    marginTop: Layout.spacing.xs,
  },
  scrollContent: {
    padding: Layout.spacing.l,
    paddingTop: Layout.spacing.s,
  },
  list: {
    gap: Layout.spacing.m,
  },
  transformationCard: {
    padding: Layout.spacing.s,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 160,
  },
  imageWrapper: {
    width: '45%',
    height: '100%',
    borderRadius: Layout.borderRadius.small,
    backgroundColor: 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  arrowText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: Layout.spacing.s,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    marginTop: Layout.spacing.m,
  },
  errorContainer: {
    margin: Layout.spacing.l,
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
  },
  retryButton: {
    minWidth: 120,
  },
  signInButton: {
    marginTop: Layout.spacing.l,
    minWidth: 200,
  },
  startButton: {
    minWidth: 240,
  },
});