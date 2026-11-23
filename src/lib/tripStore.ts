import fs from "fs";
import path from "path";
import {
  CAR_PALETTE,
  interpolateAlongWaypoints,
  matchDestinationFromTripName,
  Participant,
  PRESET_CORRIDORS,
  TripSession,
} from "./geo";

const TMP_STORE_PATH = path.join("/tmp", "convoy-trips-store-v3.json");
export const DEMO_TRIP_CODE = "ooty24x7";

declare global {
  // eslint-disable-next-line no-var
  var __CONVOY_TRIPS_MAP_V3__: Record<string, TripSession> | undefined;
}

function getMemoryStore(): Record<string, TripSession> {
  if (!globalThis.__CONVOY_TRIPS_MAP_V3__) {
    let loaded: Record<string, TripSession> = {};
    try {
      if (fs.existsSync(TMP_STORE_PATH)) {
        const raw = fs.readFileSync(TMP_STORE_PATH, "utf-8");
        loaded = JSON.parse(raw);
      }
    } catch {
      loaded = {};
    }
    if (!loaded[DEMO_TRIP_CODE]) {
      loaded[DEMO_TRIP_CODE] = createSeedOotyTrip();
    }
    globalThis.__CONVOY_TRIPS_MAP_V3__ = loaded;
  }
  return globalThis.__CONVOY_TRIPS_MAP_V3__;
}

function persistStore(store: Record<string, TripSession>) {
  try {
    fs.writeFileSync(TMP_STORE_PATH, JSON.stringify(store), "utf-8");
  } catch {
    // Ignore read-only filesystem errors if any
  }
}

export function createSeedOotyTrip(): TripSession {
  const now = Date.now();
  const dest = PRESET_CORRIDORS[0]; // Ooty

  const seedSpecs = [
    {
      id: "friend-a-demo",
      name: "Friend A (Arjun)",
      carName: "Car 1 • Red Thar 4x4",
      color: CAR_PALETTE[0].hex,
      isHost: true,
      progress: 0.68,
      speedKmh: 62,
      shareHours: 4,
    },
    {
      id: "friend-b-demo",
      name: "Friend B (Rohan)",
      carName: "Car 2 • Cyan Creta SX",
      color: CAR_PALETTE[1].hex,
      isHost: false,
      progress: 0.56,
      speedKmh: 58,
      shareHours: 3,
    },
    {
      id: "friend-c-demo",
      name: "Friend C (Priya)",
      carName: "Car 3 • Amber Scorpio-N",
      color: CAR_PALETTE[2].hex,
      isHost: false,
      progress: 0.44,
      speedKmh: 65,
      shareHours: 3,
    },
    {
      id: "friend-d-demo",
      name: "Friend D (Karthik)",
      carName: "Car 4 • Rose Virtus GT",
      color: CAR_PALETTE[3].hex,
      isHost: false,
      progress: 0.31,
      speedKmh: 60,
      shareHours: 2,
    },
  ];

  const participants: Participant[] = seedSpecs.map((spec, i) => {
    const pos = interpolateAlongWaypoints(dest.waypoints, spec.progress);
    return {
      id: spec.id,
      name: spec.name,
      carName: spec.carName,
      color: spec.color,
      isHost: spec.isHost,
      lat: pos.lat,
      lng: pos.lng,
      speedKmh: spec.speedKmh,
      heading: pos.heading,
      accuracyMeters: 8 + i * 2,
      consentGranted: true,
      consentTimestamp: now - (20 - i * 3) * 60 * 1000,
      shareDurationHours: spec.shareHours,
      expiresAt: now + spec.shareHours * 3600 * 1000,
      lastUpdated: now,
      statusMessage: `Near ${pos.nearestWaypoint}`,
      routeProgress: spec.progress,
    };
  });

  return {
    code: DEMO_TRIP_CODE,
    tripName: "Travel to Ooty",
    createdAt: now - 20 * 60 * 1000,
    hostId: participants[0].id,
    destination: dest,
    refreshIntervalSeconds: 60,
    participants,
  };
}

/**
 * Generates a unique, random 8-character group code combining small letters (a-z) and numbers (0-9).
 */
export function generateUniqueCode(store: Record<string, TripSession>): string {
  const letters = "abcdefghjkmnpqrstuvwxyz"; // unambiguous lowercase letters
  const digits = "23456789"; // unambiguous digits
  const allChars = letters + digits;

  for (let attempt = 0; attempt < 50; attempt++) {
    const chars: string[] = [
      letters[Math.floor(Math.random() * letters.length)],
      digits[Math.floor(Math.random() * digits.length)],
      letters[Math.floor(Math.random() * letters.length)],
      digits[Math.floor(Math.random() * digits.length)],
    ];
    for (let i = 0; i < 4; i++) {
      chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }
    // Shuffle characters randomly
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const candidate = chars.join("");
    if (!store[candidate]) {
      return candidate;
    }
  }
  return `trv${Date.now().toString(36).toLowerCase().slice(-5)}`;
}

export function getTripByCode(code: string): TripSession | null {
  const store = getMemoryStore();
  const normalized = code.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return store[normalized] || null;
}

export function saveTripSession(session: TripSession): TripSession {
  const store = getMemoryStore();
  const normalized = session.code.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  session.code = normalized;
  store[normalized] = session;
  persistStore(store);
  return session;
}

export function createNewTripSession(params: {
  tripName: string;
  presetCorridorId?: string;
  hostName: string;
  carName: string;
  shareDurationHours: number;
  lat?: number;
  lng?: number;
  speedKmh?: number;
  heading?: number;
}): { session: TripSession; hostParticipant: Participant } {
  const store = getMemoryStore();
  const now = Date.now();
  const destination = matchDestinationFromTripName(params.tripName, params.presetCorridorId);
  const code = generateUniqueCode(store);

  const initialRouteProgress = 0.55;
  const routePos = interpolateAlongWaypoints(destination.waypoints, initialRouteProgress);

  const hostId = `user-${Math.random().toString(36).slice(2, 9)}`;
  const hostParticipant: Participant = {
    id: hostId,
    name: params.hostName.trim(),
    carName: params.carName.trim() || "Car 1 • Lead SUV",
    color: CAR_PALETTE[0].hex,
    isHost: true,
    lat: typeof params.lat === "number" ? params.lat : routePos.lat,
    lng: typeof params.lng === "number" ? params.lng : routePos.lng,
    speedKmh: typeof params.speedKmh === "number" ? params.speedKmh : 64,
    heading: typeof params.heading === "number" ? params.heading : routePos.heading,
    accuracyMeters: 9,
    consentGranted: true,
    consentTimestamp: now,
    shareDurationHours: params.shareDurationHours,
    expiresAt: now + params.shareDurationHours * 3600 * 1000,
    lastUpdated: now,
    statusMessage: `Near ${routePos.nearestWaypoint}`,
    routeProgress: initialRouteProgress,
  };

  const session: TripSession = {
    code,
    tripName: params.tripName.trim(),
    createdAt: now,
    hostId,
    destination,
    refreshIntervalSeconds: 60,
    participants: [hostParticipant],
  };

  store[code] = session;
  persistStore(store);
  return { session, hostParticipant };
}
