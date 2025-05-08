'use client';

import { useState } from 'react';
import { Button, Tabs, Tab, Box, Typography, IconButton, Grid, Card, CardMedia, CardContent, CardActions } from '@mui/material';
import { PlusCircle, Trash2, Film, Image, Music, Type } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { Asset, AssetType } from '../types/editor';

const AssetLibrary = () => {
  const { editorState, addAsset, removeAsset, selectAsset } = useEditor();
  const [tabValue, setTabValue] = useState(0);
  
  // 根据不同类型筛选素材
  const videoAssets = editorState.project.assets.filter(asset => asset.type === 'video');
  const imageAssets = editorState.project.assets.filter(asset => asset.type === 'image');
  const audioAssets = editorState.project.assets.filter(asset => asset.type === 'audio');
  const textAssets = editorState.project.assets.filter(asset => asset.type === 'text');

  // 获取文件类型的图标
  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'video': return <Film size={18} />;
      case 'image': return <Image size={18} />;
      case 'audio': return <Music size={18} />;
      case 'text': return <Type size={18} />;
    }
  };

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

  // 处理选中素材
  const handleAssetSelect = (assetId: string) => {
    selectAsset(assetId);
  };

  // 处理删除素材
  const handleAssetDelete = (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation();
    removeAsset(assetId);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="视频" icon={<Film size={16} />} iconPosition="start" />
          <Tab label="图片" icon={<Image size={16} />} iconPosition="start" />
          <Tab label="音频" icon={<Music size={16} />} iconPosition="start" />
          <Tab label="文字" icon={<Type size={16} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* 视频素材面板 */}
      <Box hidden={tabValue !== 0} sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">视频素材</Typography>
          <Button
            component="label"
            startIcon={<PlusCircle size={16} />}
            size="small"
          >
            添加视频
            <input
              type="file"
              hidden
              accept="video/*"
              multiple
              onChange={(e) => handleFileUpload(e, 'video')}
            />
          </Button>
        </Box>

        <Grid container spacing={2}>
          {videoAssets.map((asset) => (
            <Grid item xs={6} key={asset.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: editorState.selectedAssetIds.includes(asset.id) ? '2px solid #1976d2' : 'none',
                }}
                onClick={() => handleAssetSelect(asset.id)}
              >
                <CardMedia
                  component="img"
                  height="100"
                  image={asset.thumbnail || '/placeholder-video.jpg'}
                  alt={asset.name}
                />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="body2" noWrap>{asset.name}</Typography>
                  {asset.duration && (
                    <Typography variant="caption" color="text.secondary">
                      {Math.floor(asset.duration / 60000)}:{Math.floor((asset.duration % 60000) / 1000).toString().padStart(2, '0')}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ p: 0.5, justifyContent: 'flex-end' }}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleAssetDelete(e, asset.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 图片素材面板 */}
      <Box hidden={tabValue !== 1} sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">图片素材</Typography>
          <Button
            component="label"
            startIcon={<PlusCircle size={16} />}
            size="small"
          >
            添加图片
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e, 'image')}
            />
          </Button>
        </Box>

        <Grid container spacing={2}>
          {imageAssets.map((asset) => (
            <Grid item xs={6} key={asset.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: editorState.selectedAssetIds.includes(asset.id) ? '2px solid #1976d2' : 'none',
                }}
                onClick={() => handleAssetSelect(asset.id)}
              >
                <CardMedia
                  component="img"
                  height="100"
                  image={asset.src}
                  alt={asset.name}
                />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="body2" noWrap>{asset.name}</Typography>
                </CardContent>
                <CardActions sx={{ p: 0.5, justifyContent: 'flex-end' }}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleAssetDelete(e, asset.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 音频素材面板 */}
      <Box hidden={tabValue !== 2} sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">音频素材</Typography>
          <Button
            component="label"
            startIcon={<PlusCircle size={16} />}
            size="small"
          >
            添加音频
            <input
              type="file"
              hidden
              accept="audio/*"
              multiple
              onChange={(e) => handleFileUpload(e, 'audio')}
            />
          </Button>
        </Box>

        <Grid container spacing={2}>
          {audioAssets.map((asset) => (
            <Grid item xs={12} key={asset.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: editorState.selectedAssetIds.includes(asset.id) ? '2px solid #1976d2' : 'none',
                }}
                onClick={() => handleAssetSelect(asset.id)}
              >
                <CardContent sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                  <Music size={24} style={{ marginRight: 8 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" noWrap>{asset.name}</Typography>
                    {asset.duration && (
                      <Typography variant="caption" color="text.secondary">
                        {Math.floor(asset.duration / 60000)}:{Math.floor((asset.duration % 60000) / 1000).toString().padStart(2, '0')}
                      </Typography>
                    )}
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleAssetDelete(e, asset.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 文字素材面板 */}
      <Box hidden={tabValue !== 3} sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">文字素材</Typography>
          <Button
            startIcon={<PlusCircle size={16} />}
            size="small"
            onClick={createTextAsset}
          >
            添加文字
          </Button>
        </Box>

        <Grid container spacing={2}>
          {textAssets.map((asset) => (
            <Grid item xs={12} key={asset.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: editorState.selectedAssetIds.includes(asset.id) ? '2px solid #1976d2' : 'none',
                }}
                onClick={() => handleAssetSelect(asset.id)}
              >
                <CardContent sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                  <Type size={24} style={{ marginRight: 8 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" noWrap>{asset.name}</Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleAssetDelete(e, asset.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default AssetLibrary; 