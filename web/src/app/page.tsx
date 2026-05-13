import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell flex min-h-screen flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 sm:px-10 lg:px-12">
        <div className="mb-14 flex flex-col gap-6 border-b border-border pb-10">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold tracking-[0.08em] text-accent">
              SportPlan rating
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-accent-strong sm:text-6xl">
              Сезонный рейтинг атлетов
            </h1>
            <div className="mt-6 flex flex-wrap items-start gap-x-4 gap-y-3">
              <p className="max-w-3xl text-lg leading-8 text-muted">
                Платформа считает рейтинг по сумме трех лучших результатов на
                соревнованиях по бегу, плаванию, велоспорту и триатлону
              </p>
              <div className="group relative">
                <Link
                  className="inline-flex items-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
                  href="/rules"
                >
                  Как считается рейтинг
                </Link>
                <div className="pointer-events-none absolute left-0 top-full mt-3 w-80 rounded-[1.25rem] border border-border bg-white px-4 py-4 text-sm leading-6 text-muted opacity-0 shadow-[0_18px_50px_rgba(27,42,51,0.14)] transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                  В рейтинг идут три лучших старта. Очки зависят от категории
                  дистанции, а также от разницы результата спортсмена с 5-м
                  местом в его возрастной группе. На отдельной странице можно
                  посмотреть полную методологию.
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-7 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Основа продукта
            </p>
            <ul className="mt-5 grid gap-4 text-base leading-7 text-foreground">
              <li>Регистрация спортсмена и личный кабинет.</li>
              <li>Подача результатов с ссылкой на официальный протокол.</li>
              <li>Ручная и полуавтоматическая валидация результатов.</li>
              <li>Подсчет очков и публичная таблица рейтинга.</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
                href="/register"
              >
                Зарегистрироваться
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/75 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
                href="/login"
              >
                Войти
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/75 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
                href="/cabinet"
              >
                Открыть кабинет
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-surface px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
                href="/leaderboard"
              >
                Смотреть рейтинг
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/75 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
                href="/rules"
              >
                Правила рейтинга
              </Link>
            </div>
          </article>

          <article className="rounded-[2rem] bg-accent px-7 py-7 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Формула
            </p>
            <p className="mt-4 text-2xl font-semibold">Топ-3 результата</p>
            <p className="mt-4 text-sm leading-7 text-white/82">
              В зачет идет сумма трех лучших подтвержденных стартов. Очки
              рассчитываются по категории дистанции и отставанию от пятого
              места в возрастной группе.
            </p>
            <Link
              className="mt-6 inline-flex text-sm font-semibold text-white underline-offset-4 hover:underline"
              href="/rules"
            >
              Открыть полные правила
            </Link>
          </article>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-border bg-white/70 px-6 py-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Спортсмен
            </p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              Подает результат
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Указывает соревнование, дистанцию, возрастную группу, время и
              ссылку на официальный протокол.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-white/70 px-6 py-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Система
            </p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              Проверяет и считает
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Ищет подтверждение в загруженных протоколах, считает лаг от пятого
              места и начисляет очки.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-white/70 px-6 py-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Публика
            </p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              Видит рейтинг
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Таблица показывает место, сумму очков, лучшие старты и текущую
              форму сезона.
            </p>
          </article>
        </section>

        <section className="mt-10 rounded-[2rem] border border-border bg-surface-strong px-7 py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Статус проекта
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                Планирование завершено, идет bootstrap MVP
              </h2>
            </div>
            <div className="text-sm leading-7 text-muted">
              Следующий этап: база данных, авторизация, профиль спортсмена,
              прием результатов и очередь модерации.
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
