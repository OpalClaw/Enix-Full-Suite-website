import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileUp, Send, PenTool, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentManager({ jobId, leadId, customerEmail, customerName, documents = [], onDocumentsChange }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [signatureDocName, setSignatureDocName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(customerEmail || '');
  const [emailMessage, setEmailMessage] = useState(`Please find the attached document below.`);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents', jobId] });
      queryClient.invalidateQueries({ queryKey: ['documents', leadId] });
      setUploadOpen(false);
      onDocumentsChange?.();
    },
  });

  const createSignatureMutation = useMutation({
    mutationFn: async () => {
      const signDoc = {
        name: signatureDocName,
        job_id: jobId,
        lead_id: leadId,
        type: 'e_signature',
        status: 'pending_signature',
        created_date: new Date().toISOString(),
        signed_date: null,
      };
      return signDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', jobId] });
      queryClient.invalidateQueries({ queryKey: ['documents', leadId] });
      setSignOpen(false);
      setSignatureDocName('');
      onDocumentsChange?.();
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: `Document: ${selectedDoc.name || 'Attached Document'}`,
        body: `Hello ${customerName},\n\n${emailMessage}\n\nBest regards`,
      });
      return true;
    },
    onSuccess: () => {
      setEmailOpen(false);
      setSelectedDoc(null);
      setRecipientEmail(customerEmail || '');
      setEmailMessage(`Please find the attached document below.`);
    },
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {/* Upload Button */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileUp className="w-4 h-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadMutation.isPending}
                className="w-full"
              />
              {uploadMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create E-Signature Button */}
        <Dialog open={signOpen} onOpenChange={setSignOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <PenTool className="w-4 h-4" /> Create E-Signature Doc
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create E-Signature Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Document name (e.g., Contract, Agreement)"
                value={signatureDocName}
                onChange={(e) => setSignatureDocName(e.target.value)}
              />
              <Button
                onClick={() => createSignatureMutation.mutate()}
                disabled={!signatureDocName || createSignatureMutation.isPending}
                className="w-full bg-navy-600 hover:bg-navy-700"
              >
                {createSignatureMutation.isPending ? 'Creating...' : 'Create Document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      {documents && documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{doc.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {doc.type === 'e_signature' ? 'E-Signature' : 'Document'}
                  </Badge>
                  {doc.status && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        doc.status === 'pending_signature'
                          ? 'bg-yellow-50 text-yellow-700'
                          : doc.status === 'signed'
                          ? 'bg-green-50 text-green-700'
                          : ''
                      }`}
                    >
                      {doc.status?.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  {doc.created_date && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {doc.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Dialog open={emailOpen && selectedDoc?.name === doc.name} onOpenChange={(open) => {
                  if (!open) {
                    setEmailOpen(false);
                    setSelectedDoc(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setEmailOpen(true);
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Email Document: {doc.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Recipient email"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                      <textarea
                        placeholder="Message"
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        className="w-full p-2 border rounded-md text-sm min-h-20"
                      />
                      <Button
                        onClick={() => sendEmailMutation.mutate()}
                        disabled={!recipientEmail || sendEmailMutation.isPending}
                        className="w-full bg-navy-600 hover:bg-navy-700"
                      >
                        {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {(!documents || documents.length === 0) && (
        <p className="text-sm text-muted-foreground">No documents yet.</p>
      )}
    </div>
  );
}