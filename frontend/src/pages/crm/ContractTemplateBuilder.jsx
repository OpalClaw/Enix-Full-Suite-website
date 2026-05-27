import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, FileText, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import SmartDocumentEditor from '@/pages/smartdocs/SmartDocumentEditor';

// Lists, creates, and edits contract templates. Editing reuses the existing
// SmartDocumentEditor (a Contract template is a SmartDocument with
// document_type='contract_template').

function NewTemplateDialog({ onCreate, creating }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    const created = await onCreate({ name: name.trim(), description: description.trim() });
    if (created) {
      setName('');
      setDescription('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> New template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New contract template</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="tpl-name">Name</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Standard residential roofing contract"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tpl-desc">Description</Label>
            <Textarea
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…
                </>
              ) : (
                'Create & edit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ContractTemplateBuilder() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const all = await base44.entities.SmartDocument.filter({
        document_type: 'contract_template',
      });
      return all;
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, description }) =>
      base44.entities.SmartDocument.create({
        document_name: name,
        document_type: 'contract_template',
        content: {
          blocks: [],
          metadata: { description, kind: 'contract_template' },
        },
        status: 'draft',
      }),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast.success('Template created');
      navigate(`/crm/contracts/templates/${doc.id}`);
    },
    onError: (e) => toast.error(e?.message || 'Failed to create template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SmartDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast.success('Template deleted');
    },
    onError: (e) => toast.error(e?.message || 'Failed to delete'),
  });

  // Edit mode — render the existing SmartDocumentEditor wired to this template.
  if (templateId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/crm/contracts/templates')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> All templates
          </Button>
          <Badge variant="outline">Contract template</Badge>
        </div>
        <SmartDocumentEditor documentId={templateId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Contract templates</h1>
          <p className="text-muted-foreground">
            Reusable contracts. Drop smart fields, sign with DocuSign.
          </p>
        </div>
        <NewTemplateDialog
          onCreate={(payload) => createMutation.mutateAsync(payload).catch(() => null)}
          creating={createMutation.isPending}
        />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}
          {!isLoading && templates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No templates yet. Create one to start drafting contracts faster.
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            {templates.map((t) => (
              <Card key={t.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{t.document_name}</p>
                      {t.content?.metadata?.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {t.content.metadata.description}
                        </p>
                      )}
                      <Badge className="mt-2" variant="outline">
                        {t.status || 'draft'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/crm/contracts/templates/${t.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Delete this template?')) deleteMutation.mutate(t.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
