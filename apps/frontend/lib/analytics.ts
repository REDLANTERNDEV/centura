/**
 * Optional web analytics
 *
 * Off unless the deployment configures a provider, so a default install loads no
 * third-party script and sends no visitor data anywhere.
 *
 * One provider is active at a time, chosen by name:
 *
 *   NEXT_PUBLIC_ANALYTICS_PROVIDER   umami | plausible | google | matomo | fathom | custom
 *   NEXT_PUBLIC_ANALYTICS_SITE_ID    site identifier — meaning depends on the provider
 *   NEXT_PUBLIC_ANALYTICS_HOST       base URL of a self-hosted instance
 *   NEXT_PUBLIC_ANALYTICS_SRC        full script URL, overrides HOST
 *   NEXT_PUBLIC_ANALYTICS_ATTRS      extra script attributes as a JSON object
 *
 * See the README for what SITE_ID and HOST mean per provider. `custom` covers
 * anything that installs as a plain `<script src=...>` tag: point SRC at the
 * script and pass whatever data attributes it needs through ATTRS.
 *
 * These are NEXT_PUBLIC_* variables, so — exactly like NEXT_PUBLIC_API_URL —
 * they are compiled into the browser bundle at build time. Set them before
 * `next build` (or as Docker build args), not only at container runtime.
 */

export const ANALYTICS_PROVIDERS = [
  'umami',
  'plausible',
  'google',
  'matomo',
  'fathom',
  'custom',
] as const;

export type AnalyticsProvider = (typeof ANALYTICS_PROVIDERS)[number];

export type AnalyticsConfig = {
  provider: AnalyticsProvider;
  /** URL of the script to load. Empty for providers that self-build it inline. */
  src: string;
  /** Website ID, domain, measurement ID or site ID, depending on the provider. */
  siteId: string;
  /** Base URL of a self-hosted instance, without a trailing slash. */
  host: string;
  /** Extra attributes to put on the script tag. */
  attrs: Record<string, string>;
};

/** Why the configuration was rejected, for a build-time error message. */
export type AnalyticsConfigError = { message: string };

const trim = (value: string | undefined) => (value ?? '').trim();
const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

function parseAttrs(raw: string): Record<string, string> {
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {};

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string')
        .map(([key, value]) => [key, value as string])
    );
  } catch {
    // A malformed value is reported by resolveAnalytics(), not thrown from here.
    return {};
  }
}

/**
 * Per-provider defaults. `script` builds the src from HOST when the deployment
 * does not give an explicit SRC; `requires` lists the fields without which the
 * provider cannot work.
 */
const PROVIDER_DEFAULTS: Record<
  AnalyticsProvider,
  {
    script: (config: { host: string; siteId: string }) => string;
    requires: { siteId?: string; host?: string; src?: string };
  }
> = {
  umami: {
    script: ({ host }) => (host ? `${host}/script.js` : ''),
    requires: {
      siteId: 'the Umami website ID (a UUID from Settings → Websites)',
      src: 'NEXT_PUBLIC_ANALYTICS_HOST (your Umami URL) or NEXT_PUBLIC_ANALYTICS_SRC',
    },
  },
  plausible: {
    script: ({ host }) =>
      host ? `${host}/js/script.js` : 'https://plausible.io/js/script.js',
    requires: {
      siteId: 'the domain configured in Plausible, e.g. example.com',
    },
  },
  google: {
    script: ({ siteId }) =>
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(siteId)}`,
    requires: { siteId: 'the GA4 measurement ID, e.g. G-XXXXXXXXXX' },
  },
  matomo: {
    // Loaded by the inline snippet from HOST, so no standalone src.
    script: () => '',
    requires: {
      siteId: 'the numeric Matomo site ID',
      host: 'NEXT_PUBLIC_ANALYTICS_HOST, your Matomo URL',
    },
  },
  fathom: {
    script: ({ host }) =>
      host ? `${host}/script.js` : 'https://cdn.usefathom.com/script.js',
    requires: { siteId: 'the Fathom site ID' },
  },
  custom: {
    script: () => '',
    requires: { src: 'NEXT_PUBLIC_ANALYTICS_SRC, the full script URL' },
  },
};

function isProvider(value: string): value is AnalyticsProvider {
  return (ANALYTICS_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Resolve the configured provider.
 *
 * Returns `null` when analytics is switched off, and an error when a provider is
 * named but cannot work — a typo should fail the build rather than quietly ship
 * a bundle that measures nothing.
 */
export function resolveAnalytics():
  AnalyticsConfig | AnalyticsConfigError | null {
  const provider = trim(
    process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER
  ).toLowerCase();
  if (!provider) return null;

  if (!isProvider(provider)) {
    return {
      message:
        `NEXT_PUBLIC_ANALYTICS_PROVIDER is "${provider}", which is not supported. ` +
        `Use one of: ${ANALYTICS_PROVIDERS.join(', ')} — or leave it empty to disable analytics.`,
    };
  }

  const rawAttrs = trim(process.env.NEXT_PUBLIC_ANALYTICS_ATTRS);
  if (rawAttrs && Object.keys(parseAttrs(rawAttrs)).length === 0) {
    return {
      message:
        'NEXT_PUBLIC_ANALYTICS_ATTRS must be a JSON object of string values, ' +
        `e.g. {"data-domains":"example.com"} — got: ${rawAttrs}`,
    };
  }

  const host = stripTrailingSlash(trim(process.env.NEXT_PUBLIC_ANALYTICS_HOST));
  const siteId = trim(process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID);
  const { script, requires } = PROVIDER_DEFAULTS[provider];
  const src =
    trim(process.env.NEXT_PUBLIC_ANALYTICS_SRC) || script({ host, siteId });

  const missing =
    (!siteId && requires.siteId) ||
    (!host && requires.host) ||
    (!src && requires.src);

  if (missing) {
    return {
      message: `Analytics provider "${provider}" is configured but incomplete — set ${missing}.`,
    };
  }

  return { provider, src, siteId, host, attrs: parseAttrs(rawAttrs) };
}

export function isAnalyticsError(
  value: AnalyticsConfig | AnalyticsConfigError | null
): value is AnalyticsConfigError {
  return value !== null && 'message' in value;
}

export type AnalyticsEventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (name: string, data?: AnalyticsEventData) => void };
    plausible?: (
      name: string,
      options?: { props?: AnalyticsEventData }
    ) => void;
    gtag?: (command: string, ...args: unknown[]) => void;
    fathom?: { trackEvent: (name: string) => void };
    _paq?: unknown[][];
  }
}

/**
 * Send a custom event to whichever provider is loaded.
 *
 * Deliberately provider-agnostic: it calls every tracking global it finds rather
 * than branching on the configured provider, so a `custom` provider works too as
 * long as it exposes one of these. A no-op on the server, when analytics is off,
 * or before the script has loaded.
 *
 * Never pass customer data, e-mail addresses or record IDs here — event payloads
 * leave the deployment and land on a third-party host.
 */
export function trackEvent(name: string, data?: AnalyticsEventData) {
  if (globalThis.window === undefined) return;

  try {
    window.umami?.track(name, data);
    window.plausible?.(name, data ? { props: data } : undefined);
    window.gtag?.('event', name, data);
    window.fathom?.trackEvent(name);
    window._paq?.push(['trackEvent', 'centura', name]);
  } catch {
    // Analytics must never break the page it is measuring.
  }
}
