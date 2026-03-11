'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Zap, ArrowRight, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const { register: reg, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
      } else {
        await register(data.name, data.email, data.password);
      }
    } catch (e) {
      // toast handled in api
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    reset();
  };

  return (
    <div className="min-h-screen bg-[hsl(222,15%,8%)] flex overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col w-1/2 relative p-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-[hsl(222,15%,8%)] to-indigo-950/30" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">ProjectFlow</span>
          </div>

          {/* Main heading */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <div className="text-violet-400 text-sm font-medium tracking-widest uppercase mb-4">Built for teams that ship</div>
              <h1 className="text-5xl font-bold text-white leading-[1.1] mb-6">
                Where great
                <br />
                <span className="text-gradient">projects</span> begin.
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
                Plan, track, and deliver your best work. Beautiful, fast, and built for modern teams.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                { emoji: '⚡', text: 'Real-time collaboration with live cursors' },
                { emoji: '📊', text: 'Kanban, List, Calendar & Gantt views' },
                { emoji: '🔔', text: 'Smart notifications & activity feed' },
                { emoji: '📈', text: 'Analytics dashboard & team insights' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-base border border-white/10 flex-shrink-0">
                    {item.emoji}
                  </div>
                  <span className="text-gray-300 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 pt-8 border-t border-white/10">
            <div className="flex -space-x-2">
              {['#6366f1', '#10b981', '#f59e0b', '#ef4444'].map((color, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[hsl(222,15%,8%)] flex items-center justify-center text-xs text-white font-medium" style={{ background: color }}>
                  {['JD', 'KL', 'MR', 'AS'][i]}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm">
              <span className="text-white font-medium">4,200+</span> teams trust ProjectFlow
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">ProjectFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-gray-400 text-sm">
              {mode === 'login'
                ? "Don't have an account? "
                : "Already have an account? "}
              <button onClick={switchMode} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                {mode === 'login' ? 'Sign up for free' : 'Sign in'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full name</label>
                <input
                  {...reg('name', { required: 'Name is required' })}
                  className={cn(
                    "w-full bg-[hsl(222,15%,13%)] border rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm transition-all outline-none",
                    "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                    errors.name ? "border-red-500" : "border-[hsl(222,15%,20%)]"
                  )}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message as string}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
              <input
                {...reg('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }
                })}
                type="email"
                className={cn(
                  "w-full bg-[hsl(222,15%,13%)] border rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm transition-all outline-none",
                  "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                  errors.email ? "border-red-500" : "border-[hsl(222,15%,20%)]"
                )}
                placeholder="you@company.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...reg('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={cn(
                    "w-full bg-[hsl(222,15%,13%)] border rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-500 text-sm transition-all outline-none",
                    "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                    errors.password ? "border-red-500" : "border-[hsl(222,15%,20%)]"
                  )}
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message as string}</p>}
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl py-3 text-sm transition-all duration-200",
                "shadow-lg shadow-violet-600/25 hover:shadow-violet-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <p className="text-violet-300 text-xs font-medium mb-2">🚀 Try demo account:</p>
            <p className="text-gray-400 text-xs font-mono">demo@projectflow.app / demo123</p>
          </div>

          <p className="text-gray-600 text-xs text-center mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
