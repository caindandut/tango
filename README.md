# Tango - Japanese Vocabulary Cramming App

## FE (Frontend)
- React + Vite
- Tailwind CSS v3
- shadcn/ui

## BE (Backend)  
- Node.js + Express
- Prisma ORM + PostgreSQL
- Google Gemini AI

## Development
```bash
# Frontend
cd FE && npm run dev

# Backend
cd BE && npm run dev
```

## Deploy

- Vercel: set the project root to `FE`, build command `npm run build`, output directory `dist`, and set `VITE_API_URL` to the deployed Render API URL.
- Render: set the service root directory to `BE`, use `render.yaml`, and configure `CLIENT_URL` with the Vercel URL plus the database connection supplied by Render.
- After the Render database is ready, run `npm run seed` once from the `BE` directory to load the 12 vocabulary lessons.

## Environment Variables
For local development, copy `BE/.env.example` to `BE/.env`, configure `DATABASE_URL`, `CLIENT_URL`, and a Google AI Studio `GEMINI_API_KEY`. Keep this key only in the backend environment; never add it to `FE/.env` or a `VITE_*` variable. Then set `FE/.env` with `VITE_API_URL`.

On Render, set `GEMINI_API_KEY` as a secret environment variable for the backend service. The dictionary lookup uses Gemini's free-tier quota and is rate-limited per IP.

### Rà soát giáo trình ngữ pháp bằng Gemini

Pipeline này chỉ chạy batch khi cập nhật dữ liệu, không gọi Gemini khi người học mở bài. Cần có `GEMINI_API_KEY` trong `BE/.env` và file PDF Soumatome trong `BE/file/`.

```bash
cd BE
npm run grammar:review -- --pdf="file/[VTI Mirai Share] 141 - Soumatome N3 Ngữ Pháp Bunpou.pdf" --resume
npm run grammar:review -- --pdf="file/[VTI Mirai Share] 141 - Soumatome N3 Ngữ Pháp Bunpou.pdf" --resume --verify-only
npm run grammar:publish
npm run validate:grammar
```

Có thể chạy một phạm vi nhỏ bằng `--from=1:1 --to=1:2`. Checkpoint và báo cáo nằm trong `tmp/grammar-review/`; pipeline dừng và không ghi đè curriculum nếu verifier hoặc validator chưa đạt.
