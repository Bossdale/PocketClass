
import React, { useState } from 'react';
// Fix: added missing ActivityIndicator to react-native imports
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { X, Save, Info, Plus, Minus, Clock, Trash2, CalendarPlus, AlertTriangle } from 'lucide-react-native';
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
    schedule: partition.schedule.length > 0 ? [...partition.schedule] : ['08:00']
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTimeSlot = () => {
    setFormData({ ...formData, schedule: [...formData.schedule, '12:00'] });
  };

  const removeTimeSlot = (index: number) => {
    const newSchedule = formData.schedule.filter((_, i) => i !== index);
    setFormData({ ...formData, schedule: newSchedule.length > 0 ? newSchedule : ['08:00'] });
  };

  const handleSubmit = () => {
    if (!formData.label.trim() || !formData.medicineName.trim()) {
        setError("All fields are required.");
        return;
    }
    setSaving(true);
    setTimeout(() => onSave(formData), 1200);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>P{partition.id}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Setup Slot</Text>
            <Text style={styles.headerSubtitle}>DIGITAL-PHYSICAL MAPPING</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          {/* Fix: use stroke instead of color for lucide-react-native types */}
          <X size={24} stroke="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {error && (
          <View style={styles.errorBanner}>
            {/* Fix: use stroke instead of color for lucide-react-native types */}
            <AlertTriangle size={18} stroke="#e11d48" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          {/* Fix: use stroke instead of color for lucide-react-native types */}
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
              {/* Fix: use stroke instead of color for lucide-react-native types */}
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
              {/* Fix: use stroke instead of color for lucide-react-native types */}
              <Plus size={24} stroke="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scheduleGroup}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.label}>DOSE SCHEDULE</Text>
            <TouchableOpacity onPress={addTimeSlot} style={styles.addBtn}>
              {/* Fix: use stroke instead of color for lucide-react-native types */}
              <CalendarPlus size={14} stroke="#2563eb" />
              <Text style={styles.addBtnText}>Add Schedule</Text>
            </TouchableOpacity>
          </View>
          {formData.schedule.map((time, idx) => (
            <View key={idx} style={styles.timeRow}>
              <View style={styles.timeInput}>
                {/* Fix: use stroke instead of color for lucide-react-native types */}
                <Clock size={18} stroke="#94a3b8" />
                <TextInput value={time} editable={false} style={styles.timeText} />
              </View>
              {formData.schedule.length > 1 && (
                <TouchableOpacity onPress={() => removeTimeSlot(idx)} style={styles.deleteBtn}>
                  {/* Fix: use stroke instead of color for lucide-react-native types */}
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
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  timeInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 20, gap: 12 },
  timeText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  deleteBtn: { padding: 12, backgroundColor: '#fff1f2', borderRadius: 16 },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 20, fontWeight: '900' }
});

export default PartitionConfig;