'use client';

import { FC } from 'react';
import { EditorProvider } from '../context/EditorContext';
import VideoEditor from './VideoEditor';
import { Asset } from '../types/editor';

interface EditorWrapperProps {
  initialAssets?: Omit<Asset, 'id' | 'createdAt'>[];
}

const EditorWrapper: FC<EditorWrapperProps> = ({ initialAssets = [] }) => {
  return (
    <EditorProvider>
      <VideoEditor initialAssets={initialAssets} />
    </EditorProvider>
  );
};

export default EditorWrapper; 