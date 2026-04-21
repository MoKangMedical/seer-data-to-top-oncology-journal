"""
SEER论文快速生成 — 一键分析SEER数据并生成论文初稿

Usage:
    python main.py --input seer.csv --outcome "5年生存" --exposure "治疗方案"
"""

import argparse
import json
import sys
import os
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
from analyzer import SEERAnalyzer


def run_pipeline(data_path: str, outcome: str, exposure: str, output_dir: str):
    """执行完整分析流程"""
    analyzer = SEERAnalyzer(
        data_dir=str(Path(data_path).parent),
        output_dir=output_dir
    )

    # Step 1: 加载数据
    print("📊 Step 1: 加载数据...")
    filename = Path(data_path).name
    info = analyzer.load_data(filename)
    if "error" in info:
        print(f"❌ {info['error']}")
        return
    print(f"  ✅ {info['rows']} 行, {len(info['columns'])} 列")

    # Step 2: 分析建议
    print("💡 Step 2: 生成分析方案...")
    suggestions = analyzer.suggest_analysis(info["columns"])
    for s in suggestions["suggestions"]:
        print(f"  📋 {s['name']}: {', '.join(s['methods'])}")
    print(f"  🎯 推荐期刊: {suggestions['recommended_journal']}")

    # Step 3: 生成方法学描述
    print("📝 Step 3: 生成统计方法...")
    analysis_types = [s["type"] for s in suggestions["suggestions"]]
    methods_text = analyzer.generate_methods_section(analysis_types)

    # Step 4: 输出
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    report = {
        "data_summary": info,
        "analysis_plan": suggestions,
        "methods_section": methods_text,
    }
    report_path = out / "analysis_plan.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\n✅ 分析方案已输出: {report_path}")

    methods_path = out / "methods_section.md"
    methods_path.write_text(methods_text)
    print(f"✅ 方法学描述: {methods_path}")


def main():
    parser = argparse.ArgumentParser(description="SEER数据分析→论文初稿")
    parser.add_argument("--input", required=True, help="SEER数据文件路径")
    parser.add_argument("--outcome", default="生存", help="结局变量描述")
    parser.add_argument("--exposure", default="", help="暴露变量描述")
    parser.add_argument("--output", default="output", help="输出目录")
    args = parser.parse_args()

    run_pipeline(args.input, args.outcome, args.exposure, args.output)


if __name__ == "__main__":
    main()
