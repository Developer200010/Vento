"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiZap,
  FiLock,
  FiArrowRight,
} from "react-icons/fi";

import { fadeUp, fadeIn, stagger } from "@/lib/motion";

export default function HomeClient() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Navbar */}
      <header className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <FiMapPin />
            LocalChat
          </div>

          <nav className="flex gap-4 items-center">
            <Link
              href="/sign-in"
              className="text-neutral-400 hover:text-neutral-100 transition"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="bg-neutral-100 text-neutral-900 px-4 py-1.5 rounded-md font-medium hover:bg-white transition"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO (on load) */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Chat with People
          <br />
          <span className="text-neutral-400">Around You</span>
        </h1>

        <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
          Location-based chatrooms that connect you with people nearby.
          Conversations that matter, where you are.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 bg-neutral-100 text-neutral-900 px-6 py-3 rounded-lg font-semibold hover:bg-white transition"
          >
            Get Started
            <FiArrowRight />
          </Link>

          <Link
            href="/sign-in"
            className="border border-neutral-700 px-6 py-3 rounded-lg font-semibold hover:bg-neutral-900 transition"
          >
            Log in
          </Link>
        </div>
      </motion.section>

      {/* FEATURES (scroll) */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6"
      >
        {[
          {
            icon: <FiMapPin />,
            title: "Location-Based",
            desc: "Chat only with people within a defined radius.",
          },
          {
            icon: <FiZap />,
            title: "Real-Time",
            desc: "Instant messaging powered by real-time technology.",
          },
          {
            icon: <FiLock />,
            title: "Private & Secure",
            desc: "Messages expire automatically for privacy.",
          },
        ].map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
          >
            <div className="text-neutral-300 text-2xl mb-4">
              {f.icon}
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {f.title}
            </h3>
            <p className="text-neutral-400 text-sm">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </motion.section>

      {/* HOW IT WORKS (scroll) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="max-w-7xl mx-auto px-6 mt-24"
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          How It Works
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            "Sign Up",
            "Enable Location",
            "Join or Create",
            "Start Chatting",
          ].map((step, i) => (
            <motion.div
              key={step}
              variants={fadeUp}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <h4 className="font-semibold mb-1">
                {step}
              </h4>
              <p className="text-neutral-400 text-sm">
                Simple and fast onboarding
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FOOTER (scroll fade) */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="border-t border-neutral-800 mt-24 py-8 text-center text-neutral-500 text-sm"
      >
        © 2024 LocalChat — Built with Next.js
      </motion.footer>
    </div>
  );
}
