import React, { useMemo, useState } from 'react';
import { 
    Layout, Plus, Trash2, Copy,
    Activity, Target, Globe, Binary, 
    TrendingUp, Zap, ShieldCheck, Terminal, Sliders,
    Settings2, Wind, PieChart as PieIcon
} from 'lucide-react';
import { 
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    ResponsiveContainer, Tooltip, CartesianGrid, XAxis
} from 'recharts';
import { useTrading } from '../hooks/useTrading';
import { useWorkspace, WidgetType, WidgetConfig } from '../hooks/useWorkspace';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const fmtShort = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (abs >= 1000)   return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toFixed(0)}`;
};

const TooltipStyle = {
    contentStyle: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '10px', fontSize: '12px', padding: '8px 12px'
    },
    itemStyle: { color: 'var(--text-1)', fontWeight: 600 },
    labelStyle: { color: 'var(--text-3)', fontSize: '11px' }
};

// --- Base Wrapper ---

const WidgetWrapper = ({ 
    title, 
    icon: Icon, 
    onRemove, 
    children, 
    colSpan, 
    rowSpan,
    noScroll = false
}: { 
    title: string; 
    icon: any; 
    onRemove: () => void; 
    children: React.ReactNode; 
    colSpan: number;
    rowSpan: number;
    noScroll?: boolean;
}) => (
    <div className="card fade-in" style={{ 
        gridColumn: `span ${colSpan}`, 
        gridRow: `span ${rowSpan}`,
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
    }}>
        <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid var(--border)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={14} color="var(--accent-light)" />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)' }}>{title}</span>
            </div>
            <button 
                onClick={onRemove}
                style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: '4px' }}
                className="icon-btn-hover"
                title="Remove widget"
            >
                <Trash2 size={12} />
            </button>
        </div>
        <div style={{ 
            flex: 1, 
            padding: '16px', 
            overflow: noScroll ? 'hidden' : 'auto',
            position: 'relative'
        }}>
            {children}
        </div>
    </div>
);

// --- Dedicated Widget Components (to avoid hook violations) ---

const DailyPnLWidget = ({ pnl, tradesCount, onRemove, colSpan, rowSpan }: any) => (
    <WidgetWrapper title="Daily P&L" icon={Activity} onRemove={onRemove} colSpan={colSpan} rowSpan={rowSpan}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: pnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>{fmtShort(pnl)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{tradesCount} trades today</div>
        </div>
    </WidgetWrapper>
);

const EquityGrowthWidget = ({ data, onRemove, colSpan, rowSpan }: any) => (
    <WidgetWrapper title="Equity Growth" icon={TrendingUp} onRemove={onRemove} colSpan={colSpan} rowSpan={rowSpan} noScroll>
        <div style={{ height: '100%', minHeight: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="g_eq" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <Tooltip {...TooltipStyle} />
                    <Area type="monotone" dataKey="pnl" stroke="var(--accent-light)" fill="url(#g_eq)" strokeWidth={2} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </WidgetWrapper>
);

const DailyPnLChartWidget = ({ data, onRemove, colSpan, rowSpan }: any) => (
    <WidgetWrapper title="P&L Performance" icon={TrendingUp} onRemove={onRemove} colSpan={colSpan} rowSpan={rowSpan} noScroll>
        <div style={{ height: '100%', minHeight: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="timestamp" hide />
                    <Tooltip {...TooltipStyle} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={(entry.pnl || 0) >= 0 ? 'var(--profit)' : 'var(--loss)'} opacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </WidgetWrapper>
);

const ExitProfileWidget = ({ tradeSummary, onRemove, colSpan, rowSpan }: any) => {
    const exitStats = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!tradeSummary || !Array.isArray(tradeSummary)) return [];
        tradeSummary.forEach(t => {
            const reason = t.exitType || 'Market Target';
            counts[reason] = (counts[reason] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tradeSummary]);

    return (
        <WidgetWrapper title="Exit Profile" icon={PieIcon} onRemove={onRemove} colSpan={colSpan} rowSpan={rowSpan} noScroll>
            <div style={{ height: '100%', minHeight: '140px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={exitStats} innerRadius="50%" outerRadius="80%" dataKey="value" stroke="none" cx="50%" cy="50%">
                            {exitStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...TooltipStyle} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </WidgetWrapper>
    );
};

// --- Page Component ---

export default function WorkspacePage() {
    const { signals, stats, marketData, tradeSummary, activeTrades, engineHealth } = useTrading();
    const { 
        layouts, activeLayout, activeId, setActiveId, 
        duplicateLayout, deleteLayout, updateLayout, 
        addWidget, removeWidget 
    } = useWorkspace();
    const [isEditMode, setIsEditMode] = useState(false);
    const [showWidgetPicker, setShowWidgetPicker] = useState(false);

    const latest = signals[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrades = useMemo(() => tradeSummary.filter(h => h.timestamp && typeof h.timestamp === 'string' && h.timestamp.startsWith(todayStr)), [tradeSummary, todayStr]);
    const todayPnL = todayTrades.reduce((s, t) => s + Number(t.pnl || 0), 0);
    const chartData = useMemo(() => {
        if (!tradeSummary || !Array.isArray(tradeSummary)) return [];
        return tradeSummary.slice().reverse().slice(-30);
    }, [tradeSummary]);

    const renderWidget = (widget: WidgetConfig) => {
        const onRemove = () => removeWidget(activeLayout.id, widget.id);

        switch (widget.type) {
            case 'kpi_pnl':
                return <DailyPnLWidget pnl={todayPnL} tradesCount={todayTrades.length} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan} />;
            case 'kpi_winrate':
                return (
                    <WidgetWrapper title="Win Rate" icon={Target} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)' }}>{stats?.winRate ?? 0}%</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>PF: {stats?.profitFactor?.toFixed(2) ?? '0.00'}</div>
                        </div>
                    </WidgetWrapper>
                );
            case 'kpi_trades':
                return (
                    <WidgetWrapper title="Total Trades" icon={Activity} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)' }}>{stats?.totalTrades ?? 0}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Completed lifecycle</div>
                        </div>
                    </WidgetWrapper>
                );
            case 'kpi_nifty':
                return (
                    <WidgetWrapper title="Nifty 50" icon={Globe} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                                {marketData?.niftyLTP?.toLocaleString('en-IN') ?? '—'}
                            </div>
                            <div style={{ fontSize: '11px', color: marketData?.marketOpen ? 'var(--profit)' : 'var(--text-4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className={`dot ${marketData?.marketOpen ? 'dot-green' : 'dot-gray'}`} style={{ width: 6, height: 6 }} />
                                {marketData?.marketOpen ? 'Active' : 'Offline'}
                            </div>
                        </div>
                    </WidgetWrapper>
                );
            case 'vix_gauge':
                return (
                    <WidgetWrapper title="VIX Gauge" icon={Wind} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                             <div style={{ fontSize: '24px', fontWeight: 700, color: (latest?.vix || 0) > 18 ? 'var(--loss)' : 'var(--profit)' }}>{latest?.vix?.toFixed(2) || '—'}</div>
                             <div style={{ fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', fontWeight: 700 }}>
                                 {(latest?.vix || 0) > 20 ? 'High Volatility' : (latest?.vix || 0) > 15 ? 'Moderate Vol' : 'Low Vol'}
                             </div>
                             <div style={{ width: '100%', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                                 <div style={{ 
                                     width: `${Math.min((latest?.vix || 0) * 2.5, 100)}%`, 
                                     height: '100%', 
                                     background: (latest?.vix || 0) > 20 ? 'var(--loss)' : (latest?.vix || 0) > 15 ? 'var(--accent)' : 'var(--profit)',
                                     transition: 'width 0.5s ease'
                                 }} />
                             </div>
                        </div>
                    </WidgetWrapper>
                );
            case 'regime_indicator':
                return (
                    <WidgetWrapper title="Market Regime" icon={Globe} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ 
                                padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Trend</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>{(latest?.adx || 0) > 25 ? 'TRENDING' : 'RANGING'}</span>
                            </div>
                            <div style={{ 
                                padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Context</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>{(latest?.putCallRatio || 0) > 1.1 ? 'BEARISH' : (latest?.putCallRatio || 0) < 0.9 ? 'BULLISH' : 'NEUTRAL'}</span>
                            </div>
                        </div>
                    </WidgetWrapper>
                );
            case 'confidence_meter':
                return (
                    <WidgetWrapper title="Alpha Confidence" icon={Target} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--accent)" strokeWidth="6" strokeDasharray={`${(latest?.confidence || 0) * 2.14} 214`} />
                                </svg>
                                <div style={{ position: 'absolute', fontSize: '16px', fontWeight: 800 }}>{latest?.confidence?.toFixed(0) || 0}%</div>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-4)', fontWeight: 600 }}>MODEL CERTAINTY</span>
                        </div>
                    </WidgetWrapper>
                );
            case 'signal_card':
                return (
                    <WidgetWrapper title="Market Logic" icon={Zap} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan} noScroll>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', height: '100%', justifyContent: 'center' }}>
                           <div style={{ 
                               fontSize: '20px', 
                               fontWeight: 800, 
                               color: latest?.finalSignal?.includes('CE') ? 'var(--profit)' : latest?.finalSignal?.includes('PE') ? 'var(--loss)' : 'var(--text-3)',
                               textAlign: 'center'
                           }}>
                               {latest?.finalSignal || 'AWAITING'}
                           </div>
                           <div style={{ width: '100%' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-4)', marginBottom: '4px' }}>
                                   <span>CONFIDENCE</span>
                                   <span>{latest?.confidence?.toFixed(1) || 0}%</span>
                               </div>
                               <div className="progress-bar">
                                   <div className="progress-fill" style={{ width: `${Math.abs(latest?.confidence || 0)}%`, background: 'var(--accent-grad)' }} />
                               </div>
                           </div>
                        </div>
                    </WidgetWrapper>
                );
            case 'recent_signals':
                return (
                    <WidgetWrapper title="Signal Feed" icon={Zap} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {signals.slice(1, 6).map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <span style={{ fontWeight: 600, color: s.finalSignal?.includes('CE') ? 'var(--profit)' : s.finalSignal?.includes('PE') ? 'var(--loss)' : 'var(--text-3)' }}>{s.finalSignal}</span>
                                    <span style={{ color: 'var(--text-4)' }}>{(s.timestamp && typeof s.timestamp === 'string') ? new Date(s.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                </div>
                            ))}
                        </div>
                    </WidgetWrapper>
                );
            case 'daily_pnl_chart':
                return <DailyPnLChartWidget data={chartData} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan} />;
            case 'exit_breakdown':
                return <ExitProfileWidget tradeSummary={tradeSummary} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan} />;
            case 'telemetry_matrix':
                return (
                    <WidgetWrapper title="Data Matrix" icon={Sliders} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {[
                                { l: 'PA', v: latest?.priceActionScore || 0 },
                                { l: 'RSI', v: latest?.rsi?.toFixed(1) || 0 },
                                { l: 'ADX', v: latest?.adx?.toFixed(1) || 0 },
                                { l: 'VIX', v: latest?.vix?.toFixed(1) || 0 },
                                { l: 'PCR', v: latest?.putCallRatio?.toFixed(2) || 0 },
                                { l: 'GEX', v: (latest?.gammaExposure || 0).toFixed(2) }
                            ].map(m => (
                                <div key={m.l} style={{ padding: '8px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '9px', color: 'var(--text-4)', fontWeight: 700 }}>{m.l}</div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>{m.v}</div>
                                </div>
                            ))}
                        </div>
                    </WidgetWrapper>
                );
            case 'ai_insights':
                return (
                    <WidgetWrapper title="AI Intelligence" icon={Binary} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                         <div style={{ fontSize: '12px', color: 'var(--text-2)', fontStyle: 'italic', lineHeight: '1.5' }}>
                             {latest?.aiInsights || 'Scanning market harmonics... Waiting for high-probability convergence.'}
                         </div>
                    </WidgetWrapper>
                );
            case 'active_positions':
                return (
                    <WidgetWrapper title="Active Positions" icon={ShieldCheck} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        {activeTrades.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-4)', padding: '20px', fontSize: '12px' }}>No active exposures</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activeTrades.map(t => (
                                    <div key={t.entryOrderId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600 }}>{t.tradingSymbol}</div>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: (t.pnl || 0) >= 0 ? 'var(--profit)' : 'var(--loss)' }}>{fmtShort(t.pnl || 0)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </WidgetWrapper>
                );
             case 'engine_status':
                return (
                    <WidgetWrapper title="System Health" icon={Terminal} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className={`dot ${engineHealth?.status === 'operational' ? 'dot-green' : 'dot-red'} dot-pulse`} />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>{engineHealth?.status?.toUpperCase() || 'OFFLINE'}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                <div style={{ fontSize: '10px', background: 'var(--bg-elevated)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-4)' }}>STATUS</div>
                                    <div style={{ fontWeight: 600 }}>LIVE</div>
                                </div>
                                <div style={{ fontSize: '10px', background: 'var(--bg-elevated)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-4)' }}>UPTIME</div>
                                    <div style={{ fontWeight: 600 }}>99.9%</div>
                                </div>
                            </div>
                         </div>
                    </WidgetWrapper>
                );
            case 'equity_chart':
                return <EquityGrowthWidget data={chartData} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan} />;
            default:
                const typeName = (widget.type as string).replace('_',' ');
                return (
                    <WidgetWrapper title={typeName} icon={Plus} onRemove={onRemove} colSpan={widget.colSpan} rowSpan={widget.rowSpan}>
                        <div style={{ color: 'var(--text-4)', fontSize: '11px' }}>Widget [{widget.type}] under construction.</div>
                    </WidgetWrapper>
                );
        }
    };

    const WIDGET_OPTIONS: { type: WidgetType; label: string; icon: any }[] = [
        { type: 'kpi_pnl', label: 'Daily P&L', icon: Activity },
        { type: 'kpi_winrate', label: 'Win Rate', icon: Target },
        { type: 'kpi_trades', label: 'Total Trades', icon: Activity },
        { type: 'kpi_nifty', label: 'Nifty Index', icon: Globe },
        { type: 'signal_card', label: 'Market Logic', icon: Zap },
        { type: 'recent_signals', label: 'Signal Feed', icon: Zap },
        { type: 'equity_chart', label: 'Equity Chart', icon: TrendingUp },
        { type: 'daily_pnl_chart', label: 'P&L Chart', icon: TrendingUp },
        { type: 'telemetry_matrix', label: 'Telemetry Matrix', icon: Sliders },
        { type: 'ai_insights', label: 'AI Insights', icon: Binary },
        { type: 'confidence_meter', label: 'Alpha Meter', icon: Target },
        { type: 'active_positions', label: 'Active Positions', icon: ShieldCheck },
        { type: 'engine_status', label: 'Engine Health', icon: Terminal },
        { type: 'vix_gauge', label: 'VIX Gauge', icon: Wind },
        { type: 'regime_indicator', label: 'Market Regime', icon: Globe },
        { type: 'exit_breakdown', label: 'Exit Profile', icon: PieIcon },
    ];

    return (
        <div className="page-scroll">
            <div className="page-body enter">
                
                {/* Header Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <Layout size={20} color="var(--accent-light)" />
                         <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Multi-Panel Workspace</h2>
                         <div className="ticker-pill" style={{ marginLeft: '8px' }}>
                            {layouts.map(l => (
                                <button 
                                    key={l.id}
                                    onClick={() => setActiveId(l.id)}
                                    style={{ 
                                        padding: '6px 12px', 
                                        background: activeId === l.id ? 'var(--accent-dim)' : 'transparent',
                                        border: 'none',
                                        color: activeId === l.id ? 'var(--accent-light)' : 'var(--text-3)',
                                        fontSize: '11px',
                                        fontWeight: activeId === l.id ? 700 : 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {l.icon} {l.name}
                                </button>
                            ))}
                         </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowWidgetPicker(!showWidgetPicker)} className="icon-btn" style={{ padding: '0 12px', width: 'auto', gap: '6px', fontSize: '12px' }}>
                            <Plus size={14} /> Add Widget
                        </button>
                        <button onClick={() => duplicateLayout(activeId)} className="icon-btn" title="Duplicate Workspace">
                            <Copy size={14} />
                        </button>
                        <button onClick={() => setIsEditMode(!isEditMode)} className="icon-btn" style={{ color: isEditMode ? 'var(--accent-light)' : 'inherit' }} title="Layout Settings">
                            <Settings2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Widget Picker Overlay */}
                {showWidgetPicker && (
                    <div className="card fade-in" style={{ padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', zIndex: 100 }}>
                        {WIDGET_OPTIONS.map(opt => (
                            <button 
                                key={opt.type}
                                onClick={() => { addWidget(activeId, opt.type); setShowWidgetPicker(false); }}
                                style={{ 
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                                    padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', 
                                    borderRadius: '10px', color: 'var(--text-2)', cursor: 'pointer'
                                }}
                                className="icon-btn-hover"
                            >
                                <opt.icon size={18} />
                                <span style={{ fontSize: '10px', fontWeight: 600 }}>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Edit Mode Controls */}
                {isEditMode && (
                    <div className="card-sm slide-up" style={{ padding: '12px 20px', background: 'rgba(99,102,241,0.05)', borderColor: 'var(--accent-dim)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                         <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-light)' }}>WORKSPACE SETTINGS</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Columns:</span>
                             {[2, 3, 4, 5].map(c => (
                                 <button 
                                    key={c}
                                    onClick={() => updateLayout(activeId, { columns: c })}
                                    style={{ 
                                        width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)',
                                        background: activeLayout.columns === c ? 'var(--accent)' : 'transparent',
                                        color: activeLayout.columns === c ? '#fff' : 'var(--text-3)',
                                        fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                                    }}
                                 >
                                    {c}
                                 </button>
                             ))}
                         </div>
                         <div style={{ flex: 1 }} />
                         <button onClick={() => deleteLayout(activeId)} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--loss)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <Trash2 size={13} /> Delete Workspace
                         </button>
                    </div>
                )}

                {/* Main Dynamic Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${activeLayout.columns}, 1fr)`, 
                    gap: '20px',
                    minHeight: '600px'
                }}>
                    {activeLayout.widgets.length === 0 ? (
                         <div style={{ 
                             gridColumn: `span ${activeLayout.columns}`, 
                             display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                             padding: '100px', background: 'var(--bg-glass)', borderRadius: '24px', border: '2px dashed var(--border)'
                         }}>
                             <Layout size={48} color="var(--text-4)" style={{ marginBottom: '20px', opacity: 0.2 }} />
                             <h3 style={{ fontSize: '18px', color: 'var(--text-3)', marginBottom: '8px' }}>Empty Workspace</h3>
                             <p style={{ color: 'var(--text-4)', fontSize: '13px', marginBottom: '24px' }}>Add widgets to build your custom mission control.</p>
                             <button 
                                 onClick={() => setShowWidgetPicker(true)} 
                                 style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 16px var(--accent-glow)' }}
                             >
                                 Get Started
                             </button>
                         </div>
                    ) : (
                        activeLayout.widgets.map(renderWidget)
                    )}
                </div>

            </div>
        </div>
    );
}
