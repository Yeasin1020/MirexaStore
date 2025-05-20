// app/testimonials/page.tsx
import { Metadata } from "next";
import TestimonialsClient from "./TestimonialsClient";

export const metadata: Metadata = {
  title: "Customer Reviews",
};

const fetchInitialReviews = async (page: number = 1, limit: number = 6) => {
  const res = await fetch(
    `https://campus-needs-backend.vercel.app/api/reviews/all?page=${page}&limit=${limit}`,
    { cache: "no-store" }
  );
  const data = await res.json();

  const reviews = data.data.map((review: any) => ({
    userName: review.userName || "Anonymous",
    review: review.comment,
    image: generateFallbackImage(review.userName),
    rating: review.rating,
    createdAt: new Date(review.createdAt).toLocaleDateString("en-US"),
  }));

  return {
    reviews,
    totalReviews: data.totalReviews,
    totalPages: data.totalPages,
  };
};

const generateFallbackImage = (userName: string) => {
  const letter = userName ? userName.charAt(0).toUpperCase() : "U";
  return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjhmOGY4Ii8+PHRleHQgeD0iMjUiIHk9IjMwIiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIj4${letter}</text></svg>`;
};

export default async function TestimonialsPage() {
  const { reviews, totalReviews, totalPages } = await fetchInitialReviews();

  return (
    <TestimonialsClient
      initialReviews={reviews}
      totalReviews={totalReviews}
      totalPages={totalPages}
    />
  );
}
