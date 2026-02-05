import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { Battery, Bluetooth, Settings, MapPin, Volume2, Clock, Maximize2, X } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { PatientRecord, Partition } from '../../types';
import PartitionConfig from './PartitionConfig';

const { width } = Dimensions.get('window');
const GRID_SPACING = 12;
const ITEM_WIDTH = (width - 76) / 2; 

// --- 1. INITIAL EMPTY STATE (FRESH DEVICE) ---
export const INITIAL_PATIENT_DATA: PatientRecord = {
  id: 'patient-1',
  name: 'User',
  age: 65,
  riskScore: 0,
  lastLocation: { lat: 10.3292, lng: 123.9063 },
  
  // FORCE ALL SLOTS TO UNASSIGNED
  partitions: Array.from({ length: 6 }).map((_, i) => ({
    id: i + 1,
    label: 'Unassigned',
    medicineName: '',
    pillCount: 0,
    schedule: [] as string[],
    isBlinking: false,
    adherenceRate: 0,
    history: [] as boolean[],
    colorTheme: '#cbd5e1',
    isShortTerm: false,
    durationDays: 0,
    frequencyType: 'daily' as 'daily',
    selectedDays: [] as number[],
    timesPerDay: 0,
    dosage: ''
  }))
};

const FALLBACK_REGION = {
  latitude: 10.3292,
  longitude: 123.9063,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

interface PatientDashboardProps {
  patient?: PatientRecord; 
  onUpdate?: (patient: PatientRecord) => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = (props) => {
  const [patient, setPatient] = useState<PatientRecord>(INITIAL_PATIENT_DATA);
  const [configPartition, setConfigPartition] = useState<Partition | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- REVISED PERMISSIONS LOGIC ---
  const getPermissions = async () => {
    setRefreshing(true);
    try {
      // 1. Check if App has permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission Denied');
        setUserLocation(null);
        setRefreshing(false);
        return;
      }

      // 2. CRITICAL FIX: Check if Device GPS is actually ON
      // This prevents the "Unsatisfied device settings" crash
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setErrorMsg('Location Services Disabled');
        setUserLocation(null);
        setRefreshing(false);
        return; 
      }

      // 3. Only if (1) and (2) pass, try to get position
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setErrorMsg(null); 
    } catch (error) {
      // Even if something else fails, we catch it here gracefully
      setErrorMsg('Location Unavailable');
      setUserLocation(null);
      console.log("Handled location error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  const getNextDoseText = (schedule: string[]) => {
    if (!schedule || schedule.length === 0) return '--:--';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const timesInMinutes = schedule.map(isoString => {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return -1; 
      return d.getHours() * 60 + d.getMinutes();
    }).filter(t => t !== -1).sort((a, b) => a - b);

    if (timesInMinutes.length === 0) return '--:--';
    const nextTime = timesInMinutes.find(t => t > currentMinutes);
    const timeToDisplay = nextTime !== undefined ? nextTime : timesInMinutes[0];
    const h = Math.floor(timeToDisplay / 60);
    const m = timeToDisplay % 60;
    const displayDate = new Date();
    displayDate.setHours(h);
    displayDate.setMinutes(m);
    return displayDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // --- LOCATION EFFECT ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        
        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setUserLocation(userLoc);

        // --- MOCK KIT LOCATION ---
        // Place the kit slightly offset (e.g., ~50 meters away)
        setKitLocation({
          latitude: location.coords.latitude + 0.0003, 
          longitude: location.coords.longitude + 0.0003,
        });
      }
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
             <Text style={styles.title}>MedSync</Text>
           </View>
          <Text style={styles.subtitle}>Connected Pill Box Device</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={styles.badgeBlue}>
            <Bluetooth size={14} stroke="#0d9488" />
            <Text style={styles.badgeTextBlue}>LINK</Text>
          </View>
          <View style={styles.badgeGray}>
            <Battery size={14} stroke="#475569" />
            <Text style={styles.badgeTextGray}>100%</Text>
          </View>
        </View>
      </View>

      {/* DEVICE LAYOUT GRID */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DEVICE LAYOUT</Text>
        <View style={styles.grid}>
          {patient.partitions.map((partition) => {
            const isUnassigned = !partition.label || partition.label === 'Unassigned';
            const activeColor = isUnassigned ? '#cbd5e1' : (partition.colorTheme || '#2563eb');

            return (
              <TouchableOpacity 
                key={partition.id}
                onPress={() => setConfigPartition(partition)}
                style={[
                  styles.gridItem,
                  !isUnassigned 
                    ? { borderColor: activeColor, borderWidth: 3 } 
                    : styles.inactiveItem
                ]}
              >
                <View style={styles.itemHeader}>
                  <View style={[
                    styles.slotBadge, 
                    !isUnassigned ? { backgroundColor: activeColor } : styles.slotBadgeInactive
                  ]}>
                    <Text style={[styles.slotBadgeText, !isUnassigned ? styles.slotTextActive : styles.slotTextInactive]}>
                      SLOT {partition.id}
                    </Text>
                  </View>
                  <Text style={styles.itemLabel} numberOfLines={1}>
                    {partition.label || 'Empty'}
                  </Text>
                  {!isUnassigned && (
                    <Text style={styles.medicineName} numberOfLines={1}>{partition.medicineName}</Text>
                  )}
                </View>

                <View style={styles.itemFooter}>
                  {!isUnassigned ? (
                    <>
                      <View style={styles.pillCountContainer}>
                        <Text style={[styles.pillCount, { color: activeColor }]}>{partition.pillCount}</Text>
                        <Text style={[styles.pillLabel, { color: activeColor }]}>PILLS LEFT</Text>
                      </View>
                      <View style={[styles.scheduleBadge, { borderColor: activeColor + '40', backgroundColor: activeColor + '10' }]}>
                        <Clock size={10} stroke={activeColor} />
                        <Text style={[styles.scheduleText, { color: activeColor }]}>{getNextDoseText(partition.schedule)}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.setupContainer}>
                      <PlusCircle size={20} stroke="#94a3b8" />
                      <Text style={styles.setupText}>TAP TO ADD</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* TODAY'S SCHEDULE */}
      <View style={styles.section}>
        <View style={styles.scheduleHeader}>
            <Clock size={20} stroke="#2563eb" />
            <Text style={styles.scheduleTitle}>Today's Schedule</Text>
        </View>

        {isNewDevice || todayDoses.length === 0 ? (
            <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                    <Calendar size={32} stroke="#3b82f6" />
                </View>
                <Text style={styles.emptyStateTitle}>No Alarms Set</Text>
                <Text style={styles.emptyStateText}>
                  Tap any "Empty" slot above to set up your first medication reminder.
                </Text>
            </View>
        ) : (
            <View style={styles.timelineContainer}>
                <View style={styles.timelineLine} />
                {todayDoses.map((dose) => (
                    <View key={dose.id} style={styles.doseRow}>
                        <View style={[styles.timeDot, dose.status === 'taken' ? styles.timeDotTaken : styles.timeDotPending]}>
                             {dose.status === 'taken' && <Check size={12} stroke="#fff" />}
                        </View>
                        <View style={[styles.doseCard, dose.status === 'taken' && styles.doseCardTaken]}>
                            <View>
                                <Text style={styles.doseTime}>{formatTime(dose.time)}</Text>
                                <Text style={[styles.doseMedName, dose.status === 'taken' && styles.textTaken]}>
                                    {dose.medName}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => toggleDose(dose.id)}
                                style={[styles.actionBtn, dose.status === 'taken' ? styles.actionBtnTaken : styles.actionBtnPending]}
                            >
                                <Text style={[styles.actionBtnText, dose.status === 'taken' ? styles.actionTextTaken : styles.actionTextPending]}>
                                    {dose.status === 'taken' ? 'Undo' : 'Take'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        )}
      </View>

      {/* --- LIVE TRACKER (Updated) --- */}
      <View style={styles.trackerSection}>
        <View style={styles.trackerHeader}>
          <View style={styles.trackerTitleContainer}>
            <View style={styles.iconBg}>
              <MapPin size={20} stroke="#f43f5e" />
            </View>
            <Text style={styles.trackerTitle}>Live Tracker</Text>
          </View>
          <TouchableOpacity onPress={() => userLocation && setShowFullMap(true)} style={styles.focusButton}>
            <Maximize2 size={12} stroke="#2563eb" />
            <Text style={styles.focusButtonText}>FULL MAP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => userLocation && setShowFullMap(true)} 
          style={styles.mapContainer}
          activeOpacity={userLocation ? 0.7 : 1}
        >
          {userLocation ? (
            <MapView 
              style={styles.map}
              initialRegion={userLocation}
              region={userLocation}
              showsUserLocation={true} 
              pointerEvents="none"
            >
              {/* KIT MARKER (Mock) */}
              {kitLocation && (
                <Marker 
                  coordinate={kitLocation} 
                  title="My MedBox" 
                  description="Last seen 2 mins ago"
                  pinColor="red" // Explicitly red for the kit
                />
              )}
            </MapView>
          ) : (
            <View style={styles.loadingContainer}>
              {refreshing ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : errorMsg ? (
                <>
                  <MapPin size={24} stroke="#94a3b8" />
                  <Text style={styles.loadingText}>Turn on device location</Text>
                  <TouchableOpacity style={styles.reloadButton} onPress={getPermissions}>
                    <Text style={styles.reloadButtonText}>RETRY CONNECTION</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={styles.loadingText}>Locating Device...</Text>
                </>
              )}
            </View>
          )}
          
          {userLocation && (
            <View style={styles.mapStatus}>
              <View style={styles.greenPulse} />
              <Text style={styles.statusText}>Locked on Device</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.locateButton}>
          <Volume2 size={18} stroke="#475569" />
          <Text style={styles.locateButtonText}>PING PHYSICAL BOX</Text>
        </TouchableOpacity>
      </View>

      {/* --- FULL SCREEN MAP MODAL --- */}
      <Modal visible={showFullMap} animationType="slide">
        <View style={styles.fullMapContainer}>
          {userLocation ? (
            <MapView 
              style={styles.fullMap}
              initialRegion={userLocation}
              showsUserLocation={true}
              showsBuildings
              showsTraffic
            >
               {kitLocation && (
                 <>
                   <Marker coordinate={kitLocation} title="My MedBox" description="Device Location" pinColor="red" />
                   {/* Optional Line connecting them */}
                   <Polyline 
                     coordinates={[userLocation, kitLocation]} 
                     strokeColor="#2563eb" 
                     strokeWidth={2} 
                     lineDashPattern={[5, 5]}
                   />
                 </>
               )}
            </MapView>
          ) : (
            <MapView style={styles.fullMap} initialRegion={FALLBACK_REGION} />
          )}
          
          {/* Legend Overlay */}
          <View style={styles.legendContainer}>
             <View style={styles.legendItem}>
                <Smartphone size={16} stroke="#2563eb" />
                <Text style={styles.legendText}>You</Text>
             </View>
             <View style={styles.legendItem}>
                <Box size={16} stroke="#ef4444" />
                <Text style={styles.legendText}>MedBox</Text>
             </View>
          </View>

          <TouchableOpacity onPress={() => setShowFullMap(false)} style={styles.closeMapButton}>
            <X size={24} stroke="#fff" />
            <Text style={styles.closeMapText}>CLOSE MAP</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {configPartition && (
        <Modal animationType="slide" visible={true} onRequestClose={() => setConfigPartition(null)}>
          <PartitionConfig 
            partition={configPartition} 
            onSave={(data) => {
              handlePatientUpdate({
                ...patient,
                partitions: patient.partitions.map(p => p.id === configPartition.id ? { ...p, ...data as Partition } : p)
              });
              setConfigPartition(null);
            }}
            onClose={() => setConfigPartition(null)}
          />
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  
  statusContainer: { flexDirection: 'row', gap: 8 },
  badgeBlue: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdfa', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ccfbf1', gap: 4 },
  badgeTextBlue: { fontSize: 10, fontWeight: '900', color: '#0d9488' },
  badgeGray: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  badgeTextGray: { fontSize: 10, fontWeight: '900', color: '#475569' },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#64748b', letterSpacing: 1.5, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_SPACING, backgroundColor: '#e2e8f0', padding: 12, borderRadius: 32 },
  gridItem: { width: ITEM_WIDTH, height: 160, backgroundColor: '#fff', borderRadius: 24, padding: 12, justifyContent: 'space-between', borderWidth: 3 },
  activeItem: { borderColor: '#2563eb' },
  inactiveItem: { borderColor: '#e2e8f0', borderStyle: 'dashed', opacity: 0.6 },
  itemHeader: { gap: 4 },
  slotBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  slotBadgeInactive: { backgroundColor: '#f1f5f9' },
  slotBadgeText: { fontSize: 8, fontWeight: '900' },
  slotTextActive: { color: '#fff' },
  slotTextInactive: { color: '#94a3b8' },
  itemLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  medicineName: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  
  itemFooter: { gap: 6 },
  pillCountContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  pillCount: { fontSize: 20, fontWeight: '900' },
  pillLabel: { fontSize: 8, fontWeight: '900' },
  scheduleBadge: { flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: 8, gap: 4, borderWidth: 1 },
  scheduleText: { fontSize: 10, fontWeight: '900' },
  setupContainer: { alignItems: 'center', justifyContent: 'center', opacity: 0.4, gap: 4 },
  setupText: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
  
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  scheduleTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 24, borderWidth: 2, borderColor: '#eff6ff', borderStyle: 'dashed' },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyStateTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  emptyStateText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, maxWidth: 220, lineHeight: 20 },
  
  timelineContainer: { position: 'relative', paddingLeft: 20 },
  timelineLine: { position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, backgroundColor: '#e2e8f0' },
  doseRow: { marginBottom: 16, paddingLeft: 24, position: 'relative' },
  timeDot: { position: 'absolute', left: -18, top: 20, width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  timeDotTaken: { backgroundColor: '#10b981' },
  timeDotPending: { backgroundColor: '#cbd5e1' },
  doseCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  doseCardTaken: { opacity: 0.6, backgroundColor: '#f8fafc' },
  doseTime: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 2 },
  doseMedName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  textTaken: { textDecorationLine: 'line-through', color: '#94a3b8' },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  actionBtnTaken: { borderColor: 'transparent', backgroundColor: 'transparent' },
  actionBtnPending: { borderColor: '#e2e8f0', backgroundColor: '#fff' },
  actionBtnText: { fontSize: 12, fontWeight: 'bold' },
  actionTextTaken: { color: '#64748b' },
  actionTextPending: { color: '#2563eb' },

  trackerSection: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  trackerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBg: { padding: 8, backgroundColor: '#fff1f2', borderRadius: 12 },
  trackerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  focusButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  focusButtonText: { fontSize: 10, fontWeight: '900', color: '#2563eb' },
  mapContainer: { height: 160, backgroundColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  map: { width: '100%', height: '100%' },
  loadingContainer: { height: 160, backgroundColor: '#e2e8f0', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  reloadButton: { marginTop: 10, backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  reloadButtonText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  mapStatus: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenPulse: { width: 6, height: 6, backgroundColor: '#22c55e', borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900', color: '#1e293b' },
  locateButton: { marginTop: 16, backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  locateButtonText: { fontSize: 12, fontWeight: '900', color: '#475569' },
  fullMapContainer: { flex: 1, backgroundColor: '#000' },
  fullMap: { flex: 1 },
  closeMapButton: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 6 },
  closeMapText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});

export default PatientDashboard;