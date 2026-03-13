import { useState, useEffect } from 'react';
import {
    Cpu, Activity, Globe, ExternalLink, ShieldCheck,
    Terminal, Zap, RefreshCw, Database, BookOpen, Layers
} from 'lucide-react';

interface HealthData {
    status: string;
    version: string;
    model_loaded: boolean;
    engine_mode: string;
}

interface ModelStatus {
    model_loaded: boolean;
    mode: string;
    feature_count: number;
    xgboost_available: boolean;
}

export default function PythonEnginePage() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const hRes = await fetch('http://localhost:8000/health');
            const hData = await hRes.json();
            setHealth(hData);

            const mRes = await fetch('http://localhost:8000/api/model/status');
            const mData = await mRes.json();
            setModelStatus(mData);

            setError(null);
        } catch (err) {
            setError('Could not connect to Python Engine at localhost:8000');
            setHealth(null);
            setModelStatus(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    const engineLinks = [
        {
            title: 'Browser Health Check',
            desc: 'Verify if the engine is responding through the web browser.',
            url: 'http://localhost:8000',
            icon: Globe,
            color: 'var(--accent-light)'
        },
        {
            title: 'Swagger API Documentation',
            desc: 'Explore all available REST endpoints and data schemas.',
            url: 'http://localhost:8000/docs',
            icon: ShieldCheck,
            color: 'var(--profit)'
        },
        {
            title: 'Advanced Debug Endpoint',
            desc: 'Raw JSON view of intermediate feature calculations.',
            url: 'http://localhost:8000/api/predict/debug',
            icon: Terminal,
            color: 'var(--warn)'
        }
    ];

    return (
        <div className="page-scroll">
            <div className="page-body enter">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '4px' }}>Backend Diagnostics</div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Python Operational Core</h2>
                    </div>
                    <button
                        className={`icon-btn ${loading ? 'spin' : ''}`}
                        onClick={checkHealth}
                        style={{ width: 'auto', padding: '0 16px', gap: '8px', fontSize: '12px', fontWeight: 600 }}
                    >
                        <RefreshCw size={14} />
                        Sync Engine Status
                    </button>
                </div>

                {/* KPI Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <div className="kpi-card">
                        <div className="kpi-label"><Activity size={12} /> API Status</div>
                        <div className="kpi-value" style={{ color: error ? 'var(--loss)' : 'var(--profit)' }}>
                            {error ? 'OFFLINE' : 'HEALTHY'}
                        </div>
                        <div className="kpi-sub">{error ? 'localhost:8000 unreachable' : `Running v${health?.version || '4.0.0'}`}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label"><Zap size={12} /> Engine Mode</div>
                        <div className="kpi-value" style={{ fontSize: '20px', color: modelStatus?.model_loaded ? 'var(--accent-light)' : 'var(--warn)' }}>
                            {modelStatus?.mode?.replace('_', ' ') || 'RULES FALLBACK'}
                        </div>
                        <div className="kpi-sub">{modelStatus?.model_loaded ? `${modelStatus.feature_count} active features` : 'No AI model loaded'}</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label"><Cpu size={12} /> Processing</div>
                        <div className="kpi-value">FastAPI</div>
                        <div className="kpi-sub">Uvicorn ASGI worker active</div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-label"><Database size={12} /> Model Store</div>
                        <div className="kpi-value">{modelStatus?.model_loaded ? 'Ready' : 'Standby'}</div>
                        <div className="kpi-sub">Managed via /api/models</div>
                    </div>
                </div>

                {/* Main Content Sections */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>

                    {/* Access Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <div style={{ padding: '8px', background: 'var(--accent-dim)', borderRadius: '8px' }}>
                                <Layers size={16} color="var(--accent-light)" />
                            </div>
                            <span className="section-title">Engine Entrypoints</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {engineLinks.map(link => (
                                <a
                                    key={link.title}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="card"
                                    style={{
                                        padding: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '20px',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        background: 'var(--bg-surface)'
                                    }}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: 'var(--bg-elevated)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <link.icon size={22} color={link.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '2px' }}>{link.title}</div>
                                        <div style={{ fontSize: '11.5px', color: 'var(--text-3)', lineHeight: '1.4' }}>{link.desc}</div>
                                    </div>
                                    <div className="icon-btn" style={{ width: '32px', height: '32px' }}>
                                        <ExternalLink size={14} color="var(--text-4)" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Operational Docs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '8px', background: 'var(--accent-dim)', borderRadius: '8px' }}>
                                    <BookOpen size={16} color="var(--accent-light)" />
                                </div>
                                <span className="section-title">Operational Architecture</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', borderLeft: '4px solid var(--accent)' }}>
                                    <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: '1.7' }}>
                                        The ZENITH Python Engine runs a real-time <b>XGBoost-based inference service</b>. It engineers 40+ market features in under 15ms per cycle, providing high-precision signals to the n8n automation layer.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.05em' }}>Performance Targets</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Max Inference Latency</span>
                                            <span className="font-mono" style={{ color: 'var(--text-1)', fontWeight: 600 }}>50ms</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Prediction Throughput</span>
                                            <span className="font-mono" style={{ color: 'var(--text-1)', fontWeight: 600 }}>2 Hz</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Reliability Target</span>
                                            <span style={{ color: 'var(--profit)', fontWeight: 700 }}>99.9%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tip */}
                        <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ color: 'var(--warn)' }}><Zap size={16} /></div>
                            <span style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 500 }}>
                                <b>Tip:</b> If the Engine Mode shows "RULES FALLBACK", ensure you have trained the AI model using the command-line scripts.
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
