import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, CurrencyCircleDollar, Lightning, Gear, Plus, Check, X } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPanel = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [fundRequests, setFundRequests] = useState([]);
  const [coinPackages, setCoinPackages] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [createPackageDialog, setCreatePackageDialog] = useState(false);
  const [bannerDialog, setBannerDialog] = useState(false);
  const [packageAmount, setPackageAmount] = useState('');
  const [packageCoins, setPackageCoins] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [bannerColor, setBannerColor] = useState('from-purple-600 via-pink-600 to-rose-600');
  const [bannerImages, setBannerImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    fetchFundRequests();
    fetchCoinPackages();
    fetchBannerSettings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/dashboard`, {
        withCredentials: true
      });
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true
      });
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchFundRequests = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/fund-requests`, {
        withCredentials: true
      });
      setFundRequests(data.requests);
    } catch (error) {
      console.error('Failed to fetch fund requests:', error);
    }
  };

  const fetchCoinPackages = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/coin-packages`, {
        withCredentials: true
      });
      setCoinPackages(data.packages);
    } catch (error) {
      console.error('Failed to fetch coin packages:', error);
    }
  };

  const fetchBannerSettings = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/banner`, {
        withCredentials: true
      });
      setBannerText(data.text || '');
      setBannerColor(data.color || 'from-purple-600 via-pink-600 to-rose-600');
      setBannerImages(data.images || []);
    } catch (error) {
      console.error('Failed to fetch banner settings:', error);
    }
  };

  const handleApproveFund = async (requestId, status) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/admin/approve-fund`,
        { request_id: requestId, status },
        { withCredentials: true }
      );
      toast.success(`Request ${status}!`);
      fetchFundRequests();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/admin/coin-packages`,
        {
          amount: parseFloat(packageAmount),
          coins: parseInt(packageCoins)
        },
        { withCredentials: true }
      );
      toast.success('Package created!');
      setCreatePackageDialog(false);
      setPackageAmount('');
      setPackageCoins('');
      fetchCoinPackages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create package');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBanner = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/admin/banner`,
        {
          text: bannerText,
          color: bannerColor,
          images: bannerImages
        },
        { withCredentials: true }
      );
      toast.success('Banner updated successfully!');
      setBannerDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setBannerImages([...bannerImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setBannerImages(bannerImages.filter((_, i) => i !== index));
  };

  if (!dashboardData) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="admin-panel-title">Admin Panel</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2" data-testid="admin-tabs">
          {['dashboard', 'users', 'funds', 'packages', 'banner'].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
              className={`rounded-xl capitalize ${activeTab === tab ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              data-testid={`tab-${tab}`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 border-slate-200 rounded-2xl" data-testid="total-users-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users size={24} weight="duotone" className="text-blue-600" />
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total Users</p>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dashboardData.total_users}
                </p>
              </Card>

              <Card className="p-6 border-slate-200 rounded-2xl" data-testid="pending-funds-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <CurrencyCircleDollar size={24} weight="duotone" className="text-amber-600" />
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Pending Funds</p>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dashboardData.pending_funds}
                </p>
              </Card>

              <Card className="p-6 border-slate-200 rounded-2xl" data-testid="total-recharges-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Lightning size={24} weight="duotone" className="text-emerald-600" />
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total Recharges</p>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dashboardData.total_recharges}
                </p>
              </Card>

              <Card className="p-6 border-slate-200 rounded-2xl" data-testid="recharge-amount-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <CurrencyCircleDollar size={24} weight="duotone" className="text-purple-600" />
                  </div>
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Recharge Amount</p>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  ₹{dashboardData.total_recharge_amount.toFixed(2)}
                </p>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="users-list">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Mobile</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Main Wallet</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">E-Wallet</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Referrals</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`user-row-${idx}`}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.mobile}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-900 font-semibold">
                        ₹{user.main_wallet.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-emerald-600 font-semibold">
                        ₹{user.e_wallet.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-700">
                        {user.direct_referrals}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'funds' && (
          <Card className="border-slate-200 rounded-2xl overflow-hidden" data-testid="funds-list">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Mobile</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Amount</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fundRequests.filter(req => req.status === 'pending').map((req, idx) => (
                    <tr key={req._id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`fund-request-${idx}`}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{req.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{req.mobile}</td>
                      <td className="px-6 py-4 text-sm text-right text-emerald-600 font-bold">
                        ₹{req.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveFund(req._id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-lg h-8"
                            disabled={isLoading}
                            data-testid={`approve-btn-${idx}`}
                          >
                            <Check size={16} className="mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproveFund(req._id, 'rejected')}
                            className="rounded-lg h-8"
                            disabled={isLoading}
                            data-testid={`reject-btn-${idx}`}
                          >
                            <X size={16} className="mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fundRequests.filter(req => req.status === 'pending').length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500" data-testid="no-pending-funds">
                        No pending fund requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={createPackageDialog} onOpenChange={setCreatePackageDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" data-testid="create-package-btn">
                    <Plus size={20} className="mr-2" />
                    Create Package
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="create-package-dialog">
                  <DialogHeader>
                    <DialogTitle>Create Coin Package</DialogTitle>
                    <DialogDescription>Define amount and coins for the package</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="packageAmount">Amount (₹)</Label>
                      <Input
                        id="packageAmount"
                        type="number"
                        placeholder="e.g., 100"
                        value={packageAmount}
                        onChange={(e) => setPackageAmount(e.target.value)}
                        className="rounded-xl"
                        data-testid="package-amount-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="packageCoins">Coins</Label>
                      <Input
                        id="packageCoins"
                        type="number"
                        placeholder="e.g., 50"
                        value={packageCoins}
                        onChange={(e) => setPackageCoins(e.target.value)}
                        className="rounded-xl"
                        data-testid="package-coins-input"
                      />
                    </div>
                    <Button
                      onClick={handleCreatePackage}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11"
                      disabled={isLoading || !packageAmount || !packageCoins}
                      data-testid="submit-package-btn"
                    >
                      {isLoading ? 'Creating...' : 'Create Package'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coinPackages.map((pkg, idx) => (
                <Card key={idx} className="p-6 border-slate-200 rounded-2xl" data-testid={`package-card-${idx}`}>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                      <CurrencyCircleDollar size={32} weight="duotone" className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        ₹{pkg.amount}
                      </p>
                      <p className="text-slate-600 mt-2">
                        Get <span className="font-bold text-amber-600">{pkg.coins} Coins</span>
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'banner' && (
          <div className="space-y-6">
            <Card className="border-slate-200 rounded-2xl p-6" data-testid="banner-settings-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Banner Settings</h3>
                  <p className="text-sm text-slate-600">Customize homepage banner with text, colors & images</p>
                </div>
                <Button
                  onClick={() => setBannerDialog(true)}
                  className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                  data-testid="edit-banner-btn"
                >
                  <Gear size={20} className="mr-2" />
                  Edit Banner
                </Button>
              </div>

              {/* Current Banner Preview */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Current Banner Preview:</Label>
                  <div className={`bg-gradient-to-r ${bannerColor} text-white p-6 rounded-2xl relative overflow-hidden`}>
                    {bannerImages.length > 0 && (
                      <div className="absolute inset-0 opacity-20">
                        <img src={bannerImages[0]} alt="Banner" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="text-lg font-bold relative z-10 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {bannerText || '💰 Earn Smart · 🚀 Grow Fast · 🏆 Achieve More'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Slider Images ({bannerImages.length}):</Label>
                  {bannerImages.length === 0 ? (
                    <p className="text-sm text-slate-500">No images added yet</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {bannerImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={img} 
                            alt={`Banner ${idx + 1}`} 
                            className="w-full h-24 object-cover rounded-xl border-2 border-slate-200"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=Image';
                            }}
                          />
                          <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <X size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Banner Edit Dialog */}
            <Dialog open={bannerDialog} onOpenChange={setBannerDialog}>
              <DialogContent className="sm:max-w-2xl" data-testid="banner-dialog">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Edit Banner Settings</DialogTitle>
                  <DialogDescription>Customize banner text, colors and slider images</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Banner Text */}
                  <div className="space-y-2">
                    <Label htmlFor="bannerText">Banner Text</Label>
                    <Input
                      id="bannerText"
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="💰 Earn Smart · 🚀 Grow Fast · 🏆 Achieve More"
                      className="border-2 border-purple-600 rounded-xl h-12"
                      data-testid="banner-text-input"
                    />
                  </div>

                  {/* Banner Color */}
                  <div className="space-y-2">
                    <Label>Banner Color Gradient</Label>
                    <Select value={bannerColor} onValueChange={setBannerColor}>
                      <SelectTrigger className="border-2 border-purple-600 rounded-xl h-12" data-testid="banner-color-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="from-purple-600 via-pink-600 to-rose-600">Purple → Pink → Rose</SelectItem>
                        <SelectItem value="from-blue-600 via-indigo-600 to-purple-600">Blue → Indigo → Purple</SelectItem>
                        <SelectItem value="from-emerald-600 via-teal-600 to-cyan-600">Emerald → Teal → Cyan</SelectItem>
                        <SelectItem value="from-orange-600 via-red-600 to-pink-600">Orange → Red → Pink</SelectItem>
                        <SelectItem value="from-yellow-500 via-amber-500 to-orange-600">Yellow → Amber → Orange</SelectItem>
                        <SelectItem value="from-slate-900 via-slate-800 to-slate-900">Dark Slate</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className={`h-8 rounded-xl bg-gradient-to-r ${bannerColor}`}></div>
                  </div>

                  {/* Slider Images */}
                  <div className="space-y-2">
                    <Label>Slider Images (URLs)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="border-2 border-purple-600 rounded-xl h-12"
                        data-testid="image-url-input"
                      />
                      <Button
                        onClick={handleAddImage}
                        type="button"
                        className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                        data-testid="add-image-btn"
                      >
                        <Plus size={20} />
                      </Button>
                    </div>
                    {bannerImages.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {bannerImages.map((img, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                            <span className="text-sm flex-1 truncate">{img}</span>
                            <Button
                              onClick={() => handleRemoveImage(idx)}
                              size="sm"
                              variant="destructive"
                              className="h-8 rounded-lg"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleUpdateBanner}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 rounded-xl h-12"
                    disabled={isLoading}
                    data-testid="save-banner-btn"
                  >
                    {isLoading ? 'Saving...' : 'Save Banner Settings'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
