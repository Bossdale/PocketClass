import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

const ProgressRing = ({ progress, size = 64, strokeWidth = 4, children }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Clamp progress between 0 and 100 to prevent the circle from wrapping backwards
  const safeProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* We rotate the SVG -90deg so the progress starts at the top (12 o'clock) */}
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#60a5fa" />
            <Stop offset="100%" stopColor="#3b82f6" />
          </LinearGradient>
        </Defs>
        
        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6" // Muted gray background
          strokeWidth={strokeWidth}
        />
        
        {/* Active Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </Svg>
      
      {/* Absolute positioned center text */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children || (
          <Text className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            {Math.round(safeProgress)}%
          </Text>
        )}
      </View>
    </View>
  );
};

export default ProgressRing;