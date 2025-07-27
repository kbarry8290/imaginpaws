import { createContext, useContext, useEffect, useState } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import { useCredits } from './CreditsContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { logPurchaseEvent, logError } from '@/utils/logging';

const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_FwOKNWNOVyeGgcGlnqdUGPQGoQZ',
  android: 'YOUR_ANDROID_KEY',
  default: '',
});

const CREDIT_PACKS = {
  'scan_pack_3': 3,
  'scan_pack_8a': 8,
  'scan_pack_25': 25,
};

type PurchasesContextType = {
  packages: PurchasesPackage[];
  loading: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextType | undefined>(undefined);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { addCredits } = useCredits();
  const { user } = useAuth();

  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('RevenueCat: Skipping initialization on web platform');
      setLoading(false);
      return;
    }

    const initializePurchases = async () => {
      try {
        console.log('RevenueCat: Initializing with API key:', REVENUECAT_API_KEY);
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        console.log('RevenueCat: Successfully initialized');
        
        // Get available packages
        console.log('RevenueCat: Fetching offerings');
        const offerings = await Purchases.getOfferings();
        console.log('RevenueCat: Received offerings:', offerings);

        if (offerings.current) {
          console.log('RevenueCat: Current offering packages:', offerings.current.availablePackages);
          setPackages(offerings.current.availablePackages);
        } else {
          console.warn('RevenueCat: No current offering available');
        }
      } catch (error) {
        console.error('RevenueCat: Error initializing purchases:', error);
        logError(error as Error, { context: 'revenueCat_init' });
      } finally {
        setLoading(false);
      }
    };

    initializePurchases();
  }, []);

  const logPurchase = async (productId: string, creditsAdded: number) => {
    try {
      await supabase
        .from('credit_purchase_log')
        .insert([{
          user_id: user?.id,
          product_id: productId,
          credits_added: creditsAdded
        }]);

      console.log('RevenueCat: Logged purchase of', productId, 'for', creditsAdded, 'credits');
    } catch (error) {
      console.error('RevenueCat: Error logging purchase:', error);
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage) => {
    try {
      console.log('RevenueCat: Starting purchase for package:', pkg.identifier);
      logPurchaseEvent('started', pkg.identifier, { 
        price: pkg.product.price,
        userId: user?.id 
      });

      const { productIdentifier } = await Purchases.purchasePackage(pkg);
      console.log('RevenueCat: Purchase successful for:', productIdentifier);
      
      const creditAmount = CREDIT_PACKS[productIdentifier as keyof typeof CREDIT_PACKS];
      
      if (creditAmount) {
        console.log('RevenueCat: Adding credits:', creditAmount);
        await addCredits(creditAmount);
        await logPurchase(productIdentifier, creditAmount);
        
        logPurchaseEvent('completed', productIdentifier, {
          credits: creditAmount,
          userId: user?.id
        });

        if (Platform.OS !== 'web') {
          Alert.alert(
            'Purchase Successful',
            `✅ You've added ${creditAmount} picture credits!`
          );
        }
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('RevenueCat: Purchase error:', error);
        logPurchaseEvent('failed', pkg.identifier, {
          error: error.message,
          userId: user?.id
        });
        throw error;
      } else {
        console.log('RevenueCat: Purchase cancelled by user');
      }
    }
  };

  const restorePurchases = async () => {
    try {
      console.log('RevenueCat: Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      console.log('RevenueCat: Restore successful, customer info:', customerInfo);
    } catch (error) {
      console.error('RevenueCat: Restore error:', error);
      throw error;
    }
  };

  return (
    <PurchasesContext.Provider
      value={{
        packages,
        loading,
        purchasePackage,
        restorePurchases,
      }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (context === undefined) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }
  return context;
}