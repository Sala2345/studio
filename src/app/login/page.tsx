
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (authAction: 'signIn' | 'signUp') => {
    if (!email || !password) {
        setError('Please enter both email and password.');
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      if (authAction === 'signIn') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Login Successful',
          description: 'You have been securely logged in.',
        });
        // Redirect is handled by useEffect
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        toast({
          title: 'Sign Up Successful',
          description: 'Your account has been created. Please check your email to verify your account.',
        });
      }
    } catch (error: any) {
      console.error(`${authAction} error:`, error);
      let friendlyMessage = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists. Please sign in.';
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'The password is too weak. It must be at least 6 characters long.';
      }
      
      setError(friendlyMessage);
      toast({
        variant: 'destructive',
        title: `${authAction === 'signIn' ? 'Login' : 'Sign Up'} Failed`,
        description: friendlyMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (user) {
      setIsLoading(true);
      try {
        await sendEmailVerification(user);
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your inbox (and spam folder).',
        });
      } catch (error: any) {
        console.error("Resend verification error:", error);
        toast({
          variant: 'destructive',
          title: 'Failed to Resend Email',
          description: error.message || 'Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isUserLoading && user) {
        // We need to reload the user to get the latest emailVerified status
        user.reload().then(() => {
            if (user.emailVerified) {
                router.push('/');
            }
        });
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  if (user && !user.emailVerified) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Email Verification Required</CardTitle>
                    <CardDescription>
                        You must verify your email address before you can access the admin dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Check Your Email</AlertTitle>
                        <AlertDescription>
                            A verification link has been sent to <strong>{user.email}</strong>. Please click the link in the email to continue. After verifying, you may need to refresh this page or log in again.
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                     <Button onClick={handleResendVerification} className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Resend Verification Email"}
                    </Button>
                    <Button onClick={() => signOut(auth)} variant="outline" className="w-full">
                        Log Out
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your email and password to access the dashboard.
          </CardDescription>
        </CardHeader>
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
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button onClick={() => handleAuth('signIn')} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
            <Button onClick={() => handleAuth('signUp')} className="w-full" variant="outline" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
