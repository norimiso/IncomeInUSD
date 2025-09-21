import { Hono } from 'hono';
import { html } from 'hono/html';

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

const modernRates = ratesWithIndex.filter((item) => item.year >= 2000);
const legacyRates = ratesWithIndex.filter((item) => item.year < 2000);

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

app.get('/', (c) => {
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
            .table-wrapper {
              margin-bottom: 24px;
              overflow-x: auto;
            }
            .table-actions {
              display: flex;
              justify-content: flex-start;
              margin-bottom: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              overflow: hidden;
              border-radius: 12px;
            }
            thead {
              background: rgba(30, 41, 59, 0.8);
            }
            th,
            td {
              padding: 12px 16px;
              text-align: left;
              border-bottom: 1px solid rgba(148, 163, 184, 0.1);
            }
            tbody tr:nth-child(even) {
              background: rgba(30, 41, 59, 0.35);
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
            .footnote {
              margin-top: 16px;
              font-size: 12px;
              color: #94a3b8;
            }
            @media (max-width: 640px) {
              body {
                padding: 24px 12px 48px;
              }
              table,
              thead,
              tbody,
              th,
              td,
              tr {
                display: block;
              }
              thead {
                display: none;
              }
              tbody tr {
                margin-bottom: 16px;
                background: rgba(30, 41, 59, 0.5);
                border-radius: 12px;
              }
              tbody td {
                border: none;
                padding: 10px 14px;
              }
              tbody td:first-child {
                font-weight: 600;
              }
              input[type='number'] {
                margin-top: 8px;
              }
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js" defer></script>
          <script type="module" defer>
            const rates = ${JSON.stringify(
              ratesWithIndex.map((entry) => ({
                year: entry.year,
                rate: Number(entry.rate.toFixed(4)),
                index: entry.index,
              })),
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

            const dataset = rates.map(() => 0);
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
                      datasets: [
                        {
                          label: 'Annual income (USD)',
                          data: dataset,
                          backgroundColor: '#38bdf8',
                          borderRadius: 6,
                        },
                      ],
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
                        y: {
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

            const updateChart = () => {
              if (chart) {
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
                dataset[index] = 0;
                usdCell.textContent = '-';
                updateChart();
                return;
              }

              const yen = manYen * yenPerMan;
              const usd = yen / rate;
              dataset[index] = usd;
              usdCell.textContent = formatUsd(usd);
              updateChart();
            };

            document
              .querySelectorAll('input[data-year]')
              .forEach((input) => {
                input.addEventListener('input', handleInput);
              });

            const legacyButton = document.getElementById('showLegacyYears');
            const legacySection = document.getElementById('legacyYearSection');
            if (legacyButton instanceof HTMLButtonElement && legacySection) {
              legacyButton.addEventListener('click', () => {
                legacySection.hidden = false;
                legacyButton.setAttribute('aria-expanded', 'true');
                legacyButton.disabled = true;
                legacyButton.textContent = '1980〜1999年を表示中';
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
            <div class="table-wrapper">
              ${legacyRates.length
                ? html`<div class="table-actions">
                    <button
                      type="button"
                      id="showLegacyYears"
                      aria-expanded="false"
                      aria-controls="legacyYearSection"
                    >
                      1980〜1999年を追加
                    </button>
                  </div>`
                : null}
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>年収 (万円)</th>
                    <th>Annual income (USD)</th>
                  </tr>
                </thead>
                <tbody id="legacyYearSection" hidden>
                  ${legacyRates.map((entry) => renderRow(entry))}
                </tbody>
                <tbody>
                  ${modernRates.map((entry) => renderRow(entry))}
                </tbody>
              </table>
            </div>
            <div class="chart-wrapper">
              <canvas id="incomeChart" height="240"></canvas>
            </div>
            <p class="footnote">
              為替レートは提供データを元に不足年を前後のデータから補完しています。表示される値は簡易的な参考値です。
            </p>
          </main>
        </body>
      </html>`
  );
});

export default app;
