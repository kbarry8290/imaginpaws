import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import Layout from '@/constants/Layout';
import Card from '@/components/ui/Card';
import { Moon, Sun, Bell, Save, CircleHelp as HelpCircle, Lock, Info, Heart, Settings as SettingsIcon, ChevronRight, LogOut, Crown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useCredits } from '@/contexts/CreditsContext';
import Button from '@/components/ui/Button';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { credits, dailyScansUsed } = useCredits();
  
  const [highQualityEnabled, setHighQualityEnabled] = React.useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(
    colorScheme === 'dark'
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleGetMoreCredits = () => {
    router.push('/pro');
  };

  const toggleHighQuality = () => {
    setHighQualityEnabled(prev => !prev);
  };

  const toggleAutoSave = () => {
    setAutoSaveEnabled(prev => !prev);
  };

  const toggleDarkMode = () => {
    setDarkModeEnabled(prev => !prev);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <SettingsIcon size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Settings
        </Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {user && (
          <Card style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account
            </Text>
            <View style={styles.accountInfo}>
              <Text style={[styles.emailText, { color: colors.text }]}>
                {user.email}
              </Text>
            </View>
          </Card>
        )}

        <Card style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Picture Credits
          </Text>
          
          <View style={styles.creditsContainer}>
            <View style={styles.creditStats}>
              <View style={styles.creditItem}>
                <Text style={[styles.creditValue, { color: colors.text }]}>
                  {credits}
                </Text>
                <Text style={[styles.creditLabel, { color: colors.placeholderText }]}>
                  Available Credits
                </Text>
              </View>
              
              <View style={styles.creditDivider} />
              
              <View style={styles.creditItem}>
                <Text style={[styles.creditValue, { color: colors.text }]}>
                  {2 - dailyScansUsed}
                </Text>
                <Text style={[styles.creditLabel, { color: colors.placeholderText }]}>
                  Free Transformations Today
                </Text>
              </View>
            </View>

            {credits === 0 && (
              <Text style={[styles.freeUserNote, { color: colors.placeholderText }]}>
                Free users get 2 new picture credits each day
              </Text>
            )}

            <Button
              title="Get More Credits"
              onPress={handleGetMoreCredits}
              icon={<Crown size={20} color="white" />}
              style={styles.creditsButton}
            />
          </View>
        </Card>
        
        <Card style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            App Preferences
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              {darkModeEnabled ? (
                <Moon size={20} color={colors.text} />
              ) : (
                <Sun size={20} color={colors.text} />
              )}
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </Card>
        
        <Card style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Support
          </Text>
          
          <TouchableOpacity 
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://example.com/help')}
          >
            <View style={styles.settingLabelContainer}>
              <HelpCircle size={20} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Help & Support
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://example.com/privacy')}
          >
            <View style={styles.settingLabelContainer}>
              <Lock size={20} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Privacy Policy
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.linkRow, styles.lastRow]}
            onPress={() => Linking.openURL('https://example.com/feedback')}
          >
            <View style={styles.settingLabelContainer}>
              <Heart size={20} color={colors.text} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Send Feedback
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </Card>

        {user && (
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: colors.error + '20' }]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.signOutText, { color: colors.error }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.placeholderText }]}>
            ImaginPaws v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: colors.placeholderText }]}>
            Made with ❤️ for pets everywhere
          </Text>
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
    justifyContent: 'center',
    padding: Layout.spacing.l,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginLeft: Layout.spacing.s,
  },
  scrollContent: {
    padding: Layout.spacing.l,
    paddingTop: 0,
  },
  settingsSection: {
    marginBottom: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    marginBottom: Layout.spacing.m,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    marginLeft: Layout.spacing.m,
  },
  footer: {
    alignItems: 'center',
    marginTop: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    marginBottom: Layout.spacing.xs,
  },
  accountInfo: {
    marginBottom: Layout.spacing.m,
  },
  emailText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.small,
    marginBottom: Layout.spacing.l,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    marginLeft: Layout.spacing.s,
  },
  creditsContainer: {
    alignItems: 'center',
  },
  creditStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Layout.spacing.l,
  },
  creditItem: {
    alignItems: 'center',
  },
  creditValue: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    marginBottom: Layout.spacing.xs,
  },
  creditLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  creditDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  freeUserNote: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
  },
  creditsButton: {
    minWidth: 200,
  },
});