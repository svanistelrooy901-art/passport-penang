"""One-off writer for the 7 Phase 2 George Town stations (content/stations/<id>.json).

Facts come only from the sources listed in each Kisah (checked 28 Oct 2026). Find-game hotspots are
filled in later by tools/render_sprites.mjs from the 3D model (targets carry a `spot` name).
Re-running overwrites these 7 files; it never touches the original 5 stations.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = lambda bm, en: {"bm": bm, "en": en}
L = lambda bm, en: {"bm": bm, "en": en}
WIKI = lambda title, page: [f"Wikipedia: {title}", f"https://en.wikipedia.org/wiki/{page}"]
TOURISM = lambda url: {"url": url, "label": T("Info pelancongan ↗", "Tourism info ↗")}
WORSHIP = T("Ini rumah ibadat yang aktif: berpakaian sopan, bercakap perlahan dan hormati orang yang sedang beribadat.",
            "This is an active place of worship: dress modestly, keep your voice low and respect people at prayer.")


def find(*targets):
    return {"type": "find", "title": T("Cari 3 benda", "Find 3 things"),
            "targets": [{"bm": bm, "en": en, "spot": spot, "pts": []} for spot, bm, en in targets]}


def quiz(title, ask, opts, why):
    return {"type": "quiz", "title": title, "ask": ask,
            "opts": [dict(T(bm, en), **({"ok": 1} if i == 0 else {})) for i, (bm, en) in enumerate(opts)], "why": why}


def multi(title, ask, need, right, wrong, why):
    return {"type": "multi", "need": need, "title": title, "ask": ask,
            "opts": [dict(T(*o), ok=1) for o in right] + [T(*o) for o in wrong], "why": why}


def order(title, items):
    return {"type": "order", "title": title, "items": [T(*i) for i in items]}


def memory(title, pairs):
    return {"type": "memory", "title": title, "pairs": pairs}


S = {}

S["bluemansion"] = dict(
    order=2, coordinates=[100.334947, 5.421408],
    name=T("Rumah Agam Cheong Fatt Tze", "Cheong Fatt Tze Mansion"),
    category=T("Warisan", "Heritage"),
    blurb=T("Rumah Agam Biru di Lebuh Leith, dicat dengan kapur dan pewarna nila.",
            "The Blue Mansion on Leith Street, coloured with lime and indigo dye."),
    official=TOURISM("https://www.malaysia.travel/explore/cheong-fatt-tze"),
    games=[
        find(("windows", "Jendela kayu", "Wooden louvre windows"), ("roof", "Bumbung genting", "Tiled roof"), ("door", "Pintu utama", "Main door")),
        quiz(T("Kuiz warna", "Colour quiz"), T("Kenapa Rumah Agam Cheong Fatt Tze berwarna biru?", "Why is the Cheong Fatt Tze Mansion blue?"),
             [("Kapur dicampur pewarna nila (indigo)", "Lime mixed with indigo dye"), ("Cat dari kilang di Eropah", "Paint from a factory in Europe"),
              ("Batu biru dari laut", "Blue stones from the sea"), ("Dicat semula untuk sebuah filem", "Repainted for a film")],
             T("Betul! Kapur dicampur pewarna nila. Dinding kapur menyerap lembapan dan membantu rumah kekal sejuk.",
               "Right! Lime mixed with indigo dye. The lime walls soak up moisture and help keep the house cool.")),
        order(T("Garis masa", "Timeline"), [("1897 · Mula dibina", "1897 · Building starts"), ("1904 · Rumah agam siap", "1904 · The mansion is finished"),
                                           ("2000 · Anugerah pemuliharaan UNESCO", "2000 · UNESCO conservation award")]),
    ],
    kisah=dict(
        intro=T("Saudagar Cheong Fatt Tze membina rumah agam ini di Lebuh Leith. Ramai memanggilnya Rumah Agam Biru.",
                "The merchant Cheong Fatt Tze built this mansion on Leith Street. Many people call it the Blue Mansion."),
        facts=L(["Pembinaan bermula pada 1897 dan siap pada 1904.",
                 "Ada 38 bilik, 5 halaman berlantai granit dan 220 jendela kayu.",
                 "Warna birunya datang daripada kapur yang dicampur pewarna nila (indigo).",
                 "Selepas dipulihara, ia menerima anugerah pemuliharaan warisan UNESCO pada 2000."],
                ["Building started in 1897 and finished in 1904.",
                 "It has 38 rooms, 5 granite-paved courtyards and 220 wooden louvre windows.",
                 "The blue comes from lime mixed with indigo dye.",
                 "After its restoration it won a UNESCO heritage conservation award in 2000."]),
        look=L(["Dinding biru nila", "Jendela kayu berbilah", "Halaman dalam berlantai granit"],
               ["The indigo-blue walls", "Wooden louvre windows", "Granite-paved inner courtyards"]),
        fun=T("Rumah agam ini muncul dalam filem, termasuk Crazy Rich Asians.", "The mansion has appeared in films, including Crazy Rich Asians."),
        src=[WIKI("Cheong Fatt Tze Mansion", "Cheong_Fatt_Tze_Mansion"), ["Tourism Malaysia: Cheong Fatt Tze", "https://www.malaysia.travel/explore/cheong-fatt-tze"]],
    ),
)

S["esplanade"] = dict(
    order=3, coordinates=[100.34193, 5.4222],
    name=T("Padang Kota Lama & Dewan Bandaraya", "Esplanade & City Hall"),
    category=T("Warisan", "Heritage"),
    blurb=T("Padang hijau di tepi laut, tempat Francis Light mendarat, dengan Dewan Bandaraya di sebelahnya.",
            "The green field by the sea where Francis Light landed, with City Hall beside it."),
    official=None,
    games=[
        find(("cityhall", "Dewan Bandaraya", "City Hall"), ("cenotaph", "Tugu peringatan", "The Cenotaph"), ("palms", "Pokok palma", "Palm trees")),
        quiz(T("Kuiz sejarah", "History quiz"), T("Siapa mendarat di sini pada 17 Julai 1786?", "Who landed here on 17 July 1786?"),
             [("Francis Light", "Francis Light"), ("Stamford Raffles", "Stamford Raffles"), ("James Cook", "James Cook"), ("Vasco da Gama", "Vasco da Gama")],
             T("Ya! Francis Light mendarat di sini, kemudian kawasan ini dibersihkan dan Kota Cornwallis dibina di sebelahnya.",
               "Yes! Francis Light landed here. The area was cleared and Fort Cornwallis was built next to it.")),
        memory(T("Kad kata", "Word cards"), [["Padang", "Field"], ["Dewan", "Hall"], ["Bandar", "City"], ["Pokok", "Tree"]]),
    ],
    kisah=dict(
        intro=T("Padang Kota Lama ialah padang terbuka di tepi laut George Town. Dewan Bandaraya menghadapnya.",
                "The Esplanade is the open field on George Town's waterfront. City Hall faces it."),
        facts=L(["Francis Light pertama kali mendarat di sini pada 17 Julai 1786.",
                 "Dahulu ia padang kawad tentera, kemudian digunakan untuk sukan sejak pertengahan abad ke-19.",
                 "Dewan Bandaraya siap pada 1903 dan antara bangunan pertama di Pulau Pinang yang dilengkapi lampu dan kipas elektrik.",
                 "Ia dinamakan Dewan Bandaraya pada 1957, apabila George Town menjadi bandar raya."],
                ["Francis Light first landed here on 17 July 1786.",
                 "It was a military parade ground, then a sports field from the mid-19th century.",
                 "City Hall was finished in 1903 and was one of Penang's first buildings fitted with electric lights and fans.",
                 "It was named City Hall in 1957, when George Town became a city."]),
        look=L(["Dewan Bandaraya yang putih", "Tugu peringatan (Cenotaph)", "Kota Cornwallis di hujung padang"],
               ["The white City Hall", "The Cenotaph memorial", "Fort Cornwallis at the end of the field"]),
        fun=T("Padang ini ada Speakers' Corner, yang pertama seumpamanya di Malaysia.", "The field has a Speakers' Corner, the first of its kind in Malaysia."),
        src=[WIKI("Esplanade, Penang", "Esplanade,_Penang"), WIKI("City Hall, George Town", "City_Hall,_George_Town")],
    ),
)

S["peranakan"] = dict(
    order=5, coordinates=[100.341192, 5.417999],
    name=T("Rumah Agam Peranakan Pinang", "Pinang Peranakan Mansion"),
    category=T("Muzium", "Museum"),
    blurb=T("Rumah agam hijau di Lebuh Gereja, penuh barang antik Baba Nyonya.",
            "A green mansion on Church Street, full of Baba Nyonya antiques."),
    official=TOURISM("https://www.malaysia.travel/explore/pinang-peranakan-mansion"),
    games=[
        find(("door", "Pintu besar", "Grand doorway"), ("balcony", "Balkoni", "Balcony"), ("lanterns", "Tanglung", "Lanterns")),
        quiz(T("Kuiz pemilik", "Owner quiz"), T("Siapa yang membina rumah agam ini?", "Who built this mansion?"),
             [("Chung Keng Quee", "Chung Keng Quee"), ("Cheong Fatt Tze", "Cheong Fatt Tze"), ("Francis Light", "Francis Light"), ("Sun Yat-sen", "Sun Yat-sen")],
             T("Betul! Chung Keng Quee, Kapitan Cina Perak, menjadikannya rumah dan pejabatnya.",
               "Right! Chung Keng Quee, Kapitan Cina of Perak, made it his home and office.")),
        order(T("Garis masa", "Timeline"), [("1893 · Tanah dibeli", "1893 · The land is bought"), ("1990-an · Menjadi muzium", "1990s · It becomes a museum"),
                                           ("2008 · Sebahagian Tapak Warisan Dunia UNESCO", "2008 · Part of the UNESCO World Heritage Site")]),
    ],
    kisah=dict(
        intro=T("Rumah agam ini dibina untuk Chung Keng Quee, salah seorang yang terkaya di Pulau Pinang pada akhir 1800-an.",
                "This mansion was built for Chung Keng Quee, one of Penang's richest men in the late 1800s."),
        facts=L(["Chung Keng Quee membeli tanah ini pada 1893 dan menjadikan rumah agam ini rumah serta pejabatnya.",
                 "Dahulu ia dikenali sebagai Hai Kee Chan.",
                 "Ia dibuka sebagai muzium pada 1990-an dengan lebih 1,000 barang antik Peranakan.",
                 "Asalnya ia dicat putih. Kini ia berwarna hijau."],
                ["Chung Keng Quee bought the land in 1893 and made the mansion his home and office.",
                 "It was once known as Hai Kee Chan.",
                 "It opened as a museum in the 1990s with over 1,000 Peranakan antiques.",
                 "It was first painted white. Today it is green."]),
        look=L(["Dinding luar berwarna hijau", "Barang antik Peranakan", "Tokong kecil di sebelah dengan patung Chung Keng Quee"],
               ["The green outer walls", "Peranakan antiques", "The small temple next door with a statue of Chung Keng Quee"]),
        fun=T("Rumah agam ini muncul dalam drama The Little Nyonya.", "The mansion appeared in the drama The Little Nyonya."),
        src=[WIKI("Pinang Peranakan Mansion", "Pinang_Peranakan_Mansion"), ["Tourism Malaysia: Pinang Peranakan Mansion", "https://www.malaysia.travel/explore/pinang-peranakan-mansion"]],
    ),
)

S["kuanyin"] = dict(
    order=6, coordinates=[100.33879194, 5.41844389],
    name=T("Tokong Dewi Kuan Yin", "Goddess of Mercy Temple"),
    category=T("Rumah ibadat", "Place of worship"),
    blurb=WORSHIP,
    official=None,
    games=[
        find(("dragons", "Naga di bumbung", "Dragons on the roof"), ("pillars", "Tiang merah", "Red pillars"), ("urn", "Tempat colok", "Incense burner")),
        quiz(T("Kuiz tahun", "Year quiz"), T("Tokong ini dibina pada tahun…", "This temple was built in…"),
             [("1800", "1800"), ("1903", "1903"), ("1957", "1957"), ("2008", "2008")],
             T("Ya! Ia dibina pada 1800 dan disebut tokong Cina tertua di negeri ini.", "Yes! It was built in 1800 and is called the oldest Chinese temple in the state.")),
        order(T("Garis masa", "Timeline"), [("1800 · Tokong dibina", "1800 · The temple is built"), ("1824 · Kuan Yin menjadi dewi utama", "1824 · Guan Yin becomes the main deity"),
                                           ("2008 · Sebahagian Tapak Warisan Dunia UNESCO", "2008 · Part of the UNESCO World Heritage Site")]),
    ],
    kisah=dict(
        intro=T("Tokong Kuan Yin (Kong Hock Keong) di Jalan Masjid Kapitan Keling ialah tokong Cina tertua di negeri ini.",
                "The Goddess of Mercy Temple (Kong Hock Keong) on Pitt Street is the oldest Chinese temple in the state."),
        facts=L(["Ia dibina pada 1800 dengan kos 4,000 dolar Sepanyol.",
                 "Asalnya ia untuk dewi laut Mazu. Selepas diubah suai pada 1824, Kuan Yin menjadi dewi utama.",
                 "Dahulu ia menjadi tempat menyelesaikan pertikaian antara masyarakat Hokkien dan Kantonis.",
                 "Ia terselamat semasa Pulau Pinang dibom pada Disember 1941."],
                ["It was built in 1800 at a cost of 4,000 Spanish dollars.",
                 "It was first dedicated to the sea goddess Mazu. After a renovation in 1824, Guan Yin became the main deity.",
                 "It once settled disputes between the Hokkien and Cantonese communities.",
                 "It survived the bombing of Penang in December 1941."]),
        look=L(["Patung naga di sepanjang bumbung", "Tiang yang dililit naga", "Pintu besar yang dilukis dengan dewa-dewi"],
               ["Dragon figures along the roof", "Pillars wrapped with dragons", "Huge doors painted with deities"]),
        fun=T("Tokong ini dibina mengikut feng shui dan mempunyai tiga perigi.", "The temple was built by feng shui principles and has three wells."),
        src=[WIKI("Goddess of Mercy Temple", "Goddess_of_Mercy_Temple")],
    ),
)

S["mariamman"] = dict(
    order=7, coordinates=[100.33826, 5.41725],
    name=T("Kuil Sri Mahamariamman", "Sri Mahamariamman Temple"),
    category=T("Rumah ibadat", "Place of worship"),
    blurb=WORSHIP,
    official={"url": "https://hebpenang.gov.my/queen-street-sri-maha-mariamman/", "label": T("Lembaga Wakaf Hindu ↗", "Hindu Endowments Board ↗")},
    games=[
        find(("gopuram", "Menara gopuram", "Gopuram tower"), ("swans", "Angsa", "Swans"), ("door", "Pintu masuk", "Entrance")),
        quiz(T("Kuiz menara", "Tower quiz"), T("Menara berwarna-warni di pintu masuk kuil Hindu dipanggil…", "The colourful tower over a Hindu temple entrance is called a…"),
             [("Gopuram", "Gopuram"), ("Pagoda", "Pagoda"), ("Kubah", "Dome"), ("Menara jam", "Clock tower")],
             T("Betul! Gopuram kuil ini ada 38 patung dewa-dewi dan 4 ekor angsa.", "Right! This temple's gopuram has 38 statues of gods and goddesses and 4 swans.")),
        multi(T("Kuiz perayaan", "Festival quiz"), T("Pilih 2 perayaan yang disambut di kuil ini.", "Pick 2 festivals celebrated at this temple."), 2,
              [("Thaipusam", "Thaipusam"), ("Deepavali", "Deepavali")], [("Chap Goh Meh", "Chap Goh Meh"), ("Bon Odori", "Bon Odori")],
              T("Ya! Thaipusam dan Deepavali, juga Navarathiri. Chap Goh Meh dan Bon Odori pula disambut di Padang Kota Lama.",
                "Yes! Thaipusam and Deepavali, and Navarathiri too. Chap Goh Meh and Bon Odori are celebrated at the Esplanade.")),
    ],
    kisah=dict(
        intro=T("Kuil Sri Mahamariamman di Lebuh Queen, di tengah Little India, diasaskan sebagai kuil pada 1833.",
                "The Sri Mahamariamman Temple on Queen Street, in the heart of Little India, was founded as a temple in 1833."),
        facts=L(["Tanah ini sudah digunakan sebagai tempat pemujaan sejak 1801.",
                 "Gopuramnya setinggi 23.5 kaki, dengan 38 patung dewa-dewi dan 4 ekor angsa.",
                 "Kereta kuda emasnya digunakan pertama kali pada Februari 2017, sebelum Thaipusam. Beratnya 1.6 tan.",
                 "Perayaan di sini termasuk Thaipusam, Deepavali dan Navarathiri."],
                ["The site has been used for worship since 1801.",
                 "Its gopuram is 23.5 feet tall, with 38 statues of gods and goddesses and 4 swans.",
                 "Its golden chariot first came out in February 2017, on the eve of Thaipusam. It weighs 1.6 tonnes.",
                 "Festivals here include Thaipusam, Deepavali and Navarathiri."]),
        look=L(["Gopuram berwarna-warni", "Patung angsa di gopuram", "Pintu belakang di Jalan Masjid Kapitan Keling"],
               ["The colourful gopuram", "The swan figures on the gopuram", "The back entrance on Pitt Street"]),
        fun=T("Kuil ini menyambut ulang tahun ke-175 pada 2008.", "The temple celebrated its 175th anniversary in 2008."),
        src=[WIKI("Sri Mahamariamman Temple, Penang", "Sri_Mahamariamman_Temple,_Penang"), ["Hindu Endowments Board Penang", "https://hebpenang.gov.my/queen-street-sri-maha-mariamman/"]],
    ),
)

S["kapitan"] = dict(
    order=8, coordinates=[100.337389, 5.416667],
    name=T("Masjid Kapitan Keling", "Kapitan Keling Mosque"),
    category=T("Rumah ibadat", "Place of worship"),
    blurb=WORSHIP,
    official=None,
    games=[
        find(("domes", "Kubah", "Domes"), ("arches", "Gerbang", "Arches"), ("minaret", "Menara", "Minaret")),
        quiz(T("Kuiz nama", "Name quiz"), T("Perkataan 'Kapitan' dalam nama masjid ini bermaksud…", "In this mosque's name, 'Kapitan' means…"),
             [("Ketua masyarakat", "Community leader"), ("Kapten kapal", "Ship's captain"), ("Nama sungai", "A river's name"), ("Nama raja", "A king's name")],
             T("Betul! Pada 1801, Cauder Mohudeen dilantik sebagai Kapitan, ketua masyarakat India Muslim, dan diberi tanah untuk masjid ini.",
               "Right! In 1801 Cauder Mohudeen was made Kapitan, leader of the Indian Muslim community, and given land for this mosque.")),
        order(T("Garis masa", "Timeline"), [("1801 · Tanah diberi untuk masjid", "1801 · Land is granted for the mosque"),
                                           ("1930 · Diperbesar, dewan solat jadi dua kali lebih tinggi", "1930 · Enlarged, the prayer hall made twice as tall"),
                                           ("Hari ini · Masih digunakan untuk solat", "Today · Still used for prayers")]),
    ],
    kisah=dict(
        intro=T("Masjid Kapitan Keling dibina oleh pedagang India Muslim, di simpang Lebuh Buckingham dan Jalan Masjid Kapitan Keling.",
                "Kapitan Keling Mosque was built by Indian Muslim traders, on the corner of Buckingham Street and Pitt Street."),
        facts=L(["Pada 1801, Sir George Leith melantik Cauder Mohudeen sebagai Kapitan dan memberi tanah untuk masjid.",
                 "Ia antara institusi Muslim kekal yang pertama di kawasan ini.",
                 "Pada 1930 ia diperbesar: dewan solatnya dijadikan dua kali lebih tinggi, dengan lebih banyak cahaya dan udara.",
                 "Hiasannya ialah corak geometri, bukan gambar manusia atau haiwan."],
                ["In 1801 Sir George Leith made Cauder Mohudeen the Kapitan and granted land for the mosque.",
                 "It was one of the first permanent Muslim institutions in the area.",
                 "In 1930 it was enlarged: the prayer hall was made twice as tall, with more light and air.",
                 "Its decoration uses geometric patterns, not pictures of people or animals."]),
        look=L(["Dinding berwarna kuning oker", "Gerbang ladam kuda di dalam dewan", "Lantai marmar putih"],
               ["The ochre-yellow walls", "Horseshoe arches inside the hall", "White marble floors"]),
        fun=T("Senibinanya menggabungkan gaya Mughal dan Moor.", "Its architecture mixes Mughal and Moorish styles."),
        src=[WIKI("Kapitan Keling Mosque", "Kapitan_Keling_Mosque")],
    ),
)

S["armenian"] = dict(
    order=9, coordinates=[100.338111, 5.414744],
    name=T("Lebuh Armenian", "Armenian Street"),
    category=T("Seni jalanan", "Street art"),
    blurb=T("Jalan rumah kedai lama dengan mural, kedai antik dan muzium kecil.", "A street of old shophouses with murals, antique shops and small museums."),
    official=None,
    games=[
        find(("bicycle", "Basikal", "Bicycle"), ("trishaw", "Beca", "Trishaw"), ("mural", "Mural", "Mural")),
        quiz(T("Kuiz nama", "Name quiz"), T("Lebuh ini dinamakan sempena pedagang dari…", "This street is named after traders from…"),
             [("Armenia", "Armenia"), ("Arab", "Arabia"), ("Itali", "Italy"), ("Jepun", "Japan")],
             T("Ya! Dahulu ia dipanggil Malay Lane. Menjelang 1808 ia dinamakan Armenian Street kerana pedagang Armenia tinggal di sini.",
               "Yes! It was once called Malay Lane. By 1808 it was renamed Armenian Street because Armenian traders lived here.")),
        memory(T("Kad kata", "Word cards"), [["Basikal", "Bicycle"], ["Lukisan", "Painting"], ["Jalan", "Street"], ["Kedai", "Shop"]]),
    ],
    kisah=dict(
        intro=T("Lebuh Armenian ialah antara jalan seni jalanan paling terkenal di George Town.",
                "Armenian Street is one of George Town's best-known street-art streets."),
        facts=L(["Jalan ini asalnya dipanggil Malay Lane, kemudian dinamakan Armenian Street menjelang 1808.",
                 "Pada 2012, artis Ernest Zacharevic melukis enam mural untuk George Town Festival, termasuk Children on a Bicycle.",
                 "Pada 1910, Sun Yat-sen mengetuai persidangan di sebuah rumah kedai di jalan ini. Kini ia Muzium Sun Yat-sen.",
                 "Muzium Islam Pulau Pinang terletak di hujung barat jalan ini."],
                ["It was first called Malay Lane, then renamed Armenian Street by 1808.",
                 "In 2012 the artist Ernest Zacharevic painted six murals for the George Town Festival, including Children on a Bicycle.",
                 "In 1910 Sun Yat-sen chaired a conference in a townhouse on this street. It is now the Sun Yat-sen Museum.",
                 "The Penang Islamic Museum stands at the street's western end."]),
        look=L(["Mural Children on a Bicycle", "Rumah kedai dengan kedai antik", "Muzium Sun Yat-sen"],
               ["The Children on a Bicycle mural", "Shophouses with antique shops", "The Sun Yat-sen Museum"]),
        fun=T("Zacharevic menggunakan orang tempatan sebagai model untuk mural-muralnya.", "Zacharevic used local people as models for his murals."),
        src=[WIKI("Armenian Street, George Town", "Armenian_Street,_George_Town"), WIKI("Ernest Zacharevic", "Ernest_Zacharevic")],
    ),
)

for sid, d in S.items():
    out = {"id": sid, "zone": "george-town", **{k: d[k] for k in ("order", "coordinates", "name", "category", "blurb", "official")},
           "partner": None, "games": d["games"], "kisah": d["kisah"], "factsChecked": "2026-10-28", "review": {"owner": "pending"}}
    path = os.path.join(ROOT, "content", "stations", f"{sid}.json")
    old = json.load(open(path)) if os.path.exists(path) else None
    if old:  # keep hotspots already rendered
        for g_old, g_new in zip(old["games"], out["games"]):
            if g_new["type"] == "find" and g_old["type"] == "find":
                for t_old, t_new in zip(g_old["targets"], g_new["targets"]):
                    if t_old.get("spot") == t_new["spot"]: t_new["pts"] = t_old["pts"]
    json.dump(out, open(path, "w"), ensure_ascii=False, indent=1)
print("wrote", list(S))
