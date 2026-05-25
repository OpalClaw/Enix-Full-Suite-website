import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Image as ImageIcon, Signature, Calendar, Square } from 'lucide-react';

export default function FieldsPanel({ fields, onAddBlock }) {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [...new Set(fields.map(f => f.category))];

  const BLOCK_TYPES = [
    { type: 'text', label: 'Text', icon: Type },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'signature', label: 'Signature', icon: Signature },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'checkbox', label: 'Checkbox', icon: Square },
  ];

  return (
    <div className="w-64 border-r bg-white p-4 overflow-y-auto">
      <h3 className="font-semibold text-sm mb-4">Add Content</h3>

      {/* Block Types */}
      <div className="space-y-2 mb-6 pb-6 border-b">
        {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAddBlock(type)}
            className="w-full flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-navy-300 hover:bg-navy-50 transition text-left text-sm"
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Smart Fields */}
      <h3 className="font-semibold text-sm mb-3">Smart Fields</h3>
      <Input
        placeholder="Search fields..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 text-xs"
      />

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-2">
            {fields
              .filter(f => f.category === category && f.label.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(field => (
                <button
                  key={field.key}
                  onClick={() => onAddBlock('mergefield', field.key)}
                  className="w-full text-left p-2 rounded-lg border border-blue-200 bg-blue-50 hover:border-blue-400 transition text-xs"
                >
                  <div className="font-medium text-blue-900">{field.label}</div>
                  <div className="text-blue-600">{`{{${field.key}}}`}</div>
                </button>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}