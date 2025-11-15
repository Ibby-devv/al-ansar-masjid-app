// Firebase Data Types
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface PrayerTimes {
  fajr_adhan: string;
  fajr_iqama: string;
  fajr_iqama_type: 'fixed' | 'offset';
  fajr_iqama_offset?: number;
  
  dhuhr_adhan: string;
  dhuhr_iqama: string;
  dhuhr_iqama_type: 'fixed' | 'offset';
  dhuhr_iqama_offset?: number;
  
  asr_adhan: string;
  asr_iqama: string;
  asr_iqama_type: 'fixed' | 'offset';
  asr_iqama_offset?: number;
  
  maghrib_adhan: string;
  maghrib_iqama: string;
  maghrib_iqama_type: 'fixed' | 'offset';
  maghrib_iqama_offset?: number;
  
  isha_adhan: string;
  isha_iqama: string;
  isha_iqama_type: 'fixed' | 'offset';
  isha_iqama_offset?: number;
  
  last_updated?: FirebaseFirestoreTypes.Timestamp;
}

export interface JumuahTime {
  id: string;
  khutbah: string;
}

export interface JumuahTimes {
  times: JumuahTime[];
  last_updated?: FirebaseFirestoreTypes.Timestamp;
}

export interface MosqueSettings {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  imam?: string;
  latitude?: number;
  longitude?: number;
  calculation_method?: 'MuslimWorldLeague' | 'Egyptian' | 'Karachi' | 'UmmAlQura' | 'Dubai' | 'MoonsightingCommittee' | 'NorthAmerica' | 'Kuwait' | 'Qatar' | 'Singapore' | 'Tehran' | 'Turkey';
  auto_fetch_maghrib?: boolean;
  last_updated?: FirebaseFirestoreTypes.Timestamp;
}

export interface EventCategory {
  id: string;
  label: string;
  color_bg: string;
  color_text: string;
  order: number;
  is_active: boolean;
}

// NEW: Event Categories Config (for Firestore document)
export interface EventCategoriesConfig {
  categories: EventCategory[];
  updated_at: string;
}

// Event
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD format
  time: string; // e.g., "7:00 PM"
  location?: string;
  category: string; // CHANGED: from union type to string
  speaker?: string;
  image_url?: string;
  rsvp_enabled?: boolean;
  rsvp_limit?: number;
  rsvp_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Component Props Types

export interface Prayer {
  name: string;
  adhan: string | undefined;
  iqama: string | undefined;
}

// Utility function to calculate iqama time from adhan + offset
export const calculateIqamaTime = (
  adhanTime: string | undefined, 
  iqamaType: 'fixed' | 'offset' | undefined,
  fixedIqama: string | undefined,
  offset: number | undefined
): string => {
  // If it's a fixed time, return the fixed iqama
  if (iqamaType === 'fixed') {
    return fixedIqama || '--:--';
  }

  // If it's an offset, calculate from adhan time
  if (!adhanTime || !offset) return '--:--';

  try {
    const timeMatch = adhanTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return '--:--';

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    // Add offset
    let totalMinutes = hours * 60 + minutes + offset;
    let newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;

    // Convert back to 12-hour format
    const newPeriod = newHours >= 12 ? 'PM' : 'AM';
    if (newHours > 12) {
      newHours -= 12;
    } else if (newHours === 0) {
      newHours = 12;
    }

    return `${newHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
  } catch (error) {
    console.error('Error calculating iqama time:', error);
    return '--:--';
  }
};

// Utility function to get category color
export const getCategoryColor = (categoryId: string) => {
  // Default fallback colors
  const defaultColors: Record<string, { bg: string; text: string }> = {
    lecture: { bg: '#dbeafe', text: '#1e40af' },
    class: { bg: '#fef3c7', text: '#92400e' },
    youth: { bg: '#fce7f3', text: '#9f1239' },
    women: { bg: '#f3e8ff', text: '#6b21a8' },
    education: { bg: '#dcfce7', text: '#15803d' },
    charity: { bg: '#fff7ed', text: '#c2410c' },
  };

  return defaultColors[categoryId] || { bg: '#e5e7eb', text: '#374151' };
};
