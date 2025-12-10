"""
Configuration file for Monte Carlo Gamble Game.

Defines defaults for:
- Portfolio parameters (drift & volatility)
- Shock system
- Simulation settings
- Time horizons
"""

# ============================================================
# Initial Wealth
# ============================================================
INITIAL_WEALTH = 10000.0


# ============================================================
# Model Parameters — Expected Annual Returns (μ)
# These are the *baseline* drifts used when the user does not
# override them from the frontend.
# ============================================================
MU_LOW = 0.04       # Low-risk asset (e.g. defensive / stable)
MU_MED = 0.08       # Medium-risk asset (balanced growth)
MU_HIGH = 0.14      # High-risk asset (aggressive growth)


# ============================================================
# Model Parameters — Annual Volatilities (σ)
# Baseline vol levels. The frontend can scale these up/down
# if the user chooses "more risk" or "less risk".
# ============================================================
SIGMA_LOW = 0.06
SIGMA_MED = 0.15
SIGMA_HIGH = 0.30


# ============================================================
# Time Horizons (years)
# Frontend sends: 1, 5, 10
# ============================================================
TIME_HORIZONS = {
    1: 1,
    5: 5,
    10: 10,
}

# How many trading days per year we assume for GBM
STEPS_PER_YEAR = 252

# Number of GBM sample paths used for the time-series chart
N_SAMPLE_PATHS = 20


# ============================================================
# Shock System Parameters
# ============================================================
# Auto-shock mode flags
AUTO_SHOCK_DEFAULT = True
AUTO_SHOCK_PROB = 0.05   # 5% chance for each simulation

# Shock strengths (multiplicative factors)
CRASH_FACTOR = 0.80      # -20% shock
BOOM_FACTOR = 1.15       # +15% shock

# Manual shock override options
VALID_SHOCKS = {"crash", "boom", None}


# ============================================================
# Monte Carlo Simulation Settings
# ============================================================
# Default number of Monte Carlo paths, if not overridden
DEFAULT_SIMS = 3000      # matches what the frontend currently uses

# Safety bounds for user-provided sims
MAX_SIMS = 15000
MIN_SIMS = 100


# ============================================================
# Miscellaneous
# ============================================================
SEED_DEFAULT = None   # Use RNG randomness by default (no fixed seed)
