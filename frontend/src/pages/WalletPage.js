import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Wallet } from '@phosphor-icons/react';

const WalletPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-white hover:bg-white/10"
            data-testid="back-btn"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Wallet</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center border-slate-200 rounded-2xl">
          <Wallet size={64} className="mx-auto text-emerald-600 mb-4" weight="duotone" />
          <h2 className="text-xl font-bold mb-2">Wallet Page</h2>
          <p className="text-slate-600">Coming soon...</p>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;
