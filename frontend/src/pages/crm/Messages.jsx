import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function Messages() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [messageText, setMessageText] = useState('');

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-for-messages'],
    queryFn: () => base44.entities.Job.list('-created_date', 100),
  });

  // Group messages by job
  const jobMessages = {};
  messages.forEach(msg => {
    if (msg.job_id) {
      if (!jobMessages[msg.job_id]) {
        jobMessages[msg.job_id] = [];
      }
      jobMessages[msg.job_id].push(msg);
    }
  });

  const jobsWithMessages = Object.keys(jobMessages)
    .map(jobId => {
      const job = jobs.find(j => j.id === jobId);
      return { jobId, job, messageCount: jobMessages[jobId].length, lastMessage: jobMessages[jobId][0] };
    })
    .filter(item => item.job);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl">Messages</h1>
        <p className="text-muted-foreground">Communicate with clients and team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job List */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {jobsWithMessages.map(({ jobId, job, messageCount, lastMessage }) => (
                <button
                  key={jobId}
                  onClick={() => setSelectedJob(jobId)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedJob === jobId ? 'bg-navy-100 border-l-4 border-navy-500' : 'hover:bg-muted'
                  }`}
                >
                  <p className="font-semibold text-sm">{job.customer_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lastMessage.content}</p>
                  <Badge variant="outline" className="text-xs mt-1">{messageCount} messages</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          {selectedJob ? (
            <Card className="border-0 shadow-sm h-96 flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">
                  {jobs.find(j => j.id === selectedJob)?.customer_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {jobMessages[selectedJob]?.map(msg => (
                  <div key={msg.id} className={`flex ${msg.is_internal ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs p-3 rounded-lg ${msg.is_internal ? 'bg-navy-100 text-navy-900' : 'bg-muted'}`}>
                      <p className="text-xs text-muted-foreground mb-1">{msg.sender_name}</p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.created_date), 'h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-4 border-t space-y-2">
                <Textarea
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="text-sm"
                />
                <Button className="w-full bg-navy-600 hover:bg-navy-700">
                  <Send className="w-4 h-4 mr-2" /> Send
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm h-96 flex items-center justify-center">
              <p className="text-muted-foreground">Select a conversation</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}