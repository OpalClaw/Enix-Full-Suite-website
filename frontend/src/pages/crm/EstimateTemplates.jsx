import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Copy, Search } from 'lucide-react';
import EstimateTemplateForm from '@/components/crm/EstimateTemplateForm';

const serviceTypes = [
  'residential_roofing',
  'commercial_roofing',
  'roof_repair',
  'siding',
  'windows',
  'doors',
  'gutters',
  'storm_damage',
  'other'
];

export default function EstimateTemplates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['estimateTemplates'],
    queryFn: () => base44.entities.EstimateTemplates.list(),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.EstimateTemplates.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimateTemplates'] });
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const newTemplate = {
        ...template,
        template_name: `${template.template_name} (Copy)`,
      };
      delete newTemplate.id;
      delete newTemplate.created_date;
      delete newTemplate.updated_date;
      delete newTemplate.created_by;
      return base44.entities.EstimateTemplates.create(newTemplate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimateTemplates'] });
    },
  });

  const filteredTemplates = templates.filter(t => 
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.estimate_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Estimate Templates</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedTemplate(null)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            </DialogHeader>
            <EstimateTemplateForm 
              template={selectedTemplate}
              onSuccess={() => {
                setShowForm(false);
                setSelectedTemplate(null);
                queryClient.invalidateQueries({ queryKey: ['estimateTemplates'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates by name or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.estimate_type?.replace(/_/g, ' ')}
                  </p>
                </div>
                {template.active && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground">Service: {template.service_type?.replace(/_/g, ' ')}</p>
                {template.default_line_items?.length > 0 && (
                  <p className="text-muted-foreground">{template.default_line_items.length} line items</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowForm(true);
                  }}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => duplicateTemplateMutation.mutate(template)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTemplateMutation.mutate(template.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-muted-foreground">No templates found. Create one to get started.</p>
        </Card>
      )}
    </div>
  );
}