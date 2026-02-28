import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface CustomCheckboxProps {
  isChecked: boolean;
  onToggle: () => void;
}

export default function CustomCheckbox({ isChecked, onToggle }: CustomCheckboxProps) {
  return (
    // The TouchableOpacity itself is 44x44 to act as a large, accessible touch target
    <TouchableOpacity
      style={styles.touchTarget}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[
        styles.box,
        isChecked ? styles.boxChecked : styles.boxUnchecked
      ]}>
        {isChecked && <View style={styles.innerCheckmark} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxUnchecked: {
    borderColor: Colors.border, // #CBD5E1
    backgroundColor: Colors.surface, // #FFFFFF
  },
  boxChecked: {
    borderColor: Colors.primary, // #10B981
    backgroundColor: Colors.primary, // #10B981
  },
  // A simple pure CSS square rotated to look like a checkmark (or a simple box to keep it robust)
  innerCheckmark: {
    width: 10,
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: 2,
  },
});