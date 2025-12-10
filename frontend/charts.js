/* =====================================================================
   CHART MANAGER — Monte Carlo Gamble Game
   Updated for:
   ✔ Unlimited time-series paths
   ✔ Clean finance-style charts
   ✔ Dynamic path colors
   ✔ Full support for custom user μ / σ
======================================================================== */

let timeSeriesChart = null;
let histChart = null;


/* ============================================================
   1) TIME-SERIES CHART — Flexible multi-path display
   ============================================================ */
function drawTimeSeries(paths, { years }) {
  const canvas = document.getElementById("timeSeriesChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (timeSeriesChart) timeSeriesChart.destroy();

  if (!paths || paths.length === 0) return;

  // Number of steps = number of columns - 1
  const steps = paths[0].length - 1;

  // Build X-axis: Day count
  const labels = Array.from({ length: steps + 1 }, (_, i) => i);

  // Color palette (loops automatically)
  const palette = [
    "#2563EB", "#3B82F6", "#60A5FA", "#1E40AF",
    "#0EA5E9", "#38BDF8", "#0284C7", "#7DD3FC",
    "#6366F1", "#A78BFA"
  ];

  const datasets = paths.map((path, i) => ({
    data: path,
    borderColor: palette[i % palette.length],
    borderWidth: 1.6,
    tension: 0.25,
    fill: false,
    pointRadius: 0
  }));

  timeSeriesChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      animation: { duration: 600 },

      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Simulated Portfolio Paths (${years} Year${years > 1 ? "s" : ""})`,
          color: "#111827",
          font: { size: 18, weight: "600", family: "Inter" }
        }
      },

      scales: {
        x: {
          title: {
            display: true,
            text: "Time (Days)",
            color: "#374151",
            font: { family: "Inter", weight: "500" }
          },
          ticks: { color: "#374151" },
          grid: { color: "rgba(0,0,0,0.05)" }
        },

        y: {
          title: {
            display: true,
            text: "Portfolio Value ($)",
            color: "#374151",
            font: { family: "Inter", weight: "500" }
          },
          ticks: { color: "#374151" },
          grid: { color: "rgba(0,0,0,0.06)" }
        }
      }
    }
  });
}



/* ============================================================
   2) HISTOGRAM CHART — Ending Wealth Distribution
   ============================================================ */
function drawHistogram(samples) {
  const canvas = document.getElementById("histChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (histChart) histChart.destroy();
  if (!samples || samples.length === 0) return;

  const bins = 30;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min || 1;
  const step = range / bins;

  const counts = Array(bins).fill(0);

  samples.forEach((v) => {
    let idx = Math.floor((v - min) / step);
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  });

  const labels = counts.map((_, i) => {
    const L = Math.round(min + i * step).toLocaleString();
    const R = Math.round(min + (i + 1) * step).toLocaleString();
    return `${L} – ${R}`;
  });

  histChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: "rgba(59, 130, 246, 0.35)",
          borderColor: "rgba(59, 130, 246, 0.9)",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 600 },

      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Distribution of Final Portfolio Values",
          color: "#111827",
          font: { size: 18, weight: "600", family: "Inter" }
        }
      },

      scales: {
        x: {
          ticks: { autoSkip: true, maxRotation: 0, color: "#374151" },
          grid: { color: "rgba(0,0,0,0.04)" },
          title: {
            display: true,
            text: "Final Wealth ($)",
            color: "#374151",
            font: { family: "Inter", weight: "500" }
          }
        },

        y: {
          ticks: { color: "#374151" },
          grid: { color: "rgba(0,0,0,0.04)" },
          title: {
            display: true,
            text: "Frequency",
            color: "#374151",
            font: { family: "Inter", weight: "500" }
          }
        }
      }
    }
  });
}



/* ============================================================
   EXPORTS
   ============================================================ */
window.drawTimeSeries = drawTimeSeries;
window.drawHistogram = drawHistogram;
