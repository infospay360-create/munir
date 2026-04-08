import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { List, Wallet, CurrencyCircleDollar, TrendUp, DeviceMobileCamera, ArrowsLeftRight, ClockCounterClockwise, UsersThree, Plus, SignOut, User, UserPlus, UserCheck, UserCircle, ChartLineUp, ShoppingBag } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DashboardV2 = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/dashboard/stats`, {
        withCredentials: true
      });
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const menuItems = [
    { icon: User, label: 'Profile', path: '/profile', testId: 'menu-profile' },
    { icon: DeviceMobileCamera, label: 'Recharge', path: '/recharge', testId: 'menu-recharge' },
    { icon: ShoppingBag, label: 'Shopping', path: '/shopping', testId: 'menu-shopping' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', testId: 'menu-wallet' },
    { icon: ClockCounterClockwise, label: 'Transaction History', path: '/transactions', testId: 'menu-transactions' },
    { icon: UsersThree, label: 'Referral / Network', path: '/referrals', testId: 'menu-referrals' },
    { icon: Plus, label: 'Add Fund', path: '/add-fund', testId: 'menu-add-fund' },
  ];

  if (!dashboardData) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  const totalBalance = dashboardData.main_wallet + dashboardData.e_wallet;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-purple-50/30">
      {/* Header with Glassmorphism */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white p-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all hover:scale-105" 
                  data-testid="hamburger-menu-btn"
                >
                  <List size={28} weight="bold" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-gradient-to-b from-white to-slate-50" data-testid="sidebar-menu">
                <SheetHeader className="border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                      {user?.name?.charAt(0)}
                    </div>
                    <div>
                      <SheetTitle className="text-xl font-bold text-left" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {user?.name}
                      </SheetTitle>
                      <p className="text-xs text-slate-500">{user?.mobile}</p>
                    </div>
                  </div>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  {menuItems.map((item, idx) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Button
                        onClick={() => {
                          navigate(item.path);
                          setMenuOpen(false);
                        }}
                        variant="ghost"
                        className="w-full justify-start text-base hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 rounded-xl h-12 transition-all hover:scale-105 hover:shadow-sm"
                        data-testid={item.testId}
                      >
                        <item.icon size={22} className="mr-3 text-emerald-600" weight="duotone" />
                        <span className="font-medium">{item.label}</span>
                      </Button>
                    </motion.div>
                  ))}
                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <Button
                      onClick={logout}
                      variant="ghost"
                      className="w-full justify-start text-base text-red-600 hover:bg-red-50 rounded-xl h-12 transition-all hover:scale-105"
                      data-testid="menu-logout"
                    >
                      <SignOut size={22} className="mr-3" weight="duotone" />
                      <span className="font-medium">Logout</span>
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
              className="bg-white/20 border-white/40 text-white hover:bg-white/30 text-sm h-9 rounded-xl backdrop-blur-sm"
              data-testid="admin-panel-btn"
            >
              Admin Panel
            </Button>
          )}
        </div>
      </div>

      {/* Motivational Banner with Animation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white p-4 text-center shadow-lg relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl"></div>
        <p className="text-lg font-bold relative z-10" style={{ fontFamily: 'Outfit, sans-serif' }}>
          💰 Earn Smart · 🚀 Grow Fast · 🏆 Achieve More
        </p>
      </motion.div>

      {/* Dashboard Cards - Comprehensive Stats */}
      <div className="p-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
          {/* Total Balance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="total-balance-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Wallet size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Total Balance</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{totalBalance.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* E-Wallet Balance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="e-wallet-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <CurrencyCircleDollar size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-emerald-100 mb-1">E-Wallet</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{dashboardData.e_wallet.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* Today Income */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="today-income-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <TrendUp size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-blue-100 mb-1">Today Income</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{dashboardData.today_income.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* Total Income */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-purple-600 via-purple-600 to-fuchsia-600 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="total-income-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <ChartLineUp size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-pink-300 animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-purple-100 mb-1">Total Income</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{dashboardData.total_income.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* Today Repurchase Income */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="today-repurchase-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <DeviceMobileCamera size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-yellow-200 animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-orange-100 mb-1">Today Repurchase</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{dashboardData.today_repurchase_income.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* Total Repurchase Income */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-rose-500 via-pink-600 to-rose-600 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="total-repurchase-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <ChartLineUp size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-rose-200 animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-rose-100 mb-1">Total Repurchase</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{dashboardData.total_repurchase_income.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          {/* Today Joining */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-500 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="today-joining-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <UserPlus size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-200 animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-cyan-100 mb-1">Today Joining</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {dashboardData.today_joining}
              </p>
            </Card>
          </motion.div>

          {/* Total Active Users */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="active-users-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <UserCheck size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-green-200 animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-green-100 mb-1">Active Users</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {dashboardData.total_active_users}
              </p>
            </Card>
          </motion.div>

          {/* Total Free Users */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white border-0 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all" data-testid="free-users-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <UserCircle size={20} weight="duotone" />
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-200 animate-pulse"></div>
              </div>
              <p className="text-xs uppercase tracking-wider text-amber-100 mb-1">Free Users</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {dashboardData.total_free_users}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Quick Access Hint with Gradient */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full shadow-lg">
            <p className="text-sm font-medium">
              👈 Open menu for all options
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardV2;
