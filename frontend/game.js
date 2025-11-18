// ===============================
// Monte Carlo Gamble Game - game.js
// ===============================

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const fmtMoney = (x) =>
  Number(x).toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtPct = (v) => (v * 100).toFixed(1) + "%";

// ---------- DOM Elements ----------
const lowSlider = $("lowSlider");
const medSlider = $("medSlider");
const highSlider = $("highSlider");

const lowLabel = $("lowLabel");
const medLabel = $("medLabel");
const highLabel = $("highLabel");

const horizonSelect = $("horizonSelect");
const gambleBtn = $("gambleBtn");

// Metrics
const expectedEl = $("expected");
const probLossEl = $("probLoss");
const probRuinEl = $("probRuin");
const var5El = $("var5");

const statusEl = $("statusText"); // optional


// ------------------------------------------------------
// Start background music only after *first user interaction*
// ------------------------------------------------------
document.addEventListener(
  "click",
  () => {
    if (window.SoundEngine) {
      SoundEngine.startBackground();
    }
  },
  { once: true }
);


// ------------------------------------------------------
// Update slider labels as normalized %
// ------------------------------------------------------
function updateAllocationLabels() {
  const L = Number(lowSlider.value || 0);
  const M = Number(medSlider.value || 0);
  const H = Number(highSlider.value || 0);

  const total = L + M + H || 1;

  lowLabel.textContent = `${((L / total) * 100).toFixed(0)}%`;
  medLabel.textContent = `${((M / total) * 100).toFixed(0)}%`;
  highLabel.textContent = `${((H / total) * 100).toFixed(0)}%`;
}

// Init labels + events
[lowSlider, medSlider, highSlider].forEach((s) =>
  s.addEventListener("input", updateAllocationLabels)
);
updateAllocationLabels();


// ------------------------------------------------------
// Read normalized weights
// ------------------------------------------------------
function readWeights() {
  const L = Number(lowSlider.value || 0);
  const M = Number(medSlider.value || 0);
  const H = Number(highSlider.value || 0);

  const total = L + M + H;

  if (total <= 0) return { w_low: 1, w_med: 0, w_high: 0 };

  return {
    w_low: L / total,
    w_med: M / total,
    w_high: H / total,
  };
}


// ------------------------------------------------------
// MAIN SIMULATION
// ------------------------------------------------------
async function runGamble() {
  if (window.SoundEngine) SoundEngine.playGamble();

  gambleBtn.disabled = true;
  const oldText = gambleBtn.textContent;
  gambleBtn.textContent = "Simulating...";

  if (statusEl) statusEl.textContent = "Running simulation...";

  try {
    const wealth = 10000;
    const weights = readWeights();

    const years = parseInt(horizonSelect.value, 10);
    const sims = 3000;

    // must match backend defaults
    const payload = {
      wealth,
      w_low: weights.w_low,
      w_med: weights.w_med,
      w_high: weights.w_high,

      mu_low: 0.04,
      mu_med: 0.08,
      mu_high: 0.14,

      sigma_low: 0.06,
      sigma_med: 0.15,
      sigma_high: 0.30,

      years,
      sims,

      auto_shock: true,
      shock_prob: 0.05,
      shock: null,
    };

    const res = await fetch("http://127.0.0.1:5001/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Simulation failed (${res.status})`);
    }

    const data = await res.json();

    // ----- Update metrics -----
    expectedEl.textContent = "$" + fmtMoney(data.expected);
    probLossEl.textContent = fmtPct(data.prob_loss);
    probRuinEl.textContent = fmtPct(data.prob_ruin);
    var5El.textContent = "$" + fmtMoney(data.VaR_5);

    // ----- Charts -----
    if (typeof drawTimeSeries === "function") {
      drawTimeSeries(data.sample_paths, { years });
    }

    if (typeof drawHistogram === "function") {
      drawHistogram(data.final_wealth_samples);
    }

    // reward sound if profit
    if (window.SoundEngine && data.expected > wealth) {
      SoundEngine.playReward();
    }

    if (statusEl) statusEl.textContent = "Done! Charts updated.";

  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = "Error: " + err.message;
  } finally {
    gambleBtn.disabled = false;
    gambleBtn.textContent = oldText;
  }
}


// ------------------------------------------------------
// Button wiring
// ------------------------------------------------------
gambleBtn.addEventListener("click", runGamble);

