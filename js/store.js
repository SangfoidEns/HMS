/**
 * LocalStorage Data Persistence Layer
 */

const KEYS = {
  PURCHASES: 'app_purchases_v2',
  RAW_LOGS: 'app_raw_logs_v2',
  MY_EXPENSES: 'app_my_expenses_v2'
};

export function savePurchases(data) {
  localStorage.setItem(KEYS.PURCHASES, JSON.stringify(data));
}

export function loadPurchases() {
  const raw = localStorage.getItem(KEYS.PURCHASES);
  return raw ? JSON.parse(raw) : {};
}

export function saveRawLogs(text) {
  localStorage.setItem(KEYS.RAW_LOGS, text);
}

export function loadRawLogs() {
  return localStorage.getItem(KEYS.RAW_LOGS) || '';
}

export function saveMyExpenses(data) {
  localStorage.setItem(KEYS.MY_EXPENSES, JSON.stringify(data));
}

export function loadMyExpenses() {
  const raw = localStorage.getItem(KEYS.MY_EXPENSES);
  return raw ? JSON.parse(raw) : [];
}
