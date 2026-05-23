import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText } from 'lucide-react';

export default function PortalDocuments() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: jobs = [] } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Job.filter({ client_user_email: user.email });
    },
    enabled: !!user?.email,
  });

  const documents = jobs.filter(j => j.document_urls?.length > 0).flatMap(j => 
    (j.document_urls || []).map(url => ({ id: url, jobId: j.id, jobName: j.service_type, url }))
  );

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4">Documents</h1>
      
      <div className="grid gap-3">
        {documents.length > 0 ? documents.map(doc => (
          <Card key={doc.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-navy-500" />
                <div>
                  <h3 className="font-semibold">{doc.jobName?.replace(/_/g, ' ')}</h3>
                  <p className="text-xs text-muted-foreground">{doc.url.split('/').pop()}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
            </div>
          </Card>
        )) : (
          <Card className="p-12 text-center border-0 shadow-sm">
            <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}