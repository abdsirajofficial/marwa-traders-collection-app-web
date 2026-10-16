// Mobile API Configuration
export const CLOUD_RUN_API_URL = 'https://mt-collection-api-399060682924.asia-south1.run.app/api';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || CLOUD_RUN_API_URL;

export const Config = {
  apiUrl: API_BASE_URL,
  appName: 'MARWA TRADERS',
  printerPaperWidthMm: 58,
};
