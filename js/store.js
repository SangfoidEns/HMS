/**
 * Сховище даних (LocalStorage)
 */

export function saveRawLogs(rawText) {
  localStorage.setItem('h2_raw_logs', rawText);
}

export function loadRawLogs() {
  return localStorage.getItem('h2_raw_logs') || '';
}

export function saveMyExpenses(expenses) {
  localStorage.setItem('h2_my_expenses', JSON.stringify(expenses));
}

export function loadMyExpenses() {
  const saved = localStorage.getItem('h2_my_expenses');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) { return []; }
  }
  return [];
}

export function clearStorage() {
  localStorage.removeItem('h2_raw_logs');
  localStorage.removeItem('h2_my_expenses');
}