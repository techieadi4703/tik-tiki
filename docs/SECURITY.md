# Tiktiki Security & Data Privacy Policy v1.0

## 1. Compliance Framework
Tiktiki is engineered in accordance with India's **Digital Personal Data Protection (DPDP) Act, 2023** and **GDPR Principles**:
- **Purpose Limitation**: User data is gathered solely for route computation and notification dispatch.
- **Storage Limitation**: Time-series availability data is retained for 90 days for ML model training, after which it is aggregated and anonymized.
- **Data Minimization**: Unauthenticated searches require zero PII. We do not require account creation for basic route discovery.

---

## 2. Hard Security Boundaries

### 1. Zero Password Storage for Third-Party Services
- **Strict Rule**: Tiktiki **never** captures, transmits, or stores user passwords for IRCTC, airlines, or banking portals.
- All checkout flows redirect via official affiliate deep-links or embed sandboxed official webviews where the user authenticates directly with the provider.

### 2. Encryption at Rest & In Transit
- All client-to-server traffic is enforced via **TLS 1.3 with HSTS**.
- Database connections enforce SSL (`sslmode=require`).
- User phone numbers and email hashes are indexed using salt-hashed HMAC-SHA256.

### 3. Rate Limiting & Anti-Scraping Protection
- Cloudflare Web Application Firewall (WAF) enforces token-bucket limits: maximum 60 requests per minute per IP for public search endpoints.
- Authentication endpoints enforce Exponential Backoff on repeated failed attempts.
