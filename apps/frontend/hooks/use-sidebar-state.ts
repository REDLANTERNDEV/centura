'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to get sidebar state from cookies on client side
 */
export function useSidebarState(): boolean {
  const [defaultOpen, setDefaultOpen] = useState(true);

  useEffect(() => {
    // Check cookie on client side
    const cookies = document.cookie.split(';');
    const sidebarCookie = cookies.find(c =>
      c.trim().startsWith('sidebar_state=')
    );

    if (sidebarCookie) {
      const value = sidebarCookie.split('=')[1];
      setDefaultOpen(value === 'true');
    }
  }, []);

  return defaultOpen;
}
