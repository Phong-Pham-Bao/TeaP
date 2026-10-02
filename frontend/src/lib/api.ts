import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const CSRF_STORAGE_KEY = 'teap_csrf_token';

type SessionResponse = {
  accessToken: string;
  csrfToken: string;
  user: unknown;
};

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let csrfToken: string | null = null;
let refreshPromise: Promise<SessionResponse> | null = null;

function storedCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CSRF_STORAGE_KEY);
}

export function setAuthSession(nextAccessToken: string, nextCsrfToken: string) {
  accessToken = nextAccessToken;
  csrfToken = nextCsrfToken;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(CSRF_STORAGE_KEY, nextCsrfToken);
  }
}

export function clearAuthSession() {
  accessToken = null;
  csrfToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

export async function refreshAuthSession<TUser = unknown>(): Promise<
  SessionResponse & { user: TUser }
> {
  const currentCsrfToken = csrfToken ?? storedCsrfToken();
  if (!currentCsrfToken) throw new Error('No browser session to restore');

  const response = await axios.post<SessionResponse & { user: TUser }>(
    `${API_URL}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: { 'X-CSRF-Token': currentCsrfToken },
    },
  );
  setAuthSession(response.data.accessToken, response.data.csrfToken);
  return response.data;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const request = error.config as typeof error.config & { _retry?: boolean };
      const isAuthRequest =
        request?.url?.includes('/auth/login') ||
        request?.url?.includes('/auth/refresh');
      const canRefresh = Boolean(csrfToken ?? storedCsrfToken());

      if (request && !request._retry && canRefresh && !isAuthRequest) {
        request._retry = true;
        try {
          refreshPromise ??= refreshAuthSession().finally(() => {
            refreshPromise = null;
          });
          const session = await refreshPromise;
          request.headers.Authorization = `Bearer ${session.accessToken}`;
          return api(request);
        } catch {
          clearAuthSession();
        }
      } else if (!isAuthRequest) {
        clearAuthSession();
      }

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
