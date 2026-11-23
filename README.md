# ConvoySync — Live Road-Trip Group Location & Ahead/Behind Tracker

A real-time road-trip convoy web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**, ready for one-click deployment on **Vercel**.

## Core Features

1. **Welcome & Onboarding Experience**:
   - Prompts users: *"Do you want to start your travel with friends and family?"*
   - Separate guided flows for **Friend A (Create Group Travel / Host)** and **Friend B (Start Group Travel / Join with Code)**.
2. **Explicit Location Consent & Time-Boxed Sharing**:
   - Users grant explicit location access consent (`navigator.geolocation` with seamless highway corridor fallback).
   - Configurable location-sharing duration limits (`1 Hr`, `2 Hrs`, `3 Hrs`, `4 Hrs`, `6 Hrs`, `8 Hrs`, `12 Hrs`) with live countdown and expiry tracking.
3. **Mandatory Trip Naming & Unique Convoy Code**:
   - Friend A names the group trip (e.g., *"Travel to Ooty"*) and receives a unique alphanumeric Convoy Code (e.g., `OOTY84` or `OOTY01`) + direct invite link (`?join=CODE`).
   - Friend B enters the unique code, gives location consent, sets their time limit, and joins the group map.
4. **Dynamic Auto-Scaling Convoy Radar Map**:
   - Automatically calculates the bounding box of all active cars in the group:
     - **Zooms In (`15x–16x`)** when cars are driving close together (`< 500m`).
     - **Zooms Out (`9x–11x`)** when cars are far apart (`20+ km`) so all friends fit in a single unified view.
5. **Ahead vs. Behind & Distance Telemetry**:
   - Displays exact direct distance and estimated road distance between you and every friend in the convoy.
   - Computes whether each friend is **AHEAD OF YOU** or **BEHIND YOU** along the trip route (and by how many kilometers/meters and estimated minutes).
6. **1-Minute Auto-Refresh Cycle**:
   - Automatically refreshes convoy GPS coordinates every **60 seconds (1 minute)** with a visual countdown ring, manual **Sync Now**, and an interactive **Live Drive Simulator**.

## Deploying to Vercel

```bash
npm install
npm run build
npx vercel --prod
```
