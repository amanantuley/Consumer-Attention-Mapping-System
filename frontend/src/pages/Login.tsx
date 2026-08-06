import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login({ username, password });
      login(res.data.access_token, res.data.user);
      toast.success("Welcome back.");
      const roleName = res.data.user.role.name;
      if (roleName === "Administrator") {
        navigate("/dashboard/admin");
      } else if (roleName === "Store Manager") {
        navigate("/dashboard/store-manager");
      } else if (roleName === "Retail Analyst") {
        navigate("/dashboard/retail-analyst");
      } else if (roleName === "Marketing Manager") {
        navigate("/dashboard/marketing-manager");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(167,139,250,0.18),_transparent_26%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_0%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.14),transparent_0%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      <Card className="relative w-full max-w-md border-white/10 bg-slate-900/75 shadow-[0_30px_90px_-30px_rgba(2,6,23,0.95)] backdrop-blur-2xl">
        <CardHeader className="space-y-4 text-center px-8 pt-10">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_18px_50px_-18px_rgba(34,211,238,0.75)]">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-semibold text-white">SignalOS</CardTitle>
            <CardDescription className="mt-3 text-sm leading-6 text-slate-400">Enterprise-grade attention analytics for stores, teams, and real-time behavior optimization.</CardDescription>
          </div>
          <div className="mx-auto mt-4 flex max-w-sm flex-col gap-3 text-left text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <p className="font-semibold text-slate-100">Secure dashboard access</p>
              <p className="text-slate-400">Role-based workspace entry with session guard and audit-ready login.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <p className="font-semibold text-slate-100">Fast enterprise insights</p>
              <p className="text-slate-400">Launch into your operational performance and customer attention metrics instantly.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10 pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username or email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input id="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-11" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-400">
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-cyan-400 transition hover:text-cyan-300">Create one</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
