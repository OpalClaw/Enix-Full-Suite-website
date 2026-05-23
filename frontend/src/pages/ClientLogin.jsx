import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ClientLogin() {
  usePageTitle('Client Login');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [jobNumber, setJobNumber] = useState('');
  const [error, setError] = useState('');
  const [showJobInput, setShowJobInput] = useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user?.role === 'user') {
            navigate('/portal', { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, [navigate, searchParams]);

  const handleVerifyJobNumber = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!jobNumber.trim()) {
      setError('Job number is required');
      return;
    }

    const jobNumberRegex = /^\d{7}$/;
    if (!jobNumberRegex.test(jobNumber)) {
      setError('Please enter a valid 7-digit job number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('validateClientJobAccess', {
        jobNumber: jobNumber.trim()
      });

      if (!response.data.success) {
        setError('Job number not found. Please check and try again.');
        return;
      }

      // Store job number in session/local state for portal access
      sessionStorage.setItem('clientJobNumber', jobNumber);
      sessionStorage.setItem('clientJobId', response.data.jobId);

      // Proceed to login
      base44.auth.redirectToLogin('/portal');
    } catch (err) {
      setError('Job number not found. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setShowJobInput(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-12 relative">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 bg-white/10 border-white/30 text-white hover:bg-white/20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </button>
      <div className="w-full max-w-md mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
        <strong>Portal in setup.</strong> If your login doesn't work yet, call us at <a href="tel:8656853649" aria-label="Call Enix Exteriors" className="font-semibold underline">(865) 685-3649</a> — your project info is still accessible by phone.
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <img 
            src="https://media.base44.com/images/public/user_6a0541ba998771a1f2cb4ab0/ae967f6a7_Enix.png" 
            alt="Enix Exteriors" 
            className="h-16 mx-auto mb-4"
          />
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Access your projects, estimates, and documents</p>
        </CardHeader>
        <CardContent>
          {!showJobInput ? (
            <Button 
              onClick={handleLogin} 
              disabled={isLoading}
              className="w-full h-11 bg-navy-500 hover:bg-navy-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </Button>
          ) : (
            <form onSubmit={handleVerifyJobNumber} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Job Number *</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 2026001"
                  value={jobNumber}
                  onChange={(e) => {
                    setJobNumber(e.target.value.slice(0, 7));
                    setError('');
                  }}
                  maxLength="7"
                  className="mt-1"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">You can find your job number on your project documents</p>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button 
                type="submit"
                disabled={isLoading || !jobNumber}
                className="w-full h-11 bg-navy-500 hover:bg-navy-600 text-white font-semibold disabled:opacity-70"
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowJobInput(false);
                  setJobNumber('');
                  setError('');
                }}
                className="w-full text-sm"
              >
                Back
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Need help? <a aria-label="Call Enix Exteriors" href="tel:+18656853649" className="text-navy-500 hover:underline font-semibold">(865) 685-ENIX</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}