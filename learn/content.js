// Stars & Shade: the Nebula. Study layer for the tour and the chart-sentence builder.
// Zingers and mottos always come from CARDS (Mom's words). This file only holds the teaching around them.

// Chart sentence builder: Planet = WHAT, Sign = HOW, House = WHERE.
window.BUILD = {
  what: {
    "013": "Your core self", "014": "Your emotional world", "015": "Your mind", "016": "Your heart (and your taste)",
    "017": "Your drive", "018": "Your luck", "019": "Your discipline", "020": "Your inner rebel",
    "021": "Your imagination", "022": "Your power to transform"
  },
  how: {
    "001": "charges in boldly and first", "002": "moves slow, steady and in total comfort", "003": "stays curious, chatty and quick",
    "004": "protects, nurtures and feels everything", "005": "shines big, warm and proud", "006": "notices every detail and fixes it",
    "007": "seeks balance, beauty and fairness", "008": "goes deep, intense and all-in", "009": "roams free, honest and optimistic",
    "010": "builds patiently for the long game", "011": "breaks the mold its own way", "012": "flows dreamy, intuitive and kind"
  },
  where: {
    "023": "in how you show up and come across", "024": "around money, stuff and self-worth", "025": "in conversations, learning and your neighborhood",
    "026": "at home and with family", "027": "in fun, romance and creativity", "028": "in daily routines, work and health",
    "029": "in committed partnerships", "030": "in intimacy, shared money and deep change", "031": "through travel, study and big beliefs",
    "032": "in your career and public reputation", "033": "with friends, groups and future dreams", "034": "behind the scenes, in rest and spirit"
  },
  ord: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"]
};

// Astrology 101 guided tour. cam = where the camera flies, hl = what glows, fx = special effect.
window.TOUR = [
  { k: "Astrology 101 · 1 of 11", h: "Your chart is a snapshot",
    p: "Your birth chart is a picture of the sky at the exact minute you were born. It doesn't control you. Think of it as a mirror with really good lighting.",
    cam: "wide", hl: [], fx: "wheel" },
  { k: "2 of 11", h: "Planets = WHAT",
    p: "Each planet is an energy, a part of you. Their mottos are the verbs: <em>I express, I attract, I act</em>. Tap any planet to meet it.",
    cam: "planets", hl: ["Planet"] },
  { k: "3 of 11", h: "Signs = HOW",
    p: "The 12 signs ring the outside. They're the style an energy moves in. Their mottos are the flavor: <em>I desire, I build, I rebel</em>.",
    cam: "signs", hl: ["Zodiac"] },
  { k: "4 of 11", h: "Houses = WHERE",
    p: "The 12 slices are the houses: the areas of life where it all plays out. Their mottos are the arena: <em>I partner, I value, I achieve</em>.",
    cam: "houses", hl: ["House"] },
  { k: "5 of 11", h: "The formula",
    p: "Put them together and the mottos read like a sentence. <b>Venus in Scorpio in the Seventh House</b>: <em>I attract + I desire + I partner</em>. Loves intensely and wants all-or-nothing partnerships. Situationships? Not invited.",
    cam: "formula", hl: ["016", "008", "029"], fx: "formula" },
  { k: "6 of 11", h: "Your Big Three",
    p: "<b>Sun</b> (I express) is who you are at the core. <b>Moon</b> (I react) is what you need to feel safe. <b>Rising</b> (I approach) is how you walk into the room, and it needs your exact birth time.",
    cam: "big3", hl: ["013", "014", "035"] },
  { k: "7 of 11", h: "The four elements",
    p: "Every sign belongs to an element, and each element draws a triangle on the wheel. <b>Fire</b> says go. <b>Earth</b> says build. <b>Air</b> says talk it out. <b>Water</b> says feel it first.",
    cam: "wide", hl: ["041", "042", "043", "044"], fx: "trines" },
  { k: "8 of 11", h: "Starters, keepers, shifters",
    p: "<b>Cardinal</b> signs start things (Aries, Cancer, Libra, Capricorn). <b>Fixed</b> signs keep things going (Taurus, Leo, Scorpio, Aquarius). <b>Mutable</b> signs adapt (Gemini, Virgo, Sagittarius, Pisces). Each set draws a cross.",
    cam: "signs", hl: ["Zodiac"], fx: "crosses" },
  { k: "9 of 11", h: "The extras",
    p: "<b>Midheaven</b> is your career north star at the very top. The <b>Nodes</b> are your growth edge and comfort zone: lean north, visit south. <b>Lot of Fortune</b> is where luck flows. <b>Retrograde</b> is a planet's review season, not a reason to cancel your life.",
    cam: "points", hl: ["Misc"] },
  { k: "10 of 11", h: "How to actually use this",
    p: "Make your chart in the Nebula (My Sky tab): birth date, time and city. Start with your Big Three. Then do one card a day: the deck is a 44-day cycle. Watch it, say the motto out loud, and notice where that energy shows up.",
    cam: "wide", hl: [] },
  { k: "11 of 11", h: "The memory chant",
    p: "The 12 sign mottos in order read like a life story. Watch the ring: <em>I am, I have, I think, I feel, I will, I analyze, I balance, I desire, I see, I build, I rebel, I believe.</em> Astrology is a vibe check, not a verdict.",
    cam: "signs", hl: ["Zodiac"], fx: "chant" }
];

window.SIGN_EL = { "001": "Fire", "002": "Earth", "003": "Air", "004": "Water", "005": "Fire", "006": "Earth", "007": "Air", "008": "Water",
  "009": "Fire", "010": "Earth", "011": "Air", "012": "Water" };
window.SIGN_MODE = { "001": "Cardinal", "002": "Fixed", "003": "Mutable", "004": "Cardinal", "005": "Fixed", "006": "Mutable", "007": "Cardinal",
  "008": "Fixed", "009": "Mutable", "010": "Cardinal", "011": "Fixed", "012": "Mutable" };
window.GLYPH = {
  "001": "♈", "002": "♉", "003": "♊", "004": "♋", "005": "♌", "006": "♍", "007": "♎", "008": "♏", "009": "♐", "010": "♑", "011": "♒", "012": "♓",
  "013": "☉", "014": "☽", "015": "☿", "016": "♀", "017": "♂", "018": "♃", "019": "♄", "020": "♅", "021": "♆", "022": "♇",
  "023": "1", "024": "2", "025": "3", "026": "4", "027": "5", "028": "6", "029": "7", "030": "8", "031": "9", "032": "10", "033": "11", "034": "12",
  "035": "AC", "036": "℞", "037": "☊", "038": "☋", "039": "MC", "040": "⊗", "041": "▽", "042": "△", "043": "△", "044": "▽"
};
