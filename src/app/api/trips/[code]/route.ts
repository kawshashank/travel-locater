import { NextRequest, NextResponse } from "next/server";
import {
  CAR_PALETTE,
  interpolateAlongWaypoints,
  Participant,
} from "@/lib/geo";
import {
  createSeedOotyTrip,
  DEMO_TRIP_CODE,
  getTripByCode,
  saveTripSession,
} from "@/lib/tripStore";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const session = getTripByCode(code);

  if (!session) {
    return NextResponse.json(
      { error: `No active group travel found with code "${code.toLowerCase()}".` },
      { status: 404 }
    );
  }

  return NextResponse.json({ session });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    let session = getTripByCode(code);

    if (!session) {
      return NextResponse.json(
        { error: `No active group travel found with code "${code.toLowerCase()}".` },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action } = body;
    const now = Date.now();

    if (action === "reset_demo" && code.toLowerCase() === DEMO_TRIP_CODE) {
      session = createSeedOotyTrip();
      saveTripSession(session);
      return NextResponse.json({ session });
    }

    if (action === "join") {
      const {
        name,
        carName,
        shareDurationHours,
        consentGranted,
        lat,
        lng,
        speedKmh,
        heading,
      } = body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Your name is mandatory to join group travel." },
          { status: 400 }
        );
      }

      if (!consentGranted) {
        return NextResponse.json(
          { error: "Location access consent is required to join group travel." },
          { status: 400 }
        );
      }

      const idx = session.participants.length;
      const colorObj = CAR_PALETTE[idx % CAR_PALETTE.length];

      const host = session.participants[0];
      const baseProgress = host?.routeProgress ?? 0.55;
      const offset = idx % 2 === 1 ? -0.09 * Math.ceil(idx / 2) : 0.08 * Math.ceil(idx / 2);
      const joinProgress = Math.max(0.08, Math.min(0.92, baseProgress + offset));
      const routePos = interpolateAlongWaypoints(
        session.destination.waypoints,
        joinProgress
      );

      let finalLat = typeof lat === "number" ? lat : routePos.lat;
      let finalLng = typeof lng === "number" ? lng : routePos.lng;
      if (
        host &&
        Math.abs(finalLat - host.lat) < 0.0002 &&
        Math.abs(finalLng - host.lng) < 0.0002
      ) {
        finalLat = routePos.lat;
        finalLng = routePos.lng;
      }

      const duration = Number(shareDurationHours) || 3;
      const newParticipant: Participant = {
        id: `user-${Math.random().toString(36).slice(2, 9)}`,
        name: name.trim(),
        carName: (carName || `Car ${idx + 1} • ${colorObj.name}`).trim(),
        color: colorObj.hex,
        isHost: false,
        lat: finalLat,
        lng: finalLng,
        speedKmh: typeof speedKmh === "number" ? speedKmh : 56 + ((idx * 3) % 15),
        heading: typeof heading === "number" ? heading : routePos.heading,
        accuracyMeters: 10,
        consentGranted: true,
        consentTimestamp: now,
        shareDurationHours: duration,
        expiresAt: now + duration * 3600 * 1000,
        lastUpdated: now,
        statusMessage: `Near ${routePos.nearestWaypoint}`,
        routeProgress: joinProgress,
      };

      session.participants.push(newParticipant);
      saveTripSession(session);

      return NextResponse.json({
        session,
        participant: newParticipant,
      });
    }

    if (action === "update_location") {
      const {
        participantId,
        lat,
        lng,
        speedKmh,
        heading,
        statusMessage,
        routeProgress,
        advanceSimulation,
      } = body;

      if (advanceSimulation) {
        session.participants = session.participants.map((p, idx) => {
          const currentProg = p.routeProgress ?? Math.max(0.1, 0.65 - idx * 0.1);
          const speedFactor = (p.speedKmh || 60) / 3600;
          const nextProg = Math.min(0.95, currentProg + speedFactor * 0.45);
          const pos = interpolateAlongWaypoints(session.destination.waypoints, nextProg);
          return {
            ...p,
            lat: pos.lat,
            lng: pos.lng,
            heading: pos.heading,
            speedKmh: Math.max(45, Math.min(85, Math.round(p.speedKmh + (Math.random() * 6 - 3)))),
            lastUpdated: now,
            routeProgress: nextProg,
            statusMessage: `Near ${pos.nearestWaypoint}`,
          };
        });
      } else if (participantId) {
        session.participants = session.participants.map((p) => {
          if (p.id !== participantId) return p;
          let updatedLat = typeof lat === "number" ? lat : p.lat;
          let updatedLng = typeof lng === "number" ? lng : p.lng;
          let updatedHeading = typeof heading === "number" ? heading : p.heading;
          let updatedStatus = statusMessage || p.statusMessage;
          let updatedProgress = typeof routeProgress === "number" ? routeProgress : p.routeProgress;

          if (typeof routeProgress === "number") {
            const pos = interpolateAlongWaypoints(
              session.destination.waypoints,
              routeProgress
            );
            updatedLat = pos.lat;
            updatedLng = pos.lng;
            updatedHeading = pos.heading;
            updatedStatus = statusMessage || `Near ${pos.nearestWaypoint}`;
          }

          return {
            ...p,
            lat: updatedLat,
            lng: updatedLng,
            speedKmh: typeof speedKmh === "number" ? speedKmh : p.speedKmh,
            heading: updatedHeading,
            statusMessage: updatedStatus,
            routeProgress: updatedProgress,
            lastUpdated: now,
          };
        });
      }

      saveTripSession(session);
      return NextResponse.json({ session });
    }

    if (action === "set_convoy_spread") {
      const { spreadMode } = body;
      const baseProg = 0.62;

      session.participants = session.participants.map((p, idx) => {
        let prog = baseProg;
        if (spreadMode === "close") {
          prog = baseProg - idx * 0.004;
        } else if (spreadMode === "medium") {
          prog = baseProg - idx * 0.055;
        } else if (spreadMode === "far") {
          prog = 0.82 - idx * (0.68 / Math.max(1, session.participants.length - 1));
        } else if (spreadMode === "overtake") {
          const revIdx = session.participants.length - 1 - idx;
          prog = baseProg - revIdx * 0.06;
        }

        prog = Math.max(0.06, Math.min(0.94, prog));
        const pos = interpolateAlongWaypoints(session.destination.waypoints, prog);
        return {
          ...p,
          lat: pos.lat,
          lng: pos.lng,
          heading: pos.heading,
          routeProgress: prog,
          lastUpdated: now,
          statusMessage: `Near ${pos.nearestWaypoint}`,
        };
      });

      saveTripSession(session);
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
