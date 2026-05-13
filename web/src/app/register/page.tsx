import Link from "next/link";

import { RegisterForm } from "@/app/register/form";

export default function RegisterPage() {
  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Шаг 1
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Регистрация спортсмена
          </h1>
          <p className="mt-5 text-base leading-7 text-white/82">
            В этом цикле MVP профиль пока сохраняется как временная серверная
            сессия. После подключения БД форма будет писать данные в таблицы
            `users` и `athletes`.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/8 px-5 py-5">
            <p className="text-sm leading-7 text-white/80">
              Сейчас мы уже считаем возраст на конец сезона и показываем
              предварительную возрастную группу, чтобы позже безболезненно
              подключить ranking engine.
            </p>
          </div>
          <Link
            className="mt-8 inline-flex text-sm font-medium text-white/85 underline-offset-4 hover:underline"
            href="/"
          >
            Вернуться на главную
          </Link>
        </article>

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Профиль участника
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
            Заполните основные данные для входа в рейтинг
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            После сохранения вы попадете в личный кабинет. На следующем этапе
            сюда добавятся подача результатов и их статус проверки.
          </p>
          <div className="mt-8">
            <RegisterForm />
          </div>
        </article>
      </section>
    </main>
  );
}
