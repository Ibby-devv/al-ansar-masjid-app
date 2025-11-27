import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { useTheme } from '../../contexts/ThemeContext';
import type { AppTheme } from '../../hooks/useAppTheme';

interface UpdatingBannerProps {
  text?: string;
}

export default function UpdatingBanner({ text = 'Updating…' }: UpdatingBannerProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity }]} />
      <ThemedText style={styles.text}>{text}</ThemedText>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface.soft,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border.soft,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.brand.navy[600],
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text.muted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
