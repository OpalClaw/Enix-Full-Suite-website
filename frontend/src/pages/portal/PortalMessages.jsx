import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function PortalMessages() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: () => base44.entities.Message.list('-updated_date', 50),
  });

  const userMessages = messages.filter(m => !m.is_internal).sort((a, b) => new Date(a.updated_date) - new Date(b.updated_date));

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4">Messages</h1>
      <div className="grid gap-4">
        <Card className="p-4 border-0 shadow-sm min-h-[300px] bg-muted/20 flex flex-col">
          <div className="flex-1 space-y-3 mb-4">
            {userMessages.length > 0 ? userMessages.map(msg => (
              <div key={msg.id} className={`p-3 rounded-lg ${msg.sender_email?.includes('enix') ? 'bg-navy-100 ml-8' : 'bg-white border'}`}>
                <p className="text-xs font-medium text-muted-foreground mb-1">{msg.sender_name} • {format(new Date(msg.updated_date), 'MMM d, h:mm a')}</p>
                <p className="text-sm">{msg.content}</p>
              </div>
            )) : (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No messages yet. We'll reach out soon!</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Type a message..." value={message} onChange={e => setMessage(e.target.value)} />
            <Button size="sm"><Send className="w-4 h-4" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}