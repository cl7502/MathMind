# 游戏化口算学习平台“口算攀登树”详细设计说明书

## 1. 引言
本项目从传统的“口算试卷生成工具”升级为“游戏化闯关学习平台（口算攀登树）”。
用户通过登录账号，拥有一棵属于自己的“能力树”。通过完成各个层级的口算挑战（如每次连续答对 $n$ 题），可以不断向上攀登解锁新关卡。系统引入排名、段位和勋章系统，激发使用者的学习兴趣。

本系统采用现代全栈多端架构，满足Web端、移动端APP以及微信等小程序的跨端使用需求。

---

## 2. 系统总体架构设计

架构从“纯工具无状态”转换为“强交互、高并发、有状态”的互联网游戏架构。

*   **前端基座容器**
    *   **Web端**: `React` + `Next.js` + `Tailwind CSS` (适用于管理后台、桌面端玩家、大屏互动)
    *   **移动端**: `React Native` + `Expo` (适用于iOS/Android，提供原生流畅动画与触控体验)
    *   **小程序**: `Taro` (适用于微信/支付宝小程序，负责病毒式轻量传播)
*   **服务端接口层**
    *   `FastAPI` (Python): 提供高性能异步API，支撑高并发的答题请求与即时结算。
*   **数据存储与缓存层 (新增)**
    *   `PostgreSQL`: 存储持久化数据（用户账号、关卡节点配置、成绩流水、勋章背包）。
    *   `Redis`: 负责排行榜排名（ZSET）、在线状态、分布式防并发作弊锁。

---

## 3. 游戏机制与核心设计

### 3.1 攀登树闯关机制 (The Climbing Mechanics)
*   **层级（Level）与主干（Branch）**：
    *   树可以分为多干，比如“加减法树枝”、“乘除法树枝”、“分数树枝”。
    *   主干高度即为等级。每一级具有静态配置的参数（对应旧版的 `AppSettings` 难度系数配置）。
    *   例如：树的第10层挑战，配置为【混合运算，100以内，2次运算，10道题】。
*   **挑战条件（Challenge）**：
    *   玩家消耗“体力”开始挑战。需要在限定时间（或无时间限制但追求星级）内，完成前端下发的该层级包含的配置题目。
    *   **过关判定**：例如10题必须全对，或达到90分才算过关，通过后树木生长，角色向上攀登一级。

### 3.2 积分与勋章中心 (Achievement System)
*   **成就勋章**：“一日百题”、“满分速算王”、“分数征服者”等。达成特定条件后端自动下发数字勋章。
*   **排行榜 (Leaderboard)**:
    *   分为：服务器总排行、本周肝帝（答题数）、最强王者（爬树最高层数）。利用 Redis 的 `ZSET` 进行实时结算与展示。

---

## 4. 后端接口设计 (FastAPI)

后端的核心不仅是“出题”，还增加了“验证”和“防作弊”。（在游戏系统中，决不能让客户端自己验证答案直接上传分数）。

### 4.1 核心数据交互模型

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserProfile(BaseModel):
    user_id: int
    username: str
    current_level: int       # 当前树的层数
    total_score: int         # 总积分
    medals: List[str]        # 勋章列表

class ProblemSet(BaseModel):
    challenge_id: str        # 本次挑战唯一ID
    level: int               # 难度级别
    questions: List[dict]    # 仅仅包含 AST 渲染节点，**绝对不能包含答案**

class AnswerSubmission(BaseModel):
    challenge_id: str
    answers: List[str]       # 用户提交的答案（如分子/分母结构的JSON或纯数字文本）
    time_spent: int          # 答题耗时(前端上报，做辅助验证)
```

### 4.2 核心业务流 API

1.  `POST /api/v1/auth/login`: 账户验证，返回 JWT Token。
2.  `GET /api/v1/game/tree/status`: 获取玩家当前树的高低、解锁的勋章，渲染主界面。
3.  `POST /api/v1/game/challenge/start`: 
    *   **后端逻辑**：根据用户当前 Level 在 DB 对应的 `AppSettings` 难度，调用内部生成引擎。将题目及正确答案在 Redis 中缓存（TTL如10分钟），**仅将无答案的题干 AST 下发给客户端**。
4.  `POST /api/v1/game/challenge/submit`:
    *   **后端逻辑**：接受用户答案，从 Redis 取出正确答案对比。计算正确率。
    *   如果满分 -> DB 更新 `current_level += 1`，增加经验，触发勋章判定。
    *   返回结算画面数据（星级、奖励、错题解析）。
5.  `GET /api/v1/social/leaderboard`: 返回全服前100的爬树层级。

---

## 5. 跨端 UI 与交互方案设计

### 5.1 场景分离与呈现策略
跨端开发的核心挑战是“交互差异”，我们通过封装不同底层的组件解决：

*   **UI 主界面（爬树动画页）**:
    *   **Web端** 屏幕大，可以做成横版的“岛屿与通天树”，鼠标Hover查看关卡信息。
    *   **React Native / Taro (手机端)**，采用竖屏纵轴滚动模式，从下往上滑动解锁被迷雾笼罩的树顶。
*   **答题面板 (Combat/Gameplay UI)**:
    *   移动端放弃全键盘，提供**定制的数字软键盘**。这对于小学生非常关键，定制键盘包含数字 0-9，负号 `-`，以及如果是分数模式下的特殊键（“分子分母切换键”或“/”号键）。
    *   上方为倒计时（UI 动效进度条），中间为复用的 `<MathNode>` 算式渲染组件（保证完美兼容分式的展示）。

### 5.2 题目渲染组件层复用
我们在前期整理的 `MathNodeBase` 组件可以直接复用于多端答题界面中。
```tsx
// 答题界面的组件使用示例
<View className="combat-area">
   {/* 共用渲染引擎 */}
   <MathNodeBase node={currentQuestion.ast} Components={PlatformComponents} />
   
   <View className="equal-sign">=</View>

   {/* 学生输入区域，点击弹出自定义虚拟键盘 */}
   <InputBox value={studentInput} mode={difficulty.mode} />
</View>
```

---

## 6. 游戏系统安全性设计机制

为了保障排行榜的含金量和系统的健康生态：

1.  **答案隔离防篡改**：前端获取题目时，网络截包绝无正确答案。校验过程100%转移到后台 FastAPI 内存在校验。
2.  **答题时间阀门**：利用 `Redis` 在 `start` 时记录开始时间戳。如果用户 `submit` 的时间间隔不合理（如1秒内做完10道复杂除法），直接判定作弊异常，不计入成绩。
3.  **防重放攻击**：每次 `challenge_id` 为一次性 UUID，使用完立即从数据库中销毁（Invalidate），防止脚本反复提交同一个包刷取经验。

---

## 7. 演进与扩展路线图

1.  **Phase 1**：单人 PVE 爬树模式（目前设计版本，验证留存率）。包含完整的全端渲染、题库自动升维和个人成绩体系。
2.  **Phase 2**：勋章墙扩充体系，引入班级/学校维度的子排行榜，增加教务管理 Web 端界面供老师监管。
3.  **Phase 3**：双人同屏/联机 PVP 模式，利用 WebSockets (FastAPI 本身对 websocket 支持良好) 实现“抢答”式树藤赛跑小游戏。
