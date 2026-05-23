import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Enix CRM` : 'Enix CRM';
    return () => {
      document.title = 'Enix CRM';
    };
  }, [title]);
}
