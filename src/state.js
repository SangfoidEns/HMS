export const state = {
  procurementCosts: JSON.parse(localStorage.getItem('h2_procurement_costs')) || { 'BANNAN': 600 },
  parsedRecords: [],
  charts: { weight: null, revenue: null }
};

export function saveState() {
  localStorage.setItem('h2_procurement_costs', JSON.stringify(state.procurementCosts));
}