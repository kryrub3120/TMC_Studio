import { Link } from "react-router-dom";
import { useTranslation } from "@tmc/ui";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4 text-text">
      <section className="w-full max-w-md text-center">
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-3xl font-bold">{t("pageNotFound.title")}</h1>
        <p className="mt-3 text-muted">{t("pageNotFound.description")}</p>
        <Link
          to="/board"
          className="mt-6 inline-flex rounded-md bg-accent px-4 py-2.5 font-semibold text-bg hover:bg-accent-hover"
        >
          {t("pageNotFound.cta")}
        </Link>
      </section>
    </main>
  );
}
