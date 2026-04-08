import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Lock, Ticket, Eye, EyeSlash, CheckCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Register = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
  };

  const handleReferralCodeChange = async (e) => {
    const code = e.target.value.toUpperCase();
    setReferralCode(code);
    
    if (code.length >= 6) {
      try {
        const { data } = await axios.get(`${API_URL}/api/check-referral/${code}`);
        if (data.exists) {
          setReferrerName(data.name);
          toast.success(`Referrer: ${data.name}`);
        } else {
          setReferrerName('');
        }
      } catch (error) {
        setReferrerName('');
      }
    } else {
      setReferrerName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mobile.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    const result = await register(name, mobile, password, referralCode || null);
    setIsLoading(false);
    
    if (result.success) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-purple-200 shadow-2xl backdrop-blur-sm bg-white/95" data-testid="register-card">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <User size={40} weight="duotone" className="text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Create Account
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Join our platform and start earning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Referral Code at Top */}
              <div className="space-y-2">
                <Label htmlFor="referralCode" className="text-slate-700 font-semibold">Referral Code (Optional)</Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={20} weight="duotone" />
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={handleReferralCodeChange}
                    className="pl-11 border-2 border-purple-600 rounded-xl h-12 focus:ring-purple-500/30 focus:border-purple-700 transition-all"
                    data-testid="register-referral-input"
                  />
                  {referrerName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600">
                      <CheckCircle size={16} weight="fill" />
                      <span className="text-xs font-medium">{referrerName}</span>
                    </div>
                  )}
                </div>
                {referrerName && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Referred by: {referrerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-semibold">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={20} weight="duotone" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-11 border-2 border-purple-600 rounded-xl h-12 focus:ring-purple-500/30 focus:border-purple-700 transition-all"
                    required
                    data-testid="register-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-slate-700 font-semibold">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={20} weight="duotone" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={mobile}
                    onChange={handleMobileChange}
                    className="pl-11 border-2 border-purple-600 rounded-xl h-12 focus:ring-purple-500/30 focus:border-purple-700 transition-all"
                    required
                    maxLength={10}
                    data-testid="register-mobile-input"
                  />
                  {mobile.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-purple-500">
                      {mobile.length}/10
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={20} weight="duotone" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 border-2 border-purple-600 rounded-xl h-12 focus:ring-purple-500/30 focus:border-purple-700 transition-all"
                    required
                    data-testid="register-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors"
                    data-testid="toggle-password-btn"
                  >
                    {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={20} weight="duotone" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 pr-11 border-2 border-purple-600 rounded-xl h-12 focus:ring-purple-500/30 focus:border-purple-700 transition-all"
                    required
                    data-testid="register-confirm-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors"
                    data-testid="toggle-confirm-password-btn"
                  >
                    {showConfirmPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-xs font-medium ${password === confirmPassword ? 'text-emerald-600' : 'text-red-600'}`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-xl h-12 font-semibold shadow-lg transition-all hover:scale-[1.02]"
                disabled={isLoading}
                data-testid="register-submit-btn"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-bold" data-testid="login-link">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
