"use client";
import { motion } from "framer-motion";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500",
    outline: "border border-neutral-700 text-neutral-200 hover:bg-neutral-800",
    ghost: "text-neutral-300 hover:bg-neutral-800",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };
  const cls = `${base} ${sizes[size]} ${variants[variant] || ""} ${className}`;

  return (
    <motion.button whileTap={{ scale: 0.98 }} className={cls} {...props}>
      {children}
    </motion.button>
  );
}
