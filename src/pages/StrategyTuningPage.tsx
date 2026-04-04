/**
 * LIVE STRATEGY TUNING PAGE
 * 
 * Allows real-time optimization of trading parameters.
 * Provides interactive sliders for signal sensitivity, risk filters, and execution targets.
 */

import React, { useState } from 'react';
import {
    Sliders, Zap, Shield, Target, Activity,
    Save, RotateCcw, Info, CheckCircle2
} from 'lucide-react';
import { useSettings, type Config } from '../hooks/useSettings';

const TuningCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '18px 22px', borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(to right, var(--bg-surface), transparent)'
        }}>
            <span style={{ color: 'var(--accent-light)' }}>{icon}</span>
            <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-1)' }}>{title}</span>
        </div>
        <div style={{ padding: '24px' }}>
            {children}
        </div>
    </div>
);

const TuningSlider = ({
    label, value, min, max, step, unit = '',
    onChange, color = 'var(--accent)'
}: {
    label: string; value: number; min: number; max: number; step: number;
    unit?: string; onChange: (v: number) => void; color?: string;
}) => (
    <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>{label}</label>
            <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700,
                color: 'white', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)', padding: '2px 10px',
                borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)'
            }}>
                {value}{unit}
            </span>
        </div>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: color }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-4)' }}>{min}{unit}</span>
            <span style={{ fontSize: '9px', color: 'var(--text-4)' }}>{max}{unit}</span>
        </div>
    </div>
);

export default function StrategyTuningPage() {
    const { settings: config, saveSettings } = useSettings();
    const [local, setLocal] = useState<Config>(config);
    const [saved, setSaved] = useState(false);

    const upd = (key: keyof Config, val: any) => setLocal(p => ({ ...p, [key]: val }));

    const handleSave = () => {
        saveSettings(local);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const rrRatio = (local.targetPoints / local.stopLossPoints).toFixed(2);

    return (
        <div className="page-scroll">
            <div className="page-body enter">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Model Optimization</div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Live Strategy Tuning</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setLocal(config)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', borderRadius: 'var(--r-md)',
                                border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)',
                                color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 24px', borderRadius: 'var(--r-md)',
                                border: 'none', background: 'var(--accent-grad)',
                                color: 'white', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            <Save size={14} /> Deploy Changes
                        </button>
                    </div>
                </div>

                {/* Main Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>

                    {/* Left Column: Sliders */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <TuningCard icon={<Zap size={16} />} title="Signal Sensitivty">
                            <TuningSlider
                                label="Confidence Threshold"
                                value={local.confidenceThreshold}
                                min={50} max={95} step={5} unit="%"
                                onChange={v => upd('confidenceThreshold', v)}
                                color="var(--accent-light)"
                            />
                            <TuningSlider
                                label="Trend Confirmation (ADX)"
                                value={local.adxThreshold}
                                min={10} max={40} step={1}
                                onChange={v => upd('adxThreshold', v)}
                                color="var(--accent-light)"
                            />
                            <div style={{
                                padding: '14px', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)',
                                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', gap: '12px', alignItems: 'flex-start'
                            }}>
                                <Info size={14} color="var(--accent-light)" style={{ marginTop: 2, flexShrink: 0 }} />
                                <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                                    Higher confidence reduces signal frequency but increases quality. ADX filters for strong trends.
                                </p>
                            </div>
                        </TuningCard>

                        <TuningCard icon={<Shield size={16} />} title="Market Safety">
                            <TuningSlider
                                label="Volatility Filter (India VIX)"
                                value={local.vixThreshold}
                                min={12} max={25} step={0.5}
                                onChange={v => upd('vixThreshold', v)}
                                color="var(--warn)"
                            />
                            <TuningSlider
                                label="Max Daily Loss"
                                value={local.maxDailyLoss}
                                min={1000} max={20000} step={500} unit="₹"
                                onChange={v => upd('maxDailyLoss', v)}
                                color="var(--loss)"
                            />
                        </TuningCard>

                    </div>

                    {/* Right Column: Execution & Logic */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <TuningCard icon={<Target size={16} />} title="Execution Targets">
                            <TuningSlider
                                label="Stop Loss Points"
                                value={local.stopLossPoints}
                                min={5} max={30} step={1}
                                onChange={v => upd('stopLossPoints', v)}
                                color="var(--loss)"
                            />
                            <TuningSlider
                                label="Take Profit Points"
                                value={local.targetPoints}
                                min={10} max={60} step={1}
                                onChange={v => upd('targetPoints', v)}
                                color="var(--profit)"
                            />

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '16px', background: 'var(--bg-surface)',
                                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '2px' }}>Derived R:R Ratio</div>
                                    <div style={{ fontSize: '18px', fontWeight: 800, color: Number(rrRatio) >= 2 ? 'var(--profit)' : 'var(--text-1)' }}>
                                        1 : {rrRatio}
                                    </div>
                                </div>
                                <Activity size={24} color={Number(rrRatio) >= 2 ? 'var(--profit)' : 'var(--text-4)'} />
                            </div>
                        </TuningCard>

                        <TuningCard icon={<Activity size={16} />} title="Model Behavior">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Streak Confirmation</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Bars needed for direction</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1, 2, 3].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => upd('minStreak', s)}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    background: local.minStreak === s ? 'var(--accent-grad)' : 'var(--bg-elevated)',
                                                    color: local.minStreak === s ? 'white' : 'var(--text-2)',
                                                    fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Repeat Protection</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Avoid duplicate trades</div>
                                    </div>
                                    <button
                                        onClick={() => upd('repeatProtection', !local.repeatProtection)}
                                        style={{
                                            padding: '6px 14px', borderRadius: '20px',
                                            border: 'none',
                                            background: local.repeatProtection ? 'var(--profit-dim)' : 'var(--bg-elevated)',
                                            color: local.repeatProtection ? 'var(--profit)' : 'var(--text-3)',
                                            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        {local.repeatProtection ? <CheckCircle2 size={12} /> : null}
                                        {local.repeatProtection ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>
                            </div>
                        </TuningCard>

                    </div>
                </div>

                {/* Deployment Toast */}
                {saved && (
                    <div style={{
                        position: 'fixed', bottom: 32, right: 32, zIndex: 1000,
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '16px 24px', borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)', border: '1px solid var(--profit)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--profit-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={18} color="var(--profit)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Model Parameters Deployed</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Backend engines synced successfully.</div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
