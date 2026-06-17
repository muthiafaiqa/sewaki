<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import api from '../services/api';

Chart.register(...registerables);

const isLoading = ref(true);
const errorMessage = ref('');
const dashboardData = ref(null);
const chartCanvas = ref(null);
let chartInstance = null;

const formatPrice = (value) => {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getStatusClass = (status) => {
  if (!status) return 'status-default';
  const val = status.toLowerCase();
  if (val === 'dibayar' || val === 'selesai') return 'status-paid';
  if (val === 'menunggu_pembayaran') return 'status-pending';
  if (val === 'sedang_disewa') return 'status-renting';
  if (val === 'menunggu_inspeksi') return 'status-inspection';
  return 'status-failed';
};

const getStatusLabel = (status) => {
  if (!status) return 'Tidak Diketahui';
  const val = status.toLowerCase();
  if (val === 'dibayar') return 'Dibayar';
  if (val === 'selesai') return 'Selesai';
  if (val === 'menunggu_pembayaran') return 'Menunggu Pembayaran';
  if (val === 'sedang_disewa') return 'Sedang Disewa';
  if (val === 'menunggu_inspeksi') return 'Menunggu Verifikasi Pemilik';
  return status;
};

const fetchDashboardData = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get('/api/dashboard/stats');
    dashboardData.value = response.data?.data || response.data;
    
    await nextTick();
    if (dashboardData.value?.pendapatanBulanan) {
      renderChart(dashboardData.value.pendapatanBulanan);
    }
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    errorMessage.value = error.response?.data?.message || 'Gagal memuat data statistik dashboard.';
  } finally {
    isLoading.value = false;
  }
};

const renderChart = (monthlyData) => {
  if (chartInstance) {
    chartInstance.destroy();
  }
  if (!chartCanvas.value) return;

  const ctx = chartCanvas.value.getContext('2d');
  
  const monthNames = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };

  const labels = monthlyData.map(d => {
    const parts = d.bulan.split('-');
    return `${monthNames[parts[1]] || parts[1]} ${parts[0]}`;
  });

  const data = monthlyData.map(d => d.pendapatan);

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pendapatan (Rp)',
        data: data,
        backgroundColor: 'rgba(170, 59, 255, 0.65)',
        borderColor: 'rgba(170, 59, 255, 1)',
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1e1b29',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#aa3bff',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.08)'
          },
          ticks: {
            color: '#a0aec0',
            font: {
              family: 'inherit'
            },
            callback: function(value) {
              if (value >= 1000000) return (value / 1000000) + ' Jt';
              if (value >= 1000) return (value / 1000) + ' Rb';
              return value;
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#a0aec0',
            font: {
              family: 'inherit'
            }
          }
        }
      }
    }
  });
};

const showWithdrawModal = ref(false);
const withdrawForm = ref({
  bankCode: 'BCA',
  accountNumber: '',
  accountName: '',
  amount: 0,
});
const withdrawLoading = ref(false);
const withdrawError = ref('');
const withdrawSuccess = ref('');
const userProfile = ref(null);

const openWithdrawModal = async () => {
  withdrawError.value = '';
  withdrawSuccess.value = '';
  withdrawForm.value.amount = dashboardData.value?.saldoBisaDicairkan || 0;
  showWithdrawModal.value = true;
  
  // Ambil profil user jika belum ada
  if (!userProfile.value) {
    try {
      const response = await api.get('/api/auth/profile');
      userProfile.value = response.data?.data || response.data;
      if (userProfile.value?.nama) {
        withdrawForm.value.accountName = userProfile.value.nama;
      }
    } catch (err) {
      console.error('Gagal mengambil profil user:', err);
    }
  }
};

const closeWithdrawModal = () => {
  showWithdrawModal.value = false;
};

const handleWithdraw = async () => {
  withdrawError.value = '';
  withdrawSuccess.value = '';

  if (!withdrawForm.value.bankCode) {
    withdrawError.value = 'Kode Bank wajib dipilih!';
    return;
  }
  if (!withdrawForm.value.accountNumber) {
    withdrawError.value = 'Nomor Rekening wajib diisi!';
    return;
  }
  if (!withdrawForm.value.accountName) {
    withdrawError.value = 'Nama Pemilik Rekening wajib diisi!';
    return;
  }
  if (!withdrawForm.value.amount || withdrawForm.value.amount <= 0) {
    withdrawError.value = 'Jumlah dana penarikan harus lebih besar dari 0!';
    return;
  }
  if (withdrawForm.value.amount > (dashboardData.value?.saldoBisaDicairkan || 0)) {
    withdrawError.value = 'Jumlah dana penarikan melebihi saldo yang bisa dicairkan!';
    return;
  }

  withdrawLoading.value = true;
  try {
    const payload = {
      id_transaksi: `wd-${Date.now()}`,
      jumlah_uang: parseInt(withdrawForm.value.amount, 10),
      kode_bank: withdrawForm.value.bankCode,
      nama_pemilik_rekening: withdrawForm.value.accountName,
      nomor_rekening: withdrawForm.value.accountNumber,
      deskripsi: `Penarikan Saldo Pemilik SewaKi`,
      email_user: userProfile.value?.email || ''
    };

    const response = await api.post('/api/payments/withdraw', payload);
    
    if (response.data?.success) {
      withdrawSuccess.value = 'Yeay! Penarikan dana berhasil diproses. Silakan cek email Anda.';
      // Refresh dashboard data
      await fetchDashboardData();
      setTimeout(() => {
        closeWithdrawModal();
      }, 2000);
    } else {
      withdrawError.value = response.data?.message || 'Gagal melakukan penarikan dana.';
    }
  } catch (err) {
    console.error('Withdraw error:', err);
    withdrawError.value = err.response?.data?.error_detail || err.response?.data?.message || 'Terjadi kesalahan sistem saat melakukan penarikan dana.';
  } finally {
    withdrawLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div class="dashboard-container">
    <div class="header-section">
      <h1>Dashboard Pemilik</h1>
      <p class="subtitle">Pantau performa bisnis rental Anda secara langsung.</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-wrapper">
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <p>Memuat data dashboard...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-wrapper">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3>Gagal Memuat Dashboard</h3>
      <p>{{ errorMessage }}</p>
      <button @click="fetchDashboardData" class="retry-btn">Coba Lagi</button>
    </div>

    <!-- Content State -->
    <div v-else class="dashboard-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <!-- Card 1: Total Pendapatan -->
        <div class="stat-card">
          <div class="stat-icon-wrapper income">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
              <line x1="12" y1="4" x2="12" y2="20"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Pendapatan</span>
            <h2 class="stat-value">{{ formatPrice(dashboardData.totalPendapatan) }}</h2>
          </div>
        </div>

        <!-- Card 2: Barang Disewa -->
        <div class="stat-card">
          <div class="stat-icon-wrapper rented">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Barang Disewa</span>
            <h2 class="stat-value">{{ dashboardData.barangSedangKeluar }} unit</h2>
          </div>
        </div>

        <!-- Card 3: Total Transaksi -->
        <div class="stat-card">
          <div class="stat-icon-wrapper transactions">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Transaksi</span>
            <h2 class="stat-value">{{ dashboardData.totalTransaksi }} kali</h2>
          </div>
        </div>

        <!-- Card 4: Rating Rata-rata -->
        <div class="stat-card">
          <div class="stat-icon-wrapper rating">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Rating Rata-rata</span>
            <h2 class="stat-value">{{ dashboardData.rataRating > 0 ? dashboardData.rataRating + ' / 5.0' : 'Belum Ada' }}</h2>
          </div>
        </div>

        <!-- Card 5: Saldo Ditahan -->
        <div class="stat-card">
          <div class="stat-icon-wrapper escrow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Saldo Ditahan</span>
            <h2 class="stat-value">{{ formatPrice(dashboardData.saldoDitahan) }}</h2>
          </div>
        </div>

        <!-- Card 6: Saldo Bisa Dicairkan -->
        <div class="stat-card balance-card">
          <div class="stat-flex">
            <div class="stat-icon-wrapper withdrawable">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Saldo Bisa Dicairkan</span>
              <h2 class="stat-value">{{ formatPrice(dashboardData.saldoBisaDicairkan) }}</h2>
            </div>
          </div>
          <button 
            @click="openWithdrawModal" 
            class="withdraw-btn"
            :disabled="!dashboardData.saldoBisaDicairkan || dashboardData.saldoBisaDicairkan <= 0"
          >
            Tarik Dana
          </button>
        </div>
      </div>

      <!-- Chart Trend -->
      <div class="chart-card">
        <h3>Tren Pendapatan Bulanan</h3>
        <div class="chart-wrapper">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <!-- Recent Transactions Table -->
      <div class="table-card">
        <h3>5 Transaksi Terbaru</h3>
        <div class="table-responsive">
          <table class="recent-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Barang</th>
                <th>Masa Sewa</th>
                <th>Total Harga</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="dashboardData.recentTransactions.length === 0">
                <td colspan="5" class="empty-table">Belum ada transaksi yang tercatat.</td>
              </tr>
              <tr v-else v-for="tx in dashboardData.recentTransactions" :key="tx.id">
                <td>{{ formatDate(tx.createdAt) }}</td>
                <td class="item-cell">
                  <div class="item-info">
                    <span class="item-name">{{ tx.item?.nama_barang || 'Barang' }}</span>
                  </div>
                </td>
                <td>{{ formatDate(tx.tanggal_mulai) }} - {{ formatDate(tx.tanggal_selesai) }}</td>
                <td class="price-cell">{{ formatPrice(tx.total_harga) }}</td>
                <td>
                  <span :class="['badge', getStatusClass(tx.status_transaksi)]">
                    {{ getStatusLabel(tx.status_transaksi) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Tarik Dana -->
    <transition name="fade">
      <div v-if="showWithdrawModal" class="modal-overlay" @click.self="closeWithdrawModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Form Tarik Dana</h3>
            <button @click="closeWithdrawModal" class="close-modal-btn">&times;</button>
          </div>
          
          <form @submit.prevent="handleWithdraw" class="withdraw-form">
            <!-- Alert Box for Error -->
            <div v-if="withdrawError" class="modal-alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ withdrawError }}</span>
            </div>

            <!-- Alert Box for Success -->
            <div v-if="withdrawSuccess" class="modal-alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{{ withdrawSuccess }}</span>
            </div>

            <!-- Bank Code -->
            <div class="form-group">
              <label for="bankCode">Pilih Bank</label>
              <select id="bankCode" v-model="withdrawForm.bankCode" class="form-select">
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="MANDIRI">Mandiri</option>
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="CIMB">CIMB Niaga</option>
              </select>
            </div>

            <!-- Account Number -->
            <div class="form-group">
              <label for="accountNumber">Nomor Rekening</label>
              <input 
                id="accountNumber" 
                type="text" 
                v-model="withdrawForm.accountNumber" 
                placeholder="Masukkan nomor rekening tujuan" 
                required
              />
            </div>

            <!-- Account Name -->
            <div class="form-group">
              <label for="accountName">Nama Pemilik Rekening</label>
              <input 
                id="accountName" 
                type="text" 
                v-model="withdrawForm.accountName" 
                placeholder="Masukkan nama pemilik rekening" 
                required
              />
            </div>

            <!-- Amount -->
            <div class="form-group">
              <label for="amount">Jumlah Penarikan (Rp)</label>
              <input 
                id="amount" 
                type="number" 
                v-model.number="withdrawForm.amount" 
                :max="dashboardData.saldoBisaDicairkan"
                min="1"
                required
              />
              <span class="amount-helper">Maksimal penarikan: {{ formatPrice(dashboardData.saldoBisaDicairkan) }}</span>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeWithdrawModal" class="btn-cancel" :disabled="withdrawLoading">Batal</button>
              <button type="submit" class="btn-submit" :disabled="withdrawLoading">
                <span v-if="withdrawLoading">Memproses...</span>
                <span v-else>Konfirmasi Penarikan</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  box-sizing: border-box;
}

.header-section {
  text-align: left;
  margin-bottom: 32px;
}

.header-section h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-h);
  margin: 0 0 8px 0;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin: 0;
}

/* Loading and Error States */
.loading-wrapper,
.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: var(--text);
  gap: 16px;
}

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

.error-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
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

/* Stats Cards Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow);
  transition: border-color 0.3s;
}

.stat-card:hover {
  border-color: var(--accent-border);
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrapper svg {
  width: 24px;
  height: 24px;
}

.stat-icon-wrapper.income {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon-wrapper.rented {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon-wrapper.transactions {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.stat-icon-wrapper.rating {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stat-info {
  text-align: left;
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-h);
  margin: 4px 0 0 0;
}

/* Chart Card Styling */
.chart-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
  margin-bottom: 32px;
}

.chart-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h);
  text-align: left;
}

.chart-wrapper {
  position: relative;
  height: 320px;
  width: 100%;
}

/* Recent Transactions Table Card */
.table-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
}

.table-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h);
  text-align: left;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.recent-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.recent-table th {
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-table td {
  padding: 16px;
  font-size: 14px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.recent-table tr:last-child td {
  border-bottom: none;
}

.item-cell {
  font-weight: 600;
  color: var(--text-h);
}

.price-cell {
  font-weight: 600;
  color: var(--text-h);
}

.empty-table {
  text-align: center;
  padding: 32px !important;
  color: var(--text-muted);
}

/* Status Badges */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: capitalize;
}

.badge.status-paid {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.badge.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge.status-renting {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.badge.status-inspection {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.badge.status-failed {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.badge.status-default {
  background: var(--bg-hover);
  color: var(--text-muted);
  border: 1px solid var(--border);
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

/* Balance Card & Escrow styles */
.stat-flex {
  display: flex;
  align-items: center;
  gap: 20px;
}

.balance-card {
  justify-content: space-between !important;
  position: relative;
}

.withdraw-btn {
  padding: 10px 18px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.withdraw-btn:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(170, 59, 255, 0.2);
}

.withdraw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--border);
  color: var(--text-muted);
}

.stat-icon-wrapper.escrow {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.stat-icon-wrapper.withdrawable {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

/* Modal Tarik Dana */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  padding: 32px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
  animation: modalEnter 0.3s ease-out;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-h);
}

.close-modal-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-muted);
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
}

.close-modal-btn:hover {
  color: var(--text-h);
}

.withdraw-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.modal-alert.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.modal-alert.alert-success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.modal-alert .alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.form-group label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-h);
}

.form-group input,
.form-group select {
  padding: 12px 16px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-h);
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--accent);
}

.amount-helper {
  font-size: 12px;
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--border);
  color: var(--text-h);
}

.btn-submit {
  padding: 10px 20px;
  background: var(--accent);
  border: none;
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
