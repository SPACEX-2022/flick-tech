export type AssetType = 'video' | 'image' | 'audio' | 'text';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  src: string;
  duration?: number; // 仅对视频和音频有效
  thumbnail?: string; // 缩略图URL
  createdAt: Date;
}

export interface TimelineClip {
  id: string;
  assetId: string;
  startTime: number; // 在时间轴上的开始时间（毫秒）
  endTime: number; // 在时间轴上的结束时间（毫秒）
  trackId: string; // 所在轨道ID
  inPoint: number; // 素材内部的开始点（毫秒）
  outPoint: number; // 素材内部的结束点（毫秒）
  // 可以添加其他属性，如变换、滤镜等
  transform?: {
    position?: { x: number, y: number };
    scale?: number;
    rotation?: number;
  };
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  clips: TimelineClip[];
  isLocked: boolean;
  isVisible: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  assets: Asset[];
  tracks: Track[];
  // 视频设置
  settings: {
    width: number;
    height: number;
    frameRate: number;
    duration: number;
  };
}

export interface EditorState {
  project: Project;
  currentTime: number;
  selectedAssetIds: string[];
  selectedClipIds: string[];
  selectedTrackIds: string[];
  playbackState: 'playing' | 'paused';
  zoom: number;
} 