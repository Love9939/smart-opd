# SmartOPD & DentalFlow 🏥⚡

An industry-grade Outpatient Department (OPD) & Dental Clinic Operating System built with a high-performance, deterministic **Rust** backend core and a modern **Next.js 15** responsive web & PWA interface.

Designed for high-throughput hospitals, specialty dental clinics, and multi-doctor polyclinics to eliminate waiting room chaos, guarantee immutable audit trails, and streamline patient flow from check-in to consultation.

---

## 🌟 Key Features

### 1. Multi-Role Hospital & Clinic Portals
- **Reception Desk (`/desk/[clinic_id]`):** Rapid patient intake, walk-in token generation, family cluster check-in, and Bluetooth thermal slip printing.
- **Doctor Mobile & Tablet Portal (`/mobile/[session_id]`):** Quick-glance patient queue, vitals inspection, digital clinical notes, and 1-tap call-next.
- **TV Queue Display (`/tv/[clinic_id]`):** Full-screen hospital waiting-hall dashboard with audio chime announcements and real-time token transitions.
- **Patient Live Queue PWA (`/q/[clinic_slug]`):** Real-time estimated wait-time tracking directly on patient smartphones without app installation.
- **Dynamic Waiting Room Seat Grid:** Interactive visual seat-allocation grid tracking occupied, available, and pre-med hold waiting areas.

### 2. High-Performance Deterministic Core (Rust)
- Built on **Axum 0.7**, **Tokio**, and **SQLx** for sub-millisecond response times and memory safety.
- Native WebSocket multiplexing delivering sub-50ms live updates across TV displays, reception desks, and doctor devices simultaneously.
- State-machine driven queue engine preventing double-calling and token collision.

### 3. Healthcare Standards & Integrations
- **ABDM M1 (Ayushman Bharat Digital Mission):** Milestone 1 compliance for digital token issuance and ABHA verification.
- **Bluetooth 58mm Thermal Slip Printing:** Native Web Bluetooth ESC/POS integration for instant token and prescription printing.
- **Immutable Audit Ledger:** Tamper-evident operational logging for medical malpractice protection and regulatory compliance.
- **Family Cluster Check-In:** Group related patients arriving together into single-call or adjacent queue slots.

---

## 🏗️ Architecture & Project Structure

The project is structured as a unified monorepo:

```text
smart-opd/
├── apps/
│   └── web-client/              # Next.js 15 (App Router), React, Tailwind CSS PWA
│       ├── app/
│       │   ├── (doctor)/        # Doctor consultation & queue screen
│       │   ├── (patient)/       # Patient mobile queue status tracking
│       │   ├── (reception)/     # Reception desk & token generator
│       │   └── (tv)/            # High-visibility TV queue board
│       └── components/          # Shared UI elements & Seat Grid
│
├── crates/
│   ├── core-engine/             # Queue management state machine & domain models
│   ├── db-schema/               # PostgreSQL migrations & SQLx schemas
│   ├── integrations/            # ABDM M1, Bluetooth ESC/POS & SMS gateways
│   └── api-server/              # Axum HTTP + WebSocket high-throughput server
│
├── Dockerfile.backend           # Production multi-stage Rust container build
└── docker-compose.yml           # PostgreSQL + Backend microservices composition
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Rust](https://www.rust-lang.org/) (v1.75+ recommended)
- [Node.js](https://nodejs.org/) (v20+ recommended) & npm / pnpm
- [Docker](https://www.docker.com/) & Docker Compose

### 1. Database & Infrastructure
Start the PostgreSQL database and services via Docker:
```bash
docker compose up -d postgres
```

### 2. Run the Rust API Server
```bash
# Compile and run the Axum backend server
cargo run --bin api-server
```
The backend API server will listen on `http://localhost:8080`.

### 3. Run the Next.js Frontend Client
```bash
cd apps/web-client
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

- **Backend:** Rust, Axum, Tokio, SQLx, Serde, Tracing, ts-rs
- **Database:** PostgreSQL (with connection pooling and strict schema validation)
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Real-Time:** WebSockets / SSE for low-latency synchronization
- **Hardware Integration:** Web Bluetooth API (ESC/POS 58mm thermal printers)
- **DevOps:** Docker, Multi-Stage Builds, Docker Compose

---

## 📄 License
Licensed under [MIT OR Apache-2.0](LICENSE).
