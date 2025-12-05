import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppTheme, useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { ThemedText } from '../themed-text';

interface UpdatingBannerProps {
  text?: string;
}

export default function UpdatingBanner({ text = 'Updating…' }: UpdatingBannerProps): React.JSX.Element {
  const theme = useTheme();
  const { ms } = useResponsive();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, ms, fontScale), [theme, ms, fontScale]);
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

const createStyles = (theme: AppTheme, ms: (size: number, factor?: number) => number, fontScale: number) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: ms(10, 0.1),
    paddingVertical: ms(6, 0.05),
    backgroundColor: theme.colors.surface.soft,
    borderRadius: ms(999, 0.2),
    borderWidth: ms(1, 0.05),
    borderColor: theme.colors.border.soft,
    marginBottom: ms(10, 0.1),
  },
  dot: {
    width: ms(8, 0.1),
    height: ms(8, 0.1),
    borderRadius: ms(4, 0.1),
    backgroundColor: theme.colors.brand.navy[600],
    marginRight: ms(8, 0.05),
  },
  text: {
    fontSize: ms(12, 0.2) * fontScale,
    lineHeight: ms(18, 0.2) * fontScale,
    color: theme.colors.text.muted,
    fontWeight: '600',
    letterSpacing: ms(0.3, 0.05),
  },
});
