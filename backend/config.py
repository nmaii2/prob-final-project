"""
Configuration file for Monte Carlo Gamble Game.
Defines defaults for:
- Portfolio parameters
- Volatility and drift
- Shock system
- Simulation settings
- Time horizons
"""

# ============================================================
# Initial Wealth
# ============================================================
INITIAL_WEALTH = 10000


# ============================================================
# Model Parameters — Expected Annual Returns (μ)
# ============================================================
MU_LOW = 0.04       # Low-risk asset
MU_MED = 0.08       # Medium-risk asset
MU_HIGH = 0.14      # High-risk asset


# ============================================================
# Model Parameters — Annual Volatilities (σ)
# ============================================================
SIGMA_LOW = 0.06
SIGMA_MED = 0.15
SIGMA_HIGH = 0.30


# ============================================================
# Time Horizons (as integers)
# Frontend sends: 1, 5, 10
# ============================================================
TIME_HORIZONS = {
    1: 1,
    5: 5,
    10: 10
}


# ============================================================
# Shock System Parameters
# ============================================================
AUTO_SHOCK_DEFAULT = True
AUTO_SHOCK_PROB = 0.05   # 5% chance each simulation

# Shock strengths
CRASH_FACTOR = 0.80      # -20% shock
BOOM_FACTOR = 1.15        # +15% shock

# Manual shock override options
VALID_SHOCKS = {"crash", "boom", None}


# ============================================================
# Monte Carlo Simulation Settings
# ============================================================
DEFAULT_SIMS = 2000
MAX_SIMS = 15000
MIN_SIMS = 100


# ============================================================
# Miscellaneous
# ============================================================
SEED_DEFAULT = None   # Use RNG randomness by default
