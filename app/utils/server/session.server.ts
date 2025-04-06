import {
    createCookieSessionStorage,
} from "@remix-run/node"
import { redirect } from "@remix-run/react"

import mongoose from "mongoose";

import { UserModel } from "~/models/server/users.server";

type ActionData = {
  success: boolean;
  message: string;
};

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "user_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET || "default-secret-key"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

// Helper to get the user session
export async function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

// Get the logged in user if a session exists
export async function getLoggedInUser(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId) return null;

  try {
    const user = await UserModel.findById(userId);
    return user;
  } catch {
    return null;
  }
}

// Create a new user session
export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}
