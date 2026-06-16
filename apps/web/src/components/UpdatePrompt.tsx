import { useEffect, useState } from 'react';

const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

type Phase = 'hidden' | 'available' | 'downloading' | 'error';

/**
 * In-app auto-update prompt. Active only in the Tauri desktop build.
 * On startup it checks GitHub Releases (latest.json) for a newer version and,
 * if found, shows a popup. The user installs with one click; the app then
 * downloads, applies the update and relaunches.
 */
export function UpdatePrompt() {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [version, setVersion] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [pct, setPct] = useState(0);
  // The Tauri Update object (typed at runtime; package present only in desktop build).
  const [update, setUpdate] = useState<{
    version: string;
    body?: string;
    downloadAndInstall: (cb: (e: UpdateEvent) => void) => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (!isTauri) return;
    let cancelled = false;
    (async () => {
      try {
        // @ts-ignore - resolved at runtime in the Tauri desktop build
        const { check } = await import('@tauri-apps/plugin-updater');
        const found = await check();
        if (found && !cancelled) {
          setUpdate(found);
          setVersion(found.version);
          setNotes((found.body ?? '').trim());
          setPhase('available');
        }
      } catch {
        // No update server reachable / not a desktop build — stay hidden.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const install = async () => {
    if (!update) return;
    setPhase('downloading');
    try {
      let total = 0;
      let received = 0;
      await update.downloadAndInstall((e: UpdateEvent) => {
        if (e.event === 'Started') total = e.data?.contentLength ?? 0;
        else if (e.event === 'Progress') {
          received += e.data?.chunkLength ?? 0;
          if (total) setPct(Math.min(100, Math.round((received / total) * 100)));
        } else if (e.event === 'Finished') setPct(100);
      });
      // @ts-ignore - resolved at runtime in the Tauri desktop build
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch {
      setPhase('error');
    }
  };

  if (phase === 'hidden') return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] w-[340px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-surface p-4 text-text shadow-2xl"
      style={{ animation: 'tmc-up-rise .35s cubic-bezier(.22,.61,.36,1) both' }}
    >
      <style>{`@keyframes tmc-up-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {phase === 'error'
              ? 'Update failed'
              : `New version available${version ? ` · ${version}` : ''}`}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {phase === 'error'
              ? 'Could not install the update. Please try again later.'
              : phase === 'downloading'
                ? `Downloading… ${pct}%`
                : notes
                  ? notes.length > 120
                    ? `${notes.slice(0, 120)}…`
                    : notes
                  : 'A newer version of TMC Studio is ready to install.'}
          </p>

          {phase === 'downloading' && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {phase !== 'downloading' && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={install}
                className="inline-flex items-center justify-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-[#06231b] transition-colors hover:bg-accent-hover"
              >
                {phase === 'error' ? 'Retry' : 'Install & restart'}
              </button>
              <button
                onClick={() => setPhase('hidden')}
                className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
              >
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type UpdateEvent =
  | { event: 'Started'; data?: { contentLength?: number } }
  | { event: 'Progress'; data?: { chunkLength?: number } }
  | { event: 'Finished'; data?: undefined };

export default UpdatePrompt;
