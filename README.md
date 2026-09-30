# POBELI ME — spletna stran

Pleskarstvo & barvni studio. Statična spletna stran (HTML / CSS / JS, brez build orodij).

## Odpri lokalno
- Najlažje: dvoklikni `index.html` (deluje neposredno iz `file://`).
- Ali zaženi strežnik:
  ```bash
  python3 -m http.server 4321
  # nato odpri http://localhost:4321
  ```

## Datoteke
| Datoteka | Opis |
|---|---|
| `index.html` | Struktura in vsa vsebina |
| `styles.css` | Oblikovanje, animacije, odzivnost |
| `script.js` | Interakcije (kurzor, razkrivanje, števci, obrazec, FAQ) |
| `assets/logo.png` | Logotip |
| `assets/favicon-*.png` | Ikone za zavihek / telefon |
| `assets/og-image.png` | Predogled za družbena omrežja (1200×630) |
| `site.webmanifest` | PWA manifest |
| `robots.txt`, `sitemap.xml` | SEO |

## Strani
`index.html` (domov), `storitve.html`, `projekti.html`, `postopek.html`, `cena.html` (kalkulator + risanje tlorisa, `tloris.js`), `o-nas.html`, `vprasanja.html`, `kontakt.html`.

## Kontaktni obrazec (Vercel + Resend)
- Obrazec pošlje povpraševanje na `/api/contact` (datoteka `api/contact.js`), ta pa prek [Resend](https://resend.com) pošlje mail na info@pobelime.si (s fotografijami in tlorisom) ter potrditev stranki.
- Fotografije se v brskalniku pred pošiljanjem pomanjšajo (Vercel sprejme največ ~4,5 MB na zahtevo).
- V Vercelu → Settings → Environment Variables nastavi:
  - `RESEND_API_KEY` = ključ iz Resenda (obvezno)
  - `CONTACT_TO` = kam gredo povpraševanja (neobvezno, privzeto info@pobelime.si)
- Domena pobelime.si mora biti v Resendu potrjena (Domains → Verified), sicer mail iz info@pobelime.si ne gre ven.
- `contact.php` ni več v uporabi (Vercel PHP ne izvaja).

## Objava (brezplačno)
Povleci mapo na [Netlify Drop](https://app.netlify.com/drop) ali [Vercel](https://vercel.com) — stran je takoj na spletu.
