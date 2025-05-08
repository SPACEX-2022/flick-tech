'use client';

import { Box, Typography, Divider, TextField, Slider, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useEditor } from '../context/EditorContext';
import { useState, useEffect } from 'react';

const PropertiesPanel = () => {
  const { editorState } = useEditor();
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // 监听选中资源变化
  useEffect(() => {
    if (editorState.selectedAssetIds.length > 0) {
      const assetId = editorState.selectedAssetIds[0];
      const asset = editorState.project.assets.find(asset => asset.id === assetId);
      setSelectedAsset(asset);
    } else {
      setSelectedAsset(null);
    }
  }, [editorState.selectedAssetIds, editorState.project.assets]);

  // 如果没有选中任何内容，显示空面板
  if (!selectedAsset) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>属性</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            选择素材或时间轴中的片段以编辑其属性
          </Typography>
        </Box>
      </Box>
    );
  }

  // 根据选中资源类型渲染不同的属性编辑器
  const renderAssetProperties = () => {
    switch (selectedAsset.type) {
      case 'video':
        return renderVideoProperties();
      case 'image':
        return renderImageProperties();
      case 'audio':
        return renderAudioProperties();
      case 'text':
        return renderTextProperties();
      default:
        return null;
    }
  };

  // 视频属性编辑器
  const renderVideoProperties = () => {
    return (
      <>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>视频属性</Typography>
        <TextField
          fullWidth
          size="small"
          label="名称"
          value={selectedAsset.name}
          margin="dense"
          disabled
        />
        {selectedAsset.duration && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            时长: {Math.floor(selectedAsset.duration / 60000)}:
            {Math.floor((selectedAsset.duration % 60000) / 1000).toString().padStart(2, '0')}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>视频效果</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            不透明度
          </Typography>
          <Slider
            size="small"
            defaultValue={100}
            step={1}
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            缩放
          </Typography>
          <Slider
            size="small"
            defaultValue={100}
            step={1}
            min={10}
            max={200}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>滤镜</InputLabel>
          <Select
            label="滤镜"
            defaultValue="none"
          >
            <MenuItem value="none">无</MenuItem>
            <MenuItem value="grayscale">灰度</MenuItem>
            <MenuItem value="sepia">怀旧</MenuItem>
            <MenuItem value="brightness">明亮</MenuItem>
            <MenuItem value="contrast">对比度</MenuItem>
          </Select>
        </FormControl>
      </>
    );
  };

  // 图片属性编辑器
  const renderImageProperties = () => {
    return (
      <>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>图片属性</Typography>
        <TextField
          fullWidth
          size="small"
          label="名称"
          value={selectedAsset.name}
          margin="dense"
          disabled
        />
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>图片效果</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            不透明度
          </Typography>
          <Slider
            size="small"
            defaultValue={100}
            step={1}
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            缩放
          </Typography>
          <Slider
            size="small"
            defaultValue={100}
            step={1}
            min={10}
            max={200}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            旋转 (度)
          </Typography>
          <Slider
            size="small"
            defaultValue={0}
            step={1}
            min={-180}
            max={180}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>滤镜</InputLabel>
          <Select
            label="滤镜"
            defaultValue="none"
          >
            <MenuItem value="none">无</MenuItem>
            <MenuItem value="grayscale">灰度</MenuItem>
            <MenuItem value="sepia">怀旧</MenuItem>
            <MenuItem value="brightness">明亮</MenuItem>
            <MenuItem value="contrast">对比度</MenuItem>
            <MenuItem value="blur">模糊</MenuItem>
          </Select>
        </FormControl>
      </>
    );
  };

  // 音频属性编辑器
  const renderAudioProperties = () => {
    return (
      <>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>音频属性</Typography>
        <TextField
          fullWidth
          size="small"
          label="名称"
          value={selectedAsset.name}
          margin="dense"
          disabled
        />
        {selectedAsset.duration && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            时长: {Math.floor(selectedAsset.duration / 60000)}:
            {Math.floor((selectedAsset.duration % 60000) / 1000).toString().padStart(2, '0')}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>音频效果</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            音量
          </Typography>
          <Slider
            size="small"
            defaultValue={100}
            step={1}
            min={0}
            max={200}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            淡入 (秒)
          </Typography>
          <Slider
            size="small"
            defaultValue={0}
            step={0.1}
            min={0}
            max={5}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            淡出 (秒)
          </Typography>
          <Slider
            size="small"
            defaultValue={0}
            step={0.1}
            min={0}
            max={5}
            valueLabelDisplay="auto"
          />
        </Box>
      </>
    );
  };

  // 文字属性编辑器
  const renderTextProperties = () => {
    return (
      <>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>文字属性</Typography>
        <TextField
          fullWidth
          size="small"
          label="名称"
          value={selectedAsset.name}
          margin="dense"
        />
        
        <TextField
          fullWidth
          size="small"
          label="文字内容"
          defaultValue="输入文字"
          margin="dense"
          multiline
          rows={2}
          sx={{ mt: 1 }}
        />
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>文字样式</Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>字体</InputLabel>
          <Select
            label="字体"
            defaultValue="arial"
          >
            <MenuItem value="arial">Arial</MenuItem>
            <MenuItem value="times">Times New Roman</MenuItem>
            <MenuItem value="courier">Courier New</MenuItem>
            <MenuItem value="georgia">Georgia</MenuItem>
            <MenuItem value="verdana">Verdana</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            字体大小
          </Typography>
          <Slider
            size="small"
            defaultValue={24}
            step={1}
            min={8}
            max={72}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            不透明度
          </Typography>
          <Slider
            size="small"
            defaultValue={100}
            step={1}
            min={0}
            max={100}
            valueLabelDisplay="auto"
          />
        </Box>
        
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button variant="outlined" size="small" sx={{ minWidth: 'auto' }}>
            B
          </Button>
          <Button variant="outlined" size="small" sx={{ minWidth: 'auto' }}>
            I
          </Button>
          <Button variant="outlined" size="small" sx={{ minWidth: 'auto' }}>
            U
          </Button>
          <TextField
            label="颜色"
            size="small"
            type="color"
            defaultValue="#ffffff"
            sx={{ width: 120, ml: 'auto' }}
          />
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        属性 - {selectedAsset.name}
      </Typography>
      <Divider />
      {renderAssetProperties()}
    </Box>
  );
};

export default PropertiesPanel; 