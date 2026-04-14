import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, DeviceMobileCamera, Lightning, Fire, Drop } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import PinDialog from '../components/PinDialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Recharge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rechargeDialog, setRechargeDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [rechargeNumber, setRechargeNumber] = useState('');
  const [operator, setOperator] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('e_wallet');
  const [isLoading, setIsLoading] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);

  const services = [
    { id: 'mobile', name: 'Mobile Recharge', icon: DeviceMobileCamera, color: 'from-blue-500 to-blue-700' },
    { id: 'dth', name: 'DTH Recharge', icon: Lightning, color: 'from-purple-500 to-purple-700' },
    { id: 'electricity', name: 'Electricity Bill', icon: Lightning, color: 'from-yellow-500 to-amber-600' },
    { id: 'gas', name: 'Gas Bill', icon: Fire, color: 'from-orange-500 to-red-600' },
    { id: 'water', name: 'Water Bill', icon: Drop, color: 'from-cyan-500 to-blue-600' },
  ];

  const mobileOperators = ['Jio', 'Airtel', 'Vi (Vodafone Idea)', 'BSNL'];
  const dthOperators = ['Tata Sky', 'Dish TV', 'Airtel Digital TV', 'Sun Direct'];
  const electricityProviders = ['MSEDCL', 'TATA Power', 'Adani Electricity', 'BSES Rajdhani', 'BSES Yamuna'];
  const gasProviders = ['Mahanagar Gas', 'Indraprastha Gas', 'Gujarat Gas', 'Adani Gas'];
  const waterProviders = ['Municipal Corporation', 'Delhi Jal Board', 'BWSSB Bangalore'];

  const getOperators = () => {
    if (!selectedService) return mobileOperators;
    switch (selectedService.id) {
      case 'mobile': return mobileOperators;
      case 'dth': return dthOperators;
      case 'electricity': return electricityProviders;
      case 'gas': return gasProviders;
      case 'water': return waterProviders;
      default: return mobileOperators;
    }
  };

  const handleProcessClick = () => {
    if (!user?.has_pin) {
      toast.error('Pehle Profile se PIN setup karein');
      navigate('/profile');
      return;
    }
    if (!rechargeNumber || !operator || !amount) {
      toast.error('Sab details bharein');
      return;
    }
    setRechargeDialog(false);
    setShowPinDialog(true);
  };

  const handlePinConfirm = async (pin) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/auth/verify-pin`,
        { pin },
        { withCredentials: true }
      );

      const { data } = await axios.post(
        `${API_URL}/api/recharge`,
        {
          recharge_type: selectedService.id,
          number: rechargeNumber,
          operator,
          amount: parseFloat(amount),
          payment_mode: paymentMode
        },
        { withCredentials: true }
      );

      toast.success(`Recharge ${data.status}! Amount: Rs.${amount}`);
      setShowPinDialog(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Recharge failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRechargeNumber('');
    setOperator('');
    setAmount('');
    setSelectedService(null);
  };

  const handleNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (selectedService?.id === 'mobile') {
      setRechargeNumber(value.slice(0, 10));
    } else {
      setRechargeNumber(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="recharge-title">
              Recharge & Bill Payment
            </h1>
            <p className="text-blue-100 text-sm">Quick & secure payments</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service, idx) => (
            <Dialog
              key={service.id}
              open={rechargeDialog && selectedService?.id === service.id}
              onOpenChange={(open) => {
                setRechargeDialog(open);
                if (open) {
                  setSelectedService(service);
                  resetForm();
                  setSelectedService(service);
                }
              }}
            >
              <DialogTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="p-6 cursor-pointer border-2 border-slate-200 hover:border-blue-400 rounded-2xl transition-all hover:shadow-xl" data-testid={`service-${service.id}`}>
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg`}>
                      <service.icon size={32} weight="duotone" className="text-white" />
                    </div>
                    <h3 className="text-center font-bold text-slate-900 text-sm">{service.name}</h3>
                  </Card>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="recharge-dialog">
                <DialogHeader>
                  <DialogTitle className="text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {selectedService?.name}
                  </DialogTitle>
                  <DialogDescription>Details bharein aur Process karein</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">
                      {selectedService?.id === 'mobile' ? 'Mobile Number' : 
                       selectedService?.id === 'dth' ? 'DTH Customer ID' : 
                       'Account / Consumer Number'}
                    </Label>
                    <Input
                      id="number"
                      type="tel"
                      placeholder={selectedService?.id === 'mobile' ? 'Enter 10-digit mobile' : 'Enter account number'}
                      value={rechargeNumber}
                      onChange={handleNumberChange}
                      className="border-2 border-purple-600 rounded-xl h-12"
                      data-testid="recharge-number-input"
                    />
                    {selectedService?.id === 'mobile' && rechargeNumber.length > 0 && (
                      <p className="text-xs text-slate-500">{rechargeNumber.length}/10 digits</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operator">
                      {['electricity', 'gas', 'water'].includes(selectedService?.id) ? 'Provider' : 'Operator'}
                    </Label>
                    <Select value={operator} onValueChange={setOperator}>
                      <SelectTrigger className="border-2 border-purple-600 rounded-xl h-12" data-testid="operator-select">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperators().map((op) => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (Rs.)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-2 border-purple-600 rounded-xl h-12"
                      data-testid="recharge-amount-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="border-2 border-purple-600 rounded-xl h-12" data-testid="payment-mode-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="e_wallet">E-Wallet</SelectItem>
                        <SelectItem value="coins">Coins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Summary */}
                  {amount && operator && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Summary</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{operator} - {rechargeNumber}</span>
                        <span className="font-bold text-slate-900">Rs.{amount}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleProcessClick}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl h-12 font-semibold"
                    disabled={!rechargeNumber || !operator || !amount}
                    data-testid="process-recharge-btn"
                  >
                    Process Rs.{amount || '0'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>

      {/* PIN Dialog - shows after Process click */}
      <PinDialog
        open={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onConfirm={handlePinConfirm}
        title="Confirm Payment"
        description={`Rs.${amount} ${selectedService?.name || ''} ke liye PIN dalein`}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Recharge;
