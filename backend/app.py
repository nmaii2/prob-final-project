from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)


# ============================================================
# GBM PATH GENERATOR
# ============================================================
def generate_gbm_paths(S0, mu, sigma, T, steps, N, rng):
    """
    Generates N GBM paths of length steps+1.
    """
    dt = T / steps
    Z = rng.normal(0, 1, size=(N, steps))
    increments = np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z)

    paths = np.zeros((N, steps + 1))
    paths[:, 0] = S0

    for t in range(steps):
        paths[:, t + 1] = paths[:, t] * increments[:, t]

    return paths


# ============================================================
# MAIN PORTFOLIO SIMULATION
# ============================================================
def run_simulation(
    wealth,
    w_low, w_med, w_high,
    mu_low, mu_med, mu_high,
    sigma_low, sigma_med, sigma_high,
    years,
    sims,
    auto_shock,
    shock_prob,
    shock_type,
    seed
):
    rng = np.random.default_rng(seed)

    # Normalize weights
    total = w_low + w_med + w_high
    if total <= 0:
        w_low, w_med, w_high = 1, 0, 0
    else:
        w_low /= total
        w_med /= total
        w_high /= total

    steps = years * 252
    T = float(years)

    # ------------------------------------------------------------
    # 20 GBM sample paths FOR DISPLAY ONLY
    # (Downsampled to yearly points for faster charts)
    # ------------------------------------------------------------
    raw_low = generate_gbm_paths(100, mu_low, sigma_low, T, steps, 20, rng)
    raw_med = generate_gbm_paths(100, mu_med, sigma_med, T, steps, 20, rng)
    raw_high = generate_gbm_paths(100, mu_high, sigma_high, T, steps, 20, rng)

    portfolio_raw = (
        w_low * raw_low +
        w_med * raw_med +
        w_high * raw_high
    )

    indices = np.linspace(0, steps, years + 1, dtype=int)
    sample_paths = portfolio_raw[:, indices]

    # ------------------------------------------------------------
    # MONTE CARLO TERMINAL WEALTH
    # ------------------------------------------------------------
    R_low = rng.normal(mu_low, sigma_low, sims)
    R_med = rng.normal(mu_med, sigma_med, sims)
    R_high = rng.normal(mu_high, sigma_high, sims)

    portfolio_returns = (
        w_low * R_low +
        w_med * R_med +
        w_high * R_high
    )

    shock_summary = {
        "auto_shock": auto_shock,
        "applied_to_all": False,
        "total_shocked": 0,
        "count_crash": 0,
        "count_boom": 0
    }

    # Full manual shock
    if shock_type in ("crash", "boom"):
        shock_summary["applied_to_all"] = True

        if shock_type == "crash":
            portfolio_returns *= 0.80
            shock_summary["count_crash"] = sims
        else:
            portfolio_returns *= 1.15
            shock_summary["count_boom"] = sims

        shock_summary["total_shocked"] = sims

    # Auto shock (per simulation)
    elif auto_shock:
        mask = rng.random(sims) < shock_prob
        shocked_count = int(mask.sum())
        shock_summary["total_shocked"] = shocked_count

        if shocked_count > 0:
            choices = rng.choice(["crash", "boom"], shocked_count)

            adj = np.ones(sims)
            idxs = np.where(mask)[0]

            for i, idx in enumerate(idxs):
                if choices[i] == "crash":
                    adj[idx] = 0.80
                    shock_summary["count_crash"] += 1
                else:
                    adj[idx] = 1.15
                    shock_summary["count_boom"] += 1

            portfolio_returns *= adj

    # Terminal wealth after T years
    final_wealth = wealth * np.exp(portfolio_returns * years)

    return {
        "sample_paths": sample_paths.tolist(),
        "final_wealth_samples": final_wealth.tolist(),
        "expected": float(final_wealth.mean()),
        "prob_loss": float(np.mean(final_wealth < wealth)),
        "prob_ruin": float(np.mean(final_wealth < 5000)),
        "VaR_5": float(np.percentile(final_wealth, 5)),
        "shock_summary": shock_summary,
        "weights": {
            "low": w_low,
            "medium": w_med,
            "high": w_high
        }
    }


# ============================================================
# API ROUTE
# ============================================================
@app.route("/simulate", methods=["POST"])
def simulate():
    try:
        data = request.get_json()

        results = run_simulation(
            wealth=float(data.get("wealth", 10000)),
            w_low=float(data.get("w_low", 0.4)),
            w_med=float(data.get("w_med", 0.4)),
            w_high=float(data.get("w_high", 0.2)),
            mu_low=float(data.get("mu_low", 0.04)),
            mu_med=float(data.get("mu_med", 0.08)),
            mu_high=float(data.get("mu_high", 0.14)),
            sigma_low=float(data.get("sigma_low", 0.06)),
            sigma_med=float(data.get("sigma_med", 0.15)),
            sigma_high=float(data.get("sigma_high", 0.30)),
            years=int(data.get("years", 1)),
            sims=int(data.get("sims", 3000)),
            auto_shock=bool(data.get("auto_shock", True)),
            shock_prob=float(data.get("shock_prob", 0.05)),
            shock_type=data.get("shock", None),
            seed=data.get("seed", None)
        )

        return jsonify(results)

    except Exception as e:
        logging.error(f"Simulation error: {str(e)}")
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(port=5001, debug=True)
