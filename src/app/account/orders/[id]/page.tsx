import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, ExternalLink, Package, Truck } from "lucide-react";

import { ReviewSubmitForm } from "@/components/store/review-submit-form";
import { requireUserOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const timeline = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUserOrRedirect("/account/orders");
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true, shipment: true, invoice: true, shippingAddress: true, billingAddress: true },
  });
  if (!order) notFound();
  const productIds = order.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0A4D3C]">Order {order.orderNumber}</h1>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/api/account/orders/${order.id}/invoice`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg border border-[#0A4D3C]/20 bg-white px-3 py-2 text-sm text-[#0A4D3C] hover:bg-[#0A4D3C]/5"
        >
          <Download className="h-4 w-4" />
          Invoice Details
        </Link>
        {order.invoice?.invoiceUrl && (
          <Link
            href={order.invoice.invoiceUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-[#0A4D3C]/20 bg-white px-3 py-2 text-sm text-[#0A4D3C] hover:bg-[#0A4D3C]/5"
          >
            <ExternalLink className="h-4 w-4" />
            Download PDF
          </Link>
        )}
      </div>
      <div className="lux-card rounded-xl p-5">
        <p className="mb-3 font-medium text-[#0A4D3C]">Order Timeline</p>
        <div className="grid gap-2 md:grid-cols-5">
          {timeline.map((step) => (
            <div
              key={step}
              className={`rounded-md p-2 text-center text-xs ${
                timeline.indexOf(step) <= timeline.indexOf(order.orderStatus)
                  ? "bg-[#0A4D3C] text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="lux-card rounded-xl p-5">
        <p className="mb-3 flex items-center gap-2 font-medium text-[#0A4D3C]">
          <Package className="h-4 w-4" />
          Order Items
        </p>
        <div className="space-y-3">
          {order.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div key={item.id}>
                <div className="flex items-center justify-between rounded-lg border border-[#0A4D3C]/10 p-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.productTitle}</p>
                    <p className="text-sm text-slate-500">
                      Qty {item.quantity}
                      {item.variantLabel ? ` • ${item.variantLabel}` : ""}
                    </p>
                    <Link href={`/product/${item.productSlug}`} className="text-xs text-[#0A4D3C]">
                      View product
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0A4D3C]">Rs. {Number(item.totalPrice).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">SKU: {item.productSku}</p>
                    {product?.images[0]?.imageUrl && (
                      <Link href={product.images[0].imageUrl} target="_blank" className="text-xs text-slate-400">
                        image
                      </Link>
                    )}
                  </div>
                </div>
                {order.orderStatus === "DELIVERED" && (
                  <ReviewSubmitForm productId={item.productId} orderId={order.id} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="lux-card rounded-xl p-5">
          <p className="mb-2 flex items-center gap-2 font-medium text-[#0A4D3C]">
            <Truck className="h-4 w-4" />
            Shipment
          </p>
          {order.shipment ? (
            <div className="space-y-1 text-sm text-slate-600">
              <p>Status: {order.shipment.status}</p>
              <p>Courier: {order.shipment.courierName || "-"}</p>
              <p>AWB: {order.shipment.awbCode || "-"}</p>
              <p>Tracking #: {order.shipment.trackingNumber || "-"}</p>
              {order.shipment.trackingUrl && (
                <Link href={order.shipment.trackingUrl} target="_blank" className="text-[#0A4D3C]">
                  Track shipment
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Shipment not created yet.</p>
          )}
        </div>
        <div className="lux-card rounded-xl p-5">
          <p className="mb-2 font-medium text-[#0A4D3C]">Amount Summary</p>
          <div className="space-y-1 text-sm text-slate-600">
            <p>Subtotal: Rs. {Number(order.subtotalAmount).toFixed(2)}</p>
            <p>Shipping: Rs. {Number(order.shippingChargeAmount).toFixed(2)}</p>
            <p>Tax: Rs. {Number(order.taxAmount).toFixed(2)}</p>
            <p>Coupon discount: Rs. {Number(order.couponDiscountAmount).toFixed(2)}</p>
            <p className="font-semibold text-[#0A4D3C]">Total: Rs. {Number(order.totalAmount).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="lux-card rounded-xl p-5 text-sm text-slate-600">
          <p className="mb-2 font-medium text-[#0A4D3C]">Shipping Address</p>
          {order.shippingAddress ? (
            <>
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.phone}</p>
            </>
          ) : (
            <p>-</p>
          )}
        </div>
        <div className="lux-card rounded-xl p-5 text-sm text-slate-600">
          <p className="mb-2 font-medium text-[#0A4D3C]">Billing Address</p>
          {order.billingAddress ? (
            <>
              <p>{order.billingAddress.fullName}</p>
              <p>{order.billingAddress.line1}</p>
              {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
              <p>
                {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
              </p>
              <p>{order.billingAddress.phone}</p>
            </>
          ) : (
            <p>-</p>
          )}
        </div>
      </div>
    </div>
  );
}
