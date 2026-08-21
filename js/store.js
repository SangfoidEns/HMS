/**
 * Data Storage Manager
 */

const DEFAULT_PURCHASES = {
  'BANNAN': 600,   // 600€ за 100г
  'SKITTLES': 660  // 660€ за 100г
};

export function savePurchases(purchases) {
  localStorage.setItem('h2_purchases', JSON.stringify(purchases));
}

export function loadPurchases() {
  const saved = localStorage.getItem('h2_purchases');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) { return DEFAULT_PURCHASES; }
  }
  return DEFAULT_PURCHASES;
}

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
