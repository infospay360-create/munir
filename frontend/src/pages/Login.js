import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Lock, Eye, EyeSlash } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mobile.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    
    setIsLoading(true);
    const result = await login(mobile, password);
    setIsLoading(false);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-200 shadow-2xl backdrop-blur-sm bg-white/95" data-testid="login-card">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Phone size={40} weight="duotone" className="text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Login to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-slate-700 font-semibold">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} weight="duotone" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={mobile}
                    onChange={handleMobileChange}
                    className="pl-11 border-2 border-purple-600 rounded-xl h-12 focus:ring-purple-500/30 focus:border-purple-700 transition-all"
                    required
                    maxLength={10}
                    data-testid="login-mobile-input"
                  />
                  {mobile.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      {mobile.length}/10
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} weight="duotone" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 border-2 border-purple-600 rounded-xl h-12 focus:ring-purple-500/30 focus:border-purple-700 transition-all"
                    required
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    data-testid="toggle-password-btn"
                  >
                    {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-12 font-semibold shadow-lg transition-all hover:scale-[1.02]"
                disabled={isLoading}
                data-testid="login-submit-btn"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold" data-testid="forgot-password-link">
                  Forgot Password?
                </Link>
              </div>
              <div className="text-center text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-bold" data-testid="register-link">
                  Sign Up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
