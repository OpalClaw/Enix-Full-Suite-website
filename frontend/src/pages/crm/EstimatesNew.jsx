import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Send, Download } from 'lucide-react';
import EstimateBuilder from '@/components/crm/EstimateBuilder';
import EstimateViewer from '@/components/crm/EstimateViewer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function EstimatesNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { estimateId } = useParams();
  
  const [mode, setMode] = useState(estimateId ? 'view' : 'create');
  const [isEditing, setIsEditing] = useState(!estimateId);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  // Fetch estimate if editing
  const { data: estimate } = useQuery({
    queryKey: ['estimate', estimateId],
    queryFn: () => estimateId ? base44.entities.Estimate.filter({ id: estimateId }).then(data => data[0]) : null,
    enabled: !!estimateId,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (estimateId) {
        return base44.entities.Estimate.update(estimateId, data);
      } else {
        return base44.entities.Estimate.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setMode('view');
      setIsEditing(false);
    },
  });

  // Send estimate mutation
  const sendMutation = useMutation({
    mutationFn: async (data) => {
      // Send email via backend function
      return base44.functions.invoke('sendEstimate', {
        estimateId: estimate.id,
        customerEmail: estimate.customer_email,
        customerName: estimate.customer_name,
        message: data.message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });
      setShowEmailDialog(false);
      setEmailMessage('');
    },
  });

  const handleSave = async (formData) => {
    const estimateNumber = formData.estimate_number || `EST-${Date.now()}`;
    await saveMutation.mutateAsync({
      ...formData,
      estimate_number: estimateNumber,
      status: 'draft',
      created_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('estimate-viewer');
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`estimate-${estimate?.estimate_number || 'draft'}.pdf`);
  };

  if (estimateId && !estimate) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading estimate...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/crm/estimates')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          {!isEditing && estimate && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button onClick={() => setShowEmailDialog(true)}>
                <Send className="w-4 h-4 mr-2" /> Send
              </Button>
            </>
          )}
          {isEditing && (
            <Button onClick={() => setIsEditing(false)}>
              View
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <EstimateBuilder 
          estimate={estimate}
          onSave={handleSave}
        />
      ) : estimate ? (
        <div id="estimate-viewer">
          <EstimateViewer 
            estimate={estimate}
            onEdit={() => setIsEditing(true)}
            onEmail={() => setShowEmailDialog(true)}
            onExportPDF={handleExportPDF}
          />
        </div>
      ) : null}

      {/* Email Dialog */}
      {showEmailDialog && (
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Estimate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <p className="font-semibold">{estimate?.customer_email}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Message (optional)</label>
                <textarea
                  className="w-full p-2 border rounded-md text-sm"
                  rows="4"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a personal message..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => sendMutation.mutate({ message: emailMessage })}
                  disabled={sendMutation.isPending}
                >
                  {sendMutation.isPending ? 'Sending...' : 'Send Estimate'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}