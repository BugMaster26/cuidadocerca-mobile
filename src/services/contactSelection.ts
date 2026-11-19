type Permission = { granted: boolean; canAskAgain: boolean };
type Details = { fullName?: string | null; givenName?: string | null; familyName?: string | null; phones?: { number?: string | null; label?: string | null }[] | null };
export function normalizeContactPhone(value: string) { return value.trim().replace(/[\s().-]/g, ''); }
export function contactChoices(details: Details) {
  const seen = new Set<string>();
  const phones = (details.phones ?? []).flatMap(phone => {
    const number = normalizeContactPhone(phone.number ?? '');
    if (!/^\+?\d{7,15}$/.test(number) || seen.has(number)) return [];
    seen.add(number);
    return [{ number, label: phone.label ?? '' }];
  });
  return { name: details.fullName?.trim() || [details.givenName, details.familyName].filter(Boolean).join(' ').trim(), phones };
}
export type ContactSelection = { status: 'selected'; contact: ReturnType<typeof contactChoices> } | { status: 'denied'; canAskAgain: boolean } | { status: 'cancelled' | 'no-phone' | 'unsupported' };
export async function chooseSosContact(adapter: { requiresPermission: boolean; permission: () => Promise<Permission>; requestPermission: () => Promise<Permission>; pick: () => Promise<Details | null> }): Promise<ContactSelection> {
  if (adapter.requiresPermission) {
    let permission = await adapter.permission();
    if (!permission.granted && permission.canAskAgain) permission = await adapter.requestPermission();
    if (!permission.granted) return { status: 'denied', canAskAgain: permission.canAskAgain };
  }
  const details = await adapter.pick();
  if (!details) return { status: 'cancelled' };
  const contact = contactChoices(details);
  return contact.phones.length ? { status: 'selected', contact } : { status: 'no-phone' };
}
