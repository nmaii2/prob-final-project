/* =====================================================================
   CHART MANAGER — Monte Carlo Gamble Game
   Clean Finance UI — soft colors, readable text, modern styling
   Handles:
   ✔ Time-Series Chart (20 GBM sample paths)
   ✔ Histogram Chart (ending wealth distribution)
======================================================================== */

let timeSeriesChart = null;
let histChart = null;


/* ============================================================
   1) TIME-SERIES CHART
   ============================================================ */
function drawTimeSeries(paths, { years }) {
  const ctx = document.getElementById("timeSeriesChart").getContext("2d");

  if (timeSeriesChart) timeSeriesChart.destroy();

  if (!paths || paths.length === 0) return;

  // Build X-axis labels based on number of steps returned from backend
  const steps = paths[0].length - 1;
  const labels = Array.from({ length: steps + 1 }, (_, i) => i);

  // Use soft blue/gray palette
  const colors = [
    "#3B82F6", "#60A5FA", "#93C5FD", "#2563EB",
    "#0EA5E9", "#38BDF8", "#7DD3FC", "#0284C7"
  ];

  const datasets = paths.map((path, i) => ({
    data: path,
    borderColor: colors[i % colors.length],
    borderWidth: 1.5,
    fill: false,
    tension: 0.25,
    pointRadius: 0
  }));

  timeSeriesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      animation: { duration: 800 },
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
            text: "Time (days)",
            color: "#374151",
            font: { family: "Inter", weight: "500" }
          },
          grid: { color: "rgba(0,0,0,0.05)" },
          ticks: { color: "#374151" }
        },
        y: {
          title: {
            display: true,
            text: "Portfolio Value ($)",
            color: "#374151",
            font: { family: "Inter", weight: "500" }
          },
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: { color: "#374151" }
        }
      }
    }
  });
}



/* ============================================================
   2) HISTOGRAM CHART
   ============================================================ */
function drawHistogram(samples) {
  const ctx = document.getElementById("histChart").getContext("2d");

  if (histChart) histChart.destroy();
  if (!samples || samples.length === 0) return;

  const bins = 30;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min || 1;
  const step = range / bins;

  const counts = Array(bins).fill(0);

  samples.forEach(v => {
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
          label: "",
          data: counts,
          backgroundColor: "rgba(59, 130, 246, 0.35)",  // soft blue
          borderColor: "rgba(59, 130, 246, 0.9)",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 700 },
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
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            color: "#374151"
          },
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
