export type Account = { id: string; displayName: string };
export type LinkRequest = { accountId: string; personId: string; permissions: string[] };

/** Backend contract for Stage 1. No authentication server is present in this workspace. */
export interface AuthService {
  signIn(email: string, password: string): Promise<Account>;
  requestCareLink(request: LinkRequest): Promise<void>;
  revokeCareLink(accountId: string, personId: string): Promise<void>;
}

export const authService: AuthService = {
  async signIn() { throw new Error('Autenticación no configurada: falta el backend Django REST.'); },
  async requestCareLink() { throw new Error('Vínculos no configurados: falta el backend Django REST.'); },
  async revokeCareLink() { throw new Error('Gestión de permisos no configurada: falta el backend Django REST.'); },
};
