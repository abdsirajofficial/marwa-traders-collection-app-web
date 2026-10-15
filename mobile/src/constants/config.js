// Mobile API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.247:8080/api';
export const CLOUD_RUN_API_URL = 'https://marwa-backend-xxxx-uc.a.run.app/api';

export const Config = {
  apiUrl: process.env.NODE_ENV === 'production' ? CLOUD_RUN_API_URL : API_BASE_URL,
  appName: 'MARWA TRADERS',
  printerPaperWidthMm: 58,
};
