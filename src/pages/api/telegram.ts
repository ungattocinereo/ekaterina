import type { APIRoute } from 'astro';

export const prerender = false;

type TelegramUpdate = {
  message?: {
    message_id: number;
    chat: { id: number; first_name?: string; username?: string };
    from?: { first_name?: string; language_code?: string };
    text?: string;
  };
};

async function tg(token: string, method: string, payload: Record<string, unknown>) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function replyText(lang: string | undefined, name: string) {
  const n = name || 'there';
  if (lang?.startsWith('ru')) {
    return `Привет, ${n}! Спасибо за сообщение — Катерина ответит вам в ближайшее время. А пока можете написать в WhatsApp: https://wa.me/393518082524`;
  }
  if (lang?.startsWith('it')) {
    return `Ciao ${n}! Grazie per aver scritto — Katerina ti risponderà al più presto. Nel frattempo puoi scrivere anche su WhatsApp: https://wa.me/393518082524`;
  }
  return `Hi ${n}! Thanks for reaching out — Katerina will get back to you shortly. In the meantime, feel free to message on WhatsApp: https://wa.me/393518082524`;
}

export const POST: APIRoute = async ({ request }) => {
  const token = import.meta.env.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return new Response('Server not configured', { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const msg = update.message;
  if (msg?.chat?.id) {
    const name = msg.from?.first_name ?? msg.chat.first_name ?? '';
    await tg(token, 'sendMessage', {
      chat_id: msg.chat.id,
      text: replyText(msg.from?.language_code, name),
      disable_web_page_preview: true,
    });
  }

  return new Response('ok', { status: 200 });
};

export const GET: APIRoute = async () =>
  new Response('Telegram webhook endpoint. POST only.', { status: 200 });
