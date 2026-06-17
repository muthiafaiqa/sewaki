<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const transactions = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Modal & Upload State
const showReturnModal = ref(false);
const selectedTxId = ref(null);
const selectedFile = ref(null);
const uploadLoading = ref(false);
const uploadError = ref('');

// Review State
const reviewsList = ref([]);
const showReviewModal = ref(false);
const reviewRating = ref(5);
const reviewComment = ref('');
const reviewTx = ref(null);
const isSubmittingReview = ref(false);
const reviewError = ref('');

const formatPrice = (value) => {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

const getPriceDetails = (tx) => {
  const isNewSchema = tx.biaya_admin !== undefined && tx.biaya_admin !== null;
  
  if (isNewSchema) {
    const admin = tx.biaya_admin || 0;
    const deposit = tx.jaminan_deposit || 0;
    const grandTotal = tx.total_harga;
    const sewa = grandTotal - deposit - admin;
    return {
      sewa,
      deposit,
      admin,
      grandTotal
    };
  } else {
    const sewa = tx.total_harga || 0;
    const deposit = tx.jaminan_deposit || 0;
    const admin = 0;
    const grandTotal = sewa + deposit;
    return {
      sewa,
      deposit,
      admin,
      grandTotal
    };
  }
};

const getImageUrl = (filename) => {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getDurationDays = (start, end) => {
  const diffTime = new Date(end) - new Date(start);
  if (diffTime <= 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const fetchTransactions = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get('/api/transactions/my-rentals');
    transactions.value = response.data || [];
    await fetchReviews();
  } catch (error) {
    console.error('Fetch rentals error:', error);
    errorMessage.value = error.response?.data?.message || 'Gagal memuat riwayat transaksi Anda.';
  } finally {
    isLoading.value = false;
  }
};

const fetchReviews = async () => {
  try {
    const res = await api.get('/api/reviews');
    reviewsList.value = res.data?.data || [];
  } catch (error) {
    console.error('Fetch reviews error:', error);
  }
};

const isReviewed = (txId) => {
  return reviewsList.value.some(r => r.id_transaksi === txId);
};

const openReviewModal = (tx) => {
  reviewTx.value = tx;
  reviewRating.value = 5;
  reviewComment.value = '';
  reviewError.value = '';
  showReviewModal.value = true;
};

const closeReviewModal = () => {
  showReviewModal.value = false;
  reviewTx.value = null;
  reviewRating.value = 5;
  reviewComment.value = '';
  reviewError.value = '';
};

const submitReview = async () => {
  if (!reviewRating.value || reviewRating.value < 1 || reviewRating.value > 5) {
    reviewError.value = 'Harap berikan rating 1-5 bintang.';
    return;
  }

  isSubmittingReview.value = true;
  reviewError.value = '';

  try {
    const payload = {
      item_id: reviewTx.value.item_id,
      penyewa_id: reviewTx.value.penyewa_id,
      id_transaksi: reviewTx.value.id,
      rating: reviewRating.value,
      komentar: reviewComment.value
    };

    const response = await api.post('/api/reviews', payload);
    if (response.data?.success) {
      alert('Terima kasih atas ulasan Anda!');
      closeReviewModal();
      await fetchTransactions();
    } else {
      throw new Error(response.data?.message || 'Gagal mengirim ulasan.');
    }
  } catch (error) {
    console.error('Submit review error:', error);
    reviewError.value = error.response?.data?.message || error.message || 'Terjadi kesalahan saat mengirim ulasan.';
  } finally {
    isSubmittingReview.value = false;
  }
};

const getPaymentStatusClass = (status) => {
  if (!status) return 'status-default';
  const val = status.toLowerCase();
  if (val === 'dibayar' || val === 'selesai') return 'status-paid';
  if (val === 'menunggu_pembayaran') return 'status-pending';
  if (val === 'sedang_disewa') return 'status-renting';
  if (val === 'menunggu_inspeksi') return 'status-inspection';
  return 'status-failed';
};

const getPaymentStatusLabel = (status) => {
  if (!status) return 'Tidak Diketahui';
  const val = status.toLowerCase();
  if (val === 'dibayar') return 'Dibayar';
  if (val === 'selesai') return 'Selesai';
  if (val === 'menunggu_pembayaran') return 'Menunggu Pembayaran';
  if (val === 'sedang_disewa') return 'Sedang Disewa';
  if (val === 'menunggu_inspeksi') return 'Menunggu Verifikasi Pemilik';
  return status;
};

const getDepositStatusClass = (status) => {
  if (!status) return 'status-default';
  const val = status.toLowerCase();
  if (val === 'dikembalikan') return 'status-refunded';
  if (val === 'ditahan') return 'status-held';
  return 'status-default';
};

const getDepositStatusLabel = (status) => {
  if (!status) return 'Tidak Ada';
  const val = status.toLowerCase();
  if (val === 'ditahan') return 'Ditahan';
  if (val === 'dikembalikan') return 'Dikembalikan';
  return status;
};

const openReturnModal = (txId) => {
  selectedTxId.value = txId;
  selectedFile.value = null;
  uploadError.value = '';
  showReturnModal.value = true;
};

const closeReturnModal = () => {
  showReturnModal.value = false;
  selectedTxId.value = null;
  selectedFile.value = null;
  uploadError.value = '';
};

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
};

const handleUploadProof = async () => {
  console.log('Selected file to upload:', selectedFile.value);

  if (!selectedFile.value) {
    uploadError.value = 'Harap upload bukti pengembalian terlebih dahulu!';
    return;
  }

  uploadLoading.value = true;
  uploadError.value = '';

  try {
    const formData = new FormData();
    formData.append('bukti_pengembalian', selectedFile.value);

    // Kirim langsung ke endpoint return sebagai multipart/form-data
    const res = await api.put(`/api/transactions/return/${selectedTxId.value}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.data?.success || res.status === 200) {
      closeReturnModal();
      await fetchTransactions();
    } else {
      throw new Error(res.data?.message || 'Gagal mengirim bukti pengembalian.');
    }
  } catch (error) {
    console.error('Submit return proof error:', error);
    uploadError.value = error.response?.data?.message || error.message || 'Terjadi kesalahan saat mengirim bukti.';
  } finally {
    uploadLoading.value = false;
  }
};

onMounted(() => {
  fetchTransactions();
});
</script>

<template>
  <div class="riwayat-container">
    <div class="header-section">
      <h1>Riwayat Transaksi</h1>
      <p>Kelola dan pantau semua transaksi penyewaan barang Anda di SewaKi</p>
    </div>

    <!-- State: Loading -->
    <div v-if="isLoading" class="status-wrapper">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <p>Memuat riwayat transaksi...</p>
    </div>

    <!-- State: Error -->
    <div v-else-if="errorMessage" class="status-wrapper error-wrapper">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3>Gagal Memuat Data</h3>
      <p>{{ errorMessage }}</p>
      <button @click="fetchTransactions" class="retry-btn">Coba Lagi</button>
    </div>

    <!-- State: Empty -->
    <div v-else-if="transactions.length === 0" class="status-wrapper empty-wrapper">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="8" x2="8" y2="8"></line>
          <line x1="16" y1="12" x2="8" y2="12"></line>
          <line x1="16" y1="16" x2="8" y2="16"></line>
        </svg>
      </div>
      <h3>Belum Ada Transaksi</h3>
      <p>Anda belum pernah melakukan transaksi penyewaan barang apapun.</p>
      <router-link to="/" class="rent-now-btn">Mulai Sewa Sekarang</router-link>
    </div>

    <!-- State: Success / List of transactions -->
    <div v-else class="transactions-grid">
      <div 
        v-for="tx in transactions" 
        :key="tx.id" 
        class="transaction-card"
      >
        <!-- Card Left: Image -->
        <div class="card-image-section">
          <img 
            v-if="tx.item?.foto_barang"
            :src="getImageUrl(tx.item.foto_barang)" 
            :alt="tx.item.nama_barang" 
            class="item-img"
          />
          <div v-else class="image-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="box-icon">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
            <span>No Image</span>
          </div>
        </div>

        <!-- Card Right: Info -->
        <div class="card-info-section">
          <div class="card-header">
            <span class="tx-date">{{ formatDate(tx.createdAt) }}</span>
            <span class="tx-id">ID: #{{ tx.id.slice(0, 8) }}</span>
          </div>
          
          <h2 class="item-name">{{ tx.item?.nama_barang || 'Barang Tidak Diketahui' }}</h2>

          <div class="rent-details">
            <div class="detail-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="detail-icon">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{{ formatDate(tx.tanggal_mulai) }} - {{ formatDate(tx.tanggal_selesai) }} ({{ getDurationDays(tx.tanggal_mulai, tx.tanggal_selesai) }} Hari)</span>
            </div>
          </div>

          <hr class="card-divider" />

          <div class="price-and-badges">
            <div class="price-info">
              <span class="price-label">Total Pembayaran</span>
              <span class="price-value">{{ formatPrice(getPriceDetails(tx).grandTotal) }}</span>
              <span class="price-breakdown">
                (Sewa: {{ formatPrice(getPriceDetails(tx).sewa) }} 
                + Deposit: {{ formatPrice(getPriceDetails(tx).deposit) }}
                <span v-if="getPriceDetails(tx).admin > 0"> + Admin: {{ formatPrice(getPriceDetails(tx).admin) }}</span>)
              </span>
            </div>

            <div class="badges-container">
              <!-- Pembayaran Badge -->
              <div class="badge-wrapper">
                <span class="badge-label">Pembayaran:</span>
                <span :class="['badge', getPaymentStatusClass(tx.status_transaksi)]">
                  {{ getPaymentStatusLabel(tx.status_transaksi) }}
                </span>
              </div>

              <!-- Deposit Badge -->
              <div class="badge-wrapper">
                <span class="badge-label">Jaminan Deposit:</span>
                <span :class="['badge', getDepositStatusClass(tx.status_deposit)]">
                  {{ getDepositStatusLabel(tx.status_deposit) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="tx.status_transaksi === 'dibayar' || (tx.status_transaksi === 'selesai' && !isReviewed(tx.id))" class="card-actions">
            <button 
              v-if="tx.status_transaksi === 'dibayar'"
              @click="openReturnModal(tx.id)" 
              class="return-btn"
            >
              Kembalikan Barang
            </button>
            <button 
              v-if="tx.status_transaksi === 'selesai' && !isReviewed(tx.id)"
              @click="openReviewModal(tx)" 
              class="review-btn"
            >
              Beri Ulasan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Return Proof Modal -->
    <transition name="modal-fade">
      <div v-if="showReturnModal" class="modal-overlay" @click.self="closeReturnModal">
        <div class="modal-card">
          <!-- Modal Header -->
          <div class="modal-header">
            <h3>Bukti Pengembalian Barang</h3>
            <button @click="closeReturnModal" class="close-modal-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <p class="modal-desc">
              Silakan unggah foto bukti bahwa barang telah dikembalikan (misalnya foto resi pengiriman atau foto serah terima barang).
            </p>

            <div v-if="uploadError" class="modal-alert-error">
              {{ uploadError }}
            </div>

            <div class="form-group">
              <label for="bukti_kembali">Pilih Foto Bukti</label>
              <input 
                type="file" 
                id="bukti_kembali" 
                accept="image/*" 
                @change="handleFileChange" 
                class="file-input"
              />
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button type="button" @click="closeReturnModal" class="btn-cancel" :disabled="uploadLoading">Batal</button>
              <button 
                type="button" 
                class="btn-confirm" 
                @click="handleUploadProof"
                :disabled="uploadLoading || !selectedFile"
              >
                <span v-if="uploadLoading">Mengunggah...</span>
                <span v-else>Kirim Bukti & Kembalikan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Write Review Modal -->
    <transition name="modal-fade">
      <div v-if="showReviewModal" class="modal-overlay" @click.self="closeReviewModal">
        <div class="modal-card">
          <!-- Modal Header -->
          <div class="modal-header">
            <h3>Beri Ulasan Barang</h3>
            <button @click="closeReviewModal" class="close-modal-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <h4 class="modal-item-name">{{ reviewTx?.item?.nama_barang || 'Barang' }}</h4>

            <div v-if="reviewError" class="modal-alert-error">
              {{ reviewError }}
            </div>

            <!-- Star Rating -->
            <div class="form-group">
              <label>Pilih Rating</label>
              <div class="stars-container">
                <span 
                  v-for="star in 5" 
                  :key="star" 
                  class="star-item"
                  :class="{ active: star <= reviewRating }"
                  @click="reviewRating = star"
                >
                  ★
                </span>
              </div>
            </div>

            <!-- Comment Input -->
            <div class="form-group">
              <label for="review_comment">Komentar / Ulasan</label>
              <textarea 
                id="review_comment" 
                v-model="reviewComment" 
                placeholder="Ceritakan pengalaman Anda menyewa barang ini..." 
                rows="4"
                class="textarea-input"
              ></textarea>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button type="button" @click="closeReviewModal" class="btn-cancel" :disabled="isSubmittingReview">Batal</button>
              <button 
                type="button" 
                class="btn-confirm" 
                @click="submitReview"
                :disabled="isSubmittingReview"
              >
                <span v-if="isSubmittingReview">Mengirim...</span>
                <span v-else>Kirim Ulasan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.riwayat-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  box-sizing: border-box;
}

.header-section {
  text-align: left;
  margin-bottom: 40px;
}

.header-section h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-h);
  margin: 0 0 8px 0;
}

.header-section p {
  font-size: 15px;
  color: var(--text);
  margin: 0;
}

/* Status state wrappers */
.status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 350px;
  text-align: center;
  color: var(--text);
  gap: 16px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  box-sizing: border-box;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 44px;
  height: 44px;
}

.spinner .path {
  stroke: var(--accent);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
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

/* Error wrapper */
.error-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  margin-bottom: 8px;
}

.error-icon svg {
  width: 32px;
  height: 32px;
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

/* Empty wrapper */
.empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--accent);
  background: var(--accent-bg);
  margin-bottom: 8px;
}

.empty-icon svg {
  width: 32px;
  height: 32px;
}

.rent-now-btn {
  display: inline-block;
  padding: 12px 24px;
  background: var(--accent);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(170, 59, 255, 0.2);
}

.rent-now-btn:hover {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(170, 59, 255, 0.3);
}

/* Grid layout for transactions */
.transactions-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.transaction-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  display: grid;
  grid-template-columns: 200px 1fr;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.transaction-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

@media (max-width: 768px) {
  .transaction-card {
    grid-template-columns: 1fr;
  }
  .card-image-section {
    aspect-ratio: 16 / 9;
    width: 100%;
  }
}

/* Image Section */
.card-image-section {
  position: relative;
  background: var(--bg-hover);
  border-right: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

@media (max-width: 768px) {
  .card-image-section {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.box-icon {
  width: 40px;
  height: 40px;
  color: rgba(170, 59, 255, 0.2);
}

/* Info Section */
.card-info-section {
  padding: 24px;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tx-date {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.tx-id {
  font-size: 13px;
  font-family: var(--mono);
  background: var(--code-bg);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--text-h);
}

.item-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.rent-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
}

.detail-icon {
  width: 16px;
  height: 16px;
  color: var(--accent);
  flex-shrink: 0;
}

.card-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 16px 0;
}

.price-and-badges {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 576px) {
  .price-and-badges {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.price-label {
  font-size: 12px;
  color: var(--text);
  font-weight: 500;
  margin-bottom: 4px;
}

.price-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.price-breakdown {
  font-size: 11px;
  color: var(--text);
  margin-top: 4px;
}

.badges-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

.badge-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.badge-label {
  color: var(--text);
  font-weight: 500;
}

.badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 30px;
  text-transform: capitalize;
  text-align: center;
}

/* Badge styles */
.status-paid {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-pending {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.2);
}

.status-failed {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-held {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.2);
}

.status-refunded {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-default {
  background: var(--code-bg);
  color: var(--text);
  border: 1px solid var(--border);
}

.status-renting {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-inspection {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.card-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.return-btn {
  background: var(--accent);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
  box-shadow: 0 4px 10px rgba(170, 59, 255, 0.2);
}

.return-btn:hover {
  opacity: 0.9;
}

.return-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Premium Modal Styles */
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
  background: var(--bg, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-h, #2d3748);
}

.close-modal-btn {
  background: none;
  border: none;
  color: var(--text-muted, #718096);
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

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.modal-desc {
  font-size: 14.5px;
  color: var(--text, #4a5568);
  line-height: 1.6;
  margin: 0;
}

.modal-alert-error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  color: var(--text-muted, #718096);
  font-weight: 500;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  background: var(--bg-hover, #f7fafc);
  color: var(--text-h, #2d3748);
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel {
  background: transparent;
  color: var(--text, #4a5568);
  border: 1px solid var(--border, #e2e8f0);
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bg-hover, #f7fafc);
  color: var(--text-h, #2d3748);
}

.btn-confirm {
  background: var(--accent, #aa3bff);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(170, 59, 255, 0.2);
}

.btn-confirm:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
}

.btn-confirm:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.review-btn {
  background: var(--accent, #aa3bff);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(170, 59, 255, 0.15);
}

.review-btn:hover {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(170, 59, 255, 0.25);
}

.stars-container {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.star-item {
  font-size: 32px;
  color: #e2e8f0;
  cursor: pointer;
  transition: color 0.1s ease;
}

.star-item.active {
  color: #ffb800;
}

.textarea-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  background: var(--bg-hover, #f7fafc);
  color: var(--text-h, #2d3748);
  font-size: 14.5px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.textarea-input:focus {
  outline: none;
  border-color: var(--accent, #aa3bff);
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card {
  transform: scale(0.9) translateY(20px);
}

.modal-fade-leave-to .modal-card {
  transform: scale(0.95);
}
</style>
