export default function Home() {
  return (
    <main className="page-shell flex min-h-screen flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 sm:px-10 lg:px-12">
        <div className="mb-14 flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Cyclon Rating
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-accent-strong sm:text-6xl">
              Сезонный рейтинг для любителей бега, вело, плавания и триатлона.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Платформа считает рейтинг по сумме трех лучших стартов за сезон,
              проверяет результаты и показывает прозрачную публичную таблицу.
            </p>
          </div>
          <div className="grid gap-3 rounded-[2rem] border border-border bg-surface px-6 py-5 shadow-[0_20px_80px_rgba(27,42,51,0.08)]">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              MVP focus
            </p>
            <p className="text-3xl font-semibold text-accent-strong">1000</p>
            <p className="max-w-xs text-sm leading-6 text-muted">
              участников на сезон без перегруза по инфраструктуре и ручной
              модерации.
            </p>
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
