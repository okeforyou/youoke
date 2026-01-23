const admin = require('firebase-admin');

// Initialize with playokeforyou-dev
const serviceAccount = {
  projectId: "playokeforyou-dev",
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "playokeforyou-dev"
});

const db = admin.firestore();

const plans = [
  {
    id: 'free',
    name: 'Free',
    displayName: 'ฟรี',
    price: 0,
    duration: 'ตลอดชีพ',
    features: [
      'ค้นหาและร้องเพลงได้ไม่จำกัด',
      'ระบบคิวเพลง',
      'โหมดเสียงร้องประกอบ'
    ],
    popular: false,
    isActive: true,
    isVisible: true
  },
  {
    id: 'monthly',
    name: 'Monthly Premium',
    displayName: 'Premium รายเดือน',
    price: 99,
    duration: '1 เดือน',
    features: [
      'ทุกฟีเจอร์ของแผน Free',
      'ไม่มีโฆษณา',
      'คุณภาพเสียง HD',
      'บันทึกเพลงโปรดได้ไม่จำกัด',
      'ระบบ Cast ดูเพลงบน TV'
    ],
    popular: false,
    isActive: true,
    isVisible: true
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    displayName: 'Premium รายปี',
    price: 990,
    duration: '1 ปี',
    features: [
      'ทุกฟีเจอร์ของแผน Monthly',
      'ประหยัดกว่า 17%',
      'สนับสนุนการพัฒนา',
      'อัพเดตฟีเจอร์ใหม่ก่อนใคร'
    ],
    popular: true,
    isActive: true,
    isVisible: true
  },
  {
    id: 'lifetime',
    name: 'Lifetime Premium',
    displayName: 'Premium ตลอดชีพ',
    price: 2990,
    duration: 'ตลอดชีพ',
    features: [
      'ทุกฟีเจอร์ของแผน Yearly',
      'จ่ายครั้งเดียวใช้ตลอดไป',
      'ประหยัดสุดคุ้ม',
      'รับฟีเจอร์ใหม่ฟรีตลอด'
    ],
    popular: false,
    isActive: true,
    isVisible: true
  }
];

async function seedPlans() {
  console.log('🌱 Seeding plans collection...');
  
  for (const plan of plans) {
    const planRef = db.collection('plans').doc(plan.id);
    await planRef.set(plan);
    console.log(`✅ Created plan: ${plan.id}`);
  }
  
  console.log('🎉 Done!');
  process.exit(0);
}

seedPlans().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
