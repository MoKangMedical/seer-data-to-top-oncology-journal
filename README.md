# SEER数据到顶级肿瘤学期刊

AI驱动的SEER数据分析 — 美国癌症数据到顶级期刊

## 项目目标

将美国SEER（监测流行病学和最终结果）数据库数据转化为顶级肿瘤学期刊发表的研究论文。

## 核心能力

- SEER*Stat数据自动处理
- 生存分析（Kaplan-Meier/Cox回归）
- 年龄-时期-队列分析
- 论文初稿自动生成

## 快速开始

    git clone https://github.com/MoKangMedical/seer-data-to-top-oncology-journal.git
    cd seer-data-to-top-oncology-journal
    pip install -r requirements.txt
    python src/main.py --cancer "breast" --outcome "survival"

MIT License
