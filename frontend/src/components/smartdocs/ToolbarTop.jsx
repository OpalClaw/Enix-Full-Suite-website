import React from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Copy, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

export default function ToolbarTop({ onAddBlock }) {
  return (
    <div className="border-b bg-white p-3 flex items-center gap-2 overflow-x-auto">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r pr-3">
        <Button variant="ghost" size="sm" className="gap-1">
          <Bold className="w-4 h-4" />
          Bold
        </Button>
        <Button variant="ghost" size="sm" className="gap-1">
          <Italic className="w-4 h-4" />
          Italic
        </Button>
        <Button variant="ghost" size="sm" className="gap-1">
          <Underline className="w-4 h-4" />
          Underline
        </Button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r pr-3">
        <Button variant="ghost" size="sm" title="Left align">
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Center align">
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Right align">
          <AlignRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Lists */}
      <Button variant="ghost" size="sm" className="gap-1">
        <List className="w-4 h-4" />
        List
      </Button>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 border-r pr-3">
        <Button variant="ghost" size="sm" title="Undo">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Redo">
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-gray-600 px-2">100%</span>
        <Button variant="ghost" size="sm" title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}