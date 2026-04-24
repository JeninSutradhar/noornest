import { prisma } from "@/lib/prisma";

function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export async function ensureInvoice(orderId: string) {
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  if (existing) return existing;

  for (let i = 0; i < 5; i += 1) {
    const invoiceNumber = generateInvoiceNumber();
    try {
      return await prisma.invoice.create({
        data: {
          orderId,
          invoiceNumber,
          generatedAt: new Date(),
        },
      });
    } catch {
      // Retry on unique conflict.
    }
  }
  throw new Error("Failed to create invoice");
}
