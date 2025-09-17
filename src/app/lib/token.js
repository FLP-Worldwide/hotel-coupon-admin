// lib/token.js
export async function refreshAccessToken() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
  const REFRESH_PATH = process.env.AUTH_REFRESH_PATH || '';
  try {
    const res = await fetch(`${API_BASE}${REFRESH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // IMPORTANT: send HttpOnly cookie
      body: JSON.stringify({}) // body optional for your endpoint
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Refresh failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    // expected: { accessToken, (optional) refreshToken, (optional) expiresIn }
    const accessToken = data?.accessToken;
    let accessTokenExpires = null;

    if (data?.expiresIn) {
      accessTokenExpires = Date.now() + Number(data.expiresIn) * 1000;
    } else if (accessToken) {
      try {
        // decode JWT exp claim (node Buffer available in Next.js server side)
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (decoded?.exp) accessTokenExpires = decoded.exp * 1000;
        }
      } catch (e) {
        accessTokenExpires = Date.now() + 10 * 60 * 1000; // fallback 10min
      }
    }

    return {
      accessToken,
      accessTokenExpires,
      // backend rotates refresh cookie itself; we don't (and can't) read HttpOnly cookie here
      refreshToken: data?.refreshToken ?? null,
    };
  } catch (err) {
    console.error('refreshAccessToken error', err);
    return { error: 'RefreshAccessTokenError' };
  }
}
