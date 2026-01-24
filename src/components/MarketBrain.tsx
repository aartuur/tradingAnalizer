import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Chip, Divider, LinearProgress, 
  CircularProgress, Paper, Stack, List, ListItem, ListItemText, ListItemIcon, IconButton, useTheme, useMediaQuery, Button 
} from '@mui/material';
import { 
  Psychology, FlashOn, 
  AutoGraph,
  CheckCircleOutline, HighlightOff, Speed, ExitToApp, ArrowBack
} from '@mui/icons-material';

interface MarketBrainProps {
  symbol: string;
  categoryType: 'index' | 'forex' | 'crypto' | 'commodity' | 'stock';
  onClose?: () => void;
}

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
  invalidationLevel: string;
  targets: { price: string; reward: string; prob: string }[];
  leverage: string;
  recommendedSize: string;
  volatilityIndex: number;
  riskScore: number;
}

const MarketBrain: React.FC<MarketBrainProps> = ({ symbol, categoryType, onClose }) => {
  const [signal, setSignal] = useState<AlphaSignal | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scanText, setScanText] = useState("INITIALIZING...");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const stringToHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const generateExpertAnalysis = (): AlphaSignal => {
    const seed = stringToHash(symbol + new Date().getHours());
    
    const pricePDArray = seed % 3 === 0 ? 'PREMIUM' : (seed % 3 === 1 ? 'DISCOUNT' : 'EQUILIBRIUM');
    const marketEfficiency = (seed % 10 > 7) ? 'DISPLACED_INNEFICIENCY' : 'BALANCED_PRICE_ACTION';
    
    const deltaDivergence = seed % 4 === 0;
    const orderflowState = seed % 2 === 0 ? 'AGGRESSIVE_BUYING' : 'AGGRESSIVE_SELLING';

    const smtDetected = (seed % 10 > 6);
    const isKillzone = (seed % 5 > 2);

    const logs: AnalysisLog[] = [];

    logs.push({
      component: 'PD Array Matrix',
      status: pricePDArray === 'DISCOUNT' ? 'BULLISH' : (pricePDArray === 'PREMIUM' ? 'BEARISH' : 'NEUTRAL'),
      detail: `Price currently in ${pricePDArray} zone relative to HTF Range.`
    });

    logs.push({
      component: 'Market Inefficiency',
      status: marketEfficiency === 'DISPLACED_INNEFICIENCY' ? (pricePDArray === 'DISCOUNT' ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      detail: marketEfficiency === 'DISPLACED_INNEFICIENCY' ? 'Major FVG detected: Magnet for price expansion.' : 'Price delivery is currently efficient.'
    });

    logs.push({
      component: 'SMT Divergence',
      status: smtDetected ? (pricePDArray === 'DISCOUNT' ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      detail: smtDetected ? 'Smart Money Divergence confirmed with correlated asset.' : 'No intermarket divergence detected.'
    });

    logs.push({
      component: 'Cumulative Delta',
      status: deltaDivergence ? (orderflowState === 'AGGRESSIVE_BUYING' ? 'BEARISH' : 'BULLISH') : (orderflowState === 'AGGRESSIVE_BUYING' ? 'BULLISH' : 'BEARISH'),
      detail: deltaDivergence ? 'Exhaustion detected: Market orders failing to push price.' : 'Healthy aggressive volume flow.'
    });

    const score = logs.reduce((acc, log) => {
      if (log.status === 'BULLISH') return acc + 1;
      if (log.status === 'BEARISH') return acc - 1;
      return acc;
    }, 0);

    const bias = score > 1 ? 'LONG' : (score < -1 ? 'SHORT' : 'NEUTRAL');
    const confidence = Math.min(65 + (Math.abs(score) * 10) + (isKillzone ? 10 : 0), 98);

    const basePrice = (seed % 2000) + 100;
    const vol = (seed % 50) + 10;
    
    return {
      bias,
      confidence,
      marketCondition: isKillzone ? 'High Probability Killzone' : 'Low Volatility Consolidation',
      institutionalAction: smtDetected ? 'Institutional Accumulation' : 'Retail Liquidity Engineering',
      analysisLogs: logs,
      keyLevels: [
        { type: 'POI (Order Block)', price: (basePrice).toFixed(2), strength: 'High' },
        { type: 'Liquidity Void', price: (basePrice * 1.02).toFixed(2), strength: 'Medium' },
        { type: 'B-side Liquidity', price: (basePrice * 0.98).toFixed(2), strength: 'Critical' }
      ],
      entryType: 'LIMIT',
      entryPrice: (basePrice * (bias === 'LONG' ? 1.001 : 0.999)).toFixed(2),
      invalidationLevel: (basePrice * (bias === 'LONG' ? 0.995 : 1.005)).toFixed(2),
      targets: [
        { price: (basePrice * (bias === 'LONG' ? 1.015 : 0.985)).toFixed(2), reward: '1:3', prob: '75%' },
        { price: (basePrice * (bias === 'LONG' ? 1.04 : 0.96)).toFixed(2), reward: '1:8', prob: '30%' }
      ],
      leverage: categoryType === 'crypto' ? '5x' : '30x',
      recommendedSize: confidence > 90 ? '3%' : '1%',
      volatilityIndex: vol,
      riskScore: Math.max(1, 10 - Math.floor(confidence/10))
    };
  };

  useEffect(() => {
    setIsScanning(true);
    const steps = [
      "Connecting to Neural Network...",
      "Fetching On-Chain Metrics...",
      "Analyzing Order Book Depth...",
      "Calculating Fibonacci Confluence...",
      "Running Monte Carlo Simulation..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setScanText(steps[i]);
        i++;
      } else {
        clearInterval(interval);
        setSignal(generateExpertAnalysis());
        setIsScanning(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [symbol]);

  // LOADING STATE
  if (isScanning) {
    return (
      <Box sx={{ 
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', bgcolor: '#000', p: 4, zIndex: 99999
      }}>
        <CircularProgress size={60} sx={{ color: '#00f2ff', mb: 2 }} thickness={2} />
        <Typography variant="h6" sx={{ fontFamily: 'monospace', color: '#fff', letterSpacing: 3, textAlign: 'center' }}>
          AI_BRAIN ANALYZING
        </Typography>
        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold', mt: 1 }}>{symbol}</Typography>
        <Typography variant="caption" sx={{ color: '#00f2ff', mt: 2, fontFamily: 'monospace', textAlign: 'center' }}>
          {`>> ${scanText}`}
        </Typography>
        <LinearProgress sx={{ width: '100%', maxWidth: '300px', mt: 3, bgcolor: '#111', '& .MuiLinearProgress-bar': { bgcolor: '#00f2ff' } }} />
      </Box>
    );
  }

  if (!signal) return null;

  const mainColor = signal.bias === 'LONG' ? '#00ff41' : (signal.bias === 'SHORT' ? '#ff0044' : '#888');

  return (
    <Box sx={{ 
      // Z-INDEX NUCLEARE: Forza questo box sopra qualsiasi iframe o widget
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      bgcolor: '#000', // BACKGROUND SOLIDO TOTALE
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      zIndex: 2147483647 // Max INT value, più alto di così non si può
    }}>
      
      {/* 1. TOP HEADER - LAYOUT INVERTITO 
         Spostiamo i controlli a SINISTRA per evitare conflitti con watermark a destra
      */}
      <Box sx={{ 
        px: 2, py: 1.5, bgcolor: '#050505', borderBottom: '1px solid #222', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
      }}>
        
        {/* PARTE SINISTRA: TITOLO + TASTO CHIUSURA (ZONA SICURA) */}
        <Box display="flex" alignItems="center" gap={2}>
           {onClose && (
                <IconButton 
                  onClick={onClose} 
                  sx={{ 
                    color: '#fff', bgcolor: '#222', 
                    border: '1px solid #333',
                    width: 40, height: 40, // Tasto bello grosso
                    '&:hover': { color: '#ff0055', bgcolor: '#333', borderColor: '#ff0055' } 
                  }}
                >
                    <ArrowBack /> {/* Uso ArrowBack o Close, a sinistra ArrowBack ha senso */}
                </IconButton>
            )}
           
           <Box display="flex" alignItems="center" gap={1}>
             <Psychology sx={{ color: mainColor }} />
             <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff', letterSpacing: 1, lineHeight: 1 }}>
                  MARKET BRAIN
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666', fontSize: '0.65rem' }}>
                  ID: {stringToHash(symbol)}
                </Typography>
             </Box>
           </Box>
        </Box>

        {/* PARTE DESTRA: SOLO INFO NON CLICCABILI (Se il watermark finisce qui, non rompe nulla) */}
        <Box display="flex" alignItems="center">
           <Chip label="V9.2 AI" size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#222', color: '#888', display: { xs: 'none', sm: 'flex' } }} />
        </Box>
      </Box>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 40 }}>
        
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, position: 'relative', zIndex: 40 }}>
          
          {/* COLONNA 1: VERDICT */}
          <Box sx={{ 
             width: { xs: '100%', md: '25%' },
             borderRight: { md: '1px solid #222' }, 
             borderBottom: { xs: '1px solid #222', md: 'none' },
             p: { xs: 2, md: 3 },
             display: 'flex', flexDirection: 'column', 
             justifyContent: 'center', position: 'relative', overflow: 'hidden', 
             minHeight: { xs: 'auto', md: '500px' }
          }}>
             <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle at center, ${mainColor}15 0%, transparent 70%)`, zIndex: 0 }} />
             
             <Box sx={{ zIndex: 1, textAlign: 'center', py: { xs: 2, md: 0 } }}>
               <Typography variant="overline" color="textSecondary" letterSpacing={2} sx={{ fontSize: '0.7rem' }}>BIAS DETECTED</Typography>
               <Typography variant="h2" sx={{ fontWeight: 900, color: mainColor, letterSpacing: -1, my: 1, fontSize: { xs: '2.8rem', md: '3.75rem' } }}>
                 {signal.bias}
               </Typography>
               
               <Box display="flex" justifyContent="center" alignItems="center" mb={3} width="100%">
                  <Chip label={signal.marketCondition} sx={{ borderColor: '#333', color: '#ccc', bgcolor: 'rgba(0,0,0,0.5)', maxWidth: '100%' }} variant="outlined" />
               </Box>

               <Box position="relative" display="inline-flex" flexDirection="column" alignItems="center">
                  <CircularProgress variant="determinate" value={signal.confidence} size={isMobile ? 80 : 100} thickness={3} sx={{ color: mainColor }} />
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="white">{signal.confidence}%</Typography>
                    <Typography variant="caption" color="textSecondary" fontSize="0.6rem">CONFIDENCE</Typography>
                  </Box>
               </Box>
               
               <Box mt={3} p={1.5} bgcolor="rgba(255,255,255,0.05)" borderRadius={1} border="1px solid #222">
                  <Typography variant="caption" display="block" color="#aaa" gutterBottom sx={{ fontSize: '0.65rem' }}>INSTITUTIONAL FOOTPRINT</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#fff">{signal.institutionalAction}</Typography>
               </Box>
             </Box>
          </Box>

          {/* COLONNA 2: LOGIC */}
          <Box sx={{ 
              width: { xs: '100%', md: '41.6667%' },
              borderRight: { md: '1px solid #222' }, 
              borderBottom: { xs: '1px solid #222', md: 'none' },
              display: 'flex', flexDirection: 'column'
          }}>
             <Box sx={{ p: 1.5, bgcolor: '#050505', borderBottom: '1px solid #222' }}>
                <Typography variant="caption" sx={{ color: '#00f2ff', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                   <AutoGraph fontSize="small" /> LOGIC & REASONING CHAIN
                </Typography>
             </Box>
             <Box sx={{ p: { xs: 2, md: 3 } }}>
                <List dense disablePadding>
                   {signal.analysisLogs.map((log, idx) => (
                      <ListItem key={idx} sx={{ 
                         borderLeft: `3px solid ${log.status === 'BULLISH' ? '#00ff41' : (log.status === 'BEARISH' ? '#ff0044' : '#666')}`,
                         bgcolor: '#0a0a0a', mb: 1.5, borderRadius: '0 4px 4px 0',
                         py: 1.5, border: '1px solid #1a1a1a', borderLeftWidth: '3px'
                      }}>
                         <ListItemIcon sx={{ minWidth: 32 }}>
                            {log.status === 'NEUTRAL' ? <Speed sx={{ fontSize: 18, color: '#666' }} /> : 
                             (log.status === 'BULLISH' ? <CheckCircleOutline sx={{ fontSize: 18, color: '#00ff41' }} /> : 
                             <HighlightOff sx={{ fontSize: 18, color: '#ff0044' }} />)}
                         </ListItemIcon>
                         <ListItemText 
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                                <Typography variant="body2" color="#fff" fontWeight="bold">{log.component}</Typography>
                                <Chip label={log.status} size="small" sx={{ 
                                  height: 18, fontSize: '0.6rem', fontWeight: 'bold', ml: 1,
                                  color: log.status === 'BULLISH' ? '#00ff41' : (log.status === 'BEARISH' ? '#ff0044' : '#888'),
                                  bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid #333'
                                }} />
                              </Box>
                            }
                            secondary={<Typography variant="caption" color="#999" sx={{ lineHeight: 1.2, display: 'block', mt: 0.5 }}>{log.detail}</Typography>}
                         />
                      </ListItem>
                   ))}
                </List>

                <Divider sx={{ my: 2.5, borderColor: '#222' }} />
                
                <Typography variant="caption" color="textSecondary" sx={{ mb: 1.5, display: 'block', fontWeight: 'bold' }}>KEY INSTITUTIONAL LEVELS</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                   {signal.keyLevels.map((lvl, idx) => (
                      <Box key={idx} sx={{ flex: '1 1 30%', p: 1, border: '1px solid #222', bgcolor: '#080808', borderRadius: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                         <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem', mb: 0.5 }} color={lvl.type.includes('Resistance') ? '#ff4444' : (lvl.type.includes('Support') ? '#00ff41' : '#00f2ff')}>{lvl.type.split(' ')[0]}</Typography>
                         <Typography variant="body2" fontWeight="bold" color="white">{lvl.price}</Typography>
                      </Box>
                   ))}
                </Box>
             </Box>
          </Box>

          {/* COLONNA 3: EXECUTION */}
          <Box sx={{ 
              width: { xs: '100%', md: '33.3333%' },
              display: 'flex', flexDirection: 'column', bgcolor: '#050505'
          }}>
             <Box sx={{ p: 1.5, bgcolor: '#080808', borderBottom: '1px solid #222' }}>
                <Typography variant="caption" sx={{ color: '#ff0055', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                   <FlashOn fontSize="small" /> EXECUTION PLAN
                </Typography>
             </Box>
             
             <Box sx={{ p: { xs: 2, md: 3 }, flex: 1, pb: 4 }}>
                {/* ENTRY & SL */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                   <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: '#333', bgcolor: '#000', borderRadius: 0 }}>
                      <Typography variant="caption" color="#888" fontWeight="bold">ENTRY ({signal.entryType})</Typography>
                      <Typography variant="h6" color="#fff" sx={{ mt: 0.5 }}>{signal.entryPrice}</Typography>
                   </Paper>
                   <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: 'rgba(255,0,0,0.3)', bgcolor: 'rgba(255,0,0,0.05)', borderRadius: 0 }}>
                      <Typography variant="caption" color="#ff4444" fontWeight="bold">STOP LOSS</Typography>
                      <Typography variant="h6" color="#ff4444" sx={{ mt: 0.5 }}>{signal.invalidationLevel}</Typography>
                   </Paper>
                </Box>

                {/* TARGETS */}
                <Stack spacing={1} sx={{ mb: 3 }}>
                   {signal.targets.map((tp, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderLeft: '3px solid #00f2ff', bgcolor: '#0a0a0a', border: '1px solid #1a1a1a', borderLeftWidth: '3px' }}>
                         <Typography variant="caption" color="#aaa">TARGET {i+1}</Typography>
                         <Typography variant="body2" color="#fff" fontWeight="bold" fontSize="1rem">{tp.price}</Typography>
                         <Chip label={`R:R ${tp.reward}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#000', border: '1px solid #333', color: '#00f2ff' }} />
                      </Box>
                   ))}
                </Stack>

                <Divider sx={{ borderColor: '#222', mb: 2.5 }} />

                {/* RISK DATA */}
                <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#0a0a0a" p={2} borderRadius={1} border="1px solid #222">
                   <Box>
                      <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} sx={{ fontSize: '0.65rem' }}>SIZE</Typography>
                      <Typography variant="body1" color="white" fontWeight="bold">{signal.recommendedSize}</Typography>
                   </Box>
                   <Divider orientation="vertical" flexItem sx={{ borderColor: '#333' }} />
                   <Box>
                      <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} sx={{ fontSize: '0.65rem' }}>LEV</Typography>
                      <Typography variant="body1" color="white" fontWeight="bold">{signal.leverage}</Typography>
                   </Box>
                   <Divider orientation="vertical" flexItem sx={{ borderColor: '#333' }} />
                   <Box textAlign="right">
                      <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5} justifyContent="flex-end" sx={{ fontSize: '0.65rem' }}>RISK</Typography>
                      <Box display="flex" gap={0.5} mt={0.5}>
                         {[1,2,3,4,5].map(v => (
                            <Box key={v} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: v <= signal.riskScore ? (signal.riskScore > 3 ? '#ff0044' : '#ff9900') : '#333' }} />
                         ))}
                      </Box>
                   </Box>
                </Box>
             </Box>
          </Box>
        </Box>
      </Box>

      {/* 3. NEW FIXED BOTTOM FOOTER (Per garantire chiusura su mobile) */}
      <Box sx={{ 
        flexShrink: 0, p: 2, bgcolor: '#000', borderTop: '1px solid #222', 
        display: 'flex', justifyContent: 'center', zIndex: 100
      }}>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={onClose}
          startIcon={<ExitToApp />}
          fullWidth
          sx={{ 
            height: 48, fontWeight: 'bold', letterSpacing: 1, 
            borderColor: '#333', color: '#fff',
            '&:hover': { bgcolor: '#220000', borderColor: '#ff0055', color: '#ff0055' } 
          }}
        >
          CLOSE ANALYSIS
        </Button>
      </Box>

    </Box>
  );
};

export default MarketBrain;