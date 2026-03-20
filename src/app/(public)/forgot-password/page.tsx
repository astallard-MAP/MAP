
"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/firebase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicBrandLogo from "@/components/PublicBrandLogo";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const enforceUkSpelling = (message: string): string => {
  if (!message) return '';
  return message
    .replace(/\bcolor\b/g, 'colour')
    .replace(/\bcenter\b/g, 'centre')
    .replace(/\bliter\b/g, 'litre');
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        setError("Authentication service is not available. Please try again later.");
        return;
    }
    setError(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code?.includes('auth/invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
      } else if (error.code?.includes('auth/user-not-found')) {
          setSubmitted(true);
          setLoading(false);
          return;
      }
      setError(enforceUkSpelling(errorMessage)); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <PublicBrandLogo className="mb-4" />
          <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
          <CardDescription>
            {submitted
              ? "Check your inbox for a password reset link."
              : "Enter your email address to reset your password."}
          </CardDescription>
        </CardHeader>
        {submitted ? (
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              If an account with that email exists, a reset link has been sent. This may take a few minutes.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleResetPassword}>
            <CardContent className="grid gap-4">
              {error &&
              (
                <Alert variant="destructive">
                  <AlertTitle>Request Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </CardFooter>
          </form>
        )}
        <CardFooter>
            <Link href="/login" className="text-sm underline w-full text-center">
                Back to login
            </Link>
        </CardFooter>
      </Card>
      <p className="text-xs text-muted-foreground text-center mt-6">
        © 2025 The Auction Department Limited – All Rights Reserved
      </p>
    </main>
  );
}
