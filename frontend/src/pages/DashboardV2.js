import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { List, Wallet, CurrencyCircleDollar, TrendUp, DeviceMobileCamera, ArrowsLeftRight, ClockCounterClockwise, UsersThree, Plus, SignOut, User } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DashboardV2 = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  React.useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/wallet/balance`, {
        withCredentials: true
      });
      setWalletData(data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const menuItems = [
    { icon: User, label: 'Profile', path: '/profile', testId: 'menu-profile' },
    { icon: DeviceMobileCamera, label: 'Recharge', path: '/recharge', testId: 'menu-recharge' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', testId: 'menu-wallet' },
    { icon: ClockCounterClockwise, label: 'Transaction History', path: '/transactions', testId: 'menu-transactions' },
    { icon: UsersThree, label: 'Referral / Network', path: '/referrals', testId: 'menu-referrals' },
    { icon: Plus, label: 'Add Fund', path: '/add-fund', testId: 'menu-add-fund' },
  ];

  if (!walletData) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const totalBalance = walletData.main_wallet + walletData.e_wallet;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 p-2" data-testid="hamburger-menu-btn">
                  <List size={28} weight="bold" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72" data-testid="sidebar-menu">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-2">
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start text-lg hover:bg-emerald-50 rounded-xl h-12"
                      data-testid={item.testId}
                    >
                      <item.icon size={24} className="mr-3 text-emerald-600" weight="duotone" />
                      {item.label}
                    </Button>
                  ))}
                  <div className="pt-4 border-t border-slate-200">
                    <Button
                      onClick={logout}
                      variant="ghost"
                      className="w-full justify-start text-lg text-red-600 hover:bg-red-50 rounded-xl h-12"
                      data-testid="menu-logout"
                    >
                      <SignOut size={24} className="mr-3" weight="duotone" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="welcome-text">
                Welcome, {user?.name}
              </h1>
              <p className="text-emerald-100 text-xs">{user?.mobile}</p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm h-9"
              data-testid="admin-panel-btn"
            >
              Admin
            </Button>
          )}
        </div>
      </div>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 text-center shadow-md">
        <p className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Earn Smart 💰 Grow Fast 🚀
        </p>
      </div>

      {/* Dashboard Cards - Only 4 Essential Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Total Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 p-5 rounded-2xl shadow-lg" data-testid="total-balance-card">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Wallet size={24} weight="duotone" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-400 text-center mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{totalBalance.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* E-Wallet Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0 p-5 rounded-2xl shadow-lg" data-testid="e-wallet-card">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <CurrencyCircleDollar size={24} weight="duotone" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-emerald-200 text-center mb-1">E-Wallet</p>
              <p className="text-2xl font-bold text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{walletData.e_wallet.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* Today Income */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 p-5 rounded-2xl shadow-lg" data-testid="today-income-card">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <TrendUp size={24} weight="duotone" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-blue-200 text-center mb-1">Today Income</p>
              <p className="text-2xl font-bold text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{walletData.today_income.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* Total Income */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 p-5 rounded-2xl shadow-lg" data-testid="total-income-card">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <TrendUp size={24} weight="duotone" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-purple-200 text-center mb-1">Total Income</p>
              <p className="text-2xl font-bold text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{walletData.total_income.toFixed(2)}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Quick Access Hint */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            👈 Open menu for Recharge, Wallet, Transactions & more
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardV2;
