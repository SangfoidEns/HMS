export function renderHeatmap(records) {
  const container = document.getElementById('heatmapGridRows');
  if (!container) return;

  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  const grid = Array(7).fill(0).map(() => Array(24).fill(0));

  records.forEach(r => {
    const d = r.dayOfWeek === 0 ? 6 : r.dayOfWeek - 1;
    grid[d][r.hour]++;
  });

  container.innerHTML = days.map((day, dIdx) => `
    <div class="flex items-center gap-1 text-[10px] font-mono">
      <span class="w-8 text-gray-500">${day}</span>
      <div class="grid grid-cols-24 gap-1 flex-1">
        ${grid[dIdx].map(c => `
          <div class="h-5 rounded text-center text-[8px] flex items-center justify-center ${c > 0 ? 'bg-cyan-400/80 text-black font-bold' : 'bg-[#0B0D14]'}">
            ${c || ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}