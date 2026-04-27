# OOTODAY 进度追踪

> 最后更新：2026-04-27
> 角色：项目总览页。这里只记录当前稳定状态、已完成里程碑、未闭环事项和运行约定，不记录 session 级流水账。

## 当前状态

- App shell + Supabase foundation 已完成并在主线可用：Landing、Today、Closet、Shop、Looks、Travel 页面都已有可运行骨架与受保护路由。
- Closet 已具备第一阶段低成本导入闭环：本地图片上传、相册批量导入、商品链接或图片链接导入、拼图拆分导入，以及保存后继续浏览和编辑；单品还支持可选 `algorithm_meta`，用于后续更准确判断 slot、层次角色、轮廓、材质重量、正式度、保暖度、舒适度、视觉重量和图案。
- Closet 已具备第一阶段整理能力：重复提醒、闲置提醒、基础缺口、优先动作清单、按类型/按颜色分组浏览、编辑识别结果、重新识别、删除、图片右转 90°。
- Today + OOTD 已形成主链路：基于衣橱生成规则型推荐，支持天气增强、城市保存、稳定推荐缓存、换一批推荐、记录今日已穿、满意度反馈、最近历史查看与编辑/删除。
- Today 移动端已从推荐展示页升级为穿搭决策页：首屏优先展示第一套 Outfit Hero、日期/天气/场景 chips、明确方案角色、“就穿这套”先选择后评分、局部换鞋/换外套/换包/换主件、以及“不想穿”前置反馈；新增交互继续写入 `recommendation_interactions`，策略分和“为什么推荐这套”保持默认可见。
- 推荐偏好引擎已完成共享评价体系阶段：纯函数权重层、Supabase 存储、风格问卷、Settings 重置/重填入口、Today 评分 reason tags 到偏好学习的接入、完整 outfit slots + `finalWeights` 加权排序、Today 第 3 套安全灵感套装、跨 Today / Shop / Looks / Travel 的推荐文案统一，以及共享 outfit evaluator 对颜色、轮廓、层次、视觉中心、场景、天气、完整度和新鲜度的统一评分。
- 推荐引擎已完成严格版生产 ML 基础和完整六项上线批次：`推荐引擎ref.md` 中 13 个成熟穿搭策略、规则基线评分、兼容性评分和 penalty 已进入共享 canonical scoring contract；Today 已升级为 formula / model-seeded / rule / weather / exploration 多路候选池，Shop、Looks、Travel 共享趋势、学习信号和模型上下文；缺少 promoted 模型时回退可解释规则基线。
- Today 推荐已补批内策略差异化：主命中策略不再单纯取最高分，胶囊衣橱泛化命中已收紧，批量选择会惩罚重复鞋包/配饰与重复策略，并在相邻推荐中补充“和上一套拉开差异”的解释。
- Today 已完成一轮减少视觉等待优化：首屏优先走稳定推荐缓存和轻量衣橱计数，天气/模型增强有超时降级，推荐曝光与历史记录改为渲染后补充上报/加载，日期/场景切换会保留当前卡片直到新推荐回来。
- Beta 首轮体验已开始收敛：登录后入口会按衣橱状态自动分流到 `Closet onboarding` 或 `Today`，Landing / Closet / Today 已接入统一 first-run checklist、明确的下一步 CTA 与可达的反馈入口。
- Beta 最小观测层已升级为自建 analytics 基础：Landing、登录邮件发送、Closet 导入启动与保存、Today 浏览/推荐/刷新/OOTD 提交、Travel 生成/保存、Shop 分析成功/失败、Looks 浏览和反馈入口已接入统一事件；登录失败、导入失败、识别失败、Today 提交失败等高价值路径会映射为卡点事件，且失败不会阻塞主流程。
- Today / Closet 已完成第一轮 server-client 边界收敛：页面壳、状态头和主路径提示已回到服务端，交互性的推荐/历史/设置与衣橱导入/浏览/编辑收敛到更小的客户端工作区；路由层已补 Suspense fallback，并已完成一轮 dev browser QA 与 bundle manifest 复核。
- Shop 已完成偏好感知的扩展购买分析：支持商品链接、本地图片、图片 URL 输入，输出重复风险、可搭/收尾/强化收益、购买建议；分析范围已从核心服饰扩展到鞋履、包袋、配饰，并会结合用户偏好调整舒适、造型、低调与 hard avoids 的购买判断。
- Looks 已完成偏好感知的公式化灵感复刻：支持上传灵感图或图片链接，输出色彩/轮廓/叠穿/视觉中心公式、关键单品、衣橱借用与替代建议，并会结合用户推荐偏好轻微调整排序、过滤 hard avoids、解释适合日常复刻还是更适合作为灵感尝试。
- Travel 已完成偏好感知的扩展打包方案：支持目的地、天数、场景生成旅行清单、按天轮换建议、鞋履/包袋/外层缺口提示，以及最近方案保存/重开/更新/删除；偏好会影响轻装、完整造型、叠穿复杂度和舒适鞋优先级。
- 配色、缺失 slot、灵感尝试文案和核心评分已进入共享层：Today、Shop、Looks、Travel 均开始复用统一的 taxonomy、color strategy helper、recommendation copy helper 与 outfit evaluator。
- 严格版推荐模型数据层已推送远端：`recommendation_interactions` 统一记录推荐曝光、保存、穿着、评分、跳过和 dislike 等事件，`recommendation_model_*` 表承接离线训练批次、产物和候选/实体分数；`recommendation_trends` 和 `recommendation_learning_signals` 承接可控趋势字典与细粒度学习信号；远端 REST smoke 已确认相关表可访问。

## 已完成里程碑

### 1. App Shell + Supabase Foundation

- 已完成 Next.js App Router、React 19、Tailwind CSS 4 基础工程。
- 已完成 Supabase browser/server client、middleware、magic link 回调、受保护路由。
- 登录方式已从纯 magic link 扩展到 magic link + 邮箱密码；首次 magic link 登录后会启用默认密码 `123456`，用户也可在 Today 中自行修改密码。
- 已完成基础 schema：`profiles`、`items`、`outfits`、`ootd`；Travel 额外依赖 `travel_plans`，远端未落表时会回退到 `outfits`。
- 已通过基础测试与生产构建验证。

### 2. Closet Import + Organizing MVP

- 已完成衣物图片上传、AI 分析、确认保存、页面刷新后查看已保存衣物。
- 已完成三条扩展导入路径：相册批量、远程链接、拼图拆分；远程图片会先转存到 Supabase Storage 再进入保存链路。
- 已完成标准化分类与颜色字典，不确定值会回退到手动选择，而不是继续写入自由文本。
- 已完成已保存衣物的编辑、重新识别、删除、分组浏览和图片右转 90°。
- 已完成第一版整理建议：重复、闲置、缺口与优先动作清单。
- 已补 beta 期高价值衣物元数据入口：导入/编辑时可填写购买价格、购买年份与当前状态，并对未完成远端迁移的旧库保留兼容式读写回退。
- 已完成衣橱分类字典 v2：核心服装主类收敛为上装 / 下装 / 连体/全身装 / 外层，旧的上衣 / 裤装 / 全身装 / 外套 / 乐福鞋等历史值会在读取与编辑时自动归一到新字典。
- 已新增可选算法 metadata：`items.algorithm_meta` 以 JSON 存储，不破坏旧数据；保存/读取会从现有 category / subCategory / styleTags 推断 fallback，AI 识别可选返回更细的算法字段。
- 已完成一二级类图标的真实组件接入，上传确认表单现在支持分类与子分类的图标快选。
- 已完成组件测试与多轮浏览器验证；旧库未加 `image_flipped` 列时，读取与写入都有兼容兜底。

### 3. Today Recommendation + OOTD MVP

- 已完成规则型推荐生成器、天气读取与归一化、Today 服务端视图组装、OOTD 保存与历史读取。
- 未设置城市时仍可推荐；设置城市后尝试天气增强，失败时自动降级。
- “换一批推荐”已从简单轮转改为基于候选搭配池的 offset 切换，结果变化更明显。
- OOTD 已支持单日唯一记录、1-5 分满意度、最近历史展示、编辑与删除。
- 提交 OOTD 后会同步更新 `items.last_worn_date / wear_count`，推荐逻辑也会优先避开最近刚穿过的单品。
- Today 已补首轮闭环提示：空衣橱态会直接引导去 `Closet onboarding`，首次成功推荐后会强调“记录一次反馈”，并新增轻量的未来 1-3 天预看占位区。
- Today / Closet 的高频交互区已从整页客户端壳里拆出；当前 manifest 复核显示 Today 已较轻，Closet 仍因导入/图片工作流保留较大客户端岛，后续优化应聚焦导入区懒加载而非继续扩功能。
- Today 推荐已接入共享 outfit evaluator：候选池会按天气/季节/暖度先过滤再排序，15 度这类微凉天气在有替代物时不会优先推荐短裤、凉鞋/拖鞋；最终排序仍读取 `finalWeights`，因此问卷和 Today 评分会真实改变颜色、轮廓、层次、场景、天气等维度权重。
- Today 的“为什么推荐这套”已改为展示当前套装贡献最高的评分亮点，例如完整度、天气舒适、配色、场景、比例、层次、视觉重点和新鲜度，不再固定拼接同一组解释；推荐卡片会展开 13 个穿搭子策略评分，并用 `primaryStrategy` / `strategySummaryKeys` 优先展示最能说明差异的主命中策略与辅助判断。
- Today 默认会把第 3 套作为“灵感套装”，但只从配色、天气舒适、场景适配、完整度和 hard avoids 都过线的候选里挑，并优先选择与前两套主件/颜色/外层差异更高的组合；`exploration.rate = 0` 时仍不插入灵感套装。

### 4. Shop Purchase Analysis MVP

- 已完成商品链接、图片 URL、本地图片三种输入方式。
- 已完成基础站点处理：京东可提图，拼多多会拦截通用分享图，淘宝 / 得物会给出更准确提示。
- 已完成非服饰类目拦截，避免输出误导性购买建议。
- 已完成结果结构化输出：重复风险、预计可搭套数、是否值得买，以及颜色策略解释。
- 已扩到鞋履、包袋、配饰，并接入用户推荐偏好：舒适优先会提高舒适鞋和可复用基础款价值，造型优先会提高包袋/配饰/视觉中心价值，低调偏好会降低大面积亮色、大 logo 和多焦点单品建议，hard avoids 会触发明确拦截或强提醒。
- 购买可搭套数已从简单品类计数升级为共享 evaluator 评分：候选商品会被放进真实核心 outfit 中计算颜色、场景、完整度和用户最终权重，鞋包配饰继续保留收尾/场景/视觉中心的业务语义。

### 5. Looks Inspiration Remix MVP

- 已完成灵感图拆解、关键单品提炼、整体风格总结与可执行搭配建议。
- 已完成与现有衣橱的借用匹配，并补上“我的版本怎么穿”复刻路径。
- 已开始复用共享颜色解释层，可说明这套灵感为什么成立，以及复刻时应优先保住哪一处重点。
- 已从“按类别匹配单品”升级为“偏好感知的穿搭公式匹配”：AI 拆出色彩、轮廓、叠穿和视觉中心公式；关键单品记录 slot、轮廓、层次角色、重要度和替代方案；衣橱匹配会综合类别、slot、颜色、轮廓、风格标签、层次角色和用户偏好，并在没有同类单品时给替代建议。
- Looks 匹配会优先读取衣橱 `algorithmMeta.slot / layerRole / silhouette / length`，并用用户 `finalWeights` 对公式替代排序做轻微倍率调整，弱 metadata 时继续回退到 category / subCategory / styleTags。

### 6. Travel Packing MVP

- 已完成目的地、天数、场景到打包方案的完整链路。
- 已完成缺口提醒、复穿策略、按天轮换建议、最近方案保存/重开/更新/删除。
- 已完成鞋履与包袋扩展：通勤/正式场景会优先正式鞋和包袋，户外/步行/长途场景会优先舒适鞋，长途可加入备用鞋；缺鞋、缺包、缺外层会说明对旅行执行的影响。
- 已接入用户推荐偏好：轻装用户会减少备用鞋、非必要包袋和复杂配饰；偏完整造型会保留鞋包配饰 slot；不喜欢复杂叠穿会减少三层组合；偏舒适会在步行/户外/长途场景提高舒适鞋优先级。
- 打包候选池已接入共享 evaluator：目的地天气、场景、季节、暖度和舒适度会先影响每个 slot 的过滤与排序，15 度或更冷场景在有替代物时会压低短裤、凉鞋/拖鞋。
- 远端 `travel_plans` 表未就绪时，fallback 存储也会保留完整方案快照，避免重开时静默重算。
- 已通过自动化验证与真实浏览器 dogfood；保存后直接编辑并点击“更新这份方案”也已跑通。

### 7. Shared Outfit Taxonomy + Color Strategy

- 已新增 repo 内规格稿：`docs/superpowers/specs/2026-04-23-outfit-taxonomy-color-strategy-design.md`。
- 已将分类、颜色强弱、基础色/辅助色/重点色等语言下沉到共享 helper。
- Today、Shop、Looks、Travel 已接入第一版共享解释层，减少页面间重复规则分支。
- Today、Shop、Looks、Travel 已接入共享 outfit evaluator，统一输出 `colorHarmony`、`silhouetteBalance`、`layering`、`focalPoint`、`sceneFit`、`weatherComfort`、`completeness`、`freshness` 八个维度；缺少 metadata 时会回退到 category / subCategory / styleTags / seasonTags。
- 配色文案不再把所有中性色都当成“同色系”：黑/灰属于无彩中性色簇，米/卡其/棕属于暖中性色簇，只有真实同簇或同色相才输出“同色系深浅”。
- 下一步不是继续堆研究样本，而是补跨页面真实浏览器截图 QA 和部署环境回归。

### 8. Beta Onboarding + Telemetry Foundation

- 已新增统一 beta helper：bootstrap state、first-run content、feedback link 与 telemetry / issue reporting 接口，避免页面各自维护字符串与入口逻辑。
- Landing 已接入首屏埋点与统一 checklist；Today 与 Closet 已根据首轮使用阶段补充引导、下一步 CTA 和反馈入口。
- App shell 已提供全局“提反馈”入口，确保在主路径和错误态附近都能快速到达外部反馈表单。
- 当前观测层刻意保持轻量：以 API route + server/client helper + Supabase `analytics_events` 为主，不引入新的重监控基础设施。
- Travel / Shop / Looks 已补 beta extension 提示，明确它们在这一轮主要是扩展能力，不抢 `Closet -> Today` 主路径叙事。
- 密码登录、magic-link callback 与登录后首页都已统一走 bootstrap 分流：空衣橱进入 `/closet?onboarding=1`，已有衣橱进入 `/today`。
- 已新增朋友 beta QA 清单与 runbook，覆盖邀请、成功标准、反馈收集、stop/go 阈值和两条 smoke flow。
- Settings 已新增 demo seed 衣橱体验入口：`test@test.com` 用于女装演示衣橱，`test-men@test.com` 用于男装演示衣橱；真实用户可复制演示衣橱到自己的账号，也可一键清空当前账号的衣橱、OOTD、保存搭配和旅行方案；`npm run demo:magiclink` 可创建/确认 seed 账号并生成维护用 magic link。

### 9. Analytics Dashboard MVP

- 已新增 `analytics_events` 事件表迁移、RLS、类型定义、payload 校验、client `trackEvent()`、server `trackServerEvent()` 和 `/api/analytics/track`。
- 已保留旧 `/api/beta/track` 与 `/api/beta/report` 兼容入口，并通过 adapter 映射到新 analytics 事件，避免新旧观测系统分裂。
- 已新增 `/admin/analytics`，通过 `ADMIN_EMAILS` 做管理员保护，server-side service role 查询聚合 Overview、Feature Usage、Funnels、Friction 和 Recommendation Quality。
- Analytics 看板已补 DAU / WAU 历史柱状图，按所选时间范围展示每一期活跃用户；Feature Usage 固定展示 Today、Closet、Travel、Shop、Looks、Auth，并补 Looks 灵感拆解漏斗与失败卡点。
- 推荐质量看板直接复用 `outfit_feedback_events` 的 rating、reason tags 和 context，不复制推荐评分数据。
- 已通过 `npm test`、`npm run build`、`npm run lint`、Supabase 6543 transaction-pooler dry-run 与远端 migration push 验证。

### 10. Strict Recommendation ML Foundation

- 已将 `推荐引擎ref.md` 升级为推荐模型规格源：Capsule Wardrobe、Outfit Formula、Three-Word Method、Personal Color Palette、Sandwich Dressing、Wrong Shoe Theory、2/3 Rule、Proportion Balance、Layering、Tonal Dressing、Occasion Niche、Pinterest Recreation、Trend Overlay 均已有可测试 scorer。
- 已新增统一推荐分数契约：`ruleScores`、`compatibilityScores`、`strategyScores`、`modelScores`、`penalties`、`riskFlags` 和解释文案可被 Today、Shop、Looks、Travel 共享。
- 已新增生产模型读取与融合层：promoted 模型存在时按 `XGBoost 0.72 + LightFM 0.12 + implicit 0.10 + rule 0.06` 主导排序；hard avoids 和天气硬约束不会被模型覆盖。
- 已新增 Python 批量训练入口、ML 依赖说明、训练单测和 GitHub Actions 定时/手动训练 workflow；`--require-native-models` 会强制使用 LightFM、implicit ALS 和 XGBoost Ranker，训练 dry-run 会输出候选分数、实体分数、feature schema artifact、HitRate@K、Recall@K、NDCG@K、MAP@K、coverage、diversity、novelty、wear-through rate、satisfaction-after-wear 和 hard-constraint metrics；本地 Python 3.11 venv 已完成三套原生模型安装与 native dry-run。
- 已通过 `npm test`、`npm run build`、`npm run lint`、13 个策略 scorer 测试、Python 单测、Python compile、Supabase 6543 transaction-pooler push/dry-run、远端 REST smoke 和本地 native training dry-run 验证。

### 11. Complete Recommendation Engine Rollout

- 已将 Outfit Formula 从 scorer 升级为一等公民候选生成器，Today 候选池现在包含公式候选、模型 seed 候选、规则 dress/separates/partial 候选、天气约束候选和安全灵感候选，并保留确定性 `formulaId` / `recallSource` 供离线评估使用。
- 已新增可控趋势字典：`recommendation_trends` 远端表和 editorial seed 取代纯静态趋势 tokens；线上读取失败时仍回退到默认趋势，不依赖外部社媒采集。
- 已新增细粒度学习信号：`recommendation_learning_signals` 记录 user-item-context、item-pair、color、silhouette 和 hidden item；`skipped` 只是弱负反馈，`hidden_item` 才作为硬过滤进入评分。
- 已增强离线训练与发布门槛：GitHub Recommendation Training 支持 `dry_run`、`lookback_days`、`min_interactions`、`promote` 输入；训练指标补上标准 NDCG/MAP、item/category/color/formula coverage、intra-list diversity、edit rate 和 item repetition rate；默认至少 50 rows、3 positive users、10 positive candidates 且无 hard constraint violation 才允许 promote。
- 已通过 `npm run lint`、`npm test`、`npm run build`、Python compile、Python 单测、本地 native training dry-run、Supabase 6543 push/dry-run、migration list 和远端 REST smoke 验证。

## 当前风险 / 待验证

- 远端 Supabase schema 已完成 recommendation storage、`items.algorithm_meta` reconciliation 与 `analytics_events` migration push。
- `/admin/analytics` 需要部署环境持续配置 `ADMIN_EMAILS` 与 `SUPABASE_SERVICE_ROLE_KEY`；缺少 service role 时页面无法读取全站事件，缺少 admin email 时管理员会看到 404。
- Closet 的右转 90° 需要在旧库环境里再点一轮真实浏览器确认，确保不再触发 node/server action 报错。
- Closet 仍是客户端体积重点：当前导入、远程链接、拼图与编辑能力集中在同一交互岛里，下一轮若继续压包，应优先把低频导入/图片处理路径懒加载。
- 移动端底部导航在 full-page 截图里会覆盖部分中段内容；实际滚动底部已有 padding，但 beta 前仍建议再做一次手感微调。
- Today、Shop、Looks、Travel 已完成共享 evaluator 的单元测试覆盖；后续仍可补视觉回归截图覆盖更多文案状态。
- Phase 9 beta readiness checklist 已创建：`docs/beta-readiness-checklist.md` 覆盖 Auth、偏好、Today、Looks、Shop、Travel、移动端和 CI/部署验收；真实邮箱 Auth、Vercel build、移动端手感仍需在目标环境逐项打勾。
- Supabase 迁移检查已修正为 IPv4 transaction pooler + disabled statement cache 路径；`supabase db push --include-all` 与 `npm run travel:db:check` 当前均可确认远端 schema reachable/up to date。
- 严格版推荐模型与完整六项上线迁移 `20260427103000_add_recommendation_model_tables.sql`、`20260427142000_add_recommendation_trends_learning_signals.sql` 已执行远端 push；当前 90 天远端 training dry-run 只有 6 行事件、0 个 positive user/candidate，真实 promoted 训练仍需等推荐事件达到默认门槛后再触发。
- Auth 还需要一轮真实邮箱与部署环境验证，覆盖“默认密码直登”和“改密后使用其他密码”两个分支。
- Shop 对淘宝 / 得物的商品图兼容仍有继续提升空间，但当前先保持核心服饰范围，不扩品类。

## 环境与运行约定

### 稳定配置

- AI 识图当前使用 DashScope OpenAI-compatible 接口：
  - `OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1`
  - `OPENAI_MODEL=qwen-vl-max`
- 天气能力依赖 `WEATHER_API_KEY`；未配置时不阻塞 Today 基础推荐。
- Supabase Storage bucket 为 `ootd-images`（public）。

### 会话读取约定

1. 先读本文件，确认当前稳定状态与未闭环事项。
2. 再读未完成或最近修改的 `docs/superpowers/plans/*.md`，不要默认通读全部 plans。
3. 优先使用 Gstack `/context-restore`；恢复失败时只读最新一个 checkpoint，只有明显缺上下文时再回看上一个。
4. `docs/process/progress-sync.md` 只在 `/context-save` / `/context-restore` 不可用，或 checkpoint 缺失时作为兜底索引打开。

### 记录分层约定

- `PROGRESS.md` 只记录长期稳定状态，不记录 session 级小改动。
- `docs/superpowers/specs/*.md` 和 `docs/superpowers/plans/*.md` 负责设计与执行细节。
- Gstack checkpoint 只记录单次工作批次的增量变化，不复述整个项目总览。
- `docs/process/progress-sync.md` 只保留流程契约与极短镜像，不作为第二份项目总表。

## 下一步

1. 用 `ADMIN_EMAILS` 内账号在部署环境打开 `/admin/analytics` 做一次真实数据 smoke，确认 DAU / WAU 柱状图、Looks 使用行和 Looks 漏斗有数据。
2. 按 `docs/beta-readiness-checklist.md` 跑目标环境 beta go/no-go：优先 Auth、推荐偏好、Today、移动端和 CI/部署。
3. 用 `test@test.com` 维护女装 demo 图片衣橱，用 `test-men@test.com` 维护男装 demo 图片衣橱，并在部署环境验证“复制演示衣橱”和“清空我的衣橱”两条 Settings 路径。
4. 用部署环境做一轮真实邮箱 Auth QA，覆盖 magic link、默认密码直登、改密后密码登录和 bootstrap 分流。
5. 继续压缩 Closet 客户端岛：优先把拼图拆分、远程图片处理、重识别等低频路径拆成懒加载模块。
6. 为 Today、Shop、Looks、Travel 的关键推荐和文案状态补视觉回归截图或手动截图 QA。
7. 等真实 `recommendation_interactions` 达到训练门槛后，手动触发 Recommendation Training workflow，并仅在 `promote=true`、指标过门槛时发布 promoted candidate/entity scores。
