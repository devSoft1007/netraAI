import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Log the current URL for debugging
        console.log('Auth callback URL:', window.location.href)
        
        // Get the URL parameters from both search and hash
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        // Check both URL params and hash params
        const token = urlParams.get('token') || hashParams.get('access_token')
        const type = urlParams.get('type') || hashParams.get('type') || 'signup'
        const error = urlParams.get('error') || hashParams.get('error')
        const errorCode = urlParams.get('error_code') || hashParams.get('error_code')
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description')

        console.log('Auth callback params:', { token, type, error, errorCode, errorDescription })

        if (error) {
          setStatus('error')
          setMessage(decodeURIComponent(errorDescription || 'An error occurred during authentication'))
          console.error('Auth error:', error, errorCode, errorDescription)
          return
        }

        if (type === 'signup') {
          // Handle email confirmation
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token || '',
            type: 'signup'
          });

          if (verifyError) {
            setStatus('error');
            setMessage(verifyError.message);
            toast({
              title: 'Email Verification Failed',
              description: verifyError.message,
              variant: 'destructive',
            });
          } else {
            setStatus('success');
            setMessage('Your email has been verified successfully!');
            toast({
              title: 'Email Verified',
              description: 'Your account is now active. Redirecting to dashboard...',
            });
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              setLocation('/dashboard');
            }, 2000);
          }
        } else if (type === 'recovery') {
          // Handle password reset
          setStatus('success');
          setMessage('Password reset verified. You can now set a new password.');
          setTimeout(() => {
            setLocation('/reset-password');
          }, 2000);
        } else {
          // Let Supabase handle the session automatically
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            setStatus('error');
            setMessage(sessionError.message);
          } else if (session) {
            setStatus('success');
            setMessage('Authentication successful!');
            setTimeout(() => {
              setLocation('/dashboard');
            }, 1500);
          } else {
            setStatus('error');
            setMessage('No valid session found');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [setLocation, toast]);

  const handleRetry = () => {
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue/10 to-medical-blue/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email'}
            {status === 'success' && 'Your email has been verified'}
            {status === 'error' && 'There was a problem verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-medical-blue" />
              <p className="text-gray-600">Processing authentication...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-green-700">{message}</p>
              <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <p className="text-red-700">{message}</p>
              <Button onClick={handleRetry} className="w-full">
                Return to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
