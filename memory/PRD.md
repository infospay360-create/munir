# PRD - Mobile Recharge + MLM Platform

## Original Problem Statement
Full-stack mobile-friendly web site for Mobile Recharge + Utility Bill + MLM system with dual wallet, secure transactions (4-digit PIN), 20-level advanced MLM referral system (auto-placement, cycle logic), Admin Panel, and clean modern UI. Expanded to include Shopping (multi-vendor), KYC/Profile, UTR/Screenshot upload for funds, and admin-controlled banners.

## Tech Stack
- Frontend: React + Tailwind CSS + Shadcn UI + Framer Motion
- Backend: FastAPI (Python)
- Database: MongoDB (Motor async driver)
- Auth: JWT (cookie-based)

## Core Features Implemented
1. JWT Auth (Login/Register/Logout) with cookie-based tokens
2. MLM 20-level referral system (auto-placement, cycles)
3. Dual Wallet (Main + E-Wallet) + Coins
4. Dashboard with stats (income, referrals, coins, wallet balances)
5. Add Fund with UTR/Screenshot upload
6. Recharge with operator selection (E-Wallet/Coins payment)
7. Profile with KYC & Nominee details
8. Admin Panel (Users, Funds approval, Coin packages, Commission settings)
9. **Text Banner + Image Banner** - Separate admin management, file upload support (DONE Feb 2026)
10. **Bank Withdrawal API** - PIN-secured, admin approval flow (Backend DONE Feb 2026)
11. **Image File Upload** for banners - direct upload to server (DONE Feb 2026)
12. Shopping/Vendor (MOCKED - basic CRUD only)

## DB Collections
- `users`: name, mobile, password_hash, pin_hash, role, wallets, referral data
- `transactions`: user_id, type, amount, status, description
- `fund_requests`: user_id, amount, utr, screenshot, status
- `settings`: type (text_banner/image_banner), content
- `withdrawals`: user_id, amount, bank details, status
- `products`, `cart`: Shopping (mocked)

## Key API Endpoints
- POST /api/auth/register, /api/auth/login
- GET /api/banner (returns text + images)
- POST /api/admin/banner/text (text + color)
- POST /api/admin/banner/image (image URLs)
- POST /api/admin/banner/upload (file upload)
- POST /api/wallet/withdraw (PIN-secured)
- GET /api/admin/withdrawals

## Admin Credentials
- Mobile: 9999999999, Password: Admin@123, PIN: 1234

## Backlog (Priority Order)
### P1
- Bank Withdrawal frontend UI (WalletPage integration)
- Shopping / Multi-Vendor real backend logic

### P2
- Utility Bills Payment (Electricity, Gas, Water)
- Admin KYC Approval System
- Admin Withdrawal approval tab in AdminPanel

### P3
- Server.py refactoring (split into route files)
- Real payment gateway integration
