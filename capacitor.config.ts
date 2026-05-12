/// <reference types="@capacitor/status-bar" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'HIB',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#003087',
      style: 'DARK'
    }
  }
};

export default config;
