export function parseLogs(rawText) {
  if (!rawText) return [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let currentCategory = 'UNCATEGORIZED';
  const records = [];

  let i = 0;
  while (i < lines.length) {
    if (i + 3 < lines.length && lines[i+1].toLowerCase() === 'name' && lines[i+2].toLowerCase() === 'gramm') {
      currentCategory = lines[i].toUpperCase();
      i += 4;
      continue;
    }

    if (i + 3 < lines.length && (lines[i+3].includes(':') || lines[i+3].includes('.'))) {
      const clientName = lines[i];
      const baseGramm = parseFloat(lines[i+1]) || 0;
      const eurPaid = parseFloat(lines[i+2]) || 0;
      const timeStr = lines[i+3];
      
      const hour = timeStr.includes(':') ? parseInt(timeStr.split(':')[0], 10) || 0 : 12;

      records.push({
        category: currentCategory,
        clientName,
        baseGramm,
        exactGramm: baseGramm * 1.1,
        eurPaid,
        timeStr,
        hour,
        dayOfWeek: new Date().getDay()
      });
      i += 4;
      continue;
    }
    i++;
  }
  return records;
}