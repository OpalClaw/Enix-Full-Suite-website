import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { MessageSquare, Image, DollarSign, FileText, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

const statusColors = {
  estimate: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  material_ordered: "bg-teal-100 text-teal-700",
  scheduled: "bg-cyan-100 text-cyan-700",
  in_production: "bg-navy-100 text-navy-700",
  final_inspection: "bg-purple-100 text-purple-700",
  invoiced: "bg-orange-100 text-orange-700",
  paid: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function JobDetailCard({ job }) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ['job-messages', job.id],
    queryFn: () => base44.entities.Message.filter({ job_id: job.id, is_internal: false }),
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      const user = await base44.auth.me();
      return base44.entities.Message.create({
        job_id: job.id,
        content,
        sender_email: user.email,
        sender_name: user.full_name,
        is_internal: false,
      });
    },
    onSuccess: () => {
      setComment('');
    },
  });

  const handleAddComment = () => {
    if (comment.trim()) {
      addCommentMutation.mutate(comment);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <CardTitle>{job.service_type?.replace(/_/g, ' ')}</CardTitle>
            <Badge className={statusColors[job.status] || 'bg-muted'}>{job.status?.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{job.property_address}, {job.city}, {job.state} {job.zip}</p>
        </CardHeader>
      </Card>

      {/* Job Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Contract Amount</p>
          <p className="text-lg font-bold text-navy-500">${job.contract_amount?.toLocaleString() || 'TBD'}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Paid Amount</p>
          <p className="text-lg font-bold">${job.paid_amount?.toLocaleString() || '0'}</p>
        </Card>
        {job.start_date && (
          <Card className="border-0 shadow-sm p-4">
            <p className="text-xs text-muted-foreground mb-1">Start Date</p>
            <p className="text-lg font-bold">{format(new Date(job.start_date), 'MMM d, yyyy')}</p>
          </Card>
        )}
        {job.completion_date && (
          <Card className="border-0 shadow-sm p-4">
            <p className="text-xs text-muted-foreground mb-1">Completion Date</p>
            <p className="text-lg font-bold">{format(new Date(job.completion_date), 'MMM d, yyyy')}</p>
          </Card>
        )}
      </div>

      {/* Photos */}
      {job.photo_urls && job.photo_urls.length > 0 && (
        <Card className="border-0 shadow-sm p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Image className="w-5 h-5" /> Project Photos
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {job.photo_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-lg aspect-square bg-muted">
                <img src={url} alt={`Job photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Invoice & Payment */}
      {job.invoice_amount && (
        <Card className="border-0 shadow-sm p-4 bg-orange-50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Payment
          </h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Invoice Amount:</span>
              <span className="font-bold">${job.invoice_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Amount Paid:</span>
              <span className="font-bold">${job.paid_amount?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Balance Due:</span>
              <span className="font-bold text-orange-600">${(job.invoice_amount - (job.paid_amount || 0)).toLocaleString()}</span>
            </div>
          </div>
          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            Pay Now
          </Button>
        </Card>
      )}

      {/* Comments Section */}
      <Card className="border-0 shadow-sm p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Comments ({messages.length})
        </h3>

        {/* Comments List */}
        {messages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground font-semibold">{msg.sender_name}</p>
                <p className="text-sm mt-1">{msg.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.created_date), 'MMM d, h:mm a')}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment */}
        <div className="space-y-2">
          <Textarea
            placeholder="Leave a comment or question..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="text-sm"
          />
          <Button
            onClick={handleAddComment}
            disabled={!comment.trim() || addCommentMutation.isPending}
            className="w-full bg-navy-500 hover:bg-navy-600"
          >
            {addCommentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Comment
          </Button>
        </div>
      </Card>

      {/* Description */}
      {job.description && (
        <Card className="border-0 shadow-sm p-4">
          <h3 className="font-semibold mb-2">Job Details</h3>
          <p className="text-sm text-muted-foreground">{job.description}</p>
        </Card>
      )}

      {/* Documents */}
      {job.document_urls && job.document_urls.length > 0 && (
        <Card className="border-0 shadow-sm p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Documents
          </h3>
          <div className="space-y-2">
            {job.document_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-navy-500 hover:underline text-sm">
                <FileText className="w-4 h-4" />
                Document {i + 1}
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}