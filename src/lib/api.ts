import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { message, details } },
    { status },
  );
}

export async function withApiHandler<T>(
  handler: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const data = await handler();
    return ok(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.status, error.message, error.details);
    }
    if (error instanceof ZodError) {
      return fail(400, "Validation failed", error.flatten());
    }
    return fail(500, "Internal server error");
  }
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(pageSize, 100)
      : 20;

  return {
    page: safePage,
    pageSize: safePageSize,
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  };
}
