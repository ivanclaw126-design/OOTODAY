# OOTODAY 进度追踪

> 最后更新：2026-04-22

## 当前状态

**Today 推荐 + OOTD 反馈 MVP 已完成代码、测试与基础浏览器验证。Today 页面现在又完成了一轮视觉精修，推荐卡、状态头和历史记录都更偏“清晰的穿搭决策面板”。**

**Shop 购买分析 MVP 第一版已完成代码、测试与构建验证。**

**Shop 页面现在也完成了一轮 beta 视觉精修：买前分析入口、上传区和分析结果都更像“先做购买判断”的决策页。**

**Inspiration 灵感复刻 MVP 第一版已完成代码与测试，当前支持灵感图拆解、关键单品提炼、衣橱借用匹配与“我的版本怎么穿”复刻建议。**

**Closet 现在已补上第一版整理建议，会把现有衣橱转成重复提醒、闲置提醒和基础缺口。**

**Closet 整理建议现在也支持点选筛选，用户可以直接从建议卡片跳到对应衣物视角。**

**Closet 现在还会把整理建议收束成一份“下一步先做这些”的动作清单，明确先补什么、先保留哪件、先复盘哪件。**

**Closet 页面现在做了第一轮移动端 IA 整理：导入、整理建议和衣橱清单被拆成更清晰的分区，顶部导入入口也更像一个独立的起点。**

**Closet 现在已支持相册批量导入第一版，会按队列逐张分析并确认后入橱。**

**Closet 现在也支持粘贴商品链接或图片链接导入，并复用现有识别与保存链路。**

**Closet 现在还支持拼图拆分导入第一版：先手动框出 2-4 个单品，再拆成多张图片接回现有导入队列。**

**Closet 的链接导入现在会先把远程图片安全转存到 Supabase Storage，再进入识别与保存链路，不再直接把外链图片落库。**

**Travel Packing MVP 已正式启动并完成第一版代码落地，当前 `/travel` 已支持根据目的地、天数和场景生成基于真实衣橱的旅行打包清单。**

**Travel 现在还会进一步给出“按天轮换建议”，把每天的大致穿搭节奏排出来。**

**Travel 现在还支持保存旅行方案，并在同页展示可重新打开的最近保存方案列表。**

**Travel 已保存方案与 Closet 已保存衣物现在都支持删除，并且会先弹确认再执行。**

**Travel 保存方案现在在 fallback 存储下也会保留完整快照，重新打开时优先展示保存当时的方案结果，而不是偷偷按当前衣橱重算。**

**Travel 现在支持直接编辑和更新已保存方案，重开旧方案后修改城市、天数或场景会覆盖当前方案，而不是重复新建。**

**Travel 编辑态现在会直接按当前表单输入重算并更新已保存方案，不再要求先手动点一次“生成打包清单”。**

**Travel 页面现在也完成了一轮信息层级重构：行程设定、摘要、建议打包和按天轮换更像连续的出行决策流程。**

**已补充一轮真实浏览器 QA：`/today` 天气成功分支通过，`/shop` 对淘宝 / 京东 / 拼多多 / 得物链接已补上第一轮站点级处理，并会提前拦截非服饰商品。当前 `/shop` 也已支持本地图片上传与桌面拖拽分析。**

当前主链路状态：
- 衣橱上传流已完成 QA 验证 ✓
- Today 页面已接入规则型推荐 ✓
- 城市现在为可选字段，不阻塞推荐 ✓
- 有城市时尝试加载天气，无天气时自动降级为基础推荐 ✓
- 支持在 Today 页面修改城市与“换一批推荐” ✓
- Today recommendation cards now support "记为今日已穿" feedback ✓
- OOTD feedback writes one same-day row to `ootd` ✓
- Satisfaction score 1-5 is required before submit ✓
- Same-day duplicate OOTD submission is blocked ✓
- OOTD 提交会回写 `items.last_worn_date / wear_count` ✓
- Today 推荐会优先避开最近刚穿过的单品 ✓
- Today 页面会展示最近 OOTD 历史记录 ✓
- Today 页面已完成一轮视觉重构：状态头更有层次，3 张推荐卡更像明确的 outfit decision，历史记录也改成了更轻的时间线样式 ✓
- Shop 页面已上线商品图片 URL 购买分析第一版 ✓
- Shop 页面已完成一轮 beta 视觉精修：输入区更像购买决策入口，分析结果也被整理成 verdict / risk / yield 的清晰结构 ✓
- 购买分析会输出重复风险、预计可搭套数和买不买建议 ✓
- 天气查询已支持中文城市名 fallback（如 `上海`）✓
- Shop 页面已支持真实商品链接解析，能自动提取主图与标题 ✓
- Shop 现在也支持无文件扩展名的真实图片直链（按 `Content-Type` 识别）✓
- Shop 已补上第一轮平台级兼容规则：京东可提取商品图，拼多多会拦截通用分享图，淘宝 / 得物会返回更准确的站点提示 ✓
- Shop 现在会在购买分析前拦截非服饰类目，避免工业品 / 配件类链接产出误导性的穿搭建议 ✓
- Shop 现在支持本地图片上传分析，兼容电脑端文件选择 / 拖拽与 iOS 端相册或拍照上传 ✓
- Inspiration 页面已上线灵感图拆解第一版，支持上传本地图片或粘贴图片链接 ✓
- Inspiration 会输出整体风格总结、关键单品和可执行搭配提示 ✓
- Inspiration 会结合现有衣橱，给出每个关键单品最接近的借用建议 ✓
- Inspiration 现在会进一步整理出“我的版本怎么穿”复刻步骤，并明确当前缺口单品 ✓
- Closet 页面现在会生成第一版整理建议：重复单品、闲置提醒、基础缺口 ✓
- Closet 整理建议卡片现在可直接驱动列表筛选：支持查看重复单品、单件闲置单品和基础缺口对应视角 ✓
- Closet 现在会把重复、闲置和缺口整合成最多 3 条优先动作，直接引导“先补 / 先留 / 先复盘” ✓
- Closet 现在支持一次多选多张本地图片批量导入，并会逐张进入同一套 AI 分析与确认链路 ✓
- Closet 现在支持商品链接或图片链接导入，能复用 Shop 的远程图片解析能力进入衣橱保存流 ✓
- Closet 现在支持拼图拆分导入：手动保留 2-4 个裁剪框后，会把拆出的单品图送回同一套批量导入队列 ✓
- Closet 的远程链接导入现在会先转存到当前用户的 Supabase Storage，再进入识别与保存流 ✓
- Travel 页面已上线第一版旅行打包能力：目的地 + 天数 + 场景 -> 打包清单 / 风险缺口 / 复穿策略 ✓
- Travel 页面已完成一轮 beta 视觉精修：行程设定页头、摘要卡、轮换建议和最近保存方案的层级更清楚 ✓
- Travel 现在会继续把打包清单拆成按天轮换建议，帮助用户直接看到每天怎么复穿和切换 ✓
- Travel 现在支持把当前打包方案保存下来，并在页面上展示最近 5 条可重新打开的旅行方案 ✓
- Travel 最近保存方案现在支持删除，且删除前会弹确认 ✓
- Closet 已保存衣物现在支持删除，且删除前会弹确认 ✓
- Closet 删除衣物现在即使 Storage 清理失败，也不会把已经成功的删除操作伪装成失败 ✓
- Travel fallback 保存现在也会保留完整方案快照，重新打开已保存方案时不再只按当前参数重算 ✓
- Travel 现在支持编辑已保存方案：重开后会进入编辑态，保存时优先更新当前方案而不是重复创建 ✓
- Travel 编辑态现在会直接读取当前输入并重算后再保存，修改天数 / 城市 / 场景后可直接点“更新这份方案”完成覆盖 ✓

数据库已有 2 条衣物记录，未登录访问 `/today` 会正确跳回首页登录入口。

## 已完成

### 1. 第一阶段「App Shell + Supabase Foundation」

已完成并落地的基础能力包括：
- Next.js 16 App Router + React 19 + Tailwind CSS 4 基础工程
- Supabase env / browser client / server client / middleware
- magic link 登录回调与受保护路由
- `/today`、`/closet` 页面骨架与未登录重定向
- 初始 schema migration：`profiles`、`items`、`outfits`、`ootd`
- 基础测试与生产构建验证

### 2. 衣橱上传流 MVP

已完成并验证通过：
- 图片上传到 Supabase Storage
- AI 分析衣物分类信息
- 用户确认后保存到 `items` 表
- 页面刷新后展示已上传衣物
- Closet 页面会把全量衣橱数据整理成规则型建议：重复、闲置、缺口
- Closet 页面现在也会给出一份按优先级排序的整理动作清单，帮助用户直接开始处理衣橱
- Closet 上传现在已扩到三条低成本导入入口：相册批量多选 + 商品链接 / 图片链接导入 + 拼图拆分导入
- Closet 远程链接导入现在会先把图片安全转存到 Supabase Storage，再统一走当前用户自己的衣橱图片路径

核心文件：
- `components/closet/closet-upload-card.tsx`
- `components/closet/closet-upload-form.tsx`
- `app/closet/actions.ts`
- `lib/closet/analyze-item-image.ts`
- `lib/closet/save-closet-item.ts`
- `app/closet/page.tsx`

### 3. Today 推荐 + OOTD 反馈 MVP

已完成并验证通过：
- `lib/today/types.ts` 新增 Today 域类型与 OOTD 状态
- `lib/today/get-weather.ts` 新增天气读取与归一化
- `lib/today/generate-recommendations.ts` 新增规则型推荐生成器
- `lib/today/get-today-view.ts` 新增 Today 服务端视图组装与当日 OOTD 状态读取
- `lib/today/build-ootd-notes.ts` 新增 OOTD 摘要生成
- `lib/today/get-today-ootd-status.ts` 新增当日 OOTD 查询
- `lib/today/save-today-ootd-feedback.ts` 新增 OOTD 保存与重复拦截
- `lib/today/get-recent-ootd-history.ts` 新增最近 OOTD 历史读取
- `lib/closet/get-closet-view.ts` 现在会带出 `last_worn_date / wear_count`
- `app/today/actions.ts` 新增城市保存、OOTD 提交与推荐轮换 action
- `app/today/page.tsx` 接入 `profile.city`、weather、offset 轮换与 OOTD 提交 action
- `components/today/*` 从推荐展示升级为可提交反馈的 Today 页面
- `components/today/today-ootd-history.tsx` 新增最近穿搭记录展示

Today + OOTD MVP 行为：
- 未设置城市时继续给基础推荐
- 设置城市后尝试加载天气增强推荐
- 天气请求失败时自动降级为无天气推荐
- “换一批推荐”通过 `?offset=` 轮换结果
- 推荐历史不持久化
- 推荐卡内可直接“记为今日已穿”
- 提交前必须选择 1-5 满意度
- 提交成功后同页切换为“今日已记录”
- 同一用户同一天只允许记录一条 OOTD
- OOTD 反馈直接写入 `ootd.user_id / worn_at / satisfaction_score / notes`
- OOTD 成功提交后会同步更新本次涉及衣物的 `last_worn_date / wear_count`
- Today 推荐优先选择未穿过或更久没穿的单品，减少连续重复推荐
- Today 页面会展示最近 5 条 OOTD 的时间、满意度和记录摘要

### 4. 测试覆盖

已通过的测试包括：
- `tests/components/closet-upload-card.test.tsx` (8 tests)
- `tests/app/closet/actions.test.ts` (12 tests)
- `tests/lib/closet/analyze-item-image.test.ts` (8 tests)
- `tests/lib/closet/save-closet-item.test.ts` (2 tests)
- `tests/lib/closet/build-closet-insights.test.ts` (1 test)
- `tests/components/closet-page.test.tsx` (3 tests)
- `tests/lib/today/get-weather.test.ts` (4 tests)
- `tests/lib/shop/analyze-purchase-candidate.test.ts` (4 tests)
- `tests/lib/shop/resolve-shop-input.test.ts` (8 tests)
- `tests/lib/today/generate-recommendations.test.ts` (4 tests)
- `tests/lib/today/build-ootd-notes.test.ts` (2 tests)
- `tests/lib/today/save-today-ootd-feedback.test.ts` (4 tests)
- `tests/lib/today/get-today-view.test.ts` (2 tests)
- `tests/lib/today/get-recent-ootd-history.test.ts` (1 test)
- `tests/app/today/actions.test.ts` (4 tests)
- `tests/app/shop/actions.test.ts` (4 tests)
- `tests/components/today-page.test.tsx` (7 tests)
- `tests/components/travel-page.test.tsx` (2 tests)
- `tests/components/travel-page.test.tsx` (3 tests)
- `tests/components/shop-page.test.tsx` (4 tests)
- `tests/lib/inspiration/analyze-inspiration-image.test.ts` (1 test)
- `tests/lib/inspiration/match-closet-to-inspiration.test.ts` (1 test)
- `tests/lib/inspiration/build-inspiration-remix-plan.test.ts` (1 test)
- `tests/lib/travel/build-travel-packing-plan.test.ts` (3 tests)
  - 其中已覆盖温和天气分支与按天轮换建议
- `tests/lib/travel/save-travel-plan.test.ts` (2 tests)
- `tests/lib/travel/get-recent-travel-plans.test.ts` (2 tests)
- `tests/lib/travel/get-travel-plan-by-id.test.ts` (2 tests)
- `tests/app/travel/actions.test.ts` (1 test)
- `tests/app/travel/actions.test.ts` (2 tests)
- `tests/app/travel/actions.test.ts` (4 tests)
- `tests/app/inspiration/actions.test.ts` (2 tests)
- `tests/components/inspiration-page.test.tsx` (2 tests)
- 其他组件测试

**当前测试状态：118/118 通过**

### 5. QA 验证结果

已通过的本地验证包括：
- `/closet` 页面正常渲染
- 图片上传到 Supabase Storage 成功
- AI 分析返回正确衣物分类信息
- 数据保存到 `items` 表成功
- 页面刷新后显示已上传衣物
- 未登录访问 `/today` 会重定向到 `/`
- 登录态下 `/today` 可展示推荐卡
- 登录态下“换一批推荐”会切换到 `?offset=1`
- 登录态下可展开城市编辑表单
- 登录态下可保存城市，并在缺少天气配置时显示“天气暂时不可用”而不是报错
- 登录态下推荐卡可展开“记为今日已穿”评分表单
- 未选择满意度前“提交今日记录”保持禁用
- 选择满意度并提交后，同页全部推荐卡切换为“今日已记录”
- 页面刷新后仍保持“今日已记录”状态
- 登录态下 `/shop` 已完成真实手工 QA：UNIQLO 商品页链接可成功解析主图并返回购买建议
- 登录态下 `/shop` 已完成真实手工 QA：Unsplash 这类无扩展名图片直链现在可成功识别并完成分析
- 登录态下 `/shop` 已完成真实手工 QA：`127.0.0.1` 这类本地地址会被明确拦截，SSRF 防护生效
- 登录态下 `/today` 已完成真实天气成功分支浏览器 QA，页面展示 `Shanghai Municipality · 18°C · mist`
- 登录态下 `/shop` 已完成平台链接实测：
  - 淘宝链接现在会明确提示“淘宝链接当前会跳登录拦截，请先贴商品图片链接”
  - 京东链接现在可解析 `imageList` 并走完整分析链路
  - 拼多多链接现在会明确提示“这个链接当前只能拿到站点通用分享图，请直接贴商品图片链接”
  - 得物链接现在会明确提示“得物链接当前无法稳定解析，请先贴商品图片链接”
- 登录态下 `/shop` 已完成真实浏览器 QA：京东工业品链接现在会被直接拦下，并提示“当前只支持上衣、裤装、裙装、连衣裙、外套这类服饰单品分析”
- 登录态下 `/shop` 已完成真实浏览器 QA：本地图片点选上传可成功进入 Storage -> 分析链路 -> 返回结果
- 登录态下 `/shop` 的真实桌面拖拽已由用户手工验证成功
- `/shop` 本地图片上传与桌面拖拽也已完成组件级验证：支持直接上传图片后走同一套购买分析链路，iOS 端继续通过 `image/* + capture=environment` 调起相册 / 拍照入口
- Inspiration 现在已完成测试级验证：除了灵感拆解和衣橱借用匹配外，还会稳定返回复刻完成度、复刻步骤和缺口单品
- `/closet` 已完成真实浏览器 QA：页面会基于真实衣橱数据展示整理建议，当前数据下已看到重复提醒与基础缺口卡片
- `/closet` 的筛选交互已完成测试级验证：可从整理建议卡片切换到重复 / 缺口对应的衣物视角，并可恢复查看全部
- `/closet` 的整理动作清单已完成测试级验证：点击“先补 / 先留 / 先复盘”会切到对应衣物或缺口视角
- `/closet` 的相册批量导入已完成测试级验证：一次选择多张图片后，会逐张进入分析与确认队列，保存当前项后自动切到下一张
- `/closet` 的链接导入已完成测试级验证：商品链接或图片链接可直接进入同一套 AI 识别与保存表单
- `/closet` 的拼图拆分导入已完成测试级验证：选择 1 张拼图、保留 2-4 个裁剪框后，可稳定拆成多张单品图并重新接入原有导入队列
- `/closet` 的远程链接导入已完成服务端安全转存验证：远程图片会先做 SSRF / redirect / content-type / 大小校验，再转存到当前用户 Storage 路径后分析保存
- `/closet` 已补一轮新的真实浏览器 QA：公网图片链接导入修复后可重新进入识别链路并成功保存，衣橱计数已从 `10` 增加到 `11`
- `/closet` 已补一轮真实浏览器 QA：相册多图队列、链接导入、拼图拆分导入三条流都已在本地登录态下实际跑通
- 相册多图队列真实表现：系统文件选择器支持多选，页面会真实显示 `1/3 -> 2/3 -> 3/3`，保存与跳过都会自动切到下一张，最后一张结束后会退出导入流并刷新列表
- 链接导入真实表现：使用已有 Unsplash 图片链接可成功进入确认表单并保存，`已收录` 计数从 `8` 增到 `9`
- 拼图拆分真实表现：默认 2 个裁剪框即可直接“拆成 2 张并继续导入”，拆分后会真实进入 `1/2` 导入队列，至少 1 张裁剪图已成功保存入橱
- 这轮真实 QA 还看到两个待后续处理的交互问题：
  - 多图 / 拼图导入过程中，预览区偶发会出现两张大图上下堆叠，当前处理项和排队项的视觉边界不够清楚
  - AI 识别结果的语言归一化还不稳定，同样是导入衣物，部分结果会落成 `pants / jeans / blue` 这类英文值
- `/travel` 已完成测试级验证：能在空配置态显示规划表单，并在有旅行数据时输出打包清单、缺口提醒和策略说明
- `/travel` 已完成真实浏览器 QA：空态、正常生成链路和真实天气摘要都已跑通
- `/travel` 已完成真实浏览器复验：按天轮换建议会真实出现在生成结果里
- `/travel` 已完成真实浏览器 QA：生成后的“保存这次方案”可成功提交，页面会重定向到 `saved=1`，出现保存成功提示，并在“最近保存方案”里显示刚保存的记录
- `/travel` 已补一轮新的真实浏览器 QA：编辑已保存方案时，直接把 `东京 5天 · 通勤/休闲` 改成 `东京 6天 · 通勤/休闲` 后，不需要先点“生成打包清单”，直接点“更新这份方案”即可完成重算与覆盖，最近方案列表也会同步更新

当前未完成的 QA：
- “换一批推荐”在当前测试数据下 URL 会变化，但因衣橱只有 2 件同类上衣，推荐文案变化有限
- 这个真实数据暴露出一个已修复的问题：只有上衣、没有完整套装时，旧实现会返回空推荐
- 另一个已修复的问题：保存城市后如果未配置天气 key，旧实现会直接抛错而不是降级
- 这次真实 QA 又暴露并修复了一个问题：无扩展名图片 URL 旧实现会误判成商品页链接，现已改为按响应 `Content-Type` 识别图片
- 这次真实 QA 还暴露并修复了几个平台兼容性问题：
  - 京东商品页主图原本未被解析，现已补 `imageList` 提取
  - 拼多多原本会误用站点通用分享图，现已改为显式拦截
  - 淘宝原本只会落成“找不到主图”，现已改为显式提示登录拦截
  - 得物原本只会落成普通打不开，现已改为显式提示站点当前不稳定
- 这次还补了一层输入护栏：非服饰类目现在会在购买分析前直接拦截，避免像京东工业品这样的链接被误做穿搭推荐
- `/inspiration` 已完成真实浏览器狗粮：图片链接与本地上传都能跑通整体判断、衣橱借用建议和“我的版本怎么穿”
- `/inspiration` 的“删除当前图片”已完成真实浏览器验证，点击后会清空预览、结果和自动填入的图片地址
- 同日重复提交在浏览器实测中已确认首次提交后与页面刷新后都会稳定显示“今日已记录”，且数据库当天仅写入 1 条 `ootd` 记录；但尚未在浏览器 UI 中直接看到二次提交返回“今天已经记录过穿搭了”的错误文案
- 真实 `ootd` 表写入结果已通过只读数据库查询复核：最新一条记录写入成功，且页面提交后与刷新后的 recorded 状态一致
- Closet 新增的“下一步先做这些”动作清单当前已完成单测与组件测试，尚未补真实浏览器狗粮
- `/travel` 真实浏览器 QA 中暴露并修复了一个问题：天气摘要已成功返回时，策略文案在“温和天气”分支仍错误显示成“天气数据暂时不可用”，现已修复
- `/travel` 这次真实浏览器 QA 又暴露出一个运行时问题：当前远端 Supabase 还没有 `travel_plans` 表时，页面会直接报错；现已改成优先写 `travel_plans`，表未上线时自动回退到现有 `outfits` 表保存轻量旅行元数据，所以功能已可真实使用，后续再把 migration 推上去即可切回专用表
- 这轮已经把 Travel 从“可保存快照”推进成“可编辑更新”：当前打开已保存方案时会进入明确编辑态，更新后仍回到同一份方案，不会越改越多条
- 这轮真实 QA 又暴露并修复了一个 Travel 编辑态问题：旧实现虽然文案声称“改完可直接更新”，但实际上仍依赖旧隐藏方案；现已改成服务端按当前表单输入重新生成并覆盖保存
- 这轮还补了一个可执行的远端检查入口：`npm run travel:db:check`。当前它能确认 linked project 存在，但这台环境连远端 Supabase Postgres 会超时，所以远端 migration 的阻塞点已经明确为网络连通性，而不是本地 migration 缺失
- Travel / Closet 新增的删除能力当前已完成单测、组件测试、构建与 lint 验证，尚未补真实浏览器点击删除弹窗的手工 QA
- 这轮又补掉了两个 review 暴露的问题：
  - Closet 删除现在把 Storage 清理降级为 best-effort，不会因为清理图片失败而把已成功删除的衣物误报成失败
  - Travel fallback 保存不再只存参数，现已保存完整方案快照，重新打开时会优先展示保存当时的方案结果
- 这轮继续把“低成本衣橱导入”往前推了一步：
  - 已补相册批量导入第一版
  - 已补拼图拆分导入第一版，当前采用手动框选 2-4 个裁剪框的人机协作方案
  - 已补商品链接 / 图片链接导入第一版，并已改成先抓取后安全转存到 Supabase Storage，再进入衣橱保存流
  - 这轮尝试补真实浏览器狗粮时，Chrome 被用户实时占用、Safari 自动化权限又被拒绝，所以新导入链路的真实浏览器复验还需要补一轮

## 当前配置

### AI 配置（通义千问）

## 当前配置

### AI 配置（通义千问）
```
OPENAI_API_KEY=<DashScope API Key>
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-vl-max
```

### 天气配置
```
WEATHER_API_KEY=<Weather API Key>
# 可选：WEATHER_BASE_URL=https://api.openweathermap.org/data/2.5/weather
```

### Supabase 配置
- Storage bucket: `ootd-images` (public)
- 表：`profiles`、`items`、`outfits`、`ootd`（均已创建 RLS policies）
- 已新增 migration：`travel_plans`；当前远端库尚未推上该表时，Travel 保存能力会自动回退到 `outfits`

## 验证过程中的环境发现

- worktree 需要单独安装 `node_modules`
- worktree 本地浏览器验证需要单独提供 `.env.local`

## 记录同步约定

- `PROGRESS.md` 是项目当前进展的唯一事实源
- Superpowers 进度优先使用其原生产物与流程记录：
  - `docs/superpowers/specs/*.md`
  - `docs/superpowers/plans/*.md`
  - plan checkbox 与执行状态
- Gstack 进度优先使用其原生保存与恢复：
  - `/context-save`
  - `/context-restore`
  - `.gstack-meta/` 或 `~/.gstack/projects/OOTODAY/` 下的 checkpoint / planning artifacts
- 每次开发收尾都应同步更新：
  - `PROGRESS.md`
  - 涉及到的 `docs/superpowers/plans/*.md`
  - Gstack `/context-save`
  - `docs/process/progress-sync.md` 中的 latest sync snapshot（作为镜像，不替代原生存储）
- 每次进入新会话都应优先尝试 Gstack `/context-restore`
- 如果当前环境不能直接写入 Gstack checkpoint，至少要把 intended checkpoint summary 写进 `docs/process/progress-sync.md`

## 下一步

1. 条件允许时，在能连通远端 Supabase Postgres 的环境里运行 `npm run travel:db:check`，再执行 `supabase db push`，把 `travel_plans` 真正推上远端
2. 给 Travel 已保存方案补更进一步的产品语义，例如“另存为新方案”或“未保存改动提醒”，避免所有编辑都只能覆盖
3. 如果需要，再补一轮真实浏览器 QA，手动验证 Travel / Closet 的删除确认弹窗与删除后页面刷新表现
4. 补做一次更强的同日重复提交复现，直接捕获浏览器 UI 或网络层返回的重复提交错误文案

## 本次修改涉及文件

- `lib/today/types.ts`
- `lib/today/get-weather.ts`
- `lib/today/generate-recommendations.ts`
- `lib/today/get-today-view.ts`
- `lib/today/build-ootd-notes.ts`
- `lib/today/get-today-ootd-status.ts`
- `lib/today/save-today-ootd-feedback.ts`
- `lib/today/get-recent-ootd-history.ts`
- `lib/closet/get-closet-view.ts`
- `app/today/actions.ts`
- `app/today/page.tsx`
- `components/today/*`
- `tests/lib/today/build-ootd-notes.test.ts`
- `tests/lib/today/save-today-ootd-feedback.test.ts`
- `tests/lib/today/get-today-view.test.ts`
- `tests/lib/today/get-recent-ootd-history.test.ts`
- `tests/app/today/actions.test.ts`
- `tests/components/today-page.test.tsx`
- `tests/lib/today/generate-recommendations.test.ts`
- `lib/env.ts`
- `.env.example`
- `PROGRESS.md`
