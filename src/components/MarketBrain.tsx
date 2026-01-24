// MarketBrain.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  LinearProgress,
  CircularProgress,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  useTheme,
  useMediaQuery,
  Button,
  FormControl,
  Select,
  MenuItem,
  type SelectChangeEvent
} from '@mui/material';
import {
  Psychology,
  FlashOn,
  AutoGraph,
  CheckCircleOutline,
  HighlightOff,
  Speed,
  ExitToApp,
  ArrowBack
} from '@mui/icons-material';

interface MarketBrainProps {
  symbol: string;
  categoryType: 'index' | 'forex' | 'crypto' | 'commodity' | 'stock';
  lastPrice: number;
  feedStatus?: 'OK' | 'LOADING' | 'ERROR';
  feedError?: string;
  onClose?: () => void;
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type TradingSpeed = 'SCALPING' | 'INTRADAY' | 'SWING' | 'POSITION';

interface AnalysisLog {
  component: string;
  status: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  detail: string;
}

interface AlphaSignal {
  bias: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  marketCondition: string;
  institutionalAction: string;
  analysisLogs: AnalysisLog[];
  keyLevels: { type: string; price: string; strength: string }[];
  entryType: 'MARKET' | 'LIMIT' | 'STOP';
  entryPrice: string;
  stopLoss: string;
  targets: { price: string; reward: string; prob: string }[];
  leverage: string;
  recommendedSize: string;
  volatilityIndex: number;
  riskScore: number;
  timeframe: Timeframe;
  speed: TradingSpeed;
  updatedAtISO: string;
  refPrice: string;
}

type PricePoint = { t: number; p: number };
type Candle = { t: number; o: number; h: number; l: number; c: number };

const TF_OPTIONS: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

const tfLabel = (tf: Timeframe) => {
  switch (tf) {
    case '1m':
      return '1m';
    case '5m':
      return '5m';
    case '15m':
      return '15m';
    case '1h':
      return '1H';
    case '4h':
      return '4H';
    case '1d':
      return '1D';
  }
};

const speedByTimeframe = (tf: Timeframe): TradingSpeed => {
  if (tf === '1m' || tf === '5m') return 'SCALPING';
  if (tf === '15m' || tf === '1h') return 'INTRADAY';
  if (tf === '4h') return 'SWING';
  return 'POSITION';
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const stringToHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const bucketKey = (tf: Timeframe, d: Date) => {
  const m = d.getMinutes();
  if (tf === '1m') return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${m}`;
  if (tf === '5m') return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${Math.floor(m / 5) * 5}`;
  if (tf === '15m') return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${Math.floor(m / 15) * 15}`;
  if (tf === '1h') return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}`;
  if (tf === '4h') return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${Math.floor(d.getHours() / 4) * 4}`;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const fmtSmart = (x: number) => {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x);
  const decimals = abs >= 1000 ? 1 : abs >= 100 ? 2 : 4;
  return x.toFixed(decimals);
};

const ema = (values: number[], period: number) => {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
};

const rsi = (values: number[], period = 14) => {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
};

const stdev = (values: number[]) => {
  if (values.length < 2) return 0;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((a, b) => a + (b - m) * (b - m), 0) / (values.length - 1);
  return Math.sqrt(v);
};

const tfMs = (tf: Timeframe) => {
  switch (tf) {
    case '1m':
      return 60_000;
    case '5m':
      return 5 * 60_000;
    case '15m':
      return 15 * 60_000;
    case '1h':
      return 60 * 60_000;
    case '4h':
      return 4 * 60 * 60_000;
    case '1d':
      return 24 * 60 * 60_000;
  }
};

const nextHigherTf = (tf: Timeframe): Timeframe => {
  if (tf === '1m') return '5m';
  if (tf === '5m') return '15m';
  if (tf === '15m') return '1h';
  if (tf === '1h') return '4h';
  if (tf === '4h') return '1d';
  return '1d';
};

const lookbackCandles = (tf: Timeframe) => {
  switch (tf) {
    case '1m':
      return 260;
    case '5m':
      return 240;
    case '15m':
      return 220;
    case '1h':
      return 200;
    case '4h':
      return 180;
    case '1d':
      return 160;
  }
};

const emaPeriodsByTf: Record<Timeframe, { fast: number; slow: number }> = {
  '1m': { fast: 9, slow: 21 },
  '5m': { fast: 12, slow: 36 },
  '15m': { fast: 12, slow: 48 },
  '1h': { fast: 20, slow: 60 },
  '4h': { fast: 24, slow: 72 },
  '1d': { fast: 20, slow: 100 }
};

const nowBucket = (tf: Timeframe, d = new Date()) => bucketKey(tf, d);

const stabilizeSignal = (prev: AlphaSignal | null, next: AlphaSignal): AlphaSignal => {
  if (!prev) return next;

  const alpha = 0.28;
  const smoothedConfidence = Math.round(prev.confidence * (1 - alpha) + next.confidence * alpha);

  const flipBlock = (prev.bias === 'LONG' && next.bias === 'SHORT') || (prev.bias === 'SHORT' && next.bias === 'LONG');

  if (flipBlock) {
    const required = 90;
    if (next.confidence < required) {
      return {
        ...next,
        bias: prev.bias,
        confidence: clamp(Math.max(52, smoothedConfidence - 10), 50, 96),
        marketCondition: `${next.marketCondition} · (bias locked)`
      };
    }
  }

  return { ...next, confidence: clamp(smoothedConfidence, 50, 96) };
};

const resampleCandles = (points: PricePoint[], tf: Timeframe, maxCandles: number): Candle[] => {
  if (points.length < 4) return [];
  const interval = tfMs(tf);
  const sorted = points.slice().sort((a, b) => a.t - b.t);
  const candles: Candle[] = [];

  let curBucket = Math.floor(sorted[0].t / interval) * interval;
  let o = sorted[0].p;
  let h = o;
  let l = o;
  let c = o;

  for (let i = 1; i < sorted.length; i++) {
    const pt = sorted[i];
    const b = Math.floor(pt.t / interval) * interval;
    if (b !== curBucket) {
      candles.push({ t: curBucket, o, h, l, c });
      curBucket = b;
      o = pt.p;
      h = pt.p;
      l = pt.p;
      c = pt.p;
    } else {
      h = Math.max(h, pt.p);
      l = Math.min(l, pt.p);
      c = pt.p;
    }
  }
  candles.push({ t: curBucket, o, h, l, c });

  if (candles.length > maxCandles) return candles.slice(-maxCandles);
  return candles;
};

const atr = (candles: Candle[], period: number) => {
  if (candles.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(cur.h - cur.l, Math.abs(cur.h - prev.c), Math.abs(cur.l - prev.c));
    trs.push(tr);
  }
  const w = trs.slice(-period);
  const avg = w.reduce((a, b) => a + b, 0) / w.length;
  return avg;
};

const linReg = (values: number[]) => {
  const n = values.length;
  if (n < 6) return { slope: 0, r2: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const y = values[i];
    const yHat = slope * i + intercept;
    ssTot += (y - meanY) * (y - meanY);
    ssRes += (y - yHat) * (y - yHat);
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, r2: clamp(r2, 0, 1) };
};

const buildLevels = (candles: Candle[], px: number, atrVal: number, tf: Timeframe) => {
  if (candles.length < 30 || !Number.isFinite(atrVal) || atrVal <= 0) {
    return [
      { type: 'POI', price: fmtSmart(px), strength: 'High' },
      { type: 'Above', price: fmtSmart(px * 1.002), strength: 'Low' },
      { type: 'Below', price: fmtSmart(px * 0.998), strength: 'Low' }
    ];
  }

  const w = tf === '1m' || tf === '5m' ? 2 : tf === '15m' ? 3 : 4;
  const pivots: { price: number; kind: 'H' | 'L'; t: number }[] = [];

  for (let i = w; i < candles.length - w; i++) {
    const hi = candles[i].h;
    const lo = candles[i].l;

    let isHigh = true;
    let isLow = true;

    for (let k = 1; k <= w; k++) {
      if (candles[i - k].h >= hi || candles[i + k].h >= hi) isHigh = false;
      if (candles[i - k].l <= lo || candles[i + k].l <= lo) isLow = false;
      if (!isHigh && !isLow) break;
    }

    if (isHigh) pivots.push({ price: hi, kind: 'H', t: candles[i].t });
    if (isLow) pivots.push({ price: lo, kind: 'L', t: candles[i].t });
  }

  const tol = Math.max(atrVal * 0.25, px * 0.0006);
  const clusters: { center: number; hits: number; kind: 'H' | 'L' | 'M'; lastT: number }[] = [];

  const addToCluster = (price: number, kind: 'H' | 'L', t: number) => {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      const dist = Math.abs(clusters[i].center - price);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestDist <= tol) {
      const c = clusters[bestIdx];
      const newHits = c.hits + 1;
      clusters[bestIdx] = {
        center: (c.center * c.hits + price) / newHits,
        hits: newHits,
        kind: c.kind === kind ? c.kind : 'M',
        lastT: Math.max(c.lastT, t)
      };
    } else {
      clusters.push({ center: price, hits: 1, kind, lastT: t });
    }
  };

  for (const p of pivots.slice(-180)) addToCluster(p.price, p.kind, p.t);

  const scored = clusters
    .map((c) => {
      const dist = Math.abs(c.center - px);
      const recency = candles.length > 0 ? (candles[candles.length - 1].t - c.lastT) / tfMs(tf) : 9999;
      const recencyScore = clamp(1 - recency / 220, 0, 1);
      const touchScore = clamp(c.hits / 6, 0, 1);
      const proximityScore = clamp(1 - dist / (tol * 8), 0, 1);
      const score = 0.45 * touchScore + 0.35 * recencyScore + 0.2 * proximityScore;
      return { ...c, score };
    })
    .sort((a, b) => b.score - a.score);

  const above = scored.filter((x) => x.center > px).slice(0, 2);
  const below = scored.filter((x) => x.center < px).slice(0, 2);
  const mid = scored.filter((x) => Math.abs(x.center - px) <= tol * 0.9).slice(0, 1);

  const strengthLabel = (s: number) => (s > 0.72 ? 'High' : s > 0.48 ? 'Medium' : 'Low');

  const levels: { type: string; price: string; strength: string }[] = [];
  if (mid[0]) levels.push({ type: 'POI', price: fmtSmart(mid[0].center), strength: strengthLabel(mid[0].score) });
  else levels.push({ type: 'POI', price: fmtSmart(px), strength: 'High' });

  for (const a of above) levels.push({ type: 'Resistance', price: fmtSmart(a.center), strength: strengthLabel(a.score) });
  for (const b of below) levels.push({ type: 'Support', price: fmtSmart(b.center), strength: strengthLabel(b.score) });

  while (levels.length < 3) {
    const k = levels.length === 1 ? px + atrVal * 1.4 : px - atrVal * 1.4;
    levels.push({ type: levels.length === 1 ? 'Liquidity Above' : 'Liquidity Below', price: fmtSmart(k), strength: 'Low' });
  }

  return levels.slice(0, 4);
};

const MarketBrain: React.FC<MarketBrainProps> = ({ symbol, categoryType, lastPrice, feedStatus = 'OK', feedError, onClose }) => {
  const [signal, setSignal] = useState<AlphaSignal | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scanText, setScanText] = useState('INITIALIZING...');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const priceRef = useRef<PricePoint[]>([]);
  const lastBucketRef = useRef<string | null>(null);

  const handleTimeframeChange = (e: SelectChangeEvent<Timeframe>) => {
    setTimeframe((e.target as HTMLSelectElement).value as Timeframe);
  };

  const pushPrice = (px: number) => {
    const arr = priceRef.current;
    const t = Date.now();
    const prev = arr.length ? arr[arr.length - 1] : null;
    if (prev && Math.abs(prev.p - px) === 0 && t - prev.t < 450) return;
    arr.push({ t, p: px });
    const cap = 6000;
    if (arr.length > cap) arr.splice(0, arr.length - cap);
  };

  useEffect(() => {
    if (Number.isFinite(lastPrice)) pushPrice(lastPrice);
  }, [lastPrice]);

  const generateExpertAnalysis = (tf: Timeframe, px: number): AlphaSignal => {
    const now = new Date();
    const points = priceRef.current;

    const candles = resampleCandles(points, tf, lookbackCandles(tf));
    const htf = nextHigherTf(tf);
    const htfCandles = tf === htf ? candles : resampleCandles(points, htf, lookbackCandles(htf));

    const closes = candles.map((c) => c.c);
    const hCloses = htfCandles.map((c) => c.c);

    const per = emaPeriodsByTf[tf];
    const hPer = emaPeriodsByTf[htf];

    const eFast = ema(closes, per.fast);
    const eSlow = ema(closes, per.slow);
    const hFast = ema(hCloses, hPer.fast);
    const hSlow = ema(hCloses, hPer.slow);

    const mom = rsi(closes, 14);
    const hMom = rsi(hCloses, 14);

    const ret = closes.length >= 2 ? closes.slice(1).map((v, i) => (v - closes[i]) / closes[i]) : [];
    const volPct = stdev(ret) * 100;

    const a = atr(candles, tf === '1m' ? 14 : tf === '5m' ? 14 : tf === '15m' ? 14 : tf === '1h' ? 16 : tf === '4h' ? 18 : 20);
    const atrPct = a ? (a / px) * 100 : 0;

    const regWindow = closes.slice(-Math.min(70, Math.max(24, Math.floor(closes.length * 0.45))));
    const { slope, r2 } = linReg(regWindow);
    const slopePct = px !== 0 ? (slope / px) * 100 : 0;

    const trendPct =
      eFast !== null && eSlow !== null && Number.isFinite(px) && px !== 0 ? ((eFast - eSlow) / px) * 100 : 0;
    const hTrendPct =
      hFast !== null && hSlow !== null && Number.isFinite(px) && px !== 0 ? ((hFast - hSlow) / px) * 100 : 0;

    const trendDir = trendPct > 0 ? (1 as const) : trendPct < 0 ? (-1 as const) : (0 as const);
    const hTrendDir = hTrendPct > 0 ? (1 as const) : hTrendPct < 0 ? (-1 as const) : (0 as const);

    const regime =
      r2 > 0.62 && Math.abs(slopePct) > (tf === '1d' ? 0.02 : tf === '4h' ? 0.012 : tf === '1h' ? 0.007 : 0.004)
        ? 'TREND'
        : 'RANGE';

    const htfAligned = trendDir !== 0 && trendDir === hTrendDir;

    const momScore =
      mom === null ? 0 : mom >= 60 ? 2 : mom >= 54 ? 1 : mom <= 40 ? -2 : mom <= 46 ? -1 : 0;

    const hMomScore =
      hMom === null ? 0 : hMom >= 58 ? 1 : hMom <= 42 ? -1 : 0;

    const trendScore =
      Math.abs(trendPct) > (tf === '1d' ? 0.08 : tf === '4h' ? 0.055 : tf === '1h' ? 0.04 : tf === '15m' ? 0.03 : tf === '5m' ? 0.02 : 0.014)
        ? trendDir * (regime === 'TREND' ? 3 : 2)
        : trendDir * (regime === 'TREND' ? 1 : 0);

    const htfScore =
      Math.abs(hTrendPct) > (htf === '1d' ? 0.08 : htf === '4h' ? 0.055 : htf === '1h' ? 0.04 : 0.03)
        ? hTrendDir * 2
        : hTrendDir * 1;

    const volPenalty = clamp((volPct * 6 + atrPct * 10) * (tf === '1m' ? 1.15 : tf === '5m' ? 1.05 : 1.0), 0, 22);
    const dataPenalty = closes.length < Math.max(60, per.slow) ? clamp((Math.max(60, per.slow) - closes.length) * 0.55, 0, 18) : 0;

    let score = 0;
    score += trendScore;
    score += momScore;
    score += 0.7 * htfScore;
    score += 0.55 * hMomScore;

    if (regime === 'RANGE') score *= 0.75;
    if (trendDir !== 0 && hTrendDir !== 0 && !htfAligned) score -= 1.4;
    if (htfAligned) score += 0.9;

    const bias: AlphaSignal['bias'] = score >= 2.2 ? 'LONG' : score <= -2.2 ? 'SHORT' : 'NEUTRAL';

    const strengthBoost = clamp((Math.abs(score) / 7) * 28, 0, 28);
    const trendBoost = clamp(Math.abs(trendPct) * 520, 0, 16);
    const regimeBoost = regime === 'TREND' ? clamp(r2 * 12, 0, 12) : clamp((1 - r2) * 6, 0, 6);
    const alignBoost = htfAligned && bias !== 'NEUTRAL' ? 8 : 0;

    const base = 58 + strengthBoost + trendBoost + regimeBoost + alignBoost;
    const confidence = clamp(Math.round(base - volPenalty - dataPenalty), 50, 96);

    const volIndex = clamp(Math.round((volPct * 260 + atrPct * 520) * (tf === '1d' ? 0.85 : 1.0)), 10, 88);

    const tfMult: Record<Timeframe, number> = { '1m': 0.7, '5m': 0.95, '15m': 1.15, '1h': 1.55, '4h': 2.05, '1d': 3.1 };
    const speedMult: Record<TradingSpeed, number> = { SCALPING: 0.9, INTRADAY: 1.0, SWING: 1.22, POSITION: 1.55 };

    const atrVal = a ?? Math.max(px * 0.0012, px * (volIndex / 10000));
    const baseStep = Math.max(atrVal, px * 0.0008);
    const step = baseStep * tfMult[tf] * speedMult[speedByTimeframe(tf)] * (regime === 'RANGE' ? 0.92 : 1.05);

    const last = candles.length ? candles[candles.length - 1] : null;
    const mid = last ? (last.h + last.l) / 2 : px;

    const entryType: AlphaSignal['entryType'] =
      bias === 'NEUTRAL' ? 'MARKET' : regime === 'TREND' ? 'LIMIT' : 'LIMIT';

    const pullback =
      bias === 'LONG'
        ? Math.min(px, mid) - step * (tf === '1m' ? 0.08 : tf === '5m' ? 0.1 : 0.12)
        : bias === 'SHORT'
          ? Math.max(px, mid) + step * (tf === '1m' ? 0.08 : tf === '5m' ? 0.1 : 0.12)
          : px;

    const entry = bias === 'NEUTRAL' ? px : pullback;

    const slBase = step * (bias === 'NEUTRAL' ? 1.0 : regime === 'TREND' ? 1.35 : 1.2);
    const stopLoss = bias === 'LONG' ? entry - slBase : bias === 'SHORT' ? entry + slBase : entry - slBase;

    const rr1 = regime === 'TREND' ? 2.2 : 1.8;
    const rr2 = regime === 'TREND' ? 4.8 : 3.8;

    const tp1Distance = slBase * rr1;
    const tp2Distance = slBase * rr2;

    const tp1 = bias === 'LONG' ? entry + tp1Distance : bias === 'SHORT' ? entry - tp1Distance : entry + tp1Distance;
    const tp2 = bias === 'LONG' ? entry + tp2Distance : bias === 'SHORT' ? entry - tp2Distance : entry + tp2Distance;

    const riskScore = clamp(
      Math.max(
        1,
        10 -
          Math.floor(confidence / 10) +
          (speedByTimeframe(tf) === 'SCALPING' ? 1 : 0) +
          (volIndex > 70 ? 1 : 0)
      ),
      1,
      5
    );

    const leverage =
      categoryType === 'crypto'
        ? speedByTimeframe(tf) === 'SCALPING'
          ? '3x'
          : speedByTimeframe(tf) === 'INTRADAY'
            ? '5x'
            : '4x'
        : categoryType === 'forex'
          ? speedByTimeframe(tf) === 'SCALPING'
            ? '15x'
            : speedByTimeframe(tf) === 'INTRADAY'
              ? '25x'
              : '20x'
          : speedByTimeframe(tf) === 'POSITION'
            ? '5x'
            : '10x';

    const recommendedSize =
      confidence >= 92
        ? speedByTimeframe(tf) === 'SCALPING'
          ? '0.5%'
          : speedByTimeframe(tf) === 'POSITION'
            ? '1%'
            : '2%'
        : confidence >= 84
          ? speedByTimeframe(tf) === 'SCALPING'
            ? '0.5%'
            : '1%'
          : '0.5%';

    const trendStatus: AnalysisLog['status'] = trendDir > 0 ? 'BULLISH' : trendDir < 0 ? 'BEARISH' : 'NEUTRAL';
    const htfStatus: AnalysisLog['status'] = hTrendDir > 0 ? 'BULLISH' : hTrendDir < 0 ? 'BEARISH' : 'NEUTRAL';

    const logs: AnalysisLog[] = [
      {
        component: `Structure (${tfLabel(tf)})`,
        status: trendStatus,
        detail: `EMA spread: ${trendPct.toFixed(3)}% · slope: ${slopePct.toFixed(3)}% · R²: ${(r2 * 100).toFixed(0)}`
      },
      {
        component: `HTF Filter (${tfLabel(htf)})`,
        status: htfStatus,
        detail: `HTF spread: ${hTrendPct.toFixed(3)}% · align: ${htfAligned ? 'YES' : 'NO'}`
      },
      {
        component: 'Momentum',
        status: mom !== null ? (mom >= 60 ? 'BULLISH' : mom <= 40 ? 'BEARISH' : 'NEUTRAL') : 'NEUTRAL',
        detail: mom !== null ? `RSI(14): ${mom.toFixed(1)} · HTF: ${hMom !== null ? hMom.toFixed(1) : '—'}` : 'RSI: insufficient data'
      },
      {
        component: 'Volatility',
        status: volIndex > 70 ? 'BEARISH' : volIndex < 28 ? 'BULLISH' : 'NEUTRAL',
        detail: `σ: ${volPct.toFixed(3)}% · ATR: ${atrPct.toFixed(3)}% · VI: ${volIndex}`
      },
      {
        component: 'Regime',
        status: regime === 'TREND' ? trendStatus : 'NEUTRAL',
        detail: regime === 'TREND' ? 'Trend regime (continuation bias)' : 'Range regime (mean reversion bias)'
      }
    ];

    const levels = buildLevels(candles, px, atrVal, tf);

    const marketCondition = `${tfLabel(tf)} · ${regime} · ${volIndex > 70 ? 'High Vol' : volIndex < 28 ? 'Low Vol' : 'Normal'}`;
    const institutionalAction =
      regime === 'TREND'
        ? htfAligned
          ? 'HTF Trend Participation'
          : 'Cautious Trend Probe'
        : volIndex > 70
          ? 'Risk-Off Liquidity'
          : 'Liquidity / Mean Reversion';

    const prob1 = clamp(Math.round(confidence * (regime === 'TREND' ? 0.82 : 0.74)), 48, 88);
    const prob2 = clamp(Math.round(confidence * (regime === 'TREND' ? 0.42 : 0.33)), 10, 52);

    return {
      bias,
      confidence,
      marketCondition,
      institutionalAction,
      analysisLogs: logs,
      keyLevels: levels.map((l) => ({ type: l.type, price: l.price, strength: l.strength })),
      entryType,
      entryPrice: fmtSmart(entry),
      stopLoss: fmtSmart(stopLoss),
      targets: [
        { price: fmtSmart(tp1), reward: `1:${rr1.toFixed(1)}`, prob: `${prob1}%` },
        { price: fmtSmart(tp2), reward: `1:${rr2.toFixed(1)}`, prob: `${prob2}%` }
      ],
      leverage,
      recommendedSize,
      volatilityIndex: volIndex,
      riskScore,
      timeframe: tf,
      speed: speedByTimeframe(tf),
      updatedAtISO: now.toISOString(),
      refPrice: fmtSmart(px)
    };
  };

  const softUpdate = (prev: AlphaSignal, px: number): AlphaSignal => {
    const updated = generateExpertAnalysis(prev.timeframe, px);
    return {
      ...prev,
      refPrice: fmtSmart(px),
      entryType: updated.entryType,
      entryPrice: updated.entryPrice,
      stopLoss: updated.stopLoss,
      targets: updated.targets,
      keyLevels: updated.keyLevels,
      marketCondition: updated.marketCondition,
      institutionalAction: updated.institutionalAction,
      analysisLogs: updated.analysisLogs,
      volatilityIndex: updated.volatilityIndex,
      riskScore: updated.riskScore,
      confidence: updated.confidence,
      bias: updated.bias,
      updatedAtISO: new Date().toISOString()
    };
  };

  const runScan = () => {
    setIsScanning(true);
    const steps = [
      'Connecting to Neural Network...',
      'Building timeframe candles...',
      'Extracting HTF/LTF context...',
      'Scanning regime & liquidity...',
      'Generating execution plan...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setScanText(steps[i]);
        i++;
      } else {
        clearInterval(interval);
        if (Number.isFinite(lastPrice)) {
          const b = nowBucket(timeframe);
          lastBucketRef.current = b;
          setSignal((prev) => stabilizeSignal(prev, generateExpertAnalysis(timeframe, lastPrice)));
        }
        setIsScanning(false);
      }
    }, 240);
    return () => clearInterval(interval);
  };

  useEffect(() => {
    const cleanup = runScan();
    return cleanup;
  }, [symbol, categoryType, timeframe]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!Number.isFinite(lastPrice)) return;

      const b = nowBucket(timeframe);
      if (lastBucketRef.current !== b) {
        lastBucketRef.current = b;
        setSignal((prev) => stabilizeSignal(prev, generateExpertAnalysis(timeframe, lastPrice)));
      } else {
        setSignal((prev) => (prev ? softUpdate(prev, lastPrice) : prev));
      }
    }, 1000);

    return () => clearInterval(t);
  }, [symbol, categoryType, timeframe, lastPrice]);

  if (isScanning) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#000', p: 4, zIndex: 99999 }}>
        <CircularProgress size={60} sx={{ color: '#00f2ff', mb: 2 }} thickness={2} />
        <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#fff', letterSpacing: 3, textAlign: 'center' }}>
          AI_BRAIN ANALYZING
        </Typography>
        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold', mt: 1 }}>
          {symbol}
        </Typography>
        <Typography variant="caption" sx={{ color: '#00f2ff', mt: 2, fontFamily: 'monospace', textAlign: 'center' }}>
          {`>> ${scanText}`}
        </Typography>
        <LinearProgress sx={{ width: '100%', maxWidth: '300px', mt: 3, bgcolor: '#111', '& .MuiLinearProgress-bar': { bgcolor: '#00f2ff' } }} />
      </Box>
    );
  }

  const mainColor = signal?.bias === 'LONG' ? '#00ff41' : signal?.bias === 'SHORT' ? '#ff0044' : '#888';

  if (!Number.isFinite(lastPrice)) {
    return (
      <Box sx={{ width: '100%', height: '100%', bgcolor: '#000', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: '#050505', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={2}>
            {onClose && (
              <IconButton onClick={onClose} sx={{ color: '#fff', bgcolor: '#222', border: '1px solid #333', width: 40, height: 40 }}>
                <ArrowBack />
              </IconButton>
            )}
            <Box display="flex" alignItems="center" gap={1}>
              <Psychology sx={{ color: '#ff0055' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff' }}>
                MARKET BRAIN
              </Typography>
            </Box>
          </Box>
          <Chip label="FEED" size="small" sx={{ bgcolor: '#111', color: '#ff0055', border: '1px solid #333' }} variant="outlined" />
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Box sx={{ maxWidth: 560, width: '100%', border: '1px solid #222', bgcolor: '#050505', p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
              Prezzo non disponibile
            </Typography>
            <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
              Status: {feedStatus}
            </Typography>
            {feedError && (
              <Typography variant="body2" sx={{ color: '#ff0055', fontFamily: 'monospace' }}>
                {feedError}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ flexShrink: 0, p: 2, bgcolor: '#000', borderTop: '1px solid #222', display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={onClose}
            startIcon={<ExitToApp />}
            fullWidth
            sx={{ height: 48, fontWeight: 'bold', letterSpacing: 1, borderColor: '#333', color: '#fff', '&:hover': { bgcolor: '#220000', borderColor: '#ff0055', color: '#ff0055' } }}
          >
            CLOSE ANALYSIS
          </Button>
        </Box>
      </Box>
    );
  }

  if (!signal) return null;

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 2147483647 }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: '#050505', borderBottom: '1px solid #222', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
        <Box display="flex" alignItems="center" gap={2}>
          {onClose && (
            <IconButton onClick={onClose} sx={{ color: '#fff', bgcolor: '#222', border: '1px solid #333', width: 40, height: 40, '&:hover': { color: '#ff0055', bgcolor: '#333', borderColor: '#ff0055' } }}>
              <ArrowBack />
            </IconButton>
          )}
          <Box display="flex" alignItems="center" gap={1}>
            <Psychology sx={{ color: mainColor }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', letterSpacing: 1, lineHeight: 1 }}>
                MARKET BRAIN
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666', fontSize: '0.65rem' }}>
                ID: {stringToHash(symbol)} · REF: {signal.refPrice}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1.25}>
          <Chip label={signal.speed} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#111', color: '#ddd', border: '1px solid #333' }} variant="outlined" />
          <FormControl size="small" sx={{ minWidth: 92 }}>
            <Select
              value={timeframe}
              onChange={handleTimeframeChange}
              sx={{ height: 30, color: '#fff', bgcolor: '#111', border: '1px solid #333', '.MuiOutlinedInput-notchedOutline': { border: 'none' }, '.MuiSvgIcon-root': { color: '#777' } }}
              MenuProps={{ PaperProps: { sx: { bgcolor: '#0b0b0b', border: '1px solid #222', color: '#fff' } } }}
            >
              {TF_OPTIONS.map((tf) => (
                <MenuItem key={tf} value={tf} sx={{ fontFamily: 'monospace' }}>
                  {tfLabel(tf)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Chip label={feedStatus} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#222', color: feedStatus === 'OK' ? '#00ff41' : feedStatus === 'LOADING' ? '#ff9900' : '#ff0055', display: { xs: 'none', sm: 'flex' } }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 40 }}>
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, position: 'relative', zIndex: 40 }}>
          <Box sx={{ width: { xs: '100%', md: '25%' }, borderRight: { md: '1px solid #222' }, borderBottom: { xs: '1px solid #222', md: 'none' }, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', minHeight: { xs: 'auto', md: '500px' } }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle at center, ${mainColor}15 0%, transparent 70%)`, zIndex: 0 }} />
            <Box sx={{ zIndex: 1, textAlign: 'center', py: { xs: 2, md: 0 } }}>
              <Typography variant="overline" color="textSecondary" letterSpacing={2} sx={{ fontSize: '0.7rem' }}>
                BIAS DETECTED
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, color: mainColor, letterSpacing: -1, my: 1, fontSize: { xs: '2.8rem', md: '3.75rem' } }}>
                {signal.bias}
              </Typography>

              <Box display="flex" justifyContent="center" alignItems="center" mb={2} width="100%">
                <Chip label={`${signal.marketCondition} · ${signal.timeframe}`} sx={{ borderColor: '#333', color: '#ccc', bgcolor: 'rgba(0,0,0,0.5)', maxWidth: '100%' }} variant="outlined" />
              </Box>

              <Box position="relative" display="inline-flex" flexDirection="column" alignItems="center">
                <CircularProgress variant="determinate" value={signal.confidence} size={isMobile ? 80 : 100} thickness={3} sx={{ color: mainColor }} />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold" color="white">
                    {signal.confidence}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary" fontSize="0.6rem">
                    CONFIDENCE
                  </Typography>
                </Box>
              </Box>

              <Box mt={2} p={1.5} bgcolor="rgba(255,255,255,0.05)" borderRadius={1} border="1px solid #222">
                <Typography variant="caption" display="block" color="#aaa" gutterBottom sx={{ fontSize: '0.65rem' }}>
                  UPDATED
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="#fff" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {new Date(signal.updatedAtISO).toLocaleString()}
                </Typography>
              </Box>

              <Box mt={2} p={1.5} bgcolor="rgba(255,255,255,0.05)" borderRadius={1} border="1px solid #222">
                <Typography variant="caption" display="block" color="#aaa" gutterBottom sx={{ fontSize: '0.65rem' }}>
                  INSTITUTIONAL FOOTPRINT
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="#fff">
                  {signal.institutionalAction}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '41.6667%' }, borderRight: { md: '1px solid #222' }, borderBottom: { xs: '1px solid #222', md: 'none' }, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1.5, bgcolor: '#050505', borderBottom: '1px solid #222' }}>
              <Typography variant="caption" sx={{ color: '#00f2ff', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                <AutoGraph fontSize="small" /> LOGIC & REASONING CHAIN
              </Typography>
            </Box>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <List dense disablePadding>
                {signal.analysisLogs.map((log, idx) => (
                  <ListItem key={idx} sx={{ borderLeft: `3px solid ${log.status === 'BULLISH' ? '#00ff41' : log.status === 'BEARISH' ? '#ff0044' : '#666'}`, bgcolor: '#0a0a0a', mb: 1.5, borderRadius: '0 4px 4px 0', py: 1.5, border: '1px solid #1a1a1a', borderLeftWidth: '3px' }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {log.status === 'NEUTRAL' ? <Speed sx={{ fontSize: 18, color: '#666' }} /> : log.status === 'BULLISH' ? <CheckCircleOutline sx={{ fontSize: 18, color: '#00ff41' }} /> : <HighlightOff sx={{ fontSize: 18, color: '#ff0044' }} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" color="#fff" fontWeight="bold">
                            {log.component}
                          </Typography>
                          <Chip label={log.status} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 'bold', ml: 1, color: log.status === 'BULLISH' ? '#00ff41' : log.status === 'BEARISH' ? '#ff0044' : '#888', bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid #333' }} />
                        </Box>
                      }
                      secondary={<Typography variant="caption" color="#999" sx={{ lineHeight: 1.2, display: 'block', mt: 0.5 }}>{log.detail}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2.5, borderColor: '#222' }} />

              <Typography variant="caption" color="textSecondary" sx={{ mb: 1.5, display: 'block', fontWeight: 'bold' }}>
                KEY LEVELS
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {signal.keyLevels.map((lvl, idx) => (
                  <Box key={idx} sx={{ flex: '1 1 30%', p: 1, border: '1px solid #222', bgcolor: '#080808', borderRadius: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem', mb: 0.5 }} color="#00f2ff">
                      {lvl.type.split(' ')[0]}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="white">
                      {lvl.price}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '33.3333%' }, display: 'flex', flexDirection: 'column', bgcolor: '#050505' }}>
            <Box sx={{ p: 1.5, bgcolor: '#080808', borderBottom: '1px solid #222' }}>
              <Typography variant="caption" sx={{ color: '#ff0055', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                <FlashOn fontSize="small" /> EXECUTION PLAN
              </Typography>
            </Box>

            <Box sx={{ p: { xs: 2, md: 3 }, flex: 1, pb: 4 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: '#333', bgcolor: '#000', borderRadius: 0 }}>
                  <Typography variant="caption" color="#888" fontWeight="bold">
                    ENTRY ({signal.entryType})
                  </Typography>
                  <Typography variant="h6" color="#fff" sx={{ mt: 0.5 }}>
                    {signal.entryPrice}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: 'rgba(255,0,0,0.3)', bgcolor: 'rgba(255,0,0,0.05)', borderRadius: 0 }}>
                  <Typography variant="caption" color="#ff4444" fontWeight="bold">
                    STOP LOSS
                  </Typography>
                  <Typography variant="h6" color="#ff4444" sx={{ mt: 0.5 }}>
                    {signal.stopLoss}
                  </Typography>
                </Paper>
              </Box>

              <Stack spacing={1} sx={{ mb: 2.5 }}>
                {signal.targets.map((tp, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderLeft: '3px solid #00f2ff', bgcolor: '#0a0a0a', border: '1px solid #1a1a1a', borderLeftWidth: '3px' }}>
                    <Typography variant="caption" color="#aaa">
                      TAKE PROFIT {i + 1}
                    </Typography>
                    <Typography variant="body2" color="#fff" fontWeight="bold" fontSize="1rem">
                      {tp.price}
                    </Typography>
                    <Chip label={`R:R ${tp.reward}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#000', border: '1px solid #333', color: '#00f2ff' }} />
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ borderColor: '#222', mb: 2.5 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#0a0a0a" p={2} borderRadius={1} border="1px solid #222">
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                    SIZE
                  </Typography>
                  <Typography variant="body1" color="white" fontWeight="bold">
                    {signal.recommendedSize}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: '#333' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                    LEV
                  </Typography>
                  <Typography variant="body1" color="white" fontWeight="bold">
                    {signal.leverage}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ borderColor: '#333' }} />
                <Box textAlign="right">
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                    RISK
                  </Typography>
                  <Box display="flex" gap={0.5} mt={0.5} justifyContent="flex-end">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Box key={v} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: v <= signal.riskScore ? (signal.riskScore > 3 ? '#ff0044' : '#ff9900') : '#333' }} />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexShrink: 0, p: 2, bgcolor: '#000', borderTop: '1px solid #222', display: 'flex', justifyContent: 'center', zIndex: 100 }}>
        <Button variant="outlined" color="error" onClick={onClose} startIcon={<ExitToApp />} fullWidth sx={{ height: 48, fontWeight: 'bold', letterSpacing: 1, borderColor: '#333', color: '#fff', '&:hover': { bgcolor: '#220000', borderColor: '#ff0055', color: '#ff0055' } }}>
          CLOSE ANALYSIS
        </Button>
      </Box>
    </Box>
  );
};

export default MarketBrain;
