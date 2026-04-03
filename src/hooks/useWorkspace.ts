/**
 * WORKSPACE LAYOUT PERSISTENCE HOOK
 * 
 * Manages saved multi-panel layouts. Each layout contains a grid configuration
 * and a list of widget placements. Layouts are persisted to localStorage.
 */

import { useState, useCallback, useEffect } from 'react';

/** Widget type identifiers — each maps to a mini-component */
export type WidgetType =
    | 'kpi_pnl'
    | 'kpi_winrate'
    | 'kpi_nifty'
    | 'kpi_trades'
    | 'signal_card'
    | 'equity_chart'
    | 'daily_pnl_chart'
    | 'telemetry_matrix'
    | 'ai_insights'
    | 'active_positions'
    | 'recent_signals'
    | 'vix_gauge'
    | 'exit_breakdown'
    | 'engine_status'
    | 'regime_indicator'
    | 'confidence_meter';

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    /** Grid column span (1-4) */
    colSpan: number;
    /** Grid row span (1-3) */
    rowSpan: number;
}

export interface WorkspaceLayout {
    id: string;
    name: string;
    icon: string;
    widgets: WidgetConfig[];
    columns: number;
    createdAt: string;
}

const STORAGE_KEY = 'zenith-workspaces';
const ACTIVE_KEY = 'zenith-active-workspace';

/** Generate a short unique ID */
function uid(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Default presets that ship with Zenith */
const DEFAULT_LAYOUTS: WorkspaceLayout[] = [
    {
        id: 'preset-mission-control',
        name: 'Mission Control',
        icon: '🎯',
        columns: 4,
        createdAt: new Date().toISOString(),
        widgets: [
            { id: 'w1', type: 'kpi_pnl', colSpan: 1, rowSpan: 1 },
            { id: 'w2', type: 'kpi_winrate', colSpan: 1, rowSpan: 1 },
            { id: 'w3', type: 'kpi_nifty', colSpan: 1, rowSpan: 1 },
            { id: 'w4', type: 'kpi_trades', colSpan: 1, rowSpan: 1 },
            { id: 'w5', type: 'signal_card', colSpan: 1, rowSpan: 2 },
            { id: 'w6', type: 'equity_chart', colSpan: 2, rowSpan: 2 },
            { id: 'w7', type: 'active_positions', colSpan: 1, rowSpan: 2 },
            { id: 'w8', type: 'telemetry_matrix', colSpan: 2, rowSpan: 1 },
            { id: 'w9', type: 'ai_insights', colSpan: 1, rowSpan: 1 },
            { id: 'w10', type: 'engine_status', colSpan: 1, rowSpan: 1 },
        ]
    },
    {
        id: 'preset-signal-focus',
        name: 'Signal Focus',
        icon: '⚡',
        columns: 3,
        createdAt: new Date().toISOString(),
        widgets: [
            { id: 'w1', type: 'signal_card', colSpan: 1, rowSpan: 2 },
            { id: 'w2', type: 'confidence_meter', colSpan: 1, rowSpan: 1 },
            { id: 'w3', type: 'regime_indicator', colSpan: 1, rowSpan: 1 },
            { id: 'w4', type: 'recent_signals', colSpan: 2, rowSpan: 2 },
            { id: 'w5', type: 'ai_insights', colSpan: 1, rowSpan: 1 },
            { id: 'w6', type: 'telemetry_matrix', colSpan: 2, rowSpan: 1 },
            { id: 'w7', type: 'vix_gauge', colSpan: 1, rowSpan: 1 },
        ]
    },
    {
        id: 'preset-analytics',
        name: 'Analytics Deep',
        icon: '📊',
        columns: 3,
        createdAt: new Date().toISOString(),
        widgets: [
            { id: 'w1', type: 'kpi_pnl', colSpan: 1, rowSpan: 1 },
            { id: 'w2', type: 'kpi_winrate', colSpan: 1, rowSpan: 1 },
            { id: 'w3', type: 'kpi_trades', colSpan: 1, rowSpan: 1 },
            { id: 'w4', type: 'equity_chart', colSpan: 2, rowSpan: 2 },
            { id: 'w5', type: 'exit_breakdown', colSpan: 1, rowSpan: 2 },
            { id: 'w6', type: 'daily_pnl_chart', colSpan: 3, rowSpan: 1 },
        ]
    },
    {
        id: 'preset-risk-auditor',
        name: 'Risk Auditor',
        icon: '🛡️',
        columns: 4,
        createdAt: new Date().toISOString(),
        widgets: [
            { id: 'w1', type: 'vix_gauge', colSpan: 1, rowSpan: 1 },
            { id: 'w2', type: 'engine_status', colSpan: 1, rowSpan: 1 },
            { id: 'w3', type: 'active_positions', colSpan: 2, rowSpan: 2 },
            { id: 'w4', type: 'regime_indicator', colSpan: 1, rowSpan: 1 },
            { id: 'w5', type: 'kpi_pnl', colSpan: 1, rowSpan: 1 },
            { id: 'w6', type: 'telemetry_matrix', colSpan: 2, rowSpan: 1 },
        ]
    },
    {
        id: 'preset-ai-explorer',
        name: 'AI Explorer',
        icon: '🧠',
        columns: 5,
        createdAt: new Date().toISOString(),
        widgets: [
            { id: 'w1', type: 'ai_insights', colSpan: 2, rowSpan: 1 },
            { id: 'w2', type: 'confidence_meter', colSpan: 1, rowSpan: 1 },
            { id: 'w3', type: 'signal_card', colSpan: 1, rowSpan: 2 },
            { id: 'w4', type: 'regime_indicator', colSpan: 1, rowSpan: 1 },
            { id: 'w5', type: 'telemetry_matrix', colSpan: 3, rowSpan: 1 },
            { id: 'w6', type: 'kpi_winrate', colSpan: 1, rowSpan: 1 },
        ]
    },
    {
        id: 'preset-execution-desk',
        name: 'Execution Desk',
        icon: '⚡',
        columns: 4,
        createdAt: new Date().toISOString(),
        widgets: [
            { id: 'w1', type: 'recent_signals', colSpan: 2, rowSpan: 2 },
            { id: 'w2', type: 'active_positions', colSpan: 2, rowSpan: 1 },
            { id: 'w3', type: 'kpi_pnl', colSpan: 1, rowSpan: 1 },
            { id: 'w4', type: 'kpi_nifty', colSpan: 1, rowSpan: 1 },
            { id: 'w5', type: 'signal_card', colSpan: 1, rowSpan: 1 },
            { id: 'w6', type: 'vix_gauge', colSpan: 1, rowSpan: 1 },
        ]
    },
    {
        id: 'preset-vol-watch',
        name: 'Vol Watch',
        icon: '🌪️',
        columns: 3,
        createdAt: new Date().toISOString(),
        widgets: [
            { id: 'w1', type: 'vix_gauge', colSpan: 1, rowSpan: 1 },
            { id: 'w2', type: 'regime_indicator', colSpan: 1, rowSpan: 1 },
            { id: 'w3', type: 'engine_status', colSpan: 1, rowSpan: 1 },
            { id: 'w4', type: 'telemetry_matrix', colSpan: 3, rowSpan: 1 },
            { id: 'w5', type: 'equity_chart', colSpan: 3, rowSpan: 2 },
        ]
    },
    {
        id: 'preset-compact',
        name: 'Compact View',
        icon: '🔲',
        columns: 2,
        createdAt: new Date().toISOString(),
        widgets: [
            { id: 'w1', type: 'signal_card', colSpan: 1, rowSpan: 1 },
            { id: 'w2', type: 'kpi_pnl', colSpan: 1, rowSpan: 1 },
            { id: 'w3', type: 'equity_chart', colSpan: 2, rowSpan: 2 },
            { id: 'w4', type: 'active_positions', colSpan: 2, rowSpan: 1 },
        ]
    }
];

export function useWorkspace() {
    const [layouts, setLayouts] = useState<WorkspaceLayout[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch { /* fallback */ }
        return DEFAULT_LAYOUTS;
    });

    const [activeId, setActiveId] = useState<string>(() => {
        return localStorage.getItem(ACTIVE_KEY) || 'preset-mission-control';
    });

    /** Persist to localStorage */
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    }, [layouts]);

    useEffect(() => {
        localStorage.setItem(ACTIVE_KEY, activeId);
    }, [activeId]);

    const activeLayout = layouts.find(l => l.id === activeId) || layouts[0];

    const createLayout = useCallback((name: string, columns: number, icon: string) => {
        const newLayout: WorkspaceLayout = {
            id: uid(),
            name,
            icon,
            columns,
            widgets: [],
            createdAt: new Date().toISOString(),
        };
        setLayouts(prev => [...prev, newLayout]);
        setActiveId(newLayout.id);
        return newLayout;
    }, []);

    const deleteLayout = useCallback((id: string) => {
        if (id.startsWith('preset-')) return; // Can't delete presets
        setLayouts(prev => prev.filter(l => l.id !== id));
        setActiveId(prev => prev === id ? 'preset-mission-control' : prev);
    }, []);

    const duplicateLayout = useCallback((id: string) => {
        const source = layouts.find(l => l.id === id);
        if (!source) return;
        const newLayout: WorkspaceLayout = {
            ...source,
            id: uid(),
            name: `${source.name} (Copy)`,
            createdAt: new Date().toISOString(),
            widgets: source.widgets.map(w => ({ ...w, id: uid() })),
        };
        setLayouts(prev => [...prev, newLayout]);
        setActiveId(newLayout.id);
    }, [layouts]);

    const updateLayout = useCallback((id: string, updates: Partial<WorkspaceLayout>) => {
        setLayouts(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }, []);

    const addWidget = useCallback((layoutId: string, type: WidgetType) => {
        setLayouts(prev => prev.map(l => {
            if (l.id !== layoutId) return l;
            const widget: WidgetConfig = {
                id: uid(),
                type,
                colSpan: type.startsWith('kpi_') ? 1 : 2,
                rowSpan: type.startsWith('kpi_') ? 1 : 1,
            };
            return { ...l, widgets: [...l.widgets, widget] };
        }));
    }, []);

    const removeWidget = useCallback((layoutId: string, widgetId: string) => {
        setLayouts(prev => prev.map(l => {
            if (l.id !== layoutId) return l;
            return { ...l, widgets: l.widgets.filter(w => w.id !== widgetId) };
        }));
    }, []);

    const updateWidget = useCallback((layoutId: string, widgetId: string, updates: Partial<WidgetConfig>) => {
        setLayouts(prev => prev.map(l => {
            if (l.id !== layoutId) return l;
            return {
                ...l,
                widgets: l.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w)
            };
        }));
    }, []);

    const moveWidget = useCallback((layoutId: string, fromIndex: number, toIndex: number) => {
        setLayouts(prev => prev.map(l => {
            if (l.id !== layoutId) return l;
            const widgets = [...l.widgets];
            const [moved] = widgets.splice(fromIndex, 1);
            widgets.splice(toIndex, 0, moved);
            return { ...l, widgets };
        }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setLayouts(DEFAULT_LAYOUTS);
        setActiveId('preset-mission-control');
    }, []);

    return {
        layouts,
        activeLayout,
        activeId,
        setActiveId,
        createLayout,
        deleteLayout,
        duplicateLayout,
        updateLayout,
        addWidget,
        removeWidget,
        updateWidget,
        moveWidget,
        resetToDefaults,
    };
}
