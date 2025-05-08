'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { ChevronUp, ChevronDown, Play, Pause, Lock, LockOpen, Eye, EyeOff } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { Track, TimelineClip } from '../types/editor';

const TRACK_HEIGHT = 60; // 轨道高度
const HEADER_WIDTH = 180; // 轨道标题区域宽度
const TIMELINE_HEIGHT = 20; // 时间标尺高度

const Timeline = () => {
  const { editorState, togglePlayback, setCurrentTime } = useEditor();
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 根据缩放比例计算时间刻度
  const getTimeScale = () => {
    return 100 * editorState.zoom; // 100像素/秒 * 缩放比例
  };

  // 将时间（毫秒）转换为像素位置
  const timeToPosition = (time: number): number => {
    return (time / 1000) * getTimeScale();
  };

  // 将像素位置转换为时间（毫秒）
  const positionToTime = (position: number): number => {
    return (position / getTimeScale()) * 1000;
  };

  // 生成时间标尺刻度
  const generateTimeScale = () => {
    const totalDuration = editorState.project.settings.duration || 60000; // 默认1分钟
    const timeScale = getTimeScale();
    const secondsInterval = timeScale < 50 ? 10 : timeScale < 100 ? 5 : 1; // 根据缩放调整刻度间隔
    const totalWidth = timeToPosition(totalDuration);
    
    const ticks = [];
    for (let time = 0; time <= totalDuration; time += secondsInterval * 1000) {
      const position = timeToPosition(time);
      if (position > totalWidth) break;
      
      const isMainTick = time % (10 * 1000) === 0; // 每10秒一个主刻度
      ticks.push(
        <Box 
          key={time} 
          sx={{ 
            position: 'absolute', 
            left: position, 
            height: isMainTick ? 10 : 5, 
            width: 1, 
            bgcolor: 'grey.500', 
            top: isMainTick ? 0 : 5 
          }}
        />
      );
      
      if (isMainTick) {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        ticks.push(
          <Typography 
            key={`label-${time}`} 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              left: position, 
              top: 10, 
              transform: 'translateX(-50%)', 
              fontSize: '0.7rem' 
            }}
          >
            {`${minutes}:${seconds.toString().padStart(2, '0')}`}
          </Typography>
        );
      }
    }
    return ticks;
  };

  // 处理时间轴拖动
  const handleTimelineDrag = (event: React.MouseEvent) => {
    if (!timelineContainerRef.current) return;
    
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newTime = Math.max(0, positionToTime(offsetX - HEADER_WIDTH));
    
    setCurrentTime(newTime);
  };

  // 处理时间轴点击
  const handleTimelineClick = (event: React.MouseEvent) => {
    handleTimelineDrag(event);
  };

  // 处理时间轴拖动开始
  const handleTimelineMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    handleTimelineDrag(event);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleTimelineDrag(moveEvent as unknown as React.MouseEvent);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 渲染当前时间指示线
  const renderCurrentTimeIndicator = () => {
    const position = timeToPosition(editorState.currentTime) + HEADER_WIDTH;
    
    return (
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          bottom: 0, 
          left: position, 
          width: 2, 
          bgcolor: 'error.main', 
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
    );
  };

  // 渲染单个轨道
  const renderTrack = (track: Track, index: number) => {
    return (
      <Box
        key={track.id}
        sx={{
          display: 'flex',
          height: TRACK_HEIGHT,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {/* 轨道头部 */}
        <Box
          sx={{
            width: HEADER_WIDTH,
            borderRight: 1,
            borderColor: 'divider',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            zIndex: 1,
          }}
        >
          <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
            {track.name}
          </Typography>
          <Stack direction="row">
            <IconButton size="small" sx={{ p: 0.5 }}>
              {track.isLocked ? <Lock size={16} /> : <LockOpen size={16} />}
            </IconButton>
            <IconButton size="small" sx={{ p: 0.5 }}>
              {track.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </IconButton>
          </Stack>
        </Box>

        {/* 轨道内容区 */}
        <Box
          sx={{
            position: 'relative',
            flexGrow: 1,
            height: '100%',
            bgcolor: track.isLocked ? 'action.disabledBackground' : 'background.default',
          }}
        >
          {track.clips.map((clip) => renderClip(clip, track))}
        </Box>
      </Box>
    );
  };

  // 渲染片段
  const renderClip = (clip: TimelineClip, track: Track) => {
    // 计算片段位置和宽度
    const left = timeToPosition(clip.startTime);
    const width = timeToPosition(clip.endTime - clip.startTime);

    // 根据轨道类型设置不同的样式
    let clipStyle = {};
    switch (track.type) {
      case 'video':
        clipStyle = { bgcolor: 'primary.main' };
        break;
      case 'audio':
        clipStyle = { bgcolor: 'success.main' };
        break;
      case 'text':
        clipStyle = { bgcolor: 'info.main' };
        break;
    }

    const isSelected = editorState.selectedClipIds.includes(clip.id);

    return (
      <Box
        key={clip.id}
        sx={{
          position: 'absolute',
          left,
          top: 4,
          width,
          height: TRACK_HEIGHT - 8,
          borderRadius: 1,
          ...clipStyle,
          border: isSelected ? '2px solid white' : 'none',
          opacity: 0.8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Typography variant="caption" sx={{ color: 'white', px: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {/* 这里可以显示素材名称 */}
        </Typography>
      </Box>
    );
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden', 
        bgcolor: 'background.paper',
      }}
    >
      {/* 播放控制区 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper', 
      }}>
        <IconButton 
          size="small" 
          onClick={togglePlayback}
          sx={{ mr: 1 }}
        >
          {editorState.playbackState === 'playing' ? <Pause size={18} /> : <Play size={18} />}
        </IconButton>
        <Typography variant="body2">
          {Math.floor(editorState.currentTime / 60000)}:
          {Math.floor((editorState.currentTime % 60000) / 1000).toString().padStart(2, '0')}:
          {Math.floor((editorState.currentTime % 1000) / 10).toString().padStart(2, '0')}
        </Typography>
      </Box>

      {/* 时间轴容器 */}
      <Box 
        ref={timelineContainerRef}
        sx={{ 
          flexGrow: 1, 
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'auto',
        }}
      >
        {/* 时间标尺 */}
        <Box 
          sx={{ 
            height: TIMELINE_HEIGHT, 
            display: 'flex', 
            borderBottom: 1, 
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box 
            sx={{ 
              width: HEADER_WIDTH, 
              borderRight: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }} 
          />
          <Box 
            sx={{ 
              position: 'relative', 
              flexGrow: 1, 
              height: '100%',
              userSelect: 'none',
            }}
            onClick={handleTimelineClick}
            onMouseDown={handleTimelineMouseDown}
          >
            {generateTimeScale()}
          </Box>
        </Box>

        {/* 轨道区域 */}
        <Box sx={{ position: 'relative' }}>
          {editorState.project.tracks.map((track, index) => renderTrack(track, index))}
        </Box>

        {/* 当前时间指示线 */}
        {renderCurrentTimeIndicator()}
      </Box>
    </Box>
  );
};

export default Timeline; 