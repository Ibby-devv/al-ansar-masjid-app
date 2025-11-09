import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import DeviceInfo from 'react-native-device-info';
import { Linking, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PatternOverlay from '../../components/PatternOverlay';
import InstagramIcon from '../../components/ui/InstagramIcon';
import { Theme } from '../../constants/theme';

// Import custom hooks
import { useFirebaseData } from '../../hooks/useFirebaseData';

export default function MoreScreen(): React.JSX.Element {
  const { mosqueSettings } = useFirebaseData();
  // App version info (marketing version + build number)
  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  const toDisplayDomain = (raw?: string) => {
    if (!raw) return '';
    try {
      const u = raw.startsWith('http') ? new URL(raw) : new URL(`https://${raw}`);
      return u.host + (u.pathname && u.pathname !== '/' ? u.pathname : '');
    } catch {
      return raw;
    }
  };

  const extractHandle = (raw?: string) => {
    if (!raw) return '';
    const v = raw.trim();
    if (v.startsWith('@')) return v.slice(1);
    try {
      if (v.startsWith('http')) {
        const u = new URL(v);
        const parts = u.pathname.split('/').filter(Boolean);
        return parts[0] || '';
      }
      if (v.startsWith('www.')) return v.slice(4);
      if (v.includes('/')) return v.split('/')[0];
      return v;
    } catch {
      return v.replace(/^www\./, '');
    }
  };

  const triggerHaptic = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.selectionAsync();
      } else if (Platform.OS === 'android') {
        // Some Android devices/emulators ignore haptics; add a tiny vibration as fallback.
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Vibration.vibrate(10);
      }
    } catch {
      if (Platform.OS === 'android') {
        Vibration.vibrate(10);
      }
    }
  };

  const handlePress = async (type: 'phone' | 'email' | 'website' | 'map' | 'facebook' | 'instagram') => {
    await triggerHaptic();
    let url = '';
    
    switch (type) {
      case 'phone':
        if (mosqueSettings?.phone) {
          url = `tel:${mosqueSettings.phone.replace(/[^0-9]/g, '')}`;
        }
        break;
      case 'email':
        if (mosqueSettings?.email) {
          url = `mailto:${mosqueSettings.email}`;
        }
        break;
      case 'website':
        if (mosqueSettings?.website) {
          url = mosqueSettings.website.startsWith('http') 
            ? mosqueSettings.website 
            : `https://${mosqueSettings.website}`;
        }
        break;
      case 'map':
        if (mosqueSettings?.address) {
          const encodedAddress = encodeURIComponent(mosqueSettings.address);
          url = `https://maps.google.com/?q=${encodedAddress}`;
        }
        break;
      case 'facebook': {
        const fb = (mosqueSettings as any)?.facebook as string | undefined;
        if (fb) {
          const webUrl = fb.startsWith('http') ? fb : `https://facebook.com/${fb}`;
          // Try to open in app first (facewebmodal fallback works if app installed)
          const appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;
          try {
            const can = await Linking.canOpenURL(appUrl);
            url = can ? appUrl : webUrl;
          } catch {
            url = webUrl;
          }
        }
        break;
      }
      case 'instagram': {
        const raw = (mosqueSettings as any)?.instagram as string | undefined;
        if (raw) {
          const handle = extractHandle(raw);
          const webUrl = raw.startsWith('http') ? raw : `https://instagram.com/${handle || raw}`;
          const appUrl = handle ? `instagram://user?username=${handle}` : '';
          try {
            if (appUrl) {
              const can = await Linking.canOpenURL(appUrl);
              url = can ? appUrl : webUrl;
            } else {
              url = webUrl;
            }
          } catch {
            url = webUrl;
          }
        }
        break;
      }
    }
    
    if (url) {
      Linking.openURL(url).catch(err => console.error('Error opening link:', err));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[Theme.colors.brand.navy[800], Theme.colors.brand.navy[700], Theme.colors.brand.navy[900]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <PatternOverlay
          style={styles.patternOverlay}
          variant="stars"
          opacity={0.05}
          tileSize={28}
          color="rgba(255,255,255,0.7)"
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {mosqueSettings?.name || 'Al Ansar Masjid'}
            </Text>
            <Text style={styles.headerSubtitle}>Mosque Information</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {/* Content */}
        <View style={styles.contentContainer}>
          {/* About Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.sectionSubtitle}>Masjid details and contact</Text>
            </View>
            
            {mosqueSettings?.address && (
              <TouchableOpacity 
                style={styles.infoItem}
                onPress={() => handlePress('map')}
              >
                <View style={[styles.infoIconContainer, styles.iconMapBg]}>
                  <Ionicons name="location" size={24} color="#fff" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{mosqueSettings.address}</Text>
                  <Text style={styles.infoHint}>Opens Google Maps</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {mosqueSettings?.phone && (
              <TouchableOpacity 
                style={styles.infoItem}
                onPress={() => handlePress('phone')}
              >
                <View style={[styles.infoIconContainer, styles.iconPhoneBg]}>
                  <Ionicons name="call" size={24} color="#fff" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{mosqueSettings.phone}</Text>
                  <Text style={styles.infoHint}>Opens dialer</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {mosqueSettings?.email && (
              <TouchableOpacity 
                style={styles.infoItem}
                onPress={() => handlePress('email')}
              >
                <View style={[styles.infoIconContainer, styles.iconEmailBg]}>
                  <Ionicons name="mail" size={24} color="#fff" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{mosqueSettings.email}</Text>
                  <Text style={styles.infoHint}>Compose email</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {mosqueSettings?.website && (
              <TouchableOpacity 
                style={styles.infoItem}
                onPress={() => handlePress('website')}
              >
                <View style={[styles.infoIconContainer, styles.iconWebsiteBg]}>
                  <Ionicons name="globe" size={24} color="#fff" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={styles.infoValue}>{toDisplayDomain(mosqueSettings.website)}</Text>
                  <Text style={styles.infoHint}>Opens in browser</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {mosqueSettings?.imam && (
              <View style={styles.infoItem}>
                <View style={[styles.infoIconContainer, styles.iconImamBg]}>
                  <Ionicons name="ribbon" size={24} color="#fff" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Imam</Text>
                  <Text style={styles.infoValue}>{mosqueSettings.imam}</Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Social Media Section (moved above App Information) */}
          {((mosqueSettings as any)?.facebook || (mosqueSettings as any)?.instagram) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Connect</Text>
                <Text style={styles.sectionSubtitle}>Follow us for updates</Text>
              </View>

              {(mosqueSettings as any)?.facebook && (
                <TouchableOpacity style={styles.infoItem} onPress={() => handlePress('facebook')}>
                  <View style={[styles.infoIconContainer, styles.facebookIconBg]}>
                    <Ionicons name="logo-facebook" size={24} color="#fff" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Facebook</Text>
                    <Text style={styles.infoValue}>Follow us on Facebook</Text>
                    <Text style={styles.infoHint}>{toDisplayDomain((mosqueSettings as any)?.facebook as string)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}

              {(mosqueSettings as any)?.instagram && (
                <TouchableOpacity style={styles.infoItem} onPress={() => handlePress('instagram')}>
                  <View style={styles.infoIconContainer}>
                    <InstagramIcon size={24} />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Instagram</Text>
                    <Text style={styles.infoValue}>Follow us on Instagram</Text>
                    <Text style={styles.infoHint}>
                      @{extractHandle((mosqueSettings as any)?.instagram as string)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* App Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>App Information</Text>
              <Text style={styles.sectionSubtitle}>Version and developer details</Text>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, styles.iconVersionBg]}>
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>
                  {appVersion}
                  {buildNumber ? ` (${buildNumber})` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, styles.iconDeveloperBg]}>
                <Ionicons name="code-slash" size={24} color="#fff" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Developed by</Text>
                <Text style={styles.infoValue}>Ibrahim Eter</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Built with ❤️ for the Muslim Community
            </Text>
            <Text style={styles.footerSubtext}>
              © 2025 Al Ansar Masjid Yagoona
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface.muted,
  },
  headerGradient: {
    paddingBottom: Theme.spacing.xl,
    borderBottomLeftRadius: Theme.radius.xl,
    borderBottomRightRadius: Theme.radius.xl,
    ...Theme.shadow.header,
  },
  patternOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Theme.colors.text.inverse,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.colors.text.subtle,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Theme.colors.surface.muted,
    padding: Theme.spacing.lg,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    marginBottom: Theme.spacing.md,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text.strong,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Theme.colors.text.muted,
    fontWeight: '500',
  },
  infoItem: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadow.soft,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  facebookIconBg: {
    backgroundColor: '#1877F2',
  },
  iconMapBg: {
    backgroundColor: '#ef4444', // red-500
  },
  iconPhoneBg: {
    backgroundColor: '#22c55e', // green-500
  },
  iconEmailBg: {
    backgroundColor: '#f59e0b', // amber-500
  },
  iconWebsiteBg: {
    backgroundColor: '#0ea5e9', // sky-500
  },
  iconImamBg: {
    backgroundColor: Theme.colors.brand.gold[600], // gold for leadership/honor
  },
  iconVersionBg: {
    backgroundColor: '#8b5cf6', // violet-500 for tech/version
  },
  iconDeveloperBg: {
    backgroundColor: '#6366f1', // indigo-500 for developer/code
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Theme.colors.text.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: Theme.colors.text.strong,
    fontWeight: '500',
  },
  infoHint: {
    fontSize: 12,
    color: Theme.colors.text.muted,
    marginTop: 2,
  },
  actionItem: {
    backgroundColor: Theme.colors.surface.base,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadow.soft,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    color: Theme.colors.text.strong,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 12,
    color: Theme.colors.text.muted,
  },
  footer: {
    marginTop: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.base,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Theme.colors.text.muted,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: Theme.colors.text.muted,
  },
});
