/**
 * Analytics Engine for Time Grouping (Day, Week, Month, Year)
 */

export function filterRecordsByPeriod(records, period, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  
  return records.filter(r => {
    if (!r.parsedDateObj) return false;
    const d = r.parsedDateObj;

    switch (period) {
      case 'day':
        return d.toDateString() === ref.toDateString();
      case 'week': {
        const firstDayOfWeek = new Date(ref);
        const day = ref.getDay();
        const diff = ref.getDate() - day + (day === 0 ? -6 : 1); // Початок у понеділок
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0,0,0,0);
        
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23,59,59,999);

        return d >= firstDayOfWeek && d <= lastDayOfWeek;
      }
      case 'month':
        return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
      case 'year':
        return d.getFullYear() === ref.getFullYear();
      case 'all':
      default:
        return true;
    }
  });
}

export function groupRecordsByTimeSlot(records, period) {
  const map = {};

  records.forEach(r => {
    const d = r.parsedDateObj;
    let key = '';

    if (period === 'day') {
      key = `${String(d.getHours()).padStart(2, '0')}:00`;
    } else if (period === 'week') {
      const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      key = days[d.getDay()];
    } else if (period === 'month') {
      key = `День ${d.getDate()}`;
    } else if (period === 'year') {
      const months = ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв', 'Лип', 'Серп', 'Верес', 'Жовт', 'Листоп', 'Груд'];
      key = months[d.getMonth()];
    }

    if (!map[key]) {
      map[key] = { revenue: 0, profit: 0, weight: 0, deals: 0 };
    }

    map[key].revenue += r.eurPaid;
    map[key].weight += r.exactGramm;
    map[key].deals += 1;
  });

  return map;
}