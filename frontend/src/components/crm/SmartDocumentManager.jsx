import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, X, Edit2, Eye, Copy, FileText } from 'lucide-react';
import SmartDocumentPortal from './SmartDocumentPortal';

const DOCUMENT_TYPES = [
  { value: 'contract', label: 'Contract' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'email', label: 'Email Template' },
  { value: 'paperwork', label: 'Job Paperwork' },
  { value: 'warranty', label: 'Warranty Document' },
  { value: 'other', label: 'Other' },
];

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

export default function SmartDocumentManager({ job }) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', type: 'contract', content: '', file: null });
  const [uploadMode, setUploadMode] = useState('text');
  const [selectedType, setSelectedType] = useState('contract');
  const [portalDoc, setPortalDoc] = useState(null);

  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', job.id],
    queryFn: () => base44.entities.EstimateDocuments.filter({ estimate_id: job.id }).catch(() => []),
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      let file;
      if (data.file) {
        file = data.file;
      } else {
        file = new File([data.content], `${data.name}.txt`);
      }
      const fileUrl = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.EstimateDocuments.create({
        estimate_id: job.id,
        document_name: data.name,
        document_url: fileUrl.file_url,
        document_type: data.type,
        smart_fields: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', job.id] });
      setShowUpload(false);
      setUploadData({ name: '', type: 'contract', content: '', file: null });
      setUploadMode('text');
    },
  });



  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.EstimateDocuments.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', job.id] });
    },
  });

  const handleUpload = () => {
    if (!uploadData.name) return;
    if (uploadMode === 'text' && !uploadData.content) return;
    if (uploadMode === 'pdf' && !uploadData.file) return;
    uploadMutation.mutate(uploadData);
  };

  const handleEditPDF = (doc) => {
    if (doc.document_url?.toLowerCase().endsWith('.pdf')) {
      setPortalDoc(doc);
    }
  };





  const getSmartFieldValue = (fieldKey) => {
    const value = job[fieldKey];
    if (value === null || value === undefined) {
      return `[${SMART_FIELDS.find(f => f.key === fieldKey)?.label || fieldKey}]`;
    }
    return String(value);
  };

  const replaceSmartFields = (content) => {
    let result = content;
    SMART_FIELDS.forEach(field => {
      const jobValue = getSmartFieldValue(field.key);
      result = result.replace(new RegExp(`{{${field.key}}}`, 'g'), jobValue);
    });
    return result;
  };

  const documentsByType = {
    contract: documents.filter(d => d.document_type === 'contract'),
    proposal: documents.filter(d => d.document_type === 'proposal'),
    email: documents.filter(d => d.document_type === 'email'),
    paperwork: documents.filter(d => d.document_type === 'paperwork'),
    warranty: documents.filter(d => d.document_type === 'warranty'),
    other: documents.filter(d => d.document_type === 'other'),
  };

  return (
    <div className="space-y-4">
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Smart Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-2">Document Name *</label>
              <Input
                value={uploadData.name}
                onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
                placeholder="e.g., Master Contract 2024"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2">Document Type *</label>
              <Select value={uploadData.type} onValueChange={(type) => setUploadData({...uploadData, type})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(dt => (
                    <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2">Upload Method *</label>
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  size="sm"
                  variant={uploadMode === 'text' ? 'default' : 'outline'}
                  onClick={() => {
                    setUploadMode('text');
                    setUploadData({...uploadData, file: null});
                  }}
                >
                  Text Content
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={uploadMode === 'pdf' ? 'default' : 'outline'}
                  onClick={() => {
                    setUploadMode('pdf');
                    setUploadData({...uploadData, content: ''});
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" /> PDF File
                </Button>
              </div>
            </div>
            {uploadMode === 'text' && (
              <div>
                <label className="text-xs font-semibold block mb-2">Document Content *</label>
                <Textarea
                  value={uploadData.content}
                  onChange={(e) => setUploadData({...uploadData, content: e.target.value})}
                  placeholder="Paste your document content here. Use {{field_name}} for smart fields like {{customer_name}}, {{contract_amount}}, etc."
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Available smart fields: {SMART_FIELDS.map(f => f.key).join(', ')}
                </p>
              </div>
            )}
            {uploadMode === 'pdf' && (
              <div>
                <label className="text-xs font-semibold block mb-2">PDF File *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadData({...uploadData, file});
                    }
                  }}
                  className="w-full p-2 border border-input rounded-md"
                />
                {uploadData.file && (
                  <p className="text-xs text-green-600 mt-2">✓ File selected: {uploadData.file.name}</p>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="flex-1">
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="contract" value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid w-full grid-cols-6">
          {DOCUMENT_TYPES.map(dt => (
            <TabsTrigger key={dt.value} value={dt.value} className="text-xs">
              {dt.label.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {DOCUMENT_TYPES.map(docType => (
          <TabsContent key={docType.value} value={docType.value} className="space-y-3 max-h-[60vh] overflow-y-auto pr-4">
            {documentsByType[docType.value].map(doc => (
              <Card key={doc.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{doc.document_name}</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditPDF(doc)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(doc.id)}>
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {doc.smart_fields && Object.keys(doc.smart_fields).length > 0 && (
                    <div className="text-xs bg-blue-50 p-2 rounded">
                      <p className="font-semibold text-blue-900 mb-1">Smart Fields:</p>
                      <p className="text-blue-700">{Object.keys(doc.smart_fields).map(k => `{{${k}}}`).join(', ')}</p>
                    </div>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" /> Preview with Job Data
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>{doc.document_name} - Preview</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto min-h-0">
                        {doc.document_url?.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full border-2 border-gray-300 rounded bg-gray-100 overflow-auto">
                            <iframe
                              src={doc.document_url}
                              className="w-full h-full min-h-96"
                            />
                            {doc.field_positions && Object.entries(doc.field_positions).map(([fieldKey, pos]) => (
                              <div
                                key={fieldKey}
                                className="absolute bg-primary text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
                                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                              >
                                {getSmartFieldValue(fieldKey)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded border overflow-y-auto text-sm whitespace-pre-wrap font-mono min-h-96">
                            {replaceSmartFields(doc.content || '')}
                          </div>
                        )}
                      </div>
                      <Button onClick={() => navigator.clipboard.writeText(replaceSmartFields(doc.content || ''))} className="w-full mt-4 flex-shrink-0">
                        <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
                      </Button>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
            {documentsByType[docType.value].length === 0 && (
              <p className="text-muted-foreground text-center py-8">No {docType.label.toLowerCase()} documents</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Smart Document Portal */}
      {portalDoc && (
        <SmartDocumentPortal
          documentId={portalDoc.id}
          document={portalDoc}
          job={job}
          onClose={() => setPortalDoc(null)}
        />
      )}
    </div>
  );
}