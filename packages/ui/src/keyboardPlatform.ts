const APPLE_PLATFORM_PATTERN = /Mac|iPhone|iPad|iPod/i;

export const isApplePlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return APPLE_PLATFORM_PATTERN.test(`${navigator.platform} ${navigator.userAgent}`);
};

export const formatOptionShortcut = (key: string | number): string =>
  isApplePlatform() ? `⌥${key}` : `Alt+${key}`;

export const formatOptionShortcutRange = (from: number, to: number): string =>
  isApplePlatform() ? `⌥${from}…⌥${to}` : `Alt+${from}…Alt+${to}`;
