<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const users = ref([]);
const isLoading = ref(true);
const actionLoading = ref({});
const errorMessage = ref('');
const successMessage = ref('');
const totalPendapatan = ref(0);

const formatCurrency = (value) => {
  if (!value) return '0';
  return value.toLocaleString('id-ID');
};

const fetchRevenue = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const response = await api.get('/api/admin/revenue', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
    totalPendapatan.value = response.data?.totalPendapatanAdmin || 0;
  } catch (error) {
    console.error('Fetch revenue error:', error);
  }
};

// Lightbox/Modal State
const showModal = ref(false);
const selectedUser = ref(null);
const activeKtpUrl = ref('');
const activeUserName = ref('');

// Ambil data user yang unverified atau pending
const fetchPendingUsers = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get('/api/auth/kyc-list');
    // Backend mengembalikan response.data.data
    users.value = response.data?.data || response.data || [];
  } catch (error) {
    console.error('Fetch pending users error:', error);
    errorMessage.value = error.response?.data?.message || 'Gagal memuat daftar pengajuan KYC.';
  } finally {
    isLoading.value = false;
  }
};

// Fungsi untuk menyetujui KYC
const handleApprove = async (userId) => {
  actionLoading.value[userId] = true;
  errorMessage.value = '';
  successMessage.value = '';
  
  try {
    const response = await api.put(`/api/auth/verify-kyc/${userId}`, { status: 'verified' });
    successMessage.value = response.data?.message || 'Pengguna berhasil diverifikasi!';
    
    // Auto close success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 4000);

    // Muat ulang tabel
    await fetchPendingUsers();
  } catch (error) {
    console.error('Approve KYC error:', error);
    errorMessage.value = error.response?.data?.message || 'Gagal menyetujui verifikasi KTP.';
  } finally {
    actionLoading.value[userId] = false;
  }
};

// Fungsi untuk menolak KYC
const handleReject = async (userId) => {
  actionLoading.value[userId] = true;
  errorMessage.value = '';
  successMessage.value = '';
  
  try {
    const response = await api.put(`/api/auth/reject-kyc/${userId}`);
    successMessage.value = response.data?.message || 'Pengajuan KTP berhasil ditolak!';
    
    // Auto close success message after 4 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 4000);

    // Muat ulang tabel
    await fetchPendingUsers();
  } catch (error) {
    console.error('Reject KYC error:', error);
    errorMessage.value = error.response?.data?.message || 'Gagal menolak verifikasi KTP.';
  } finally {
    actionLoading.value[userId] = false;
  }
};

// Ambil URL lengkap foto KTP
const getKtpUrl = (filename) => {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  const baseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL || 'https://sewaki-production.up.railway.app';
  return `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
};

// Buka Modal Foto KTP
const openKtpModal = (user) => {
  if (!user.foto_ktp) return;
  selectedUser.value = user;
  activeKtpUrl.value = getKtpUrl(user.foto_ktp);
  activeUserName.value = user.nama;
  showModal.value = true;
};

// Tutup Modal
const closeModal = () => {
  showModal.value = false;
  selectedUser.value = null;
  activeKtpUrl.value = '';
  activeUserName.value = '';
};

onMounted(() => {
  fetchPendingUsers();
  fetchRevenue();
});
</script>

<template>
  <div class="admin-dashboard-container">
    <!-- Card Pendapatan Platform -->
    <div class="revenue-card">
      <div class="revenue-icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="revenue-icon">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      </div>
      <div class="revenue-info">
        <span class="revenue-label">Total Pendapatan Platform</span>
        <span class="revenue-value">Rp {{ formatCurrency(totalPendapatan) }}</span>
      </div>
    </div>

    <div class="dashboard-header">
      <div class="header-title-area">
        <h1>Dashboard Verifikasi KYC</h1>
        <p>Kelola dan setujui verifikasi identitas (KTP) pengguna SewaKi</p>
      </div>
      <button @click="fetchPendingUsers" class="refresh-btn" :disabled="isLoading">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon" :class="{ 'spinning': isLoading }">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        Segarkan Data
      </button>
    </div>

    <!-- Alert Box for Error -->
    <transition name="fade">
      <div v-if="errorMessage" class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
    </transition>

    <!-- Alert Box for Success -->
    <transition name="fade">
      <div v-if="successMessage" class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ successMessage }}</span>
      </div>
    </transition>

    <!-- Content Card -->
    <div class="table-card">
      <!-- State: Loading Skeleton -->
      <div v-if="isLoading && users.length === 0" class="skeleton-wrapper">
        <div class="skeleton-header"></div>
        <div v-for="n in 3" :key="n" class="skeleton-row"></div>
      </div>

      <!-- State: Empty Data -->
      <div v-else-if="users.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Belum Ada Pengguna</h3>
        <p>Sistem tidak mendeteksi adanya data pengguna terdaftar saat ini.</p>
      </div>

      <!-- State: Table Display -->
      <div v-else class="table-responsive">
        <table class="kyc-table">
          <thead>
            <tr>
              <th>Nama Pengguna</th>
              <th>Alamat Email</th>
              <th>Status</th>
              <th>Dokumen KTP</th>
              <th class="actions-header">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="table-row">
              <td class="user-name-cell">
                <div class="avatar-small">
                  {{ user.nama ? user.nama.charAt(0).toUpperCase() : 'U' }}
                </div>
                <span class="user-nama">{{ user.nama }}</span>
              </td>
              <td class="email-cell">{{ user.email }}</td>
              <td>
                <span class="status-badge" :class="user.status_kyc ? user.status_kyc.toLowerCase() : 'unverified'">
                  {{ 
                    user.status_kyc === 'pending' ? 'Pending' : 
                    user.status_kyc === 'verified' ? 'Verified' : 
                    user.status_kyc === 'rejected' ? 'Rejected' : 'Unverified' 
                  }}
                </span>
              </td>
              <td>
                <button 
                  v-if="user.foto_ktp" 
                  @click="openKtpModal(user)" 
                  class="view-ktp-btn"
                  title="Klik untuk melihat foto KTP"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Lihat KTP
                </button>
                <span v-else class="no-ktp-label">-</span>
              </td>
              <td class="actions-cell">
                <div v-if="user.status_kyc === 'pending' || user.status_kyc === 'unverified' || !user.status_kyc" class="actions-wrapper-inner">
                  <button 
                    @click="handleApprove(user.id)" 
                    class="approve-btn"
                    :disabled="actionLoading[user.id]"
                  >
                    <span v-if="actionLoading[user.id]">...</span>
                    <span v-else>Setujui</span>
                  </button>
                  <button 
                    @click="handleReject(user.id)" 
                    class="reject-btn"
                    :disabled="actionLoading[user.id]"
                  >
                    <span v-if="actionLoading[user.id]">...</span>
                    <span v-else>Tolak</span>
                  </button>
                </div>
                <span v-else class="no-actions">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Premium KTP Lightbox Modal -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>KTP: {{ activeUserName }}</h3>
            <button @click="closeModal" class="close-btn" title="Tutup">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <img :src="selectedUser ? `${(api.defaults.baseURL || 'http://localhost:3001').replace(/\/$/, '')}/uploads/${selectedUser.foto_ktp}` : ''" alt="Foto KTP" class="ktp-image-large" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.admin-dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  box-sizing: border-box;
}

/* Header Styling */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.header-title-area h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: var(--text-h);
}

.header-title-area p {
  margin: 0;
  color: var(--text);
  font-size: 15px;
}

/* Buttons */
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

/* Alerts */
.alert {
  display: flex;
  align-items: flex-start;
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

.alert-error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.alert-success {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

/* Card Wrapper */
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

/* Responsive Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.kyc-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.kyc-table th {
  padding: 16px 24px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  background: var(--bg-hover);
}

.kyc-table th:first-child {
  border-top-left-radius: 12px;
}

.kyc-table th:last-child {
  border-top-right-radius: 12px;
}

.table-row {
  transition: background 0.15s ease;
}

.table-row:hover {
  background: var(--bg-hover);
}

.kyc-table td {
  padding: 16px 24px;
  font-size: 14.5px;
  color: var(--text-h);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.kyc-table tr:last-child td {
  border-bottom: none;
}

/* Cell Elements */
.user-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-small {
  width: 32px;
  height: 32px;
  background: var(--accent-bg);
  color: var(--accent);
  border: 1px solid var(--accent-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13.5px;
}

.email-cell {
  color: var(--text);
}

/* Status Badge */
.status-badge {
  font-size: 12.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-block;
}

.status-badge.unverified {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-badge.pending {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.2);
}

/* Document Button */
.view-ktp-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: 6px;
  color: var(--text-h);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-ktp-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg);
}

.no-ktp-label {
  color: var(--text-muted);
}

/* Action Button */
.actions-header {
  text-align: right;
}

.actions-cell {
  text-align: right;
}

.approve-btn {
  padding: 8px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.approve-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 4px 10px rgba(170, 59, 255, 0.2);
}

.approve-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text);
}

.empty-icon {
  width: 56px;
  height: 56px;
  color: #22c55e;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0 0 8px 0;
}

.empty-state p {
  margin: 0;
  max-width: 380px;
  line-height: 1.5;
  font-size: 14px;
}

/* Skeleton Loader */
.skeleton-wrapper {
  padding: 20px;
}

.skeleton-header {
  height: 40px;
  background: var(--bg-hover);
  border-radius: 8px;
  margin-bottom: 20px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-row {
  height: 48px;
  background: var(--bg-hover);
  border-radius: 8px;
  margin-bottom: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-row:last-child {
  margin-bottom: 0;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

/* Premium Modal / Lightbox */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 90%;
  max-width: 640px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-h);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-h);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.02);
}

.ktp-image-large {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content {
  transform: scale(0.9) translateY(20px);
}

.modal-fade-leave-to .modal-content {
  transform: scale(0.95);
}

.actions-wrapper-inner {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.reject-btn {
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reject-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.reject-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-badge.verified {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.no-actions {
  color: var(--text-muted);
  font-weight: 500;
}

/* Revenue Card Styles */
.revenue-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

.revenue-card:hover {
  border-color: var(--accent-border);
  box-shadow: 0 8px 30px rgba(170, 59, 255, 0.05);
}

.revenue-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-radius: 12px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.revenue-icon {
  width: 26px;
  height: 26px;
}

.revenue-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.revenue-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
}

.revenue-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-h);
}
</style>
