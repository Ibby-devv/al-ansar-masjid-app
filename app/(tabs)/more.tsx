import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Linking, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, Vibration, View, useWindowDimensions } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import PatternOverlay from '../../components/PatternOverlay';
import InstagramIcon from '../../components/ui/InstagramIcon';
import { useTheme } from '../../contexts/ThemeContext';
import type { AppTheme } from '../../hooks/useAppTheme';
import { useResponsive } from '../../hooks/useResponsive';

// Import custom hooks
import { useFirebaseData } from '../../hooks/useFirebaseData';

export default function MoreScreen(): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive(); // Get responsive scaling function
  const { fontScale } = useWindowDimensions(); // Get accessibility font scaling
  const { mosqueSettings, loading, error } = useFirebaseData();
  
  // Memoize styles based on theme and responsive scale
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
  
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
        colors={theme.gradients.header}
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
          {/* Show empty state when no mosque settings available after loading */}
          {!loading && !mosqueSettings ? (
            <EmptyState
              variant={error ? "error" : "offline"}
              icon="information-circle-outline"
              title="Mosque Information Unavailable"
              message={error || "Please check your internet connection and try again. Mosque details will appear when you're back online."}
            />
          ) : mosqueSettings ? (
            <>
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
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
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
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
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
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
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
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
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
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Facebook</Text>
                    <Text style={styles.infoValue}>Follow us on Facebook</Text>
                    <Text style={styles.infoHint}>
                      {toDisplayDomain((mosqueSettings as any)?.facebook as string)}
                    </Text>
                  </View>
                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                  </View>
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
                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
            </>
          ) : null}

          {/* App Info Section - Always visible */}
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

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
  headerGradient: {
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    ...theme.shadow.header,
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: ms(26, 0.3) * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text.header,
    marginBottom: ms(6, 0.1),
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: ms(16, 0.2) * fontScale,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
    paddingLeft: ms(4, 0.1),
  },
  sectionTitle: {
    fontSize: ms(18, 0.2) * fontScale,
    fontWeight: 'bold',
    color: theme.colors.text.strong,
    marginBottom: ms(4, 0.1),
  },
  sectionSubtitle: {
    fontSize: ms(13, 0.1) * fontScale,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  infoItem: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...theme.shadow.soft,
  },
  infoIconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: theme.colors.surface.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12, 0.1),
    flexShrink: 0,
  },
  facebookIconBg: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: theme.colors.iconBackground.facebook,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12, 0.1),
  },
  iconMapBg: {
    backgroundColor: theme.colors.iconBackground.map,
  },
  iconPhoneBg: {
    backgroundColor: theme.colors.iconBackground.phone,
  },
  iconEmailBg: {
    backgroundColor: theme.colors.iconBackground.email,
  },
  iconWebsiteBg: {
    backgroundColor: theme.colors.iconBackground.website,
  },
  iconImamBg: {
    backgroundColor: theme.colors.iconBackground.imam,
  },
  iconVersionBg: {
    backgroundColor: theme.colors.iconBackground.version,
  },
  iconDeveloperBg: {
    backgroundColor: theme.colors.iconBackground.developer,
  },
  iconSettingsBg: {
    backgroundColor: theme.colors.iconBackground.version,
  },
  infoTextContainer: {
    flex: 1,
    minWidth: 0, // Critical for text wrapping in flex containers
  },
  chevronContainer: {
    flexShrink: 0,
    marginLeft: ms(8, 0.1),
  },
  infoLabel: {
    fontSize: ms(12, 0.1) * fontScale,
    color: theme.colors.text.muted,
    marginBottom: ms(2, 0.05),
  },
  infoValue: {
    fontSize: ms(15, 0.2) * fontScale,
    color: theme.colors.text.strong,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  infoHint: {
    fontSize: ms(12, 0.1) * fontScale,
    color: theme.colors.text.muted,
    marginTop: ms(2, 0.05),
    flexWrap: 'wrap',
  },
  actionItem: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadow.soft,
  },
  actionIconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: theme.colors.surface.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12, 0.1),
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: ms(15, 0.2) * fontScale,
    color: theme.colors.text.strong,
    fontWeight: '600',
    marginBottom: ms(2, 0.05),
  },
  actionSubtext: {
    fontSize: ms(12, 0.1) * fontScale,
    color: theme.colors.text.muted,
  },
  footer: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    borderTopWidth: ms(1, 0.05),
    borderTopColor: theme.colors.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: ms(14, 0.2) * fontScale,
    color: theme.colors.text.muted,
    marginBottom: ms(4, 0.1),
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: ms(12, 0.1) * fontScale,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});
