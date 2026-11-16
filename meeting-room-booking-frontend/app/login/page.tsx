"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl"
        style={{
          boxShadow:
            "0 0 40px rgba(30, 58, 138, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <h1 className="mb-1 text-2xl font-bold text-white">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-400">
          Sign in to manage your bookings
        </p>

        {error && (
          <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400 border border-red-500/20">
            {error}
          </p>
        )}

        <div className="mb-3">
          <label className="mb-1 block pl-1 text-xs font-medium text-slate-400">
            Email
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-full border border-slate-700 bg-slate-800/60 px-5 py-3 text-white text-xs placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="you@example.com"
          />
        </div>

        <div className="mb-5">
          <label className="mb-1 block pl-1 text-xs font-medium text-slate-400">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-full border border-slate-700 text-xs bg-slate-800/60 px-5 py-3 pr-11 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-3 font-medium text-white shadow-lg shadow-blue-900/40 transition hover:from-blue-500 hover:to-blue-400 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>
    </div>
  );
}