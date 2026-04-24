import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const AUTH_COOKIE = "noornest_auth";

type AuthPayload = {
  userId: string;
  role: "ADMIN" | "CUSTOMER";
};

type PasswordResetPayload = {
  userId: string;
  purpose: "password-reset";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, "JWT_SECRET is not configured");
  return secret;
}

export function signAuthToken(payload: AuthPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30d" });
}

export function signPasswordResetToken(userId: string, passwordHash: string) {
  return jwt.sign(
    { userId, purpose: "password-reset" } satisfies PasswordResetPayload,
    `${getJwtSecret()}::${passwordHash}`,
    { expiresIn: "30m" },
  );
}

export function verifyPasswordResetToken(token: string, passwordHash: string) {
  try {
    const payload = jwt.verify(token, `${getJwtSecret()}::${passwordHash}`) as PasswordResetPayload;
    if (payload.purpose !== "password-reset") return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    return prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Unauthorized");
  if (!user.isActive) throw new ApiError(403, "Account is inactive");
  return user;
}

export async function requireUserOrRedirect(nextPath = "/account") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!user.isActive) {
    throw new ApiError(403, "Account is inactive");
  }
  return user;
}
