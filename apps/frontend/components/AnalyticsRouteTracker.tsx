'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Counts client-side route changes for Matomo.
 *
 * Umami, Plausible, Fathom and GA4 hook the History API themselves, so they need
 * nothing here — mounting this for them would double-count every page view.
 * Matomo's snippet only records the page it loaded on, so the dashboard's
 * client-side navigations would otherwise be invisible.
 */
export default function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The initial page view is already sent by the inline snippet.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window._paq?.push(['setCustomUrl', pathname]);
    window._paq?.push(['trackPageView']);
  }, [pathname]);

  return null;
}
