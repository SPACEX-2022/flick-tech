'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EditorState, Project, Asset, Track, TimelineClip } from '../types/editor';

// 创建一个空的默认项目
const createEmptyProject = (): Project => ({
  id: uuidv4(),
  name: '未命名项目',
  createdAt: new Date(),
  updatedAt: new Date(),
  assets: [],
  tracks: [
    {
      id: uuidv4(),
      name: '视频轨道 1',
      type: 'video',
      clips: [],
      isLocked: false,
      isVisible: true,
    },
    {
      id: uuidv4(),
      name: '音频轨道 1',
      type: 'audio',
      clips: [],
      isLocked: false,
      isVisible: true,
    },
  ],
  settings: {
    width: 1920,
    height: 1080,
    frameRate: 30,
    duration: 0,
  },
});

// 创建默认编辑器状态
const defaultEditorState: EditorState = {
  project: createEmptyProject(),
  currentTime: 0,
  selectedAssetIds: [],
  selectedClipIds: [],
  selectedTrackIds: [],
  playbackState: 'paused',
  zoom: 1,
};

interface EditorContextType {
  editorState: EditorState;
  // 资源相关操作
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  removeAsset: (assetId: string) => void;
  selectAsset: (assetId: string) => void;
  // 轨道相关操作
  addTrack: (trackType: Track['type']) => void;
  removeTrack: (trackId: string) => void;
  // 片段相关操作
  addClip: (clip: Omit<TimelineClip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, changes: Partial<TimelineClip>) => void;
  // 播放控制
  setCurrentTime: (time: number) => void;
  togglePlayback: () => void;
  // 其他操作
  setZoom: (zoom: number) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [editorState, setEditorState] = useState<EditorState>(defaultEditorState);

  // 资源相关操作
  const addAsset = (asset: Omit<Asset, 'id' | 'createdAt'>) => {
    setEditorState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        assets: [
          ...prev.project.assets,
          { ...asset, id: uuidv4(), createdAt: new Date() },
        ],
        updatedAt: new Date(),
      },
    }));
  };

  const removeAsset = (assetId: string) => {
    setEditorState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        assets: prev.project.assets.filter((asset) => asset.id !== assetId),
        updatedAt: new Date(),
      },
      selectedAssetIds: prev.selectedAssetIds.filter((id) => id !== assetId),
    }));
  };

  const selectAsset = (assetId: string) => {
    setEditorState((prev) => ({
      ...prev,
      selectedAssetIds: [assetId],
    }));
  };

  // 轨道相关操作
  const addTrack = (trackType: Track['type']) => {
    const trackCount = editorState.project.tracks.filter(
      (t) => t.type === trackType
    ).length;
    
    const newTrack: Track = {
      id: uuidv4(),
      name: `${trackType === 'video' ? '视频' : trackType === 'audio' ? '音频' : '文字'}轨道 ${trackCount + 1}`,
      type: trackType,
      clips: [],
      isLocked: false,
      isVisible: true,
    };

    setEditorState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        tracks: [...prev.project.tracks, newTrack],
        updatedAt: new Date(),
      },
    }));
  };

  const removeTrack = (trackId: string) => {
    setEditorState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        tracks: prev.project.tracks.filter((track) => track.id !== trackId),
        updatedAt: new Date(),
      },
      selectedTrackIds: prev.selectedTrackIds.filter((id) => id !== trackId),
    }));
  };

  // 片段相关操作
  const addClip = (clip: Omit<TimelineClip, 'id'>) => {
    const newClip: TimelineClip = {
      ...clip,
      id: uuidv4(),
    };

    setEditorState((prev) => {
      // 更新轨道中的片段
      const updatedTracks = prev.project.tracks.map((track) => 
        track.id === clip.trackId
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      );

      return {
        ...prev,
        project: {
          ...prev.project,
          tracks: updatedTracks,
          updatedAt: new Date(),
        },
      };
    });
  };

  const removeClip = (clipId: string) => {
    setEditorState((prev) => {
      // 在所有轨道中查找并移除片段
      const updatedTracks = prev.project.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((clip) => clip.id !== clipId),
      }));

      return {
        ...prev,
        project: {
          ...prev.project,
          tracks: updatedTracks,
          updatedAt: new Date(),
        },
        selectedClipIds: prev.selectedClipIds.filter((id) => id !== clipId),
      };
    });
  };

  const updateClip = (clipId: string, changes: Partial<TimelineClip>) => {
    setEditorState((prev) => {
      // 在所有轨道中查找并更新片段
      const updatedTracks = prev.project.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => 
          clip.id === clipId ? { ...clip, ...changes } : clip
        ),
      }));

      return {
        ...prev,
        project: {
          ...prev.project,
          tracks: updatedTracks,
          updatedAt: new Date(),
        },
      };
    });
  };

  // 播放控制
  const setCurrentTime = (time: number) => {
    setEditorState((prev) => ({
      ...prev,
      currentTime: time,
    }));
  };

  const togglePlayback = () => {
    setEditorState((prev) => ({
      ...prev,
      playbackState: prev.playbackState === 'playing' ? 'paused' : 'playing',
    }));
  };

  // 缩放控制
  const setZoom = (zoom: number) => {
    setEditorState((prev) => ({
      ...prev,
      zoom,
    }));
  };

  return (
    <EditorContext.Provider
      value={{
        editorState,
        addAsset,
        removeAsset,
        selectAsset,
        addTrack,
        removeTrack,
        addClip,
        removeClip,
        updateClip,
        setCurrentTime,
        togglePlayback,
        setZoom,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}; 