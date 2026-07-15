# Graph Report - sewaki-monolith  (2026-07-15)

## Corpus Check
- 56 files · ~26,440 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 398 nodes · 421 edges · 34 communities (22 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4edd801b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Business Operations|Core Business Operations]]
- [[_COMMUNITY_Inventory and Transactions|Inventory and Transactions]]
- [[_COMMUNITY_Server Architecture and Routing|Server Architecture and Routing]]
- [[_COMMUNITY_Database Setup and Connectivity|Database Setup and Connectivity]]
- [[_COMMUNITY_Project Configuration and Scripts|Project Configuration and Scripts]]
- [[_COMMUNITY_KYC Verification and Authentication|KYC Verification and Authentication]]
- [[_COMMUNITY_Route Security Middleware|Route Security Middleware]]
- [[_COMMUNITY_Item Catalog and Reviews Routing|Item Catalog and Reviews Routing]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_System Documentation and Overview|System Documentation and Overview]]
- [[_COMMUNITY_Review Module|Review Module]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Dashboard Statistics|Dashboard Statistics]]
- [[_COMMUNITY_Chat History Module|Chat History Module]]
- [[_COMMUNITY_Scratchpad User Mocking|Scratchpad User Mocking]]
- [[_COMMUNITY_Database Schema Setup|Database Schema Setup]]
- [[_COMMUNITY_Graphify Workflow Tools|Graphify Workflow Tools]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]

## God Nodes (most connected - your core abstractions)
1. `What You Must Do When Invoked` - 12 edges
2. `sendEmail()` - 11 edges
3. `/graphify` - 10 edges
4. `SewaKi Modular Monolith Architecture` - 10 edges
5. `graphify reference: extra exports and benchmark` - 8 edges
6. `Endpoints API` - 8 edges
7. `Task: Generate 100 Dummy Data using Faker.js → Supabase` - 8 edges
8. `restoreStock()` - 7 edges
9. `scripts` - 6 edges
10. `SewaKi Backend — Modular Monolith` - 6 edges

## Surprising Connections (you probably didn't know these)
- `SewaKi Development and Graphify Rules` --references--> `SewaKi Modular Monolith Architecture`  [INFERRED]
  CLAUDE.md → README.md
- `resolveDispute()` --calls--> `disbursePayment()`  [INFERRED]
  src/modules/admin/admin.controller.js → src/modules/payment/payment.service.js
- `register()` --calls--> `sendEmail()`  [EXTRACTED]
  src/modules/auth/auth.controller.js → src/modules/notification/notification.service.js
- `verifyKyc()` --calls--> `sendEmail()`  [EXTRACTED]
  src/modules/auth/kyc.controller.js → src/modules/notification/notification.service.js
- `returnItem()` --calls--> `restoreStock()`  [EXTRACTED]
  src/modules/transaction/return.controller.js → src/modules/item/item.service.js

## Import Cycles
- None detected.

## Communities (34 total, 12 thin omitted)

### Community 0 - "Core Business Operations"
Cohesion: 0.06
Nodes (26): resolveDispute(), bcrypt, jwt, prisma, register(), { sendEmail }, { createClient }, fs (+18 more)

### Community 1 - "Inventory and Transactions"
Cohesion: 0.07
Nodes (25): prisma, reduceStock(), restoreStock(), prisma, { restoreStock }, { sendEmail }, createTransaction(), getTransactionById() (+17 more)

### Community 2 - "Server Architecture and Routing"
Cohesion: 0.08
Nodes (21): prisma, chatController, express, router, express, paymentController, router, verifyToken (+13 more)

### Community 3 - "Database Setup and Connectivity"
Cohesion: 0.09
Nodes (15): adapter, { Pool }, prisma, { PrismaClient }, { PrismaPg }, prisma, path, prisma (+7 more)

### Community 4 - "Project Configuration and Scripts"
Cohesion: 0.06
Nodes (33): author, dependencies, axios, bcrypt, cors, dotenv, express, jsonwebtoken (+25 more)

### Community 5 - "KYC Verification and Authentication"
Cohesion: 0.10
Nodes (15): authController, express, kycController, multer, path, router, storage, upload (+7 more)

### Community 6 - "Route Security Middleware"
Cohesion: 0.25
Nodes (5): prisma, dashboardController, express, router, verifyToken

### Community 7 - "Item Catalog and Reviews Routing"
Cohesion: 0.08
Nodes (14): { createClient }, path, prisma, { reduceStock, restoreStock }, supabase, express, itemController, multer (+6 more)

### Community 8 - "Package Dependencies"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 9 - "System Documentation and Overview"
Cohesion: 0.18
Nodes (11): SewaKi Development and Graphify Rules, SewaKi Auth Module, SewaKi Chat Module (Socket.IO), SewaKi Database (Sequelize & PostgreSQL), SewaKi Item Module, SewaKi Microservices to Monolith Migration Rationale, SewaKi Modular Monolith Architecture, SewaKi Notification Module (Nodemailer) (+3 more)

### Community 10 - "Review Module"
Cohesion: 0.20
Nodes (5): prisma, express, reviewController, router, verifyToken

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (37): 1. AWS Managed Services SLA (Dokumen PDF Resmi) {#aws-managed-services-sla-dokumen-pdf-resmi}, 1. Studi Kasus NFR --- E-Commerce Real-World {#studi-kasus-nfr-e-commerce-real-world}, 2. Microsoft Azure SLA --- Dokumen Resmi (Consolidated SLA) {#microsoft-azure-sla-dokumen-resmi-consolidated-sla}, 2. Studi Kasus SLA --- Google Cloud GKE (Real Document) {#studi-kasus-sla-google-cloud-gke-real-document}, 3. Google Cloud Compute Engine SLA {#google-cloud-compute-engine-sla}, 4. Atlassian Cloud SLA --- Dokumen Legal Resmi {#atlassian-cloud-sla-dokumen-legal-resmi}, 5. Azure SQL Database SLA ---  {#azure-sql-database-sla}, 5. Ringkasan  {#ringkasan} (+29 more)

### Community 13 - "Dashboard Statistics"
Cohesion: 0.40
Nodes (3): { createClient }, dotenv, supabase

### Community 14 - "Chat History Module"
Cohesion: 0.11
Nodes (17): 1. Clone & Install, 2. Setup Environment, 3. Setup Database (Untuk Local Database), 4. Jalankan Server, Auth (`/api/auth`), Cara Menjalankan, Chat (`/api/chats`), Endpoints API (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 21 - "Community 21"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 23 - "Community 23"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (5): prisma, adminController, express, router, verifyToken

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (8): Important Rules, Step 1 - Read Schema, Step 2 - Plan, Step 3 - Install Dependencies, Step 5 - Write the Seed Script, Step 6 - Add Script to package.json, Step 7 - Run & Verify, Task: Generate 100 Dummy Data using Faker.js → Supabase

## Knowledge Gaps
- **258 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+253 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sendEmail()` connect `Core Business Operations` to `Inventory and Transactions`, `KYC Verification and Authentication`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Business Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.05574912891986063 - nodes in this community are weakly interconnected._
- **Should `Inventory and Transactions` be split into smaller, more focused modules?**
  _Cohesion score 0.0748663101604278 - nodes in this community are weakly interconnected._
- **Should `Server Architecture and Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Database Setup and Connectivity` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `Project Configuration and Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._