/* =============================================
   PMDD JOURNAL — app.js
   Core application logic
   ============================================= */

// ── Constants ──────────────────────────────────────────────────────────────
const STORAGE_KEY   = 'pmdd_entries';
const CYCLES_KEY    = 'pmdd_cycles';

const MOOD_LABELS = {
  1:  'Very difficult — you are still here, and that matters.',
  2:  'Really tough day. Be gentle with yourself.',
  3:  'Hard day. Rest as much as you can.',
  4:  'A bit challenging. Small wins count.',
  5:  'Okay — somewhere in the middle.',
  6:  'Doing alright. Some good, some hard.',
  7:  'Pretty good today.',
  8:  'Feeling good — hold onto this feeling.',
  9:  'Really well. Enjoy this day.',
  10: 'Wonderful! Soak it all in.',
};

// ── Storage helpers ─────────────────────────────────────────────────────────
function loadEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveEntries(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadCycles() {
  try { return JSON.parse(localStorage.getItem(CYCLES_KEY)) || []; }
  catch { return []; }
}

function saveCycles(data) {
  localStorage.setItem(CYCLES_KEY, JSON.stringify(data));
}

// ── Date helpers ────────────────────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(a, b) {
  const da = new Date(a), db = new Date(b);
  return Math.round(Math.abs((db - da) / 86400000));
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function labelSymptom(key) {
  const map = {
    irritability: 'Irritability', anxiety: 'Anxiety', depression: 'Depression',
    mood_swings: 'Mood Swings', crying_spells: 'Crying Spells', brain_fog: 'Brain Fog',
    overwhelm: 'Overwhelm', social_withdrawal: 'Social Withdrawal', hopelessness: 'Hopelessness',
    anger_outbursts: 'Anger Outbursts', low_self_esteem: 'Low Self-Esteem', sensitivity: 'Sensitivity',
    bloating: 'Bloating', cramps: 'Cramps', headache: 'Headache', fatigue: 'Fatigue',
    breast_tenderness: 'Breast Tenderness', acne: 'Acne', back_pain: 'Back Pain',
    joint_pain: 'Joint Pain', sleep_issues: 'Sleep Issues', appetite_changes: 'Appetite Changes',
    nausea: 'Nausea', hot_flashes: 'Hot Flashes',
  };
  return map[key] || key;
}

// ── Navigation ──────────────────────────────────────────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
const pages   = document.querySelectorAll('.page');

function showPage(name) {
  pages.forEach(p => p.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelector(`[data-page="${name}"]`).classList.add('active');

  if (name === 'calendar') renderCalendar();
  if (name === 'insights') { renderStats(); if (typeof renderCharts === 'function') renderCharts(); }
  if (name === 'cycle') renderCycleList();
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// ── TODAY PAGE ──────────────────────────────────────────────────────────────
const todayDateEl  = document.getElementById('today-date');
const moodDesc     = document.getElementById('mood-desc');
const moodValueIn  = document.getElementById('mood-value');
const energySlider = document.getElementById('energy-slider');
const energyDisplay= document.getElementById('energy-display');
const isPeriodChk  = document.getElementById('is-period');
const flowRow      = document.getElementById('flow-row');
const reflectionTA = document.getElementById('reflection-text');
const gratitudeIn  = document.getElementById('gratitude-text');
const entryForm    = document.getElementById('entry-form');
const saveStatus   = document.getElementById('save-status');
const cycleBanner  = document.getElementById('cycle-banner');
const cycleBannerText = document.getElementById('cycle-banner-text');

let selectedMood = null;

todayDateEl.textContent = formatDate(todayKey());

// Mood buttons
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = parseInt(btn.dataset.value);
    moodValueIn.value = selectedMood;
    moodDesc.textContent = MOOD_LABELS[selectedMood] || '';
  });
});

// Energy slider
energySlider.addEventListener('input', () => {
  energyDisplay.textContent = energySlider.value;
});

// Period toggle
isPeriodChk.addEventListener('change', () => {
  flowRow.classList.toggle('hidden', !isPeriodChk.checked);
});

// Symptom chips (visual toggle)
document.querySelectorAll('.symptom-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('checked');
  });
  chip.querySelector('input').addEventListener('change', () => {
    chip.classList.toggle('checked', chip.querySelector('input').checked);
  });
});

// Flow chips
document.querySelectorAll('.flow-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.flow-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    chip.querySelector('input').checked = true;
  });
});

// Load today's existing entry
function loadTodayEntry() {
  const entries = loadEntries();
  const key = todayKey();
  const entry = entries[key];
  if (!entry) return;

  // Mood
  if (entry.mood) {
    const btn = document.querySelector(`.mood-btn[data-value="${entry.mood}"]`);
    if (btn) { btn.click(); }
  }

  // Energy
  if (entry.energy) {
    energySlider.value = entry.energy;
    energyDisplay.textContent = entry.energy;
  }

  // Symptoms
  ['emotional', 'physical'].forEach(type => {
    const arr = entry[type + 'Symptoms'] || [];
    arr.forEach(sym => {
      const input = document.querySelector(`input[value="${sym}"]`);
      if (input) {
        input.checked = true;
        input.closest('.symptom-chip').classList.add('checked');
      }
    });
  });

  // Period
  if (entry.isPeriodDay) {
    isPeriodChk.checked = true;
    flowRow.classList.remove('hidden');
    if (entry.flow) {
      const radio = document.querySelector(`input[name="flow"][value="${entry.flow}"]`);
      if (radio) { radio.checked = true; radio.closest('.flow-chip').classList.add('selected'); }
    }
  }

  // Text
  reflectionTA.value  = entry.notes || '';
  gratitudeIn.value   = entry.gratitude || '';

  saveStatus.textContent = 'Entry loaded from earlier today.';
  setTimeout(() => { saveStatus.textContent = ''; }, 3000);
}

// Cycle banner
function updateCycleBanner() {
  const cycles = loadCycles();
  if (!cycles.length) return;
  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const last = sorted[0];
  const today = todayKey();
  const daysSinceStart = daysBetween(last.startDate, today);

  // Estimate cycle day (approximate)
  const cycleDay = daysSinceStart + 1;

  let text = '';
  if (cycleDay >= 1 && cycleDay <= 5) {
    text = `Menstrual phase — Day ${cycleDay}. Rest and nourish yourself.`;
  } else if (cycleDay >= 6 && cycleDay <= 13) {
    text = `Follicular phase — Day ${cycleDay}. Energy often rises this week.`;
  } else if (cycleDay === 14) {
    text = `Ovulation — Day 14. Peak energy and clarity.`;
  } else if (cycleDay >= 15 && cycleDay <= 28) {
    text = `Luteal phase — Day ${cycleDay}. Watch for PMDD symptoms. Be kind to yourself.`;
  } else {
    text = `Day ${cycleDay} since last period. Consider logging a new cycle.`;
  }

  if (text) {
    cycleBanner.style.display = 'block';
    cycleBannerText.textContent = text;
  }
}

// Save entry
entryForm.addEventListener('submit', e => {
  e.preventDefault();

  const emotionalSymptoms = [...document.querySelectorAll('#emotional-symptoms input:checked')].map(i => i.value);
  const physicalSymptoms  = [...document.querySelectorAll('#physical-symptoms input:checked')].map(i => i.value);
  const flowSelected = document.querySelector('input[name="flow"]:checked');

  const entry = {
    date: todayKey(),
    mood: selectedMood || null,
    energy: parseInt(energySlider.value),
    emotionalSymptoms,
    physicalSymptoms,
    isPeriodDay: isPeriodChk.checked,
    flow: flowSelected ? flowSelected.value : null,
    notes: reflectionTA.value.trim(),
    gratitude: gratitudeIn.value.trim(),
    savedAt: new Date().toISOString(),
  };

  const entries = loadEntries();
  entries[todayKey()] = entry;
  saveEntries(entries);

  // Auto-add period day to cycles if checked
  if (entry.isPeriodDay) {
    autoUpdateCycleFromPeriodDay(todayKey());
  }

  saveStatus.textContent = 'Saved successfully!';
  setTimeout(() => { saveStatus.textContent = ''; }, 3000);
});

function autoUpdateCycleFromPeriodDay(dateStr) {
  const cycles = loadCycles();
  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const last = sorted[0];

  // If there's an open cycle (no end date) close to today, extend it
  if (last && !last.endDate && daysBetween(last.startDate, dateStr) <= 8) {
    last.endDate = dateStr;
    if (last.endDate < last.startDate) { last.endDate = last.startDate; }
    saveCycles(cycles.map(c => c === sorted[0] ? last : c));
    return;
  }

  // If there's a recent cycle (started within 2 days), don't add a duplicate
  if (last && daysBetween(last.startDate, dateStr) < 2) return;

  // Otherwise start a new cycle automatically
  cycles.push({ startDate: dateStr, endDate: null });
  saveCycles(cycles);
}

// ── CALENDAR PAGE ───────────────────────────────────────────────────────────
let calYear, calMonth;
const calGrid       = document.getElementById('calendar-grid');
const calMonthLabel = document.getElementById('cal-month-label');
const entryDetail   = document.getElementById('entry-detail');

{
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});
document.getElementById('close-detail').addEventListener('click', () => {
  entryDetail.classList.add('hidden');
});

function renderCalendar() {
  const entries = loadEntries();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = todayKey();

  const monthName = new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  calMonthLabel.textContent = monthName;

  calGrid.innerHTML = '';

  // Day headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-header';
    el.textContent = d;
    calGrid.appendChild(el);
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    calGrid.appendChild(el);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const entry = entries[key];
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = day;

    if (key === today) el.classList.add('today');

    if (entry) {
      el.classList.add('has-entry');
      if (entry.mood >= 7) el.classList.add('mood-great');
      else if (entry.mood >= 4) el.classList.add('mood-ok');
      else if (entry.mood >= 1) el.classList.add('mood-hard');

      if (entry.isPeriodDay) el.classList.add('period-day');

      el.addEventListener('click', () => showEntryDetail(key, entry));
    }

    calGrid.appendChild(el);
  }
}

function showEntryDetail(key, entry) {
  const el = entryDetail;
  document.getElementById('detail-date-title').textContent = formatDate(key);
  const content = document.getElementById('detail-content');

  let html = '';

  if (entry.mood) {
    html += `<div class="detail-row"><span class="detail-label">Mood</span><span>${entry.mood}/10 — ${MOOD_LABELS[entry.mood]}</span></div>`;
  }
  if (entry.energy) {
    html += `<div class="detail-row"><span class="detail-label">Energy</span><span>${entry.energy}/10</span></div>`;
  }
  if (entry.isPeriodDay) {
    html += `<div class="detail-row"><span class="detail-label">Period</span><span>Yes${entry.flow ? ' — ' + entry.flow : ''}</span></div>`;
  }

  const allSymptoms = [...(entry.emotionalSymptoms || []), ...(entry.physicalSymptoms || [])];
  if (allSymptoms.length) {
    html += `<div class="detail-row"><span class="detail-label">Symptoms</span><div class="detail-chips">${allSymptoms.map(s => `<span class="detail-chip">${labelSymptom(s)}</span>`).join('')}</div></div>`;
  }

  if (entry.notes) {
    html += `<div class="detail-row" style="flex-direction:column;gap:6px;"><span class="detail-label">Reflection</span><p class="detail-note">${entry.notes}</p></div>`;
  }
  if (entry.gratitude) {
    html += `<div class="detail-row"><span class="detail-label">Grateful</span><span>${entry.gratitude}</span></div>`;
  }

  content.innerHTML = html || '<p class="empty-state">No details recorded.</p>';
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── INSIGHTS PAGE ───────────────────────────────────────────────────────────
function renderStats() {
  const entries = loadEntries();
  const keys = Object.keys(entries).sort();
  const total = keys.length;

  document.getElementById('stat-entries').textContent = total;

  if (total > 0) {
    const moodVals = keys.map(k => entries[k].mood).filter(Boolean);
    const avg = moodVals.length ? (moodVals.reduce((a, b) => a + b, 0) / moodVals.length).toFixed(1) : '--';
    document.getElementById('stat-mood').textContent = avg;

    const periodDays = keys.filter(k => entries[k].isPeriodDay).length;
    document.getElementById('stat-period').textContent = periodDays;

    // Streak
    document.getElementById('stat-streak').textContent = calcStreak(keys) + ' days';
  }
}

function calcStreak(sortedKeys) {
  if (!sortedKeys.length) return 0;
  const today = todayKey();
  let streak = 0;
  let current = today;
  const set = new Set(sortedKeys);
  while (set.has(current)) {
    streak++;
    current = addDays(current, -1);
  }
  return streak;
}

// ── CYCLE PAGE ──────────────────────────────────────────────────────────────
document.getElementById('log-cycle-btn').addEventListener('click', () => {
  const start = document.getElementById('cycle-start').value;
  const end   = document.getElementById('cycle-end').value;
  const statusEl = document.getElementById('cycle-status');

  if (!start) { statusEl.textContent = 'Please enter a start date.'; statusEl.style.color = '#b91c1c'; return; }

  const cycles = loadCycles();
  cycles.push({ startDate: start, endDate: end || null });
  cycles.sort((a, b) => b.startDate.localeCompare(a.startDate));
  saveCycles(cycles);

  document.getElementById('cycle-start').value = '';
  document.getElementById('cycle-end').value   = '';

  statusEl.style.color = '';
  statusEl.textContent = 'Cycle saved!';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
  renderCycleList();
});

function renderCycleList() {
  const cycles = loadCycles();
  const listEl = document.getElementById('cycle-list');
  const statsCard = document.getElementById('cycle-stats-card');

  if (!cycles.length) {
    listEl.innerHTML = '<p class="empty-state">No cycles logged yet.</p>';
    statsCard.style.display = 'none';
    return;
  }

  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));

  listEl.innerHTML = sorted.map((cycle, i) => {
    const duration = cycle.endDate
      ? daysBetween(cycle.startDate, cycle.endDate) + 1 + ' days'
      : 'In progress';
    const label = formatDateShort(cycle.startDate) + (cycle.endDate ? ' — ' + formatDateShort(cycle.endDate) : ' — ongoing');
    return `
      <div class="cycle-item">
        <div>
          <div class="cycle-item-dates">${label}</div>
          <div class="cycle-item-meta">Duration: ${duration}</div>
        </div>
        <button class="cycle-delete" data-index="${i}" title="Delete">&#x2715;</button>
      </div>`;
  }).join('');

  listEl.querySelectorAll('.cycle-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteCycle(parseInt(btn.dataset.index), sorted));
  });

  // Stats
  if (sorted.length >= 2) {
    statsCard.style.display = 'block';
    const lengths = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      lengths.push(daysBetween(sorted[i + 1].startDate, sorted[i].startDate));
    }
    const avgLen = (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(0);
    const durations = sorted.filter(c => c.endDate).map(c => daysBetween(c.startDate, c.endDate) + 1);
    const avgDur = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : '--';

    document.getElementById('cycle-stats-grid').innerHTML = `
      <div class="cycle-stat"><div class="cycle-stat-label">Avg cycle length</div><div class="cycle-stat-value">${avgLen} days</div></div>
      <div class="cycle-stat"><div class="cycle-stat-label">Avg period duration</div><div class="cycle-stat-value">${avgDur} days</div></div>
      <div class="cycle-stat"><div class="cycle-stat-label">Cycles logged</div><div class="cycle-stat-value">${sorted.length}</div></div>
    `;
  } else {
    statsCard.style.display = 'none';
  }
}

function deleteCycle(index, sorted) {
  if (!confirm('Delete this cycle entry?')) return;
  const all = loadCycles();
  // Find the item by matching startDate
  const target = sorted[index];
  const idx = all.findIndex(c => c.startDate === target.startDate && c.endDate === target.endDate);
  if (idx !== -1) {
    all.splice(idx, 1);
    saveCycles(all);
    renderCycleList();
  }
}

// ── INIT ────────────────────────────────────────────────────────────────────
loadTodayEntry();
updateCycleBanner();
