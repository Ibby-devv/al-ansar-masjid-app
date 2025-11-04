import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import QiblaCompass from '../../components/QiblaCompass';

export default function QiblaScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <QiblaCompass />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
