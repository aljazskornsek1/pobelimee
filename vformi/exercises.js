/* V FORMI — knjižnica vaj (vse glavne fitnes vaje po predelih) + generator treningov.
   Vsaka vaja: [ime "slovensko (english)", mišična skupina, oprema, emoji, namig]. */
const EXERCISES = [
  // PRSI
  ["Potisk s klopi (bench press)", "Prsi", "Drog", "🏋️", "Lopatice skupaj, drog do prsi, kontroliran spust."],
  ["Poševni potisk z ročkami (incline dumbbell press)", "Prsi", "Ročke", "📐", "Klop 30–45°, cilja zgornje prsi."],
  ["Potisk z ročkami na klopi (flat dumbbell press)", "Prsi", "Ročke", "💪", "Večji obseg giba kot z drogom."],
  ["Potisk na napravi (chest press machine)", "Prsi", "Naprava", "⚙️", "Stabilno, dobro za začetnike."],
  ["Križanje na škripcih (cable fly)", "Prsi", "Škripec", "🔗", "Rahlo upognjeni komolci, stisk na sredini."],
  ["Razpiranje z ročkami (dumbbell fly)", "Prsi", "Ročke", "🦋", "Širok lok, raztezanje prsi."],
  ["Sklece (push-ups)", "Prsi", "Telo", "🤸", "Telo ravno kot deska, komolci ~45°."],
  ["Dipi za prsi (chest dips)", "Prsi", "Telo", "🤜", "Nagib naprej za prsi."],
  ["Peck deck (pec deck)", "Prsi", "Naprava", "🦾", "Izolacija prsi, počasen tempo."],
  // HRBET
  ["Mrtvi dvig (deadlift)", "Hrbet", "Drog", "⚙️", "Raven hrbet, gib iz bokov, drog ob telesu."],
  ["Zgibi (pull-ups)", "Hrbet", "Drog", "🧗", "Brada nad drogom, kontroliran spust."],
  ["Lat poteg (lat pulldown)", "Hrbet", "Škripec", "🔻", "Prsi gor, vlek do prsi, brez zibanja."],
  ["Veslanje z drogom (barbell row)", "Hrbet", "Drog", "🚣", "Trup ~45°, drog do trebuha."],
  ["Veslanje z ročko (one-arm dumbbell row)", "Hrbet", "Ročke", "💪", "Opora na klop, vlek do boka."],
  ["Veslanje na napravi (seated cable row)", "Hrbet", "Škripec", "🪑", "Prsi naprej, lopatice skupaj."],
  ["T-drog veslanje (T-bar row)", "Hrbet", "Drog", "🇹", "Debelina sredine hrbta."],
  ["Poteg ravnih rok (straight-arm pulldown)", "Hrbet", "Škripec", "📏", "Izolacija širine hrbta."],
  ["Face pull (face pull)", "Hrbet", "Škripec", "😤", "Vlek proti obrazu, zdrava ramena."],
  ["Hiperekstenzije (back extensions)", "Hrbet", "Naprava", "🔙", "Krepi spodnji del hrbta."],
  ["Dvig ramen — šrag (shrugs)", "Hrbet", "Ročke", "🤷", "Cilja trapezius, kratek zadržek na vrhu."],
  // RAMENA
  ["Ramenski potisk z drogom (overhead press)", "Ramena", "Drog", "🙌", "Trebuh napet, drog nad glavo."],
  ["Ramenski potisk z ročkami (dumbbell shoulder press)", "Ramena", "Ročke", "🆙", "Stabilen trup, poln obseg."],
  ["Arnoldov potisk (Arnold press)", "Ramena", "Ročke", "🔄", "Rotacija dlani med potiskom."],
  ["Stranski dvigi (lateral raises)", "Ramena", "Ročke", "✋", "Lahka teža, dvig do višine ramen."],
  ["Sprednji dvigi (front raises)", "Ramena", "Ročke", "👆", "Cilja sprednjo ramo."],
  ["Zadnja rama (reverse fly)", "Ramena", "Ročke", "🔙", "Nagib naprej, stisk lopatic."],
  ["Pokončno veslanje (upright row)", "Ramena", "Drog", "⬆️", "Drog ob telesu do prsi."],
  // BICEPS
  ["Upogib z drogom (barbell curl)", "Biceps", "Drog", "💪", "Komolci ob telesu, brez zibanja."],
  ["Upogib z ročkami (dumbbell curl)", "Biceps", "Ročke", "💪", "Supinacija dlani na vrhu."],
  ["Kladivo (hammer curl)", "Biceps", "Ročke", "🔨", "Nevtralen prijem, cilja podlaket."],
  ["Koncentrirani upogib (concentration curl)", "Biceps", "Ročke", "🎯", "Komolec ob stegnu, počasi."],
  ["Upogib na škripcu (cable curl)", "Biceps", "Škripec", "🔗", "Stalna napetost skozi gib."],
  ["Upogib na pultu (preacher curl)", "Biceps", "Naprava", "⛪", "Stroga izolacija, brez goljufanja."],
  // TRICEPS
  ["Potisk na škripcu (triceps pushdown)", "Triceps", "Škripec", "⬇️", "Komolci pri telesu, polna iztegnitev."],
  ["Francoski potisk (skullcrusher)", "Triceps", "Drog", "💀", "Komolci fiksni, spust do čela."],
  ["Triceps nad glavo (overhead triceps extension)", "Triceps", "Ročke", "🙆", "Razteg dolge glave tricepsa."],
  ["Dipi na klopi (bench dips)", "Triceps", "Telo", "🪑", "Telo blizu klopi, spust do 90°."],
  ["Ozke sklece (close-grip push-ups)", "Triceps", "Telo", "🤲", "Dlani ozko, komolci ob telesu."],
  ["Triceps kickback (triceps kickback)", "Triceps", "Ročke", "🦵", "Nadlaket fiksna, iztegni nazaj."],
  // KVADRICEPS
  ["Počep (squat)", "Kvadriceps", "Drog", "🦵", "Kolena v smeri prstov, globina do paralele."],
  ["Sprednji počep (front squat)", "Kvadriceps", "Drog", "🏋️", "Drog spredaj, pokončen trup."],
  ["Potisk nog (leg press)", "Kvadriceps", "Naprava", "🛗", "Stopala v širini ramen, brez zaklepanja."],
  ["Izpadni koraki (lunges)", "Kvadriceps", "Ročke", "🚶", "Koleno nad gležnjem, trup pokončen."],
  ["Bolgarski počep (Bulgarian split squat)", "Kvadriceps", "Ročke", "🦵", "Zadnja noga na klopi, teža spredaj."],
  ["Izteg nog (leg extension)", "Kvadriceps", "Naprava", "🦿", "Izolacija kvadricepsa, stisk na vrhu."],
  ["Hack počep (hack squat)", "Kvadriceps", "Naprava", "⚙️", "Stabilno, globok počep."],
  ["Stopanje na klop (step-ups)", "Kvadriceps", "Ročke", "🪜", "Pritisni skozi peto sprednje noge."],
  ["Goblet počep (goblet squat)", "Kvadriceps", "Ročke", "🏺", "Utež pred prsmi, globok počep."],
  // ZADNJA LOŽA & GLUTEI
  ["Romunski mrtvi dvig (Romanian deadlift)", "Zadnja loža & glutei", "Drog", "🍑", "Boki nazaj, razteg zadnje lože."],
  ["Hip thrust (hip thrust)", "Zadnja loža & glutei", "Drog", "🍑", "Stisk zadnjice na vrhu, brada navznoter."],
  ["Most za glutee (glute bridge)", "Zadnja loža & glutei", "Telo", "🌉", "Stisk glutejev, počasen spust."],
  ["Upogib nog leže (lying leg curl)", "Zadnja loža & glutei", "Naprava", "🦵", "Cilja zadnjo ložo, poln obseg."],
  ["Upogib nog sede (seated leg curl)", "Zadnja loža & glutei", "Naprava", "🪑", "Stabilen trup, stisk na koncu."],
  ["Brce nazaj na škripcu (cable kickback)", "Zadnja loža & glutei", "Škripec", "🦵", "Izolacija glutejev, brez zibanja."],
  ["Odmik nog (hip abduction)", "Zadnja loža & glutei", "Naprava", "↔️", "Cilja stranske gluteje."],
  // MEČA
  ["Dvig na prste stoje (standing calf raise)", "Meča", "Naprava", "🦶", "Poln obseg, vrh zadrži 1 s."],
  ["Dvig na prste sede (seated calf raise)", "Meča", "Naprava", "🪑", "Cilja globlje mišice meč."],
  // JEDRO
  ["Plank (plank)", "Jedro", "Telo", "🧘", "Telo ravno, zadnjica stisnjena."],
  ["Stranski plank (side plank)", "Jedro", "Telo", "↘️", "Boki gor, telo v ravni liniji."],
  ["Dvigi nog (leg raises)", "Jedro", "Telo", "🦵", "Spodnji del hrbta na tleh, počasen spust."],
  ["Rusko sukanje (Russian twist)", "Jedro", "Telo/Utež", "🔄", "Rotacija iz trupa, ne iz rok."],
  ["Trebušnjaki (crunches)", "Jedro", "Telo", "🔺", "Krajši gib, stisk trebuha."],
  ["Kolo (bicycle crunch)", "Jedro", "Telo", "🚲", "Komolec proti nasprotnemu kolenu."],
  ["Hribolazci (mountain climbers)", "Jedro", "Telo", "⛰️", "Hiter tempo, boki nizko."],
  ["Dotik ramen v opori (shoulder taps)", "Jedro", "Telo", "👏", "Boki mirni, izmenjuj dlani."],
  ["Mrtvi hrošč (dead bug)", "Jedro", "Telo", "🐞", "Spodnji hrbet ob tleh, počasi."],
  // KARDIO
  ["Tek na traku (treadmill)", "Kardio", "Naprava", "🏃", "Lahek do zmeren tempo."],
  ["Sobno kolo (stationary bike)", "Kardio", "Naprava", "🚴", "Konstanten ritem, primeren upor."],
  ["Veslač (rowing machine)", "Kardio", "Naprava", "🚣", "Zaporedje: noge–trup–roke."],
  ["Stepper (stair stepper)", "Kardio", "Naprava", "🪜", "Pokončna drža, ne nasloni se."],
  ["Skiping / HIIT intervali (HIIT intervals)", "Kardio", "Telo", "🔥", "20–40 s polno, 20 s počitek."],
  ["Burpeeji (burpees)", "Kardio", "Telo", "💥", "Sklece + skok, ohrani ritem."],
  ["Kolebnica (jump rope)", "Kardio", "Pripomoček", "🪢", "Lahki skoki iz zapestij."],
  ["Eliptični trenažer (elliptical)", "Kardio", "Naprava", "🌀", "Gladko gibanje, malo udarcev."],
];

const LEVELS = {
  zacetnik: { label: "Začetnik", sets: "2–3", reps: "12–15", rest: "60–90 s", days: 3, note: "Najprej tehnika in redno gibanje. Teže dvigaj postopno." },
  izkusen: { label: "Izkušen", sets: "3–4", reps: "8–12", rest: "60–120 s", days: 4, note: "Progresivna obremenitev — vsak teden malo več teže ali ponovitev." },
  profesionalec: { label: "Profesionalec", sets: "4–5", reps: "6–12 (variiraj)", rest: "90–180 s", days: 5, note: "Periodizacija: izmenjuj fazo moči (6–8) in hipertrofije (10–12)." },
};

const TRAIN_GOALS = {
  funkcionalnost: { label: "🤸 Funkcionalnost", note: "Atletska moč, gibljivost in jedro — telo, ki dobro deluje v vsakdanu in športu." },
  misice: { label: "💪 Grajenje mišic", note: "Hipertrofija — split z dovolj volumna na mišično skupino in progresivno obremenitvijo." },
  definicija: { label: "✨ Boljša definicija", note: "Ohranjanje mišic + več volumna in kondicije za viden, izklesan videz." },
};

const SPLITS = {
  funkcionalnost: {
    moski: [
      ["Polno telo — moč A", ["Počep (squat)", "Potisk s klopi (bench press)", "Veslanje z drogom (barbell row)", "Ramenski potisk z drogom (overhead press)", "Plank (plank)"]],
      ["Atletika & jedro", ["Zgibi (pull-ups)", "Sklece (push-ups)", "Izpadni koraki (lunges)", "Hribolazci (mountain climbers)", "Rusko sukanje (Russian twist)"]],
      ["Polno telo — moč B", ["Mrtvi dvig (deadlift)", "Potisk z ročkami na klopi (flat dumbbell press)", "Veslanje z ročko (one-arm dumbbell row)", "Potisk nog (leg press)", "Dvigi nog (leg raises)"]],
      ["Eksplozivnost & kondicija", ["Burpeeji (burpees)", "Hip thrust (hip thrust)", "Face pull (face pull)", "Dvig na prste stoje (standing calf raise)", "Skiping / HIIT intervali (HIIT intervals)"]],
      ["Polno telo — gib C", ["Romunski mrtvi dvig (Romanian deadlift)", "Poševni potisk z ročkami (incline dumbbell press)", "Lat poteg (lat pulldown)", "Bolgarski počep (Bulgarian split squat)", "Plank (plank)"]],
    ],
    zenska: [
      ["Polno telo (glute poudarek)", ["Hip thrust (hip thrust)", "Počep (squat)", "Veslanje z ročko (one-arm dumbbell row)", "Sklece (push-ups)", "Plank (plank)"]],
      ["Jedro & atletika", ["Izpadni koraki (lunges)", "Hribolazci (mountain climbers)", "Rusko sukanje (Russian twist)", "Dvigi nog (leg raises)", "Face pull (face pull)"]],
      ["Spodnji del & stabilnost", ["Romunski mrtvi dvig (Romanian deadlift)", "Bolgarski počep (Bulgarian split squat)", "Potisk nog (leg press)", "Dvig na prste stoje (standing calf raise)", "Plank (plank)"]],
      ["Kondicija & mobilnost", ["Burpeeji (burpees)", "Skiping / HIIT intervali (HIIT intervals)", "Hip thrust (hip thrust)", "Stranski dvigi (lateral raises)"]],
      ["Polno telo B", ["Mrtvi dvig (deadlift)", "Lat poteg (lat pulldown)", "Izpadni koraki (lunges)", "Ramenski potisk z drogom (overhead press)", "Rusko sukanje (Russian twist)"]],
    ],
  },
  misice: {
    moski: [
      ["Prsi & triceps", ["Potisk s klopi (bench press)", "Poševni potisk z ročkami (incline dumbbell press)", "Križanje na škripcih (cable fly)", "Dipi za prsi (chest dips)", "Potisk na škripcu (triceps pushdown)"]],
      ["Hrbet & biceps", ["Mrtvi dvig (deadlift)", "Zgibi (pull-ups)", "Veslanje z drogom (barbell row)", "Lat poteg (lat pulldown)", "Upogib z drogom (barbell curl)", "Kladivo (hammer curl)"]],
      ["Noge", ["Počep (squat)", "Romunski mrtvi dvig (Romanian deadlift)", "Potisk nog (leg press)", "Izteg nog (leg extension)", "Dvig na prste stoje (standing calf raise)"]],
      ["Ramena & roke", ["Ramenski potisk z ročkami (dumbbell shoulder press)", "Stranski dvigi (lateral raises)", "Zadnja rama (reverse fly)", "Francoski potisk (skullcrusher)", "Upogib z ročkami (dumbbell curl)"]],
      ["Šibke točke & jedro", ["Poševni potisk z ročkami (incline dumbbell press)", "Veslanje na napravi (seated cable row)", "Bolgarski počep (Bulgarian split squat)", "Plank (plank)", "Dvigi nog (leg raises)"]],
    ],
    zenska: [
      ["Glutei & noge", ["Hip thrust (hip thrust)", "Počep (squat)", "Romunski mrtvi dvig (Romanian deadlift)", "Bolgarski počep (Bulgarian split squat)", "Dvig na prste stoje (standing calf raise)"]],
      ["Zgornji del", ["Lat poteg (lat pulldown)", "Veslanje z ročko (one-arm dumbbell row)", "Ramenski potisk z ročkami (dumbbell shoulder press)", "Stranski dvigi (lateral raises)", "Upogib z ročkami (dumbbell curl)"]],
      ["Noge (kvadriceps)", ["Počep (squat)", "Potisk nog (leg press)", "Izpadni koraki (lunges)", "Izteg nog (leg extension)", "Dvig na prste stoje (standing calf raise)"]],
      ["Glutei & jedro", ["Hip thrust (hip thrust)", "Most za glutee (glute bridge)", "Brce nazaj na škripcu (cable kickback)", "Plank (plank)", "Dvigi nog (leg raises)"]],
      ["Polno telo", ["Mrtvi dvig (deadlift)", "Sklece (push-ups)", "Veslanje z drogom (barbell row)", "Hip thrust (hip thrust)", "Rusko sukanje (Russian twist)"]],
    ],
  },
};
SPLITS.definicija = SPLITS.misice;

function buildProgram(level, tgoal, sex) {
  const L = LEVELS[level] || LEVELS.zacetnik;
  if (!SPLITS[tgoal]) tgoal = "misice";
  const sx = (sex === "zenska") ? "zenska" : "moski";
  const repFor = (name) => {
    if (/Plank|plank/.test(name)) return "30–60 s";
    if (/Tek|kolo|Stepper|Veslač|Eliptič|Kolebnica/.test(name)) return "15–20 min";
    if (/HIIT|Burpeeji|Hribolazci/.test(name)) return "30–40 s × 6";
    if (tgoal === "funkcionalnost") return "6–10";
    if (tgoal === "definicija") return "12–20";
    return L.reps;
  };
  const days = SPLITS[tgoal][sx].slice(0, L.days).map(([title, names]) => {
    const list = names.slice();
    if (tgoal === "definicija" && !list.some(n => /HIIT|Tek|Burpeeji/.test(n))) list.push("Skiping / HIIT intervali (HIIT intervals)");
    return { title, items: list.map(n => ({ name: n, sets: L.sets, reps: repFor(n) })) };
  });
  return { level: L, days };
}

if (typeof window !== "undefined") { window.EXERCISES = EXERCISES; window.LEVELS = LEVELS; window.TRAIN_GOALS = TRAIN_GOALS; window.buildProgram = buildProgram; }
