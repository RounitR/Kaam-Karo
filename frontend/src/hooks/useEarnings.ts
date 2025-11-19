import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface Transaction {
  id: number;
  transaction_id: string;
  assignment: number;
  assignment_job_title: string;
  worker: number;
  worker_name: string;
  customer: number;
  customer_name: string;
  transaction_type: 'payment' | 'refund' | 'bonus';
  amount: string;
  platform_fee: string;
  net_amount: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Earning {
  id: number;
  worker: number;
  worker_name: string;
  transaction: number;
  transaction_id: string;
  gross_amount: string;
  platform_fee: string;
  net_amount: string;
  tax_deducted: string;
  bonus_amount: string;
  final_amount: string;
  job_category: string;
  job_duration_hours: number;
  customer_rating: number | null;
  earned_at: string;
}

export interface MonthlyEarning {
  month: string;
  month_name: string;
  amount: number;
}

export interface EarningsSummary {
  total_earnings: string;
  gross_total_earnings: string;
  this_month_earnings: string;
  this_month_gross_earnings: string;
  pending_amount: string;
  completed_jobs: number;
  average_rating: string;
  recent_transactions: Transaction[];
  monthly_earnings: MonthlyEarning[];
}

export const useEarnings = () => {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchEarnings = async () => {
    const token = authService.getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/earnings/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch earnings');
      }

      const data = await response.json();
      setEarnings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    const token = authService.getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEarningsSummary = async () => {
    const token = authService.getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/earnings/summary/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch earnings summary');
      }

      const data = await response.json();
      setEarningsSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (assignmentId: number) => {
    const token = authService.getAccessToken();
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const data = await response.json();
      
      // Refresh data after creating transaction
      await Promise.all([
        fetchTransactions(),
        fetchEarnings(),
        fetchEarningsSummary(),
      ]);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        fetchEarnings(),
        fetchTransactions(),
        fetchEarningsSummary(),
      ]);
    }
  }, [isAuthenticated]);

  return {
    earnings,
    transactions,
    earningsSummary,
    loading,
    error,
    fetchEarnings,
    fetchTransactions,
    fetchEarningsSummary,
    createTransaction,
    refetch: () => {
      Promise.all([
        fetchEarnings(),
        fetchTransactions(),
        fetchEarningsSummary(),
      ]);
    },
  };
};

export default useEarnings;