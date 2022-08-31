export const IS_SERVER = typeof window === "undefined";
export const DEV = process.env.NODE_ENV !== "production";
export const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
export const REGION = process.env.NEXT_PUBLIC_REGION as string;
export const API_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/api`;
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
export const PLACE_HOLDER = "/assets/images/pwa.png";