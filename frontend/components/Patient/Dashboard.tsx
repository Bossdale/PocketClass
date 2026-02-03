import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Battery, Bluetooth, Settings, MapPin, Volume2, Clock, Maximize2, X, Navigation } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { PatientRecord, Partition } from '../../types';
import PartitionConfig from './PartitionConfig';

const { width } = Dimensions.get('window');
const GRID_SPACING = 12;
const ITEM_WIDTH = (width - 76) / 2; 

const FALLBACK_REGION = {
  latitude: 10.3292,
  longitude: 123.9063,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

interface PatientDashboardProps {
  patient: PatientRecord;
  onUpdate: (patient: PatientRecord) => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, onUpdate }) => {
  const [configPartition, setConfigPartition] = useState<Partition | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);

  const [userLocation, setUserLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
             <Text style={styles.title}>PillSync</Text>
           </View>
          <Text style={styles.subtitle}>Connected PillBox Device</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={styles.badgeBlue}>
            <Bluetooth size={14} stroke="#0d9488" />
            <Text style={styles.badgeTextBlue}>LINK</Text>
          </View>
          <View style={styles.badgeGray}>
            <Battery size={14} stroke="#475569" />
            <Text style={styles.badgeTextGray}>85%</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DEVICE LAYOUT</Text>
        <View style={styles.grid}>
          {patient.partitions.map((partition) => {
            const isUnassigned = !partition.label || partition.label === 'Unassigned';
            return (
              <TouchableOpacity 
                key={partition.id}
                onPress={() => setConfigPartition(partition)}
                style={[
                  styles.gridItem,
                  !isUnassigned ? styles.activeItem : styles.inactiveItem
                ]}
              >
                <View style={styles.itemHeader}>
                  <View style={[styles.slotBadge, !isUnassigned ? styles.slotBadgeActive : styles.slotBadgeInactive]}>
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
                        <Text style={styles.pillCount}>{partition.pillCount}</Text>
                        <Text style={styles.pillLabel}>PILLS LEFT</Text>
                      </View>
                      <View style={styles.scheduleBadge}>
                        <Clock size={10} stroke="#2563eb" />
                        <Text style={styles.scheduleText}>{getNextDoseText(partition.schedule)}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.setupContainer}>
                      <Settings size={16} stroke="#94a3b8" />
                      <Text style={styles.setupText}>TAP TO SETUP</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.trackerSection}>
        <View style={styles.trackerHeader}>
          <View style={styles.trackerTitleContainer}>
            <View style={styles.iconBg}>
              <MapPin size={20} stroke="#f43f5e" />
            </View>
            <Text style={styles.trackerTitle}>Live Tracker</Text>
          </View>
          <TouchableOpacity onPress={() => setShowFullMap(true)} style={styles.focusButton}>
            <Maximize2 size={12} stroke="#2563eb" />
            <Text style={styles.focusButtonText}>FOCUS MAP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setShowFullMap(true)} style={styles.mapContainer}>
          {userLocation ? (
            <MapView 
              style={styles.map}
              initialRegion={userLocation}
              showsUserLocation={true} 
              pointerEvents="none"
            >
              <Marker coordinate={userLocation} title="My MedBox" description="Device is with you" />
            </MapView>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Locating Device...</Text>
            </View>
          )}
          <View style={styles.mapStatus}>
            <View style={styles.greenPulse} />
            <Text style={styles.statusText}>Locked on Device</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.locateButton}>
          <Volume2 size={18} stroke="#475569" />
          <Text style={styles.locateButtonText}>LOCATE PHYSICAL BOX</Text>
        </TouchableOpacity>
      </View>

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
               <Marker coordinate={userLocation} title="My MedBox" />
            </MapView>
          ) : (
            <MapView style={styles.fullMap} initialRegion={FALLBACK_REGION} />
          )}
          
          <TouchableOpacity onPress={() => setShowFullMap(false)} style={styles.closeMapButton}>
            <X size={24} stroke="#fff" />
            <Text style={styles.closeMapText}>CLOSE MAP</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {configPartition && (
        <Modal animationType="slide" visible={true}>
          <PartitionConfig 
            partition={configPartition} 
            onSave={(data) => {
              onUpdate({
                ...patient,
                partitions: patient.partitions.map(p => p.id === configPartition.id ? { ...p, ...data as Partition } : p)
              });
              setConfigPartition(null);
            }}
            onClose={() => setConfigPartition(null)}
          />
        </Modal>
      )}
    </View>
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
  
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: GRID_SPACING, 
    backgroundColor: '#e2e8f0', 
    padding: 12, 
    borderRadius: 32 
  },
  
  gridItem: { 
    width: ITEM_WIDTH, 
    height: 160, 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 12, 
    justifyContent: 'space-between', 
    borderWidth: 3 
  },
  
  activeItem: { borderColor: '#2563eb' },
  inactiveItem: { borderColor: '#e2e8f0', borderStyle: 'dashed', opacity: 0.6 },
  itemHeader: { gap: 4 },
  slotBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  slotBadgeActive: { backgroundColor: '#2563eb' },
  slotBadgeInactive: { backgroundColor: '#f1f5f9' },
  slotBadgeText: { fontSize: 8, fontWeight: '900' },
  slotTextActive: { color: '#fff' },
  slotTextInactive: { color: '#94a3b8' },
  itemLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  medicineName: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  itemFooter: { gap: 6 },
  pillCountContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  pillCount: { fontSize: 20, fontWeight: '900', color: '#2563eb' },
  pillLabel: { fontSize: 8, fontWeight: '900', color: '#2563eb' },
  scheduleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 4, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: '#dbeafe' },
  scheduleText: { fontSize: 10, fontWeight: '900', color: '#1d4ed8' },
  setupContainer: { alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  setupText: { fontSize: 8, fontWeight: '900', color: '#94a3b8', marginTop: 4 },
  trackerSection: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  trackerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBg: { padding: 8, backgroundColor: '#fff1f2', borderRadius: 12 },
  trackerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  focusButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  focusButtonText: { fontSize: 10, fontWeight: '900', color: '#2563eb' },
  mapContainer: { height: 160, backgroundColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  map: { width: '100%', height: '100%' },
  
  loadingContainer: { 
    height: 160, 
    backgroundColor: '#e2e8f0', 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8 
  },
  loadingText: { 
    color: '#64748b', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  
  mapStatus: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenPulse: { width: 6, height: 6, backgroundColor: '#22c55e', borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900', color: '#1e293b' },
  locateButton: { marginTop: 16, backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  locateButtonText: { fontSize: 12, fontWeight: '900', color: '#475569' },
  fullMapContainer: { flex: 1, backgroundColor: '#000' },
  fullMap: { flex: 1 },
  closeMapButton: { 
    position: 'absolute', 
    bottom: 40, 
    alignSelf: 'center', 
    backgroundColor: '#ef4444', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 30, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6
  },
  closeMapText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});

export default PatientDashboard;