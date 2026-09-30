/* ============================================================
   POBELI ME — pošiljanje povpraševanja (Vercel funkcija)
   Obrazec pošlje JSON na /api/contact, funkcija prek Resenda
   pošlje mail na info@pobelime.si (s fotografijami in tlorisom)
   ter kratko potrditev stranki.

   Nastavitve v Vercelu (Settings → Environment Variables):
     RESEND_API_KEY   ključ iz resend.com (obvezno)
     CONTACT_TO       kam gredo povpraševanja (privzeto info@pobelime.si)
     CONTACT_FROM     pošiljatelj (privzeto "Pobeli Me <info@pobelime.si>")
   ============================================================ */

const TO = process.env.CONTACT_TO || 'info@pobelime.si';
const FROM = process.env.CONTACT_FROM || 'Pobeli Me <info@pobelime.si>';
const MAX_FILES = 9;                   // 8 fotografij + tloris
const MAX_TOTAL = 3.8 * 1024 * 1024;   // Vercel sprejme ~4,5 MB na zahtevo
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = s => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

async function send(payload) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Resend ${r.status}: ${t.slice(0, 300)}`);
  }
  return r.json().catch(() => ({}));
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const reply = (status, ok, message) => { res.statusCode = status; res.end(JSON.stringify({ ok, message })); };

  if (req.method !== 'POST') return reply(405, false, 'Napačna metoda.');
  if (!process.env.RESEND_API_KEY) return reply(500, false, 'Pošiljanje ni nastavljeno.');

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return reply(400, false, 'Neveljavna zahteva.');

  // past za robote: skrito polje, ki ga človek ne vidi
  if (b.website) return reply(200, true, 'Povpraševanje je bilo poslano.');

  const ime = clean(b.ime), email = clean(b.email), tel = clean(b.tel), tip = clean(b.tip);
  const sporocilo = String(b.sporocilo || '').trim().slice(0, 5000);
  const tloris = String(b.tloris || '').trim().slice(0, 5000);
  if (!ime || !tip || !isEmail(email)) return reply(422, false, 'Prosimo, izpolnite obvezna polja.');

  // priloge: [{ filename, type, content(base64) }]
  const files = Array.isArray(b.attachments) ? b.attachments : [];
  if (files.length > MAX_FILES) return reply(413, false, 'Preveč prilog.');
  let total = 0;
  const attachments = [];
  for (const f of files) {
    const type = String(f && f.type || '');
    const content = String(f && f.content || '');
    if (!TYPES.includes(type) || !/^[A-Za-z0-9+/=]+$/.test(content)) return reply(415, false, 'Dovoljene so samo slike.');
    total += Math.floor(content.length * 3 / 4);
    if (total > MAX_TOTAL) return reply(413, false, 'Priloge so prevelike.');
    const name = String(f.filename || 'slika').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'slika';
    attachments.push({ filename: name, content });
  }

  const rows = [
    ['Ime in priimek', ime], ['E-pošta', email], ['Telefon', tel || '—'], ['Tip projekta', tip]
  ];
  const text =
    `Novo povpraševanje s spletne strani POBELI ME\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nSporočilo:\n${sporocilo || '—'}` +
    (tloris ? `\n\n${tloris}` : '') +
    (attachments.length ? `\n\nPriloge: ${attachments.length}` : '');
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:15px;color:#101014;line-height:1.5">` +
    `<h2 style="margin:0 0 12px;font-size:20px">Novo povpraševanje</h2>` +
    `<table style="border-collapse:collapse">` +
    rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#6f6a63">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('') +
    `</table>` +
    `<h3 style="margin:20px 0 6px;font-size:16px">Sporočilo</h3><p style="margin:0;white-space:pre-line">${esc(sporocilo || '—')}</p>` +
    (tloris ? `<h3 style="margin:20px 0 6px;font-size:16px">Tloris</h3><p style="margin:0;white-space:pre-line">${esc(tloris)}</p>` : '') +
    (attachments.length ? `<p style="margin:20px 0 0;color:#6f6a63">Priloge: ${attachments.length} (fotografije${tloris ? ' in tloris' : ''})</p>` : '') +
    `</div>`;

  try {
    await send({
      from: FROM, to: [TO], reply_to: email,
      subject: `Povpraševanje: ${tip} – ${ime}`,
      text, html, attachments
    });
  } catch (e) {
    console.error('Pošiljanje ni uspelo:', e.message);
    return reply(502, false, 'Sporočila ni bilo mogoče poslati.');
  }

  // potrditev stranki (če ne uspe, povpraševanje je vseeno oddano)
  try {
    await send({
      from: FROM, to: [email], reply_to: TO,
      subject: 'Prejeli smo vaše povpraševanje – Pobeli Me',
      text: `Pozdravljeni, ${ime}!\n\nHvala za vaše povpraševanje. Oglasili se vam bomo v 24 urah z brezplačno oceno.\n\nLep pozdrav,\nPobeli Me\nwww.pobelime.si · info@pobelime.si`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#101014;line-height:1.6"><p>Pozdravljeni, ${esc(ime)}!</p>` +
        `<p>Hvala za vaše povpraševanje. Oglasili se vam bomo v 24 urah z brezplačno oceno.</p>` +
        `<p>Lep pozdrav,<br><b>Pobeli Me</b><br><a href="https://www.pobelime.si">www.pobelime.si</a> · info@pobelime.si</p></div>`
    });
  } catch (e) { console.error('Potrditev stranki ni uspela:', e.message); }

  return reply(200, true, 'Povpraševanje je bilo poslano.');
};
