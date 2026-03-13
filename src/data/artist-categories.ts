export interface Artist {
  name: string;
  imageUrl?: string;
}

export interface ArtistCategory {
  id: string;
  title: string;
  description: string;
  gradient: string;
  artists: Artist[];
}

export const ARTIST_CATEGORIES: ArtistCategory[] = [
  {
    id: 'popular',
    title: 'ศิลปินยอดฮิต',
    description: 'รวมศิลปินที่กำลังมาแรงและเป็นตำนาน',
    gradient: 'from-orange-500 to-red-600',
    artists: [
      { name: 'เคลียร์ (KLEAR)' }, { name: 'ค็อกเทล (Cocktail)' }, { name: 'บิ๊กแอส (Big Ass)' }, { name: 'หนุ่ม กะลา (NUM KALA)' }, 
      { name: 'ซิลลี่ ฟูลส์ (Silly Fools)' }, { name: 'ต่าย อรทัย' }, { name: 'บอดี้สแลม (Bodyslam)' }, { name: 'โปเตโต้ (Potato)' }, 
      { name: 'ดา เอ็นโดรฟิน' }, { name: 'ปาล์มมี่ (Palmy)' }, { name: 'เบิร์ด ธงไชย' }, { name: 'แคลช (Clash)' }
    ]
  },
  {
    id: 'luk-thung',
    title: 'ลูกทุ่งยอดฮิต',
    description: 'รวมที่สุดของขวัญใจมหาชน',
    gradient: 'from-orange-500 to-amber-600',
    artists: [
      { name: 'มนต์แคน แก่นคูน' }, { name: 'ต่าย อรทัย' }, { name: 'ไผ่ พงศธร' }, { name: 'ลำเพลิน วงศกร' },
      { name: 'เบิ้ล ปทุมราช' }, { name: 'ก้อง ห้วยไร่' }, { name: 'หญิงลี ศรีจุมพล' }, { name: 'ตั๊กแตน ชลดา' },
      { name: 'ก๊อท จักรพันธ์' }, { name: 'ไมค์ ภิรมย์พร' }, { name: 'สุนารี ราชสีมา' }, { name: 'พุ่มพวง ดวงจันทร์' },
      { name: 'ยอดรัก สลักใจ' }, { name: 'สายัณห์ สัญญา' }, { name: 'ศิริพร อำไพพงษ์' }, { name: 'จินตหรา พูนลาภ' },
      { name: 'มนต์สิทธิ์ คำสร้อย' }, { name: 'ฝน ธนสุนทร' }, { name: 'รุ่ง สุริยา' }, { name: 'ยิ่งยง ยอดบัวงาม' },
      { name: 'อาภาพร นครสวรรค์' }, { name: 'พี สะเดิด' }, { name: 'ตรี ชัยณรงค์' }, { name: 'เวียง นฤมล' },
      { name: 'เปาวลี พรพิมล' }, { name: 'ข้าวทิพย์ ธิดาดิน' }, { name: 'ศรเพชร ศรสุพรรณ' }, { name: 'สดใส รุ่งโพธิ์ทอง' },
      { name: 'เสรี รุ่งสว่าง' }, { name: 'ไวพจน์ เพชรสุพรรณ' }, { name: 'จอมขวัญ กัลยา' }, { name: 'เอ ไมค์ทองคำ' },
      { name: 'เบียร์ พร้อมพงษ์' }, { name: 'รัชนก ศรีโลพันธุ์' }, { name: 'แช่ม แช่มรัมย์' }, { name: 'เต้ย อภิวัฒน์' },
      { name: 'เจนนี่ ได้หมดถ้าสดชื่น' }, { name: 'ลิลลี่ ได้หมดถ้าสดชื่น' }, { name: 'อาม ชุติมา' }, { name: 'เนสกาแฟ ศรีนคร' },
      { name: 'ลำไย ไหทองคำ' }, { name: 'ครูสลา คุณวุฒิ' }, { name: 'ชาย เมืองสิงห์' }, { name: 'ผ่องศรี วรนุช' },
      { name: 'ทศพล หิมพานต์' }, { name: 'ศรราม น้ำเพชร' }, { name: 'เปิ้ล ปทุมราช' }, { name: 'บัว กมลทิพย์' },
      { name: 'สันติ ดวงสว่าง' }, { name: 'เอกชัย ศรีวิชัย' }, { name: 'พงษ์สิทธิ์ คำภีร์' }, { name: 'หลิว อาจารียา' },
      { name: 'หญิง ธิติกานต์' }, { name: 'วิรดา วงศ์เทวัญ' }, { name: 'กุ้ง สุธิราช' }, { name: 'แคท รัตกาล' },
      { name: 'แจ๊ค ธนพล' }, { name: 'รุ่งระวี นิวส์มิวสิค' }, { name: 'นุช วิลาวัลย์' }, { name: 'นุ้ย สุวีณา' },
      { name: 'ใบเตย อาร์สยาม' }, { name: 'กระแต อาร์สยาม' }, { name: 'บิว กัลยาณี' }, { name: 'แมงปอ ชลธิชา' },
      { name: 'เอิร์น สุรัตน์ติกานต์' }, { name: 'ดอกอ้อ ทุ่งทอง' }, { name: 'ศร สินชัย' }, { name: 'ก้านตอง ทุ่งเงิน' },
    ]
  },
  {
    id: 'mor-lam',
    title: 'หมอลำ / อีสานลำเพลิน',
    description: 'จังหวะสนุกฉบับคนอีสาน',
    gradient: 'from-yellow-400 to-orange-500',
    artists: [
      { name: 'พรศักดิ์ ส่องแสง' }, { name: 'ศิริพร อำไพพงษ์' }, { name: 'จินตหรา พูนลาภ' }, { name: 'เฉลิมพล มาลาคำ' },
      { name: 'ไหมไทย หัวใจศิลป์' }, { name: 'มนต์แคน แก่นคูน' }, { name: 'ลำเพลิน วงศกร' }, { name: 'เบล ขนิษฐา' },
      { name: 'เต้ย อภิวัฒน์' }, { name: 'กระต่าย พรรณนิภา' }, { name: 'บัวผัน ทังโส' }, { name: 'ศรีจันทร์ วีสี' },
      { name: 'เอกพล มนต์ตระการ' }, { name: 'ดอกอ้อ ทุ่งทอง' }, { name: 'ก้านตอง ทุ่งเงิน' }, { name: 'ลาล่า ลูลู่' },
      { name: 'สมจิตร บ่อทอง' }, { name: 'เดือนเพ็ญ อำนวยพร' }, { name: 'สาธิต ทองจันทร์' }, { name: 'วีระพงษ์ วงศ์ศิลป์' },
      { name: 'บอย ศิริชัย' }, { name: 'แอน อรดี' }, { name: 'บิว จิตรฉรีญา' }, { name: 'นกน้อย อุไรพร' },
      { name: 'เสียงอิสาน' }, { name: 'ระเบียบวาทะศิลป์' }, { name: 'ประถมบันเทิงศิลป์' }, { name: 'ศิลปินภูไท' },
      { name: 'รัตนศิลป์' }, { name: 'คำผุนร่วมมิตร' }, { name: 'สาวน้อยเพชรบ้านแพง' }, { name: 'อุ๋งอิ๋ง เพชรบ้านแพง' },
      { name: 'ยูกิ เพ็ญผกา' }, { name: 'เพชร สหรัตน์' }, { name: 'บิ๊ก ธิติวุฒิ' }, { name: 'โจอี้ วีระพล' },
      { name: 'สมหมายน้อย ดวงเจริญ' }, { name: 'นพดล ดวงพร' }, { name: 'บานเย็น รากแก่น' }, { name: 'แม่นกน้อย อุไรพร' },
      { name: 'เต๋า ภูศิลป์' }, { name: 'กู่แคน School' }, { name: 'อภิรดี ไอดิน' }, { name: 'สายัณห์ วันรุ่ง' },
      { name: 'ดาว บ้านดอน' }, { name: 'ดอกรัก ดวงมาลา' }, { name: 'บัวตูม บัวบาน' }, { name: 'เอม อภัสรา' },
    ]
  },
  {
    id: 'thai-pop',
    title: 'สตริง / T-POP',
    description: 'เพลงฮิตร่วมสมัยมาแรง',
    gradient: 'from-purple-500 to-pink-500',
    artists: [
      { name: 'ทรี แมน ดาวน์ (Three Man Down)' }, { name: 'ทิลลี่ เบิร์ดส (Tilly Birds)' }, { name: 'โบกี้ไลอ้อน (Bowkylion)' },
      { name: 'อิ้งค์ วรันธร (Ink Waruntorn)' }, { name: 'เปเปอร์ เพลนส์ (Paper Planes)' }, { name: 'เจฟ ซาเตอร์ (Jeff Satur)' },
      { name: 'มิลลิ (Milli)' }, { name: 'นนท์ ธนนท์ (Nont Tanont)' }, { name: 'เดอะ ทอยส์ (The Toys)' },
      { name: 'บิวกิ้น (Billkin)' }, { name: 'พีพี กฤษฏ์ (PP Krit)' }, { name: '4EVE' }, { name: 'PROXIE' },
      { name: 'ATLAS' }, { name: 'PiXXiE' }, { name: 'อะตอม ชนกันต์ (Atom)' }, { name: 'วี วิโอเลต (Violette Wautier)' },
      { name: 'ปาล์มมี่ (Palmy)' }, { name: 'แก้ม วิชญาณี (Gam)' }, { name: 'ส้ม มารี (Zom Marie)' },
      { name: 'บีเอ็นเคโฟร์ตีเอต (BNK48)' }, { name: 'ALLY' }, { name: 'Pretzelle' }, { name: 'Perses' },
      { name: 'LYKN' }, { name: 'BUS (Because of you I shine)' }, { name: 'NuNew' }, { name: 'Tattoo Colour' },
      { name: 'Polycat' }, { name: 'Scrubb' }, { name: 'Whal & Dolph' }, { name: 'Safeplanet' },
      { name: 'Anatomy Rabbit' }, { name: 'Dept' }, { name: 'Mirrr' }, { name: 'Moving and Cut' },
      { name: 'Lipta' }, { name: 'The Parkinson' }, { name: 'MEYOU' }, { name: 'Lazyloxy' },
      { name: 'P-Hot' }, { name: 'F.Hero' }, { name: 'UrboyTJ' }, { name: 'Twopee Southside' },
      { name: 'Sarah Salola' }, { name: 'YourMOOD' }, { name: 'Zom Marie' }, { name: 'Oat Pramote' },
      { name: 'Pop Pongkool' }, { name: 'Singto Numchok' }, { name: 'Klear' }, { name: 'Lipta' },
      { name: 'No One Else' }, { name: 'Season Five' }, { name: 'Room39' }, { name: 'Mean' },
      { name: 'Lola' }, { name: 'Violeete Wautier' }, { name: 'Fellow Fellow' }, { name: 'Txrbo' },
      { name: 'Saran' }, { name: 'SPRITE' }, { name: '1MILL' }, { name: 'Youngohm' },
    ]
  },
  {
    id: 'rock-thai',
    title: 'ร็อกไทย',
    description: 'รวมเพลงร็อกระดับตำนานและรุ่นใหม่',
    gradient: 'from-red-600 to-black',
    artists: [
      { name: 'บอดี้สแลม (Bodyslam)' }, { name: 'บิ๊กแอส (Big Ass)' }, { name: 'โปเตโต้ (Potato)' },
      { name: 'โลโซ (Loso)' }, { name: 'ซิลลี่ ฟูลส์ (Silly Fools)' }, { name: 'ค็อกเทล (Cocktail)' },
      { name: 'เคลียร์ (Klear)' }, { name: 'ลาบานูน (Labanoon)' }, { name: 'สล็อต แมชชีน (Slot Machine)' },
      { name: 'พาราด็อกซ์ (Paradox)' }, { name: 'โมเดิร์นด็อก (Modern Dog)' }, { name: 'เรโทรสเปกต์ (Retrospect)' },
      { name: 'สวีต มัลเล็ต (Sweet Mullet)' }, { name: 'อินสติงต์ (Instinct)' }, { name: 'ดา เอ็นโดรฟิน (Da Endorphine)' },
      { name: 'เอบีนอร์มอล (AB Normal)' }, { name: 'แคลช (Clash)' }, { name: 'ซีล (Zeal)' },
      { name: 'พั้นซ์ วรกาญจน์ (Punch)' }, { name: 'Blackhead' }, { name: 'Smile Buffalo' }, { name: 'Y Not 7' },
      { name: 'Fly' }, { name: 'Taxi' }, { name: 'Kala' }, { name: 'Hangman' }, { name: 'The Mousses' },
      { name: 'The Yers' }, { name: 'Lomosonic' }, { name: 'Ebola' }, { name: 'Paper Planes' },
      { name: 'Bomb at Track' }, { name: 'TaitosmitH' }, { name: 'Slot Machine' }, { name: 'Sweet Mullet' },
      { name: '25hours' }, { name: 'Musketeers' }, { name: 'Mild' }, { name: 'Getsunova' }, { name: 'Jetset\'er' },
      { name: 'Clash' }, { name: 'I-Zax' }, { name: 'So Cool' }, { name: 'Pancake' },
      { name: 'Nuvo' }, { name: 'Micro' }, { name: 'Instinct' }, { name: 'Zeal' }, 
      { name: 'Retrospect' }, { name: 'SDF' }, { name: 'No More Tear' },
    ]
  },
  {
    id: 'retro-hits',
    title: 'ตำนาน / ยุค 90',
    description: 'เพลงฮิตตลอดกาลที่ทุกคนคิดถึง',
    gradient: 'from-blue-500 to-indigo-600',
    artists: [
      { name: 'เบิร์ด ธงไชย' }, { name: 'เจ เจตริน' }, { name: 'คริสติน่า อากีล่าร์' }, { name: 'ใหม่ เจริญปุระ' },
      { name: 'มอส ปฏิภาณ' }, { name: 'ทาทา ยัง' }, { name: 'นิโคล เทริโอ' }, { name: 'ลิฟท์-ออย' },
      { name: 'แร็พเตอร์ (Raptor)' }, { name: 'เจมส์ เรืองศักดิ์' }, { name: 'ปาน ธนพร' }, { name: 'ดัง พันกร' },
      { name: 'ปุ๊ อัญชลี' }, { name: 'ติ๊ก ชิโร่' }, { name: 'ไฮร็อก (Hi-Rock)' }, { name: 'อัสนี วสันต์' },
      { name: 'ไมไมโคร (Micro)' }, { name: 'บิลลี่ โอแกน' }, { name: 'หนุ่ย อำพล' }, { name: 'มาช่า วัฒนพานิช' },
      { name: 'แอม เสาวลักษณ์' }, { name: 'ศรัณย่า ส่งเสริมสวัสดิ์' }, { name: 'มาลีวัลย์ เจมีน่า' },
      { name: 'ตอง ภัครมัย' }, { name: 'แคทรียา อิงลิช' }, { name: 'บัวชมพู ฟอร์ด' }, { name: 'แนนซี่' },
      { name: 'นัท มีเรีย' }, { name: 'ทู (Two)' }, { name: 'The Next' }, { name: 'UHT' }, { name: 'Boyscout' },
      { name: 'Dr. Kids' }, { name: 'Bubble Girls' }, { name: 'Zaza' }, { name: 'X3 Super Gang' },
      { name: 'Mr.Team' }, { name: 'Double U' }, { name: 'Seven' }, { name: 'Girl Force' },
      { name: 'D2B' }, { name: 'B2G' }, { name: 'Girly Berry' }, { name: 'Za Za' },
      { name: 'ทัช ณ ตะกั่วทุ่ง' }, { name: 'โดม ปกรณ์ ลัม' },
      { name: 'อาร์เอส อันปลั๊ก' }, { name: 'คีรีบูน' }, { name: 'อินคา' }, { name: 'นรีกระจ่าง' },
      { name: 'ปั่น ไพบูลย์เกียรติ' }, { name: 'สุรสีห์ อิทธิกุล' }, { name: 'แหวน ฐิติมา' }, { name: 'พงษ์พัฒน์ วชิรบรรจง' },
      { name: 'เสือ ธนพล' }, { name: 'อริสมันต์ พงษ์เรืองรอง' }, { name: 'ฟรุตตี้' }, { name: 'แกรนด์เอ็กซ์' },
    ]
  },
  {
    id: 'teen-pop',
    title: 'วัยรุ่นยุค 2000 / Kamikaze',
    description: 'ตำนานเพลงรักวัยใสที่ทุกคนร้องตามได้',
    gradient: 'from-pink-400 to-rose-500',
    artists: [
      { name: 'โฟร์-มด (Four-Mod)' }, { name: 'เฟย์ ฟาง แก้ว (FFK)' }, { name: 'ขนมจีน (Knomjean)' },
      { name: 'หวาย (Waii)' }, { name: 'กอล์ฟ-ไมค์ (Golf-Mike)' }, { name: 'เค-โอติก (K-OTIC)' },
      { name: 'เนโกะ จัมพ์ (Neko Jump)' }, { name: 'ทรี.ทู.วัน (3.2.1)' }, { name: 'ไบรโอนี่ (Briohny)' },
      { name: 'ไอซ์ ศรัณยู' }, { name: 'บี-โอ-วาย (B.O.Y)' }, { name: 'ชิน ชินวุฒ' }, { name: 'บี้ สุกฤษฎิ์ (Bie the Star)' },
      { name: 'แก้ม วิชญาณี' }, { name: 'รุจ ศุภรุจ' }, { name: 'กัน นภัทร' }, { name: 'โตโน่ ภาคิน' },
      { name: 'สิงโต นำโชค' }, { name: 'Kiss Me Five' }, { name: 'XIS' }, { name: 'Candy Mafia' },
      { name: 'G-Twenty' }, { name: 'Olives' }, { name: 'Sugar Eyes' }, { name: 'SWEEP' }, { name: 'Fact U' }, 
      { name: 'Kat-Pat' }, { name: 'Split' }, { name: 'Mila' }, { name: 'Pimmy' }, { name: 'Chilli White Choc' }, { name: 'Siska' },
      { name: 'Seven Days' }, { name: 'Timethai' }, { name: 'Min' }, { name: 'Jinny' },
      { name: 'Bie The Ska' }, { name: 'Vamp' }, { name: 'Evo Nine' }, 
    ]
  },
  {
    id: 'rnb-soul-th',
    title: 'R&B / Soul / ดีว่า',
    description: 'พลังเสียงและจังหวะสุดละมุน',
    gradient: 'from-rose-500 to-indigo-800',
    artists: [
      { name: 'เป๊ก ผลิตโชค (Peck Palitchoke)' }, { name: 'อ๊อฟ ปองศักดิ์ (Aof Pongsak)' }, { name: 'เบน ชลาทิศ (Ben Chalatit)' },
      { name: 'แก้ม วิชญาณี (Gam)' }, { name: 'จิ๋ว ปิยนุช' }, { name: 'นิว นภัสสร' }, { name: 'ดา เอ็นโดรฟิน' },
      { name: 'ลุลา (Lula)' }, { name: 'ตู่ ภพธร' }, { name: 'แสตมป์ อภิวัชร์' }, { name: 'ลิเดีย ศรัณย์รัชต์' },
      { name: 'ดี เจอร์ราร์ด (D Gerrard)' }, { name: 'สไมล์ ภาลฎา' }, { name: 'บี พีระพัฒน์' }, { name: 'ปั่น ไพบูลย์เกียรติ' },
      { name: 'รัดเกล้า อามระดิษ' }, { name: 'วิยะดา โกมารกุล ณ นคร' }, { name: 'เจนนิเฟอร์ คิ้ม' },
      { name: 'โก้ มิสเตอร์แซกแมน' }, { name: 'ชลาทิศ ตันติวุฒิ' }, { name: 'นิวนิว' }, { name: 'ว่าน ธนกฤต' },
      { name: 'โบ สุนิตา' }, { name: 'ปาน ธนพร' },
      { name: 'ทอม อิศรา' }, { name: 'โรส ศิรินทิพย์' }, { name: 'นท พนายางกูร' }, { name: 'Meyou' },
      { name: 'Gavin D' }, { name: 'The Toys' }, { name: 'Monik' }, { name: 'Wanyai' },
      { name: 'มาเรียม B5' }, { name: 'ETC.' }, { name: 'Boy Peacemaker' }, { name: 'Ton Thanasit' },
    ]
  },
  {
    id: 'indie-th',
    title: 'อินดี้ / เพื่อชีวิต',
    description: 'ดนตรีอิสระและเพลงสะท้อนชีวิต',
    gradient: 'from-green-700 to-stone-800',
    artists: [
      { name: 'คณะขวัญใจ' }, { name: 'เขียนไขและวานิช' }, { name: 'ที_047 (T_047)' }, { name: 'สวีด แอนด์ โรล (Zweed n\' Roll)' },
      { name: 'เซฟแพลนเน็ต (Safeplanet)' }, { name: 'โพลีแคท (Polycat)' }, { name: 'อนาโตมี แรบบิท (Anatomy Rabbit)' },
      { name: 'ไททศมิตร (TaitosmitH)' }, { name: 'พงษ์สิทธิ์ คำภีร์' }, { name: 'คาราบาว (Carabao)' },
      { name: 'มาลีฮวนน่า' }, { name: 'พงษ์เทพ กระโดนชำนาญ' }, { name: 'หงา คาราวาน' }, { name: 'ซูซู (Zu Zu)' },
      { name: 'โฮป (Hope)' }, { name: 'แฮมเมอร์ (Hammer)' }, { name: 'ปู พงษ์สิทธิ์' }, { name: 'หลิว อาจารียา' },
      { name: 'หนู มิเตอร์' }, { name: 'หลวงไก่' }, { name: 'บ่าววี' }, { name: 'วิด ไฮเปอร์' }, { name: 'พี สะเดิด' },
      { name: 'ฌามา' }, { name: 'วงกางเกง' }, { name: 'วงพัทลุง' }, { name: 'เต็ม นาวา' }, { name: 'วงพาโล' },
      { name: 'อู๋ พันทาง' }, { name: 'จ๊อบ บรรจบ' }, { name: 'มอร์กะจาย' }, { name: 'สมชาย นิลศรี' },
      { name: 'Greasy Cafe' }, { name: 'Desktop Error' }, { name: 'Solitude Is Bliss' }, { name: 'Yellow Fang' },
      { name: 'Khai Kho Nyo' }, { name: 'จุลโหฬาร' }, { name: 'อภิรมย์' },
      { name: 'Yented' }, { name: 'TELEx TELEXs' }, { name: 'Plastic Plastic' }, { name: 'Phum Viphurit' },
      { name: 'เล็ก คาราบาว' }, { name: 'เทียรี่ เมฆวัฒนา' }, { name: 'คนด่านเกวียน' }, { name: 'สิบล้อ' },
    ]
  },
  {
    id: 'luk-grung',
    title: 'ลูกกรุง / สุนทราภรณ์',
    description: 'บทเพลงอมตะ ภาษาสวยงาม',
    gradient: 'from-amber-200 to-yellow-600',
    artists: [
      { name: 'สุนทราภรณ์' }, { name: 'สุเทพ วงศ์กำแหง' }, { name: 'สวลี ผกาพันธุ์' }, { name: 'ชรินทร์ นันทนาคร' },
      { name: 'ธานินทร์ อินทรเทพ' }, { name: 'เพ็ญศรี พุ่มชูศรี' }, { name: 'เศรษฐา ศิระฉายา' }, { name: 'วงดิอิมพอสซิเบิ้ล' },
      { name: 'อรวี สัจจานนท์' }, { name: 'ก๊อท จักรพันธ์' }, { name: 'วินัย จุลบุษปะ' }, { name: 'ศรีไศล สุชาตวุฒิ' },
      { name: 'รวงทอง ทองลั่นธม' }, { name: 'จันทนีย์ อูนากูล' }, { name: 'สุพรรณิกา' }, { name: 'ดาวใจ ไพจิตร' },
      { name: 'อุมาพร บัวพึ่ง' }, { name: 'ทิพวัลย์ ปิ่นภิบาล' }, { name: 'วงจันทร์ ไพโรจน์' },
      { name: 'สิทธิพร สุนทรพจน์' }, { name: 'ดนุพล แก้วกาญจน์' }, { name: 'นันทิดา แก้วบัวสาย' }, { name: 'สุชาติ ชวางกูร' },
      { name: 'ชรัส เฟื่องอารมย์' }, { name: 'ภูสมิง หน่อสวรรค์' }, { name: 'รวิวรรณ จินดา' }, 
      { name: 'อ้วน วารุณี' }, { name: 'นิตยา บุญสูงเนิน' },
    ]
  },
  {
    id: 'asian-hits',
    title: 'เอเชียนฮิต (K-POP / J-POP)',
    description: 'เพลงฮิตจากฝั่งเอเชีย',
    gradient: 'from-cyan-400 to-blue-600',
    artists: [
      { name: 'บีทีเอส (BTS)' }, { name: 'แบล็กพิงก์ (BLACKPINK)' }, { name: 'ทไวซ์ (TWICE)' }, { name: 'นิวจีนส์ (NewJeans)' },
      { name: 'เอสปา (aespa)' }, { name: 'ไอฟ์ (IVE)' }, { name: 'โยอาโซบิ (YOASOBI)' }, { name: 'ลิซ่า (LISA)' },
      { name: 'แบมแบม (BamBam)' }, { name: 'เอ็กโซ (EXO)' }, { name: 'เกิลส์เจเนอเรชัน (Girls\' Generation)' },
      { name: 'ไอยู (IU)' }, { name: 'เอนไฮเพน (ENHYPEN)' }, { name: 'สเตรย์คิดส์ (Stray Kids)' },
      { name: 'เซเวนทีน (SEVENTEEN)' }, { name: 'เรดเวลเวต (Red Velvet)' }, { name: 'อิทจี (ITZY)' },
      { name: 'เลเซราฟิม (LE SSERAFIM)' }, { name: 'เทรเชอร์ (TREASURE)' }, { name: 'เอ็นซีที 127 (NCT 127)' },
      { name: 'เอ็นซีที ดรีม (NCT DREAM)' }, { name: 'เบบี้มอนสเตอร์ (BABYMONSTER)' }, { name: 'สเตย์ซี (STAYC)' }, { name: 'เอ็นมิกซ์ (NMIXX)' }, { name: '(G)I-DLE' },
      { name: 'บิ๊กแบง (BIGBANG)' }, { name: 'ซูเปอร์จูเนียร์ (Super Junior)' }, { name: 'ชายนี่ (SHINee)' }, { name: 'ทูพีเอ็ม (2PM)' }, { name: 'Vaundy' },
      { name: 'Kenshi Yonezu' }, { name: 'Fujii Kaze' }, { name: 'Official HIGE DANdism' },
      { name: 'ไอลิท (ILLIT)' }, { name: 'ไรซ์ (RIIZE)' }, { name: 'ทีดับบลิวเอส (TWS)' }, { name: 'บอยเนกซ์ดอร์ (BOYNEXTDOOR)' },
      { name: 'คิสออฟไลฟ์ (KISS OF LIFE)' }, { name: 'เอทีซ (ATEEZ)' }, { name: 'ทีเอ็กซ์ที (TXT)' }, { name: 'จี-ดรากอน (G-Dragon)' },
      { name: 'แทยอน (Taeyeon)' }, { name: 'Aimer' }, { name: 'LiSA' }, { name: 'Radwimps' },
      { name: 'AKB48' }, { name: 'Nogizaka46' }, { name: 'BABYMETAL' },
    ]
  },
  {
    id: 'international',
    title: 'International Hits',
    description: 'Global pop icons & chart toppers',
    gradient: 'from-blue-600 to-slate-900',
    artists: [
      { name: 'เทย์เลอร์ สวิฟต์ (Taylor Swift)' }, { name: 'เอ็ด ชีแรน (Ed Sheeran)' }, { name: 'บรูโน มาร์ส (Bruno Mars)' }, { name: 'จัสติน บีเบอร์ (Justin Bieber)' },
      { name: 'อะเดล (Adele)' }, { name: 'ดูอา ลิปา (Dua Lipa)' }, { name: 'เดอะ วีกเอนด์ (The Weeknd)' }, { name: 'แฮร์รี่ สไตลส์ (Harry Styles)' },
      { name: 'บิลลี ไอลิช (Billie Eilish)' }, { name: 'มารูนไฟฟ์ (Maroon 5)' }, { name: 'โคลด์เพลย์ (Coldplay)' }, { name: 'เลดี้ กาก้า (Lady Gaga)' },
      { name: 'โอลิเวีย โรดริโก (Olivia Rodrigo)' }, { name: 'โพสต์ มาโลน (Post Malone)' }, { name: 'โดจา แคท (Doja Cat)' }, { name: 'ซาบรีนา คาร์เพนเทอร์ (Sabrina Carpenter)' },
      { name: 'อาเรียน่า กรานเด (Ariana Grande)' }, { name: 'เคที เพอร์รี (Katy Perry)' }, { name: 'โจจิ (Joji)' }, { name: 'ริฮานน่า (Rihanna)' },
      { name: 'บียอนเซ่ (Beyonce)' }, { name: 'เดรก (Drake)' }, { name: 'เอ็มมิเน็ม (Eminem)' }, { name: 'เอสซีเอ (SZA)' }, { name: 'เคนดริก ลามาร์ (Kendrick Lamar)' },
      { name: 'ไมลีย์ ไไซรัส (Miley Cyrus)' }, { name: 'ฌอน เมนเดส (Shawn Mendes)' }, { name: 'คามิลา คาเบโย (Camila Cabello)' }, { name: 'วันไดเรกชัน (One Direction)' },
      { name: 'อิมเมจิน ดรากอนส์ (Imagine Dragons)' }, { name: 'ลิงคิน พาร์ก (Linkin Park)' }, { name: 'ควีน (Queen)' }, { name: 'เดอะ บีเทิลส์ (The Beatles)' },
      { name: 'ไมเคิล แจ็คสัน (Michael Jackson)' },
      { name: 'Tate McRae' }, { name: 'Benson Boone' }, { name: 'Noah Kahan' }, { name: 'Zach Bryan' },
      { name: 'Morgan Wallen' }, { name: 'Luke Combs' }, { name: 'Travis Scott' }, { name: 'Future' },
      { name: 'Metro Boomin' }, { name: 'Playboi Carti' }, { name: 'ลานา เดล เรย์ (Lana Del Rey)' }, { name: 'อาร์กติก มังกีส์ (Arctic Monkeys)' },
      { name: 'เดอะ เนเบอร์ฮูด (The Neighbourhood)' }, { name: 'Cigarettes After Sex' }, { name: 'กันส์แอนด์โรสเซส (Guns N\' Roses)' }, { name: 'AC/DC' },
    ]
  }
];
