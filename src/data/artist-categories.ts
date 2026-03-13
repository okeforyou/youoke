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
      { name: 'Three Man Down' },
      { name: 'Tilly Birds' },
      { name: 'Bowkylion' },
      { name: 'Ink Waruntorn' },
      { name: 'Paper Planes' },
      { name: 'Jeff Satur' },
      { name: 'Milli' },
      { name: 'Nont Tanont' },
      { name: 'The Toys' },
      { name: 'Billkin' },
    ]
  },
  {
    id: 'rock-thai',
    title: 'ร็อกไทย',
    description: 'รวมเพลงร็อกระดับตำนานและรุ่นใหม่',
    gradient: 'from-red-600 to-black',
    artists: [
      { name: 'Bodyslam' },
      { name: 'Big Ass' },
      { name: 'Potato' },
      { name: 'Loso' },
      { name: 'Silly Fools' },
      { name: 'Cocktail' },
      { name: 'Klear' },
      { name: 'Labanoon' },
      { name: 'Slot Machine' },
      { name: 'Paradox' },
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
      { name: 'T_047' },
      { name: 'Zweed n\' Roll' },
      { name: 'Safeplanet' },
      { name: 'Polycat' },
      { name: 'Anatomy Rabbit' },
      { name: 'ไททศมิตร' },
      { name: 'Solitude Is Bliss' },
      { name: 'Desktop Error' },
    ]
  },
  {
    id: 'international',
    title: 'International Hits',
    description: 'Global pop icons & chart toppers',
    gradient: 'from-blue-400 to-cyan-500',
    artists: [
      { name: 'Taylor Swift' },
      { name: 'Ed Sheeran' },
      { name: 'Bruno Mars' },
      { name: 'Justin Bieber' },
      { name: 'Adele' },
      { name: 'Dua Lipa' },
      { name: 'The Weeknd' },
      { name: 'Harry Styles' },
      { name: 'Billie Eilish' },
      { name: 'Maroon 5' },
    ]
  }
];
