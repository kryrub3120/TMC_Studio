import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_EXERCISE_DETAILS,
  DEFAULT_SESSION_PLAN_DETAILS,
  type ExerciseDetails,
  type SessionPlanDetails,
  type CoachingProfile,
} from "@tmc/core";
import { ProjectPreview, useTranslation, type ProjectItem } from "@tmc/ui";

type SaveStatus = "idle" | "saving" | "saved" | "unsaved" | "offline" | "error";

interface WorkspaceBaseProps {
  project: ProjectItem;
  projects: ProjectItem[];
  saveStatus?: SaveStatus;
  onOpenProjects: () => void;
  onBackToBoard: () => void;
  onOpenSettings: () => void;
  onOpenAccount: () => void;
  onRename: (name: string) => void;
  userInitials?: string;
}

interface ExerciseWorkspaceProps extends WorkspaceBaseProps {
  onUpdate: (details: ExerciseDetails, description?: string) => void;
  onAttachGraphic: (projectId: string) => void;
  onEditBoard: () => void;
}

interface SessionWorkspaceProps extends WorkspaceBaseProps {
  onUpdate: (details: SessionPlanDetails, description?: string) => void;
  coachingProfile?: CoachingProfile;
}

function WorkspaceHeader({
  project,
  saveStatus,
  onOpenProjects,
  onBackToBoard,
  onOpenSettings,
  onOpenAccount,
  onRename,
  onHelp,
  nameLabel,
  boardLabel,
  userInitials,
  actions,
}: WorkspaceBaseProps & {
  onHelp: () => void;
  nameLabel: string;
  boardLabel: string;
  actions?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(project.name);

  useEffect(() => setName(project.name), [project.name]);

  const commitName = () => {
    const next = name.trim();
    if (!next) setName(project.name);
    else if (next !== project.name) onRename(next);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-2 sm:px-4 print:hidden">
      <button
        type="button"
        onClick={onBackToBoard}
        className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-surface2 px-3 text-sm font-semibold text-text hover:border-accent"
      >
        <span aria-hidden="true">←</span>
        <span>{boardLabel}</span>
      </button>
      <button
        type="button"
        onClick={onOpenProjects}
        className="flex h-9 shrink-0 items-center rounded-md border border-border px-3 text-sm font-medium text-muted hover:border-accent hover:text-text"
      >
        {t("coaching.library")}
      </button>
      <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
        <span className="hidden shrink-0 text-xs font-medium text-muted lg:inline">{nameLabel}</span>
        <span aria-hidden="true" className="text-sm text-muted">
          ✎
        </span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="h-9 min-w-0 max-w-xl flex-1 rounded-md border border-border bg-bg px-3 text-sm font-semibold text-text outline-none focus:border-accent"
          aria-label={nameLabel}
        />
      </div>
      <span className={`hidden text-xs sm:block ${saveStatus === "error" ? "text-red-400" : "text-muted"}`}>
        {saveStatus === "saving"
          ? t("coaching.saving")
          : saveStatus === "error"
            ? t("coaching.saveError")
            : t("coaching.saved")}
      </span>
      {actions}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label={t("common.settings")}
        title={t("common.settings")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-lg text-muted hover:border-accent hover:text-text"
      >
        ⚙
      </button>
      <button
        type="button"
        onClick={onOpenAccount}
        aria-label={t("settings.account")}
        title={t("settings.account")}
        className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 px-2 text-xs font-bold text-accent hover:bg-accent/25"
      >
        {userInitials || "TM"}
      </button>
      <button
        type="button"
        onClick={onHelp}
        aria-label={t("coaching.help")}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-sm font-semibold text-muted hover:border-accent hover:text-accent"
        title={t("coaching.help")}
      >
        ?
      </button>
    </header>
  );
}

function WorkspaceGuide({ kind, onClose }: { kind: "exercise" | "session"; onClose: () => void }) {
  const { t } = useTranslation();
  const steps = [1, 2, 3].map((step) => ({
    title: t(`coaching.${kind}.guide.${step}.title`),
    body: t(`coaching.${kind}.guide.${step}.body`),
  }));

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 print:hidden"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-md border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">{t("coaching.quickStart")}</p>
            <h2 className="mt-1 text-xl font-semibold text-text">{t(`coaching.${kind}.guide.title`)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 text-xl text-muted hover:text-text"
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>
        <ol className="space-y-4 p-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-bg">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold text-text">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex justify-end border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg"
          >
            {t("coaching.start")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date" | "time";
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-surface2 px-3 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent print:border-black print:bg-white print:text-black"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-md border border-border bg-surface2 px-3 py-2 text-sm leading-6 text-text outline-none placeholder:text-muted/60 focus:border-accent print:border-black print:bg-white print:text-black"
      />
    </label>
  );
}

function pdfFilename(name: string, fallback: string) {
  return (
    name
      .trim()
      .replace(/[^a-z0-9ąćęłńóśźż_-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

async function nextPaint() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

type PdfCanvasWorker = {
  from: (source: HTMLElement) => PdfCanvasWorker;
  toCanvas: () => PdfCanvasWorker;
  get: (key: "canvas", callback: (canvas: HTMLCanvasElement) => void) => PdfCanvasWorker;
  catchExternal: (callback: (error: unknown) => void) => Promise<unknown>;
};

async function renderElementToCanvas(pdf: import("jspdf").jsPDF, element: HTMLElement) {
  const scale = 1.25;
  const width = Math.ceil(element.scrollWidth);
  const height = Math.ceil(element.scrollHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const createWorker = pdf.html.bind(pdf) as unknown as (
    source: HTMLElement,
    options: Record<string, unknown>,
  ) => PdfCanvasWorker;
  const worker = createWorker(element, {
    worker: true,
    html2canvas: {
      canvas,
      backgroundColor: "#ffffff",
      scale,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      useCORS: true,
      logging: false,
      imageTimeout: 15_000,
    },
  }) as unknown as PdfCanvasWorker;

  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    worker.from(element).toCanvas().get("canvas", resolve).catchExternal(reject);
  });
}

function addCanvasPagesToPdf(pdf: import("jspdf").jsPDF, canvas: HTMLCanvasElement) {
  const margin = 24;
  const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
  const pointsPerPixel = pageWidth / canvas.width;
  const pagePixelHeight = Math.max(1, Math.floor(pageHeight / pointsPerPixel));

  for (let offset = 0, page = 0; offset < canvas.height; page += 1) {
    const sliceHeight = Math.min(pagePixelHeight, canvas.height - offset);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const context = slice.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    if (page > 0) pdf.addPage();
    pdf.addImage(
      slice.toDataURL("image/jpeg", 0.94),
      "JPEG",
      margin,
      margin,
      pageWidth,
      sliceHeight * pointsPerPixel,
      undefined,
      "FAST",
    );
    offset += sliceHeight;
  }
}

function avoidPdfSectionSplits(root: HTMLElement, pdf: import("jspdf").jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth() - 48;
  const pageHeight = pdf.internal.pageSize.getHeight() - 48;
  const cssPageHeight = pageHeight * (root.scrollWidth / pageWidth);

  root.querySelectorAll<HTMLElement>("[data-pdf-keep]").forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const remaining = cssPageHeight - (top % cssPageHeight);
    if (height > remaining && height < cssPageHeight) {
      section.style.marginTop = `${remaining + 16}px`;
    }
  });
}

async function downloadElementAsPdf(source: HTMLElement, filename: string) {
  const clone = source.cloneNode(true) as HTMLElement;
  const sourceFields = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  const cloneFields = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");

  sourceFields.forEach((field, index) => {
    const clonedField = cloneFields[index];
    if (!clonedField) return;
    clonedField.value = field.value;
    clonedField.setAttribute("value", field.value);
    if (clonedField instanceof HTMLTextAreaElement) clonedField.textContent = field.value;
  });

  const sourceCanvases = source.querySelectorAll<HTMLCanvasElement>("canvas");
  const cloneCanvases = clone.querySelectorAll<HTMLCanvasElement>("canvas");
  sourceCanvases.forEach((canvas, index) => {
    const clonedCanvas = cloneCanvases[index];
    if (!clonedCanvas) return;
    const image = document.createElement("img");
    image.src = canvas.toDataURL("image/png");
    image.width = canvas.width;
    image.height = canvas.height;
    image.className = clonedCanvas.className;
    image.setAttribute("style", clonedCanvas.getAttribute("style") ?? "");
    clonedCanvas.replaceWith(image);
  });

  clone.querySelectorAll("button, [data-pdf-hide]").forEach((element) => element.remove());
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    position: "absolute",
    left: "0",
    top: `${window.scrollY}px`,
    width: "1200px",
    maxWidth: "none",
    boxSizing: "border-box",
    height: "auto",
    overflow: "visible",
    background: "#ffffff",
    color: "#0b1220",
    padding: "24px",
    pointerEvents: "none",
    zIndex: "2147483647",
    fontFamily: "Arial, Helvetica, sans-serif",
  });
  clone.style.setProperty("--color-bg", "#f6f8fc");
  clone.style.setProperty("--color-surface", "#ffffff");
  clone.style.setProperty("--color-surface2", "#f1f4fa");
  clone.style.setProperty("--color-border", "#aab6c8");
  clone.style.setProperty("--color-text", "#0b1220");
  clone.style.setProperty("--color-muted", "#516079");
  clone.style.setProperty("--color-accent", "#087f5b");
  document.body.appendChild(clone);

  try {
    if (clone.dataset.pdfKind === "exercise") {
      const grid = clone.querySelector<HTMLElement>("[data-exercise-grid]");
      const graphic = clone.querySelector<HTMLElement>("[data-exercise-graphic]");
      const preview = clone.querySelector<HTMLElement>("[data-exercise-preview]");
      const details = clone.querySelector<HTMLElement>("[data-exercise-details]");
      if (grid) grid.style.display = "block";
      if (graphic) {
        graphic.style.position = "static";
        graphic.style.borderRight = "0";
      }
      if (preview) {
        preview.style.width = "760px";
        preview.style.height = "430px";
        preview.style.minHeight = "0";
        preview.style.aspectRatio = "auto";
        preview.style.margin = "0 auto";
      }
      if (details) {
        details.style.display = "grid";
        details.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
        details.style.gap = "14px";
      }
      const summary = details?.firstElementChild as HTMLElement | null;
      if (summary) summary.style.gridColumn = "1 / -1";
    }

    clone.querySelectorAll<HTMLTextAreaElement>("textarea").forEach((textarea) => {
      textarea.style.height = `${Math.max(textarea.scrollHeight, 72)}px`;
      textarea.style.overflow = "hidden";
    });
    await document.fonts?.ready;
    await nextPaint();
    await nextPaint();

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    avoidPdfSectionSplits(clone, pdf);
    await nextPaint();
    const canvas = await renderElementToCanvas(pdf, clone);
    addCanvasPagesToPdf(pdf, canvas);
    pdf.save(`${filename}.pdf`);
  } finally {
    clone.remove();
  }
}

function GraphicPreview({
  project,
  projects,
  emptyLabel,
}: {
  project?: ProjectItem;
  projects: ProjectItem[];
  emptyLabel: string;
}) {
  return (
    <div
      data-exercise-preview
      className="relative flex aspect-[16/10] min-h-[240px] items-center justify-center overflow-hidden rounded-md border border-border bg-bg"
    >
      {project ? (
        <ProjectPreview project={project} projects={projects} />
      ) : (
        <div className="px-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface2 text-2xl text-muted">
            ▧
          </div>
          <p className="text-sm text-muted">{emptyLabel}</p>
        </div>
      )}
    </div>
  );
}

export function ExerciseWorkspace({
  project,
  projects,
  saveStatus,
  onOpenProjects,
  onBackToBoard,
  onOpenSettings,
  onOpenAccount,
  onRename,
  onUpdate,
  onAttachGraphic,
  onEditBoard,
  userInitials,
}: ExerciseWorkspaceProps) {
  const { t } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const graphics = useMemo(() => projects.filter((item) => (item.projectType ?? "graphic") === "graphic"), [projects]);
  const details = { ...DEFAULT_EXERCISE_DETAILS, ...project.exerciseDetails };
  const detailsRef = useRef(details);
  detailsRef.current = details;
  const source = graphics.find((item) => item.id === details.sourceGraphicProjectId);

  useEffect(() => {
    if (localStorage.getItem("tmc-exercise-guide-seen") !== "1") setShowGuide(true);
  }, []);

  const update = (patch: Partial<ExerciseDetails>, description = project.description) => {
    const next = { ...detailsRef.current, ...patch };
    detailsRef.current = next;
    onUpdate(next, description);
  };

  const closeGuide = () => {
    localStorage.setItem("tmc-exercise-guide-seen", "1");
    setShowGuide(false);
  };

  const downloadPdf = async () => {
    if (!pdfContentRef.current || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setPdfError(false);
    try {
      await downloadElementAsPdf(pdfContentRef.current, pdfFilename(project.name, "cwiczenie"));
    } catch (error) {
      console.error("[Coaching PDF] Exercise export failed", error);
      setPdfError(true);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div
      className="flex h-dvh min-h-0 flex-col bg-bg text-text"
      data-testid="exercise-workspace"
      data-project-id={project.id}
    >
      <WorkspaceHeader
        project={project}
        projects={projects}
        saveStatus={saveStatus}
        onOpenProjects={onOpenProjects}
        onBackToBoard={onBackToBoard}
        onOpenSettings={onOpenSettings}
        onOpenAccount={onOpenAccount}
        onRename={onRename}
        onHelp={() => setShowGuide(true)}
        nameLabel={t("coaching.exercise.nameLabel")}
        boardLabel={t("coaching.backToBoard")}
        userInitials={userInitials}
        actions={
          <button
            type="button"
            onClick={onEditBoard}
            className="hidden h-9 rounded-md bg-accent px-4 text-sm font-semibold text-bg lg:block"
          >
            {t("coaching.exercise.drawOnBoard")}
          </button>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto print:overflow-visible">
        <div
          ref={pdfContentRef}
          data-pdf-kind="exercise"
          className="mx-auto max-w-[1440px] print:max-w-none print:bg-white print:text-black"
        >
          <div
            data-pdf-hide
            className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-4 py-3 print:hidden sm:px-6"
          >
            <button
              type="button"
              onClick={onEditBoard}
              className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text hover:border-accent"
            >
              {t("coaching.exercise.drawOnBoard")}
            </button>
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={isDownloadingPdf}
              className="h-10 rounded-md bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
            >
              {isDownloadingPdf ? t("coaching.session.downloadingPdf") : t("coaching.exercise.downloadPdf")}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text hover:border-accent"
            >
              {t("coaching.exercise.print")}
            </button>
          </div>
          {pdfError && (
            <p className="px-4 pt-3 text-sm text-red-400 print:hidden sm:px-6">{t("coaching.exercise.pdfError")}</p>
          )}
          <div
            data-exercise-grid
            className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] print:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]"
          >
            <section
              data-exercise-graphic
              className="border-b border-border p-4 sm:p-6 lg:sticky lg:top-0 lg:h-fit lg:border-b-0 lg:border-r"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-accent print:text-black">
                    {t("coaching.exercise.workspaceTitle")}
                  </p>
                  <h1 className="mt-1 text-xl font-semibold print:text-black">{project.name}</h1>
                </div>
                <button
                  type="button"
                  onClick={onEditBoard}
                  className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:border-accent sm:hidden"
                >
                  {t("coaching.exercise.editGraphicShort")}
                </button>
              </div>
              <GraphicPreview
                project={source ?? project}
                projects={projects}
                emptyLabel={t("coaching.exercise.noGraphic")}
              />
              <div data-pdf-hide className="mt-4 flex items-center justify-between gap-3 print:hidden">
                <p className="text-xs font-semibold text-muted">{t("coaching.exercise.chooseGraphic")}</p>
                <button
                  type="button"
                  onClick={onEditBoard}
                  className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:border-accent"
                >
                  {t("coaching.exercise.openBoard")}
                </button>
              </div>
              <div
                data-pdf-hide
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 print:hidden"
                aria-label={t("coaching.exercise.chooseGraphic")}
                data-testid="exercise-graphic-picker"
              >
                {graphics.map((graphic) => {
                  const isSelected = graphic.id === details.sourceGraphicProjectId;
                  return (
                    <button
                      key={graphic.id}
                      type="button"
                      data-testid="exercise-graphic-option"
                      onClick={() => onAttachGraphic(graphic.id)}
                      className={`overflow-hidden rounded-md border bg-surface text-left transition-colors ${isSelected ? "border-accent ring-1 ring-accent" : "border-border hover:border-muted"}`}
                      aria-pressed={isSelected}
                      aria-label={graphic.name}
                    >
                      <span className="block aspect-[16/10] overflow-hidden bg-bg">
                        <ProjectPreview project={graphic} projects={projects} />
                      </span>
                      <span className="block truncate px-2.5 py-2 text-xs font-medium text-text">{graphic.name}</span>
                    </button>
                  );
                })}
                {graphics.length === 0 && (
                  <p className="col-span-full rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                    {t("coaching.exercise.noGraphic")}
                  </p>
                )}
              </div>
            </section>

            <section data-exercise-details className="space-y-5 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={t("coaching.exercise.duration")}
                  type="number"
                  value={details.durationMinutes}
                  onChange={(value) => update({ durationMinutes: Math.max(1, Number(value) || 1) })}
                />
                <Field
                  label={t("coaching.exercise.players")}
                  value={details.players}
                  onChange={(value) => update({ players: value })}
                  placeholder="10-20"
                />
              </div>
              <Field
                label={t("coaching.exercise.category")}
                value={details.category}
                onChange={(value) => update({ category: value })}
                placeholder={t("coaching.exercise.categoryPlaceholder")}
              />
              <TextArea
                label={t("coaching.exercise.objective")}
                value={details.objective}
                onChange={(value) => update({ objective: value })}
                placeholder={t("coaching.exercise.objectivePlaceholder")}
                rows={3}
              />
              <TextArea
                label={t("coaching.exercise.description")}
                value={project.description ?? ""}
                onChange={(value) => onUpdate(details, value)}
                placeholder={t("coaching.exercise.descriptionPlaceholder")}
              />
              <TextArea
                label={t("coaching.exercise.organization")}
                value={details.organization}
                onChange={(value) => update({ organization: value })}
              />
              <TextArea
                label={t("coaching.exercise.coachingPoints")}
                value={details.coachingPoints}
                onChange={(value) => update({ coachingPoints: value })}
              />
              <TextArea
                label={t("coaching.exercise.progression")}
                value={details.progression}
                onChange={(value) => update({ progression: value })}
                rows={3}
              />
              <TextArea
                label={t("coaching.exercise.equipment")}
                value={details.equipment}
                onChange={(value) => update({ equipment: value })}
                rows={2}
              />
            </section>
          </div>
        </div>
      </main>
      {showGuide && <WorkspaceGuide kind="exercise" onClose={closeGuide} />}
    </div>
  );
}

export function SessionWorkspace({
  project,
  projects,
  saveStatus,
  onOpenProjects,
  onBackToBoard,
  onOpenSettings,
  onOpenAccount,
  onRename,
  onUpdate,
  coachingProfile,
  userInitials,
}: SessionWorkspaceProps) {
  const { t } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [sessionName, setSessionName] = useState(project.name);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const details: SessionPlanDetails = {
    ...DEFAULT_SESSION_PLAN_DETAILS,
    ...project.sessionPlanDetails,
    squadGroups: project.sessionPlanDetails?.squadGroups ?? [],
    exercises: project.sessionPlanDetails?.exercises ?? [],
    staffAssignments: project.sessionPlanDetails?.staffAssignments ?? [],
  };
  const detailsRef = useRef(details);
  detailsRef.current = details;
  const exercises = useMemo(() => projects.filter((item) => item.projectType === "exercise"), [projects]);

  useEffect(() => setSessionName(project.name), [project.name]);

  const commitSessionName = () => {
    const next = sessionName.trim();
    if (!next) setSessionName(project.name);
    else if (next !== project.name) onRename(next);
  };
  const filteredExercises = exercises.filter((item) => item.name.toLowerCase().includes(exerciseQuery.toLowerCase()));
  const totalDuration = details.exercises.reduce((sum, item) => sum + item.durationMinutes, 0);
  useEffect(() => {
    if (localStorage.getItem("tmc-session-guide-seen") !== "1") setShowGuide(true);
  }, []);

  const update = (patch: Partial<SessionPlanDetails>, description = project.description) => {
    const next = { ...detailsRef.current, ...patch };
    detailsRef.current = next;
    onUpdate(next, description);
  };

  const addExercise = (exercise: ProjectItem) => {
    update({
      exercises: [
        ...detailsRef.current.exercises,
        {
          id: crypto.randomUUID(),
          projectId: exercise.id,
          name: exercise.name,
          durationMinutes: exercise.exerciseDetails?.durationMinutes ?? 15,
          notes: "",
        },
      ],
    });
  };

  const updateExercise = (id: string, patch: Partial<SessionPlanDetails["exercises"][number]>) => {
    update({
      exercises: detailsRef.current.exercises.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= detailsRef.current.exercises.length) return;
    const next = [...detailsRef.current.exercises];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    update({ exercises: next });
  };

  const closeGuide = () => {
    localStorage.setItem("tmc-session-guide-seen", "1");
    setShowGuide(false);
  };

  const downloadPdf = async () => {
    if (!pdfContentRef.current || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setPdfError(false);

    try {
      await downloadElementAsPdf(pdfContentRef.current, pdfFilename(sessionName, "konspekt"));
    } catch (error) {
      console.error("[Coaching PDF] Session export failed", error);
      setPdfError(true);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div
      className="flex h-dvh min-h-0 flex-col bg-bg text-text"
      data-testid="session-workspace"
      data-project-id={project.id}
    >
      <WorkspaceHeader
        project={project}
        projects={projects}
        saveStatus={saveStatus}
        onOpenProjects={onOpenProjects}
        onBackToBoard={onBackToBoard}
        onOpenSettings={onOpenSettings}
        onOpenAccount={onOpenAccount}
        onRename={onRename}
        onHelp={() => setShowGuide(true)}
        nameLabel={t("coaching.session.nameLabel")}
        boardLabel={t("coaching.backToBoard")}
        userInitials={userInitials}
      />

      <main className="min-h-0 flex-1 overflow-y-auto print:overflow-visible">
        <div ref={pdfContentRef} className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 print:max-w-none print:p-0">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:mb-3">
            <div className="flex min-w-0 items-center gap-3">
              {coachingProfile?.logoDataUrl && (
                <img
                  src={coachingProfile.logoDataUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 object-contain print:h-14 print:w-14"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-accent print:text-black">
                  {t("coaching.session.eyebrow")}
                </p>
                <input
                  value={sessionName}
                  onChange={(event) => setSessionName(event.target.value)}
                  onBlur={commitSessionName}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  aria-label={t("coaching.session.nameLabel")}
                  className="mt-1 h-11 w-full min-w-0 max-w-2xl rounded-md border border-border bg-surface px-3 text-xl font-semibold text-text outline-none focus:border-accent print:border-0 print:bg-white print:px-0 print:text-black"
                />
                {coachingProfile?.clubName && (
                  <p className="mt-1 truncate text-xs text-muted print:text-black">{coachingProfile.clubName}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-end gap-2 print:block print:text-right">
              <div className="mr-2 text-right">
                <p className="text-xs text-muted print:text-black">{t("coaching.session.totalTime")}</p>
                <p className="text-2xl font-semibold text-accent print:text-black">{totalDuration} min</p>
              </div>
              <button
                type="button"
                data-pdf-hide
                onClick={() => void downloadPdf()}
                disabled={isDownloadingPdf}
                className="h-10 rounded-md bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50 print:hidden"
              >
                {isDownloadingPdf ? t("coaching.session.downloadingPdf") : t("coaching.session.downloadPdf")}
              </button>
              <button
                type="button"
                data-pdf-hide
                onClick={() => window.print()}
                className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text hover:border-accent print:hidden"
              >
                {t("coaching.session.print")}
              </button>
            </div>
          </div>
          {pdfError && <p className="mb-4 text-sm text-red-400 print:hidden">{t("coaching.session.pdfError")}</p>}

          <section className="border-y border-border bg-surface py-4 print:border-black print:bg-white">
            <div className="grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field
                label={t("coaching.session.date")}
                type="date"
                value={details.date}
                onChange={(value) => update({ date: value })}
              />
              <Field
                label={t("coaching.session.microcycleDay")}
                value={details.microcycleDay}
                onChange={(value) => update({ microcycleDay: value })}
                placeholder="MD +2"
              />
              <Field
                label={t("coaching.session.venue")}
                value={details.venue}
                onChange={(value) => update({ venue: value })}
              />
              <Field
                label={t("coaching.session.startTime")}
                type="time"
                value={details.startTime}
                onChange={(value) => update({ startTime: value })}
              />
              <div>
                <Field
                  label={t("coaching.session.staff")}
                  value={details.staff}
                  onChange={(value) => update({ staff: value })}
                  placeholder="MH, KR, PC"
                />
                {coachingProfile?.staff.length ? (
                  <div className="mt-2 flex flex-wrap gap-1 print:hidden">
                    {coachingProfile.staff.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          const current = detailsRef.current.staff
                            .split(",")
                            .map((name) => name.trim())
                            .filter(Boolean);
                          const exists = current.includes(member.name);
                          update({
                            staff: (exists
                              ? current.filter((name) => name !== member.name)
                              : [...current, member.name]
                            ).join(", "),
                          });
                        }}
                        className={`rounded-full border px-2 py-1 text-[10px] font-medium ${details.staff.includes(member.name) ? "border-accent bg-accent/15 text-accent" : "border-border text-muted hover:border-accent"}`}
                        title={member.role}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-px border-b border-border bg-border md:grid-cols-3 print:grid-cols-3 print:border-black print:bg-black">
            <div className="bg-bg p-4 print:bg-white">
              <TextArea
                label={t("coaching.session.objectives")}
                value={details.objectives}
                onChange={(value) => update({ objectives: value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 bg-bg p-4 print:bg-white">
              <Field label="TD" value={details.totalDistance} onChange={(value) => update({ totalDistance: value })} />
              <Field
                label="HSD"
                value={details.highSpeedDistance}
                onChange={(value) => update({ highSpeedDistance: value })}
              />
              <Field
                label="Sprint"
                value={details.sprintDistance}
                onChange={(value) => update({ sprintDistance: value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 bg-bg p-4 print:bg-white">
              <Field
                label={t("coaching.session.microcycle")}
                value={details.microcycle}
                onChange={(value) => update({ microcycle: value })}
              />
              <Field
                label={t("coaching.session.mesocycle")}
                value={details.mesocycle}
                onChange={(value) => update({ mesocycle: value })}
              />
              <Field
                label={t("coaching.session.playerCount")}
                value={details.playerCount}
                onChange={(value) => update({ playerCount: value })}
              />
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] print:mt-3 print:block">
            <aside data-pdf-hide className="border border-border bg-surface p-4 print:hidden">
              <h2 className="font-semibold">{t("coaching.session.exerciseLibrary")}</h2>
              <p className="mt-1 text-xs leading-5 text-muted">{t("coaching.session.exerciseLibraryHint")}</p>
              <input
                value={exerciseQuery}
                onChange={(event) => setExerciseQuery(event.target.value)}
                placeholder={t("coaching.session.searchExercises")}
                className="mt-4 h-10 w-full rounded-md border border-border bg-surface2 px-3 text-sm outline-none focus:border-accent"
              />
              <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => addExercise(exercise)}
                    className="flex w-full items-center gap-3 rounded-md border border-border bg-bg p-2 text-left hover:border-accent"
                  >
                    <span className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-surface2 text-muted">
                      <ProjectPreview project={exercise} projects={projects} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{exercise.name}</span>
                      <span className="text-xs text-muted">{exercise.exerciseDetails?.durationMinutes ?? 15} min</span>
                    </span>
                    <span className="text-lg text-accent">+</span>
                  </button>
                ))}
                {filteredExercises.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted">{t("coaching.session.noExercises")}</p>
                )}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold print:text-black">{t("coaching.session.trainingContent")}</h2>
                <span className="text-sm text-muted print:text-black">
                  {details.exercises.length} · {totalDuration} min
                </span>
              </div>
              {details.exercises.length === 0 ? (
                <div className="flex min-h-64 items-center justify-center border border-dashed border-border bg-surface px-6 text-center text-sm text-muted print:hidden">
                  {t("coaching.session.emptyPlan")}
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2 print:grid-cols-2">
                  {details.exercises.map((item, index) => {
                    const source = projects.find((candidate) => candidate.id === item.projectId);
                    return (
                      <article
                        key={item.id}
                        className="break-inside-avoid border border-border bg-surface print:border-black print:bg-white"
                      >
                        <div className="flex items-center gap-2 border-b border-border p-3 print:border-black">
                          <span className="text-xs font-semibold text-accent print:text-black">{index + 1}</span>
                          <input
                            value={item.name}
                            onChange={(event) =>
                              updateExercise(item.id, {
                                name: event.target.value,
                              })
                            }
                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none print:text-black"
                          />
                          <input
                            type="number"
                            min={1}
                            value={item.durationMinutes}
                            onChange={(event) =>
                              updateExercise(item.id, {
                                durationMinutes: Math.max(1, Number(event.target.value) || 1),
                              })
                            }
                            className="w-14 rounded border border-border bg-surface2 px-2 py-1 text-right text-xs print:border-0 print:bg-white print:text-black"
                          />
                          <span className="text-xs text-muted print:text-black">min</span>
                          <div className="flex print:hidden">
                            <button
                              type="button"
                              onClick={() => moveExercise(index, -1)}
                              disabled={index === 0}
                              className="h-7 w-7 disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveExercise(index, 1)}
                              disabled={index === details.exercises.length - 1}
                              className="h-7 w-7 disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                update({
                                  exercises: details.exercises.filter((candidate) => candidate.id !== item.id),
                                })
                              }
                              className="h-7 w-7 text-red-400"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="grid min-h-[210px] sm:grid-cols-[44%_56%] print:grid-cols-[44%_56%]">
                          <div className="min-h-[180px] overflow-hidden border-b border-border bg-bg sm:border-b-0 sm:border-r print:border-b-0 print:border-r print:border-black print:bg-white">
                            {source ? (
                              <ProjectPreview project={source} projects={projects} />
                            ) : (
                              <div className="flex h-full min-h-[180px] items-center justify-center text-2xl text-muted">
                                ▧
                              </div>
                            )}
                          </div>
                          <textarea
                            value={item.notes}
                            onChange={(event) =>
                              updateExercise(item.id, {
                                notes: event.target.value,
                              })
                            }
                            placeholder={t("coaching.session.exerciseNotes")}
                            className="min-h-[180px] w-full resize-none bg-transparent p-3 text-sm leading-6 text-text outline-none placeholder:text-muted/60 print:text-black"
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section data-pdf-keep className="mt-6 border-t border-border pt-5 print:mt-4 print:border-black">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold print:text-black">{t("coaching.session.squad")}</h2>
              <button
                type="button"
                onClick={() =>
                  update({
                    squadGroups: [
                      ...details.squadGroups,
                      {
                        id: crypto.randomUUID(),
                        label: t("coaching.session.newGroup"),
                        players: "",
                      },
                    ],
                  })
                }
                className="rounded-md border border-border px-3 py-2 text-sm hover:border-accent print:hidden"
              >
                + {t("coaching.session.addGroup")}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
              {details.squadGroups.map((group) => (
                <div key={group.id} className="border border-border bg-surface p-3 print:border-black print:bg-white">
                  <div className="flex gap-2">
                    <input
                      value={group.label}
                      onChange={(event) =>
                        update({
                          squadGroups: details.squadGroups.map((candidate) =>
                            candidate.id === group.id ? { ...candidate, label: event.target.value } : candidate,
                          ),
                        })
                      }
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none print:text-black"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          squadGroups: details.squadGroups.filter((candidate) => candidate.id !== group.id),
                        })
                      }
                      className="text-red-400 print:hidden"
                    >
                      ×
                    </button>
                  </div>
                  <textarea
                    value={group.players}
                    onChange={(event) =>
                      update({
                        squadGroups: details.squadGroups.map((candidate) =>
                          candidate.id === group.id ? { ...candidate, players: event.target.value } : candidate,
                        ),
                      })
                    }
                    rows={4}
                    className="mt-2 w-full resize-y bg-transparent text-sm leading-5 outline-none print:text-black"
                    placeholder={t("coaching.session.playersPlaceholder")}
                  />
                </div>
              ))}
            </div>
          </section>

          <section data-pdf-keep className="mt-6 border-t border-border pt-5 print:mt-4 print:border-black">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold print:text-black">{t("coaching.session.workOrganization")}</h2>
              <button
                type="button"
                onClick={() =>
                  update({
                    staffAssignments: [
                      ...details.staffAssignments,
                      {
                        id: crypto.randomUUID(),
                        staffName: "",
                        beforeTraining: "",
                        exerciseResponsibilities: details.exercises.map(() => ""),
                      },
                    ],
                  })
                }
                className="rounded-md border border-border px-3 py-2 text-sm hover:border-accent print:hidden"
              >
                + {t("coaching.session.addStaff")}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm print:min-w-0 print:text-xs">
                <thead>
                  <tr>
                    {[
                      t("coaching.session.coach"),
                      t("coaching.session.beforeTraining"),
                      ...details.exercises.map((_, index) => `${t("coaching.session.exerciseShort")} ${index + 1}`),
                    ].map((label) => (
                      <th
                        key={label}
                        className="border border-border bg-surface2 p-2 text-left font-medium print:border-black print:bg-white print:text-black"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.staffAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="border border-border p-1 print:border-black">
                        <input
                          value={assignment.staffName}
                          onChange={(event) =>
                            update({
                              staffAssignments: details.staffAssignments.map((candidate) =>
                                candidate.id === assignment.id
                                  ? {
                                      ...candidate,
                                      staffName: event.target.value,
                                    }
                                  : candidate,
                              ),
                            })
                          }
                          className="w-full bg-transparent p-1 outline-none print:text-black"
                        />
                      </td>
                      <td className="border border-border p-1 print:border-black">
                        <input
                          value={assignment.beforeTraining}
                          onChange={(event) =>
                            update({
                              staffAssignments: details.staffAssignments.map((candidate) =>
                                candidate.id === assignment.id
                                  ? {
                                      ...candidate,
                                      beforeTraining: event.target.value,
                                    }
                                  : candidate,
                              ),
                            })
                          }
                          className="w-full bg-transparent p-1 outline-none print:text-black"
                        />
                      </td>
                      {details.exercises.map((_, exerciseIndex) => (
                        <td key={exerciseIndex} className="border border-border p-1 print:border-black">
                          <input
                            value={assignment.exerciseResponsibilities[exerciseIndex] ?? ""}
                            onChange={(event) => {
                              const responsibilities = [...assignment.exerciseResponsibilities];
                              responsibilities[exerciseIndex] = event.target.value;
                              update({
                                staffAssignments: details.staffAssignments.map((candidate) =>
                                  candidate.id === assignment.id
                                    ? {
                                        ...candidate,
                                        exerciseResponsibilities: responsibilities,
                                      }
                                    : candidate,
                                ),
                              });
                            }}
                            className="w-full bg-transparent p-1 outline-none print:text-black"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            data-pdf-keep
            className="mt-6 grid gap-4 border-t border-border pt-5 md:grid-cols-3 print:mt-4 print:grid-cols-3 print:border-black"
          >
            <TextArea
              label={t("coaching.session.organizationNotes")}
              value={details.organizationNotes}
              onChange={(value) => update({ organizationNotes: value })}
              rows={4}
            />
            <TextArea
              label={t("coaching.session.equipmentNotes")}
              value={details.equipmentNotes}
              onChange={(value) => update({ equipmentNotes: value })}
              rows={4}
            />
            <TextArea
              label={t("coaching.session.lineupNotes")}
              value={details.lineupNotes}
              onChange={(value) => update({ lineupNotes: value })}
              rows={4}
            />
          </section>
        </div>
      </main>
      {showGuide && <WorkspaceGuide kind="session" onClose={closeGuide} />}
    </div>
  );
}
