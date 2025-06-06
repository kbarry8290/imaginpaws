import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Share,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Card from './ui/Card';
import { Download, Share2 } from 'lucide-react-native';
import { TransformSettings } from './TransformOptions';
import Button from './ui/Button';
import ImageViewer from './ImageViewer';
import ShareModal from './ShareModal';
import { useAuth } from '@/contexts/AuthContext';

type ResultCardProps = {
  originalPhoto: string;
  resultPhoto: string | null;
  settings: TransformSettings;
  isLoading: boolean;
};

export default function ResultCard({ 
  originalPhoto, 
  resultPhoto, 
  settings,
  isLoading
}: ResultCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setViewerVisible(true);
  };

  const generateCombinedImage = async (includeWatermark: boolean) => {
    if (!process.env.EXPO_PUBLIC_IMAGINPAWS_SHARE_API_URL) {
      throw new Error('Share API URL not configured');
    }

    const response = await fetch(process.env.EXPO_PUBLIC_IMAGINPAWS_SHARE_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_IMAGINPAWS_API_KEY}`
      },
      body: JSON.stringify({
        originalUrl: originalPhoto,
        generatedUrl: resultPhoto,
        addWatermark: includeWatermark,
        userId: user?.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate combined image');
    }

    const data = await response.json();
    if (!data.sharedUrl) {
      throw new Error('No shared URL in response');
    }

    return data.sharedUrl;
  };

  const handleShare = async (type: 'single' | 'combined', includeWatermark: boolean) => {
    if (!resultPhoto) return;
    
    try {
      setError(null);
      setProcessing(true);

      let shareUrl = resultPhoto;

      if (type === 'combined') {
        shareUrl = await generateCombinedImage(includeWatermark);
      }

      if (Platform.OS === 'web') {
        await Clipboard.setString(shareUrl);
        alert('Link copied to clipboard! You can now share it manually.');
      } else {
        await Share.share({
          url: shareUrl,
          message: 'Check out this AI-transformed pet human!',
        });
      }

      setShareModalVisible(false);
    } catch (error: any) {
      console.error("Error sharing: ", error);
      setError(error.message || 'Failed to share image');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (type: 'single' | 'combined', includeWatermark: boolean) => {
    if (!resultPhoto) return;
    
    try {
      setError(null);
      setProcessing(true);

      let downloadUrl = resultPhoto;

      if (type === 'combined') {
        downloadUrl = await generateCombinedImage(includeWatermark);
      }

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `imaginpaws-${type}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Download feature coming soon to mobile!');
      }

      setDownloadModalVisible(false);
    } catch (error: any) {
      console.error("Error downloading: ", error);
      setError(error.message || 'Failed to download image');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card style={styles.loadingCard}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Transforming your pet... 🐾➡️🧑
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.placeholderText }]}>
            This may take a moment. Our AI is working hard!
          </Text>
        </View>
      </Card>
    );
  }

  if (!resultPhoto || !settings) return null;

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.imagesContainer}>
          <TouchableOpacity 
            style={styles.imageWrapper}
            onPress={() => handleImagePress(originalPhoto)}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: originalPhoto }} 
              style={styles.image}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <View style={styles.arrowContainer}>
            <Text style={styles.arrowText}>➡️</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.imageWrapper}
            onPress={() => handleImagePress(resultPhoto)}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: resultPhoto }} 
              style={styles.image}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="Share"
            onPress={() => setShareModalVisible(true)}
            icon={<Share2 size={18} color="white" />}
            size="small"
            style={styles.actionButton}
          />
          <Button
            title="Download"
            onPress={() => setDownloadModalVisible(true)}
            variant="secondary"
            icon={<Download size={18} color="white" />}
            size="small"
            style={styles.actionButton}
          />
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
      </Card>

      {selectedImage && (
        <ImageViewer
          isVisible={viewerVisible}
          imageUrl={selectedImage}
          onClose={() => {
            setViewerVisible(false);
            setSelectedImage(null);
          }}
        />
      )}

      <ShareModal
        isVisible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        onShare={handleShare}
        loading={processing}
        error={error}
      />

      <ShareModal
        isVisible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        onShare={handleDownload}
        isDownload
        loading={processing}
        error={error}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Layout.spacing.l,
    padding: Layout.spacing.m,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    marginTop: Layout.spacing.m,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    marginTop: Layout.spacing.s,
    textAlign: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.m,
  },
  imageWrapper: {
    width: '45%',
    aspectRatio: 0.8,
    borderRadius: Layout.borderRadius.small,
    backgroundColor: 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  arrowContainer: {
    width: '10%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Layout.spacing.m,
  },
  actionButton: {
    minWidth: 120,
  },
  errorContainer: {
    marginTop: Layout.spacing.m,
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
});