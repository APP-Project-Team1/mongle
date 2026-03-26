import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function LoadingSpinner({ message = '잠시만 기다려주세요...', fullScreen = true }) {
  if (!fullScreen) {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator size="small" color="#C9716A" />
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <ActivityIndicator size="large" color="#C9716A" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  inlineContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B5B55',
  },
});
