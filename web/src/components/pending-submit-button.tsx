"use client";

import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  className,
  idleLabel,
  pendingLabel,
}: {
  className: string;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="submit-progress-dot" />
          {pendingLabel}
        </span>
      ) : (
        idleLabel
      )}
    </button>
  );
}
