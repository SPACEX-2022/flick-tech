'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Stack, Typography, Button } from '@mui/material';
import { ChevronUp, ChevronDown, Play, Pause, Lock, LockOpen, Eye, EyeOff } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { Track, TimelineClip } from '../types/editor';

const TRACK_HEIGHT = 50; // 减小轨道高度
const HEADER_WIDTH = 150; // 减小轨道标题区域宽度
const TIMELINE_HEIGHT = 24; // 时间标尺高度

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
            bgcolor: 'grey.400', 
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
              fontSize: '0.7rem',
              color: 'text.secondary' 
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
          bgcolor: '#6C5CE7', 
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
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        {/* 轨道头部 */}
        <Box
          sx={{
            width: HEADER_WIDTH,
            borderRight: '1px solid #E0E0E0',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#f8f9fa',
            zIndex: 1,
          }}
        >
          <Typography variant="caption" noWrap sx={{ maxWidth: '60%', fontWeight: 500 }}>
            {track.name}
          </Typography>
          <Stack direction="row">
            <IconButton size="small" sx={{ p: 0.5 }}>
              {track.isLocked ? <Lock size={14} /> : <LockOpen size={14} />}
            </IconButton>
            <IconButton size="small" sx={{ p: 0.5 }}>
              {track.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </IconButton>
          </Stack>
        </Box>

        {/* 轨道内容区 */}
        <Box
          sx={{
            position: 'relative',
            flexGrow: 1,
            height: '100%',
            bgcolor: track.isLocked ? 'rgba(0, 0, 0, 0.04)' : 'white',
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
    let clipColor = '';
    switch (track.type) {
      case 'video':
        clipStyle = { bgcolor: '#A29BFE' }; // 使用主题的紫色
        clipColor = '#6C5CE7';
        break;
      case 'audio':
        clipStyle = { bgcolor: '#81ECEC' }; // 浅青色
        clipColor = '#00CEC9';
        break;
      case 'text':
        clipStyle = { bgcolor: '#FFEAA7' }; // 浅黄色
        clipColor = '#FDCB6E';
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
          border: isSelected ? `2px solid ${clipColor}` : 'none',
          opacity: 0.9,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Typography variant="caption" sx={{ color: '#333', px: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
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
      }}
    >
      {/* 播放控件 */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '4px 12px',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={editorState.playbackState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
            onClick={togglePlayback}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              borderColor: '#6C5CE7',
              color: '#6C5CE7',
              '&:hover': { borderColor: '#5649C1', color: '#5649C1' },
              mr: 1,
            }}
          >
            {editorState.playbackState === 'playing' ? '暂停' : '播放'}
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {`${Math.floor(editorState.currentTime / 60000)}:${Math.floor((editorState.currentTime % 60000) / 1000).toString().padStart(2, '0')} / ${Math.floor((editorState.project.settings.duration || 0) / 60000)}:${Math.floor(((editorState.project.settings.duration || 0) % 60000) / 1000).toString().padStart(2, '0')}`}
        </Typography>
      </Box>

      {/* 时间轴 */}
      <Box
        ref={timelineContainerRef}
        sx={{
          position: 'relative',
          flexGrow: 1,
          overflow: 'auto',
        }}
        onClick={handleTimelineClick}
        onMouseDown={handleTimelineMouseDown}
      >
        {/* 时间标尺 */}
        <Box
          sx={{
            height: TIMELINE_HEIGHT,
            borderBottom: '1px solid #E0E0E0',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: 'white',
          }}
        >
          <Box 
            sx={{ 
              position: 'absolute', 
              left: 0, 
              top: 0, 
              width: HEADER_WIDTH, 
              height: '100%', 
              borderRight: '1px solid #E0E0E0',
              bgcolor: '#f8f9fa',
              zIndex: 3,
            }}
          />
          
          <Box 
            sx={{ 
              position: 'relative', 
              height: '100%', 
              marginLeft: `${HEADER_WIDTH}px`, 
              padding: '0 0 0 8px',
            }}
          >
            {generateTimeScale()}
          </Box>
        </Box>

        {/* 轨道容器 */}
        <Box>
          {editorState.project.tracks.map((track, index) => renderTrack(track, index))}
        </Box>

        {/* 当前时间指示线 */}
        {renderCurrentTimeIndicator()}
      </Box>
    </Box>
  );
};

export default Timeline; 