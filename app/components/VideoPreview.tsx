'use client';

import { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Stack, Typography, Slider, Button, Tooltip } from '@mui/material';
import { 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Volume2, VolumeX,
  Play, Pause, SkipBack, SkipForward, Scissors, Layers, Grid,
  Camera, Download, RotateCcw, AlignCenter, Layout
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import * as PIXI from 'pixi.js';
import { Track, TimelineClip, Asset } from '../types/editor';

// 扩展TimelineClip接口以添加渲染所需的额外属性
interface ExtendedTimelineClip extends TimelineClip {
  duration?: number; // 计算得出的持续时间
  zIndex?: number; // 用于排序
  text?: string; // 文字内容
  textStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: number | string;
    align?: 'left' | 'center' | 'right' | 'justify'; // 指定有效的对齐值
  };
  filters?: any[]; // 滤镜数组
}

// 扩展Asset接口以添加URL属性
interface ExtendedAsset extends Asset {
  url?: string; // URL别名，映射到src
}

const VideoPreview = () => {
  const { editorState, setZoom, setPlaybackState, setCurrentTime } = useEditor();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [volume, setVolume] = useState(1);
  const [app, setApp] = useState<PIXI.Application | null>(null);
  const [videoSprite, setVideoSprite] = useState<PIXI.Sprite | null>(null);
  const [gridGraphics, setGridGraphics] = useState<PIXI.Graphics | null>(null);
  const [safeZonesGraphics, setSafeZonesGraphics] = useState<PIXI.Graphics | null>(null);

  // 根据当前项目设置设置预览区域大小
  const { width, height } = editorState.project.settings;
  const aspectRatio = width / height;

  // 初始化PixiJS应用 - 使用async/await初始化方式
  useEffect(() => {
    const initPixiApp = async () => {
      if (!pixiContainerRef.current) return;
      
      // 清理之前的应用实例
      if (app) {
        app.destroy(true);
      }
      
      // 创建新的PIXI应用
      const newApp = new PIXI.Application();
      
      // 使用async初始化
      await newApp.init({
        width,
        height,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      
      // 确保canvas被正确创建
      if (newApp.canvas) {
        try {
          pixiContainerRef.current.appendChild(newApp.canvas);
          
          // 创建网格图形
          const newGridGraphics = new PIXI.Graphics();
          newApp.stage.addChild(newGridGraphics);
          setGridGraphics(newGridGraphics);
          
          // 创建安全区域图形
          const newSafeZonesGraphics = new PIXI.Graphics();
          newApp.stage.addChild(newSafeZonesGraphics);
          setSafeZonesGraphics(newSafeZonesGraphics);
          
          setApp(newApp);
        } catch (e) {
          console.error('PixiJS初始化错误:', e);
        }
      }
    };
    
    initPixiApp();
    
    return () => {
      // 清理
      if (app) {
        if (pixiContainerRef.current && app.canvas) {
          try {
            pixiContainerRef.current.removeChild(app.canvas);
          } catch (e) {
            console.warn('移除Pixi画布时出错:', e);
          }
        }
        app.destroy(true);
        setApp(null);
      }
    };
  }, [width, height]);

  // 使用视频元素创建PIXI纹理和精灵
  useEffect(() => {
    const setupVideoSprite = async () => {
      if (!app || !videoRef.current) return;
      
      // 移除旧的视频精灵
      if (videoSprite) {
        app.stage.removeChild(videoSprite);
        videoSprite.destroy();
      }
      
      try {
        // 创建视频纹理
        const videoSource = new PIXI.VideoSource({
          resource: videoRef.current,
          autoPlay: false, // 我们将手动控制播放
          updateFPS: 30 // 替换 autoUpdate 为正确的属性
        });
        
        // 创建纹理
        const videoTexture = new PIXI.Texture({
          source: videoSource,
        });
        
        // 创建视频精灵并设置尺寸
        const newVideoSprite = new PIXI.Sprite(videoTexture);
        newVideoSprite.width = width;
        newVideoSprite.height = height;
        
        // 添加到舞台
        app.stage.addChildAt(newVideoSprite, 0);
        setVideoSprite(newVideoSprite);
      } catch (error) {
        console.error('创建视频纹理时出错:', error);
      }
    };
    
    setupVideoSprite();
    
    return () => {
      if (videoSprite && app) {
        app.stage.removeChild(videoSprite);
        videoSprite.destroy(true);
        setVideoSprite(null);
      }
    };
  }, [app, videoRef.current, width, height]);

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
    }
  }, [editorState.currentTime]);

  // 更新音量
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // 绘制辅助网格
  useEffect(() => {
    if (!gridGraphics || !app) return;
    
    gridGraphics.clear();
    
    if (showGrid) {
      // 使用新的绘图API
      gridGraphics.lineStyle(1, 0x48D1CC, 0.3);
      
      // 垂直线 - 三等分
      for (let i = 1; i < 3; i++) {
        const x = width * (i / 3);
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, height);
      }
      
      // 水平线 - 三等分
      for (let i = 1; i < 3; i++) {
        const y = height * (i / 3);
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(width, y);
      }
      
      // 使用stroke完成绘制
      gridGraphics.stroke();
    }
  }, [showGrid, gridGraphics, width, height, app]);

  // 绘制安全区域
  useEffect(() => {
    if (!safeZonesGraphics || !app) return;
    
    safeZonesGraphics.clear();
    
    if (showSafeZones) {
      // 标题安全区 (90%)
      const titleSafeX = width * 0.05;
      const titleSafeY = height * 0.05;
      const titleSafeWidth = width * 0.9;
      const titleSafeHeight = height * 0.9;
      
      // 使用新的绘图API
      safeZonesGraphics.lineStyle(1, 0x48D1CC, 0.5);
      safeZonesGraphics.rect(titleSafeX, titleSafeY, titleSafeWidth, titleSafeHeight);
      safeZonesGraphics.stroke();
      
      // 动作安全区 (80%)
      const actionSafeX = width * 0.1;
      const actionSafeY = height * 0.1;
      const actionSafeWidth = width * 0.8;
      const actionSafeHeight = height * 0.8;
      
      safeZonesGraphics.lineStyle(1, 0x7B68EE, 0.5);
      safeZonesGraphics.rect(actionSafeX, actionSafeY, actionSafeWidth, actionSafeHeight);
      safeZonesGraphics.stroke();
    }
  }, [showSafeZones, safeZonesGraphics, width, height, app]);

  // 监听轨道数据变化
  useEffect(() => {
    if (!app || !videoRef.current) return;
    
    // 获取当前时间点的所有活动片段
    const activeClips: ExtendedTimelineClip[] = [];
    
    // 处理轨道数据
    editorState.project.tracks.forEach((track: Track) => {
      // 计算每个片段的持续时间和添加zIndex
      const trackActiveClips = track.clips.map((clip, index) => {
        const extendedClip: ExtendedTimelineClip = {
          ...clip,
          duration: clip.endTime - clip.startTime,
          zIndex: index // 使用索引作为默认zIndex
        };
        return extendedClip;
      }).filter(clip => 
        editorState.currentTime >= clip.startTime && 
        editorState.currentTime < (clip.startTime + (clip.duration || 0))
      );
      
      // 只有可见轨道的片段才会被渲染
      if (track.isVisible) {
        activeClips.push(...trackActiveClips);
      }
    });

    console.log('activeClips', activeClips);
    
    // 按照轨道类型和Z轴顺序排序
    const sortedClips = activeClips.sort((a, b) => {
      // 首先按照类型排序
      const typeOrder = { 'video': 0, 'audio': 1, 'text': 2, 'effect': 3 };
      const trackA = editorState.project.tracks.find(t => t.id === a.trackId);
      const trackB = editorState.project.tracks.find(t => t.id === b.trackId);
      
      if (trackA && trackB && trackA.type !== trackB.type) {
        return typeOrder[trackA.type as keyof typeof typeOrder] - typeOrder[trackB.type as keyof typeof typeOrder];
      }
      
      // 然后按照Z轴排序
      return ((a.zIndex || 0) - (b.zIndex || 0));
    });
    
    // 清理除了保留元素外的所有元素
    if (app.stage) {
      // 创建一个保留元素的数组，确保每个元素都不为null
      const keepElements = [gridGraphics, safeZonesGraphics].filter(el => el !== null);
      
      // 安全移除不需要的元素 - 修复数组越界错误
      for (let i = app.stage.children.length - 1; i >= 0; i--) {
        const child = app.stage.children[i];
        // 检查是否为需要保留的元素
        const shouldKeep = keepElements.some(keepEl => keepEl === child) || 
                            // 检查是否为视频精灵(通过名称前缀判断)
                            (child.name && child.name.startsWith('video-'));
        
        if (!shouldKeep) {
          app.stage.removeChildAt(i);
        }
      }
    }
    
    // 渲染活跃的片段
    sortedClips.forEach(clip => {
      const track = editorState.project.tracks.find(t => t.id === clip.trackId);
      if (!track) return;
      
      // 根据轨道类型和片段类型渲染内容
      switch (track.type) {
        case 'video':
          renderVideoClip(clip, app);
          break;
        case 'audio':
          // 音频片段无需在画布上渲染
          break;
        case 'text':
          renderTextClip(clip, app);
          break;
      }
    });
    
    // 触发渲染更新
    app.render();
    
  }, [editorState.project.tracks, editorState.currentTime, app, videoSprite, gridGraphics, safeZonesGraphics]);

  // 添加各种片段渲染的辅助函数
  const renderVideoClip = (clip: ExtendedTimelineClip, app: PIXI.Application) => {
    // 获取片段关联的资产
    const asset = editorState.project.assets.find(a => a.id === clip.assetId) as ExtendedAsset | undefined;
    if (!asset) return;

    // 对每个视频片段创建独立的视频纹理和精灵
    const videoKey = `video-${asset.id}`;
    let videoSprite = app.stage.children.find(child => child.name === videoKey) as PIXI.Sprite;

    if (!videoSprite) {
      // 创建新的视频纹理和精灵
      const videoElement = document.createElement('video');
      videoElement.src = asset.src;
      videoElement.crossOrigin = "anonymous";
      
      const videoSource = new PIXI.VideoSource({
        resource: videoElement,
        autoPlay: true
      });
      
      const videoTexture = new PIXI.Texture({ source: videoSource });
      videoSprite = new PIXI.Sprite(videoTexture);
      videoSprite.name = videoKey;
      app.stage.addChild(videoSprite);
    }

    // 直接设置视频源的时间
    const videoTexture = videoSprite.texture;
    const videoSource = videoTexture.source as PIXI.VideoSource;
    const videoElement = videoSource.resource as HTMLVideoElement;
    const relativeTime = editorState.currentTime - clip.startTime;
    videoElement.currentTime = relativeTime / 1000;
    
    // 应用片段的变换、滤镜等效果
    if (videoSprite && clip.transform) {
      // 位置、缩放、旋转等变换
      if (clip.transform.position) {
        videoSprite.position.set(clip.transform.position.x || 0, clip.transform.position.y || 0);
      }
      
      if (clip.transform.scale) {
        // 同比例缩放
        videoSprite.scale.set(clip.transform.scale, clip.transform.scale);
      }
      
      videoSprite.rotation = clip.transform.rotation || 0;
      
      // 应用滤镜效果
      if (clip.filters && clip.filters.length > 0) {
        // 这里需要根据实际滤镜类型进行处理
        // videoSprite.filters = [...];
      }
    }
  };

  const renderTextClip = (clip: ExtendedTimelineClip, app: PIXI.Application) => {
    if (!app.stage) return;
    
    // 获取文本内容（可能需要从资产中获取）
    const textContent = clip.text || '文本';
    
    // 创建文本对象
    const textStyle = new PIXI.TextStyle({
      fontFamily: clip.textStyle?.fontFamily || 'Arial',
      fontSize: clip.textStyle?.fontSize || 24,
      fill: clip.textStyle?.color || 0xffffff,
      align: clip.textStyle?.align || 'left',
    });
    
    const text = new PIXI.Text(textContent, textStyle);
    
    // 设置文本位置
    if (clip.transform) {
      if (clip.transform.position) {
        text.position.set(clip.transform.position.x || 0, clip.transform.position.y || 0);
      } else {
        // 默认位置
        text.position.set(width / 2, height / 2);
      }
      
      if (clip.transform.scale) {
        // 同比例缩放
        text.scale.set(clip.transform.scale, clip.transform.scale);
      }
      
      text.rotation = clip.transform.rotation || 0;
    } else {
      // 默认位置
      text.position.set(width / 2, height / 2);
      text.anchor.set(0.5);
    }
    
    // 添加到舞台
    app.stage.addChild(text);
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
    const newZoom = Math.max(0.1, Math.min(3, editorState.zoom + delta));
    setZoom(newZoom);
    
    if (app && app.stage) {
      app.stage.scale.set(newZoom);
      
      // 保持舞台在中心
      const containerWidth = pixiContainerRef.current?.clientWidth || width;
      const containerHeight = pixiContainerRef.current?.clientHeight || height;
      
      app.stage.position.x = (containerWidth - width * newZoom) / 2;
      app.stage.position.y = (containerHeight - height * newZoom) / 2;
    }
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
    if (!app) return;
    try {
      const dataUrl = app.canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `flick-screenshot-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('截图失败:', error);
    }
  };

  // 视频元素的timeupdate事件
  const handleTimeUpdate = () => {
    // 当视频时间更新时，触发PixiJS重新渲染
    if (app) {
      app.render();
    }
  };

  return (
    <Box ref={containerRef} sx={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      bgcolor: '#222222', // 视频预览区深色背景
      overflow: 'hidden'
    }}>
      {/* 视频预览区域 */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* 实际视频元素 - 隐藏但用于音频和时间控制 */}
        <video 
          ref={videoRef} 
          style={{ display: 'none' }}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaybackState('paused')}
          muted={isMuted}
          loop={false}
        />
        
        {/* PIXI渲染容器 */}
        <div
          ref={pixiContainerRef}
          style={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* PIXI将在这里渲染 */}
        </div>
        
        {/* 视频比例 & 居中指示器 */}
        {showSafeZones && (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {/* 安全区指示器会在PIXI中绘制 */}
          </Box>
        )}
      </Box>
      
      {/* 视频控制面板 */}
      <Box sx={{ 
        height: 'auto',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: '#2d2d2d',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {/* 基本播放控件 */}
          <IconButton 
            size="small" 
            onClick={() => seekTime(-5000)}
            sx={{ color: 'white' }}
          >
            <SkipBack size={18} />
          </IconButton>
          
          <IconButton 
            size="small" 
            onClick={togglePlayback}
            sx={{ 
              color: 'white',
              bgcolor: '#6C5CE7',
              '&:hover': { bgcolor: '#5649C1' },
              width: 32,
              height: 32
            }}
          >
            {editorState.playbackState === 'playing' ? <Pause size={18} /> : <Play size={18} />}
          </IconButton>
          
          <IconButton 
            size="small" 
            onClick={() => seekTime(5000)}
            sx={{ color: 'white' }}
          >
            <SkipForward size={18} />
          </IconButton>
          
          <Typography variant="caption" sx={{ color: 'white', ml: 1, fontFamily: 'monospace' }}>
            {`${Math.floor(editorState.currentTime / 60000)}:${Math.floor((editorState.currentTime % 60000) / 1000).toString().padStart(2, '0')} / ${Math.floor((editorState.project.settings.duration || 60000) / 60000)}:${Math.floor(((editorState.project.settings.duration || 60000) % 60000) / 1000).toString().padStart(2, '0')}`}
          </Typography>
          
          <Tooltip title={isMuted ? "取消静音" : "静音"}>
            <IconButton 
              size="small" 
              onClick={toggleMute}
              sx={{ color: 'white' }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </IconButton>
          </Tooltip>
          
          <Slider 
            size="small"
            value={volume * 100}
            min={0}
            max={100}
            onChange={(_, newValue) => setVolume((newValue as number) / 100)}
            sx={{ 
              width: 60, 
              color: '#6C5CE7',
              '& .MuiSlider-thumb': {
                width: 10,
                height: 10,
              }
            }}
          />
        </Stack>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="显示网格">
            <IconButton 
              size="small" 
              onClick={() => setShowGrid(!showGrid)}
              sx={{ 
                color: 'white',
                bgcolor: showGrid ? 'rgba(108, 92, 231, 0.3)' : 'transparent'
              }}
            >
              <Grid size={18} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="显示安全区域">
            <IconButton 
              size="small" 
              onClick={() => setShowSafeZones(!showSafeZones)}
              sx={{ 
                color: 'white',
                bgcolor: showSafeZones ? 'rgba(108, 92, 231, 0.3)' : 'transparent'
              }}
            >
              <Layout size={18} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="截图">
            <IconButton 
              size="small"
              onClick={takeScreenshot}
              sx={{ color: 'white' }}
            >
              <Camera size={18} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
            <IconButton 
              size="small" 
              onClick={toggleFullscreen}
              sx={{ color: 'white' }}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
};

export default VideoPreview; 