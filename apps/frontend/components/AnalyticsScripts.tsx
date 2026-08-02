import Script from 'next/script';
import { isAnalyticsError, resolveAnalytics } from '@/lib/analytics';
import AnalyticsRouteTracker from '@/components/AnalyticsRouteTracker';

/**
 * Loads the configured analytics provider, or renders nothing when analytics is
 * switched off. Every supported provider counts page views on its own, including
 * the client-side route changes inside the dashboard.
 */
export default function AnalyticsScripts() {
  const config = resolveAnalytics();
  if (config === null) return null;

  // Fail the build rather than ship a bundle that silently measures nothing —
  // the same reasoning as the required NEXT_PUBLIC_API_URL build arg.
  if (isAnalyticsError(config)) throw new Error(config.message);

  const { provider, src, siteId, host, attrs } = config;

  if (provider === 'umami') {
    return (
      <Script
        defer
        src={src}
        data-website-id={siteId}
        strategy='afterInteractive'
        {...attrs}
      />
    );
  }

  if (provider === 'plausible') {
    return (
      <>
        <Script
          defer
          src={src}
          data-domain={siteId}
          strategy='afterInteractive'
          {...attrs}
        />
        {/* Queues events fired before the script finishes loading. */}
        <Script id='plausible-init' strategy='afterInteractive'>
          {`window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments) };`}
        </Script>
      </>
    );
  }

  if (provider === 'google') {
    return (
      <>
        <Script src={src} strategy='afterInteractive' {...attrs} />
        <Script id='google-analytics-init' strategy='afterInteractive'>
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(siteId)});`}
        </Script>
      </>
    );
  }

  if (provider === 'matomo') {
    return (
      <>
        <AnalyticsRouteTracker />
        <Script id='matomo-init' strategy='afterInteractive'>
          {`var _paq = window._paq = window._paq || [];
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function () {
  var u = ${JSON.stringify(`${host}/`)};
  _paq.push(['setTrackerUrl', u + 'matomo.php']);
  _paq.push(['setSiteId', ${JSON.stringify(siteId)}]);
  var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
  g.async = true; g.src = ${JSON.stringify(src || `${host}/matomo.js`)};
  s.parentNode.insertBefore(g, s);
})();`}
        </Script>
      </>
    );
  }

  if (provider === 'fathom') {
    return (
      <Script
        defer
        src={src}
        data-site={siteId}
        strategy='afterInteractive'
        {...attrs}
      />
    );
  }

  // custom — any provider that installs as a plain script tag. Anything beyond
  // the src (a website ID, a domain) goes through NEXT_PUBLIC_ANALYTICS_ATTRS.
  return <Script defer src={src} strategy='afterInteractive' {...attrs} />;
}
