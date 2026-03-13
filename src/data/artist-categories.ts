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
    ]
  },
  {
    id: 'retro-hits',
    title: 'ตำนาน / ยุค 90',
    description: 'เพลงฮิตตลอดกาลที่ทุกคนคิดถึง',
    gradient: 'from-blue-500 to-indigo-600',
    artists: [
      { name: 'เบิร์ด ธงไชย' },
      { name: 'พุ่มพวง ดวงจันทร์' },
      { name: 'เจ เจตริน' },
      { name: 'คริสติน่า อากีล่าร์' },
      { name: 'ใหม่ เจริญปุระ' },
      { name: 'สายยัณห์ สัญญา' },
      { name: 'พงษ์สิทธิ์ คำภีร์' },
      { name: 'แอ๊ด คาราบาว' },
      { name: 'มาลีฮวนน่า' },
      { name: 'อัสนี วสันต์' },
    ]
  },
  {
    id: 'indie-th',
    title: 'อินดี้ / เพื่อชีวิต',
    description: 'ดนตรีอิสระและเพลงสะท้อนชีวิต',
    gradient: 'from-green-600 to-teal-700',
    artists: [
      { name: 'คณะขวัญใจ' },
      { name: 'เขียนไขและวานิช' },
      { name: 'ที_047 (T_047)' },
      { name: 'สวีด แอนด์ โรล (Zweed n\' Roll)' },
      { name: 'เซฟแพลนเน็ต (Safeplanet)' },
      { name: 'โพลีแคท (Polycat)' },
      { name: 'อนาโตมี แรบบิท (Anatomy Rabbit)' },
      { name: 'ไททศมิตร (TaitosmitH)' },
      { name: 'โซลิตูด อิส บลิส (Solitude Is Bliss)' },
      { name: 'เดสก์ท็อป เออร์เรอร์ (Desktop Error)' },
    ]
  },
  {
    id: 'international',
    title: 'International Hits',
    description: 'Global pop icons & chart toppers',
    gradient: 'from-blue-400 to-cyan-500',
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
    ]
  }
];
