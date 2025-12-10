import numpy as np
from typing import Optional, Dict, Any


# ============================================================
# Generate GBM Daily Paths, Then Downsample by Year
# ============================================================
def generate_gbm_paths(
    S0: float,
    mu: float,
    sigma: float,
    years: int,
    steps_per_year: int,
    N: int,
    rng: np.random.Generator,
) -> np.ndarray:
    """
    Generates daily GBM paths, then converts them to 1 point per year.
    Returns shape (N, years + 1)
    """
    total_steps = years * steps_per_year
    dt = 1.0 / steps_per_year

    # Random shocks
    Z = rng.normal(0, 1, size=(N, total_steps))
    increments = np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z)

    paths = np.zeros((N, total_steps + 1))
    paths[:, 0] = S0

    for t in range(total_steps):
        paths[:, t + 1] = paths[:, t] * increments[:, t]

    # Downsample: keep 1 point per year
    idxs = [int(i * steps_per_year) for i in range(years + 1)]
    return paths[:, idxs]


# ============================================================
# Main Monte Carlo Simulation
# ============================================================
def run_simulation(
    wealth: float,
    w_low: float,
    w_med: float,
    w_high: float,
    mu_low: float,
    mu_med: float,
    mu_high: float,
    sigma_low: float,
    sigma_med: float,
    sigma_high: float,
    years: int,
    sims: int,
    auto_shock: bool,
    shock_prob: float,
    shock_type: Optional[str] = None,
    seed: Optional[int] = None,
) -> Dict[str, Any]:

    rng = np.random.default_rng(seed)

    # ------------------------------
    # Normalize weights
    # ------------------------------
    total = w_low + w_med + w_high
    if total <= 0:
        w_low, w_med, w_high = 1.0, 0.0, 0.0
    else:
        w_low /= total
        w_med /= total
        w_high /= total

    # ------------------------------
    # Generate sample GBM paths
    # 20 paths for time-series chart
    # ------------------------------
    steps_per_year = 252

    low_paths = generate_gbm_paths(100, mu_low, sigma_low, years, steps_per_year, 50, rng)
    med_paths = generate_gbm_paths(100, mu_med, sigma_med, years, steps_per_year, 50, rng)
    high_paths = generate_gbm_paths(100, mu_high, sigma_high, years, steps_per_year, 50, rng)

    # Weighted portfolio sample chart paths
    sample_paths = (
        w_low * low_paths +
        w_med * med_paths +
        w_high * high_paths
    )

    # ------------------------------
    # Monte Carlo terminal wealth
    # daily GBM applied for each sim
    # ------------------------------
    dt = 1 / steps_per_year
    total_steps = years * steps_per_year

    # daily returns
    Z = rng.normal(0, 1, size=(sims, total_steps))

    daily_returns = (
        w_low * (mu_low * dt + sigma_low * np.sqrt(dt) * Z) +
        w_med * (mu_med * dt + sigma_med * np.sqrt(dt) * Z) +
        w_high * (mu_high * dt + sigma_high * np.sqrt(dt) * Z)
    )

    # cumulative log return
    log_returns = daily_returns.sum(axis=1)

    # ------------------------------
    # Shock summary
    # ------------------------------
    shock_summary = {
        "auto_shock": auto_shock,
        "applied_to_all": False,
        "total_shocked": 0,
        "count_crash": 0,
        "count_boom": 0
    }

    # ------------------------------
    # Full shock mode
    # ------------------------------
    if shock_type in ("crash", "boom"):
        shock_summary["applied_to_all"] = True
        shock_summary["total_shocked"] = sims

        if shock_type == "crash":
            log_returns += np.log(0.80)
            shock_summary["count_crash"] = sims
        else:
            log_returns += np.log(1.15)
            shock_summary["count_boom"] = sims

        final_wealth = wealth * np.exp(log_returns)

    # ------------------------------
    # Auto-shock mode
    # ------------------------------
    else:
        final_wealth = wealth * np.exp(log_returns)

        if auto_shock:
            mask = rng.random(sims) < shock_prob
            shock_summary["total_shocked"] = int(mask.sum())

            if mask.any():
                # crash or boom assignments
                types = rng.choice(["crash", "boom"], size=mask.sum())

                for i, idx in enumerate(np.where(mask)[0]):
                    if types[i] == "crash":
                        final_wealth[idx] *= 0.80
                        shock_summary["count_crash"] += 1
                    else:
                        final_wealth[idx] *= 1.15
                        shock_summary["count_boom"] += 1

    # ------------------------------
    # Metrics
    # ------------------------------
    expected = float(final_wealth.mean())
    prob_loss = float(np.mean(final_wealth < wealth))
    prob_ruin = float(np.mean(final_wealth < 5000))
    var_5 = float(np.percentile(final_wealth, 5))

    return {
        "sample_paths": sample_paths.tolist(),
        "final_wealth_samples": final_wealth.tolist(),

        "expected": expected,
        "prob_loss": prob_loss,
        "prob_ruin": prob_ruin,
        "VaR_5": var_5,

        "shock_summary": shock_summary,

        "weights": {"low": w_low, "medium": w_med, "high": w_high},
        "mus": {"low": mu_low, "medium": mu_med, "high": mu_high},
        "sigmas": {"low": sigma_low, "medium": sigma_med, "high": sigma_high},
    }
