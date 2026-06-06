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
        'version': '4.12.0',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Gagal login ke LibreLinkUp. Pastikan email dan password akun pengikut (follower) Anda benar.');
    }

    const loginData = await loginResponse.json();
    const token = loginData?.data?.authTicket?.token;

    if (!token) {
      throw new Error('Token otentikasi tidak ditemukan. Silakan coba login kembali.');
    }

    // 2. Ambil daftar koneksi (Pasien)
    const connectionsResponse = await fetch(`${baseUrl}/llu/connections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'product': 'llu.android',
        'version': '4.12.0',
      },
    });

    if (!connectionsResponse.ok) {
      throw new Error('Gagal mengambil daftar koneksi pasien.');
    }

    const connectionsData = await connectionsResponse.json();
    const connections = connectionsData?.data;

    if (!Array.isArray(connections) || connections.length === 0) {
      throw new Error('Tidak ada pasien yang terhubung. Pastikan Anda sudah menerima undangan berbagi (Share) di aplikasi LibreLinkUp HP Anda.');
    }

    // Ambil koneksi pertama yang memiliki data glukosa aktif
    const activeConnection = connections.find(c => c.patientId) || connections[0];
    const patientId = activeConnection.patientId;

    // 3. Ambil data glukosa terbaru (Grafik)
    const glucoseResponse = await fetch(`${baseUrl}/llu/connections/${patientId}/graph`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'product': 'llu.android',
        'version': '4.12.0',
      },
    });

    if (!glucoseResponse.ok) {
      throw new Error('Koneksi berhasil, namun gagal menarik grafik data. Periksa status sensor Anda.');
    }

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
    throw new Error(error.message || 'Terjadi kesalahan sistem saat menghubungi server LibreLinkUp.');
  }
}
