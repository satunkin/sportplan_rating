import Link from "next/link";

const steps = [
  {
    title: "Зарегистрироваться в Telegram-боте",
    text: "Бот сохраняет имя спортсмена и связывает участника с рейтингом сезона.",
  },
  {
    title: "Отправлять результаты после стартов",
    text: "Спортсмен указывает соревнование, дистанцию, время и ссылку на официальный протокол.",
  },
  {
    title: "Дождаться проверки",
    text: "Администратор сверяет результат с протоколом, подтверждает или отправляет на уточнение.",
  },
  {
    title: "Следить за рейтингом на сайте",
    text: "После подтверждения результат попадает в публичную таблицу и карточку спортсмена.",
  },
];

export default function ParticipatePage() {
  const botUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL?.trim();

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-6 border-b border-border pb-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Как участвовать
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-medium text-foreground">
              Участник работает через Telegram, рейтинг публикуется на сайте
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              Сайт остается открытой витриной рейтинга и протоколов. Регистрация,
              изменение имени, отправка и удаление результатов должны происходить
              через Telegram-бота.
            </p>
          </div>
          <div className="border border-border bg-white px-5 py-5">
            <p className="text-sm text-muted">Статус бота</p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              Основной интерфейс спортсмена
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Регистрация, результаты, исправления и просмотр своего места
              работают через Telegram.
            </p>
            {botUrl ? (
              <a
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white"
                href={botUrl}
                rel="noreferrer"
                target="_blank"
              >
                Открыть Telegram-бота
              </a>
            ) : null}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <article className="border border-border bg-white px-5 py-5" key={step.title}>
              <p className="text-sm font-semibold tabular-nums text-accent">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">{step.text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <article className="border border-border bg-white px-5 py-5">
            <h2 className="text-2xl font-medium text-foreground">
              Что понадобится для результата
            </h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-muted">
              <li>Название соревнования и дата старта.</li>
              <li>Дисциплина и дистанция.</li>
              <li>Финишное время.</li>
              <li>Ссылка на официальный протокол.</li>
              <li>Позиция в своей возрастной группе, если она есть в протоколе.</li>
            </ul>
          </article>

          <article className="border border-border bg-white px-5 py-5">
            <h2 className="text-2xl font-medium text-foreground">
              Где смотреть результат
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              После проверки результат появится в полном рейтинге и в карточке
              соревнования. Итоговое место сезона
              обновляется автоматически после подтверждения.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
                href="/leaderboard"
              >
                Смотреть рейтинг
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
                href="/events"
              >
                Соревнования
              </Link>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
