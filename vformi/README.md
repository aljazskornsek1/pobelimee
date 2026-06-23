# V FORMI — fitnes aplikacija (PWA)

Mobilna aplikacija v slogu MyFitnessPal. Brez build orodij — čisti HTML/CSS/JS + Service Worker (PWA).

## Zagon lokalno
```bash
cd "pobeli mi jetra"
ruby ".claude/serve_vformi.rb"     # streže mapo vformi na portu 4399
# odpri http://127.0.0.1:4399/
```
> Kamera (skeniranje kod) in Service Worker delujeta samo na `localhost` ali `https://` — ne na `file://`.

## Funkcije
- **Uvodna animacija** (splash) z logotipom ob zagonu.
- **Krog kalorij** na domačem zaslonu, ki se polni ko vnašaš hrano (Ostane = Cilj − Hrana + Vadba) + makro stolpci.
- **Spodnja navigacija**: Domov · Dnevnik · (+) · Napredek · Več.
- **Vnos hrane** iz baze (122 živil) z izbiro gramature + makro izračun.
- **Skeniranje črtne kode** (kamera + `BarcodeDetector`) → poišče izdelek v [Open Food Facts](https://world.openfoodfacts.org) (brezplačen API). Ročni vnos kode kot rezerva.
- **Dnevnik** po obrokih (zajtrk/kosilo/večerja/prigrizki) + "opiši svoj dan" za eksperta (24h).
- **Napredek**: graf teže, % telesne maščobe (trenutno → cilj), dnevnik počutja.
- **PRO** (9,99 € / 29,99 €): treningi M/Ž po cilju, LIVE trener, 100+ receptov po kategorijah.
- **Skupnost** s komentarji.
- Vsi podatki v `localStorage` (na napravi).

## Namestitev kot aplikacija (PWA)
Na telefonu odpri stran v Chrome/Safari → meni → **"Dodaj na začetni zaslon"**. Zažene se v celozaslonskem načinu z ikono.

## Kaj rabi zaledje (trenutno simulirano)
| Funkcija | Status | Za produkcijo |
|---|---|---|
| Plačilo 9,99/29,99 € | demo odklep | Stripe + uporabniški računi |
| Apple Health / Google Fit | simuliran uvoz | native most (Capacitor HealthKit / Health Connect) |
| Skeniranje kode | **deluje** (OFF API) | po želji lasten katalog izdelkov |
| Ocena hrane iz slike | — | AI vision API |
| Ekspert v 24h | shrani vnos | admin/e-pošta + obvestila |

## Pot do Google Play / App Store
Spletni del je pripravljen kot PWA. Za trgovine:
1. **PNG ikone** (192, 512, maskable) — generiraj iz `icon.svg` (npr. realfavicongenerator.net ali `rsvg-convert`).
2. **Android**: ovij PWA v **TWA** (Bubblewrap) → `.aab` za Google Play.
3. **iOS**: ovij v **Capacitor** (WKWebView) → Xcode → App Store. HealthKit in plačila (StoreKit) se vežejo prek Capacitor vtičnikov.
