import Link from "next/link";

import { TechnicalNote } from "@/components/technical-note";
import { listLeaderboard } from "@/lib/db";

type LeaderboardEntry = Awaited<ReturnType<typeof listLeaderboard>>[number];

function HomeLeaderboardColumn({
  leaders,
}: {
  leaders: LeaderboardEntry[];
}) {
  if (leaders.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border bg-white/65 px-6 py-8 text-sm leading-7 text-muted">
        Рейтинг пока пуст. После подтверждения первых результатов здесь
        появятся лидеры сезона.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {leaders.map((entry) => (
        <Link
          key={entry.id}
          className="rounded-[1.5rem] border border-border bg-white/75 px-5 py-4 transition hover:bg-white"
          href={`/athletes/${entry.athlete.id}`}
        >
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_180px] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm uppercase tracking-[0.16em] text-muted">
                Место {entry.rank}
              </p>
              <p className="mt-2 text-xl font-semibold text-accent-strong">
                {entry.athlete.publicDisplayName?.trim() ||
                  `${entry.athlete.firstName} ${entry.athlete.lastName}`.trim()}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {entry.athlete.city ?? "Город не указан"} •{" "}
                {entry.athlete.seasonAgeGroup ?? "Возрастная группа уточняется"}
              </p>
            </div>

            <div className="min-w-0 rounded-[1.25rem] bg-surface px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Лучшие старты
              </p>
              <div className="mt-3 grid gap-2">
                {entry.athlete.verifiedResults.slice(0, 3).map((result, index) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-muted">
                      {index + 1}. {result.submission.distanceLabel}
                    </span>
                    <span className="shrink-0 font-semibold text-accent-strong">
                      {result.submission.finishTimeRaw}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.25rem] bg-surface px-4 py-3 text-right">
              <p className="text-2xl font-semibold text-accent-strong">
                {entry.totalPoints}
              </p>
              <p className="mt-1 text-sm text-muted">
                {entry.scoredResultsCount} стартов в зачете
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function Home() {
  const [maleEntries, femaleEntries] = await Promise.all([
    listLeaderboard({ gender: "male" }),
    listLeaderboard({ gender: "female" }),
  ]);
  const maleLeaders = maleEntries.slice(0, 5);
  const femaleLeaders = femaleEntries.slice(0, 5);

  return (
    <main className="page-shell flex min-h-screen flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 sm:px-10 lg:px-12">
        <section className="grid gap-6">
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
            <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Рейтинг сезона
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-accent-strong">
                  Абсолютный рейтинг
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted">
                На главной сразу видны оба зачета, чтобы не переключаться между
                мужской и женской таблицей.
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <section className="rounded-[1.75rem] border border-border bg-white/45 px-5 py-5">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                      Мужчины
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Топ-5 текущего сезона
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <HomeLeaderboardColumn leaders={maleLeaders} />
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-border bg-white/45 px-5 py-5">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                      Женщины
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Топ-5 текущего сезона
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <HomeLeaderboardColumn leaders={femaleLeaders} />
                </div>
              </section>
            </div>

            <div className="mt-6">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
                href="/leaderboard"
              >
                Открыть полный рейтинг
              </Link>
            </div>
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <TechnicalNote>
              На текущем этапе front уже показывает реальный пользовательский
              маршрут, но рядом сохранены технические пояснения про модули,
              статусы и MVP-ограничения. Это сделано специально, чтобы удобнее
              было дорабатывать backend и не потерять связь между UX и
              внутренней логикой системы.
            </TechnicalNote>

            <article className="rounded-[2rem] border border-border bg-surface-strong px-7 py-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Быстрые действия
              </p>
              <div className="mt-5 grid gap-3">
                <Link
                  className="rounded-[1.25rem] border border-border bg-white/75 px-4 py-4 text-sm font-semibold text-accent-strong transition hover:bg-white"
                  href="/register"
                >
                  Зарегистрироваться в рейтинге
                </Link>
                <Link
                  className="rounded-[1.25rem] border border-border bg-white/75 px-4 py-4 text-sm font-semibold text-accent-strong transition hover:bg-white"
                  href="/login"
                >
                  Войти по email
                </Link>
                <Link
                  className="rounded-[1.25rem] border border-border bg-white/75 px-4 py-4 text-sm font-semibold text-accent-strong transition hover:bg-white"
                  href="/results/new"
                >
                  Подать новый результат
                </Link>
              </div>
            </article>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
            <p className="mb-3 inline-flex rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-semibold tracking-[0.08em] text-accent">
              SportPlan rating
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-accent-strong sm:text-6xl">
              Рейтинг сезона 2026
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">
              Подайте свои результаты, следите за местом в таблице и в любой
              момент проверяйте, как именно начисляются очки за каждый старт.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
                href="/leaderboard"
              >
                Смотреть рейтинг
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
                href="/cabinet"
              >
                Перейти в кабинет
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
                href="/rules"
              >
                Полные правила
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
                href="/events"
              >
                Соревнования
              </Link>
            </div>
          </article>

          <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/72">
              Коротко о правилах
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4">
                <p className="text-lg font-semibold">В зачет идут 3 лучших старта</p>
                <p className="mt-2 text-sm leading-7 text-white/82">
                  Можно участвовать чаще, но итог сезона считается по трем самым
                  сильным подтвержденным результатам.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4">
                <p className="text-lg font-semibold">Очки зависят от силы старта</p>
                <p className="mt-2 text-sm leading-7 text-white/82">
                  Важны категория дистанции и то, насколько близко вы к 5-му
                  месту в своей возрастной группе.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4">
                <p className="text-lg font-semibold">
                  В рейтинг попадают только подтвержденные результаты
                </p>
                <p className="mt-2 text-sm leading-7 text-white/82">
                  Поэтому при подаче результата обязательно нужна ссылка на
                  официальный протокол.
                </p>
              </div>
            </div>
            <Link
              className="mt-6 inline-flex text-sm font-semibold text-white underline-offset-4 hover:underline"
              href="/rules"
            >
              Открыть полные правила
            </Link>
          </article>
        </div>

        <section className="mt-6 grid gap-6 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-border bg-white/70 px-6 py-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Шаг 1</p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              Создайте профиль участника
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Укажите основные данные один раз, чтобы возвращаться в кабинет и
              видеть свои старты.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-white/70 px-6 py-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Шаг 2</p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              Подайте результат по протоколу
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Добавьте соревнование, дистанцию, время и ссылку на официальный
              протокол, чтобы результат можно было проверить.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-white/70 px-6 py-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Шаг 3</p>
            <p className="mt-3 text-xl font-semibold text-accent-strong">
              Следите за местом в сезоне
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              После подтверждения старт попадет в рейтинг, а в кабинете появится
              его статус и начисленные очки.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
