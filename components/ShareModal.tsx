import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import { Share2, Download, Lock, X, Image as ImageIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import Card from './ui/Card';
import Button from './ui/Button';

type ShareModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onShare: (type: 'single' | 'combined', includeWatermark: boolean) => void;
  isDownload?: boolean;
  loading?: boolean;
  error?: string | null;
};

export default function ShareModal({
  isVisible,
  onClose,
  onShare,
  isDownload = false,
  loading = false,
  error = null,
}: ShareModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { credits } = useCredits();
  const [includeWatermark, setIncludeWatermark] = React.useState(true);
  
  // User is considered Pro if they have any credits left (not including free credits)
  const isPro = credits > 0;

  const handleAction = (type: 'single' | 'combined') => {
    onShare(type, includeWatermark);
  };

  const actionText = isDownload ? 'Download' : 'Share';

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.background + 'F5' }]}>
        <Card style={styles.modal}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {actionText} Options
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardBackground }]}
              onPress={onClose}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Processing image...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.options}>
                <Button
                  title={`${actionText} Transformation Only`}
                  onPress={() => handleAction('single')}
                  icon={isDownload ? <Download size={20} color="white" /> : <Share2 size={20} color="white" />}
                  style={styles.button}
                />
                
                <Button
                  title={`${actionText} Side-by-Side`}
                  onPress={() => handleAction('combined')}
                  icon={<ImageIcon size={20} color="white" />}
                  style={styles.button}
                />
              </View>

              <View style={[styles.watermarkContainer, { borderColor: colors.border }]}>
                <View style={styles.watermarkRow}>
                  <Text style={[styles.watermarkText, { color: colors.text }]}>
                    Include watermark on image
                  </Text>
                  {!isPro && (
                    <Lock size={16} color={colors.placeholderText} />
                  )}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: includeWatermark ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => isPro && setIncludeWatermark(!includeWatermark)}
                  disabled={!isPro}
                >
                  <View style={[
                    styles.toggleHandle,
                    {
                      backgroundColor: colors.cardBackground,
                      transform: [{ translateX: includeWatermark ? 20 : 0 }],
                    },
                  ]} />
                </TouchableOpacity>
              </View>

              {!isPro && (
                <Text style={[styles.upgradeText, { color: colors.placeholderText }]}>
                  Upgrade to Pro to remove watermark
                </Text>
              )}
            </>
          )}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  modal: {
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.l,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  options: {
    gap: Layout.spacing.m,
    marginBottom: Layout.spacing.l,
  },
  button: {
    width: '100%',
  },
  watermarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    borderWidth: 1,
    marginBottom: Layout.spacing.s,
  },
  watermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.s,
  },
  watermarkText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  upgradeText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  loadingText: {
    marginTop: Layout.spacing.m,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
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
});