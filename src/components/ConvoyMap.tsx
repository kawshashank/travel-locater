"use client";

import React, { useMemo, useState } from "react";
import {
  Flag,
  LocateFixed,
  Maximize2,
  Navigation,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  calculateConvoyViewport,
  compareWithPeer,
  formatDistance,
  haversineDistanceKm,
  Participant,
  TripDestination,
} from "@/lib/geo";

interface ConvoyMapProps {
  participants: Participant[];
  currentUserId: string;
  destination: TripDestination;
  tripName: string;
  selectedPeerId: string | null;
  onSelectPeer: (id: string) => void;
}

export default function ConvoyMap({
  participants,
  currentUserId,
  destination,
  tripName,
  selectedPeerId,
  onSelectPeer,
}: ConvoyMapProps) {
  const [viewMode, setViewMode] = useState<"auto-cars" | "full-route" | "focus-me">(
    "auto-cars"
  );
  const [manualZoomOffset, setManualZoomOffset] = useState<number>(0);

  const me = useMemo(
    () =>
      participants.find((p) => p.id === currentUserId) || participants[0],
    [participants, currentUserId]
  );

  // Rank cars from closest to destination (#1 Lead Car) to furthest
  const rankedIds = useMemo(() => {
    const copy = [...participants];
    copy.sort((a, b) => {
      const distA = haversineDistanceKm(a.lat, a.lng, destination.lat, destination.lng);
      const distB = haversineDistanceKm(b.lat, b.lng, destination.lat, destination.lng);
      return distA - distB;
    });
    return copy.map((p) => p.id);
  }, [participants, destination]);

  const viewport = useMemo(() => {
    if (viewMode === "focus-me" && me) {
      return calculateConvoyViewport([me], destination, false);
    }
    return calculateConvoyViewport(
      participants,
      destination,
      viewMode === "full-route"
    );
  }, [participants, destination, viewMode, me]);

  /**
   * Course-Up (Destination-Up) Projection inside a mobile-safe 640x540 coordinate system
   * so nothing is ever clipped horizontally on mobile viewports.
   */
  const projection = useMemo(() => {
    const W = 640;
    const H = 540;
    const centerX = W / 2; // 320

    const dLat = destination.lat - destination.originLat;
    const dLng = destination.lng - destination.originLng;
    const len = Math.hypot(dLat, dLng) || 1;
    const ux = dLat / len;
    const uy = dLng / len;
    const px = -uy;
    const py = ux;

    const toCourseSpace = (lat: number, lng: number) => {
      const relLat = lat - destination.originLat;
      const relLng = lng - destination.originLng;
      const forward = (relLat * ux + relLng * uy) / len;
      const lateral = (relLat * px + relLng * py) / len;
      return { forward, lateral };
    };

    const carCoursePts = participants.map((p) => toCourseSpace(p.lat, p.lng));

    let minF = Math.min(...carCoursePts.map((c) => c.forward));
    let maxF = Math.max(...carCoursePts.map((c) => c.forward));

    if (viewMode === "full-route") {
      minF = 0;
      maxF = 1.02;
    } else if (viewMode === "focus-me" && me) {
      const mePt = toCourseSpace(me.lat, me.lng);
      minF = mePt.forward - 0.08;
      maxF = mePt.forward + 0.08;
    }

    const rawSpan = Math.max(0.06, maxF - minF);
    const zoomMultiplier = Math.pow(0.74, manualZoomOffset);
    const effectiveSpan = Math.max(0.03, Math.min(1.15, rawSpan * 1.45 * zoomMultiplier));
    const centerF = (minF + maxF) / 2;

    const viewMinF = centerF - effectiveSpan / 2;
    const viewMaxF = centerF + effectiveSpan / 2;

    const padTop = 75;
    const padBottom = 55;
    const usableH = H - padTop - padBottom;

    const project = (lat: number, lng: number) => {
      const { forward, lateral } = toCourseSpace(lat, lng);
      const normF = (forward - viewMinF) / Math.max(0.0001, viewMaxF - viewMinF);
      const y = H - padBottom - normF * usableH;
      const curveScale = Math.min(900, 320 / Math.max(0.14, effectiveSpan));
      const x = centerX + lateral * curveScale;
      return { x: Math.max(210, Math.min(430, x)), y, forward };
    };

    const totalRouteKm = haversineDistanceKm(
      destination.originLat,
      destination.originLng,
      destination.lat,
      destination.lng
    );
    const scaleBarKm = Math.max(0.1, totalRouteKm * effectiveSpan * 0.18);

    return {
      project,
      scaleBarKm,
      effectiveZoom: Math.min(
        18,
        Math.max(7, viewport.autoZoomLevel + manualZoomOffset)
      ),
    };
  }, [destination, participants, viewMode, me, manualZoomOffset, viewport.autoZoomLevel]);

  const routePoints = useMemo(() => {
    return destination.waypoints.map((wp) => ({
      ...wp,
      ...projection.project(wp.lat, wp.lng),
    }));
  }, [destination.waypoints, projection]);

  const routePathD = useMemo(() => {
    if (routePoints.length === 0) return "";
    return routePoints
      .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(" ");
  }, [routePoints]);

  const destProjected = useMemo(
    () => projection.project(destination.lat, destination.lng),
    [destination, projection]
  );

  const projectedCars = useMemo(() => {
    return participants.map((p) => {
      const pt = projection.project(p.lat, p.lng);
      const rank = rankedIds.indexOf(p.id) + 1;
      const isMe = p.id === me?.id;
      const comparison = me && !isMe ? compareWithPeer(me, p, destination) : null;
      const shortName = p.name.includes("(")
        ? p.name.split("(")[1].replace(")", "").trim()
        : p.name;
      return {
        participant: p,
        shortName,
        x: pt.x,
        y: pt.y,
        rank,
        isMe,
        comparison,
      };
    });
  }, [participants, projection, rankedIds, me, destination]);

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-slate-300 bg-[#f1f3f4] shadow-xl select-none flex flex-col">
      {/* Dedicated Top Google Maps Navigation Bar (Never overlaps the map canvas on mobile!) */}
      <div className="bg-[#0d652d] text-white px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-black/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold tracking-wide flex items-center gap-1.5 flex-wrap">
              <span className="truncate">
                ↑ Towards {destination.name.split(" ")[0]}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono shrink-0">
                {destination.highwayCode}
              </span>
            </div>
            <div className="text-[11px] text-emerald-100 truncate">
              Auto-Zoom {projection.effectiveZoom.toFixed(1)}x • Spread:{" "}
              <strong>{formatDistance(viewport.maxSpreadKm)}</strong>
            </div>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => {
              setViewMode("auto-cars");
              setManualZoomOffset(0);
            }}
            className={`flex-1 sm:flex-initial justify-center px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              viewMode === "auto-cars"
                ? "bg-white text-[#0d652d] shadow"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            <Maximize2 className="w-3 h-3 shrink-0" />
            <span>Fit All ({participants.length})</span>
          </button>
          <button
            onClick={() => {
              setViewMode("full-route");
              setManualZoomOffset(0);
            }}
            className={`flex-1 sm:flex-initial justify-center px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              viewMode === "full-route"
                ? "bg-white text-[#0d652d] shadow"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            <Flag className="w-3 h-3 shrink-0" />
            <span>Full Route</span>
          </button>
          <button
            onClick={() => {
              setViewMode("focus-me");
              setManualZoomOffset(0);
            }}
            className={`flex-1 sm:flex-initial justify-center px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              viewMode === "focus-me"
                ? "bg-white text-[#0d652d] shadow"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            <LocateFixed className="w-3 h-3 shrink-0" />
            <span>My Car</span>
          </button>
        </div>
      </div>

      {/* GOOGLE MAPS DEFAULT DAYTIME NAVIGATION CANVAS */}
      <div className="relative w-full h-[420px] sm:h-[490px] bg-[#f1f3f4]">
        <svg
          viewBox="0 0 640 540"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          <defs>
            <filter id="gmapCardShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#0f172a"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          {/* Google Maps Default Land Tint */}
          <rect width="640" height="540" fill="#f1f3f4" />

          {/* Google Maps Green Forest / National Park Zones */}
          <ellipse cx="110" cy="160" rx="160" ry="130" fill="#d5eedb" opacity="0.85" />
          <ellipse cx="530" cy="130" rx="170" ry="140" fill="#ceead6" opacity="0.9" />
          <ellipse cx="520" cy="400" rx="150" ry="110" fill="#dcf2e1" opacity="0.8" />
          <ellipse cx="120" cy="430" rx="140" ry="100" fill="#e2f3e6" opacity="0.75" />

          {/* Google Maps Water Body Feature */}
          <path
            d="M 0 290 Q 140 270, 230 330 T 410 370 L 410 395 Q 240 360, 0 325 Z"
            fill="#a8c7fa"
            opacity="0.45"
          />

          {/* Google Maps Secondary Local Road Network */}
          <g stroke="#ffffff" strokeWidth="5" fill="none" opacity="0.9">
            <path d="M 20 110 Q 240 150, 620 100" />
            <path d="M 20 250 Q 310 220, 620 270" />
            <path d="M 20 410 Q 340 380, 620 430" />
            <path d="M 150 0 Q 170 270, 130 540" />
            <path d="M 490 0 Q 470 270, 510 540" />
          </g>

          {/* Main Highway Route — Google Maps Navigation Blue (#1a73e8 / #4285F4) */}
          {routePathD && (
            <g>
              <path
                d={routePathD}
                fill="none"
                stroke="#174ea6"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={routePathD}
                fill="none"
                stroke="#4285F4"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={routePathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 22"
                opacity="0.85"
              />
            </g>
          )}

          {/* Highway Town / Checkpoint Labels */}
          {routePoints.map((wp, idx) => {
            if (idx === routePoints.length - 1) return null;
            const onLeft = idx % 2 === 0;
            return (
              <g key={wp.label} transform={`translate(${wp.x}, ${wp.y})`}>
                <circle r={4} fill="#ffffff" stroke="#174ea6" strokeWidth="2" />
                <text
                  x={onLeft ? -12 : 12}
                  y={4}
                  textAnchor={onLeft ? "end" : "start"}
                  fill="#3c4043"
                  fontSize="11"
                  fontWeight="600"
                  stroke="#f1f3f4"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {wp.label}
                </text>
              </g>
            );
          })}

          {/* Google Maps Destination Red Pin at the TOP of the Map */}
          <g
            transform={`translate(${destProjected.x}, ${Math.max(
              52,
              Math.min(115, destProjected.y)
            )})`}
          >
            <g transform="translate(0, -32)" filter="url(#gmapCardShadow)">
              <rect
                x={-84}
                y={-14}
                width={168}
                height={26}
                rx={13}
                fill="#ffffff"
                stroke="#ea4335"
                strokeWidth="1.5"
              />
              <text
                x={0}
                y={3}
                textAnchor="middle"
                fill="#202124"
                fontSize="11"
                fontWeight="800"
              >
                📍 {destination.name}
              </text>
            </g>
            <path
              d="M 0 0 C -9 -12, -13 -18, -13 -24 A 13 13 0 1 1 13 -24 C 13 -18, 9 -12, 0 0 Z"
              fill="#ea4335"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cx="0" cy="-24" r="4.5" fill="#a50e0e" />
          </g>

          {/* Cars Moving UPWARDS Towards Destination */}
          {projectedCars.map((car) => {
            const { participant, shortName, x, y, rank, isMe, comparison } = car;
            const isSelected = selectedPeerId === participant.id;
            const placeRight = rank % 2 === 1;
            const cardOffsetX = placeRight ? 105 : -105;

            return (
              <g
                key={participant.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectPeer(participant.id)}
                className="cursor-pointer"
              >
                <line
                  x1={0}
                  y1={0}
                  x2={placeRight ? 24 : -24}
                  y2={0}
                  stroke={isMe ? "#1a73e8" : "#5f6368"}
                  strokeWidth="1.8"
                />

                <circle
                  r={isMe ? 22 : 16}
                  fill={isMe ? "#1a73e8" : participant.color}
                  opacity={isMe || isSelected ? "0.22" : "0.14"}
                />
                <circle
                  r={isMe ? 13 : 11}
                  fill={isMe ? "#1a73e8" : "#ffffff"}
                  stroke={isMe ? "#ffffff" : participant.color}
                  strokeWidth="3"
                  filter="url(#gmapCardShadow)"
                />
                <path
                  d="M 0 -5.5 L -4.5 4.5 L 0 2 L 4.5 4.5 Z"
                  fill={isMe ? "#ffffff" : participant.color}
                />

                {/* Google Maps Floating Callout Pill (Sized to fit inside 640px mobile viewBox) */}
                <g
                  transform={`translate(${cardOffsetX}, 0)`}
                  filter="url(#gmapCardShadow)"
                >
                  <rect
                    x={-78}
                    y={-19}
                    width={156}
                    height={38}
                    rx={11}
                    fill={isMe ? "#1a73e8" : "#ffffff"}
                    stroke={isMe ? "#174ea6" : "#dadce0"}
                    strokeWidth="1.5"
                  />
                  <text
                    x={0}
                    y={-3}
                    textAnchor="middle"
                    fill={isMe ? "#ffffff" : "#202124"}
                    fontSize="11"
                    fontWeight="800"
                  >
                    #{rank} {shortName} {isMe ? "(YOU)" : ""}
                  </text>
                  <text
                    x={0}
                    y={11}
                    textAnchor="middle"
                    fill={
                      isMe
                        ? "#e8f0fe"
                        : comparison?.aheadBehindStatus === "AHEAD"
                        ? "#137333"
                        : "#b06000"
                    }
                    fontSize="10"
                    fontWeight="700"
                  >
                    {isMe
                      ? `▲ ${participant.speedKmh} km/h • Moving Up`
                      : comparison?.aheadBehindStatus === "AHEAD"
                      ? `▲ Ahead ${formatDistance(comparison.aheadBehindDistanceKm)}`
                      : comparison?.aheadBehindStatus === "BEHIND"
                      ? `▼ Behind ${formatDistance(comparison.aheadBehindDistanceKm)}`
                      : "Alongside You"}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Bottom Scale Bar & Google Maps Zoom +/- Buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-white/95 shadow-md border border-slate-200 text-[11px] text-slate-700 font-medium truncate max-w-[76%]">
            Scale: <strong className="text-slate-900">{formatDistance(projection.scaleBarKm)}</strong> •{" "}
            <span className="hidden sm:inline">{tripName} • </span>↑ Upward View
          </div>

          <div className="pointer-events-auto flex flex-col rounded-xl bg-white shadow-lg border border-slate-200 overflow-hidden shrink-0">
            <button
              onClick={() => setManualZoomOffset((z) => Math.min(4, z + 1))}
              className="p-2 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-px w-full bg-slate-200" />
            <button
              onClick={() => setManualZoomOffset((z) => Math.max(-4, z - 1))}
              className="p-2 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
