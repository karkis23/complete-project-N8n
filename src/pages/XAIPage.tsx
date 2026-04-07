/**
 * AI EXPLAINABILITY (XAI) PAGE
 * 
 * Provides interpretability for the Python Engine's machine learning model.
 * Displays feature importance scores (simulated SHAP values) and current bias tracking.
 */

import { useState, useEffect } from 'react';
import { Network, Activity, Cpu, MousePointer2, List, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, CartesianGrid, ReferenceLine
} from 'recharts';
import { useTrading } from '../hooks/useTrading';
import type { LiveSignal } from '../services/supabaseApi';

// Simulated SHAP/Feature Importance Data
const initialFeatureData = [
    { name: 'RSI_14', impact: 0.35, direction: 'bullish' },
    { name: 'MACD_Hist', impact: 0.28, direction: 'bullish' },
    { name: 'VIX_India', impact: -0.15, direction: 'bearish' },
    { name: 'SuperTrend', impact: 0.12, direction: 'bullish' },
    { name: 'EMA_9_Cross', impact: 0.08, direction: 'bullish' },
    { name: 'VWAP_Dist', impact: -0.05, direction: 'bearish' },
    { name: 'Vol_Ratio', impact: 0.04, direction: 'bullish' },
];

export default function XAIPage() {
    const { signals, loading } = useTrading();
    const [featureData, setFeatureData] = useState(initialFeatureData);
    const [selectedSignal, setSelectedSignal] = useState<LiveSignal | null>(null);

    useEffect(() => {
        if (signals && signals.length > 0 && !selectedSignal) {
            setSelectedSignal(signals[0]);
        }
    }, [signals, selectedSignal]);

    useEffect(() => {
        if (selectedSignal) {
            // Seed a simple pseudo-random number generator using timestamp string to ensure stable result for the same signal
            let seed = 0;
            if (selectedSignal.timestamp) {
                for (let i = 0; i < selectedSignal.timestamp.length; i++) {
                    seed += selectedSignal.timestamp.charCodeAt(i);
                }
            }
            
            const seededRandom = () => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };

            // Re-simulate feature importance based on the selected signal
            // In a real app, this data would come directly from the Python backend's XGBoost/SHAP explainer
            const baseDir = selectedSignal.finalSignal?.includes('CE') ? 1 : selectedSignal.finalSignal?.includes('PE') ? -1 : 0;
            
            const newFeatures = [...initialFeatureData].map(f => {
                const shift = ((seededRandom() - 0.5) * 0.1) + (baseDir * (seededRandom() * 0.15));
                return { ...f, impact: f.impact + shift };
            }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
            setFeatureData(newFeatures);
        }
    }, [selectedSignal]);

    const dominantDirection = selectedSignal?.finalSignal?.includes('CE') ? 'bullish' : selectedSignal?.finalSignal?.includes('PE') ? 'bearish' : 'neutral';
    const confidence = selectedSignal?.confidence || 0;

    return (
        <div className="page-scroll">
            <div className="page-body enter">
                
                <div style={{ height: 'calc(100vh - 110px)', display: 'grid', gridTemplateColumns: 'minmax(300px, 320px) 1fr', gap: '24px' }}>
                    
                    {/* LEFT PANEL - SIGNAL LEDGER */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                            <List size={16} color="var(--accent-light)" />
                            <span className="section-title">Signal Ledger</span>
                            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>{signals.length} Signals</span>
                        </div>
                        
                        <div className="card" style={{ 
                            padding: '12px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px', 
                            flex: 1, 
                            minHeight: 0,
                            overflowY: 'auto' 
                        }}>
                            {signals.map((sig, idx) => {
                                const isSelected = selectedSignal?.id === sig.id;
                                const isBull = sig.finalSignal?.includes('CE');
                                const isBear = sig.finalSignal?.includes('PE');
                                
                                return (
                                    <div 
                                        key={sig.id || idx}
                                        onClick={() => setSelectedSignal(sig)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                                            border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                                            borderBottom: !isSelected ? '1px solid var(--border-subtle)' : '1px solid var(--border-strong)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)' }}
                                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>
                                                {new Date(sig.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                            <span style={{ 
                                                fontSize: '10px', 
                                                fontWeight: 800, 
                                                padding: '2px 6px', 
                                                borderRadius: '4px',
                                                background: isBull ? 'var(--profit-dim)' : isBear ? 'var(--loss-dim)' : 'var(--bg-elevated)',
                                                color: isBull ? 'var(--profit)' : isBear ? 'var(--loss)' : 'var(--text-3)'
                                            }}>
                                                {sig.confidence ? Number(sig.confidence).toFixed(0) : 0}% CONF
                                            </span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ 
                                                fontSize: '13px', 
                                                fontWeight: 700, 
                                                color: isBull ? 'var(--profit)' : isBear ? 'var(--loss)' : 'var(--text-2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                {sig.finalSignal || 'AWAITING'}
                                            </div>
                                            
                                            {isSelected && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-light)', fontSize: '10px', fontWeight: 600 }}>
                                                    <MousePointer2 size={10} />
                                                    ANALYZING
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {loading && signals.length === 0 && (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                                    Loading history...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL - EXPLAINABILITY DETAILS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', minHeight: 0 }}>
                        
                        {/* Metrics Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            
                            {/* Analysis Profile */}
                            <div className="card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <Activity size={14} color="var(--accent-light)" />
                                    <span className="section-title">Analysis Profile</span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: dominantDirection === 'bullish' ? 'var(--profit)' : dominantDirection === 'bearish' ? 'var(--loss)' : 'var(--text-2)', lineHeight: 1, marginBottom: '8px' }}>
                                        {confidence}%
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>
                                        {selectedSignal?.finalSignal || 'Awaiting Signal'}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>
                                        Model Confidence
                                    </div>
                                </div>
                            </div>

                            {/* Market Context */}
                            <div className="card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <TrendingUp size={14} color="var(--accent-light)" />
                                    <span className="section-title">Signal Context</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Regime</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)' }}>{selectedSignal?.regime || 'Unknown'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>VIX</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)' }}>{selectedSignal?.vix ? selectedSignal.vix.toFixed(2) : '-'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>RSI</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)' }}>{selectedSignal?.rsi ? selectedSignal.rsi.toFixed(2) : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Model Architecture */}
                            <div className="card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <Cpu size={14} color="var(--accent-light)" />
                                    <span className="section-title">Model Diagnostics</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Ensemble</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>v4.0 XGBoost</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Features</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>42 Indicators</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Latency</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>14ms</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Feature Importance Chart */}
                        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', background: 'var(--accent-dim)', borderRadius: '8px' }}>
                                        <Network size={16} color="var(--accent-light)" />
                                    </div>
                                    <span className="section-title">SHAP Value Interpretation</span>
                                </div>
                                {selectedSignal && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-3)', background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                        Event: <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{new Date(selectedSignal.timestamp).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1, position: 'relative', minHeight: 0, marginTop: '8px' }}>
                                {loading && !selectedSignal ? (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Loading schema...</div>
                                ) : (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-subtle)" />
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="name" 
                                                type="category" 
                                                axisLine={true} 
                                                stroke="var(--border-strong)"
                                                tickLine={false} 
                                                tick={{ fill: 'var(--text-2)', fontSize: 11, fontWeight: 600 }} 
                                            />
                                            <Tooltip 
                                                cursor={{ fill: 'var(--bg-subtle)' }}
                                                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                                                formatter={(value: number | string | undefined) => [Number(value).toFixed(4), 'SHAP Impact']}
                                                labelStyle={{ color: 'var(--text-3)', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                                                itemStyle={{ color: 'var(--text-1)', fontWeight: 600 }}
                                            />
                                            <ReferenceLine x={0} stroke="var(--border-strong)" />
                                            <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={28} animationDuration={1000}>
                                                {featureData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={entry.impact > 0 ? "var(--profit)" : "var(--loss)"} 
                                                        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' }}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-3)', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ width: 10, height: 10, background: 'var(--profit)', borderRadius: '2px', opacity: 0.9, boxShadow: '0 0 8px var(--profit-dim)' }} /> 
                                        <span style={{ color: 'var(--text-2)' }}>Pushes toward CALL (Bullish)</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ width: 10, height: 10, background: 'var(--loss)', borderRadius: '2px', opacity: 0.9, boxShadow: '0 0 8px var(--loss-dim)' }} /> 
                                        <span style={{ color: 'var(--text-2)' }}>Pushes toward PUT (Bearish)</span>
                                    </div>
                                </div>
                                <div style={{ fontStyle: 'italic' }}>
                                    Values represent model attribution scores (simulated)
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

