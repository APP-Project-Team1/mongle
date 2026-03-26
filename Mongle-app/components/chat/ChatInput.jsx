import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatInput({ value, onChangeText, onSubmit, disabled, placeholder }) {
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder || '메시지 입력...'}
        placeholderTextColor="#8a7870"
        value={value}
        onChangeText={onChangeText}
        multiline
        maxHeight={100}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
        onPress={onSubmit}
        disabled={!canSend}
      >
        <Ionicons name="send" size={18} color={canSend ? '#fff' : '#c9a98e'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f5f0ee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f0ee',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#3a2e2a',
    marginRight: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#c9a98e',
  },
  sendBtnInactive: {
    backgroundColor: '#f5f0ee',
  },
});
