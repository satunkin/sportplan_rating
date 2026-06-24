"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  approveSubmissionInline,
  rejectSubmissionInline,
} from "@/app/cabinet/submissions/actions";

type InlineReviewCardProps = {
  articleId: string;
  children: ReactNode;
};

export function InlineReviewCard({
  articleId,
  children,
}: InlineReviewCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  function handleSubmitCapture(event: FormEvent<HTMLElement>) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const decision = form.dataset.inlineReview;
    if (decision !== "approve" && decision !== "reject") {
      return;
    }

    event.preventDefault();

    if (isPending || isRemoved) {
      return;
    }

    const formData = new FormData(form);

    setError(null);
    setFeedback(null);

    startTransition(async () => {
      const result =
        decision === "approve"
          ? await approveSubmissionInline(formData)
          : await rejectSubmissionInline(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setFeedback(
        decision === "approve"
          ? "Результат подтвержден, карточка исчезнет из очереди."
          : "Результат отклонен, карточка исчезнет из очереди.",
      );

      hideTimeoutRef.current = window.setTimeout(() => {
        setIsRemoved(true);
      }, 700);

      refreshTimeoutRef.current = window.setTimeout(() => {
        router.refresh();
      }, 1000);
    });
  }

  return (
    <article
      className={`overflow-hidden rounded-[1.5rem] border border-border bg-white/80 transition-all duration-300 ${
        isPending ? "opacity-75" : ""
      } ${isRemoved ? "max-h-0 scale-[0.98] border-transparent opacity-0" : "max-h-[240rem]"}`}
      id={articleId}
      onSubmitCapture={handleSubmitCapture}
    >
      {feedback ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 lg:px-6">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 lg:px-6">
          {error}
        </div>
      ) : null}
      {isPending && !feedback ? (
        <div className="border-b border-sky-200 bg-sky-50 px-5 py-3 text-sm text-sky-800 lg:px-6">
          Сохраняем решение...
        </div>
      ) : null}
      {children}
    </article>
  );
}
