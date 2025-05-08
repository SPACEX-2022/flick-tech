'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import { Asset } from './types/editor';

// 示例资源
const sampleAssets: Omit<Asset, 'id' | 'createdAt'>[] = [
  {
    name: '样本视频1',
    type: 'video',
    src: 'https://download.samplelib.com/mp4/sample-5s.mp4',
    thumbnail: 'https://picsum.photos/200/112?random=1',
    duration: 5000,
  },
  {
    name: '样本视频2',
    type: 'video',
    src: 'https://download.samplelib.com/mp4/sample-10s.mp4',
    thumbnail: 'https://picsum.photos/200/112?random=2',
    duration: 10000,
  },
  {
    name: '样本音频1',
    type: 'audio',
    src: 'https://download.samplelib.com/mp3/sample-3s.mp3',
    thumbnail: 'https://picsum.photos/200/112?random=3',
    duration: 3000,
  },
  {
    name: '样本音频2',
    type: 'audio',
    src: 'https://download.samplelib.com/mp3/sample-9s.mp3',
    thumbnail: 'https://picsum.photos/200/112?random=4',
    duration: 9000,
  },
  {
    name: '样本图像1',
    type: 'image',
    src: 'https://picsum.photos/1280/720?random=5',
    thumbnail: 'https://picsum.photos/200/112?random=5',
  },
  {
    name: '文本标题1',
    type: 'text',
    src: '这是一个标题文本',
    duration: 5000,
  },
];

// 使用dynamic导入包含EditorProvider的包装组件
const FlickVideoEditor = dynamic(
  () => import('./components/EditorWrapper').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <CircularProgress />
      </Box>
    ),
  }
);

export default function Home() {
  return <FlickVideoEditor initialAssets={sampleAssets} />;
}
