import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { X, Save, Info, Plus, Minus, Clock, Trash2, CalendarPlus, AlertTriangle, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Partition } from '../../types';

interface PartitionConfigProps {
  partition: Partition;
  onSave: (data: Partial<Partition>) => void;
  onClose: () => void;
}

const PartitionConfig: React.FC<PartitionConfigProps> = ({ partition, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    label: partition.label === 'Unassigned' ? '' : partition.label,
    medicineName: partition.medicineName,
    pillCount: partition.pillCount === 0 ? 1 : partition.pillCount,
    // Ensure we have at least one schedule item
    schedule: partition.schedule.length > 0 ? partition.schedule : [new Date().toISOString()]
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the DatePicker modal
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showPicker, setShowPicker] = useState(false);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState<number | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Helper to format time to 12-hour AM/PM
  const formatTime12Hour = (isoString: string) => {
    const date = new Date(isoString);
    // Handle invalid dates gracefully
    if (isNaN(date.getTime())) return "Set Time";
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Helper to format date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Set Date";
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const addTimeSlot = () => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0); // Default to next hour
    setFormData({ ...formData, schedule: [...formData.schedule, nextHour.toISOString()] });
  };

  const removeTimeSlot = (index: number) => {
    const newSchedule = formData.schedule.filter((_, i) => i !== index);
    setFormData({ ...formData, schedule: newSchedule.length > 0 ? newSchedule : [new Date().toISOString()] });
  };

  const openPicker = (index: number, mode: 'date' | 'time') => {
    setCurrentScheduleIndex(index);
    setPickerMode(mode);
    setTempDate(new Date(formData.schedule[index]));
    setShowPicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // On Android, dismiss picker immediately after selection
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate && currentScheduleIndex !== null) {
      const currentDate = new Date(formData.schedule[currentScheduleIndex]);
      
      if (pickerMode === 'date') {
        // Keep the time, change the date
        currentDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      } else {
        // Keep the date, change the time
        currentDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      }
      
      const newSchedule = [...formData.schedule];
      newSchedule[currentScheduleIndex] = currentDate.toISOString();
      setFormData({ ...formData, schedule: newSchedule });

      // On Android, if we picked a date, we might want to immediately ask for time, 
      // but usually separate clicks are better UX.
    }
  };

  const handleSubmit = () => {
    if (!formData.label.trim() || !formData.medicineName.trim()) {
        setError("All fields are required.");
        return;
    }
    setSaving(true);
    // Simulate API call
    setTimeout(() => onSave(formData), 1200);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>S{partition.id}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Setup Slot</Text>
            <Text style={styles.headerSubtitle}>DIGITAL-PHYSICAL MAPPING</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={24} stroke="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {error && (
          <View style={styles.errorBanner}>
            <AlertTriangle size={18} stroke="#e11d48" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Info size={18} stroke="#1e40af" />
          <Text style={styles.infoText}>Configure what's inside this partition. We'll update your physical box immediately.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ILLNESS / PURPOSE</Text>
          <TextInput 
            style={styles.input}
            value={formData.label}
            onChangeText={(text) => setFormData({...formData, label: text})}
            placeholder="e.g. Heart Condition"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>MEDICINE NAME</Text>
          <TextInput 
            style={styles.input}
            value={formData.medicineName}
            onChangeText={(text) => setFormData({...formData, medicineName: text})}
            placeholder="e.g. Atorvastatin 20mg"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>TOTAL PILLS LOADED</Text>
          <View style={styles.counter}>
            <TouchableOpacity 
              onPress={() => setFormData({...formData, pillCount: Math.max(1, formData.pillCount - 1)})}
              style={styles.counterBtn}
            >
              <Minus size={24} stroke="#475569" />
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={styles.counterValue}>{formData.pillCount}</Text>
              <Text style={styles.counterLabel}>CURRENT INVENTORY</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFormData({...formData, pillCount: formData.pillCount + 1})}
              style={styles.counterBtn}
            >
              <Plus size={24} stroke="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scheduleGroup}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.label}>DOSE SCHEDULE</Text>
            <TouchableOpacity onPress={addTimeSlot} style={styles.addBtn}>
              <CalendarPlus size={14} stroke="#2563eb" />
              <Text style={styles.addBtnText}>Add Schedule</Text>
            </TouchableOpacity>
          </View>
          
          {formData.schedule.map((isoString, idx) => (
            <View key={idx} style={styles.timeRow}>
              {/* Date Picker Button */}
              <TouchableOpacity onPress={() => openPicker(idx, 'date')} style={styles.dateInput}>
                 <Calendar size={18} stroke="#64748b" />
                 <Text style={styles.dateText}>{formatDate(isoString)}</Text>
              </TouchableOpacity>

              {/* Time Picker Button */}
              <TouchableOpacity onPress={() => openPicker(idx, 'time')} style={styles.timeInput}>
                <Clock size={18} stroke="#2563eb" />
                <Text style={styles.timeText}>{formatTime12Hour(isoString)}</Text>
              </TouchableOpacity>

              {/* Delete Button */}
              {formData.schedule.length > 1 && (
                <TouchableOpacity onPress={() => removeTimeSlot(idx)} style={styles.deleteBtn}>
                  <Trash2 size={18} stroke="#e11d48" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={handleSubmit} disabled={saving} style={[styles.submitBtn, saving && styles.submitBtnDisabled]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Save size={24} stroke="#fff" />}
          <Text style={styles.submitBtnText}>{saving ? "SYNCING BOX..." : "SAVE & SYNC BOX"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* RENDER THE DATE PICKER (Logic differs for iOS vs Android) */}
      {showPicker && (
        Platform.OS === 'ios' ? (
          // iOS Modal Picker (Simplification for this example)
          // Ideally you wrap this in a Modal for iOS
          <DateTimePicker
            value={tempDate}
            mode={pickerMode}
            display="default"
            onChange={onDateChange}
            style={{ width: '100%', backgroundColor: 'white' }} 
          />
        ) : (
          // Android Picker (Opens natively)
          <DateTimePicker
            value={tempDate}
            mode={pickerMode}
            display="default"
            onChange={onDateChange}
          />
        )
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  idBadge: { width: 44, height: 44, backgroundColor: '#2563eb', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  idBadgeText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  headerSubtitle: { fontSize: 8, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  closeBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 100, borderWidth: 1, borderColor: '#e2e8f0' },
  form: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 60 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff1f2', padding: 16, borderRadius: 16, marginBottom: 20 },
  errorText: { color: '#e11d48', fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', gap: 12, backgroundColor: '#eff6ff', padding: 16, borderRadius: 20, marginBottom: 32 },
  infoText: { flex: 1, fontSize: 14, color: '#1e3a8a', fontWeight: '600' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  input: { fontSize: 18, fontWeight: 'bold', backgroundColor: '#f8fafc', padding: 16, borderRadius: 20, color: '#1e293b' },
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 24, gap: 12 },
  counterBtn: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  counterDisplay: { flex: 1, alignItems: 'center' },
  counterValue: { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  counterLabel: { fontSize: 8, fontWeight: '900', color: '#94a3b8' },
  scheduleGroup: { marginBottom: 32 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  
  // NEW STYLES FOR DATE/TIME INPUTS
  dateInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 20, gap: 8 },
  dateText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  
  timeInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 16, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: '#bae6fd' },
  timeText: { fontSize: 16, fontWeight: '900', color: '#0284c7' },
  
  deleteBtn: { padding: 16, backgroundColor: '#fff1f2', borderRadius: 16 },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 20, fontWeight: '900' }
});

export default PartitionConfig;