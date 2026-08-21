import { state } from './state.js';

export function updateCharts(categories) {
  const labels = Object.keys(categories);
  const weights = labels.map(k => categories[k].exactGramm);
  const revenues = labels.map(k => categories[k].eurPaid);

  if (state.charts.weight) state.charts.weight.destroy();
  if (state.charts.revenue) state.charts.revenue.destroy();

  const ctx1 = document.getElementById('weightChart').getContext('2d');
  state.charts.weight = new Chart(ctx1, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Вага (г)', data: weights, backgroundColor: '#00E5FF' }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctx2 = document.getElementById('revenueChart').getContext('2d');
  state.charts.revenue = new Chart(ctx2, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: revenues, backgroundColor: ['#00E5FF', '#00FF88', '#FFD700'] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
}