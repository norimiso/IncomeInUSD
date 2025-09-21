import { Hono } from 'hono';
import { html } from 'hono/html';

type Env = {
  SITE_TITLE: string;
};

const exchangeRates = [
  { year: 1980, rate: 226.7408 },
  { year: 1981, rate: 220.5358 },
  { year: 1982, rate: 249.0767 },
  { year: 1983, rate: 237.5117 },
  { year: 1984, rate: 237.5225 },
  { year: 1985, rate: 238.5358 },
  { year: 1990, rate: 144.7925 },
  { year: 1991, rate: 134.7067 },
  { year: 1992, rate: 126.6513 },
  { year: 1993, rate: 111.1978 },
  { year: 1994, rate: 102.2078 },
  { year: 1995, rate: 94.0596 },
  { year: 2000, rate: 107.7655 },
  { year: 2001, rate: 121.5289 },
  { year: 2002, rate: 125.388 },
  { year: 2003, rate: 115.9335 },
  { year: 2004, rate: 108.1926 },
  { year: 2005, rate: 110.2182 },
  { year: 2010, rate: 87.7799 },
  { year: 2011, rate: 79.807 },
  { year: 2012, rate: 79.7905 },
  { year: 2013, rate: 97.5957 },
  { year: 2014, rate: 105.9448 },
  { year: 2015, rate: 121.044 },
  { year: 2020, rate: 106.7746 },
  { year: 2021, rate: 109.7543 },
  { year: 2022, rate: 131.4981 },
  { year: 2023, rate: 140.4911 },
  { year: 2024, rate: 151.3663 },
  { year: 2025, rate: 148.2193 },
] as const;

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
            rel="preconnect"
            href="https://fonts.googleapis.com"
          />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossorigin
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
            rel="stylesheet"
          />
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
              width: min(960px, 100%);
              background: rgba(15, 23, 42, 0.85);
              backdrop-filter: blur(10px);
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              overflow: hidden;
              border-radius: 12px;
            }
            .table-wrapper {
              margin-bottom: 24px;
              overflow-x: auto;
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
              background: rgba(30, 41, 59, 0.4);
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
            const rates = ${JSON.stringify(exchangeRates)};

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

            const ctx = document.getElementById('incomeChart');
            let chart;

            const ensureChart = () => {
              if (chart) return chart;
              chart = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: rates.map((item) => item.year),
                  datasets: [
                    {
                      label: 'Annual income (USD)',
                      data: dataset,
                      backgroundColor: '#38bdf8',
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
              });
              return chart;
            };

            const handleInput = (event) => {
              const input = event.target;
              const year = Number(input.dataset.year);
              const rate = Number(input.dataset.rate);
              const rowIndex = rates.findIndex((item) => item.year === year);
              const usdCell = document.querySelector(
                '[data-usd="' + year + '"]'
              );

              if (rowIndex === -1 || !usdCell) {
                return;
              }

              const manYen = Number.parseFloat(input.value);
              if (!Number.isFinite(manYen) || manYen <= 0) {
                dataset[rowIndex] = 0;
                usdCell.textContent = '-';
                ensureChart().update();
                return;
              }

              const yen = manYen * yenPerMan;
              const usd = yen / rate;
              dataset[rowIndex] = usd;
              usdCell.textContent = formatUsd(usd);
              ensureChart().update();
            };

            const inputs = Array.from(
              document.querySelectorAll('input[data-year]')
            );
            inputs.forEach((input) => {
              input.addEventListener('input', handleInput);
            });

            ensureChart();
          </script>
        </head>
        <body>
          <main class="card">
            <h1>${title}</h1>
            <p>
              1980年から2025年の年収を万円単位で入力すると、当時の平均為替レートでUSD換算した金額と棒グラフを自動で表示します。
            </p>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>年収 (万円)</th>
                    <th>Annual income (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  ${exchangeRates.map(
                    (entry) => html`<tr>
                        <td>${entry.year}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            inputmode="decimal"
                            placeholder="0"
                            aria-label="${entry.year}年の年収 (万円)"
                            data-year="${entry.year}"
                            data-rate="${entry.rate}"
                          />
                        </td>
                        <td class="usd-value" data-usd="${entry.year}">-</td>
                      </tr>`
                  )}
                </tbody>
              </table>
            </div>
            <div class="chart-wrapper">
              <canvas id="incomeChart" height="220"></canvas>
            </div>
            <p class="footnote">
              為替レートは各年の平均USD/JPYレートを使用しています。数値は提供データに基づき、実際のレートとは異なる場合があります。
            </p>
          </main>
        </body>
      </html>`
  );
});

export default app;
