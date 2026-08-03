// Single source of truth for the data cutoff date.
// Update these values when new data is imported.
// The badge label and default month/year selections will follow automatically.

export const DATA_CUTOFF_MONTH = 6;   // 1–12
export const DATA_CUTOFF_YEAR = 2026;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Last calendar day of the cutoff month
const _lastDay = new Date(DATA_CUTOFF_YEAR, DATA_CUTOFF_MONTH, 0).getDate();

export const DATA_CUTOFF_LABEL = `${_lastDay} ${MONTH_NAMES[DATA_CUTOFF_MONTH - 1]} ${DATA_CUTOFF_YEAR}`;