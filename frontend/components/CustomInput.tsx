import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Colors } from '../constants/Colors';

interface CustomInputProps extends TextInputProps {
  label: string;
  isDropdown?: boolean;
  onDropdownPress?: () => void;
}

export default function CustomInput({ label, isDropdown, onDropdownPress, ...textInputProps }: CustomInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {isDropdown ? (
        <TouchableOpacity style={styles.inputContainer} onPress={onDropdownPress} activeOpacity={0.7}>
          <Text style={[styles.inputText, !textInputProps.value && styles.placeholder]}>
            {textInputProps.value || textInputProps.placeholder || 'Select...'}
          </Text>
          {/* Simple text-based chevron for the mock dropdown */}
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputText}
            placeholderTextColor={Colors.textSecondary}
            {...textInputProps}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary, // #64748B
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9', // Light gray background
    borderWidth: 1,
    borderColor: Colors.border, // #CBD5E1
    borderRadius: 8,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary, // #0F172A
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
});