import type { APIRoute } from 'astro';

export const prerender = false;

const SESSION_TYPES: Record<string, string> = {
  express: 'Express Session (€120)',
  signature: 'Signature Photo Walk (€200)',
  custom: 'Custom / other',
};

function esc(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function trunc(input: string, max: number): string {
  const s = input.trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function getIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}

type BookingPayload = {
  name?: string;
  sessionType?: string;
  location?: string;
  date?: string;
  comment?: string;
  email?: string;
  phone?: string;
  website?: string; // honeypot
  meta?: {
    url?: string;
    referrer?: string;
    language?: string;
    screen?: string;
    timezone?: string;
  };
};

export const POST: APIRoute = async ({ request }) => {
  const token = import.meta.env.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Server is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let payload: BookingPayload;
  try {
    payload = (await request.json()) as BookingPayload;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Honeypot: bots fill hidden fields; real users don't.
  if (payload.website && payload.website.trim().length > 0) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const name = trunc(payload.name ?? '', 120);
  const sessionType = payload.sessionType ?? '';
  const date = trunc(payload.date ?? '', 40);
  const location = trunc(payload.location ?? '', 200);
  const comment = trunc(payload.comment ?? '', 2000);
  const email = trunc(payload.email ?? '', 200);
  const phone = trunc(payload.phone ?? '', 60);

  const errors: string[] = [];
  if (!name) errors.push('name');
  if (!sessionType || !SESSION_TYPES[sessionType]) errors.push('sessionType');
  if (!date) errors.push('date');
  if (!email && !phone) errors.push('contact');

  if (errors.length > 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Validation failed', fields: errors }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionLabel = SESSION_TYPES[sessionType];
  const ua = request.headers.get('user-agent') ?? 'unknown';
  const ip = getIp(request.headers);
  const nowIso = new Date().toISOString();
  const meta = payload.meta ?? {};

  const lines: string[] = [];
  lines.push('🌿 <b>Новая заявка с сайта</b>');
  lines.push('');
  lines.push('<b>Заполненные поля</b>');
  lines.push(`👤 <b>Имя:</b> ${esc(name)}`);
  lines.push(`📸 <b>Тип сессии:</b> ${esc(sessionLabel)}`);
  if (location) lines.push(`📍 <b>Локация:</b> ${esc(location)}`);
  lines.push(`📅 <b>Дата:</b> ${esc(date)}`);
  if (email) lines.push(`📧 <b>Email:</b> ${esc(email)}`);
  if (phone) lines.push(`📞 <b>Телефон:</b> ${esc(phone)}`);
  if (comment) {
    lines.push('');
    lines.push('💬 <b>Комментарий:</b>');
    lines.push(esc(comment));
  }
  lines.push('');
  lines.push('<b>Техническая информация</b>');
  const techBlock = [
    `Время:     ${nowIso}`,
    `IP:        ${ip}`,
    `Referrer:  ${meta.referrer || 'direct'}`,
    `Язык:      ${meta.language ?? '—'}`,
    `TZ:        ${meta.timezone ?? '—'}`,
    `Экран:     ${meta.screen ?? '—'}`,
    `User-Agent:`,
    ua,
  ].join('\n');
  lines.push(`<pre>${esc(techBlock)}</pre>`);

  const text = lines.join('\n');

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!tgRes.ok) {
    const detail = await tgRes.text();
    return new Response(
      JSON.stringify({ ok: false, error: 'Telegram API error', detail }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
