# Graph Report - sewaki-monolith  (2026-06-27)

## Corpus Check
- 50 files · ~20,012 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 324 nodes · 349 edges · 29 communities (20 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4861f4f5`
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
- [[_COMMUNITY_Admin Financial Operations|Admin Financial Operations]]
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
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `What You Must Do When Invoked` - 12 edges
2. `/graphify` - 10 edges
3. `SewaKi Modular Monolith Architecture` - 10 edges
4. `sendEmail()` - 9 edges
5. `graphify reference: extra exports and benchmark` - 8 edges
6. `Endpoints API` - 8 edges
7. `restoreStock()` - 7 edges
8. `SewaKi Backend — Modular Monolith` - 6 edges
9. `scripts` - 5 edges
10. `graphify reference: query, path, explain` - 5 edges

## Surprising Connections (you probably didn't know these)
- `SewaKi Development and Graphify Rules` --references--> `SewaKi Modular Monolith Architecture`  [INFERRED]
  CLAUDE.md → README.md
- `register()` --calls--> `sendEmail()`  [EXTRACTED]
  src/modules/auth/auth.controller.js → src/modules/notification/notification.service.js
- `returnItem()` --calls--> `restoreStock()`  [EXTRACTED]
  src/modules/transaction/return.controller.js → src/modules/item/item.service.js
- `getTransactionById()` --calls--> `restoreStock()`  [EXTRACTED]
  src/modules/transaction/transaction.controller.js → src/modules/item/item.service.js
- `returnItem()` --calls--> `restoreStock()`  [EXTRACTED]
  src/modules/transaction/transaction.controller.js → src/modules/item/item.service.js

## Import Cycles
- None detected.

## Communities (29 total, 9 thin omitted)

### Community 0 - "Core Business Operations"
Cohesion: 0.07
Nodes (25): bcrypt, jwt, prisma, register(), { sendEmail }, express, prisma, router (+17 more)

### Community 1 - "Inventory and Transactions"
Cohesion: 0.09
Nodes (15): prisma, { reduceStock, restoreStock }, prisma, reduceStock(), restoreStock(), createTransaction(), getTransactionById(), { payTransaction } (+7 more)

### Community 2 - "Server Architecture and Routing"
Cohesion: 0.10
Nodes (17): prisma, chatController, express, router, adminRoutes, app, authRoutes, chatRoutes (+9 more)

### Community 3 - "Database Setup and Connectivity"
Cohesion: 0.09
Nodes (15): adapter, { Pool }, prisma, { PrismaClient }, { PrismaPg }, prisma, path, prisma (+7 more)

### Community 4 - "Project Configuration and Scripts"
Cohesion: 0.06
Nodes (30): author, dependencies, axios, bcrypt, cors, dotenv, express, jsonwebtoken (+22 more)

### Community 5 - "KYC Verification and Authentication"
Cohesion: 0.12
Nodes (10): authController, express, kycController, multer, path, router, storage, upload (+2 more)

### Community 6 - "Route Security Middleware"
Cohesion: 0.10
Nodes (14): jwt, express, paymentController, router, verifyToken, express, multer, path (+6 more)

### Community 7 - "Item Catalog and Reviews Routing"
Cohesion: 0.14
Nodes (10): express, itemController, multer, path, reviewController, router, storage, upload (+2 more)

### Community 8 - "Package Dependencies"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 9 - "System Documentation and Overview"
Cohesion: 0.18
Nodes (11): SewaKi Development and Graphify Rules, SewaKi Auth Module, SewaKi Chat Module (Socket.IO), SewaKi Database (Sequelize & PostgreSQL), SewaKi Item Module, SewaKi Microservices to Monolith Migration Rationale, SewaKi Modular Monolith Architecture, SewaKi Notification Module (Nodemailer) (+3 more)

### Community 10 - "Review Module"
Cohesion: 0.20
Nodes (5): prisma, express, reviewController, router, verifyToken

### Community 12 - "Admin Financial Operations"
Cohesion: 0.20
Nodes (5): prisma, adminController, express, router, verifyToken

### Community 13 - "Dashboard Statistics"
Cohesion: 0.25
Nodes (5): prisma, dashboardController, express, router, verifyToken

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

## Knowledge Gaps
- **208 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `version`, `description` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Business Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.06606606606606606 - nodes in this community are weakly interconnected._
- **Should `Inventory and Transactions` be split into smaller, more focused modules?**
  _Cohesion score 0.09113300492610837 - nodes in this community are weakly interconnected._
- **Should `Server Architecture and Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Database Setup and Connectivity` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `Project Configuration and Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `KYC Verification and Authentication` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._