import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TemplateSelector({ serviceType, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['estimateTemplates'],
    queryFn: () => base44.entities.EstimateTemplates.list(),
  });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.template_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && t.active;
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Estimate Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {filteredTemplates.map(template => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onSelect(template)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{template.template_name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.estimate_type?.replace(/_/g, ' ')}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {template.default_line_items?.length || 0} items
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No templates found</p>
          )}

          {/* Blank Estimate Option */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSelect(null)}
          >
            Create Blank Estimate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}