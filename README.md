# PMDD Journal

A private, browser-based daily journal for tracking PMDD (Premenstrual Dysphoric Disorder) symptoms, mood, energy, and menstrual cycles — with no accounts, no servers, and no data leaving your device.

## Features

- **Daily Check-in** — Log mood (1–10), energy level, emotional and physical symptoms, period status and flow intensity, a free-write reflection, and a gratitude note
- **Calendar View** — See all logged days color-coded by mood at a glance; click any day to view its full entry
- **Insights** — Stats on total entries, average mood, current logging streak, and period days logged; charts for mood over time, energy over time, and most frequent symptoms
- **Cycle Tracker** — Log menstrual cycle start/end dates, view cycle history, and see average cycle length and period duration; includes a visual luteal phase guide
- **Cycle phase banner** — Shows your estimated current cycle phase (menstrual, follicular, ovulation, or luteal) on the Today page based on your last logged cycle

## How to use

No installation required. Just open `index.html` in any modern browser.

```
open index.html
```

All data is stored locally in your browser's `localStorage`. Nothing is sent to any server.

## File structure

```
pmdd-journal/
├── index.html   # App shell and all page markup
├── app.js       # Core logic: data storage, navigation, form handling
├── charts.js    # Chart.js visualizations (mood, energy, symptom frequency)
└── styles.css   # All styles
```

## Data & privacy

All journal entries and cycle data are stored exclusively in your browser's `localStorage` under the keys `pmdd_entries` and `pmdd_cycles`. Clearing your browser data will erase your journal. To back up your data, open the browser console and run:

```js
JSON.stringify(localStorage.getItem('pmdd_entries'))
```

## Dependencies

- [Chart.js v4.4.0](https://www.chartjs.org/) — loaded via CDN for the Insights charts
