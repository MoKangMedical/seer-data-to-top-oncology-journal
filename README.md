# SEER → 顶级肿瘤学期刊

> 用AI自动分析SEER（美国癌症数据库）数据，生成可投稿的科研论文

## 🎯 产品价值

传统：临床研究者手动清理SEER数据 → 统计分析 → 写论文 → **6-12个月**
我们：上传SEER数据 → AI全流程 → 初稿输出 → **72小时**

## 🧠 技术哲学：Harness理论

> 在AI领域，Harness（环境设计）比模型本身更重要。性能提升64%。

本项目的Harness = 数据清理→统计分析→图表生成→论文撰写→投稿检查的全自动流水线。

## 📁 项目结构

```
├── data/              # SEER数据（不上传，.gitignore保护）
├── scripts/
│   ├── clean.py       # 数据清理
│   ├── analyze.py     # 统计分析
│   ├── figure.py      # 图表生成
│   └── draft.py       # 论文初稿生成
├── output/            # 分析结果和论文
└── README.md
```

## ⚡ Quick Start

```bash
cd seer-data-to-top-oncology-journal
pip install pandas numpy lifelines matplotlib
python scripts/clean.py --input data/seer.csv
python scripts/analyze.py
python scripts/draft.py --journal lancet
```

## 📐 理论基础

> **红杉论点**：从卖工具到卖结果。我们交付可投稿的论文，而非统计软件。

## 📄 许可证

MIT
