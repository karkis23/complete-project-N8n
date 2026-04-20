import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useTrading } from '../hooks/useTrading';
import { Activity } from 'lucide-react';

const ChartsPage: React.FC = () => {
    const { candles, signals } = useTrading();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chart, setChart] = useState<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartContainerRef.current && chart) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const themeBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-base');
        const themeText = getComputedStyle(document.documentElement).getPropertyValue('--text-2');
        const themeGrid = getComputedStyle(document.documentElement).getPropertyValue('--border-subtle');

        const newChart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: themeText.trim(),
            },
            grid: {
                vertLines: { color: themeGrid.trim() || 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: themeGrid.trim() || 'rgba(255, 255, 255, 0.05)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 600,
            crosshair: {
                mode: 0,
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const candlestickSeries = newChart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        const volumeSeries = newChart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', 
            scaleMargins: {
                top: 0.8, 
                bottom: 0,
            },
        });

        setChart(newChart);
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            newChart.remove();
        };
    }, []);

    useEffect(() => {
        if (!candlestickSeriesRef.current || !volumeSeriesRef.current || !candles.length) return;

        try {
            // Deduplicate and filter invalid dates
            const uniqueCandlesMap = new Map<number, OHLCCandle>();
            candles.forEach(c => {
                const ms = new Date(c.candleTime).getTime();
                if (!isNaN(ms)) {
                    uniqueCandlesMap.set(Math.floor(ms / 1000), c); // Store by seconds
                }
            });

            const uniqueCandles = Array.from(uniqueCandlesMap.values()).sort((a, b) => 
                new Date(a.candleTime).getTime() - new Date(b.candleTime).getTime()
            );

            const chartData = uniqueCandles.map(c => ({
                time: Math.floor(new Date(c.candleTime).getTime() / 1000) as Time,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
            }));
            
            candlestickSeriesRef.current.setData(chartData);

            const volumeData = uniqueCandles.map(c => ({
                time: Math.floor(new Date(c.candleTime).getTime() / 1000) as Time,
                value: c.volume || 0,
                color: c.close >= c.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
            }));
            
            volumeSeriesRef.current.setData(volumeData);

            // Map relevant signals as markers (and ensure timestamp is valid)
            const relevantSignals = signals.filter(s => 
                (s.finalSignal === 'BUY CALL (CE)' || 
                 s.finalSignal === 'BUY CE' || 
                 s.finalSignal === 'BUY PUT (PE)' || 
                 s.finalSignal === 'BUY PE') && 
                !isNaN(new Date(s.timestamp).getTime())
            );
            
            const validTimes = new Set(chartData.map(c => c.time as number));
            
            const markers = relevantSignals.map(s => {
                const ms = new Date(s.timestamp).getTime();
                let timeSec = Math.floor(ms / 1000);
                
                // lightweight-charts requires marker time to be strictly sorted and ideally present
                // We'll find the closest valid candlestick time
                if (!validTimes.has(timeSec)) {
                    if (validTimes.size > 0) {
                        const closest = Array.from(validTimes).reduce((prev, curr) => 
                            Math.abs(curr - timeSec) < Math.abs(prev - timeSec) ? curr : prev
                        );
                        timeSec = closest;
                    }
                }

                const isCall = s.finalSignal.includes('CE');
                return {
                    time: timeSec as Time,
                    position: isCall ? 'belowBar' as const : 'aboveBar' as const,
                    color: isCall ? '#22c55e' : '#ef4444',
                    shape: isCall ? 'arrowUp' as const : 'arrowDown' as const,
                    text: `${s.finalSignal.replace(/BUY CALL \(CE\)|BUY CE/, 'CE').replace(/BUY PUT \(PE\)|BUY PE/, 'PE')} (${s.confidence}%)`,
                };
            }).sort((a, b) => (a.time as number) - (b.time as number));

            // Deduplicate markers at the exact same time point by keeping the highest confidence one, 
            // as lightweight-charts can sometimes choke on multiple markers at IDENTICAL timestamps.
            const uniqueMarkersMap = new Map();
            markers.forEach(m => {
                uniqueMarkersMap.set(m.time, m);
            });
            
            candlestickSeriesRef.current.setMarkers(Array.from(uniqueMarkersMap.values()));
            
            if (chart) {
                chart.timeScale().fitContent();
            }
        } catch (error) {
            console.error("Error setting chart data:", error);
        }

    }, [candles, signals, chart]);

    return (
        <div className="page-container p-6 w-full h-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Market Context</h1>
                    <p className="text-[#a1a1aa] text-sm">Live OHLC aggregation overlaid with Zenith Signal logic.</p>
                </div>
            </div>

            <div className="glass-panel p-1 rounded-2xl" style={{ minHeight: '600px' }}>
                <div ref={chartContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
};

export default ChartsPage;
