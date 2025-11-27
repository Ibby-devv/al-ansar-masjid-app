import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import tab components
import PatternOverlay from '../../../components/PatternOverlay';
import PillToggle from '../../../components/ui/PillToggle';
import { useTheme } from '../../../contexts/ThemeContext';
import type { AppTheme } from '../../../hooks/useAppTheme';
import GiveTab from './give';
import HistoryTab from './history';
import ManageTab from './manage';

type TabType = 'give' | 'history' | 'manage';

export default function DonateIndex(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [activeTab, setActiveTab] = useState<TabType>('give');

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
            <Text style={styles.headerTitle}>Donate</Text>
            <Text style={styles.headerSubtitle}>Support Al Ansar</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tab Bar */}
      <PillToggle
        options={[
          { key: 'give', label: 'Give' },
          { key: 'history', label: 'History' },
          { key: 'manage', label: 'Manage' },
        ]}
        value={activeTab}
        onChange={(key) => setActiveTab(key as TabType)}
        style={{ marginTop: -12, marginBottom: 12 }}
      />

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'give' && <GiveTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'manage' && <ManageTab />}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text.header,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.surface.muted,
  },
});