
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../../firebase";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import PublicBrandLogo from "../../../components/PublicBrandLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Authentication service is not available.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      // Explicit session management for production redirects.
      document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
      toast({ title: "Login Successful", description: "Accessing production dashboard..." });
      router.push("/dashboard");
    } catch (err: any) {
      setError("Invalid credentials. Please verify your work email and password.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-[100dvh] bg-slate-50" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full p-4 sm:p-6 font-body bg-slate-50">
      <div className="flex flex-col items-center w-full max-w-[340px] gap-6 py-8">
        
        <div className="text-center w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight uppercase leading-tight w-full">My Auction Portal</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
            powered by
          </p>
        </div>
        
        <Card className="w-full shadow-2xl border-t-4 border-primary rounded-xl overflow-hidden bg-white">
          <CardHeader className="flex flex-col items-center pt-8 pb-2 px-6">
            <PublicBrandLogo className="w-full" />
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="grid gap-5 px-6 pt-6">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertTitle className="text-[10px] font-bold">Access Denied</AlertTitle>
                  <AlertDescription className="text-[9px]">{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold text-[10px] uppercase tracking-wider">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="staff@auctiondepartment.com" 
                    required 
                    className="pl-9 h-10 text-xs bg-slate-50/50 minimalist-input" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-[10px] uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    className="pl-9 h-10 text-xs bg-slate-50/50 minimalist-input" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-[-10px]">
                <Link href="/forgot-password" title="Recover password" className="text-[9px] font-bold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8 pt-4 px-6">
              <Button type="submit" className="w-full h-10 text-xs font-bold shadow-md shadow-primary/10" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                {loading ? "Authenticating..." : "Secure Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center text-[10px] font-medium text-slate-500">
          New partner agency? <Link href="/signup" className="text-primary font-bold hover:underline">Request Portal Access</Link>
        </div>
      </div>

      <footer className="mt-8 pb-8 text-center">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} The Auction Department Limited
        </p>
      </footer>
    </div>
  );
}
