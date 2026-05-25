import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function ClientLogin() {
  usePageTitle('Client Portal Login');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) navigate('/portal');
      })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Invalid email or password');
        return;
      }
      navigate('/portal');
    } catch (err) {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center p-4">
      <Button
        variant="outline"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-3">
            <span className="text-2xl font-extrabold tracking-tight text-navy-700">ENIX</span>
            <span className="ml-2 text-sm font-semibold text-navy-500">EXTERIORS</span>
          </div>
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            View your estimates, invoices, documents, and project progress
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="cli-email">Email</Label>
              <Input
                id="cli-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cli-password">Password</Label>
              <Input
                id="cli-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full h-11 bg-navy-500 hover:bg-navy-600 text-white font-semibold flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            New client? Your account was created when you signed your estimate.
            <br />
            Lost access? <Link to="/contact" className="underline">Contact us</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
