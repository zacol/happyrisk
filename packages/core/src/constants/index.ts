// Privacy
export const ANONYMITY_THRESHOLD = 5;

// Survey: Rating
export const RATING_MIN = 1;
export const RATING_MAX = 5;

// Survey: Schedule defaults
export const DEFAULT_SURVEY_FREQUENCY = 'WEEKLY' as const;
export const DEFAULT_SURVEY_DAY = 5; // Friday (ISO: 1=Mon, 7=Sun)
export const DEFAULT_SURVEY_TIME = '14:00'; // UTC

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Risk: Auto-detection thresholds
export const HI_LOW_THRESHOLD = 2.5;
export const HI_DROP_PERCENT_THRESHOLD = 20;
