import React, { useState } from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import { Search } from '@mui/icons-material';

interface SymbolSearchProps {
  onSearch: (symbol: string) => void;
}

const SymbolSearch: React.FC<SymbolSearchProps> = ({ onSearch }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.toUpperCase());
      setInput('');
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: 300,
        bgcolor: 'rgba(0, 242, 255, 0.05)',
        border: '1px solid rgba(0, 242, 255, 0.2)',
        borderRadius: '4px',
        height: 32,
        transition: 'all 0.3s',
        '&:hover': {
           border: '1px solid rgba(0, 242, 255, 0.8)',
           boxShadow: '0 0 10px rgba(0, 242, 255, 0.2)'
        }
      }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1, color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}
        placeholder="CMD: SEARCH TICKER..."
        value={input}
        onChange={(e) => setInput((e.target as HTMLInputElement).value)}
      />
      <IconButton type="submit" sx={{ p: '5px', color: '#00f2ff' }}>
        <Search sx={{ fontSize: 18 }} />
      </IconButton>
    </Paper>
  );
};

export default SymbolSearch;