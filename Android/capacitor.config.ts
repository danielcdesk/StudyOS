import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studyos.app',
  appName: 'StudyOS',
  webDir: '../public',
  server: {
    url: 'https://studyos-luiz-2026.opao6394.chatgpt.site',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
