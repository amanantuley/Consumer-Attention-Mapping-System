import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authAPI, roleAPI } from "@/lib/api";
import type { Role } from "@/types";
import { toast } from "react-toastify";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
    role_id: 0,
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await roleAPI.getRoles();
        setRoles(res.data);
        if (res.data.length > 0) {
          setFormData((prev) => ({ ...prev, role_id: res.data[0].id }));
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = formData;
      await authAPI.register(data);
      toast.success("Account created. You can sign in now.");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(167,139,250,0.18),_transparent_26%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_0%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.14),transparent_0%)]" />
      <div className="pointer-events-none absolute left-8 top-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-8 bottom-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      <Card className="relative w-full max-w-lg border-white/10 bg-slate-900/75 shadow-[0_30px_90px_-30px_rgba(2,6,23,0.95)] backdrop-blur-2xl">
        <CardHeader className="space-y-4 text-center px-8 pt-10">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_18px_50px_-18px_rgba(34,211,238,0.75)]">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-semibold text-white">Create your account</CardTitle>
            <CardDescription className="mt-3 text-sm leading-6 text-slate-400">Join the attention intelligence suite with secure role management and operational insights.</CardDescription>
          </div>
          <div className="mx-auto mt-4 flex max-w-sm flex-col gap-3 text-left text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <p className="font-semibold text-slate-100">Modern analytics access</p>
              <p className="text-slate-400">Scale with secure team roles and instant store visibility.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <p className="font-semibold text-slate-100">Designed for operations</p>
              <p className="text-slate-400">A polished dashboard experience for administrators, managers, and analysts.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10 pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="username" name="username" type="text" placeholder="johndoe" value={formData.username} onChange={handleChange} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="email" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="full_name" className="text-slate-300">Full name</Label>
                <Input id="full_name" name="full_name" type="text" placeholder="John Doe" value={formData.full_name} onChange={handleChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="role_id" className="text-slate-300">Role</Label>
                <select id="role_id" name="role_id" value={formData.role_id} onChange={handleChange} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60" required>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-400 transition hover:text-cyan-300">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
