import { useEffect, useState } from 'react';
import { AUTH_CHANGED_EVENT, fetchCurrentUser } from './auth';

export default function useAuth() {
  const [user, setUser] = useState<null | Awaited<ReturnType<typeof fetchCurrentUser>>>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      setIsLoading(true);
      fetchCurrentUser()
        .then((data) => {
          if (active) {
            setUser(data);
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });
    };

    load();
    window.addEventListener(AUTH_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, load);
    };
  }, []);

  return { user, isAuthenticated: Boolean(user), isLoading };
}
