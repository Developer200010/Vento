"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { FiMail, FiLock } from "react-icons/fi";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Clear any existing sessions/cookies to avoid being auto-signed into previous account
      try {
        await fetch("/api/auth/sign-out", { method: "POST" }); // clear custom JWT
      } catch {}
      try {
        await signOut({ redirect: false }); // clear next-auth cookies if any
      } catch {}

      await signIn("google", {
        callbackUrl: "/api/auth/google-callback",
        redirect: true,
        prompt: "select_account", // force account selector
      });
    } catch {
      setError("Google login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="w-full max-w-md">
        <Card className="p-8">
        <h1 className="text-2xl font-semibold text-neutral-100 text-center mb-6">
          Welcome Back
        </h1>

        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-800 text-red-400 px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* PASSWORD LOGIN */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <Input
            icon={<FiMail />}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <Input
            icon={<FiLock />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging in…" : "Login"}
          </Button>
        </form>

        {/* DIVIDER */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-xs text-neutral-500">OR</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-neutral-700 py-2.5 rounded-md text-neutral-300 hover:bg-neutral-800 transition"
        >
          Continue with Google
        </button>
        <button
        onClick={()=>router.push("/")}
          className="w-full border mt-2 border-neutral-700 py-2.5 rounded-md text-neutral-300 hover:bg-neutral-800 transition"
        >
          Go to home
        </button>

        <p className="text-center text-sm text-neutral-400 mt-6">
          Don’t have an account?{" "}
          <a
            href="/sign-up"
            className="text-neutral-100 hover:underline"
          >
            Sign up
          </a>
        </p>
        </Card>
      </motion.div>
    </div>
  );
}

/* ---------- Input Component ---------- */

function Input({ icon, ...props }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
        {icon}
      </span>
      <input
        {...props}
        required
        className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-10 pr-3 py-2.5 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
      />
    </div>
  );
}
