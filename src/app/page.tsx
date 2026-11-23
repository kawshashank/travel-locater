"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Car,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  KeyRound,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import ConvoyMap from "@/components/ConvoyMap";
import ConvoyTelemetry from "@/components/ConvoyTelemetry";
import OotyDemoWalkthrough from "@/components/OotyDemoWalkthrough";
import { PRESET_CORRIDORS, TripSession } from "@/lib/geo";

type ScreenStep =
  | "welcome"
  | "ooty-demo-steps"
  | "create-wizard"
  | "code-generated"
  | "join-wizard"
  | "dashboard";

const SHARE_DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12];
const DEFAULT_DEMO_CODE = "ooty24x7";

export default function ConvoyAppPage() {
  const [screen, setScreen] = useState<ScreenStep>("welcome");

  // Shared Consent & Duration State
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "requesting" | "locked" | "highway-fallback"
  >("idle");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [shareDurationHours, setShareDurationHours] = useState<number>(3);

  // Friend A (Host) Create Form — Name & Trip Name are Mandatory
  const [tripName, setTripName] = useState<string>("Travel to Ooty");
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>("ooty");
  const [hostName, setHostName] = useState<string>("");
  const [hostCarName, setHostCarName] = useState<string>("Car 1 • Red Thar 4x4");

  // Joining Friend (Friend B, C, D...) Form — Name is Mandatory
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestCarName, setGuestCarName] = useState<string>("Car 2 • Cyan Creta SX");
  const [recentCreatedCode, setRecentCreatedCode] =
    useState<string>(DEFAULT_DEMO_CODE);

  // Active Trip Session
  const [session, setSession] = useState<TripSession | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  // 1-Minute Auto-Refresh State
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(60);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>("");
  const [liveCruiseActive, setLiveCruiseActive] = useState<boolean>(false);

  // UI Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCode = window.localStorage.getItem("convoy_last_code");
      if (savedCode) {
        setRecentCreatedCode(savedCode.toLowerCase());
      }
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get("join");
      if (joinParam) {
        setJoinCodeInput(joinParam.toLowerCase());
        setScreen("join-wizard");
      }

      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("convoy_sync_channel");
        bc.onmessage = (ev) => {
          if (ev.data?.type === "SESSION_UPDATED" && ev.data?.session) {
            const incoming: TripSession = ev.data.session;
            setRecentCreatedCode(incoming.code);
            setSession((prev) => {
              if (prev && prev.code === incoming.code) {
                return incoming;
              }
              return prev;
            });
          }
        };
        broadcastRef.current = bc;
        return () => bc.close();
      }
    }
  }, []);

  const broadcastSession = useCallback((updated: TripSession) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("convoy_last_code", updated.code);
      window.localStorage.setItem(
        `convoy_session_${updated.code}`,
        JSON.stringify(updated)
      );
    }
    broadcastRef.current?.postMessage({
      type: "SESSION_UPDATED",
      session: updated,
    });
  }, []);

  const handleRequestLocationConsent = () => {
    setErrorMsg(null);
    setGpsStatus("requesting");
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setConsentGranted(true);
          setGpsStatus("locked");
          showToast("Live GPS Location Access Granted!");
        },
        () => {
          setConsentGranted(true);
          setGpsStatus("highway-fallback");
          showToast("Location Consent Confirmed!");
        },
        { enableHighAccuracy: true, timeout: 3500 }
      );
    } else {
      setConsentGranted(true);
      setGpsStatus("highway-fallback");
      showToast("Location Consent Confirmed!");
    }
  };

  // Friend A: Create Group Travel
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hostName.trim()) {
      setErrorMsg("Your Name is mandatory. Please enter your name.");
      return;
    }
    if (!tripName.trim()) {
      setErrorMsg("Please enter a mandatory Trip Name (e.g., 'Travel to Ooty').");
      return;
    }
    if (!consentGranted) {
      setErrorMsg("Please grant Location Access Consent before starting group travel.");
      return;
    }

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripName: tripName.trim(),
          presetCorridorId: selectedCorridorId,
          hostName: hostName.trim(),
          carName: hostCarName.trim() || "Car 1 • SUV",
          shareDurationHours,
          consentGranted: true,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Could not create trip.");
        return;
      }

      setSession(data.session);
      setCurrentUserId(data.participant.id);
      setRecentCreatedCode(data.session.code);
      setLastRefreshedTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setSecondsUntilRefresh(60);
      broadcastSession(data.session);
      setScreen("code-generated");
    } catch {
      setErrorMsg("Network error creating trip. Please try again.");
    }
  };

  // Friend B, C, D...: Join Group Travel
  const handleJoinTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = joinCodeInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (!cleanCode) {
      setErrorMsg("Please enter the unique Convoy Code shared by Friend A.");
      return;
    }
    if (!guestName.trim()) {
      setErrorMsg("Your Name is mandatory. Please enter your name to join.");
      return;
    }
    if (!consentGranted) {
      setErrorMsg("Please give Location Access Consent to join the group travel.");
      return;
    }

    try {
      const res = await fetch(`/api/trips/${cleanCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          name: guestName.trim(),
          carName: guestCarName.trim() || "Car • SUV",
          shareDurationHours,
          consentGranted: true,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Invalid convoy code.");
        return;
      }

      setSession(data.session);
      setCurrentUserId(data.participant.id);
      setLastRefreshedTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setSecondsUntilRefresh(60);
      broadcastSession(data.session);
      setScreen("dashboard");
      showToast(
        `Joined "${data.session.tripName}" as ${data.participant.name}!`
      );
    } catch {
      setErrorMsg("Unable to join group travel. Check the code and try again.");
    }
  };

  // Launch Full 4-Car Ooty Demo Map
  const handleLaunchFullOotyDemo = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/trips/${DEFAULT_DEMO_CODE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_demo" }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        const defaultViewer =
          data.session.participants[1]?.id ||
          data.session.participants[0]?.id ||
          "";
        setCurrentUserId(defaultViewer);
        setConsentGranted(true);
        setLastRefreshedTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
        setSecondsUntilRefresh(60);
        setScreen("dashboard");
        showToast(
          'Loaded "Travel to Ooty" (4 Friends Active • Moving Upwards to Ooty)!'
        );
      }
    } catch {
      setErrorMsg("Could not load demo session.");
    }
  };

  // Refresh locations every 1 minute
  const refreshConvoyLocations = useCallback(
    async (advanceMovement: boolean = false) => {
      if (!session) return;
      setIsRefreshing(true);
      try {
        const res = await fetch(`/api/trips/${session.code}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_location",
            participantId: currentUserId,
            advanceSimulation: advanceMovement,
          }),
        });
        const data = await res.json();
        if (res.ok && data.session) {
          setSession(data.session);
          setLastRefreshedTime(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
          broadcastSession(data.session);
        }
      } finally {
        setIsRefreshing(false);
        setSecondsUntilRefresh(60);
      }
    },
    [session, currentUserId, broadcastSession]
  );

  useEffect(() => {
    if (screen !== "dashboard" || !session) return;
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          refreshConvoyLocations(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, session, refreshConvoyLocations]);

  useEffect(() => {
    if (screen !== "dashboard" || !session || !liveCruiseActive) return;
    const cruiseTimer = setInterval(() => {
      refreshConvoyLocations(true);
    }, 2500);
    return () => clearInterval(cruiseTimer);
  }, [screen, session, liveCruiseActive, refreshConvoyLocations]);

  // Add another simulated friend car (Friend B, C, D, E, F...)
  const handleAddAnotherFriendCar = async (goToDashboardAfter: boolean = true) => {
    if (!session) return;
    const nextIdx = session.participants.length;
    const friendLetter = String.fromCharCode(65 + nextIdx);
    const sampleNames = ["Rohan", "Priya", "Karthik", "Vikram", "Ananya", "Dev"];
    const sampleCars = [
      "Cyan Creta SX",
      "Amber Scorpio-N",
      "Rose Virtus GT",
      "Violet Compass",
      "Lime Jimny 4x4",
    ];
    const pickedName = `Friend ${friendLetter} (${
      sampleNames[(nextIdx - 1) % sampleNames.length]
    })`;
    const pickedCar = `Car ${nextIdx + 1} • ${
      sampleCars[(nextIdx - 1) % sampleCars.length]
    }`;

    const res = await fetch(`/api/trips/${session.code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join",
        name: pickedName,
        carName: pickedCar,
        shareDurationHours: 3,
        consentGranted: true,
      }),
    });
    const data = await res.json();
    if (res.ok && data.session) {
      setSession(data.session);
      broadcastSession(data.session);
      showToast(
        `${pickedName} joined "${data.session.tripName}" (${data.session.participants.length} cars active)!`
      );
      if (goToDashboardAfter) {
        setScreen("dashboard");
      }
    }
  };

  const handleAdjustCarProgress = async (
    participantId: string,
    progress: number
  ) => {
    if (!session) return;
    const res = await fetch(`/api/trips/${session.code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_location",
        participantId,
        routeProgress: progress,
      }),
    });
    const data = await res.json();
    if (res.ok && data.session) {
      setSession(data.session);
      broadcastSession(data.session);
    }
  };

  const handleSetConvoySpread = async (
    spreadMode: "close" | "medium" | "far" | "overtake"
  ) => {
    if (!session) return;
    const res = await fetch(`/api/trips/${session.code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_convoy_spread",
        spreadMode,
        viewerId: currentUserId,
      }),
    });
    const data = await res.json();
    if (res.ok && data.session) {
      setSession(data.session);
      broadcastSession(data.session);
      const labels = {
        close: "All Cars Close Together — Map Auto-Zoomed IN!",
        medium: "Moderate Highway Spacing",
        far: "All Cars Far Apart — Map Auto-Zoomed OUT to fit everyone!",
        overtake: "Positions Swapped — Trailing friends overtook!",
      };
      showToast(labels[spreadMode]);
    }
  };

  const handleCopyCode = (codeToCopy: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(codeToCopy);
      setCopiedCode(true);
      showToast(`Copied Unique Group Code: ${codeToCopy}`);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-emerald-500/8 blur-[140px]" />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-emerald-400/40 text-emerald-200 text-xs font-bold shadow-2xl"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Mobile-Safe Top Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div
            onClick={() => setScreen("welcome")}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0">
              <Navigation className="w-4 h-4 fill-current" />
            </div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
              Convoy<span className="text-emerald-400">Sync</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {screen !== "ooty-demo-steps" && (
              <button
                onClick={() => setScreen("ooty-demo-steps")}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="sm:hidden">Ooty Demo</span>
                <span className="hidden sm:inline">
                  Instant Ooty Demo (How It Works)
                </span>
              </button>
            )}
            {screen !== "welcome" && (
              <button
                onClick={() => setScreen("welcome")}
                className="hidden sm:flex px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-colors items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Back to Home</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {/* ========================================================= */}
          {/* CLEAN, SIMPLE, CENTERED WELCOME SCREEN                    */}
          {/* ========================================================= */}
          {screen === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-2xl mx-auto text-center space-y-6 sm:space-y-8 py-2 sm:py-6"
            >
              <div className="space-y-3.5 sm:space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] sm:text-xs font-medium">
                  <Car className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Multi-Car Road Trip Tracker • 2 to 10+ Cars</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Drive Together,{" "}
                  <span className="text-emerald-400">
                    Even in Different Cars.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed px-1">
                  Track every friend&apos;s live car location, see who is{" "}
                  <strong className="text-slate-200">ahead or behind you</strong>{" "}
                  and by what distance, with an automatic map that zooms in when
                  your cars are close and zooms out when far apart.
                </p>
              </div>

              {/* Clean Core Prompt Box */}
              <div className="rounded-3xl border border-white/15 bg-slate-900/80 p-5 sm:p-8 shadow-2xl text-left space-y-5 sm:space-y-6">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-extrabold text-white leading-snug">
                      Do you want to start your travel with friends and family?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Choose whether you are creating a new trip code or joining
                      your friends with an existing code.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {/* Friend A: Start Travel */}
                  <button
                    onClick={() => {
                      setErrorMsg(null);
                      setScreen("create-wizard");
                    }}
                    className="group p-4 sm:p-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-left transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
                  >
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider opacity-80 mb-1.5">
                      <span>Friend A • Create Group</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                    <div className="text-base sm:text-lg font-black">
                      Yes, Start Travel
                    </div>
                    <p className="text-xs font-semibold text-slate-900/80 mt-1">
                      Give location consent, set sharing hours &amp; generate a
                      random unique group code.
                    </p>
                  </button>

                  {/* Friend B, C, D...: Join Group Travel */}
                  <button
                    onClick={() => {
                      setErrorMsg(null);
                      setJoinCodeInput(recentCreatedCode || DEFAULT_DEMO_CODE);
                      setScreen("join-wizard");
                    }}
                    className="group p-4 sm:p-5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-white/15 text-white text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                      <span>Friends B, C, D... • Join</span>
                      <KeyRound className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="text-base sm:text-lg font-black">
                      Start Group Travel
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the unique code from Friend A, give consent &amp; join
                      the convoy map.
                    </p>
                  </button>
                </div>

                {/* Simple Bottom Link to Step-by-Step Ooty Demo */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-xs text-slate-400">
                    Want to see how 4 friends travel to Ooty step by step?
                  </span>
                  <button
                    onClick={() => setScreen("ooty-demo-steps")}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>View Step-by-Step Instant Ooty Demo →</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* INSTANT OOTY DEMO: STEP-BY-STEP WALKTHROUGH + PREVIEW     */}
          {/* ========================================================= */}
          {screen === "ooty-demo-steps" && (
            <motion.div
              key="ooty-demo-steps"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <OotyDemoWalkthrough
                onLaunchFullDemo={handleLaunchFullOotyDemo}
                onBackHome={() => setScreen("welcome")}
              />
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* FRIEND A — CREATE GROUP TRAVEL WIZARD                     */}
          {/* ========================================================= */}
          {screen === "create-wizard" && (
            <motion.div
              key="create-wizard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-xl mx-auto space-y-4"
            >
              {/* Back Button to Home Page */}
              <div>
                <button
                  onClick={() => setScreen("welcome")}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Back to Home Page</span>
                </button>
              </div>

              <div className="rounded-3xl border border-white/15 bg-slate-900/85 p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Friend A • Create Group Travel
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    Start Travel With Friends &amp; Family
                  </h2>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCreateTrip} className="space-y-4 sm:space-y-5">
                  {/* Step 1: Location Consent */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>1. Location Access Consent</span>
                      </span>
                      {consentGranted && (
                        <span className="text-xs font-bold text-emerald-400 shrink-0">
                          ✓ Granted
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRequestLocationConsent}
                        className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          consentGranted
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                            : "bg-emerald-500 text-slate-950"
                        }`}
                      >
                        <LocateFixed className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {gpsStatus === "requesting"
                            ? "Requesting..."
                            : consentGranted
                            ? "Location Access Granted"
                            : "Allow Location Access"}
                        </span>
                      </button>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentGranted}
                          onChange={(e) => setConsentGranted(e.target.checked)}
                          className="rounded accent-emerald-500 w-4 h-4 shrink-0"
                        />
                        <span>I consent to share my live location</span>
                      </label>
                    </div>
                  </div>

                  {/* Step 2: Sharing Time Limit */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>2. Time Limit for Sharing</span>
                      </span>
                      <span className="text-xs font-bold text-cyan-300 shrink-0">
                        {shareDurationHours} {shareDurationHours === 1 ? "Hour" : "Hours"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SHARE_DURATION_OPTIONS.map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setShareDurationHours(hrs)}
                          className={`flex-1 min-w-[54px] py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            shareDurationHours === hrs
                              ? "bg-cyan-500 text-slate-950 border-cyan-300"
                              : "bg-slate-900 text-slate-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {hrs}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Mandatory Trip Name & Mandatory Your Name */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-white mb-1.5">
                        3. Group Trip Name{" "}
                        <span className="text-rose-400">* (Mandatory)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        placeholder="e.g., Travel to Ooty"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white font-semibold text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {PRESET_CORRIDORS.slice(0, 4).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCorridorId(c.id);
                              setTripName(`Travel to ${c.name.split(" ")[0]}`);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                              selectedCorridorId === c.id
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                                : "bg-slate-900 border-white/10 text-slate-400"
                            }`}
                          >
                            {c.name.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          Your Name <span className="text-rose-400">* (Mandatory)</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={hostName}
                          onChange={(e) => setHostName(e.target.value)}
                          placeholder="e.g., Arjun"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Your Car
                        </label>
                        <input
                          type="text"
                          value={hostCarName}
                          onChange={(e) => setHostCarName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Generate Unique Random Group Code</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* UNIQUE CODE GENERATED SCREEN                              */}
          {/* ========================================================= */}
          {screen === "code-generated" && session && (
            <motion.div
              key="code-generated"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="max-w-lg mx-auto space-y-4"
            >
              {/* Back Button to Home Page */}
              <div>
                <button
                  onClick={() => setScreen("welcome")}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Back to Home Page</span>
                </button>
              </div>

              <div className="rounded-3xl border border-white/15 bg-slate-900/90 p-5 sm:p-8 shadow-2xl text-center space-y-5 sm:space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Group Created • Sharing for {shareDurationHours}h
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">
                    {session.tripName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    System generated a unique random group code (small letters &amp;
                    numbers). Share it with Friend B, C, D... to join:
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-400/50 space-y-3">
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-emerald-400 break-all">
                    {session.code}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopyCode(session.code)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          const url = `${window.location.origin}?join=${session.code}`;
                          navigator.clipboard?.writeText(url);
                          showToast("Copied Invite Link!");
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Invite Link</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => setScreen("dashboard")}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>
                      Open Live Convoy Map ({session.participants.length} Car Active)
                    </span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleAddAnotherFriendCar(false)}
                      className="py-2.5 px-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Simulate Friend{" "}
                        {String.fromCharCode(65 + session.participants.length)}{" "}
                        Joining
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setJoinCodeInput(session.code);
                        setScreen("join-wizard");
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Friend&apos;s Join Screen</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* FRIEND B, C, D... — JOIN GROUP TRAVEL WIZARD              */}
          {/* ========================================================== */}
          {screen === "join-wizard" && (
            <motion.div
              key="join-wizard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-xl mx-auto space-y-4"
            >
              {/* Back Button to Home Page */}
              <div>
                <button
                  onClick={() => setScreen("welcome")}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Back to Home Page</span>
                </button>
              </div>

              <div className="rounded-3xl border border-white/15 bg-slate-900/85 p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Join Group Travel • Supports Multiple Friends
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    Enter Unique Code From Friend A
                  </h2>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleJoinTrip} className="space-y-4 sm:space-y-5">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2.5">
                    <label className="block text-sm font-bold text-white">
                      1. Enter Unique Group Code (small letters &amp; numbers){" "}
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={joinCodeInput}
                      onChange={(e) =>
                        setJoinCodeInput(e.target.value.toLowerCase())
                      }
                      placeholder="e.g., k7m2x9p4"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-cyan-400/40 text-cyan-300 font-mono font-black text-lg tracking-widest lowercase focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>Quick Fill:</span>
                      {recentCreatedCode && (
                        <button
                          type="button"
                          onClick={() => setJoinCodeInput(recentCreatedCode)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold cursor-pointer"
                        >
                          {recentCreatedCode}
                        </button>
                      )}
                      {recentCreatedCode !== DEFAULT_DEMO_CODE && (
                        <button
                          type="button"
                          onClick={() => setJoinCodeInput(DEFAULT_DEMO_CODE)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 font-mono font-bold cursor-pointer"
                        >
                          {DEFAULT_DEMO_CODE}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>2. Location Access Consent</span>
                      </span>
                      {consentGranted && (
                        <span className="text-xs font-bold text-emerald-400 shrink-0">
                          ✓ Granted
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRequestLocationConsent}
                        className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          consentGranted
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                            : "bg-cyan-500 text-slate-950"
                        }`}
                      >
                        <LocateFixed className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {consentGranted
                            ? "Location Consent Active"
                            : "Give Location Consent"}
                        </span>
                      </button>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentGranted}
                          onChange={(e) => setConsentGranted(e.target.checked)}
                          className="rounded accent-cyan-500 w-4 h-4 shrink-0"
                        />
                        <span>I consent to share my car&apos;s location</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>3. Time Limit &amp; Details</span>
                      </span>
                      <span className="text-xs font-bold text-cyan-300 shrink-0">
                        {shareDurationHours}h
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {SHARE_DURATION_OPTIONS.map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setShareDurationHours(hrs)}
                          className={`flex-1 min-w-[54px] py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            shareDurationHours === hrs
                              ? "bg-cyan-500 text-slate-950 border-cyan-300"
                              : "bg-slate-900 text-slate-300 border-white/10"
                          }`}
                        >
                          {hrs}h
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          Your Name <span className="text-rose-400">* (Mandatory)</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g., Rohan"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Your Car Label
                        </label>
                        <input
                          type="text"
                          value={guestCarName}
                          onChange={(e) => setGuestCarName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Join Group Travel</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* CLEAN LIVE CONVOY DASHBOARD (MULTI-FRIEND SUPPORT)        */}
          {/* ========================================================= */}
          {screen === "dashboard" && session && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {/* Back Button to Home Page */}
              <div>
                <button
                  onClick={() => setScreen("welcome")}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>Back to Home Page</span>
                </button>
              </div>

              {/* Clean Responsive Trip Header */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                      <span>{session.participants.length} Cars in Group</span>
                      <span>•</span>
                      <span>1-Min Sync ({secondsUntilRefresh}s)</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                      {session.tripName}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 border border-white/10">
                    <span className="text-xs text-slate-400">Code:</span>
                    <span className="font-mono font-black text-sm sm:text-base text-emerald-400">
                      {session.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(session.code)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
                      title="Copy Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Equal 3-column grid on mobile, inline flex on desktop */}
                <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleAddAnotherFriendCar(false)}
                    className="justify-center px-2.5 sm:px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      + Friend{" "}
                      {String.fromCharCode(65 + session.participants.length)}
                    </span>
                  </button>

                  <button
                    onClick={() => refreshConvoyLocations(true)}
                    disabled={isRefreshing}
                    className="justify-center px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={() => setLiveCruiseActive((v) => !v)}
                    className={`justify-center px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      liveCruiseActive
                        ? "bg-amber-500 text-slate-950 border-amber-300"
                        : "bg-slate-950 text-slate-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>{liveCruiseActive ? "Drive: ON" : "Auto-Drive"}</span>
                  </button>
                </div>
              </div>

              {/* Clean Auto-Zoom & Formation Bar: 2x2 Grid on Mobile, Row on Desktop */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
                <span className="text-xs text-slate-400">
                  Test auto-zoom when cars are close vs. far (
                  {lastRefreshedTime ? `Synced ${lastRefreshedTime}` : "Live"}):
                </span>
                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSetConvoySpread("close")}
                    className="justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Close (Zoom IN)</span>
                  </button>
                  <button
                    onClick={() => handleSetConvoySpread("medium")}
                    className="justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Normal Spacing</span>
                  </button>
                  <button
                    onClick={() => handleSetConvoySpread("far")}
                    className="justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Far (Zoom OUT)</span>
                  </button>
                  <button
                    onClick={() => handleSetConvoySpread("overtake")}
                    className="justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Flip Lead</span>
                  </button>
                </div>
              </div>

              {/* Main 2-Column Layout: Upward Google Maps View + Multi-Friend Ahead/Behind List */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <ConvoyMap
                    participants={session.participants}
                    currentUserId={currentUserId}
                    destination={session.destination}
                    tripName={session.tripName}
                    selectedPeerId={selectedPeerId}
                    onSelectPeer={(id) => setSelectedPeerId(id)}
                  />
                </div>

                <div className="lg:col-span-5">
                  <ConvoyTelemetry
                    participants={session.participants}
                    currentUserId={currentUserId}
                    destination={session.destination}
                    onAdjustCarProgress={handleAdjustCarProgress}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
