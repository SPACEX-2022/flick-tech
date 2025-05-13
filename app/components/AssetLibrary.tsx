'use client';

import { useState } from 'react';
import { Button, Tabs, Tab, Box, Typography, IconButton, Grid, Card, CardMedia, CardContent, CardActions } from '@mui/material';
import { PlusCircle, Trash2, Film, Image, Music, Type, ArrowDownToLine, Upload } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { Asset, AssetType } from '../types/editor';

const AssetLibrary = () => {
  const { editorState, addAsset, removeAsset, selectAsset, addClip } = useEditor();
  const [tabValue, setTabValue] = useState(0);
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);
  
  // 根据不同类型筛选素材
  const videoAssets = editorState.project.assets.filter(asset => asset.type === 'video');
  const imageAssets = editorState.project.assets.filter(asset => asset.type === 'image');
  const audioAssets = editorState.project.assets.filter(asset => asset.type === 'audio');
  const textAssets = editorState.project.assets.filter(asset => asset.type === 'text');

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: AssetType) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileUrl = URL.createObjectURL(file);
      
      // 对于视频和音频，获取其时长
      let duration: number | undefined;
      
      if (type === 'video' || type === 'audio') {
        const mediaElement = type === 'video' 
          ? document.createElement('video') 
          : document.createElement('audio');
        
        mediaElement.src = fileUrl;
        
        // 等待元数据加载完成以获取时长
        await new Promise<void>((resolve) => {
          mediaElement.onloadedmetadata = () => {
            duration = mediaElement.duration * 1000; // 转换为毫秒
            resolve();
          };
        });
      }
      
      // 对于视频和图片，创建缩略图
      let thumbnail: string | undefined;
      
      if (type === 'video') {
        const video = document.createElement('video');
        video.src = fileUrl;
        
        // 加载视频元数据并创建缩略图
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.currentTime = 0.1; // 设置到视频开始后的一点以确保有画面
            
            video.onseeked = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                thumbnail = canvas.toDataURL('image/jpeg');
                resolve();
              }
            };
          };
        });
      } else if (type === 'image') {
        thumbnail = fileUrl;
      }
      
      // 添加新的素材
      addAsset({
        name: file.name,
        type,
        src: fileUrl,
        duration,
        thumbnail,
      });
    }
    
    // 重置文件输入
    event.target.value = '';
  };

  // 创建文字素材
  const createTextAsset = () => {
    addAsset({
      name: '新建文字',
      type: 'text',
      src: '', // 文字素材不需要源文件
    });
  };

  // 处理添加到轨道
  const handleAddToTrack = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation();
    
    // 找到符合类型的第一个轨道
    const trackType = asset.type === 'audio' ? 'audio' : 'video';
    const track = editorState.project.tracks.find(t => t.type === trackType);
    
    if (!track) return;
    
    // 计算新片段的位置
    const currentTime = editorState.currentTime;
    const clipDuration = asset.duration || 5000; // 默认5秒
    
    // 添加剪辑到轨道
    addClip({
      assetId: asset.id,
      trackId: track.id,
      startTime: currentTime,
      endTime: currentTime + clipDuration,
      inPoint: 0,
      outPoint: clipDuration,
    });
  };
  
  const renderAssets = (assets: Asset[], type: AssetType) => {
    if (assets.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center', 
          height: 200,
          color: 'text.secondary'
        }}>
          <Upload size={32} strokeWidth={1.5} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {type === 'video' && '将视频拖到此处'}
            {type === 'image' && '将图片拖到此处'}
            {type === 'audio' && '将音频拖到此处'}
            {type === 'text' && '点击添加文本'}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {assets.map((asset) => (
          <Box 
            key={asset.id} 
            sx={{ width: 'calc(50% - 4px)', flexShrink: 0 }}
          >
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: editorState.selectedAssetIds.includes(asset.id) ? '2px solid #6C5CE7' : 'none',
                position: 'relative',
                borderRadius: 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                },
              }}
              onClick={() => selectAsset(asset.id)}
              onMouseEnter={() => setHoveredAssetId(asset.id)}
              onMouseLeave={() => setHoveredAssetId(null)}
            >
              {hoveredAssetId === asset.id && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    minWidth: 'auto',
                    zIndex: 10,
                    backgroundColor: 'rgba(108, 92, 231, 0.8)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(108, 92, 231, 1)',
                    },
                  }}
                  onClick={(e) => handleAddToTrack(e, asset)}
                >
                  <ArrowDownToLine size={18} />
                </Button>
              )}
              {asset.type === 'video' && (
                <Box sx={{ position: 'absolute', top: 5, right: 5, 
                  backgroundColor: 'rgba(0,0,0,0.6)', 
                  color: 'white',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '0.7rem'
                }}>
                  {asset.duration && `${Math.floor(asset.duration / 60000)}:${Math.floor((asset.duration % 60000) / 1000).toString().padStart(2, '0')}`}
                </Box>
              )}
              {(asset.type === 'video' || asset.type === 'image') && (
                <CardMedia
                  component="img"
                  height="80"
                  image={asset.thumbnail || '/placeholder-video.jpg'}
                  alt={asset.name}
                />
              )}
              {asset.type === 'audio' && (
                <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                  <Music size={24} />
                </Box>
              )}
              {asset.type === 'text' && (
                <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                  <Type size={24} />
                </Box>
              )}
              <CardContent sx={{ p: 1, pb: '4px !important' }}>
                <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                  {asset.name}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: '0 4px 4px 0', justifyContent: 'flex-end' }}>
                <IconButton 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAsset(asset.id);
                  }}
                  sx={{ padding: 0.5 }}
                >
                  <Trash2 size={14} />
                </IconButton>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8f9fa' }}>
        <Typography variant="subtitle1" sx={{ p: '12px 16px', fontWeight: 500 }}>您的媒体</Typography>
      </Box>
      <Button
        variant="outlined"
        startIcon={<PlusCircle size={16} />}
        sx={{ m: 1, color: '#6C5CE7', borderColor: '#6C5CE7', '&:hover': { borderColor: '#5649C1' } }}
        component="label"
      >
        导入媒体
        <input
          type="file"
          hidden
          accept="video/*,image/*,audio/*"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files) {
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const type: AssetType = 
                  file.type.startsWith('video/') ? 'video' :
                  file.type.startsWith('image/') ? 'image' :
                  file.type.startsWith('audio/') ? 'audio' : 'text';
                
                handleFileUpload({ target: { files: [file], value: '' } } as any, type);
              }
            }
          }}
        />
      </Button>
      <Tabs 
        value={tabValue} 
        onChange={(_, newValue) => setTabValue(newValue)}
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': { 
            minHeight: '40px',
            textTransform: 'none',
            fontSize: '0.85rem',
            padding: '8px 16px'
          }
        }}
      >
        <Tab label="视频" icon={<Film size={16} />} iconPosition="start" />
        <Tab label="图片" icon={<Image size={16} />} iconPosition="start" />
        <Tab label="音频" icon={<Music size={16} />} iconPosition="start" />
        <Tab label="文字" icon={<Type size={16} />} iconPosition="start" />
      </Tabs>

      <Box sx={{ p: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {/* 视频素材面板 */}
        <Box hidden={tabValue !== 0} sx={{ height: '100%' }}>
          {renderAssets(videoAssets, 'video')}
        </Box>

        {/* 图片素材面板 */}
        <Box hidden={tabValue !== 1} sx={{ height: '100%' }}>
          {renderAssets(imageAssets, 'image')}
        </Box>

        {/* 音频素材面板 */}
        <Box hidden={tabValue !== 2} sx={{ height: '100%' }}>
          {renderAssets(audioAssets, 'audio')}
        </Box>

        {/* 文字素材面板 */}
        <Box hidden={tabValue !== 3} sx={{ height: '100%' }}>
          {textAssets.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Button 
                variant="contained"
                startIcon={<Type size={16} />}
                onClick={createTextAsset}
                sx={{ bgcolor: '#6C5CE7', '&:hover': { bgcolor: '#5649C1' } }}
              >
                添加文字
              </Button>
            </Box>
          ) : (
            renderAssets(textAssets, 'text')
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AssetLibrary; 