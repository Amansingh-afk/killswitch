// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },
  USER: {
    PROFILE: '/api/user/profile',
    SETTINGS: '/api/user/settings',
  },
  POSITIONS: '/api/positions',
  RISK: {
    STATUS: '/api/risk/status',
    EVENTS: '/api/risk/events',
    HISTORY: '/api/risk/history',
    RESET: '/api/risk/reset',
  },
  BALANCE: '/api/balance',
} as const;

// Default values
export const DEFAULT_RISK_THRESHOLD = 2.0;
export const MONITOR_INTERVAL = 2000; // 2 seconds

