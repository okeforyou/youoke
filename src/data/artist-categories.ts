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
      { name: 'KLEAR' }, { name: 'Cocktail' }, { name: 'Big Ass' }, { name: 'NUM KALA' }, 
      { name: 'Silly Fools' }, { name: 'ต่าย อรทัย' }, { name: 'Bodyslam' }, { name: 'Potato' }, 
      { name: 'ดา เอ็นโดรฟิน' }, { name: 'Palmy' }, { name: 'เบิร์ด ธงไชย' }, { name: 'Clash' },
      { name: 'มนต์แคน แก่นคูน' }, { name: 'แบมแบม (BamBam)' }, { name: 'ลิซ่า (LISA)' }, { name: 'นนท์ ธนนท์' }
    ]
  },
  {
    id: 'thai-male',
    title: 'ศิลปินไทย ชายเดี่ยว',
    description: 'ที่สุดของเสียงร้องฝ่ายชาย',
    gradient: 'from-blue-500 to-indigo-600',
    artists: [
      { name: 'NUM KALA' }, { name: 'เบิร์ด ธงไชย' }, { name: 'บอย Peacemaker' }, { name: 'เสก โลโซ' }, 
      { name: 'เสือ ธนพล' }, { name: 'ปราโมทย์ วิเลปะนะ' }, { name: 'พลพล' }, { name: 'Timethai' }, 
      { name: 'Bell Supol' }, { name: 'อ๊อฟ ปองศักดิ์' }, { name: 'ไอซ์ ศรัณยู' }, { name: 'แช่ม แช่มรัมย์' }, 
      { name: 'เอ็ม อรรถพล' }, { name: 'ศิรศักดิ์ อิทธิพลพาณิชย์' }, { name: 'บี้ สุกฤษฎิ์' }, { name: 'บิลลี่ โอแกน' }, 
      { name: 'ว่าน ธนกฤต' }, { name: 'โต๋ ศักดิ์สิทธิ์' }, { name: 'ติ๊ก ชิโร่' }, { name: 'เป๊ก ผลิตโชค' },
      { name: 'นนท์ ธนนท์' }, { name: 'เจฟ ซาเตอร์' }, { name: 'เดอะ ทอยส์' }, { name: 'บิวกิ้น' },
      { name: 'อะตอม ชนกันต์' }, { name: 'สิงโต นำโชค' }, { name: 'ป๊อบ ปองกูล' }, { name: 'โอ๊ต ปราโมทย์' }
    ]
  },
  {
    id: 'thai-female',
    title: 'ศิลปินไทย หญิงเดี่ยว',
    description: 'รวมดีว่าและนักร้องสาวเสียงสวย',
    gradient: 'from-pink-500 to-rose-600',
    artists: [
      { name: 'ต่าย อรทัย' }, { name: 'ดา เอ็นโดรฟิน' }, { name: 'Palmy' }, { name: 'Lula' }, 
      { name: 'โรส ศิรินทิพย์' }, { name: 'แพรว คณิตกุล' }, { name: 'โบ สุนิตา' }, { name: 'เต้น นรารักษ์' }, 
      { name: 'ปนัดดา เรืองวุฒิ' }, { name: 'แอม เสาวลักษณ์' }, { name: 'แอน ธิติมา' }, { name: 'นันทิดา แก้วบัวสาย' }, 
      { name: 'ทาทา ยัง' }, { name: 'ตอง ภัครมัย' }, { name: 'แคทรียา อิงลิช' }, { name: 'แก้ม วิชญาณี' }, 
      { name: 'นิโคล เทริโอ' }, { name: 'แนน วาทิยา' }, { name: 'เจนนิเฟอร์ คิ้ม' }, { name: 'โบกี้ไลอ้อน (Bowkylion)' },
      { name: 'อิ้งค์ วรันธร' }, { name: 'ส้ม มารี' }, { name: 'วี วิโอเลต' }, { name: 'มิลลิ (Milli)' },
      { name: 'สุนารี ราชสีมา' }, { name: 'จินตหรา พูนลาภ' }, { name: 'ฝน ธนสุนทร' }, { name: 'แคท รัตกาล' }
    ]
  },
  {
    id: 'thai-group',
    title: 'ศิลปินไทย กลุ่ม / วงร็อก',
    description: 'วงดนตรียอดฮิตตลอดกาล',
    gradient: 'from-gray-700 to-black',
    artists: [
      { name: 'KLEAR' }, { name: 'Cocktail' }, { name: 'Big Ass' }, { name: 'Silly Fools' }, 
      { name: 'Bodyslam' }, { name: 'Potato' }, { name: 'Clash' }, { name: 'Loso' }, 
      { name: 'ZEAL' }, { name: '25 Hours' }, { name: 'Dr.Fuu' }, { name: 'AB Normal' }, 
      { name: 'อัสนี & วสันต์' }, { name: 'คาราบาว' }, { name: 'Slot Machine' }, { name: 'Paradox' }, 
      { name: 'Instinct' }, { name: 'BLACKHEAD' }, { name: 'Calories Blah Blah' }, { name: 'ETC.' },
      { name: 'Three Man Down' }, { name: 'Tilly Birds' }, { name: 'Paper Planes' }, { name: 'TaitosmitH' },
      { name: '4EVE' }, { name: 'PROXIE' }, { name: 'PiXXiE' }, { name: 'Polycat' }
    ]
  },
  {
    id: 'luk-thung-male',
    title: 'ลูกทุ่งชายเดี่ยว',
    description: 'ขวัญใจมหาชนฝั่งชาย',
    gradient: 'from-amber-500 to-orange-700',
    artists: [
      { name: 'มนต์แคน แก่นคูน' }, { name: 'ปอน นิพนธ์' }, { name: 'ไผ่ พงศธร' }, { name: 'ไมค์ ภิรมย์พร' }, 
      { name: 'เบียร์ พร้อมพงษ์' }, { name: 'ลำเพลิน วงศกร' }, { name: 'ก้อง ห้วยไร่' }, { name: 'บุ๊ค ศุภกาญจน์' }, 
      { name: 'หนู มิเตอร์' }, { name: 'ก๊อท จักรพันธ์' }, { name: 'กานต์ ทศน' }, { name: 'บ่าววี' }, 
      { name: 'สันติ ดวงสว่าง' }, { name: 'ไหมไทย ใจตะวัน' }, { name: 'เบิ้ล ปทุมราช' }, { name: 'สายัณห์ สัญญา' }, 
      { name: 'พงษ์เทพ กระโดนชํานาญ' }, { name: 'เต้ย อภิวัฒน์' }, { name: 'บ.เบิ้ล สามร้อย' }, { name: 'พี สะเดิด' },
      { name: 'ยอดรัก สลักใจ' }, { name: 'มนต์สิทธิ์ คำสร้อย' }, { name: 'รุ่ง สุริยา' }, { name: 'ยิ่งยง ยอดบัวงาม' }
    ]
  },
  {
    id: 'luk-thung-female',
    title: 'ลูกทุ่งหญิงเดี่ยว',
    description: 'ราชินีลูกทุ่งและดาวรุ่งพุ่งแรง',
    gradient: 'from-yellow-400 to-amber-600',
    artists: [
      { name: 'ต่าย อรทัย' }, { name: 'ตั๊กแตน ชลดา' }, { name: 'มีนตรา อินทิรา' }, { name: 'ศิริพร อำไพพงษ์' }, 
      { name: 'เนสกาแฟ ศรีนคร' }, { name: 'เวียง นฤมล' }, { name: 'เอิ้นขวัญ วรัญญา' }, { name: 'ลำไย ไหทองคำ' }, 
      { name: 'กระต่าย พรรณนิภา' }, { name: 'จินตหรา พูนลาภ' }, { name: 'หญิง ธิติกานต์' }, { name: 'ฝน ธนสุนธร' }, 
      { name: 'ก้านตอง ทุ่งเงิน' }, { name: 'ฐา ขนิษ' }, { name: 'ข้าวทิพย์ ธิดาดิน' }, { name: 'หญิงลี ศรีจุมพล' }, 
      { name: 'ดอกอ้อ ทุ่งทอง' }, { name: 'จ๊ะ นงผณี' }, { name: 'เอิร์น สุรัตน์ติกานต์' }, { name: 'เปาวลี พรพิมล' },
      { name: 'พุ่มพวง ดวงจันทร์' }, { name: 'ผ่องศรี วรนุช' }, { name: 'จอมขวัญ กัลยา' }, { name: 'บัว กมลทิพย์' }
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
      { name: 'เอ็นซีที ดรีม (NCT DREAM)' }, { name: 'เบบี้มอนสเตอร์ (BABYMONSTER)' }, { name: 'ไอลิท (ILLIT)' }, { name: 'ไรซ์ (RIIZE)' }
    ]
  },
  {
    id: 'international-male',
    title: 'ศิลปินสากล ชายเดี่ยว',
    description: 'International Male Soloists',
    gradient: 'from-blue-800 to-indigo-900',
    artists: [
      { name: 'Justin Bieber' }, { name: 'The Weeknd' }, { name: 'Tyga' }, { name: 'Eminem' }, 
      { name: 'Charlie Puth' }, { name: 'Bruno Mars' }, { name: 'Ed Sheeran' }, { name: 'Troye Sivan' }, 
      { name: 'Chris Brown' }, { name: 'Drake' }, { name: 'Post Malone' }, { name: 'Harry Styles' },
      { name: 'Sam Smith' }, { name: 'Shawn Mendes' }, { name: 'Jason Mraz' }, { name: 'Michael Jackson' }
    ]
  },
  {
    id: 'international-female',
    title: 'ศิลปินสากล หญิงเดี่ยว',
    description: 'International Female Soloists',
    gradient: 'from-purple-800 to-pink-900',
    artists: [
      { name: 'Taylor Swift' }, { name: 'Ariana Grande' }, { name: 'Katy Perry' }, { name: 'Rihanna' }, 
      { name: 'Lady Gaga' }, { name: 'Ellie Goulding' }, { name: 'Jessie J' }, { name: 'Miley Cyrus' }, 
      { name: 'Sia' }, { name: 'Meghan Trainor' }, { name: 'Lana Del Rey' }, { name: 'Mariah Carey' }, 
      { name: 'Nicki Minaj' }, { name: 'Beyoncé' }, { name: 'Britney Spears' }, { name: 'Adele' }
    ]
  },
  {
    id: 'retro-legend',
    title: 'ตำนานเพลงอมตะ',
    description: 'ย้อนรอยวันวานกับบทเพลงขึ้นหิ้ง',
    gradient: 'from-amber-200 to-yellow-600',
    artists: [
      { name: 'สุนทราภรณ์' }, { name: 'สุเทพ วงศ์กำแหง' }, { name: 'สวลี ผกาพันธุ์' }, { name: 'ชรินทร์ นันทนาคร' },
      { name: 'ธานินทร์ อินทรเทพ' }, { name: 'เศรษฐา ศิระฉายา' }, { name: 'แจ้ ดนุพล' }, { name: 'พุ่มพวง ดวงจันทร์' },
      { name: 'ยอดรัก สลักใจ' }, { name: 'สายัณห์ สัญญา' }, { name: 'สุรพล สมบัติเจริญ' }, { name: 'ชาย เมืองสิงห์' }
    ]
  }
];
