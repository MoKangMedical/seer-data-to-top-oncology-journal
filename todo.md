# SEER-BMJ Research Platform TODO

## 数据库与后端
- [x] 设计研究项目数据库模型（projects表）
- [x] 设计研究方案数据模型（proposals表）
- [x] 设计分析代码存储模型（analysis_codes表）
- [x] 设计图表存储模型（figures表）
- [x] 设计论文草稿模型（manuscripts表）
- [x] 实现项目CRUD API
- [x] 实现研究方案解析API
- [x] 实现代码生成API
- [x] 实现图表生成API
- [x] 实现论文生成API

## 研究方案解析模块
- [x] PICO/PECO框架解析
- [x] 研究设计类型识别（回顾性队列/病例对照/生存分析/竞争风险分析）
- [x] 暴露、结局、协变量定义提取
- [x] SEER数据适配性检测
- [x] 统计模型转译
- [x] SEER变量映射方案生成

## SEER数据分析引擎
- [x] R代码生成器
- [x] Stata代码生成器
- [x] 数据清洗逻辑生成
- [x] 描述性统计代码（Table 1基线特征）
- [x] Kaplan-Meier生存分析代码
- [x] Cox回归分析代码
- [x] Fine-Gray竞争风险模型代码
- [x] 倾向得分匹配（PSM）代码
- [x] 亚组分析代码
- [x] 敏感性分析代码

## BMJ标准表格生成器
- [x] Table 1基线特征表生成
- [x] 回归结果表生成（HR、95% CI、模型分层）
- [ ] 表格Markdown/Word导出

## BMJ风格图形生成系统
- [x] Kaplan-Meier生存曲线（含95% CI、Number at risk）
- [x] 森林图（subgroup & interaction）
- [x] 竞争风险累积发生率曲线
- [x] 限制性立方样条曲线
- [x] 校准曲线
- [x] BMJ配色方案实现（深蓝#003366、灰阶）

## PubMed文献引用集成
- [x] PubMed文献搜索功能
- [x] Vancouver格式引用生成
- [ ] 引用自动嵌入论文
- [ ] 参考文献列表生成

## BMJ风格论文撰写
- [x] Title生成（≤150字符）
- [x] Structured Abstract生成
- [x] What is already known生成
- [x] What this study adds生成
- [x] Introduction撰写
- [x] Methods撰写
- [x] Results撰写
- [x] Discussion撰写
- [ ] 论文Markdown/Word导出

## 项目管理系统
- [x] 项目创建/编辑/删除
- [x] 项目列表展示
- [x] 项目详情页面
- [x] 研究方案上传/编辑
- [x] 分析代码管理
- [x] 图表管理
- [x] 论文草稿管理

## 方法学蓝图生成
- [x] 纳入/排除标准生成
- [x] 主分析模型选择建议
- [x] 协变量选择逻辑
- [x] 亚组/交互分析设计
- [x] 敏感性分析计划

## 结果结构预生成
- [x] Table 1-3结构预览
- [x] Figure 1-4设计说明

## 质量审稿友好约束
- [x] 潜在偏候自动检测（selection bias、immortal time bias等）
- [x] SEER数据限制说明
- [ ] 因果关系表述审核

## 前端界面
- [x] 首页/Landing页面
- [x] 用户登录/注册
- [x] Dashboard布局
- [x] 项目管理界面
- [x] 研究方案编辑器
- [x] 代码查看器（语法高亮）
- [x] 图表预览组件
- [x] 论文编辑器
- [ ] 导出功能


## 界面重设计（参考CHARLS→Lancet风格）
- [x] 首页Hero区域重设计（SEER → BMJ大标题）
- [x] 统计数据展示（BMJ期刊数、影响因子、生成时间、标准合规率）
- [x] BMJ最新论文展示模块
- [x] 五步工作流程展示（上传→分析→图表→撰写→下载）
- [x] 核心功能模块展示（6个功能卡片）
- [x] 成功案例展示（基于SEER的BMJ发表研究）
- [x] 导航栏优化（工作流程、核心功能、期刊列表、成功案例）
- [x] BMJ深蓝色主题配色实现
- [x] 项目详情页全流程优化
- [ ] 一键下载功能实现


## BMJ官网风格重设计
- [x] 访问BMJ官网获取配色方案
- [x] 更新配色为BMJ官方风格（青色/蓝绿色主题）
- [x] 添加BMJ期刊封面展示模块
- [x] 读取Excel文件获取期刊数据
- [x] 展示所有BMJ系列期刊封面


## 期刊列表和SEER研究案例更新
- [x] 只保留旗舰期刊，移除BMJ Connections系列和专科期刊
- [x] 使用用户提供的BMJ logo图片
- [x] 搜索更多基于SEER数据的BMJ系列期刊研究
- [x] 按时间从新到旧排列研究案例
- [x] 为每个研究案例添加直接链接到原文


## 配色和排序优化
- [x] 恢复淡雅配色方案（青色/蓝绿色主题）
- [x] SEER研究案例按影响因子从高到低排列
- [x] 搜索更多高影响因子期刊的SEER研究


## 清理BMJ logo和验证论文链接
- [x] 移除页面上所有BMJ logo图片
- [x] 验证SEER研究论文链接的真实性
- [x] 移除无效链接的论文


## 平台升级为肿瘤顶级期刊平台
- [x] 更新平台名称为 "SEER Data to Oncology Top Journal"
- [x] 替换BMJ期刊列表为肿瘤顶级期刊（Lancet Oncology, JAMA Oncology, JCO, Annals of Oncology等）
- [x] 搜索肿瘤顶级期刊的SEER相关研究
- [x] 验证所有论文链接的真实性
- [x] 按影响因子排序展示研究案例
- [x] 更新导航栏和页脚信息


## 数据上传和自动图表生成功能
- [x] 在研究方案后添加"数据上传"步骤
- [x] 支持CSV/Excel数据文件上传
- [x] 自动生成Figure 1: 人群纳入排除流程图 (Flow Chart)
- [x] 自动生成Table 1: 基线特征表 (Baseline Characteristics)
- [x] 根据研究方案自动生成其他图表（生存曲线、森林图等）
- [x] 限制图表数量在6个以内
- [x] 图表自动嵌入到论文相应位置
- [x] 论文符合顶刊要求（约5000字）
- [x] 更新工作流程步骤顺序


## JAMA格式论文和参考文献系统
- [x] 确保数据分析基于用户上传的真实数据
- [x] 根据真实数据自动生成图表
- [x] 论文格式参考JAMA要求
- [x] 正文达到5000个单词（不含图表）
- [x] Introduction部分：10-15篇顶刊文献
- [x] Methods部分：2-5篇方法学文献
- [x] Discussion部分：20-25篇顶刊文献
- [x] 参考文献按正文出现顺序从1开始编号
- [x] 所有文献可在PubMed搜索到
- [x] 支持EndNote导出（RIS/ENW格式）


## 完整投稿系统功能
- [x] 自动数据分析生成统计图片
- [x] 完整可复制的参考文献列表
- [x] 10个投稿杂志推荐及投稿网址
- [x] Cover Letter自动生成（按杂志要求）
- [x] 一键下载所有投稿文件（论文、图表、参考文献、Cover Letter）
- [x] 投稿文件打包ZIP下载


## 论文正文和文献优化
- [x] 确保论文正文达到5000个单词（不含图表和参考文献）
- [x] 参考文献列在正文后面，完整格式可直接复制
- [x] 所有文献使用真实PubMed可查的文献（真实PMID和DOI）
- [x] Introduction 12篇真实顶刊文献
- [x] Methods 4篇真实方法学文献
- [x] Discussion 22篇真实顶刊文献


## 论文全英文和10份Cover Letter
- [x] 确保论文正文全英文，无中文内容
- [x] 为10个推荐期刊各生成一份专属Cover Letter
- [x] Cover Letter内容根据各期刊特点定制
- [x] 前端界面显示和下载10份Cover Letter


## 论文生成全英文化
- [x] 检查并修复所有论文生成相关代码中的中文内容
- [x] 更新LLM提示词为全英文
- [x] 确保生成的论文正文、标题、摘要全部为英文


## 完整JAMA格式论文（含图表、参考文献和声明）
- [x] 论文全英文输出（正文、图表标题、参考文献）
- [x] 完整图表（Flow Chart、基线表、生存曲线等）
- [x] 完整参考文献（38篇真实PubMed文献，Vancouver格式）
- [x] Author Contributions声明
- [x] Conflict of Interest Disclosure声明
- [x] Funding/Support声明
- [x] Role of Funder/Sponsor声明
- [x] Data Sharing Statement
- [x] Ethics Statement/IRB Approval
- [x] Acknowledgments


## 完整通知系统
- [x] 创建通知数据库表（notifications表）
- [x] 后端通知API（创建、读取、标记已读、删除）
- [x] 用户操作通知（Toast提示）
- [x] 系统通知（公告横幅和弹窗）
- [x] 站内消息中心（历史通知列表）
- [x] 邮件通知服务集成
- [x] 通知偏好设置


## 论文章节编辑功能
- [x] 后端API支持章节内容更新
- [x] AI辅助扩增功能（扩展段落内容）
- [x] AI辅助润色功能（改进语言表达）
- [x] 章节重新生成功能
- [x] 前端章节编辑器组件
- [x] 实时预览和保存功能
- [x] 编辑历史记录


## 名称统一更新
- [x] 将所有"SEER to BMJ"替换为"SEER Data to Oncology Top Journal"
- [x] 更新前端界面中的所有相关文字
- [x] 更新后端代码中的相关注释和描述


## JAMA投稿格式模板
- [x] 分析JAMA文章样本的格式和结构
- [x] 创建JAMA样式的论文模板（标题页、摘要、正文、参考文献）
- [x] 实现JAMA配色方案（表格、图形）
- [x] 实现JAMA参考文献格式（Vancouver/Superscript）
- [x] 创建可直接投稿的HTML导出功能（可打印为PDF）
- [x] 前端JAMA格式预览界面


## Discussion扩展和导出功能优化
- [x] Discussion部分扩展到2000单词
- [x] 添加Word格式(.docx)导出功能
- [x] 添加PDF格式导出功能
- [x] 修复表格格式，确保无乱码
- [x] 为每个Figure生成完整的Figure Legend
- [x] JAMA格式论文完整导出


## SEER最新论文展示和AI学习系统
- [x] 创建SEER论文数据库表（seer_publications表）
- [x] 后端API获取和管理SEER论文
- [x] PubMed自动抓取SEER相关最新论文
- [x] 每篇论文生成500字简短介绍
- [x] 自动更新机制（定期抓取新论文）
- [x] AI学习系统分析SEER研究方法和发表特点
- [x] 首页展示最新SEER论文模块
- [x] 论文详情页面（摘要、方法、亮点）


## 定价系统
- [x] 创建定价方案数据库表（pricing_plans、subscriptions、download_quota）
- [x] 单次下载方案：¥50/次，1次下载
- [x] 基础版方案：¥99/月，5次下载/月
- [x] 标准版方案：¥159/月，10次下载/月
- [x] 高级版方案：¥299/月，20次下载/月
- [x] 定价页面组件（4个方案卡片）
- [x] 订阅管理后端API
- [x] 下载配额检查和扣减逻辑
- [x] 用户订阅状态显示


## SEER数据介绍和最新研究展示
- [x] 首页添加SEER数据库可视化介绍模块
- [x] SEER数据覆盖范围流程图（数据来源、癌症类型、时间跨度）
- [x] SEER数据统计图表（患者数量、癌症分布、地理覆盖）
- [x] 优化最新SEER研究文章展示区域
- [x] AI自动生成研究文章简介功能
- [x] 定期自动更新最新SEER研究（PubMed抓取）

## SEER数据自动抓取和分析
- [x] 研究方案解析服务（提取癌症类型、研究设计、变量需求）
- [x] SEER数据抓取API（根据研究方案参数抓取相关数据）
- [x] 数据自动分析引擎（统计分析、生存分析、回归分析）
- [x] 分析报告自动生成（表格、图表、结论）
- [x] 前端数据抓取界面（研究方案输入、抓取进度、结果展示）
- [x] 分析结果可视化展示

## 三大全球癌症数据库介绍
- [x] 创建GlobalDatabasesIntro组件（GBD、GLOBOCAN、CI5）
- [x] 添加数据库Tab切换展示
- [x] 数据库对比表格
- [x] 将数据库介绍整合到首页

## 定价体系重构（Plus会员+积分购买）
- [x] Plus会员订阅方案（3个月¥268/6个月¥428/12个月¥698/24个月¥1188）
- [x] 折扣标签显示（9.1折/7.3折/5.9折/5折）
- [x] 原价和月均价格显示
- [x] 会员权益详情列表（积分、AI功能、存储等）
- [x] 按需购买积分Tab切换
- [x] 微信支付二维码展示
- [x] 支付条款和发票说明

## OpenClaw交接准备
- [x] 项目交接文档（HANDOVER.md）
- [x] OpenClaw任务清单（OPENCLAW_TASKS.md）
- [x] 系统架构图（ARCHITECTURE.mmd → architecture.png）
- [x] 工作流程图（WORKFLOW.mmd → workflow.png）
