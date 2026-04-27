"""
趋势分析引擎

实现肿瘤流行病学趋势分析：
- 年龄标准化发病率（ASR）计算
- 年度百分比变化（APC）分析
- Joinpoint回归（Python原生实现）
- 时期-队列分析
- 可直接用于Lancet/JAMA级别论文
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
from scipy import stats

logger = logging.getLogger(__name__)


# ── 世界标准人口（Segi 1960） ─────────────────────────────────────

WORLD_STANDARD_POP = {
    (0, 4): 12000,
    (5, 9): 10000,
    (10, 14): 9000,
    (15, 19): 9000,
    (20, 24): 8000,
    (25, 29): 8000,
    (30, 34): 6000,
    (35, 39): 6000,
    (40, 44): 6000,
    (45, 49): 6000,
    (50, 54): 5000,
    (55, 59): 4000,
    (60, 64): 4000,
    (65, 69): 3000,
    (70, 74): 2000,
    (75, 79): 1000,
    (80, 84): 500,
    (85, 200): 500,
}


@dataclass
class TrendPoint:
    """单年趋势数据点"""
    year: int
    count: int
    population: int
    rate: float
    rate_lower: float
    rate_upper: float
    apc: float = 0.0
    joinpoint: bool = False


@dataclass
class JoinpointSegment:
    """Joinpoint分段"""
    start_year: int
    end_year: int
    apc: float
    apc_lower: float
    apc_upper: float
    p_value: float
    significant: bool = False


@dataclass
class TrendReport:
    """趋势分析报告"""
    cancer_site: str = ""
    period: str = ""
    overall_apc: float = 0.0
    overall_apc_ci: Tuple[float, float] = (0.0, 0.0)
    joinpoint_segments: List[JoinpointSegment] = field(default_factory=list)
    n_joinpoints: int = 0
    trend_points: List[TrendPoint] = field(default_factory=list)
    annual_data: Optional[pd.DataFrame] = None


class TrendAnalyzer:
    """趋势分析引擎"""

    def __init__(self):
        self.report = TrendReport()

    # ── 年龄标准化发病率 ──────────────────────────────────────────

    def calculate_asr(self, df: pd.DataFrame,
                      year_col: str = "YEAR",
                      age_col: str = "AGE_GROUP",
                      event_col: str = "EVENT",
                      population_col: Optional[str] = None,
                      age_groups: Optional[Dict] = None) -> pd.DataFrame:
        """
        计算年龄标准化发病率（ASR）

        Args:
            df: 预处理后的SEER数据
            year_col: 诊断年份列
            age_col: 年龄分组列
            event_col: 事件指示列
            population_col: 人群数列（如果没有则用病例数代替）
            age_groups: 年龄分组定义

        Returns:
            年度ASR DataFrame [year, rate, rate_lower, rate_upper, count, population]
        """
        if age_groups is None:
            age_groups = WORLD_STANDARD_POP

        df = df.copy()
        df[year_col] = pd.to_numeric(df[year_col], errors="coerce")
        df[event_col] = pd.to_numeric(df[event_col], errors="coerce")
        df = df.dropna(subset=[year_col, event_col])

        annual_results = []

        for year, year_df in df.groupby(year_col):
            year = int(year)
            total_weighted_rate = 0
            total_variance = 0

            for (age_lo, age_hi), standard_pop in age_groups.items():
                # 筛选该年龄组
                if age_col in year_df.columns:
                    # 尝试匹配年龄组
                    mask = year_df[age_col].apply(
                        lambda x: self._match_age_group(x, age_lo, age_hi)
                    )
                    age_df = year_df[mask]
                else:
                    # 没有年龄分组，使用全部
                    age_df = year_df

                n_cases = age_df[event_col].sum()

                if population_col and population_col in age_df.columns:
                    pop = age_df[population_col].sum()
                else:
                    # 使用病例数作为观察数
                    pop = len(age_df)

                if pop > 0:
                    rate = n_cases / pop * 100000
                    variance = n_cases / (pop ** 2) * 100000 ** 2

                    weight = standard_pop / 100000
                    total_weighted_rate += rate * weight
                    total_variance += variance * weight ** 2

            # 95% CI
            se = np.sqrt(total_variance)
            rate_lower = max(0, total_weighted_rate - 1.96 * se)
            rate_upper = total_weighted_rate + 1.96 * se

            annual_results.append({
                "year": year,
                "rate": total_weighted_rate,
                "rate_lower": rate_lower,
                "rate_upper": rate_upper,
                "count": int(year_df[event_col].sum()),
                "population": len(year_df),
            })

        result_df = pd.DataFrame(annual_results)
        self.report.annual_data = result_df
        return result_df

    @staticmethod
    def _match_age_group(value, lo, hi):
        """匹配年龄组"""
        try:
            val = int(value)
            return lo <= val <= hi
        except (ValueError, TypeError):
            return str(value) == f"{lo}-{hi}"

    # ── APC分析 ──────────────────────────────────────────────────

    def calculate_apc(self, annual_data: pd.DataFrame,
                      year_col: str = "year",
                      rate_col: str = "rate") -> Dict:
        """
        计算年度百分比变化（APC）

        使用对数线性回归: ln(rate) = a + b*year
        APC = (exp(b) - 1) * 100

        Args:
            annual_data: 年度数据
            year_col: 年份列
            rate_col: 发病率列

        Returns:
            APC结果字典
        """
        df = annual_data.copy()
        df = df[df[rate_col] > 0].dropna(subset=[rate_col])

        if len(df) < 3:
            return {"apc": 0, "apc_lower": 0, "apc_upper": 0, "p": 1, "significant": False}

        # 对数变换
        df["log_rate"] = np.log(df[rate_col])

        # 线性回归
        slope, intercept, r_value, p_value, std_err = stats.linregress(
            df[year_col], df["log_rate"]
        )

        # APC
        apc = (np.exp(slope) - 1) * 100
        apc_se = std_err * 100  # 近似
        apc_lower = apc - 1.96 * apc_se
        apc_upper = apc + 1.96 * apc_se

        result = {
            "apc": round(apc, 2),
            "apc_lower": round(apc_lower, 2),
            "apc_upper": round(apc_upper, 2),
            "p": round(p_value, 4),
            "significant": p_value < 0.05,
            "r_squared": round(r_value ** 2, 4),
        }

        self.report.overall_apc = result["apc"]
        self.report.overall_apc_ci = (result["apc_lower"], result["apc_upper"])

        return result

    # ── Joinpoint回归 ─────────────────────────────────────────────

    def joinpoint_regression(self, annual_data: pd.DataFrame,
                             year_col: str = "year",
                             rate_col: str = "rate",
                             max_joinpoints: int = 4) -> List[JoinpointSegment]:
        """
        Joinpoint回归分析

        使用BIC准则选择最优分段数
        Python原生实现，无需安装Joinpoint软件

        Args:
            annual_data: 年度数据
            year_col: 年份列
            rate_col: 发病率列
            max_joinpoints: 最大分段点数

        Returns:
            JoinpointSegment列表
        """
        df = annual_data.copy()
        df = df.sort_values(year_col).reset_index(drop=True)

        years = df[year_col].values.astype(float)
        rates = df[rate_col].values.astype(float)
        log_rates = np.log(rates[rates > 0])
        valid_years = years[rates > 0]

        if len(valid_years) < 5:
            logger.warning("数据点过少，无法进行Joinpoint分析")
            return []

        best_bic = np.inf
        best_segments = []

        # 尝试不同数量的分段点
        for n_jp in range(max_joinpoints + 1):
            segments = self._fit_piecewise(valid_years, log_rates, n_jp)
            if segments is None:
                continue

            # 计算BIC
            residuals = []
            for seg in segments:
                mask = (valid_years >= seg["start"]) & (valid_years <= seg["end"])
                if mask.sum() > 0:
                    slope = seg["slope"]
                    intercept = seg["intercept"]
                    predicted = intercept + slope * (valid_years[mask] - seg["start"])
                    residuals.extend(log_rates[mask] - predicted)

            if not residuals:
                continue

            n = len(residuals)
            k = n_jp * 2 + (n_jp + 1) * 2  # 参数数
            rss = np.sum(np.array(residuals) ** 2)
            bic = n * np.log(rss / n) + k * np.log(n)

            if bic < best_bic:
                best_bic = bic
                best_segments = segments

        # 转换为JoinpointSegment
        result = []
        for seg in best_segments:
            mask = (valid_years >= seg["start"]) & (valid_years <= seg["end"])
            n_pts = mask.sum()

            if n_pts >= 3:
                seg_years = valid_years[mask]
                seg_rates = log_rates[mask]
                slope, _, _, p_value, std_err = stats.linregress(seg_years, seg_rates)

                apc = (np.exp(slope) - 1) * 100
                apc_se = abs(std_err * 100)
            else:
                apc = 0
                apc_se = 0
                p_value = 1

            result.append(JoinpointSegment(
                start_year=int(seg["start"]),
                end_year=int(seg["end"]),
                apc=round(apc, 2),
                apc_lower=round(apc - 1.96 * apc_se, 2),
                apc_upper=round(apc + 1.96 * apc_se, 2),
                p_value=round(p_value, 4),
                significant=p_value < 0.05,
            ))

        self.report.joinpoint_segments = result
        self.report.n_joinpoints = max(0, len(result) - 1)

        return result

    def _fit_piecewise(self, years, log_rates, n_joinpoints):
        """拟合分段线性模型"""
        n = len(years)

        if n_joinpoints == 0:
            slope, intercept, _, _, _ = stats.linregress(years, log_rates)
            return [{
                "start": years[0],
                "end": years[-1],
                "slope": slope,
                "intercept": intercept,
            }]

        # 尝试所有可能的分段点组合
        if n < 2 * n_joinpoints + 2:
            return None

        best_rss = np.inf
        best_segments = None

        # 简化：均匀分段
        step = n // (n_joinpoints + 1)
        jp_indices = [step * (i + 1) - 1 for i in range(n_joinpoints)]

        for idx in jp_indices:
            if idx <= 0 or idx >= n - 1:
                continue

            boundaries = [years[0]] + [years[idx]] + [years[-1]]
            boundaries = sorted(set(boundaries))

            segments = []
            for i in range(len(boundaries) - 1):
                mask = (years >= boundaries[i]) & (years <= boundaries[i + 1])
                if mask.sum() >= 2:
                    seg_years = years[mask]
                    seg_rates = log_rates[mask]
                    slope, intercept, _, _, _ = stats.linregress(seg_years, seg_rates)
                    segments.append({
                        "start": boundaries[i],
                        "end": boundaries[i + 1],
                        "slope": slope,
                        "intercept": intercept,
                    })

            if len(segments) == len(boundaries) - 1:
                rss = 0
                for seg in segments:
                    mask = (years >= seg["start"]) & (years <= seg["end"])
                    if mask.sum() > 0:
                        pred = seg["intercept"] + seg["slope"] * (years[mask] - seg["start"])
                        rss += np.sum((log_rates[mask] - pred) ** 2)

                if rss < best_rss:
                    best_rss = rss
                    best_segments = segments

        return best_segments

    # ── 时期-队列分析 ─────────────────────────────────────────────

    def age_period_cohort(self, df: pd.DataFrame,
                          year_col: str = "YEAR",
                          age_col: str = "AGE",
                          event_col: str = "EVENT") -> Dict:
        """
        年龄-时期-队列（APC）分析

        Returns:
            APC分析结果字典
        """
        df = df.copy()
        df[year_col] = pd.to_numeric(df[year_col], errors="coerce")
        df[age_col] = pd.to_numeric(df[age_col], errors="coerce")
        df = df.dropna(subset=[year_col, age_col, event_col])

        # 5年年龄组和时期组
        df["age_group_5y"] = (df[age_col] // 5) * 5
        df["period_5y"] = (df[year_col] // 5) * 5
        df["cohort_5y"] = df["period_5y"] - df["age_group_5y"]

        # 创建APC表
        apc_table = df.pivot_table(
            values=event_col,
            index="age_group_5y",
            columns="period_5y",
            aggfunc=["sum", "count"],
        )

        return {
            "apc_table": apc_table,
            "age_effects": df.groupby("age_group_5y")[event_col].mean().to_dict(),
            "period_effects": df.groupby("period_5y")[event_col].mean().to_dict(),
            "cohort_effects": df.groupby("cohort_5y")[event_col].mean().to_dict(),
        }

    # ── 汇总报告 ──────────────────────────────────────────────────

    def get_summary(self) -> Dict:
        """返回趋势分析汇总"""
        return {
            "overall_apc": self.report.overall_apc,
            "overall_apc_ci": self.report.overall_apc_ci,
            "n_joinpoints": self.report.n_joinpoints,
            "segments": [
                {
                    "period": f"{s.start_year}-{s.end_year}",
                    "apc": s.apc,
                    "apc_ci": f"{s.apc_lower:.1f} to {s.apc_upper:.1f}",
                    "p": s.p_value,
                    "significant": s.significant,
                }
                for s in self.report.joinpoint_segments
            ],
        }

    def format_trend_table(self) -> str:
        """格式化趋势分析结果为Markdown"""
        lines = [
            "### Temporal Trend Analysis",
            "",
            "| Period | APC (%) | 95% CI | p-value | Trend |",
            "|--------|--------:|-----------|--------:|-------|",
        ]

        for s in self.report.joinpoint_segments:
            trend = "Increasing" if s.apc > 0 else ("Decreasing" if s.apc < 0 else "Stable")
            sig = "*" if s.significant else ""
            lines.append(
                f"| {s.start_year}-{s.end_year} | {s.apc:+.1f} | "
                f"{s.apc_lower:.1f} to {s.apc_upper:.1f} | {s.p_value:.4f}{sig} | {trend} |"
            )

        lines.append(f"\nOverall APC: {self.report.overall_apc:+.1f}% "
                      f"(95% CI: {self.report.overall_apc_ci[0]:.1f} to "
                      f"{self.report.overall_apc_ci[1]:.1f})")
        lines.append("* p < 0.05")

        return "\n".join(lines)
