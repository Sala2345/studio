
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Check if the page is being loaded from a sign-in link
  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      const href = window.location.href;
      if (isSignInWithEmailLink(auth, href)) {
        let storedEmail = window.localStorage.getItem('emailForSignIn');
        if (!storedEmail) {
          // If the email is not stored, prompt the user for it.
          // This can happen if they open the link on a different device.
          storedEmail = window.prompt('Please provide your email to complete the sign-in.');
        }

        if (storedEmail) {
          setIsLoading(true);
          try {
            await signInWithEmailLink(auth, storedEmail, href);
            window.localStorage.removeItem('emailForSignIn');
            toast({
              title: 'Login Successful',
              description: 'You have been securely logged in.',
            });
            router.push('/log-all-form-works');
          } catch (error) {
            console.error("Sign in with email link error:", error);
            setError('Failed to sign in. The link may be invalid or expired.');
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'The sign-in link was invalid or has expired. Please try again.',
            });
          } finally {
            setIsLoading(false);
          }
        }
      }
    };
    handleEmailLinkSignIn();
  }, [auth, router, toast]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setEmailSent(false);

    try {
      // Configuration for the sign-in link
      const actionCodeSettings = {
        url: `${window.location.origin}/log-all-form-works`, // Redirect to the log page after sign in
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save the email locally to use when the user returns
      window.localStorage.setItem('emailForSignIn', email);
      
      setEmailSent(true);
      toast({
        title: 'Sign-in Link Sent',
        description: `A sign-in link has been sent to ${email}. Check your inbox!`,
      });

    } catch (error: any) {
      console.error("Send link error:", error);
      setError('Failed to send sign-in link. Please check the email address and try again.');
      toast({
        variant: 'destructive',
        title: 'Failed to Send Link',
        description: 'Please ensure the email address is correct and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Check your email for the sign-in link."
              : "Enter your email to receive a secure sign-in link."
            }
          </CardDescription>
        </CardHeader>
        {!emailSent ? (
          <form onSubmit={handleSendLink}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Sign-in Link"}
                </Button>
              </CardFooter>
          </form>
        ) : (
          <CardContent>
            <p className="text-center text-muted-foreground">
                Once you click the link in your email, you will be automatically logged in. You can close this tab.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
