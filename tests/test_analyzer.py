"""SEER分析引擎测试"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from analyzer import SEERAnalyzer


def test_suggest_analysis():
    analyzer = SEERAnalyzer()
    cols = ["AGE_DX", "SEX", "RACE", "SURV_MONTHS", "TUMOR_SIZE", "YEAR_DX"]
    result = analyzer.suggest_analysis(cols)
    assert len(result["suggestions"]) >= 3
    assert result["recommended_journal"]  # 非空
    print("✅ test_suggest_analysis")


def test_generate_methods():
    analyzer = SEERAnalyzer()
    text = analyzer.generate_methods_section(["survival", "trend", "prognostic"])
    assert "Kaplan-Meier" in text
    assert "Joinpoint" in text
    assert "Nomogram" in text
    print("✅ test_generate_methods")


def test_empty_columns():
    analyzer = SEERAnalyzer()
    result = analyzer.suggest_analysis([])
    assert len(result["suggestions"]) >= 1  # 默认推荐
    print("✅ test_empty_columns")


if __name__ == "__main__":
    test_suggest_analysis()
    test_generate_methods()
    test_empty_columns()
    print("\n🎉 全部测试通过")
