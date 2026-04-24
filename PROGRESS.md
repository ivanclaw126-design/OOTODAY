# OOTODAY 进度追踪

> 最后更新：2026-04-24
> 角色：项目总览页。这里只记录当前稳定状态、已完成里程碑、未闭环事项和运行约定，不记录 session 级流水账。

## 当前状态

- App shell + Supabase foundation 已完成并在主线可用：Landing、Today、Closet、Shop、Looks、Travel 页面都已有可运行骨架与受保护路由。
- Closet 已具备第一阶段低成本导入闭环：本地图片上传、相册批量导入、商品链接或图片链接导入、拼图拆分导入，以及保存后继续浏览和编辑。
- Closet 已具备第一阶段整理能力：重复提醒、闲置提醒、基础缺口、优先动作清单、按类型/按颜色分组浏览、编辑识别结果、重新识别、删除、图片右转 90°。
- Today + OOTD 已形成主链路：基于衣橱生成规则型推荐，支持天气增强、城市保存、换一批推荐、记录今日已穿、满意度反馈、最近历史查看与编辑/删除。
- Beta 首轮体验已开始收敛：登录后入口会按衣橱状态自动分流到 `Closet onboarding` 或 `Today`，Landing / Closet / Today 已接入统一 first-run checklist、明确的下一步 CTA 与可达的反馈入口。
- Beta 最小观测层已落地：Landing、登录邮件发送、Closet 导入启动与保存、Today 浏览、OOTD 提交、反馈入口打开已接入轻量 telemetry；登录失败、导入失败、识别失败、Today 提交失败等高价值路径已接入统一 issue reporting，且失败不会阻塞主流程。
- Today / Closet 已完成第一轮 server-client 边界收敛：页面壳、状态头和主路径提示已回到服务端，交互性的推荐/历史/设置与衣橱导入/浏览/编辑收敛到更小的客户端工作区；路由层已补 Suspense fallback，并已完成一轮 dev browser QA 与 bundle manifest 复核。
- Shop 已完成第一版购买分析：支持商品链接、本地图片、图片 URL 输入，输出重复风险、可搭套数、购买建议，并具备基础平台兼容与非服饰拦截。
- Looks 已完成第一版灵感复刻：支持上传灵感图或图片链接，输出风格拆解、关键单品、衣橱借用建议和“我的版本怎么穿”。
- Travel 已完成第一版打包方案：支持目的地、天数、场景生成旅行清单、按天轮换建议、最近方案保存/重开/更新/删除。
- 配色与分类规则已进入共享层：Today、Shop、Looks、Travel 均开始复用统一的 taxonomy 与 color strategy helper。

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

### 4. Shop Purchase Analysis MVP

- 已完成商品链接、图片 URL、本地图片三种输入方式。
- 已完成基础站点处理：京东可提图，拼多多会拦截通用分享图，淘宝 / 得物会给出更准确提示。
- 已完成非服饰类目拦截，避免输出误导性购买建议。
- 已完成结果结构化输出：重复风险、预计可搭套数、是否值得买，以及颜色策略解释。
- 当前仍刻意限制在核心服饰，不扩到鞋包配饰。

### 5. Looks Inspiration Remix MVP

- 已完成灵感图拆解、关键单品提炼、整体风格总结与可执行搭配建议。
- 已完成与现有衣橱的借用匹配，并补上“我的版本怎么穿”复刻路径。
- 已开始复用共享颜色解释层，可说明这套灵感为什么成立，以及复刻时应优先保住哪一处重点。

### 6. Travel Packing MVP

- 已完成目的地、天数、场景到打包方案的完整链路。
- 已完成缺口提醒、复穿策略、按天轮换建议、最近方案保存/重开/更新/删除。
- 远端 `travel_plans` 表未就绪时，fallback 存储也会保留完整方案快照，避免重开时静默重算。
- 已通过自动化验证与真实浏览器 dogfood；保存后直接编辑并点击“更新这份方案”也已跑通。

### 7. Shared Outfit Taxonomy + Color Strategy

- 已新增 repo 内规格稿：`docs/superpowers/specs/2026-04-23-outfit-taxonomy-color-strategy-design.md`。
- 已将分类、颜色强弱、基础色/辅助色/重点色等语言下沉到共享 helper。
- Today、Shop、Looks、Travel 已接入第一版共享解释层，减少页面间重复规则分支。
- 下一步不是继续堆研究样本，而是继续统一 score / explanation 结构，并补跨页面真实 QA。

### 8. Beta Onboarding + Telemetry Foundation

- 已新增统一 beta helper：bootstrap state、first-run content、feedback link 与 telemetry / issue reporting 接口，避免页面各自维护字符串与入口逻辑。
- Landing 已接入首屏埋点与统一 checklist；Today 与 Closet 已根据首轮使用阶段补充引导、下一步 CTA 和反馈入口。
- App shell 已提供全局“提反馈”入口，确保在主路径和错误态附近都能快速到达外部反馈表单。
- 当前观测层刻意保持轻量：以 API route + server/client helper 为主，不引入新的重监控基础设施。
- Travel / Shop / Looks 已补 beta extension 提示，明确它们在这一轮主要是扩展能力，不抢 `Closet -> Today` 主路径叙事。
- 密码登录、magic-link callback 与登录后首页都已统一走 bootstrap 分流：空衣橱进入 `/closet?onboarding=1`，已有衣橱进入 `/today`。
- 已新增朋友 beta QA 清单与 runbook，覆盖邀请、成功标准、反馈收集、stop/go 阈值和两条 smoke flow。

## 当前风险 / 待验证

- `travel_plans` 远端表仍需在可连通 Supabase Postgres 的环境里执行迁移，当前线上仍可能走 fallback。
- `items.image_flipped` 远端列也仍需正式推上远端库；当前兼容兜底能防止报错，但不是最终持久化状态。
- Closet 的右转 90° 需要在旧库环境里再点一轮真实浏览器确认，确保不再触发 node/server action 报错。
- Closet 仍是客户端体积重点：当前导入、远程链接、拼图与编辑能力集中在同一交互岛里，下一轮若继续压包，应优先把低频导入/图片处理路径懒加载。
- 移动端底部导航在 full-page 截图里会覆盖部分中段内容；实际滚动底部已有 padding，但 beta 前仍建议再做一次手感微调。
- Today、Shop、Looks、Travel 已接入共享颜色规则层，但还缺一轮更系统的跨页面语言一致性 QA。
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

1. 在可连通远端 Supabase Postgres 的环境里执行迁移，补上 `travel_plans`、`items.image_flipped` 与 beta 衣物元数据字段的正式远端落库。
2. 继续压缩 Closet 客户端岛：优先把拼图拆分、远程图片处理、重识别等低频路径拆成懒加载模块。
3. 用部署环境做一轮真实邮箱 Auth QA，覆盖 magic link、默认密码直登、改密后密码登录和 bootstrap 分流。
4. 对 Today、Shop、Looks、Travel 做一轮跨页面语言一致性 QA，重点检查共享颜色解释层和 beta extension 提示。
