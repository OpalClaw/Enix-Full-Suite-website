import { useEffect } from 'react';

// Public-facing brand string. Internal-only CRM pages override this with
// usePageTitle('CRM — ...') if they want CRM phrasing in the tab.
const BRAND = 'Enix Exteriors';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND}` : BRAND;
    return () => {
      document.title = BRAND;
    };
  }, [title]);
}
