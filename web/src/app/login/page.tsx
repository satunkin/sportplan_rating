import Link from "next/link";

import { AthleteLoginForm } from "@/app/login/form";

export default async function AthleteLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ magicLinkError?: string }>;
}) {
  const { magicLinkError } = await searchParams;

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Athlete access
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Вход в кабинет спортсмена
          </h1>
          <p className="mt-5 text-base leading-7 text-white/82">
            Основной путь входа теперь строится вокруг одноразовой ссылки в
            email. Это ближе к целевому web MVP и не заставляет участника
            помнить отдельный пароль.
          </p>
          <Link
            className="mt-8 inline-flex text-sm font-medium text-white/85 underline-offset-4 hover:underline"
            href="/register"
          >
            Создать новый профиль
          </Link>
        </article>

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Авторизация участника
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
            Вернуться к своим результатам
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Запросите magic link на ваш email. Пока SMTP не подключен, в dev
            режиме система покажет ссылку прямо на экране, чтобы можно было
            проверить flow end-to-end.
          </p>
          {magicLinkError ? (
            <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
              {magicLinkError}
            </div>
          ) : null}
          <div className="mt-8">
            <AthleteLoginForm />
          </div>
        </article>
      </section>
    </main>
  );
}
