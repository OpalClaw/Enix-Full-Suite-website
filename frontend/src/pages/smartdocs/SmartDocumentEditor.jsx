import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Signature, AlertCircle, Loader2 } from 'lucide-react';
import DocumentCanvas from '@/components/smartdocs/DocumentCanvas';
import SmartFieldsPicker from '@/components/smartdocs/SmartFieldsPicker';
import SmartDocumentPreview from '@/components/smartdocs/SmartDocumentPreview';
import ToolbarTop from '@/components/smartdocs/ToolbarTop';
import SignaturePanel from '@/components/smartdocs/SignaturePanel';

export default function SmartDocumentEditor({ documentId }) {
  const navigate = useNavigate();
  const [documentName, setDocumentName] = useState('Untitled Document');
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showSignatures, setShowSignatures] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [smartData, setSmartData] = useState(null);
  const [editorView, setEditorView] = useState('edit');
  const queryClient = useQueryClient();

  const { data: document } = useQuery({
    queryKey: ['smartDocument', documentId],
    queryFn: () => documentId ? base44.entities.SmartDocument.get(documentId) : null,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  // Load job smart data
  const { isLoading: isLoadingSmartData } = useQuery({
    queryKey: ['smartData', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return null;
      const response = await base44.functions.invoke('getJobSmartData', { jobId: selectedJobId });
      setSmartData(response.data);
      return response.data;
    },
    enabled: !!selectedJobId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SmartDocument.update(documentId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smartDocument', documentId] }),
  });

  // Initialize from existing document
  useEffect(() => {
    if (document) {
      setDocumentName(document.document_name);
      setBlocks(document.content?.blocks || []);
      if (document.job_id) {
        setSelectedJobId(document.job_id);
      }
    }
  }, [document]);

  const handleAddBlock = (blockType) => {
    const newBlock = {
      id: Date.now(),
      type: blockType,
      text: blockType === 'text' ? 'New text block' : '',
      level: blockType === 'heading' ? 1 : undefined,
      style: { fontSize: '14px', color: '#000' },
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleAddMergeField = (fieldKey) => {
    if (selectedBlock && selectedBlock.type === 'text') {
      const updated = blocks.map(b =>
        b.id === selectedBlock.id
          ? { ...b, text: `${b.text || ''} {{${fieldKey}}}` }
          : b
      );
      setBlocks(updated);
      setSelectedBlock({ ...selectedBlock, text: `${selectedBlock.text || ''} {{${fieldKey}}}` });
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      document_name: documentName,
      content: { blocks },
      job_id: selectedJobId,
      status: 'draft',
    });
  };

  const handleSaveAsTemplate = async () => {
    const templateName = prompt('Enter template name:');
    if (!templateName) return;
    try {
      await base44.entities.DocumentTemplate.create({
        template_name: templateName,
        template_type: document?.document_type || 'custom',
        category: 'User Created',
        description: `Template created from ${documentName}`,
        content: { blocks },
        merge_fields: blocks
          .flatMap(b => (b.text || '').match(/\{\{[\w.]+\}\}/g) || [])
          .filter((v, i, a) => a.indexOf(v) === i),
        is_active: true,
      });
      alert('Template saved successfully!');
    } catch (error) {
      alert('Error saving template');
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <Input
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="text-xl font-semibold border-0"
              placeholder="Document name..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSaveAsTemplate}>
              Save as Template
            </Button>
            <Button
              onClick={() => setShowSignatures(!showSignatures)}
              variant={showSignatures ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
            >
              <Signature className="w-4 h-4" />
              Signatures
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
              size="sm"
              disabled={updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={() => navigate(-1)} variant="ghost" size="icon" title="Exit editor">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Job Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Link to Job:</label>
          <select
            value={selectedJobId || ''}
            onChange={(e) => setSelectedJobId(e.target.value || null)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">Select a job...</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.job_number} - {job.customer_name}
              </option>
            ))}
          </select>
          {isLoadingSmartData && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading job data...
            </div>
          )}
          {smartData && !isLoadingSmartData && (
            <div className="text-xs text-green-600 font-medium">✓ Job data loaded</div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <ToolbarTop onAddBlock={handleAddBlock} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Fields & Blocks */}
        <div className="w-64 border-r bg-white flex flex-col overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-3">Add Block</h3>
            <div className="space-y-2 mb-4 pb-4 border-b">
              {['text', 'heading', 'image', 'signature'].map(type => (
                <button
                  key={type}
                  onClick={() => handleAddBlock(type)}
                  className="w-full text-left p-2 rounded text-xs border border-gray-200 hover:border-primary hover:bg-primary/5 transition capitalize"
                >
                  + {type}
                </button>
              ))}
            </div>

            {selectedJobId && smartData ? (
              <>
                <h3 className="font-semibold text-sm mb-3">Insert Smart Field</h3>
                <SmartFieldsPicker onFieldInsert={handleAddMergeField} />
              </>
            ) : selectedJobId ? (
              <div className="text-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Loading fields...</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Select a job above</p>
              </div>
            )}
          </div>
        </div>

        {/* Center - Editor/Preview Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={editorView} onValueChange={setEditorView} className="flex-1 flex flex-col">
            <TabsList className="border-b bg-white rounded-none">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Live Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="flex-1 overflow-auto bg-gray-100 p-8">
              <DocumentCanvas
                blocks={blocks}
                setBlocks={setBlocks}
                selectedBlock={selectedBlock}
                setSelectedBlock={setSelectedBlock}
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden">
              <SmartDocumentPreview
                content={{ blocks }}
                smartData={smartData}
                isLoading={isLoadingSmartData}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Signatures or Properties */}
        {showSignatures ? (
          <SignaturePanel />
        ) : (
          <div className="w-64 border-l bg-white p-4 overflow-y-auto">
            <h3 className="font-semibold text-sm mb-4">Block Properties</h3>
            {selectedBlock ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Block Type</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedBlock.type}</p>
                </div>
                {selectedBlock.type === 'text' && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Content</label>
                    <textarea
                      value={selectedBlock.text || ''}
                      onChange={(e) => {
                        const updated = blocks.map(b =>
                          b.id === selectedBlock.id ? { ...b, text: e.target.value } : b
                        );
                        setBlocks(updated);
                        setSelectedBlock({ ...selectedBlock, text: e.target.value });
                      }}
                      className="text-xs w-full p-2 border rounded font-mono"
                      rows={6}
                    />
                  </div>
                )}
                {selectedBlock.type === 'heading' && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Content</label>
                    <Input
                      value={selectedBlock.text || ''}
                      onChange={(e) => {
                        const updated = blocks.map(b =>
                          b.id === selectedBlock.id ? { ...b, text: e.target.value } : b
                        );
                        setBlocks(updated);
                        setSelectedBlock({ ...selectedBlock, text: e.target.value });
                      }}
                      className="text-xs"
                    />
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setBlocks(blocks.filter(b => b.id !== selectedBlock.id));
                    setSelectedBlock(null);
                  }}
                  className="w-full"
                >
                  Delete Block
                </Button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Select a block to edit properties</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}