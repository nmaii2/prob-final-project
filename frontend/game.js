// ===============================
// Monte Carlo Gamble Game - game.js
// ===============================

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const fmtMoney = (x) =>
  Number(x).toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtPct = (v) => (v * 100).toFixed(1) + "%";


// ===============================
// DOM Elements
// ===============================

// Allocation sliders
const lowSlider = $("lowSlider");
const medSlider = $("medSlider");
const highSlider = $("highSlider");

// Slider labels
const lowLabel = $("lowLabel");
const medLabel = $("medLabel");
const highLabel = $("highLabel");

// Time horizon
const horizonSelect = $("horizonSelect");

// Main button
const gambleBtn = $("gambleBtn");

// Metrics
const expectedEl = $("expected");
const probLossEl = $("probLoss");
const probRuinEl = $("probRuin");
const var5El = $("var5");

// Status text
const statusEl = $("statusText");

// Custom risk inputs (μ and σ), in PERCENT
const muLowInput = $("muLowInput");
const sigmaLowInput = $("sigmaLowInput");
const muMedInput = $("muMedInput");
const sigmaMedInput = $("sigmaMedInput");
const muHighInput = $("muHighInput");
const sigmaHighInput = $("sigmaHighInput");


// ===============================
// Sound: start ambient on first click
// ===============================
document.addEventListener(
  "click",
  () => {
    if (window.SoundEngine && typeof SoundEngine.startAmbient === "function") {
      SoundEngine.startAmbient();
    }
  },
  { once: true }
);


// ===============================
// Slider label updates
// ===============================
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
[lowSlider, medSlider, highSlider].forEach((s) => {
  if (s) s.addEventListener("input", updateAllocationLabels);
});
updateAllocationLabels();


// ===============================
// Read normalized weights (0–1)
// ===============================
function readWeights() {
  const L = Number(lowSlider.value || 0);
  const M = Number(medSlider.value || 0);
  const H = Number(highSlider.value || 0);

  const total = L + M + H;

  if (total <= 0) {
    return { w_low: 1, w_med: 0, w_high: 0 };
  }

  return {
    w_low: L / total,
    w_med: M / total,
    w_high: H / total,
  };
}


// ===============================
// Read risk parameters (μ, σ) from inputs
// Inputs are in %, backend needs decimals
// ===============================
function readRiskParams() {
  // Fallback defaults (same as before)
  const defaultMuLow = 4.0;
  const defaultMuMed = 8.0;
  const defaultMuHigh = 14.0;

  const defaultSigmaLow = 6.0;
  const defaultSigmaMed = 15.0;
  const defaultSigmaHigh = 30.0;

  const mu_low_pct =
    parseFloat(muLowInput?.value) || defaultMuLow;
  const mu_med_pct =
    parseFloat(muMedInput?.value) || defaultMuMed;
  const mu_high_pct =
    parseFloat(muHighInput?.value) || defaultMuHigh;

  const sigma_low_pct =
    parseFloat(sigmaLowInput?.value) || defaultSigmaLow;
  const sigma_med_pct =
    parseFloat(sigmaMedInput?.value) || defaultSigmaMed;
  const sigma_high_pct =
    parseFloat(sigmaHighInput?.value) || defaultSigmaHigh;

  // Convert % → decimal
  return {
    mu_low: mu_low_pct / 100,
    mu_med: mu_med_pct / 100,
    mu_high: mu_high_pct / 100,
    sigma_low: sigma_low_pct / 100,
    sigma_med: sigma_med_pct / 100,
    sigma_high: sigma_high_pct / 100,
  };
}


// ===============================
// MAIN SIMULATION
// ===============================
async function runGamble() {
  if (window.SoundEngine && typeof SoundEngine.playGamble === "function") {
    SoundEngine.playGamble();
  }

  gambleBtn.disabled = true;
  const oldText = gambleBtn.textContent;
  gambleBtn.textContent = "Simulating...";

  if (statusEl) statusEl.textContent = "Running simulation...";

  try {
    const wealth = 10000;
    const weights = readWeights();
    const years = parseInt(horizonSelect.value, 10) || 1;
    const sims = 3000;

    // Read custom risk inputs
    const {
      mu_low,
      mu_med,
      mu_high,
      sigma_low,
      sigma_med,
      sigma_high,
    } = readRiskParams();

    const payload = {
      wealth,
      w_low: weights.w_low,
      w_med: weights.w_med,
      w_high: weights.w_high,

      mu_low,
      mu_med,
      mu_high,
      sigma_low,
      sigma_med,
      sigma_high,

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
      // sample_paths is array[20][years+1]
      drawTimeSeries(data.sample_paths, { years });
    }

    if (typeof drawHistogram === "function") {
      drawHistogram(data.final_wealth_samples);
    }

    // Reward sound if expected > starting wealth
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


// ===============================
// Button wiring
// ===============================
if (gambleBtn) {
  gambleBtn.addEventListener("click", runGamble);
}
