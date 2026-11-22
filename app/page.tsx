import ChatWidget from './components/ChatWidget';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">BrandKamu</span>
          <div className="hidden sm:flex gap-6 text-sm text-zinc-600">
            <a href="#fitur" className="hover:text-zinc-900">Fitur</a>
            <a href="#tentang" className="hover:text-zinc-900">Tentang</a>
            <a href="#kontak" className="hover:text-zinc-900">Kontak</a>
          </div>
          <a
            href="#mulai"
            className="bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
          >
            Mulai Sekarang
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-zinc-100 text-zinc-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
            Solusi Digital Modern
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Bangun Pengalaman Pelanggan Lebih Cepat dengan AI
          </h1>
          <p className="mt-6 text-zinc-600 text-lg max-w-2xl mx-auto">
            Deskripsi singkat mengenai produk, portofolio, atau layanan utama kamu di sini. Pengunjung bisa langsung bertanya lewat asisten AI di pojok kanan bawah.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="#fitur"
              className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Pelajari Selengkapnya
            </a>
            <a
              href="#kontak"
              className="border border-zinc-300 text-zinc-700 px-6 py-3 rounded-xl font-medium hover:bg-zinc-50 transition-colors"
            >
              Hubungi Kami
            </a>
          </div>
        </section>

        {/* Fitur Section */}
        <section id="fitur" className="bg-zinc-50 py-20 border-t border-zinc-100">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-12">Keunggulan Utama</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200">
                <h3 className="font-semibold text-lg mb-2">Respon Instan 24/7</h3>
                <p className="text-sm text-zinc-600">
                  Asisten virtual siap menjawab pertanyaan pengunjung kapan saja tanpa menunggu antrean.
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200">
                <h3 className="font-semibold text-lg mb-2">Terintegrasi Penuh</h3>
                <p className="text-sm text-zinc-600">
                  Dibangun langsung dari nol dengan arsitektur modern yang cepat dan ringan.
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200">
                <h3 className="font-semibold text-lg mb-2">Mudah Dikustomisasi</h3>
                <p className="text-sm text-zinc-600">
                  Seluruh tampilan halaman dan pengetahuan chatbot bisa disesuaikan dengan kebutuhan bisnismu.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-500">
        © 2026 BrandKamu. All rights reserved.
      </footer>

      {/* Floating Chatbot Widget di Pojok Kanan Bawah */}
      <ChatWidget />
    </div>
  );
}