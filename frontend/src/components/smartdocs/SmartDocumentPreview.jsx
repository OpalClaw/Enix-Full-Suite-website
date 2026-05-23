import React, { useMemo } from 'react';
import { replaceMergeFields, extractMergeFields } from '@/lib/smartDocFieldEngine';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function SmartDocumentPreview({ content, smartData, isLoading }) {
  const renderedContent = useMemo(() => {
    if (!content || !smartData) return null;

    // Render blocks with merge field replacements
    return (content.blocks || []).map((block, idx) => {
      if (block.type === 'text') {
        const replacedText = replaceMergeFields(block.text, smartData);
        return (
          <div key={idx} className="mb-4 text-sm leading-relaxed whitespace-pre-wrap">
            {replacedText}
          </div>
        );
      }

      if (block.type === 'heading') {
        const replacedText = replaceMergeFields(block.text, smartData);
        return (
          <h2 key={idx} className={`mb-3 font-bold ${block.level === 1 ? 'text-2xl' : block.level === 2 ? 'text-xl' : 'text-lg'}`}>
            {replacedText}
          </h2>
        );
      }

      if (block.type === 'table') {
        return (
          <table key={idx} className="w-full border-collapse mb-4 text-sm">
            <tbody>
              {block.rows?.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx === 0 ? 'bg-gray-100 font-semibold' : ''}>
                  {row.map((cell, cellIdx) => {
                    const replacedCell = replaceMergeFields(cell, smartData);
                    return (
                      <td
                        key={cellIdx}
                        className={`border p-2 ${rowIdx === 0 ? 'font-semibold' : ''}`}
                      >
                        {replacedCell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if (block.type === 'signature') {
        return (
          <div key={idx} className="mt-8 pt-4 border-t">
            <p className="text-sm mb-12">_________________________</p>
            <p className="text-sm">{block.label || 'Signature'}</p>
            {block.signerEmail && (
              <p className="text-xs text-muted-foreground">{block.signerEmail}</p>
            )}
          </div>
        );
      }

      if (block.type === 'image') {
        return (
          <div key={idx} className="mb-4">
            <img
              src={block.src}
              alt={block.alt || 'Document image'}
              className="max-w-full h-auto rounded"
            />
          </div>
        );
      }

      return null;
    });
  }, [content, smartData]);

  // Find unmapped fields
  const contentText = JSON.stringify(content);
  const usedFields = extractMergeFields(contentText);
  const unmappedFields = usedFields.filter(
    field => !field.split('.').reduce((obj, key) => obj?.[key], smartData)
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white rounded-lg p-8 shadow-sm">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-3"></div>
              <p>Loading job data...</p>
            </div>
          ) : smartData ? (
            <div className="prose prose-sm max-w-none">
              {renderedContent}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Select a job to preview</p>
          )}
        </div>
      </div>

      {/* Unmapped Fields Warning */}
      {unmappedFields.length > 0 && (
        <div className="border-t p-4 bg-yellow-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Unmapped Fields</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {unmappedFields.map((field, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-2">These fields don't have values in the current job data.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}