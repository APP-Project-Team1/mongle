import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Badge({ children, style, textStyle, variant = 'rose' }) {
  const isRose = variant === 'rose';
  return (
    <View style={[styles.badge, isRose ? styles.badgeRose : styles.badgeInk, style]}>
      <Text style={[styles.text, isRose ? styles.textRose : styles.textInk, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeRose: {
    backgroundColor: '#F5EAE9',
  },
  badgeInk: {
    backgroundColor: '#EBF2EE',
  },
  text: {
    fontSize: 10,
    fontWeight: '500',
  },
  textRose: {
    color: '#C9716A',
  },
  textInk: {
    color: '#7A9E8E',
  },
});
