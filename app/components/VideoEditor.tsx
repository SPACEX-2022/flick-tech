'use client';

import { Box } from '@mui/material';
import AssetLibrary from './AssetLibrary';
import Timeline from './Timeline';
import VideoPreview from './VideoPreview';
import PropertiesPanel from './PropertiesPanel';
import { EditorProvider } from '../context/EditorContext';

const VideoEditor = () => {
  return (
    <EditorProvider>
      <Box sx={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'grid',
        gridTemplateColumns: '250px 1fr 300px',
        gridTemplateRows: '1fr 200px',
        gridTemplateAreas: `
          "assets preview properties"
          "timeline timeline timeline"
        `,
        gap: 1,
        bgcolor: 'background.default',
        p: 1,
      }}>
        {/* 素材库 */}
        <Box sx={{ 
          gridArea: 'assets', 
          bgcolor: 'background.paper', 
          borderRadius: 1,
          boxShadow: 1,
          overflow: 'hidden',
        }}>
          <AssetLibrary />
        </Box>

        {/* 视频预览 */}
        <Box sx={{ 
          gridArea: 'preview', 
          bgcolor: 'background.paper', 
          borderRadius: 1,
          boxShadow: 1,
          overflow: 'hidden',
        }}>
          <VideoPreview />
        </Box>

        {/* 属性面板 */}
        <Box sx={{ 
          gridArea: 'properties', 
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
          overflow: 'hidden',
        }}>
          <PropertiesPanel />
        </Box>

        {/* 时间轴 */}
        <Box sx={{ 
          gridArea: 'timeline', 
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
          overflow: 'hidden',
        }}>
          <Timeline />
        </Box>
      </Box>
    </EditorProvider>
  );
};

export default VideoEditor; 