"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewSubmitForm({
  productId,
  orderId,
}: {
  productId: string;
  orderId: string;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const response = await fetch("/api/store/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        orderId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error?.message || "Failed to submit review");
      setLoading(false);
      return;
    }
    setMessage("Review submitted. It will appear after approval.");
    setLoading(false);
    setTitle("");
    setComment("");
  }

  return (
    <form onSubmit={submitReview} className="mt-3 space-y-2 rounded-lg border border-[#0A4D3C]/10 bg-[#0A4D3C]/[0.02] p-3">
      <p className="text-xs font-medium text-[#0A4D3C]">Write a review</p>
      <div className="grid gap-2 sm:grid-cols-[130px_1fr]">
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="h-9 rounded-md border border-[#0A4D3C]/20 px-2 text-sm"
        >
          <option value={5}>5 - Excellent</option>
          <option value={4}>4 - Good</option>
          <option value={3}>3 - Average</option>
          <option value={2}>2 - Poor</option>
          <option value={1}>1 - Bad</option>
        </select>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Review title (optional)"
          className="h-9"
        />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        className="min-h-20 w-full rounded-md border border-[#0A4D3C]/20 bg-white px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {message && <p className="text-xs text-emerald-700">{message}</p>}
      <Button size="sm" type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
