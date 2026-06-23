/* V FORMI — blog. Strokovni članki z viri (DOI). Slike: assets/blog/*.jpg (s fallbackom na barvno ploskev). */
const ARTICLES = [
  {
    id: "zakaj",
    title: "Zakaj V FORMI — naša vizija in misija",
    excerpt: "Zdravje je edina stvar, ki je ne moreš kupiti. Tukaj je, zakaj obstajamo.",
    read: "4 min branja",
    grad: "linear-gradient(135deg,#1f8f6e,#0a1812)",
    emoji: "🌿",
    html: `
      <p class="hook">Lahko si kupiš avto, telefon, večerjo v najboljši restavraciji. Ne moreš pa si kupiti zdravja nazaj, ko ga enkrat izgubiš. V FORMI smo zgradili prav okoli te ene resnice.</p>

      <div class="tldr">
        <b>Na kratko</b>
        <ul>
          <li><b>Vizija:</b> Slovenija, kjer je skrb zase samoumevna, ne razkošje.</li>
          <li><b>Misija:</b> z vsako majhno spremembo narediti Slovence bolj zdrave.</li>
          <li><b>Kako:</b> preprosto, pošteno, znanstveno podprto — brez pravljic.</li>
        </ul>
      </div>

      <h4>Problem, ki ga vidimo</h4>
      <p>Delamo predolgo, sedimo preveč, jemo na hitro in spimo premalo. Ljudje si <b>želijo</b> spremembe, a se izgubijo med tisočimi nasveti, dietami in modnimi muhami. Večina aplikacij šteje kalorije — a ne pove, kaj naj danes dejansko narediš.</p>

      <h4>Naša vizija</h4>
      <p>Predstavljamo si Slovenijo, kjer je gibanje del dneva, kuhanje preprosto, spanje spoštovano in kjer skrb zase ni nekaj, kar odlašaš »za enkrat, ko bo več časa«. Vizija ni popolno telo — vizija je <b>več zdravih let življenja</b>.</p>

      <h4>Naša misija</h4>
      <p>Biti spremljevalec, ki ti pokaže <b>kje si</b>, <b>kam greš</b> in <b>točno naslednji korak</b>. Vsak obrok, ki ga vneseš, vsak trening, vsaka skodelica vode namesto sladke pijače — majhne zmage, ki se seštevajo v drugačno življenje.</p>

      <h4>Naše obljube</h4>
      <ul>
        <li><b>Pošteno:</b> realni cilji in pravi izračuni, ne praznih obljub.</li>
        <li><b>Znanstveno:</b> nasveti, podprti z raziskavami (poglej naš blog).</li>
        <li><b>Osebno:</b> načrt prilagojen tebi — tvojemu cilju, nivoju in tempu.</li>
        <li><b>Skupaj:</b> skupnost in podpora, da nisi nikoli sam.</li>
      </ul>

      <p>Ne obljubljamo bližnjic. Obljubljamo orodje, ki deluje, in vztrajnost, ki šteje. Ker če lahko ena sprememba na dan, pri enem človeku, sčasoma spremeni celo državo — potem je vredno.</p>
      <p class="story__sign">— Ekipa V FORMI 🌿</p>`,
  },
  {
    id: "kofein",
    title: "Kofein: majhna molekula, velik učinek",
    excerpt: "Kdaj, koliko in zakaj — strokovni pregled z raziskavami.",
    read: "7 min branja",
    grad: "linear-gradient(135deg,#2b2017,#0c0a08)",
    emoji: "☕",
    img: "assets/blog/kafein.jpg",
    html: `
      <p class="hook">Ena skodelica zjutraj te prebudi. Pravi odmerek ob pravem času pa lahko izboljša tvoj trening, zbranost in razpoloženje — a ista molekula ti zna ukrasti spanec. Kofein je najbolj raziskano legalno poživilo na svetu. Tukaj je, kar pravi znanost.</p>

      <div class="tldr">
        <b>Povzetek (TL;DR)</b>
        <ul>
          <li><b>Za zmogljivost:</b> 3–6 mg kofeina na kg telesne teže, 30–60 min pred vadbo.</li>
          <li><b>Varna meja:</b> do 400 mg/dan za odrasle (≈ 4–5 skodelic kave).</li>
          <li><b>Spanec:</b> zadnji kofein vsaj 8 ur pred spanjem — razpolovni čas je ~5 ur.</li>
        </ul>
      </div>

      <h4>Kaj sploh je kofein?</h4>
      <p>Kofein je naravni alkaloid, ki deluje kot stimulans osrednjega živčnega sistema. V možganih blokira receptorje za adenozin — snov, ki se čez dan kopiči in povzroča občutek utrujenosti. Ko je adenozin blokiran, se zmanjša zaznava utrujenosti, poveča pa budnost in odzivnost.</p>

      <h4>1. Dokazan učinek na športno zmogljivost</h4>
      <p>Mednarodno združenje za športno prehrano (ISSN) v svojem strokovnem stališču zaključuje, da kofein v odmerku <b>3–6 mg/kg</b> telesne teže zanesljivo izboljša vzdržljivost, mišično moč in zbranost, če je zaužit 30–60 minut pred naporom. Za 80 kg osebo je to približno 240–480 mg.</p>
      <p class="ref">Guest NS et al. <i>International Society of Sports Nutrition position stand: caffeine and exercise performance.</i> J Int Soc Sports Nutr. 2021. DOI: 10.1186/s12970-020-00383-4</p>

      <h4>2. Zbranost in razpoloženje</h4>
      <p>Z blokado adenozina kofein izboljša budnost, reakcijski čas in koncentracijo — učinek je najbolj izrazit pri pomanjkanju spanja in pri ljudeh, ki ga ne uživajo redno (s pogosto rabo se razvije toleranca).</p>

      <h4>3. Koliko je varno?</h4>
      <p>Evropska agencija za varnost hrane (EFSA) ocenjuje, da je za zdrave odrasle varno <b>do 400 mg/dan</b>, posamezni odmerek do 200 mg ne vzbuja skrbi. Nosečnicam priporočajo manj kot 200 mg/dan.</p>
      <p class="ref">EFSA Panel on Dietetic Products, Nutrition and Allergies. <i>Scientific Opinion on the safety of caffeine.</i> EFSA Journal. 2015. DOI: 10.2903/j.efsa.2015.4102</p>

      <h4>4. Past spanja</h4>
      <p>Razpolovni čas kofeina je približno <b>5 ur</b> (pri nekaterih do 8). Kontrolirana študija je pokazala, da 400 mg kofeina, zaužitega celo <b>6 ur pred spanjem</b>, opazno skrajša in poslabša spanec — pogosto, ne da bi se tega zavedali.</p>
      <p class="ref">Drake C et al. <i>Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed.</i> J Clin Sleep Med. 2013. DOI: 10.5664/jcsm.3170</p>

      <h4>Preveč ni dobro</h4>
      <p>Prekomeren vnos lahko povzroči nespečnost, tesnobo, pospešen srčni utrip, tresenje in prebavne težave. Manj je pogosto več.</p>

      <h4>Praktični nasveti V FORMI</h4>
      <ul>
        <li>Trening: ~3 mg/kg približno 45 min prej.</li>
        <li>Čez dan: manjši odmerki (50–100 mg) pogosteje delujejo bolje kot en velik.</li>
        <li>Vsakih nekaj tednov naredi 1–2 tedna premora, da ponastaviš toleranco.</li>
        <li>Po 14. uri previdno — zaradi spanca, ki je temelj regeneracije.</li>
      </ul>
      <p class="src">Viri: ISSN Position Stand (JISSN 2021) · EFSA Scientific Opinion (2015) · Drake et al. (JCSM 2013).</p>`,
  },
  {
    id: "sladkor",
    title: "Zakaj so pijače brez sladkorja boljše",
    excerpt: "Tekoče kalorije, ki jih telo ne zazna kot hrano.",
    read: "5 min branja",
    grad: "linear-gradient(135deg,#3a1414,#0c0808)",
    emoji: "🥤",
    html: `
      <p class="hook">Popiješ 200 kcal sladke pijače — in pri kosilu ne poješ nič manj. V tem je past: tekoče kalorije se v telesu obnašajo drugače kot hrana.</p>
      <div class="tldr"><b>Povzetek</b><ul><li>Tekoče kalorije skoraj ne nasitijo.</li><li>Redno uživanje povezano z višjim tveganjem za sladkorno bolezen tipa 2.</li><li>"Zero" različice so boljše od navadnih, voda pa ostaja najboljša.</li></ul></div>
      <h4>1. Tekoče kalorije ne nasitijo</h4>
      <p>Raziskave kažejo, da telo kalorij iz pijač skoraj ne kompenzira pri naslednjem obroku — kar olajša nastanek presežka in pridobivanje teže.</p>
      <p class="ref">Pan A, Hu FB. <i>Effects of carbohydrates on satiety.</i> Curr Opin Clin Nutr Metab Care. 2011. DOI: 10.1097/MCO.0b013e328346df36</p>
      <h4>2. Povezava s sladkorno boleznijo tipa 2</h4>
      <p>Velika meta-analiza je pokazala, da je 1–2 sladkani pijači na dan povezani z izrazito višjim tveganjem za sladkorno bolezen tipa 2.</p>
      <p class="ref">Malik VS et al. <i>Sugar-sweetened beverages and risk of metabolic syndrome and type 2 diabetes.</i> Diabetes Care. 2010. DOI: 10.2337/dc10-1079</p>
      <h4>3. Kaj pa "zero" pijače?</h4>
      <p>Različice z umetnimi sladili imajo skoraj nič kalorij in ne dvigujejo krvnega sladkorja — torej so boljša izbira od navadnih. A najboljša izbira ostaja voda, nesladkan čaj ali voda z limono. WHO priporoča prosti sladkor pod 10 % (idealno pod 5 %) dnevne energije.</p>
      <p class="src">Viri: Malik et al. (Diabetes Care 2010) · Pan &amp; Hu (2011) · WHO Sugars Guideline (2015).</p>`,
  },
  {
    id: "riba",
    title: "Popolna jed za poletje: lahka bela riba",
    excerpt: "Omega-3, malo kalorij, hitra priprava — recept vključen.",
    read: "4 min branja",
    grad: "linear-gradient(135deg,#10243a,#080d12)",
    emoji: "🐟",
    html: `
      <p class="hook">Poleti si želimo nekaj lahkega in osvežilnega. Bela riba s solato je natanko to — visoko beljakovinski obrok z malo kalorijami in z maščobami, ki dobro denejo srcu.</p>
      <div class="tldr"><b>Povzetek</b><ul><li>Bogata z omega-3 (EPA/DHA) — zdravje srca.</li><li>~20 g beljakovin na 100 g, malo kalorij.</li><li>AHA priporoča 2 obroka rib na teden.</li></ul></div>
      <h4>Zakaj je riba tako zdrava</h4>
      <ul><li><b>Omega-3 maščobne kisline</b> znižujejo trigliceride in vnetja.</li><li><b>Kakovostne beljakovine</b> za sitost in ohranjanje mišic med hujšanjem.</li><li><b>Malo nasičenih maščob</b>, veliko joda, selena in vitamina D.</li></ul>
      <h4>Recept: Pečena bela riba z limono in zelenjavo · ~320 kcal · 25 min</h4>
      <p><b>Sestavine:</b> 180 g filejev bele ribe, 200 g cukinij in paprike, 1 žlica olivnega olja, 1/2 limone, česen, sol, poper, bazilika.</p>
      <p><b>Priprava:</b></p>
      <ol><li>Pečico segrej na 200 °C.</li><li>Zelenjavo razporedi po pekaču, pokapljaj z oljem.</li><li>Ribo položi na vrh, začini, dodaj limono in česen.</li><li>Peci 15–18 min, dokler se riba ne lušči.</li><li>Posuj s svežo baziliko in postrezi.</li></ol>
      <p><b>Makrohranila:</b> ~38 g beljakovin · ~10 g OH · ~14 g maščob.</p>
      <p class="src">Viri: American Heart Association (priporočila o ribah) · USDA FoodData Central.</p>`,
  },
];
if (typeof window !== "undefined") window.ARTICLES = ARTICLES;
