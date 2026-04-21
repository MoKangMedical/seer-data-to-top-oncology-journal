#!/bin/bash
# SEER数据分析引擎部署脚本
# Usage: bash scripts/deploy.sh [port]

PORT=${1:-8080}

echo "🔬 SEER数据分析引擎 — 部署"
echo "=========================="

# 安装依赖
pip install -r requirements.txt

# 测试
python -m py_compile scripts/analyzer.py && echo "✅ analyzer.py 语法正确"
python -m py_compile scripts/main.py && echo "✅ main.py 语法正确"

echo ""
echo "✅ 部署完成"
echo "使用: python scripts/main.py --input data/seer.csv"
