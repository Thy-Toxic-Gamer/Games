(function () {
  "use strict";

  const library = window.GAME_LIBRARY || { platforms: [], totalGames: 0 };
  const platforms = Array.isArray(library.platforms) ? library.platforms : [];
  const allGames = platforms
    .filter((platform) => !platform.comingSoon)
    .flatMap((platform) => platform.games.map((game) => ({
      ...game,
      sourcePlatformId: game.sourcePlatformId || platform.id,
    })))
    .sort((left, right) => left.title.localeCompare(right.title, "en", {
      numeric: true,
      sensitivity: "base",
    }));
  const viewPlatforms = [
    { id: "all", label: "All", games: allGames },
    ...platforms,
    { id: "updates", label: "Updates", games: [], updates: true },
  ];
  const grid = document.querySelector("#game-grid");
  const headerCount = document.querySelector("#header-count");
  const tabs = document.querySelector("#platform-tabs");
  const platformSubtabs = document.querySelector("#platform-subtabs");
  const panel = document.querySelector("#platform-panel");
  const platformName = document.querySelector("#platform-name");
  const libraryCount = document.querySelector("#library-count");
  const comingSoon = document.querySelector("#coming-soon-panel");
  const comingSoonLibrary = document.querySelector("#coming-soon-library");
  const comingSoonMessage = document.querySelector("#coming-soon-message");
  const updatesPanel = document.querySelector("#updates-panel");
  const siteUpdatesButton = document.querySelector("#site-updates-button");
  let activePlatformId = "all";
  const activeSectionByPlatform = new Map();

  const currentHeaderImages = Object.freeze({
    1029210: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1029210/4e755d52979ed36dd7a7bfef3ad98d93f07922d0/header.jpg?t=1781208599",
    761890: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/761890/ea5ce1793872e23cc9ce82ac1f317869c67469b6/header_alt_assets_2.jpg?t=1787224203",
    1172470: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1172470/6cf04767652d703b6050da84b82cfb1194258d7d/header.jpg?t=1786031871",
    1147660: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1147660/header.jpg?t=1707816982",
    2399830: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2399830/d934813ca531af0fce69fe36bc972f1c90d1aa19/header.jpg?t=1779293241",
    649950: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/649950/header.jpg?t=1729099459",
    2208920: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2208920/header.jpg?t=1786637382",
    2062430: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2062430/5e7885a3802fe7d38b92fdeb44888b4828a842ba/header_alt_assets_2.jpg?t=1786035856",
    681660: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/681660/header.jpg?t=1591758842",
    738520: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/738520/5d14286459f7eaaeb0e5e5f7ad959f03ee724f25/header_alt_assets_1.jpg?t=1786133858",
    4231820: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4231820/6b65aec2c398006aea8b76e1463cc34d0e4ba68b/header.jpg?t=1785458750",
    1903340: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1903340/be3305b02d4db0dffa3458537118423bf2792d7e/header.jpg?t=1782830877",
    588650: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/588650/header.jpg?t=1779086887",
    744900: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/744900/header.jpg?t=1741095278",
    2321470: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2321470/header.jpg?t=1787051272",
    1085660: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1085660/0ccf0dc0a8c4ec078db7ab99ddc820b2fa884441/header.jpg?t=1781815889",
    337000: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/337000/39cf848b5d93541865bdf81e1f415cc615de5d80/header.jpg?t=1780670420",
    3590290: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3590290/e0279893a393cecd472e1475d16ddb648aad15a3/header.jpg?t=1785164308",
    379720: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/379720/header.jpg?t=1750784856",
    2280: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2280/header.jpg?t=1750785073",
    9050: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/9050/header.jpg?t=1660240082",
    208200: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/208200/header.jpg?t=1664292843",
    9070: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/9070/header.jpg?t=1660250812",
    1148590: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1148590/header.jpg?t=1750784988",
    782330: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/782330/feaf8293bcd2d078422faa547bc0d707c08f606e/header.jpg?t=1783432602",
    3017860: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3017860/af14846bdc72d46a4207c24d9ada4dc54595cc2d/header_alt_assets_2.jpg?t=1783452885",
    11610: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/11610/header.jpg?t=1516788252",
    970830: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/970830/header.jpg?t=1721835298",
    306130: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/306130/465cc6917d2ed89c364ebfca85da07f79a2abfd6/header.jpg?t=1783621796",
    1203620: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1203620/062c788d22ecf236269da0f115150c0d3b7055a4/header.jpg?t=1782800102",
    3837340: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3837340/467568ecc51ea77191ce048636a6f211c1c93a9f/header.jpg?t=1775108423",
    292120: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292120/header.jpg?t=1775176878",
    292140: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292140/header.jpg?t=1775177243",
    2074920: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2074920/dc8ac02c8328d66f2f78ea8b83472bdd7e281a62/header.jpg?t=1787211276",
    1593500: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/header.jpg?t=1763059412",
    1496790: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1496790/header.jpg?t=1772146079",
    881020: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/881020/header.jpg?t=1783524179",
    1145360: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg?t=1758127023",
    1145350: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/91ac334a2c137d08968ccc0bc474a02579602100/header.jpg?t=1779901265",
    619820: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/619820/bb367cb7f6d10326c9274383409bb6e5027d3dd7/header_alt_assets_2.jpg?t=1787152133",
    2552430: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2552430/header.jpg?t=1779418330",
    2552440: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2552440/header.jpg?t=1779418696",
    2552450: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2552450/header.jpg?t=1779418883",
    700030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/700030/header.jpg?t=1778671803",
    345350: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/345350/header.jpg?t=1775177550",
    1599340: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1599340/header.jpg?t=1763571534",
    216150: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/216150/header.jpg?t=1784158414",
    2767030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2767030/44ca658ecf9b75216cb652f709ced7ccde96d915/header.jpg?t=1786093208",
    1129580: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1129580/header.jpg?t=1787135492",
    1798010: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1798010/header.jpg?t=1769126434",
    1798020: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1798020/header.jpg?t=1769126494",
    109600: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/109600/b45ba04297b16c13373f491bcd6bda81e6cda1d6/header.jpg?t=1781552751",
    1369760: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1369760/header.jpg?t=1760595589",
    1580780: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1580780/header.jpg?t=1760595484",
    1580790: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1580790/header.jpg?t=1760595578",
    1371980: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1371980/331de7e745f43867f0a220339153ac6019822ea4/header.jpg?t=1784886886",
    1343370: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1343370/header.jpg?t=1779113374",
    2139460: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2139460/c18b08a2f93dec32fcc5fa71bc2da44ee42de1f0/header.jpg?t=1786675226",
    3046600: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3046600/header.jpg?t=1763712388",
    761600: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/761600/header.jpg?t=1784004466",
    680420: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/680420/header.jpg?t=1774022529",
    794260: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/794260/header.jpg?t=1787229712",
    1623730: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1623730/6912f19c43a95ff5fe514eedd35e68bf12335459/header.jpg?t=1784714419",
    238960: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/238960/177c953b362c5a6221f9c15d340a0b1e2b8bfab8/header.jpg?t=1784681738",
    2694490: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2694490/24eeddcbda17903f03d819588757e40845f8115f/header.jpg?t=1787697213",
    1056640: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1056640/cbc2abb55b0996b2ec85242aa11bf29139e46e9f/header_alt_assets_20.jpg?t=1785235324",
    462770: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/462770/header.jpg?t=1729114062",
    617290: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/617290/header.jpg?t=1764657526",
    1805320: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1805320/7ba6783ca5acd8068abd3bd924801ce173fc39e8/header.jpg?t=1782998088",
    295550: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/295550/header.jpg?t=1782985043",
    1343400: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1343400/164e54273831e76f820378b4c6e0c21e0a4834e2/header.jpg?t=1771947591",
    1374490: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1374490/6f6bba2ddccb49f3a0abb831684ca085e453c721/header_alt_assets_3.jpg?t=1785893866",
    2087030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2087030/header.jpg?t=1757923026",
    414530: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/414530/header.jpg?t=1747244593",
    740130: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/740130/9031a1f4e34e8031118594726762d7979e43f320/header.jpg?t=1783413316",
    323370: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/323370/header.jpg",
    2429640: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2429640/497cc638fa3186f1aeefddaff89eaaf6f0c2e7dd/header.jpg?t=1786601205",
    200710: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/200710/header.jpg?t=1782381123",
    372000: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/372000/header.jpg?t=1765860167",
    1975440: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1975440/header.jpg?t=1725963350",
    1604030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1604030/be49834ab147ad22ba17005fb847c93917d18b97/header.jpg?t=1787038382",
    892970: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/892970/de0bdcf6c008c508a79d8e75eb91fc67f4bebd5d/header.jpg?t=1786012504",
    3265700: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3265700/5590e42cab09dacabee973dd2c3e27ef12ed4950/header.jpg?t=1776925935",
    212160: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/212160/3a1f01de5716f69d22d27d5a4a055e15178acdb5/header_alt_assets_8.jpg?t=1787104224",
    230410: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/230410/a000b4bf98dde5d51cd44206f1ac21d04841017e/header.jpg?t=1786540562",
    1361210: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1361210/f07ebcb73a34112ac61c54608b1f1ded7e45eb8a/header.jpg?t=1782226781",
    3041230: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3041230/7e838d87d787735d5d29d72777c5ee55653dfb2b/header.jpg?t=1783932953",
    20900: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/20900/header.jpg?t=1749200362",
    20920: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/20920/header.jpg?t=1761657279",
    292030: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/97cca1147b256f450331044255b1dbd2d57d609e/header_alt_assets_4.jpg?t=1787688132",
    2379740: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2379740/header.jpg?t=1772694401",
    39210: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/39210/header.jpg?t=1782870674",
    582660: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/582660/3c4172635738d9e5901e340b28136745fd9e491a/header_alt_assets_27.jpg?t=1786645008",
  });

  const GAME_INFO = Object.freeze({
    "30XX": Object.freeze({ genre: "Action Roguelike / Platformer", description: "Two android heroes fight through a constantly changing future, battling machines and powerful Guardians." }),
    "Blaster Master Zero": Object.freeze({ genre: "Action Platformer / Metroidvania", description: "Jason explores a dangerous subterranean world in the battle tank SOPHIA III while searching for a mysterious creature." }),
    "Brave Dungeon": Object.freeze({ genre: "Dungeon-Crawling JRPG", description: "Adventurer Al explores Belfer Island's dungeons, gathers Syega crystals, crafts equipment, and searches for powerful Magic Items." }),
    "Dark Witch's Story: COMBAT": Object.freeze({ genre: "Card Battler / Strategy", description: "Build a three-card team from the Dark Witch series, equip Magic Items, and fight through strategic best-of-three battles." }),
    "Albion Online": Object.freeze({ genre: "Sandbox MMORPG", description: "Build your own path in a player-driven medieval fantasy world shaped by gathering, crafting, trade, and conflict." }),
    "Apex Legends": Object.freeze({ genre: "Battle Royale / Hero Shooter", description: "Legends with unique abilities compete in deadly arena games across the Outlands." }),
    "ArcheAge: Unchained": Object.freeze({ genre: "Fantasy MMORPG", description: "Adventurers explore a vast fantasy world of rival nations, ancient powers, trade, and open-world conflict." }),
    "ARK: Survival Ascended": Object.freeze({ genre: "Survival / Adventure", description: "Awaken on a mysterious island filled with dinosaurs, then survive, build, tame creatures, and uncover the ARK's secrets." }),
    "Ashen": Object.freeze({ genre: "Action RPG", description: "A wanderer searches for a home in a sunless world while forming bonds and confronting ancient dangers." }),
    "Assassin's Creed Valhalla": Object.freeze({ genre: "Action RPG / Adventure", description: "Viking warrior Eivor leads a clan from Norway to England while becoming entangled in the Hidden Ones' ancient conflict." }),
    "BALL x PIT": Object.freeze({ genre: "Action Roguelite", description: "Descend into a monster-filled pit, combining bouncing projectiles and upgrades to survive escalating waves of enemies." }),
    "Black Desert": Object.freeze({ genre: "Fantasy MMORPG", description: "An adventurer caught between rival kingdoms follows the mystery of the Black Spirit through a vast fantasy world." }),
    "Bless Online": Object.freeze({ genre: "Fantasy MMORPG", description: "Heroes take part in a large-scale war between opposing factions in a world shaped by gods and ancient powers." }),
    "Breathedge": Object.freeze({ genre: "Survival / Adventure", description: "After a space hearse disaster, an ordinary man must survive the wreckage and investigate a bizarre cosmic conspiracy." }),
    "Castlevania: Belmont's Curse": Object.freeze({ genre: "Action / Adventure", description: "An upcoming Castlevania adventure carrying the Belmont legacy into another battle against supernatural evil." }),
    "Clair Obscur: Expedition 33": Object.freeze({ genre: "Turn-Based RPG", description: "Expeditioners set out to destroy the Paintress before she paints the next number that will erase another generation." }),
    "Dead Cells": Object.freeze({ genre: "Roguelite / Metroidvania", description: "An immortal prisoner possesses bodies while fighting through a cursed island to discover what caused its collapse." }),
    "Dead Frontier 2": Object.freeze({ genre: "Survival Horror / MMO", description: "Survivors scavenge a zombie-infested city, improve their gear, and fight to stay alive in a ruined world." }),
    "Deep Rock Galactic: Survivor": Object.freeze({ genre: "Auto-Shooter / Roguelite", description: "A lone dwarf mines hostile caves, gathers resources, and survives swarms of alien creatures for Deep Rock Galactic." }),
    "Destiny 2": Object.freeze({ genre: "Online FPS / Action RPG", description: "Guardians wield the Light and Darkness to defend humanity against cosmic threats across the solar system." }),
    "Deus Ex: Mankind Divided": Object.freeze({ genre: "Action RPG / Immersive Sim", description: "Augmented agent Adam Jensen investigates a global conspiracy in a divided world hostile toward augmented people." }),
    "DIVE or DIE - Children of Rain": Object.freeze({ genre: "Action / Adventure", description: "Survive a hostile world shaped by relentless danger and uncover the mystery surrounding the Children of Rain." }),
    "DOOM": Object.freeze({ genre: "FPS / Action", description: "The Doom Slayer tears through a demonic invasion of a Mars research facility and Hell itself." }),
    "DOOM + DOOM II": Object.freeze({ genre: "FPS / Action", description: "Battle the armies of Hell across the classic campaigns that defined fast, relentless first-person combat." }),
    "DOOM 3": Object.freeze({ genre: "FPS / Survival Horror", description: "A marine on Mars fights through a demonic outbreak after a UAC experiment opens a gateway to Hell." }),
    "DOOM 3: BFG Edition": Object.freeze({ genre: "FPS / Survival Horror", description: "Fight the Mars invasion and its aftermath in an expanded collection of DOOM 3 and its additional campaigns." }),
    "DOOM 3: Resurrection of Evil": Object.freeze({ genre: "FPS / Survival Horror", description: "Return to Mars after a mysterious artifact reawakens the demonic forces left behind by the original invasion." }),
    "DOOM 64": Object.freeze({ genre: "FPS / Action", description: "The Doom Marine returns to a corrupted demon stronghold to finish Hell's invasion once and for all." }),
    "DOOM Eternal": Object.freeze({ genre: "FPS / Action", description: "The Doom Slayer battles Hell's invasion of Earth and pursues the forces responsible across multiple dimensions." }),
    "DOOM: The Dark Ages": Object.freeze({ genre: "FPS / Action", description: "A prequel follows the Doom Slayer as a weapon of gods and kings in a brutal medieval war against Hell." }),
    "Dragon Nest": Object.freeze({ genre: "Action MMORPG", description: "Heroes enter the world of Althea to battle monsters and oppose forces threatening its future." }),
    "The Dungeon Of Naheulbeuk: The Amulet Of Chaos": Object.freeze({ genre: "Tactical RPG", description: "A hilariously dysfunctional band of adventurers enters a dungeon and becomes trapped in a chaotic fantasy quest." }),
    "The Elder Scrolls Online": Object.freeze({ genre: "Fantasy MMORPG", description: "Explore Tamriel during an age of war, alliances, Daedric plots, and continent-spanning adventures." }),
    "Enshrouded": Object.freeze({ genre: "Survival Action RPG", description: "A Flameborn awakens in a ruined kingdom swallowed by the Shroud and works to reclaim the land." }),
    "FINAL FANTASY VII": Object.freeze({ genre: "JRPG", description: "Cloud Strife joins the eco-rebel group Avalanche and becomes caught in a struggle over the planet's life force." }),
    "FINAL FANTASY XIII": Object.freeze({ genre: "JRPG", description: "Lightning and her companions are branded enemies of their world and fight against a fate imposed by godlike beings." }),
    "FINAL FANTASY XIII-2": Object.freeze({ genre: "JRPG", description: "Serah and Noel travel through time searching for Lightning while trying to repair a fractured future." }),
    "FINAL FANTASY XIV Online": Object.freeze({ genre: "MMORPG / JRPG", description: "The Warrior of Light journeys across Eorzea and beyond, defending its people from empires, primals, and world-ending threats." }),
    "The First Descendant": Object.freeze({ genre: "Looter Shooter / Action RPG", description: "Descendants wield inherited powers to defend humanity and the continent of Ingris from the invading Vulgus." }),
    "God of War": Object.freeze({ genre: "Action / Adventure", description: "Kratos and his son Atreus journey through the Norse realms to fulfill a final promise while confronting gods and monsters." }),
    "Gotham Knights": Object.freeze({ genre: "Action RPG", description: "After Batman's death, Batgirl, Nightwing, Red Hood, and Robin protect Gotham and uncover a secret conspiracy." }),
    "Granblue Fantasy: Relink": Object.freeze({ genre: "Action RPG", description: "A skyfaring crew travels across floating islands while searching for Estalucia and confronting powerful new threats." }),
    "Hades": Object.freeze({ genre: "Action Roguelike", description: "Zagreus repeatedly fights his way out of the Underworld to learn the truth about his family." }),
    "Hades II": Object.freeze({ genre: "Action Roguelike", description: "Melinoë, princess of the Underworld, battles the Titan of Time with the aid of Olympian gods and witchcraft." }),
    "Heroes of Hammerwatch II": Object.freeze({ genre: "Action Roguelite / RPG", description: "Heroes venture into dangerous regions, gather powerful gear, and rebuild their strength between increasingly difficult expeditions." }),
    "KINGDOM HEARTS -HD 1.5+2.5 ReMIX-": Object.freeze({ genre: "Action RPG", description: "Sora, Donald, and Goofy travel between Disney worlds while battling the Heartless and searching for lost friends." }),
    "KINGDOM HEARTS HD 2.8 Final Chapter Prologue": Object.freeze({ genre: "Action RPG", description: "Stories bridging the Kingdom Hearts saga follow Sora, Riku, Aqua, and others toward the final confrontation." }),
    "KINGDOM HEARTS III + Re Mind (DLC)": Object.freeze({ genre: "Action RPG", description: "Sora travels with Donald and Goofy to protect the worlds from Organization XIII and the coming Keyblade War." }),
    "Life is Feudal: MMO": Object.freeze({ genre: "Sandbox MMORPG", description: "Players survive, build settlements, master medieval professions, and compete for land in a harsh feudal world." }),
    "LIGHTNING RETURNS: FINAL FANTASY XIII": Object.freeze({ genre: "Action JRPG", description: "Lightning has thirteen days to save as many souls as possible before the dying world reaches its final end." }),
    "Lost Ark": Object.freeze({ genre: "Action MMORPG", description: "Heroes search for the lost Ark while fighting demonic armies and traveling across the world of Arkesia." }),
    "MapleStory": Object.freeze({ genre: "2D MMORPG", description: "Adventurers explore Maple World, grow stronger, and battle threats ranging from local monsters to the Black Mage." }),
    "Marvel Rivals": Object.freeze({ genre: "Hero Shooter", description: "Marvel heroes and villains collide across fractured realities after a temporal disaster tangles multiple universes together." }),
    "Medieval Dynasty": Object.freeze({ genre: "Survival / Simulation", description: "A young survivor builds a settlement, starts a family, and creates a lasting dynasty in medieval Europe." }),
    "Mega Man Battle Network Legacy Collection Vol. 1": Object.freeze({ genre: "Action RPG / Collection", description: "Lan Hikari and his NetNavi MegaMan.EXE fight cybercrime and digital threats across the early Battle Network adventures." }),
    "Mega Man Battle Network Legacy Collection Vol. 2": Object.freeze({ genre: "Action RPG / Collection", description: "Lan and MegaMan.EXE continue battling cyber threats through the later entries of the Battle Network series." }),
    "Neverwinter: Biting Cold": Object.freeze({ genre: "Action MMORPG", description: "Adventurers defend the Forgotten Realms from magical, monstrous, and planar threats centered around Neverwinter." }),
    "NINJA GAIDEN 3: Razor's Edge [NINJA GAIDEN: Master Collection]": Object.freeze({ genre: "Action / Hack and Slash", description: "Master ninja Ryu Hayabusa battles a terrorist organization while confronting a curse placed upon his sword arm." }),
    "NINJA GAIDEN Σ [NINJA GAIDEN: Master Collection]": Object.freeze({ genre: "Action / Hack and Slash", description: "Ryu Hayabusa seeks revenge after his clan is attacked and the legendary Dark Dragon Blade is stolen." }),
    "NINJA GAIDEN Σ2 [NINJA GAIDEN: Master Collection]": Object.freeze({ genre: "Action / Hack and Slash", description: "Ryu Hayabusa fights a global demonic threat while protecting the Dragon Lineage and stopping the Archfiend's return." }),
    "No Rest for the Wicked": Object.freeze({ genre: "Action RPG", description: "A holy warrior arrives on the island of Sacra amid plague, political conflict, and a spreading supernatural corruption." }),
    "Old School RuneScape": Object.freeze({ genre: "Fantasy MMORPG", description: "Create your own adventurer and explore Gielinor through quests, bosses, skilling, trade, and player-driven adventures." }),
    "Once Human": Object.freeze({ genre: "Survival / Open World", description: "Meta-Humans survive a world transformed by an alien substance called Stardust while uncovering the disaster's origins." }),
    "Onimusha 2: Samurai's Destiny": Object.freeze({ genre: "Action / Adventure", description: "Samurai Jubei Yagyu seeks revenge against Nobunaga Oda while battling Genma demons across feudal Japan." }),
    "Onimusha: Warlords": Object.freeze({ genre: "Action / Adventure", description: "Samurai Samanosuke Akechi fights demonic Genma while trying to rescue Princess Yuki." }),
    "OUTRIDERS": Object.freeze({ genre: "Looter Shooter / RPG", description: "An altered soldier explores the hostile planet Enoch while searching for a signal that may save humanity." }),
    "Outward": Object.freeze({ genre: "Survival RPG", description: "An ordinary traveler ventures into the dangerous world of Aurai, balancing survival, debt, exploration, and faction conflicts." }),
    "Palworld": Object.freeze({ genre: "Survival / Creature Collection", description: "Explore the Palpagos Islands, befriend or battle mysterious Pals, build bases, and uncover the world's secrets." }),
    "Path of Exile: Curse of the Allflame": Object.freeze({ genre: "Action RPG", description: "An exile fights through the deadly land of Wraeclast, building extraordinary powers while confronting ancient corruption." }),
    "Path of Exile 2: Return of the Ancients": Object.freeze({ genre: "Action RPG", description: "Return to Wraeclast years later as a new corruption spreads and ancient horrors rise again." }),
    "Phantasy Star Online 2 New Genesis": Object.freeze({ genre: "Action MMORPG", description: "ARKS defenders explore the planet Halpha and fight mysterious DOLLS while uncovering the truth of their world." }),
    "Pyre": Object.freeze({ genre: "RPG / Sports Strategy", description: "Exiles travel across a mystical wasteland competing in ritual games for a chance to earn their freedom." }),
    "Remnant: From the Ashes": Object.freeze({ genre: "Soulslike / Shooter", description: "Survivors travel through shattered worlds to fight the Root and search for a way to save humanity." }),
    "Romestead": Object.freeze({ genre: "RPG / Adventure", description: "Explore a fantasy world, grow stronger through adventure, and uncover the mysteries surrounding its people and lands." }),
    "Royal Quest": Object.freeze({ genre: "Fantasy MMORPG", description: "Adventurers serve the kingdom of Aura by battling monsters, rival factions, and threats to the realm." }),
    "RuneScape": Object.freeze({ genre: "Fantasy MMORPG", description: "Forge your own story across Gielinor through quests, skills, gods, kingdoms, and decades of evolving adventures." }),
    "RuneScape: Dragonwilds": Object.freeze({ genre: "Survival / Open World", description: "Survivors enter the forgotten continent of Ashenfall, gather power, and prepare to challenge its dragons." }),
    "Shatterline": Object.freeze({ genre: "FPS / Roguelike", description: "Operatives fight a crystalline alien threat called the Crystalline in fast combat and expedition-style missions." }),
    "Skyforge": Object.freeze({ genre: "Action MMORPG", description: "An immortal champion defends the world of Aelion from invasions while growing toward godhood." }),
    "Tales of ARISE": Object.freeze({ genre: "Action JRPG", description: "Alphen and Shionne unite people from two worlds in a rebellion against centuries of oppression." }),
    "TERA": Object.freeze({ genre: "Action MMORPG", description: "Heroes fight across Arborea to defend its nations from monsters, gods, and invading forces." }),
    "Throne and Liberty": Object.freeze({ genre: "MMORPG", description: "Adventurers struggle against the Arkeum Legion while exploring the vast world of Solisium and awakening powerful abilities." }),
    "Torchlight II": Object.freeze({ genre: "Action RPG", description: "Heroes pursue the corrupted Alchemist across the world before his actions destroy the balance of the elements." }),
    "Tree of Savior (English Ver.)": Object.freeze({ genre: "MMORPG", description: "A chosen adventurer searches a fallen kingdom for the missing goddesses after a world-changing catastrophe." }),
    "Under The Waves": Object.freeze({ genre: "Narrative Adventure", description: "A professional diver working deep beneath the North Sea confronts grief, isolation, and strange events underwater." }),
    "V Rising": Object.freeze({ genre: "Survival Action RPG", description: "A weakened vampire awakens after centuries, rebuilds a castle, hunts for blood, and challenges the living world." }),
    "Valheim": Object.freeze({ genre: "Survival / Adventure", description: "A slain warrior is sent to a Norse purgatory to defeat Odin's ancient enemies and prove worthy of Valhalla." }),
    "Vampire Crawlers": Object.freeze({ genre: "Roguelike / Action", description: "A dark fantasy roguelike built around surviving dangerous encounters, growing stronger, and pushing deeper into hostile territory." }),
    "Vindictus": Object.freeze({ genre: "Action MMORPG", description: "Mercenaries battle monsters and unravel a tragic conflict involving prophecy, gods, and the fate of their world." }),
    "Warframe": Object.freeze({ genre: "Online Action / Looter Shooter", description: "The Tenno awaken from cryosleep and wield Warframes while fighting for balance across a war-torn solar system." }),
    "Warhammer 40,000: Darktide": Object.freeze({ genre: "Co-op FPS / Action", description: "Rejects of the Imperium descend into Tertium Hive to stop a Chaos cult and a spreading Nurgle infestation." }),
    "Windrose": Object.freeze({ genre: "Adventure / RPG", description: "Set sail through a dangerous fantasy world, explore new lands, and build your legend through discovery and conflict." }),
    "The Witcher: Enhanced Edition": Object.freeze({ genre: "Action RPG", description: "Monster hunter Geralt of Rivia searches for his lost memories while becoming entangled in political and supernatural conflict." }),
    "The Witcher 2: Assassins of Kings Enhanced Edition": Object.freeze({ genre: "Action RPG", description: "Geralt hunts the assassin responsible for killing a king while navigating a brutal political struggle." }),
    "The Witcher 3: Wild Hunt - Complete Edition": Object.freeze({ genre: "Action RPG", description: "Geralt searches for Ciri while the supernatural Wild Hunt pursues her across a war-torn Continent." }),
    "Wizardry Variants Daphne": Object.freeze({ genre: "Dungeon RPG", description: "Adventurers descend into a deadly Abyss, form a party, and confront monsters and mysteries hidden beneath the kingdom." }),
    "FINAL FANTASY": Object.freeze({ genre: "JRPG", description: "Four Warriors of Light set out to restore the crystals and save a world falling into darkness." }),
    "FINAL FANTASY II": Object.freeze({ genre: "JRPG", description: "Young rebels fight the Palamecian Empire after war destroys their homes and families." }),
    "FINAL FANTASY III": Object.freeze({ genre: "JRPG", description: "Four chosen youths receive the power of the crystals and journey to restore balance between light and darkness." }),
    "FINAL FANTASY IV": Object.freeze({ genre: "JRPG", description: "Dark knight Cecil questions his kingdom's orders and begins a journey of redemption against a world-threatening enemy." }),
    "FINAL FANTASY V": Object.freeze({ genre: "JRPG", description: "Bartz and his companions protect the elemental crystals and confront the returning warlock Exdeath." }),
    "FINAL FANTASY VI": Object.freeze({ genre: "JRPG", description: "A resistance fights the Gestahlian Empire while Terra searches for her identity in a world shaped by magic and machinery." }),
    "FANTASY LIFE i: The Girl Who Steals Time Nintendo Switch 2 Edition": Object.freeze({ genre: "Life Sim / Action RPG", description: "Travel between past and present on a mysterious island, mastering different Lives while rebuilding its lost civilization." }),
    "Atelier Ryza Secret Trilogy Deluxe Pack": Object.freeze({ genre: "JRPG / Alchemy", description: "Ryza and her friends grow from curious island youths into seasoned adventurers through journeys driven by alchemy and friendship." }),
    "Rogue Legacy 2": Object.freeze({ genre: "Roguelite / Platformer", description: "Generations of heroes inherit quirks and abilities as they repeatedly explore a cursed kingdom." }),
    "Guardian Tales": Object.freeze({ genre: "Action RPG / Adventure", description: "A newly appointed Guardian travels across Kanterbury with a mysterious princess to stop the invading forces." }),
    ".hack//G.U. Last Recode": Object.freeze({ genre: "Action RPG", description: "Haseo enters the MMO The World to hunt the mysterious player Tri-Edge and save friends trapped in comas." }),
    "Valthirian Arc: Hero School Story": Object.freeze({ genre: "Simulation / RPG", description: "Build and manage an academy that trains students into heroes while protecting the kingdom." }),
    "Sonic Mania": Object.freeze({ genre: "Platformer", description: "Sonic, Tails, and Knuckles race across classic-style zones to stop Dr. Eggman and his Hard-Boiled Heavies." }),
    "Record of Lodoss War-Deedlit in Wonder Labyrinth-": Object.freeze({ genre: "Metroidvania", description: "High elf Deedlit awakens in a mysterious labyrinth and searches for answers connected to her past companions." }),
    "Miden Tower": Object.freeze({ genre: "JRPG", description: "A mage and his allies climb a conquered tower to resist an oppressive empire and reclaim their home." }),
    "Ruinverse": Object.freeze({ genre: "JRPG", description: "A party of adventurers becomes involved in a mystery surrounding two souls sharing one body and a threatened fantasy world." }),
    "DRAGON BALL Z: KAKAROT + A NEW POWER AWAKENS SET": Object.freeze({ genre: "Action RPG", description: "Relive Goku's journey through the major Dragon Ball Z sagas, battles, training, and powerful transformations." }),
    "Mega Man Zero/ZX Legacy Collection": Object.freeze({ genre: "Action Platformer / Collection", description: "Zero and later heroes fight oppressive forces across the interconnected Mega Man Zero and ZX storylines." }),
    "Actraiser Renaissance": Object.freeze({ genre: "Action / City Building", description: "A divine being returns to protect humanity, defeat monsters, and rebuild civilizations across a fallen world." }),
    "Darksiders Genesis": Object.freeze({ genre: "Action RPG / Hack and Slash", description: "Horsemen War and Strife hunt Lucifer's agents after a conspiracy threatens the balance between Heaven and Hell." }),
    "Langrisser I & II": Object.freeze({ genre: "Tactical RPG", description: "Command armies through two classic wars where royal heirs, sacred swords, and rival factions determine the fate of nations." }),
    "Paper Mario: The Origami King": Object.freeze({ genre: "Adventure / RPG", description: "Mario travels across a paper-crafted world to stop King Olly from folding the Mushroom Kingdom into his origami empire." }),
    "Super Mario 64": Object.freeze({ genre: "3D Platformer", description: "Mario explores Princess Peach's castle and leaps into magical paintings to recover the Power Stars stolen by Bowser." }),
    "Super Mario Sunshine": Object.freeze({ genre: "3D Platformer", description: "Mario uses FLUDD to clean up Isle Delfino, recover Shine Sprites, and uncover the identity of the mysterious Shadow Mario." }),
    "Super Mario Galaxy": Object.freeze({ genre: "3D Platformer", description: "Mario travels across gravity-defying galaxies with Rosalina and the Lumas to rescue Princess Peach from Bowser." }),
    "Super Mario Maker 2": Object.freeze({ genre: "Platformer / Creation", description: "Mario helps rebuild Princess Peach's castle while players create and share their own Super Mario courses." }),
    "PixARK": Object.freeze({ genre: "Survival / Sandbox", description: "Survive a blocky world filled with dinosaurs and fantasy creatures by crafting, building, and taming wildlife." }),
    "Code of Princess EX": Object.freeze({ genre: "Beat 'em Up / Action RPG", description: "Princess Solange fights to restore peace after monsters and humans are driven into war." }),
    "Pokémon Shield": Object.freeze({ genre: "JRPG / Creature Collection", description: "A young Trainer travels across Galar, catches Pokémon, challenges Gyms, and uncovers the region's ancient legend." }),
    "OCTOPATH TRAVELER": Object.freeze({ genre: "JRPG", description: "Eight travelers pursue separate personal journeys that lead them across the continent of Orsterra." }),
    "Children of Morta": Object.freeze({ genre: "Action Roguelite", description: "The Bergson family defends Mount Morta and the surrounding land from a spreading supernatural Corruption." }),
    "Minecraft": Object.freeze({ genre: "Sandbox / Survival", description: "Explore a procedurally generated world where you gather resources, build anything you imagine, and survive dangerous nights." }),
    "Minecraft Dungeons": Object.freeze({ genre: "Action RPG", description: "Heroes fight through monster-filled dungeons to defeat the corrupted Arch-Illager and his powerful Orb of Dominance." }),
    "Tetris 99": Object.freeze({ genre: "Puzzle / Battle Royale", description: "Ninety-nine players compete simultaneously, sending garbage lines to opponents until only one remains." }),
    "Hello Neighbor": Object.freeze({ genre: "Stealth Horror / Puzzle", description: "A child sneaks into a suspicious neighbor's house to discover what secret is hidden in the basement." }),
    "Diablo III: Eternal Collection": Object.freeze({ genre: "Action RPG", description: "Nephalem heroes battle demonic invasions and the forces of Heaven and Hell threatening Sanctuary." }),
    "Goblin Sword": Object.freeze({ genre: "Action Platformer", description: "A young hero travels through monster-filled lands collecting treasure and magical weapons to defeat evil creatures." }),
    "Crypt of the NecroDancer: Nintendo Switch Edition": Object.freeze({ genre: "Rhythm Roguelike", description: "Cadence explores a dangerous crypt, battling enemies to the beat while searching for her missing father." }),
    "DRAGON QUEST XI S: Echoes of an Elusive Age - Definitive Edition": Object.freeze({ genre: "JRPG", description: "The Luminary learns he is destined to save Erdrea and gathers companions while hunted by powerful enemies." }),
    "Teenage Mutant Ninja Turtles: The Cowabunga Collection": Object.freeze({ genre: "Action / Collection", description: "A collection of classic TMNT adventures starring the turtles against Shredder, the Foot Clan, and familiar villains." }),
    "Teenage Mutant Ninja Turtles: Shredder's Revenge": Object.freeze({ genre: "Beat 'em Up", description: "The turtles and their allies battle the Foot Clan through New York to stop Shredder and Krang." }),
    "MAGLAM LORD": Object.freeze({ genre: "Action RPG", description: "A once-powerful Demon Lord awakens weakened and forges magical weapons while searching for allies and a possible partner." }),
    "Super Mario Odyssey": Object.freeze({ genre: "3D Platformer", description: "Mario and Cappy travel around the world collecting Power Moons to rescue Peach from Bowser's wedding plans." }),
    "Sonic Frontiers": Object.freeze({ genre: "Action / Open World", description: "Sonic explores the mysterious Starfall Islands, searching for his friends while uncovering the secrets of an ancient civilization." }),
    "Metroid Prime 4: Beyond": Object.freeze({ genre: "Action Adventure / FPS", description: "Samus Aran returns for a new first-person adventure involving mysterious worlds, hostile forces, and Chozo technology." }),
    "The Legend of Zelda: Echoes of Wisdom": Object.freeze({ genre: "Action Adventure", description: "Princess Zelda uses the Tri Rod to create echoes while trying to save Hyrule and rescue Link from mysterious rifts." }),
    "The Legend of Zelda: Link's Awakening": Object.freeze({ genre: "Action Adventure", description: "Link is shipwrecked on Koholint Island and must awaken the Wind Fish to discover the island's true nature." }),
    "The Legend of Zelda: Skyward Sword HD": Object.freeze({ genre: "Action Adventure", description: "Link journeys between Skyloft and the surface world to rescue Zelda and confront the origins of an ancient evil." }),
    "The Legend of Zelda: Breath of the Wild": Object.freeze({ genre: "Action Adventure / Open World", description: "Link awakens after a century and explores a ruined Hyrule to defeat Calamity Ganon and rescue Zelda." }),
    "FINAL FANTASY XVI": Object.freeze({ genre: "Action RPG", description: "Clive Rosfield is drawn into a war between nations whose power depends on magical Dominants and their Eikons." }),
    "FINAL FANTASY VII REBIRTH": Object.freeze({ genre: "Action RPG", description: "Cloud and his allies leave Midgar, pursuing Sephiroth across the planet while fate and memory begin to unravel." }),
    "Resident Evil 4": Object.freeze({ genre: "Survival Horror / Action", description: "Leon S. Kennedy travels to rural Europe to rescue the president's daughter from a violent cult." }),
    "The Legend of Dragoon": Object.freeze({ genre: "JRPG", description: "Dart and his allies become Dragoon warriors while confronting an ancient conspiracy threatening their world." }),
    "Dead Space": Object.freeze({ genre: "Survival Horror", description: "Engineer Isaac Clarke boards the USG Ishimura and discovers its crew transformed by a terrifying alien infection." }),
    "DRAGON BALL Z: KAKAROT": Object.freeze({ genre: "Action RPG", description: "Relive Goku's story from the Saiyan invasion through the major Dragon Ball Z sagas." }),
    "CRISIS CORE -FINAL FANTASY VII- REUNION": Object.freeze({ genre: "Action RPG", description: "SOLDIER Zack Fair uncovers Shinra secrets while his friendship with Cloud leads toward the events of Final Fantasy VII." }),
    "The Callisto Protocol": Object.freeze({ genre: "Survival Horror", description: "Prisoner Jacob Lee fights to survive Black Iron Prison after a mysterious outbreak transforms inmates into monsters." }),
    "The Last of Us Part I": Object.freeze({ genre: "Action Adventure / Survival", description: "Joel escorts Ellie across a devastated United States, forming a bond while surviving infected creatures and human threats." }),
    "STRANGER OF PARADISE FINAL FANTASY ORIGIN": Object.freeze({ genre: "Action RPG", description: "Jack Garland and his allies obsessively hunt Chaos while uncovering the truth behind Cornelia's repeating history." }),
    "Horizon Forbidden West Digital Deluxe Content": Object.freeze({ genre: "Action RPG / Adventure", description: "Bonus content for Aloy's journey into the Forbidden West as she seeks a way to stop a new biosphere-threatening plague." }),
    "Horizon Forbidden West": Object.freeze({ genre: "Action RPG / Adventure", description: "Aloy travels west to find a way to repair Earth's failing biosphere while confronting new machines and rival tribes." }),
    "Ghost of Tsushima": Object.freeze({ genre: "Action Adventure", description: "Samurai Jin Sakai defends Tsushima from Mongol invaders and must choose between tradition and unconventional tactics." }),
    "Ratchet & Clank: Rift Apart Digital Deluxe Edition": Object.freeze({ genre: "Action Platformer", description: "Ratchet, Clank, and Rivet jump between collapsing dimensions while trying to stop Emperor Nefarious." }),
    "Hood: Outlaws & Legends": Object.freeze({ genre: "PvPvE / Action", description: "Rival outlaw teams infiltrate guarded strongholds, steal treasure from the State, and compete to escape with the prize." }),
    "FINAL FANTASY VII REMAKE": Object.freeze({ genre: "Action RPG", description: "Cloud joins Avalanche's fight against Shinra in Midgar as familiar events begin to diverge from destiny." }),
    "Marvel's Spider-Man Remastered": Object.freeze({ genre: "Action Adventure", description: "Peter Parker balances life and heroism while battling a criminal uprising and a deadly threat to New York City." }),
    "Breath of Fire": Object.freeze({ genre: "JRPG", description: "Ryu, a survivor of the Light Dragon clan, gathers companions to oppose the Dark Dragons and protect the world." }),
    "Breath of Fire II": Object.freeze({ genre: "JRPG", description: "Ryu searches for the truth behind his missing family while confronting a growing demonic religion." }),
    "Contra III: The Alien Wars": Object.freeze({ genre: "Run and Gun", description: "Commandos Bill and Lance battle Red Falcon's alien invasion across a devastated futuristic Earth." }),
    "Donkey Kong Country": Object.freeze({ genre: "Platformer", description: "Donkey Kong and Diddy Kong cross Donkey Kong Island to recover their stolen banana hoard from King K. Rool." }),
    "Donkey Kong Country 2: Diddy's Kong Quest": Object.freeze({ genre: "Platformer", description: "Diddy and Dixie Kong travel through Crocodile Isle to rescue Donkey Kong from Kaptain K. Rool." }),
    "Donkey Kong Country 3: Dixie Kong's Double Trouble!": Object.freeze({ genre: "Platformer", description: "Dixie and Kiddy Kong explore the Northern Kremisphere while searching for Donkey Kong and Diddy." }),
    "Doom": Object.freeze({ genre: "First-Person Shooter", description: "A lone space marine fights through demon-infested bases and the forces of Hell on Mars." }),
    "EarthBound": Object.freeze({ genre: "JRPG", description: "Ness and his friends journey across a strange modern world to stop the cosmic destroyer Giygas." }),
    "Earthworm Jim": Object.freeze({ genre: "Action Platformer", description: "An ordinary earthworm gains a powerful robotic suit and sets out to rescue Princess What's-Her-Name." }),
    "Earthworm Jim 2": Object.freeze({ genre: "Action Platformer", description: "Jim and Peter Puppy chase Psy-Crow across bizarre worlds to rescue Princess What's-Her-Name again." }),
    "Final Fantasy: Mystic Quest": Object.freeze({ genre: "JRPG", description: "Benjamin travels across a collapsing world to restore four crystals and defeat the Dark King." }),
    "Final Fantasy II": Object.freeze({ genre: "JRPG", description: "Dark knight Cecil questions his kingdom's orders and begins a journey of redemption against a world-threatening enemy." }),
    "Final Fantasy III": Object.freeze({ genre: "JRPG", description: "Terra and a large resistance cast fight an empire exploiting magic while the world approaches ruin." }),
    "Illusion of Gaia": Object.freeze({ genre: "Action RPG", description: "Will travels through ancient ruins and lost civilizations to stop a comet threatening the world." }),
    "Judge Dredd": Object.freeze({ genre: "Action Platformer", description: "Judge Dredd patrols Mega-City One, arrests criminals, and battles threats including the Dark Judges." }),
    "Lufia & the Fortress of Doom": Object.freeze({ genre: "JRPG", description: "A descendant of Maxim gathers companions to confront the returning Sinistrals and protect the world." }),
    "Lufia II: Rise of the Sinistrals": Object.freeze({ genre: "JRPG", description: "Monster hunter Maxim begins the legendary journey that leads to the first battle against the Sinistrals." }),
    "Mega Man 7": Object.freeze({ genre: "Action Platformer", description: "Mega Man pursues Dr. Wily and eight new Robot Masters after a prison breakout threatens the city." }),
    "Mega Man Soccer": Object.freeze({ genre: "Sports / Soccer", description: "Mega Man and familiar Robot Masters compete in arcade-style soccer matches with special abilities." }),
    "Mega Man X": Object.freeze({ genre: "Action Platformer", description: "X joins Zero and the Maverick Hunters to stop Sigma's rebellion of dangerous rogue Reploids." }),
    "Mega Man X2": Object.freeze({ genre: "Action Platformer", description: "X battles new Mavericks and the X-Hunters while searching for the scattered parts of Zero." }),
    "Mega Man X3": Object.freeze({ genre: "Action Platformer", description: "X and Zero confront Doppler's uprising after a supposed cure for Maverick behavior fails." }),
    "Soul Blazer": Object.freeze({ genre: "Action RPG", description: "A divine warrior restores lost towns and their inhabitants by freeing souls trapped inside monsters." }),
    "Sparkster": Object.freeze({ genre: "Action Platformer", description: "Rocket Knight Sparkster battles an invading wolf army using his sword and explosive rocket pack." }),
    "Star Fox": Object.freeze({ genre: "Rail Shooter", description: "Fox McCloud and the Star Fox team fly through the Lylat system to defeat the scientist Andross." }),
    "Super Ghouls 'N Ghosts": Object.freeze({ genre: "Action Platformer", description: "Knight Arthur battles through a demon-filled kingdom to rescue Princess Guinevere from Emperor Sardius." }),
    "Super Mario All-Stars": Object.freeze({ genre: "Platformer Collection", description: "A remastered collection of Mario's early Mushroom Kingdom adventures with updated SNES graphics and sound." }),
    "Super Mario Kart": Object.freeze({ genre: "Kart Racing", description: "Mario and friends race across themed circuits using items, shortcuts, and competitive driving." }),
    "Super Mario RPG: Legend of the Seven Stars": Object.freeze({ genre: "JRPG", description: "Mario joins unlikely allies to repair Star Road and defeat the invading Smithy Gang." }),
    "Super Mario World": Object.freeze({ genre: "Platformer", description: "Mario and Luigi explore Dinosaur Land with Yoshi to rescue Peach from Bowser and the Koopalings." }),
    "Super Mario World 2: Yoshi's Island": Object.freeze({ genre: "Platformer", description: "Yoshi carries Baby Mario across a colorful island while trying to reunite him with Baby Luigi." }),
    "Super Metroid": Object.freeze({ genre: "Metroidvania", description: "Samus Aran returns to planet Zebes to recover the stolen Metroid larva from the Space Pirates." }),
    "SWAT Kats: The Radical Squadron": Object.freeze({ genre: "Action Platformer", description: "T-Bone and Razor defend Megakat City using martial arts, gadgets, and the Turbokat fighter jet." }),
    "Tales of Phantasia": Object.freeze({ genre: "Action JRPG", description: "Cress and his companions travel through time to stop the warlord Dhaos from threatening their world." }),
    "Teenage Mutant Ninja Turtles IV: Turtles in Time": Object.freeze({ genre: "Beat 'em Up", description: "The Ninja Turtles chase Shredder through history after the Foot Clan steals the Statue of Liberty." }),
    "Terranigma": Object.freeze({ genre: "Action RPG", description: "Ark restores the continents and life of a dead world while uncovering the truth behind its resurrection." }),
    "Tiny Toon Adventures: Buster Busts Loose!": Object.freeze({ genre: "Platformer", description: "Buster Bunny races through Acme Looniversity adventures inspired by the Tiny Toon animated series." }),
    "Tom and Jerry": Object.freeze({ genre: "Platformer", description: "Jerry explores a house full of hazards and tricks while avoiding Tom and rescuing his kidnapped nephew Tuffy." }),
    "Wolverine: Adamantium Rage": Object.freeze({ genre: "Action Platformer", description: "Wolverine follows a mysterious message across dangerous locations while battling enemies from his past." }),
    "X-Men: Mutant Apocalypse": Object.freeze({ genre: "Action / Beat 'em Up", description: "Five X-Men infiltrate Genosha to rescue captured mutants and confront powerful enemies." }),
    "Ys III: Wanderers from Ys": Object.freeze({ genre: "Action RPG", description: "Adol and Dogi return to Felghana and uncover a threat surrounding the region's ancient statues." }),
    "Chrono Trigger": Object.freeze({ genre: "JRPG", description: "Crono and his friends travel through time to prevent a future apocalypse caused by the alien creature Lavos." }),
    "The Legend of Zelda: A Link to the Past": Object.freeze({ genre: "Action Adventure", description: "Link journeys between Hyrule and the Dark World to rescue Zelda and defeat the wizard Agahnim and Ganon." }),
    "Secret of Mana": Object.freeze({ genre: "Action RPG", description: "A young hero pulls the Mana Sword and joins allies on a quest to restore its power and stop an empire." }),
    "Secret of Evermore": Object.freeze({ genre: "Action RPG", description: "A boy and his dog are transported to the strange world of Evermore and search for a way home." }),
  });

  const SWITCH_GENRES = Object.freeze({
    ".hack//G.U. Last Recode": "Action RPG",
    "Actraiser Renaissance": "Action Platformer / City-Building",
    "Atelier Ryza: Ever Darkness & the Secret Hideout DX": "JRPG / Alchemy",
    "Atelier Ryza 2: Lost Legends & the Secret Fairy DX": "JRPG / Alchemy",
    "Atelier Ryza 3: Alchemist of the End & the Secret Key DX": "JRPG / Alchemy",
    "Blaster Master Zero": "Action Platformer / Metroidvania",
    "Blossom Tales: The Sleeping King": "Action Adventure",
    "Brave Dungeon": "Dungeon-Crawling JRPG",
    "Children of Morta": "Action Roguelite",
    "Code of Princess EX": "Beat 'em Up / Action RPG",
    "Crypt of the NecroDancer: Nintendo Switch Edition": "Rhythm Roguelike",
    "Dark Witch's Story: COMBAT": "Card Battler / Strategy",
    "Darksiders Genesis": "Action RPG / Hack and Slash",
    "Dead Cells": "Roguelite / Metroidvania",
    "Diablo III: Eternal Collection": "Action RPG",
    "DRAGON BALL XENOVERSE 2": "Fighting / Action RPG",
    "DRAGON BALL Z: KAKAROT + A NEW POWER AWAKENS SET": "Action RPG",
    "DRAGON QUEST XI S: Echoes of an Elusive Age - Definitive Edition": "JRPG",
    "DragonFangZ - The Rose & Dungeon of Time": "Roguelike / Dungeon Crawler",
    "FANTASY LIFE i: The Girl Who Steals Time Nintendo Switch 2 Edition": "Life Sim / Action RPG",
    "FINAL FANTASY": "JRPG",
    "FINAL FANTASY II": "JRPG",
    "FINAL FANTASY III": "JRPG",
    "FINAL FANTASY IV": "JRPG",
    "FINAL FANTASY V": "JRPG",
    "FINAL FANTASY VI": "JRPG",
    "FINAL FANTASY VII": "JRPG",
    "Goblin Sword": "Action Platformer",
    "Guardian Tales": "Action RPG / Adventure",
    "Hello Neighbor": "Stealth Horror / Puzzle",
    "Hyrule Warriors: Definitive Edition": "Hack and Slash / Action",
    "I Am Setsuna": "JRPG",
    "Langrisser I & II": "Tactical RPG",
    "Mario + Rabbids Kingdom Battle": "Tactical RPG",
    "Mega Man Zero/ZX Legacy Collection": "Action Platformer / Collection",
    "Miden Tower": "JRPG",
    "MIGHTY GUNVOLT BURST": "Action Platformer",
    "Minecraft": "Sandbox / Survival",
    "Minecraft Dungeons": "Action RPG / Dungeon Crawler",
    "Nine Parchments": "Action RPG / Twin-Stick Shooter",
    "OCTOPATH TRAVELER": "JRPG",
    "Paper Mario: The Origami King": "Adventure / RPG",
    "PixARK": "Survival / Sandbox",
    "Pokémon Shield": "JRPG / Creature Collection",
    "Record of Lodoss War-Deedlit in Wonder Labyrinth-": "Metroidvania",
    "Resident Evil Revelations": "Survival Horror / Action",
    "Resident Evil Revelations 2": "Survival Horror / Action",
    "Rogue Legacy 2": "Roguelite / Platformer",
    "Romancing SaGa 2": "JRPG",
    "Ruinverse": "JRPG",
    "Shovel Knight: Treasure Trove": "Action Platformer / Collection",
    "Sonic Mania": "Platformer",
    "Super Mario 64": "3D Platformer",
    "Super Mario Galaxy": "3D Platformer",
    "Super Mario Maker 2": "Platformer / Creation",
    "Super Mario Sunshine": "3D Platformer",
    "Tetris 99": "Puzzle / Battle Royale",
    "Valthirian Arc: Hero School Story": "Simulation / Action RPG",
    "Xenoblade Chronicles 2": "JRPG",
  });

  function coverUrl(game, alternate) {
    if (game.image) {
      return game.image;
    }

    if (alternate) {
      return `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/library_600x900.jpg`;
    }

    return currentHeaderImages[game.appId]
      || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`;
  }

  function initials(title) {
    return title
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "GAME";
  }

  function escapeXml(value) {
    return String(value).replace(/[<>&'"]/g, (character) => ({
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    }[character]));
  }

  function fallbackCoverUrl(title) {
    const safeTitle = escapeXml(title);
    const shortTitle = safeTitle.length > 28
      ? `${safeTitle.slice(0, 25)}…`
      : safeTitle;
    const initialsText = initials(title) || "GAME";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#162b0d"/>
          <stop offset="0.52" stop-color="#071006"/>
          <stop offset="1" stop-color="#020302"/>
        </linearGradient>
        <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M34 0H0V34" fill="none" stroke="#7cff00" stroke-opacity=".12"/>
        </pattern>
      </defs>
      <rect width="600" height="900" fill="url(#bg)"/>
      <rect width="600" height="900" fill="url(#grid)"/>
      <circle cx="470" cy="165" r="150" fill="#7cff00" fill-opacity=".08"/>
      <path d="M-80 760L680 420" stroke="#7cff00" stroke-opacity=".2" stroke-width="5"/>
      <path d="M-40 835L720 495" stroke="#7cff00" stroke-opacity=".1" stroke-width="18"/>
      <text x="42" y="120" fill="#7cff00" font-family="Arial,sans-serif" font-size="28" font-weight="700" letter-spacing="6">THYTOXICGAMER</text>
      <text x="42" y="430" fill="#f1f5ef" font-family="Arial,sans-serif" font-size="64" font-weight="900">${initialsText}</text>
      <text x="42" y="500" fill="#b7ff73" font-family="Arial,sans-serif" font-size="25" font-weight="700">${shortTitle}</text>
      <text x="42" y="842" fill="#7cff00" font-family="Consolas,monospace" font-size="22" letter-spacing="4">ARTWORK FALLBACK</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }


  function getGameInfo(game) {
    const info = GAME_INFO[game.title] || {
      genre: "Game",
      description: `Explore the world, characters, and challenges of ${game.title}.`,
    };

    const switchGenre = game.sourcePlatformId === "switch"
      ? SWITCH_GENRES[game.title]
      : null;

    return switchGenre
      ? { ...info, genre: switchGenre }
      : info;
  }

  function isGameUpcoming(game, now) {
    if (!game.releaseDate) return false;

    const dateParts = game.releaseDate.split("-").map(Number);
    if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) return false;

    const releaseStart = new Date(
      dateParts[0],
      dateParts[1] - 1,
      dateParts[2],
    );

    return now < releaseStart;
  }

  function createCover(game, eager) {
    const shell = document.createElement("div");
    shell.className = "cover-shell";

    const fallback = document.createElement("span");
    fallback.className = "cover-fallback";
    fallback.textContent = initials(game.title);
    fallback.setAttribute("aria-hidden", "true");

    const image = document.createElement("img");
    image.className = "game-cover";
    image.src = coverUrl(game, false);
    image.alt = `${game.title} cover art`;
    image.loading = eager ? "eager" : "lazy";
    image.decoding = "async";
    image.dataset.coverAttempt = game.image ? "external" : "header";

    image.classList.add(game.image ? "console-cover" : "landscape-cover");
    if ([
      "Atelier Ryza Secret Trilogy Deluxe Pack",
      "Code of Princess EX",
    ].includes(game.title)) {
      image.classList.add("full-cover-art");
    }
    shell.classList.add("has-cover-image");
    shell.style.setProperty(
      "--cover-image",
      `url("${image.src.replace(/"/g, "%22")}")`,
    );

    image.addEventListener("load", function () {
      image.classList.remove("portrait-art", "landscape-art");

      if (image.naturalHeight > image.naturalWidth * 1.08) {
        image.classList.add("portrait-art");
      } else {
        image.classList.add("landscape-art");
      }
    });

    image.addEventListener("error", function () {
      if (image.dataset.coverAttempt === "header") {
        image.dataset.coverAttempt = "portrait";
        image.classList.remove("landscape-cover");
        image.src = coverUrl(game, true);
        return;
      }

      if (image.dataset.coverAttempt !== "fallback") {
        image.dataset.coverAttempt = "fallback";
        image.classList.remove(
          "landscape-cover",
          "console-cover",
          "portrait-art",
          "landscape-art",
        );
        image.classList.add("generated-cover");
        shell.classList.remove("has-cover-image");
        image.src = fallbackCoverUrl(game.title);
        return;
      }

      image.remove();
      shell.classList.add("cover-unavailable");
    });

    shell.append(fallback, image);
    return shell;
  }

  function createGameCard(game, index, platform) {
    const upcoming = isGameUpcoming(game, new Date());
    const isPcGame = (platform.id === "pc" || game.sourcePlatformId === "pc") && game.appId;
    const card = document.createElement(isPcGame ? "a" : "article");
    card.className = "game-card";
    const sourcePlatformId = game.sourcePlatformId || platform.id;
    card.classList.add(`platform-${sourcePlatformId}`);
    if (sourcePlatformId !== "pc") {
      card.classList.add("console-game");
      card.tabIndex = 0;
      card.setAttribute("aria-label", `${game.title}. Hover or focus for game details.`);
    }

    if (isPcGame) {
      card.href = `https://store.steampowered.com/app/${game.appId}/`;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.setAttribute("aria-label", `View ${game.title} on Steam`);
    }

    if (upcoming) {
      card.classList.add("upcoming-game");
    }

    const cover = createCover(game, index < 8);

    const details = document.createElement("div");
    details.className = "game-details";

    const number = document.createElement("span");
    number.className = "game-number";
    number.textContent = `#${String(game.number).padStart(3, "0")}`;

    const title = document.createElement("h3");
    title.textContent = game.title;

    details.append(number, title);

    if (upcoming) {
      const release = document.createElement("p");
      release.className = "card-release";
      release.append("Coming ");

      const releaseTime = document.createElement("time");
      releaseTime.dateTime = game.releaseDate;
      releaseTime.textContent = game.releaseLabel || game.releaseDate;
      release.append(releaseTime);
      details.append(release);
    }

    const requestButton = document.createElement(isPcGame ? "span" : "button");
    requestButton.className = "request-game-button";
    requestButton.textContent = "Request for $5+";
    requestButton.dataset.gameTitle = game.title;
    requestButton.dataset.gamePlatform = sourcePlatformId;
    if (isPcGame) {
      requestButton.setAttribute("role", "button");
      requestButton.tabIndex = 0;
    } else {
      requestButton.type = "button";
    }

    const gameInfo = getGameInfo(game);
    const hoverInfo = document.createElement("div");
    hoverInfo.className = "game-hover-info";

    const genre = document.createElement("span");
    genre.className = "game-genre";
    genre.textContent = gameInfo.genre;

    const description = document.createElement("p");
    description.className = "game-description";
    description.textContent = gameInfo.description;

    hoverInfo.append(genre, description);
    card.append(cover, details, hoverInfo, requestButton);
    return card;
  }

  function renderGameCollection(games, cardPlatform) {
    const fragment = document.createDocumentFragment();
    games.forEach((game, index) => {
      fragment.append(createGameCard(game, index, cardPlatform));
    });

    grid.replaceChildren(fragment);
  }

  function hidePlatformSubtabs() {
    platformSubtabs.hidden = true;
    platformSubtabs.replaceChildren();
  }

  function renderSectionedPlatform(platform) {
    const sections = platform.sections;
    const savedSectionId = activeSectionByPlatform.get(platform.id);
    const initialSection = sections.find((section) => section.id === savedSectionId) || sections[0];
    const fragment = document.createDocumentFragment();

    sections.forEach((section, index) => {
      const button = document.createElement("button");
      button.className = "platform-subtab";
      button.id = `subtab-${platform.id}-${section.id}`;
      button.type = "button";
      button.dataset.section = section.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", "game-grid");

      const label = document.createElement("span");
      label.textContent = `${section.label} Games`;

      const count = document.createElement("span");
      count.className = "subtab-count";
      count.textContent = String(section.games.length);

      button.append(label, count);
      button.addEventListener("click", () => selectSection(section.id, true));
      button.addEventListener("keydown", (event) => {
        let targetIndex = index;

        if (event.key === "ArrowRight") {
          targetIndex = (index + 1) % sections.length;
        } else if (event.key === "ArrowLeft") {
          targetIndex = (index - 1 + sections.length) % sections.length;
        } else if (event.key === "Home") {
          targetIndex = 0;
        } else if (event.key === "End") {
          targetIndex = sections.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        selectSection(sections[targetIndex].id, true);
      });
      fragment.append(button);
    });

    platformSubtabs.replaceChildren(fragment);
    platformSubtabs.hidden = false;

    function selectSection(sectionId, focusButton) {
      const section = sections.find((entry) => entry.id === sectionId) || sections[0];
      activeSectionByPlatform.set(platform.id, section.id);

      platformSubtabs.querySelectorAll('[role="tab"]').forEach((button) => {
        const selected = button.dataset.section === section.id;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && focusButton) button.focus();
      });

      platformName.textContent = `${section.label} Library`;
      libraryCount.textContent = `${section.games.length} Games`;
      renderGameCollection(section.games, section);
    }

    selectSection(initialSection.id, false);
  }

  function renderPlatform(platform) {
    panel.setAttribute("aria-labelledby", `tab-${platform.id}`);

    if (platform.updates) {
      hidePlatformSubtabs();
      platformName.textContent = "System Updates";
      libraryCount.textContent = "Ver. 1.0";
      grid.hidden = true;
      comingSoon.hidden = true;
      updatesPanel.hidden = false;
      return;
    }

    updatesPanel.hidden = true;
    platformName.textContent = platform.id === "all"
      ? "All Games"
      : `${platform.label} Library`;

    if (platform.comingSoon) {
      hidePlatformSubtabs();
      libraryCount.textContent = "Coming Soon";
      comingSoonLibrary.textContent = `${platform.label} Library`;
      comingSoonMessage.textContent = platform.comingSoonMessage
        || `${platform.label} games will be added here.`;
      grid.hidden = true;
      comingSoon.hidden = false;
      grid.replaceChildren();
      return;
    }

    grid.hidden = false;
    comingSoon.hidden = true;

    if (Array.isArray(platform.sections) && platform.sections.length) {
      renderSectionedPlatform(platform);
      return;
    }

    hidePlatformSubtabs();
    libraryCount.textContent = `${platform.games.length} Games`;
    renderGameCollection(platform.games, platform);
  }

  function activatePlatform(id, focusTab) {
    const platform = viewPlatforms.find((entry) => entry.id === id) || viewPlatforms[0];
    if (!platform) return;

    activePlatformId = platform.id;

    tabs.querySelectorAll('[role="tab"]').forEach((tab) => {
      const selected = tab.dataset.platform === activePlatformId;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;

      if (selected && focusTab) {
        tab.focus();
      }
    });

    renderPlatform(platform);
  }

  function createTabs() {
    const fragment = document.createDocumentFragment();

    viewPlatforms.forEach((platform, index) => {
      const button = document.createElement("button");
      button.className = "platform-tab";
      button.id = `tab-${platform.id}`;
      button.type = "button";
      button.dataset.platform = platform.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", "platform-panel");
      button.setAttribute("aria-selected", String(platform.id === activePlatformId));
      button.tabIndex = platform.id === activePlatformId ? 0 : -1;

      const label = document.createElement("span");
      label.textContent = platform.label;

      const count = document.createElement("span");
      count.className = "tab-count";
      count.textContent = platform.updates
        ? "Latest"
        : platform.comingSoon
          ? "Soon"
          : String(platform.games.length);

      button.append(label, count);
      button.addEventListener("click", () => activatePlatform(platform.id, false));
      button.addEventListener("keydown", (event) => {
        let targetIndex = index;

        if (event.key === "ArrowRight") {
          targetIndex = (index + 1) % viewPlatforms.length;
        } else if (event.key === "ArrowLeft") {
          targetIndex = (index - 1 + viewPlatforms.length) % viewPlatforms.length;
        } else if (event.key === "Home") {
          targetIndex = 0;
        } else if (event.key === "End") {
          targetIndex = viewPlatforms.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        activatePlatform(viewPlatforms[targetIndex].id, true);
      });

      fragment.append(button);
    });

    tabs.replaceChildren(fragment);
  }

  function renderLibrary() {
    if (
      !grid
      || !headerCount
      || !tabs
      || !platformSubtabs
      || !panel
      || !platformName
      || !libraryCount
      || !comingSoon
      || !comingSoonLibrary
      || !comingSoonMessage
      || !updatesPanel
      || !siteUpdatesButton
      || platforms.length === 0
    ) {
      return;
    }

    const totalGames = library.totalGames
      || platforms.reduce((total, platform) => total + platform.games.length, 0);

    headerCount.textContent = String(totalGames);
    createTabs();
    siteUpdatesButton.addEventListener("click", function () {
      const updatesTab = tabs.querySelector('[data-platform="updates"]');
      updatesTab?.click();

      requestAnimationFrame(function () {
        if (!updatesTab?.classList.contains("active")) {
          activatePlatform("updates", false);
        }

        requestAnimationFrame(function () {
          tabs.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    });
    activatePlatform(activePlatformId, false);
  }

  renderLibrary();
})();
