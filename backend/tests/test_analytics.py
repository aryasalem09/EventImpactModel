"""Tests for the analytics engine."""

import numpy as np
import pandas as pd
import pytest

from app.analytics.regimes import (
    classify_surprise_regime,
    semantic_label,
)
from app.analytics.returns import (
    benchmark_adjusted_return,
    cumulative_returns,
    log_returns,
    mean_adjusted_return,
    simple_returns,
)
from app.analytics.volatility import (
    realized_volatility,
    vol_delta,
    vol_ratio,
    window_volatility,
)


@pytest.fixture
def sample_prices():
    """Generate a simple price series for testing."""
    dates = pd.bdate_range("2023-01-01", periods=300)
    np.random.seed(42)
    prices = 100 * np.exp(np.cumsum(np.random.normal(0.0003, 0.01, 300)))
    return pd.Series(prices, index=dates)


class TestReturns:
    def test_simple_returns(self, sample_prices):
        rets = simple_returns(sample_prices)
        assert len(rets) == len(sample_prices)
        assert pd.isna(rets.iloc[0])
        assert not pd.isna(rets.iloc[1])

    def test_log_returns(self, sample_prices):
        rets = log_returns(sample_prices)
        assert len(rets) == len(sample_prices)
        # Log returns should be close to simple returns for small moves
        simple = simple_returns(sample_prices).dropna()
        log_r = rets.dropna()
        assert np.allclose(simple.values, log_r.values, atol=0.005)

    def test_cumulative_returns(self, sample_prices):
        rets = simple_returns(sample_prices).dropna()
        cum = cumulative_returns(rets)
        assert len(cum) == len(rets)
        # Final cumulative return should match direct price comparison
        expected = (sample_prices.iloc[-1] / sample_prices.iloc[1]) - 1
        assert abs(cum.iloc[-1] - expected) < 0.01

    def test_benchmark_adjusted_return(self):
        assert benchmark_adjusted_return(0.05, 0.02) == pytest.approx(0.03)
        assert benchmark_adjusted_return(None, 0.02) is None
        assert benchmark_adjusted_return(0.05, None) is None

    def test_mean_adjusted_return(self):
        est_rets = pd.Series([0.01, -0.005, 0.008, 0.003, -0.002])
        result = mean_adjusted_return(0.05, est_rets)
        assert result is not None
        expected = 0.05 - est_rets.mean()
        assert result == pytest.approx(expected)

    def test_mean_adjusted_empty(self):
        assert mean_adjusted_return(0.05, pd.Series(dtype=float)) is None


class TestVolatility:
    def test_realized_vol(self, sample_prices):
        log_rets = log_returns(sample_prices)
        vol = realized_volatility(log_rets, window=21)
        assert len(vol) == len(log_rets)
        # Vol should be positive where computed
        valid = vol.dropna()
        assert (valid > 0).all()

    def test_window_volatility(self, sample_prices):
        log_rets = log_returns(sample_prices).dropna().iloc[:30]
        vol = window_volatility(log_rets)
        assert vol is not None
        assert vol > 0

    def test_vol_delta(self):
        assert vol_delta(0.15, 0.20) == pytest.approx(0.05)
        assert vol_delta(None, 0.20) is None

    def test_vol_ratio(self):
        assert vol_ratio(0.15, 0.30) == pytest.approx(2.0)
        assert vol_ratio(0.0, 0.30) is None
        assert vol_ratio(None, 0.30) is None


class TestRegimes:
    def test_surprise_regime_positive(self):
        assert classify_surprise_regime(0.5) == "positive_surprise"

    def test_surprise_regime_negative(self):
        assert classify_surprise_regime(-0.3) == "negative_surprise"

    def test_surprise_regime_neutral(self):
        assert classify_surprise_regime(0.0) == "neutral"
        assert classify_surprise_regime(None) == "neutral"

    def test_semantic_label_cpi(self):
        assert semantic_label("CPI", "positive_surprise") == "hotter_cpi"
        assert semantic_label("CPI", "negative_surprise") == "cooler_cpi"

    def test_semantic_label_nfp(self):
        assert semantic_label("NFP", "positive_surprise") == "strong_labor"
        assert semantic_label("NFP", "negative_surprise") == "weak_labor"

    def test_semantic_label_fomc(self):
        assert semantic_label("FOMC", "positive_surprise") == "hawkish_proxy"

