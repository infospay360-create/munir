# PRD - Mobile Recharge + MLM Platform

## Original Problem Statement
Full-stack mobile-friendly web site for Mobile Recharge + Utility Bill + MLM system with dual wallet, secure transactions (4-digit PIN), 20-level advanced MLM referral system (auto-placement, cycle logic), Admin Panel, and clean modern UI.

## Tech Stack
React + Tailwind + Shadcn UI + Framer Motion | FastAPI | MongoDB (Motor) | JWT (cookie-based)

## Core Features Implemented
1. JWT Auth (Login/Register/Logout)
2. MLM 20-level referral system (auto-placement, cycles)
3. Dual Wallet (Main + E-Wallet) + Coins
4. Dashboard with stats + Text Banner + Image Banner (admin-controlled)
5. Add Fund with UTR/Screenshot upload
6. Recharge (Mobile/DTH/Electricity/Gas/Water) with operator/provider selection
7. Profile with KYC & Nominee details
8. Admin Panel (Users, Funds, Banners, Settings)
9. Text Banner + Image Banner with file upload (Feb 2026)
10. Bank Withdrawal with bank details (Feb 2026)
11. **4-Digit PIN Dialog** - 2-step flow on Recharge, Self Transfer, Send Money, Bank Withdrawal (Apr 2026)
12. **Reusable PinDialog component** at /app/frontend/src/components/PinDialog.js

## PIN Flow (2-Step)
- Step 1: User fills form (amount, details) → clicks "Process"
- Step 2: PIN popup appears → user enters 4-digit PIN → Confirm → Transaction completes
- Applied to: Recharge, Self Transfer, User Transfer, Bank Withdrawal

## Admin Credentials
- Mobile: 9999999999, Password: Admin@123, PIN: 1234

## Backlog
### P1
- Shopping / Multi-Vendor backend logic

### P2
- Utility Bills real backend integration
- Admin KYC Approval System
- Admin Withdrawal approval tab

### P3
- Server.py refactoring
- Transaction history page
- Real payment gateway integration
