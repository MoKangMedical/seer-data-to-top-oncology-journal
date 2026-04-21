"""
SEER数据分析引擎 — 从SEER数据到可投稿论文

用户视角：临床研究者上传SEER CSV，72小时内拿到可投稿的分析结果
"""

import os
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """分析结果"""
    study_type: str           # cohort/case-control/cross-sectional
    sample_size: int
    outcomes: List[str]
    covariates: List[str]
    key_findings: List[str]
    tables: List[Dict]
    figures: List[str]
    statistical_methods: List[str]
    conclusion: str


class SEERAnalyzer:
    """SEER数据分析引擎"""
    
    # SEER常见变量
    SEER_VARIABLES = {
        "demographics": ["AGE_DX", "SEX", "RACE", "MAR_STAT"],
        "tumor": ["PRIMSITE", "HISTOLOGY", "BEHAVIOR", "GRADE", "TUMOR_SIZE"],
        "staging": ["AJCC_T", "AJCC_N", "AJCC_M", "TNM_STAGE"],
        "treatment": ["RX_SUMM", "RAD_SURG_SEQ", "CHEMO", "RADIATION"],
        "outcome": ["SURV_MONTHS", "VITAL_STAT", "COD", "SEER_CAUSE"],
    }
    
    def __init__(self, data_dir: str = "data", output_dir: str = "output"):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def load_data(self, filename: str) -> Dict:
        """加载SEER数据文件"""
        filepath = self.data_dir / filename
        if not filepath.exists():
            return {"error": f"文件不存在: {filepath}"}
        
        try:
            import pandas as pd
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath, low_memory=False)
            elif filename.endswith('.sas7bdat'):
                df = pd.read_sas(filepath)
            else:
                df = pd.read_csv(filepath, sep='\t', low_memory=False)
            
            return {
                "rows": len(df),
                "columns": list(df.columns),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "sample": df.head(3).to_dict('records'),
                "missing": df.isnull().sum().to_dict(),
            }
        except Exception as e:
            return {"error": str(e)}
    
    def suggest_analysis(self, columns: List[str]) -> Dict:
        """根据数据列推荐分析方案"""
        suggestions = []
        
        col_upper = [c.upper() for c in columns]
        
        # 生存分析
        if any(v in col_upper for v in ["SURV_MONTHS", "SURVIVAL"]):
            suggestions.append({
                "type": "survival",
                "name": "生存分析",
                "methods": ["Kaplan-Meier", "Cox PH", "竞争风险"],
                "output": "生存曲线+HR+森林图"
            })
        
        # 趋势分析
        if any(v in col_upper for v in ["YEAR_DX", "YEAR_OF_DIAGNOSIS"]):
            suggestions.append({
                "type": "trend",
                "name": "发病趋势分析",
                "methods": ["Joinpoint回归", "APC分析"],
                "output": "趋势图+年度变化率"
            })
        
        # 亚组分析
        if any(v in col_upper for v in ["AGE_DX", "SEX", "RACE"]):
            suggestions.append({
                "type": "subgroup",
                "name": "亚组分析",
                "methods": ["分层分析", "交互效应检验"],
                "output": "森林图+亚组HR"
            })
        
        # 预后因素
        if any(v in col_upper for v in ["TUMOR_SIZE", "GRADE", "AJCC_T", "TNM_STAGE"]):
            suggestions.append({
                "type": "prognostic",
                "name": "预后因素分析",
                "methods": ["单因素+多因素Cox", "Nomogram"],
                "output": "列线图+校准曲线+C-index"
            })
        
        return {
            "suggestions": suggestions,
            "recommended_journal": self._suggest_journal(suggestions),
            "estimated_time": "48-72小时"
        }
    
    def _suggest_journal(self, suggestions: List[Dict]) -> str:
        """推荐投稿期刊"""
        types = [s["type"] for s in suggestions]
        if "survival" in types and "prognostic" in types:
            return "Journal of Clinical Oncology / Cancer"
        elif "trend" in types:
            return "Lancet Public Health / JAMA Network Open"
        elif "survival" in types:
            return "Annals of Oncology / British Journal of Cancer"
        else:
            return "Scientific Reports / PLOS ONE"
    
    def generate_methods_section(self, analysis_types: List[str]) -> str:
        """自动生成统计方法描述"""
        methods = [
            "## 统计方法",
            "",
            "本研究使用SEER数据库（Surveillance, Epidemiology, and End Results）进行分析。",
            "所有统计分析均使用Python（lifelines, statsmodels）和R（survival包）完成。",
            ""
        ]
        
        if "survival" in analysis_types:
            methods.extend([
                "### 生存分析",
                "使用Kaplan-Meier法估计生存率，Log-rank检验比较组间差异。",
                "使用Cox比例风险回归模型评估预后因素，计算风险比（HR）及95%置信区间（CI）。",
                "比例风险假设通过Schoenfeld残差检验验证。",
                ""
            ])
        
        if "trend" in analysis_types:
            methods.extend([
                "### 趋势分析",
                "使用Joinpoint回归分析年度变化趋势，计算年度百分比变化（APC）。",
                "使用美国人口普查数据进行年龄标准化发病率计算。",
                ""
            ])
        
        methods.append("P < 0.05（双侧）被认为具有统计学意义。")
        
        return "\n".join(methods)


# 快速入口
if __name__ == "__main__":
    analyzer = SEERAnalyzer()
    print("🔬 SEER数据分析引擎 v0.1")
    print("使用方式:")
    print("  analyzer.load_data('seer.csv')")
    print("  analyzer.suggest_analysis(columns)")
    print("  analyzer.generate_methods_section(['survival', 'prognostic'])")
