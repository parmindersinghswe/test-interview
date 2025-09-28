let csrfToken: string | null = null;

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export function getCsrfToken() {
  return csrfToken;
}

export async function fetchCsrfToken() {
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  if (res.ok) {
    const data = await res.json();
    setCsrfToken(data.csrfToken);
  }
}
