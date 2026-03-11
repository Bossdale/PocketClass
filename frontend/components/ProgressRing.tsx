import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

// Wrap the SVG Circle in an Animated component so Reanimated can control it
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

// Color palette (adjust these to match your exact brand colors)
const colors = {
  primary: '#2563eb', // Equivalent to your --primary
  accent: '#38bdf8',  // Equivalent to your --country-accent
  muted: '#e2e8f0',   // Light gray background track
  text: '#0f172a',    // Dark slate text
};

const ProgressRing = ({ 
  progress, 
  size = 64, 
  strokeWidth = 4, 
  children 
}: ProgressRingProps) => {
  // Math calculations for the circle
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Reanimated shared value starts at full circumference (0% progress)
  const animatedOffset = useSharedValue(circumference);

  // Trigger the animation whenever the 'progress' prop changes
  useEffect(() => {
    animatedOffset.value = withTiming(offset, {
      duration: 700, // Matches your duration-700
      easing: Easing.inOut(Easing.ease),
    });
  }, [offset]);

  // Connect the shared value to the Circle's strokeDashoffset prop
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      
      {/* The SVG wrapper rotated -90deg so progress starts at the top */}
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.accent} />
            <Stop offset="100%" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        
        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.muted}
          strokeWidth={strokeWidth}
        />
        
        {/* Animated Foreground Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>

      {/* Center Content (Absolute positioning) */}
      <View style={styles.centerContent} pointerEvents="none">
        {children || (
          <Text style={styles.percentageText}>
            {Math.round(progress)}%
          </Text>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});

export default ProgressRing;