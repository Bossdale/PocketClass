import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Shapes,        // Creative icon for Math
  Dna,           // Creative icon for Science
  Feather,       // Creative icon for English (Quill/Writing)
  Hourglass,     // Creative icon for History (Time)
  Compass,       // Creative icon for Geography
  Users,         // Creative icon for Civics (Society)
  ChevronRight,
  BookOpen       // Fallback
} from 'lucide-react-native';

import ProgressRing from './ProgressRing';
import type { Subject, SubjectProgress } from '@/lib/types';

interface SubjectTileProps {
  subject: Subject;
  progress: SubjectProgress;
  index: number;
}

// 1. Creative Theme Dictionary: Unique colors and icons per subject
const SUBJECT_THEMES: Record<string, { icon: any, iconColor: string, bgColor: string }> = {
  math: { icon: Shapes, iconColor: '#f59e0b', bgColor: '#fffbeb' },       // Amber
  science: { icon: Dna, iconColor: '#10b981', bgColor: '#ecfdf5' },        // Emerald
  english: { icon: Feather, iconColor: '#8b5cf6', bgColor: '#f5f3ff' },    // Violet
  history: { icon: Hourglass, iconColor: '#f43f5e', bgColor: '#fff1f2' },  // Rose
  geography: { icon: Compass, iconColor: '#0ea5e9', bgColor: '#f0f9ff' },  // Sky Blue
  civics: { icon: Users, iconColor: '#4f46e5', bgColor: '#eef2ff' },       // Indigo
};

// Fallback theme if a new subject is added
const DEFAULT_THEME = { icon: BookOpen, iconColor: '#3b82f6', bgColor: '#eff6ff' };

const colors = {
  foreground: '#0f172a',
  mutedForeground: '#64748b',
  background: '#ffffff',
  border: '#f1f5f9', // Softer border color for a cleaner look
};

const SubjectTile: React.FC<SubjectTileProps> = ({ subject, progress }) => {
  const router = useRouter();

  // Get the creative theme for this specific subject
  const theme = SUBJECT_THEMES[subject.id] || DEFAULT_THEME;
  const IconComponent = theme.icon;

  const handleClick = () => {
    if (progress.diagnosticCompleted) {
      router.push({ pathname: "/SubjectView", params: { subjectId: subject.id } });
    } else {
      router.push({ pathname: "/DiagnosticTest", params: { subjectId: subject.id } });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleClick}
      style={styles.card}
    >
      <View style={styles.leftSection}>
        {/* 2. Dynamic, colorful icon box */}
        <View style={[styles.iconBox, { backgroundColor: theme.bgColor }]}>
          <IconComponent size={34} color={theme.iconColor} strokeWidth={2.5} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.lessonCount}>
            {progress.lessonsCompleted} / {subject.totalLessons} lessons
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {progress.diagnosticCompleted ? (
          <ProgressRing progress={progress.masteryScore} size={52} strokeWidth={5} />
        ) : (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        <ChevronRight size={24} color="#cbd5e1" style={{ marginLeft: 12 }} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: 110,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    // Soft, premium shadow
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20, // Slightly more rounded for aesthetic feel
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '800', // Made title slightly bolder
    color: colors.foreground,
    letterSpacing: -0.3, // Tighter tracking for modern typography
  },
  lessonCount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
    marginTop: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: '#fef9c3', // Soft yellow
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ca8a04', // Rich yellow/amber
    letterSpacing: 0.5,
  },
});

export default SubjectTile;