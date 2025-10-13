'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2 } from 'lucide-react';

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentBalance: number;
  onSuccess: () => void;
}

export default function TokenPurchaseModal({
  isOpen,
  onClose,
  userId,
  currentBalance,
  onSuccess
}: TokenPurchaseModalProps) {
  const [amountUSD, setAmountUSD] = useState<string>('5.00');
  const [tokensPerDollar, setTokensPerDollar] = useState<number>(1000000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTokenPrice();
    }
  }, [isOpen]);

  const fetchTokenPrice = async () => {
    const { data } = await fetch('/api/wallet/price').then(r => r.json());
    if (data) setTokensPerDollar(data);
  };

  const calculateTokens = () => {
    const amount = parseFloat(amountUSD) || 0;
    return Math.floor(amount * tokensPerDollar);
  };

  const handlePurchase = async () => {
    const amount = parseFloat(amountUSD);
    
    if (amount < 3) {
      setError('Minimum purchase is $3 USD');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUSD: amount, userId })
      });

      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Garliq',
        description: `${calculateTokens().toLocaleString()} Tokens`,
        order_id: orderData.order.id,
        handler: async (response: any) => {
          // Step 3: Verify payment
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId
            })
          });

          const verifyData = await verifyRes.json();
          
          if (verifyData.success) {
            onSuccess();
            onClose();
          } else {
            setError('Payment verification failed');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        },
        theme: {
          color: '#9333ea'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (err: any) {
      setError(err.message || 'Purchase failed');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">⚡ Buy Tokens</h2>
            <button onClick={onClose} disabled={loading}>
              <X className="text-gray-400 hover:text-white" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-sm text-gray-400">Current Balance</span>
            </div>
            <p className="text-3xl font-black">{currentBalance.toLocaleString()}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Amount (USD)</label>
            <input
              type="number"
              value={amountUSD}
              onChange={(e) => setAmountUSD(e.target.value)}
              min="3"
              step="0.01"
              disabled={loading}
              className="w-full px-4 py-3 bg-black/50 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none text-2xl font-bold"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum: $3.00 USD</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">You'll receive:</span>
              <span className="text-xs text-purple-400">{tokensPerDollar.toLocaleString()} per $1</span>
            </div>
            <p className="text-3xl font-black text-purple-400">
              {calculateTokens().toLocaleString()} <span className="text-base">tokens</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePurchase}
            disabled={loading || parseFloat(amountUSD) < 3}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-bold disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              `Purchase for $${parseFloat(amountUSD).toFixed(2)}`
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}