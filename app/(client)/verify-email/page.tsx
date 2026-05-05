'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(
        'No verification token found. Please use the link from your email.'
      );
      return;
    }

    setStatus('loading');
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, [token]);

  return (
    <div className="space-y-4 text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your email…</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="font-medium text-green-700 dark:text-green-400">
            {message}
          </p>
          <p className="text-sm text-muted-foreground">
            You can now access all features of your account.
          </p>
          <Button asChild className="mt-2">
            <Link href="/">Continue shopping</Link>
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="font-medium text-destructive">{message}</p>
          <p className="text-sm text-muted-foreground">
            Tokens expire after 24 hours. Request a new verification email from
            your account settings.
          </p>
          <Button variant="outline" asChild className="mt-2">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Container>
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Email Verification</CardTitle>
            <CardDescription>Confirming your email address</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <VerifyEmailContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
