"""
SEER数据预处理引擎

处理SEER*Stat导出的原始数据，进行变量recode、缺失值处理、
变量派生，输出可直接用于统计分析的干净数据集。

支持的SEER导出格式：
  - CSV（SEER*Stat case listing导出）
  - SAS (.sas7bdat)
  - 固定宽度文本文件
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


# ── SEER标准编码映射 ──────────────────────────────────────────────

SEER_RACE_MAP = {
    1: "White",
    2: "Black",
    3: "AIAN",        # American Indian/Alaska Native
    4: "API",          # Asian/Pacific Islander
    5: "Other/Unknown",
    9: "Unknown",
}

SEER_SEX_MAP = {
    1: "Male",
    2: "Female",
    9: "Unknown",
}

SEER_STAGE_MAP = {
    0: "In situ",
    1: "Localized",
    2: "Regional",
    3: "Distant",
    4: "Unstaged",
    9: "Unknown",
}

SEER_GRADE_MAP = {
    1: "Well differentiated",
    2: "Moderately differentiated",
    3: "Poorly differentiated",
    4: "Undifferentiated",
    9: "Unknown",
}

SEER_BEHAVIOR_MAP = {
    0: "Benign",
    1: "Borderline",
    2: "In situ",
    3: "Malignant",
}

SEER_VITAL_MAP = {
    1: "Alive",
    0: "Dead",
}

# ICD-O-3 topography 大类（主要癌种）
ICD3_SITE_GROUPS = {
    "Breast": [50],
    "Lung": [34],
    "Colorectal": [18, 19, 20],
    "Prostate": [61],
    "Stomach": [16],
    "Liver": [22],
    "Pancreas": [25],
    "Thyroid": [73],
    "Kidney": [64],
    "Bladder": [67],
    "Ovary": [56],
    "Cervix": [53],
    "Endometrium": [54],
    "Melanoma": [44],
    "NHL": [42],
    "Leukemia": [42],
    "Brain": [70, 71],
    "Esophagus": [15],
    "Head and Neck": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
}


@dataclass
class PreprocessReport:
    """预处理报告"""
    original_rows: int = 0
    processed_rows: int = 0
    removed_rows: int = 0
    variables_recoded: List[str] = field(default_factory=list)
    variables_derived: List[str] = field(default_factory=list)
    missing_summary: Dict[str, float] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)


class SEERPreprocessor:
    """SEER数据预处理器"""

    def __init__(self):
        self.report = PreprocessReport()
        self._df: Optional[pd.DataFrame] = None

    # ── 加载数据 ──────────────────────────────────────────────────

    def load(self, filepath: str) -> pd.DataFrame:
        """加载SEER数据文件，自动识别格式"""
        p = Path(filepath)
        if not p.exists():
            raise FileNotFoundError(f"文件不存在: {filepath}")

        ext = p.suffix.lower()
        if ext == ".csv":
            df = pd.read_csv(p, low_memory=False)
        elif ext == ".sas7bdat":
            df = pd.read_sas(p)
        elif ext in (".tsv", ".txt"):
            df = pd.read_csv(p, sep="\t", low_memory=False)
        else:
            # 尝试CSV
            df = pd.read_csv(p, low_memory=False)

        self.report.original_rows = len(df)
        logger.info(f"加载数据: {len(df)} 行 x {len(df.columns)} 列")
        self._df = df
        return df

    def load_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """直接传入DataFrame"""
        self.report.original_rows = len(df)
        self._df = df.copy()
        return self._df

    # ── 列名标准化 ────────────────────────────────────────────────

    def standardize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """将列名统一为大写，去除空格"""
        df.columns = [c.strip().upper().replace(" ", "_") for c in df.columns]
        return df

    # ── 变量识别 ──────────────────────────────────────────────────

    def identify_variables(self, df: pd.DataFrame) -> Dict[str, List[str]]:
        """自动识别数据中的SEER变量类别"""
        cols = set(df.columns)
        identified = {}

        mapping = {
            "demographics": ["AGE_DX", "SEX", "RACE", "MAR_STAT", "AGE_REC"],
            "tumor": ["PRIMSITE", "HISTOLOGY", "BEHAVIOR", "GRADE", "TUMOR_SIZE",
                       "HISTO3", "ICDO3", "CS_SITE", "LATERAL"],
            "staging": ["AJCC_T", "AJCC_N", "AJCC_M", "TNM_STAGE",
                         "CS_STAGE", "SEER_HIST_STG", "HST_STGA"],
            "treatment": ["RX_SUMM", "RAD_SURG_SEQ", "CHEMO", "RADIATION",
                           "SURG_PRIM", "RX_SUMM_SUR"],
            "outcome": ["SURV_MONTHS", "VITAL_STAT", "COD", "SEER_CAUSE",
                         "SRV_TIME_MON", "STAT_REC"],
            "time": ["YEAR_DX", "YEAR_OF_DIAGNOSIS", "DATACMPT", "DATE_DX"],
        }

        for category, var_list in mapping.items():
            found = [v for v in var_list if v in cols]
            if found:
                identified[category] = found

        return identified

    # ── 变量Recode ────────────────────────────────────────────────

    def recode_sex(self, df: pd.DataFrame) -> pd.DataFrame:
        """性别变量recode"""
        col = self._find_col(df, ["SEX"])
        if col:
            df["SEX_LABEL"] = df[col].map(SEER_SEX_MAP).fillna("Unknown")
            df["SEX_BINARY"] = df[col].map({1: 0, 2: 1}).fillna(np.nan)
            self.report.variables_recoded.append("SEX")
        return df

    def recode_race(self, df: pd.DataFrame) -> pd.DataFrame:
        """种族变量recode"""
        col = self._find_col(df, ["RACE"])
        if col:
            df["RACE_LABEL"] = df[col].map(SEER_RACE_MAP).fillna("Unknown")
            # 二分类：White vs Non-White
            df["RACE_BINARY"] = df[col].apply(
                lambda x: "White" if x == 1 else ("Non-White" if x in [2, 3, 4] else "Unknown")
            )
            self.report.variables_recoded.append("RACE")
        return df

    def recode_stage(self, df: pd.DataFrame) -> pd.DataFrame:
        """分期变量recode"""
        col = self._find_col(df, ["HST_STGA", "CS_STAGE", "TNM_STAGE", "SEER_HIST_STG"])
        if col:
            df["STAGE_LABEL"] = df[col].map(SEER_STAGE_MAP).fillna("Unknown")
            # 有序编码
            stage_order = {"In situ": 0, "Localized": 1, "Regional": 2, "Distant": 3, "Unknown": np.nan}
            df["STAGE_ORDERED"] = df["STAGE_LABEL"].map(stage_order)
            self.report.variables_recoded.append("STAGE")
        return df

    def recode_grade(self, df: pd.DataFrame) -> pd.DataFrame:
        """分化程度recode"""
        col = self._find_col(df, ["GRADE"])
        if col:
            df["GRADE_LABEL"] = df[col].map(SEER_GRADE_MAP).fillna("Unknown")
            self.report.variables_recoded.append("GRADE")
        return df

    def recode_behavior(self, df: pd.DataFrame) -> pd.DataFrame:
        """行为编码recode"""
        col = self._find_col(df, ["BEHAVIOR"])
        if col:
            df["BEHAVIOR_LABEL"] = df[col].map(SEER_BEHAVIOR_MAP).fillna("Unknown")
            self.report.variables_recoded.append("BEHAVIOR")
        return df

    def recode_vital(self, df: pd.DataFrame) -> pd.DataFrame:
        """生存状态recode → 0/1 事件指示"""
        col = self._find_col(df, ["VITAL_STAT", "STAT_REC"])
        if col:
            # SEER: 1=Alive, 0=Dead → 我们需要 event=1 表示死亡
            df["EVENT"] = df[col].apply(lambda x: 1 if x == 0 else (0 if x == 1 else np.nan))
            df["VITAL_LABEL"] = df[col].map(SEER_VITAL_MAP).fillna("Unknown")
            self.report.variables_recoded.append("VITAL_STAT")
        return df

    def recode_survival_months(self, df: pd.DataFrame) -> pd.DataFrame:
        """生存时间处理"""
        col = self._find_col(df, ["SURV_MONTHS", "SRV_TIME_MON"])
        if col:
            df["SURV_TIME"] = pd.to_numeric(df[col], errors="coerce")
            # 将负值和0替换为NaN
            df.loc[df["SURV_TIME"] <= 0, "SURV_TIME"] = np.nan
            self.report.variables_recoded.append("SURV_MONTHS")
        return df

    def recode_age(self, df: pd.DataFrame) -> pd.DataFrame:
        """年龄变量处理"""
        col = self._find_col(df, ["AGE_DX"])
        if col:
            df["AGE"] = pd.to_numeric(df[col], errors="coerce")
            # 年龄分组（WHO标准）
            bins = [0, 44, 54, 64, 74, 84, 200]
            labels = ["<45", "45-54", "55-64", "65-74", "75-84", "85+"]
            df["AGE_GROUP"] = pd.cut(df["AGE"], bins=bins, labels=labels, right=True)
            self.report.variables_recoded.append("AGE")
        return df

    def recode_year(self, df: pd.DataFrame) -> pd.DataFrame:
        """诊断年份处理"""
        col = self._find_col(df, ["YEAR_DX", "YEAR_OF_DIAGNOSIS"])
        if col:
            df["YEAR"] = pd.to_numeric(df[col], errors="coerce")
            # 时期分组
            bins = [0, 2005, 2010, 2015, 2020, 2030]
            labels = ["2000-2005", "2006-2010", "2011-2015", "2016-2020", "2021+"]
            df["PERIOD"] = pd.cut(df["YEAR"], bins=bins, labels=labels, right=False)
            self.report.variables_recoded.append("YEAR")
        return df

    def recode_treatment(self, df: pd.DataFrame) -> pd.DataFrame:
        """治疗变量recode"""
        # 手术
        surg_col = self._find_col(df, ["SURG_PRIM", "RX_SUMM_SUR"])
        if surg_col:
            df["SURGERY"] = df[surg_col].apply(lambda x: 1 if x and x > 0 else 0)
            self.report.variables_recoded.append("SURGERY")

        # 放疗
        rad_col = self._find_col(df, ["RADIATION"])
        if rad_col:
            df["RADIATION_BINARY"] = df[rad_col].apply(lambda x: 1 if x and x > 0 else 0)
            self.report.variables_recoded.append("RADIATION")

        # 化疗
        chemo_col = self._find_col(df, ["CHEMO"])
        if chemo_col:
            df["CHEMO_BINARY"] = df[chemo_col].apply(lambda x: 1 if x and x > 0 else 0)
            self.report.variables_recoded.append("CHEMO")

        return df

    # ── 变量派生 ──────────────────────────────────────────────────

    def derive_cancer_site(self, df: pd.DataFrame) -> pd.DataFrame:
        """从ICD-O-3编码派生癌种"""
        col = self._find_col(df, ["PRIMSITE", "CS_SITE"])
        if col:
            df["SITE_CODE"] = pd.to_numeric(df[col], errors="coerce")
            # 反向映射
            code_to_site = {}
            for site, codes in ICD3_SITE_GROUPS.items():
                for code in codes:
                    code_to_site[code] = site
            df["CANCER_SITE"] = df["SITE_CODE"].map(code_to_site).fillna("Other")
            self.report.variables_derived.append("CANCER_SITE")
        return df

    def derive_tumor_size_group(self, df: pd.DataFrame) -> pd.DataFrame:
        """肿瘤大小分组"""
        col = self._find_col(df, ["TUMOR_SIZE", "EOD_TUMOR_SIZE"])
        if col:
            df["TUMOR_SIZE_NUM"] = pd.to_numeric(df[col], errors="coerce")
            bins = [0, 10, 20, 50, 100, 999]
            labels = ["<=1cm", "1-2cm", "2-5cm", "5-10cm", ">10cm"]
            df["TUMOR_SIZE_GROUP"] = pd.cut(
                df["TUMOR_SIZE_NUM"], bins=bins, labels=labels, right=True
            )
            self.report.variables_derived.append("TUMOR_SIZE_GROUP")
        return df

    def derive_composite_stage(self, df: pd.DataFrame) -> pd.DataFrame:
        """综合分期（简化版）"""
        has_t = self._find_col(df, ["AJCC_T"])
        has_n = self._find_col(df, ["AJCC_N"])
        has_m = self._find_col(df, ["AJCC_M"])

        if has_t and has_n and has_m:
            def composite_stage(row):
                t = row.get(has_t, "X")
                n = row.get(has_n, "X")
                m = row.get(has_m, "X")
                if m and str(m).startswith("1"):
                    return "IV"
                if n and str(n).startswith("1"):
                    return "III"
                if t and str(t) in ["3", "4", "T3", "T4"]:
                    return "III"
                if t and str(t) in ["1", "2", "T1", "T2"]:
                    return "I-II"
                return "Unknown"

            df["COMPOSITE_STAGE"] = df.apply(composite_stage, axis=1)
            self.report.variables_derived.append("COMPOSITE_STAGE")
        return df

    # ── 缺失值处理 ────────────────────────────────────────────────

    def handle_missing(self, df: pd.DataFrame, threshold: float = 0.5) -> pd.DataFrame:
        """
        处理缺失值
        - 删除缺失率超过threshold的列
        - 对关键变量用合理默认值填充
        """
        # 计算缺失率
        missing_rate = df.isnull().mean()
        self.report.missing_summary = missing_rate[missing_rate > 0].to_dict()

        # 删除高缺失率列（非关键变量）
        critical_cols = {"SURV_TIME", "EVENT", "AGE", "SEX", "RACE", "YEAR",
                         "STAGE_ORDERED", "CANCER_SITE", "VITAL_LABEL"}
        drop_cols = [c for c in df.columns
                     if missing_rate.get(c, 0) > threshold and c not in critical_cols]
        if drop_cols:
            df = df.drop(columns=drop_cols)
            self.report.warnings.append(f"删除高缺失率列: {drop_cols}")

        # 删除没有生存时间或事件状态的行
        if "SURV_TIME" in df.columns and "EVENT" in df.columns:
            before = len(df)
            df = df.dropna(subset=["SURV_TIME", "EVENT"])
            removed = before - len(df)
            if removed > 0:
                self.report.warnings.append(f"删除 {removed} 行缺失生存数据")

        return df

    # ── 过滤 ──────────────────────────────────────────────────────

    def filter_malignant_only(self, df: pd.DataFrame) -> pd.DataFrame:
        """仅保留恶性肿瘤"""
        if "BEHAVIOR_LABEL" in df.columns:
            df = df[df["BEHAVIOR_LABEL"] == "Malignant"]
        elif "BEHAVIOR" in df.columns:
            df = df[df["BEHAVIOR"] == 3]
        return df

    def filter_by_cancer_site(self, df: pd.DataFrame, site: str) -> pd.DataFrame:
        """按癌种过滤"""
        if "CANCER_SITE" in df.columns:
            df = df[df["CANCER_SITE"] == site]
        return df

    def filter_by_year_range(self, df: pd.DataFrame,
                              start_year: int, end_year: int) -> pd.DataFrame:
        """按年份范围过滤"""
        if "YEAR" in df.columns:
            df = df[(df["YEAR"] >= start_year) & (df["YEAR"] <= end_year)]
        return df

    # ── 主流程 ────────────────────────────────────────────────────

    def preprocess(self, df: pd.DataFrame,
                   cancer_site: Optional[str] = None,
                   malignant_only: bool = True,
                   year_range: Optional[Tuple[int, int]] = None) -> Tuple[pd.DataFrame, PreprocessReport]:
        """
        完整预处理流程

        Args:
            df: 原始SEER数据
            cancer_site: 指定癌种（如 "Breast", "Lung"）
            malignant_only: 是否仅保留恶性肿瘤
            year_range: 年份范围 (start, end)

        Returns:
            (处理后的DataFrame, 预处理报告)
        """
        self.report = PreprocessReport()
        df = df.copy()

        # 1. 标准化列名
        df = self.standardize_columns(df)
        logger.info(f"列名标准化完成，共 {len(df.columns)} 列")

        # 2. 变量recode
        for recode_fn in [
            self.recode_sex, self.recode_race, self.recode_stage,
            self.recode_grade, self.recode_behavior, self.recode_vital,
            self.recode_survival_months, self.recode_age, self.recode_year,
            self.recode_treatment,
        ]:
            df = recode_fn(df)

        # 3. 变量派生
        df = self.derive_cancer_site(df)
        df = self.derive_tumor_size_group(df)
        df = self.derive_composite_stage(df)

        # 4. 过滤
        if malignant_only:
            df = self.filter_malignant_only(df)
        if cancer_site:
            df = self.filter_by_cancer_site(df, cancer_site)
        if year_range:
            df = self.filter_by_year_range(df, *year_range)

        # 5. 缺失值处理
        df = self.handle_missing(df)

        # 6. 重置索引
        df = df.reset_index(drop=True)

        self.report.processed_rows = len(df)
        self.report.removed_rows = self.report.original_rows - self.report.processed_rows

        logger.info(
            f"预处理完成: {self.report.original_rows} → {self.report.processed_rows} 行 "
            f"(移除 {self.report.removed_rows})"
        )

        return df, self.report

    # ── 工具方法 ──────────────────────────────────────────────────

    @staticmethod
    def _find_col(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
        """在DataFrame中查找第一个匹配的列"""
        for c in candidates:
            if c in df.columns:
                return c
        return None

    def get_analysis_ready_info(self, df: pd.DataFrame) -> Dict:
        """返回可用于分析的数据概况"""
        info = {
            "n_rows": len(df),
            "n_cols": len(df.columns),
            "columns": list(df.columns),
            "variable_groups": self.identify_variables(df),
        }

        # 生存分析就绪？
        info["survival_ready"] = (
            "SURV_TIME" in df.columns and "EVENT" in df.columns
        )

        # 有癌种信息？
        info["has_cancer_site"] = "CANCER_SITE" in df.columns

        # 有分期信息？
        info["has_stage"] = any(c in df.columns for c in ["STAGE_LABEL", "COMPOSITE_STAGE"])

        # 有治疗信息？
        info["has_treatment"] = any(c in df.columns for c in ["SURGERY", "RADIATION_BINARY", "CHEMO_BINARY"])

        # 年份范围
        if "YEAR" in df.columns:
            info["year_range"] = [int(df["YEAR"].min()), int(df["YEAR"].max())]

        return info
