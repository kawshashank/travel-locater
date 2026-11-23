import { NextRequest, NextResponse } from "next/server";
import { createNewTripSession } from "@/lib/tripStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tripName,
      presetCorridorId,
      hostName,
      carName,
      shareDurationHours,
      consentGranted,
      lat,
      lng,
      speedKmh,
      heading,
    } = body;

    if (!hostName || typeof hostName !== "string" || !hostName.trim()) {
      return NextResponse.json(
        { error: "Your name is mandatory to start travel." },
        { status: 400 }
      );
    }

    if (!tripName || typeof tripName !== "string" || !tripName.trim()) {
      return NextResponse.json(
        { error: "Trip name is mandatory (e.g., 'Travel to Ooty')." },
        { status: 400 }
      );
    }

    if (!consentGranted) {
      return NextResponse.json(
        { error: "Location sharing consent is required to start group travel." },
        { status: 400 }
      );
    }

    const duration = Number(shareDurationHours) || 3;
    const { session, hostParticipant } = createNewTripSession({
      tripName: tripName.trim(),
      presetCorridorId,
      hostName: hostName.trim(),
      carName: carName || "Car 1 • SUV",
      shareDurationHours: duration,
      lat,
      lng,
      speedKmh,
      heading,
    });

    return NextResponse.json({
      session,
      participant: hostParticipant,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
