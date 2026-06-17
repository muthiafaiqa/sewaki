<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const user = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');
const redirecting = ref(false);

// KYC State Variables
const selectedFile = ref(null);
const kycStatus = ref('unverified');
const uploadProgress = ref(false);
const kycErrorMessage = ref('');
const kycSuccessMessage = ref('');

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile.value = file;
  }
};

const handleUploadKtp = async () => {
  if (!selectedFile.value) {
    kycErrorMessage.value = 'Silakan pilih file KTP Anda terlebih dahulu.';
    return;
  }
  
  kycErrorMessage.value = '';
  kycSuccessMessage.value = '';
  uploadProgress.value = true;
  
  try {
    const formData = new FormData();
    formData.append('user_id', user.value.id);
    formData.append('ktp', selectedFile.value);
    
    await api.post('/api/auth/upload-ktp', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    kycSuccessMessage.value = 'KTP berhasil diunggah! Menunggu persetujuan Admin.';
    kycStatus.value = 'pending';
    localStorage.setItem('kyc_status', 'pending');
    if (user.value) {
      user.value.kyc_status = 'pending';
    }
  } catch (error) {
    console.error('KTP upload error:', error);
    kycErrorMessage.value = error.response?.data?.message || 'Gagal mengunggah KTP.';
  } finally {
    uploadProgress.value = false;
  }
};

// Mengambil inisial nama untuk avatar
const avatarInitials = computed(() => {
  if (!user.value || !user.value.name) return 'U';
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

// Menampilkan label role yang rapi
const roleLabel = computed(() => {
  if (!user.value || !user.value.role) return '-';
  const role = user.value.role.toLowerCase();
  if (role === 'penyewa') return 'Penyewa / Renter';
  if (role === 'pemilik barang') return 'Pemilik Barang / Owner';
  if (role === 'admin') return 'Administrator';
  return user.value.role;
});

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('kyc_status');
  redirecting.value = true;
  errorMessage.value = 'Mengalihkan ke halaman login...';
  
  setTimeout(() => {
    router.push('/login');
  }, 1000);
};

onMounted(async () => {
  try {
    const response = await api.get('/api/auth/profile');
    // Ambil data profile (bisa berada di response.data atau response.data.data)
    user.value = response.data?.data || response.data;
    
    // Set status KYC
    const status = user.value?.status_kyc || user.value?.kyc_status || user.value?.kycStatus || 'unverified';
    kycStatus.value = status.toLowerCase();
    localStorage.setItem('kyc_status', kycStatus.value);
    
    if (user.value?.role) {
      localStorage.setItem('role', user.value.role.toLowerCase());
    }
  } catch (error) {
    console.error('Fetch profile error:', error);
    
    // Jika 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      redirecting.value = true;
      errorMessage.value = 'Sesi Anda telah berakhir. Mengalihkan ke halaman login...';
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      errorMessage.value = error.response?.data?.message || error.message || 'Gagal memuat profil user.';
    }
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="profile-container">
    <!-- State: Loading -->
    <div v-if="isLoading || redirecting" class="status-card">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <p class="status-text">{{ errorMessage || 'Memuat profil Anda...' }}</p>
    </div>

    <!-- State: Error (Bukan 401/Redirect) -->
    <div v-else-if="errorMessage && !redirecting" class="status-card error-card">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2>Terjadi Kesalahan</h2>
      <p class="status-text">{{ errorMessage }}</p>
      <button @click="window.location.reload()" class="retry-btn">Coba Lagi</button>
    </div>

    <!-- State: Success / Data Loaded -->
    <div v-else-if="user" class="profile-card">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="avatar-circle">
          {{ avatarInitials }}
        </div>
        <h2>{{ user.name }}</h2>
        <span class="role-badge" :class="user.role ? user.role.toLowerCase().replace(' ', '-') : 'penyewa'">
          {{ roleLabel }}
        </span>
      </div>

      <!-- Profile Body Details -->
      <div class="profile-details">
        <div class="detail-row">
          <div class="detail-label">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="detail-icon">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Alamat Email</span>
          </div>
          <div class="detail-value">{{ user.email }}</div>
        </div>

        <div class="detail-row">
          <div class="detail-label">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="detail-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>ID Pengguna</span>
          </div>
          <div class="detail-value">{{ user.id || 'N/A' }}</div>
        </div>
      </div>

      <!-- Verifikasi Identitas (KYC) Section -->
      <div class="kyc-section">
        <h3>Verifikasi Identitas (KYC)</h3>
        
        <!-- Case 1: Verified -->
        <div v-if="kycStatus === 'verified'" class="kyc-status verified">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="kyc-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>
            <span class="status-title">Status: Terverifikasi</span>
            <p class="status-desc">Akun Anda sudah terverifikasi KYC. Anda bebas melakukan sewa & tambah barang.</p>
          </div>
        </div>
        
        <!-- Case 2: Pending -->
        <div v-else-if="kycStatus === 'pending'" class="kyc-status pending">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="kyc-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div>
            <span class="status-title">Status: Menunggu Persetujuan Admin</span>
            <p class="status-desc">Dokumen KTP Anda sedang ditinjau oleh Admin. Proses ini biasanya memerlukan waktu beberapa jam.</p>
          </div>
        </div>
        
        <!-- Case 3: Unverified / Upload Form -->
        <div v-else class="kyc-upload-form">
          <p class="kyc-prompt">Unggah foto KTP Anda untuk memverifikasi identitas Anda agar bisa bertransaksi.</p>
          
          <div v-if="kycErrorMessage" class="kyc-alert error">{{ kycErrorMessage }}</div>
          <div v-if="kycSuccessMessage" class="kyc-alert success">{{ kycSuccessMessage }}</div>
          
          <form @submit.prevent="handleUploadKtp" class="upload-form">
            <div class="file-input-wrapper">
              <input 
                type="file" 
                id="ktp-file" 
                accept="image/*" 
                @change="onFileChange" 
                class="file-input"
                required
              />
              <label for="ktp-file" class="file-label">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>{{ selectedFile ? selectedFile.name : 'Pilih File Gambar KTP' }}</span>
              </label>
            </div>
            
            <button type="submit" class="kyc-submit-btn" :disabled="uploadProgress || !selectedFile">
              <span v-if="uploadProgress">Mengunggah...</span>
              <span v-else>Unggah KTP</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Action Button -->
      <button @click="handleLogout" class="logout-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logout-icon">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Keluar dari Akun
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 20px;
  box-sizing: border-box;
}

.status-card,
.profile-card {
  width: 100%;
  max-width: 480px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: var(--shadow);
  text-align: center;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.profile-card:hover {
  border-color: var(--accent-border);
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 250px;
}

.error-card {
  border-color: rgba(239, 68, 68, 0.25);
}

.error-icon {
  width: 56px;
  height: 56px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.error-icon svg {
  width: 32px;
  height: 32px;
}

.status-card h2 {
  font-size: 20px;
  color: var(--text-h);
  margin: 0;
}

.status-text {
  font-size: 15px;
  color: var(--text);
  margin: 0;
  line-height: 1.5;
}

.retry-btn {
  padding: 10px 20px;
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

/* Profile Design */
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: var(--accent-bg);
  color: var(--accent);
  border: 2px solid var(--accent-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  box-shadow: 0 4px 10px rgba(170, 59, 255, 0.1);
}

.profile-header h2 {
  font-size: 24px;
  color: var(--text-h);
  margin: 0 0 8px 0;
}

.role-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 30px;
  display: inline-block;
  text-transform: capitalize;
}

/* Badges based on role value */
.role-badge.penyewa {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.role-badge.pemilik-barang {
  background: rgba(170, 59, 255, 0.1);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.role-badge.admin {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.25);
}

/* Details Section */
.profile-details {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 24px 0;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  gap: 12px;
}

@media (max-width: 480px) {
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
}

.detail-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-h);
}

/* Logout Button */
.logout-btn {
  width: 100%;
  padding: 12px 20px;
  background: transparent;
  color: #ef4444;
  border: 1.5px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: #ef4444;
}

.logout-btn:active {
  transform: scale(0.99);
}

.logout-icon {
  width: 18px;
  height: 18px;
}

/* Spinner Animation */
.spinner {
  animation: rotate 2s linear infinite;
  width: 32px;
  height: 32px;
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

/* KYC Styles */
.kyc-section {
  text-align: left;
  margin-bottom: 28px;
  border-top: 1px dashed var(--border);
  padding-top: 24px;
}

.kyc-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
  margin-top: 0;
  margin-bottom: 14px;
}

.kyc-status {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  font-size: 13.5px;
}

.kyc-status.verified {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.kyc-status.pending {
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.kyc-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-title {
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.status-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text);
}

.kyc-upload-form {
  background: var(--bg-hover);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 16px;
}

.kyc-prompt {
  font-size: 13px;
  color: var(--text);
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.kyc-alert {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}

.kyc-alert.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.kyc-alert.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.15);
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-input-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.file-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
  text-align: center;
}

.file-label:hover {
  border-color: var(--accent);
  color: var(--text-h);
}

.upload-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

.kyc-submit-btn {
  width: 100%;
  padding: 10px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.kyc-submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.kyc-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
