import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

export default function SignaturePanel() {
  const [signers, setSigners] = useState([]);
  const [newSignerEmail, setNewSignerEmail] = useState('');

  const addSigner = () => {
    if (newSignerEmail.trim()) {
      setSigners([...signers, { id: Date.now(), email: newSignerEmail, status: 'pending' }]);
      setNewSignerEmail('');
    }
  };

  const removeSigner = (id) => {
    setSigners(signers.filter(s => s.id !== id));
  };

  return (
    <div className="w-64 border-l bg-white p-4 overflow-y-auto">
      <h3 className="font-semibold text-sm mb-4">Signature Recipients</h3>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email address..."
            value={newSignerEmail}
            onChange={(e) => setNewSignerEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSigner()}
            className="text-xs"
          />
          <Button onClick={addSigner} size="sm" className="bg-navy-500 hover:bg-navy-600">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {signers.length > 0 ? (
          <div className="space-y-2">
            {signers.map((signer, idx) => (
              <Card key={signer.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">{idx + 1}. {signer.email}</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{signer.status}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSigner(signer.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No signers added yet</p>
        )}
      </div>

      <Button className="w-full mt-6 bg-navy-500 hover:bg-navy-600">
        Send for Signature
      </Button>
    </div>
  );
}