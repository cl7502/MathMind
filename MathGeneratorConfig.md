# 小学生口算题生成器参数配置 (AppSettings)

本文档归纳了当前口算题生成器的核心配置参数(`AppSettings`)，旨在作为参考词典，方便之后在其他项目或语言(如 Java、Python、C# 等)中复用与重构。

## 核心配置数据结构

在本项目中，对应 TypeScript 的 `AppSettings` 接口定义如下：

```typescript
type Op = '+' | '-' | '×' | '÷';

interface AppSettings {
    // === 基础与全局设置 ===
    mode: 'integer' | 'fraction' | 'mixed'; // 运算模式：整数运算、分数运算、混合运算
    count: number;                          // 题目总数 (例如: 50, 100)
    columns: number;                        // 输出排版：每行列数 (UI与打印相关)
    
    // === 表达式结构设置 ===
    opCount: number;                        // 单题包含的运算符数量 (1~3代表2个到4个操作数)
    hasParens: boolean;                     // 是否包含括号 (通常为1对括号)
    ops: Op[];                              // 允许参与随机生成的运算符，例如 ['+', '-', '×', '÷']
    
    // === 整数数字范围设置 ===
    num1Digit: boolean;                     // 允许生成个位数整数 (1-9)
    num2Digit: boolean;                     // 允许生成十位数整数 (10-99)
    resultMax: number;                      // 最终结果最大值限制 (通常为 50 或 100，也支持自定义)
    
    // === 分数类型设置 (适用于 mode 为 fraction 或 mixed) ===
    allowProper: boolean;                   // 是否允许生成【真分数】
    allowImproper: boolean;                 // 是否允许生成【假分数】
    allowMixed: boolean;                    // 是否允许生成【带分数】
    
    // === 分母与分子控制 ===
    allowSameDenom: boolean;                // 表达式内是否允许【同分母】
    allowDiffDenom: boolean;                // 表达式内是否允许【异分母】
    denom1Digit: boolean;                   // 分母允许个位整数 (1-9，通常不为1)
    denom2Digit: boolean;                   // 分母允许十位整数 (10-99)
    allowZeroNum: boolean;                  // 特殊情况：是否允许分子为 0 
    allowNegativeResult: boolean;           // 是否允许计算中间过程或最终结果出现负数
}
```

## 参数迁移与重构指南

在将该参数类迁移至其他语言（如 Java 的 `class GeneratorConfig`）时，需要注意以下几点：

1. **类型映射**：
   - TypeScript 的 `'integer' | 'fraction' | 'mixed'` 可以映射为目标语言中的 `Enum` (例如 `Enum Mode { INTEGER, FRACTION, MIXED }`)。
   - `Op` 类型也可封装为一个包含 `ADD, SUBTRACT, MULTIPLY, DIVIDE` 的枚举。
2. **逻辑分离**：
   - 现有的 `columns` 等参数偏向于“UI/视图展示”。在严格分离后端架构下，建议将此配置类拆分成 `UIConfig`（排版用）和 `GeneratorConfig`（出题核心引擎用）两部分。
3. **扩展性建议**：
   - 诸如生成范围(`num1Digit`, `num2Digit`)未来可能不能满足细粒度的范围控制需求，可以考虑重构成区间对象，例如 `Range maxIntegerRange = new Range(1, 100)`。
   - 结果约束 (`resultMax`) 可能还会衍伸出下限 (`resultMin`)，为复杂需求留出空间。
