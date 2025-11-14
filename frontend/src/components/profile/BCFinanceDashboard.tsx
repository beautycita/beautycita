import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Transaction {
  id: number
  type: 'deposit' | 'withdraw' | 'payment' | 'refund' | 'dispute'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'disputed'
  description: string
  created_at: string
  reference?: string
}

interface BCFinanceDashboardProps {
  onComplete: () => void
  isOnboarding?: boolean
}

export default function BCFinanceDashboard({ onComplete, isOnboarding = false }: BCFinanceDashboardProps) {
  const { user } = useAuthStore()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | 'pay' | 'dispute' | null>(null)
  const [amount, setAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  // Dispute form
  const [disputeForm, setDisputeForm] = useState({
    transactionId: '',
    reason: '',
    description: ''
  })

  // Pay form
  const [payForm, setPayForm] = useState({
    recipient: '',
    amount: '',
    description: ''
  })

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      const [balanceRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/finance/balance`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
        }),
        axios.get(`${API_URL}/api/finance/transactions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
        })
      ])

      setBalance(balanceRes.data.balance || 0)
      setTransactions(transactionsRes.data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      setProcessing(true)
      const response = await axios.post(
        `${API_URL}/api/finance/deposit`,
        { amount: parseFloat(amount) },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
        }
      )

      if (response.data.success) {
        toast.success('Deposit initiated! 💰')
        setActiveModal(null)
        setAmount('')
        fetchFinanceData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process deposit')
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(amount) > balance) {
      toast.error('Insufficient balance')
      return
    }

    try {
      setProcessing(true)
      const response = await axios.post(
        `${API_URL}/api/finance/withdraw`,
        { amount: parseFloat(amount) },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
        }
      )

      if (response.data.success) {
        toast.success('Withdrawal initiated! 💸')
        setActiveModal(null)
        setAmount('')
        fetchFinanceData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  const handlePay = async () => {
    if (!payForm.recipient || !payForm.amount || parseFloat(payForm.amount) <= 0) {
      toast.error('Please fill all fields')
      return
    }

    if (parseFloat(payForm.amount) > balance) {
      toast.error('Insufficient balance')
      return
    }

    try {
      setProcessing(true)
      const response = await axios.post(
        `${API_URL}/api/finance/pay`,
        {
          recipient: payForm.recipient,
          amount: parseFloat(payForm.amount),
          description: payForm.description
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
        }
      )

      if (response.data.success) {
        toast.success('Payment sent! ✨')
        setActiveModal(null)
        setPayForm({ recipient: '', amount: '', description: '' })
        fetchFinanceData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send payment')
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateDispute = async () => {
    if (!disputeForm.transactionId || !disputeForm.reason || !disputeForm.description) {
      toast.error('Please fill all fields')
      return
    }

    try {
      setProcessing(true)
      const response = await axios.post(
        `${API_URL}/api/finance/dispute`,
        disputeForm,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
        }
      )

      if (response.data.success) {
        toast.success('Dispute created! We will review it shortly.')
        setActiveModal(null)
        setDisputeForm({ transactionId: '', reason: '', description: '' })
        fetchFinanceData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create dispute')
    } finally {
      setProcessing(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownIcon className="w-5 h-5 text-green-600" />
      case 'withdraw':
        return <ArrowUpIcon className="w-5 h-5 text-red-600" />
      case 'payment':
        return <PaperAirplaneIcon className="w-5 h-5 text-blue-600" />
      case 'refund':
        return <ArrowDownIcon className="w-5 h-5 text-purple-600" />
      case 'dispute':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
      default:
        return <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-3xl">Completed</span>
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-3xl">Pending</span>
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-3xl">Failed</span>
      case 'disputed':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-3xl">Disputed</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white">
        <p className="text-purple-100 text-sm mb-2">Available Balance</p>
        <h2 className="text-4xl font-bold mb-6">${balance.toFixed(2)}</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveModal('deposit')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 px-4 rounded-3xl transition-colors flex flex-col items-center gap-2"
          >
            <ArrowDownIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Deposit</span>
          </button>

          <button
            onClick={() => setActiveModal('withdraw')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 px-4 rounded-3xl transition-colors flex flex-col items-center gap-2"
          >
            <ArrowUpIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Withdraw</span>
          </button>

          <button
            onClick={() => setActiveModal('pay')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 px-4 rounded-3xl transition-colors flex flex-col items-center gap-2"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Pay</span>
          </button>

          <button
            onClick={() => setActiveModal('dispute')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 px-4 rounded-3xl transition-colors flex flex-col items-center gap-2"
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Dispute</span>
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString()} at{' '}
                      {new Date(transaction.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type === 'deposit' || transaction.type === 'refund'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                    ${transaction.amount.toFixed(2)}
                  </p>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Continue Button (for onboarding) */}
      {isOnboarding && (
        <button
          onClick={onComplete}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <CheckCircleIcon className="w-5 h-5" />
          <span>Finish Setup</span>
        </button>
      )}

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'deposit' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Deposit Funds</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-3xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Deposit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'withdraw' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Withdraw Funds</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-3">
                  <p className="text-sm text-blue-900">Available: <span className="font-bold">${balance.toFixed(2)}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      max={balance}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-3xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'pay' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Send Payment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient (Email or Phone)</label>
                  <input
                    type="text"
                    value={payForm.recipient}
                    onChange={(e) => setPayForm({ ...payForm, recipient: e.target.value })}
                    placeholder="email@example.com or +1234567890"
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                      placeholder="0.00"
                      max={balance}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={payForm.description}
                    onChange={(e) => setPayForm({ ...payForm, description: e.target.value })}
                    placeholder="What's this for?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePay}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-3xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'dispute' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Dispute</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={disputeForm.transactionId}
                    onChange={(e) => setDisputeForm({ ...disputeForm, transactionId: e.target.value })}
                    placeholder="Enter transaction ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <select
                    value={disputeForm.reason}
                    onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">Select a reason</option>
                    <option value="unauthorized">Unauthorized Transaction</option>
                    <option value="service_not_received">Service Not Received</option>
                    <option value="incorrect_amount">Incorrect Amount</option>
                    <option value="poor_quality">Poor Quality Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={disputeForm.description}
                    onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                    placeholder="Please provide details about your dispute..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDispute}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-3xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Creating...' : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
