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

// 创建科技感主题
const techTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00FFEF', // 更亮的青色
    },
    secondary: {
      main: '#9D7FFF', // 更亮的蓝紫色
    },
    background: {
      default: '#0a0a0a',
      paper: '#151515',
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    allVariants: {
      color: '#ffffff',
    },
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0))',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0))',
          borderRadius: 8,
        },
      },
    },
  },
});

// 全局样式
const globalStyles = `
  :root {
    --panel-border-color: rgba(0, 255, 239, 0.4);
    --panel-bg-color: rgba(21, 21, 21, 0.95);
    --grid-line-color: rgba(0, 255, 239, 0.15);
  }
  
  body {
    background-color: #0a0a0a;
    background-image: 
      radial-gradient(at 30% 20%, rgba(0, 255, 239, 0.07) 0px, transparent 50%),
      radial-gradient(at 80% 70%, rgba(157, 127, 255, 0.07) 0px, transparent 50%);
    background-size: 100% 100%;
    background-attachment: fixed;
    color: #ffffff;
  }
  
  .grid-bg {
    background-image:
      linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px);
    background-size: 20px 20px;
  }
  
  .tech-panel {
    border: 1px solid var(--panel-border-color);
    background-color: var(--panel-bg-color);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }
  
  .glow-border {
    box-shadow: 0 0 15px rgba(0, 255, 239, 0.25);
  }
  
  .main-layout {
    padding: 16px;
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  
  .top-panels {
    display: flex;
    flex: 1;
    margin-bottom: 16px;
    min-height: 0;
  }
  
  .bottom-panel {
    height: 200px;
    width: 100%;
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
    setWindowWidth(window.innerWidth - 32);

    // 监听窗口大小变化
    const handleResize = () => {
      setWindowWidth(window.innerWidth - 32);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.head.removeChild(styleEl);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 加载初始资产 - 添加依赖项并确保只运行一次
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
  }, []); // 空依赖数组，确保只运行一次

  return (
    <ThemeProvider theme={techTheme}>
      <div className="main-layout grid-bg">
        <div className="top-panels">
          <ResizablePanel
            defaultWidth={250}
            resizeHandles={['e']}
            style={{ marginRight: 16 }}
          >
            <Box className="tech-panel glow-border" sx={{ height: '100%', overflow: 'hidden', borderRadius: 2 }}>
              <AssetLibrary />
            </Box>
          </ResizablePanel>
          
          <Box sx={{ flexGrow: 1, marginRight: 16 }}>
            <Box className="tech-panel glow-border" sx={{ height: '100%', overflow: 'hidden', borderRadius: 2 }}>
              <VideoPreview />
            </Box>
          </Box>
          
          <ResizablePanel
            defaultWidth={300}
            resizeHandles={['w']}
          >
            <Box className="tech-panel glow-border" sx={{ height: '100%', overflow: 'hidden', borderRadius: 2 }}>
              <PropertiesPanel />
            </Box>
          </ResizablePanel>
        </div>
        
        <ResizablePanel
          defaultWidth={windowWidth}
          defaultHeight={200}
          resizeHandles={['n']}
          className="bottom-panel"
        >
          <Box className="tech-panel glow-border" sx={{ height: '100%', overflow: 'hidden', borderRadius: 2 }}>
            <Timeline />
          </Box>
        </ResizablePanel>
      </div>
    </ThemeProvider>
  );
};

export default VideoEditor; 