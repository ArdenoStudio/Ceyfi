"use client";

// Persona switcher removed — single real user identity
export const CURRENT_USER = {
  id: "SEY-USR-001",
  name: "Nimal Fernando",
  accountNumber: "064000012548001",
  accountLabel: "VOXVERSE STUDIO",
  location: "Colombo, Sri Lanka",
  defaultRoute: "/wallet",
} as const;

export function useCurrentUser() {
  return {
    userId: CURRENT_USER.id,
    user: {
      id: CURRENT_USER.id,
      name: CURRENT_USER.name,
      location: CURRENT_USER.location,
      role: "demo",
      defaultRoute: CURRENT_USER.defaultRoute,
      personaCode: "P1" as const,
      shortBio: "Seylan Bank demo account",
    },
    switchUser: () => {},
    allUsers: [],
    mounted: true,
  };
}