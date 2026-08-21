import { state, saveState } from './state.js';
import { parseLogs } from './parser.js';
import { renderHeatmap } from './heatmap.js';
import { updateCharts } from './charts.js';

function process() {
  const rawText = document.getElementById('rawInput').value;
  state.parsedRecords = parseLogs(rawText);

  const categories = {};
  let totalEUR = 0, totalExactWeight = 0, totalCost = 0;

  state.parsedRecords.forEach(r => {
    totalEUR += r.eurPaid;
    totalExactWeight += r.exactGramm;

    if (!categories[r.category]) {
      categories[r.category] = { exactGramm: 0, eurPaid: 0 };
    }
    categories[r.category].exactGramm += r.exactGramm;
    categories[r.category].eurPaid += r.eurPaid;
  });

  Object.keys(categories).forEach(cat => {
    const costPer100 = state.procurementCosts[cat] || 0;
    totalCost += (categories[cat].exactGramm / 100) * costPer100;
  });

  // Update UI
  document.getElementById('kpiRevenue').innerText = `${totalEUR.toFixed(2)} €`;
  document.getElementById('kpiExactWeight').innerText = `${totalExactWeight.toFixed(2)} г`;
  document.getElementById('kpiCostOfGoods').innerText = `${totalCost.toFixed(2)} €`;
  document.getElementById('kpiNetProfit').innerText = `${(totalEUR - totalCost).toFixed(2)} €`;

  renderHeatmap(state.parsedRecords);
  updateCharts(categories);
}

// Event Listeners
document.getElementById('btnProcessData').addEventListener('click', process);

document.getElementById('btnAddProcurement').addEventListener('click', () => {
  const name = document.getElementById('newProcurementName').value.trim().toUpperCase();
  const cost = parseFloat(document.getElementById('newProcurementCost').value);
  if (name && !isNaN(cost)) {
    state.procurementCosts[name] = cost;
    saveState();
    process();
  }
});

setInterval(() => {
  document.getElementById('liveClock').innerText = new Date().toLocaleTimeString();
}, 1000);