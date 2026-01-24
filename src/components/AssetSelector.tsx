import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { type MarketSymbol } from '../data/marketData';

interface AssetSelectorProps {
  symbols: MarketSymbol[];
  activeSymbol: string;
  onSelect: (symbol: string) => void;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({ symbols, activeSymbol, onSelect }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: '100%', 
        height: '100%', 
        overflowX: 'auto', // Permette lo scroll orizzontale se ci sono tanti asset
        bgcolor: '#050505',
        borderTop: '1px solid #222',
        px: 1,
        gap: 1,
        /* Nasconde la scrollbar estetica */
        '&::-webkit-scrollbar': { height: '4px' },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#333' }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: '#666', flexShrink: 0 }}>
        <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          QUICK SELECT:
        </Typography>
      </Box>

      {symbols.map(([name, ticker]) => {
        const isActive = activeSymbol === ticker;
        // Puliamo il ticker per la visualizzazione (es. "NASDAQ:AAPL" -> "AAPL")
        const displayTicker = ticker.includes(':') ? ticker.split(':')[1] : ticker;

        return (
          <Button
            key={ticker}
            onClick={() => onSelect(ticker)}
            variant={isActive ? "contained" : "outlined"}
            size="small"
            sx={{
              minWidth: 'auto',
              height: '28px',
              borderRadius: '2px',
              border: isActive ? '1px solid #00f2ff' : '1px solid #333',
              bgcolor: isActive ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
              color: isActive ? '#fff' : '#888',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '&:hover': {
                border: '1px solid #00f2ff',
                bgcolor: 'rgba(0, 242, 255, 0.05)',
                color: '#fff'
              }
            }}
          >
            <span style={{ color: isActive ? '#00f2ff' : '#555', marginRight: '6px', fontWeight: 'bold' }}>
              {displayTicker}
            </span>
            {name}
          </Button>
        );
      })}
    </Box>
  );
};

export default AssetSelector;