/**
 * Advanced Journal Parser
 * Чисті функції для розбору сирого текстового логу.
 */

// Розбір ваги та бонусів (!1бонус, !0.5б)
export function parseWeightAndBonus(str) {
  if (!str) return { baseGramm: 0, bonusGramm: 0 };

  const clean = str.toString().toLowerCase().replace(',', '.').trim();
  let bonusGramm = 0;
  let baseGramm = 0;

  // Шукаємо бонус за паттерном "!число" + "бонус" або "б"
  const bonusMatch = clean.match(/!(\d*\.?\d+)\s*(?:бонус|б)/);
  if (bonusMatch) {
    bonusGramm = parseFloat(bonusMatch[1]) || 0;
  }

  // Видаляємо бонус із рядка, щоб порахувати чисту базову вагу
  const pureWeightStr = clean.replace(/!(\d*\.?\d+)\s*(?:бонус|б)/g, '').trim();

  // Додаємо всі числа, які залишилися (наприклад "1+2" -> 3)
  const numbers = pureWeightStr.match(/\d*\.?\d+/g);
  if (numbers) {
    baseGramm = numbers.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  }

  return { baseGramm, bonusGramm };
}

// Розбір грошей, типу оплати (карта/готівка) та боргів
export function parseMoneyAndPaymentType(str) {
  if (!str) return { eurPaid: 0, isCard: false, debtNew: 0, debtRepaid: 0, rawDebtText: '' };

  const clean = str.toString().toLowerCase().replace(',', '.').trim();
  const isCard = clean.includes('карта');
  let eurPaid = 0;
  let debtNew = 0;
  let debtRepaid = 0;
  let rawDebtText = '';

  if (clean.includes('долг')) {
    rawDebtText = clean;

    const newDebtMatch = clean.match(/(-\d*\.?\d+)\s*долг/);
    const repaidDebtMatch = clean.match(/(?:\+?(\d*\.?\d+))\s*долг/);

    if (newDebtMatch) {
      debtNew = Math.abs(parseFloat(newDebtMatch[1])) || 0;
    } else if (repaidDebtMatch && !clean.includes('-')) {
      debtRepaid = parseFloat(repaidDebtMatch[1]) || 0;
    }

    // Витягуємо фактично сплачені гроші
    const moneyStr = clean.replace(/[-+]?\d*\.?\d+\s*долг/g, '').replace('карта', '').trim();
    const moneyMatch = moneyStr.match(/\d*\.?\d+/);
    if (moneyMatch) {
      eurPaid = parseFloat(moneyMatch[0]) || 0;
    }
  } else {
    // Звичайна оплата
    const cleanMoney = clean.replace('карта', '').trim();
    const matches = cleanMoney.match(/\d*\.?\d+/);
    if (matches) {
      eurPaid = parseFloat(matches[0]) || 0;
    }
  }

  return { eurPaid, isCard, debtNew, debtRepaid, rawDebtText };
}

// Розбір дати й часу
export function parseRecordDateTime(timeStr) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let hour = 12;
  let minute = 0;

  if (!timeStr) return now;

  const parts = timeStr.trim().split(/\s+/);

  parts.forEach(p => {
    if (p.includes(':')) {
      const hm = p.split(':');
      hour = parseInt(hm[0], 10) || 0;
      minute = parseInt(hm[1], 10) || 0;
    } else if (p.includes('.')) {
      const dmp = p.split('.');
      if (dmp[0]) day = parseInt(dmp[0], 10);
      if (dmp[1]) month = parseInt(dmp[1], 10) - 1;
      if (dmp[2]) {
        let y = parseInt(dmp[2], 10);
        year = y < 100 ? 2000 + y : y;
      }
    }
  });

  return new Date(year, month, day, hour, minute);
}

// Головний алгоритм читання блоків логу
export function parseLogs(rawText) {
  if (!rawText) return [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '');
  let currentCategory = 'UNCATEGORIZED';
  const records = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Шукаємо заголовок категорії (блок з Name, Gramm, €)
    if (i + 3 < lines.length && 
        lines[i+1].toLowerCase() === 'name' && 
        lines[i+2].toLowerCase() === 'gramm' && 
        lines[i+3] === '€') {
      currentCategory = line.toUpperCase();
      i += 5;
      continue;
    }

    // Зчитуємо 4 рядки угоди: Ім'я, Вага, Гроші, Час
    if (i + 3 < lines.length) {
      const clientName = lines[i];
      const rawGramm = lines[i+1];
      const rawMoney = lines[i+2];
      const timeStr = lines[i+3];

      if (timeStr.includes(':') || timeStr.includes('.')) {
        const weightData = parseWeightAndBonus(rawGramm);
        const moneyData = parseMoneyAndPaymentType(rawMoney);
        const parsedDateObj = parseRecordDateTime(timeStr);

        // ФАКТИЧНА ВАГА: Множимо 1.1 ТІЛЬКИ на базову вагу. Бонус іде 1:1
        const exactGramm = (weightData.baseGramm * 1.1) + weightData.bonusGramm;

        records.push({
          id: `${parsedDateObj.getTime()}_${Math.random().toString(36).substr(2, 5)}`,
          category: currentCategory,
          clientName,
          rawGramm,
          baseGramm: weightData.baseGramm,
          bonusGramm: weightData.bonusGramm, // Фактичний чистий бонус
          totalBaseGramm: weightData.baseGramm + weightData.bonusGramm,
          exactGramm,
          rawMoney,
          eurPaid: moneyData.eurPaid,
          isCard: moneyData.isCard,
          debtNew: moneyData.debtNew,
          debtRepaid: moneyData.debtRepaid,
          rawDebtText: moneyData.rawDebtText,
          timeStr,
          parsedDateObj
        });

        i += 4;
        continue;
      }
    }
    i++;
  }
  return records;
}
