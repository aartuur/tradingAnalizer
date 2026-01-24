
import { Box, Typography } from '@mui/material';
import { Sensors } from '@mui/icons-material';

const Loader = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        width: '100%', 
        bgcolor: '#000',
        position: 'absolute',
        zIndex: 50,
        top: 0,
        left: 0
      }}
    >
      <div className="cyber-spinner"></div>
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Sensors className="animate-pulse" sx={{ color: '#00f2ff' }} />
        <Typography variant="caption" sx={{ color: '#00f2ff', letterSpacing: 2, fontFamily: 'monospace' }}>
          INITIALIZING DATA STREAM...
        </Typography>
      </Box>
    </Box>
  );
};

export default Loader;