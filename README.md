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

## Kaj je treba posodobiti pred objavo
- **Kontakt:** telefon `+386 70 577 333` in e-pošta `info@pobelime.si` (v `index.html` ter v JSON-LD v `<head>`).
- **Kontaktni obrazec:** pošilja na `contact.php`, zato mora biti stran objavljena na hostingu s podporo za PHP in pošiljanje e-pošte.
- **Domena:** vse `https://pobelime.si/` zamenjaj s svojo (meta oznake, sitemap, robots, manifest).
- **Instagram:** povezava `@pobeli.me`.
- **Obrazec:** trenutno pokaže potrditveno sporočilo brez pošiljanja. Za pravo pošiljanje poveži npr. [Formspree](https://formspree.io) ali lasten backend.

## Objava (brezplačno)
Povleci mapo na [Netlify Drop](https://app.netlify.com/drop) ali [Vercel](https://vercel.com) — stran je takoj na spletu.
