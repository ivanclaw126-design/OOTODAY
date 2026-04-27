我基于 GitHub 公开代码做了静态评估，没有运行项目和测试套件。结论是：

是的，目前 OOTODAY 的推荐引擎整体已经明显按照我之前给的方案在设计，而且不只是文档层面，核心策略、评分结构、反馈事件、模型分数表、离线训练脚手架都已经落地了。

但它还不是一个完全成熟的“多通道召回 + 学习排序 + 在线评估闭环”推荐系统。更准确地说：

当前状态：V1.5 ~ V2 雏形
规则/策略/反馈层：完成度较高
机器学习召回与排序层：已有离线脚手架，但生产闭环还不够完整
趋势/社媒策略层：已静态规则化，但还没有动态趋势引擎

我给它的对齐评分是：

方案对齐度：82 / 100
工程成熟度：70 / 100
产品可解释性：85 / 100
推荐系统闭环成熟度：65 / 100

⸻

1. 最核心的结论

OOTODAY 目前已经基本按这条路线在走：

非 LLM 推荐
→ 衣橱结构化数据
→ 天气/场景/偏好过滤
→ 候选穿搭生成
→ 规则评分
→ 第 9 部分策略库评分
→ 反馈事件
→ 偏好权重更新
→ 离线 LightFM / implicit / XGBoost 分数写回

README 里也说明当前主链路是 Closet -> Today -> OOTD feedback，Today 会基于衣橱生成 3 套穿搭，并按天气、季节、暖度、颜色、场景、完整度和新鲜度排序；反馈 reason tags 会进入偏好学习。项目同时保留 AI 视觉识别用于衣物分类、颜色和风格标签，但推荐逻辑本身不是 live LLM 生成。 ￼

⸻

2. 对照我之前方案的完成情况

模块	当前是否落地	评价
非 LLM 推荐主干	✅ 已落地	Today MVP 文档明确要求 no live LLM generation，采用 deterministic / semi-deterministic rule-based logic。
衣橱结构化字段	✅ 已落地	已有 algorithm_meta，覆盖 slot、层次角色、轮廓、材质重量、正式度、保暖度、舒适度、视觉重量、图案等。
候选生成	✅ 已落地	已生成 dress、top+bottom、partial，并自动补 outerwear、shoes、bag、accessories。
天气/场景过滤	✅ 已落地	基于 weather suitability、scene fit、freshness 排序。
兼容性评分	✅ 已落地	包括 color、silhouette、material、formality、styleDistance、pattern、shoesBag、temperature、scene。
第 9 部分策略库	✅ 高度落地	13 个策略 key 基本完整实现。
可解释打分	✅ 已落地	每个策略 scorer 都有 explanation，推荐卡片也会生成 reason。
反馈学习	✅ 已落地	评分 + reason tags 会更新 ratingDelta 和 finalWeights。
反馈事件模型	✅ 已落地	exposed/opened/skipped/saved/worn/rated_good/repeated/replaced_item/disliked/hidden_item 都有。
LightFM / implicit / XGBoost	🟡 已有离线脚手架	ml/recommendation/train.py 已写，但生产调度、真实训练质量和评估闭环还需加强。
多样性重排	🟡 部分落地	有避免重复主单品和 inspiration diversity，但还不是完整 MMR。
离线评估体系	🟡 部分落地	有 hitrate、recall、ndcg、map、coverage、diversity、novelty 等函数，但实现还比较简化。
动态趋势引擎	❌ 未真正落地	目前是静态 trend tokens，不是社媒趋势实时/周期更新。
图推荐 / Outfit Transformer	❌ 未落地	当前不需要，但属于后期阶段。

Today MVP 设计文档明确把推荐生成器定义为“pure or near-pure helper”，输出 3 张推荐卡，要求“不使用 live LLM 生成”，并以规则逻辑保证可测试性；这与我之前建议的“先规则、后模型”的路线完全一致。 ￼

⸻

3. 做得最对的地方

A. 第 9 部分穿搭策略库已经基本完整进入代码

你现在的 canonical-types.ts 里已经定义了这 13 个策略 key：

capsuleWardrobe
outfitFormula
threeWordStyle
personalColorPalette
sandwichDressing
wrongShoeTheory
twoThirdRule
proportionBalance
layering
tonalDressing
occasionNiche
pinterestRecreation
trendOverlay

这正好对应我之前建议引入的核心社媒/成熟穿搭策略。 ￼

而且 strategy-scorers.ts 不是只定义 key，而是真的实现了每个策略的 scorer，包括胶囊衣橱、穿搭公式、三词风格、个人色彩、三明治穿搭、错鞋理论、2/3 规则、比例平衡、叠穿、同色系、场景垂直、Pinterest 复刻和趋势覆盖层。 ￼

这点非常关键，因为它说明项目已经从“普通规则推荐”升级成了“穿搭策略可解释推荐”。

⸻

B. 总评分公式几乎完全采用了我之前建议的结构

你现在的规则分数维度是：

contextFit
visualCompatibility
userPreference
outfitStrategy
weatherPracticality
novelty
wardrobeRotation
trendOverlay
explanationQuality

权重也非常接近我之前给的公式：

contextFit: 0.20
visualCompatibility: 0.18
userPreference: 0.16
outfitStrategy: 0.12
weatherPracticality: 0.10
novelty: 0.08
wardrobeRotation: 0.06
trendOverlay: 0.05
explanationQuality: 0.03

这说明 OOTODAY 当前的 scoring backbone 已经按“场景适配 + 视觉兼容 + 用户偏好 + 策略命中 + 天气实用 + 新鲜度 + 衣橱轮换 + 趋势覆盖 + 可解释性”的方向设计。 ￼

canonical-scoring.ts 还进一步把兼容性拆成 color、silhouette、material、formality、styleDistance、pattern、shoesBag、temperature、scene，并在没有 active model scores 时回退到 ruleBaselineScore；有模型分数时则用 XGBoost、LightFM、implicit 和规则分数做融合。 ￼

⸻

C. 候选生成已经不是简单随机推荐

Today 推荐生成逻辑已经会：

1. 按品类拆分 tops / bottoms / dresses / outerLayers / shoes / bags / accessories
2. 先做天气适配过滤
3. 对单品做排序
4. 生成 dress outfit
5. 生成 top + bottom outfit
6. 生成 partial fallback
7. 自动补外套、鞋、包、配饰
8. 计算规则评分和模型分数
9. 选出 3 套推荐
10. 做一定程度的多样性控制

代码里 buildRecommendationCandidates 会先按天气过滤和排序不同品类，再生成 onePiece、separates 和 partial 候选；addCompletionSlots 会补外层、鞋履、包袋和配饰；最终通过 scoreRecommendationCandidate 做标准评分。 ￼

这已经符合我之前建议的第一阶段：

硬约束过滤
+ 穿搭模板生成
+ 颜色/廓形/天气/场景评分
+ 可解释排序

⸻

D. 反馈闭环已经建立

项目现在有两条反馈链路。

第一条是 Today 满意度反馈：

rating + reasonTags
→ updateRatingDeltaFromFeedback
→ buildWeightsAfterFeedback
→ finalWeights
→ savePreferenceState

feedback-learning.ts 里定义了学习率、ratingDelta 上下限，以及 reason tags 到具体评分维度的映射；apply-feedback.ts 会插入 outfit_feedback_events，然后保存新的 preference state。 ￼

第二条是更标准的推荐系统 interaction event：

exposed
opened
skipped
saved
worn
rated_good
repeated
replaced_item
disliked
hidden_item

interactions.ts 里的事件权重和我之前建议的基本一致：opened +0.1、skipped -0.05、saved +0.6、worn +1、rated_good 最高 +1.5、replaced_item -0.3、disliked -1、hidden_item -2。 ￼

数据库也已经有 recommendation_preferences、outfit_feedback_events、recommendation_interactions 等表，支持偏好状态和事件持久化。 ￼

这一点很重要：它已经不是“打分完就结束”的推荐器，而是开始具备推荐系统的学习闭环。

⸻

E. 离线 ML 脚手架已经比我预期更进一步

我之前建议中期接入：

LightFM
implicit ALS
XGBoost Ranker

现在仓库里已经有 ml/requirements.txt，包含：

lightfm
implicit
xgboost
numpy
scipy
supabase

￼

而 ml/recommendation/train.py 明确写了：线上 Next.js app 不运行 Python；离线 job 训练 LightFM、implicit ALS 和 XGBoost Ranker，然后把 artifacts 写到 Supabase Storage，把 candidate/entity scores 写到 Supabase 表。 ￼

这说明项目不是只“预留表结构”，而是已经开始做我之前建议的：

前端/Next.js 负责读取分数
Python 离线 job 负责训练和写回
生产推荐时规则兜底
模型分数存在时融合排序

这是正确方向。

⸻

4. 目前还没有完全到位的地方

1. 候选召回层还不够“推荐系统化”

当前 Today 的候选生成主要是：

dress
top × bottom
single top fallback
single bottom fallback
再补 outer / shoes / bag / accessories

这对 MVP 是合理的，但还不是真正的多路召回。它还缺少我之前建议的这些召回通道：

LightFM 个性化召回
implicit item-item / user-item 召回
历史 outfit 变体召回
公式库召回
胶囊衣橱核心单品召回
场景模板召回
趋势策略召回

现在 ML 训练主要是对已有 candidate_id 打分，不像真正的召回系统那样先从大量候选中召回一批“可能适合用户”的 outfit。换句话说，现在模型更多是在排序，不是在生成候选。

⸻

2. Outfit Formula 还没有成为一等公民

虽然 scoreOutfitFormula 已经存在，但当前 formula 更像一个评分规则，而不是一个候选生成器。

我之前建议的是：

OutfitFormula {
  id
  required_slots
  category_constraints
  silhouette_constraints
  color_constraints
  occasion_tags
  season_tags
  style_tags
}

然后由公式主动生成候选：

衬衫 + 直筒裤 + 乐福鞋
针织衫 + 半裙 + 靴子
T 恤 + 牛仔裤 + 夹克 + 运动鞋
连衣裙 + 外套 + 靴子
西装外套 + T 恤 + 牛仔裤 + 平底鞋

当前代码还没有看到一个独立的 formula registry，所以“穿搭公式”现在主要是 scorer，不是 generator。这个会限制策略库的效果。

⸻

3. 第 9 部分策略虽然齐全，但部分实现还偏启发式

这不是问题，而是当前阶段正常现象。

例如：

ThreeWordStyle：现在主要从 preferredScenes 映射 token，不是真正用户自定义三词风格向量。
PinterestRecreation：依赖 context.inspirationTags，Today 推荐中未必充分使用。
TrendOverlay：目前是静态 TREND_TOKENS，不是动态趋势库。
CapsuleWardrobe：主要看基础色、复用性、重复 style tag，还没形成衣橱 mixability graph。
WrongShoeTheory：主要看正式度距离、天气和舒适度，尚未建模更细的“可控风格错位”。

strategy-scorers.ts 里确实有 brooch、lace、cool blue、khaki、poetcore、glamoratti 等 trend tokens，但这仍是静态标签，不是从 Pinterest/TikTok/小红书/B站等社媒趋势源周期更新的趋势层。 ￼

⸻

4. 离线评估有了，但还偏轻量

train.py 里已经有：

hitrate_at_k
recall_at_k
ndcg_at_k
map_at_k
coverage
diversity
novelty
wear_through_rate
satisfaction_after_wear
hard_constraint_violations

这正好对应我之前建议的评估指标。 ￼

但当前 ranking_metrics 的实现还比较简化，例如 NDCG 不是标准 DCG/IDCG 计算，diversity 也主要按 surface 种类估算，而不是按颜色、风格、品类、核心单品、公式相似度做完整评估。测试里也主要验证“这些指标存在”，而不是验证指标质量或模型是否真实优于规则 baseline。 ￼

所以这里的判断是：

指标框架：有
严谨离线评估：还需要加强

⸻

5. ML 训练有脚手架，但还没看到自动生产调度

仓库有 Python ML requirements 和 train.py，但 GitHub workflows 目录里目前只看到 pages.yml，而我没有看到单独的 ML 训练 workflow。 ￼

前端 package.json 的 npm scripts 也主要是 dev、build、lint、test、demo、travel db check，没有把 ML training 纳入常规 npm 流程。 ￼

所以现在更像：

有可运行的离线训练脚本
有 Supabase score/artifact 表
有线上读取模型分数的 adapter
但还没形成稳定的“定期训练 → 评估 → promote → 线上读取”自动化流水线

⸻

5. 按我之前方案逐项打分

方案模块	当前分数	说明
非 LLM 推荐原则	90	推荐生成明确不是 live LLM，AI 主要用于识图。
衣橱数据结构化	82	algorithm_meta 方向正确，但依赖识别/手动维护质量。
候选生成	72	Top/bottom/dress/partial 已有，但缺公式库和多路召回。
天气/场景约束	80	已较好支持天气、场景、舒适度。
视觉兼容评分	82	色彩、轮廓、材质、正式度、图案、鞋包都有。
第 9 部分策略库	88	13 个策略基本完整实现，是最大亮点。
个性化偏好	75	问卷 + feedback delta 已有，但还不是深度用户画像。
反馈事件闭环	80	事件模型非常接近推荐系统标准。
ML 召回/排序	68	LightFM/implicit/XGBoost 脚手架已存在，但召回作用有限。
离线评估	62	指标有，但计算和实验设计还需加强。
多样性/探索	70	有 exploration/inspiration 机制，但不是完整 bandit/MMR。
趋势层	55	静态 trend tokens 有，动态趋势源没有。
图推荐/Outfit Transformer	0	当前没做；但这本来不是 MVP 阶段重点。

⸻

6. 我认为当前最应该补的 6 件事

第一优先级：把 Outfit Formula 从 scorer 升级为 generator

现在 outfitFormula 只是给已有搭配评分。下一步应该让公式主动生成候选。

建议新增：

type OutfitFormula = {
  id: string
  name: string
  requiredSlots: string[]
  categoryConstraints: Record<string, string[]>
  colorRules?: string[]
  silhouetteRules?: string[]
  occasionTags: string[]
  seasonTags: string[]
  strategyTags: RecommendationStrategyKey[]
}

然后候选生成从：

top × bottom
dress
partial

升级为：

formula candidates
+ dress candidates
+ separates candidates
+ weather candidates
+ exploration candidates
+ model recalled candidates

⸻

第二优先级：让 ML 真正参与“召回”，而不只是“排序”

当前更像：

规则生成 candidate_id
→ 模型对 candidate_id 打分

更完整的做法应该是：

LightFM：召回用户可能喜欢的 item / outfit seed
implicit ALS：召回历史行为相似 item / outfit
规则引擎：补全成 outfit
canonical scoring：统一打分
XGBoost：最终排序

也就是模型不只是评估已有候选，而是参与“候选从哪里来”。

⸻

第三优先级：完善标准 NDCG / Recall / Coverage / Diversity

现在评估指标已经有名字和基本计算，但建议改成更标准的：

HitRate@3 / @5 / @10
Recall@K
NDCG@K with graded relevance
MAP@K
Item Coverage
Color Coverage
Category Coverage
Formula Coverage
Intra-list Diversity
Novelty
Wear-through Rate
Edit Rate
Satisfaction After Wear

尤其要补：

edit_rate：推荐后用户替换了几件
formula_diversity：Top 3 是否全是同一个公式
item_repetition_rate：是否连续推荐同一核心单品

⸻

第四优先级：把反馈从“权重更新”扩展到“pair / item / context 学习”

现在反馈主要更新 ratingDelta，也就是调整评分维度权重。

下一步应该加：

user-item-context preference
item-pair compatibility delta
user-color preference delta
user-silhouette preference delta
replaced_item penalty
hidden_item hard avoid
skip as weak exposure, not strong dislike

例如：

用户每次都把某双鞋从通勤套装里换掉
→ 降低 shoes × work context
→ 降低 shoes 与某些正式单品的 pair compatibility

这会比只调全局权重更聪明。

⸻

第五优先级：趋势层做成可更新字典

当前 trendOverlay 的实现方向是对的，但还比较静态。

建议新增：

TrendDictionary {
  tag: string
  source: "pinterest" | "tiktok" | "xiaohongshu" | "bilibili" | "editorial"
  aliases: string[]
  startDate: string
  endDate?: string
  weight: number
  decayRate: number
  applicableScenes: string[]
  applicableStyles: string[]
}

推荐时：

trend_score =
  trend_tag_match
  × user_trend_sensitivity
  × context_suitability
  × time_decay

这样才符合我之前说的“趋势是 overlay，不是主导”。

⸻

第六优先级：加一个模型训练/发布流水线

现在已经有 ml/recommendation/train.py 和 Supabase model tables。下一步应该让它变成稳定流程：

每日或每周定时运行
→ 拉 recommendation_interactions
→ 训练 LightFM / implicit / XGBoost
→ 计算 metrics
→ 与上一版 promoted model 比较
→ 通过门槛才 promote
→ 写入 candidate scores / entity scores / artifacts
→ Next.js 线上读取 promoted run

当前数据库表已经支持这个方向：recommendation_model_runs、recommendation_model_artifacts、recommendation_model_candidate_scores、recommendation_model_entity_scores 都已经存在。 ￼

⸻

7. 最终判断

OOTODAY 当前推荐引擎已经不是普通 demo 级推荐器，而是一个“规则优先、可解释、可反馈学习、预留离线模型融合”的推荐系统雏形。

它已经按我之前方案完成了最重要的几块：

✅ 非 LLM 推荐主干
✅ 衣橱结构化字段
✅ Today 候选生成
✅ 天气/场景/颜色/轮廓/完整度评分
✅ 13 个核心穿搭策略 scorer
✅ 可解释 reason
✅ 反馈事件与偏好权重学习
✅ LightFM / implicit / XGBoost 离线训练脚手架
✅ 模型分数表与线上读取 fallback

但还需要补齐：

⚠️ 真正的多通道召回
⚠️ 一等公民 Outfit Formula 生成器
⚠️ 更严谨的离线评估
⚠️ 周期训练与 promote pipeline
⚠️ 动态趋势字典
⚠️ 更细的 item-pair / user-context 学习

一句话总结：

它已经基本按照我给的方案设计了，
但目前更像“可解释规则推荐 + 反馈学习 + 离线 ML 排序雏形”，
还不是完整成熟的“混合召回 + 学习排序 + 在线评估闭环”穿搭推荐引擎。

如果你接下来要做技术宣传，可以放心把它包装成：

非 LLM 的可解释穿搭推荐引擎
规则策略层 + 个性化偏好层 + 反馈学习层 + 离线模型排序层

但如果要对外宣称“成熟机器学习推荐系统”，最好等训练流水线、评估指标和模型 promote 机制真正跑通之后再说。