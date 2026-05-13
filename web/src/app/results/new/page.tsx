import Link from "next/link";
import { redirect } from "next/navigation";

import { ResultSubmissionForm } from "@/app/results/new/form";
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
            Сейчас заявка сохраняется во временной серверной сессии и получает
            статус `pending_manual_review`. После подключения БД она будет
            превращаться в полноценную `result_submission`.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/8 px-5 py-5">
            <p className="text-sm leading-7 text-white/80">
              Для MVP критично уже сейчас собирать полные входные данные:
              соревнование, дисциплину, группу, итоговое время и ссылку на
              официальный протокол.
            </p>
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
            Предзаполняем вашу возрастную группу из профиля сезона, но вы можете
            поправить ее по официальному протоколу конкретного старта.
          </p>
          <div className="mt-8">
            <ResultSubmissionForm suggestedAgeGroup={profile.seasonAgeGroup} />
          </div>
        </article>
      </section>
    </main>
  );
}
