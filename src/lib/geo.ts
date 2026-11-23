export interface Participant {
  id: string;
  name: string;
  carName: string;
  color: string;
  isHost: boolean;
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  accuracyMeters: number;
  consentGranted: boolean;
  consentTimestamp: number;
  shareDurationHours: number;
  expiresAt: number;
  lastUpdated: number;
  statusMessage: string;
  isSimulated?: boolean;
  routeProgress?: number; // 0 to 1 for simulation along route
}

export interface Waypoint {
  lat: number;
  lng: number;
  label: string;
}

export interface TripDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  originName: string;
  originLat: number;
  originLng: number;
  highwayCode: string;
  waypoints: Waypoint[];
}

export interface TripSession {
  code: string;
  tripName: string;
  createdAt: number;
  hostId: string;
  destination: TripDestination;
  refreshIntervalSeconds: number;
  participants: Participant[];
}

export interface PeerComparison {
  peer: Participant;
  directDistanceKm: number;
  roadDistanceKm: number;
  aheadBehindStatus: "AHEAD" | "BEHIND" | "ALONGSIDE";
  aheadBehindDistanceKm: number;
  myDistanceToDestKm: number;
  peerDistanceToDestKm: number;
  estimatedTimeGapMins: number;
  bearingDegrees: number;
  cardinalDirection: string;
  isExpired: boolean;
}

export const CAR_PALETTE = [
  { name: "Emerald GT", hex: "#10b981", bg: "rgba(16, 185, 129, 0.18)", border: "#34d399" },
  { name: "Cyan Interceptor", hex: "#06b6d4", bg: "rgba(6, 182, 212, 0.18)", border: "#22d3ee" },
  { name: "Amber Trailblazer", hex: "#f59e0b", bg: "rgba(245, 158, 11, 0.18)", border: "#fbbf24" },
  { name: "Rose Roadster", hex: "#f43f5e", bg: "rgba(244, 63, 94, 0.18)", border: "#fb7185" },
  { name: "Violet Cruiser", hex: "#8b5cf6", bg: "rgba(139, 92, 246, 0.18)", border: "#a78bfa" },
  { name: "Lime Tourer", hex: "#84cc16", bg: "rgba(132, 204, 22, 0.18)", border: "#a3e635" },
];

export const PRESET_CORRIDORS: TripDestination[] = [
  {
    id: "ooty",
    name: "Ooty (Nilgiri Hills)",
    lat: 11.4102,
    lng: 76.6950,
    originName: "Bengaluru / Mysuru Expressway",
    originLat: 12.3052,
    originLng: 76.6552,
    highwayCode: "NH-275 / NH-181",
    waypoints: [
      { lat: 12.3052, lng: 76.6552, label: "Mysuru Ring Road" },
      { lat: 12.1200, lng: 76.6800, label: "Nanjangud Highway" },
      { lat: 11.8080, lng: 76.6915, label: "Gundlupet Checkpost" },
      { lat: 11.6664, lng: 76.6292, label: "Bandipur Tiger Reserve" },
      { lat: 11.5734, lng: 76.6421, label: "Masinagudi Ghats" },
      { lat: 11.4910, lng: 76.6690, label: "Kalhatti 36 Hairpin Bends" },
      { lat: 11.4102, lng: 76.6950, label: "Ooty Charing Cross" },
    ],
  },
  {
    id: "coorg",
    name: "Coorg (Madikeri)",
    lat: 12.4244,
    lng: 75.7382,
    originName: "Bengaluru-Mysuru Corridor",
    originLat: 12.3375,
    originLng: 76.6187,
    highwayCode: "NH-275",
    waypoints: [
      { lat: 12.3375, lng: 76.6187, label: "Ilavala Junction" },
      { lat: 12.3081, lng: 76.2886, label: "Hunsur Bypass" },
      { lat: 12.3398, lng: 76.0715, label: "Periyapatna" },
      { lat: 12.4581, lng: 75.9612, label: "Kushalnagar" },
      { lat: 12.4244, lng: 75.7382, label: "Madikeri (Coorg)" },
    ],
  },
  {
    id: "goa",
    name: "Goa (Panjim Coastal)",
    lat: 15.4909,
    lng: 73.8278,
    originName: "Hubballi-Dharwad Highway",
    originLat: 15.4589,
    originLng: 75.0078,
    highwayCode: "NH-66 / NH-748",
    waypoints: [
      { lat: 15.4589, lng: 75.0078, label: "Dharwad Toll Plaza" },
      { lat: 15.4240, lng: 74.5210, label: "Anmod Ghat" },
      { lat: 15.3991, lng: 74.2120, label: "Mollem Checkpost" },
      { lat: 15.4021, lng: 74.0124, label: "Ponda Highway" },
      { lat: 15.4909, lng: 73.8278, label: "Panjim Bridge (Goa)" },
    ],
  },
  {
    id: "manali",
    name: "Manali (Himalayan Expressway)",
    lat: 32.2432,
    lng: 77.1892,
    originName: "Mandi-Kullu Valley",
    originLat: 31.7087,
    originLng: 76.9320,
    highwayCode: "NH-3",
    waypoints: [
      { lat: 31.7087, lng: 76.9320, label: "Mandi Highway" },
      { lat: 31.7350, lng: 77.1150, label: "Aut Tunnel" },
      { lat: 31.8760, lng: 77.1520, label: "Bhuntar / Kullu" },
      { lat: 32.1100, lng: 77.1680, label: "Naggar Castle Turn" },
      { lat: 32.2432, lng: 77.1892, label: "Manali Mall Road" },
    ],
  },
  {
    id: "lonavala",
    name: "Lonavala & Mahabaleshwar",
    lat: 18.7557,
    lng: 73.4091,
    originName: "Mumbai-Pune Expressway",
    originLat: 19.0330,
    originLng: 73.0297,
    highwayCode: "NH-48",
    waypoints: [
      { lat: 19.0330, lng: 73.0297, label: "Kalamboli Entry" },
      { lat: 18.8920, lng: 73.1780, label: "Khalapur Toll Plaza" },
      { lat: 18.7800, lng: 73.3380, label: "Khandala Ghat" },
      { lat: 18.7557, lng: 73.4091, label: "Lonavala Exit" },
    ],
  },
  {
    id: "pondicherry",
    name: "Pondicherry (ECR Coastal Drive)",
    lat: 11.9416,
    lng: 79.8083,
    originName: "Chennai East Coast Road",
    originLat: 12.8230,
    originLng: 80.2440,
    highwayCode: "ECR / NH-332A",
    waypoints: [
      { lat: 12.8230, lng: 80.2440, label: "Kovalam Toll" },
      { lat: 12.6208, lng: 80.1945, label: "Mahabalipuram" },
      { lat: 12.2620, lng: 79.9850, label: "Marakkanam Salt Pans" },
      { lat: 11.9416, lng: 79.8083, label: "Pondicherry Promenade" },
    ],
  },
];

export function matchDestinationFromTripName(tripName: string, presetId?: string): TripDestination {
  if (presetId) {
    const found = PRESET_CORRIDORS.find((c) => c.id === presetId);
    if (found) return found;
  }
  const lower = tripName.toLowerCase();
  for (const corridor of PRESET_CORRIDORS) {
    if (lower.includes(corridor.id) || lower.includes(corridor.name.toLowerCase().split(" ")[0])) {
      return corridor;
    }
  }
  // Default to the iconic Ooty corridor while preserving custom destination naming if provided
  const extractedPlace = tripName
    .replace(/^(travel|trip|drive|road\s*trip|convoy)\s+(to|towards|for)\s+/i, "")
    .trim();
  const baseOoty = PRESET_CORRIDORS[0];
  if (extractedPlace && extractedPlace.toLowerCase() !== "ooty") {
    return {
      ...baseOoty,
      name: extractedPlace,
    };
  }
  return baseOoty;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371;

/**
 * Exact Haversine distance between two coordinates in kilometers
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates initial compass bearing (0-360°) from point 1 to point 2
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const phi1 = lat1 * DEG_TO_RAD;
  const phi2 = lat2 * DEG_TO_RAD;
  const deltaLambda = (lng2 - lng1) * DEG_TO_RAD;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return (theta * RAD_TO_DEG + 360) % 360;
}

export function bearingToCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * Interpolates a coordinate along a destination's waypoints for a given progress (0.0 -> 1.0)
 */
export function interpolateAlongWaypoints(
  waypoints: Waypoint[],
  progress: number
): { lat: number; lng: number; heading: number; nearestWaypoint: string } {
  const clamped = Math.max(0.02, Math.min(0.98, progress));
  if (!waypoints || waypoints.length === 0) {
    return { lat: 11.6664, lng: 76.6292, heading: 180, nearestWaypoint: "Highway" };
  }
  if (waypoints.length === 1) {
    return {
      lat: waypoints[0].lat,
      lng: waypoints[0].lng,
      heading: 0,
      nearestWaypoint: waypoints[0].label,
    };
  }

  // Compute segment lengths
  const segLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const len = haversineDistanceKm(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
    segLengths.push(len);
    totalLength += len;
  }

  const targetDist = clamped * totalLength;
  let accum = 0;
  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (accum + segLen >= targetDist || i === segLengths.length - 1) {
      const segProgress = segLen > 0 ? (targetDist - accum) / segLen : 0;
      const w1 = waypoints[i];
      const w2 = waypoints[i + 1];
      const lat = w1.lat + (w2.lat - w1.lat) * segProgress;
      const lng = w1.lng + (w2.lng - w1.lng) * segProgress;
      const heading = calculateBearing(w1.lat, w1.lng, w2.lat, w2.lng);
      const nearestWaypoint = segProgress < 0.5 ? w1.label : w2.label;
      return { lat, lng, heading, nearestWaypoint };
    }
    accum += segLen;
  }

  const last = waypoints[waypoints.length - 1];
  return { lat: last.lat, lng: last.lng, heading: 0, nearestWaypoint: last.label };
}

/**
 * Computes comprehensive relative telemetry between "me" (current viewer) and a peer car
 */
export function compareWithPeer(
  me: Participant,
  peer: Participant,
  destination: TripDestination,
  now: number = Date.now()
): PeerComparison {
  const directDistanceKm = haversineDistanceKm(me.lat, me.lng, peer.lat, peer.lng);
  const roadDistanceKm = directDistanceKm * 1.16; // Realistic highway winding multiplier

  const myDistanceToDestKm = haversineDistanceKm(
    me.lat,
    me.lng,
    destination.lat,
    destination.lng
  );
  const peerDistanceToDestKm = haversineDistanceKm(
    peer.lat,
    peer.lng,
    destination.lat,
    destination.lng
  );

  // Positive means peer is closer to the destination than me -> PEER IS AHEAD OF ME
  // Negative means peer is further from the destination than me -> PEER IS BEHIND ME
  const rawAheadDeltaKm = myDistanceToDestKm - peerDistanceToDestKm;
  const thresholdKm = 0.04; // 40 meters threshold for neck-and-neck

  let aheadBehindStatus: "AHEAD" | "BEHIND" | "ALONGSIDE" = "ALONGSIDE";
  if (rawAheadDeltaKm > thresholdKm) {
    aheadBehindStatus = "AHEAD";
  } else if (rawAheadDeltaKm < -thresholdKm) {
    aheadBehindStatus = "BEHIND";
  }

  const aheadBehindDistanceKm = Math.abs(rawAheadDeltaKm);
  const effectiveSpeedKmh = Math.max(35, me.speedKmh || 55);
  const estimatedTimeGapMins = Math.max(
    1,
    Math.round((aheadBehindDistanceKm / effectiveSpeedKmh) * 60)
  );

  const bearingDegrees = calculateBearing(me.lat, me.lng, peer.lat, peer.lng);
  const cardinalDirection = bearingToCardinal(bearingDegrees);

  return {
    peer,
    directDistanceKm,
    roadDistanceKm,
    aheadBehindStatus,
    aheadBehindDistanceKm,
    myDistanceToDestKm,
    peerDistanceToDestKm,
    estimatedTimeGapMins,
    bearingDegrees,
    cardinalDirection,
    isExpired: peer.expiresAt < now,
  };
}

/**
 * Formats distance cleanly in meters (< 1 km) or kilometers (>= 1 km)
 */
export function formatDistance(km: number): string {
  if (km < 0.01) return "< 10 m";
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(2)} km`;
}

/**
 * Computes auto-fit bounding box, convoy spread, and dynamic zoom level
 */
export function calculateConvoyViewport(
  participants: Participant[],
  destination?: TripDestination,
  includeDestination: boolean = false
): {
  centerLat: number;
  centerLng: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  maxSpreadKm: number;
  autoZoomLevel: number;
  scaleDescription: string;
} {
  const points: Array<{ lat: number; lng: number }> = participants.map((p) => ({
    lat: p.lat,
    lng: p.lng,
  }));

  if (includeDestination && destination) {
    points.push({ lat: destination.lat, lng: destination.lng });
  }

  if (points.length === 0) {
    return {
      centerLat: 11.6664,
      centerLng: 76.6292,
      minLat: 11.55,
      maxLat: 11.75,
      minLng: 76.55,
      maxLng: 76.75,
      maxSpreadKm: 10,
      autoZoomLevel: 12,
      scaleDescription: "Standard Highway View",
    };
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const pt of points) {
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lat > maxLat) maxLat = pt.lat;
    if (pt.lng < minLng) minLng = pt.lng;
    if (pt.lng > maxLng) maxLng = pt.lng;
  }

  // Max pairwise distance among active cars
  let maxSpreadKm = 0;
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const d = haversineDistanceKm(
        participants[i].lat,
        participants[i].lng,
        participants[j].lat,
        participants[j].lng
      );
      if (d > maxSpreadKm) maxSpreadKm = d;
    }
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const diagKm = haversineDistanceKm(minLat, minLng, maxLat, maxLng);

  let autoZoomLevel = 15.5;
  let scaleDescription = "Ultra-Close Convoy Lock (< 500m)";

  if (diagKm < 0.4) {
    autoZoomLevel = 16.2;
    scaleDescription = "Bumper-to-Bumper Zoom (< 400m)";
  } else if (diagKm < 1.5) {
    autoZoomLevel = 14.8;
    scaleDescription = "Tight Convoy Zoom (Street Scale)";
  } else if (diagKm < 5) {
    autoZoomLevel = 13.4;
    scaleDescription = "Close Highway Formation";
  } else if (diagKm < 15) {
    autoZoomLevel = 11.8;
    scaleDescription = "Medium Highway Sector";
  } else if (diagKm < 40) {
    autoZoomLevel = 10.4;
    scaleDescription = "Wide Corridor Fit";
  } else {
    autoZoomLevel = 9.1;
    scaleDescription = "Regional Overview Fit";
  }

  return {
    centerLat,
    centerLng,
    minLat,
    maxLat,
    minLng,
    maxLng,
    maxSpreadKm,
    autoZoomLevel,
    scaleDescription,
  };
}
