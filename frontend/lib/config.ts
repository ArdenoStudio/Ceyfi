import { PRODUCTION_FRONTEND_URL } from "@/lib/urls";

/** Base URL of the live CEYFI application */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  PRODUCTION_FRONTEND_URL;
