import Link from "next/link";

const categoryGroups = [
  {
    title: "Бег",
    items: [
      { label: "5 км", points: 500 },
      { label: "10 км", points: 600 },
      { label: "21 км", points: 800 },
      { label: "Марафон", points: 1000 },
      { label: "Hard Marathon", points: 1100 },
    ],
  },
  {
    title: "Триатлон",
    items: [
      { label: "Спринт", points: 500 },
      { label: "Олимпийка", points: 600 },
      { label: "Half Ironman", points: 800 },
      { label: "Ironman", points: 1000 },
      { label: "Hard Ironman", points: 1100 },
    ],
  },
  {
    title: "Плавание",
    items: [
      { label: "Короткая вода", points: 500 },
      { label: "Средняя вода", points: 700 },
      { label: "Длинная вода", points: 900 },
    ],
  },
  {
    title: "Велоспорт",
    items: [
      { label: "Короткая велогонка", points: 500 },
      { label: "Средняя велогонка", points: 700 },
      { label: "Веломарафон", points: 900 },
      { label: "Ультра-вело", points: 1100 },
    ],
  },
];

const reviewCases = [
  "В возрастной группе меньше 5 финишеров.",
  "Организатор объединил возрастные группы в протоколе.",
  "У старта нет публичного официального протокола.",
  "Есть спор по дубликату результата или корректности данных.",
];

const tieBreakers = [
  "Более высокий лучший результат.",
  "Если он равен, сравнивается второй лучший результат.",
  "Если и он равен, сравнивается третий лучший результат.",
  "Дальше выигрывает спортсмен с большим числом подтвержденных зачетных стартов.",
  "Если все показатели равны, спортсмены делят место.",
];

export default function RulesPage() {
  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Методология рейтинга
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
            Как Cyclon считает очки сезона
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            В зачет идут только подтвержденные результаты внутри активного
            сезона. Итоговый рейтинг спортсмена равен сумме трех лучших стартов
            с учетом категории дистанции и отставания от пятого места в своей
            возрастной группе.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
              href="/leaderboard"
            >
              Открыть рейтинг
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
              href="/results/new"
            >
              Подать результат
            </Link>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-border bg-white/78 px-7 py-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Базовый принцип
            </p>
            <ol className="mt-5 grid gap-4 text-base leading-7 text-foreground">
              <li>1. Для каждого старта определяется категория дистанции.</li>
              <li>2. Для возрастной группы ищется результат 5-го места.</li>
              <li>3. Считается отставание спортсмена от этого ориентира.</li>
              <li>4. Чем выше категория и меньше отставание, тем больше очков.</li>
              <li>5. В итог сезона попадают только 3 лучших результата.</li>
            </ol>
          </article>

          <article className="rounded-[2rem] bg-accent px-7 py-7 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
              Формула MVP
            </p>
            <div className="mt-5 rounded-[1.5rem] border border-white/18 bg-white/10 px-5 py-5">
              <p className="text-2xl font-semibold">result score</p>
              <p className="mt-3 text-sm leading-7 text-white/88">
                `round(basePoints * exp(-0.077 * lagPercent))`
              </p>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/82">
              Если спортсмен быстрее результата 5-го места, штрафа нет:
              `lagPercent = 0`, а старт получает максимум своей категории.
            </p>
          </article>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Что считается
            </p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              Только verified
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              В рейтинг попадают только подтвержденные результаты внутри
              активного сезона. `DNS`, `DNF` и `DSQ` не участвуют.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Какой максимум
            </p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              До basePoints
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              За один старт нельзя получить больше базовой стоимости категории.
              Минимум очков за результат равен нулю.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Что идет в сезон
            </p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              Топ-3 старта
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Подтвержденных результатов может быть больше трех, но в сумму
              рейтинга входят только самые сильные.
            </p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
          <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Категории и база очков
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-accent-strong">
                Текущая MVP-шкала
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted">
              Категория определяет потолок очков за старт. Более длинные и
              сложные дистанции получают больший базовый вес.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoryGroups.map((group) => (
              <article
                key={group.title}
                className="rounded-[1.5rem] border border-border bg-white/75 px-5 py-5"
              >
                <p className="text-lg font-semibold text-accent-strong">
                  {group.title}
                </p>
                <div className="mt-4 grid gap-3">
                  {group.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3"
                    >
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="text-sm font-semibold text-accent-strong">
                        {item.points}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-border bg-white/78 px-7 py-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Когда нужен review
            </p>
            <ul className="mt-5 grid gap-3 text-base leading-7 text-foreground">
              {reviewCases.map((item) => (
                <li
                  key={item}
                  className="rounded-[1.25rem] border border-border bg-surface px-4 py-4"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[2rem] border border-border bg-white/78 px-7 py-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Как решается ничья
            </p>
            <ol className="mt-5 grid gap-3 text-base leading-7 text-foreground">
              {tieBreakers.map((item, index) => (
                <li
                  key={item}
                  className="rounded-[1.25rem] border border-border bg-surface px-4 py-4"
                >
                  {index + 1}. {item}
                </li>
              ))}
            </ol>
          </article>
        </section>
      </section>
    </main>
  );
}
