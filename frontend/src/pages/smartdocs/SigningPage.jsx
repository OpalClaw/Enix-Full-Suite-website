import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Signature, Type, Upload, AlertCircle } from 'lucide-react';

export default function SigningPage() {
  const { documentId, signerToken } = useParams();
  const [signatureMethod, setSignatureMethod] = useState('draw');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { data: document, isLoading: isDocumentLoading, error: documentError } = useQuery({
    queryKey: ['signing-doc', documentId],
    queryFn: async () => {
      if (!documentId) {
        throw new Error('Missing document ID');
      }
      return base44.entities.SmartDocument.get(documentId);
    },
    retry: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#003366';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, []);

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();

    const response = await base44.functions.invoke('signDocument', {
      documentId,
      signerToken,
      signatureData,
    });

    if (response.data.success) {
      alert('Document signed successfully!');
    }
  };

  const renderBlock = (block, index) => {
    if (!block || typeof block !== 'object') {
      return null;
    }

    if (block.type === 'heading') {
      return <h2 key={index} className="font-bold text-xl mt-4">{block.text}</h2>;
    }

    if (block.type === 'subheading') {
      return <h3 key={index} className="font-semibold text-lg mt-3">{block.text}</h3>;
    }

    if (block.type === 'list_item') {
      return <li key={index} className="ml-4 mt-1 text-sm list-disc">{block.text}</li>;
    }

    return <p key={index} className="mt-2 text-sm">{block.text}</p>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="bg-gradient-to-r from-navy-500 to-navy-600 text-white rounded-t-lg">
          <CardTitle>Sign Document</CardTitle>
          <p className="text-sm text-navy-100 mt-1">Please review and sign the document below</p>
        </CardHeader>

        <CardContent className="p-8">
          <div className="space-y-6">
            {documentError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Unable to load the document</p>
                  <p className="text-sm">The signing link may be invalid or expired.</p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-96 bg-gray-50 overflow-y-auto max-h-96">
                {isDocumentLoading ? (
                  <p className="text-sm text-gray-500">Loading document...</p>
                ) : (
                  <div className="space-y-2">
                    {document?.content?.blocks?.length
                      ? document.content.blocks.map(renderBlock)
                      : <p className="text-sm text-gray-500">No document content available.</p>}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-navy-900">How do you want to sign?</h3>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSignatureMethod('draw')}
                  className={`p-4 border-2 rounded-lg transition ${
                    signatureMethod === 'draw'
                      ? 'border-navy-500 bg-navy-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Signature className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Draw</p>
                </button>

                <button
                  onClick={() => setSignatureMethod('type')}
                  className={`p-4 border-2 rounded-lg transition ${
                    signatureMethod === 'type'
                      ? 'border-navy-500 bg-navy-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Type className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Type</p>
                </button>

                <button
                  onClick={() => setSignatureMethod('upload')}
                  className={`p-4 border-2 rounded-lg transition ${
                    signatureMethod === 'upload'
                      ? 'border-navy-500 bg-navy-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Upload</p>
                </button>
              </div>
            </div>

            {signatureMethod === 'draw' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Draw your signature</label>
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={handleDraw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = canvasRef.current.getBoundingClientRect();
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.beginPath();
                    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                    setIsDrawing(true);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (!isDrawing) return;
                    const touch = e.touches[0];
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const rect = canvas.getBoundingClientRect();
                    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                    ctx.stroke();
                  }}
                  onTouchEnd={() => setIsDrawing(false)}
                  className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white w-full"
                  style={{ width: '100%', height: '150px', maxWidth: '100%' }}
                />
                <Button
                  variant="outline"
                  onClick={() => canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)}
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSign} className="flex-1 bg-navy-500 hover:bg-navy-600">
                Sign Document
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}