<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const form = reactive({
  nama_barang: '',
  deskripsi: '',
  harga_sewa_per_hari: '',
  stok: '',
  lokasi: '',
  deposit: 0,
});

const errors = reactive({
  nama_barang: '',
  deskripsi: '',
  harga_sewa_per_hari: '',
  stok: '',
  lokasi: '',
  deposit: '',
});

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.nama_barang = '';
  errors.deskripsi = '';
  errors.harga_sewa_per_hari = '';
  errors.stok = '';
  errors.lokasi = '';
  errors.deposit = '';

  if (!form.nama_barang.trim()) {
    errors.nama_barang = 'Nama barang wajib diisi';
    isValid = false;
  }
  
  if (!form.deskripsi.trim()) {
    errors.deskripsi = 'Deskripsi barang wajib diisi';
    isValid = false;
  }

  if (form.harga_sewa_per_hari === '' || form.harga_sewa_per_hari === null) {
    errors.harga_sewa_per_hari = 'Harga sewa per hari wajib diisi';
    isValid = false;
  } else if (Number(form.harga_sewa_per_hari) < 0) {
    errors.harga_sewa_per_hari = 'Harga sewa tidak boleh bernilai negatif';
    isValid = false;
  }

  if (form.stok === '' || form.stok === null) {
    errors.stok = 'Stok barang wajib diisi';
    isValid = false;
  } else if (Number(form.stok) < 0) {
    errors.stok = 'Stok tidak boleh bernilai negatif';
    isValid = false;
  }

  if (!form.lokasi.trim()) {
    errors.lokasi = 'Lokasi barang wajib diisi';
    isValid = false;
  }

  if (form.deposit === '' || form.deposit === null) {
    errors.deposit = 'Nominal deposit wajib diisi';
    isValid = false;
  } else if (Number(form.deposit) < 0) {
    errors.deposit = 'Deposit tidak boleh bernilai negatif';
    isValid = false;
  }

  return isValid;
};

const selectedFile = ref(null);

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile.value = file;
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!validateForm()) return;

  isLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('name', form.nama_barang);
    formData.append('nama_barang', form.nama_barang);
    formData.append('description', form.deskripsi);
    formData.append('deskripsi', form.deskripsi);
    formData.append('price', Number(form.harga_sewa_per_hari));
    formData.append('harga_sewa_per_hari', Number(form.harga_sewa_per_hari));
    formData.append('stock', Number(form.stok));
    formData.append('stok', Number(form.stok));
    formData.append('location', form.lokasi);
    formData.append('lokasi', form.lokasi);
    formData.append('deposit', Number(form.deposit));
    formData.append('jaminan_deposit', Number(form.deposit));
    
    if (selectedFile.value) {
      formData.append('foto', selectedFile.value);
      formData.append('image', selectedFile.value);
    }

    const response = await api.post('/api/items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    successMessage.value = response.data?.message || 'Barang sewa berhasil ditambahkan!';
    
    // Reset form
    form.nama_barang = '';
    form.deskripsi = '';
    form.harga_sewa_per_hari = '';
    form.stok = '';
    form.lokasi = '';
    form.deposit = 0;
    selectedFile.value = null;

    // Pengalihan kembali ke beranda
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } catch (error) {
    console.error('Add item error:', error);
    if (error.response) {
      errorMessage.value = error.response.data?.message || error.response.data?.error || 'Gagal menambahkan barang sewa. Silakan periksa kembali input Anda.';
    } else if (error.request) {
      errorMessage.value = 'Tidak dapat menghubungi server. Pastikan koneksi internet aktif.';
    } else {
      errorMessage.value = error.message || 'Terjadi kesalahan saat menambahkan barang.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="form-container">
    <div class="form-card">
      <div class="form-header">
        <div class="icon-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="header-icon">
            <polyline points="21 16 12 21 3 16"></polyline>
            <polyline points="21 12 12 17 3 12"></polyline>
            <polyline points="12 2 22 7 12 12 2 7 12 2"></polyline>
          </svg>
        </div>
        <h2>Tambah Barang Sewa</h2>
        <p class="subtitle">Daftarkan barang Anda untuk mulai menyewakannya di SewaKi</p>
      </div>

      <!-- Alert Box for Error -->
      <transition name="fade">
        <div v-if="errorMessage" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="alert-icon">
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="alert-icon">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ successMessage }}</span>
        </div>
      </transition>

      <!-- Add Item Form -->
      <form @submit.prevent="handleSubmit" class="add-item-form" enctype="multipart/form-data">
        <!-- Nama Barang -->
        <div class="form-group" :class="{ 'has-error': errors.nama_barang }">
          <label for="nama_barang">Nama Barang</label>
          <div class="input-wrapper">
            <input 
              id="nama_barang" 
              type="text" 
              v-model="form.nama_barang" 
              placeholder="Contoh: Tenda Camping Eiger 4 Orang"
              :disabled="isLoading"
            />
          </div>
          <span v-if="errors.nama_barang" class="error-text">{{ errors.nama_barang }}</span>
        </div>

        <!-- Deskripsi Barang -->
        <div class="form-group" :class="{ 'has-error': errors.deskripsi }">
          <label for="deskripsi">Deskripsi Barang</label>
          <div class="input-wrapper">
            <textarea 
              id="deskripsi" 
              v-model="form.deskripsi" 
              placeholder="Jelaskan kondisi barang, kelengkapan, dan ketentuan sewa..."
              rows="4"
              :disabled="isLoading"
            ></textarea>
          </div>
          <span v-if="errors.deskripsi" class="error-text">{{ errors.deskripsi }}</span>
        </div>

        <!-- Row Grid for Price & Stock -->
        <div class="grid-row-2">
          <!-- Harga Sewa per Hari -->
          <div class="form-group" :class="{ 'has-error': errors.harga_sewa_per_hari }">
            <label for="harga_sewa_per_hari">Harga Sewa / Hari (Rp)</label>
            <div class="input-wrapper">
              <input 
                id="harga_sewa_per_hari" 
                type="number" 
                v-model.number="form.harga_sewa_per_hari" 
                placeholder="50000"
                min="0"
                :disabled="isLoading"
              />
            </div>
            <span v-if="errors.harga_sewa_per_hari" class="error-text">{{ errors.harga_sewa_per_hari }}</span>
          </div>

          <!-- Stok -->
          <div class="form-group" :class="{ 'has-error': errors.stok }">
            <label for="stok">Stok Tersedia</label>
            <div class="input-wrapper">
              <input 
                id="stok" 
                type="number" 
                v-model.number="form.stok" 
                placeholder="1"
                min="0"
                :disabled="isLoading"
              />
            </div>
            <span v-if="errors.stok" class="error-text">{{ errors.stok }}</span>
          </div>
        </div>

        <!-- Row Grid for Deposit -->
        <div class="grid-row-2">
          <!-- Nominal Deposit / Uang Jaminan -->
          <div class="form-group" :class="{ 'has-error': errors.deposit }">
            <label for="deposit">Nominal Deposit / Uang Jaminan (Rp)</label>
            <div class="input-wrapper">
              <input 
                id="deposit" 
                type="number" 
                v-model.number="form.deposit" 
                placeholder="20000"
                min="0"
                :disabled="isLoading"
              />
            </div>
            <span v-if="errors.deposit" class="error-text">{{ errors.deposit }}</span>
          </div>
          <!-- Empty column for alignment -->
          <div></div>
        </div>

        <!-- Lokasi -->
        <div class="form-group" :class="{ 'has-error': errors.lokasi }">
          <label for="lokasi">Lokasi Pengambilan / COD</label>
          <div class="input-wrapper">
            <input 
              id="lokasi" 
              type="text" 
              v-model="form.lokasi" 
              placeholder="Contoh: Bandung Kota, Jawa Barat"
              :disabled="isLoading"
            />
          </div>
          <span v-if="errors.lokasi" class="error-text">{{ errors.lokasi }}</span>
        </div>

        <!-- Foto Barang -->
        <div class="form-group">
          <label for="foto">Foto Barang</label>
          <div class="file-input-wrapper">
            <input 
              id="foto" 
              type="file" 
              accept="image/*"
              @change="handleFileChange" 
              class="file-input"
              :disabled="isLoading"
            />
            <label for="foto" class="file-label">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>{{ selectedFile ? selectedFile.name : 'Pilih Foto Barang' }}</span>
            </label>
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-container">
            <svg class="spinner" viewBox="0 0 50 50">
              <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
            </svg>
            Menyimpan...
          </span>
          <span v-else>Tambah Barang</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  padding: 40px 20px;
  box-sizing: border-box;
}

.form-card {
  width: 100%;
  max-width: 520px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: var(--shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.form-card:hover {
  border-color: var(--accent-border);
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.icon-placeholder {
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

.form-header h2 {
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

/* Form Styling */
.add-item-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-h);
}

.input-wrapper {
  position: relative;
  display: flex;
  width: 100%;
}

.input-wrapper input,
.input-wrapper textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-hover);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 14.5px;
  color: var(--text-h);
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.input-wrapper textarea {
  resize: vertical;
}

.input-wrapper input::placeholder,
.input-wrapper textarea::placeholder {
  color: var(--text-muted);
}

.input-wrapper input:focus,
.input-wrapper textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
  background: var(--bg);
}

/* Error States */
.form-group.has-error label {
  color: #ef4444;
}

.form-group.has-error input,
.form-group.has-error textarea {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.02);
}

.form-group.has-error input:focus,
.form-group.has-error textarea:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.error-text {
  font-size: 12.5px;
  color: #ef4444;
  font-weight: 500;
}

/* Row grid for half columns */
.grid-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 480px) {
  .grid-row-2 {
    grid-template-columns: 1fr;
  }
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(170, 59, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(170, 59, 255, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.submit-btn:disabled {
  opacity: 0.6;
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

/* Spinner Animation */
.spinner-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 20px;
  height: 20px;
}

.spinner .path {
  stroke: currentColor;
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

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* File Input Upload Styling */
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
  background: var(--bg-hover);
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
  background: var(--bg);
}

.upload-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}
</style>
