"use client";

import { useEffect, useState } from "react";

export interface FaasReviewComment {
  id: string;
  field_name?: string | null;
  comment_text: string;
  suggested_value?: string | null;
  author_name: string;
  created_at: string;
}

interface UseFaasReviewCommentsOptions {
  draftId: string | null | undefined;
  apiBasePath: string;
}

export function useFaasReviewComments({
  draftId,
  apiBasePath,
}: UseFaasReviewCommentsOptions) {
  const [comments, setComments] = useState<FaasReviewComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (!draftId) {
      setComments([]);
      return;
    }

    let cancelled = false;
    setCommentsLoading(true);

    fetch(`${apiBasePath}/${draftId}/comments`)
      .then((response) => response.json())
      .then((result) => {
        if (!cancelled && result.data) {
          setComments(result.data as FaasReviewComment[]);
        }
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBasePath, draftId]);

  return { comments, commentsLoading };
}
