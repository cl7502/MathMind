import { Frac } from './fraction';

export type Op = '+' | '-' | '×' | '÷';

export interface ExprNode {
    type: 'num' | 'op';
    val?: Frac;
    valFormat?: 'proper' | 'improper' | 'mixed' | 'integer';
    op?: Op;
    left?: ExprNode;
    right?: ExprNode;
}

export interface AppSettings {
    mode: 'integer' | 'fraction' | 'mixed';
    count: number;
    columns: number;
    opCount: number;
    hasParens: boolean;
    ops: Op[];
    num1Digit: boolean;
    num2Digit: boolean;
    resultMax: number; // 50 or 100
    
    allowProper: boolean;
    allowImproper: boolean;
    allowMixed: boolean;
    
    allowSameDenom: boolean;
    allowDiffDenom: boolean;
    denom1Digit: boolean;
    denom2Digit: boolean;
    allowZeroNum: boolean;
    allowNegativeResult: boolean;
}

const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomOp = (allowedOps: Op[]) => {
    return allowedOps[Math.floor(Math.random() * allowedOps.length)];
};

function generateValNode(s: AppSettings, commonDenom: number, isSameDenom: boolean): ExprNode {
    const isFrac = s.mode === 'fraction' || (s.mode === 'mixed' && Math.random() < 0.5);

    if (!isFrac) {
        let min = 1, max = 9;
        if (s.num1Digit && s.num2Digit) { min = 1; max = 99; }
        else if (s.num2Digit) { min = 10; max = 99; }
        return { type: 'num', val: new Frac(randomInt(min, max), 1), valFormat: 'integer' };
    } else {
        let dMin = 2, dMax = 9;
        if (s.denom1Digit && s.denom2Digit) { dMin = 2; dMax = 99; }
        else if (s.denom2Digit) { dMin = 10; dMax = 99; }

        let d = (isSameDenom && commonDenom > 0) ? commonDenom : randomInt(dMin, dMax);
        
        let types: ('proper' | 'improper' | 'mixed')[] = [];
        if (s.allowProper) types.push('proper');
        if (s.allowImproper) types.push('improper');
        if (s.allowMixed) types.push('mixed');
        if (types.length === 0) types = ['proper'];

        const t = types[Math.floor(Math.random() * types.length)];

        let n = 1;
        const nMin = s.allowZeroNum ? 0 : 1;

        if (t === 'proper') {
            if (d === 1) d = 2;
            let maxN = Math.max(d - 1, nMin);
            n = randomInt(nMin, maxN);
        } else if (t === 'improper') {
            n = randomInt(Math.max(d, nMin), d * 2);
        } else if (t === 'mixed') {
            let w = randomInt(1, 5);
            let properN = randomInt(1, Math.max(1, d - 1));
            n = w * d + properN;
        }

        return { type: 'num', val: new Frac(n, d), valFormat: t };
    }
}

function evaluate(node: ExprNode, mode: AppSettings['mode'], allowNegative: boolean = false): Frac | null {
    if (node.type === 'num') return node.val!;
    const l = evaluate(node.left!, mode, allowNegative);
    const r = evaluate(node.right!, mode, allowNegative);
    if (!l || !r) return null;
    
    try {
        let res: Frac;
        switch (node.op) {
            case '+': res = l.add(r); break;
            case '-': res = l.sub(r); break;
            case '×': res = l.mul(r); break;
            case '÷':
                if (r.n === 0) return null;
                res = l.div(r);
                if (mode === 'integer' && !res.isInteger()) return null; // Must divide evenly in int mode
                break;
            default: return null;
        }
        if (!allowNegative && res.isNegative()) return null;
        return res;
    } catch { 
        return null; 
    }
}

function randomAST(opCount: number, s: AppSettings, commonDenom: number, isSameDenom: boolean): ExprNode {
    if (opCount === 0) {
        return generateValNode(s, commonDenom, isSameDenom);
    }
    const opsLeft = Math.floor(Math.random() * opCount);
    const opsRight = opCount - 1 - opsLeft;
    
    return {
        type: 'op',
        op: getRandomOp(s.ops),
        left: randomAST(opsLeft, s, commonDenom, isSameDenom),
        right: randomAST(opsRight, s, commonDenom, isSameDenom)
    };
}

export function checkNeedsParens(node: ExprNode, parentOp?: Op, isRightChild?: boolean): boolean {
    if (node.type === 'num') return false;
    if (!parentOp) return false;
    
    const pLevel = (parentOp === '×' || parentOp === '÷') ? 2 : 1;
    const cLevel = (node.op === '×' || node.op === '÷') ? 2 : 1;

    if (cLevel < pLevel) return true;
    if (cLevel === pLevel && isRightChild) {
        if (parentOp === '-' && (node.op === '+' || node.op === '-')) return true;
        if (parentOp === '÷') return true; 
    }
    return false;
}

export function countParens(node: ExprNode, parentOp?: Op, isRightChild?: boolean): number {
    if (node.type === 'num') return 0;
    
    let p = checkNeedsParens(node, parentOp, isRightChild) ? 1 : 0;
    p += countParens(node.left!, node.op, false);
    p += countParens(node.right!, node.op, true);
    return p;
}

export function generateSingleProblem(s: AppSettings): { ast: ExprNode, ans: Frac } | null {
    let commonDenom = 0;
    
    let isSameDenom = false;
    if (s.allowSameDenom && s.allowDiffDenom) {
        isSameDenom = Math.random() < 0.5;
    } else if (s.allowSameDenom) {
        isSameDenom = true;
    } else if (s.allowDiffDenom) {
        isSameDenom = false;
    } else {
        isSameDenom = true;
    }

    if (s.mode !== 'integer' && isSameDenom) {
         let dMin = 2, dMax = 9;
         if (s.denom1Digit && s.denom2Digit) { dMin = 2; dMax = 99; }
         else if (s.denom2Digit) { dMin = 10; dMax = 99; }
         commonDenom = randomInt(dMin, dMax);
    }

    const activeOps = s.ops.length > 0 ? s.ops : ['+'] as Op[];
    const tempS = { ...s, ops: activeOps };

    // More retries to increase success rate for constrained parameters
    for (let i = 0; i < 500; i++) {
        const ast = randomAST(tempS.opCount, tempS, commonDenom, isSameDenom);
        const ans = evaluate(ast, tempS.mode, tempS.allowNegativeResult);

        if (!ans) continue;
        if (!tempS.allowNegativeResult && ans.isNegative()) continue; // Result cannot be negative unless allowed

        if (tempS.mode === 'integer' || tempS.mode === 'mixed') {
            if (tempS.resultMax > 0 && ans.toNumber() > tempS.resultMax) continue;
        }

        const pCount = countParens(ast);
        if (tempS.hasParens && pCount !== 1) continue;
        if (!tempS.hasParens && pCount > 0) continue;

        return { ast, ans };
    }
    return null;
}
