import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Send, MessageSquare, Smartphone, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Messages() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [tab, setTab] = useState('thread');
  const [smsForm, setSmsForm] = useState({ to: '', body: '', job_id: '' });
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_at', 200),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-for-messages'],
    queryFn: () => base44.entities.Job.list('-created_at', 100),
  });

  const sendInternalMutation = useMutation({
    mutationFn: ({ job_id, body }) =>
      base44.entities.Message.create({
        job_id,
        body,
        channel: 'internal',
        is_internal: true,
        direction: 'outbound',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageText('');
      toast.success('Message posted');
    },
    onError: (e) => toast.error(e?.message || 'Failed to send message'),
  });

  const sendSmsMutation = useMutation({
    mutationFn: ({ to, body, job_id }) =>
      base44.functions.invoke('sendSMS', { to, body, job_id: job_id || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSmsForm({ to: '', body: '', job_id: '' });
      toast.success('SMS sent');
    },
    onError: (e) =>
      toast.error(
        e?.message ||
          'SMS failed — confirm Twilio credentials in Settings → Integrations',
      ),
  });

  const jobMessages = {};
  messages.forEach((msg) => {
    if (msg.job_id) {
      (jobMessages[msg.job_id] ||= []).push(msg);
    }
  });

  const jobsWithMessages = Object.keys(jobMessages)
    .map((jobId) => {
      const job = jobs.find((j) => j.id === jobId);
      return {
        jobId,
        job,
        messageCount: jobMessages[jobId].length,
        lastMessage: jobMessages[jobId][0],
      };
    })
    .filter((item) => item.job);

  const sendThreadReply = () => {
    if (!selectedJob || !messageText.trim()) return;
    sendInternalMutation.mutate({ job_id: selectedJob, body: messageText.trim() });
  };

  const sendSms = (e) => {
    e.preventDefault();
    if (!smsForm.to || !smsForm.body) {
      toast.error('Recipient and body are required');
      return;
    }
    sendSmsMutation.mutate(smsForm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl">Messages</h1>
        <p className="text-muted-foreground">Internal notes, customer SMS, and call logs.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="thread" className="gap-2">
            <MessageSquare className="w-4 h-4" /> Threads
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <Smartphone className="w-4 h-4" /> Send SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thread" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm h-[28rem] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-lg">Conversations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoading && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </p>
                  )}
                  {!isLoading && jobsWithMessages.length === 0 && (
                    <p className="text-sm text-muted-foreground">No conversations yet.</p>
                  )}
                  {jobsWithMessages.map(({ jobId, job, messageCount, lastMessage }) => (
                    <button
                      key={jobId}
                      onClick={() => setSelectedJob(jobId)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedJob === jobId
                          ? 'bg-navy-100 border-l-4 border-navy-500'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <p className="font-semibold text-sm">{job.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lastMessage.body || lastMessage.content}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {messageCount} messages
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedJob ? (
                <Card className="border-0 shadow-sm h-[28rem] flex flex-col">
                  <CardHeader className="border-b">
                    <CardTitle className="text-lg">
                      {jobs.find((j) => j.id === selectedJob)?.customer_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                    {jobMessages[selectedJob]?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-md p-3 rounded-lg ${
                            msg.direction === 'outbound'
                              ? 'bg-navy-100 text-navy-900'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-muted-foreground">
                              {msg.channel || 'internal'}
                            </p>
                            {msg.is_internal && (
                              <Badge variant="outline" className="text-[10px]">
                                internal
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.body || msg.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <div className="p-4 border-t space-y-2">
                    <Textarea
                      placeholder="Type an internal note…"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                    <Button
                      className="w-full bg-navy-600 hover:bg-navy-700"
                      onClick={sendThreadReply}
                      disabled={sendInternalMutation.isPending || !messageText.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" /> Post note
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="border-0 shadow-sm h-[28rem] flex items-center justify-center">
                  <p className="text-muted-foreground">Select a conversation</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sms" className="mt-4">
          <Card className="border-0 shadow-sm max-w-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5" /> Send SMS via Twilio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendSms} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="sms-to">Recipient phone</Label>
                  <Input
                    id="sms-to"
                    placeholder="+15551234567"
                    value={smsForm.to}
                    onChange={(e) => setSmsForm({ ...smsForm, to: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sms-body">Message</Label>
                  <Textarea
                    id="sms-body"
                    value={smsForm.body}
                    onChange={(e) => setSmsForm({ ...smsForm, body: e.target.value })}
                    rows={4}
                    maxLength={1600}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {smsForm.body.length}/1600 chars
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendSmsMutation.isPending}
                >
                  {sendSmsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" /> Send SMS
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
