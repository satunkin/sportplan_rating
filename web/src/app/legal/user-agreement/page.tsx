import Link from "next/link";

import { TechnicalNote } from "@/components/technical-note";

export default function UserAgreementPage() {
  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Юридическая информация
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-accent-strong">
            Пользовательское соглашение
          </h1>
          <p className="mt-4 text-base leading-8 text-muted">
            Здесь будет опубликована полная юридическая версия пользовательского
            соглашения для участников рейтинга. Пока страница нужна как
            прозрачная точка входа: атлет должен понимать, где будут зафиксированы
            правила использования сервиса.
          </p>
        </div>

        <TechnicalNote>
          Сейчас это временный placeholder. После согласования юридического
          текста сюда можно вынести финальные условия: статус сервиса,
          ответственность сторон, порядок подачи и проверки результатов,
          условия изменения правил и контактные данные оператора.
        </TechnicalNote>

        <Link
          className="inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
          href="/"
        >
          Вернуться на главную
        </Link>
      </section>
    </main>
  );
}
