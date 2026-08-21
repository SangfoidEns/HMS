import { parseLogs } from './parser.js';
import { savePurchases, loadPurchases, saveRawLogs, loadRawLogs } from './store.js';
import { filterRecordsByPeriod, groupRecordsByTimeSlot } from './analytics.js';

let purchases = {};
let parsedRecordsGlobal = [];
let currentPeriod = 'week';

let chartRevenueInstance = null;
let chartWeightInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  purchases = loadPurchases();
  
  initNavigation();
  initPurchasesUI();

  const savedLogs = loadRawLogs();
  if (savedLogs) {
    document.getElementById('rawInput').value = savedLogs;
  }
  
  processAllData();

  // Event Listeners
  document.getElementById('btnCalculate').addEventListener('click', processAllData);
  document.getElementById('btnAddPurchase').addEventListener('click', handleAddPurchase);
  
  // Фільтри періодів для Сторінки 2
  document.querySelectorAll('.btn-period').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-period').forEach(b => {
        b.className = 'btn-period px-4 py-1.5 text-xs font-bold rounded-lg bg-brandDark border border-brandBorder text-gray-400 hover:text-white';
      });
      e.target.className = 'btn-period px-4 py-1.5 text-xs font-bold rounded-lg bg-neonGreen/20 text-neonGreen border border-neonGreen/40';
      currentPeriod = e.target.getAttribute('data-period');
      renderAnalyticsPage();
    });
  });
});

function initNavigation() {
  const tabDashboard = document.getElementById('tabDashboard');
  const tabAnalytics = document.getElementById('tabAnalytics');
  const pageDashboard = document.getElementById('pageDashboard');
  const pageAnalytics = document.getElementById('pageAnalytics');

  tabDashboard.addEventListener('click', () => {
    pageDashboard.classList.remove('hidden');
    pageAnalytics.classList.add('hidden');
    tabDashboard.className = 'px-5 py-2 text-xs font-bold rounded-lg bg-neonGreen/20 text-neonGreen border border-neonGreen/40 transition';
    tabAnalytics.className = 'px-5 py-2 text-xs font-bold rounded-lg text-gray-400 hover:text-white transition';
  });

  tabAnalytics.addEventListener('click', () => {
    pageAnalytics.classList.remove('hidden');
    pageDashboard.classList.add('hidden');
    tabAnalytics.className = 'px-5 py-2 text-xs font-bold rounded-lg bg-neonGreen/20 text-neonGreen border border-neonGreen/40 transition';
    tabDashboard.className = 'px-5 py-2 text-xs font-bold rounded-lg text-gray-400 hover:text-white transition';
    renderAnalyticsPage();
  });
}

function processAllData() {
  const rawText = document.getElementById('rawInput').value;
  saveRawLogs(rawText);
  
  parsedRecordsGlobal = parseLogs(rawText);

  // Синхронізація категорій з закупками
  parsedRecordsGlobal.forEach(r => {
    if (r.category && r.category !== 'UNCATEGORIZED' && purchases[r.category] === undefined) {
      purchases[r.category] = 600; // Стандартна ціна за закупку 100г
      savePurchases(purchases);
    }
  });
  
  initPurchasesUI();

  let totalRevenue = 0;
  let totalCash = 0;
  let totalCard = 0;
  let totalCostOfGoods = 0;
  let totalExactWeight = 0;
  let totalBonusWeight = 0;

  const clientNewDebts = {};
  const clientRepaidDebts = {};

  parsedRecordsGlobal.forEach(r => {
    totalRevenue += r.eurPaid;
    if (r.isCard) {
      totalCard += r.eurPaid;
    } else {
      totalCash += r.eurPaid;
    }

    totalExactWeight += r.exactGramm;
    totalBonusWeight += (r.bonusGramm * 1.1);

    // Точна себевартість з урахуванням закупівельної ціни та коефіцієнта 1.1
    // Формула: Ціна за 1г точної ваги = (Ціна за 100г закупки) / (100 * 1.1)
    const costFor100g = purchases[r.category] || 0;
    const costPerExactGram = costFor100g / 110; 
    const itemCost = r.exactGramm * costPerExactGram;

    totalCostOfGoods += itemCost;

    if (r.debtNew > 0) clientNewDebts[r.clientName] = (clientNewDebts[r.clientName] || 0) + r.debtNew;
    if (r.debtRepaid > 0) clientRepaidDebts[r.clientName] = (clientRepaidDebts[r.clientName] || 0) + r.debtRepaid;
  });

  const netProfit = totalRevenue - totalCostOfGoods;

  // Оновлення KPI
  document.getElementById('kpiRevenue').innerText = `${totalRevenue.toFixed(1)} €`;
  document.getElementById('kpiNetProfit').innerText = `${netProfit.toFixed(1)} €`;
  document.getElementById('kpiCashCard').innerText = `${totalCash.toFixed(0)} / ${totalCard.toFixed(0)} €`;
  document.getElementById('kpiCostOfGoods').innerText = `${totalCostOfGoods.toFixed(1)} €`;
  document.getElementById('kpiExactWeight').innerText = `${totalExactWeight.toFixed(2)} г`;
  document.getElementById('kpiBonusWeight').innerText = `${totalBonusWeight.toFixed(2)} г`;
  document.getElementById('kpiDeals').innerText = parsedRecordsGlobal.length;

  renderDebts(clientNewDebts, clientRepaidDebts);
  renderTable(parsedRecordsGlobal);

  // Якщо активна друга сторінка, оновлюємо і графіки
  if (!document.getElementById('pageAnalytics').classList.contains('hidden')) {
    renderAnalyticsPage();
  }
}

function initPurchasesUI() {
  const container = document.getElementById('purchasesList');
  if (!container) return;
  container.innerHTML = Object.keys(purchases).map(cat => `
    <div class="flex justify-between items-center bg-brandDark p-1.5 rounded border border-brandBorder">
      <span class="font-bold text-gray-300">${cat}</span>
      <span class="font-mono text-neonYellow">${purchases[cat]} € / 100g</span>
    </div>
  `).join('');
}

function handleAddPurchase() {
  const nameInput = document.getElementById('newCatName');
  const costInput = document.getElementById('newCatCost');
  
  const name = nameInput.value.trim().toUpperCase();
  const cost = parseFloat(costInput.value);

  if (name && !isNaN(cost) && cost > 0) {
    purchases[name] = cost;
    savePurchases(purchases);
    initPurchasesUI();
    processAllData();
    nameInput.value = '';
    costInput.value = '';
  }
}

function renderDebts(newDebts, repaidDebts) {
  const activeContainer = document.getElementById('activeDebtsList');
  const repaidContainer = document.getElementById('repaidDebtsList');

  activeContainer.innerHTML = Object.keys(newDebts).map(c => `
    <div class="flex justify-between"><span>${c}</span><span class="text-neonRed font-bold">-${newDebts[c]} €</span></div>
  `).join('') || '<p class="text-gray-500">Немає</p>';

  repaidContainer.innerHTML = Object.keys(repaidDebts).map(c => `
    <div class="flex justify-between"><span>${c}</span><span class="text-emerald-400 font-bold">+${repaidDebts[c]} €</span></div>
  `).join('') || '<p class="text-gray-500">Немає</p>';
}

function renderTable(records) {
  const tbody = document.getElementById('recordsTableBody');
  tbody.innerHTML = records.map(r => `
    <tr class="hover:bg-brandDark/40">
      <td class="p-2 font-bold text-neonGreen">${r.category}</td>
      <td class="p-2 text-gray-200">${r.clientName}</td>
      <td class="p-2 font-mono">${r.baseGramm} ${r.bonusGramm > 0 ? `<span class="text-neonPurple">+!${r.bonusGramm}б</span>` : ''}</td>
      <td class="p-2 font-mono font-bold text-neonGreen">${r.exactGramm.toFixed(2)}г</td>
      <td class="p-2">${r.isCard ? '<span class="text-neonBlue font-bold">💳 Карта</span>' : '💵 Готівка'}</td>
      <td class="p-2 font-bold">${r.eurPaid} €</td>
      <td class="p-2 text-neonYellow">${r.rawDebtText || '-'}</td>
      <td class="p-2 text-gray-400 text-[10px]">${r.timeStr}</td>
    </tr>
  `).join('');
}

function renderAnalyticsPage() {
  const filtered = filterRecordsByPeriod(parsedRecordsGlobal, currentPeriod);
  const grouped = groupRecordsByTimeSlot(filtered, currentPeriod);

  const labels = Object.keys(grouped);
  const revenues = labels.map(k => grouped[k].revenue);
  const weights = labels.map(k => grouped[k].weight);

  // Знищення старих екземплярів для уникнення Canvas Re-use Error
  if (chartRevenueInstance) chartRevenueInstance.destroy();
  if (chartWeightInstance) chartWeightInstance.destroy();

  const ctxR = document.getElementById('chartTimeRevenue').getContext('2d');
  chartRevenueInstance = new Chart(ctxR, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Виручка (€)',
        data: revenues,
        borderColor: '#00FF88',
        backgroundColor: 'rgba(0,255,136,0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctxW = document.getElementById('chartTimeWeight').getContext('2d');
  chartWeightInstance = new Chart(ctxW, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Точна вага (г)',
        data: weights,
        backgroundColor: '#9D00FF'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
