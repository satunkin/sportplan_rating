import { redirect } from "next/navigation";

import {
  changeDirectoryStatus,
  createDirectory,
} from "@/app/admin/management-actions";
import { listAdminDirectories } from "@/lib/cyclon-service";
import { hasAdminSession } from "@/lib/session";

export default async function AdminDirectoriesPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const { clubs, coaches } = await listAdminDirectories();

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-border pb-6">
          <p className="text-sm font-semibold text-accent">Админ · справочники</p>
          <h1 className="mt-2 text-4xl font-medium text-foreground">
            Клубы и тренеры
          </h1>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {[
            { type: "club" as const, title: "Клубы", items: clubs },
            { type: "coach" as const, title: "Тренеры", items: coaches },
          ].map((section) => (
            <article className="border border-border bg-white" key={section.type}>
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-2xl font-medium text-foreground">
                  {section.title}
                </h2>
              </div>
              <form action={createDirectory} className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-[1fr_1fr_auto]">
                <input name="type" type="hidden" value={section.type} />
                <input className="min-h-10 border border-border px-3" name="name" placeholder="Название" required />
                <input className="min-h-10 border border-border px-3" name="websiteUrl" placeholder="Сайт, если есть" type="url" />
                <button className="min-h-10 rounded-md bg-accent px-4 text-sm font-semibold text-white" type="submit">
                  Добавить
                </button>
              </form>
              <div className="divide-y divide-border">
                {section.items.map((item) => (
                  <div className="flex items-center justify-between gap-3 px-5 py-4" key={item.id}>
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted">
                        {item._count.athletes} атлетов · {item.status}
                      </p>
                    </div>
                    <form action={changeDirectoryStatus}>
                      <input name="type" type="hidden" value={section.type} />
                      <input name="id" type="hidden" value={item.id} />
                      <input name="restore" type="hidden" value={item.status === "ARCHIVED" ? "true" : "false"} />
                      <button className="text-sm font-semibold text-accent" type="submit">
                        {item.status === "ARCHIVED" ? "Восстановить" : "В архив"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
