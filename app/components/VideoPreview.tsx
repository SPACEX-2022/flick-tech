'use client';

import { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { useEditor } from '../context/EditorContext';

const VideoPreview = () => {
  const { editorState, setZoom } = useEditor();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

    // 绘制其他视觉元素（文字、图像等）
    // TODO: 根据时间轴上的内容绘制其他元素
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

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#111', // 深色背景更适合视频预览
        position: 'relative',
      }}
    >
      {/* 视频预览区 */}
      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
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
            background: '#000',
          }}
        />
      </Box>

      {/* 控制栏 */}
      <Box 
        sx={{ 
          p: 1, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
        }}
      >
        {/* 分辨率信息 */}
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {width}x{height} • {Math.round(editorState.currentTime / 10) / 100}s
        </Typography>

        {/* 控制按钮 */}
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => handleZoomChange(-0.1)}>
            <ZoomOut size={18} />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
            {Math.round(editorState.zoom * 100)}%
          </Typography>
          <IconButton size="small" onClick={() => handleZoomChange(0.1)}>
            <ZoomIn size={18} />
          </IconButton>
          <IconButton size="small" onClick={toggleMute}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </IconButton>
          <IconButton size="small" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default VideoPreview; 