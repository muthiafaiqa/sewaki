**NFR, SLA & Observability - Praktik Menentukan Target Performa**

Contoh studi kasus dan dokumen dari NFR, Observability dan SLA

**Key Takeaway**: Sistem seperti e-commerce yang "bisa jualan" (fungsional) tapi tidak punya NFR yang jelas akan gagal saat skala bertambah. Investasi di awal untuk NFR, SLA, dan observability akan menghemat biaya troubleshooting dan kehilangan revenue di kemudian hari.

## **NFR = Non Functional Requirements** {#nfr-non-functional-requirements}

## 1. Studi Kasus NFR --- E-Commerce Real-World {#studi-kasus-nfr-e-commerce-real-world}

### Kasus: Tokopedia / Shopee pada Flash Sale {#kasus-tokopedia-shopee-pada-flash-sale}

**Skenario**: Saat flash sale (misalnya 12.12), traffic bisa melonjak 10-50x dalam hitungan detik. Tanpa NFR yang jelas, sistem akan crash.

| Aspek NFR | Target yang Harus Ditetapkan | Konsekuensi Jika Tidak |
|----|----|----|
| **Performa** | Response time checkout \< 2 detik, support 100.000+ concurrent users | User abandon cart, rugi miliaran rupiah |
| **Skalabilitas** | Auto-scale dalam 30 detik saat CPU \> 70% | Server overload, downtime |
| **Keamanan** | 100% data pembayaran terenkripsi, rate limit API 1000 req/menit | Data breach, fraud |
| **Ketersediaan** | 99.9% uptime selama event (maksimal 43.8 menit downtime/bulan) | Kehilangan kepercayaan pengguna |

**Pelajaran**: NFR yang buruk = "load 10 user sudah error" (seperti contoh di slide Anda). NFR yang baik = semua target terukur dengan angka.

## **SLA = Service Level Agreements** {#sla-service-level-agreements}

## 2. Studi Kasus SLA --- Google Cloud GKE (Real Document) {#studi-kasus-sla-google-cloud-gke-real-document}

Google Cloud menyediakan SLA yang sangat detail untuk layanan GKE (Google Kubernetes Engine) Autopilot:

| Komponen | SLO | Error Budget | Konsekuensi Gagal |
|----|----|----|----|
| **Control Plane** | 99.95% uptime/bulan | 21.6 menit downtime | 10-50% credit bulanan |
| **Pods Multi-Zone** | 99.9% uptime/bulan | 43.8 menit downtime | Eskalasi otomatis |

**Contoh Perhitungan**: Untuk September (30 hari = 43.200 menit):\
- SLO 99.95% = maksimal 0.05% × 43.200 = **21.6 menit downtime**\
- Jika downtime 22-432 menit → **10% credit**\
- Jika downtime \> 432 menit → **25% credit**\
- Jika downtime \> 2.160 menit → **50% credit**

**Prinsip**: SLA harus **terukur, realistis, dan punya konsekuensi jelas** --- bukan sekadar "sebaik mungkin"

## Dokumen Praktis --- Template SLA {#dokumen-praktis-template-sla}

### A. Contoh/Template SLA Document {#a.-contohtemplate-sla-document}

═══════════════════════════════════════════════════════\
SLA DOCUMENT --- \[Nama Sistem\]\
═══════════════════════════════════════════════════════\
\
1. INFORMASI LAYANAN\
Nama Layanan : \[Contoh: Pemrosesan Pesanan\]\
Deskripsi : \[Deskripsi singkat\]\
Pemilik : \[Tim Engineering\]\
\
2. TARGET LAYANAN (SLO)\
┌─────────────────┬────────────────────┬──────────┐\
│ Metrik (SLI) │ Target (SLO) │ Periode │\
├─────────────────┼────────────────────┼──────────┤\
│ Availability │ 99.9% │ Bulanan │\
│ Latency (p95) │ \< 500ms │ Bulanan │\
│ Error Rate │ \< 0.5% │ Bulanan │\
│ Throughput │ 1000 order/menit │ Bulanan │\
└─────────────────┴────────────────────┴──────────┘\
\
3. ERROR BUDGET\
SLO Availability: 99.9% → Budget: 0.1% = 43.8 menit/bulan\
Burn Rate Alert: Jika 2% budget terpakai dalam 1 jam → page on-call\
\
4. MONITORING & TOOLS\
Dashboard : Grafana\
Metrics : Prometheus\
Logs : ELK Stack / Loki\
Traces : Jaeger / Zipkin\
Alerting : PagerDuty / Opsgenie\
\
5. TINDAKAN JIKA GAGAL\
Level 1 (\< 1 menit) : Alert → On-call engineer\
Level 2 (15 menit) : Triage → Analisis root cause\
Level 3 (30 menit) : Mitigate → Quick fix / rollback\
Level 4 (1-3 hari) : Resolve → Fix permanen\
Level 5 (1 minggu) : Post-mortem → Dokumentasi & preventive\
\
6. KONSEKUENSI\
SLO miss 99.0-99.9% : Eskalasi ke Engineering Lead\
SLO miss 95.0-99.0% : SLA credit 10%\
SLO miss \< 95.0% : SLA credit 25%, eskalasi ke VP\
\
7. REVIEW\
Frekuensi: Setiap kuartal\
Trigger : Perubahan arsitektur atau 3x SLO miss berturut-turut\
═══════════════════════════════════════════════════════

Contoh **dokumen SLA** dari perusahaan teknologi besar yang dipublikasikan secara resmi.\
Dokumen-dokumen ini adalah **kontrak legal nyata** yang mengikat perusahaan dan customer, bukan teori atau template.

## 1. AWS Managed Services SLA (Dokumen PDF Resmi) {#aws-managed-services-sla-dokumen-pdf-resmi}

**Sumber**: Dokumen kontrak resmi AWS yang dipublikasikan di s3.amazonaws.com

### Service Commitment & Credit Table (SCCT) --- Data Nyata: {#service-commitment-credit-table-scct-data-nyata}

| Service Commitment | KPI | Plus Plan | Premium Plan | Conformance | Service Credit |
|----|----|----|----|----|----|
| **API Availability** | API Availability Percentage | ≥99.95% | ≥99.95% | 100% | 0.5% |
| **Console Availability** | Console Availability Percentage | ≥99.95% | ≥99.95% | 100% | 0.5% |
| **Incident Response P1** | Response Time Priority 1 | ≤4 hours | ≤15 menit | 95% | 3% |
| **Incident Response P2** | Response Time Priority 2 | ≤8 hours | ≤4 hours | 95% | 2% |
| **Incident Response P3** | Response Time Priority 3 | ≤24 jam | ≤12 jam | 90% | 1% |
| **Incident Resolution P1** | Resolution Time Priority 1 | ≤12 jam | ≤4 jam | 95% | 6% |
| **Incident Resolution P2** | Resolution Time Priority 2 | ≤24 jam | ≤8 jam | 95% | 4% |
| **Patch Management** | Patching Time Security Update | 10 hari kerja | 6 hari kalender | 100% | 4% |
| **Environment Recovery** | Recovery Initiation Time | 2 bulan | 2 bulan | 95% | 3% |

### Definisi:

- **"Unavailable"**: Request menghasilkan error atau response 5xx HTTP

- **"Conformance"**: Persentase waktu AWS harus memenuhi service commitment dalam satu billing cycle bulanan

- **"Service Credit"**: Kredit dolar yang dikembalikan ke akun AWS, maksimal 30% dari total biaya bulanan

- **SLA Exclusions**: Force majeure, actions/inactions customer, equipment pihak ketiga, maintenance window (Kamis ke-2 setiap bulan jam 3-4pm PT)

**Proses Claim**: Customer harus submit claim via service request dalam AWS Managed Services Interface dengan subject "SLA Credit Request", menyertakan tanggal/waktu insiden dan log files. AWS review dalam satu billing cycle.

## 2. Microsoft Azure SLA --- Dokumen Resmi (Consolidated SLA) {#microsoft-azure-sla-dokumen-resmi-consolidated-sla}

**Sumber**: Dokumen konsolidasi SLA Microsoft untuk semua layanan online

### Definisi Resmi dari Dokumen Microsoft:

| Term | Definisi Nyata |
|----|----|
| **"Applicable Period"** | 30 hari sebelum dan termasuk hari pertama insiden (untuk metered Pay As You Go) |
| **"Downtime"** | Didefinisikan per service di Service Specific Terms. Tidak termasuk Scheduled Downtime |
| **"Scheduled Downtime"** | Periode downtime terkait maintenance/upgrade. Notice minimal 5 hari sebelumnya |
| **"Service Credit"** | Persentase dari Applicable Service Fees yang dikreditkan setelah claim disetujui Microsoft |
| **"User Minutes"** | Total menit dalam Applicable Period dikurangi Scheduled Downtime, dikali total users |

### 

### Contoh Service Credit --- Azure Cosmos DB: {#contoh-service-credit-azure-cosmos-db}

| Throughput Percentage | Service Credit |
|-----------------------|----------------|
| \< 99.99%             | 10%            |
| \< 99%                | 25%            |

### Contoh Composite SLA (Arsitektur Azure):

| Komponen | SLO |
|----|----|
| Microsoft Entra ID | 99.99% |
| Azure Bastion | 99.95% |
| Application Gateway | 99.95% |
| Azure Load Balancer | 99.99% |
| Front-end VMs (premium storage) | 99.70% |
| **Composite SLO** | **99.34%** (downtime per tahun: 2d 9h 42m 18s) |

**Catatan Penting**: Azure DNS adalah satu-satunya layanan dengan **100% SLA** --- "valid DNS requests will receive a response from at least one Azure DNS name server 100% of the time"

## 3. Google Cloud Compute Engine SLA {#google-cloud-compute-engine-sla}

**Sumber**: Dokumen resmi Google Cloud Platform

### Komitmen Nyata Google:

- **Monthly Uptime Percentage**: Minimal **99.95%**

- **Financial Credits**: Customer eligible untuk kredit finansial jika SLA tidak tercapai

- **Maximum Financial Credit**: **50%** dari amount due untuk Covered Service di bulan tersebut

- **Cara Hitung**: Downtime = loss of external connectivity OR persistent disk access

- **Claim Process**: Customer harus notify Google technical support dalam **30 hari** dari waktu eligible, dengan server log files yang menunjukkan loss of external connectivity errors

### SLA Exclusions:

1.  Features experimental, limited preview, atau preview

2.  Errors caused by factors outside Google's reasonable control

3.  Errors dari customer's software/hardware atau third party

4.  Errors dari abuses atau behaviors yang violate Agreement

5.  Errors dari quotas yang diterapkan system

## 4. Atlassian Cloud SLA --- Dokumen Legal Resmi {#atlassian-cloud-sla-dokumen-legal-resmi}

**Sumber**: atlassian.com/legal/sla --- dokumen legal yang berlaku efektif 30 April 2026

### Perhitungan Uptime Nyata Atlassian:

**Contoh Perhitungan** (dari dokumen resmi): - Total menit dalam bulan 30 hari: **43.200** - Downtime Minutes: **60** - Persentase Downtime: 60/43.200 = **0.138889%** - Monthly Uptime: 100% - 0.138889% = **99.86%** - **Service Credit**: 10% dari monthly fees untuk affected product

### Definisi "Downtime Minute":

"Downtime Minute terjadi ketika Error Rate dalam satu menit **lebih besar dari 5%**"

### Error Rate:

"Error Rate = persentase request customer ke Covered Experiences yang menghasilkan error dari total request ke Covered Experiences dalam periode 1 menit"

### Target SLA per Plan:

| Plan           | Service Level Commitment |
|----------------|--------------------------|
| **Premium**    | 99.90% uptime            |
| **Enterprise** | 99.95% uptime            |

### Covered Experiences (yang di-cover SLA):

- Jira: Viewing, creating, editing issues dan viewing boards

- Jira Service Management: Viewing dan editing issues, viewing queues, raising requests

- Confluence: Viewing, creating, editing pages dan adding comments

- Bitbucket: Pull request create, view diff, approve, Git transactions HTTPS/SSH

- **Tidak dicover**: Integrations, API calls, mobile experiences (kecuali Bitbucket Git transactions)

## 5. Azure SQL Database SLA ---  {#azure-sql-database-sla}

**Sumber**: Pengumuman resmi Microsoft 2019

### Komitmen Nyata Microsoft untuk Azure SQL Database Business Critical:

- **SLA**: **99.995%** uptime (tertinggi di industri untuk relational database)

- **Downtime per tahun**: Hanya **26.28 menit** (setengah dari 99.99% = 52.56 menit)

- **Business Continuity SLA** (dengan geo-replication):

  - **RPO** (Recovery Point Objective): **5 detik**

  - **RTO** (Recovery Time Objective): **30 detik**

  - **Service Credit jika gagal**: **100%** monthly cost dari secondary database

*"Azure SQL Database is the only relational database service in the industry offering a business continuity SLA"* --- Alexander Nosov, Principal Program Manager, Azure SQL Database

## 6. ClearDATA SLA --- Dokumen Kontrak Nyata (Healthcare Cloud) {#cleardata-sla-dokumen-kontrak-nyata-healthcare-cloud}

**Sumber**: Dokumen kontrak resmi ClearDATA

### Service Level Commitments:

| Severity Level | Definisi | Response Time | Credit |
|----|----|----|----|
| **1 -- Emergency** | Down device/service, no workaround | 15 menit | 1% fee + 0.5% per time increment, max 100% |
| **2 -- Urgent** | Degraded device/service, no workaround | 60 menit | Sama |
| **3 -- Request/Question** | Service/change request atau question | 24 jam | Sama |

### Cloud Infrastructure SLA:

- ClearDATA tidak menjamin AWS infrastructure secara independen, tapi **pass through credit** dari AWS ke customer

- Jika aplikasi unavailable \> 30 menit karena ClearDATA Healthcare Infrastructure error: **5% credit** + 3% per 30 menit tambahan, max 100%

- Portal unavailable \> 30 menit: **2% credit** + 1% per 30 menit tambahan

### SLA Exclusions ClearDATA:

- AWS maintenance

- ClearDATA scheduled maintenance (midnight--4:00am US Central Time, notice 5 hari kerja)

- Capacity restraints dari service yang dipilih

- Force majeure events

- Customer breach of agreement

- Unsupported services

- Restriction of logical access

## 7. Datadog SLA  {#datadog-sla}

**Sumber**: Diskusi komunitas DevOps dan Hacker News

### Fakta Nyata tentang Datadog SLA:

- **Uptime SLA**: Hanya **99.8%** (relatif rendah untuk industri)

- **Dampak**: \~1.5 jam downtime per bulan diizinkan

- **Konsekuensi**: Bukan service credit, melainkan **hanya boleh cancel contract** di bulan kalender setelah 2 bulan tidak memenuhi SLA

*"99.8% is not that high of an SLA. That's \~1.5 hours of downtime per month, which I would consider pretty average or even mediocre"* --- komentar di Hacker News

## Ringkasan Dokumen SLA Nyata dari Perusahaan

| Perusahaan | SLA Uptime | Konsekuensi Gagal | Dokumen |
|----|----|----|----|
| **AWS Managed Services** | 99.95% (API/Console) | Service Credit 0.5-6% | PDF resmi AWS |
| **Microsoft Azure** | 99.9%-99.99% (VM) | Service Credit 10-100% | Consolidated SLA |
| **Google Cloud** | 99.95% (Compute Engine) | Financial Credit max 50% | Resmi GCP |
| **Atlassian Premium** | 99.90% | Service Credit 10% | atlassian.com/legal/sla |
| **Atlassian Enterprise** | 99.95% | Service Credit | atlassian.com/legal/sla |
| **Azure SQL Database BC** | 99.995% | 100% credit (geo-replication) | Pengumuman resmi MS |
| **ClearDATA** | 99.9%+ | Credit 1-100% | Kontrak resmi |
| **Datadog** | 99.8% | Cancel contract only | Service Terms |

## Link Dokumen Asli  {#link-dokumen-asli}

1.  **AWS Managed Services SLA PDF**: https://s3.amazonaws.com/ams.contract.docs/AWS+Managed+Services+Service+Level+Agreement.pdf

2.  **Microsoft Azure SLA Portal**: https://azure.microsoft.com/en-us/support/legal/sla/

3.  **Google Cloud Compute Engine SLA**: https://cloud.google.com/compute/sla

4.  **Atlassian SLA**: https://www.atlassian.com/legal/sla

5.  **Azure SQL Database SLA**: https://azure.microsoft.com/en-us/support/legal/sla/sql-database/

**Observability = LOGS, METRICS, TRACE**\
3. Studi Kasus Observability --- Netflix (Three Pillars) {#observability-logs-metrics-trace-3.-studi-kasus-observability-netflix-three-pillars}
--------------------------------------------------------

Netflix menangani **1 miliar+ request/hari** dengan arsitektur microservices. Tanpa observability, debugging butuh hari. Dengan observability, butuh menit.

### Three Pillars dalam Praktik Netflix:

| Pilar | Implementasi | Manfaat |
|----|----|----|
| **Metrics** | Time-series data: CPU, memory, request rate, error rate, latency p95/p99 | Alert otomatis saat threshold terlampaui |
| **Logs** | Structured logging (JSON) untuk setiap event: request masuk, error, transaksi | Forensik: "Siapa, apa, kapan, di mana, bagaimana" |
| **Traces** | Distributed tracing: Frontend → API Gateway → Auth → Order → Payment → DB | Identifikasi bottleneck latency antar service |

**Contoh Skenario**: User lapor checkout lambat. - **Metrics**: Alert CPU database spike 95% - **Traces**: Trace menunjukkan request macet 3 detik di service Payment - **Logs**: Log Payment service menampilkan error timeout ke gateway bank

**Waktu penyelesaian**: Dari yang biasanya **8 jam** menjadi **15 menit**.

**Rencana Operasional**\
4. Studi Kasus -- Rencana Operasional {#rencana-operasional-4.-studi-kasus-rencana-operasional}
-------------------------------------

### B. Template Post-Mortem (Berdasarkan Google SRE) {#b.-template-post-mortem-berdasarkan-google-sre}

═══════════════════════════════════════════════════════\
POST-MORTEM --- \[Nama Insiden\]\
═══════════════════════════════════════════════════════\
\
Date : \[YYYY-MM-DD\]\
Authors : \[Nama Engineer\]\
Status : Complete / Action items in progress\
\
SUMMARY\
\[Deskripsi 2-3 kalimat: Apa yang terjadi?\]\
\
IMPACT\
- Durasi downtime : \[X menit\]\
- Request lost : \[X juta\]\
- Revenue impact : \[Rp X / Tidak ada\]\
- User affected : \[X%\]\
\
ROOT CAUSE\
\[Penjelasan teknis: Mengapa ini terjadi?\]\
\
TRIGGER\
\[Apa yang memicu insiden? Contoh: Latent bug + traffic spike\]\
\
DETECTION\
\[Bagaimana terdeteksi? Alert dari tool apa?\]\
\
RESOLUTION\
\[Bagaimana diperbaiki? Quick fix vs permanent fix\]\
\
TIMELINE\
HH:MM - Alert terpicu\
HH:MM - On-call engineer acknowledge\
HH:MM - Root cause identified\
HH:MM - Mitigation applied\
HH:MM - Service restored\
HH:MM - Permanent fix deployed\
\
ACTION ITEMS\
┌─────────────────────────────────┬──────────┬────────┐\
│ Action Item │ Type │ Owner │\
├─────────────────────────────────┼──────────┼────────┤\
│ \[Preventif/Mitigasi/Process\] │ prevent │ \[Nama\] │\
│ \[Update playbook\] │ mitigate │ \[Nama\] │\
│ \[Add monitoring/alert\] │ detect │ \[Nama\] │\
└─────────────────────────────────┴──────────┴────────┘\
\
LESSONS LEARNED\
\[Apa yang bisa dilakukan lebih baik?\]\
═══════════════════════════════════════════════════════

**Contoh Post-Mortem Nyata**: Google pernah mengalami insiden "Shakespeare Sonnet++" di mana 1.21 miliar query hilang karena cascading failure saat traffic melonjak akibat penemuan sonnet baru. Mereka menggunakan post-mortem untuk mengidentifikasi resource leak dan memperbarui playbook.

## 5. Ringkasan  {#ringkasan}

| Konsep | Studi Kasus | Dokumen yang Bisa Dibuat |
|----|----|----|
| **NFR** | Tokopedia Flash Sale --- response time, scalability | NFR Specification Document |
| **SLA/SLO** | Google Cloud GKE --- 99.95% uptime, error budget | SLA Document, SLO Dashboard |
| **Observability** | Netflix --- 1 miliar request/hari, MTTR menit | Monitoring Runbook, Alerting Rules |
| **Operasional** | Google SRE --- Post-mortem Shakespeare | Post-Mortem Template, Incident Response Playbook |

### Checklist : {#checklist}

1.  ✅ Definisikan NFR dengan angka (bukan "cepat" atau "aman")

2.  ✅ Tetapkan SLO realistis dan hitung error budget

3.  ✅ Implementasikan 3 pillars observability sebelum go-live

4.  ✅ Buat SLA document yang accessible semua tim

5.  ✅ Latih incident response dan post-mortem secara berkala

Tambahkan Document to be Delivered pada Penugasan Proyek anda :

- NFR

- SLA

- Rancangan Observability

> Rencana Operasional (Pelengkap)

Hints : setiap isi dokumen agar terkait dan terhubung,
