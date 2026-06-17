<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const form = reactive({
  email: '',
  password: '',
});

const errors = reactive({
  email: '',
  password: '',
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

  return isValid;
};

const handleLogin = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    const response = await api.post('/api/auth/login', {
      email: form.email,
      password: form.password,
    });

    // Ambil token dari respons API sesuai dokumentasi backend
    const token = response.data?.data?.token;
    
    if (token) {
      localStorage.setItem('token', token);
      const role = response.data?.data?.role || response.data?.role;
      if (role) {
        localStorage.setItem('role', role.toLowerCase());
      }
      successMessage.value = 'Login berhasil! Mengalihkan ke profil...';
      // Reset form
      form.email = '';
      form.password = '';
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } else {
      throw new Error('Token tidak ditemukan dalam respons API');
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      errorMessage.value = error.response.data?.message || error.response.data?.error || 'Login gagal. Silakan periksa kembali email dan password Anda.';
    } else if (error.request) {
      errorMessage.value = 'Tidak dapat menghubungi server. Pastikan koneksi internet Anda aktif dan server backend sedang berjalan.';
    } else {
      errorMessage.value = error.message || 'Terjadi kesalahan saat melakukan login.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-placeholder">
          <!-- Premium SVG Icon for Logo -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h2>Masuk ke Akun Anda</h2>
        <p class="subtitle">Silakan masukkan email dan password untuk melanjutkan</p>
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

      <form @submit.prevent="handleLogin" class="login-form">
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

        <!-- Password Field -->
        <div class="form-group" :class="{ 'has-error': errors.password }">
          <div class="label-row">
            <label for="password">Kata Sandi</label>
            <a href="#" class="forgot-link" tabindex="-1">Lupa sandi?</a>
          </div>
          <div class="input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input 
              id="password" 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="Masukkan password minimal 6 karakter"
              :disabled="isLoading"
              autocomplete="current-password"
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="togglePassword"
              title="Tampilkan/Sembunyikan password"
              tabindex="-1"
            >
              <!-- Eye open / eye off svg -->
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

        <!-- Submit Button -->
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-container">
            <svg class="spinner" viewBox="0 0 50 50">
              <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
            </svg>
            Memproses...
          </span>
          <span v-else>Masuk</span>
        </button>
      </form>

      <div class="login-footer">
        Belum punya akun? <router-link to="/register" class="register-link">Daftar sekarang</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
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
  .login-card {
    padding: 30px 20px;
  }
}

.login-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-2px);
}

.login-header {
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

.login-header h2 {
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
.login-form {
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

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-h);
}

.forgot-link {
  font-size: 13px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.forgot-link:hover {
  text-decoration: underline;
  opacity: 0.85;
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
}

.input-wrapper input {
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

.input-wrapper input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.input-wrapper input:focus + .input-icon,
.input-wrapper input:focus ~ .input-icon {
  color: var(--accent);
}

.input-wrapper input:disabled {
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
}

.toggle-password:hover {
  color: var(--text-h);
}

.eye-icon {
  width: 20px;
  height: 20px;
}

/* Validation styling */
.form-group.has-error input {
  border-color: #ef4444;
}

.form-group.has-error input:focus {
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
.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text);
}

.register-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.register-link:hover {
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
