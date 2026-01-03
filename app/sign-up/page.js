"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import { signIn } from "next-auth/react";
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function SignupClient() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

 const handleGoogleSignup = async () =>{
  setLoading(true);
  try {
    await signIn("google",{
      callbackUrl:"/api/auth/google-callback",
      redirect:true
    })
  } catch (error) {
    setError("Google signup failed");
    setLoading(false);
  }
 }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8"
      >
        <h1 className="text-2xl font-semibold text-neutral-100 text-center mb-6">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-800 text-red-400 px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handlePasswordSignup} className="space-y-4">
          <Input
            icon={<FiUser />}
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
          />

          <Input
            icon={<FiMail />}
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />

          <Input
            icon={<FiLock />}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />

          <Input
            icon={<FiLock />}
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-100 text-neutral-900 py-2.5 rounded-md font-medium hover:bg-white disabled:bg-neutral-400 transition"
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-xs text-neutral-500">OR</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* GOOGLE */}
        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full border border-neutral-700 py-2.5 rounded-md text-neutral-300 hover:bg-neutral-800 transition"
        >
          Sign up with Google
        </button>
         <button
        onClick={()=>router.push("/")}
          className="w-full border mt-2 border-neutral-700 py-2.5 rounded-md text-neutral-300 hover:bg-neutral-800 transition"
        >
          Go to home
        </button>

        <p className="text-center text-sm text-neutral-400 mt-6">
          Already have an account?{" "}
          <a
            href="/sign-in"
            className="text-neutral-100 hover:underline"
          >
            Log in
          </a>
        </p>

        <p className="text-center text-xs text-neutral-500 mt-4">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

/* ---------- Input Component ---------- */

function Input({
  icon,
  ...props
}) {
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
