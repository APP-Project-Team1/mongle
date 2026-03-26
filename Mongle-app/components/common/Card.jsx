import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Card({ children, style, title, titleRight }) {
  return (
    <View style={[styles.card, style]}>
      {(title || titleRight) && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {titleRight}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2420',
  },
});
