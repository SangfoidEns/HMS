/**
 * Analytics Engine
 */

export function filterRecordsByPeriod(records, period) {
  if (!records || records.length === 0) return [];
  if (period === 'all') return records;

  const now = new Date();

  return records.filter(r => {
    if (!r.parsedDateObj || isNaN(r.parsedDateObj.getTime())) return false;
    const d = r.parsedDateObj;

    if (period === 'day') {
      return d.toDateString() === now.toDateString();
    } 
    
    if (period === 'week') {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Понеділок
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return d >= startOfWeek && d <= endOfWeek;
    } 
    
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } 
    
    if (period === 'year') {
      return d.getFullYear() === now.getFullYear();
    }

    return true;
  });
}

export function groupRecordsByTimeSlot(records, period) {
  const map = {};

  records.forEach(r => {
    const d = r.parsedDateObj;
    let key = 'Інше';

    if (period === 'day') {
      key = `${String(d.getHours()).padStart(2, '0')}:00`;
    } else if (period === 'week') {
      const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      key = days[d.getDay()];
    } else if (period === 'month') {
      key = `${d.getDate()} число`;
    } else if (period === 'year') {
      const months = ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв', 'Лип', 'Серп', 'Верес', 'Жовт', 'Лист', 'Груд'];
      key = months[d.getMonth()];
    } else if (period === 'all') {
      key = `${d.getMonth() + 1}.${d.getFullYear()}`;
    }

    if (!map[key]) {
      map[key] = { revenue: 0, weight: 0, deals: 0 };
    }

    map[key].revenue += r.eurPaid;
    map[key].weight += r.exactGramm;
    map[key].deals += 1;
  });

  return map;
}
