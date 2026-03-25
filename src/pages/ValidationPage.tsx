import { useMemo, useState, Fragment } from 'react';
import {
    ShieldCheck, Globe, Activity,
    FileText, ChevronDown, ChevronRight,
    Download, Cpu, TrendingUp, TrendingDown,
    Calendar
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, Tooltip,
    ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { useTrading } from '../hooks/useTrading';

const TooltipStyle = {
    contentStyle: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '10px', fontSize: '12px', padding: '8px 12px'
    },
    itemStyle: { color: 'var(--text-1)', fontWeight: 600 },
    labelStyle: { color: 'var(--text-3)', fontSize: '11px' }
};

export default function ValidationPage() {
    const { signals, marketData } = useTrading();
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [filter, setFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showDatePanel, setShowDatePanel] = useState(false);

    /**
     * CORE AUDIT ENGINE: analyzed
     * 
     * This effect processes raw signals into audited performance rows.
     * To ensure audit integrity, it implements "Atomic Price Locking":
     * 
     * 1. PENDING (< 10m): Signal is too fresh. We don't evaluate yet as price
     *    hasn't had time to move significantly.
     * 
     * 2. LIVE (10m - 30m): The "Evaluation Window". We compare the entry signal
     *    against the CURRENT LIVE Nifty price. The result will fluctuate.
     * 
     * 3. LOCKED (> 30m): The "Permanent Anchor". We search for a later signal 
     *    timestamp (ideally +15m after entry) and use THAT historical spot price 
     *    as the comparison. Once this price is found, the result is LOCKED 
     *    permanently and will never change again, even if Nifty moves 1000 points.
     */
    const analyzed = useMemo(() => {
        const liveNifty = marketData?.niftyLTP ?? 0;
        const nowMs = Date.now();

        // Sort chronologically (oldest first) for easier temporal searching
        const chronological = [...signals].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        return signals.map(s => {
            const entry = s.spotPrice ?? 0;
            const signalTimeMs = new Date(s.timestamp).getTime();
            const ageMinutes = (nowMs - signalTimeMs) / 60000;

            let comparePrice = 0;
            let priceSource: 'PENDING' | 'LIVE' | 'LOCKED' = 'PENDING';

            if (ageMinutes < 10) {
                // PHASE 1: Awaiting price development
                comparePrice = 0;
                priceSource = 'PENDING';
            } else if (ageMinutes < 30) {
                // PHASE 2: Live tracking against current market
                comparePrice = liveNifty;
                priceSource = 'LIVE';
            } else {
                // PHASE 3: Absolute locking via historical audit
                const targetWindowStart = signalTimeMs + 10 * 60000;
                const targetWindowEnd = signalTimeMs + 45 * 60000;

                let bestMatch: typeof signals[0] | null = null;
                let bestTimeDiff = Infinity;
                let firstValidFallback: typeof signals[0] | null = null;

                for (const later of chronological) {
                    const laterMs = new Date(later.timestamp).getTime();
                    if (laterMs <= signalTimeMs) continue;
                    if (laterMs < targetWindowStart) continue;
                    
                    if (!firstValidFallback && later.spotPrice > 0) {
                        firstValidFallback = later;
                    }

                    if (laterMs > targetWindowEnd) break;

                    const idealTarget = signalTimeMs + 15 * 60000;
                    const diff = Math.abs(laterMs - idealTarget);
                    if (diff < bestTimeDiff && later.spotPrice > 0) {
                        bestTimeDiff = diff;
                        bestMatch = later;
                    }
                }

                if (bestMatch && bestMatch.spotPrice > 0) {
                    comparePrice = bestMatch.spotPrice;
                    priceSource = 'LOCKED';
                } else if (firstValidFallback && firstValidFallback.spotPrice > 0) {
                    comparePrice = firstValidFallback.spotPrice;
                    priceSource = 'LOCKED';
                } else {
                    // Fallback to live if no future signal data is available yet
                    comparePrice = liveNifty;
                    priceSource = liveNifty > 0 ? 'LIVE' : 'PENDING';
                }
            }

            const diff = comparePrice > 0 ? comparePrice - entry : 0;
            const pct = entry && comparePrice ? (diff / entry) * 100 : 0;

            let status = 'PENDING';
            if (priceSource !== 'PENDING' && comparePrice > 0 && entry > 0) {
                if (s.finalSignal.includes('CE')) {
                    status = diff > 0 ? 'CORRECT' : diff < 0 ? 'INCORRECT' : 'PENDING';
                } else if (s.finalSignal.includes('PE')) {
                    status = diff < 0 ? 'CORRECT' : diff > 0 ? 'INCORRECT' : 'PENDING';
                }
            }

            const qScore = (s.confidence > 25 ? 3 : 1) + ((s.adx ?? 0) > 25 ? 3 : 1) + (Math.abs(s.momentum ?? 0) > 10 ? 4 : 2);
            return { ...s, comparePrice, priceSource, status, diff, pct, qScore };
        });
    }, [signals, marketData]);

    const filtered = useMemo(() => analyzed.filter(s => {
        const f = filter === 'ALL' ? true
            : filter === 'CE' ? s.finalSignal.includes('CE')
            : filter === 'PE' ? s.finalSignal.includes('PE')
            : s.finalSignal === 'WAIT' || s.finalSignal === 'AVOID' || s.finalSignal === 'SIDEWAYS';
        const q = search.toLowerCase();
        const m = !q || s.finalSignal.toLowerCase().includes(q) || (s.regime || '').toLowerCase().includes(q);
        
        // Date filtering
        const sigTime = new Date(s.timestamp);
        const dStart = dateRange.start ? new Date(dateRange.start) : null;
        const dEnd = dateRange.end ? new Date(dateRange.end) : null;
        if (dEnd) dEnd.setHours(23, 59, 59, 999); // Inclusion of full end day

        const inDate = (!dStart || sigTime >= dStart) && (!dEnd || sigTime <= dEnd);

        return f && m && inDate;
    }), [analyzed, filter, search, dateRange]);

    const counts = useMemo(() => ({
        all: analyzed.length,
        ce: analyzed.filter(s => s.finalSignal.includes('CE')).length,
        pe: analyzed.filter(s => s.finalSignal.includes('PE')).length,
    }), [analyzed]);

    const regimeStats = useMemo(() => {
        const map: Record<string, { regime: string; total: number; correct: number }> = {};
        filtered.forEach(s => {
            const r = s.regime || 'NORMAL';
            if (!map[r]) map[r] = { regime: r, total: 0, correct: 0 };
            map[r].total++;
            if (s.status === 'CORRECT') map[r].correct++;
        });
        return Object.values(map).map(r => ({
            ...r,
            winRate: Math.round((r.correct / (r.total || 1)) * 100)
        })).sort((a, b) => b.winRate - a.winRate);
    }, [filtered]);

    const hourly = useMemo(() => {
        const h: Record<number, { hour: string; total: number; correct: number }> = {};
        filtered.forEach(s => {
            const hr = new Date(s.timestamp).getHours();
            if (!h[hr]) h[hr] = { hour: `${hr}:00`, total: 0, correct: 0 };
            h[hr].total++;
            if (s.status === 'CORRECT') h[hr].correct++;
        });
        return Object.values(h).map(x => ({
            ...x,
            winRate: Math.round((x.correct / (x.total || 1)) * 100)
        })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    }, [filtered]);

    const correct = filtered.filter(a => a.status === 'CORRECT').length;
    const tradeable = filtered.filter(a => a.status !== 'PENDING').length;
    const accuracy = tradeable > 0 ? (correct / tradeable) * 100 : 0;

    const handleExport = () => {
        const csv = [
            'Timestamp,Signal,Entry Price,Compare Price,Price Source,Move %,Status,RSI,Confidence,ADX',
            ...filtered.map(a => `${a.timestamp},${a.finalSignal},${a.spotPrice},${a.comparePrice},${a.priceSource},${a.pct.toFixed(2)},${a.status},${(a as any).rsi?.toFixed(1)},${a.confidence},${a.adx?.toFixed(1)}`)
        ].join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        Object.assign(document.createElement('a'), { href: url, download: `zenith_audit_${new Date().toISOString().split('T')[0]}.csv` }).click();
    };

    return (
        <div className="page-scroll">
        <div className="page-body enter">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Strategy Verification</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Signal Audit</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleExport}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '7px 16px', borderRadius: 'var(--r-md)',
                            border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                            color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 600,
                            cursor: 'pointer', transition: 'var(--trans-s)'
                        }}
                    >
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Group */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                    { key: 'ALL', label: `All — ${counts.all}`, color: 'var(--text-1)' },
                    { key: 'CE',  label: `Buy (CE) — ${counts.ce}`, color: 'var(--profit)' },
                    { key: 'PE',  label: `Sell (PE) — ${counts.pe}`, color: 'var(--loss)' },
                    { key: 'WAIT',label: `Wait — ${counts.all - counts.ce - counts.pe}`, color: 'var(--text-3)' },
                ].map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '99px',
                            border: `1px solid ${filter === key ? 'var(--border-strong)' : 'var(--border)'}`,
                            background: filter === key ? 'var(--bg-elevated)' : 'transparent',
                            color: filter === key ? color : 'var(--text-3)',
                            fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', transition: 'var(--trans-s)'
                        }}
                    >
                        {label}
                    </button>
                ))}

                {/* Date Filter Toggle */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowDatePanel(!showDatePanel)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '0 16px', height: '34px',
                            borderRadius: '99px', border: `1px solid ${dateRange.start || dateRange.end ? 'var(--accent-light)' : 'var(--border)'}`,
                            background: dateRange.start || dateRange.end ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                            color: dateRange.start || dateRange.end ? 'var(--accent-light)' : 'var(--text-3)',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'var(--trans-s)'
                        }}
                    >
                        <Calendar size={13} />
                        {dateRange.start ? `${new Date(dateRange.start).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})} — ${dateRange.end ? new Date(dateRange.end).toLocaleDateString('en-IN', {day:'2-digit', month:'short'}) : '...'}` : 'Filter Dates'}
                    </button>

                    {showDatePanel && (
                        <div className="card slide-up" style={{
                            position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 100,
                            padding: '16px', minWidth: '240px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            background: 'var(--bg-surface)', border: '1px solid var(--border-strong)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Start Date</label>
                                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})}
                                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '6px', color: 'var(--text-1)', fontSize: '12px' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>End Date</label>
                                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})}
                                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '6px', color: 'var(--text-1)', fontSize: '12px' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <button onClick={() => setDateRange({start: '', end: ''})} style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Reset</button>
                                    <button onClick={() => setShowDatePanel(false)} style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 700, color: 'white', background: 'var(--accent)', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Apply</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '0 12px', height: '34px',
                    border: '1px solid var(--border)', borderRadius: '99px',
                    background: 'var(--bg-elevated)', marginLeft: 'auto'
                }}>
                    <Activity size={13} color="var(--text-3)" />
                    <input
                        className="input-field"
                        style={{
                            border: 'none', background: 'transparent', width: '160px',
                            height: '100%', padding: '0', fontSize: '12.5px'
                        }}
                        placeholder="Search audit log..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                <div className="kpi-card">
                    <div className="kpi-label"><ShieldCheck size={13} color="var(--accent-light)" /> Accuracy</div>
                    <div className="kpi-value" style={{ color: accuracy > 60 ? 'var(--profit)' : 'var(--accent-light)' }}>
                        {accuracy.toFixed(1)}%
                    </div>
                    <div className="kpi-sub">{correct} of {tradeable} correct</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><Globe size={13} color="var(--accent-light)" /> Live Nifty</div>
                    <div className="kpi-value font-mono" style={{ fontSize: '22px' }}>
                        {marketData?.niftyLTP?.toLocaleString('en-IN') ?? '—'}
                    </div>
                    <div className="kpi-sub">Reference price</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><Activity size={13} color="var(--accent-light)" /> VIX</div>
                    <div className="kpi-value" style={{ color: (marketData?.vix ?? 0) > 18 ? 'var(--loss)' : 'var(--profit)' }}>
                        {marketData?.vix?.toFixed(2) ?? '—'}
                    </div>
                    <div className="kpi-sub">Risk: {(marketData?.vix ?? 0) > 18 ? 'Elevated' : 'Normal'}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label"><Cpu size={13} color="var(--accent-light)" /> Sample Size</div>
                    <div className="kpi-value font-mono">{filtered.length}</div>
                    <div className="kpi-sub">{filtered.filter(a => a.priceSource === 'LOCKED').length} locked · {filtered.filter(a => a.priceSource === 'PENDING').length} pending</div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={15} color="var(--accent-light)" />
                        <span className="section-title">Signal Performance Log</span>
                    </div>
                    <span className="section-meta">Showing {filtered.length} of {analyzed.length} entries</span>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
                            <tr>
                                <th style={{ width: 40, borderBottom: '1px solid var(--border)' }} />
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Time</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Direction</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Entry Price</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Compare Price</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Move</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Result</th>
                                <th style={{ borderBottom: '1px solid var(--border)' }}>Quality</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((a, i) => (
                                <Fragment key={i}>
                                    <tr onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                                        style={{ cursor: 'pointer' }}>
                                        <td style={{ textAlign: 'center', paddingLeft: '12px' }}>
                                            {expandedRow === i
                                                ? <ChevronDown size={13} color="var(--accent-light)" />
                                                : <ChevronRight size={13} color="var(--text-3)" />
                                            }
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '12.5px' }}>
                                                {new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: '1px' }}>
                                                {new Date(a.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${a.finalSignal.includes('CE') ? 'badge-buy' : a.finalSignal.includes('PE') ? 'badge-sell' : 'badge-wait'}`}>
                                                {a.finalSignal.includes('CE') ? <TrendingUp size={10} /> : a.finalSignal.includes('PE') ? <TrendingDown size={10} /> : null}
                                                {a.finalSignal}
                                            </span>
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                                            {a.spotPrice?.toFixed(2) ?? '—'}
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '12.5px', color: 'var(--text-1)' }}>
                                            {a.priceSource === 'PENDING' ? (
                                                <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Awaiting…</span>
                                            ) : (
                                                <div>
                                                    <span>{a.comparePrice?.toFixed(2)}</span>
                                                    <span style={{
                                                        marginLeft: '6px', fontSize: '9px', fontWeight: 700,
                                                        padding: '1px 5px', borderRadius: '4px',
                                                        background: a.priceSource === 'LOCKED' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                                                        color: a.priceSource === 'LOCKED' ? 'var(--profit)' : 'var(--accent-light)',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {a.priceSource === 'LOCKED' ? '🔒 LOCKED' : '⏱ LIVE'}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="font-mono" style={{ fontWeight: 700, color: a.priceSource === 'PENDING' ? 'var(--text-3)' : a.diff > 0 ? 'var(--profit)' : a.diff < 0 ? 'var(--loss)' : 'var(--text-3)' }}>
                                            {a.priceSource === 'PENDING' ? '—' : `${a.diff > 0 ? '+' : ''}${a.pct.toFixed(2)}%`}
                                        </td>
                                        <td>
                                            {a.status === 'CORRECT'
                                                ? <span className="badge badge-buy"><TrendingUp size={10} /> HIT</span>
                                                : a.status === 'INCORRECT'
                                                ? <span className="badge badge-sell"><TrendingDown size={10} /> MISS</span>
                                                : <span className="badge badge-wait">—</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="progress-bar" style={{ width: '60px' }}>
                                                    <div className="progress-fill" style={{ width: `${(a.qScore / 10) * 100}%`, background: 'var(--accent-grad)' }} />
                                                </div>
                                                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>{a.qScore}/10</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {expandedRow === i && (
                                        <tr>
                                            <td colSpan={8} style={{ padding: 0, background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                                                <div className="slide-up" style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    
                                                    {/* Primary Status */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px' }}>
                                                        {[
                                                            { label: 'RSI / ADX', value: `${a.rsi?.toFixed(1) ?? '—'} / ${a.adx?.toFixed(1) ?? '—'}` },
                                                            { label: 'Confidence', value: `${a.confidence}%` },
                                                            { label: 'PCR (O/I)', value: a.putCallRatio?.toFixed(2) },
                                                            { label: 'Mode', value: a.engineMode },
                                                            { label: 'Audit Price Move', value: `${a.diff > 0 ? '+' : ''}${a.diff.toFixed(1)} (${a.pct.toFixed(2)}%)`, color: a.diff > 0 ? 'var(--profit)' : a.diff < 0 ? 'var(--loss)' : 'var(--text-1)' }
                                                        ].map(item => (
                                                            <div key={item.label} style={{
                                                                padding: '12px 14px', background: 'var(--bg-elevated)',
                                                                borderRadius: 8, border: '1px solid var(--border)'
                                                            }}>
                                                                <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '4px' }}>{item.label}</div>
                                                                <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: item.color || 'var(--text-1)' }}>{item.value ?? '—'}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Deep Data Telemetry */}
                                                    <div>
                                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-light)', marginBottom: '12px' }}>v4.3 Telemetry Payload</div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px' }}>
                                                            {[
                                                                { label: 'GEX Exposure', value: a.gammaExposure?.toLocaleString() },
                                                                { label: 'IV Skew', value: a.ivSkew?.toFixed(3) },
                                                                { label: 'POC Distance', value: a.pocDistance?.toFixed(2) },
                                                                { label: 'Session Progress', value: `${((a.sessionProgress || 0) * 100).toFixed(0)}%` },
                                                                { label: 'Volatility ATR', value: a.volatilityATR?.toFixed(2) }
                                                            ].map(item => (
                                                                <div key={item.label} style={{
                                                                    padding: '12px 14px', background: 'rgba(99, 102, 241, 0.03)',
                                                                    borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.1)'
                                                                }}>
                                                                    <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-light)', marginBottom: '4px' }}>{item.label}</div>
                                                                    <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>{item.value ?? '—'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Analytics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Regime table */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <span className="section-title">Accuracy by Market Regime</span>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Regime</th>
                                <th>Samples</th>
                                <th>Accuracy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regimeStats.map(r => (
                                <tr key={r.regime}>
                                    <td><span className="chip">{r.regime}</span></td>
                                    <td className="font-mono">{r.total}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="progress-bar" style={{ width: '50px' }}>
                                                <div className="progress-fill" style={{
                                                    width: `${r.winRate}%`,
                                                    background: r.winRate > 60 ? 'var(--profit)' : 'var(--accent)'
                                                }} />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '12.5px', color: r.winRate > 60 ? 'var(--profit)' : 'var(--text-2)' }}>{r.winRate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Hourly chart */}
                <div className="card" style={{ padding: '20px 20px 16px' }}>
                    <div className="section-header" style={{ marginBottom: '16px' }}>
                        <span className="section-title">Hourly Accuracy</span>
                    </div>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourly} barSize={18}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: 'var(--text-3)' }} />
                                <Tooltip {...TooltipStyle} formatter={(v: any) => [`${v}%`, 'Accuracy']} />
                                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                                    {hourly.map((e, i) => (
                                        <Cell key={i} fill={e.winRate > 60 ? '#22c55e' : '#6366f1'} opacity={0.85} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
        </div>
    );
}
