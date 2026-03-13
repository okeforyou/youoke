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
    id: 'luk-thung',
    title: 'ลูกทุ่งยอดฮิต',
    description: 'รวมที่สุดของขวัญใจมหาชน',
    gradient: 'from-orange-500 to-amber-600',
    artists: [
      { name: 'มนต์แคน แก่นคูน' },
      { name: 'ต่าย อรทัย' },
      { name: 'ไผ่ พงศธร' },
      { name: 'ลำเพลิน วงศกร' },
      { name: 'เบิ้ล ปทุมราช' },
      { name: 'ก้อง ห้วยไร่' },
      { name: 'หญิงลี ศรีจุมพล' },
      { name: 'ตั๊กแตน ชลดา' },
      { name: 'ก๊อท จักรพันธ์' },
      { name: 'ไมค์ ภิรมย์พร' },
      { name: 'สุนารี ราชสีมา' },
      { name: 'พุ่มพวง ดวงจันทร์' },
      { name: 'ยอดรัก สลักใจ' },
      { name: 'สายยัณห์ สัญญา' },
      { name: 'ศิริพร อำไพพงษ์' },
      { name: 'จินตหรา พูนลาภ' },
    ]
  },
  {
    id: 'mor-lam',
    title: 'หมอลำ / อีสานลำเพลิน',
    description: 'จังหวะสนุกฉบับคนอีสาน',
    gradient: 'from-yellow-400 to-orange-500',
    artists: [
      { name: 'พรศักดิ์ ส่องแสง' },
      { name: 'ศิริพร อำไพพงษ์' },
      { name: 'จินตหรา พูนลาภ' },
      { name: 'เฉลิมพล มาลาคำ' },
      { name: 'ไหมไทย หัวใจศิลป์' },
      { name: 'มนต์แคน แก่นคูน' },
      { name: 'ลำเพลิน วงศกร' },
      { name: 'เบล ขนิษฐา' },
      { name: 'เต้ย อภิวัฒน์' },
      { name: 'กระต่าย พรรณนิภา' },
      { name: 'บัวผัน ทังโส' },
      { name: 'ศรีจันทร์ วีสี' },
    ]
  },
  {
    id: 'thai-pop',
    title: 'สตริง / T-POP',
    description: 'เพลงฮิตร่วมสมัยมาแรง',
    gradient: 'from-purple-500 to-pink-500',
    artists: [
      { name: 'ทรี แมน ดาวน์ (Three Man Down)' },
      { name: 'ทิลลี่ เบิร์ดส (Tilly Birds)' },
      { name: 'โบกี้ไลอ้อน (Bowkylion)' },
      { name: 'อิ้งค์ วรันธร (Ink Waruntorn)' },
      { name: 'เปเปอร์ เพลนส์ (Paper Planes)' },
      { name: 'เจฟ ซาเตอร์ (Jeff Satur)' },
      { name: 'มิลลิ (Milli)' },
      { name: 'นนท์ ธนนท์ (Nont Tanont)' },
      { name: 'เดอะ ทอยส์ (The Toys)' },
      { name: 'บิวกิ้น (Billkin)' },
      { name: 'พีพี กฤษฏ์ (PP Krit)' },
      { name: '4EVE' },
      { name: 'PROXIE' },
      { name: 'อะตอม ชนกันต์ (Atom)' },
      { name: 'วี วิโอเลต (Violette Wautier)' },
    ]
  },
  {
    id: 'rock-thai',
    title: 'ร็อกไทย',
    description: 'รวมเพลงร็อกระดับตำนานและรุ่นใหม่',
    gradient: 'from-red-600 to-black',
    artists: [
      { name: 'บอดี้สแลม (Bodyslam)' },
      { name: 'บิ๊กแอส (Big Ass)' },
      { name: 'โปเตโต้ (Potato)' },
      { name: 'โลโซ (Loso)' },
      { name: 'ซิลลี่ ฟูลส์ (Silly Fools)' },
      { name: 'ค็อกเทล (Cocktail)' },
      { name: 'เคลียร์ (Klear)' },
      { name: 'ลาบานูน (Labanoon)' },
      { name: 'สล็อต แมชชีน (Slot Machine)' },
      { name: 'พาราด็อกซ์ (Paradox)' },
      { name: 'โมเดิร์นด็อก (Modern Dog)' },
      { name: 'เรโทรสเปกต์ (Retrospect)' },
      { name: 'สวีต มัลเล็ต (Sweet Mullet)' },
      { name: 'อินสติงต์ (Instinct)' },
      { name: 'ดา เอ็นโดรฟิน (Da Endorphine)' },
    ]
  },
  {
    id: 'retro-hits',
    title: 'ตำนาน / ยุค 90',
    description: 'เพลงฮิตตลอดกาลที่ทุกคนคิดถึง',
    gradient: 'from-blue-500 to-indigo-600',
    artists: [
      { name: 'เบิร์ด ธงไชย' },
      { name: 'เจ เจตริน' },
      { name: 'คริสติน่า อากีล่าร์' },
      { name: 'ใหม่ เจริญปุระ' },
      { name: 'มอส ปฏิภาณ' },
      { name: 'ทาทา ยัง' },
      { name: 'นิโคล เทริโอ' },
      { name: 'ลิฟท์-ออย' },
      { name: 'แร็พเตอร์ (Raptor)' },
      { name: 'เจมส์ เรืองศักดิ์' },
      { name: 'ปาน ธนพร' },
      { name: 'ดัง พันกร' },
      { name: 'ปุ๊ อัญชลี' },
      { name: 'ติ๊ก ชิโร่' },
      { name: 'ไฮร็อก (Hi-Rock)' },
    ]
  },
  {
    id: 'teen-pop',
    title: 'วัยรุ่นยุค 2000 / Kamikaze',
    description: 'ตำนานเพลงรักวัยใสที่ทุกคนร้องตามได้',
    gradient: 'from-pink-400 to-rose-500',
    artists: [
      { name: 'โฟร์-มด (Four-Mod)' },
      { name: 'เฟย์ ฟาง แก้ว (FFK)' },
      { name: 'ขนมจีน (Knomjean)' },
      { name: 'หวาย (Waii)' },
      { name: 'หวาย (Waii)' },
      { name: 'กอล์ฟ-ไมค์ (Golf-Mike)' },
      { name: 'เค-โอติก (K-OTIC)' },
      { name: 'เนโกะ จัมพ์ (Neko Jump)' },
      { name: 'ทรี.ทู.วัน (3.2.1)' },
      { name: 'ไบรโอนี่ (Briohny)' },
      { name: 'กะลา (Kala)' },
      { name: 'ไอซ์ ศรัณยู' },
    ]
  },
  {
    id: 'hiphop-th',
    title: 'ฮิปฮอป / แร็ปไทย',
    description: 'บีทหนักๆ และไรม์สุดคม',
    gradient: 'from-emerald-500 to-teal-700',
    artists: [
      { name: 'ยังโอม (YOUNGOHM)' },
      { name: 'ยังกู (YOUNGGU)' },
      { name: 'ไมยราพ (MAIYARAP)' },
      { name: 'เลซี่ล็อกซี่ (LAZYLOXY)' },
      { name: 'โจอี้ บอย (Joey Boy)' },
      { name: 'ไทยเทเนี่ยม (Thaitanium)' },
      { name: 'กอล์ฟ ฟักกลิ้ง ฮีโร่ (F.HERO)' },
      { name: 'สไปรท์ (SPRITE)' },
      { name: 'กายจีจี (GUYGEEGEE)' },
      { name: 'อิลสลิก (Illslick)' },
      { name: 'ยัวร์บอยทีเจ (UrboyTJ)' },
      { name: 'ไททศมิตร (TaitosmitH)' },
    ]
  },
  {
    id: 'indie-th',
    title: 'อินดี้ / เพื่อชีวิต',
    description: 'ดนตรีอิสระและเพลงสะท้อนชีวิต',
    gradient: 'from-green-700 to-stone-800',
    artists: [
      { name: 'คณะขวัญใจ' },
      { name: 'เขียนไขและวานิช' },
      { name: 'ที_047 (T_047)' },
      { name: 'สวีด แอนด์ โรล (Zweed n\' Roll)' },
      { name: 'เซฟแพลนเน็ต (Safeplanet)' },
      { name: 'โพลีแคท (Polycat)' },
      { name: 'อนาโตมี แรบบิท (Anatomy Rabbit)' },
      { name: 'ไททศมิตร (TaitosmitH)' },
      { name: 'พงษ์สิทธิ์ คำภีร์' },
      { name: 'คาราบาว (Carabao)' },
      { name: 'มาลีฮวนน่า' },
      { name: 'พงษ์เทพ กระโดนชำนาญ' },
      { name: 'หงา คาราวาน' },
    ]
  },
  {
    id: 'luk-grung',
    title: 'ลูกกรุง / สุนทราภรณ์',
    description: 'บทเพลงอมตะ ภาษาสวยงาม',
    gradient: 'from-amber-200 to-yellow-600',
    artists: [
      { name: 'สุนทราภรณ์' },
      { name: 'สุเทพ วงศ์กำแหง' },
      { name: 'สวลี ผกาพันธุ์' },
      { name: 'ชรินทร์ นันทนาคร' },
      { name: 'ธานินทร์ อินทรเทพ' },
      { name: 'เพ็ญศรี พุ่มชูศรี' },
      { name: 'เศรษฐา ศิระฉายา' },
      { name: 'วงดิอิมพอสซิเบิ้ล' },
      { name: 'อรวี สัจจานนท์' },
      { name: 'ก๊อท จักรพันธ์' },
    ]
  },
  {
    id: 'asian-hits',
    title: 'เอเชียนฮิต (K-POP / J-POP)',
    description: 'เพลงฮิตจากฝั่งเอเชีย',
    gradient: 'from-cyan-400 to-blue-600',
    artists: [
      { name: 'บีทีเอส (BTS)' },
      { name: 'แบล็กพิงก์ (BLACKPINK)' },
      { name: 'ทไวซ์ (TWICE)' },
      { name: 'นิวจีนส์ (NewJeans)' },
      { name: 'เอสปา (aespa)' },
      { name: 'ไอฟ์ (IVE)' },
      { name: 'โยอาโซบิ (YOASOBI)' },
      { name: 'ลิซ่า (LISA)' },
      { name: 'แบมแบม (BamBam)' },
      { name: 'เอ็กโซ (EXO)' },
      { name: 'เกิลส์เจเนอเรชัน (Girls\' Generation)' },
    ]
  },
  {
    id: 'international',
    title: 'International Hits',
    description: 'Global pop icons & chart toppers',
    gradient: 'from-blue-600 to-slate-900',
    artists: [
      { name: 'เทย์เลอร์ สวิฟต์ (Taylor Swift)' },
      { name: 'เอ็ด ชีแรน (Ed Sheeran)' },
      { name: 'บรูโน มาร์ส (Bruno Mars)' },
      { name: 'จัสติน บีเบอร์ (Justin Bieber)' },
      { name: 'อเดล (Adele)' },
      { name: 'ดัว ลิปา (Dua Lipa)' },
      { name: 'เดอะ วีกเอนด์ (The Weeknd)' },
      { name: 'แฮร์รี่ สไตลส์ (Harry Styles)' },
      { name: 'บิลลี่ ไอลิช (Billie Eilish)' },
      { name: 'มารูน ไฟว์ (Maroon 5)' },
      { name: 'โคลด์เพลย์ (Coldplay)' },
      { name: 'เลดี้ กาก้า (Lady Gaga)' },
    ]
  },
  {
    id: 'kids-cartoon',
    title: 'เพลงเด็ก / การ์ตูน',
    description: 'เสริมสร้างจินตนาการสำหรับน้องๆ',
    gradient: 'from-lime-400 to-green-500',
    artists: [
      { name: 'เพลงเด็กน้อย' },
      { name: 'น้องเป็ดอาบน้ำ' },
      { name: 'เพลงช้าง' },
      { name: 'Disney Hits' },
      { name: 'โดราเอมอน' },
      { name: 'ดราก้อนบอล' },
      { name: 'Frozen (Let It Go)' },
      { name: 'Baby Shark' },
    ]
  }
];
