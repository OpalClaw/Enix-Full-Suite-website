import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Copy, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const TEMPLATE_CATEGORIES = [
  'Contract',
  'Proposal',
  'Estimate',
  'Change Order',
  'Warranty',
  'Completion Cert',
  'Work Auth',
  'Insurance Supplement',
  'Financing',
  'Material Form',
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Contract');
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['documentTemplates'],
    queryFn: () => base44.entities.DocumentTemplate.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId) => base44.entities.DocumentTemplate.delete(templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentTemplates'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template) => {
      const newTemplate = { ...template };
      delete newTemplate.id;
      newTemplate.template_name = `${template.template_name} (Copy)`;
      return base44.entities.DocumentTemplate.create(newTemplate);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentTemplates'] }),
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.DocumentTemplate.create({
        template_name: newTemplateName,
        template_type: newTemplateCategory,
        category: 'User Created',
        content: { blocks: [] },
        merge_fields: [],
        is_active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTemplates'] });
      setNewTemplateName('');
      setNewTemplateCategory('Contract');
    },
  });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.template_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.template_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) return <div className="p-8">Loading templates...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-navy-500">Document Templates</h1>
            <p className="text-gray-600 mt-1">Create and manage reusable document templates</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-navy-500 hover:bg-navy-600 gap-2">
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input 
                  placeholder="Template name..." 
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
                <select 
                  className="w-full border rounded-md p-2"
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                >
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button 
                  className="w-full bg-navy-500 hover:bg-navy-600"
                  onClick={() => createTemplateMutation.mutate()}
                  disabled={createTemplateMutation.isPending || !newTemplateName}
                >
                  {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Categories</option>
            {TEMPLATE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="text-lg">{template.template_name}</CardTitle>
                <p className="text-sm text-gray-600">{template.template_type}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => duplicateMutation.mutate(template)}
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => alert('Template editing coming soon')}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-red-600"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No templates found</p>
          </div>
        )}
      </div>
    </div>
  );
}