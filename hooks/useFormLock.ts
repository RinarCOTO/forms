import { useEffect, useRef, useState } from 'react';

interface LockState {
  checking: boolean;       // initial lock check in progress
  locked: boolean;         // true = someone else holds the lock
  lockedBy: string | null; // display name of the lock holder
}

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

export function useFormLock(formType: string, formId: number | string | null) {
  const [state, setState] = useState<LockState>({ checking: !!formId, locked: false, lockedBy: null });
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const acquiredRef  = useRef(false);

  useEffect(() => {
    if (!formId) { setState({ checking: false, locked: false, lockedBy: null }); return; }

    const acquire = async () => {
      try {
        const res = await fetch('/api/form-locks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form_type: formType, form_id: formId }),
        });
        const data = await res.json();

        if (res.status === 409) {
          // Locked by someone else
          setState({ checking: false, locked: true, lockedBy: data.locked_name });
          return;
        }

        // We hold the lock — start heartbeat
        acquiredRef.current = true;
        setState({ checking: false, locked: false, lockedBy: null });

        heartbeatRef.current = setInterval(async () => {
          try {
            await fetch('/api/form-locks', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ form_type: formType, form_id: formId }),
            });
          } catch { /* non-fatal */ }
        }, HEARTBEAT_INTERVAL);
      } catch {
        // On error, allow editing (fail open)
        setState({ checking: false, locked: false, lockedBy: null });
      }
    };

    acquire();

    const release = () => {
      if (!acquiredRef.current) return;
      acquiredRef.current = false;
      const url = `/api/form-locks?form_type=${encodeURIComponent(formType)}&form_id=${encodeURIComponent(formId)}`;
      // keepalive: true ensures the request completes even if the tab is closing
      fetch(url, { method: 'DELETE', keepalive: true }).catch(() => {});
    };

    window.addEventListener('beforeunload', release);

    return () => {
      window.removeEventListener('beforeunload', release);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      release();
    };
  }, [formType, formId]);

  return state;
}
