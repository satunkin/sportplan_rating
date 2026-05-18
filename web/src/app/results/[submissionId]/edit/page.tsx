import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { saveAthleteSubmissionEdit } from "@/app/cabinet/actions";
import { DISCIPLINE_OPTIONS } from "@/lib/result-submission";
import { getAthleteProfileByUserId, listSubmissionsForUser } from "@/lib/db";
import { getAthleteUserSession } from "@/lib/session";

function formatSubmissionDate(date: Date) {
  return `${String(date.getUTCDate()).padStart(2, "0")}.${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

export default async function EditSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const userId = await getAthleteUserSession();

  if (!userId) {
    redirect("/login");
  }

  const profile = await getAthleteProfileByUserId(userId);

  if (!profile) {
    redirect("/login");
  }

  const [{ submissionId }, { error }, submissions] = await Promise.all([
    params,
    searchParams,
    listSubmissionsForUser(userId),
  ]);

  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    notFound();
  }

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Редактирование результата
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Обновить прошлый старт
          </h1>
          <p className="mt-5 text-base leading-7 text-white/82">
            После сохранения заявка снова попадет на подтверждение администратору. Это нужно, чтобы рейтинг всегда опирался на подтвержденную версию данных.
          </p>
          <Link className="mt-8 inline-flex text-sm font-medium text-white/85 underline-offset-4 hover:underline" href="/cabinet">
            Вернуться в кабинет
          </Link>
        </article>

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Заявка спортсмена
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
            {profile.firstName}, измените данные результата
          </h2>
          {error ? (
            <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}
          <form action={saveAthleteSubmissionEdit} className="mt-8 grid gap-5">
            <input name="submissionId" type="hidden" value={submission.id} />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Название соревнования
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.eventNameRaw} name="eventName" required />
              </label>
              <label className="text-sm font-medium text-foreground">
                Дата старта
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={formatSubmissionDate(submission.eventDate)} name="eventDate" required />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Дисциплина
                <select className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.discipline} name="discipline" required>
                  {DISCIPLINE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Дистанция
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.distanceLabel} name="distanceLabel" required />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Возрастная группа
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.ageGroupClaimed} name="ageGroupClaimed" required />
              </label>
              <label className="text-sm font-medium text-foreground">
                Итоговое время
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.finishTimeRaw} name="finishTime" required />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Место в абсолюте
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.placementOverall ?? ""} name="placementOverall" />
              </label>
              <label className="text-sm font-medium text-foreground">
                Место в группе
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.placementInAgeGroup ?? ""} name="placementInAgeGroup" />
              </label>
            </div>
            <label className="text-sm font-medium text-foreground">
              Ссылка на протокол
              <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.protocolUrl ?? ""} name="protocolUrl" type="url" />
            </label>
            <label className="text-sm font-medium text-foreground">
              Комментарий
              <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.comment ?? ""} name="comment" />
            </label>
            <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong" type="submit">
              Сохранить и отправить на подтверждение
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
