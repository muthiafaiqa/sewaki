<script setup>
import { ref } from 'vue';
import api from '../services/api';

const userIdInput = ref('');
const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Antrean simulasi KTP pending untuk admin
const pendingUsers = ref([
  { id: '101', name: 'Ahmad Dani', email: 'ahmad@example.com', ktpFileName: 'ktp_dani_surabaya.jpg' },
  { id: '102', name: 'Budi Cahyono', email: 'budi.c@example.com', ktpFileName: 'ktp_budi_bandung.png' },
  { id: '103', name: 'Citra Kirana', email: 'citra.kirana@example.com', ktpFileName: 'ktp_citra_jakarta.jpg' }
]);

const verifyUser = async (id) => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  
  try {
    const response = await api.put(`/api/auth/verify-kyc/${id}`, { status: 'verified' });
    successMessage.value = response.data?.message || `User ID ${id} berhasil diverifikasi (KYC Sukses)!`;
    
    // Hapus dari antrean simulasi
    pendingUsers.value = pendingUsers.value.filter(u => u.id !== id);
    
    // Untuk mempermudah testing lokal oleh admin itu sendiri
    localStorage.setItem('kyc_status', 'verified');
  } catch (error) {
    console.error('KYC verification error:', error);
    errorMessage.value = error.response?.data?.message || `Gagal memverifikasi User ID ${id}.`;
  } finally {
    isLoading.value = false;
  }
};

const handleManualVerify = () => {
  if (!userIdInput.value.toString().trim()) {
    errorMessage.value = 'Silakan masukkan User ID terlebih dahulu.';
    return;
  }
  verifyUser(userIdInput.value.toString().trim());
};
</script>

<template>
  <div class="admin-container">
    <div class="admin-card">
      <div class="admin-header">
        <div class="icon-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="header-icon">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
        </div>
        <h2>Panel Admin: Verifikasi KYC</h2>
        <p class="subtitle">Setujui pengunggahan KTP pengguna untuk memberikan hak sewa & tambah barang</p>
      </div>

      <!-- Alert Banners -->
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

      <transition name="fade">
        <div v-if="successMessage" class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ successMessage }}</span>
        </div>
      </transition>

      <!-- Section: Manual Verification -->
      <section class="manual-verify-section">
        <h3>Verifikasi Manual via User ID</h3>
        <div class="search-box">
          <input 
            type="text" 
            v-model="userIdInput" 
            placeholder="Masukkan User ID (contoh: 12)" 
            class="user-id-input"
            :disabled="isLoading"
          />
          <button @click="handleManualVerify" class="btn-verify" :disabled="isLoading">
            Setujui KTP User
          </button>
        </div>
      </section>

      <!-- Section: Pending Queue Queue List -->
      <section class="queue-section">
        <h3>Antrean Pengajuan KTP (Simulasi)</h3>
        
        <div v-if="pendingUsers.length === 0" class="empty-queue">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p>Semua pengajuan KTP telah diproses!</p>
        </div>

        <div v-else class="queue-list">
          <div v-for="user in pendingUsers" :key="user.id" class="queue-item">
            <div class="user-meta">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-info-row">
                <span class="user-id-badge">ID: {{ user.id }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
              <div class="ktp-file-info">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="file-icon">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>{{ user.ktpFileName }}</span>
              </div>
            </div>
            
            <button @click="verifyUser(user.id)" class="btn-action-approve" :disabled="isLoading">
              Setujui
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 40px 20px;
  box-sizing: border-box;
}

.admin-card {
  width: 100%;
  max-width: 600px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: var(--shadow);
  box-sizing: border-box;
}

.admin-header {
  text-align: center;
  margin-bottom: 32px;
}

.icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--accent-bg);
  color: var(--accent);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid var(--accent-border);
}

.header-icon {
  width: 28px;
  height: 28px;
}

.admin-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-h);
}

.subtitle {
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
  margin: 0;
}

/* Form Sections */
.manual-verify-section,
.queue-section {
  text-align: left;
  margin-bottom: 32px;
  border-top: 1px dashed var(--border);
  padding-top: 24px;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-h);
  margin-top: 0;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  gap: 12px;
}

.user-id-input {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-hover);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 14.5px;
  color: var(--text-h);
  transition: all 0.2s;
  box-sizing: border-box;
}

.user-id-input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--bg);
}

.btn-verify {
  padding: 12px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-verify:hover:not(:disabled) {
  opacity: 0.95;
}

.btn-verify:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Queue List */
.empty-queue {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: var(--bg-hover);
  border: 1px dashed var(--border);
  border-radius: 12px;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #22c55e;
  margin-bottom: 12px;
}

.empty-queue p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.queue-item {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-h);
}

.user-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.user-id-badge {
  background: var(--border);
  color: var(--text-h);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.user-email {
  color: var(--text);
}

.ktp-file-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-muted);
  margin-top: 2px;
}

.file-icon {
  width: 14px;
  height: 14px;
}

.btn-action-approve {
  padding: 8px 16px;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 6px;
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action-approve:hover:not(:disabled) {
  background: #22c55e;
  color: #fff;
  border-color: #22c55e;
}

.btn-action-approve:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Alert Boxes */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  line-height: 1.4;
  box-sizing: border-box;
}

.alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.alert-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
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
</style>
