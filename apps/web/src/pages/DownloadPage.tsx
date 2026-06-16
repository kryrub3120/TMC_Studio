import { useEffect, useState } from 'react';

const GITHUB_REPO = 'kryrub3120/TMC_Studio';
const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

type Asset = { name: string; browser_download_url: string; size?: number };
type Resolved = { url: string | null; size: number | null };
type Links = { mac: Resolved; windows: Resolved; version: string | null };

type OS = 'mac' | 'windows' | 'other';

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'other';
  const ua = `${navigator.userAgent} ${navigator.platform}`;
  if (/Mac|iPhone|iPad/i.test(ua)) return 'mac';
  if (/Win/i.test(ua)) return 'windows';
  return 'other';
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

const AppleGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden>
    <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 3-.78.9-2.05 1.6-3.13 1.5-.13-1.07.42-2.2 1.07-2.94.74-.84 2.05-1.46 3.18-1.56zM20.7 17.5c-.55 1.27-.82 1.83-1.53 2.96-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.93-1.01-4.02-1-2.09.01-2.52 1.02-4.06 1-1.73-.02-3.06-1.78-4.05-3.34C-.06 18.4-.34 14.07 1.31 11.45c1.05-1.68 2.7-2.66 4.26-2.66 1.59 0 2.59 1.02 3.9 1.02 1.27 0 2.05-1.02 3.89-1.02 1.39 0 2.86.76 3.91 2.06-3.44 1.88-2.88 6.79.43 8.65z" />
  </svg>
);

const WindowsGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden>
    <path d="M0 3.45 9.75 2.1v9.4H0zM10.95 1.93 24 0v11.4H10.95zM0 12.6h9.75V22L0 20.55zM10.95 12.6H24V24l-13.05-1.93z" />
  </svg>
);

function PlatformCard({
  os,
  recommended,
  glyph,
  name,
  meta,
  link,
  loading,
}: {
  os: OS;
  recommended: boolean;
  glyph: React.ReactNode;
  name: string;
  meta: string;
  link: Resolved;
  loading: boolean;
}) {
  const href = link.url ?? RELEASES_URL;
  const size = fmtSize(link.size);
  return (
    <div
      className={[
        'group relative flex flex-col items-center rounded-2xl border p-8 text-center',
        'transition-all duration-300 hover:-translate-y-1',
        recommended
          ? 'border-accent/60 bg-surface shadow-lg ring-1 ring-accent/30'
          : 'border-border bg-surface/60 hover:border-accent/40 hover:bg-surface',
      ].join(' ')}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-semibold text-[#06231b] shadow-md">
          Recommended for your {os === 'mac' ? 'Mac' : 'PC'}
        </span>
      )}

      <div
        className={[
          'mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300',
          recommended
            ? 'bg-accent/15 text-accent'
            : 'bg-surface2 text-text group-hover:text-accent',
        ].join(' ')}
      >
        {glyph}
      </div>

      <h2 className="text-xl font-semibold text-text">{name}</h2>
      <p className="mt-1 text-sm text-muted">{meta}</p>

      <a
        href={href}
        className={[
          'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold',
          'transition-all duration-200 active:scale-[0.98]',
          recommended
            ? 'bg-accent text-[#06231b] shadow-md hover:bg-accent-hover hover:shadow-lg'
            : 'border border-border bg-surface2 text-text hover:border-accent/50 hover:text-accent',
        ].join(' ')}
      >
        {loading ? (
          'Loading…'
        ) : link.url ? (
          <>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
            </svg>
            Download{size ? ` · ${size}` : ''}
          </>
        ) : (
          'View releases'
        )}
      </a>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export function DownloadPage() {
  const [links, setLinks] = useState<Links>({
    mac: { url: null, size: null },
    windows: { url: null, size: null },
    version: null,
  });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const os = detectOS();

  useEffect(() => {
    let active = true;
    fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { tag_name?: string; assets?: Asset[] }) => {
        if (!active) return;
        const assets = data.assets ?? [];
        const find = (re: RegExp): Resolved => {
          const a = assets.find((x) => re.test(x.name));
          return { url: a?.browser_download_url ?? null, size: a?.size ?? null };
        };
        const win = (() => {
          const exe = assets.find((a) => /-setup\.exe$/i.test(a.name)) ?? assets.find((a) => /\.exe$/i.test(a.name)) ?? assets.find((a) => /\.msi$/i.test(a.name));
          return { url: exe?.browser_download_url ?? null, size: exe?.size ?? null };
        })();
        setLinks({ mac: find(/\.dmg$/i), windows: win, version: data.tag_name ?? null });
      })
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-text">
      <style>{`
        @keyframes tmc-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tmc-glow { 0%,100% { opacity: .5; } 50% { opacity: .9; } }
        .tmc-rise { animation: tmc-rise .6s cubic-bezier(.22,.61,.36,1) both; }
        .tmc-d1 { animation-delay: .05s; } .tmc-d2 { animation-delay: .14s; }
        .tmc-d3 { animation-delay: .22s; } .tmc-d4 { animation-delay: .3s; }
      `}</style>

      {/* Ambient pitch background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-[-10rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
          style={{ animation: 'tmc-glow 6s ease-in-out infinite' }}
        />
        <svg className="absolute left-1/2 top-24 w-[1100px] max-w-none -translate-x-1/2 opacity-[0.06]" viewBox="0 0 1100 600" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="1096" height="596" rx="8" />
          <line x1="550" y1="2" x2="550" y2="598" />
          <circle cx="550" cy="300" r="90" />
          <circle cx="550" cy="300" r="4" fill="currentColor" />
          <rect x="2" y="180" width="150" height="240" />
          <rect x="948" y="180" width="150" height="240" />
        </svg>
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-20">
        {/* Brand */}
        <div className="tmc-rise tmc-d1 mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e40af]">
            <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
              <circle cx="16" cy="14" r="7" fill="none" stroke="#fff" strokeWidth="1.5" />
              <path d="M16 21 L18 25 L14 25 Z" fill="#fff" />
              <path d="M21 12 L26 9 L24 14 Z" fill="#fff" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-wide text-muted">TMC STUDIO</span>
        </div>

        {/* Hero */}
        <span className="tmc-rise tmc-d1 mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Desktop app · macOS &amp; Windows
        </span>
        <h1 className="tmc-rise tmc-d2 max-w-2xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          The tactical board,
          <br className="hidden sm:block" /> now on your desktop
        </h1>
        <p className="tmc-rise tmc-d2 mt-4 max-w-xl text-center text-base leading-relaxed text-muted">
          Build drills, animate plays and export to PNG, GIF or PDF — in a fast,
          native window that works offline.
        </p>

        {/* Download cards */}
        <div className="tmc-rise tmc-d3 mt-12 grid w-full gap-5 sm:grid-cols-2">
          <PlatformCard
            os="mac"
            recommended={os === 'mac'}
            glyph={<AppleGlyph />}
            name="macOS"
            meta="Apple Silicon & Intel · .dmg"
            link={links.mac}
            loading={loading}
          />
          <PlatformCard
            os="windows"
            recommended={os === 'windows'}
            glyph={<WindowsGlyph />}
            name="Windows"
            meta="Windows 10 & 11 · installer"
            link={links.windows}
            loading={loading}
          />
        </div>

        {/* Version / fallback line */}
        <div className="tmc-rise tmc-d3 mt-5 flex items-center gap-3 text-xs text-muted">
          {links.version && (
            <span className="rounded-full border border-border bg-surface2 px-2.5 py-1 font-medium">
              {links.version}
            </span>
          )}
          <a className="underline-offset-2 hover:text-accent hover:underline" href={RELEASES_URL}>
            All releases &amp; changelog
          </a>
        </div>

        {failed && (
          <p className="tmc-rise mt-4 text-center text-sm text-muted">
            Couldn’t load the latest version automatically — the buttons link to the releases page.
          </p>
        )}

        {/* Feature strip */}
        <div className="tmc-rise tmc-d4 mt-16 grid w-full gap-8 border-t border-border pt-10 sm:grid-cols-3">
          <Feature
            title="Native & fast"
            body="Runs in a lightweight native window — no browser tab, no clutter."
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M13 2 3 14h7l-1 8 10-12h-7z" /></svg>}
          />
          <Feature
            title="Works offline"
            body="Open it anywhere — the pitch loads with or without a connection."
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5a7 7 0 0 1 13-3.5" /><path d="M19 11.5a7 7 0 0 1-13 3.5" /><path d="M12 7v5l3 2" /></svg>}
          />
          <Feature
            title="Free to use"
            body="The desktop app is included — same account, same projects."
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m20 6-11 11-5-5" /></svg>}
          />
        </div>

        {/* Web fallback */}
        <p className="tmc-rise tmc-d4 mt-12 text-center text-sm text-muted">
          Prefer the browser?{' '}
          <a className="font-medium text-accent underline-offset-2 hover:underline" href="/">
            Open TMC Studio on the web
          </a>
        </p>
      </div>
    </div>
  );
}

export default DownloadPage;
