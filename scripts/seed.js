import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use service_role key to bypass RLS as required
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Starting database seeding with Faker.js (Incremental Mode)...');

  // Fetch existing database records to prevent duplicate key errors and maintain integrity
  console.log('🔍 Fetching existing users, items, and transactions...');
  const { data: dbUsers } = await supabase.from('users').select('id, role, email');
  const { data: dbItems } = await supabase.from('items').select('id, harga_sewa_per_hari, deposit');
  const { data: dbTransactions } = await supabase.from('transactions').select('id, item_id, penyewa_id, tanggal_mulai, tanggal_selesai');
  
  const adminExists = dbUsers ? dbUsers.some(u => u.email === 'admin@sewaki.com') : false;
  console.log(`ℹ️ Found ${dbUsers?.length || 0} users, ${dbItems?.length || 0} items, and ${dbTransactions?.length || 0} transactions in DB.`);

  // 1. Generate password hash once to optimize performance
  console.log('🔑 Generating password hash...');
  const passwordHash = await bcrypt.hash('password123', 10);
  console.log('🔑 Hashing completed.');

  // Keep track of emails to ensure uniqueness
  const uniqueEmails = new Set();
  if (dbUsers) {
    dbUsers.forEach(u => uniqueEmails.add(u.email));
  }

  // ==========================================
  // STEP 1: SEED USERS (100 records)
  // ==========================================
  console.log('⏳ Seeding users...');
  
  const generateUser = (index) => {
    if (index === 0 && !adminExists) {
      const email = 'admin@sewaki.com';
      uniqueEmails.add(email);
      return {
        id: faker.string.uuid(),
        nama: 'Admin SewaKi',
        email,
        password: passwordHash,
        role: 'admin',
        status_kyc: 'verified',
        foto_ktp: null,
        latitude: faker.datatype.boolean() ? faker.location.latitude({ min: -6.5, max: -6.1 }) : null,
        longitude: faker.datatype.boolean() ? faker.location.longitude({ min: 106.6, max: 107.0 }) : null,
        alamat_lengkap: faker.datatype.boolean() ? faker.location.streetAddress() : null,
        nomor_hp: faker.datatype.boolean() ? '08' + faker.string.numeric(10) : null,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date()
      };
    }

    const nama = faker.person.fullName();
    // Create unique email containing index and timestamp to avoid conflicts with existing database records
    let email = `user_${index}_${faker.string.alphanumeric(5)}@sewaki.com`.toLowerCase();
    while (uniqueEmails.has(email) || email === 'admin@sewaki.com') {
      email = `user_${index}_${faker.string.alphanumeric(8)}@sewaki.com`.toLowerCase();
    }
    uniqueEmails.add(email);

    // Only 'user' or 'pemilik' role for other dummy data
    const role = faker.helpers.arrayElement(['user', 'pemilik']);
    const status_kyc = faker.helpers.arrayElement(['unverified', 'pending', 'verified', 'rejected']);

    return {
      id: faker.string.uuid(),
      nama,
      email,
      password: passwordHash,
      role,
      status_kyc: faker.datatype.boolean() ? status_kyc : 'unverified',
      foto_ktp: faker.datatype.boolean() ? `ktp-${faker.string.uuid()}.jpg` : null,
      latitude: faker.datatype.boolean() ? faker.location.latitude({ min: -6.5, max: -6.1 }) : null,
      longitude: faker.datatype.boolean() ? faker.location.longitude({ min: 106.6, max: 107.0 }) : null,
      alamat_lengkap: faker.datatype.boolean() ? faker.location.streetAddress() : null,
      nomor_hp: faker.datatype.boolean() ? '08' + faker.string.numeric(10) : null,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date()
    };
  };

  const usersData = faker.helpers.multiple((_, idx) => generateUser(idx), { count: 100 });

  const { error: userError } = await supabase.from('users').insert(usersData);
  if (userError) {
    console.error('❌ Error seeding users:', userError.message);
    throw userError;
  }
  console.log('✅ Successfully seeded 100 users.');

  // ==========================================
  // STEP 2: SEED ITEMS (100 records)
  // ==========================================
  console.log('⏳ Seeding items...');

  // Pick random user id who has role 'pemilik' or fallback to any user
  const allUsers = [...(dbUsers || []), ...usersData];
  const pemilikUsers = allUsers.filter(u => u.role === 'pemilik');
  const getPemilikId = () => {
    if (pemilikUsers.length > 0) {
      return faker.helpers.arrayElement(pemilikUsers).id;
    }
    return faker.helpers.arrayElement(allUsers).id;
  };

  const productPool = {
    'camera': {
      templates: [
        'Kamera Canon EOS 3000D Kit',
        'Kamera Canon EOS 1500D Kit',
        'Kamera Fujifilm X-A3 Mirrorless',
        'Kamera Fujifilm X-T200 Mirrorless',
        'Kamera Sony Alpha a6400 Mirrorless',
        'Kamera Sony Alpha a7 III Mirrorless',
        'Kamera Nikon D3500 DSLR',
        'Kamera Nikon D5600 DSLR',
        'Kamera Pocket Ricoh GR III',
        'Kamera GoPro Hero 11 Black Action Cam',
        'Gimbal Stabilizer DJI Ronin-S',
        'Lensa Sony FE 50mm f/1.8 Prime',
        'Tripod Takara Professional Carbon'
      ],
      photos: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&q=80',
        'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=500&q=80',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
        'https://images.unsplash.com/photo-1500051638674-ff996a0bc2de?w=500&q=80',
        'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=500&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&q=80',
        'https://images.unsplash.com/photo-1519638396437-afb501004126?w=500&q=80',
        'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500&q=80',
        'https://images.unsplash.com/photo-1564466809058-64115b74f285?w=500&q=80'
      ]
    },
    'laptop': {
      templates: [
        'MacBook Pro M3 Pro 14"',
        'MacBook Air M2 13"',
        'ASUS ROG Zephyrus G14 Gaming Laptop',
        'ASUS TUF Gaming A15 Laptop',
        'Dell XPS 13 Touch Ultrabook',
        'Dell Inspiron 14 Laptop',
        'Lenovo ThinkPad X1 Carbon Business',
        'Lenovo IdeaPad Slim 3',
        'HP Spectre x360 Convertible Laptop',
        'HP Pavilion 14 Laptop',
        'Acer Predator Helios 300 Gaming',
        'Gigabyte AORUS 15 Professional'
      ],
      photos: [
        'https://images.unsplash.com/photo-1496181130204-755241544e3f?w=500&q=80',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80',
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80',
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&q=80',
        'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500&q=80',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&q=80'
      ]
    },
    'camping-tent': {
      templates: [
        'Tenda Camping Dome 4 Orang Waterproof',
        'Tenda Camping Dome 2 Orang Waterproof',
        'Tenda Eiger Guardian 8P Family Tent',
        'Tenda Consina Magnum 4 Outdoor',
        'Tenda Naturehike Mongar 2 Ultralight',
        'Tenda Great Outdoor Java 4 Pro',
        'Hammock Camping Double Premium Force',
        'Tas Carrier Eiger Adventure 60L',
        'Tas Carrier Consina Centurion 50L',
        'Senter LED Tactical Super Terang',
        'Meja Lipat Portable Aluminium Camping',
        'Sleeping Bag Polar Bulu Eiger Warm'
      ],
      photos: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&q=80',
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=500&q=80',
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84c?w=500&q=80',
        'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=500&q=80',
        'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=500&q=80',
        'https://images.unsplash.com/photo-1508873696983-2df519f0397e?w=500&q=80',
        'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=500&q=80',
        'https://images.unsplash.com/photo-1532339684481-a19ee7eaa4ba?w=500&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80',
        'https://images.unsplash.com/photo-1515408320194-59643816c5b2?w=500&q=80'
      ]
    },
    'playstation': {
      templates: [
        'Console PlayStation 5 CFI-1200A',
        'Console PlayStation 5 Slim 1TB SSD',
        'Stik Sony PS5 DualSense Edge Wireless',
        'Headset PlayStation VR2 Virtual Reality',
        'Console Sony PlayStation 4 Pro 1TB',
        'Console Sony PlayStation 4 Slim 500GB',
        'Console Nintendo Switch OLED Neon',
        'Console Xbox Series X 1TB Black',
        'Console Xbox Series S 512GB White'
      ],
      photos: [
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80',
        'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
        'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=500&q=80',
        'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500&q=80',
        'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=500&q=80',
        'https://images.unsplash.com/photo-1621259182978-f09e5e2b07ae?w=500&q=80',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80'
      ]
    },
    'projector': {
      templates: [
        'Proyektor Epson EB-X400 3LCD',
        'Proyektor Epson EB-W06 WXGA Home',
        'Proyektor Mini Anker Nebula Capsule II',
        'Proyektor BenQ MH560 Full HD 1080p',
        'Proyektor Xiaomi Wanbo T2 Max Smart',
        'Proyektor ViewSonic M1+ Portable LED',
        'Proyektor InFocus IN112xv SVGA Office',
        'Layar Proyektor Tripod 70 inch Manual',
        'Layar Proyektor Motorized 100 inch Otomatis'
      ],
      photos: [
        'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500&q=80',
        'https://images.unsplash.com/photo-1601944179066-29786ccbef15?w=500&q=80',
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&q=80',
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80',
        'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=500&q=80',
        'https://images.unsplash.com/photo-1492446845049-9c50cc313f00?w=500&q=80',
        'https://images.unsplash.com/photo-1478720143033-6a972678aa30?w=500&q=80'
      ]
    },
    'sound-system': {
      templates: [
        'Speaker Portable JBL PartyBox 100',
        'Speaker Portable JBL PartyBox 310 Bass',
        'Soundbar Samsung HW-Q600B Atmos',
        'Speaker Marshall Stanmore II Bluetooth',
        'Speaker Marshall Acton II Classic',
        'Sound System Karaoke Polytron PAS-8B28',
        'Speaker Aktif Yamaha HS5 Studio Monitor',
        'Speaker Aktif Yamaha DBR15 1000W Stage',
        'Mikrofon Wireless Rode Wireless GO II',
        'Mic Wireless Shure SVX24/PG58 Vocal',
        'Audio Mixer Yamaha MG10XU 10-Channel'
      ],
      photos: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80',
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80',
        'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=500&q=80',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
        'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=500&q=80',
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80',
        'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=500&q=80',
        'https://images.unsplash.com/photo-1484755560693-a4074577af3a?w=500&q=80'
      ]
    }
  };

  const keywords = ['camera', 'laptop', 'camping-tent', 'playstation', 'projector', 'sound-system'];

  const generateItem = () => {
    const keyword = faker.helpers.arrayElement(keywords);
    const pool = productPool[keyword];
    
    const baseName = faker.helpers.arrayElement(pool.templates);
    const adjective = faker.helpers.arrayElement([
      'Super Premium',
      'Like New',
      'Kondisi Prima',
      'Pro Edition',
      'Special Bundle',
      'High-End',
      'Garansi Resmi',
      ''
    ]);
    const nama_barang = adjective ? `${baseName} (${adjective})` : baseName;
    const foto_barang = faker.helpers.arrayElement(pool.photos);

    return {
      id: faker.string.uuid(),
      nama_barang,
      deskripsi: faker.datatype.boolean() ? faker.commerce.productDescription() : null,
      harga_sewa_per_hari: faker.number.int({ min: 20000, max: 800000 }),
      stok: faker.number.int({ min: 1, max: 10 }),
      pemilik_id: getPemilikId(),
      lokasi: faker.datatype.boolean() ? faker.location.city() : 'Tidak Diketahui',
      foto_barang,
      deposit: faker.datatype.boolean() ? faker.number.int({ min: 50000, max: 500000 }) : 0,
      is_active: faker.datatype.boolean({ probability: 0.95 }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date()
    };
  };

  const itemsData = faker.helpers.multiple(generateItem, { count: 200 });

  const { error: itemError } = await supabase.from('items').insert(itemsData);
  if (itemError) {
    console.error('❌ Error seeding items:', itemError.message);
    throw itemError;
  }
  console.log('✅ Successfully seeded 200 items.');

  // ==========================================
  // STEP 3: SEED TRANSACTIONS (100 records)
  // ==========================================
  console.log('⏳ Seeding transactions...');

  // Pick random user id who has role 'user' or fallback to any user
  const penyewaUsers = allUsers.filter(u => u.role === 'user');
  const getPenyewaId = () => {
    if (penyewaUsers.length > 0) {
      return faker.helpers.arrayElement(penyewaUsers).id;
    }
    return faker.helpers.arrayElement(allUsers).id;
  };

  const allItems = [...(dbItems || []), ...itemsData];

  const generateTransaction = () => {
    const item = faker.helpers.arrayElement(allItems);
    const tanggal_mulai = faker.date.past({ years: 0.5 });
    const days = faker.number.int({ min: 1, max: 7 });
    const tanggal_selesai = new Date(tanggal_mulai);
    tanggal_selesai.setDate(tanggal_selesai.getDate() + days);

    const total_harga = item.harga_sewa_per_hari * days;
    const jaminan_deposit = item.deposit || 0;
    const biaya_admin = faker.helpers.arrayElement([2000, 3000, 5000, 10000]);

    const status_transaksi = faker.helpers.arrayElement([
      'menunggu_pembayaran',
      'dibayar',
      'menunggu_inspeksi',
      'selesai',
      'disputed',
      'CLOSED'
    ]);

    const status_deposit = faker.helpers.arrayElement(['ditahan', 'dikembalikan', 'diklaim']);
    const persen_kerusakan = (status_transaksi === 'disputed' || faker.datatype.boolean({ probability: 0.1 }))
      ? faker.number.int({ min: 5, max: 80 })
      : 0;

    const denda_kerusakan = persen_kerusakan > 0 ? Math.round((jaminan_deposit * persen_kerusakan) / 100) : 0;
    const denda_keterlambatan = faker.datatype.boolean({ probability: 0.1 }) ? faker.number.int({ min: 1, max: 3 }) * 50000 : 0;
    
    let jumlah_refund = 0;
    if (status_deposit === 'dikembalikan') {
      jumlah_refund = Math.max(0, jaminan_deposit - denda_kerusakan);
    }

    const bank_deposit = faker.datatype.boolean() ? faker.helpers.arrayElement(['BCA', 'Mandiri', 'BNI', 'BRI']) : null;

    return {
      id: faker.string.uuid(),
      penyewa_id: getPenyewaId(),
      item_id: item.id,
      tanggal_mulai,
      tanggal_selesai,
      total_harga,
      jaminan_deposit,
      biaya_admin,
      status_transaksi,
      status_deposit,
      persen_kerusakan,
      denda_kerusakan,
      denda_keterlambatan,
      jumlah_refund,
      bank_deposit,
      rekening_deposit: bank_deposit ? faker.finance.accountNumber() : null,
      nama_rekening_deposit: bank_deposit ? faker.person.fullName() : null,
      bukti_pengembalian: (status_transaksi === 'selesai' || status_transaksi === 'CLOSED') && faker.datatype.boolean()
        ? `bukti-${faker.string.uuid()}.jpg`
        : null,
      createdAt: tanggal_mulai,
      updatedAt: faker.date.between({ from: tanggal_mulai, to: new Date() })
    };
  };

  const transactionsData = faker.helpers.multiple(generateTransaction, { count: 100 });

  const { error: txError } = await supabase.from('transactions').insert(transactionsData);
  if (txError) {
    console.error('❌ Error seeding transactions:', txError.message);
    throw txError;
  }
  console.log('✅ Successfully seeded 100 transactions.');

  // ==========================================
  // STEP 4: SEED MESSAGES (200 records)
  // ==========================================
  console.log('⏳ Seeding messages...');

  const chatTemplates = [
    'Halo, apakah barang ini ready?',
    'Ya ready, silakan langsung di-booking saja.',
    'Apakah bisa diambil pagi ini?',
    'Bisa, silakan datang setelah jam 8 ya.',
    'Terima kasih barang sudah saya terima dengan baik.',
    'Sama-sama, selamat menggunakan!',
    'Halo, saya mau tanya cara pakai stabilizer ini bagaimana ya?',
    'Ada tombol power di samping kanan, tekan dan tahan 3 detik.',
    'Saya sudah mengembalikan barangnya, mohon dicek ya.',
    'Baik, akan segera saya inspeksi kondisinya.'
  ];

  const allTransactions = [...(dbTransactions || []), ...transactionsData];

  const generateMessage = () => {
    const tx = faker.helpers.arrayElement(allTransactions);
    return {
      id: faker.string.uuid(),
      id_transaksi: tx.id,
      pengirim: faker.helpers.arrayElement(['penyewa', 'pemilik']),
      pesan: faker.helpers.arrayElement(chatTemplates),
      createdAt: faker.date.between({ from: tx.tanggal_mulai, to: new Date() }),
      updatedAt: new Date()
    };
  };

  const messagesData = faker.helpers.multiple(generateMessage, { count: 200 });

  const { error: msgError } = await supabase.from('messages').insert(messagesData);
  if (msgError) {
    console.error('❌ Error seeding messages:', msgError.message);
    throw msgError;
  }
  console.log('✅ Successfully seeded 200 messages.');

  // ==========================================
  // STEP 5: SEED REVIEWS (100 records)
  // ==========================================
  console.log('⏳ Seeding reviews...');

  const reviewComments = [
    'Barang sangat bagus, sesuai deskripsi dan berfungsi dengan baik.',
    'Sewa di sini cepat responnya, barang mulus.',
    'Sangat memuaskan! Recomended seller.',
    'Barang ok, tapi respon agak lambat sedikit. Overall bagus.',
    'Lumayan lah buat harga segini.',
    'Mantap, barangnya lengkap dan bersih.',
    'Owner sangat ramah dan kooperatif.',
    'Bintang 5! Puas sekali belanja sewa di sini.',
    'Recommended! Kondisi barang 100% prima.'
  ];

  const generateReview = (index) => {
    // Map index to transaction to ensure we review existing transactions
    const tx = allTransactions[index % allTransactions.length];
    const fromDate = tx.tanggal_selesai < new Date() ? tx.tanggal_selesai : tx.tanggal_mulai;
    return {
      id: faker.string.uuid(),
      item_id: tx.item_id,
      penyewa_id: tx.penyewa_id,
      id_transaksi: tx.id,
      rating: faker.number.int({ min: 4, max: 5 }),
      komentar: faker.datatype.boolean() ? faker.helpers.arrayElement(reviewComments) : null,
      createdAt: faker.date.between({ from: fromDate, to: new Date() }),
      updatedAt: new Date()
    };
  };

  const reviewsData = faker.helpers.multiple((_, idx) => generateReview(idx), { count: 100 });

  const { error: reviewError } = await supabase.from('reviews').insert(reviewsData);
  if (reviewError) {
    console.error('❌ Error seeding reviews:', reviewError.message);
    throw reviewError;
  }
  console.log('✅ Successfully seeded 100 reviews.');

  // ==========================================
  // STEP 6: SEED NOTIFICATIONS (100 records)
  // ==========================================
  console.log('⏳ Seeding notifications...');

  const notificationTemplates = [
    { title: 'Transaksi Baru', message: 'Ada transaksi baru menunggu konfirmasi Anda.' },
    { title: 'Verifikasi KTP Berhasil', message: 'Selamat! Akun Anda telah diverifikasi oleh admin.' },
    { title: 'Verifikasi KTP Ditolak', message: 'Maaf, verifikasi KTP Anda ditolak. Harap unggah ulang.' },
    { title: 'Pembayaran Diterima', message: 'Pembayaran untuk transaksi Anda telah berhasil diterima.' },
    { title: 'Pengembalian Selesai', message: 'Barang sewaan Anda telah selesai diinspeksi oleh pemilik.' }
  ];

  const generateNotification = () => {
    const user = faker.helpers.arrayElement(allUsers);
    const template = faker.helpers.arrayElement(notificationTemplates);
    return {
      id: faker.string.uuid(),
      user_id: user.id,
      title: template.title,
      message: template.message,
      is_read: faker.datatype.boolean(),
      created_at: faker.date.past({ years: 0.2 })
    };
  };

  const notificationsData = faker.helpers.multiple(generateNotification, { count: 100 });

  const { error: notifError } = await supabase.from('notifications').insert(notificationsData);
  if (notifError) {
    console.error('❌ Error seeding notifications:', notifError.message);
    throw notifError;
  }
  console.log('✅ Successfully seeded 100 notifications.');

  console.log('🎉 Database seeding completed successfully!');
}

main().catch((error) => {
  console.error('❌ Database seeding failed:', error);
  process.exit(1);
});
