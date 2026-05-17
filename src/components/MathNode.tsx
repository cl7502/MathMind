import React from 'react';
import { ExprNode, Frac, checkNeedsParens, Op } from '../lib/generator';

// Formats a generic fraction or integer beautifully
const RenderFrac = ({ f, format }: { f: Frac, format?: 'proper' | 'improper' | 'mixed' | 'integer' }) => {
    if (f.d === 1 || f.n === 0) {
        return <span className="inline-block px-[2px]">{f.n}</span>;
    }

    let w = 0, n = Math.abs(f.n), d = f.d;
    let isNeg = f.n < 0;

    if (format === 'mixed' && n > d) {
        w = Math.floor(n / d);
        n = n % d;
    }

    const sign = isNeg ? '-' : '';

    if (w > 0) {
        return (
            <span className="inline-flex items-center mx-[2px] align-middle text-[1em]">
                {sign && <span>{sign}</span>}
                <span>{w}</span>
                {n !== 0 && (
                    <span className="inline-flex flex-col items-center mx-[1px] align-middle text-[0.85em]">
                        <span className="border-b-[1.5px] border-current w-full text-center px-[2px] leading-tight pb-[1px] transform translate-y-[2px]">{n}</span>
                        <span className="text-center px-[2px] leading-tight pt-[1px] transform -translate-y-[1px]">{d}</span>
                    </span>
                )}
            </span>
        );
    }

    return (
        <span className="inline-flex flex-col items-center mx-[2px] align-middle text-[1em]">
            <span className="border-b-[1.5px] border-current w-full text-center px-[3px] leading-tight pb-[1px] transform translate-y-[2px]">{sign}{n}</span>
            <span className="text-center px-[3px] leading-tight pt-[1px] transform -translate-y-[1px]">{d}</span>
        </span>
    );
};

export const MathNode = ({ 
    node, 
    parentOp, 
    isRightChild 
}: { 
    node: ExprNode, 
    parentOp?: Op, 
    isRightChild?: boolean 
}) => {
    if (node.type === 'num') {
        return <RenderFrac f={node.val!} format={node.valFormat} />;
    }

    const needsParens = checkNeedsParens(node, parentOp, isRightChild);

    return (
        <span className="inline-flex items-center whitespace-nowrap">
            {needsParens && <span className="text-[1.1em] mx-[1px] inline-block font-sans transform translate-y-[2px]">(</span>}
            
            <MathNode node={node.left!} parentOp={node.op} isRightChild={false} />
            
            <span className="mx-[4px] text-[1.1em] font-sans px-[1px] transform translate-y-[1px]">{node.op}</span>
            
            <MathNode node={node.right!} parentOp={node.op} isRightChild={true} />
            
            {needsParens && <span className="text-[1.1em] mx-[1px] inline-block font-sans transform translate-y-[2px]">)</span>}
        </span>
    );
};
