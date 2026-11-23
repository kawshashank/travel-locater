"use client";

import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Flag,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  compareWithPeer,
  formatDistance,
  haversineDistanceKm,
  Participant,
  TripDestination,
} from "@/lib/geo";

interface ConvoyTelemetryProps {
  participants: Participant[];
  currentUserId: string;
  destination: TripDestination;
  onAdjustCarProgress: (participantId: string, progress: number) => void;
}

export default function ConvoyTelemetry({
  participants,
  currentUserId,
  destination,
  onAdjustCarProgress,
}: ConvoyTelemetryProps) {
  const now = Date.now();
  const me =
    participants.find((p) => p.id === currentUserId) || participants[0];

  const rankedCars = [...participants].sort((a, b) => {
    const da = haversineDistanceKm(a.lat, a.lng, destination.lat, destination.lng);
    const db = haversineDistanceKm(b.lat, b.lng, destination.lat, destination.lng);
    return da - db;
  });

  const myRank = me ? rankedCars.findIndex((p) => p.id === me.id) + 1 : 1;
  const myDistToDestKm = me
    ? haversineDistanceKm(me.lat, me.lng, destination.lat, destination.lng)
    : 0;

  const peerComparisons = participants
    .filter((p) => p.id !== me?.id)
    .map((peer) => compareWithPeer(me, peer, destination, now));

  const formatRemainingShareTime = (expiresAt: number) => {
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return "Expired";
    const totalMins = Math.ceil(diffMs / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 0) return `${hrs}h ${mins}m left`;
    return `${mins}m left`;
  };

  return (
    <div className="space-y-4">
      {/* 1. Fixed "YOU" Card */}
      {me && (
        <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/85 p-4 sm:p-5 space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Your Live Location ({formatRemainingShareTime(me.expiresAt)})</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 shrink-0">
              Position #{myRank} of {participants.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#1a73e8] flex items-center justify-center font-black text-xs text-white shadow shrink-0">
                YOU
              </div>
              <div className="min-w-0">
                <div className="text-base font-extrabold text-white truncate">
                  {me.name}
                </div>
                <div className="text-xs text-slate-400 truncate">{me.carName}</div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <span className="flex items-center gap-1.5 font-bold text-slate-200 whitespace-nowrap">
                <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {me.speedKmh} km/h
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-300 whitespace-nowrap">
                <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {formatDistance(myDistToDestKm)} to {destination.name.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Friends Ahead / Behind List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Friends in Convoy ({peerComparisons.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Relative to Your Car
          </span>
        </div>

        {peerComparisons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            Waiting for friends to join with your unique code, or click{" "}
            <strong className="text-emerald-400">&ldquo;+ Add Friend Car&rdquo;</strong> above!
          </div>
        ) : (
          peerComparisons.map((comp) => {
            const { peer } = comp;
            const isAhead = comp.aheadBehindStatus === "AHEAD";
            const isBehind = comp.aheadBehindStatus === "BEHIND";
            const peerRank = rankedCars.findIndex((r) => r.id === peer.id) + 1;

            return (
              <div
                key={peer.id}
                className="rounded-3xl border border-white/10 bg-slate-900/75 p-4 sm:p-5 space-y-3.5 transition-all hover:border-white/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-slate-950 shrink-0"
                      style={{ backgroundColor: peer.color }}
                    >
                      #{peerRank}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {peer.name}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate">{peer.carName}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-400 whitespace-nowrap">
                          <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                          {formatRemainingShareTime(peer.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clear Ahead / Behind Badge — Full Width on Mobile, Pill on Desktop */}
                  <div
                    className={`w-full sm:w-auto justify-center px-3.5 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-1.5 shrink-0 ${
                      isAhead
                        ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                        : isBehind
                        ? "bg-amber-500/15 border-amber-400/40 text-amber-300"
                        : "bg-cyan-500/15 border-cyan-400/40 text-cyan-300"
                    }`}
                  >
                    {isAhead ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isBehind ? (
                      <ArrowDownRight className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <span>
                      {comp.aheadBehindStatus === "ALONGSIDE"
                        ? "ALONGSIDE YOU"
                        : isAhead
                        ? `AHEAD OF YOU by ${formatDistance(
                            comp.aheadBehindDistanceKm
                          )}`
                        : `BEHIND YOU by ${formatDistance(
                            comp.aheadBehindDistanceKm
                          )}`}
                    </span>
                  </div>
                </div>

                {/* Simple 3-Column Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center sm:text-left">
                  <div className="px-2.5 py-2 rounded-xl bg-slate-950/60">
                    <div className="text-[10px] text-slate-400 truncate">
                      Distance
                    </div>
                    <div className="text-xs sm:text-sm font-black text-white mt-0.5">
                      {formatDistance(comp.directDistanceKm)}
                    </div>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-slate-950/60">
                    <div className="text-[10px] text-slate-400 truncate">
                      Time Gap
                    </div>
                    <div className="text-xs sm:text-sm font-black text-emerald-300 mt-0.5">
                      ~{comp.estimatedTimeGapMins} mins
                    </div>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-slate-950/60">
                    <div className="text-[10px] text-slate-400 truncate">
                      To {destination.name.split(" ")[0]}
                    </div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5">
                      {formatDistance(comp.peerDistanceToDestKm)}
                    </div>
                  </div>
                </div>

                {/* Subtle Slider to Test Moving Car */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    Move car:
                  </span>
                  <input
                    type="range"
                    min={0.06}
                    max={0.95}
                    step={0.005}
                    value={peer.routeProgress ?? 0.45}
                    onChange={(e) =>
                      onAdjustCarProgress(peer.id, parseFloat(e.target.value))
                    }
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
