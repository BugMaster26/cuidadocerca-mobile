import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export type CareRole = 'older-adult' | 'caregiver';
type RoleState = { role: CareRole | null; ready: boolean; chooseRole: (role: CareRole) => Promise<void>; clearRole: () => Promise<void> };
const RoleContext = createContext<RoleState | null>(null);
export function RoleProvider({ children }: PropsWithChildren) {
  const store = useSQLiteContext();
  const [role, setRole] = useState<CareRole | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const row = await store.getFirstAsync<{ value: string }>('SELECT value FROM preferences WHERE key = ?', 'role');
      if (active) { setRole(row?.value === 'caregiver' || row?.value === 'older-adult' ? row.value : null); setReady(true); }
    })().catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [store]);
  const value = useMemo<RoleState>(() => ({
    role, ready,
    async chooseRole(next) { await store.runAsync('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', 'role', next); setRole(next); },
    async clearRole() { await store.runAsync('DELETE FROM preferences WHERE key = ?', 'role'); setRole(null); },
  }), [role, ready]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
export function useRole() { const context = useContext(RoleContext); if (!context) throw new Error('useRole debe usarse dentro de RoleProvider'); return context; }
