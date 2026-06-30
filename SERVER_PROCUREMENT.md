# MPAOMIS Server Room Procurement List
**Project:** Mountain Province Assessor's Office Management Information System (MPAOMIS)
**Prepared:** June 2026
**Markup:** 15% applied to all hardware. Starlink at base price (no markup).

---

## Server Configuration

### Common Hardware (All 4 Units)
| Component | Spec |
|---|---|
| Model | Dell PowerEdge R650xs |
| CPU | Intel Xeon Silver 4310, 12C/24T, 2.1GHz |
| RAID Controller | PERC H755 (with write cache) |
| PSU | Dual redundant hot-plug 800W |
| Network | 2× 1GbE LOM + Quad port OCP NIC |
| Management | iDRAC9 Enterprise (remote KVM, virtual console, hardware monitoring) |
| Warranty | 3-year ProSupport Next Business Day Onsite |

---

### R650xs #1 — Primary Server

**Purpose:** Live production server. All 10 municipalities access the system through this unit.

| Component | Spec |
|---|---|
| RAM | 32GB DDR4 RDIMM ECC |
| Storage | 2× 1.2TB SAS 10K in **RAID 1** (mirrored) |
| Usable Storage | 1.2TB |
| OS | Windows Server 2025 Standard |

**Services Running:**
| Service | Detail |
|---|---|
| Next.js App | MPAOMIS web application (Node.js, served via PM2 or NSSM) |
| PostgreSQL 16 | Main database — all municipalities, all records |
| IIS / Reverse Proxy | Routes HTTPS traffic to Next.js app |

**What happens if it fails:**
- IT Admin promotes R650xs #2 (Hot Standby) to primary
- Downtime: 5–15 minutes
- No data loss (standby is always in sync)

---

### R650xs #2 — Hot Standby

**Purpose:** Mirror of the primary server. Always on, always synced. Takes over immediately if #1 fails.

| Component | Spec |
|---|---|
| RAM | 32GB DDR4 RDIMM ECC |
| Storage | 2× 1.2TB SAS 10K in **RAID 1** (mirrored) |
| Usable Storage | 1.2TB |
| OS | Windows Server 2025 Standard + Hyper-V |

**Replication Setup:**
| Method | Detail |
|---|---|
| PostgreSQL Streaming Replication | Continuously replicates all DB changes from #1 in real time |
| File Sync (Robocopy scheduled task) | Syncs uploaded photos and documents from #1 every 15 minutes |

**Failover Procedure:**
1. IT Admin detects #1 is down via iDRAC or monitoring alert
2. Promote #2's PostgreSQL to primary (single command)
3. Point domain DNS to #2's internal IP
4. #2 takes over — system is live again
5. Total downtime: 5–15 minutes

**What this unit does NOT do:**
- Does not serve live traffic while #1 is running
- Not accessible by staff until promoted

---

### R650xs #3 — Staging / QA

**Purpose:** Safe environment to test new features, bug fixes, and updates before deploying to production. Prevents untested code from reaching live users.

| Component | Spec |
|---|---|
| RAM | 16GB DDR4 RDIMM ECC (base — no upgrade needed) |
| Storage | 1× 1.2TB SAS 10K (base — no RAID, not critical) |
| OS | Windows Server 2025 Standard |

**Services Running:**
| Service | Detail |
|---|---|
| Next.js App (staging build) | Same codebase as production but separate instance |
| PostgreSQL 16 (staging DB) | Copy of production DB refreshed periodically |

**How it is used:**
| Step | Who | Action |
|---|---|---|
| 1 | Developer | Deploys new code to staging |
| 2 | Developer / Admin | Tests all features — forms, workflow, printing, approvals |
| 3 | Developer | Confirms no bugs or regressions |
| 4 | Developer | Deploys same code to production (#1) |

**Important:** Never skip staging. Every update to production must pass staging first.

---

### R650xs #4 — Backup Server

**Purpose:** Stores automated daily backups of the database and uploaded files. Last line of defense if both #1 and #2 fail or data is corrupted.

| Component | Spec |
|---|---|
| RAM | 16GB DDR4 RDIMM ECC (base — no upgrade needed) |
| Storage | 1× 1.2TB SAS 10K (base) — **add more drives at Phase 2** |
| OS | Windows Server 2025 Standard |

**Backup Schedule:**
| Frequency | What | Retention |
|---|---|---|
| Nightly (12:00 AM) | PostgreSQL full dump (pg_dump, compressed) | 7 days |
| Weekly (Sunday 1:00 AM) | Full DB dump + all uploaded photos/documents | 4 weeks |
| Monthly (1st of month, 2:00 AM) | Full DB dump + all files | 3 months |

**Backup Storage Estimate (Phase 1):**
| Data Type | Estimated Size |
|---|---|
| Daily DB dump (compressed) | ~2–5GB per dump |
| Weekly full backup (DB + photos) | ~20–50GB per set |
| Current 1.2TB capacity covers | ~6 months of Phase 1 data |
| Phase 2 action | Add 3× 2.4TB SAS drives in RAID 5 for 4.8TB usable |

**What this unit does NOT do:**
- Does not serve traffic
- Does not run the web app
- Does not replicate in real time (backups only, scheduled)

**Restore Procedure:**
1. Identify the backup set to restore from
2. Copy pg_dump file to target server
3. Run `pg_restore` to load the database
4. Copy files back to uploads directory
5. Verify data integrity

---

## Network Architecture

```
Internet (any device, any location)
 └── Browser → https://mpaomis.gov.ph (HTTPS only, no VPN needed)
      └── Starlink Business Local Priority 1TB (public static IP)
           └── Sophos XGS 107 (port 443 inbound only, blocks everything else)
                └── Cisco CBS350-24T-4G (internal switch)
                     ├── R650xs #1 — Primary (Next.js + PostgreSQL)
                     ├── R650xs #2 — Hot Standby (Hyper-V Replica)
                     ├── R650xs #3 — Staging / QA
                     └── R650xs #4 — Backup Server
```

**Remote Server Management:** Tailscale (free) + Windows RDP — IT admin access to server desktop securely from anywhere.

---

## Capital Expenditure

| Item | Qty | Unit Price (+15%) | Total |
|---|---|---|---|
| Dell PowerEdge R650xs | 4 | ₱299,345 | ₱1,197,380 |
| Dell 16GB RDIMM ECC 3200MT/s | 4 | ₱16,675 | ₱66,700 |
| Dell 1.2TB SAS 10K HDD | 2 | ₱28,750 | ₱57,500 |
| Vertiv VR Rack 42U | 1 | ₱241,500 | ₱241,500 |
| Cisco CBS350-24T-4G Switch | 1 | ₱31,050 | ₱31,050 |
| Sophos XGS 107 Firewall | 1 | ₱81,198 | ₱81,198 |
| APC Easy UPS On-Line SRV2KRIRK-E 2000VA | 2 | ₱66,700 | ₱133,400 |
| ATEN CS1734B 4-Port KVM Switch | 1 | ₱13,800 | ₱13,800 |
| AOC 24B36XE 24" Monitor | 1 | ₱5,060 | ₱5,060 |
| Logitech MK120 Keyboard + Mouse | 1 | ₱863 | ₱863 |
| Cat6 UTP Cable 305m Box | 1 | ₱10,925 | ₱10,925 |
| RJ45 Connectors Cat6 100pcs | 1 | ₱575 | ₱575 |
| Ratcheting Crimping Tool (Professional) | 1 | ₱3,450 | ₱3,450 |
| Starlink Standard Kit Gen 3/4 | 1 | ₱32,000 | ₱32,000 |
| **Grand Total** | | | **₱1,875,401** |

---

## Recurring Costs (2 Years)

| Item | Cost | Period | Total |
|---|---|---|---|
| Starlink Business Local Priority 1TB | ₱8,700/month | 24 months | ₱208,800 |
| Sophos XGS 107 Annual Subscription | ₱40,250/year | 2 years | ₱80,500 |
| Domain name (.gov.ph via DICT) | ₱10,000/year | 2 years | ₱20,000 |
| Tailscale (remote server access) | Free | — | — |
| SSL Certificate (Let's Encrypt) | Free | — | — |
| **Total Recurring (2 years)** | | | **₱309,300** |

---

## Grand Total

| | Amount |
|---|---|
| Capital Expenditure | ₱1,875,401 |
| Recurring Costs (2 years) | ₱309,300 |
| **Grand Total** | **₱2,184,701** |

---

## Price Sources

| Item | Source |
|---|---|
| Dell R650xs | OfficeMoTo / Dell PH — ₱260,300 base |
| Dell 16GB RDIMM | Lazada / Enterprise IT — ₱14,500 base (Dell-branded) |
| Dell 1.2TB SAS HDD | Enterprise IT Partners — ₱25,000 base |
| Vertiv VR Rack 42U | Vertiv Authorized PH — ₱210,000 base |
| Cisco CBS350-24T-4G | WI Automation PH — ₱27,000 base |
| Sophos XGS 107 | Sophos website — ₱70,607 base |
| APC Easy UPS SRV2KRIRK-E | XBSAsia — ₱58,000 base (in stock) |
| ATEN CS1734B | IT Specialty Stores — ₱12,000 base |
| AOC 24B36XE | GameOne / PC Express — ₱4,400 base |
| Logitech MK120 | Official IT Retailers — ₱750 base |
| Cat6 305m Box | I-Bahn / Various — ₱9,500 base |
| RJ45 100pcs | General IT Suppliers — ₱500 base |
| Crimping Tool | Hardware / IT Specialty — ₱3,000 base |
| Starlink Kit | Official Starlink PH — ₱32,000 (no markup) |
| Starlink Monthly | Official Starlink PH — ₱8,700/month (no markup) |

---

## Pending Before Finalizing

- [ ] Sophos XGS 107 annual subscription — get formal quote from authorized Sophos reseller
- [ ] Domain registration (.gov.ph) — coordinate with DICT
