<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const isAuthenticated = ref(false);
const isAdmin = ref(false);
const isPemilik = ref(false);

const notifications = ref([]);
const showNotifications = ref(false);
let fetchInterval = null;

const checkAuth = () => {
  isAuthenticated.value = !!localStorage.getItem('token');
  const role = localStorage.getItem('role') || '';
  isAdmin.value = role.toLowerCase() === 'admin';
  isPemilik.value = role.toLowerCase() === 'pemilik';
  if (isAuthenticated.value) {
    fetchNotifications();
    startPolling();
  } else {
    stopPolling();
  }
};

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length;
});

const fetchNotifications = async () => {
  if (!isAuthenticated.value) return;
  try {
    const response = await api.get('/api/notifications');
    if (response.data && response.data.success) {
      notifications.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Gagal mengambil notifikasi:', error);
  }
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) {
    fetchNotifications();
  }
};

const markAsRead = async (id) => {
  try {
    await api.put(`/api/notifications/${id}/read`);
    fetchNotifications();
  } catch (error) {
    console.error('Gagal menandai notifikasi dibaca:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await api.put('/api/notifications/read-all');
    fetchNotifications();
  } catch (error) {
    console.error('Gagal menandai semua notifikasi dibaca:', error);
  }
};

const startPolling = () => {
  if (!fetchInterval) {
    fetchInterval = setInterval(fetchNotifications, 15000); // Polling setiap 15 detik
  }
};

const stopPolling = () => {
  if (fetchInterval) {
    clearInterval(fetchInterval);
    fetchInterval = null;
  }
};

const closeNotifications = (e) => {
  if (!e.target.closest('.notification-container')) {
    showNotifications.value = false;
  }
};

// Re-check authentication status on route change
watch(() => route.path, () => {
  checkAuth();
  showNotifications.value = false;
}, { immediate: true });

onMounted(() => {
  document.addEventListener('click', closeNotifications);
});

onUnmounted(() => {
  document.removeEventListener('click', closeNotifications);
  stopPolling();
});

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('kyc_status');
  isAuthenticated.value = false;
  isAdmin.value = false;
  isPemilik.value = false;
  stopPolling();
  router.push('/login');
};
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/" class="logo-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>SewaKi</span>
      </router-link>
    </div>
    
    <div class="navbar-links">
      <router-link to="/" class="nav-item">Beranda</router-link>
      
      <!-- Guest Navigation Links -->
      <template v-if="!isAuthenticated">
        <router-link to="/login" class="nav-item">Masuk</router-link>
        <router-link to="/register" class="nav-item nav-btn">Daftar</router-link>
      </template>
      
      <!-- Authenticated Navigation Links -->
      <template v-else>
        <router-link v-if="isAdmin" to="/admin/dashboard" class="nav-item">Admin Panel</router-link>
        <router-link v-if="isPemilik" to="/dashboard" class="nav-item">Dashboard</router-link>
        <router-link v-if="isPemilik" to="/tambah-barang" class="nav-item">Tambah Barang</router-link>
        <router-link to="/riwayat" class="nav-item">Pesananku</router-link>
        <router-link v-if="isPemilik" to="/kelola" class="nav-item">Kelola Pesanan</router-link>
        <router-link to="/profile" class="nav-item">Profil</router-link>
        
        <!-- Notification Bell & Dropdown -->
        <div class="notification-container">
          <button @click.stop="toggleNotifications" class="notification-bell-btn" aria-label="Notifikasi">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bell-icon">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </button>
          
          <div v-if="showNotifications" class="notification-dropdown">
            <div class="dropdown-header">
              <h3>Notifikasi</h3>
              <button v-if="unreadCount > 0" @click="markAllAsRead" class="mark-all-btn">Tandai semua dibaca</button>
            </div>
            <div class="dropdown-body">
              <div v-if="notifications.length === 0" class="empty-state">
                Tidak ada notifikasi baru
              </div>
              <div v-else class="notification-list">
                <div 
                  v-for="notification in notifications" 
                  :key="notification.id" 
                  class="notification-item"
                  :class="{ 'unread': !notification.is_read }"
                  @click="markAsRead(notification.id)"
                >
                  <div class="notif-header">
                    <span class="notif-title">{{ notification.title }}</span>
                    <span v-if="!notification.is_read" class="unread-dot"></span>
                  </div>
                  <p class="notif-message">{{ notification.message }}</p>
                  <span class="notif-time">{{ new Date(notification.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button @click="handleLogout" class="logout-nav-btn">Keluar</button>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .navbar {
    padding: 16px 20px;
  }
}

.navbar-brand .logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-h);
  transition: opacity 0.2s;
}

.navbar-brand .logo-link:hover {
  opacity: 0.9;
}

.logo-icon {
  width: 24px;
  height: 24px;
  color: var(--accent);
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

@media (max-width: 480px) {
  .navbar-links {
    gap: 16px;
  }
}

.nav-item {
  text-decoration: none;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--text);
  transition: all 0.2s ease-in-out;
  position: relative;
  padding: 6px 0;
}

.nav-item:hover {
  color: var(--text-h);
}

/* Link active state underline effect */
.nav-item.router-link-exact-active:not(.nav-btn) {
  color: var(--accent);
}

.nav-item.router-link-exact-active:not(.nav-btn)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
}

/* Button style for Register link */
.nav-btn {
  background: var(--accent);
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(170, 59, 255, 0.15);
}

.nav-btn:hover {
  opacity: 0.95;
  transform: translateY(-1px);
}

.nav-btn.router-link-exact-active {
  background: var(--accent);
  color: #fff;
}

/* Logout Button */
.logout-nav-btn {
  background: transparent;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-nav-btn:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: #ef4444;
}

/* Notification Styling */
.notification-container {
  position: relative;
  display: flex;
  align-items: center;
}

.notification-bell-btn {
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  padding: 8px;
  position: relative;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.notification-bell-btn:hover {
  color: var(--text-h);
  background: rgba(255, 255, 255, 0.05);
}

.bell-icon {
  width: 20px;
  height: 20px;
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  min-width: 10px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 12px;
  width: 340px;
  max-height: 420px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.01);
}

.dropdown-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.mark-all-btn:hover {
  background: rgba(170, 59, 255, 0.08);
}

.dropdown-body {
  overflow-y: auto;
  flex: 1;
  max-height: 340px;
}

.dropdown-body::-webkit-scrollbar {
  width: 6px;
}

.dropdown-body::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 3px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
  font-size: 13.5px;
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

.notification-item.unread {
  background: rgba(170, 59, 255, 0.05);
}

.notification-item.unread:hover {
  background: rgba(170, 59, 255, 0.08);
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.notif-title {
  font-weight: 700;
  font-size: 14px;
  color: #111827;
  line-height: 1.3;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
  box-shadow: 0 0 0 2px #fff;
}

.notif-message {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.45;
}

.notif-time {
  font-size: 11px;
  color: #6b7280;
  align-self: flex-end;
  margin-top: 2px;
}
</style>
