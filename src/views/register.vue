<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user',
  nomor_hp: '',
});

const errors = reactive({
  name: '',
  email: '',
  password: '',
  role: '',
  nomor_hp: '',
});

const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateForm = () => {
  let isValid = true;
  
  // Validate name
  if (!form.name) {
    errors.name = 'Nama lengkap wajib diisi';
    isValid = false;
  } else if (form.name.length < 3) {
    errors.name = 'Nama lengkap minimal 3 karakter';
    isValid = false;
  } else {
    errors.name = '';
  }

  // Validate email
  if (!form.email) {
    errors.email = 'Email wajib diisi';
    isValid = false;
  } else if (!validateEmail(form.email)) {
    errors.email = 'Format email tidak valid';
    isValid = false;
  } else {
    errors.email = '';
  }

  // Validate password
  if (!form.password) {
    errors.password = 'Password wajib diisi';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'Password minimal 6 karakter';
    isValid = false;
  } else {
    errors.password = '';
  }

  // Validate role
  if (!form.role) {
    errors.role = 'Role wajib dipilih';
    isValid = false;
  } else {
    errors.role = '';
  }

  // Validate nomor_hp
  if (!form.nomor_hp) {
    errors.nomor_hp = 'Nomor WhatsApp wajib diisi';
    isValid = false;
  } else if (!/^\d+$/.test(form.nomor_hp)) {
    errors.nomor_hp = 'Nomor WhatsApp hanya boleh berisi angka';
    isValid = false;
  } else if (form.nomor_hp.length < 9) {
    errors.nomor_hp = 'Nomor WhatsApp minimal 9 angka';
    isValid = false;
  } else {
    errors.nomor_hp = '';
  }

  return isValid;
};

const handleRegister = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    const response = await api.post('/api/auth/register', {
      nama: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      nomor_hp: form.nomor_hp
    });

    successMessage.value = response.data?.message || 'Registrasi berhasil! Mengalihkan ke halaman login...';
    
    // Reset form
    form.name = '';
    form.email = '';
    form.password = '';
    form.role = 'user';
    form.nomor_hp = '';

    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response) {
      errorMessage.value = error.response.data?.message || error.response.data?.error || 'Registrasi gagal. Silakan periksa kembali data Anda.';
    } else if (error.request) {
      errorMessage.value = 'Tidak dapat menghubungi server. Pastikan koneksi internet Anda aktif.';
    } else {
      errorMessage.value = error.message || 'Terjadi kesalahan saat melakukan registrasi.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="logo-placeholder">
          <!-- Premium SVG Icon for Logo -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </div>
        <h2>Buat Akun Baru</h2>
        <p class="subtitle">Lengkapi formulir di bawah untuk mendaftar layanan SewaKi</p>
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

      <form @submit.prevent="handleRegister" class="register-form">
        <!-- Name Field -->
        <div class="form-group" :class="{ 'has-error': errors.name }">
          <label for="name">Nama Lengkap</label>
          <div class="input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input 
              id="name" 
              type="text" 
              v-model="form.name" 
              placeholder="Nama Lengkap Anda"
              :disabled="isLoading"
              autocomplete="name"
            />
          </div>
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
        </div>

        <!-- Email Field -->
        <div class="form-group" :class="{ 'has-error': errors.email }">
          <label for="email">Alamat Email</label>
          <div class="input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <input 
              id="email" 
              type="email" 
              v-model="form.email" 
              placeholder="nama@email.com"
              :disabled="isLoading"
              autocomplete="email"
            />
          </div>
          <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
        </div>

        <!-- WhatsApp Field -->
        <div class="form-group" :class="{ 'has-error': errors.nomor_hp }">
          <label for="nomor_hp">Nomor WhatsApp</label>
          <div class="input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <input 
              id="nomor_hp" 
              type="text" 
              v-model="form.nomor_hp" 
              placeholder="Contoh: 081234567890"
              :disabled="isLoading"
              autocomplete="tel"
            />
          </div>
          <span v-if="errors.nomor_hp" class="error-text">{{ errors.nomor_hp }}</span>
        </div>

        <!-- Password Field -->
        <div class="form-group" :class="{ 'has-error': errors.password }">
          <label for="password">Kata Sandi</label>
          <div class="input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input 
              id="password" 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="Minimal 6 karakter"
              :disabled="isLoading"
              autocomplete="new-password"
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="togglePassword"
              title="Tampilkan/Sembunyikan password"
              tabindex="-1"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>

        <!-- Role Field -->
        <div class="form-group" :class="{ 'has-error': errors.role }">
          <label for="role">Peran / Role Akun</label>
          <div class="input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <select 
              id="role" 
              v-model="form.role" 
              :disabled="isLoading"
            >
              <option value="user">Penyewa</option>
              <option value="pemilik">Pemilik Barang</option>
            </select>
            <div class="select-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          <span v-if="errors.role" class="error-text">{{ errors.role }}</span>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-container">
            <svg class="spinner" viewBox="0 0 50 50">
              <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
            </svg>
            Mendaftarkan...
          </span>
          <span v-else>Daftar Sekarang</span>
        </button>
      </form>

      <div class="register-footer">
        Sudah memiliki akun? <router-link to="/login" class="login-link">Masuk di sini</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 20px;
  box-sizing: border-box;
}

.register-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: var(--shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

@media (max-width: 480px) {
  .register-card {
    padding: 30px 20px;
  }
}

.register-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-2px);
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo-placeholder {
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

.logo-icon {
  width: 28px;
  height: 28px;
}

.register-header h2 {
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
.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-h);
}

.input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--text);
  pointer-events: none;
  transition: color 0.2s;
  z-index: 1;
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  padding: 12px 16px 12px 42px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-h);
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease-in-out;
}

.input-wrapper select {
  appearance: none;
  cursor: pointer;
  padding-right: 40px;
}

.select-arrow {
  position: absolute;
  right: 14px;
  pointer-events: none;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-arrow svg {
  width: 16px;
  height: 16px;
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.input-wrapper input:focus + .input-icon,
.input-wrapper select:focus + .input-icon {
  color: var(--accent);
}

.input-wrapper input:disabled,
.input-wrapper select:disabled {
  opacity: 0.6;
  background: var(--code-bg);
  cursor: not-allowed;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  z-index: 1;
}

.toggle-password:hover {
  color: var(--text-h);
}

.eye-icon {
  width: 20px;
  height: 20px;
}

/* Validation styling */
.form-group.has-error input,
.form-group.has-error select {
  border-color: #ef4444;
}

.form-group.has-error input:focus,
.form-group.has-error select:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.error-text {
  font-size: 12.5px;
  color: #ef4444;
  margin-top: 2px;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 13px 20px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 6px;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(170, 59, 255, 0.25);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Alerts */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.4;
  text-align: left;
}

.alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
}

.alert-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  color: #22c55e;
}

/* Spinner Animation */
.spinner-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 18px;
  height: 18px;
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

/* Footer */
.register-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text);
}

.login-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.login-link:hover {
  text-decoration: underline;
  opacity: 0.85;
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
