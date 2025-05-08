'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

// 使用dynamic导入以避免SSR问题，因为我们的编辑器需要访问window等浏览器API
const VideoEditor = dynamic(() => import('./components/VideoEditor'), {
  ssr: false,
  loading: () => (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center'
    }}>
      <CircularProgress />
    </Box>
  ),
});

export default function Home() {
  return <VideoEditor />;
}
