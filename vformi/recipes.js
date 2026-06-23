/* V FORMI — recepti po kategorijah s POLNIM postopkom (koraki kot seznam) in makri.
   zdravo (50), hujsanje (50), bulk (20). Vsak ima emoji ilustracijo. */
const RECIPES = (() => {
  const PROT = [
    ["piščančje prsi", 165, 31, 0, 3.6, "🍗"], ["puranje prsi", 135, 29, 0, 2, "🦃"],
    ["losos", 208, 20, 0, 13, "🐟"], ["bela riba (orada)", 96, 20, 0, 2, "🐠"],
    ["tuna", 116, 24, 0, 1, "🐟"], ["pusto goveje meso", 187, 26, 0, 9, "🥩"],
    ["jajca", 155, 13, 1, 11, "🥚"], ["skuta", 98, 17, 3, 1, "🧀"],
    ["grški jogurt", 59, 10, 4, 0.4, "🥛"], ["tofu", 76, 8, 2, 5, "🧊"],
    ["kozice", 99, 24, 0, 0.3, "🦐"], ["leča", 116, 9, 20, 0.4, "🫘"], ["čičerika", 164, 9, 27, 3, "🫛"],
  ];
  const CARB = [
    ["rjavi riž", 123, 3, 26, 1], ["basmati riž", 130, 3, 28, 0.3], ["batat", 86, 2, 20, 0.1],
    ["kvinoja", 120, 4, 21, 2], ["polnozrnate testenine", 124, 5, 25, 1], ["bulgur", 83, 3, 19, 0.2],
    ["krompir", 87, 2, 20, 0.1], ["njoki", 130, 4, 27, 0.5],
  ];
  const VEG = [["brokoli", 34, "🥦"], ["špinača", 23, "🍃"], ["paprika", 31, "🫑"], ["bučke", 17, "🥒"],
    ["paradižnik", 18, "🍅"], ["šparglji", 20, "🌿"], ["mešana solata", 17, "🥗"], ["korenje", 41, "🥕"],
    ["cvetača", 25, "🥦"], ["šampinjoni", 22, "🍄"]];
  const FAT = [["olivno olje", 884, 100], ["mandlji", 579, 50], ["arašidovo maslo", 588, 50]];
  const round = (n) => Math.round(n), cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let seed = 11; const rnd = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };

  function protStep(name, gr) {
    if (/losos|riba|tuna|postrv|polenovk/.test(name)) return `${cap(name)} (${gr} g) začini s soljo, poprom in limono ter peci v pečici na 200 °C približno 12–15 min, dokler se meso ne lušči.`;
    if (/kozice/.test(name)) return `Kozice (${gr} g) na vroči ponvi s česnom popraži 3–4 min, dokler ne postanejo rožnate.`;
    if (/piščan|puran/.test(name)) return `${cap(name)} (${gr} g) nareži na trakove, začini in popeci na žlici olja 6–8 min, da se lepo zapečejo.`;
    if (/govej|svinj/.test(name)) return `${cap(name)} (${gr} g) na močno segreti ponvi popeci 3–4 min na vsaki strani po želeni pečenosti, nato pusti počivati 3 min.`;
    if (/jajca/.test(name)) return `Jajca (${gr} g) razžvrkljaj in na srednjem ognju počasi zapeči v kremasto omleto.`;
    if (/tofu/.test(name)) return `Tofu (${gr} g) popivnaj, nareži na kocke in popeci do hrustljavega (~8 min), na koncu zalij s sojino omako.`;
    if (/skuta|jogurt/.test(name)) return `${cap(name)} (${gr} g) daj v skledo — osnova obroka brez kuhanja.`;
    if (/leč|čičerik/.test(name)) return `${cap(name)} (${gr} g, kuhano/iz konzerve) splakni in pogrej v ponvi z začimbami.`;
    return `${cap(name)} (${gr} g) pripravi po želji.`;
  }
  function carbStep(name, gr) {
    if (/riž|kvinoj|bulgur/.test(name)) return `${cap(name)} (${gr} g) skuhaj v slani vodi po navodilih (riž ~15 min, kvinoja ~12 min), nato odcedi.`;
    if (/testenin|njoki/.test(name)) return `${cap(name)} (${gr} g) skuhaj v slani vreli vodi do al dente, prihrani malo vode od kuhanja.`;
    if (/krompir|batat/.test(name)) return `${cap(name)} (${gr} g) nareži na kose, pokapljaj z oljem in peci v pečici 25 min na 200 °C (lahko vzporedno z beljakovinami).`;
    return `${cap(name)} (${gr} g) pripravi po navodilih na embalaži.`;
  }

  function make(cat, pr, cb, vg, pGr, cGr, vGr, fatGr) {
    const fat = FAT[rnd(FAT.length)];
    const kcal = round(pr[1] * pGr / 100 + cb[1] * cGr / 100 + vg[1] * vGr / 100 + fat[1] * fatGr / 100);
    const p = round(pr[2] * pGr / 100 + cb[2] * cGr / 100);
    const c = round(pr[3] * pGr / 100 + cb[3] * cGr / 100 + vg[1] * vGr / 100 * 0.18);
    const f = round(pr[4] * pGr / 100 + cb[4] * cGr / 100 + fat[2] * fatGr / 100);
    const noCook = /skuta|jogurt/.test(pr[0]);
    const steps = [];
    if (!noCook) steps.push(carbStep(cb[0], cGr));
    steps.push(protStep(pr[0], pGr));
    steps.push(`${cap(vg[0])} (${vGr} g) na hitro popraži 4–5 min (ali postrezi sveže, če gre za solato), da ostane hrustljav.`);
    steps.push(`Vse sestavi na krožnik${noCook ? "" : `, dodaj ${cb[0]}`} in zabeli z ${fat[0]} (${fatGr} g). Začini s soljo, poprom in česnom po okusu.`);
    steps.push(`Postrezi toplo. Po želji okrasi s svežimi zelišči ali limono.`);
    return { name: `${cap(pr[0])} z ${cb[0]} in ${vg[0]}`, cat, emoji: pr[5], kcal, p, c, f, time: 14 + rnd(14), ing: [`${pGr} g ${pr[0]}`, `${cGr} g ${cb[0]}`, `${vGr} g ${vg[0]}`, `${fatGr} g ${fat[0]}`, "sol, poper, česen, začimbe po okusu"], steps };
  }

  const list = [];
  const C = [
    // ZDRAVO (5 ročnih + 45 generiranih)
    { cat: "zdravo", name: "Lososov poke bowl", emoji: "🐟", kcal: 520, p: 34, c: 48, f: 20, time: 20, ing: ["150 g svežega lososa", "120 g kuhanega riža", "1/2 avokada", "50 g edamame", "1/2 kumare", "sojina omaka, sezam, limeta"], steps: ["Riž skuhaj in ohladi do mlačnega.", "Losos nareži na kocke (~1,5 cm) in marinraj 5 min v žlici sojine omake.", "Avokado, kumaro in edamame nareži/pripravi.", "V skledo razporedi riž, nanj losos in zelenjavo.", "Pokapljaj s sojino omako, posuj s sezamom in pokapljaj z limeto."] },
    { cat: "zdravo", name: "Grška solata s feto", emoji: "🥗", kcal: 320, p: 12, c: 14, f: 24, time: 12, ing: ["100 g fete", "1 kumara", "2 paradižnika", "1/2 rdeče čebule", "60 g črnih oliv", "olivno olje, origano, sol"], steps: ["Paradižnik in kumaro nareži na večje kose, čebulo na tanke kolobarje.", "Zloži v skledo, dodaj olive.", "Feto razlomi na večje kose in položi na vrh.", "Pokapljaj z olivnim oljem, posuj z origanom in malo soli.", "Pred serviranjem nežno premešaj."] },
    { cat: "zdravo", name: "Frittata s špinačo in feto", emoji: "🥚", kcal: 290, p: 22, c: 5, f: 20, time: 22, ing: ["4 jajca", "100 g špinače", "50 g fete", "1/2 čebule", "olivno olje, sol, poper"], steps: ["Pečico segrej na 180 °C.", "Čebulo na olju prepraži do mehkega, dodaj špinačo, da uvene.", "Jajca razžvrkljaj, začini in zlij v ponev.", "Posuj z razdrobljeno feto.", "Peci v pečici 12–14 min, dokler se sredina ne strdi.", "Nareži in postrezi toplo ali hladno."] },
    { cat: "zdravo", name: "Bowl s kvinojo in čičeriko", emoji: "🥑", kcal: 450, p: 18, c: 52, f: 19, time: 18, ing: ["100 g kvinoje", "100 g kuhane čičerike", "1/2 avokada", "1 paradižnik", "limonin sok, olje, sol"], steps: ["Kvinojo skuhaj v slani vodi ~12 min in odcedi.", "Čičeriko splakni in po želji pogrej.", "Paradižnik in avokado nareži na kocke.", "Vse zloži v skledo, premešaj s kvinojo.", "Začini z limoninim sokom, oljem in soljo."] },
    { cat: "zdravo", name: "Pečena postrv z limono", emoji: "🐠", kcal: 340, p: 36, c: 4, f: 19, time: 25, ing: ["1 cela postrv (~250 g)", "1/2 limone", "peteršilj", "2 stroka česna", "olivno olje, sol"], steps: ["Pečico segrej na 200 °C.", "Postrv operi, posuši in znotraj posoli.", "Trebušno votlino napolni z rezinami limone, česnom in peteršiljem.", "Položi na pekač, pokapljaj z oljem.", "Peci 20 min, dokler meso ni belo in se lušči."] },
    // HUJŠANJE (5 ročnih + 45)
    { cat: "hujsanje", name: "Skuta z borovnicami in cimetom", emoji: "🫐", kcal: 230, p: 32, c: 18, f: 3, time: 5, ing: ["250 g puste skute", "100 g borovnic", "1/2 žličke cimeta", "ščepec stevije"], steps: ["Skuto daj v skledo in premešaj, da postane kremasta.", "Vmešaj cimet in stevijo.", "Na vrh stresi borovnice.", "Po želji dodaj žličko semen za hrustljavost."] },
    { cat: "hujsanje", name: "Piščančja solata brez majoneze", emoji: "🥗", kcal: 320, p: 38, c: 10, f: 14, time: 15, ing: ["150 g piščančjih prsi", "100 g mešane solate", "1 paradižnik", "1/2 kumare", "olivno olje, kis, sol"], steps: ["Piščanca začini in popeci 6–7 min na vsaki strani, nato nareži.", "Solato, paradižnik in kumaro pripravi v skledi.", "Dodaj topel piščanec.", "Zabeli z žlico olja in kisa, rahlo posoli.", "Premešaj in postrezi takoj."] },
    { cat: "hujsanje", name: "Omleta iz beljakov s šampinjoni", emoji: "🍳", kcal: 200, p: 28, c: 5, f: 7, time: 12, ing: ["5 jajčnih beljakov + 1 celo jajce", "100 g šampinjonov", "pest špinače", "sol, poper"], steps: ["Šampinjone nareži in popeci na suhi ponvi, da izhlapi voda.", "Dodaj špinačo, da uvene.", "Beljake in jajce razžvrkljaj, začini in zlij v ponev.", "Peci na nizkem ognju, dokler se ne strdi, nato prepogni."] },
    { cat: "hujsanje", name: "Tunina solata s fižolom", emoji: "🐟", kcal: 300, p: 34, c: 22, f: 7, time: 10, ing: ["1 konzerva tune v vodi", "100 g rdečega fižola", "1/2 rdeče čebule", "limonin sok, peteršilj, poper"], steps: ["Tuno dobro odcedi.", "Fižol splakni pod mrzlo vodo.", "Čebulo drobno nareži.", "Vse zmešaj v skledi, začini z limono in poprom.", "Posuj s svežim peteršiljem."] },
    { cat: "hujsanje", name: "Zelenjavna juha z lečo", emoji: "🍲", kcal: 250, p: 16, c: 38, f: 3, time: 25, ing: ["100 g rdeče leče", "1 korenje", "1/2 pora", "1 l zelenjavne osnove", "sol, kumina"], steps: ["Korenje in por nareži, na kapljici olja prepraži 3 min.", "Dodaj splaknjeno lečo in zelenjavno osnovo.", "Kuhaj 18–20 min, da leča razpade.", "Po želji delno pretlači v kremo.", "Začini s soljo in kumino."] },
    // BULK (3 ročni + 17)
    { cat: "bulk", name: "Mega proteinski smoothie", emoji: "🥤", kcal: 720, p: 50, c: 80, f: 18, time: 5, ing: ["400 ml mleka", "2 banani", "30 g proteina", "40 g ovsenih kosmičev", "1 žlica arašidovega masla", "1 žlica medu"], steps: ["V blender daj mleko, banani in protein.", "Dodaj ovsene kosmiče, arašidovo maslo in med.", "Mešaj 45–60 s do gladkega.", "Po želji dodaj led ali še malo mleka za gostoto."] },
    { cat: "bulk", name: "Goveji steak s krompirjem in jajci", emoji: "🥩", kcal: 820, p: 55, c: 60, f: 38, time: 25, ing: ["220 g pustega steaka", "300 g krompirja", "2 jajci", "olje, sol, poper, rožmarin"], steps: ["Krompir nareži, pokapljaj z oljem in peci 25 min na 200 °C.", "Steak posoli in popeci 3–4 min na vsaki strani, nato pusti počivati 3 min.", "Jajca speci na oko.", "Vse zloži na krožnik, posuj z rožmarinom in poprom."] },
    { cat: "bulk", name: "Piščanec z arašidovo omako in rižem", emoji: "🍗", kcal: 790, p: 48, c: 75, f: 30, time: 20, ing: ["200 g piščanca", "150 g kuhanega riža", "2 žlici arašidove omake", "100 g brokolija", "sojina omaka, limeta"], steps: ["Riž skuhaj.", "Piščanca nareži in popeci 7 min, da se zapeče.", "Brokoli skuhaj na pari 5 min.", "Arašidovo omako razredči z žlico tople vode in sojine omake.", "Vse zloži na krožnik in prelij z arašidovo omako, pokapljaj z limeto."] },
  ];
  C.forEach(r => list.push(r));
  for (let i = 0; i < 45; i++) list.push(make("zdravo", PROT[rnd(PROT.length)], CARB[rnd(CARB.length)], VEG[rnd(VEG.length)], 150, 90, 150, 10));
  for (let i = 0; i < 45; i++) list.push(make("hujsanje", PROT[rnd(8)], CARB[rnd(CARB.length)], VEG[rnd(VEG.length)], 160, 60, 200, 6));
  for (let i = 0; i < 17; i++) list.push(make("bulk", PROT[rnd(PROT.length)], CARB[rnd(CARB.length)], VEG[rnd(VEG.length)], 220, 160, 150, 15));
  return list;
})();
if (typeof window !== "undefined") window.RECIPES = RECIPES;
