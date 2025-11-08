import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { Theme } from '../../constants/theme';

interface UpdatingBannerProps {
  text?: string;
}

export default function UpdatingBanner({ text = 'Updating…' }: UpdatingBannerProps): React.JSX.Element {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Theme.colors.surface.soft,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border.soft,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.brand.navy[600],
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.text.muted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
