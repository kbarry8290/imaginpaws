import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { usePurchases } from '@/contexts/PurchasesContext';
import { Crown, Check, Sparkles } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useCredits } from '@/contexts/CreditsContext';

export default function ProScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { packages, loading, purchasePackage, restorePurchases } = usePurchases();
  const { pictureCredits, dailyScansUsed, error: creditsError, clearError } = useCredits();
  const [error, setError] = useState<string | null>(null);

  // Log initial state
  useEffect(() => {
    console.log('ProScreen: Initial render', {
      packagesCount: packages.length,
      loading,
      pictureCredits,
      dailyScansUsed
    });
  }, []);

  // Log when packages change
  useEffect(() => {
    console.log('ProScreen: Packages updated:', packages);
  }, [packages]);

  const handlePurchase = async (packageIndex: number) => {
    try {
      console.log('ProScreen: Starting purchase for package index:', packageIndex);
      setError(null);
      await purchasePackage(packages[packageIndex]);
    } catch (err: any) {
      console.error('ProScreen: Purchase error:', err);
      setError(err.message || 'Failed to complete purchase');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Crown size={40} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Get More Credits
          </Text>
          <Text style={[styles.subtitle, { color: colors.placeholderText }]}>
            Transform more pets with credits
          </Text>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {pictureCredits}
              </Text>
              <Text style={[styles.statLabel, { color: colors.placeholderText }]}>
                Credits Left
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {2 - dailyScansUsed}
              </Text>
              <Text style={[styles.statLabel, { color: colors.placeholderText }]}>
                Free Credits Left
              </Text>
            </View>
          </View>
        </Card>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
        
        {creditsError && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{creditsError}</Text>
            <TouchableOpacity onPress={clearError} style={styles.dismissButton}>
              <Text style={[styles.dismissText, { color: colors.error }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <Card style={styles.loadingCard}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading available packages...
            </Text>
          </Card>
        )}

        {!loading && packages.length === 0 && (
          <Card style={styles.errorCard}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              No packages available. Please try again later.
            </Text>
          </Card>
        )}

        {!loading && packages.length > 0 && (
          <View style={styles.packagesContainer}>
            {packages.map((pkg, index) => (
              <Card key={pkg.identifier} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <Sparkles size={24} color={colors.primary} />
                  <Text style={[styles.packageTitle, { color: colors.text }]}>
                    {pkg.product.title}
                  </Text>
                </View>
                <Text style={[styles.packagePrice, { color: colors.text }]}>
                  {pkg.product.priceString}
                </Text>
                <Text style={[styles.packageDescription, { color: colors.placeholderText }]}>
                  {pkg.product.description}
                </Text>
                <Button
                  title={`Buy ${pkg.product.priceString}`}
                  onPress={() => handlePurchase(index)}
                  icon={<Crown size={24} color="white" />}
                  style={styles.purchaseButton}
                />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    marginTop: Layout.spacing.m,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  statsCard: {
    marginBottom: Layout.spacing.l,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    marginBottom: Layout.spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  packagesContainer: {
    gap: Layout.spacing.l,
  },
  packageCard: {
    alignItems: 'center',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.s,
  },
  packageTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    marginLeft: Layout.spacing.s,
  },
  packagePrice: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    marginBottom: Layout.spacing.s,
  },
  packageDescription: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
  },
  purchaseButton: {
    minWidth: 200,
  },
  errorContainer: {
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    marginBottom: Layout.spacing.l,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  webMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  webMessageText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    padding: Layout.spacing.l,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  errorCard: {
    alignItems: 'center',
    padding: Layout.spacing.l,
  },
  dismissButton: {
    marginTop: Layout.spacing.s,
    alignSelf: 'flex-end',
  },
  dismissText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textDecorationLine: 'underline',
  },
});