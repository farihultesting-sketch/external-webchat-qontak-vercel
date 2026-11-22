# AI Chatbot & Mekari Qontak Live Agent Handover

Webchat AI berbasis Next.js App Router dengan dukungan handover ke agen manusia di Mekari Qontak Omnichannel, sinkronisasi balasan agen & auto-resolve via webhook, serta penyimpanan sesi persistent menggunakan Upstash Redis.

## Struktur Utama

- `components/ChatWidget.tsx` — Komponen floating widget chat di sisi pengguna.
- `lib/sessionStore.ts` — Manajemen sesi chat (`async/await`) menggunakan Upstash Redis (dengan fallback in-memory untuk pengembangan lokal).
- `lib/qontakApi.ts` — Integrasi API Mekari Qontak (membuat/mengelola percakapan & mengirim pesan).
- `app/api/chat/route.ts` — Endpoint chat AI.
- `app/api/handover/route.ts` — Mengalihkan sesi chat dari AI ke agen Qontak beserta ringkasan percakapan.
- `app/api/chat/send/route.ts` — Mengirim pesan lanjutan dari pengguna ke room Qontak.
- `app/api/chat/poll/route.ts` — Mengambil balasan agen dan status resolve sesi.
- `app/api/webhook/qontak/route.ts` — Menerima webhook dari Qontak (`receive_message_from_agent` & `room_resolved`).
- `app/api/webhook/setup/route.ts` — Endpoint helper untuk mendaftarkan webhook Qontak secara otomatis ke domain aktif.

## Environment Variables

Buat file `.env.local` untuk pengembangan lokal (atau isi langsung di **Project Settings > Environment Variables** pada Vercel):

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
QONTAK_API_TOKEN=your_qontak_api_token
QONTAK_REFRESH_TOKEN=your_qontak_refresh_token
QONTAK_CHANNEL_INTEGRATION_ID=your_qontak_channel_integration_id
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
