import { Hono } from 'hono';
import { html, raw } from 'hono/html';

type Env = {
  SITE_TITLE: string;
};

type RateEntry = {
  year: number;
  rate: number;
};

const rawRates: readonly RateEntry[] = [
  { year: 1980, rate: 226.7408 },
  { year: 1981, rate: 220.5358 },
  { year: 1982, rate: 249.0767 },
  { year: 1983, rate: 237.5117 },
  { year: 1984, rate: 237.5225 },
  { year: 1985, rate: 238.5358 },
  { year: 1987, rate: 144.6375 },
  { year: 1988, rate: 128.1517 },
  { year: 1989, rate: 137.9644 },
  { year: 1990, rate: 144.7925 },
  { year: 1991, rate: 134.7067 },
  { year: 1992, rate: 126.6513 },
  { year: 1993, rate: 111.1978 },
  { year: 1994, rate: 102.2078 },
  { year: 1995, rate: 94.0596 },
  { year: 1997, rate: 120.9909 },
  { year: 1998, rate: 130.9053 },
  { year: 1999, rate: 113.9068 },
  { year: 2000, rate: 107.7655 },
  { year: 2001, rate: 121.5289 },
  { year: 2002, rate: 125.388 },
  { year: 2003, rate: 115.9335 },
  { year: 2004, rate: 108.1926 },
  { year: 2005, rate: 110.2182 },
  { year: 2006, rate: 116.2993 },
  { year: 2007, rate: 117.7535 },
  { year: 2008, rate: 103.3595 },
  { year: 2009, rate: 93.5701 },
  { year: 2010, rate: 87.7799 },
  { year: 2011, rate: 79.807 },
  { year: 2012, rate: 79.7905 },
  { year: 2013, rate: 97.5957 },
  { year: 2014, rate: 105.9448 },
  { year: 2015, rate: 121.044 },
  { year: 2016, rate: 108.7929 },
  { year: 2017, rate: 112.1661 },
  { year: 2018, rate: 110.4232 },
  { year: 2019, rate: 109.0097 },
  { year: 2020, rate: 106.7746 },
  { year: 2021, rate: 109.7543 },
  { year: 2022, rate: 131.4981 },
  { year: 2023, rate: 140.4911 },
  { year: 2024, rate: 151.3663 },
  { year: 2025, rate: 148.2193 },
] as const;

const START_YEAR = 1980;
const END_YEAR = 2025;

const createExpandedRates = (
  entries: readonly RateEntry[],
  startYear: number,
  endYear: number,
): RateEntry[] => {
  const sorted = [...entries].sort((a, b) => a.year - b.year);
  const map = new Map(sorted.map((item) => [item.year, item.rate]));
  const span = endYear - startYear + 1;

  const previous: Array<RateEntry | null> = new Array(span).fill(null);
  let lastKnown: RateEntry | null = null;
  for (let year = startYear; year <= endYear; year++) {
    const maybeRate = map.get(year);
    if (maybeRate !== undefined) {
      lastKnown = { year, rate: maybeRate };
    }
    previous[year - startYear] = lastKnown;
  }

  const upcoming: Array<RateEntry | null> = new Array(span).fill(null);
  let nextKnown: RateEntry | null = null;
  for (let year = endYear; year >= startYear; year--) {
    const maybeRate = map.get(year);
    if (maybeRate !== undefined) {
      nextKnown = { year, rate: maybeRate };
    }
    upcoming[year - startYear] = nextKnown;
  }

  const expanded: RateEntry[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const direct = map.get(year);
    if (direct !== undefined) {
      expanded.push({ year, rate: Number(direct.toFixed(4)) });
      continue;
    }

    const prev = previous[year - startYear];
    const next = upcoming[year - startYear];

    let rate: number;
    if (prev && next && prev.year !== next.year) {
      const spanYears = next.year - prev.year;
      const offset = year - prev.year;
      rate = prev.rate + ((next.rate - prev.rate) * offset) / spanYears;
    } else if (prev) {
      rate = prev.rate;
    } else if (next) {
      rate = next.rate;
    } else {
      rate = 0;
    }

    expanded.push({ year, rate: Number(rate.toFixed(4)) });
  }

  return expanded.sort((a, b) => a.year - b.year);
};

const expandedRates = createExpandedRates(rawRates, START_YEAR, END_YEAR);

type RateWithIndex = RateEntry & { index: number };

const ratesWithIndex: RateWithIndex[] = expandedRates.map((entry, index) => ({
  ...entry,
  index,
}));

type RateGroup = {
  id: string;
  label: string;
  start: number;
  end: number;
  defaultOpen?: boolean;
};

const rateGroups: readonly RateGroup[] = [
  { id: '1980-1984', label: '1980〜1984', start: 1980, end: 1984 },
  { id: '1985-1989', label: '1985〜1989', start: 1985, end: 1989 },
  { id: '1990-1994', label: '1990〜1994', start: 1990, end: 1994 },
  { id: '1995-1999', label: '1995〜1999', start: 1995, end: 1999 },
  { id: '2000-2004', label: '2000〜2004', start: 2000, end: 2004 },
  { id: '2005-2009', label: '2005〜2009', start: 2005, end: 2009 },
  { id: '2010-2014', label: '2010〜2014', start: 2010, end: 2014 },
  { id: '2015-2019', label: '2015〜2019', start: 2015, end: 2019, defaultOpen: true },
  { id: '2020-2024', label: '2020〜2024', start: 2020, end: 2024, defaultOpen: true },
  { id: '2025', label: '2025', start: 2025, end: 2025, defaultOpen: true },
];

const faviconSvg = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0f172a"/><text x="50%" y="58%" font-size="40" text-anchor="middle" fill="#38bdf8" font-family="Inter, sans-serif">$</text></svg>',
);

const renderRow = (entry: RateWithIndex) => html`<tr data-year="${entry.year}">
    <td>${entry.year}</td>
    <td>
      <input
        type="number"
        min="0"
        inputmode="decimal"
        placeholder="0"
        aria-label="${entry.year}年の年収 (万円)"
        data-year="${entry.year}"
        data-rate="${entry.rate.toFixed(4)}"
        data-index="${entry.index}"
      />
    </td>
    <td class="usd-value" data-role="usd" data-index="${entry.index}" aria-live="polite">-</td>
  </tr>`;

const app = new Hono<{ Bindings: Env }>();

app.get('*', (c) => {
  const title = c.env?.SITE_TITLE ?? 'Income in USD';

  return c.html(
    html`<!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${title}</title>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
          />
          <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${faviconSvg}" />
          <style>
            :root {
              color-scheme: light dark;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #0f172a;
              color: #f8fafc;
              min-height: 100vh;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding: 32px 16px 64px;
            }
            .card {
              width: min(980px, 100%);
              background: rgba(15, 23, 42, 0.85);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(148, 163, 184, 0.2);
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 30px 60px rgba(15, 23, 42, 0.45);
            }
            h1 {
              margin: 0 0 16px;
              font-size: clamp(24px, 4vw, 32px);
            }
            p {
              margin: 0 0 24px;
              line-height: 1.6;
              color: #cbd5f5;
            }
            .table-groups {
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-bottom: 24px;
            }
            .year-group {
              border: 1px solid rgba(148, 163, 184, 0.25);
              border-radius: 12px;
              background: rgba(30, 41, 59, 0.45);
              overflow: hidden;
            }
            .year-group[open] {
              background: rgba(30, 41, 59, 0.55);
            }
            .year-group summary {
              cursor: pointer;
              padding: 14px 18px;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
            }
            .year-group summary::-webkit-details-marker {
              display: none;
            }
            .year-group summary::after {
              content: '\u25BE';
              font-size: 12px;
              transition: transform 0.2s ease;
            }
            .year-group[open] summary::after {
              transform: rotate(-180deg);
            }
            .year-group__content {
              padding: 0 18px 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              overflow: hidden;
              border-radius: 8px;
            }
            thead {
              background: rgba(30, 41, 59, 0.75);
            }
            th,
            td {
              padding: 10px 16px;
              text-align: left;
              border-bottom: 1px solid rgba(148, 163, 184, 0.12);
            }
            tbody tr:nth-child(even) {
              background: rgba(15, 23, 42, 0.25);
            }
            input[type='number'] {
              width: 100%;
              padding: 8px 10px;
              border-radius: 8px;
              border: 1px solid rgba(148, 163, 184, 0.4);
              background: rgba(15, 23, 42, 0.6);
              color: inherit;
              font-size: 14px;
            }
            input[type='number']:focus {
              outline: none;
              border-color: #38bdf8;
              box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
            }
            button {
              font-family: inherit;
              font-size: 14px;
              font-weight: 600;
              color: #0f172a;
              background: #38bdf8;
              border: none;
              border-radius: 999px;
              padding: 10px 18px;
              cursor: pointer;
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            button:hover {
              transform: translateY(-1px);
              box-shadow: 0 8px 20px rgba(56, 189, 248, 0.35);
            }
            button:focus-visible {
              outline: 2px solid #f8fafc;
              outline-offset: 2px;
            }
            button:disabled {
              opacity: 0.65;
              cursor: default;
              box-shadow: none;
              transform: none;
            }
            #legacyYearSection[hidden] {
              display: none;
            }
            .usd-value {
              font-variant-numeric: tabular-nums;
              font-feature-settings: 'tnum';
              font-size: 14px;
            }
            .chart-wrapper {
              background: rgba(15, 23, 42, 0.6);
              border: 1px solid rgba(148, 163, 184, 0.2);
              border-radius: 12px;
              padding: 16px;
            }
            .chart-toolbar {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 8px;
              font-size: 13px;
              color: #cbd5f5;
            }
            .chart-toolbar__group {
              display: inline-flex;
              align-items: center;
              gap: 12px;
            }
            .chart-toggle {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              cursor: pointer;
            }
            .chart-toggle input,
            #toggleYAxis {
              accent-color: #38bdf8;
            }
            .chart-toolbar__divider {
              width: 1px;
              height: 18px;
              background: rgba(148, 163, 184, 0.35);
            }
            .footnote {
              margin-top: 16px;
              font-size: 12px;
              color: #94a3b8;
            }
            @media (max-width: 640px) {
              body {
                padding: 24px 12px 48px;
              }
              input[type='number'] {
                margin-top: 8px;
              }
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js" defer></script>
          <script type="module" defer>
            const rates = ${raw(
              JSON.stringify(
                ratesWithIndex.map((entry) => ({
                  year: entry.year,
                  rate: Number(entry.rate.toFixed(4)),
                  index: entry.index,
                })),
              ),
            )};

            const yenPerMan = 10000;

            const formatUsd = (value) => {
              if (!Number.isFinite(value) || value <= 0) {
                return '-';
              }
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              }).format(value);
            };

            const datasetUsd = rates.map(() => 0);
            const datasetJpy = rates.map(() => 0);
            const usdCells = new Map();
            document.querySelectorAll('[data-role="usd"]').forEach((cell) => {
              const index = Number(cell.dataset.index);
              if (!Number.isNaN(index)) {
                usdCells.set(index, cell);
              }
            });

            const ctx = document.getElementById('incomeChart');
            const chart =
              ctx instanceof HTMLCanvasElement
                ? new Chart(ctx, {
                    type: 'bar',
                    data: {
                      labels: rates.map((item) => item.year),
                      datasets: [],
                    },
                    options: {
                      responsive: true,
                      animation: false,
                      scales: {
                        x: {
                          ticks: {
                            color: '#cbd5f5',
                            autoSkip: true,
                            maxRotation: 0,
                          },
                          grid: {
                            display: false,
                          },
                        },
                        yUSD: {
                          beginAtZero: true,
                          ticks: {
                            color: '#cbd5f5',
                            callback: (value) =>
                              new Intl.NumberFormat('en-US', {
                                notation: 'compact',
                                maximumFractionDigits: 1,
                              }).format(value),
                          },
                          grid: {
                            color: 'rgba(148, 163, 184, 0.2)',
                          },
                          position: 'left',
                          title: {
                            display: true,
                            text: 'USD',
                            color: '#cbd5f5',
                          },
                        },
                        yJPY: {
                          beginAtZero: true,
                          position: 'right',
                          ticks: {
                            color: '#fbbf24',
                            callback: (value) =>
                              new Intl.NumberFormat('ja-JP', {
                                notation: 'compact',
                                maximumFractionDigits: 1,
                              }).format(value),
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                          title: {
                            display: true,
                            text: 'JPY',
                            color: '#fbbf24',
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          labels: {
                            color: '#e2e8f0',
                          },
                        },
                      },
                    },
                  })
                : null;

            const state = {
              showUsd: true,
              showJpy: false,
              axisHidden: false,
            };

            const refreshChartData = () => {
              if (!chart) {
                return;
              }

              let startIndex = datasetUsd.findIndex(
                (value, index) => value > 0 || datasetJpy[index] > 0,
              );
              if (startIndex === -1) {
                startIndex = 0;
              }

              const labels = rates.slice(startIndex).map((item) => item.year);
              chart.data.labels = labels;

              const datasets = [];
              if (state.showUsd) {
                datasets.push({
                  label: 'Annual income (USD)',
                  data: datasetUsd.slice(startIndex),
                  backgroundColor: '#38bdf8',
                  borderRadius: 6,
                  yAxisID: 'yUSD',
                });
              }
              if (state.showJpy) {
                datasets.push({
                  label: '年収 (JPY)',
                  data: datasetJpy.slice(startIndex),
                  backgroundColor: '#f97316',
                  borderRadius: 6,
                  yAxisID: 'yJPY',
                });
              }

              chart.data.datasets = datasets;

              chart.options.scales.yUSD.display = state.showUsd && !state.axisHidden;
              chart.options.scales.yUSD.ticks.display = !state.axisHidden && state.showUsd;
              chart.options.scales.yUSD.grid.display = !state.axisHidden && state.showUsd;
              chart.options.scales.yUSD.title.display = state.showUsd && !state.axisHidden;

              chart.options.scales.yJPY.display = state.showJpy && !state.axisHidden;
              chart.options.scales.yJPY.ticks.display = !state.axisHidden && state.showJpy;
              chart.options.scales.yJPY.title.display = state.showJpy && !state.axisHidden;
              chart.options.scales.yJPY.grid.display = false;
            };

            const updateChart = () => {
              if (chart) {
                refreshChartData();
                chart.update('none');
              }
            };

            const handleInput = (event) => {
              const input = event.target;
              if (!(input instanceof HTMLInputElement)) {
                return;
              }

              const index = Number(input.dataset.index);
              const rate = Number(input.dataset.rate);
              const usdCell = usdCells.get(index);

              if (!Number.isFinite(index) || !Number.isFinite(rate) || !usdCell) {
                return;
              }

              const manYen = Number.parseFloat(input.value);
              if (!Number.isFinite(manYen) || manYen <= 0) {
                datasetUsd[index] = 0;
                datasetJpy[index] = 0;
                usdCell.textContent = '-';
                updateChart();
                return;
              }

              const yen = manYen * yenPerMan;
              const usd = yen / rate;
              datasetUsd[index] = usd;
              datasetJpy[index] = yen;
              usdCell.textContent = formatUsd(usd);
              updateChart();
            };

            document.querySelectorAll('input[data-year]').forEach((input) => {
              input.addEventListener('input', handleInput);
            });

            refreshChartData();
            if (chart) {
              chart.update();
            }

            const axisToggle = document.getElementById('toggleYAxis');
            if (axisToggle instanceof HTMLInputElement && chart) {
              axisToggle.addEventListener('change', () => {
                const hidden = axisToggle.checked;
                state.axisHidden = hidden;
                updateChart();
              });
            }

            const usdToggle = document.getElementById('toggleUsd');
            if (usdToggle instanceof HTMLInputElement) {
              state.showUsd = usdToggle.checked;
              usdToggle.addEventListener('change', () => {
                state.showUsd = usdToggle.checked;
                if (!state.showUsd && !state.showJpy) {
                  state.showJpy = true;
                  const toggle = document.getElementById('toggleJpy');
                  if (toggle instanceof HTMLInputElement) {
                    toggle.checked = true;
                  }
                }
                updateChart();
              });
            }

            const jpyToggle = document.getElementById('toggleJpy');
            if (jpyToggle instanceof HTMLInputElement) {
              state.showJpy = jpyToggle.checked;
              jpyToggle.addEventListener('change', () => {
                state.showJpy = jpyToggle.checked;
                if (!state.showUsd && !state.showJpy) {
                  state.showUsd = true;
                  const toggle = document.getElementById('toggleUsd');
                  if (toggle instanceof HTMLInputElement) {
                    toggle.checked = true;
                  }
                }
                updateChart();
              });
            }
          </script>
        </head>
        <body>
          <main class="card">
            <h1>${title}</h1>
            <p>
              1980年から2025年の年収を万円単位で入力すると、当時の平均為替レートでUSD換算した金額と棒グラフを自動で表示します。入力した年のみ棒グラフに反映されます。
            </p>
            <div class="table-groups">
              ${rateGroups
                .map((group) => {
                  const groupRates = ratesWithIndex.filter(
                    (item) => item.year >= group.start && item.year <= group.end,
                  );
                  if (groupRates.length === 0) {
                    return null;
                  }
                  return html`<details
                    class="year-group"
                    data-group="${group.id}"
                    ${group.defaultOpen ? 'open' : ''}
                  >
                    <summary>${group.label}</summary>
                    <div class="year-group__content">
                      <table>
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>年収 (万円)</th>
                            <th>Annual income (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${groupRates.map((entry) => renderRow(entry))}
                        </tbody>
                      </table>
                    </div>
                  </details>`;
                })
                .filter(Boolean)}
            </div>
            <div class="chart-wrapper">
              <div class="chart-toolbar">
                <div class="chart-toolbar__group">
                  <label class="chart-toggle">
                    <input type="checkbox" id="toggleUsd" checked />
                    USD (換算)
                  </label>
                  <label class="chart-toggle">
                    <input type="checkbox" id="toggleJpy" />
                    円 (入力値)
                  </label>
                </div>
                <div class="chart-toolbar__group">
                  <div class="chart-toolbar__divider" aria-hidden="true"></div>
                  <label class="chart-toggle">
                    <input type="checkbox" id="toggleYAxis" />
                    縦軸を非表示
                  </label>
                </div>
              </div>
              <canvas id="incomeChart" height="240"></canvas>
            </div>
            <p class="footnote">
              為替レートは提供データを元に不足年を前後のデータから補完しています。表示される値は簡易的な参考値です。入力内容は保存されず、外部へ送信されません。
            </p>
          </main>
        </body>
      </html>`
  );
});

export default app;
