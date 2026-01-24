// App.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  Typography,
  Box,
  IconButton,
  Chip,
  useMediaQuery,
  AppBar,
  Toolbar,
  Modal,
  Button,
  keyframes
} from '@mui/material';
import {
  ShowChart,
  CurrencyBitcoin,
  Public,
  WaterDrop,
  Memory,
  Dashboard,
  Sensors,
  Menu as MenuIcon,
  RestartAlt,
  Map,
  DataUsage,
  QueryStats,
  Psychology,
  ViewQuilt,
  Newspaper
} from '@mui/icons-material';

import {
  TickerTapeWidget,
  AdvancedChartWidget,
  TechnicalWidget,
  NewsWidget,
  HeatmapWidget,
  FundamentalDataWidget,
  ScreenerWidget
} from './components/Widgets';
import SymbolSearch from './components/SymbolSearch';
import Loader from './components/Loader';
import AssetSelector from './components/AssetSelector';
import MarketBrain from './components/MarketBrain';
import { marketCategories, type MarketCategories } from './data/marketData';

type CategoryType = 'index' | 'forex' | 'crypto' | 'commodity' | 'stock';
type SplitDir = 'row' | 'column';

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(0, 242, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0); }
`;

const cyberTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#000000', paper: '#050505' },
    primary: { main: '#00f2ff' },
    secondary: { main: '#7000ff' },
    text: { primary: '#e0e0e0', secondary: '#9e9e9e' }
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: 0 } } },
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#000', borderBottom: '1px solid #333' } } }
  }
});

const drawerWidth = 60;

const normSymbol = (s: string) => s.replace(/\s+/g, '').trim();

const parseForexPair = (symbol: string) => {
  const s = normSymbol(symbol).toUpperCase();
  const cleaned = s.includes(':') ? s.split(':').pop() || s : s;
  const letters = cleaned.replace(/[^A-Z]/g, '');
  if (letters.length >= 6) return { from: letters.slice(0, 3), to: letters.slice(3, 6) };
  return null;
};

const parseBinanceSymbol = (symbol: string) => {
  const s = normSymbol(symbol).toUpperCase();
  const cleaned = s.includes(':') ? s.split(':').pop() || s : s;
  const only = cleaned.replace(/[^A-Z0-9]/g, '');
  if (!only) return null;
  if (only.endsWith('USD') && !only.endsWith('USDT')) return only.replace(/USD$/, 'USDT');
  return only;
};

const stooqSymbol = (symbol: string, type: CategoryType) => {
  const raw = normSymbol(symbol);
  const noPrefix = raw.includes(':') ? raw.split(':').pop() || raw : raw;
  const s = noPrefix.toLowerCase();

  if (type === 'stock') {
    if (s.endsWith('.us') || s.endsWith('.de') || s.endsWith('.uk')) return s;
    return `${s}.us`;
  }

  if (type === 'index') return s.replace(/[^a-z0-9\.\-^]/g, '');
  if (type === 'commodity') return s.replace(/[^a-z0-9\.\-^]/g, '');

  return s;
};

const fetchPrice = async (symbol: string, type: CategoryType, signal?: AbortSignal) => {
  if (type === 'crypto') {
    const b = parseBinanceSymbol(symbol);
    if (!b) throw new Error('Symbol non valido (crypto).');
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(b)}`, { signal });
    if (!r.ok) throw new Error('Feed crypto non disponibile.');
    const j = (await r.json()) as { price: string };
    const p = Number(j.price);
    if (!Number.isFinite(p)) throw new Error('Prezzo non valido (crypto).');
    return p;
  }

  if (type === 'forex') {
    const pair = parseForexPair(symbol);
    if (!pair) throw new Error('Symbol non valido (forex).');
    const r = await fetch(
      `https://api.exchangerate.host/convert?from=${encodeURIComponent(pair.from)}&to=${encodeURIComponent(pair.to)}&amount=1`,
      { signal }
    );
    if (!r.ok) throw new Error('Feed forex non disponibile.');
    const j = (await r.json()) as { result?: number };
    const p = Number(j.result);
    if (!Number.isFinite(p)) throw new Error('Prezzo non valido (forex).');
    return p;
  }

  const s = stooqSymbol(symbol, type);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(s)}&f=sd2t2ohlcv&h&e=csv`;
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error('Feed stooq non disponibile.');
  const text = await r.text();

  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('Risposta feed non valida.');
  const row = lines[1].split(',');
  const close = row[row.length - 2];
  const p = Number(close);
  if (!Number.isFinite(p)) throw new Error('Prezzo non valido (stooq).');
  return p;
};

const useLivePrice = (symbol: string, type: CategoryType, enabled: boolean) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalMs = useMemo(() => {
    if (type === 'crypto') return 5000;
    if (type === 'forex') return 10000;
    return 20000;
  }, [type]);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    const ac = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchPrice(symbol, type, ac.signal);
        if (mounted) setPrice(p);
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : 'Errore feed.';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    const t = setInterval(run, intervalMs);

    return () => {
      mounted = false;
      ac.abort();
      clearInterval(t);
    };
  }, [symbol, type, enabled, intervalMs]);

  return { price, loading, error };
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const usePersistedNumber = (key: string, initial: number) => {
  const [value, setValue] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return initial;
      const n = Number(raw);
      return Number.isFinite(n) ? n : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, String(value));
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
};

type SplitProps = {
  dir: SplitDir;
  a: React.ReactNode;
  b: React.ReactNode;
  initialPct?: number;
  minPct?: number;
  maxPct?: number;
  persistKey?: string;
  dividerSize?: number;
  dividerColor?: string;
  hoverColor?: string;
};

const Split: React.FC<SplitProps> = ({
  dir,
  a,
  b,
  initialPct = 70,
  minPct = 10,
  maxPct = 90,
  persistKey,
  dividerSize = 6,
  dividerColor = '#0f0f0f',
  hoverColor = 'rgba(0, 242, 255, 0.25)'
}) => {
  const [pct, setPct] = persistKey ? usePersistedNumber(persistKey, initialPct) : useState<number>(initialPct);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next =
      dir === 'row'
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100;
    setPct(clamp(next, minPct, maxPct));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const isRow = dir === 'row';
  const dividerSx = {
    flex: `0 0 ${dividerSize}px`,
    cursor: isRow ? 'col-resize' : 'row-resize',
    background: dividerColor,
    position: 'relative' as const,
    zIndex: 30,
    '&:hover': { background: hoverColor }
  };

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: isRow ? 'row' : 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: `0 0 ${pct}%`, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>{a}</Box>
      <Box
        role="separator"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        sx={dividerSx}
      />
      <Box sx={{ flex: `1 1 ${100 - pct}%`, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>{b}</Box>
    </Box>
  );
};

type TripleSplitProps = {
  top: React.ReactNode;
  mid: React.ReactNode;
  bot: React.ReactNode;
  topPctKey?: string;
  midPctKey?: string;
  topInitialPct?: number;
  midInitialPct?: number;
  minPct?: number;
};

const TripleSplit: React.FC<TripleSplitProps> = ({
  top,
  mid,
  bot,
  topPctKey,
  midPctKey,
  topInitialPct = 33,
  midInitialPct = 33,
  minPct = 10
}) => {
  const [topPct, setTopPct] = topPctKey ? usePersistedNumber(topPctKey, topInitialPct) : useState<number>(topInitialPct);
  const [midPct, setMidPct] = midPctKey ? usePersistedNumber(midPctKey, midInitialPct) : useState<number>(midInitialPct);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<'top' | 'mid' | null>(null);

  const onDown = (which: 'top' | 'mid') => (e:React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = which;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el || !dragRef.current) return;
    const rect = el.getBoundingClientRect();
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    if (dragRef.current === 'top') {
      const nextTop = clamp(yPct, minPct, 100 - minPct * 2);
      setTopPct(nextTop);
      const remaining = 100 - nextTop;
      setMidPct(clamp(midPct, minPct, remaining - minPct));
      return;
    }

    const base = topPct;
    const within = yPct - base;
    const remaining = 100 - base;
    const nextMid = clamp(within, minPct, remaining - minPct);
    setMidPct(nextMid);
  };

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const dividerSx = {
    flex: '0 0 6px',
    cursor: 'row-resize',
    background: '#0f0f0f',
    '&:hover': { background: 'rgba(0, 242, 255, 0.25)' }
  };

  const topBasis = clamp(topPct, minPct, 100 - minPct * 2);
  const midBasis = clamp(midPct, minPct, 100 - topBasis - minPct);

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: `0 0 ${topBasis}%`, minHeight: 0, overflow: 'hidden' }}>{top}</Box>
      <Box onPointerDown={onDown('top')} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} sx={dividerSx} />
      <Box sx={{ flex: `0 0 ${midBasis}%`, minHeight: 0, overflow: 'hidden' }}>{mid}</Box>
      <Box onPointerDown={onDown('mid')} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} sx={dividerSx} />
      <Box sx={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>{bot}</Box>
    </Box>
  );
};

const App: React.FC = () => {
  const isMobile = useMediaQuery(cyberTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState<keyof MarketCategories>('indices');
  const [customSymbol, setCustomSymbol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBrainOpen, setIsBrainOpen] = useState(false);

  const currentCategoryData = marketCategories[activeCategory];
  const activeSymbol = customSymbol || currentCategoryData.symbols[0][1];

  const { price, loading: priceLoading, error: priceError } = useLivePrice(activeSymbol, currentCategoryData.type as CategoryType, true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeSymbol, activeCategory]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleSearch = (symbol: string) => setCustomSymbol(symbol);
  const handleAssetSelect = (symbol: string) => setCustomSymbol(symbol);
  const handleResetSymbol = () => setCustomSymbol(null);

  const getIcon = (key: string) => {
    switch (key) {
      case 'indices':
        return <Public />;
      case 'forex':
        return <ShowChart />;
      case 'crypto':
        return <CurrencyBitcoin />;
      case 'commodities':
        return <WaterDrop />;
      case 'tech_stocks':
        return <Memory />;
      default:
        return <Dashboard />;
    }
  };

  const isStockLayout = currentCategoryData.type === 'stock' || currentCategoryData.type === 'index';
  const isCryptoLayout = currentCategoryData.type === 'crypto';

  const renderRightWidgetTop = () => <TechnicalWidget symbol={activeSymbol} />;
  const renderRightWidgetMiddle = () => <HeatmapWidget type={isCryptoLayout ? 'crypto' : 'stock'} />;
  const renderRightWidgetBottom = () => (isStockLayout ? <FundamentalDataWidget symbol={activeSymbol} /> : <NewsWidget symbol={activeSymbol} />);
  const renderBottomLeft = () => <ScreenerWidget />;
  const renderBottomRight = () => <HeatmapWidget type={isCryptoLayout ? 'crypto' : 'stock'} />;

  const drawerContent = (
    <>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40px' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#00f2ff', letterSpacing: 1 }}>
          PRO
        </Typography>
      </Box>
      <List className="flex flex-col gap-2 w-full px-1">
        {(Object.keys(marketCategories) as Array<keyof MarketCategories>).map((key) => (
          <ListItemButton
            key={key}
            onClick={() => {
              setActiveCategory(key);
              setCustomSymbol(null);
              if (isMobile) setMobileOpen(false);
            }}
            selected={activeCategory === key}
            sx={{
              flexDirection: 'column',
              justifyContent: 'center',
              py: 2,
              '&.Mui-selected': { borderLeft: '3px solid #00f2ff', color: '#00f2ff', bgcolor: '#111' },
              '&:hover': { bgcolor: '#111' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, color: activeCategory === key ? '#00f2ff' : '#666' }}>{getIcon(String(key))}</ListItemIcon>
          </ListItemButton>
        ))}
      </List>
    </>
  );

  const priceText =
    priceLoading ? '...' : priceError ? 'FEED ERR' : price == null ? '—' : price >= 1000 ? price.toFixed(1) : price.toFixed(4);

  const chartPane = (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }} key={activeSymbol}>
        <AdvancedChartWidget symbol={activeSymbol} />
      </Box>
      <Box sx={{ height: '36px', flexShrink: 0, bgcolor: '#050505', zIndex: 10, maxWidth: '100vw', overflowX: 'auto' }}>
        <AssetSelector symbols={currentCategoryData.symbols} activeSymbol={activeSymbol} onSelect={handleAssetSelect} />
      </Box>
    </Box>
  );

  const rightPane = (
    <Box sx={{ width: '100%', height: '100%', minHeight: 0, borderLeft: '1px solid #222', bgcolor: '#000' }}>
      <TripleSplit
        topPctKey="layout:rightTopPct"
        midPctKey="layout:rightMidPct"
        top={
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
              <QueryStats sx={{ fontSize: 14, color: '#ff0055' }} />
              <Typography variant="caption" fontWeight="bold">
                OSCILLATORS & GAUGE
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{renderRightWidgetTop()}</Box>
          </Box>
        }
        mid={
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ViewQuilt sx={{ fontSize: 14, color: '#00f2ff' }} />
              <Typography variant="caption" fontWeight="bold">
                MARKET SECTOR TREND
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{renderRightWidgetMiddle()}</Box>
          </Box>
        }
        bot={
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Newspaper sx={{ fontSize: 14, color: '#ff9900' }} />
              <Typography variant="caption" fontWeight="bold">
                {isStockLayout ? 'FINANCIALS' : 'LIVE NEWS'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{renderRightWidgetBottom()}</Box>
          </Box>
        }
      />
    </Box>
  );

  const topArea = (
    <Split
      dir="row"
      persistKey="layout:topRightPct"
      initialPct={74}
      minPct={45}
      maxPct={88}
      a={<Box sx={{ width: '100%', height: '100%', minHeight: 0, borderRight: '1px solid #222' }}>{chartPane}</Box>}
      b={<Box sx={{ width: '100%', height: '100%', minHeight: 0, minWidth: { lg: 280 }, bgcolor: '#000' }}>{rightPane}</Box>}
    />
  );

  const bottomArea = (
    <Split
      dir="row"
      persistKey="layout:bottomLeftPct"
      initialPct={65}
      minPct={35}
      maxPct={85}
      a={
        <Box sx={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #222' }}>
          <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Map sx={{ fontSize: 14, color: '#00f2ff' }} />
            <Typography variant="caption" fontWeight="bold">
              GLOBAL SCREENER
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{renderBottomLeft()}</Box>
        </Box>
      }
      b={
        <Box sx={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
            <DataUsage sx={{ fontSize: 14, color: '#ff0055' }} />
            <Typography variant="caption" fontWeight="bold">
              LIQUIDITY HEATMAP
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{renderBottomRight()}</Box>
        </Box>
      }
    />
  );

  return (
    <ThemeProvider theme={cyberTheme}>
      <CssBaseline />

      <AppBar position="fixed" sx={{ zIndex: 1400, height: '56px', borderBottom: '1px solid rgba(0, 242, 255, 0.15)' }}>
        <Box sx={{ position: 'absolute', inset: 0, zIndex: -2, opacity: 0.6 }}>
          <TickerTapeWidget />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: -1,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%)',
            backdropFilter: 'blur(8px)'
          }}
        />

        <Toolbar variant="dense" sx={{ height: '56px', gap: 1, px: { xs: 1, sm: 2 }, justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" flexShrink={0}>
            {isMobile && (
              <IconButton
                onClick={handleDrawerToggle}
                size="small"
                sx={{ color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)', borderRadius: 1, mr: 1 }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            )}

            <Typography
              variant="button"
              sx={{ fontWeight: 'bold', color: '#fff', letterSpacing: 2, display: { xs: 'none', md: 'block' }, mr: 2 }}
            >
              PRO<span style={{ color: '#00f2ff' }}>TERMINAL</span>
            </Typography>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0, maxWidth: '500px' }}>
            <SymbolSearch onSearch={handleSearch} />
          </Box>

          <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }} flexShrink={0}>
            <Button
              variant="contained"
              onClick={() => setIsBrainOpen(true)}
              sx={{
                background: 'linear-gradient(90deg, #7000ff 0%, #00f2ff 100%)',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '4px',
                minWidth: { xs: '32px', sm: 'auto' },
                px: { xs: 0, sm: 2 },
                height: '32px',
                boxShadow: '0 0 10px rgba(112, 0, 255, 0.5)',
                animation: `${pulseAnimation} 2s infinite`,
                '&:hover': { background: 'linear-gradient(90deg, #5000cc 0%, #00d2df 100%)' }
              }}
            >
              <Psychology sx={{ fontSize: 20, mr: { xs: 0, sm: 1 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                AI BRAIN
              </Box>
            </Button>

            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.1)',
                pr: 1
              }}
            >
              <Chip
                label={activeSymbol}
                size="small"
                sx={{
                  borderRadius: '4px 0 0 4px',
                  height: 32,
                  bgcolor: customSymbol ? '#7000ff' : '#222',
                  color: '#fff',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)'
                }}
              />
              <Chip
                label={priceText}
                size="small"
                sx={{
                  height: 32,
                  bgcolor: '#111',
                  color: priceError ? '#ff0055' : '#00f2ff',
                  fontWeight: 'bold',
                  borderRadius: 0
                }}
              />
              {customSymbol && (
                <IconButton size="small" onClick={handleResetSymbol} sx={{ color: '#ff0055', p: 0.5, ml: 0.5 }}>
                  <RestartAlt fontSize="small" />
                </IconButton>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1} sx={{ ml: 1 }}>
              <Sensors sx={{ fontSize: 14, color: isLoading ? '#ff9900' : '#00ff00' }} className={isLoading ? 'animate-pulse' : ''} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Modal
        open={isBrainOpen}
        onClose={() => setIsBrainOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
      >
        <Box
          sx={{
            width: '95%',
            maxWidth: '1200px',
            height: '85vh',
            bgcolor: '#000',
            border: '1px solid #00f2ff',
            boxShadow: '0 0 50px rgba(0, 242, 255, 0.2)',
            outline: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <MarketBrain
            symbol={activeSymbol}
            categoryType={currentCategoryData.type as CategoryType}
            lastPrice={price ?? NaN}
            feedStatus={priceLoading ? 'LOADING' : priceError ? 'ERROR' : 'OK'}
            feedError={priceError ?? undefined}
            onClose={() => setIsBrainOpen(false)}
          />
        </Box>
      </Modal>

      <Box sx={{ display: 'flex', height: '100vh', pt: '56px', overflow: 'hidden', bgcolor: '#000', position: 'relative' }}>
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: 0 }}>
          {isMobile ? (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              sx={{ '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#000', borderRight: '1px solid #222' } }}
            >
              {drawerContent}
            </Drawer>
          ) : (
            <Drawer
              variant="permanent"
              sx={{
                '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#000', borderRight: '1px solid #222', top: '56px', height: 'calc(100% - 56px)' }
              }}
            >
              {drawerContent}
            </Drawer>
          )}
        </Box>

        <Box component="main" sx={{ flexGrow: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {isLoading && <Loader />}

          <Split
            dir="column"
            persistKey="layout:topAreaPct"
            initialPct={68}
            minPct={35}
            maxPct={85}
            a={<Box sx={{ width: '100%', height: '100%', borderBottom: '1px solid #222', minHeight: 0 }}>{topArea}</Box>}
            b={<Box sx={{ width: '100%', height: '100%', bgcolor: '#080808', minHeight: 0 }}>{bottomArea}</Box>}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
