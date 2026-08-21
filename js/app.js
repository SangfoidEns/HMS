// Підключення швидких кнопок в DOMContentLoaded
document.querySelectorAll('.btn-quick-expense').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const name = e.target.getAttribute('data-name') || e.target.innerText.trim();
    document.getElementById('myExpenseNote').value = name;
    document.getElementById('myExpenseAmount').focus();
  });
});

// Головна функція перерахунку
function processAllData() {
  const rawText = document.getElementById('rawInput').value;
  saveRawLogs(rawText);
  
  parsedRecordsGlobal = parseLogs(rawText);

  let totalRevenue = 0;
  let totalCash = 0;
  let totalCard = 0;
  let totalCostOfGoods = 0;
  let totalExactWeight = 0;
  let totalBonusWeight = 0;
  let totalBonusCost = 0; // Собівартість бонусів

  const clientDebtsMap = {}; // Карта балансу боргів по клієнтах

  parsedRecordsGlobal.forEach(r => {
    totalRevenue += r.eurPaid;
    if (r.isCard) {
      totalCard += r.eurPaid;
    } else {
      totalCash += r.eurPaid;
    }

    totalExactWeight += r.exactGramm;
    const bonusExactGramm = r.bonusGramm * 1.1;
    totalBonusWeight += bonusExactGramm;

    // Розрахунок собівартості
    const costFor100g = purchases[r.category] || 0;
    const costPerExactGram = costFor100g / 110; 
    
    totalCostOfGoods += (r.exactGramm * costPerExactGram);
    totalBonusCost += (bonusExactGramm * costPerExactGram);

    // Агрегація боргів
    if (!clientDebtsMap[r.clientName]) {
      clientDebtsMap[r.clientName] = { newDebt: 0, repaidDebt: 0 };
    }
    clientDebtsMap[r.clientName].newDebt += r.debtNew;
    clientDebtsMap[r.clientName].repaidDebt += r.debtRepaid;
  });

  // Розрахунок сумарного активного боргу по всіх клієнтах
  let totalActiveDebt = 0;
  Object.keys(clientDebtsMap).forEach(client => {
    const netDebt = clientDebtsMap[client].newDebt - clientDebtsMap[client].repaidDebt;
    if (netDebt > 0) {
      totalActiveDebt += netDebt;
    }
  });

  const netProfit = totalRevenue - totalCostOfGoods;

  // Оновлення KPI
  document.getElementById('kpiRevenue').innerText = `${totalRevenue.toFixed(1)} €`;
  document.getElementById('kpiNetProfit').innerText = `${netProfit.toFixed(1)} €`;
  document.getElementById('kpiCashCard').innerText = `${totalCash.toFixed(0)} / ${totalCard.toFixed(0)} €`;
  document.getElementById('kpiCostOfGoods').innerText = `${totalCostOfGoods.toFixed(1)} €`;
  document.getElementById('kpiActiveDebt').innerText = `${totalActiveDebt.toFixed(1)} €`; // ТЕПЕР ПОКАЗУЄ АКТУАЛЬНЕ ЗНАЧЕННЯ
  document.getElementById('kpiExactWeight').innerText = `${totalExactWeight.toFixed(2)} г`;
  document.getElementById('kpiBonusWeight').innerText = `${totalBonusWeight.toFixed(2)} г`;
  document.getElementById('kpiDeals').innerText = parsedRecordsGlobal.length;

  // Оновлення блоку "МОЇ"
  document.getElementById('myCardTotal').innerText = `${totalCard.toFixed(1)} €`;
  document.getElementById('myBonusCostTotal').innerText = `${totalBonusCost.toFixed(1)} €`;

  renderDebts(clientDebtsMap);
  renderTable(parsedRecordsGlobal);
}

function renderDebts(debtsMap) {
  const activeContainer = document.getElementById('activeDebtsList');
  const repaidContainer = document.getElementById('repaidDebtsList');

  let activeHtml = '';
  let repaidHtml = '';

  Object.keys(debtsMap).forEach(client => {
    const { newDebt, repaidDebt } = debtsMap[client];
    const balance = newDebt - repaidDebt;

    if (balance > 0) {
      activeHtml += `<div class="flex justify-between"><span>${client}</span><span class="text-neonRed font-bold">-${balance.toFixed(1)} €</span></div>`;
    }
    if (repaidDebt > 0) {
      repaidHtml += `<div class="flex justify-between"><span>${client}</span><span class="text-emerald-400 font-bold">+${repaidDebt.toFixed(1)} €</span></div>`;
    }
  });

  activeContainer.innerHTML = activeHtml || '<p class="text-gray-500">Немає боргів</p>';
  repaidContainer.innerHTML = repaidHtml || '<p class="text-gray-500">Немає погашень</p>';
}
