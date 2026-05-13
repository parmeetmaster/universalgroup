import * as admin from "firebase-admin";
import { readFileSync } from "node:fs";

let app: admin.app.App | null = null;
let initialized = false;

export function getFirebaseApp(): admin.app.App | null {
  if (initialized) return app;
  initialized = true;

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!saPath) {
    console.warn("[firebase] FIREBASE_SERVICE_ACCOUNT_PATH not set — FCM disabled");
    return null;
  }

  try {
    const raw = readFileSync(saPath, "utf8");
    const credential = admin.credential.cert(JSON.parse(raw));
    app = admin.initializeApp({ credential });
    console.log("[firebase] Admin initialized");
  } catch (e) {
    console.error(`[firebase] Failed to init from ${saPath}: ${(e as Error).message}`);
  }
  return app;
}

export function isFirebaseEnabled(): boolean {
  return !!getFirebaseApp();
}
