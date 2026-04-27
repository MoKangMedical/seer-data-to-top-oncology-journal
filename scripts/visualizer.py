"""
Publication-ready 可视化引擎

生成符合顶级肿瘤学期刊标准的图表：
- Kaplan-Meier生存曲线（带风险表）
- 森林图（亚组/Cox回归结果）
- 热图（相关性矩阵）
- 趋势图（发病率时间序列）
- 流程图（STROBE/CONSORT）
- 基线特征表

所有图表支持300 DPI TIFF/PDF输出，符合期刊投稿要求。
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.patches import FancyBboxPatch
from matplotlib.lines import Line2D

logger = logging.getLogger(__name__)

# ── 全局样式配置 ──────────────────────────────────────────────────

# 顶级期刊配色方案
COLORS = {
    "primary": "#2563EB",       # 蓝色
    "secondary": "#DC2626",     # 红色
    "tertiary": "#059669",      # 绿色
    "quaternary": "#D97706",    # 橙色
    "neutral": "#6B7280",       # 灰色
    "grid": "#E5E7EB",
    "bg": "#FFFFFF",
    "text": "#1F2937",
}

PALETTE = ["#2563EB", "#DC2626", "#059669", "#D97706", "#7C3AED",
           "#EC4899", "#06B6D4", "#84CC16"]


def setup_publication_style():
    """设置出版级图表样式"""
    plt.rcParams.update({
        "font.family": "Arial",
        "font.size": 10,
        "axes.titlesize": 12,
        "axes.titleweight": "bold",
        "axes.labelsize": 11,
        "axes.linewidth": 0.8,
        "axes.edgecolor": COLORS["text"],
        "axes.labelcolor": COLORS["text"],
        "xtick.labelsize": 9,
        "ytick.labelsize": 9,
        "xtick.color": COLORS["text"],
        "ytick.color": COLORS["text"],
        "legend.fontsize": 9,
        "legend.framealpha": 0.9,
        "figure.dpi": 150,
        "savefig.dpi": 300,
        "savefig.bbox": "tight",
        "savefig.pad_inches": 0.1,
        "lines.linewidth": 1.5,
        "lines.antialiased": True,
    })


setup_publication_style()


class Visualizer:
    """Publication-ready图表生成器"""

    def __init__(self, output_dir: str = "output/figures"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    # ── Kaplan-Meier生存曲线 ──────────────────────────────────────

    def plot_km_curve(self, km_results: list,
                      title: str = "Overall Survival",
                      xlabel: str = "Time (months)",
                      ylabel: str = "Survival Probability",
                      risk_table: Optional[pd.DataFrame] = None,
                      show_ci: bool = True,
                      show_risk_table: bool = True,
                      filename: str = "km_curve") -> str:
        """
        绘制Kaplan-Meier生存曲线

        Args:
            km_results: KMResult列表（来自SurvivalAnalyzer）
            title: 图表标题
            xlabel: X轴标签
            ylabel: Y轴标签
            risk_table: 风险表DataFrame
            show_ci: 是否显示置信区间
            show_risk_table: 是否显示风险表
            filename: 输出文件名

        Returns:
            保存的文件路径
        """
        n_groups = len(km_results)

        if show_risk_table and risk_table is not None:
            fig, (ax_main, ax_table) = plt.subplots(
                2, 1, figsize=(8, 6.5),
                gridspec_kw={"height_ratios": [4, 1], "hspace": 0.05},
            )
        else:
            fig, ax_main = plt.subplots(figsize=(8, 5))
            ax_table = None

        # 绘制KM曲线
        for i, kmr in enumerate(km_results):
            kmf = kmr.kmf
            color = PALETTE[i % len(PALETTE)]

            # 主曲线
            kmf.plot_survival_function(
                ax=ax_main, ci_show=False, color=color, linewidth=1.8,
            )

            # 置信区间
            if show_ci:
                kmf.plot_survival_function(
                    ax=ax_main, ci_show=True, ci_alpha=0.15, color=color, linewidth=0,
                )

            # 删失标记
            try:
                event_times = kmf.event_table
                censored = event_times[event_times["censored"] > 0]
                if not censored.empty:
                    surv_at_censor = kmf.survival_function_at_times(censored.index)
                    ax_main.scatter(
                        censored.index, surv_at_censor,
                        marker="|", s=30, color=color, alpha=0.5, linewidths=0.8,
                    )
            except Exception:
                pass

        # 美化主图
        ax_main.set_title(title, fontsize=13, fontweight="bold", pad=10)
        ax_main.set_ylabel(ylabel, fontsize=11)
        ax_main.set_ylim(0, 1.05)
        ax_main.yaxis.set_major_formatter(mticker.PercentFormatter(1.0))
        ax_main.grid(axis="y", alpha=0.3, color=COLORS["grid"], linewidth=0.5)
        ax_main.spines["top"].set_visible(False)
        ax_main.spines["right"].set_visible(False)

        # 图例
        labels = [kmr.group for kmr in km_results]
        ax_main.legend(labels, loc="best", frameon=True, framealpha=0.9,
                       edgecolor=COLORS["grid"], fontsize=9)

        # 风险表
        if ax_table is not None and risk_table is not None:
            ax_table.set_xlim(ax_main.get_xlim())
            ax_table.set_ylim(-0.5, len(risk_table) - 0.5)
            ax_table.invert_yaxis()

            # 去掉上方和右侧边框
            ax_table.spines["top"].set_visible(False)
            ax_table.spines["right"].set_visible(False)
            ax_table.spines["left"].set_visible(False)
            ax_table.tick_params(left=False)
            ax_table.set_xlabel(xlabel, fontsize=11)

            # 绘制风险表内容
            time_cols = [c for c in risk_table.columns if c != "Group"]
            time_points = [int(c.replace("mo", "")) for c in time_cols]

            ax_table.set_yticks(range(len(risk_table)))
            ax_table.set_yticklabels(risk_table["Group"], fontsize=9)

            for i, (_, row) in enumerate(risk_table.iterrows()):
                for j, t in enumerate(time_points):
                    ax_table.text(
                        t, i, str(int(row[f"{t}mo"])),
                        ha="center", va="center", fontsize=8,
                        color=PALETTE[i % len(PALETTE)],
                    )

            # 风险表标题
            ax_table.text(
                -0.02, -0.8, "No. at risk",
                transform=ax_table.transAxes, fontsize=9,
                fontweight="bold", ha="left",
            )
        else:
            ax_main.set_xlabel(xlabel, fontsize=11)

        # 保存
        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        pdf_path = self.output_dir / f"{filename}.pdf"
        fig.savefig(pdf_path, format="pdf")
        plt.close(fig)

        logger.info(f"KM曲线已保存: {filepath}")
        return str(filepath)

    # ── 森林图 ────────────────────────────────────────────────────

    def plot_forest(self, results: list,
                    title: str = "Forest Plot",
                    xlabel: str = "Hazard Ratio (95% CI)",
                    show_interaction_p: bool = False,
                    filename: str = "forest_plot") -> str:
        """
        绘制森林图（Cox回归结果/亚组分析）

        Args:
            results: CoxResult或亚组分析结果列表
            title: 图表标题
            xlabel: X轴标签
            show_interaction_p: 是否显示交互p值
            filename: 输出文件名

        Returns:
            保存的文件路径
        """
        n = len(results)
        fig, ax = plt.subplots(figsize=(9, max(4, n * 0.5 + 1.5)))

        y_positions = list(range(n, 0, -1))

        for i, r in enumerate(results):
            y = y_positions[i]

            # 判断结果类型
            if hasattr(r, "hr"):
                hr = r.hr
                lo = r.hr_lower
                hi = r.hr_upper
                label = r.variable
                p = r.p_value
            else:
                hr = r.get("hr", 1)
                lo = r.get("hr_lower", 0)
                hi = r.get("hr_upper", 2)
                label = r.get("level", r.get("variable", ""))
                p = r.get("p_value", 1)

            color = COLORS["primary"] if hr < 1 else COLORS["secondary"]

            # CI线
            ax.plot([lo, hi], [y, y], color=color, linewidth=1.8, solid_capstyle="round")

            # 点（大小与样本量成比例）
            n_pts = r.get("n", 100) if isinstance(r, dict) else 100
            marker_size = max(40, min(120, n_pts / 10))
            ax.scatter(hr, y, s=marker_size, color=color, zorder=5,
                       edgecolors="white", linewidths=0.5)

            # 右侧标注
            text = f"{hr:.2f} ({lo:.2f}-{hi:.2f})"
            sig = " *" if p < 0.05 else ""
            ax.text(ax.get_xlim()[1] if i == 0 else hi + 0.05, y,
                    f"{text}{sig}", va="center", fontsize=8.5, color=COLORS["text"])

        # 参考线
        ax.axvline(x=1, color=COLORS["neutral"], linestyle="--", linewidth=0.8, alpha=0.7)

        # Y轴标签
        labels = []
        for r in results:
            if hasattr(r, "variable"):
                labels.append(r.variable)
            else:
                labels.append(r.get("level", r.get("variable", "")))

        ax.set_yticks(y_positions)
        ax.set_yticklabels(labels, fontsize=9)
        ax.set_xlabel(xlabel, fontsize=11)
        ax.set_title(title, fontsize=13, fontweight="bold", pad=10)

        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(axis="x", alpha=0.3, color=COLORS["grid"], linewidth=0.5)

        # 标注Favors
        xlim = ax.get_xlim()
        ax.text(xlim[0], -0.5, "← Favors Treatment", fontsize=8,
                ha="left", color=COLORS["primary"], fontstyle="italic")
        ax.text(xlim[1], -0.5, "Favors Control →", fontsize=8,
                ha="right", color=COLORS["secondary"], fontstyle="italic")

        fig.tight_layout()
        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        pdf_path = self.output_dir / f"{filename}.pdf"
        fig.savefig(pdf_path, format="pdf")
        plt.close(fig)

        logger.info(f"森林图已保存: {filepath}")
        return str(filepath)

    # ── 亚组分析森林图 ────────────────────────────────────────────

    def plot_subgroup_forest(self, subgroup_results: List[Dict],
                             title: str = "Subgroup Analysis",
                             filename: str = "subgroup_forest") -> str:
        """
        绘制亚组分析森林图（带分组标题）

        Args:
            subgroup_results: subgroup_analysis()的输出
            title: 图表标题
            filename: 输出文件名

        Returns:
            保存的文件路径
        """
        if not subgroup_results:
            logger.warning("无亚组分析结果")
            return ""

        n = len(subgroup_results) + len(set(r["subgroup"] for r in subgroup_results))
        fig, ax = plt.subplots(figsize=(10, max(5, n * 0.55 + 1)))

        y = n
        y_positions = []
        labels = []
        prev_subgroup = ""

        for r in subgroup_results:
            if r["subgroup"] != prev_subgroup:
                # 添加亚组标题
                labels.append(f"  {r['subgroup']}")
                y_positions.append(y)
                y -= 1
                prev_subgroup = r["subgroup"]

            # 数据行
            hr = r["hr"]
            lo = r["hr_lower"]
            hi = r["hr_upper"]
            p = r["p_value"]

            color = COLORS["primary"] if hr < 1 else COLORS["secondary"]

            ax.plot([lo, hi], [y, y], color=color, linewidth=1.8)
            marker_size = max(40, min(120, r["n"] / 10))
            ax.scatter(hr, y, s=marker_size, color=color, zorder=5,
                       edgecolors="white", linewidths=0.5)

            sig = " *" if p < 0.05 else ""
            label_text = (
                f"  {r['level']} (n={r['n']})"
                f"    {hr:.2f} ({lo:.2f}-{hi:.2f}) p={p:.3f}{sig}"
            )
            labels.append(label_text)
            y_positions.append(y)
            y -= 1

        ax.axvline(x=1, color=COLORS["neutral"], linestyle="--", linewidth=0.8, alpha=0.7)

        ax.set_yticks(y_positions)
        ax.set_yticklabels(labels, fontsize=8.5, fontfamily="monospace")
        ax.set_xlabel("Hazard Ratio (95% CI)", fontsize=11)
        ax.set_title(title, fontsize=13, fontweight="bold", pad=10)

        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(axis="x", alpha=0.3, color=COLORS["grid"], linewidth=0.5)

        fig.tight_layout()
        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        pdf_path = self.output_dir / f"{filename}.pdf"
        fig.savefig(pdf_path, format="pdf")
        plt.close(fig)

        logger.info(f"亚组森林图已保存: {filepath}")
        return str(filepath)

    # ── 趋势图 ────────────────────────────────────────────────────

    def plot_incidence_trend(self, trend_data: pd.DataFrame,
                             title: str = "Cancer Incidence Trend",
                             xlabel: str = "Year",
                             ylabel: str = "Age-Standardized Rate (per 100,000)",
                             filename: str = "incidence_trend") -> str:
        """
        绘制发病率趋势图

        Args:
            trend_data: DataFrame with columns [year, rate, rate_lower, rate_upper, group?]
            title: 图表标题
            filename: 输出文件名

        Returns:
            保存的文件路径
        """
        fig, ax = plt.subplots(figsize=(9, 5.5))

        if "group" in trend_data.columns:
            for i, (group_name, group_df) in enumerate(trend_data.groupby("group")):
                color = PALETTE[i % len(PALETTE)]
                ax.plot(group_df["year"], group_df["rate"],
                        color=color, linewidth=1.8, label=group_name, marker="o", markersize=4)
                if "rate_lower" in group_df.columns:
                    ax.fill_between(
                        group_df["year"], group_df["rate_lower"], group_df["rate_upper"],
                        alpha=0.15, color=color,
                    )
            ax.legend(loc="best", frameon=True, framealpha=0.9)
        else:
            ax.plot(trend_data["year"], trend_data["rate"],
                    color=COLORS["primary"], linewidth=1.8, marker="o", markersize=4)
            if "rate_lower" in trend_data.columns:
                ax.fill_between(
                    trend_data["year"], trend_data["rate_lower"], trend_data["rate_upper"],
                    alpha=0.15, color=COLORS["primary"],
                )

        # Joinpoint标注
        if "joinpoint" in trend_data.columns:
            for jp in trend_data[trend_data["joinpoint"]]["year"]:
                ax.axvline(x=jp, color=COLORS["quaternary"],
                           linestyle=":", linewidth=1, alpha=0.6)

        ax.set_title(title, fontsize=13, fontweight="bold", pad=10)
        ax.set_xlabel(xlabel, fontsize=11)
        ax.set_ylabel(ylabel, fontsize=11)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(axis="both", alpha=0.3, color=COLORS["grid"], linewidth=0.5)

        # APC标注
        if "apc" in trend_data.columns:
            latest = trend_data.iloc[-1]
            apc_val = latest.get("apc", 0)
            sign = "+" if apc_val > 0 else ""
            ax.text(0.98, 0.02, f"APC: {sign}{apc_val:.1f}%",
                    transform=ax.transAxes, fontsize=10, ha="right",
                    color=COLORS["text"], fontstyle="italic",
                    bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.8))

        fig.tight_layout()
        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        pdf_path = self.output_dir / f"{filename}.pdf"
        fig.savefig(pdf_path, format="pdf")
        plt.close(fig)

        logger.info(f"趋势图已保存: {filepath}")
        return str(filepath)

    # ── ROC曲线 ───────────────────────────────────────────────────

    def plot_roc_curves(self, fpr_list: List[np.ndarray],
                        tpr_list: List[np.ndarray],
                        auc_values: List[float],
                        labels: Optional[List[str]] = None,
                        title: str = "ROC Curves",
                        filename: str = "roc_curves") -> str:
        """绘制多条ROC曲线"""
        fig, ax = plt.subplots(figsize=(7, 6.5))

        for i, (fpr, tpr, auc_val) in enumerate(zip(fpr_list, tpr_list, auc_values)):
            color = PALETTE[i % len(PALETTE)]
            label = labels[i] if labels else f"Model {i+1}"
            ax.plot(fpr, tpr, color=color, linewidth=1.8,
                    label=f"{label} (AUC={auc_val:.3f})")

        # 对角线
        ax.plot([0, 1], [0, 1], color=COLORS["neutral"], linestyle="--",
                linewidth=0.8, alpha=0.5)

        ax.set_title(title, fontsize=13, fontweight="bold", pad=10)
        ax.set_xlabel("1 - Specificity", fontsize=11)
        ax.set_ylabel("Sensitivity", fontsize=11)
        ax.set_xlim(-0.02, 1.02)
        ax.set_ylim(-0.02, 1.02)
        ax.legend(loc="lower right", frameon=True, framealpha=0.9)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(alpha=0.3, color=COLORS["grid"], linewidth=0.5)

        fig.tight_layout()
        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        pdf_path = self.output_dir / f"{filename}.pdf"
        fig.savefig(pdf_path, format="pdf")
        plt.close(fig)

        logger.info(f"ROC曲线已保存: {filepath}")
        return str(filepath)

    # ── 基线特征表 ────────────────────────────────────────────────

    def plot_baseline_table(self, df: pd.DataFrame,
                            group_col: Optional[str] = None,
                            vars_config: Optional[Dict] = None,
                            title: str = "Baseline Characteristics",
                            filename: str = "baseline_table") -> str:
        """
        绘制基线特征表（Table 1）

        Args:
            df: 数据
            group_col: 分组变量
            vars_config: 变量配置 {col: {"type": "categorical"/"continuous", "label": "..."}}
            title: 标题
            filename: 文件名
        """
        if vars_config is None:
            # 自动检测
            vars_config = {}
            for col in df.columns:
                if df[col].dtype in ["object", "category"]:
                    vars_config[col] = {"type": "categorical", "label": col}
                elif df[col].dtype in ["int64", "float64"] and df[col].nunique() > 10:
                    vars_config[col] = {"type": "continuous", "label": col}

        rows = []
        for var, config in vars_config.items():
            if var not in df.columns:
                continue
            if group_col:
                groups = sorted(df[group_col].dropna().unique())
                for g in groups:
                    sub = df[df[group_col] == g]
                    rows.append(self._summarize_var(sub, var, config, str(g)))
            else:
                rows.append(self._summarize_var(df, var, config, "Overall"))

        if not rows:
            return ""

        result_df = pd.DataFrame(rows)

        # 绘制为表格图
        fig, ax = plt.subplots(figsize=(max(10, len(result_df.columns) * 2),
                                         max(4, len(result_df) * 0.35 + 1)))
        ax.axis("off")

        table = ax.table(
            cellText=result_df.values,
            colLabels=result_df.columns,
            cellLoc="center",
            loc="center",
        )
        table.auto_set_font_size(False)
        table.set_fontsize(9)
        table.scale(1, 1.4)

        # 表头样式
        for j in range(len(result_df.columns)):
            table[0, j].set_facecolor(COLORS["primary"])
            table[0, j].set_text_props(color="white", fontweight="bold")

        # 交替行颜色
        for i in range(1, len(result_df) + 1):
            for j in range(len(result_df.columns)):
                if i % 2 == 0:
                    table[i, j].set_facecolor("#F3F4F6")

        ax.set_title(title, fontsize=13, fontweight="bold", pad=15)
        fig.tight_layout()

        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        plt.close(fig)

        # 同时输出CSV
        csv_path = self.output_dir / f"{filename}.csv"
        result_df.to_csv(csv_path, index=False)

        logger.info(f"基线特征表已保存: {filepath}")
        return str(filepath)

    @staticmethod
    def _summarize_var(df, var, config, group_name):
        """单变量统计摘要"""
        if config["type"] == "continuous":
            vals = pd.to_numeric(df[var], errors="coerce").dropna()
            return {
                "Variable": config.get("label", var),
                "Group": group_name,
                "N": len(vals),
                "Summary": f"{vals.mean():.1f} ± {vals.std():.1f}",
                "Median": f"{vals.median():.1f} ({vals.quantile(0.25):.1f}-{vals.quantile(0.75):.1f})",
            }
        else:
            vals = df[var].dropna()
            counts = vals.value_counts()
            top = counts.index[0] if len(counts) > 0 else ""
            pct = counts.iloc[0] / len(vals) * 100 if len(counts) > 0 else 0
            return {
                "Variable": config.get("label", var),
                "Group": group_name,
                "N": len(vals),
                "Summary": f"{top}: {counts.iloc[0]} ({pct:.1f}%)" if len(counts) > 0 else "",
                "Median": "",
            }

    # ── 校准曲线 ──────────────────────────────────────────────────

    def plot_calibration(self, predicted: np.ndarray,
                         observed: np.ndarray,
                         title: str = "Calibration Curve",
                         filename: str = "calibration") -> str:
        """绘制校准曲线"""
        fig, ax = plt.subplots(figsize=(7, 6.5))

        # 分箱
        n_bins = min(10, len(predicted) // 20)
        bins = np.linspace(0, 1, n_bins + 1)
        bin_centers = []
        bin_observed = []
        bin_predicted = []

        for i in range(n_bins):
            mask = (predicted >= bins[i]) & (predicted < bins[i + 1])
            if mask.sum() > 0:
                bin_centers.append((bins[i] + bins[i + 1]) / 2)
                bin_observed.append(observed[mask].mean())
                bin_predicted.append(predicted[mask].mean())

        ax.plot(bin_predicted, bin_observed, "o-", color=COLORS["primary"],
                linewidth=1.8, markersize=6, label="Model")
        ax.plot([0, 1], [0, 1], "--", color=COLORS["neutral"],
                linewidth=0.8, alpha=0.5, label="Ideal")

        ax.set_title(title, fontsize=13, fontweight="bold", pad=10)
        ax.set_xlabel("Predicted Probability", fontsize=11)
        ax.set_ylabel("Observed Probability", fontsize=11)
        ax.legend(loc="best", frameon=True)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(alpha=0.3, color=COLORS["grid"], linewidth=0.5)

        fig.tight_layout()
        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        plt.close(fig)

        logger.info(f"校准曲线已保存: {filepath}")
        return str(filepath)

    # ── 决策曲线分析 (DCA) ────────────────────────────────────────

    def plot_dca(self, thresholds: np.ndarray,
                 net_benefits: Dict[str, np.ndarray],
                 title: str = "Decision Curve Analysis",
                 filename: str = "dca") -> str:
        """绘制决策曲线"""
        fig, ax = plt.subplots(figsize=(8, 5.5))

        for i, (label, nb) in enumerate(net_benefits.items()):
            color = PALETTE[i % len(PALETTE)]
            ax.plot(thresholds, nb, color=color, linewidth=1.8, label=label)

        # Treat All / Treat None
        prevalence = net_benefits.get("prevalence", 0.5)
        if isinstance(prevalence, (int, float)):
            nb_all = prevalence - (1 - prevalence) * thresholds / (1 - thresholds)
            nb_none = np.zeros_like(thresholds)
            ax.plot(thresholds, nb_all, "--", color=COLORS["neutral"],
                    linewidth=0.8, label="Treat All")
            ax.plot(thresholds, nb_none, ":", color=COLORS["neutral"],
                    linewidth=0.8, label="Treat None")

        ax.set_title(title, fontsize=13, fontweight="bold", pad=10)
        ax.set_xlabel("Threshold Probability", fontsize=11)
        ax.set_ylabel("Net Benefit", fontsize=11)
        ax.set_xlim(0, 1)
        ax.legend(loc="best", frameon=True)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(alpha=0.3, color=COLORS["grid"], linewidth=0.5)

        fig.tight_layout()
        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        plt.close(fig)

        logger.info(f"DCA图已保存: {filepath}")
        return str(filepath)

    # ── 流程图（STROBE） ──────────────────────────────────────────

    def plot_strobe_flowchart(self, counts: Dict[str, int],
                              title: str = "Study Flowchart (STROBE)",
                              filename: str = "strobe_flowchart") -> str:
        """
        绘制STROBE研究流程图

        Args:
            counts: 各步骤样本量 {
                "total": N, "excluded": n, "malignant": n,
                "complete": n, "final": n
            }
        """
        fig, ax = plt.subplots(figsize=(8, 10))
        ax.axis("off")

        steps = [
            ("SEER Database", counts.get("total", 0), "lightblue"),
            ("Excluded", counts.get("excluded", 0), "lightyellow"),
            ("Malignant Tumors", counts.get("malignant", 0), "lightblue"),
            ("Complete Data", counts.get("complete", 0), "lightblue"),
            ("Final Analysis", counts.get("final", 0), "lightgreen"),
        ]

        box_width = 0.5
        box_height = 0.12
        y_start = 0.85

        for i, (label, n, color) in enumerate(steps):
            y = y_start - i * 0.18
            rect = FancyBboxPatch(
                (0.25, y), box_width, box_height,
                boxstyle="round,pad=0.01",
                facecolor=color, edgecolor=COLORS["text"], linewidth=1,
            )
            ax.add_patch(rect)
            ax.text(0.5, y + box_height / 2, f"{label}\n(n={n:,})",
                    ha="center", va="center", fontsize=10, fontweight="bold")

            # 箭头
            if i < len(steps) - 1:
                arrow_y = y - 0.01
                ax.annotate("", xy=(0.5, arrow_y - 0.04),
                            xytext=(0.5, arrow_y),
                            arrowprops=dict(arrowstyle="->", color=COLORS["text"], lw=1.5))

        ax.set_title(title, fontsize=14, fontweight="bold", pad=20)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)

        fig.tight_layout()
        filepath = self.output_dir / f"{filename}.tiff"
        fig.savefig(filepath, dpi=300, format="tiff")
        plt.close(fig)

        logger.info(f"STROBE流程图已保存: {filepath}")
        return str(filepath)
