'use client';

import { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Stack, Typography, Slider, Button, Tooltip } from '@mui/material';
import { 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Volume2, VolumeX,
  Play, Pause, SkipBack, SkipForward, Scissors, Layers, Grid,
  Camera, Download, RotateCcw, AlignCenter, Layout
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';

const VideoPreview = () => {
  const { editorState, setZoom, setPlaybackState, setCurrentTime } = useEditor();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [volume, setVolume] = useState(1);

  // 根据当前项目设置设置预览区域大小
  const { width, height } = editorState.project.settings;
  const aspectRatio = width / height;

  // 监听播放状态变化
  useEffect(() => {
    if (!videoRef.current) return;

    if (editorState.playbackState === 'playing') {
      videoRef.current.play().catch((error) => {
        console.error('播放失败:', error);
      });
    } else {
      videoRef.current.pause();
    }
  }, [editorState.playbackState]);

  // 监听当前时间变化
  useEffect(() => {
    if (videoRef.current && videoRef.current.currentTime !== editorState.currentTime / 1000) {
      videoRef.current.currentTime = editorState.currentTime / 1000;
      renderCurrentFrame();
    }
  }, [editorState.currentTime]);

  // 更新音量
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // 渲染当前帧到画布
  const renderCurrentFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;

    // 绘制视频帧
    if (videoRef.current.readyState >= 2) { // 确保视频已准备好
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    // 绘制辅助网格
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // 绘制安全区域
    if (showSafeZones) {
      drawSafeZones(ctx, canvas.width, canvas.height);
    }

    // 绘制其他视觉元素（文字、图像等）
    // TODO: 根据时间轴上的内容绘制其他元素
  };

  // 绘制辅助网格
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(72, 209, 204, 0.3)';
    ctx.lineWidth = 1;
    
    // 垂直线 - 三等分
    for (let i = 1; i < 3; i++) {
      const x = width * (i / 3);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 水平线 - 三等分
    for (let i = 1; i < 3; i++) {
      const y = height * (i / 3);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // 绘制安全区域
  const drawSafeZones = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    
    // 标题安全区 (90%)
    const titleSafeX = width * 0.05;
    const titleSafeY = height * 0.05;
    const titleSafeWidth = width * 0.9;
    const titleSafeHeight = height * 0.9;
    
    ctx.strokeStyle = 'rgba(72, 209, 204, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(titleSafeX, titleSafeY, titleSafeWidth, titleSafeHeight);
    
    // 动作安全区 (80%)
    const actionSafeX = width * 0.1;
    const actionSafeY = height * 0.1;
    const actionSafeWidth = width * 0.8;
    const actionSafeHeight = height * 0.8;
    
    ctx.strokeStyle = 'rgba(123, 104, 238, 0.5)';
    ctx.strokeRect(actionSafeX, actionSafeY, actionSafeWidth, actionSafeHeight);
    
    ctx.restore();
  };

  // 切换全屏
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 调整缩放
  const handleZoomChange = (delta: number) => {
    setZoom(Math.max(0.1, Math.min(3, editorState.zoom + delta)));
  };

  // 切换静音
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  // 播放/暂停
  const togglePlayback = () => {
    setPlaybackState(editorState.playbackState === 'playing' ? 'paused' : 'playing');
  };

  // 前进/后退
  const seekTime = (deltaMs: number) => {
    const newTime = Math.max(0, editorState.currentTime + deltaMs);
    setCurrentTime(newTime);
  };

  // 截图
  const takeScreenshot = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `flick-screenshot-${new Date().getTime()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        backdropFilter: 'blur(5px)',
      }}
    >
      {/* 顶部工具栏 */}
      <Box 
        sx={{ 
          p: 1, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(72, 209, 204, 0.2)',
        }}
      >
        <Stack direction="row" spacing={1}>
          <Tooltip title="剪切工具">
            <IconButton size="small">
              <Scissors size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="图层管理">
            <IconButton size="small">
              <Layers size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="对齐工具">
            <IconButton size="small">
              <AlignCenter size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
          预览视图
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title={showGrid ? "隐藏网格" : "显示网格"}>
            <IconButton 
              size="small" 
              color={showGrid ? "primary" : "default"}
              onClick={() => {
                setShowGrid(!showGrid);
                renderCurrentFrame();
              }}
            >
              <Grid size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title={showSafeZones ? "隐藏安全区" : "显示安全区"}>
            <IconButton 
              size="small"
              color={showSafeZones ? "primary" : "default"}
              onClick={() => {
                setShowSafeZones(!showSafeZones);
                renderCurrentFrame();
              }}
            >
              <Layout size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="重置视图">
            <IconButton size="small">
              <RotateCcw size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* 视频预览区 */}
      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
          // 科技感网格背景
          background: 'linear-gradient(rgba(0,0,0,.9), rgba(0,0,0,.9)), linear-gradient(90deg, rgba(72, 209, 204, 0.05) 1px, transparent 1px), linear-gradient(rgba(72, 209, 204, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: 'center center',
        }}
      >
        {/* 隐藏的视频元素用于处理媒体 */}
        <video 
          ref={videoRef}
          style={{ display: 'none' }}
          muted={isMuted}
          onTimeUpdate={() => {
            renderCurrentFrame();
          }}
        />
        
        {/* 画布用于渲染视频帧和其他元素 */}
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(72, 209, 204, 0.3)',
          }}
        />
      </Box>

      {/* 底部控制栏 */}
      <Box 
        sx={{ 
          p: 1, 
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderTop: '1px solid rgba(72, 209, 204, 0.2)',
        }}
      >
        {/* 播放控制 */}
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          <Tooltip title="向前跳转5秒">
            <IconButton size="small" onClick={() => seekTime(-5000)}>
              <SkipBack size={18} />
            </IconButton>
          </Tooltip>
          <IconButton 
            size="small" 
            onClick={togglePlayback}
            sx={{ 
              color: 'primary.main',
              bgcolor: 'rgba(72, 209, 204, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(72, 209, 204, 0.2)',
              }
            }}
          >
            {editorState.playbackState === 'playing' ? <Pause size={18} /> : <Play size={18} />}
          </IconButton>
          <Tooltip title="向后跳转5秒">
            <IconButton size="small" onClick={() => seekTime(5000)}>
              <SkipForward size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="截图">
            <IconButton size="small" onClick={takeScreenshot}>
              <Camera size={18} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* 底部控制面板 */}
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 1 }}
        >
          {/* 分辨率和时间信息 */}
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 100 }}>
            {width}x{height} • {Math.round(editorState.currentTime / 10) / 100}s
          </Typography>

          {/* 音量控制 */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '30%', maxWidth: 150 }}>
            <IconButton size="small" onClick={toggleMute}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </IconButton>
            <Slider
              size="small"
              value={isMuted ? 0 : volume * 100}
              onChange={(_, newValue) => {
                setVolume((newValue as number) / 100);
                if (isMuted) setIsMuted(false);
              }}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                },
              }}
            />
          </Stack>

          {/* 缩放控制 */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={() => handleZoomChange(-0.1)}>
              <ZoomOut size={16} />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
              {Math.round(editorState.zoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={() => handleZoomChange(0.1)}>
              <ZoomIn size={16} />
            </IconButton>
            <IconButton size="small" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default VideoPreview; 