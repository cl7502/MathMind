import React, { useState, useEffect } from 'react';
import { Settings, Printer, Eye, AlertTriangle } from 'lucide-react';
import { 
    AppSettings, 
    generateSingleProblem, 
    ExprNode, 
    Op 
} from './lib/generator';
import { Frac } from './lib/fraction';
import { MathNode } from './components/MathNode';

export default function App() {
    const [settings, setSettings] = useState<AppSettings>({
        mode: 'fraction',
        count: 50,
        columns: 3,
        opCount: 3,
        hasParens: true,
        ops: ['+', '-', '×', '÷'],
        num1Digit: true,
        num2Digit: true,
        resultMax: 100,
        
        allowProper: true,
        allowImproper: true,
        allowMixed: false,
        allowSameDenom: true,
        allowDiffDenom: true,
        
        denom1Digit: true,
        denom2Digit: true,
        allowZeroNum: false,
    });

    const [problems, setProblems] = useState<{ ast: ExprNode, ans: Frac }[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [printMode, setPrintMode] = useState<'none' | 'questions' | 'answers'>('none');

    const handleOpChange = (op: Op) => {
        setSettings(s => ({
            ...s, 
            ops: s.ops.includes(op) 
                ? s.ops.filter(o => o !== op) 
                : [...s.ops, op]
        }));
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setErrorMsg('');
        
        if (!settings.num1Digit && !settings.num2Digit) {
            setErrorMsg("请检查数字范围！");
            setIsGenerating(false);
            return;
        }
        if (settings.ops.length === 0) {
            setErrorMsg("请至少选择一种运算类型！");
            setIsGenerating(false);
            return;
        }

        setTimeout(() => {
            const newProblems: { ast: ExprNode, ans: Frac }[] = [];
            let failed = 0;
            
            for (let i = 0; i < settings.count; i++) {
                const p = generateSingleProblem(settings);
                if (p) newProblems.push(p);
                else failed++;
            }

            if (failed > 0) {
                setErrorMsg(`生成完成，但由于参数冲突较难满足条件，有 ${failed} 题未能生成。建设放宽限制条件。`);
            }
            
            setProblems(newProblems);
            setIsGenerating(false);
        }, 10);
    };

    const handlePrint = (mode: 'questions' | 'answers') => {
        setPrintMode(mode);
        setTimeout(() => window.print(), 300);
    };

    // Reset print mode after printing (browser print is synchronous, so this runs after print dialog closes usually)
    useEffect(() => {
        const handleAfterPrint = () => setPrintMode('none');
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    const isIntMode = settings.mode === 'integer';

    if (printMode !== 'none') {
        const title = settings.mode === 'integer' ? '整数运算' : 
                      settings.mode === 'fraction' ? '分数运算' : '混合运算';
        const typeLabel = printMode === 'questions' ? '(练习题)' : '(参考答案)';
        
        return (
            <div className="bg-white text-black min-h-screen p-8 text-xl font-serif">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold font-sans tracking-widest">口算{title} {typeLabel}</h1>
                </div>
                
                <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-6 text-2xl font-sans">
                    <div className="w-1/4">姓名：<span className="inline-block w-32 border-b border-black"></span></div>
                    <div className="w-1/4">日期：<span className="inline-block w-32 border-b border-black"></span></div>
                    <div className="w-1/4 "><span className="ml-[10%]">用时：</span><span className="inline-block w-28 border-b border-black"></span></div>
                    <div className="w-1/4 text-right">得分：<span className="inline-block w-24 border-b border-black"></span></div>
                </div>

                <div 
                    className="grid gap-y-12 gap-x-8 mt-12"
                    style={{ gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))` }}
                >
                    {problems.map((p, i) => (
                        <div key={i} className="flex items-center text-2xl relative">
                            {/* Dotted border top simulation based on UI, we just rely on grid gap for clean look mostly, but visual shows thin subtle horizontal lines between rows... omitted for standard clean look or we can add custom border */}
                            <div className="w-full flex items-center h-16">
                                <MathNode node={p.ast} /> 
                                <span className="mx-2 text-3xl font-sans translate-y-[2px]">=</span> 
                                {printMode === 'answers' && (
                                    <span className="ml-2 font-bold text-red-700">
                                        <MathNode node={{type: 'num', val: p.ans, valFormat: 'mixed'}} />
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="w-full max-w-4xl bg-white shadow-xl rounded-lg border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-blue-600 text-white px-4 py-3 flex items-center space-x-2">
                    <Settings size={20} />
                    <h1 className="text-lg font-semibold tracking-wider">口算题生成器</h1>
                </div>

                {/* Settings Panel */}
                <div className="p-5 border-b border-neutral-200 bg-neutral-50 shrink overflow-y-auto max-h-[50vh]">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-y-4 gap-x-2 text-sm text-neutral-700">
                        
                        {/* Row 1: Mode */}
                        <div className="md:col-span-12 flex items-center space-x-6">
                            <span className="font-medium whitespace-nowrap min-w-[80px]">运算模式：</span>
                            {(['integer', 'fraction', 'mixed'] as const).map(mode => (
                                <label key={mode} className="flex items-center space-x-1 cursor-pointer">
                                    <input type="radio" value={mode} checked={settings.mode === mode} 
                                        onChange={() => setSettings({...settings, mode})}
                                        className="w-4 h-4 text-blue-600" />
                                    <span>{mode === 'integer' ? '整数运算' : mode === 'fraction' ? '分数运算' : '混合运算 (整数&分数)'}</span>
                                </label>
                            ))}
                        </div>

                        {/* Row 2: Counts & Columns */}
                        <div className="md:col-span-12 flex flex-wrap items-center gap-x-8 gap-y-3">
                            <div className="flex items-center space-x-2 border rounded-sm bg-white px-2 py-1 shadow-sm">
                                <span className="font-medium">题目总数：</span>
                                <input type="number" min={10} max={200} value={settings.count} 
                                    onChange={e => setSettings({...settings, count: Number(e.target.value)})}
                                    className="w-16 border rounded px-1  outline-none focus:ring-1 focus:ring-blue-500 text-center" />
                                <span className="text-neutral-400 text-xs">(10~200)</span>
                            </div>

                            <div className="flex items-center space-x-2 border rounded-sm bg-white px-2 py-1 shadow-sm">
                                <span className="font-medium">每行列数：</span>
                                <input type="number" min={1} max={5} value={settings.columns} 
                                    onChange={e => setSettings({...settings, columns: Number(e.target.value)})}
                                    className="w-12 border rounded px-1 outline-none focus:ring-1 focus:ring-blue-500 text-center" />
                            </div>

                            <div className="flex items-center space-x-2 border rounded-sm bg-white px-2 py-1 shadow-sm">
                                <span className="font-medium">运算次数：</span>
                                <input type="number" min={1} max={3} value={settings.opCount} 
                                    onChange={e => setSettings({...settings, opCount: Number(e.target.value)})}
                                    className="w-12 border rounded px-1 outline-none focus:ring-1 focus:ring-blue-500 text-center" />
                                <span className="text-neutral-400 text-xs">(1~3次)</span>
                            </div>

                            <label className="flex items-center space-x-2 cursor-pointer bg-white px-2 py-1.5 border rounded-sm shadow-sm">
                                <input type="checkbox" checked={settings.hasParens} 
                                    onChange={e => setSettings({...settings, hasParens: e.target.checked})}
                                    disabled={settings.opCount < 2}
                                    className="w-4 h-4 text-blue-600 rounded" />
                                <span className={settings.opCount < 2 ? 'text-neutral-400' : ''}>包含括号(仅1对)</span>
                            </label>
                        </div>

                        {/* Row 3: Ops */}
                        <div className="md:col-span-12 flex items-center space-x-4 border-t border-dashed border-neutral-300 pt-3 mt-1">
                            <span className="font-medium min-w-[80px]">运算类型：</span>
                            {(['+', '-', '×', '÷'] as Op[]).map(op => (
                                <label key={op} className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.ops.includes(op)}
                                        onChange={() => handleOpChange(op)}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>{op === '+' ? '加法' : op === '-' ? '减法' : op === '×' ? '乘法' : '除法'}</span>
                                </label>
                            ))}
                        </div>

                        {/* Row 4: Num Range */}
                        <div className="md:col-span-12 flex flex-wrap items-center gap-x-8 gap-y-3 mt-1">
                            <div className="flex items-center space-x-4">
                                <span className="font-medium min-w-[80px]">数字范围：</span>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.num1Digit}
                                        onChange={e => setSettings({...settings, num1Digit: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>个位整数</span>
                                </label>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.num2Digit}
                                        onChange={e => setSettings({...settings, num2Digit: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>十位整数</span>
                                </label>
                            </div>
                            
                            <div className={`flex items-center space-x-2 ml-4 ${settings.mode === 'fraction' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <span className="font-medium border-l border-neutral-300 pl-4">结果范围：</span>
                                <div className="flex items-center space-x-1">
                                    <input 
                                        type="number" 
                                        min="1"
                                        list="result-max-options"
                                        value={settings.resultMax || ''}
                                        onChange={e => setSettings({...settings, resultMax: Number(e.target.value)})}
                                        className="w-20 border rounded px-1 outline-none focus:ring-1 focus:ring-blue-500 text-center"
                                    />
                                    <datalist id="result-max-options">
                                        <option value="50" />
                                        <option value="100" />
                                    </datalist>
                                    <span>以内 (含)</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 5: Fraction specific */}
                        <div className={`md:col-span-12 border-t border-dashed border-neutral-300 pt-3 mt-2 flex flex-col gap-y-3 ${isIntMode ? 'opacity-50 pointer-events-none' : ''}`}>
                             
                            {/* Fraction Types */}
                            <div className="flex items-center space-x-4">
                                <span className="font-medium min-w-[80px]">分数设置：</span>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.allowProper} 
                                        onChange={e => setSettings({...settings, allowProper: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>真分数</span>
                                </label>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.allowImproper} 
                                        onChange={e => setSettings({...settings, allowImproper: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>假分数</span>
                                </label>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.allowMixed} 
                                        onChange={e => setSettings({...settings, allowMixed: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>带分数</span>
                                </label>
                            </div>

                            {/* Denominator Settings */}
                            <div className="flex items-center space-x-4">
                                <span className="font-medium min-w-[80px]">分母设置：</span>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.allowSameDenom} 
                                        onChange={e => setSettings({...settings, allowSameDenom: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>同分母</span>
                                </label>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.allowDiffDenom} 
                                        onChange={e => setSettings({...settings, allowDiffDenom: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>异分母</span>
                                </label>
                                <div className="w-px h-4 bg-neutral-300 mx-1"></div>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.denom1Digit}
                                        onChange={e => setSettings({...settings, denom1Digit: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>个位整数</span>
                                </label>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.denom2Digit}
                                        onChange={e => setSettings({...settings, denom2Digit: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>十位整数</span>
                                </label>
                            </div>
                            
                            {/* Numerator Settings */}
                            <div className="flex items-center space-x-4">
                                <span className="font-medium min-w-[80px]">分子设置：</span>
                                <label className="flex items-center space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={settings.allowZeroNum}
                                        onChange={e => setSettings({...settings, allowZeroNum: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded" />
                                    <span>允许为0</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="bg-yellow-50 border-y border-yellow-200 px-4 py-2 flex items-start space-x-2 text-yellow-800 text-sm">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <span className="leading-snug">{errorMsg}</span>
                    </div>
                )}

                {/* Preview Panel */}
                <div className="flex-1 bg-white p-4 overflow-y-auto font-serif min-h-0">
                    <div className="text-sm font-semibold text-neutral-500 mb-4 font-sans px-2 border-b border-neutral-100 pb-2 flex items-center space-x-2">
                        <Eye size={16} /> <span>题目预览</span> 
                        {problems.length > 0 && <span className="font-normal">({problems.length} 题)</span>}
                    </div>
                    {problems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-400 font-sans">
                            <span className="text-lg">点击下方“生成预览”查看题目</span>
                        </div>
                    ) : (
                        <div 
                            className="grid gap-y-6 gap-x-2 text-lg lg:text-xl pl-2"
                            style={{ gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))` }}
                        >
                            {problems.map((p, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="flex items-center h-12 w-full justify-start">
                                        <MathNode node={p.ast} /> <span className="mx-1.5 translate-y-[1px] font-sans">=</span>
                                        {/* Optional inline answer preview rendering for debugging/display, usually omitted from regular preview to just show questions. If we want it: <span className="ml-1 text-red-500 text-sm"><MathNode node={{type:'num', val:p.ans}}/></span> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="p-4 bg-neutral-100 border-t border-neutral-300 flex items-center justify-between shrink-0">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 shadow-sm px-6 py-2.5 rounded-md font-medium transition flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    >
                        <Eye size={18} className="text-blue-600" />
                        <span>{isGenerating ? '生成中...' : '生成预览'}</span>
                    </button>

                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-neutral-500 mr-2">打印输出:</span>
                        <button 
                            onClick={() => handlePrint('questions')}
                            disabled={problems.length === 0 || isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-5 py-2.5 rounded-md font-medium transition flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        >
                            <Printer size={18} />
                            <span>练习题</span>
                        </button>
                        <button 
                            onClick={() => handlePrint('answers')}
                            disabled={problems.length === 0 || isGenerating}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm px-5 py-2.5 rounded-md font-medium transition flex items-center space-x-2 focus:ring-2 focus:ring-green-500 outline-none disabled:opacity-50"
                        >
                            <Printer size={18} />
                            <span>带答案练习题</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
