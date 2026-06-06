'use server';

/**
 * @fileOverview Server Action untuk berkomunikasi dengan API LibreLinkUp (Abbott).
 * Mendukung sinkronisasi data dari FreeStyle Libre 2 & 3.
 */

const LIBRE_LINK_UP_URLS = {
  EU: 'https://api-eu.libreview.io',
  US: 'https://api-us.libreview.io',
  GLOBAL: 'https://api.libreview.io',
};

export async function syncLibreData(credentials: {
  email: string;
  password: string;
  region: 'EU' | 'US' | 'GLOBAL';
}) {
  const baseUrl = LIBRE_LINK_UP_URLS[credentials.region];

  try {
    // 1. Login ke LibreLinkUp
    const loginResponse = await fetch(`${baseUrl}/llu/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'product': 'llu.android',
        'version': '4.7.0',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(errorData?.message || 'Gagal login ke LibreLinkUp. Periksa email/password.');
    }

    const loginData = await loginResponse.json();
    const token = loginData?.data?.authTicket?.token;

    if (!token) {
      throw new Error('Token otentikasi tidak ditemukan.');
    }

    // 2. Ambil daftar koneksi (Pasien)
    const connectionsResponse = await fetch(`${baseUrl}/llu/connections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'product': 'llu.android',
        'version': '4.7.0',
      },
    });

    const connectionsData = await connectionsResponse.json();
    const connections = connectionsData?.data;

    if (!Array.isArray(connections) || connections.length === 0) {
      throw new Error('Tidak ada pasien yang terhubung. Pastikan Anda sudah menerima undangan berbagi di aplikasi LibreLinkUp.');
    }

    // Ambil koneksi pertama (biasanya diri sendiri atau pasien utama)
    const patientId = connections[0].patientId;

    // 3. Ambil data glukosa terbaru (Grafik)
    const glucoseResponse = await fetch(`${baseUrl}/llu/connections/${patientId}/graph`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'product': 'llu.android',
        'version': '4.7.0',
      },
    });

    const glucoseData = await glucoseResponse.json();
    const graphData = glucoseData?.data?.graphData;

    if (!Array.isArray(graphData)) {
      return [];
    }

    // Map data ke format internal GulaMonitor
    return graphData.map((item: any) => ({
      value: item.Value,
      timestamp: new Date(item.Timestamp).toISOString(),
    }));

  } catch (error: any) {
    console.error('Libre Sync Error:', error);
    throw new Error(error.message || 'Terjadi kesalahan sistem saat menghubungi LibreLinkUp.');
  }
}
