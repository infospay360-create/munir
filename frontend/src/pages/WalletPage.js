import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Wallet, ArrowsLeftRight, PaperPlaneTilt, CurrencyCircleDollar } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [selfTransferDialog, setSelfTransferDialog] = useState(false);
  const [userTransferDialog, setUserTransferDialog] = useState(false);
  
  const [selfAmount, setSelfAmount] = useState('');
  const [selfPin, setSelfPin] = useState('');
  
  const [transferMobile, setTransferMobile] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferPin, setTransferPin] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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

  const handleSelfTransfer = async () => {
    if (!user?.has_pin) {
      toast.error('Please setup PIN first from Profile');
      navigate('/profile');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/wallet/self-transfer`,
        {
          amount: parseFloat(selfAmount),
          pin: selfPin
        },
        { withCredentials: true }
      );
      toast.success('Transfer successful!');
      setSelfTransferDialog(false);
      setSelfAmount('');
      setSelfPin('');
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTransfer = async () => {
    if (!user?.has_pin) {
      toast.error('Please setup PIN first from Profile');
      navigate('/profile');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/wallet/user-transfer`,
        {
          receiver_mobile: transferMobile,
          amount: parseFloat(transferAmount),
          pin: transferPin
        },
        { withCredentials: true }
      );
      toast.success('Transfer successful!');
      setUserTransferDialog(false);
      setTransferMobile('');
      setTransferAmount('');
      setTransferPin('');
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!walletData) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="wallet-title">
              My Wallet
            </h1>
            <p className="text-emerald-100 text-sm">Manage your funds & transfers</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Wallet Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 p-6 rounded-2xl shadow-xl" data-testid="main-wallet-balance">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Wallet size={24} weight="duotone" />
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Main Wallet</p>
              </div>
              <p className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{walletData.main_wallet.toFixed(2)}
              </p>
              <p className="text-sm text-slate-400">For commissions only</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-0 p-6 rounded-2xl shadow-xl" data-testid="e-wallet-balance">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <CurrencyCircleDollar size={24} weight="duotone" />
                </div>
                <p className="text-xs uppercase tracking-wider text-emerald-100">E-Wallet</p>
              </div>
              <p className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                ₹{walletData.e_wallet.toFixed(2)}
              </p>
              <p className="text-sm text-emerald-100">For recharge & shopping</p>
            </Card>
          </motion.div>
        </div>

        {/* Transfer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dialog open={selfTransferDialog} onOpenChange={setSelfTransferDialog}>
            <DialogTrigger asChild>
              <Button className="h-24 bg-white border-2 border-emerald-200 hover:border-emerald-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:shadow-xl" data-testid="self-transfer-btn">
                <ArrowsLeftRight size={32} weight="duotone" className="text-emerald-600" />
                <span className="font-bold">Self Transfer</span>
                <span className="text-xs text-slate-500">Main → E-Wallet</span>
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="self-transfer-dialog">
              <DialogHeader>
                <DialogTitle>Self Transfer</DialogTitle>
                <DialogDescription>Transfer from Main Wallet to E-Wallet</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={selfAmount}
                    onChange={(e) => setSelfAmount(e.target.value)}
                    className="border-2 border-purple-600 rounded-xl h-12"
                    data-testid="self-amount-input"
                  />
                  <p className="text-xs text-slate-500">Available: ₹{walletData.main_wallet.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Enter PIN</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={4} value={selfPin} onChange={setSelfPin} data-testid="self-pin-input">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-12 text-xl border-2 border-purple-600" />
                        <InputOTPSlot index={1} className="w-12 h-12 text-xl border-2 border-purple-600" />
                        <InputOTPSlot index={2} className="w-12 h-12 text-xl border-2 border-purple-600" />
                        <InputOTPSlot index={3} className="w-12 h-12 text-xl border-2 border-purple-600" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button
                  onClick={handleSelfTransfer}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl h-12"
                  disabled={isLoading || !selfAmount || selfPin.length !== 4}
                  data-testid="submit-self-transfer-btn"
                >
                  {isLoading ? 'Transferring...' : 'Transfer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={userTransferDialog} onOpenChange={setUserTransferDialog}>
            <DialogTrigger asChild>
              <Button className="h-24 bg-white border-2 border-blue-200 hover:border-blue-400 text-slate-900 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:shadow-xl" data-testid="user-transfer-btn">
                <PaperPlaneTilt size={32} weight="duotone" className="text-blue-600" />
                <span className="font-bold">Send Money</span>
                <span className="text-xs text-slate-500">To other user</span>
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="user-transfer-dialog">
              <DialogHeader>
                <DialogTitle>Send Money</DialogTitle>
                <DialogDescription>Transfer to another user's E-Wallet</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Receiver Mobile</Label>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={transferMobile}
                    onChange={(e) => setTransferMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="border-2 border-purple-600 rounded-xl h-12"
                    maxLength={10}
                    data-testid="transfer-mobile-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="border-2 border-purple-600 rounded-xl h-12"
                    data-testid="transfer-amount-input"
                  />
                  <p className="text-xs text-slate-500">Available: ₹{walletData.e_wallet.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Enter PIN</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={4} value={transferPin} onChange={setTransferPin} data-testid="transfer-pin-input">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-12 text-xl border-2 border-purple-600" />
                        <InputOTPSlot index={1} className="w-12 h-12 text-xl border-2 border-purple-600" />
                        <InputOTPSlot index={2} className="w-12 h-12 text-xl border-2 border-purple-600" />
                        <InputOTPSlot index={3} className="w-12 h-12 text-xl border-2 border-purple-600" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button
                  onClick={handleUserTransfer}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl h-12"
                  disabled={isLoading || !transferMobile || transferMobile.length !== 10 || !transferAmount || transferPin.length !== 4}
                  data-testid="submit-user-transfer-btn"
                >
                  {isLoading ? 'Sending...' : 'Send Money'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
