<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import InspectionForm from '../components/InspectionForm.vue';

const rentals = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');
const currentUserId = ref('');

// Modal / Disbursement State
const showDisburseModal = ref(false);
const selectedTx = ref(null);
const disburseLoading = ref(false);
const disburseError = ref('');

// Bank Form Fields
const bankCode = ref('BCA');
const accountNumber = ref('');
const accountHolderName = ref('');
const disburseAmount = ref(0);

const bankList = [
  { code: 'BCA', name: 'Bank Central Asia (BCA)' },
  { code: 'MANDIRI', name: 'Bank Mandiri' },
  { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'PERMATA', name: 'Permata Bank' }
];

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

const fetchData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    // 1. Ambil profile untuk tahu user ID kita
    const profileRes = await api.get('/api/auth/profile');
    const user = profileRes.data?.data || profileRes.data;
    currentUserId.value = user?.id || '';

    // 2. Ambil semua transaksi
    const txRes = await api.get('/api/transactions');
    const allTransactions = txRes.data?.data || txRes.data || [];

    // 3. Saring transaksi yang item-nya adalah milik user ini
    rentals.value = allTransactions.filter(
      (tx) => tx.item?.pemilik_id === currentUserId.value
    );
  } catch (error) {
    console.error('Fetch owner rentals error:', error);
    errorMessage.value = error.response?.data?.message || 'Gagal memuat data kelola pesanan.';
  } finally {
    isLoading.value = false;
  }
};

const openDisburseDialog = (tx) => {
  selectedTx.value = tx;
  disburseAmount.value = tx.jaminan_deposit || 0;
  disburseError.value = '';
  showDisburseModal.value = true;
};

const closeDisburseDialog = () => {
  showDisburseModal.value = false;
  selectedTx.value = null;
};

const onInspectionCompleted = async () => {
  setTimeout(() => {
    closeDisburseDialog();
  }, 2000);
  await fetchData();
};

const hubungiWhatsApp = (pesanan) => {
  const nomorHp = pesanan.User?.nomor_hp || pesanan.penyewa?.phone || pesanan.User?.phone || pesanan.penyewa?.nomor_hp || pesanan.nomor_hp || pesanan.phone;
  if (!nomorHp) {
    alert('Nomor WhatsApp penyewa tidak ditemukan.');
    return;
  }
  let formattedNumber = String(nomorHp).trim();
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '62' + formattedNumber.slice(1);
  }
  const teks = `Halo, saya pemilik barang. Saya ingin berdiskusi mengenai pesanan sewa Anda di Sewaki.`;
  window.open(`https://wa.me/${formattedNumber}?text=${encodeURIComponent(teks)}`, '_blank');
};


const getStatusClass = (status) => {
  if (!status) return 'status-default';
  const val = status.toLowerCase();
  if (val === 'dibayar' || val === 'selesai' || val === 'dikembalikan') return 'status-success';
  if (val === 'menunggu_pembayaran' || val === 'ditahan') return 'status-warning';
  return 'status-danger';
};

const getStatusLabel = (status) => {
  if (!status) return '-';
  const val = status.toLowerCase();
  if (val === 'dibayar') return 'Dibayar';
  if (val === 'selesai') return 'Selesai';
  if (val === 'menunggu_pembayaran') return 'Menunggu Pembayaran';
  if (val === 'ditahan') return 'Ditahan';
  if (val === 'dikembalikan') return 'Dikembalikan';
  return status;
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="kelola-container">
    <div class="header-section">
      <div class="title-area">
        <h1>Kelola Pesanan Masuk</h1>
        <p>Pantau penyewa barang Anda dan cairkan dana deposit jaminan setelah masa sewa berakhir</p>
      </div>
      <button @click="fetchData" class="refresh-btn" :disabled="isLoading">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" :class="{ 'spinning': isLoading }">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        Segarkan
      </button>
    </div>

    <!-- Alert Box for Success -->
    <transition name="fade">
      <div v-if="successMessage" class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ successMessage }}</span>
      </div>
    </transition>

    <!-- State: Loading -->
    <div v-if="isLoading" class="status-wrapper">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <p>Memuat daftar pesanan masuk...</p>
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
      <h3>Gagal Memuat Pesanan</h3>
      <p>{{ errorMessage }}</p>
      <button @click="fetchData" class="retry-btn">Coba Lagi</button>
    </div>

    <!-- State: Empty -->
    <div v-else-if="rentals.length === 0" class="status-wrapper empty-wrapper">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="13" y2="17"></line>
        </svg>
      </div>
      <h3>Belum Ada Pesanan Masuk</h3>
      <p>Barang-barang sewaan milik Anda belum ada yang dipesan oleh penyewa saat ini.</p>
    </div>

    <!-- State: Success Table -->
    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="rentals-table">
          <thead>
            <tr>
              <th>Detail Barang</th>
              <th>Penyewa</th>
              <th>Masa Sewa & Durasi</th>
              <th>Biaya Sewa / Deposit</th>
              <th>Status</th>
              <th class="actions-header">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in rentals" :key="tx.id" class="table-row">
              <!-- Detail Barang -->
              <td>
                <div class="item-cell">
                  <div class="item-img-wrapper">
                    <img 
                      v-if="tx.item?.foto_barang"
                      :src="getImageUrl(tx.item.foto_barang)" 
                      :alt="tx.item.nama_barang" 
                      class="item-thumb"
                    />
                    <div v-else class="item-thumb-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="box-icon">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="item-info">
                    <span class="item-name">{{ tx.item?.nama_barang || 'N/A' }}</span>
                    <span class="tx-id-label">TX-ID: #{{ tx.id.slice(0, 8) }}</span>
                  </div>
                </div>
              </td>

              <!-- Penyewa -->
              <td>
                <div class="renter-cell">
                  <span class="renter-id">User ID:</span>
                  <span class="renter-hash">#{{ tx.penyewa_id.slice(0, 8) }}</span>
                </div>
              </td>

              <!-- Masa Sewa & Durasi -->
              <td>
                <div class="date-cell">
                  <span class="date-range">{{ formatDate(tx.tanggal_mulai) }} - {{ formatDate(tx.tanggal_selesai) }}</span>
                  <span class="duration-label">{{ getDurationDays(tx.tanggal_mulai, tx.tanggal_selesai) }} Hari</span>
                </div>
              </td>

              <!-- Biaya Sewa / Deposit -->
              <td>
                <div class="price-cell">
                  <div class="price-row">
                    <span class="label">Sewa:</span>
                    <span class="value">{{ formatPrice(getPriceDetails(tx).sewa) }}</span>
                  </div>
                  <div class="price-row deposit-row">
                    <span class="label">Deposit:</span>
                    <span class="value accent">{{ formatPrice(getPriceDetails(tx).deposit) }}</span>
                  </div>
                  <div v-if="getPriceDetails(tx).admin > 0" class="price-row">
                    <span class="label">Admin:</span>
                    <span class="value">{{ formatPrice(getPriceDetails(tx).admin) }}</span>
                  </div>
                  <div v-if="getPriceDetails(tx).admin > 0" class="price-row" style="border-top: 1px dashed #e2e8f0; margin-top: 4px; padding-top: 4px;">
                    <span class="label" style="font-weight: 700;">Total:</span>
                    <span class="value" style="font-weight: 700; color: var(--accent);">{{ formatPrice(getPriceDetails(tx).grandTotal) }}</span>
                  </div>
                </div>
              </td>

              <!-- Status -->
              <td>
                <div class="status-cell">
                  <div class="status-wrapper-inline">
                    <span class="status-label">Bayar:</span>
                    <span :class="['badge', getStatusClass(tx.status_transaksi)]">
                      {{ getStatusLabel(tx.status_transaksi) }}
                    </span>
                  </div>
                  <div class="status-wrapper-inline">
                    <span class="status-label">Deposit:</span>
                    <span :class="['badge', getStatusClass(tx.status_deposit)]">
                      {{ getStatusLabel(tx.status_deposit) }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Tindakan -->
              <td class="actions-cell">
                <div class="actions-group">
                  <button 
                    v-if="tx.status_transaksi?.toLowerCase() === 'menunggu_inspeksi'" 
                    @click="openDisburseDialog(tx)" 
                    class="disburse-btn"
                  >
                    Selesaikan & Cairkan Deposit
                  </button>
                  <span v-else-if="tx.status_transaksi?.toLowerCase() === 'selesai'" class="completed-label">
                    Selesai / Dicairkan
                  </span>
                  <span v-else-if="tx.status_transaksi?.toLowerCase() === 'dibayar'" class="completed-label">
                    Sedang Disewa
                  </span>
                  <span v-else class="completed-label">
                    Menunggu Pembayaran
                  </span>

                  <button 
                    @click="hubungiWhatsApp(tx)" 
                    class="whatsapp-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="wa-icon">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    Chat Penyewa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm & Disburse Bank Input Modal -->
    <transition name="modal-fade">
      <div v-if="showDisburseModal" class="modal-overlay" @click.self="closeDisburseDialog">
        <div style="position: relative; max-width: 500px; width: 100%;">
          <button @click="closeDisburseDialog" class="close-modal-btn" style="position: absolute; right: 15px; top: 15px; z-index: 10;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <InspectionForm v-if="selectedTx && selectedTx.status_transaksi?.toLowerCase() === 'menunggu_inspeksi'" :transaction="selectedTx" @completed="onInspectionCompleted" />
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.kelola-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
  box-sizing: border-box;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }
}

.title-area h1 {
  font-size: 30px;
  font-weight: 700;
  color: var(--text-h);
  margin: 0 0 6px 0;
}

.title-area p {
  font-size: 14.5px;
  color: var(--text);
  margin: 0;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-h);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Alert Boxes */
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  font-size: 14.5px;
  margin-bottom: 24px;
  line-height: 1.5;
  box-sizing: border-box;
}

.alert-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.alert-success {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

/* States */
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
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

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

/* Table Card */
.table-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 8px;
  box-shadow: var(--shadow);
  transition: border-color 0.3s ease;
}

.table-card:hover {
  border-color: var(--accent-border);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.rentals-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.rentals-table th {
  padding: 16px 20px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  background: var(--bg-hover);
}

.rentals-table th:first-child {
  border-top-left-radius: 12px;
}

.rentals-table th:last-child {
  border-top-right-radius: 12px;
}

.table-row {
  transition: background 0.15s ease;
}

.table-row:hover {
  background: var(--bg-hover);
}

.rentals-table td {
  padding: 18px 20px;
  font-size: 14.5px;
  color: var(--text-h);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.rentals-table tr:last-child td {
  border-bottom: none;
}

/* Item Cell */
.item-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-img-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-hover);
  flex-shrink: 0;
}

.item-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.item-thumb-placeholder svg {
  width: 24px;
  height: 24px;
  color: rgba(170, 59, 255, 0.25);
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 600;
  color: var(--text-h);
  line-height: 1.3;
}

.tx-id-label {
  font-size: 11.5px;
  font-family: var(--mono);
  color: var(--text);
  margin-top: 2px;
}

/* Renter Cell */
.renter-cell {
  display: flex;
  flex-direction: column;
}

.renter-id {
  font-size: 12px;
  color: var(--text);
}

.renter-hash {
  font-family: var(--mono);
  font-size: 13.5px;
  font-weight: 600;
}

/* Date Cell */
.date-cell {
  display: flex;
  flex-direction: column;
}

.date-range {
  font-size: 13.5px;
  color: var(--text-h);
  font-weight: 500;
}

.duration-label {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
  margin-top: 2px;
}

/* Price Cell */
.price-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  gap: 10px;
}

.price-row .label {
  color: var(--text);
}

.price-row .value {
  font-weight: 500;
  color: var(--text-h);
}

.price-row.deposit-row .value.accent {
  color: var(--accent);
  font-weight: 600;
}

/* Status Cell */
.status-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-wrapper-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
  gap: 8px;
}

.status-label {
  color: var(--text);
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: capitalize;
}

.status-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-warning {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.2);
}

.status-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-default {
  background: var(--code-bg);
  color: var(--text);
}

/* Actions */
.actions-header,
.actions-cell {
  text-align: right;
}

.disburse-btn {
  padding: 8px 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.disburse-btn:hover {
  opacity: 0.95;
  box-shadow: 0 4px 10px rgba(170, 59, 255, 0.2);
}

.completed-label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.actions-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.whatsapp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  background: #25d366;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.whatsapp-btn:hover {
  background: #20ba59;
  box-shadow: 0 4px 10px rgba(37, 211, 102, 0.25);
  transform: translateY(-1px);
}

.wa-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

/* Premium Modal */
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
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
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
  font-size: 17px;
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

.close-modal-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.info-alert {
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13.5px;
  color: var(--text-h);
  line-height: 1.5;
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
  color: var(--text-muted);
  font-weight: 500;
}

.select-wrapper,
.form-group input {
  background: var(--bg-hover);
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-h);
}

.btn-confirm {
  background: var(--accent);
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

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
