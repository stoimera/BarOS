import { useEffect, useState } from "react";

export type GoogleReview = {
  author_name: string;
  rating: number;
  text: string;
};

export function useGoogleReviews(placeId: string, apiKey: string) {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      setError(null);
      try {
        // NOTE: For external APIs, you may still need to use fetch directly or add a utility to apiClient
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`
        );
        const data = await response.json();
        if (data.result && data.result.reviews) {
          // Filter: 5 stars, has name, and at least 1 full sentence (ends with a period)
          const filtered = data.result.reviews.filter(
            (review: any) =>
              review.rating === 5 &&
              review.author_name &&
              typeof review.text === "string" &&
              review.text.trim().split(/[.!?]/).filter(Boolean).length >= 1
          );
          setReviews(filtered);
        } else {
          setReviews([]);
        }
      } catch {
        setError("Failed to fetch reviews");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [placeId, apiKey]);

  return { reviews, loading, error };
}

// const { reviews, loading, error } = useGoogleReviews("YOUR_PLACE_ID", "YOUR_API_KEY");
// reviews.map(r => <div key={r.author_name}>{r.text}</div>); 