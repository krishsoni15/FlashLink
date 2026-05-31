const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOpts.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOpts,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Something went wrong');
  }

  return res.json();
}

// --- Auth API ---

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    api_key?: string;
  };
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getProfile(token: string) {
  return fetchAPI('/auth/me', { token });
}

export async function regenerateAPIKey(token: string) {
  return fetchAPI<{ api_key: string }>('/auth/api-key', {
    method: 'POST',
    token,
  });
}

// --- URL API ---

export interface URLResponse {
  id: string;
  short_code: string;
  short_url: string;
  original_url: string;
  click_count: number;
  qr_code?: string;
  expires_at?: string;
  created_at: string;
}

export interface PaginatedURLs {
  data: URLResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export async function createShortURL(
  url: string,
  customAlias?: string,
  expiresIn?: number,
  token?: string
): Promise<URLResponse> {
  return fetchAPI<URLResponse>('/urls', {
    method: 'POST',
    body: JSON.stringify({
      url,
      custom_alias: customAlias || undefined,
      expires_in: expiresIn || undefined,
    }),
    token,
  });
}

export async function getUserURLs(token: string, page = 1, perPage = 20): Promise<PaginatedURLs> {
  return fetchAPI<PaginatedURLs>(`/urls?page=${page}&per_page=${perPage}`, { token });
}

export async function deleteURL(token: string, urlId: string) {
  return fetchAPI(`/urls/${urlId}`, { method: 'DELETE', token });
}

export async function getQRCode(shortCode: string): Promise<{ qr_code: string }> {
  return fetchAPI<{ qr_code: string }>(`/urls/${shortCode}/qr`);
}

// --- Analytics API ---

export interface CountStat {
  name: string;
  count: number;
}

export interface DateCount {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  total_clicks: number;
  unique_visitors: number;
  top_countries: CountStat[];
  top_browsers: CountStat[];
  top_devices: CountStat[];
  top_os: CountStat[];
  clicks_by_date: DateCount[];
  top_referers: CountStat[];
}

export async function getURLAnalytics(
  token: string,
  shortCode: string,
  days = 30
): Promise<AnalyticsSummary> {
  return fetchAPI<AnalyticsSummary>(`/urls/${shortCode}/analytics?days=${days}`, { token });
}

export async function getDashboardAnalytics(token: string, days = 30): Promise<AnalyticsSummary> {
  return fetchAPI<AnalyticsSummary>(`/analytics/dashboard?days=${days}`, { token });
}

export async function getUserStats(token: string): Promise<{ total_urls: number; total_clicks: number }> {
  return fetchAPI<{ total_urls: number; total_clicks: number }>('/stats', { token });
}
