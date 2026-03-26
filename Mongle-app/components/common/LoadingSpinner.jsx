import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export function LoadingSpinner({ color = '#C9716A', size = 'large', message }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#8a7870',
  },
});
