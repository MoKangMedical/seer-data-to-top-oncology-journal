"""
生存分析引擎

基于lifelines实现完整的生存分析流程：
- Kaplan-Meier生存估计 + Log-rank检验
- Cox比例风险回归（单因素+多因素）
- 竞争风险分析（累积发生率）
- 亚组分析 + 交互效应检验
- 风险表生成

输出Publication-ready的统计结果。
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
from lifelines import (
    KaplanMeierFitter,
    CoxPHFitter,
    NelsonAalenFitter,
)
from lifelines.statistics import logrank_test, multivariate_logrank_test
from lifelines.utils import median_survival_times

logger = logging.getLogger(__name__)


@dataclass
class KMResult:
    """Kaplan-Meier分析结果"""
    group: str
    n_at_risk: int
    median_survival: float
    median_ci_lower: float
    median_ci_upper: float
    survival_1y: float
    survival_3y: float
    survival_5y: float
    kmf: object  # KaplanMeierFitter对象（用于绘图）


@dataclass
class CoxResult:
    """Cox回归结果"""
    variable: str
    hr: float
    hr_lower: float
    hr_upper: float
    p_value: float
    coef: float
    se: float


@dataclass
class SurvivalReport:
    """生存分析完整报告"""
    study_description: str = ""
    sample_size: int = 0
    events: int = 0
    censoring_rate: float = 0.0
    median_followup: float = 0.0
    km_results: List[KMResult] = field(default_factory=list)
    logrank_p: float = 1.0
    univariate_cox: List[CoxResult] = field(default_factory=list)
    multivariate_cox: List[CoxResult] = field(default_factory=list)
    cox_concordance: float = 0.0
    subgroup_results: List[Dict] = field(default_factory=list)
    risk_table: Optional[pd.DataFrame] = None


class SurvivalAnalyzer:
    """生存分析引擎"""

    def __init__(self, time_col: str = "SURV_TIME", event_col: str = "EVENT"):
        self.time_col = time_col
        self.event_col = event_col
        self.report = SurvivalReport()

    # ── 数据验证 ──────────────────────────────────────────────────

    def _validate(self, df: pd.DataFrame) -> pd.DataFrame:
        """验证并清洗生存数据"""
        required = [self.time_col, self.event_col]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"缺少必要列: {missing}")

        df = df.copy()
        df[self.time_col] = pd.to_numeric(df[self.time_col], errors="coerce")
        df[self.event_col] = pd.to_numeric(df[self.event_col], errors="coerce")

        before = len(df)
        df = df.dropna(subset=[self.time_col, self.event_col])
        df = df[df[self.time_col] > 0]
        df[self.event_col] = df[self.event_col].astype(int)

        if len(df) < before:
            logger.warning(f"清洗后剩余 {len(df)}/{before} 行")

        return df

    # ── Kaplan-Meier分析 ─────────────────────────────────────────

    def kaplan_meier(self, df: pd.DataFrame,
                     group_col: Optional[str] = None) -> List[KMResult]:
        """
        Kaplan-Meier生存分析

        Args:
            df: 预处理后的数据
            group_col: 分组变量（如 "STAGE_LABEL", "TREATMENT"）

        Returns:
            KMResult列表
        """
        df = self._validate(df)
        results = []

        if group_col and group_col in df.columns:
            # 多组分析
            groups = df[group_col].dropna().unique()
            for group_name in sorted(groups):
                mask = df[group_col] == group_name
                sub_df = df[mask]
                kmf = self._fit_km(sub_df, label=str(group_name))
                results.append(kmf)

            # Log-rank检验
            if len(groups) >= 2:
                lr = multivariate_logrank_test(
                    df[self.time_col], df[group_col], df[self.event_col]
                )
                self.report.logrank_p = lr.p_value
                logger.info(f"Log-rank检验 p = {lr.p_value:.4e}")
        else:
            # 总体分析
            kmf = self._fit_km(df, label="Overall")
            results.append(kmf)

        self.report.km_results = results
        self.report.sample_size = len(df)
        self.report.events = int(df[self.event_col].sum())
        self.report.censoring_rate = 1 - self.report.events / self.report.sample_size

        return results

    def _fit_km(self, df: pd.DataFrame, label: str = "") -> KMResult:
        """拟合单个KM曲线"""
        kmf = KaplanMeierFitter()
        kmf.fit(
            durations=df[self.time_col],
            event_observed=df[self.event_col],
            label=label,
        )

        # 生存率
        def get_survival_at(kmf, time_point):
            try:
                idx = kmf.survival_function_at_times(time_point)
                return float(idx.iloc[0])
            except Exception:
                return np.nan

        median_surv = kmf.median_survival_time_
        ci = median_survival_times(kmf.confidence_interval_)

        return KMResult(
            group=label,
            n_at_risk=len(df),
            median_survival=median_surv,
            median_ci_lower=float(ci.iloc[0, 0]) if not ci.empty else np.nan,
            median_ci_upper=float(ci.iloc[0, 1]) if not ci.empty else np.nan,
            survival_1y=get_survival_at(kmf, 12),
            survival_3y=get_survival_at(kmf, 36),
            survival_5y=get_survival_at(kmf, 60),
            kmf=kmf,
        )

    # ── Cox回归分析 ──────────────────────────────────────────────

    def cox_univariate(self, df: pd.DataFrame,
                       covariates: List[str]) -> List[CoxResult]:
        """
        单因素Cox回归（每个变量单独建模）

        Args:
            df: 预处理后的数据
            covariates: 协变量列表

        Returns:
            CoxResult列表
        """
        df = self._validate(df)
        results = []

        for var in covariates:
            if var not in df.columns:
                logger.warning(f"变量 {var} 不在数据中，跳过")
                continue

            sub_df = df[[self.time_col, self.event_col, var]].dropna()
            if len(sub_df) < 30:
                logger.warning(f"变量 {var} 有效样本不足30，跳过")
                continue

            try:
                # 分类变量需要one-hot编码
                if sub_df[var].dtype == "object" or sub_df[var].dtype.name == "category":
                    dummies = pd.get_dummies(sub_df[var], prefix=var, drop_first=True)
                    model_df = pd.concat([sub_df[[self.time_col, self.event_col]], dummies], axis=1)
                else:
                    model_df = sub_df[[self.time_col, self.event_col, var]]

                cph = CoxPHFitter()
                cph.fit(model_df, duration_col=self.time_col, event_col=self.event_col)

                # 提取第一个变量的结果（或所有dummy变量）
                for var_name in cph.params_.index:
                    if var_name in [self.time_col, self.event_col]:
                        continue
                    results.append(CoxResult(
                        variable=var_name,
                        hr=np.exp(cph.params_[var_name]),
                        hr_lower=np.exp(cph.confidence_intervals_.loc[var_name].iloc[0]),
                        hr_upper=np.exp(cph.confidence_intervals_.loc[var_name].iloc[1]),
                        p_value=cph.summary.loc[var_name, "p"],
                        coef=cph.params_[var_name],
                        se=cph.standard_errors_[var_name],
                    ))

            except Exception as e:
                logger.warning(f"变量 {var} Cox回归失败: {e}")

        self.report.univariate_cox = results
        return results

    def cox_multivariate(self, df: pd.DataFrame,
                         covariates: List[str],
                         penalizer: float = 0.01) -> List[CoxResult]:
        """
        多因素Cox回归

        Args:
            df: 预处理后的数据
            covariates: 协变量列表
            penalizer: L2正则化系数

        Returns:
            CoxResult列表
        """
        df = self._validate(df)

        # 准备变量
        model_cols = [self.time_col, self.event_col]
        dummy_frames = []

        for var in covariates:
            if var not in df.columns:
                continue
            if df[var].dtype == "object" or df[var].dtype.name == "category":
                dummies = pd.get_dummies(df[var], prefix=var, drop_first=True)
                dummy_frames.append(dummies)
            else:
                model_cols.append(var)

        if dummy_frames:
            model_df = pd.concat([df[model_cols]] + dummy_frames, axis=1)
        else:
            model_df = df[model_cols].copy()

        model_df = model_df.dropna()

        if len(model_df) < 50:
            logger.error(f"样本量不足: {len(model_df)}")
            return []

        try:
            cph = CoxPHFitter(penalizer=penalizer)
            cph.fit(model_df, duration_col=self.time_col, event_col=self.event_col)

            results = []
            for var_name in cph.params_.index:
                if var_name in [self.time_col, self.event_col]:
                    continue
                results.append(CoxResult(
                    variable=var_name,
                    hr=np.exp(cph.params_[var_name]),
                    hr_lower=np.exp(cph.confidence_intervals_.loc[var_name].iloc[0]),
                    hr_upper=np.exp(cph.confidence_intervals_.loc[var_name].iloc[1]),
                    p_value=cph.summary.loc[var_name, "p"],
                    coef=cph.params_[var_name],
                    se=cph.standard_errors_[var_name],
                ))

            self.report.multivariate_cox = results
            self.report.cox_concordance = cph.concordance_index_

            # 风险表
            self.report.risk_table = cph.summary

            logger.info(f"多因素Cox回归完成，C-index={cph.concordance_index_:.3f}")
            return results

        except Exception as e:
            logger.error(f"多因素Cox回归失败: {e}")
            return []

    # ── 亚组分析 ──────────────────────────────────────────────────

    def subgroup_analysis(self, df: pd.DataFrame,
                          subgroup_col: str,
                          treatment_col: str) -> List[Dict]:
        """
        亚组分析：在每个亚组中评估治疗效果

        Args:
            df: 预处理后的数据
            subgroup_col: 亚组变量（如 "AGE_GROUP", "SEX_LABEL"）
            treatment_col: 治疗变量

        Returns:
            亚组分析结果列表
        """
        df = self._validate(df)
        results = []

        if subgroup_col not in df.columns or treatment_col not in df.columns:
            logger.warning(f"亚组变量或治疗变量不存在")
            return results

        for subgroup_val, group_df in df.groupby(subgroup_col):
            if len(group_df) < 30:
                continue

            try:
                cph = CoxPHFitter()
                sub_data = group_df[[self.time_col, self.event_col, treatment_col]].dropna()

                if sub_data[treatment_col].nunique() < 2:
                    continue

                cph.fit(sub_data, duration_col=self.time_col, event_col=self.event_col)

                hr = np.exp(cph.params_[treatment_col])
                ci_low = np.exp(cph.confidence_intervals_.loc[treatment_col].iloc[0])
                ci_high = np.exp(cph.confidence_intervals_.loc[treatment_col].iloc[1])
                p = cph.summary.loc[treatment_col, "p"]

                results.append({
                    "subgroup": subgroup_col,
                    "level": str(subgroup_val),
                    "n": len(sub_data),
                    "events": int(sub_data[self.event_col].sum()),
                    "hr": hr,
                    "hr_lower": ci_low,
                    "hr_upper": ci_high,
                    "p_value": p,
                    "significant": p < 0.05,
                })

            except Exception as e:
                logger.warning(f"亚组 {subgroup_val} 分析失败: {e}")

        # 交互效应检验
        try:
            interaction_df = df[[self.time_col, self.event_col, subgroup_col, treatment_col]].dropna()
            if interaction_df[subgroup_col].dtype == "object":
                interaction_df[subgroup_col] = interaction_df[subgroup_col].astype("category").cat.codes
            interaction_df["interaction"] = interaction_df[subgroup_col] * interaction_df[treatment_col]

            cph_int = CoxPHFitter()
            cph_int.fit(
                interaction_df[[self.time_col, self.event_col, subgroup_col, treatment_col, "interaction"]],
                duration_col=self.time_col,
                event_col=self.event_col,
            )
            interaction_p = cph_int.summary.loc["interaction", "p"]

            for r in results:
                r["interaction_p"] = interaction_p
        except Exception:
            pass

        self.report.subgroup_results = results
        return results

    # ── 风险表生成 ────────────────────────────────────────────────

    def generate_risk_table(self, df: pd.DataFrame,
                            group_col: Optional[str] = None,
                            time_points: List[int] = None) -> pd.DataFrame:
        """
        生成风险表（Number at risk table）

        Args:
            df: 数据
            group_col: 分组变量
            time_points: 时间点列表（月）

        Returns:
            风险表DataFrame
        """
        if time_points is None:
            time_points = [0, 12, 24, 36, 48, 60]

        df = self._validate(df)
        rows = []

        if group_col and group_col in df.columns:
            for group_name, group_df in df.groupby(group_col):
                row = {"Group": str(group_name)}
                for t in time_points:
                    at_risk = int((group_df[self.time_col] >= t).sum())
                    row[f"{t}mo"] = at_risk
                rows.append(row)
        else:
            row = {"Group": "Overall"}
            for t in time_points:
                at_risk = int((df[self.time_col] >= t).sum())
                row[f"{t}mo"] = at_risk
            rows.append(row)

        return pd.DataFrame(rows)

    # ── 竞争风险（简化版） ────────────────────────────────────────

    def competing_risk_cuminc(self, df: pd.DataFrame,
                              event_col: str = "EVENT_TYPE",
                              group_col: Optional[str] = None) -> Dict:
        """
        累积发生率分析（竞争风险简化版）

        需要事件类型列：0=删失, 1=目标事件, 2=竞争事件
        """
        if event_col not in df.columns:
            logger.warning(f"竞争风险需要 {event_col} 列")
            return {}

        df = self._validate(df)
        results = {}

        for event_type in [1, 2]:
            event_name = "Target" if event_type == 1 else "Competing"
            df[f"event_{event_type}"] = (df[event_col] == event_type).astype(int)

            kmf = KaplanMeierFitter()
            # 1 - KM 估计累积发生率
            kmf.fit(
                df[self.time_col],
                event_observed=df[f"event_{event_type}"],
                label=f"{event_name} CIF",
            )
            # CIF = 1 - S(t)
            results[event_name] = {
                "cif": 1 - kmf.survival_function_,
                "kmf": kmf,
            }

        return results

    # ── 汇总报告 ──────────────────────────────────────────────────

    def get_summary(self) -> Dict:
        """返回分析结果汇总"""
        return {
            "sample_size": self.report.sample_size,
            "events": self.report.events,
            "censoring_rate": round(self.report.censoring_rate, 4),
            "median_followup": self.report.median_followup,
            "logrank_p": self.report.logrank_p,
            "km_results": [
                {
                    "group": r.group,
                    "n": r.n_at_risk,
                    "median_survival": r.median_survival,
                    "survival_1y": round(r.survival_1y, 4) if not np.isnan(r.survival_1y) else None,
                    "survival_3y": round(r.survival_3y, 4) if not np.isnan(r.survival_3y) else None,
                    "survival_5y": round(r.survival_5y, 4) if not np.isnan(r.survival_5y) else None,
                }
                for r in self.report.km_results
            ],
            "univariate_cox": [
                {
                    "variable": r.variable,
                    "hr": round(r.hr, 3),
                    "hr_ci": f"{r.hr_lower:.2f}-{r.hr_upper:.2f}",
                    "p": f"{r.p_value:.4f}",
                }
                for r in self.report.univariate_cox
            ],
            "multivariate_cox": [
                {
                    "variable": r.variable,
                    "hr": round(r.hr, 3),
                    "hr_ci": f"{r.hr_lower:.2f}-{r.hr_upper:.2f}",
                    "p": f"{r.p_value:.4f}",
                }
                for r in self.report.multivariate_cox
            ],
            "cox_concordance": round(self.report.cox_concordance, 4),
            "subgroup_results": self.report.subgroup_results,
        }

    # ── 格式化输出 ────────────────────────────────────────────────

    def format_cox_table(self, results: List[CoxResult],
                         title: str = "Cox Regression") -> str:
        """格式化Cox结果为Markdown表格"""
        lines = [
            f"### {title}",
            "",
            "| Variable | HR | 95% CI | p-value |",
            "|----------|------:|------------|--------:|",
        ]
        for r in results:
            sig = "*" if r.p_value < 0.05 else ""
            lines.append(
                f"| {r.variable} | {r.hr:.3f} | {r.hr_lower:.2f}-{r.hr_upper:.2f} | {r.p_value:.4f}{sig} |"
            )
        lines.append("")
        lines.append("* p < 0.05")
        return "\n".join(lines)

    def format_km_table(self) -> str:
        """格式化KM结果为Markdown表格"""
        lines = [
            "### Kaplan-Meier Survival Estimates",
            "",
            "| Group | N | Median (mo) | 1-yr | 3-yr | 5-yr |",
            "|-------|--:|------------:|-----:|-----:|-----:|",
        ]
        for r in self.report.km_results:
            s1 = f"{r.survival_1y:.1%}" if not np.isnan(r.survival_1y) else "NA"
            s3 = f"{r.survival_3y:.1%}" if not np.isnan(r.survival_3y) else "NA"
            s5 = f"{r.survival_5y:.1%}" if not np.isnan(r.survival_5y) else "NA"
            med = f"{r.median_survival:.1f}" if not np.isnan(r.median_survival) else "NR"
            lines.append(f"| {r.group} | {r.n_at_risk} | {med} | {s1} | {s3} | {s5} |")

        if self.report.logrank_p < 0.05:
            lines.append(f"\nLog-rank test: p = {self.report.logrank_p:.4e}")
        else:
            lines.append(f"\nLog-rank test: p = {self.report.logrank_p:.4f}")

        return "\n".join(lines)
