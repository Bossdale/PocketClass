import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { X, Clock, Calendar, ChevronRight, Pill, Check, Plus, Minus, Save, AlertTriangle, Trash2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Partition } from '../../types';

// --- CONSTANTS ---
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
const WEEKDAYS = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

interface PartitionConfigProps {
  partition: Partition;
  onSave: (data: any) => void;
  onClose: () => void;
}

const PartitionConfig: React.FC<PartitionConfigProps> = ({ partition, onSave, onClose }) => {
  // --- 1. DETECT EDIT MODE ---
  const isEditMode = partition.label !== 'Unassigned';

  // --- 2. PRE-FILL STATE (If editing, use partition data; else default) ---
  const [basicInfo, setBasicInfo] = useState({
    label: isEditMode ? partition.label : '', 
    medicineName: isEditMode ? partition.medicineName : '',
    pillCount: partition.pillCount === 0 ? 1 : partition.pillCount,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- WIZARD STATE ---
  const [isWizardVisible, setWizardVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  
  // Initialize Wizard Data
  const [prescriptionType, setPrescriptionType] = useState<'temporary' | 'maintenance'>(
    partition.isShortTerm ? 'temporary' : 'maintenance'
  );
  
  // Duration Logic
  const [tempDuration, setTempDuration] = useState(
    partition.durationDays ? String(partition.durationDays) : '7'
  );
  const [tempUnit, setTempUnit] = useState<'days' | 'weeks'>('days');
  
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>(partition.frequencyType || 'daily');
  const [selectedDays, setSelectedDays] = useState<number[]>(partition.selectedDays || []);
  
  const [scheduleData, setScheduleData] = useState({
    dosage: partition.dosage || '',
    timesPerDay: partition.timesPerDay ? String(partition.timesPerDay) : '1',
    firstDoseTime: partition.schedule && partition.schedule.length > 0 ? new Date(partition.schedule[0]) : new Date(),
    startDate: new Date(), 
    color: partition.colorTheme && partition.colorTheme !== '#cbd5e1' ? partition.colorTheme : COLORS[4],
    isConfigured: isEditMode 
  });

  // --- PICKER HELPERS ---
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const openPicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selectedDate) return;

    if (pickerMode === 'date') {
      setScheduleData({ ...scheduleData, startDate: selectedDate });
    } else {
      setScheduleData({ ...scheduleData, firstDoseTime: selectedDate });
    }
  };

  const toggleDay = (dayValue: number) => {
    setSelectedDays(prev => 
      prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]
    );
  };

  const handleWizardSave = () => {
    if (frequencyType === 'weekly' && selectedDays.length === 0) {
      return alert("Please select at least one day of the week.");
    }
    setScheduleData(prev => ({ ...prev, isConfigured: true }));
    setWizardVisible(false);
  };

  // --- 3. REMOVE / UNASSIGN HANDLER ---
  const handleRemove = () => {
    Alert.alert(
      "Remove Assignment",
      "Are you sure you want to clear this slot? This will delete all schedule data for this medication.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => {
            setSaving(true);
            setTimeout(() => {
              // RESET DATA OBJECT
              const resetData = {
                ...partition,
                label: 'Unassigned',
                medicineName: '',
                pillCount: 0,
                schedule: [],
                colorTheme: '#cbd5e1', // Grey color for empty state
                isShortTerm: false,
                durationDays: 0,
                frequencyType: 'daily',
                selectedDays: [],
                timesPerDay: 0,
                dosage: '',
                isBlinking: false
              };
              onSave(resetData);
            }, 500);
          }
        }
      ]
    );
  };

  const handleFinalSave = () => {
    if (!basicInfo.medicineName.trim()) {
      setError("Medicine Name is required.");
      return;
    }
    if (!scheduleData.isConfigured) {
      setError("Please configure the schedule first.");
      return;
    }

    setSaving(true);
    
    setTimeout(() => {
        const finalDuration = prescriptionType === 'maintenance' 
            ? 365 
            : (parseInt(tempDuration) || 1) * (tempUnit === 'weeks' ? 7 : 1);

        const times = parseInt(scheduleData.timesPerDay) || 1;
        const generatedSchedule = [];
        const start = new Date(scheduleData.firstDoseTime);
        const intervalHours = 16 / Math.max(times, 1); 

        for (let i = 0; i < times; i++) {
          const nextDose = new Date(start);
          if (i > 0) nextDose.setHours(start.getHours() + (i * intervalHours));
          generatedSchedule.push(nextDose.toISOString());
        }

        const payload = {
            ...partition,
            label: basicInfo.label || (prescriptionType === 'maintenance' ? 'Daily Meds' : 'Temporary'),
            medicineName: basicInfo.medicineName,
            pillCount: basicInfo.pillCount,
            dosage: scheduleData.dosage,
            colorTheme: scheduleData.color,
            prescriptionType,
            frequencyType,
            selectedDays: frequencyType === 'weekly' ? selectedDays : [],
            durationDays: finalDuration,
            schedule: generatedSchedule, 
            timesPerDay: times
        };



        onSave(payload);
    }, 1000);
  };

  // --- RENDER WIZARD STEP 1 ---
  const renderWizardStep1 = () => (
    <View style={styles.wizContent}>
      <Text style={styles.wizTitle}>Prescription Type</Text>
      <Text style={styles.wizSubtitle}>How long will you be taking this?</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity 
          onPress={() => setPrescriptionType('temporary')}
          style={[styles.typeCard, prescriptionType === 'temporary' ? styles.cardActiveTemp : styles.cardInactive]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: prescriptionType === 'temporary' ? '#3b82f6' : '#f1f5f9' }]}>
              <Clock size={24} stroke={prescriptionType === 'temporary' ? '#fff' : '#64748b'} />
            </View>
            <Text style={styles.cardTitle}>Temporary</Text>
          </View>
          <Text style={styles.cardDesc}>Short-term treatment like antibiotics.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setPrescriptionType('maintenance')}
          style={[styles.typeCard, prescriptionType === 'maintenance' ? styles.cardActiveMain : styles.cardInactive]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: prescriptionType === 'maintenance' ? '#10b981' : '#f1f5f9' }]}>
              <Calendar size={24} stroke={prescriptionType === 'maintenance' ? '#fff' : '#64748b'} />
            </View>
            <Text style={styles.cardTitle}>Maintenance</Text>
          </View>
          <Text style={styles.cardDesc}>Long-term, ongoing medication.</Text>
        </TouchableOpacity>
      </View>

      {prescriptionType === 'temporary' && (
        <View style={styles.durationSection}>
          <Text style={styles.inputLabel}>SET DURATION</Text>
          <View style={styles.durationRow}>
            <TextInput 
              style={styles.durationInput}
              keyboardType="number-pad"
              value={tempDuration}
              onChangeText={setTempDuration}
            />
            <View style={styles.unitToggle}>
              <TouchableOpacity 
                style={[styles.unitBtn, tempUnit === 'days' && styles.unitBtnActive]}
                onPress={() => setTempUnit('days')}
              >
                <Text style={[styles.unitText, tempUnit === 'days' && styles.unitTextActive]}>Days</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.unitBtn, tempUnit === 'weeks' && styles.unitBtnActive]}
                onPress={() => setTempUnit('weeks')}
              >
                <Text style={[styles.unitText, tempUnit === 'weeks' && styles.unitTextActive]}>Weeks</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.wizFooter}>
        <TouchableOpacity style={styles.btnOutline} onPress={() => setWizardVisible(false)}>
          <Text style={styles.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => setWizardStep(2)}>
          <Text style={styles.btnPrimaryText}>Next Step</Text>
          <ChevronRight size={20} stroke="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- RENDER WIZARD STEP 2 ---
  const renderWizardStep2 = () => (
    <ScrollView style={styles.wizScroll}>
      <View style={styles.detailHeader}>
        <View style={styles.titleRow}>
          <Pill size={24} stroke="#2563eb" />
          <Text style={styles.detailTitle}>Schedule Details</Text>
        </View>
        <View style={[styles.badge, prescriptionType === 'maintenance' ? { backgroundColor: '#d1fae5' } : { backgroundColor: '#dbeafe' }]}>
          <Text style={[styles.badgeText, prescriptionType === 'maintenance' ? { color: '#047857' } : { color: '#1e40af' }]}>
            {prescriptionType.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* ... (Existing Inputs for Dosage, Time, etc.) ... */}
      <View style={styles.rowInputs}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>DOSAGE</Text>
          <TextInput 
            style={styles.textInput} 
            placeholder="e.g. 500mg" 
            value={scheduleData.dosage}
            onChangeText={(t) => setScheduleData({...scheduleData, dosage: t})}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>START DATE</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('date')}>
            <Text style={styles.dateBtnText}>{scheduleData.startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>SCHEDULE TYPE</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, frequencyType === 'daily' && styles.toggleBtnActive]}
            onPress={() => setFrequencyType('daily')}
          >
            <Text style={[styles.toggleText, frequencyType === 'daily' && styles.toggleTextActive]}>Every Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, frequencyType === 'weekly' && styles.toggleBtnActive]}
            onPress={() => setFrequencyType('weekly')}
          >
            <Text style={[styles.toggleText, frequencyType === 'weekly' && styles.toggleTextActive]}>Specific Days</Text>
          </TouchableOpacity>
        </View>
      </View>

      {frequencyType === 'weekly' && (
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>SELECT DAYS</Text>
          <View style={styles.dayGrid}>
            {WEEKDAYS.map((day) => (
              <TouchableOpacity 
                key={day.value}
                onPress={() => toggleDay(day.value)}
                style={[styles.dayChip, selectedDays.includes(day.value) ? styles.dayChipActive : styles.dayChipInactive]}
              >
                <Text style={[styles.dayText, selectedDays.includes(day.value) ? styles.dayTextActive : styles.dayTextInactive]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.rowInputs}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>TIMES PER DAY</Text>
          <TextInput 
            style={styles.textInput} 
            keyboardType="number-pad"
            value={scheduleData.timesPerDay}
            onChangeText={(t) => setScheduleData({...scheduleData, timesPerDay: t})}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>FIRST DOSE</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => openPicker('time')}>
            <Text style={styles.dateBtnText}>
              {scheduleData.firstDoseTime.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- COLOR SELECTION WITH WHITE OUTLINE --- */}
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>LABEL COLOR</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity 
              key={c}
              onPress={() => setScheduleData({...scheduleData, color: c})}
              style={[
                styles.colorDot, 
                { backgroundColor: c }, 
                // Conditionally apply active style with white outline
                scheduleData.color === c && styles.colorDotActive
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.wizFooter}>
        <TouchableOpacity style={styles.btnOutline} onPress={() => setWizardStep(1)}>
          <Text style={styles.btnOutlineText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleWizardSave}>
          <Text style={styles.btnPrimaryText}>Save Schedule</Text>
          <Check size={20} stroke="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // --- RENDER MAIN SCREEN ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.idBadge}><Text style={styles.idBadgeText}>S{partition.id}</Text></View>
          <View>
            <Text style={styles.headerTitle}>{isEditMode ? 'Edit Slot' : 'Configure Slot'}</Text>
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

        {/* INPUTS */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ILLNESS / PURPOSE</Text>
          <TextInput 
            style={styles.input}
            value={basicInfo.label}
            onChangeText={(text) => setBasicInfo({...basicInfo, label: text})}
            placeholder="e.g. Heart Condition"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>MEDICINE NAME</Text>
          <TextInput 
            style={styles.input}
            value={basicInfo.medicineName}
            onChangeText={(text) => setBasicInfo({...basicInfo, medicineName: text})}
            placeholder="e.g. Atorvastatin 20mg"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>TOTAL PILLS LOADED</Text>
          <View style={styles.counter}>
            <TouchableOpacity 
              onPress={() => setBasicInfo({...basicInfo, pillCount: Math.max(1, basicInfo.pillCount - 1)})}
              style={styles.counterBtn}
            >
              <Minus size={24} stroke="#475569" />
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={styles.counterValue}>{basicInfo.pillCount}</Text>
              <Text style={styles.counterLabel}>CURRENT INVENTORY</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setBasicInfo({...basicInfo, pillCount: basicInfo.pillCount + 1})}
              style={styles.counterBtn}
            >
              <Plus size={24} stroke="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SCHEDULE BUTTON */}
        <View style={styles.scheduleGroup}>
          <Text style={styles.label}>ALARM SCHEDULE</Text>
          <TouchableOpacity 
            style={[styles.bigScheduleBtn, scheduleData.isConfigured && styles.bigScheduleBtnActive]} 
            onPress={() => {
              setWizardStep(1);
              setWizardVisible(true);
            }}
          >
            <View style={[styles.scheduleIconCircle, scheduleData.isConfigured && {backgroundColor: '#22c55e'}]}>
               {scheduleData.isConfigured ? <Check size={32} stroke="#fff" /> : <Clock size={32} stroke="#fff" />}
            </View>
            <Text style={styles.scheduleBtnTitle}>
              {scheduleData.isConfigured ? 'Schedule Configured' : 'Create Schedule'}
            </Text>
            <Text style={styles.scheduleBtnSub}>
              {scheduleData.isConfigured ? 'Tap to edit settings' : 'Tap to set time & frequency'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleFinalSave} disabled={saving} style={[styles.submitBtn, saving && styles.submitBtnDisabled]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Save size={24} stroke="#fff" />}
          <Text style={styles.submitBtnText}>{saving ? "SYNCING..." : "SAVE CHANGES"}</Text>
        </TouchableOpacity>

        {/* --- REMOVE BUTTON (Only visible in Edit Mode) --- */}
        {isEditMode && (
          <TouchableOpacity onPress={handleRemove} disabled={saving} style={styles.removeBtn}>
            <Trash2 size={20} stroke="#ef4444" />
            <Text style={styles.removeBtnText}>Remove Slot Assignment</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* MODAL */}
      <Modal visible={isWizardVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setWizardVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Setup Wizard</Text>
            <TouchableOpacity onPress={() => setWizardVisible(false)} style={styles.closeBtn}>
               <X size={24} stroke="#64748b" />
            </TouchableOpacity>
          </View>
          {wizardStep === 1 ? renderWizardStep1() : renderWizardStep2()}
        </View>

        {showPicker && (
          <DateTimePicker
            value={pickerMode === 'date' ? scheduleData.startDate : scheduleData.firstDoseTime}
            mode={pickerMode}
            display="default"
            onChange={onPickerChange}
          />
        )}
      </Modal>
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
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  input: { fontSize: 18, fontWeight: 'bold', backgroundColor: '#f8fafc', padding: 16, borderRadius: 20, color: '#1e293b' },
  
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 24, gap: 12 },
  counterBtn: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  counterDisplay: { flex: 1, alignItems: 'center' },
  counterValue: { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  counterLabel: { fontSize: 8, fontWeight: '900', color: '#94a3b8' },

  scheduleGroup: { marginBottom: 32 },
  bigScheduleBtn: { backgroundColor: '#eff6ff', borderRadius: 24, padding: 32, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#bfdbfe' },
  bigScheduleBtnActive: { backgroundColor: '#f0fdf4', borderColor: '#86efac', borderStyle: 'solid' },
  scheduleIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  scheduleBtnTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  scheduleBtnSub: { fontSize: 14, color: '#64748b', fontWeight: '500' },

  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 20, fontWeight: '900' },

  // --- Remove Button Styles ---
  removeBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fee2e2' },
  removeBtnText: { color: '#e11d48', fontSize: 16, fontWeight: 'bold' },

  // --- Modal & Wizard ---
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalHeaderTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  wizContent: { flex: 1, padding: 24 },
  wizScroll: { flex: 1, padding: 24 },
  wizTitle: { fontSize: 32, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  wizSubtitle: { fontSize: 16, color: '#64748b', marginBottom: 32 },

  cardContainer: { gap: 16, marginBottom: 32 },
  typeCard: { padding: 20, borderRadius: 20, borderWidth: 2, backgroundColor: '#fff' },
  cardActiveTemp: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  cardActiveMain: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  cardInactive: { borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { padding: 8, borderRadius: 8 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 20 },

  durationSection: { marginBottom: 32 },
  durationRow: { flexDirection: 'row', gap: 12 },
  durationInput: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 18, fontWeight: 'bold', borderWidth: 1, borderColor: '#e2e8f0' },
  unitToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  unitBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  unitBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  unitText: { fontWeight: '600', color: '#64748b' },
  unitTextActive: { color: '#2563eb' },

  wizFooter: { flexDirection: 'row', gap: 12, marginTop: 40, paddingBottom: 40 },
  btnOutline: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  btnOutlineText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  btnPrimary: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  formGroup: { marginBottom: 20 },
  rowInputs: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  textInput: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: '600', color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  dateBtn: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  dateBtnText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  toggleText: { fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#2563eb' },

  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { width: '13%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1 },
  dayChipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  dayChipInactive: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
  dayText: { fontSize: 12, fontWeight: 'bold' },
  dayTextActive: { color: '#2563eb' },
  dayTextInactive: { color: '#94a3b8' },

  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  colorDotActive: { 
    borderWidth: 4, 
    borderColor: '#fff', 
    shadowColor: '#000', 
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 6,
    transform: [{scale: 1.1}] 
  },
});

export default PartitionConfig;