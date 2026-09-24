import { Coordinates, CalculationMethod, PrayerTimes, Madhab, HighLatitudeRule } from 'adhan';
import { PrayerInfo } from '../types';

export interface PrayerConfig {
  fajrAngle?: number;
  ishaAngle?: number;
  asrMadhab: 'shafi' | 'hanafi';
  calculationMethod: string;
  highLatitudeRule: 'middleofthenight' | 'seventhofthenight' | 'twilightangle';
}

export interface CityPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  timezone: string; // IANA Timezone, e.g., 'Africa/Cairo'
}

export const CITIES_LIST: CityPreset[] = [
  { id: 'cairo', nameAr: 'القاهرة، مصر', nameEn: 'Cairo', lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo' },
  { id: 'makkah', nameAr: 'مكة المكرمة، السعودية', nameEn: 'Makkah', lat: 21.3891, lng: 39.8579, timezone: 'Asia/Riyadh' },
  { id: 'riyadh', nameAr: 'الرياض، السعودية', nameEn: 'Riyadh', lat: 24.7136, lng: 46.6753, timezone: 'Asia/Riyadh' },
  { id: 'madinah', nameAr: 'المدينة المنورة، السعودية', nameEn: 'Madinah', lat: 24.5247, lng: 39.5692, timezone: 'Asia/Riyadh' },
  { id: 'dubai', nameAr: 'دبي، الإمارات', nameEn: 'Dubai', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'amman', nameAr: 'عمّان، الأردن', nameEn: 'Amman', lat: 31.9454, lng: 35.9284, timezone: 'Asia/Amman' },
  { id: 'casablanca', nameAr: 'الدار البيضاء، المغرب', nameEn: 'Casablanca', lat: 33.5731, lng: -7.5898, timezone: 'Africa/Casablanca' },
  { id: 'istanbul', nameAr: 'إسطنبول، تركيا', nameEn: 'Istanbul', lat: 41.0082, lng: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'london', nameAr: 'لندن، المملكة المتحدة', nameEn: 'London', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  { id: 'newyork', nameAr: 'نيويورك، أمريكا', nameEn: 'New York', lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
];

function getMethodForCity(cityId: string): string {
  switch (cityId) {
    case 'makkah':
    case 'riyadh':
    case 'madinah':
      return 'UmmAlQura';
    case 'dubai':
      return 'Dubai';
    case 'london':
    case 'newyork':
      return 'MuslimWorldLeague';
    case 'istanbul':
      return 'MuslimWorldLeague'; // Turkey has its own but MWL is close
    default:
      return 'Egyptian';
  }
}

export const DEFAULT_PRAYER_CONFIG: PrayerConfig = {
  calculationMethod: 'Auto',
  asrMadhab: 'shafi',
  highLatitudeRule: 'twilightangle'
};

export function calculatePrayerTimes(
  city: CityPreset, 
  date: Date = new Date(),
  config: PrayerConfig = DEFAULT_PRAYER_CONFIG
): PrayerInfo[] {
  const coordinates = new Coordinates(city.lat, city.lng);
  
  let params = CalculationMethod.Egyptian(); // Fallback

  const calcMethod = config.calculationMethod === 'Auto' ? getMethodForCity(city.id) : config.calculationMethod;
  
  if (calcMethod === 'MuslimWorldLeague') params = CalculationMethod.MuslimWorldLeague();
  else if (calcMethod === 'UmmAlQura') params = CalculationMethod.UmmAlQura();
  else if (calcMethod === 'Dubai') params = CalculationMethod.Dubai();
  else if (calcMethod === 'MoonsightingCommittee') params = CalculationMethod.MoonsightingCommittee();
  else if (calcMethod === 'NorthAmerica') params = CalculationMethod.NorthAmerica();
  else if (calcMethod === 'Qatar') params = CalculationMethod.Qatar();
  else if (calcMethod === 'Kuwait') params = CalculationMethod.Kuwait();
  else if (calcMethod === 'Karachi') params = CalculationMethod.Karachi();
  
  if (config.fajrAngle) params.fajrAngle = config.fajrAngle;
  if (config.ishaAngle) params.ishaAngle = config.ishaAngle;
  
  params.madhab = config.asrMadhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  
  if (config.highLatitudeRule === 'middleofthenight') params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  else if (config.highLatitudeRule === 'seventhofthenight') params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  else if (config.highLatitudeRule === 'twilightangle') params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  const formatTime = (prayerDate: Date) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      if (city.timezone && city.timezone !== 'auto') {
        options.timeZone = city.timezone;
      }
      return new Intl.DateTimeFormat('en-GB', options).format(prayerDate);
    } catch (err) {
      // Fallback
      return `${String(prayerDate.getHours()).padStart(2, '0')}:${String(prayerDate.getMinutes()).padStart(2, '0')}`;
    }
  };
  
  return [
    { id: 'fajr', nameAr: 'الفجر', time: formatTime(prayerTimes.fajr), confirmed: false },
    { id: 'sunrise', nameAr: 'الشروق', time: formatTime(prayerTimes.sunrise), confirmed: false },
    { id: 'dhuhr', nameAr: 'الظهر', time: formatTime(prayerTimes.dhuhr), confirmed: false },
    { id: 'asr', nameAr: 'العصر', time: formatTime(prayerTimes.asr), confirmed: false },
    { id: 'maghrib', nameAr: 'المغرب', time: formatTime(prayerTimes.maghrib), confirmed: false },
    { id: 'isha', nameAr: 'العشاء', time: formatTime(prayerTimes.isha), confirmed: false },
  ];
}

export function getNextPrayer(prayers: PrayerInfo[], now: Date = new Date()): { next: PrayerInfo; minutesLeft: number } {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (const prayer of prayers) {
    const [h, m] = prayer.time.split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentMinutes) {
      return { next: prayer, minutesLeft: prayerMinutes - currentMinutes };
    }
  }
  
  // If passed Isha, next is Fajr tomorrow
  const [fajrH, fajrM] = prayers[0].time.split(':').map(Number);
  const fajrMinutes = fajrH * 60 + fajrM;
  const minutesLeft = (24 * 60 - currentMinutes) + fajrMinutes;
  
  return { next: prayers[0], minutesLeft };
}

export function formatTimeArabic(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'م' : 'ص';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
