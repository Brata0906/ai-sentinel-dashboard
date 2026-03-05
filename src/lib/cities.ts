import { City } from './types';

export const CITIES: City[] = [
  { name: 'New York', country: 'US', lat: 40.71, lng: -74.01 },
  { name: 'London', country: 'UK', lat: 51.51, lng: -0.13 },
  { name: 'Tokyo', country: 'JP', lat: 35.68, lng: 139.69 },
  { name: 'Shanghai', country: 'CN', lat: 31.23, lng: 121.47 },
  { name: 'Mumbai', country: 'IN', lat: 19.08, lng: 72.88 },
  { name: 'São Paulo', country: 'BR', lat: -23.55, lng: -46.63 },
  { name: 'Lagos', country: 'NG', lat: 6.52, lng: 3.38 },
  { name: 'Moscow', country: 'RU', lat: 55.76, lng: 37.62 },
  { name: 'Dubai', country: 'AE', lat: 25.20, lng: 55.27 },
  { name: 'Singapore', country: 'SG', lat: 1.35, lng: 103.82 },
  { name: 'Paris', country: 'FR', lat: 48.86, lng: 2.35 },
  { name: 'Berlin', country: 'DE', lat: 52.52, lng: 13.41 },
  { name: 'Sydney', country: 'AU', lat: -33.87, lng: 151.21 },
  { name: 'Toronto', country: 'CA', lat: 43.65, lng: -79.38 },
  { name: 'Mexico City', country: 'MX', lat: 19.43, lng: -99.13 },
  { name: 'Seoul', country: 'KR', lat: 37.57, lng: 126.98 },
  { name: 'Istanbul', country: 'TR', lat: 41.01, lng: 28.98 },
  { name: 'Bangkok', country: 'TH', lat: 13.76, lng: 100.50 },
  { name: 'Jakarta', country: 'ID', lat: -6.21, lng: 106.85 },
  { name: 'Nairobi', country: 'KE', lat: -1.29, lng: 36.82 },
];

export const DEVICE_TYPES = ['Desktop', 'Mobile', 'Tablet', 'Smart Watch', 'POS Terminal'];

export const USER_IDS = Array.from({ length: 20 }, (_, i) => `USR-${String(i + 1).padStart(4, '0')}`);
