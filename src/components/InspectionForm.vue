<template>
  <div class="inspection-form">
    <h3>Inspeksi Pengembalian Barang</h3>
    
    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>
    
    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="submitInspection" v-if="!isCompleted">
      <div class="proof-section">
        <label>Bukti Pengembalian Barang</label>
        <div v-if="transaction.bukti_pengembalian" class="proof-image-wrapper">
          <a :href="getImageUrl(transaction.bukti_pengembalian)" target="_blank" title="Klik untuk memperbesar">
            <img :src="getImageUrl(transaction.bukti_pengembalian)" alt="Bukti Pengembalian" class="proof-img" />
          </a>
          <small class="help-text">Klik gambar untuk membuka di tab baru.</small>
        </div>
        <div v-else class="no-proof-alert">
          Penyewa belum mengunggah bukti pengembalian
        </div>
      </div>

      <div class="form-group">
        <label for="persen_kerusakan">Persentase Kerusakan (%)</label>
        <input 
          type="number" 
          id="persen_kerusakan" 
          v-model.number="persen_kerusakan" 
          min="0" 
          max="100" 
          class="form-control"
          placeholder="0 - 100"
        />
        <small class="help-text">Estimasi pemotongan: Rp {{ formatCurrency(potonganKerusakan) }}</small>
      </div>

      <div class="form-group">
        <label for="denda_keterlambatan">Denda Keterlambatan (Rp)</label>
        <input 
          type="number" 
          id="denda_keterlambatan" 
          v-model.number="denda_keterlambatan" 
          min="0" 
          class="form-control"
          placeholder="0"
        />
      </div>

      <div class="refund-summary">
        <h4>Ringkasan Pengembalian Dana</h4>
        <div class="summary-row">
          <span>Jaminan Deposit:</span>
          <span>Rp {{ formatCurrency(transaction.jaminan_deposit) }}</span>
        </div>
        <div class="summary-row">
          <span>Potongan Kerusakan:</span>
          <span>- Rp {{ formatCurrency(potonganKerusakan) }}</span>
        </div>
        <div class="summary-row">
          <span>Denda Keterlambatan:</span>
          <span>- Rp {{ formatCurrency(denda_keterlambatan || 0) }}</span>
        </div>
        <hr />
        <div class="summary-row total">
          <span>Sisa Deposit Dikembalikan:</span>
          <span :class="{ 'text-error': sisaDeposit <= 0 }">
            Rp {{ formatCurrency(sisaDeposit) }}
          </span>
        </div>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        {{ isLoading ? 'Memproses...' : 'Selesaikan Transaksi' }}
      </button>
    </form>
    
    <div v-else class="completion-state">
      <p>Transaksi ini telah diselesaikan.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  transaction: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['completed']);

// State
const persen_kerusakan = ref(0);
const denda_keterlambatan = ref(0);
const isLoading = ref(false);
const isCompleted = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Computed
const potonganKerusakan = computed(() => {
  const persen = persen_kerusakan.value || 0;
  const deposit = props.transaction?.jaminan_deposit || 0;
  return (persen / 100) * deposit;
});

const sisaDeposit = computed(() => {
  const deposit = props.transaction?.jaminan_deposit || 0;
  const potongan = potonganKerusakan.value || 0;
  const denda = denda_keterlambatan.value || 0;
  return Math.max(0, deposit - potongan - denda);
});

const jumlah_refund = sisaDeposit;

// Methods
const getImageUrl = (filename) => {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
};

const formatCurrency = (value) => {
  if (!value) return '0';
  return value.toLocaleString('id-ID');
};

const submitInspection = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (!token) {
    console.error('Token kosong');
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/transactions/complete/${props.transaction.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        persen_kerusakan: persen_kerusakan.value,
        denda_keterlambatan: denda_keterlambatan.value,
        jumlah_refund: jumlah_refund.value
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Terjadi kesalahan saat menyelesaikan transaksi');
    }

    successMessage.value = 'Transaksi berhasil diselesaikan! Dana refund akan dikembalikan ke penyewa.';
    isCompleted.value = true;
    emit('completed', await response.json());
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.inspection-form {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  margin: 0 auto;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.25rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 16px;
}

.proof-section {
  margin-bottom: 20px;
  background: #f7fafc;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.proof-section label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.proof-image-wrapper {
  text-align: center;
}

.proof-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #cbd5e0;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.proof-img:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.no-proof-alert {
  padding: 10px;
  background-color: #fffaf0;
  border: 1px solid #feebc8;
  color: #c05621;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
  font-weight: 500;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #4a5568;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.help-text {
  display: block;
  margin-top: 6px;
  color: #718096;
  font-size: 0.85rem;
}

.refund-summary {
  background-color: #f7fafc;
  border-radius: 6px;
  padding: 16px;
  margin: 20px 0;
  border: 1px solid #e2e8f0;
}

.refund-summary h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1rem;
  color: #2d3748;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #4a5568;
}

.summary-row.total {
  font-weight: bold;
  color: #1a202c;
  font-size: 1.1rem;
  margin-top: 12px;
  margin-bottom: 0;
}

hr {
  border: none;
  border-top: 1px solid #cbd5e0;
  margin: 12px 0;
}

.btn {
  display: inline-block;
  font-weight: 600;
  text-align: center;
  padding: 12px 20px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  color: #fff;
  background-color: #3182ce;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2b6cb0;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.alert-success {
  background-color: #c6f6d5;
  color: #22543d;
  border: 1px solid #9ae6b4;
}

.alert-error {
  background-color: #fed7d7;
  color: #742a2a;
  border: 1px solid #feb2b2;
}

.text-error {
  color: #e53e3e;
}

.completion-state {
  text-align: center;
  padding: 20px;
  color: #38a169;
  font-weight: 500;
}
</style>
