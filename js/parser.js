/**
 * Advanced Journal Parser for Humans 2.0
 */

export function parseWeightAndBonus(str) {
  if (!str) return { baseGramm: 0, bonusGramm: 0 };
  
  const clean = str.toString().toLowerCase().replace(',', '.').trim();
  let bonusGramm = 0;
  let baseGramm = 0;

  // Витягуємо бонус (наприклад: !1.5бонус або !1бонус)
  const bonusMatch = clean.match(/!(\d*\.?\d+)\s*бонус/);
  if (bonusMatch) {
    bonusGramm = parseFloat(bonusMatch[1]) || 0;
  }

  // Видаляємо блок бонусу з рядка для обчислення базової ваги
  const pureWeightStr = clean.replace(/!(\d*\.?\d+)\s*бонус/, '').trim();
  
  // Рахуємо арифметику базової ваги (наприклад: 1+2 або 2.5)
  const numbers = pureWeightStr.match(/\d*\.?\d+/g);
  if (numbers) {
    baseGramm = numbers.reduce((acc, curr) => acc + parseFloat(curr), 0);
  }

  return { baseGramm, bonusGramm };
}

export function parseMoneyAndPaymentType(str) {
  if (!str) return { eurPaid: 0, isCard: false, debtNew: 0, debtRepaid: 0, rawDebtText: '' };

  const clean = str.toString().toLowerCase().replace(',', '.').trim();
  let eurPaid = 0;
  let isCard = clean.includes('карта');
  let debtNew = 0;
  let debtRepaid = 0;
  let rawDebtText = '';

  if (clean.includes('долг')) {
    rawDebtText = clean;
    const tokens = clean.split(/\s+/);

    tokens.forEach(token => {
      if (token.includes('долг')) {
        const numMatch = token.match(/[-+]?\d*\.?\d+/);
        if (numMatch) {
          const val = parseFloat(numMatch[0]);
          if (val < 0) {
            debtNew += Math.abs(val);
          } else if (val > 0) {
            debtRepaid += val;
          }
        }
      } else {
        const cleanToken = token.replace('карта', '');
        const num = parseFloat(cleanToken);
        if (!isNaN(num) && num > 0) {
          eurPaid += num;
        }
      }
    });
  } else {
    // Якщо немає боргів, просто шукаємо суму
    const cleanStr = clean.replace('карта', '');
    const matches = cleanStr.match(/\d*\.?\d+/g);
    if (matches) {
      eurPaid = matches.reduce((acc, curr) => acc + parseFloat(curr), 0);
    }
  }

  return { eurPaid, isCard, debtNew, debtRepaid, rawDebtText };
}

export function parseRecordDateTime(timeStr) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let hour = 12;
  let minute = 0;

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
      if (dmp[2]) year = parseInt(dmp[2], 10);
      if (year < 100) year += 2000;
    }
  });

  return new Date(year, month, day, hour, minute);
}

export function parseLogs(rawText) {
  if (!rawText) return [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '');
  let currentCategory = 'UNCATEGORIZED';
  const records = [];
  const techHeaders = ['name', 'gramm', '€', 'time'];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (i + 3 < lines.length && 
        lines[i+1].toLowerCase() === 'name' && 
        lines[i+2].toLowerCase() === 'gramm' && 
        lines[i+3] === '€') {
      currentCategory = line.toUpperCase();
      i += 5;
      continue;
    }

    if (techHeaders.includes(line.toLowerCase())) {
      i++;
      continue;
    }

    if (i + 3 < lines.length) {
      const clientName = lines[i];
      const rawGramm = lines[i+1];
      const rawMoney = lines[i+2];
      const timeStr = lines[i+3];

      if (timeStr.includes('.') || timeStr.includes(':')) {
        const weightData = parseWeightAndBonus(rawGramm);
        const moneyData = parseMoneyAndPaymentType(rawMoney);
        const parsedDateObj = parseRecordDateTime(timeStr);

        const totalBaseGramm = weightData.baseGramm + weightData.bonusGramm;
        const exactGramm = totalBaseGramm * 1.1;

        records.push({
          category: currentCategory,
          clientName,
          rawGramm,
          baseGramm: weightData.baseGramm,
          bonusGramm: weightData.bonusGramm,
          totalBaseGramm,
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
