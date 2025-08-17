'use client';

import React from 'react';
import { DragDropSidebar } from '../../DragDropSidebar';

const LibraryTab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto min-h-0">
      <DragDropSidebar nodePanelOpen={false} onRequestCloseNodePanel={() => {}} />
    </div>
  );
};

export default LibraryTab;
