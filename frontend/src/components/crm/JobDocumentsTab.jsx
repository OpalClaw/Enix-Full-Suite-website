import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, Eye, CheckCircle2, Clock, Edit3, Trash2, Send, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';
import SmartDocumentEditor from '@/pages/smartdocs/SmartDocumentEditor';
import SmartDocumentPortal from '@/components/crm/SmartDocumentPortal';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-blue-200 text-blue-900',
  viewed: 'bg-purple-100 text-purple-800',
  signed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  expired: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-200 text-green-900',
};

export default function JobDocumentsTab({ job }) {
  const [activeTab, setActiveTab] = useState('documents');
  const [editingDocId, setEditingDocId] = useState(null);
  const [showPortal, setShowPortal] = useState(null);
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('estimate');
  const [showSendDialog, setShowSendDialog] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [autoGenType, setAutoGenType] = useState(null);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', job.id],
    queryFn: () => base44.entities.SmartDocument.filter({ job_id: job.id }),
    enabled: !!job.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.DocumentTemplate.filter({ is_active: true }),
  });

  const { data: signatureEvents = [] } = useQuery({
    queryKey: ['signatureEvents', job.id],
    queryFn: async () => {
      const docs = await base44.entities.SmartDocument.filter({ job_id: job.id });
      const docIds = docs.map(d => d.id);
      if (docIds.length === 0) return [];
      return base44.entities.SignatureEvent.filter({ document_id: { $in: docIds } });
    },
    enabled: !!job.id && documents.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.SmartDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', job.id] });
    },
  });

  const createBlankDoc = async () => {
    if (!newDocName.trim()) return;
    await base44.entities.SmartDocument.create({
      document_name: newDocName,
      document_type: newDocType,
      status: 'draft',
      job_id: job.id,
      content: { blocks: [] },
      merge_fields: [],
    });
    queryClient.invalidateQueries({ queryKey: ['documents', job.id] });
    setNewDocName('');
    setShowNewDocDialog(false);
  };

  const sendDocumentMutation = useMutation({
    mutationFn: async ({ documentId, email, name }) => {
      const doc = documents.find(d => d.id === documentId);
      await base44.entities.SmartDocument.update(documentId, {
        status: 'sent',
        sent_date: new Date().toISOString(),
        recipients: [...(doc.recipients || []), { email, name, status: 'sent', order: (doc.recipients?.length || 0) + 1 }],
      });
      await base44.functions.invoke('sendDocumentForSignature', {
        documentId,
        recipientEmail: email,
        recipientName: name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', job.id] });
      setRecipientEmail('');
      setRecipientName('');
      setShowSendDialog(null);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const uploadedFile = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.SmartDocument.create({
        document_name: file.name,
        document_type: 'custom',
        status: 'draft',
        job_id: job.id,
        pdf_url: uploadedFile.file_url,
        content: { blocks: [] },
        merge_fields: [],
      });
      queryClient.invalidateQueries({ queryKey: ['documents', job.id] });
    },
    onSuccess: () => {
      setShowUploadDialog(false);
    },
  });

  const autoGenerateMutation = useMutation({
    mutationFn: async (documentType) => {
      await base44.functions.invoke('autoGenerateSmartDocument', {
        jobId: job.id,
        documentType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', job.id] });
      setAutoGenType(null);
    },
  });

  const createDocumentFromTemplate = async (template) => {
    const newDoc = await base44.entities.SmartDocument.create({
      document_name: `${template.template_name} - ${job.customer_name}`,
      document_type: template.template_type,
      status: 'draft',
      job_id: job.id,
      template_id: template.id,
      content: template.content,
      merge_fields: template.merge_fields || [],
    });
    queryClient.invalidateQueries({ queryKey: ['documents', job.id] });
    return newDoc;
  };

  const signedDocuments = documents.filter(d => d.status === 'signed');
  const pendingDocuments = documents.filter(d => ['sent', 'delivered', 'viewed'].includes(d.status));
  const draftDocuments = documents.filter(d => d.status === 'draft');

  if (editingDocId) {
    return (
      <div>
        <Button variant="ghost" className="mb-4" onClick={() => setEditingDocId(null)}>
          ← Back to Documents
        </Button>
        <SmartDocumentEditor documentId={editingDocId} />
      </div>
    );
  }

  if (showPortal) {
    const doc = documents.find(d => d.id === showPortal);
    return (
      <div>
        <SmartDocumentPortal
          documentId={showPortal}
          document={doc}
          job={job}
          onClose={() => setShowPortal(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Document Dialog */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog} modal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Document Name</label>
              <Input
                placeholder="e.g., Roofing Contract - Smith Residence"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Document Type</label>
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="contract">Contract</option>
                <option value="proposal">Proposal</option>
                <option value="estimate">Estimate</option>
                <option value="change_order">Change Order</option>
                <option value="warranty">Warranty</option>
                <option value="completion_cert">Completion Certificate</option>
                <option value="work_auth">Work Authorization</option>
                <option value="insurance_supplement">Insurance Supplement</option>
                <option value="financing">Financing Agreement</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewDocDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={createBlankDoc}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Document Dialog */}
      {showSendDialog && (
        <Dialog open={!!showSendDialog} onOpenChange={() => setShowSendDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send for Signature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient Name</label>
                <Input
                  placeholder="e.g., John Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Recipient Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowSendDialog(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => sendDocumentMutation.mutate({ documentId: showSendDialog, email: recipientEmail, name: recipientName })}
                  disabled={sendDocumentMutation.isPending}
                >
                  Send
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
              onClick={() => document.getElementById('fileInput').click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, or other documents</p>
            </div>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  uploadMutation.mutate(e.target.files[0]);
                }
              }}
              disabled={uploadMutation.isPending}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Signatures ({pendingDocuments.length})</TabsTrigger>
          <TabsTrigger value="signed">Signed ({signedDocuments.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowNewDocDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Blank Document
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setActiveTab('templates')}>
              <Plus className="w-4 h-4 mr-2" />
              From Template
            </Button>
          </div>

          {draftDocuments.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3">Drafts</h3>
              <div className="space-y-2">
                {draftDocuments.map(doc => (
                  <Card key={doc.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-semibold text-sm">{doc.document_name}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(doc.created_date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <Badge className={statusColors[doc.status]}>Draft</Badge>
                      </div>
                      {doc.pdf_url && (
                        <div className="rounded border bg-gray-50 p-2">
                          <iframe
                            src={doc.pdf_url}
                            className="w-full h-40 rounded"
                            title={doc.document_name}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {doc.pdf_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(doc.pdf_url, '_blank')}
                            title="View PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingDocId(doc.id)}
                          title="Edit document"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowSendDialog(doc.id)}
                          title="Send for signature"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No documents yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setActiveTab('templates')}
              >
                Create First Document
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Pending Signatures Tab */}
        <TabsContent value="pending" className="space-y-3">
          {pendingDocuments.length > 0 ? (
            pendingDocuments.map(doc => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{doc.document_name}</p>
                      <p className="text-xs text-muted-foreground">Sent: {format(new Date(doc.sent_date), 'MMM d, yyyy')}</p>
                    </div>
                    <Badge className={statusColors[doc.status]}>{doc.status}</Badge>
                  </div>
                  {doc.recipients && (
                    <div className="space-y-2 mb-3">
                      <p className="text-xs font-medium text-muted-foreground">Recipients:</p>
                      {doc.recipients.map((recipient, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                          <span>{recipient.email}</span>
                          <Clock className="w-3 h-3 text-yellow-600" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setShowPortal(doc.id)}
                    >
                      View Portal
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setShowSendDialog(doc.id)}
                    >
                      Add Recipient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No pending signatures</p>
          )}
        </TabsContent>

        {/* Signed Tab */}
        <TabsContent value="signed" className="space-y-3">
          {signedDocuments.length > 0 ? (
            signedDocuments.map(doc => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{doc.document_name}</p>
                      <p className="text-xs text-muted-foreground">Signed: {format(new Date(doc.signed_date), 'MMM d, yyyy')}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex gap-2">
                    {doc.pdf_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(doc.pdf_url, '_blank')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View PDF
                      </Button>
                    )}
                    {doc.signed_pdf_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(doc.signed_pdf_url, '_blank')}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Signed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No signed documents yet</p>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 mb-6">
            <p className="text-sm font-semibold">Auto-Generate from Job Data</p>
            <div className="grid grid-cols-2 gap-2">
              {['contract', 'proposal', 'estimate', 'change_order', 'warranty', 'completion_cert'].map(docType => (
                <Button
                  key={docType}
                  variant="outline"
                  size="sm"
                  onClick={() => autoGenerateMutation.mutate(docType)}
                  disabled={autoGenerateMutation.isPending}
                  className="justify-start capitalize text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {docType.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">From Templates</p>
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {templates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{template.template_name}</p>
                          <p className="text-xs text-muted-foreground capitalize mb-2">{template.template_type}</p>
                          {template.description && <p className="text-xs text-gray-600">{template.description}</p>}
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => createDocumentFromTemplate(template)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No templates available</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}