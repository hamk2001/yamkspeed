export const en = {
  app: {
    name: 'YamkSpeed',
    tagline: 'Honest, Ad-Free Speed Benchmark',
    version: '1.0',
  },
  nav: {
    themeDark: 'Dark Mode',
    themeLight: 'Light Mode',
    langArabic: 'العربية',
    langEnglish: 'English',
    auditRtl: 'RTL Audit',
    history: 'History',
    settings: 'Settings',
  },
  metrics: {
    download: 'Download',
    upload: 'Upload',
    latency: 'Latency',
    jitter: 'Jitter',
    mbps: 'Mbps',
    ms: 'ms',
    bytes: 'Data Used',
    server: 'Server',
    engine: 'Engine',
  },
  phases: {
    idle: 'Ready to test',
    locating: 'Selecting optimal server...',
    latency: 'Measuring latency & jitter...',
    download: 'Testing download bandwidth...',
    upload: 'Testing upload bandwidth...',
    completed: 'Test Completed',
    aborted: 'Test Cancelled',
    error: 'Test Failed',
  },
  actions: {
    start: 'START',
    abort: 'Cancel',
    retest: 'Test Again',
    share: 'Share Result',
    copyLink: 'Copy Summary',
    clearHistory: 'Clear History',
  },
  errors: {
    offline: 'You appear to be offline. Check your internet connection.',
    captivePortal: 'Captive portal detected! Please log in to your network.',
    rateLimited: 'Rate limit active. Please wait {seconds}s before testing again.',
    timeout: 'Test timed out. The server did not respond.',
    serverUnreachable: 'Could not connect to measurement servers.',
    multiTab: 'A test is already running in another tab.',
  },
  settings: {
    lightTestMode: 'Light Test Mode (Data Saver ≤10MB)',
    lightTestDesc: 'Reduces test duration and transfer size for metered connections.',
    soundEffects: 'Sound Feedback',
  },
  footer: {
    attribution: 'Powered by independent, public measurement networks.',
    license: 'Open source under MIT License.',
  },
};

type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringRecord<T[K]> : string;
};

export type TranslationSchema = DeepStringRecord<typeof en>;
