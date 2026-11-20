// Version info injected at build time by Vite (`define` in vite.config.ts).
// The `typeof` guards keep this module usable where nothing is injected (Jest).

/** Product name (D-039), shown in the header, the tab title and the About modal. */
export const APP_NAME = 'Caisse Claire';

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

export function getAppVersionInfo(): AppVersionInfo {
  return buildVersionInfo(
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined,
    typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : undefined,
    typeof __APP_CHANNEL__ !== 'undefined' ? __APP_CHANNEL__ : undefined
  );
}
