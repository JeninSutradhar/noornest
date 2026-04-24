"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateProfileAction(formData: FormData) {
  const user = await requireUserOrRedirect("/account");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!name || phone.length < 8) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone },
  });

  revalidatePath("/account");
}

export async function createAddressAction(formData: FormData) {
  const user = await requireUserOrRedirect("/account/addresses");

  const isDefault = String(formData.get("isDefault") || "") === "on";
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  await prisma.address.create({
    data: {
      userId: user.id,
      type: (String(formData.get("type") || "HOME") as "HOME" | "OFFICE" | "OTHER"),
      fullName: String(formData.get("fullName") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim() || null,
      line1: String(formData.get("line1") || "").trim(),
      line2: String(formData.get("line2") || "").trim() || null,
      landmark: String(formData.get("landmark") || "").trim() || null,
      city: String(formData.get("city") || "").trim(),
      state: String(formData.get("state") || "").trim(),
      country: String(formData.get("country") || "").trim() || "India",
      postalCode: String(formData.get("postalCode") || "").trim(),
      isDefault,
    },
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  // Redirect back to wherever the user came from (e.g. /checkout)
  const next = String(formData.get("next") || "").trim();
  if (next && next.startsWith("/")) {
    redirect(next);
  }
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUserOrRedirect("/account/addresses");
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.address.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function setDefaultAddressAction(formData: FormData) {
  const user = await requireUserOrRedirect("/account/addresses");
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.updateMany({
      where: { id, userId: user.id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}
