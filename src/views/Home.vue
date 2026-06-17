<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const items = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

const formatPrice = (value) => {
  if (!value && value !== 0) return 'Hubungi Pemilik';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

const searchQuery = ref('');
let searchTimeout = null;

const fetchItems = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get('/api/items', {
      params: searchQuery.value ? { search: searchQuery.value } : {}
    });
    // Dukung format response.data langsung atau dibungkus di dalam response.data.data
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) {
      items.value = data;
    } else {
      items.value = [];
    }
  } catch (error) {
    console.error('Fetch items error:', error);
    errorMessage.value = error.response?.data?.message || error.message || 'Gagal memuat daftar barang sewa.';
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = (event) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (event && event.key === 'Enter') {
    fetchItems();
  } else {
    searchTimeout = setTimeout(() => {
      fetchItems();
    }, 300);
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  fetchItems();
};

const currentUser = ref(null);

onMounted(() => {
  fetchItems();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (token) {
    currentUser.value = {
      token,
      role: role ? role.toLowerCase() : 'user'
    };
  }
});

const handleRent = (item) => {
  router.push(`/katalog/${item.id}`);
};

const getImageUrl = (filename) => {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
};

const handleDelete = async (itemId) => {
  if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) return;
  
  try {
    await api.delete(`/api/items/${itemId}`);
    items.value = items.value.filter(item => item.id !== itemId);
    await fetchItems();
  } catch (error) {
    console.error('Delete item error:', error);
    alert(error.response?.data?.message || 'Gagal menghapus barang.');
  }
};

const navigateToDetail = (itemId) => {
  router.push(`/katalog/${itemId}`);
};
</script>

<template>
  <div class="home-container">
    <!-- Hero Header -->
    <header class="hero-section">
      <h1>Temukan & Sewa Barang Kebutuhan Anda</h1>
      <p class="hero-subtitle">Mulai dari alat berkemah, fotografi, elektronik, hingga pakaian. Lebih hemat sewa dibanding beli.</p>
    </header>

    <!-- Search Bar Section -->
    <div class="search-section">
      <div class="search-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          v-model="searchQuery" 
          @input="handleSearch" 
          @keydown.enter="handleSearch" 
          placeholder="Cari barang sewa berdasarkan nama..." 
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn" title="Hapus pencarian">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="clear-icon">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- State: Loading -->
    <div v-if="isLoading" class="status-wrapper">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <p>Memuat daftar barang...</p>
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
      <button @click="fetchItems" class="retry-btn">Coba Lagi</button>
    </div>

    <!-- State: Empty Catalog -->
    <div v-else-if="items.length === 0" class="status-wrapper empty-wrapper">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>
      <h3>Belum Ada Barang</h3>
      <p>Katalog sewa saat ini sedang kosong. Silakan periksa kembali nanti.</p>
    </div>

    <!-- State: Catalog Grid Loaded -->
    <div v-else class="catalog-section">
      <h2 class="section-title">Katalog Barang Sewa</h2>
      <div class="items-grid">
        <div v-for="item in items" :key="item.id" class="item-card" @click="navigateToDetail(item.id)">
          <!-- Card Image Wrapper -->
          <div class="card-image-wrapper">
            <img 
              v-if="item.foto_barang"
              :src="getImageUrl(item.foto_barang)" 
              :alt="item.nama_barang || item.name" 
              class="item-image"
            />
            <div v-else class="card-image-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="box-icon">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <span class="category-tag">{{ item.category || 'Barang Sewa' }}</span>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <h3 class="item-title">{{ item.nama_barang || item.name }}</h3>
            
            <div class="item-price">
              <span class="price-value">{{ formatPrice(item.harga_sewa_per_hari !== undefined ? item.harga_sewa_per_hari : item.price) }}</span>
              <span class="price-period">/ hari</span>
            </div>

            <div class="item-info">
              <!-- Location Row -->
              <div class="info-row">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="info-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{{ item.lokasi || item.location || 'Lokasi tidak ditentukan' }}</span>
              </div>
              
              <!-- Owner/Description Row if available -->
              <div v-if="item.deskripsi || item.description" class="info-row description-row">
                <p class="description-text">{{ item.deskripsi || item.description }}</p>
              </div>
            </div>
            
            <div class="card-actions">
              <button @click.stop="handleRent(item)" class="rent-btn">Sewa Sekarang</button>
              <button 
                v-if="currentUser?.role === 'admin'" 
                @click.stop="handleDelete(item.id)" 
                class="delete-btn"
                title="Hapus Barang"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  box-sizing: border-box;
}

/* Hero Section */
.hero-section {
  text-align: center;
  margin-bottom: 56px;
  padding: 40px 20px;
  background: radial-gradient(circle at 50% 50%, rgba(170, 59, 255, 0.08), transparent 70%);
  border-radius: 24px;
}

.hero-section h1 {
  font-size: 38px;
  color: var(--text-h);
  margin: 0 0 16px 0;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  font-size: 17px;
  color: var(--text);
  max-width: 650px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Search Section */
.search-section {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  width: 100%;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  font-size: 15px;
  color: var(--text-h);
  outline: none;
  transition: all 0.2s ease-in-out;
  box-shadow: var(--shadow);
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
  background: var(--bg-hover);
}

.search-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  pointer-events: none;
  transition: color 0.2s;
}

.search-input:focus + .search-icon,
.search-input:focus ~ .search-icon {
  color: var(--accent);
}

.clear-search-btn {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.clear-search-btn:hover {
  color: #ef4444;
}

.clear-icon {
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 30px;
  }
  .hero-subtitle {
    font-size: 15px;
  }
}

/* Status Messages */
.status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: var(--text);
  gap: 16px;
}

.error-icon,
.empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 8px;
}

.error-icon {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.empty-icon {
  color: var(--accent);
  background: var(--accent-bg);
}

.status-wrapper h3 {
  font-size: 20px;
  color: var(--text-h);
  margin: 0;
}

.status-wrapper p {
  max-width: 400px;
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
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

/* Catalog Grid Styling */
.section-title {
  font-size: 24px;
  color: var(--text-h);
  margin-bottom: 32px;
  font-weight: 700;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
}

.item-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.item-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(170, 59, 255, 0.1);
}

/* Image Placeholder & Wrapper */
.card-image-wrapper {
  position: relative;
  height: 180px;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-card:hover .item-image {
  transform: scale(1.05);
}

.card-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--bg-hover) 0%, rgba(170, 59, 255, 0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.box-icon {
  width: 48px;
  height: 48px;
  color: rgba(170, 59, 255, 0.3);
}

.category-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Content */
.card-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.item-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.item-price {
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
}

.price-period {
  font-size: 13px;
  color: var(--text);
}

.item-info {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
}

.info-icon {
  width: 16px;
  height: 16px;
  color: var(--accent);
  flex-shrink: 0;
}

.description-row {
  margin-top: 8px;
  border-top: 1px dashed var(--border);
  padding-top: 8px;
}

.description-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: auto;
}

.rent-btn {
  width: 100%;
  padding: 12px;
  background: var(--bg-hover);
  color: var(--text-h);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.item-card:hover .rent-btn {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(170, 59, 255, 0.2);
}

.rent-btn:active {
  transform: scale(0.98);
}

.delete-btn {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.delete-btn:active {
  transform: scale(0.98);
}

/* Spinner Animation */
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
</style>
