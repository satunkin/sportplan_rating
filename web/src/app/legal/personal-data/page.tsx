import Link from "next/link";

import { TechnicalNote } from "@/components/technical-note";

export default function PersonalDataPage() {
  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Юридическая информация
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-accent-strong">
            Соглашение о персональных данных
          </h1>
          <p className="mt-4 text-base leading-8 text-muted">
            На этой странице будет описано, какие данные участника мы храним,
            зачем они нужны для рейтинга и как используются при входе,
            модерации результатов и публикации карточки спортсмена.
          </p>
        </div>

        <TechnicalNote>
          Временный технический каркас. В финальной версии здесь нужно
          зафиксировать перечень персональных данных, основания обработки,
          срок хранения, порядок отзыва согласия и способ связи по privacy
          вопросам.
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
