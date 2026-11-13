import { useSQLiteContext } from 'expo-sqlite';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AccessibilityPreferences = { textScale: number; highContrast: boolean; simpleMode: boolean; readAloud: boolean };
type AccessibilityValue = AccessibilityPreferences & { ready: boolean; update: (patch: Partial<AccessibilityPreferences>) => Promise<void> };
const defaults: AccessibilityPreferences = { textScale: 1, highContrast: false, simpleMode: false, readAloud: false };
const Context = createContext<AccessibilityValue | null>(null);
export function AccessibilityProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [prefs, setPrefs] = useState(defaults);
  const [ready, setReady] = useState(false);
  useEffect(() => { let active = true; (async () => {
    const rows = await db.getAllAsync<{key:string;value:string}>('SELECT key,value FROM preferences WHERE key LIKE ?', 'access:%');
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    if (active) { setPrefs({ textScale: [1,1.15,1.3].includes(Number(map['access:textScale'])) ? Number(map['access:textScale']) : 1, highContrast: map['access:highContrast'] === 'true', simpleMode: map['access:simpleMode'] === 'true', readAloud: map['access:readAloud'] === 'true' }); setReady(true); }
  })().catch(() => { if (active) setReady(true); }); return () => { active = false; }; }, [db]);
  const update = useCallback(async (patch: Partial<AccessibilityPreferences>) => {
    const next = { ...prefs, ...patch };
    for (const [key,value] of Object.entries(patch)) await db.runAsync('INSERT OR REPLACE INTO preferences (key,value) VALUES (?,?)', `access:${key}`, String(value));
    setPrefs(next);
  }, [db,prefs]);
  const value = useMemo(() => ({ ...prefs, ready, update }), [prefs,ready,update]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAccessibility() { const value = useContext(Context); if (!value) throw new Error('useAccessibility requiere AccessibilityProvider'); return value; }
