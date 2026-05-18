import Link from "next/link";
import { redirect } from "next/navigation";

import { ResultSubmissionForm } from "@/app/results/new/form";
import { TechnicalNote } from "@/components/technical-note";
import { getAthleteProfileByUserId } from "@/lib/db";
import { getAthleteUserSession } from "@/lib/session";

export default async function NewResultPage() {
  const userId = await getAthleteUserSession();

  if (!userId) {
    redirect("/register");
  }

  const profile = await getAthleteProfileByUserId(userId);

  if (!profile) {
    redirect("/register");
  }

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Шаг 2
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Подача результата
          </h1>
          <p className="mt-5 text-base leading-7 text-white/82">
            Отправьте старт на проверку, чтобы он попал в очередь модерации и
            после подтверждения начал участвовать в вашем рейтинге сезона.
          </p>
          <div className="mt-8">
            <TechnicalNote title="Техническая заметка о заявке">
              Заявка сохраняется в рабочую Postgres-базу со статусом
              `pending_manual_review`. Для MVP система уже блокирует точный
              дубль одного и того же результата. Ссылка на протокол желательна:
              без нее администратору потребуется явное ручное подтверждение.
            </TechnicalNote>
          </div>
          <Link
            className="mt-8 inline-flex text-sm font-medium text-white/85 underline-offset-4 hover:underline"
            href="/cabinet"
          >
            Вернуться в кабинет
          </Link>
        </article>

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Заявка на старт
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
            Добавьте результат для проверки и будущего расчета рейтинга
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Мы подставим возрастную группу из профиля, но вы можете исправить
            ее по официальному протоколу конкретного соревнования, а также
            указать места, если они уже известны.
          </p>
          <div className="mt-8">
            <ResultSubmissionForm suggestedAgeGroup={profile.seasonAgeGroup} />
          </div>
        </article>
      </section>
    </main>
  );
}
