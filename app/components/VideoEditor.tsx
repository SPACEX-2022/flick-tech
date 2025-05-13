'use client';

import { Box, createTheme, ThemeProvider } from '@mui/material';
import { useEffect, useState } from 'react';
import AssetLibrary from './AssetLibrary';
import Timeline from './Timeline';
import VideoPreview from './VideoPreview';
import PropertiesPanel from './PropertiesPanel';
import { useEditor } from '../context/EditorContext';
import ResizablePanel from './ResizablePanel';
import { Asset } from '../types/editor';

// 创建类似Clipchamp主题
const clipchampTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6C5CE7', // 紫色主色调
    },
    secondary: {
      main: '#A29BFE', // 淡紫色
    },
    background: {
      default: '#FFFFFF',
      paper: '#F8F9FA',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
        },
        containedPrimary: {
          backgroundColor: '#6C5CE7',
          '&:hover': {
            backgroundColor: '#5649C1',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: 'none',
        },
      },
    },
  },
});

// 全局样式
const globalStyles = `
  :root {
    --header-height: 48px;
    --sidebar-width: 240px;
    --timeline-height: 180px;
    --border-color: #E0E0E0;
    --background-color: #F8F9FA;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
    background-color: #F8F9FA;
    color: #333333;
  }
  
  .clipchamp-header {
    height: var(--header-height);
    border-bottom: 1px solid var(--border-color);
    background-color: white;
    display: flex;
    align-items: center;
    padding: 0 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .clipchamp-logo {
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: 16px;
    color: #333;
  }
  
  .clipchamp-sidebar {
    width: 100%;
    background-color: white;
    border-right: 1px solid var(--border-color);
    height: 100%;
  }
  
  .clipchamp-sidebar-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: #333;
    text-decoration: none;
    font-size: 14px;
  }
  
  .clipchamp-sidebar-item svg {
    margin-right: 12px;
  }
  
  .clipchamp-preview {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #222;
  }

  .clipchamp-timeline {
    height: var(--timeline-height);
    border-top: 1px solid var(--border-color);
    background-color: white;
  }
  
  .export-button {
    background-color: #6C5CE7;
    color: white;
    border-radius: 4px;
    padding: 8px 16px;
    margin-left: auto;
    border: none;
    font-weight: 500;
  }
`;

// 修改组件接口
interface VideoEditorProps {
  initialAssets?: Omit<Asset, 'id' | 'createdAt'>[];
}

const VideoEditor = ({ initialAssets = [] }: VideoEditorProps) => {
  const [windowWidth, setWindowWidth] = useState(1200); // 默认值
  const { addAsset } = useEditor();

  // 添加全局样式和计算窗口宽度
  useEffect(() => {
    // 添加全局样式
    const styleEl = document.createElement('style');
    styleEl.textContent = globalStyles;
    document.head.appendChild(styleEl);

    // 计算窗口宽度
    setWindowWidth(window.innerWidth);

    // 监听窗口大小变化
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.head.removeChild(styleEl);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 加载初始资产
  useEffect(() => {
    if (initialAssets.length > 0) {
      const assetsToAdd = [...initialAssets];
      // 使用延时函数避免无限循环
      const timer = setTimeout(() => {
        assetsToAdd.forEach(asset => {
          addAsset(asset);
        });
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <ThemeProvider theme={clipchampTheme}>
      <Box sx={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden'
      }}>
        {/* 头部导航栏 */}
        <div className="clipchamp-header">
          <div className="clipchamp-logo">
            <span>无标题视频</span>
          </div>
          <button className="export-button">导出</button>
        </div>

        {/* 主体内容区 */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* 左侧侧边栏 */}
          <ResizablePanel
            defaultWidth={240}
            resizeHandles={['e']}
            style={{ height: '100%' }}
          >
            <div className="clipchamp-sidebar">
              <AssetLibrary />
            </div>
          </ResizablePanel>

          {/* 视频预览区和时间线区 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 视频预览区 */}
            <Box sx={{ flex: 1, overflow: 'hidden', backgroundColor: '#222' }}>
              <VideoPreview />
            </Box>
            
            {/* 时间线区 */}
            <ResizablePanel
              defaultWidth={windowWidth}
              defaultHeight={180}
              resizeHandles={['n']}
              style={{ width: '100%' }}
            >
              <div className="clipchamp-timeline">
                <Timeline />
              </div>
            </ResizablePanel>
          </Box>

          {/* 右侧属性面板 */}
          <ResizablePanel
            defaultWidth={300}
            resizeHandles={['w']}
            style={{ height: '100%' }}
          >
            <Box sx={{ height: '100%', borderLeft: '1px solid var(--border-color)', backgroundColor: 'white' }}>
              <PropertiesPanel />
            </Box>
          </ResizablePanel>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default VideoEditor; 