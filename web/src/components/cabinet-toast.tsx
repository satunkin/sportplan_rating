"use client";

import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type ToastTone = "success" | "warning" | "error";

type ToastMessage = {
  text: string;
  tone: ToastTone;
};

const messages: Record<string, ToastMessage> = {
  admin_created: { text: "Администратор создан", tone: "success" },
  athlete_created: { text: "Спортсмен создан", tone: "success" },
  athlete_saved: { text: "Данные спортсмена сохранены", tone: "success" },
  athlete_archived: { text: "Спортсмен перенесён в архив", tone: "success" },
  athlete_restored: { text: "Спортсмен восстановлен", tone: "success" },
  athlete_create_invalid: {
    text: "Проверьте обязательные данные спортсмена",
    tone: "error",
  },
  club_created: { text: "Клуб добавлен", tone: "success" },
  coach_created: { text: "Тренер добавлен", tone: "success" },
  competition_create_failed: {
    text: "Не удалось создать соревнование. Проверьте данные и повторите попытку",
    tone: "error",
  },
  competition_created: { text: "Соревнование создано", tone: "success" },
  competition_created_protocol_warning: {
    text: "Соревнование создано, но протокол не импортирован",
    tone: "warning",
  },
  competition_saved: { text: "Изменения соревнования сохранены", tone: "success" },
  competition_distance_added: { text: "Дистанция добавлена", tone: "success" },
  competition_protocol_imported: { text: "Протокол импортирован", tone: "success" },
  competition_benchmark_saved: { text: "Контрольное время сохранено", tone: "success" },
  competition_archived: { text: "Соревнование перенесено в архив", tone: "success" },
  competition_restored: { text: "Соревнование восстановлено", tone: "success" },
  directory_archived: { text: "Запись перенесена в архив", tone: "success" },
  directory_restored: { text: "Запись восстановлена", tone: "success" },
};

const feedbackKeys = ["notice", "error", "adminError"] as const;

export function CabinetToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const feedbackCode =
    feedbackKeys.map((key) => searchParams.get(key)).find(Boolean) ?? null;

  useEffect(() => {
    if (!feedbackCode) return;

    const message = messages[feedbackCode];
    if (!message) return;

    const openTimer = window.setTimeout(() => setToast(message), 0);
    const closeTimer = window.setTimeout(() => {
      setToast(null);
      const nextParams = new URLSearchParams(searchParams.toString());
      feedbackKeys.forEach((key) => nextParams.delete(key));
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 3200);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
    };
  }, [feedbackCode, pathname, router, searchParams]);

  if (!toast) return null;

  const Icon = toast.tone === "success" ? CheckCircle : WarningCircle;

  return (
    <div
      aria-atomic="true"
      className={`cabinet-toast cabinet-toast--${toast.tone}`}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="shrink-0" size={21} weight="fill" />
      <p className="min-w-0 flex-1 text-sm font-semibold">{toast.text}</p>
      <button
        aria-label="Закрыть уведомление"
        className="grid size-8 shrink-0 place-items-center rounded-md text-current/70 hover:bg-black/5 hover:text-current"
        onClick={() => setToast(null)}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
