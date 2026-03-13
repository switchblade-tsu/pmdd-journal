/* =============================================
   PMDD JOURNAL — charts.js
   Chart.js visualizations
   ============================================= */

let moodChartInstance    = null;
let symptomChartInstance = null;
let energyChartInstance  = null;

function renderCharts() {
  const entries = loadEntries();

  // Build last 30 days
  const today = todayKey();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(addDays(today, -i));
  }

  renderMoodChart(entries, days);
  renderEnergyChart(entries, days);
  renderSymptomChart(entries);
}

// ── Mood chart ──────────────────────────────────────────────────────────────
function renderMoodChart(entries, days) {
  const labels = days.map(d => {
    const [, m, day] = d.split('-');
    return `${parseInt(m)}/${parseInt(day)}`;
  });
  const data = days.map(d => entries[d] ? entries[d].mood : null);

  const ctx = document.getElementById('mood-chart').getContext('2d');
  if (moodChartInstance) moodChartInstance.destroy();

  moodChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Mood',
        data,
        borderColor: '#7c5cbf',
        backgroundColor: 'rgba(124,92,191,0.10)',
        pointBackgroundColor: days.map(d => {
          if (!entries[d] || !entries[d].mood) return 'transparent';
          const m = entries[d].mood;
          return m >= 7 ? '#6ee7b7' : m >= 4 ? '#fde68a' : '#fca5a5';
        }),
        pointBorderColor: '#7c5cbf',
        pointRadius: days.map(d => entries[d] ? 5 : 0),
        fill: true,
        tension: 0.35,
        spanGaps: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.raw !== null ? `Mood: ${ctx.raw}/10` : 'No entry',
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2, color: '#7a6b96' },
          grid: { color: '#f0ecf8' },
        },
        x: {
          ticks: {
            color: '#7a6b96',
            maxTicksLimit: 10,
            maxRotation: 0,
          },
          grid: { display: false },
        },
      },
    },
  });
}

// ── Energy chart ────────────────────────────────────────────────────────────
function renderEnergyChart(entries, days) {
  const labels = days.map(d => {
    const [, m, day] = d.split('-');
    return `${parseInt(m)}/${parseInt(day)}`;
  });
  const data = days.map(d => entries[d] ? entries[d].energy : null);

  const ctx = document.getElementById('energy-chart').getContext('2d');
  if (energyChartInstance) energyChartInstance.destroy();

  energyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Energy',
        data,
        borderColor: '#a882e8',
        backgroundColor: 'rgba(168,130,232,0.10)',
        pointBackgroundColor: '#a882e8',
        pointBorderColor: '#7c5cbf',
        pointRadius: days.map(d => entries[d] ? 5 : 0),
        fill: true,
        tension: 0.35,
        spanGaps: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.raw !== null ? `Energy: ${ctx.raw}/10` : 'No entry',
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2, color: '#7a6b96' },
          grid: { color: '#f0ecf8' },
        },
        x: {
          ticks: {
            color: '#7a6b96',
            maxTicksLimit: 10,
            maxRotation: 0,
          },
          grid: { display: false },
        },
      },
    },
  });
}

// ── Symptom frequency chart ─────────────────────────────────────────────────
function renderSymptomChart(entries) {
  const counts = {};
  Object.values(entries).forEach(entry => {
    const all = [...(entry.emotionalSymptoms || []), ...(entry.physicalSymptoms || [])];
    all.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!sorted.length) return;

  const labels = sorted.map(([key]) => labelSymptom(key));
  const data   = sorted.map(([, count]) => count);

  const palette = [
    'rgba(124,92,191,0.75)', 'rgba(168,130,232,0.75)', 'rgba(192,132,252,0.75)',
    'rgba(216,180,254,0.75)', 'rgba(110,231,183,0.75)', 'rgba(253,230,138,0.75)',
    'rgba(252,165,165,0.75)', 'rgba(147,197,253,0.75)', 'rgba(249,168,212,0.75)',
    'rgba(167,243,208,0.75)',
  ];

  const ctx = document.getElementById('symptom-chart').getContext('2d');
  if (symptomChartInstance) symptomChartInstance.destroy();

  symptomChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Times logged',
        data,
        backgroundColor: palette.slice(0, data.length),
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw} time${ctx.raw !== 1 ? 's' : ''}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#7a6b96', stepSize: 1 },
          grid: { color: '#f0ecf8' },
        },
        y: {
          ticks: { color: '#2d2040', font: { weight: '600' } },
          grid: { display: false },
        },
      },
    },
  });
}
