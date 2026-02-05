
export enum AppPhase {
  SPLASH = 'SPLASH',
  BLUETOOTH = 'BLUETOOTH',
  HOME = 'HOME'
}

export interface Partition {
  id: number;
  label: string;
  medicineName: string;
  pillCount: number;
  schedule: string[]; 
  isBlinking: boolean;
  adherenceRate: number;
  history: boolean[];

  isShortTerm?: boolean;
  durationDays?: number;
  frequencyType?: 'daily' | 'weekly';
  selectedDays?: number[];
  timesPerDay?: number;
  dosage?: string;
  colorTheme?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  partitions: Partition[];
  lastLocation: { lat: number; lng: number };
  riskScore: number;
}
