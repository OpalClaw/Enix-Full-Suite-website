import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';

const SMART_FIELDS = [
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_email', label: 'Customer Email' },
  { key: 'customer_phone', label: 'Customer Phone' },
  { key: 'property_address', label: 'Property Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP Code' },
  { key: 'job_number', label: 'Job Number' },
  { key: 'service_type', label: 'Service Type' },
  { key: 'contract_amount', label: 'Contract Amount' },
  { key: 'estimate_amount', label: 'Estimate Amount' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'completion_date', label: 'Completion Date' },
];

export default function SmartDocumentPortal({ documentId, document, job, onClose }) {
  const [draggedField, setDraggedField] = useState(null);
  const [fieldPositions, setFieldPositions] = useState(document?.field_positions || {});
  const [documentName, setDocumentName] = useState(document?.document_name || '');
  const [jobData, setJobData] = useState(job || {});
  const [showSidebars, setShowSidebars] = useState(true);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      let updatedUrl = data.document_url;

      if (data.document_url?.toLowerCase().endsWith('.pdf') && Object.keys(data.field_positions).length > 0) {
        try {
          const pdfRes = await base44.functions.invoke('generateSmartPDF', {
            documentUrl: data.document_url,
            fieldPositions: data.field_positions,
            smartFields: Object.keys(data.field_positions).reduce((acc, key) => {
              acc[key] = true;
              return acc;
            }, {}),
            jobData: job,
          });
          updatedUrl = pdfRes.data.file_url;
        } catch (error) {
          console.error('PDF generation error:', error);
        }
      }

      return base44.entities.EstimateDocuments.update(documentId, {
        document_name: documentName,
        smart_fields: Object.keys(data.field_positions).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {}),
        field_positions: data.field_positions,
        document_url: updatedUrl,
      }).then(() => {
        // Also update the job if job data was modified
        if (data.jobData) {
          return base44.entities.Job.update(job.id, data.jobData);
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleDragStart = (fieldKey, e) => {
    setDraggedField(fieldKey);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
   e.preventDefault();
   e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropOnPDF = (e) => {
   e.preventDefault();
   if (!draggedField || !containerRef.current) return;

   const rect = containerRef.current.getBoundingClientRect();
   const x = e.clientX - rect.left + containerRef.current.scrollLeft;
   const y = e.clientY - rect.top + containerRef.current.scrollTop;

   setFieldPositions(prev => ({
     ...prev,
     [draggedField]: { x, y },
   }));
   setDraggedField(null);
  };

  const handleFieldDragOnCanvas = (fieldKey, e) => {
    if (e.type === 'dragend') {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const y = e.clientY - rect.top + containerRef.current.scrollTop;

      setFieldPositions(prev => ({
        ...prev,
        [fieldKey]: { x, y },
      }));
    }
  };

  const handleRemoveField = (fieldKey) => {
    setFieldPositions(prev => {
      const newPos = { ...prev };
      delete newPos[fieldKey];
      return newPos;
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      document_url: document.document_url,
      field_positions: fieldPositions,
      jobData: jobData,
    });
  };

  const getSmartFieldValue = (fieldKey) => {
    const value = jobData[fieldKey];
    if (value === null || value === undefined) {
      return `[${SMART_FIELDS.find(f => f.key === fieldKey)?.label || fieldKey}]`;
    }
    return String(value);
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-[95vw] h-[95vh] bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-primary to-primary/90">
          <div>
            <h2 className="text-lg font-semibold text-white">{documentName}</h2>
            <p className="text-xs text-white/80">Drag fields onto the document to place them</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebars(!showSidebars)}
              className="text-white hover:bg-white/20 text-xs"
            >
              {showSidebars ? '◀ Hide' : 'Show ▶'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
         <div className="flex flex-1 overflow-hidden">
           {/* Left Sidebar - Smart Fields */}
           {showSidebars && (
           <div className="w-48 border-r bg-gray-50 p-3 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Smart Fields</h3>
            <div className="space-y-2">
              {SMART_FIELDS.map(field => (
                <div
                  key={field.key}
                  draggable
                  onDragStart={(e) => handleDragStart(field.key, e)}
                  className={`p-3 rounded-lg border-2 cursor-move transition ${
                    fieldPositions[field.key]
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 bg-white hover:border-primary hover:bg-blue-50'
                  }`}
                >
                  <div className="font-semibold text-xs text-gray-900">{field.label}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{`{{${field.key}}}`}</div>
                  {fieldPositions[field.key] && (
                    <div className="text-xs text-primary font-medium mt-1">✓ Placed</div>
                  )}
                </div>
              ))}
              </div>
              </div>
              )}  

          {/* Center - Document Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              ref={containerRef}
              onDragOver={handleDragOver}
              onDrop={handleDropOnPDF}
              className="flex-1 overflow-auto bg-gray-100 p-4"
              style={{ position: 'relative' }}
            >
              <div className="relative w-full h-full">
                <iframe
                  src={document.document_url}
                  className="w-full h-full block bg-white shadow-lg"
                  style={{ minHeight: '100%', display: 'block' }}
                />

                {/* Field Badges with Live Data */}
                 {Object.entries(fieldPositions).map(([fieldKey, pos]) => (
                   <div
                     key={fieldKey}
                     onDragEnd={(e) => handleFieldDragOnCanvas(fieldKey, e)}
                     onContextMenu={(e) => {
                       e.preventDefault();
                       handleRemoveField(fieldKey);
                     }}
                     draggable
                     className="px-2 py-1 rounded-lg text-xs font-semibold shadow-lg transition cursor-grab active:cursor-grabbing max-w-xs bg-primary/90 text-white hover:bg-primary"
                     style={{
                       position: 'fixed',
                       left: `${pos.x}px`,
                       top: `${pos.y}px`,
                       zIndex: 50,
                       whiteSpace: 'nowrap',
                       overflow: 'hidden',
                       textOverflow: 'ellipsis',
                     }}
                     title={getSmartFieldValue(fieldKey)}
                   >
                     {getSmartFieldValue(fieldKey)}
                   </div>
                 ))}
              </div>
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {Object.keys(fieldPositions).length} field{Object.keys(fieldPositions).length !== 1 ? 's' : ''} placed
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}