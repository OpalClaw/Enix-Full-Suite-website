import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Send, Eye, Check, Clock, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_ICONS = {
  draft: Clock,
  sent: Send,
  viewed: Eye,
  signed: Check,
  declined: X,
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  signed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
};

export default function SmartDocsDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const createDocMutation = useMutation({
    mutationFn: async () => {
      const doc = await base44.entities.SmartDocument.create({
        document_name: 'Untitled Document',
        document_type: 'custom',
        status: 'draft',
        content: { blocks: [] },
        merge_fields: [],
      });
      return doc.id;
    },
    onSuccess: (docId) => {
      navigate(`/crm/jobs/documents/editor/${docId}`);
    },
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['smartDocuments'],
    queryFn: () => base44.entities.SmartDocument.list(),
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['docStats'],
    queryFn: async () => {
      const docs = await base44.entities.SmartDocument.list();
      return {
        total: docs.length,
        draft: docs.filter(d => d.status === 'draft').length,
        pending: docs.filter(d => ['sent', 'delivered', 'viewed'].includes(d.status)).length,
        signed: docs.filter(d => d.status === 'signed').length,
        signatureRate: docs.length > 0 ? Math.round((docs.filter(d => d.status === 'signed').length / docs.length) * 100) : 0,
      };
    },
  });

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeTab === 'all' || doc.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="p-8">Loading documents...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-navy-500">Enix SmartDocs</h1>
            <p className="text-gray-600 mt-1">Document Editor & E-Signature Platform</p>
          </div>
          <Button 
            className="bg-navy-500 hover:bg-navy-600 gap-2"
            onClick={() => createDocMutation.mutate()}
            disabled={createDocMutation.isPending}
          >
            <Plus className="w-4 h-4" />
            {createDocMutation.isPending ? 'Creating...' : 'New Document'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-navy-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-navy-500">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.draft}</p>
                <p className="text-sm text-gray-600">Drafts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending Signature</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.signed}</p>
                <p className="text-sm text-gray-600">Signed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-navy-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-navy-500">{stats.signatureRate}%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Manage your contracts, proposals, and documents</CardDescription>
            </div>
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="viewed">Viewed</TabsTrigger>
              <TabsTrigger value="signed">Signed ({stats.signed})</TabsTrigger>
              <TabsTrigger value="declined">Declined</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-3">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => {
                    const StatusIcon = STATUS_ICONS[doc.status] || FileText;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{doc.document_name}</p>
                            <p className="text-sm text-gray-500">{doc.document_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[doc.status]}`}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/crm/jobs/documents/editor/${doc.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No documents found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}