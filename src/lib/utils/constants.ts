

export const BASE_PATH = '/api' as const

export const API_ROUTES = {
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  SIGHTINGS: {
    BASE: '/sightings',
    BY_ID: '/sightings/:id',
    IMAGE: '/sightings/:id/image'
  },
  SYNC: '/sync'
} as const;
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  },
  ANIMAL_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255
  },
  LOCATION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500
  },
  LATITUDE: {
    MIN: -90,
    MAX: 90
  },
  LONGITUDE: {
    MIN: -180,
    MAX: 180
  }
} as const;

export const IMAGE = {
  MAX_SIZE_BYTES: 500 * 1024,
  MAX_DIMENSION: 800,
  SUPPORTED_FORMATS: ['jpeg', 'png', 'webp'],
  Suppressed_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MIN_QUALITY: 0.3,
  INITIAL_QUALITY: 0.8,
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0
} as const;
export const SESSION = {
  DURATION_DAYS: 30,
  COOKIE_NAME: 'auth_token'
} as const;
