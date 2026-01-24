import React, { useState, useEffect } from 'react';
import { 
  createTheme, ThemeProvider, CssBaseline, Drawer, List, ListItemButton, 
  ListItemIcon, Typography, Box, IconButton, Chip, useMediaQuery, 
  useTheme, AppBar, Toolbar, Modal, Button, keyframes 
} from '@mui/material';
import { 
  ShowChart, CurrencyBitcoin, Public, WaterDrop, Memory, Dashboard, 
  Sensors, Menu as MenuIcon, RestartAlt, Map, DataUsage, QueryStats,
  Psychology, ViewQuilt, Newspaper
} from '@mui/icons-material';

import { 
  TickerTapeWidget, AdvancedChartWidget, TechnicalWidget, NewsWidget, 
  HeatmapWidget, FundamentalDataWidget, ScreenerWidget 
} from './components/Widgets';
import SymbolSearch from './components/SymbolSearch';
import Loader from './components/Loader';
import AssetSelector from './components/AssetSelector';
import MarketBrain from './components/MarketBrain';
import { marketCategories, type MarketCategories } from './data/marketData';

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

const App: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<keyof MarketCategories>('indices');
  const [customSymbol, setCustomSymbol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBrainOpen, setIsBrainOpen] = useState(false);

  const currentCategoryData = marketCategories[activeCategory];
  const activeSymbol = customSymbol || currentCategoryData.symbols[0][1];

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
    switch(key) {
      case 'indices': return <Public />;
      case 'forex': return <ShowChart />;
      case 'crypto': return <CurrencyBitcoin />;
      case 'commodities': return <WaterDrop />;
      case 'tech_stocks': return <Memory />;
      default: return <Dashboard />;
    }
  };
  
  const isStockLayout = currentCategoryData.type === 'stock' || currentCategoryData.type === 'index';
  const isCryptoLayout = currentCategoryData.type === 'crypto';

  const renderRightWidgetTop = () => <TechnicalWidget symbol={activeSymbol} />;
  
  const renderRightWidgetMiddle = () => {
      return <HeatmapWidget type={isCryptoLayout ? 'crypto' : 'stock'} />;
  };

  const renderRightWidgetBottom = () => isStockLayout ? <FundamentalDataWidget symbol={activeSymbol} /> : <NewsWidget symbol={activeSymbol} />;
  
  const renderBottomLeft = () => <ScreenerWidget />;
  const renderBottomRight = () => <HeatmapWidget type={isCryptoLayout ? 'crypto' : 'stock'} />;

  const drawerContent = (
    <>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40px' }}>
         <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#00f2ff', letterSpacing: 1 }}>PRO</Typography>
      </Box>
      <List className="flex flex-col gap-2 w-full px-1">
        {(Object.keys(marketCategories) as Array<keyof MarketCategories>).map((key) => (
          <ListItemButton
            key={key}
            onClick={() => { setActiveCategory(key); setCustomSymbol(null); if (isMobile) setMobileOpen(false); }}
            selected={activeCategory === key}
            sx={{
              flexDirection: 'column', justifyContent: 'center', py: 2,
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

  return (
    <ThemeProvider theme={cyberTheme}>
      <CssBaseline />
      
      <AppBar position="fixed" sx={{ zIndex: 1400, height: '56px', borderBottom: '1px solid rgba(0, 242, 255, 0.15)' }}>
        <Box sx={{ position: 'absolute', inset: 0, zIndex: -2, opacity: 0.6 }}>
            <TickerTapeWidget />
        </Box>
        <Box sx={{ 
            position: 'absolute', inset: 0, zIndex: -1, 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%)',
            backdropFilter: 'blur(8px)'
        }} />

        <Toolbar variant="dense" sx={{ height: '56px', gap: 1, px: { xs: 1, sm: 2 }, justifyContent: 'space-between' }}>
            
           {/* LEFT: Menu & Logo */}
           <Box display="flex" alignItems="center" flexShrink={0}>
             {isMobile && (
               <IconButton onClick={handleDrawerToggle} size="small" sx={{ color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)', borderRadius: 1, mr: 1 }}>
                 <MenuIcon fontSize="small" />
               </IconButton>
             )}

             <Typography variant="button" sx={{ fontWeight: 'bold', color: '#fff', letterSpacing: 2, display: {xs: 'none', md: 'block'}, mr: 2 }}>
               PRO<span style={{ color: '#00f2ff'}}>TERMINAL</span>
             </Typography>
           </Box>

           {/* MIDDLE: Search (Responsive Fix: minWidth: 0) */}
           <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0, maxWidth: '500px' }}>
              <SymbolSearch onSearch={handleSearch} />
           </Box>

           {/* RIGHT: Buttons & Info */}
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
               <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>AI BRAIN</Box>
             </Button>

             <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)', pr: 1 }}>
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
                 {customSymbol && (
                    <IconButton size="small" onClick={handleResetSymbol} sx={{ color: '#ff0055', p: 0.5, ml: 0.5 }}>
                        <RestartAlt fontSize="small" />
                    </IconButton>
                 )}
             </Box>

             <Box display="flex" alignItems="center" gap={1} sx={{ ml: 1 }}>
               <Sensors sx={{ fontSize: 14, color: isLoading ? '#ff9900' : '#00ff00' }} className={isLoading ? "animate-pulse" : ""} />
             </Box>
           </Box>
        </Toolbar>
      </AppBar>

      <Modal open={isBrainOpen} onClose={() => setIsBrainOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
        <Box sx={{ width: '95%', maxWidth: '1200px', height: '85vh', bgcolor: '#000', border: '1px solid #00f2ff', boxShadow: '0 0 50px rgba(0, 242, 255, 0.2)', outline: 'none', display: 'flex', flexDirection: 'column' }}>
           <MarketBrain symbol={activeSymbol} categoryType={currentCategoryData.type} onClose={() => setIsBrainOpen(false)} />
        </Box>
      </Modal>

      <Box sx={{ display: 'flex', height: '100vh', pt: '56px', overflow: 'hidden', bgcolor: '#000', position: 'relative' }}>
        
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: 0 }}>
          {isMobile ? (
             <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} sx={{ '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#000', borderRight: '1px solid #222' } }}>{drawerContent}</Drawer>
          ) : (
             <Drawer variant="permanent" sx={{ '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#000', borderRight: '1px solid #222', top: '56px', height: 'calc(100% - 56px)' } }}>{drawerContent}</Drawer>
          )}
        </Box>

        <Box component="main" sx={{ flexGrow: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
          
          {isLoading && <Loader />}

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flex: '1 1 auto', borderBottom: '1px solid #222' }}>
            
            <Box sx={{ flex: { lg: '1 1 75%' }, width: '100%', borderRight: '1px solid #222', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: { xs: '500px', lg: 'auto' } }}>
               <Box sx={{ flexGrow: 1, width: '100%', position: 'relative' }} key={activeSymbol}>
                  <AdvancedChartWidget symbol={activeSymbol} />
               </Box>
               <Box sx={{ height: '36px', flexShrink: 0, bgcolor: '#050505', zIndex: 10, maxWidth: '100vw', overflowX: 'auto' }}>
                  <AssetSelector symbols={currentCategoryData.symbols} activeSymbol={activeSymbol} onSelect={handleAssetSelect} />
               </Box>
            </Box>

            <Box sx={{ flex: { lg: '0 0 25%' }, width: { xs: '100%', lg: '25%' }, display: 'flex', flexDirection: 'column', minWidth: { lg: '320px' }, borderLeft: '1px solid #222' }}>
               
               <Box sx={{ flex: 1, borderBottom: '1px solid #222', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: { xs: '300px', lg: '0' } }}>
                  <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
                     <QueryStats sx={{ fontSize: 14, color: '#ff0055' }} />
                     <Typography variant="caption" fontWeight="bold">OSCILLATORS & GAUGE</Typography>
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>{renderRightWidgetTop()}</Box>
               </Box>

               <Box sx={{ flex: 1, borderBottom: '1px solid #222', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: { xs: '250px', lg: '0' } }}>
                  <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
                     <ViewQuilt sx={{ fontSize: 14, color: '#00f2ff' }} />
                     <Typography variant="caption" fontWeight="bold">MARKET SECTOR TREND</Typography>
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>{renderRightWidgetMiddle()}</Box>
               </Box>

               <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: { xs: '400px', lg: '0' } }}>
                  <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Newspaper sx={{ fontSize: 14, color: '#ff9900' }} />
                     <Typography variant="caption" fontWeight="bold">{isStockLayout ? 'FINANCIALS' : 'LIVE NEWS'}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>{renderRightWidgetBottom()}</Box>
               </Box>
            </Box>
          </Box>

          <Box sx={{ minHeight: { xs: 'auto', lg: '340px' }, height: { lg: '340px' }, flexShrink: 0, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, borderTop: '1px solid #222', bgcolor: '#080808' }}>
              
             <Box sx={{ flex: { lg: '1 1 65%' }, width: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #222', minHeight: { xs: '400px', lg: 'auto' } }}>
                <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
                   <Map sx={{ fontSize: 14, color: '#00f2ff' }} />
                   <Typography variant="caption" fontWeight="bold">GLOBAL SCREENER</Typography>
                </Box>
                <Box sx={{ flex: 1, width: '100%', overflow: 'hidden' }}>
                   {renderBottomLeft()}
                </Box>
             </Box>

             <Box sx={{ flex: { lg: '1 1 35%' }, width: '100%', display: 'flex', flexDirection: 'column', minHeight: { xs: '350px', lg: 'auto' } }}>
                <Box sx={{ p: 0.5, bgcolor: '#0a0a0a', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 1 }}>
                   <DataUsage sx={{ fontSize: 14, color: '#ff0055' }} />
                   <Typography variant="caption" fontWeight="bold">LIQUIDITY HEATMAP</Typography>
                </Box>
                <Box sx={{ flex: 1, width: '100%', overflow: 'hidden' }}>
                   {renderBottomRight()}
                </Box>
             </Box>

          </Box>

        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;