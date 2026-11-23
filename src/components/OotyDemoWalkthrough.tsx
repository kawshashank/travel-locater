"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  KeyRound,
  Maximize2,
  Minimize2,
  Play,
  ShieldCheck,
} from "lucide-react";
import { CAR_PALETTE } from "@/lib/geo";

interface OotyDemoWalkthroughProps {
  onLaunchFullDemo: () => void;
  onBackHome: () => void;
}

const DEMO_STEPS = [
  {
    stepNumber: 1,
    title: "Friend A Starts Travel",
    subtitle: "Mandatory Name + Consent + Trip Name",
  },
  {
    stepNumber: 2,
    title: "Multiple Friends Join",
    subtitle: "Supports 2, 4, 6+ friends in different cars",
  },
  {
    stepNumber: 3,
    title: "Live Google Maps Preview",
    subtitle: "Moving upwards toward Ooty + Ahead/Behind",
  },
];

export default function OotyDemoWalkthrough({
  onLaunchFullDemo,
  onBackHome,
}: OotyDemoWalkthroughProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [previewSpread, setPreviewSpread] = useState<"close" | "far">("far");

  const demoCars = [
    {
      name: "Friend A (Arjun)",
      shortLabel: "Arjun",
      car: "Car 1 • Red Thar 4x4",
      color: CAR_PALETTE[0].hex,
      speed: 62,
      limit: "4 hrs",
      distToOotyKm: previewSpread === "close" ? 38.0 : 28.5,
      topPct: previewSpread === "close" ? 30 : 22,
      isYou: false,
    },
    {
      name: "Friend B (Rohan • YOU)",
      shortLabel: "Rohan (YOU)",
      car: "Car 2 • Cyan Creta SX",
      color: "#1a73e8",
      speed: 58,
      limit: "3 hrs",
      distToOotyKm: previewSpread === "close" ? 38.4 : 41.0,
      topPct: previewSpread === "close" ? 46 : 43,
      isYou: true,
    },
    {
      name: "Friend C (Priya)",
      shortLabel: "Priya",
      car: "Car 3 • Amber Scorpio-N",
      color: CAR_PALETTE[2].hex,
      speed: 65,
      limit: "3 hrs",
      distToOotyKm: previewSpread === "close" ? 38.8 : 53.5,
      topPct: previewSpread === "close" ? 62 : 64,
      isYou: false,
    },
    {
      name: "Friend D (Karthik)",
      shortLabel: "Karthik",
      car: "Car 4 • Rose Virtus GT",
      color: CAR_PALETTE[3].hex,
      speed: 60,
      limit: "2 hrs",
      distToOotyKm: previewSpread === "close" ? 39.1 : 67.0,
      topPct: previewSpread === "close" ? 78 : 84,
      isYou: false,
    },
  ];

  const viewerCar = demoCars[1]; // Fixed to YOU (Rohan)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top Header with Prominent Back to Home Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={onBackHome}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Home Page</span>
        </button>

        <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          Step-by-Step Guide • Travel to Ooty
        </span>
      </div>

      {/* Responsive Stepper Indicator: Stacked on Mobile, 3-Column on Tablet/Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {DEMO_STEPS.map((s) => {
          const isCurrent = activeStep === s.stepNumber;
          const isDone = activeStep > s.stepNumber;
          return (
            <button
              key={s.stepNumber}
              onClick={() => setActiveStep(s.stepNumber)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex sm:block items-center justify-between gap-3 ${
                isCurrent
                  ? "bg-slate-900 border-emerald-400 shadow-lg"
                  : isDone
                  ? "bg-slate-900/60 border-emerald-500/30"
                  : "bg-slate-900/40 border-white/10 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-bold min-w-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    isCurrent
                      ? "bg-emerald-400 text-slate-950"
                      : isDone
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : s.stepNumber}
                </span>
                <div className="min-w-0">
                  <div className="text-white truncate">{s.title}</div>
                  <p className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                    {s.subtitle}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content Card */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 sm:p-8 shadow-2xl">
        <AnimatePresence mode="wait">
          {/* ================================================= */}
          {/* STEP 1: FRIEND A CREATES TRIP                     */}
          {/* ================================================= */}
          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Step 1 of 3 • Friend A (Host Car)
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Friend A Starts the Trip &amp; System Generates a Unique Random Code
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  When Friend A opens the app and says <strong>Yes</strong> to
                  starting group travel, three simple things happen:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    1. Location Consent
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Friend A gives explicit permission to share their car&apos;s live
                    GPS location with the group.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <Clock className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    2. Sets Time Limit
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Chooses how long to share location (e.g.,{" "}
                    <strong className="text-cyan-300">1 hr, 2 hrs, 3 hrs, 4 hrs</strong>
                    ). Sharing stops automatically after that.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <KeyRound className="w-6 h-6 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    3. Random Unique Code
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enters mandatory name + trip name{" "}
                    <strong className="text-white">&ldquo;Travel to Ooty&rdquo;</strong> and
                    the system generates a random code of small letters &amp; numbers:{" "}
                    <strong className="text-emerald-400 font-mono">ooty24x7</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-emerald-200 leading-relaxed">
                  <strong>Generated Unique Group Code:</strong>{" "}
                  <span className="font-mono text-base font-black text-emerald-400 mx-1">
                    ooty24x7
                  </span>{" "}
                  — Ready to share with all friends in other cars!
                </div>
                <button
                  onClick={() => setActiveStep(2)}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Next: Friends Join</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================= */}
          {/* STEP 2: MULTIPLE FRIENDS JOIN (4 CARS!)           */}
          {/* ================================================= */}
          {activeStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Step 2 of 3 • Multi-Car Group Support
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Multiple Friends Join Using Code{" "}
                  <span className="text-emerald-400 font-mono">ooty24x7</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Whether you have{" "}
                  <strong className="text-white">2, 4, or 8 cars</strong> in your road
                  trip, every friend clicks <strong>Start Group Travel</strong>,
                  enters their mandatory name and code{" "}
                  <code className="text-emerald-300">ooty24x7</code>, gives
                  consent, and joins the same convoy:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoCars.map((c, idx) => (
                  <div
                    key={c.name}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0"
                        style={{ backgroundColor: c.color }}
                      >
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {c.car}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                        ✓ {c.limit}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {c.speed} km/h
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                <button
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 font-semibold text-xs cursor-pointer text-center"
                >
                  Previous Step
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="justify-center px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: See Live Convoy Preview</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================================================= */}
          {/* STEP 3: UPWARD GOOGLE MAPS PREVIEW BOX            */}
          {/* ================================================= */}
          {activeStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Step 3 of 3 • Google Maps Upward View
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    Moving Upwards Towards Ooty
                  </h2>
                </div>

                {/* Toggle Close vs Far to see Auto-Zoom */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10 w-full sm:w-auto">
                  <button
                    onClick={() => setPreviewSpread("close")}
                    className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap ${
                      previewSpread === "close"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Close (Zooms IN)</span>
                  </button>
                  <button
                    onClick={() => setPreviewSpread("far")}
                    className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap ${
                      previewSpread === "far"
                        ? "bg-amber-500 text-slate-950"
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Far (Zooms OUT)</span>
                  </button>
                </div>
              </div>

              {/* Google Maps Style Upward Preview Box */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Left: Google Maps Day-Style Vertical Highway Moving UPWARDS */}
                <div className="md:col-span-6 relative h-72 rounded-2xl bg-[#f1f3f4] border border-slate-300 overflow-hidden p-3.5 flex flex-col justify-between text-slate-900 shadow-inner">
                  {/* Destination at the TOP */}
                  <div className="z-10 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0d652d] text-white text-[10px] sm:text-[11px] font-bold shadow whitespace-nowrap">
                      ↑ Towards Ooty
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-red-400 text-slate-900 text-[10px] sm:text-[11px] font-extrabold shadow whitespace-nowrap">
                      📍 Ooty (Top)
                    </span>
                  </div>

                  {/* Vertical Google Maps Blue Highway Line */}
                  <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-3.5 rounded-full bg-[#174ea6] flex justify-center">
                    <div className="w-2.5 h-full rounded-full bg-[#4285F4]" />
                  </div>

                  {/* 4 Cars Moving UPWARDS */}
                  {demoCars.map((car, idx) => {
                    const onRight = idx % 2 === 0;
                    return (
                      <motion.div
                        key={car.name}
                        animate={{ top: `${car.topPct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center"
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md z-10"
                          style={{ backgroundColor: car.color }}
                        />
                        <div
                          className={`absolute ${
                            onRight ? "left-5" : "right-5"
                          } px-2 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap shadow ${
                            car.isYou
                              ? "bg-[#1a73e8] text-white"
                              : "bg-white text-slate-800 border border-slate-300"
                          }`}
                        >
                          ▲ #{idx + 1} {car.shortLabel}
                        </div>
                      </motion.div>
                    );
                  })}

                  <div className="z-10 text-[10px] font-bold text-slate-600 bg-white/95 px-2.5 py-1 rounded-lg self-start shadow-sm">
                    {previewSpread === "close"
                      ? "Auto-Zoom: 15.2x (Close)"
                      : "Auto-Zoom: 10.1x (Far Apart)"}
                  </div>
                </div>

                {/* Right: Ahead / Behind Relative to YOU */}
                <div className="md:col-span-6 space-y-2.5">
                  <div className="text-xs text-slate-300 font-semibold">
                    Your perspective:{" "}
                    <strong className="text-white">{viewerCar.name}</strong>
                  </div>

                  {demoCars
                    .filter((c) => !c.isYou)
                    .map((other) => {
                      const deltaKm = viewerCar.distToOotyKm - other.distToOotyKm;
                      const isAhead = deltaKm > 0;
                      return (
                        <div
                          key={other.name}
                          className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {other.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {other.car}
                            </div>
                          </div>
                          <div
                            className={`text-xs font-extrabold whitespace-nowrap shrink-0 ${
                              isAhead ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {isAhead
                              ? `▲ AHEAD ${Math.abs(deltaKm).toFixed(1)} km`
                              : `▼ BEHIND ${Math.abs(deltaKm).toFixed(1)} km`}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Launch Full Interactive Map Button */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 font-semibold text-xs cursor-pointer text-center"
                >
                  Previous Step
                </button>

                <button
                  onClick={onLaunchFullDemo}
                  className="justify-center px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span>Open Full Live Ooty Map (4 Friends Active)</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
