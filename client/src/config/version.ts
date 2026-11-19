// Version info injected at build time by Vite (`define` in vite.config.ts).
// The `typeof` guards keep this module usable where nothing is injected (Jest).

/** Product name, shown in the About modal and in the copied version summary. */
export const APP_NAME = 'Token Register';

export type ReleaseChannel = 'production' | 'demo' | 'development';

export interface AppVersionInfo {
  version: string;
  /** Short commit hash. Only exposed outside production. */
  commit?: string;
  channel: ReleaseChannel;
}

const CHANNELS: readonly ReleaseChannel[] = ['production', 'demo', 'development'];

export function toReleaseChannel(value: string | undefined): ReleaseChannel {
  return CHANNELS.find((channel) => channel === value) ?? 'development';
}

export function buildVersionInfo(
  version: string | undefined,
  commit: string | undefined,
  channel: string | undefined
): AppVersionInfo {
  const releaseChannel = toReleaseChannel(channel);
  const info: AppVersionInfo = { version: version || '0.0.0', channel: releaseChannel };
  if (releaseChannel !== 'production' && commit) {
    info.commit = commit;
  }
  return info;
}

/** One-line summary, e.g. `Token Register v1.0.0 (abc1234) – demo` (`Token Register v1.0.0` in production). */
export function formatVersionForClipboard(info: AppVersionInfo): string {
  let text = `${APP_NAME} v${info.version}`;
  if (info.commit) text += ` (${info.commit})`;
  if (info.channel !== 'production') text += ` – ${info.channel}`;
  return text;
}

export function getAppVersionInfo(): AppVersionInfo {
  return buildVersionInfo(
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined,
    typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : undefined,
    typeof __APP_CHANNEL__ !== 'undefined' ? __APP_CHANNEL__ : undefined
  );
}
