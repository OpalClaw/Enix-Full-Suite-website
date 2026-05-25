import React from 'react';

export default function DocumentCanvas({ blocks, setBlocks, selectedBlock, setSelectedBlock }) {
  const handleBlockClick = (block) => {
    setSelectedBlock(block);
  };

  const handleBlockUpdate = (blockId, updates) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    setBlocks(updated);
  };

  const handleDragStart = (e, block) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('blockId', block.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const blockId = parseInt(e.dataTransfer.getData('blockId'));
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const newBlocks = blocks.filter(b => b.id !== blockId);
      const insertIndex = blocks.indexOf(block);
      newBlocks.splice(insertIndex, 0, block);
      setBlocks(newBlocks);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-4xl mx-auto"
      style={{ minHeight: '800px', aspectRatio: '8.5 / 11' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-12 h-full flex flex-col gap-4 overflow-y-auto">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Drag blocks or click + to add content</p>
          </div>
        ) : (
          blocks.map(block => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block)}
              onClick={() => handleBlockClick(block)}
              className={`p-4 rounded-lg border-2 transition cursor-move ${
                selectedBlock?.id === block.id
                  ? 'border-navy-500 bg-navy-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {block.type === 'text' && (
                <p style={block.style} className="text-sm whitespace-pre-wrap">{block.text}</p>
              )}
              {block.type === 'heading' && (
                <h2 className={`font-bold ${block.level === 1 ? 'text-2xl' : block.level === 2 ? 'text-xl' : 'text-lg'}`}>
                  {block.text}
                </h2>
              )}
              {block.type === 'image' && (
                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-400">Image placeholder</p>
                </div>
              )}
              {block.type === 'signature' && (
                <div className="border-2 border-dashed border-gray-300 h-20 rounded flex items-center justify-center">
                  <p className="text-sm text-gray-500">Signature Field</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}