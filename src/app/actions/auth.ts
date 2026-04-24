"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api";
import {
  clearAuthCookie,
  setAuthCookie,
  signAuthToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeNext(nextValue: FormDataEntryValue | null, fallback: string) {
  const nextPath = String(nextValue || "").trim();
  if (!nextPath.startsWith("/")) return fallback;
  return nextPath;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = normalizeNext(formData.get("next"), "/account");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required")}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    redirect(`/login?error=${encodeURIComponent("Invalid credentials")}`);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    redirect(`/login?error=${encodeURIComponent("Invalid credentials")}`);
  }
  if (!user.isActive) {
    throw new ApiError(403, "Account is inactive");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  const token = signAuthToken({ userId: user.id, role: user.role });
  await setAuthCookie(token);
  redirect(nextPath);
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name || !email || !phone || password.length < 6) {
    redirect(`/register?error=${encodeURIComponent("Fill all fields correctly")}`);
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { id: true },
  });
  if (exists) {
    redirect(`/register?error=${encodeURIComponent("Email or phone already registered")}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "CUSTOMER",
    },
    select: { id: true, role: true },
  });

  const token = signAuthToken({ userId: user.id, role: user.role });
  await setAuthCookie(token);
  redirect("/account");
}

export async function logoutAction() {
  await clearAuthCookie();
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent("Please enter a valid email")}`);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (user?.passwordHash) {
    const token = signPasswordResetToken(user.id, user.passwordHash);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    // Replace with email provider integration later (SendGrid/Resend/SES).
    console.info(`[NoorNest] Password reset link for ${email}: ${resetUrl}`);
  }

  redirect(`/forgot-password?sent=1`);
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) {
    redirect(`/forgot-password?error=${encodeURIComponent("Invalid reset token")}`);
  }
  if (password.length < 6) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Password must be at least 6 characters")}`);
  }
  if (password !== confirmPassword) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Passwords do not match")}`);
  }

  const users = await prisma.user.findMany({
    where: { isActive: true, passwordHash: { not: null } },
    select: { id: true, passwordHash: true },
  });

  const matched = users.find((entry) => verifyPasswordResetToken(token, entry.passwordHash || "") === entry.id);
  if (!matched) {
    redirect(`/forgot-password?error=${encodeURIComponent("Reset link is invalid or expired")}`);
  }

  const newHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: matched.id },
    data: { passwordHash: newHash },
  });
  await clearAuthCookie();
  redirect(`/login?message=${encodeURIComponent("Password reset successful. Please login.")}`);
}
