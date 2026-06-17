<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();

const item = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');

// Modal & Form State
const showModal = ref(false);
const isSubmitting = ref(false);

const todayStr = new Date().toISOString().split('T')[0];
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const startDate = ref(todayStr);
const endDate = ref(tomorrowStr);

const itemId = route.params.id;

// Bank details for deposit refund
const bankDeposit = ref('BCA');
const rekeningDeposit = ref('');
const namaRekeningDeposit = ref('');

const formatPrice = (value) => {
  if (!value && value !== 0) return 'Hubungi Pemilik';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

const getImageUrl = (filename) => {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
};

const fetchItemDetails = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get(`/api/items/${itemId}`);
    item.value = response.data?.data || response.data;
  } catch (error) {
    console.error('Fetch item details error:', error);
    errorMessage.value = error.response?.data?.message || 'Gagal memuat rincian barang sewa.';
  } finally {
    isLoading.value = false;
  }
};

const reviews = ref([]);

const fetchReviews = async () => {
  try {
    const response = await api.get(`/api/reviews/${itemId}`);
    reviews.value = response.data?.data || [];
  } catch (error) {
    console.error('Fetch reviews error:', error);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

onMounted(() => {
  fetchItemDetails();
  fetchReviews();
});

// Computed Properties for Receipt
const pricePerDay = computed(() => {
  if (!item.value) return 0;
  return item.value.harga_sewa_per_hari !== undefined ? item.value.harga_sewa_per_hari : (item.value.price || 0);
});

const depositAmount = computed(() => {
  if (!item.value) return 0;
  return item.value.deposit !== undefined ? item.value.deposit : 0;
});

const durationDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0;
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  const diffTime = end - start;
  if (diffTime <= 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const totalRent = computed(() => {
  return pricePerDay.value * durationDays.value;
});

const adminFee = ref(10000); // Biaya Admin

const grandTotal = computed(() => {
  if (durationDays.value <= 0) return 0;
  return totalRent.value + depositAmount.value + adminFee.value;
});

// Trigger Modal open on Sewa Sekarang
const handleRentTrigger = () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const submitTransaction = async () => {
  if (durationDays.value <= 0) return;

  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }

  const kycStatus = localStorage.getItem('kyc_status') || 'unverified';
  if (kycStatus.toLowerCase() !== 'verified') {
    alert('Anda harus mengunggah KTP dan menunggu persetujuan Admin sebelum dapat melanjutkan');
    router.push('/profile');
    return;
  }

  if (!bankDeposit.value || !rekeningDeposit.value || !namaRekeningDeposit.value) {
    alert('Mohon lengkapi data rekening bank untuk keperluan pengembalian jaminan deposit.');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      item_id: item.value.id,
      tanggal_mulai: new Date(startDate.value).toISOString(),
      tanggal_selesai: new Date(endDate.value).toISOString(),
      total_harga: totalRent.value,
      jaminan_deposit: depositAmount.value,
      biaya_admin: adminFee.value,
      bank_deposit: bankDeposit.value,
      rekening_deposit: rekeningDeposit.value,
      nama_rekening_deposit: namaRekeningDeposit.value
    };

    const response = await api.post('/api/transactions', payload);
    const invoiceUrl = response.data?.invoice_url;
    if (invoiceUrl) {
      window.location.href = invoiceUrl;
    } else {
      alert('Gagal mendapatkan URL pembayaran dari server.');
    }
  } catch (error) {
    console.error('Submit transaction error:', error);
    alert(error.response?.data?.message || 'Gagal memproses transaksi sewa.');
  } finally {
    isSubmitting.value = false;
  }
};

const hubungiPemilik = () => {
  if (!item.value) return;
  const pemilik = item.value.Pemilik || item.value.pemilik || item.value.User || item.value.user;
  const targetNomor = pemilik?.nomor_hp || pemilik?.phone || item.value.nomor_hp || item.value.phone;
  if (!targetNomor) {
    alert('Nomor WhatsApp pemilik tidak ditemukan.');
    return;
  }
  let formattedNumber = String(targetNomor).trim();
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '62' + formattedNumber.slice(1);
  }
  const namaBarang = item.value.nama_barang || item.value.name || 'Barang';
  const teks = `Halo, saya melihat barang ${namaBarang} di Sewaki. Apakah barang ini masih tersedia?`;
  window.open(`https://wa.me/${formattedNumber}?text=${encodeURIComponent(teks)}`, '_blank');
};
</script>

<template>
  <div class="detail-container">
    <!-- Back Navigation -->
    <div class="back-nav">
      <router-link to="/" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-icon">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Kembali ke Katalog
      </router-link>
    </div>

    <!-- State: Loading -->
    <div v-if="isLoading" class="status-wrapper">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <p>Memuat rincian barang...</p>
    </div>

    <!-- State: Error -->
    <div v-else-if="errorMessage || !item" class="status-wrapper error-wrapper">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3>Gagal Memuat Rincian</h3>
      <p>{{ errorMessage || 'Barang tidak ditemukan' }}</p>
      <button @click="fetchItemDetails" class="retry-btn">Coba Lagi</button>
    </div>

    <!-- State: Success / Content -->
    <div v-else class="detail-card">
      <div class="detail-grid">
        <!-- Left Column: Image Area -->
        <div class="image-column">
          <div class="detail-image-wrapper">
            <img 
              v-if="item.foto_barang"
              :src="getImageUrl(item.foto_barang)" 
              :alt="item.nama_barang || item.name" 
              class="detail-image"
            />
            <div v-else class="detail-image-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="box-icon-large">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              <span>Belum Ada Foto</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Info & Action Area -->
        <div class="info-column">
          <div class="category-badge">{{ item.category || 'Barang Sewa' }}</div>
          <h1 class="item-title">{{ item.nama_barang || item.name }}</h1>
          
          <div class="price-section">
            <span class="price-value">{{ formatPrice(item.harga_sewa_per_hari !== undefined ? item.harga_sewa_per_hari : item.price) }}</span>
            <span class="price-period">/ hari</span>
          </div>

          <hr class="divider" />

          <div class="meta-section">
            <!-- Location Row -->
            <div class="meta-row">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div class="meta-content">
                <span class="meta-label">Lokasi Pengambilan</span>
                <span class="meta-text">{{ item.lokasi || item.location || 'Lokasi tidak ditentukan' }}</span>
              </div>
            </div>

            <!-- Stock Row -->
            <div class="meta-row">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
              <div class="meta-content">
                <span class="meta-label">Stok Tersedia</span>
                <span class="meta-text">{{ item.stok !== undefined ? item.stok : (item.stock || 1) }} unit</span>
              </div>
            </div>

            <!-- Deposit Row -->
            <div class="meta-row">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <line x1="12" y1="4" x2="12" y2="20"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
              </svg>
              <div class="meta-content">
                <span class="meta-label">Uang Jaminan / Deposit</span>
                <span class="meta-text">{{ formatPrice(item.deposit) }}</span>
              </div>
            </div>
          </div>

          <hr class="divider" />

          <!-- Description Section -->
          <div class="description-section">
            <h2>Deskripsi Barang</h2>
            <p>{{ item.deskripsi || item.description || 'Tidak ada deskripsi untuk barang ini.' }}</p>
          </div>

          <!-- Reviews Section -->
          <div class="reviews-section">
            <h2>Ulasan Penyewa</h2>
            <div v-if="reviews.length === 0" class="no-reviews">
              Belum ada ulasan untuk barang ini.
            </div>
            <div v-else class="reviews-list">
              <div v-for="rev in reviews" :key="rev.id" class="review-card-item">
                <div class="review-header">
                  <span class="reviewer-name">Penyewa #{{ rev.penyewa_id.slice(0, 8) }}</span>
                  <div class="review-rating">
                    <span v-for="star in 5" :key="star" class="star-display" :class="{ filled: star <= rev.rating }">★</span>
                  </div>
                </div>
                <p class="review-comment">{{ rev.komentar || 'Tidak ada komentar.' }}</p>
                <span class="review-date">{{ formatDate(rev.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Rent Button Trigger & Chat Pemilik -->
          <div class="action-buttons-group">
            <button @click="handleRentTrigger" class="rent-btn-large">Sewa Sekarang</button>
            <button @click="hubungiPemilik" class="chat-owner-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="wa-icon-large">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              Chat Pemilik
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Rent Confirmation Modal -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <!-- Modal Header -->
          <div class="modal-header">
            <h3>Konfirmasi Penyewaan</h3>
            <button @click="closeModal" class="close-modal-btn" aria-label="Tutup modal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="close-icon">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <h4 class="modal-item-name">{{ item.nama_barang || item.name }}</h4>

            <!-- Date Fields -->
            <div class="date-fields">
              <div class="date-group">
                <label for="startDate">Tanggal Mulai Sewa</label>
                <div class="input-wrapper">
                  <input 
                    id="startDate" 
                    type="date" 
                    v-model="startDate" 
                    :min="todayStr"
                  />
                </div>
              </div>
              <div class="date-group">
                <label for="endDate">Tanggal Selesai Sewa</label>
                <div class="input-wrapper">
                  <input 
                    id="endDate" 
                    type="date" 
                    v-model="endDate" 
                    :min="startDate || todayStr"
                  />
                </div>
              </div>
            </div>

            <!-- Error State inside Modal -->
            <div v-if="durationDays <= 0" class="date-warning">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>Tanggal selesai harus setelah tanggal mulai sewa.</span>
            </div>

            <!-- Bill Breakdown / Receipt -->
            <div v-else class="receipt-card">
              <h4>Struk Rincian Biaya</h4>
              <div class="receipt-list">
                <div class="receipt-row">
                  <span class="receipt-label">Harga Sewa ({{ formatPrice(pricePerDay) }} × {{ durationDays }} hari)</span>
                  <span class="receipt-val">{{ formatPrice(totalRent) }}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Jaminan Deposit (Refundable)</span>
                  <span class="receipt-val">{{ formatPrice(depositAmount) }}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-label">Biaya Admin</span>
                  <span class="receipt-val">{{ formatPrice(adminFee) }}</span>
                </div>
                <div class="receipt-divider"></div>
                <div class="receipt-row grand-total-row">
                  <span class="grand-total-label">Total Tagihan</span>
                  <span class="grand-total-val">{{ formatPrice(grandTotal) }}</span>
                </div>
              </div>
            </div>

            <!-- Rekening Pengembalian Deposit Form -->
            <div v-if="durationDays > 0" class="bank-form-section">
              <h4 class="form-title">Rekening Pengembalian Deposit</h4>
              <p class="form-subtitle">Pastikan data benar untuk keperluan pengembalian dana jaminan deposit.</p>
              
              <div class="form-group">
                <label for="bankDeposit">Nama Bank Tujuan</label>
                <div class="select-wrapper">
                  <select id="bankDeposit" v-model="bankDeposit" required>
                    <option value="BCA">BCA</option>
                    <option value="BNI">BNI</option>
                    <option value="MANDIRI">MANDIRI</option>
                    <option value="BRI">BRI</option>
                    <option value="DANA">DANA</option>
                    <option value="OVO">OVO</option>
                    <option value="GOPAY">GOPAY</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="rekeningDeposit">Nomor Rekening / E-Wallet</label>
                <input 
                  id="rekeningDeposit" 
                  type="text" 
                  v-model="rekeningDeposit" 
                  placeholder="Contoh: 7012345678" 
                  required 
                />
              </div>

              <div class="form-group">
                <label for="namaRekeningDeposit">Nama Pemilik Rekening</label>
                <input 
                  id="namaRekeningDeposit" 
                  type="text" 
                  v-model="namaRekeningDeposit" 
                  placeholder="Contoh: Budi Santoso" 
                  required 
                />
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button @click="closeModal" class="btn-cancel" :disabled="isSubmitting">Batal</button>
            <button 
              @click="submitTransaction" 
              class="btn-pay" 
              :disabled="durationDays <= 0 || isSubmitting"
            >
              <span v-if="isSubmitting">Memproses...</span>
              <span v-else>Lanjut ke Pembayaran</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.detail-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  box-sizing: border-box;
}

.back-nav {
  margin-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--accent);
}

.arrow-icon {
  width: 18px;
  height: 18px;
}

/* Status wrapper styling */
.status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: var(--text);
  gap: 16px;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 40px;
  height: 40px;
}

.spinner .path {
  stroke: var(--accent);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

.error-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.retry-btn {
  padding: 10px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.retry-btn:hover {
  opacity: 0.9;
}

/* Card Styling */
.detail-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow);
  transition: border-color 0.3s ease;
}

.detail-card:hover {
  border-color: var(--accent-border);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 48px;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .detail-card {
    padding: 24px;
  }
}

/* Image column styles */
.image-column {
  width: 100%;
}

.detail-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-hover);
}

.detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 12px;
}

.box-icon-large {
  width: 72px;
  height: 72px;
  color: rgba(170, 59, 255, 0.25);
}

/* Info Column Styles */
.info-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.category-badge {
  background: var(--accent-bg);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid var(--accent-border);
  margin-bottom: 16px;
}

.item-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-h);
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 24px;
}

.price-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--accent);
}

.price-period {
  font-size: 15px;
  color: var(--text);
}

.divider {
  width: 100%;
  border: 0;
  border-top: 1px solid var(--border);
  margin: 16px 0;
}

.meta-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.meta-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.meta-icon {
  width: 20px;
  height: 20px;
  color: var(--accent);
  flex-shrink: 0;
  margin-top: 3px;
}

.meta-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.meta-label {
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 500;
}

.meta-text {
  font-size: 15px;
  color: var(--text-h);
  font-weight: 600;
  margin-top: 2px;
}

.description-section {
  text-align: left;
  margin-bottom: 32px;
  width: 100%;
}

.description-section h2 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0 0 10px 0;
}

.description-section p {
  font-size: 14.5px;
  color: var(--text);
  line-height: 1.6;
  margin: 0;
}

.rent-btn-large {
  width: 100%;
  padding: 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(170, 59, 255, 0.3);
}

.rent-btn-large:hover {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(170, 59, 255, 0.4);
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-h);
}

.close-modal-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-modal-btn:hover {
  color: #ef4444;
}

.close-icon {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: 70vh;
  text-align: left;
}

.modal-item-name {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: var(--text-h);
  font-weight: 600;
}

.date-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 480px) {
  .date-fields {
    grid-template-columns: 1fr;
  }
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-group label {
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 500;
}

.date-group .input-wrapper {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.date-group input[type="date"] {
  width: 100%;
  background: none;
  border: none;
  padding: 10px 12px;
  color: var(--text-h);
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}

.date-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  padding: 12px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  margin-bottom: 16px;
  line-height: 1.4;
}

.warning-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.receipt-card {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px;
}

.receipt-card h4 {
  margin: 0 0 14px 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-h);
}

.receipt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  font-size: 13.5px;
  color: var(--text);
}

.receipt-val {
  color: var(--text-h);
  font-weight: 500;
}

.receipt-divider {
  border-top: 1px dashed var(--border);
  margin: 6px 0;
}

.grand-total-row {
  font-size: 15px;
  font-weight: 700;
}

.grand-total-label {
  color: var(--text-h);
}

.grand-total-val {
  color: var(--accent);
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 10px 16px;
  background: var(--bg-hover);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-cancel:hover {
  color: var(--text-h);
  border-color: var(--text-muted);
}

.btn-pay {
  padding: 10px 20px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(170, 59, 255, 0.25);
}

.btn-pay:hover:not(:disabled) {
  opacity: 0.95;
  box-shadow: 0 6px 16px rgba(170, 59, 255, 0.35);
}

.btn-pay:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  transform: scale(0.9) translateY(20px);
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.bank-form-section {
  margin-top: 24px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-h);
}

.form-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--accent);
  font-weight: 500;
  line-height: 1.4;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.form-group label {
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 500;
}

.select-wrapper,
.form-group input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.form-group select,
.form-group input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  background: none;
  border: none;
  color: var(--text-h);
  font-family: inherit;
  font-size: 14px;
  outline: none;
}

.select-wrapper {
  overflow: hidden;
}

.form-group select {
  cursor: pointer;
}

/* Reviews Styling */
.reviews-section {
  width: 100%;
  text-align: left;
  margin-top: 24px;
  margin-bottom: 24px;
}

.reviews-section h2 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-h);
  margin-bottom: 14px;
}

.no-reviews {
  font-size: 14px;
  color: var(--text-muted);
  padding: 16px;
  background: var(--bg-hover);
  border: 1px dashed var(--border);
  border-radius: 8px;
  text-align: center;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-card-item {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  transition: border-color 0.2s;
}

.review-card-item:hover {
  border-color: var(--accent-border);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.reviewer-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-h);
}

.review-rating {
  display: flex;
  gap: 2px;
}

.star-display {
  font-size: 16px;
  color: #e2e8f0;
}

.star-display.filled {
  color: #ffb800;
}

.review-comment {
  font-size: 14px;
  color: var(--text);
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.review-date {
  font-size: 11px;
  color: var(--text-muted);
}

/* Chat Pemilik Button Styles */
.action-buttons-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 16px;
}

.chat-owner-btn {
  width: 100%;
  padding: 13px;
  background: transparent;
  color: #25d366;
  border: 2px solid #25d366;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.chat-owner-btn:hover {
  background: rgba(37, 211, 102, 0.05);
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.15);
  transform: translateY(-1px);
}

.wa-icon-large {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}
</style>
