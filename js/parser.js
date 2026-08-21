/**
 * Движок парсингу журналу Humans 2.0
 */

// Жорстко задані формули собівартості точної ваги за сортами
export const COST_PER_EXACT_GRAM = {
  'BANNAN': 600 / 110,
  'SKITTLES': 660 / 110
};

export function parseWeight(str) {
  if (!str) return 0;
  const clean = str.toString().toLowerCase().replace(',', '.');
  const matches = clean.match(/\d*\.?\d+/g);
  if (!matches) return 0;
  return matches.reduce((acc, curr) => acc + parseFloat(curr), 0);
}

export function parseMoneyAndDebt(str) {
  if (!str) return { eurPaid: 0, debtNew: 0, debtRepaid: 0, rawDebtText: '' };

  const clean = str.toString().toLowerCase().replace(',', '.').trim();
  let eurPaid = 0;
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
        const num = parseFloat(token);
        if (!isNaN(num) && num > 0) {
          eurPaid += num;
        }
      }
    });
  } else {
    const matches = clean.match(/\d*\.?\d+/g);
    if (matches) {
      eurPaid = matches.reduce((acc, curr) => acc + parseFloat(curr), 0);
    }
  }

  return { eurPaid, debtNew, debtRepaid, rawDebtText };
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
        const baseGramm = parseWeight(rawGramm);
        const exactGramm = baseGramm * 1.1; // Точна вага (*1.1)
        const moneyData = parseMoneyAndDebt(rawMoney);
        const parsedDateObj = parseRecordDateTime(timeStr);

        records.push({
          category: currentCategory,
          clientName,
          rawGramm,
          baseGramm,
          exactGramm,
          rawMoney,
          eurPaid: moneyData.eurPaid,
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