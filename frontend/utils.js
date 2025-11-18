/* ===================================================================
   utils.js — Shared Utility Functions for Monte Carlo Gamble Game
   Converted to global Utils object (browser safe, non-module)
   =================================================================== */

   window.Utils = (() => {

    /* ---------- DOM Shortcut ---------- */
    const $ = (id) => document.getElementById(id);
  
    /* ---------- FORMATTERS ---------- */
    function fmtPct(value) {
      if (isNaN(value)) return "—";
      return (value * 100).toFixed(1) + "%";
    }
  
    function fmtMoney(value) {
      if (isNaN(value)) return "—";
      return Number(value).toLocaleString(undefined, { 
        maximumFractionDigits: 2 
      });
    }
  
    /* ---------- ALLOCATION HELPERS ---------- */
    function readSliders(lowEl, medEl, highEl) {
      const l = Number(lowEl.value || 0);
      const m = Number(medEl.value || 0);
      const h = Number(highEl.value || 0);
  
      const total = l + m + h;
  
      if (total === 0) {
        return { w_low: 1, w_med: 0, w_high: 0 };
      }
  
      return {
        w_low: l / total,
        w_med: m / total,
        w_high: h / total
      };
    }
  
    function updateLabel(label, value) {
      label.textContent = `${parseInt(value, 10)}%`;
    }
  
    /* ---------- TIME HORIZON MAP ---------- */
    function getHorizonSteps(years) {
      return 252 * years; // trading days per year
    }
  
    /* ---------- RANDOM HELPERS ---------- */
    function randomChoice(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }
  
    function randomBool(prob = 0.5) {
      return Math.random() < prob;
    }
  
    /* ---------- SHOCK HELPERS ---------- */
    function computeShockLabel(summary) {
      if (!summary) return null;
  
      const c = summary.count_crash || 0;
      const b = summary.count_boom || 0;
  
      if (summary.applied_to_all) {
        if (c === summary.total_shocked) return "crash";
        if (b === summary.total_shocked) return "boom";
        return "mixed";
      }
  
      if (summary.auto_shock && summary.total_shocked > 0) {
        if (c > 0 && b === 0) return "crash";
        if (b > 0 && c === 0) return "boom";
        return "mixed";
      }
  
      return null;
    }
  
    /* ---------- SOUND HELPER ---------- */
    function playSoundIfEnabled(audioElement) {
      if (!audioElement) return;
      try { 
        audioElement.currentTime = 0;
        audioElement.play();
      } catch (err) {
        console.log("Sound blocked:", err);
      }
    }
  
    /* ---------- MATH UTILITIES ---------- */
    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }
  
    function avg(arr) {
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
  
    function percentile(arr, p) {
      if (!arr || arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.floor((p / 100) * sorted.length);
      return sorted[idx];
    }
  
    /* ---------- EXPOSE PUBLIC API ---------- */
    return {
      $, fmtPct, fmtMoney,
      readSliders, updateLabel,
      getHorizonSteps,
      randomChoice, randomBool,
      computeShockLabel,
      playSoundIfEnabled,
      clamp, avg, percentile
    };
  
  })();
  