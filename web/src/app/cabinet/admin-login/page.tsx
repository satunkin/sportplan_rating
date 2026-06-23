import Link from "next/link";

import { AdminLoginForm } from "@/app/cabinet/admin-login/form";
import { getAdminAuthMode } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const authMode = getAdminAuthMode();

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Кабинет администратора
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Управление рейтингом и соревнованиями
          </h1>
          <p className="mt-5 text-base leading-7 text-white/82">
            Здесь администраторы управляют соревнованиями, участниками,
            результатами и заявками Кубка Циклон.
          </p>
          <Link
            className="mt-8 inline-flex text-sm font-medium text-white/85 underline-offset-4 hover:underline"
            href="/"
          >
            Вернуться на главную
          </Link>
        </article>

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Вход
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
            Войти в кабинет
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Введите данные администратора, чтобы продолжить работу.
          </p>
          <div className="mt-8">
            <AdminLoginForm mode={authMode} />
          </div>
        </article>
      </section>
    </main>
  );
}
