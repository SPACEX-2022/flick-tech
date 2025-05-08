'use client';

import React, { ReactNode, useState } from 'react';
import { ResizableBox, ResizableBoxProps } from 'react-resizable';
import { Box } from '@mui/material';

// 样式到处理，避免SSR问题
const resizableStyles = `
.react-resizable {
  position: relative;
}
.react-resizable-handle {
  position: absolute;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  background-position: bottom right;
  transition: all 0.2s ease;
}
.react-resizable-handle-e {
  right: -4px;
  top: 0;
  width: 8px;
  cursor: ew-resize;
  height: 100%;
  background-image: linear-gradient(90deg, transparent 40%, rgba(72, 209, 204, 0.1) 50%, rgba(72, 209, 204, 0.3) 70%);
}
.react-resizable-handle-e:hover {
  background-image: linear-gradient(90deg, transparent 40%, rgba(72, 209, 204, 0.3) 50%, rgba(72, 209, 204, 0.6) 70%);
}
.react-resizable-handle-s {
  bottom: -4px;
  left: 0;
  height: 8px;
  width: 100%;
  cursor: ns-resize;
  background-image: linear-gradient(0deg, transparent 40%, rgba(72, 209, 204, 0.1) 50%, rgba(72, 209, 204, 0.3) 70%);
}
.react-resizable-handle-s:hover {
  background-image: linear-gradient(0deg, transparent 40%, rgba(72, 209, 204, 0.3) 50%, rgba(72, 209, 204, 0.6) 70%);
}
.react-resizable-handle-active {
  background-image: linear-gradient(90deg, transparent 40%, rgba(72, 209, 204, 0.6) 50%, rgba(72, 209, 204, 0.9) 70%) !important;
}
`;

interface ResizablePanelProps {
  children: ReactNode;
  defaultWidth: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
  className?: string;
  style?: React.CSSProperties;
}

const ResizablePanel = ({
  children,
  defaultWidth,
  defaultHeight = Infinity,
  minWidth = 100,
  minHeight = 100,
  maxWidth = Infinity,
  maxHeight = Infinity,
  resizeHandles = ['e'],
  className = '',
  style = {},
}: ResizablePanelProps) => {
  const [width, setWidth] = useState(defaultWidth);
  const [height, setHeight] = useState(defaultHeight);

  return (
    <>
      <style jsx global>{resizableStyles}</style>
      <ResizableBox
        width={width}
        height={height}
        minConstraints={[minWidth, minHeight]}
        maxConstraints={[maxWidth, maxHeight]}
        resizeHandles={resizeHandles}
        className={`react-resizable ${className}`}
        style={style}
        onResize={(e, data) => {
          setWidth(data.size.width);
          setHeight(data.size.height);
        }}
      >
        <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          {children}
        </Box>
      </ResizableBox>
    </>
  );
};

export default ResizablePanel; 