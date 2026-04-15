import { defineStore } from 'pinia';
import {
  getInfo,
  getToken,
  hasPermission as hasGrantedPermission,
  type LoginData,
  login,
  normalizePermissions,
  logout,
  removeToken,
  setToken,
  type UserInfo,
  type UserVO
} from '@/api';

export type SessionState = {
  token: string;
  user: UserVO | null;
  permissions: string[];
  initialized: boolean;
};

const clearSessionState: SessionState = {
  token: '',
  user: null,
  permissions: [],
  initialized: true
};

export const useSessionStore = defineStore('infoq-weapp-vue-session', {
  state: (): SessionState => ({
    token: getToken(),
    user: null,
    permissions: [],
    initialized: false
  }),
  actions: {
    async loadSession(force = false): Promise<UserInfo | null> {
      const currentToken = getToken();
      if (!currentToken) {
        Object.assign(this, clearSessionState);
        return null;
      }
      if (!force && this.initialized && this.user) {
        return {
          user: this.user,
          roles: [],
          permissions: this.permissions
        };
      }
      const response = await getInfo();
      const info = response.data;
      this.token = currentToken;
      this.user = info.user;
      this.permissions = normalizePermissions(info.permissions || []);
      this.initialized = true;
      return info;
    },
    async signIn(payload: LoginData) {
      const response = await login(payload);
      const token = response.data.access_token;
      setToken(token);
      this.token = token;
      const infoResponse = await getInfo();
      const info = infoResponse.data;
      this.user = info.user;
      this.permissions = normalizePermissions(info.permissions || []);
      this.initialized = true;
    },
    async signOut() {
      let logoutError: unknown;
      try {
        if (getToken()) {
          await logout();
        }
      } catch (error) {
        logoutError = error;
      }
      removeToken();
      Object.assign(this, clearSessionState);
      if (logoutError) {
        throw logoutError;
      }
    },
    patchUser(patch: Partial<UserVO>) {
      this.user = this.user ? { ...this.user, ...patch } : { ...patch };
    },
    hasPermission(permission: string) {
      return hasGrantedPermission(this.permissions, permission);
    }
  }
});
