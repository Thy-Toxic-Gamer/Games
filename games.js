function portraitArtwork(source) {
  return `https://images.weserv.nl/?url=${encodeURIComponent(source)}&w=600&h=900&fit=contain&bg=090c09&output=jpg`;
}

const pcRows = [
  ["30XX", 1029210],
  ["Albion Online", 761890],
  ["Apex Legends", 1172470],
  ["ArcheAge: Unchained", 1147660],
  ["ARK: Survival Ascended", 2399830],
  ["Ashen", 649950],
  ["Assassin's Creed Valhalla", 2208920],
  ["BALL x PIT", 2062430],
  ["Black Desert", 582660],
  ["Bless Online", 681660],
  ["Breathedge", 738520],
  ["Castlevania: Belmont's Curse", 4231820, "2026-10-15", "October 15, 2026"],
  ["Clair Obscur: Expedition 33", 1903340],
  ["Dead Cells", 588650],
  ["Dead Frontier 2", 744900],
  ["Deep Rock Galactic: Survivor", 2321470],
  ["Destiny 2", 1085660],
  ["Deus Ex: Mankind Divided", 337000],
  ["DIVE or DIE - Children of Rain", 3590290],
  ["DOOM", 379720],
  ["DOOM + DOOM II", 2280],
  ["DOOM 3", 9050],
  ["DOOM 3: BFG Edition", 208200],
  ["DOOM 3: Resurrection of Evil", 9070],
  ["DOOM 64", 1148590],
  ["DOOM Eternal", 782330],
  ["DOOM: The Dark Ages", 3017860],
  ["Dragon Nest", 11610],
  ["The Dungeon Of Naheulbeuk: The Amulet Of Chaos", 970830],
  ["The Elder Scrolls Online", 306130],
  ["Enshrouded", 1203620],
  ["FINAL FANTASY VII", 3837340],
  ["FINAL FANTASY XIII", 292120],
  ["FINAL FANTASY XIII-2", 292140],
  ["FINAL FANTASY XIV Online", 39210],
  ["The First Descendant", 2074920],
  ["God of War", 1593500],
  ["Gotham Knights", 1496790],
  ["Granblue Fantasy: Relink", 881020],
  ["Hades", 1145360],
  ["Hades II", 1145350],
  ["Heroes of Hammerwatch II", 619820],
  ["KINGDOM HEARTS -HD 1.5+2.5 ReMIX-", 2552430],
  ["KINGDOM HEARTS HD 2.8 Final Chapter Prologue", 2552440],
  ["KINGDOM HEARTS III + Re Mind (DLC)", 2552450],
  ["Life is Feudal: MMO", 700030],
  ["LIGHTNING RETURNS: FINAL FANTASY XIII", 345350],
  ["Lost Ark", 1599340],
  ["MapleStory", 216150],
  ["Marvel Rivals", 2767030],
  ["Medieval Dynasty", 1129580],
  ["Mega Man Battle Network Legacy Collection Vol. 1", 1798010],
  ["Mega Man Battle Network Legacy Collection Vol. 2", 1798020],
  ["Neverwinter: Biting Cold", 109600],
  ["NINJA GAIDEN Σ [NINJA GAIDEN: Master Collection]", 1580780],
  ["NINJA GAIDEN Σ2 [NINJA GAIDEN: Master Collection]", 1580790],
  ["NINJA GAIDEN 3: Razor's Edge [NINJA GAIDEN: Master Collection]", 1369760],
  ["No Rest for the Wicked", 1371980],
  ["Old School RuneScape", 1343370],
  ["Once Human", 2139460],
  ["Onimusha 2: Samurai's Destiny", 3046600],
  ["Onimusha: Warlords", 761600],
  ["OUTRIDERS", 680420],
  ["Outward", 794260],
  ["Palworld", 1623730],
  ["Path of Exile: Curse of the Allflame", 238960],
  ["Path of Exile 2: Return of the Ancients", 2694490],
  ["Phantasy Star Online 2 New Genesis", 1056640],
  ["Pyre", 462770],
  ["Remnant: From the Ashes", 617290],
  ["Romestead", 1805320],
  ["Royal Quest", 295550],
  ["RuneScape", 1343400],
  ["RuneScape: Dragonwilds", 1374490],
  ["Shatterline", 2087030],
  ["Skyforge", 414530],
  ["Tales of ARISE", 740130],
  ["TERA", 323370],
  ["Throne and Liberty", 2429640],
  ["Torchlight II", 200710],
  ["Tree of Savior (English Ver.)", 372000],
  ["Under The Waves", 1975440],
  ["V Rising", 1604030],
  ["Valheim", 892970],
  ["Vampire Crawlers", 3265700],
  ["Vindictus", 212160],
  ["Warframe", 230410],
  ["Warhammer 40,000: Darktide", 1361210],
  ["Windrose", 3041230],
  ["The Witcher: Enhanced Edition", 20900],
  ["The Witcher 2: Assassins of Kings Enhanced Edition", 20920],
  ["The Witcher 3: Wild Hunt - Complete Edition", 292030],
  ["Wizardry Variants Daphne", 2379740],
];

const switchRows = [
  [".hack//G.U. Last Recode", "https://gpstatic.com/acache/34/50/1/us/packshot-bd67718a008b7eee3bf9e4fc48bfd35c.jpg"],
  ["Actraiser Renaissance", "https://cdn.cloudflare.steamstatic.com/steam/apps/1393370/library_600x900.jpg"],
  ["Atelier Ryza 2: Lost Legends & the Secret Fairy DX", "assets/covers/switch/atelier-ryza-2-dx.webp"],
  ["Atelier Ryza 3: Alchemist of the End & the Secret Key DX", "assets/covers/switch/atelier-ryza-3-dx.webp"],
  ["Atelier Ryza: Ever Darkness & the Secret Hideout DX", "assets/covers/switch/atelier-ryza-ever-darkness-dx.webp"],
  ["Blaster Master Zero", "assets/covers/switch/blaster-master-zero.webp"],
  ["Blossom Tales: The Sleeping King", "https://cdn.cloudflare.steamstatic.com/steam/apps/446810/library_600x900.jpg"],
  ["Brave Dungeon", "assets/covers/switch/brave-dungeon.webp"],
  ["Children of Morta", "https://cdn.cloudflare.steamstatic.com/steam/apps/330020/library_600x900.jpg"],
  ["Code of Princess EX", "code-of-princess-ex.png"],
  ["Crypt of the NecroDancer: Nintendo Switch Edition", "https://cdn.cloudflare.steamstatic.com/steam/apps/247080/library_600x900.jpg"],
  ["Darksiders Genesis", "https://cdn.cloudflare.steamstatic.com/steam/apps/710920/library_600x900.jpg"],
  ["Dark Witch's Story: COMBAT", "assets/covers/switch/dark-witch-story-combat.webp"],
  ["Dead Cells", "https://cdn.cloudflare.steamstatic.com/steam/apps/588650/library_600x900.jpg"],
  ["Diablo III: Eternal Collection", "assets/covers/switch/diablo-iii-eternal-collection.webp"],
  ["DRAGON BALL XENOVERSE 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/454650/library_600x900.jpg"],
  ["DRAGON BALL Z: KAKAROT + A NEW POWER AWAKENS SET", "https://cdn.cloudflare.steamstatic.com/steam/apps/851850/library_600x900.jpg"],
  ["DRAGON QUEST XI S: Echoes of an Elusive Age - Definitive Edition", "https://cdn.cloudflare.steamstatic.com/steam/apps/1295510/library_600x900.jpg"],
  ["DragonFangZ - The Rose & Dungeon of Time", "assets/covers/switch/dragonfangz.webp"],
  ["FANTASY LIFE i: The Girl Who Steals Time Nintendo Switch 2 Edition", "https://cdn.cdkeys.com/496x700/media/catalog/product/f/a/fantasy_life_i-_the_girl_who_steals_time_cdkeys.png"],
  ["FINAL FANTASY", "https://cdn.cloudflare.steamstatic.com/steam/apps/1173770/library_600x900.jpg"],
  ["FINAL FANTASY II", "https://cdn.cloudflare.steamstatic.com/steam/apps/1173780/library_600x900.jpg"],
  ["FINAL FANTASY III", "https://cdn.cloudflare.steamstatic.com/steam/apps/1173790/library_600x900.jpg"],
  ["FINAL FANTASY IV", "https://cdn.cloudflare.steamstatic.com/steam/apps/1173800/library_600x900.jpg"],
  ["FINAL FANTASY V", "https://cdn.cloudflare.steamstatic.com/steam/apps/1173810/library_600x900.jpg"],
  ["FINAL FANTASY VI", "https://cdn.cloudflare.steamstatic.com/steam/apps/1173820/library_600x900.jpg"],
  ["FINAL FANTASY VII", "https://cdn.cloudflare.steamstatic.com/steam/apps/39140/library_600x900.jpg"],
  ["Goblin Sword", "assets/covers/switch/goblin-sword.png"],
  ["Guardian Tales", "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/store/software/switch/70010000041655/2c8e04df5b0a67cadda0b78f4848ee28d901ee581028bcaea5c2adf861b7b145"],
  ["Hello Neighbor", "https://cdn.cloudflare.steamstatic.com/steam/apps/521890/library_600x900.jpg"],
  ["Hyrule Warriors: Definitive Edition", "assets/covers/switch/hyrule-warriors-definitive-edition.webp"],
  ["I Am Setsuna", "https://cdn.cloudflare.steamstatic.com/steam/apps/441830/library_600x900.jpg"],
  ["Langrisser I & II", "https://cdn.cloudflare.steamstatic.com/steam/apps/1060220/library_600x900.jpg"],
  ["Mario + Rabbids Kingdom Battle", portraitArtwork("https://cdn.awsli.com.br/800x800/53/53761/produto/19052323/ec97419a58.jpg")],
  ["Mega Man Zero/ZX Legacy Collection", "https://cdn.cloudflare.steamstatic.com/steam/apps/999020/library_600x900.jpg"],
  ["Miden Tower", "https://cdn.cloudflare.steamstatic.com/steam/apps/1265580/library_600x900.jpg"],
  ["MIGHTY GUNVOLT BURST", "https://cdn.cloudflare.steamstatic.com/steam/apps/774651/library_600x900.jpg"],
  ["Minecraft", "assets/covers/switch/minecraft.png"],
  ["Minecraft Dungeons", "https://cdn.cloudflare.steamstatic.com/steam/apps/1672970/library_600x900.jpg"],
  ["Nine Parchments", "https://cdn.cloudflare.steamstatic.com/steam/apps/471550/library_600x900.jpg"],
  ["OCTOPATH TRAVELER", "https://cdn.cloudflare.steamstatic.com/steam/apps/921570/library_600x900.jpg"],
  ["Paper Mario: The Origami King", "assets/covers/switch/paper-mario-origami-king.png"],
  ["PixARK", "https://cdn.cloudflare.steamstatic.com/steam/apps/593600/library_600x900.jpg"],
  ["Pokémon Shield", "assets/covers/switch/pokemon-shield.png"],
  ["Record of Lodoss War-Deedlit in Wonder Labyrinth-", "https://cdn.cloudflare.steamstatic.com/steam/apps/1203630/library_600x900.jpg"],
  ["Resident Evil Revelations", "https://cdn.cloudflare.steamstatic.com/steam/apps/222480/library_600x900.jpg"],
  ["Resident Evil Revelations 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/287290/library_600x900.jpg"],
  ["Rogue Legacy 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/1253920/library_600x900.jpg"],
  ["Romancing SaGa 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/606370/library_600x900.jpg"],
  ["Ruinverse", "https://cdn.cloudflare.steamstatic.com/steam/apps/1445430/library_600x900.jpg"],
  ["Shovel Knight: Treasure Trove", "https://cdn.cloudflare.steamstatic.com/steam/apps/250760/library_600x900.jpg"],
  ["Sonic Mania", "https://cdn.cloudflare.steamstatic.com/steam/apps/584400/library_600x900.jpg"],
  ["Super Mario 64", "assets/covers/switch/super-mario-64.webp"],
  ["Super Mario Galaxy", "assets/covers/switch/super-mario-galaxy.webp"],
  ["Super Mario Maker 2", "assets/covers/switch/super-mario-maker-2.png"],
  ["Super Mario Sunshine", "assets/covers/switch/super-mario-sunshine.webp"],
  ["Tetris 99", "https://assets.games.gg/tetris_99_cover_a5464d6500.png"],
  ["Valthirian Arc: Hero School Story", "https://cdn.cloudflare.steamstatic.com/steam/apps/785850/library_600x900.jpg"],
  ["Xenoblade Chronicles 2", "assets/covers/switch/xenoblade-chronicles-2.webp"],
];

const ps5Rows = [
  ["FINAL FANTASY XVI", "https://cdn.cloudflare.steamstatic.com/steam/apps/2515020/library_600x900.jpg"],
  ["Assassin's Creed Valhalla", "https://cdn.cloudflare.steamstatic.com/steam/apps/2208920/library_600x900.jpg"],
  ["The First Descendant", "assets/covers/ps5/the-first-descendant-season-4.png"],
  ["FINAL FANTASY VII REBIRTH", "https://cdn.cloudflare.steamstatic.com/steam/apps/2909400/library_600x900.jpg"],
  ["Resident Evil 4", "https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg"],
  ["The Legend of Dragoon", "https://upload.wikimedia.org/wikipedia/en/3/32/Legend_of_Dragoon.jpg"],
  ["Dead Space", "https://cdn.cloudflare.steamstatic.com/steam/apps/1693980/library_600x900.jpg"],
  ["DRAGON BALL Z: KAKAROT", "https://cdn.cloudflare.steamstatic.com/steam/apps/851850/library_600x900.jpg"],
  ["CRISIS CORE -FINAL FANTASY VII- REUNION", "https://cdn.cloudflare.steamstatic.com/steam/apps/1608070/library_600x900.jpg"],
  ["The Callisto Protocol", "https://cdn.cloudflare.steamstatic.com/steam/apps/1544020/library_600x900.jpg"],
  ["Sonic Frontiers", "https://cdn.cloudflare.steamstatic.com/steam/apps/1237320/library_600x900.jpg"],
  ["The Last of Us Part I", "https://cdn.cloudflare.steamstatic.com/steam/apps/1888930/library_600x900.jpg"],
  ["STRANGER OF PARADISE FINAL FANTASY ORIGIN", "https://cdn.cloudflare.steamstatic.com/steam/apps/1358700/library_600x900.jpg"],
  ["Horizon Forbidden West Digital Deluxe", "https://cdn.cloudflare.steamstatic.com/steam/apps/2420110/library_600x900.jpg"],
  ["Destiny 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/library_600x900.jpg"],
  ["FINAL FANTASY XIV Online", "https://cdn.cloudflare.steamstatic.com/steam/apps/39210/library_600x900.jpg"],
  ["Ghost of Tsushima", "https://cdn.cloudflare.steamstatic.com/steam/apps/2215430/library_600x900.jpg"],
  ["Ratchet & Clank: Rift Apart Digital Deluxe Edition", "https://cdn.cloudflare.steamstatic.com/steam/apps/1895880/library_600x900.jpg"],
  ["Ruinverse", "https://cdn.cloudflare.steamstatic.com/steam/apps/1445430/library_600x900.jpg"],
  ["Hood: Outlaws & Legends", "https://cdn.cloudflare.steamstatic.com/steam/apps/927350/library_600x900.jpg"],
  ["FINAL FANTASY VII REMAKE", "https://cdn.cloudflare.steamstatic.com/steam/apps/1462040/library_600x900.jpg"],
  ["OUTRIDERS", "https://cdn.cloudflare.steamstatic.com/steam/apps/680420/library_600x900.jpg"],
  ["Marvel's Spider-Man Remastered", "https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/library_600x900.jpg"],
];

const ps4Rows = [
  ["Phantasy Star Online 2 New Genesis", "https://cdn.cloudflare.steamstatic.com/steam/apps/1056640/library_600x900.jpg"],
  ["FINAL FANTASY VII", "https://cdn.cloudflare.steamstatic.com/steam/apps/39140/library_600x900.jpg"],
  ["Bleach: Brave Souls", "https://cdn.cloudflare.steamstatic.com/steam/apps/1201240/library_600x900.jpg"],
  ["The Last of Us Part II", "https://cdn.cloudflare.steamstatic.com/steam/apps/2531310/library_600x900.jpg"],
  ["Resident Evil 3", "https://cdn.cloudflare.steamstatic.com/steam/apps/952060/library_600x900.jpg"],
  ["Resident Evil Resistance", "https://cdn.cloudflare.steamstatic.com/steam/apps/952070/library_600x900.jpg"],
  ["Mega Man Zero/ZX Legacy Collection", "https://cdn.cloudflare.steamstatic.com/steam/apps/999020/library_600x900.jpg"],
  ["DOOM Eternal", "https://cdn.cloudflare.steamstatic.com/steam/apps/782330/library_600x900.jpg"],
  ["FINAL FANTASY XV", "https://cdn.cloudflare.steamstatic.com/steam/apps/637650/library_600x900.jpg"],
  ["Apex Legends", "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_600x900.jpg"],
  ["Resident Evil 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/883710/library_600x900.jpg"],
  ["Mega Man X Legacy Collection", "https://cdn.cloudflare.steamstatic.com/steam/apps/743890/library_600x900.jpg"],
  ["Mega Man X Legacy Collection 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/743900/library_600x900.jpg"],
  ["Onigiri", "https://cdn.cloudflare.steamstatic.com/steam/apps/290470/library_600x900.jpg"],
  ["Neverwinter", "https://cdn.cloudflare.steamstatic.com/steam/apps/109600/library_600x900.jpg"],
  ["SMITE", "https://cdn.cloudflare.steamstatic.com/steam/apps/386360/library_600x900.jpg"],
  ["TERA", "https://cdn.cloudflare.steamstatic.com/steam/apps/323370/library_600x900.jpg"],
  ["Batman: Arkham Knight", "https://cdn.cloudflare.steamstatic.com/steam/apps/208650/library_600x900.jpg"],
  ["Batman: Return to Arkham - Arkham City", "https://cdn.cloudflare.steamstatic.com/steam/apps/200260/library_600x900.jpg"],
  ["Batman: Return to Arkham - Arkham Asylum", "https://cdn.cloudflare.steamstatic.com/steam/apps/35140/library_600x900.jpg"],
  ["Dragon's Crown Pro", "assets/covers/ps4/dragons-crown-pro.jpg"],
  ["Monster Hunter World: Iceborne", portraitArtwork("https://gpstatic.com/acache/37/06/4/us/packshot-a7ba6f165f7d613db4b7874a73dca256.jpg")],
  ["Tom Clancy's The Division", "https://cdn.cloudflare.steamstatic.com/steam/apps/365590/library_600x900.jpg"],
  ["Dark Souls III", "https://cdn.cloudflare.steamstatic.com/steam/apps/374320/library_600x900.jpg"],
  ["Agents of Mayhem", "https://cdn.cloudflare.steamstatic.com/steam/apps/304530/library_600x900.jpg"],
  ["Bloodborne", "assets/covers/ps4/bloodborne.jpg"],
  ["Fortnite", "https://m.media-amazon.com/images/M/MV5BNmE4YWE1MjItMzY5Yi00NTY1LTllMjUtZDI1ZDU4Mjg1ZWE5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"],
  ["Dragon's Dogma: Dark Arisen", "https://cdn.cloudflare.steamstatic.com/steam/apps/367500/library_600x900.jpg"],
  ["Ys VIII: Lacrimosa of Dana", "https://cdn.cloudflare.steamstatic.com/steam/apps/579180/library_600x900.jpg"],
  ["Pillars of Eternity: Complete Edition", "https://cdn.cloudflare.steamstatic.com/steam/apps/291650/library_600x900.jpg"],
  ["Battle Chasers: Nightwar", "https://cdn.cloudflare.steamstatic.com/steam/apps/451020/library_600x900.jpg"],
  ["Grand Kingdom", portraitArtwork("https://squarefaction.ru/files/game/10661/cover/grand-kingdom_7bfe9bbb.jpg")],
  ["Nioh: Complete Edition", "https://cdn.cloudflare.steamstatic.com/steam/apps/485510/library_600x900.jpg"],
  ["Star Wars Battlefront II", "https://cdn.cloudflare.steamstatic.com/steam/apps/1237950/library_600x900.jpg"],
  ["Horizon Zero Dawn", "https://cdn.cloudflare.steamstatic.com/steam/apps/1151640/library_600x900.jpg"],
  ["Overwatch", "assets/covers/ps4/overwatch.jpg"],
  ["Knack 2", "https://assetsio.gnwcdn.com/co4le9.jpg?auto=webp&fit=bounds&format=jpg&height=2048&quality=85&width=2048"],
  ["Psychonauts in the Rhombus of Ruin", "assets/covers/ps4/psychonauts-rhombus-of-ruin.jpg"],
  ["LEGO Marvel Super Heroes 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/647830/library_600x900.jpg"],
  ["KINGDOM HEARTS HD 2.8 FINAL CHAPTER PROLOGUE", "https://cdn.cloudflare.steamstatic.com/steam/apps/2552440/library_600x900.jpg"],
  ["KINGDOM HEARTS - HD 1.5+2.5 ReMIX -", "https://cdn.cloudflare.steamstatic.com/steam/apps/2552430/library_600x900.jpg"],
  ["Destiny", "assets/covers/ps4/destiny.jpg"],
  ["Darksiders II Deathinitive Edition", "https://cdn.cloudflare.steamstatic.com/steam/apps/388410/library_600x900.jpg"],
  ["Metro 2033 Redux", "https://cdn.cloudflare.steamstatic.com/steam/apps/286690/library_600x900.jpg"],
  ["Resident Evil Revelations 2", "https://cdn.cloudflare.steamstatic.com/steam/apps/287290/library_600x900.jpg"],
  ["Terraria", "https://cdn.cloudflare.steamstatic.com/steam/apps/105600/library_600x900.jpg"],
  ["Middle-earth: Shadow of Mordor", "https://cdn.cloudflare.steamstatic.com/steam/apps/241930/library_600x900.jpg"],
  ["Lords of the Fallen", "https://cdn.cloudflare.steamstatic.com/steam/apps/265300/library_600x900.jpg"],
  ["The Last of Us Remastered", "assets/covers/ps4/the-last-of-us-remastered.jpg"],
  ["Diablo III: Reaper of Souls - Ultimate Evil Edition", "assets/covers/ps4/diablo-iii-reaper-of-souls.jpg"],
  ["Injustice: Gods Among Us Ultimate Edition", "assets/covers/ps4/injustice-gods-among-us.jpg"],
  ["Tom Clancy's Rainbow Six Siege", "https://cdn.cloudflare.steamstatic.com/steam/apps/359550/library_600x900.jpg"],
  ["Tom Clancy's Ghost Recon Wildlands", "https://cdn.cloudflare.steamstatic.com/steam/apps/460930/library_600x900.jpg"],
  ["For Honor", "https://cdn.cloudflare.steamstatic.com/steam/apps/304390/library_600x900.jpg"],
  ["Blacklight: Retribution", "assets/covers/ps4/blacklight-retribution.jpg"],
  ["Warframe", "https://cdn.cloudflare.steamstatic.com/steam/apps/230410/library_600x900.jpg"],
  ["Paragon", "assets/covers/ps4/paragon.jpg"],
  ["Resident Evil 6", "https://cdn.cloudflare.steamstatic.com/steam/apps/221040/library_600x900.jpg"],
  ["Resident Evil 5", "https://cdn.cloudflare.steamstatic.com/steam/apps/21690/library_600x900.jpg"],
  ["STAR OCEAN: Integrity and Faithlessness", "assets/covers/ps4/star-ocean-integrity-and-faithlessness.jpg"],
  ["ONE PIECE: PIRATE WARRIORS 3", "assets/covers/ps4/one-piece-pirate-warriors-3.jpg"],
  ["Dark Cloud", "assets/covers/ps4/dark-cloud.jpg"],
  ["Dark Cloud 2", portraitArtwork("https://i.3djuegos.com/juegos/12684/dark_cloud_2/fotos/ficha/dark_cloud_2-3274310.webp")],
];

const snesRows = [
  ["Breath of Fire", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Breath%20of%20Fire%20(USA).png"],
  ["Breath of Fire II", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Breath%20of%20Fire%20II%20(USA).png"],
  ["Chrono Trigger", "assets/covers/snes/chrono-trigger.webp"],
  ["Contra III: The Alien Wars", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Contra%20III%20-%20The%20Alien%20Wars%20(USA).png"],
  ["Donkey Kong Country", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Donkey%20Kong%20Country%20(USA).png"],
  ["Donkey Kong Country 2: Diddy's Kong Quest", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Donkey%20Kong%20Country%202%20-%20Diddy's%20Kong%20Quest%20(USA)%20(En%2CFr).png"],
  ["Donkey Kong Country 3: Dixie Kong's Double Trouble!", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Donkey%20Kong%20Country%203%20-%20Dixie%20Kong's%20Double%20Trouble!%20(USA)%20(En%2CFr).png"],
  ["Doom", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Doom%20(USA).png"],
  ["EarthBound", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/EarthBound%20(USA).png"],
  ["Earthworm Jim", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Earthworm%20Jim%20(USA).png"],
  ["Earthworm Jim 2", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Earthworm%20Jim%202%20(USA).png"],
  ["Final Fantasy: Mystic Quest", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Final%20Fantasy%20-%20Mystic%20Quest%20(USA).png"],
  ["Final Fantasy II", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Final%20Fantasy%20II%20(USA).png"],
  ["Final Fantasy III", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Final%20Fantasy%20III%20(USA).png"],
  ["Illusion of Gaia", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Illusion%20of%20Gaia%20(USA).png"],
  ["Judge Dredd", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Judge%20Dredd%20(USA).png"],
  ["Lufia & the Fortress of Doom", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Lufia%20_%20The%20Fortress%20of%20Doom%20(USA).png"],
  ["Lufia II: Rise of the Sinistrals", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Lufia%20II%20-%20Rise%20of%20the%20Sinistrals%20(USA).png"],
  ["Mega Man 7", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Mega%20Man%207%20(USA).png"],
  ["Mega Man Soccer", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Mega%20Man%20Soccer%20(USA).png"],
  ["Mega Man X", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Mega%20Man%20X%20(USA).png"],
  ["Mega Man X2", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Mega%20Man%20X2%20(USA).png"],
  ["Mega Man X3", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Mega%20Man%20X3%20(USA).png"],
  ["Secret of Evermore", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Secret%20of%20Evermore%20(USA).png"],
  ["Secret of Mana", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Secret%20of%20Mana%20(USA).png"],
  ["Soul Blazer", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Soul%20Blazer%20(USA).png"],
  ["Sparkster", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Sparkster%20(USA).png"],
  ["Star Fox", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Star%20Fox%20(USA).png"],
  ["Super Ghouls 'N Ghosts", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Super%20Ghouls%20%27N%20Ghosts%20(USA).png"],
  ["Super Mario All-Stars", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Super%20Mario%20All-Stars%20(USA).png"],
  ["Super Mario Kart", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Super%20Mario%20Kart%20(USA).png"],
  ["Super Mario RPG: Legend of the Seven Stars", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Super%20Mario%20RPG%20-%20Legend%20of%20the%20Seven%20Stars%20(USA).png"],
  ["Super Mario World", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Super%20Mario%20World%20(USA).png"],
  ["Super Mario World 2: Yoshi's Island", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Super%20Mario%20World%202%20-%20Yoshi's%20Island%20(USA).png"],
  ["Super Metroid", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Super%20Metroid%20(Japan%2C%20USA)%20(En%2CJa).png"],
  ["SWAT Kats: The Radical Squadron", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/SWAT%20Kats%20-%20The%20Radical%20Squadron%20(USA).png"],
  ["Tales of Phantasia", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Tales%20of%20Phantasia%20(USA).png"],
  ["Teenage Mutant Ninja Turtles IV: Turtles in Time", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Teenage%20Mutant%20Ninja%20Turtles%20IV%20-%20Turtles%20in%20Time%20(USA).png"],
  ["Terranigma", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Terranigma%20(Europe).png"],
  ["The Legend of Zelda: A Link to the Past", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Legend%20of%20Zelda%2C%20The%20-%20A%20Link%20to%20the%20Past%20(USA).png"],
  ["Tiny Toon Adventures: Buster Busts Loose!", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Tiny%20Toon%20Adventures%20-%20Buster%20Busts%20Loose%21%20(USA).png"],
  ["Tom and Jerry", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Tom%20and%20Jerry%20(USA).png"],
  ["Wolverine: Adamantium Rage", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Wolverine%20-%20Adamantium%20Rage%20(USA).png"],
  ["X-Men: Mutant Apocalypse", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/X-Men%20-%20Mutant%20Apocalypse%20(USA).png"],
  ["Ys III: Wanderers from Ys", "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master/Named_Boxarts/Ys%20III%20-%20Wanderers%20from%20Ys%20(USA).png"],
];

function compareGameRows(left, right) {
  const ryzaOrder = new Map([
    ["Atelier Ryza: Ever Darkness & the Secret Hideout DX", 1],
    ["Atelier Ryza 2: Lost Legends & the Secret Fairy DX", 2],
    ["Atelier Ryza 3: Alchemist of the End & the Secret Key DX", 3],
  ]);
  const witcherOrder = new Map([
    ["The Witcher: Enhanced Edition", 1],
    ["The Witcher 2: Assassins of Kings Enhanced Edition", 2],
    ["The Witcher 3: Wild Hunt - Complete Edition", 3],
  ]);
  const leftRyza = ryzaOrder.get(left[0]);
  const rightRyza = ryzaOrder.get(right[0]);
  const leftWitcher = witcherOrder.get(left[0]);
  const rightWitcher = witcherOrder.get(right[0]);

  if (leftRyza && rightRyza) {
    return leftRyza - rightRyza;
  }

  if (leftWitcher && rightWitcher) {
    return leftWitcher - rightWitcher;
  }

  return left[0].localeCompare(right[0], "en", {
    numeric: true,
    sensitivity: "base",
  });
}

function sortGameRows(rows) {
  return [...rows].sort(compareGameRows);
}

function freezePcGames(rows) {
  return Object.freeze(
    sortGameRows(rows).map(([title, appId, releaseDate, releaseLabel], index) =>
      Object.freeze({
        number: index + 1,
        title,
        appId,
        releaseDate: releaseDate || null,
        releaseLabel: releaseLabel || null,
      }),
    ),
  );
}

function freezeConsoleGames(
  rows,
  sourcePlatformId,
  useOriginalCover = false,
  cleanArtworkId = null,
) {
  const hybridCovers = window.HYBRID_SPRITES || window.HYBRID_COVERS || {};
  const ps5Covers = window.PS5_COVERS || {};
  const approvedCovers = Object.freeze({
    "Chrono Trigger": "assets/covers/snes/chrono-trigger.webp",
  });
  const cleanArtworkOverrides = Object.freeze({
    "Daiva Story 6: Imperial of Nirsartia": "assets/covers/nes/overrides/daiva-story-6.webp",
    "Dig Dug II": "assets/covers/nes/overrides/dig-dug-ii.webp",
    "Downtown Nekketsu March: Super-Awesome Field Day!": "assets/covers/nes/overrides/downtown-nekketsu-march.webp",
    "Mystery Tower": "assets/covers/nes/overrides/mystery-tower.webp",
    "Ninja JaJaMaru-kun": "assets/covers/nes/overrides/ninja-jajamaru-kun.webp",
    "The Mystery of Atlantis": "assets/covers/nes/overrides/the-mystery-of-atlantis.webp",
    "The Tower of Druaga": "assets/covers/nes/overrides/the-tower-of-druaga.webp",
    "TwinBee": "assets/covers/nes/overrides/twinbee.webp",
    "Xevious": "assets/covers/nes/overrides/xevious.webp",
  });
  return Object.freeze(
    sortGameRows(rows).map(([title, image, genre], index) =>
      Object.freeze({
        number: index + 1,
        title,
        image: useOriginalCover
          ? image
          : cleanArtworkId === "nes" && cleanArtworkOverrides[title]
            ? cleanArtworkOverrides[title]
          : cleanArtworkId
            ? `hybrid-sprite:assets/covers/${cleanArtworkId}/atlases/${cleanArtworkId}-clean-${String(Math.floor(index / 20) + 1).padStart(2, "0")}.webp:${index % 20}`
          : sourcePlatformId === "ps4" && title === "Dark Cloud 2"
            ? "assets/covers/ps4/dark-cloud-2-borderless-generated.webp"
          : sourcePlatformId === "ps4"
            ? `hybrid-sprite:assets/covers/ps4/atlases/ps4-clean-${String(Math.floor(index / 20) + 1).padStart(2, "0")}.webp:${index % 20}`
          : approvedCovers[title] ||
            (sourcePlatformId === "ps5" ? ps5Covers[title] : null) ||
            hybridCovers[title] ||
            image,
        genre: genre || null,
        sourcePlatformId: sourcePlatformId || null,
      }),
    ),
  );
}

const nintendoClassics = window.NINTENDO_CLASSICS || {};
const regularSwitchGames = freezeConsoleGames(switchRows, "switch", false, "switch");
const nesClassicsGames = freezeConsoleGames(nintendoClassics.nes || [], "switch", false, "nes");
const snesClassicsGames = freezeConsoleGames(
  nintendoClassics.snes || [],
  "switch",
  false,
  "snes-collection",
);
const gameBoyClassicsGames = freezeConsoleGames(nintendoClassics.gb || [], "switch");
const n64ClassicsGames = freezeConsoleGames(nintendoClassics.n64 || [], "switch");
const gbaClassicsGames = freezeConsoleGames(nintendoClassics.gba || [], "switch");
const genesisClassicsGames = freezeConsoleGames(nintendoClassics.genesis || [], "switch");
const virtualBoyClassicsGames = freezeConsoleGames(nintendoClassics.virtualBoy || [], "switch", true);
const gameCubeClassicsGames = freezeConsoleGames(nintendoClassics.gamecube || [], "switch");
const allSwitchGames = Object.freeze([
  ...regularSwitchGames,
  ...nesClassicsGames,
  ...snesClassicsGames,
  ...gameBoyClassicsGames,
  ...n64ClassicsGames,
  ...gbaClassicsGames,
  ...genesisClassicsGames,
  ...virtualBoyClassicsGames,
  ...gameCubeClassicsGames,
]);
const snesClassicsTitles = new Set(
  (nintendoClassics.snes || []).map(([title]) => title.toLocaleLowerCase("en")),
);
const snesEmulationRows = snesRows.filter(
  ([title]) => !snesClassicsTitles.has(title.toLocaleLowerCase("en")),
);
const ps5Games = freezeConsoleGames(ps5Rows, "ps5");
const ps4Games = freezeConsoleGames(ps4Rows, "ps4");

const platforms = Object.freeze([
  Object.freeze({ id: "pc", label: "PC", games: freezePcGames(pcRows) }),
  Object.freeze({
    id: "switch",
    label: "Nintendo Switch + Nintendo Collection",
    games: allSwitchGames,
    sections: Object.freeze([
      Object.freeze({ id: "switch-games", label: "Nintendo Switch", games: regularSwitchGames }),
      Object.freeze({ id: "nes-classics", label: "NES", games: nesClassicsGames }),
      Object.freeze({ id: "snes-classics", label: "SNES", games: snesClassicsGames }),
      Object.freeze({ id: "game-boy-classics", label: "Game Boy / Game Boy Color", games: gameBoyClassicsGames }),
      Object.freeze({ id: "n64-classics", label: "Nintendo 64", games: n64ClassicsGames }),
      Object.freeze({ id: "gba-classics", label: "Game Boy Advance", games: gbaClassicsGames }),
      Object.freeze({ id: "genesis-classics", label: "Sega Genesis", games: genesisClassicsGames }),
      Object.freeze({ id: "virtual-boy-classics", label: "Virtual Boy", games: virtualBoyClassicsGames }),
      Object.freeze({ id: "gamecube-classics", label: "GameCube", games: gameCubeClassicsGames }),
    ]),
  }),
  Object.freeze({
    id: "ps5",
    label: "PS5 + PS4",
    games: Object.freeze([...ps5Games, ...ps4Games]),
    sections: Object.freeze([
      Object.freeze({ id: "ps5", label: "PS5", games: ps5Games }),
      Object.freeze({ id: "ps4", label: "PS4", games: ps4Games }),
    ]),
  }),
  Object.freeze({
    id: "nes",
    label: "NES Emulation",
    games: Object.freeze([]),
    comingSoon: true,
    comingSoonMessage: "NES emulation games will be added here. No original NES hardware is used.",
  }),
  Object.freeze({ id: "snes", label: "SNES Emulation", games: freezeConsoleGames(snesEmulationRows, "snes") }),
  Object.freeze({
    id: "xbox",
    label: "Xbox",
    games: Object.freeze([]),
    comingSoon: true,
    comingSoonMessage: "Xbox games will be added here.",
  }),
]);

window.GAME_LIBRARY = Object.freeze({
  platforms,
  totalGames: platforms.reduce((total, platform) => total + platform.games.length, 0),
});
