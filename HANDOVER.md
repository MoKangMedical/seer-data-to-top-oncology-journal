# SEER-BMJ Research Platform — 项目交接文档

> **项目名称**: SEER Data to Oncology Top Journal Research Platform  
> **当前版本**: b91410b1  
> **交接日期**: 2026-01-25  
> **交接目标**: OpenClaw 或其他 AI Agent / 开发者接管并持续完善

---

## 一、项目概述

本平台是一个面向肿瘤学研究者的 AI 驱动研究工具，核心功能是将 SEER（Surveillance, Epidemiology, and End Results）数据库的研究方案自动转化为符合 Lancet / JAMA / BMJ 等顶级期刊标准的完整学术论文。平台覆盖从研究方案解析、统计代码生成、图表制作到论文撰写和投稿准备的全流程。

---

## 二、技术架构

### 2.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 19 + TypeScript | SPA 单页应用 |
| **样式系统** | Tailwind CSS 4 + shadcn/ui | 组件化 UI |
| **路由** | wouter | 轻量级路由 |
| **状态管理** | TanStack Query (React Query) | 服务端状态 |
| **API 层** | tRPC 11 | 端到端类型安全 |
| **后端框架** | Express 4 + Node.js | HTTP 服务 |
| **数据库** | MySQL/TiDB + Drizzle ORM | 关系型数据库 |
| **文件存储** | AWS S3 | 文件上传和存储 |
| **AI 引擎** | Manus LLM API | 论文生成、方案解析 |
| **认证** | Manus OAuth | 用户登录 |
| **构建工具** | Vite 7 + esbuild | 开发和生产构建 |
| **测试** | Vitest | 单元测试 |

### 2.2 目录结构

```
seer-bmj-platform/
├── client/                     # 前端代码
│   ├── public/                 # 静态资源
│   ├── src/
│   │   ├── _core/              # 认证 hooks
│   │   ├── components/         # 可复用组件
│   │   │   ├── ui/             # shadcn/ui 基础组件
│   │   │   ├── DashboardLayout.tsx    # 仪表盘布局
│   │   │   ├── SEERDataIntro.tsx      # SEER数据介绍
│   │   │   ├── GlobalDatabasesIntro.tsx # 全球数据库介绍
│   │   │   ├── LatestSEERResearch.tsx  # 最新SEER研究
│   │   │   ├── SEERPublications.tsx    # SEER论文展示
│   │   │   ├── JAMAPreview.tsx         # JAMA格式预览
│   │   │   ├── SectionEditor.tsx       # 论文章节编辑器
│   │   │   ├── NotificationCenter.tsx  # 通知中心
│   │   │   └── ...
│   │   ├── contexts/           # React Context
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── pages/              # 页面组件
│   │   │   ├── Home.tsx        # 首页（Landing Page）
│   │   │   ├── Dashboard.tsx   # 工作台
│   │   │   ├── ProjectDetail.tsx # 项目详情
│   │   │   ├── Submission.tsx  # 投稿管理
│   │   │   ├── Pricing.tsx     # 定价页面
│   │   │   ├── SEERDataFetch.tsx # SEER数据抓取
│   │   │   └── ...
│   │   ├── App.tsx             # 路由配置
│   │   └── index.css           # 全局样式
│   └── index.html
├── server/                     # 后端代码
│   ├── _core/                  # 框架核心（勿修改）
│   │   ├── llm.ts              # LLM 调用封装
│   │   ├── oauth.ts            # OAuth 认证
│   │   ├── notification.ts     # 通知服务
│   │   └── ...
│   ├── routers.ts              # tRPC 路由定义（主文件）
│   ├── routers_jama_export.ts  # JAMA导出路由
│   ├── db.ts                   # 数据库查询辅助函数
│   ├── jamaGenerator.ts        # JAMA论文生成器
│   ├── jamaTemplate.ts         # JAMA HTML模板
│   ├── fullManuscriptGenerator.ts # 完整论文生成器
│   ├── chartGenerator.ts       # 图表生成器
│   ├── dataParser.ts           # 数据解析器（CSV/Excel）
│   ├── pubmedService.ts        # PubMed文献服务
│   ├── realReferences.ts       # 真实参考文献库
│   ├── submissionService.ts    # 投稿服务
│   ├── documentExporter.ts     # 文档导出（Word/PDF）
│   ├── notificationService.ts  # 通知服务
│   ├── seerPublicationService.ts # SEER论文抓取服务
│   ├── seerDataService.ts      # SEER数据抓取分析服务
│   ├── pricingService.ts       # 定价服务
│   └── storage.ts              # S3 存储辅助
├── drizzle/                    # 数据库迁移
│   ├── schema.ts               # 数据库表定义
│   └── *.sql                   # 迁移文件
├── shared/                     # 前后端共享类型
├── todo.md                     # 功能跟踪清单
└── package.json
```

### 2.3 数据库模型

平台包含以下核心数据表：

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `users` | 用户账户 | id, openId, name, email, role |
| `projects` | 研究项目 | id, userId, title, cancerType, studyDesign, status |
| `proposals` | 研究方案 | projectId, population, intervention, outcome, statisticalModel |
| `analysis_codes` | 分析代码 | projectId, codeType(r/stata), analysisType, code |
| `figures` | 图表 | projectId, figureType, title, legend, rCode, svgContent |
| `tables` | 表格 | projectId, tableType, markdownContent, htmlContent |
| `manuscripts` | 论文草稿 | projectId, title, introduction, methods*, results, discussion* |
| `pubmed_references` | PubMed文献 | projectId, pmid, title, authors, journal, doi |
| `data_uploads` | 数据上传 | projectId, fileName, fileUrl, totalRows, columnNames |
| `notifications` | 通知 | userId, type, category, title, content, isRead |
| `seer_publications` | SEER论文 | pmid, title, summary, cancerType, methodologyScore |
| `seer_research_patterns` | 研究模式 | patternType, patternName, frequency, recommendations |
| `pricing_plans` | 定价方案 | name, price, billingCycle, downloadQuota |
| `subscriptions` | 用户订阅 | userId, planId, status, startDate, endDate |
| `download_records` | 下载记录 | userId, projectId, downloadType |
| `payment_records` | 支付记录 | userId, amount, paymentMethod, status |

### 2.4 API 路由结构

所有 API 通过 tRPC 定义，路由组织如下：

```
appRouter
├── auth                    # 认证（内置）
│   ├── me                  # 获取当前用户
│   └── logout              # 登出
├── project                 # 项目管理
│   ├── list / get / create / update / delete
│   ├── parseProposal       # 解析研究方案
│   ├── generateCode        # 生成分析代码
│   ├── generateFigures     # 生成图表
│   ├── generateManuscript  # 生成论文
│   ├── uploadData          # 上传数据
│   └── ...
├── notification            # 通知系统
├── seerPublication         # SEER论文管理
├── pricing                 # 定价和订阅
├── seerData                # SEER数据抓取分析
├── jama                    # JAMA格式导出
└── system                  # 系统通知
```

---

## 三、已完成功能清单

### 3.1 核心研究流程

- 研究方案解析（PICO/PECO 框架，自动识别研究设计类型）
- R 和 Stata 统计代码生成（10种分析类型）
- 数据上传和解析（CSV/Excel）
- 图表自动生成（KM曲线、森林图、流程图、基线表等）
- JAMA 标准论文自动撰写（约5000词，含结构化摘要）
- 真实 PubMed 参考文献（38篇，Vancouver 格式）
- 论文章节编辑和 AI 润色
- JAMA 格式预览和导出（HTML/Word/PDF）
- 投稿准备（10个期刊推荐 + Cover Letter + 打包下载）

### 3.2 平台功能

- 用户认证（Manus OAuth）
- 项目管理（CRUD + 状态跟踪）
- 通知系统（站内消息 + 邮件 + 系统公告）
- 定价体系（Plus会员订阅 + 积分购买）
- SEER 数据自动抓取和分析
- PubMed 最新 SEER 论文自动抓取和 AI 摘要
- 首页展示（SEER数据介绍 + 全球数据库 + 期刊列表 + 研究案例）

---

## 四、待完善功能清单（优先级排序）

### P0 — 核心体验（必须优先完成）

| 编号 | 功能 | 说明 | 预估工作量 |
|------|------|------|------------|
| P0-1 | **微信/支付宝支付集成** | 当前定价页面已有UI，但缺少真实支付网关。需接入微信支付或支付宝API，生成真实二维码 | 3-5天 |
| P0-2 | **论文导出优化** | Word/PDF 导出功能需进一步打磨，确保格式完全符合期刊要求 | 2-3天 |
| P0-3 | **数据分析真实性增强** | 当前部分分析使用模拟数据，需接入真实 SEER API 或支持用户上传真实数据后的完整分析流程 | 5-7天 |
| P0-4 | **参考文献自动嵌入** | 引用需自动嵌入论文正文对应位置，目前部分引用是预设的 | 2-3天 |

### P1 — 用户体验提升

| 编号 | 功能 | 说明 | 预估工作量 |
|------|------|------|------------|
| P1-1 | **用户积分余额系统** | Dashboard 显示积分余额、消费记录、充值入口 | 2天 |
| P1-2 | **项目协作功能** | 支持多用户协作编辑同一研究项目 | 5-7天 |
| P1-3 | **论文版本对比** | 支持不同版本论文的 diff 对比 | 3天 |
| P1-4 | **图表在线编辑** | 支持用户在线调整图表参数和样式 | 3-5天 |
| P1-5 | **移动端适配** | 当前主要针对桌面端，需优化移动端体验 | 3天 |

### P2 — 功能扩展

| 编号 | 功能 | 说明 | 预估工作量 |
|------|------|------|------------|
| P2-1 | **多数据库支持** | 除 SEER 外，支持 GBD、GLOBOCAN、CI5 数据的分析 | 7-10天 |
| P2-2 | **多期刊格式** | 除 JAMA 外，支持 Lancet、BMJ、NEJM 等期刊的论文格式 | 5-7天 |
| P2-3 | **审稿意见回复助手** | AI 辅助生成审稿意见的回复信 | 3天 |
| P2-4 | **研究方案模板库** | 提供常见癌症类型的研究方案模板 | 3天 |
| P2-5 | **数据可视化仪表板** | 用户上传数据后的交互式数据探索 | 5-7天 |
| P2-6 | **国际化（i18n）** | 支持英文界面 | 3-5天 |

### P3 — 技术债务

| 编号 | 问题 | 说明 |
|------|------|------|
| P3-1 | **测试覆盖率不足** | 当前仅有基础单元测试，需补充集成测试和 E2E 测试 |
| P3-2 | **routers.ts 过大** | 主路由文件超过 1500 行，需拆分为独立模块 |
| P3-3 | **错误处理不统一** | 部分 API 的错误处理不够规范 |
| P3-4 | **性能优化** | 论文生成等 LLM 调用需添加缓存和队列机制 |
| P3-5 | **日志系统** | 缺少结构化日志，不利于线上排查问题 |

---

## 五、开发指南

### 5.1 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 类型检查
pnpm check

# 数据库迁移
pnpm db:push
```

### 5.2 添加新功能的标准流程

1. **更新数据库 Schema**：编辑 `drizzle/schema.ts`，然后运行 `pnpm db:push`
2. **添加数据库辅助函数**：在 `server/db.ts` 中添加查询函数
3. **创建/扩展 tRPC 路由**：在 `server/routers.ts` 中添加 procedure
4. **构建前端 UI**：在 `client/src/pages/` 或 `client/src/components/` 中创建组件
5. **注册路由**：在 `client/src/App.tsx` 中添加路由
6. **编写测试**：在 `server/*.test.ts` 中添加单元测试
7. **更新 todo.md**：标记完成的功能

### 5.3 关键约定

- **tRPC 优先**：所有 API 调用使用 tRPC，不要引入 Axios 或 fetch
- **认证**：使用 `protectedProcedure` 保护需要登录的接口
- **文件存储**：所有文件上传到 S3，数据库只存 URL
- **LLM 调用**：使用 `server/_core/llm.ts` 中的 `invokeLLM` 函数
- **样式**：使用 Tailwind CSS + shadcn/ui 组件
- **勿修改 `server/_core/`**：这是框架基础设施代码

### 5.4 环境变量

以下环境变量由平台自动注入，无需手动配置：

| 变量名 | 用途 |
|--------|------|
| `DATABASE_URL` | 数据库连接字符串 |
| `JWT_SECRET` | Session Cookie 签名密钥 |
| `VITE_APP_ID` | OAuth 应用 ID |
| `OAUTH_SERVER_URL` | OAuth 后端地址 |
| `BUILT_IN_FORGE_API_URL` | Manus 内置 API 地址 |
| `BUILT_IN_FORGE_API_KEY` | Manus 内置 API 密钥 |

---

## 六、交给 OpenClaw 的建议工作流

### 6.1 第一步：熟悉项目

1. 阅读本文档和 `todo.md`
2. 运行 `pnpm dev` 启动项目，浏览所有页面
3. 查看 `drizzle/schema.ts` 了解数据模型
4. 查看 `server/routers.ts` 了解 API 结构

### 6.2 第二步：按优先级推进

建议 OpenClaw 按照 P0 → P1 → P2 → P3 的优先级逐步完善。每完成一个功能：

1. 更新 `todo.md` 标记完成
2. 编写对应的单元测试
3. 保存 checkpoint

### 6.3 第三步：持续优化

- 定期从 PubMed 抓取最新 SEER 研究
- 根据用户反馈调整 UI/UX
- 监控 LLM 生成质量，优化 prompt

---

## 七、已知问题和注意事项

1. **`server/_core/` 目录不可修改**：这是 Manus 平台的框架代码，修改可能导致部署失败
2. **LLM 调用有速率限制**：论文生成等重度 LLM 操作需注意并发控制
3. **S3 存储是公开的**：上传的文件 URL 可公开访问，敏感数据需额外处理
4. **数据库迁移需谨慎**：修改 schema 后必须运行 `pnpm db:push`，且不可删除已有字段
5. **首页 Home.tsx 较大**：约 1000+ 行，建议后续拆分为子组件

---

*本文档由 Manus AI 自动生成，最后更新于 2026-01-25。*
