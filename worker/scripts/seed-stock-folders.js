/**
 * Seed worker/stock/<business>/manifest.json folders + rebuild stock-media-library.js.
 *
 * Each Moonrise trade gets its own folder of curated Unsplash/Pexels image IDs and
 * looping Pexels hero/ambient videos so the generate agent can pick on-theme media fast.
 *
 * Hotlinked CDN URLs (not binary downloads) keep deploys small while still giving the
 * agent dedicated spa / dog-grooming / plumber / etc. packs.
 *
 * Run: node worker/scripts/seed-stock-folders.js
 * Optional verify: node worker/scripts/seed-stock-folders.js --verify-images
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "stock");
const LIB_OUT = path.join(__dirname, "..", "stock-media-library.js");

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;
const P = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
const PV = (id, file) => `https://videos.pexels.com/video-files/${id}/${file}`;

/**
 * Shared video keys → absolute looping MP4s (verified Pexels / public CDNs).
 * Only URLs that return HTTP 200 are kept here so generated sites never get dead video.
 */
const VIDEOS = {
  soft: PV("5319759", "5319759-uhd_2560_1440_25fps.mp4"),
  nature: PV("3195394", "3195394-uhd_2560_1440_25fps.mp4"),
  city: PV("3129671", "3129671-uhd_2560_1440_30fps.mp4"),
  ambient: PV("855281", "855281-hd_1920_1080_25fps.mp4"),
  ocean: PV("3571264", "3571264-uhd_2560_1440_30fps.mp4"),
  forest: PV("3209298", "3209298-uhd_2560_1440_25fps.mp4"),
  kitchen: PV("5752729", "5752729-uhd_2560_1440_30fps.mp4"),
  coffee: PV("4763824", "4763824-uhd_2560_1440_24fps.mp4"),
  people: PV("1409899", "1409899-hd_1920_1080_25fps.mp4"),
  workout: PV("2098989", "2098989-hd_1920_1080_30fps.mp4"),
  floral: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  // Trade-specific verified loops
  spa: PV("5319759", "5319759-uhd_2560_1440_25fps.mp4"),
  massage: PV("9335816", "9335816-hd_1920_1080_25fps.mp4"),
  doggroom: PV("6131724", "6131724-uhd_3840_2160_25fps.mp4"),
  barista: PV("4377325", "4377325-uhd_2560_1440_25fps.mp4"),
  barber: PV("1409899", "1409899-hd_1920_1080_25fps.mp4"),
  salon: PV("5319759", "5319759-uhd_2560_1440_25fps.mp4"),
  yoga: PV("4056453", "4056453-hd_1920_1080_30fps.mp4"),
  dental: PV("3045163", "3045163-hd_1920_1080_25fps.mp4"),
  restaurant: PV("5752729", "5752729-uhd_2560_1440_30fps.mp4"),
  construction: PV("3209829", "3209829-uhd_2560_1440_25fps.mp4"),
  auto: PV("3773486", "3773486-hd_1920_1080_30fps.mp4"),
  pets: PV("6131724", "6131724-uhd_3840_2160_25fps.mp4"),
  bakery: PV("4763824", "4763824-uhd_2560_1440_24fps.mp4"),
  landscaping: PV("3195394", "3195394-uhd_2560_1440_25fps.mp4"),
  cleaning: PV("855281", "855281-hd_1920_1080_25fps.mp4"),
  medical: PV("3045163", "3045163-hd_1920_1080_25fps.mp4"),
  realestate: PV("5192157", "5192157-hd_1920_1080_30fps.mp4"),
  office: PV("3129671", "3129671-uhd_2560_1440_30fps.mp4"),
};

function pack(key, label, match, images, videos, extras = {}) {
  return {
    key,
    label,
    match,
    images: [...new Set(images.filter(Boolean))],
    videos: videos.slice(0, 3),
    ...extras,
  };
}

/**
 * Dedicated trade packs Moonrise Business Finder commonly hits.
 * Image IDs are Unsplash photo-* or pexels-<id> (resolved at runtime).
 */
const PACKS = [
  pack(
    "barber",
    "barbershop / men's cuts / fades",
    "/barber|fade|men'?s cut|clipper|barbershop|beard trim|shave shop/i",
    [
      "photo-1503951914875-452162b0f3f1",
      "photo-1621605815971-fbc98d665033",
      "photo-1599351431202-1e0f0137899a",
      "photo-1585747860715-2ba37e788b70",
      "photo-1622286342621-4bd786c2447c",
      "photo-1493256338651-d82f87cc8093",
      "photo-1605497788044-47f0c47b5f7f",
      "photo-1562322140-8baeececf3df",
      "photo-1517832606299-7ae9b720a186",
      "photo-1633681926022-84c23e8cb2d6",
      "photo-1522337360788-8b57ee1e0d60",
      "photo-1507003211169-0a1dd7228f2d",
      "pexels-897262",
      "pexels-1319460",
    ],
    ["barber", "people", "ambient"]
  ),
  pack(
    "salon",
    "hair salon / beauty / blowouts",
    "/hair salon|beauty salon|hairstylist|blowout|colorist|hairdresser/i",
    [
      "photo-1560066984-138dadb4c035",
      "photo-1522337360788-8b57ee1e0d60",
      "photo-1516975080664-ed2fc6a32937",
      "photo-1487412947147-5cebf100ffc2",
      "photo-1522335789203-aabd1fc54bc9",
      "photo-1522337094846-8a818192de1f",
      "photo-1633681926022-84c23e8cb2d6",
      "photo-1595476108010-b4d1f102b1b1",
      "photo-1562322140-8baeececf3df",
      "photo-1522337660859-02fbefca4702",
      "photo-1595475038784-bbe439ff41e6",
      "photo-1616394584738-fc6e612e71b9",
      "pexels-3993449",
      "pexels-3993324",
    ],
    ["salon", "soft", "people"]
  ),
  pack(
    "nails",
    "nail salon / manicure / pedicure",
    "/nail salon|manicure|pedicure|nail tech|nail bar|gel nails/i",
    [
      "photo-1604654894610-df63bc536371",
      "photo-1519014816548-bf5fe059798b",
      "photo-1522335789203-aabd1fc54bc9",
      "photo-1600334129128-685c5582fd35",
      "photo-1632345031435-8727f6897d53",
      "photo-1604654894610-df63bc536371",
      "photo-1487412947147-5cebf100ffc2",
      "photo-1516975080664-ed2fc6a32937",
      "pexels-3997379",
      "pexels-3997380",
      "pexels-939836",
      "pexels-3997381",
    ],
    ["salon", "soft", "floral"]
  ),
  pack(
    "spa",
    "spa / massage / wellness",
    "/\\bspa\\b|massage|wellness|facial|aromatherapy|sauna|hot stone|relaxation/i",
    [
      "photo-1540555700478-4be289fbecef",
      "photo-1556228578-0d85b1a4d571",
      "photo-1600334129128-685c5582fd35",
      "photo-1544161515-4ab6ce6db874",
      "photo-1515377905703-c4788e51af15",
      "photo-1570172619644-dfd03ed5d881",
      "photo-1540553016722-983e48a2cd10",
      "photo-1519823551278-64ac92734fb1",
      "photo-1596178065887-1198b6148b2b",
      "photo-1507652313519-d4e9174996dd",
      "photo-1515378791036-0648a3ef77b2",
      "photo-1578683010236-d716f9a3f461",
      "pexels-3757942",
      "pexels-3865676",
    ],
    ["spa", "massage", "soft"]
  ),
  pack(
    "medspa",
    "med spa / aesthetics / injectables",
    "/med ?spa|medical spa|botox|filler|aesthet|laser hair|skincare clinic/i",
    [
      "photo-1570172619644-dfd03ed5d881",
      "photo-1515377905703-c4788e51af15",
      "photo-1540555700478-4be289fbecef",
      "photo-1616394584738-fc6e612e71b9",
      "photo-1556228578-0d85b1a4d571",
      "photo-1522335789203-aabd1fc54bc9",
      "photo-1487412947147-5cebf100ffc2",
      "photo-1579684385127-1ef15d508118",
      "pexels-3738349",
      "pexels-3738355",
      "pexels-3764013",
      "pexels-3997991",
    ],
    ["spa", "soft", "medical"]
  ),
  pack(
    "tattoo",
    "tattoo / piercing studio",
    "/tattoo|piercing|ink studio|body art/i",
    [
      "photo-1568515387631-8b650bbcdb90",
      "photo-1590245611993-05bd5d7e06e0",
      "photo-1611501275019-9b5cda602e36",
      "photo-1549366021-9f761d450615",
      "photo-1590245611993-05bd5d7e06e0",
      "photo-1568515387631-8b650bbcdb90",
      "pexels-1416530",
      "pexels-1416533",
      "pexels-2195287",
      "pexels-1319459",
      "pexels-897262",
      "photo-1503951914875-452162b0f3f1",
    ],
    ["ambient", "people", "city"]
  ),
  pack(
    "landscaping",
    "landscaping / gardening / lawn care",
    "/landscap|garden|lawn|yard|tree service|hedge|mulch|irrigation|hardscape|plants?/i",
    [
      "photo-1416879595882-3373a0480b5b",
      "photo-1466692476866-aef36cc2a5b0",
      "photo-1585320806297-9794b3e4eeae",
      "photo-1558904541-efa843a96f01",
      "photo-1591857177580-dc82b9ac4e1e",
      "photo-1464226184884-fa280b87c399",
      "photo-1523348837708-15d4a54fcf5f",
      "photo-1501004318641-b39e6451bec6",
      "photo-1470058869958-2a77ade41c02",
      "photo-1466781783364-36c95514d2c8",
      "photo-1485955900006-10f4d324d411",
      "photo-1490750967868-88aa4486c946",
      "pexels-2132227",
      "pexels-296230",
    ],
    ["landscaping", "nature", "forest"]
  ),
  pack(
    "florist",
    "florist / flowers / arrangements",
    "/florist|flower shop|bouquet|floral design|wedding flower/i",
    [
      "photo-1490750967868-88aa4486c946",
      "photo-1468327768560-75b778cbb551",
      "photo-1455659817273-f96807779a8a",
      "photo-1563241527-3004b7be0ffd",
      "photo-1485955900006-10f4d324d411",
      "photo-1470058869958-2a77ade41c02",
      "photo-1466781783364-36c95514d2c8",
      "photo-1501004318641-b39e6451bec6",
      "pexels-931177",
      "pexels-931158",
      "pexels-56866",
      "pexels-1408221",
    ],
    ["floral", "nature", "soft"]
  ),
  pack(
    "plumbing",
    "plumbing / pipes / water heaters",
    "/plumb|pipe|drain|water heater|faucet|toilet|sewer|clog/i",
    [
      "photo-1621905251189-08b45d6a269e",
      "photo-1584622650111-993a426fbf0a",
      "photo-1607472586893-edb57bdc0e39",
      "photo-1558618666-fcd25c85cd64",
      "photo-1504148455328-c376907d081c",
      "photo-1581092160562-40aa08e78837",
      "photo-1621905252507-b35492cc74b4",
      "photo-1581092795360-fd1ca04f0952",
      "photo-1556911220-bff31c812dba",
      "photo-1504328348525-c112f609b9c0",
      "pexels-1249611",
      "pexels-162553",
    ],
    ["construction", "ambient", "people"]
  ),
  pack(
    "electrical",
    "electrician / wiring / panels",
    "/electric|wiring|breaker|panel|lighting install|outlet|circuit/i",
    [
      "photo-1621905252507-b35492cc74b4",
      "photo-1473341304170-971dccb5ac1e",
      "photo-1581092162384-8987c1d64718",
      "photo-1513828583688-c52646db42da",
      "photo-1504148455328-c376907d081c",
      "photo-1581092160562-40aa08e78837",
      "photo-1558618666-fcd25c85cd64",
      "photo-1504307651254-35680f356dfd",
      "pexels-257736",
      "pexels-162553",
      "pexels-585419",
      "photo-1562259949-e8e72308cbe0",
    ],
    ["construction", "city", "people"]
  ),
  pack(
    "hvac",
    "HVAC / heating / air conditioning",
    "/hvac|heating|air ?condition|furnace|ac unit|duct|thermostat|heat pump/i",
    [
      "photo-1581094794329-c8112a89af12",
      "photo-1504307651254-35680f356dfd",
      "photo-1581092160562-40aa08e78837",
      "photo-1621905251189-08b45d6a269e",
      "photo-1558618666-fcd25c85cd64",
      "photo-1565043589251-bf9bf5a55c0b",
      "photo-1541888946425-d81bb19240f5",
      "photo-1503387762-592deb58ef4e",
      "pexels-585419",
      "pexels-1249611",
      "pexels-209251",
      "photo-1607400201889-565b1ee75f8c",
    ],
    ["construction", "ambient", "city"]
  ),
  pack(
    "roofing",
    "roofing / gutters / exterior",
    "/roof|gutter|shingle|exterior|siding/i",
    [
      "photo-1541888946425-d81bb19240f5",
      "photo-1503387762-592deb58ef4e",
      "photo-1589939705387-ba8829e0ac0b",
      "photo-1504307651254-35680f356dfd",
      "photo-1562259949-e8e72308cbe0",
      "photo-1600585154340-be6161a56a0c",
      "photo-1600596542815-ffad4c1539a9",
      "photo-1570129477492-45c003edd2be",
      "pexels-2219024",
      "pexels-209296",
      "pexels-259588",
      "photo-1512917772120-2f13304f0931",
    ],
    ["construction", "city", "ambient"]
  ),
  pack(
    "painting",
    "painting / interior finish",
    "/paint|painter|drywall|wallpaper|interior finish/i",
    [
      "photo-1562259949-e8e72308cbe0",
      "photo-1589939705387-ba8829e0ac0b",
      "photo-1556911220-bff31c812dba",
      "photo-1484154218962-a197022b5858",
      "photo-1556912173-46c336c7fd55",
      "photo-1600566752355-35792bedcfea",
      "photo-1600585152220-90363fe7e115",
      "photo-1504148455328-c376907d081c",
      "pexels-6474471",
      "pexels-6474475",
      "pexels-1571460",
      "photo-1563453392212-326f5e854473",
    ],
    ["construction", "soft", "people"]
  ),
  pack(
    "cleaning",
    "cleaning / janitorial / maid service",
    "/clean|janitor|maid|housekeep|pressure wash|carpet clean|office clean|window clean/i",
    [
      "photo-1563453392212-326f5e854473",
      "photo-1527515637462-cff94eecc1ac",
      "photo-1628177142898-93e36e4e3a50",
      "photo-1581578731548-c64695cc6952",
      "photo-1556912173-46c336c7fd55",
      "photo-1484154218962-a197022b5858",
      "photo-1600585152220-90363fe7e115",
      "photo-1493809842364-78817add7ffb",
      "pexels-4239091",
      "pexels-4239037",
      "pexels-4108715",
      "pexels-6195273",
    ],
    ["cleaning", "soft", "ambient"]
  ),
  pack(
    "construction",
    "construction / contracting / remodeling",
    "/construct|contractor|remodel|builder|renovat|framing|carpentry|general contract|handyman/i",
    [
      "photo-1504307651254-35680f356dfd",
      "photo-1541888946425-d81bb19240f5",
      "photo-1503387762-592deb58ef4e",
      "photo-1581094794329-c8112a89af12",
      "photo-1589939705387-ba8829e0ac0b",
      "photo-1562259949-e8e72308cbe0",
      "photo-1607400201889-565b1ee75f8c",
      "photo-1504148455328-c376907d081c",
      "pexels-2219024",
      "pexels-1216589",
      "pexels-159306",
      "pexels-209251",
    ],
    ["construction", "city", "people"]
  ),
  pack(
    "pestcontrol",
    "pest control / exterminator",
    "/pest|exterminat|termite|rodent|bug control|mosquito/i",
    [
      "photo-1581578731548-c64695cc6952",
      "photo-1504148455328-c376907d081c",
      "photo-1558618666-fcd25c85cd64",
      "photo-1621905251189-08b45d6a269e",
      "photo-1607472586893-edb57bdc0e39",
      "photo-1560518883-ce09059eeffa",
      "photo-1600585154340-be6161a56a0c",
      "photo-1570129477492-45c003edd2be",
      "pexels-209251",
      "pexels-2219024",
      "pexels-1249611",
      "photo-1504328348525-c112f609b9c0",
    ],
    ["construction", "ambient", "people"]
  ),
  pack(
    "locksmith",
    "locksmith / security keys",
    "/locksmith|lock.?smith|key cutting|rekey|safe open/i",
    [
      "photo-1558618666-fcd25c85cd64",
      "photo-1504148455328-c376907d081c",
      "photo-1581092160562-40aa08e78837",
      "photo-1560518883-ce09059eeffa",
      "photo-1486406146926-c627a92ad1ab",
      "photo-1497366216548-37526070297c",
      "photo-1556761175-5973dc0f32e7",
      "pexels-279810",
      "pexels-280221",
      "pexels-209296",
      "photo-1504328348525-c112f609b9c0",
      "photo-1621905252507-b35492cc74b4",
    ],
    ["city", "ambient", "people"]
  ),
  pack(
    "pool",
    "pool service / spa pools",
    "/pool (?:service|clean|repair)|swimming pool|hot tub service|pool maintenance/i",
    [
      "photo-1576013551627-0cc20b96c2a7",
      "photo-1572331160307-795b9e87ce78",
      "photo-1562778612-e1e0cda9915c",
      "photo-1540541338287-41700207dee6",
      "photo-1519046904884-53103b34b206",
      "photo-1507525428034-b723cf961d3e",
      "photo-1473496169904-658ba7c44d8a",
      "pexels-261327",
      "pexels-189296",
      "pexels-261394",
      "pexels-261327",
      "photo-1439066615861-d1af74d74000",
    ],
    ["ocean", "nature", "soft"]
  ),
  pack(
    "tutoring",
    "tutoring / education / schools",
    "/tutor|tutoring|school|teach|education|homework|math|sat|act|learning|academy|classroom|books?/i",
    [
      "photo-1481627834876-b7833e8f5570",
      "photo-1503676260728-1c00da094a0b",
      "photo-1456513080080-7e9c7f61f9d7",
      "photo-1523050854058-8df90110c9f1",
      "photo-1427504494785-3a9ca7044f45",
      "photo-1509062522246-3755977927d7",
      "photo-1497633762265-9d179a990aa6",
      "photo-1524995997946-a1c2e315a42f",
      "photo-1512820790803-83ca734da794",
      "photo-1434030216411-0b793f4b4173",
      "pexels-256541",
      "pexels-159711",
    ],
    ["people", "soft", "office"]
  ),
  pack(
    "daycare",
    "daycare / childcare / kids",
    "/daycare|childcare|preschool|kids|children|nanny|after ?school/i",
    [
      "photo-1503454537195-1dcabb73ffb9",
      "photo-1587654780291-39c9404d745b",
      "photo-1588072432836-e10032774350",
      "photo-1516627145497-ae6968895b74",
      "photo-1476703993599-0035a21b17a9",
      "photo-1596464716127-f2a82984de30",
      "photo-1503676260728-1c00da094a0b",
      "photo-1509062522246-3755977927d7",
      "pexels-3662667",
      "pexels-3662846",
      "pexels-8613089",
      "pexels-3662850",
    ],
    ["people", "soft", "nature"]
  ),
  pack(
    "musicschool",
    "music school / lessons / instruments",
    "/music (?:school|lesson|teacher)|piano lesson|guitar lesson|violin|drum lesson/i",
    [
      "photo-1511379938547-c1f69419868d",
      "photo-1514320291840-309542f045a8",
      "photo-1507838153414-b4b713384a76",
      "photo-1493225457124-a3eb161ffa5f",
      "photo-1514119412350-e174d90d280e",
      "photo-1520523839897-bd0b52f945a0",
      "photo-1511379938547-c1f69419868d",
      "pexels-164821",
      "pexels-164743",
      "pexels-210922",
      "pexels-33597",
      "photo-1510915361894-db8b60106cb1",
    ],
    ["people", "soft", "ambient"]
  ),
  pack(
    "restaurant",
    "restaurant / dining / fine food",
    "/restaurant|dining|bistro|steakhouse|grill|cuisine|fine dining/i",
    [
      "photo-1414235077428-338989a2e8c0",
      "photo-1517248135467-4c7edcad34c4",
      "photo-1559339352-11d035aa65de",
      "photo-1504674900247-0877df9cc836",
      "photo-1555396273-367ea4eb4db5",
      "photo-1476224203421-9ac39bcb3327",
      "photo-1577219491135-ce391730fb2c",
      "photo-1552566626-52f8b828add9",
      "photo-1466978913421-dad2ebd01d17",
      "photo-1544025162-d76694265947",
      "pexels-262978",
      "pexels-370984",
    ],
    ["restaurant", "kitchen", "people"]
  ),
  pack(
    "pizza",
    "pizza / italian / casual food",
    "/pizza|italian|pizzaria|slice|calzone/i",
    [
      "photo-1513104890138-7c749659a591",
      "photo-1574071318508-1cdbab80d002",
      "photo-1593560708920-61dd98c46a4e",
      "photo-1571997478779-2adcbbe9ab2f",
      "photo-1604382354936-07c5d9983bd3",
      "photo-1588315029754-2dd089d39a1a",
      "photo-1628840042765-356cda07504e",
      "photo-1565299624946-b28f40a0ae38",
      "pexels-905847",
      "pexels-2147491",
      "pexels-1653877",
      "pexels-1566837",
    ],
    ["kitchen", "restaurant", "people"]
  ),
  pack(
    "cafe",
    "cafe / coffee shop",
    "/\\bcafe\\b|coffee shop|espresso|latte|coffeebar/i",
    [
      "photo-1495474472287-4d71bcdd2085",
      "photo-1509042239860-f550ce710b93",
      "photo-1442512595331-e89e73853f31",
      "photo-1497935586351-b67a49e012bf",
      "photo-1511920170033-f8396924c348",
      "photo-1554118811-1e0d58224f24",
      "photo-1501339847302-ac426a4a7cbb",
      "photo-1461023058943-07fcbe16d735",
      "pexels-302899",
      "pexels-312418",
      "pexels-374885",
      "pexels-585750",
    ],
    ["barista", "coffee", "soft"]
  ),
  pack(
    "bakery",
    "bakery / pastry / bread",
    "/bakery|pastry|baker|croissant|sourdough|donut shop|cake shop/i",
    [
      "photo-1509440159596-0249088772ff",
      "photo-1578985545062-69928b1d9587",
      "photo-1517433670267-08bbd4be890f",
      "photo-1495147466023-ac5c588e2e94",
      "photo-1485808191679-5f86510681a2",
      "photo-1559925393-8be0ec4767c8",
      "photo-1509042239860-f550ce710b93",
      "photo-1495474472287-4d71bcdd2085",
      "pexels-1070850",
      "pexels-1775043",
      "pexels-205961",
      "pexels-291528",
    ],
    ["bakery", "coffee", "kitchen"]
  ),
  pack(
    "catering",
    "catering / events / food service",
    "/catering|caterer|event food|banquet|buffet service/i",
    [
      "photo-1555244162-803834f70033",
      "photo-1414235077428-338989a2e8c0",
      "photo-1504674900247-0877df9cc836",
      "photo-1476224203421-9ac39bcb3327",
      "photo-1559339352-11d035aa65de",
      "photo-1517248135467-4c7edcad34c4",
      "photo-1544025162-d76694265947",
      "pexels-587741",
      "pexels-958545",
      "pexels-2290076",
      "pexels-3184192",
      "photo-1555396273-367ea4eb4db5",
    ],
    ["restaurant", "kitchen", "people"]
  ),
  pack(
    "foodtruck",
    "food truck / street food",
    "/food ?truck|street food|mobile kitchen|taco truck/i",
    [
      "photo-1565123409695-7b5ef63a2bbf",
      "photo-1565299585323-38d6b0865b47",
      "photo-1504674900247-0877df9cc836",
      "photo-1565299624946-b28f40a0ae38",
      "photo-1544025162-d76694265947",
      "photo-1555939594-58d7cb561ad1",
      "pexels-1651166",
      "pexels-1651165",
      "pexels-2092898",
      "pexels-2338407",
      "photo-1552566626-52f8b828add9",
      "photo-1513104890138-7c749659a591",
    ],
    ["kitchen", "city", "people"]
  ),
  pack(
    "fitness",
    "gym / fitness / training",
    "/gym|fitness|crossfit|personal train|workout|athletic|weightlifting|boxing/i",
    [
      "photo-1534438327276-14e5300c3a48",
      "photo-1517836357463-d25dfeac3438",
      "photo-1571019614242-c5c5dee9f50b",
      "photo-1540497077202-7c8a3999166f",
      "photo-1518611012118-696072aa579a",
      "photo-1576678927484-cc907957088c",
      "photo-1571019613454-1cb2f99b2d8b",
      "photo-1583454110551-21f2fa2afe61",
      "photo-1517963879433-6ad2b056d712",
      "photo-1541534741688-6078c6bfb5c5",
      "pexels-841130",
      "pexels-416778",
    ],
    ["workout", "city", "people"]
  ),
  pack(
    "yoga",
    "yoga / pilates / mindful movement",
    "/yoga|pilates|meditation|mindful|stretch studio/i",
    [
      "photo-1544367567-0f2fcb009e0b",
      "photo-1506126613408-eca07a6958b0",
      "photo-1599901860904-17e6ed7083a0",
      "photo-1575052814086-f385e2e2ad1b",
      "photo-1545205597-3d9d02c29597",
      "photo-1552196563-55cd4e45efb3",
      "photo-1518611012118-696072aa579a",
      "photo-1540555700478-4be289fbecef",
      "pexels-3822622",
      "pexels-3823039",
      "pexels-4056723",
      "pexels-3822906",
    ],
    ["yoga", "soft", "nature"]
  ),
  pack(
    "martialarts",
    "martial arts / karate / MMA",
    "/martial|karate|taekwondo|jiu.?jitsu|mma|dojo|kickbox/i",
    [
      "photo-1555597673-b21d5c935865",
      "photo-1549719386-271013a383cb",
      "photo-1571019613454-1cb2f99b2d8b",
      "photo-1517963879433-6ad2b056d712",
      "photo-1541534741688-6078c6bfb5c5",
      "photo-1574680096145-d05b474e2155",
      "pexels-4761790",
      "pexels-4754146",
      "pexels-7991579",
      "pexels-4761663",
      "photo-1534438327276-14e5300c3a48",
      "photo-1517836357463-d25dfeac3438",
    ],
    ["workout", "people", "city"]
  ),
  pack(
    "dental",
    "dental / orthodontics",
    "/dental|dentist|orthodont|teeth|oral|invisalign/i",
    [
      "photo-1629909613654-28e377c37b09",
      "photo-1606811841689-23dfddce3e95",
      "photo-1588776814546-1ffcf47267a5",
      "photo-1609840114035-3c981b782dfe",
      "photo-1598256989800-fe5f95da9787",
      "photo-1629909615184-74f495363b67",
      "photo-1607613009820-a29f7bb81c04",
      "photo-1579684385127-1ef15d508118",
      "pexels-3845623",
      "pexels-3845810",
      "pexels-3845625",
      "pexels-3779705",
    ],
    ["dental", "soft", "medical"]
  ),
  pack(
    "medical",
    "medical / clinic / healthcare",
    "/clinic|medical|doctor|health|urgent care|pediatric|family medicine/i",
    [
      "photo-1631217868264-e5b90bb7e133",
      "photo-1579684385127-1ef15d508118",
      "photo-1516549655169-df83a0774514",
      "photo-1666214280557-f1b5022eb634",
      "photo-1559839734-2b71ea197ec2",
      "photo-1582750433449-648ed127bb54",
      "photo-1576091160399-112ba8d25d1d",
      "photo-1584820927498-cfe50432d146",
      "photo-1576091160550-2173dba07efd",
      "photo-1551076805-e1869033fa41",
      "pexels-40568",
      "pexels-263402",
    ],
    ["medical", "soft", "people"]
  ),
  pack(
    "chiropractic",
    "chiropractic / spine care",
    "/chiro|chiropractic|spinal|adjustment/i",
    [
      "photo-1576091160399-112ba8d25d1d",
      "photo-1576091160550-2173dba07efd",
      "photo-1551076805-e1869033fa41",
      "photo-1516574187841-cb9cc2ca948b",
      "photo-1579684385127-1ef15d508118",
      "photo-1544367567-0f2fcb009e0b",
      "photo-1506126613408-eca07a6958b0",
      "pexels-3823207",
      "pexels-4506109",
      "pexels-4506105",
      "pexels-3771118",
      "photo-1559839734-2b71ea197ec2",
    ],
    ["medical", "soft", "yoga"]
  ),
  pack(
    "physicaltherapy",
    "physical therapy / rehab",
    "/physical therap|physio|rehab|sports medicine|occupational therap/i",
    [
      "photo-1576091160550-2173dba07efd",
      "photo-1571019613454-1cb2f99b2d8b",
      "photo-1574680096145-d05b474e2155",
      "photo-1518611012118-696072aa579a",
      "photo-1544367567-0f2fcb009e0b",
      "photo-1576091160399-112ba8d25d1d",
      "pexels-4506108",
      "pexels-4506106",
      "pexels-3823204",
      "pexels-3764011",
      "photo-1551076805-e1869033fa41",
      "photo-1516574187841-cb9cc2ca948b",
    ],
    ["medical", "workout", "soft"]
  ),
  pack(
    "optometry",
    "optometry / eye care / glasses",
    "/optom|eye care|optometrist|vision|eyeglasses|ophthalm/i",
    [
      "photo-1574258495973-f010dfbb5041",
      "photo-1591076482161-42ce6da69f67",
      "photo-1577803645773-f96470509666",
      "photo-1509695507497-903c140aa78b",
      "photo-1579684385127-1ef15d508118",
      "photo-1559839734-2b71ea197ec2",
      "pexels-947885",
      "pexels-3762800",
      "pexels-57690",
      "pexels-279906",
      "photo-1516549655169-df83a0774514",
      "photo-1576091160399-112ba8d25d1d",
    ],
    ["soft", "medical", "people"]
  ),
  pack(
    "doggrooming",
    "dog grooming / pet salon",
    "/dog groom|pet groom|grooming salon|mobile groom|pet spa|dog wash/i",
    [
      "photo-1548199973-03cce0bbc87b",
      "photo-1516734212186-a967f81ad0d7",
      "photo-1601758228041-f3b2795255f1",
      "photo-1583511655857-d19b40a7a54e",
      "photo-1537151608828-ea2b11777ee8",
      "photo-1587300003388-59208cc962cb",
      "photo-1544568100-847a948585b9",
      "photo-1543466835-00a7907e9de1",
      "photo-1583337130417-3346a1be7dee",
      "photo-1598133894008-61f7fdb8cc3a",
      "pexels-1108099",
      "pexels-1805164",
    ],
    ["doggroom", "pets", "nature"]
  ),
  pack(
    "veterinary",
    "veterinary / animal hospital",
    "/veterinar|vet clinic|animal hospital|animal doctor/i",
    [
      "photo-1450778869180-41d0601e046e",
      "photo-1576201837293-033302add65c",
      "photo-1628009368231-7bb7cfcb0def",
      "photo-1612531385446-f7e6d1314a37",
      "photo-1587300003388-59208cc962cb",
      "photo-1548199973-03cce0bbc87b",
      "photo-1514888286974-6c03e2ca1dba",
      "photo-1574158622682-e40e69881006",
      "pexels-6235234",
      "pexels-6235662",
      "pexels-6235233",
      "pexels-1350591",
    ],
    ["pets", "medical", "soft"]
  ),
  pack(
    "pets",
    "pet boarding / daycare / general pets",
    "/\\bpet(?:s)?\\b|pet board|pet daycare|kennel|cattery|\\bcats?\\b|\\bdogs?\\b(?!\\s*groom)/i",
    [
      "photo-1450778869180-41d0601e046e",
      "photo-1514888286974-6c03e2ca1dba",
      "photo-1574158622682-e40e69881006",
      "photo-1425082661705-1834bfd09dca",
      "photo-1543466835-00a7907e9de1",
      "photo-1583337130417-3346a1be7dee",
      "photo-1544568100-847a948585b9",
      "photo-1583511655857-d19b40a7a54e",
      "pexels-1108099",
      "pexels-45201",
      "pexels-416160",
      "pexels-2253275",
    ],
    ["pets", "nature", "people"]
  ),
  pack(
    "legal",
    "law / attorney / legal",
    "/law|attorney|legal|lawyer|paralegal|litigation|notary/i",
    [
      "photo-1589829545856-d10d557cf95f",
      "photo-1450101499163-c8848c66ca85",
      "photo-1505664194779-8beaceb93744",
      "photo-1521791136064-7986c2920216",
      "photo-1454165804606-c3d57bc86b40",
      "photo-1497366216548-37526070297c",
      "photo-1486406146926-c627a92ad1ab",
      "photo-1556761175-5973dc0f32e7",
      "pexels-5668473",
      "pexels-6077326",
      "pexels-5668858",
      "pexels-5669619",
    ],
    ["office", "city", "people"]
  ),
  pack(
    "finance",
    "accounting / finance / insurance",
    "/account|finance|financial|insurance|tax|bookkeep|advisor|cpa|wealth/i",
    [
      "photo-1554224155-6726b3ff858f",
      "photo-1460925895917-afdab827c52f",
      "photo-1551288049-bebda4e38f71",
      "photo-1579621970563-ebec7560ff3e",
      "photo-1563986768609-322da13575f3",
      "photo-1556761175-b413da4baf72",
      "photo-1611974789855-9c2a0a7236a3",
      "photo-1590283603385-17ffb3a7f81f",
      "pexels-590022",
      "pexels-6801648",
      "pexels-6863183",
      "pexels-4386370",
    ],
    ["office", "city", "people"]
  ),
  pack(
    "realestate",
    "real estate / property",
    "/real estate|realtor|property|home ?sale|listing|broker/i",
    [
      "photo-1560518883-ce09059eeffa",
      "photo-1564013799919-ab600027ffc6",
      "photo-1600596542815-ffad4c1539a9",
      "photo-1600585154340-be6161a56a0c",
      "photo-1600607687939-ce8a6c25118c",
      "photo-1600566753190-17f0baa2a6c3",
      "photo-1600047509807-ba8f99d2cdde",
      "photo-1512917772120-2f13304f0931",
      "pexels-106399",
      "pexels-1396122",
      "pexels-1571460",
      "pexels-323780",
    ],
    ["realestate", "city", "ambient"]
  ),
  pack(
    "auto",
    "auto repair / mechanic / tires",
    "/auto|mechanic|tire|oil change|body shop|towing|garage|car repair/i",
    [
      "photo-1486262715619-67b85e0b08d3",
      "photo-1492144534655-ae79c964c9d7",
      "photo-1503376780353-7e6692767b70",
      "photo-1619642751034-765dfdf7c58e",
      "photo-1632823471565-1ecdf5c6d7b0",
      "photo-1625047509168-a7026f773785",
      "photo-1615900119312-2acad0c81dc0",
      "photo-1605559424843-9e4c228bf1c2",
      "pexels-3802510",
      "pexels-3807277",
      "pexels-4489702",
      "pexels-3807275",
    ],
    ["auto", "city", "ambient"]
  ),
  pack(
    "cardetail",
    "car detailing / car wash",
    "/car detail|auto detail|car wash|mobile detail|paint correction/i",
    [
      "photo-1607860108855-64acf2078ed9",
      "photo-1492144534655-ae79c964c9d7",
      "photo-1503376780353-7e6692767b70",
      "photo-1486262715619-67b85e0b08d3",
      "photo-1605559424843-9e4c228bf1c2",
      "photo-1486006920555-c77dcf18193c",
      "pexels-3802510",
      "pexels-3729464",
      "pexels-3802508",
      "pexels-3593922",
      "photo-1619642751034-765dfdf7c58e",
      "photo-1632823471565-1ecdf5c6d7b0",
    ],
    ["auto", "city", "people"]
  ),
  pack(
    "photography",
    "photography / creative studio",
    "/photograph|photo studio|wedding photo|portrait studio|videograph/i",
    [
      "photo-1452587925148-ce544e77e70d",
      "photo-1516035069371-29a1b244cc32",
      "photo-1492691527719-9d1e07e534b4",
      "photo-1471341971476-ae15ff5dd4ea",
      "photo-1554048612-b6a482bc67e5",
      "photo-1606983340126-99ab4feaa64a",
      "photo-1542038784456-1ea8e935640e",
      "photo-1502920917128-1aa69837af2e",
      "pexels-274973",
      "pexels-167832",
      "pexels-1983037",
      "pexels-3602258",
    ],
    ["people", "city", "soft"]
  ),
  pack(
    "agency",
    "marketing / design / tech agency",
    "/agency|marketing|design studio|branding|digital|saas|software|startup|web design|seo/i",
    [
      "photo-1497366811353-6870744d04b2",
      "photo-1497215728101-856f4ea42174",
      "photo-1521737711867-e3b97375f902",
      "photo-1552664730-d307ca884978",
      "photo-1600880292203-757bb62b4baf",
      "photo-1517245386807-bb43f82c33c4",
      "photo-1553877522-43269d4ea984",
      "photo-1531482615713-2afd69097998",
      "pexels-3184291",
      "pexels-3182812",
      "pexels-3184465",
      "pexels-3861969",
    ],
    ["office", "city", "people"]
  ),
  pack(
    "moving",
    "moving / storage / hauling",
    "/moving|movers|storage|hauling|relocation|pack.?and.?ship|junk removal/i",
    [
      "photo-1600518464441-9154a4dea21b",
      "photo-1600880292089-90a7e086ee0c",
      "photo-1600585154340-be6161a56a0c",
      "photo-1560518883-ce09059eeffa",
      "photo-1504307651254-35680f356dfd",
      "photo-1607400201889-565b1ee75f8c",
      "pexels-4246120",
      "pexels-4246200",
      "pexels-4246068",
      "pexels-5025512",
      "photo-1600566753190-17f0baa2a6c3",
      "photo-1570129477492-45c003edd2be",
    ],
    ["city", "people", "ambient"]
  ),
  pack(
    "boutique",
    "boutique / retail / clothing",
    "/boutique|clothing|apparel|fashion|retail shop|gift shop|thrift/i",
    [
      "photo-1441986300917-64674bd600d8",
      "photo-1445205170230-053b83016050",
      "photo-1483985988355-763728e1935b",
      "photo-1490481651871-ab68de25d43d",
      "photo-1469334031218-e382a71b716b",
      "photo-1558171813-4c088753af8f",
      "pexels-994523",
      "pexels-135620",
      "pexels-1884581",
      "pexels-1488463",
      "photo-1472851294608-062f824d29cc",
      "photo-1555529771-835f59fc5efe",
    ],
    ["people", "soft", "city"]
  ),
  pack(
    "jewelry",
    "jewelry / watches / luxury retail",
    "/jewel|jeweler|watch shop|diamond|goldsmith/i",
    [
      "photo-1515562141207-7a88fb7ce338",
      "photo-1605100804763-247f67b3557e",
      "photo-1611591437281-460bfbe1220a",
      "photo-1599643478518-a784e5dc4c8f",
      "photo-1535632066927-ab7c9ab60908",
      "photo-1573408301185-9146fe634ad0",
      "pexels-1454171",
      "pexels-1232931",
      "pexels-265906",
      "pexels-248077",
      "photo-1602173574767-37ac01994b2a",
      "photo-1605100804763-247f67b3557e",
    ],
    ["soft", "people", "ambient"]
  ),
  pack(
    "hotel",
    "hotel / inn / lodging",
    "/hotel|motel|inn|lodging|bed.?and.?breakfast|bnb|guest house/i",
    [
      "photo-1566073771259-6a8506099945",
      "photo-1551882547-ff40c63fe5fa",
      "photo-1582719478250-c89cae4dc85b",
      "photo-1611892440504-42a792e24d32",
      "photo-1590490360182-c33d57733427",
      "photo-1445019980597-93fa8acb246c",
      "pexels-258154",
      "pexels-271624",
      "pexels-261102",
      "pexels-164595",
      "photo-1578683010236-d716f9a3f461",
      "photo-1564013799919-ab600027ffc6",
    ],
    ["soft", "city", "ambient"]
  ),
  pack(
    "default",
    "local business / general",
    "/.*/",
    [
      "photo-1497366811353-6870744d04b2",
      "photo-1497215728101-856f4ea42174",
      "photo-1521737711867-e3b97375f902",
      "photo-1600880292203-757bb62b4baf",
      "photo-1560518883-ce09059eeffa",
      "photo-1600585154340-be6161a56a0c",
      "photo-1507003211169-0a1dd7228f2d",
      "photo-1494790108377-be9c29b29330",
      "photo-1469474968028-56623f02e42e",
      "photo-1441974231531-c6227db76b6e",
      "pexels-3184291",
      "pexels-3182812",
      "pexels-3747463",
      "pexels-380769",
    ],
    ["city", "ambient", "people"]
  ),
];

function resolveImageRef(entry) {
  if (!entry) return "";
  if (/^https?:\/\//i.test(entry)) return entry;
  if (entry.startsWith("pexels-")) {
    const id = entry.replace(/^pexels-/, "");
    return P(id);
  }
  if (entry.startsWith("photo-")) return U(entry);
  return entry;
}

function writeFolders() {
  fs.mkdirSync(ROOT, { recursive: true });
  const index = [];
  for (const packDef of PACKS) {
    const dir = path.join(ROOT, packDef.key);
    fs.mkdirSync(dir, { recursive: true });
    const imageUrls = packDef.images.map(resolveImageRef).filter(Boolean);
    const videoKeys = packDef.videos.filter((k) => VIDEOS[k]);
    const manifest = {
      key: packDef.key,
      label: packDef.label,
      match: packDef.match,
      folder: `worker/stock/${packDef.key}`,
      images: packDef.images,
      imageUrls,
      videos: videoKeys,
      videoUrls: {
        hero: VIDEOS[videoKeys[0]] || VIDEOS.city,
        ambient: VIDEOS[videoKeys[1]] || VIDEOS.ambient,
        detail: VIDEOS[videoKeys[2]] || VIDEOS.soft,
      },
      notes:
        "Curated CDN catalog for the Moonrise generate agent. Prefer these URLs only, do not invent media links.",
    };
    fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
    // Lightweight pointer files so the tree is obvious in the IDE.
    fs.writeFileSync(
      path.join(dir, "README.md"),
      `# ${packDef.label}\n\nFolder key: \`${packDef.key}\`\n\n` +
        `Images: ${imageUrls.length} curated Unsplash/Pexels URLs\n` +
        `Videos: ${videoKeys.map((k) => `\`${k}\``).join(", ")}\n\n` +
        `The Moonrise agent selects this pack when the business matches:\n\n\`\`\`\n${packDef.match}\n\`\`\`\n` +
        `\nSee \`manifest.json\` for absolute https URLs.\n`,
      "utf8"
    );
    index.push({
      key: packDef.key,
      label: packDef.label,
      images: imageUrls.length,
      videos: videoKeys,
    });
  }

  fs.writeFileSync(
    path.join(ROOT, "README.md"),
    [
      "# Moonrise stock media folders",
      "",
      "One folder per local business type. Each `manifest.json` lists curated",
      "Unsplash/Pexels image URLs and looping video URLs for that trade.",
      "",
      "The generate agent reads the compiled library (`worker/stock-media-library.js`)",
      "and picks the matching folder automatically (spa → spa images/videos,",
      "dog grooming → doggrooming, etc.).",
      "",
      "Rebuild:",
      "",
      "```bash",
      "node worker/scripts/seed-stock-folders.js",
      "```",
      "",
      `Folders: **${index.length}**`,
      "",
      "| Folder | Label | Images | Videos |",
      "| --- | --- | ---: | --- |",
      ...index.map(
        (row) =>
          `| \`${row.key}\` | ${row.label} | ${row.images} | ${row.videos.join(", ")} |`
      ),
      "",
    ].join("\n"),
    "utf8"
  );

  return index;
}

/** More-specific trades first so "med spa" / "dog grooming" don't fall into spa / pets. */
const MATCHER_PRIORITY = [
  "medspa",
  "doggrooming",
  "veterinary",
  "nails",
  "cardetail",
  "foodtruck",
  "bakery",
  "chiropractic",
  "physicaltherapy",
  "optometry",
  "martialarts",
  "musicschool",
  "pestcontrol",
  "locksmith",
  "pool",
  "catering",
  "jewelry",
  "hotel",
  "boutique",
];

function writeLibrary() {
  const PACKS_OUT = {};
  const MATCHERS = [];
  const allUrls = new Set();
  const allIds = new Set();

  for (const packDef of PACKS) {
    const imageUrls = packDef.images.map(resolveImageRef).filter(Boolean);
    imageUrls.forEach((u) => allUrls.add(u));
    packDef.images.forEach((id) => allIds.add(id));
    PACKS_OUT[packDef.key] = {
      label: packDef.label,
      folder: `worker/stock/${packDef.key}`,
      images: packDef.images,
      videos: packDef.videos.filter((k) => VIDEOS[k]),
      galleryUrls: imageUrls,
      videoUrls: {
        hero: VIDEOS[packDef.videos[0]] || VIDEOS.city,
        ambient: VIDEOS[packDef.videos[1]] || VIDEOS.ambient,
        detail: VIDEOS[packDef.videos[2]] || VIDEOS.soft,
      },
    };
  }

  const byKey = Object.fromEntries(PACKS.map((p) => [p.key, p]));
  const orderedKeys = [
    ...MATCHER_PRIORITY.filter((k) => byKey[k] && k !== "default"),
    ...PACKS.map((p) => p.key).filter((k) => k !== "default" && !MATCHER_PRIORITY.includes(k)),
  ];
  for (const key of orderedKeys) {
    MATCHERS.push({ key, re: byKey[key].match });
  }

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      uniqueImages: allUrls.size,
      videoCount: Object.keys(VIDEOS).length,
      packCount: Object.keys(PACKS_OUT).length,
      totalAssets: allUrls.size + Object.keys(VIDEOS).length,
      folderRoot: "worker/stock",
      sources: [
        "Unsplash CDN images",
        "Pexels CDN images",
        "Pexels / public CDN videos",
        "worker/stock/<business>/manifest.json folders",
      ],
    },
    VIDEOS,
    PACKS: PACKS_OUT,
    MATCHERS,
    ALL_IMAGE_IDS: [...allIds],
    ALL_IMAGE_URLS: [...allUrls],
  };

  const body = `/**
 * Auto-generated stock media library for Moonrise Studio.
 * Source of truth: worker/stock/<business>/manifest.json folders.
 *
 * Rebuild: node worker/scripts/seed-stock-folders.js
 */
"use strict";

module.exports = ${JSON.stringify(payload, null, 2)};
`;
  fs.writeFileSync(LIB_OUT, body, "utf8");
  return payload.meta;
}

async function verifySampleImages(limit = 40) {
  const sample = [];
  for (const packDef of PACKS) {
    for (const id of packDef.images.slice(0, 2)) {
      sample.push(id);
      if (sample.length >= limit) break;
    }
    if (sample.length >= limit) break;
  }
  let ok = 0;
  let bad = 0;
  for (const id of sample) {
    const url = resolveImageRef(id);
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) ok += 1;
      else {
        bad += 1;
        console.error("bad image", id, res.status);
      }
    } catch (e) {
      bad += 1;
      console.error("bad image", id, e.message);
    }
  }
  console.error(`image sample verify: ok=${ok} bad=${bad} of ${sample.length}`);
}

async function main() {
  const index = writeFolders();
  const meta = writeLibrary();
  console.log(JSON.stringify({ folders: index.length, ...meta }, null, 2));
  if (process.argv.includes("--verify-images")) {
    await verifySampleImages();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
