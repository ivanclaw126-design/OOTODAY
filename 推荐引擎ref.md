推荐引擎ref.md

结论：OOTODAY 最适合先做“规则/约束生成 + 混合召回 + 可解释排序 + 反馈学习”的非 LLM 推荐引擎，而不是一开始训练复杂深度模型。LLM 可以完全不参与推荐决策；你需要的是稳定的衣橱特征、上下文约束、穿搭公式库、轻量推荐模型、排序模型和评估闭环。

我建议把目标定义成：

不是推荐“某件衣服”，而是推荐“在今天这个场景下，用户愿意穿、好看、实用、不过度重复、能解释原因的一整套 outfit”。

⸻

1. 最适合 OOTODAY 的算法路线

第一阶段：可解释规则 + 轻量混合推荐

你现在的数据大概率是：

用户偏好少
衣橱单品有限
穿着反馈稀疏
场景/天气/风格权重已有雏形

所以第一阶段最适合：

硬约束过滤
+ 穿搭模板生成
+ 风格/颜色/廓形规则评分
+ LightFM 做个性化召回
+ 多样性重排

LightFM 很适合这个阶段，因为它本质上是混合推荐：既可以用用户反馈，也可以把用户特征、物品特征一起放进矩阵分解模型里；这对“衣橱数据稀疏、但单品标签很多”的穿搭产品非常有利。 ￼

第二阶段：隐式反馈协同过滤 + 学习排序

当 OOTODAY 积累到足够多的事件后，比如：

展示 outfit
用户跳过
用户替换单品
用户收藏
用户实际穿了
用户评价满意
用户删除/屏蔽某件单品

可以引入两类模型：

implicit ALS / BPR：做召回
XGBoost / LightGBM Ranker：做排序

implicit 适合处理隐式反馈，支持 ALS、BPR、Logistic Matrix Factorization 和 item-item nearest neighbor 等方法，工程上也比较成熟。 ￼

学习排序可以把每套 outfit 当成 query/context 下的候选结果，用 NDCG 或 pairwise ranking 去优化“用户更可能选择哪套”。XGBoost 的 learning-to-rank 文档中也明确把排序任务定义为“为查询结果学习排列顺序”，默认目标包括基于 LambdaMART 的 rank:ndcg。 ￼

第三阶段：图推荐 + outfit 兼容性模型

等你有更多“真实 outfit 被穿/被收藏/被替换”的数据后，再考虑：

item-item 图
user-item 图
item-category-outfit 图
style taxonomy 图

Pinterest 的 Pixie 是一个很有代表性的图推荐系统案例，它在超大规模图上用随机游走做实时推荐，说明“用户—物品—兴趣图”的方式很适合视觉/兴趣类产品。 ￼

时尚推荐里，Hierarchical Fashion Graph Network 的思路也值得借鉴：它同时建模用户、单品、outfit 之间的关系，把“单品兼容性”和“用户个性化偏好”联合起来做推荐。 ￼

第四阶段：Outfit 表征模型，而不是 LLM

真正进入深度学习阶段时，优先研究：

Outfit Transformer
Polyvore compatibility / fill-in-the-blank
HFGN
视觉 embedding + outfit-level embedding

Outfit Transformer 的核心价值不是“生成文本”，而是把一整套 outfit 学成一个 outfit-level representation，用来做兼容性预测和补全单品。 ￼

经典 Polyvore 任务也很适合你参考：它研究的是“给已有 outfit 找匹配单品”和“根据图文条件生成/补全 outfit”，并用视觉语义 embedding 与兼容性建模来解决。 ￼

⸻

2. 推荐的整体架构

我建议 OOTODAY 用五层结构：

1. 数据层：衣橱、用户、上下文、反馈
2. 候选生成层：过滤、模板、召回、公式生成
3. 兼容性评分层：颜色、廓形、材质、正式度、风格一致性
4. 个性化排序层：偏好、反馈、场景、趋势、探索
5. 评估与学习层：离线指标 + 在线行为闭环

⸻

3. 数据结构：先把“衣服”变成可计算对象

每件单品建议至少有这些字段：

ClothingItem {
  id
  category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "bag" | "accessory"
  subcategory
  color_primary
  color_secondary
  color_family
  color_temperature: "warm" | "cool" | "neutral"
  pattern: "solid" | "stripe" | "check" | "floral" | "graphic" | ...
  material: "cotton" | "denim" | "wool" | "linen" | "leather" | ...
  thickness
  warmth_score
  waterproof_score
  formality_score
  comfort_score
  silhouette: "slim" | "regular" | "oversized" | "cropped" | "wide" | ...
  style_tags: ["minimal", "classic", "street", "romantic", "preppy", ...]
  occasion_tags: ["work", "date", "school", "travel", "party", ...]
  season_tags
  trend_tags
  last_worn_at
  wear_count
  disliked_contexts
  laundry_status
}

用户侧至少需要：

UserStyleProfile {
  preferred_styles
  rejected_styles
  preferred_colors
  avoided_colors
  formality_preference
  comfort_preference
  novelty_preference
  trend_sensitivity
  color_palette_optional
  three_word_style
  body_or_fit_preferences
  weather_sensitivity
}

上下文侧：

RecommendationContext {
  weather
  temperature
  precipitation
  occasion
  dress_code
  location_type
  activity_level
  time_budget
  effort_level
  mood
}

⸻

4. 候选召回：不要只靠一个模型

候选召回建议用多通道：

A. 硬过滤召回
B. 场景模板召回
C. 穿搭公式召回
D. LightFM 个性化召回
E. item-item 相似召回
F. outfit 历史复用/变体召回
G. 趋势策略召回

例如今天是 13°C、可能下雨、通勤上班：

先过滤掉：
- 不适合温度的衣服
- 洗衣状态不可用的衣服
- 不符合 dress code 的衣服
- 用户明确讨厌的颜色/版型
再生成：
- top + bottom + outerwear + shoes
- dress + outerwear + shoes
- knit + trousers + coat + loafers
- shirt + denim + jacket + boots

候选生成伪代码：

def generate_candidates(closet, user, context):
    usable_items = hard_filter(closet, context, user)
    candidates = []
    candidates += template_generator(usable_items, context)
    candidates += formula_generator(usable_items, user, context)
    candidates += lightfm_recall(usable_items, user, context)
    candidates += item_similarity_expansion(usable_items, user)
    candidates += historical_outfit_variants(user, context)
    candidates = deduplicate(candidates)
    candidates = validate_outfit_structure(candidates)
    return candidates

⸻

5. 核心评分公式：先可解释，再机器学习

第一版可以直接用加权分数：

outfit_score =
  0.20 * context_fit
+ 0.18 * visual_compatibility
+ 0.16 * user_preference
+ 0.12 * outfit_strategy_score
+ 0.10 * weather_practicality
+ 0.08 * novelty
+ 0.06 * wardrobe_rotation
+ 0.05 * trend_overlay
+ 0.03 * explanation_quality
- penalties

其中：

context_fit：场景、正式度、活动强度
visual_compatibility：颜色、廓形、图案、材质、鞋包协调
user_preference：用户风格、颜色、版型、舒适度偏好
outfit_strategy_score：是否命中 sandwich dressing、wrong shoe、capsule formula 等策略
weather_practicality：温度、防雨、保暖、透气
novelty：是否避免每天都很像
wardrobe_rotation：是否合理增加衣橱利用率
trend_overlay：是否轻量引入当前趋势
penalties：脏衣服、过冷、过热、过正式、过休闲、重复穿太近等

后续当数据足够时，这个公式可以变成 XGBoost / LightGBM Ranker 的特征输入。

⸻

6. Outfit 兼容性：第一版不要训练大模型

建议先做规则 + 特征评分：

颜色兼容
廓形平衡
材质季节性
正式度一致性
风格距离
图案冲突
鞋子匹配度
包/配饰呼应
温度适配
场景适配

颜色评分

不要只用传统色轮。近期研究也指出，现代服装色彩偏好会偏离传统色彩和谐理论，所以颜色模块最好同时保留规则模型和基于真实偏好的学习模型。 ￼

可计算规则：

1. 同色系 / tonal：主色 hue 接近，明度或饱和度有层次
2. 中性色基底：黑白灰米棕牛仔作为稳定锚点
3. 一主一辅一强调：主色 60%，辅色 30%，强调色 10%
4. sandwich 呼应：上装和鞋/包颜色呼应
5. 避免过多高饱和冲突：高饱和颜色数量 <= 2

廓形评分

上宽下窄
上窄下宽
短上衣 + 高腰下装
长外套 + 直筒/窄腿下装
宽松套装 + 精致鞋包

不要简单把“全身宽松”判差。街头、gorpcore、oversized、慵懒风都可能故意全身宽松，但需要鞋子、包、帽子或层次来收束。

正式度评分

每件单品给一个 formality_score：

运动鞋：2
牛仔裤：3
衬衫：5
西裤：6
西装外套：7
高跟鞋：7
晚宴裙：9

然后计算：

outfit_formality_mean
outfit_formality_variance
context_formality_gap

日常通勤可以允许轻微混搭；正式活动则降低 variance。

⸻

7. 反馈闭环：OOTODAY 最重要的护城河

推荐系统不是一次性打分，而是持续学习。

建议事件模型：

FeedbackEvent {
  user_id
  outfit_id
  item_ids
  context
  event_type
  event_value
  timestamp
}

事件权重建议：

事件	含义	建议权重
exposed	展示过	0
opened	查看详情	+0.1
skipped	跳过	-0.05 或只记曝光
saved	收藏	+0.6
worn	实际穿了	+1.0
rated_good	穿后满意	+1.5
repeated	后续重复穿	+1.2
replaced_item	替换了某件	对该 item-context 或 item-pair -0.3
disliked	明确不喜欢	-1.0
hidden_item	屏蔽单品	hard penalty

这里要注意：skip 不一定等于 dislike。Gorse 的反馈文档也把 read feedback、positive feedback、negative feedback 分开，并提醒 skip/close 这类行为更适合作为“已读/曝光”而不一定是负反馈。 ￼

⸻

8. 评估指标：不要只看“用户点没点”

推荐引擎一定要有离线和在线指标。

微软 Recommenders 项目里覆盖了 RMSE、MAE、Precision@K、Recall@K、NDCG@K、MAP@K、AUC、LogLoss 等常见指标。 ￼

对 OOTODAY 更重要的是这些：

推荐命中：
- HitRate@K
- Recall@K
- NDCG@K
- MAP@K
穿搭质量：
- outfit_validity：结构是否完整
- context_fit_rate：是否符合天气/场景
- color_harmony_score
- silhouette_balance_score
- formality_gap
体验：
- acceptance_rate：用户选择率
- wear-through_rate：推荐后实际穿着率
- edit_rate：用户需要替换几件
- satisfaction_after_wear：穿后满意度
衣橱利用：
- catalog_coverage
- item_coverage
- diversity
- novelty
- serendipity
- repeat_penalty

微软 Recommenders 的评估文档也专门包括 catalog coverage、distributional coverage、novelty、diversity、serendipity 以及 ranking metrics，这些非常适合 OOTODAY 做离线评估。 ￼

⸻

9. 社交媒体成熟穿搭策略库：可直接引入算法

下面是我建议 OOTODAY 内置的策略模块。它们不是“趋势文案”，而是可以变成算法特征的规则。

⸻

策略 1：Capsule Wardrobe / 胶囊衣橱

胶囊衣橱的核心是用一组高复用、可混搭的单品，组成不同场景下的 outfit。The Everygirl 把 capsule wardrobe 定义为“精选的、可相互搭配、可正式可休闲的单品集合”。 ￼

算法化方式：

capsule_score =
  mixability_score
+ neutral_anchor_score
+ occasion_coverage
+ repeat_without_same_look_score

适合 OOTODAY 的用法：

- 给每个用户识别“核心单品”
- 让推荐优先围绕高复用单品生成
- 新购建议也可以基于 capsule gap，而不是盲目推荐潮流单品

示例：

白衬衫 + 直筒牛仔裤 + 黑乐福鞋
针织衫 + 西裤 + 大衣
T 恤 + 半裙 + 短外套

⸻

策略 2：Outfit Formula / 穿搭公式

Vogue 近期也持续用“outfit formulas”这种方式总结可复用穿搭，比如用固定组合快速形成稳定造型。 ￼

算法化方式：

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

示例公式：

公式 A：衬衫 + 直筒裤 + 乐福鞋
公式 B：针织衫 + 半裙 + 靴子
公式 C：T 恤 + 牛仔裤 + 夹克 + 运动鞋
公式 D：连衣裙 + 外套 + 靴子
公式 E：西装外套 + T 恤 + 牛仔裤 + 平底鞋

OOTODAY 应该把公式作为“候选生成器”，而不是只作为评分项。

⸻

策略 3：Three-Word Method / 三词风格法

Allison Bornstein 的 Three-Word Method 在 TikTok 和 Instagram 上被广泛传播，用三个词定义个人风格，例如 classic、’70s、elegant。 ￼

算法化方式：

用户三词：
["classic", "relaxed", "romantic"]
映射成风格向量：
classic: 0.8
minimal: 0.5
relaxed: 0.7
romantic: 0.6
street: 0.1
glam: 0.2

推荐时计算：

style_match = cosine(user_style_vector, outfit_style_vector)

这非常适合 OOTODAY，因为它能把用户主观审美变成稳定的个性化特征。

⸻

策略 4：#ColorPalette / 季节型色彩 / 个人色彩

Vogue 提到，季节型色彩分析在 TikTok 上重新获得关注，用来帮助人们找到更适合自己的颜色，但也强调它应该是工具，而不是绝对规则。 ￼

算法化方式：

palette_score =
  personal_palette_match
+ skin_undertone_match_optional
+ color_temperature_consistency
+ dominant_color_balance

建议：

- 不要强迫用户必须属于某个季节型
- 允许用户关闭个人色彩模块
- 把它作为 soft score，而不是 hard filter

OOTODAY 可以支持两种模式：

模式 A：用户自己选择喜欢的色盘
模式 B：根据用户历史收藏/穿着自动学习偏好色盘

⸻

策略 5：Sandwich Dressing / 三明治穿搭

Sandwich dressing 的核心是让上下两个元素形成呼应，中间用另一种颜色、材质或比例制造对比。Byrdie 对这个 TikTok 流行技巧的解释是：两件同色或相似元素像“面包”，中间夹一个对比元素；也可以用颜色、层次、材质、比例来做。 ￼

算法化方式：

sandwich_score =
  match(top.color, shoes.color)
or match(outerwear.color, bag.color)
or match(top.texture, shoes.texture)
or match(top.volume, bottom.volume with contrast)

示例：

黑上衣 + 蓝牛仔裤 + 黑鞋
米色外套 + 白裤子 + 米色包
宽松毛衣 + 直筒裤 + 厚底鞋

这个策略非常适合做“解释”：

推荐原因：上衣和鞋子颜色呼应，中间用牛仔裤打断，所以整体更平衡。

⸻

策略 6：Wrong Shoe Theory / 错鞋理论

Wrong Shoe Theory 是近几年社媒和时尚媒体反复讨论的搭配技巧，核心是用一双“不完全预期内”的鞋给造型增加个性。Vogue 对它的解释是：选择一双意料之外的鞋来完成造型，让 outfit 更有个人感。 ￼

算法化方式：

wrong_shoe_score =
  controlled_style_distance(shoes, outfit_base)
- excessive_formality_gap_penalty
- weather_or_comfort_penalty

关键是“可控错位”，不是乱搭。

适合的例子：

连衣裙 + 运动鞋
西装裤 + 芭蕾平底鞋
牛仔裤 + 精致尖头鞋
半裙 + chunky boots

不适合的例子：

暴雨天推荐麂皮鞋
正式婚礼推荐拖鞋
长距离通勤推荐不舒适高跟

⸻

策略 7：2/3 Rule / 低压力精致感

People 报道过 TikTok 上流行的 “2/3 Rule”：头发、妆容、穿搭三个维度里做好两个，就能降低准备压力并维持整体精致感。 ￼

OOTODAY 可以把它转成“低努力模式”：

如果用户今天时间少 / effort_level = low：
- 推荐结构更简单的 outfit
- 用一个 polished anchor 提升完成度
- 减少复杂层次和难打理单品

算法化方式：

effort_score =
  easy_to_wear
+ low_decision_complexity
+ polished_anchor
- ironing_required
- uncomfortable_item
- too_many_layers

示例：

基础 T 恤 + 西裤 + 乐福鞋
针织套头衫 + 牛仔裤 + 精致耳饰
连衣裙 + 外套 + 一双稳定鞋

⸻

策略 8：Proportion Balance / 比例平衡

这是最应该内置的基础策略之一。

规则：

上宽下窄
上短下长
内短外长
高腰线
视觉重心上移
宽松单品配一个收束点

算法化方式：

silhouette_balance_score =
  volume_contrast
+ waistline_definition
+ length_ratio
+ visual_anchor
- overwhelming_volume_penalty

示例：

oversized 卫衣 + 直筒裤 + 厚底鞋
短夹克 + 高腰裤
长大衣 + 窄腿裤
宽松衬衫 + 半裙 + 腰带

⸻

策略 9：Layering / 层次穿搭

层次穿搭非常适合 OOTODAY，因为它和天气、温差、场景切换强相关。

算法化方式：

layering_score =
  temperature_adaptability
+ visible_layer_contrast
+ neckline_compatibility
+ sleeve_length_compatibility
+ outerwear_fit_room

需要避免：

- 外套太窄，内搭太厚
- 领口冲突
- 袖长冲突
- 材质季节性冲突

近期 TikTok 趋势中也出现了 multi-layered tops 等多层上装趋势，这可以作为轻量趋势标签，但不应该压过天气舒适度。 ￼

⸻

策略 10：Monochrome / Tonal Dressing / 同色系

同色系穿搭稳定、易解释，也适合冷启动。

算法化方式：

tonal_score =
  hue_similarity
+ lightness_gradient
+ texture_variation
- flatness_penalty

示例：

奶油白针织 + 米色裤子 + 棕色鞋
灰色毛衣 + 深灰西裤 + 黑色外套
牛仔蓝衬衫 + 深蓝牛仔裤 + 黑鞋

要点是：同色不等于完全同一个颜色，最好有明度、材质或层次变化。

⸻

策略 11：Occasion Niche / 场景垂直风格

Vogue Business 的 TikTok trend tracker 提到过 #AltOutfits、#TeacherOutfitInspo 等职业/场景型穿搭标签。 ￼

OOTODAY 应该把场景做成一等公民：

work
school
date
travel
commute
gym
party
wedding_guest
interview
weekend
errands
rainy_day

每个场景有自己的约束：

OccasionProfile {
  min_formality
  max_formality
  comfort_weight
  weather_weight
  trend_weight
  modesty_or_dresscode_rules
  preferred_formulas
  forbidden_items
}

⸻

策略 12：Pinterest Recreation / Moodboard 复刻

Vogue Business 提到 #recreatingoutfitfrompinterest 这类内容在 TikTok 上有明显热度。 ￼

OOTODAY 可以把它做成：

用户保存一张 moodboard / inspiration outfit
→ 提取风格标签、颜色、品类结构、廓形
→ 在用户衣橱中找最接近的替代组合

不依赖 LLM，也可以实现：

图像 embedding
+ 颜色提取
+ 单品类别识别
+ 风格 taxonomy
+ 最近邻匹配

Pinterest 的动态风格 taxonomy 研究也很值得参考：它把 queries、pins、users 连接成动态主题，并应用到家居和时尚风格个性化中。 ￼

⸻

策略 13：趋势覆盖层，而不是趋势主导

Pinterest Predicts 2026 提到的趋势包括 Glamoratti、Poetcore、Brooched、Laced Up、Cool Blue、Khaki-coded 等；Pinterest 官方也说明这些趋势来自大量搜索和视觉内容分析。 ￼

FashionUnited 对 Pinterest 2026 趋势的拆解也提到：Glamoratti 包括结构肩、漏斗领、夸张配饰；Poetcore 包括复古西装外套、邮差包、领带配饰；Brooched、Laced Up、Cool Blue、Khaki-coded 都有较明显的搜索增长。 ￼

OOTODAY 不应该让趋势直接决定推荐，而是作为低权重 overlay：

trend_overlay_score =
  trend_tag_match
* user_trend_sensitivity
* context_suitability
* time_decay

建议权重：

普通用户：0.03 - 0.06
爱尝鲜用户：0.08 - 0.12
保守用户：0 - 0.03

趋势标签示例：

brooch
lace_detail
cool_blue
khaki
poetcore
glamoratti
structured_shoulder
funnel_neck
chunky_accessory
celestial

⸻

10. 推荐模型组合：我建议这样选

当前最优组合

规则引擎
+ LightFM
+ outfit strategy scorer
+ 多样性重排
+ 反馈权重更新

原因：

- 数据少也能跑
- 可解释
- 能快速接入你的偏好权重
- 不依赖 LLM
- 后续可以平滑升级

中期升级组合

LightFM / implicit ALS 召回
+ XGBoost Ranker 排序
+ graph random walk 扩展候选
+ MMR 多样性重排

RecBole 可以作为实验框架使用，它基于 Python/PyTorch，覆盖 general、sequential、context-aware、knowledge-based 等多类推荐算法，适合你后续系统性比较模型。 ￼

Cornac 也适合研究多模态推荐，因为它强调在用户—物品交互稀疏时引入社交图、文本、图像等辅助数据。 ￼

后期研究组合

Outfit Transformer
+ HFGN
+ personalized compatibility model
+ contextual bandit

Contextual bandit 适合解决“探索 vs 利用”：在不同用户和场景下推荐系统既要推荐已知高分 outfit，也要小比例探索新风格。Li 等人在 WWW 2010 的 contextual-bandit 推荐研究中，就是根据用户与物品上下文选择推荐，并从点击反馈中适应。 ￼

⸻

11. OOTODAY 可以直接落地的 scoring modules

建议你把策略库拆成独立模块：

interface OutfitScorer {
  name: string
  score(outfit, user, context): number
  explain(outfit, user, context): string[]
}

模块列表：

ContextFitScorer
WeatherPracticalityScorer
ColorHarmonyScorer
PaletteMatchScorer
SilhouetteBalanceScorer
FormalityScorer
MaterialSeasonScorer
PatternConflictScorer
CapsuleScorer
FormulaScorer
SandwichScorer
WrongShoeScorer
LayeringScorer
ThreeWordStyleScorer
TrendOverlayScorer
NoveltyScorer
WardrobeRotationScorer
FeedbackPersonalizationScorer

每套 outfit 输出：

RecommendationResult {
  outfit_id
  item_ids
  total_score
  score_breakdown
  explanation
  risk_flags
}

示例解释：

推荐原因：
1. 这套适合今天 13°C 的通勤场景，外套保暖但不会太厚。
2. 黑色上衣和黑色乐福鞋形成 sandwich 呼应。
3. 牛仔裤降低了西装外套的正式感，更适合日常上班。
4. 这双鞋和你最近收藏的 classic / relaxed 风格匹配。

⸻

12. 多样性重排：避免每天都推荐同一种

初排后建议加一层 rerank：

def rerank_with_diversity(candidates, k):
    selected = []
    while len(selected) < k:
        best = max(
            candidates,
            key=lambda c: c.score - 0.25 * similarity_to_selected(c, selected)
        )
        selected.append(best)
        candidates.remove(best)
    return selected

相似度可以看：

主色是否相同
核心单品是否相同
公式是否相同
风格标签是否相同
正式度是否相同
鞋子是否相同

这样可以保证 top 5 里不是五套“黑白灰通勤”。

⸻

13. 引擎更新策略

每次推荐时更新

天气
场景
衣物可用状态
最近穿着冷却
用户当天 effort level

每天更新

用户近期偏好
单品 wear_count
近期颜色偏好
近期场景偏好
推荐覆盖率

每周更新

LightFM / implicit 模型
XGBoost ranker
趋势权重
个人风格向量
衣橱缺口分析

⸻

14. 最小可行版本路线图

V1：规则 + 策略库

先做：

衣橱 item schema
场景 context schema
12 个穿搭策略 scorer
候选模板生成
总分排序
解释输出
反馈事件记录

这一步不需要训练模型。

V2：LightFM 个性化

加入：

用户特征
单品特征
隐式反馈矩阵
LightFM recall

反馈矩阵可以这样设计：

user_id, item_id, weight
user_id, outfit_id, weight

V3：排序学习

加入：

XGBoost / LightGBM Ranker
features = outfit_score_breakdown + user/context/item features
label = worn / saved / rated_good / replaced / disliked

V4：图与兼容性模型

加入：

item-item co-wear graph
user-item graph
category-outfit graph
outfit compatibility training

V5：趋势与探索

加入：

trend taxonomy
contextual bandit
personal trend sensitivity
time-decayed trend score

⸻

15. 对你列出的 GitHub 库的取舍建议

库	建议
recommenders-team/recommenders	用来设计评估体系和 baseline，不一定作为核心依赖
gorse-io/gorse	借鉴事件模型和服务 API；是否直接引入要看你架构
RecBole	用作算法实验台，比较模型，不建议一开始接进生产
LightFM	强烈建议第一阶段使用
implicit	中期有足够隐式反馈后接入
Cornac	适合多模态实验，尤其是图像/文本/交互组合
Outfit Transformer	后期研究 outfit-level compatibility
Polyvore	借鉴任务定义：compatibility、fill-in-the-blank
HFGN	后期做图推荐和个性化 outfit 推荐
DiFashion	研究参考，不建议当前工程接入

⸻

最终推荐方案

OOTODAY 的推荐引擎可以定为：

OOTODAY Non-LLM Outfit Recommendation Engine
1. Constraint Generator
   天气、场景、衣物状态、dress code 硬过滤
2. Formula Candidate Builder
   胶囊衣橱、场景公式、sandwich、layering、wrong shoe 等生成候选
3. Hybrid Recall
   LightFM 冷启动个性化
   implicit ALS/BPR 中期召回
   item-item / graph recall 后期扩展
4. Outfit Compatibility Scorer
   颜色、廓形、材质、正式度、图案、鞋包、季节
5. Personalized Ranker
   先加权规则
   后 XGBoost / LightGBM Ranker
6. Strategy Overlay
   capsule
   three-word style
   seasonal palette
   sandwich dressing
   wrong shoe theory
   2/3 rule
   proportion balance
   layering
   tonal dressing
   occasion niche
   Pinterest recreation
   trend overlay
7. Feedback Learner
   save / wear / replace / dislike / satisfaction
   更新用户偏好、单品权重、pair compatibility、场景偏好
8. Evaluation Loop
   NDCG@K
   Recall@K
   coverage
   diversity
   novelty
   wear-through rate
   edit rate
   satisfaction

最关键的一点：趋势只能做 overlay，用户偏好和场景适配必须是主干。
这样 OOTODAY 才不会变成“追热点穿搭推荐器”，而是一个能长期理解用户衣橱、生活场景和审美偏好的实用推荐系统。