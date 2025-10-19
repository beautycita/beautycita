import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  BanknotesIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import axios from 'axios'

interface BitcoinWallet {
  id: string
  wallet_address: string
  checkout_link: string
  invoice_id: string
  label: string
  created_at: string
}

interface Balance {
  balance_usd: number
  balance_mxn: number
  total_deposited_btc: number
  total_deposited_usd: number
  total_deposited_mxn: number
}

interface Deposit {
  id: string
  amount_btc: number
  amount_usd: number
  amount_mxn: number
  confirmations: number
  status: string
  detected_at: string
  confirmed_at?: string
}

export default function BitcoinDeposit() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<BitcoinWallet | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [btcPrice, setBtcPrice] = useState({ usd: 0, mxn: 0 })
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [walletRes, balanceRes, depositsRes, priceRes] = await Promise.all([
        axios.get('/api/bitcoin/wallet'),
        axios.get('/api/bitcoin/balance'),
        axios.get('/api/bitcoin/deposits'),
        axios.get('/api/bitcoin/price')
      ])

      if (walletRes.data.success) {
        setWallet(walletRes.data.data)
      }
      if (balanceRes.data.success) {
        setBalance(balanceRes.data.data)
      }
      if (depositsRes.data.success) {
        setDeposits(depositsRes.data.data)
      }
      if (priceRes.data.success) {
        setBtcPrice(priceRes.data.data)
      }
    } catch (error) {
      console.error('Error loading Bitcoin data:', error)
      toast.error('Error loading Bitcoin wallet')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const openCheckoutLink = () => {
    if (wallet?.checkout_link) {
      window.open(wallet.checkout_link, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Bitcoin Wallet
          </h1>
          <p className="text-gray-600">
            Deposit Bitcoin to add funds to your account
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">USD Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${balance?.balance_usd.toFixed(2) || '0.00'}
                  </p>
                </div>
                <BanknotesIcon className="h-10 w-10 text-green-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">MXN Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${balance?.balance_mxn.toFixed(2) || '0.00'}
                  </p>
                </div>
                <BanknotesIcon className="h-10 w-10 text-blue-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deposited</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {balance?.total_deposited_btc.toFixed(8) || '0.00000000'} BTC
                  </p>
                </div>
                <ArrowDownTrayIcon className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Deposit Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Deposit Address */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="card-body">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <QrCodeIcon className="h-6 w-6 mr-2 text-primary-600" />
                Deposit Bitcoin
              </h2>

              {wallet ? (
                <>
                  <div className="space-y-4">
                    {/* BTCPay Checkout Link */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Page
                      </label>
                      <button
                        onClick={openCheckoutLink}
                        className="w-full btn btn-primary flex items-center justify-center space-x-2 rounded-full"
                      >
                        <BoltIcon className="h-5 w-5" />
                        <span>Open Payment Page</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Opens BTCPay checkout with QR code and payment options
                      </p>
                    </div>

                    {/* Invoice ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice ID
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={wallet.invoice_id || ''}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-full bg-gray-50 text-sm font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(wallet.invoice_id)}
                          className="p-2 border border-gray-300 rounded-full hover:bg-gray-50"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-full">
                      <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                        <BoltIcon className="h-5 w-5 mr-2" />
                        Lightning Network Supported
                      </h3>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Instant payments (seconds)</li>
                        <li>• Near-zero fees (~$0.001)</li>
                        <li>• On-chain also available (3+ confirmations)</li>
                        <li>• Funds credited automatically in USD and MXN</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No wallet generated yet</p>
                  <button onClick={loadData} className="btn btn-primary rounded-full">
                    Generate Wallet
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Current Bitcoin Price */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="card-body">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Current Bitcoin Price
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full text-white">
                  <p className="text-sm opacity-90 mb-1">1 BTC =</p>
                  <p className="text-3xl font-bold">
                    ${btcPrice.usd.toLocaleString()}
                  </p>
                  <p className="text-sm opacity-90">USD</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full text-white">
                  <p className="text-sm opacity-90 mb-1">1 BTC =</p>
                  <p className="text-3xl font-bold">
                    ${btcPrice.mxn.toLocaleString()}
                  </p>
                  <p className="text-sm opacity-90">MXN</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-full">
                  <p className="text-xs text-gray-500 mb-2">Example deposits:</p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>0.001 BTC</span>
                      <span className="font-medium">
                        ${(btcPrice.usd * 0.001).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>0.01 BTC</span>
                      <span className="font-medium">
                        ${(btcPrice.usd * 0.01).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>0.1 BTC</span>
                      <span className="font-medium">
                        ${(btcPrice.usd * 0.1).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Deposits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="card-body">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Deposits
            </h2>

            {deposits.length === 0 ? (
              <div className="text-center py-8">
                <ArrowDownTrayIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No deposits yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Your Bitcoin deposits will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-full hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      {deposit.status === 'confirmed' ? (
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                      ) : (
                        <ClockIcon className="h-8 w-8 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {deposit.amount_btc.toFixed(8)} BTC
                        </p>
                        <p className="text-sm text-gray-600">
                          ${deposit.amount_usd.toFixed(2)} USD / $
                          {deposit.amount_mxn.toFixed(2)} MXN
                        </p>
                        <p className="text-xs text-gray-500">
                          {deposit.confirmations}/3 confirmations •{' '}
                          {new Date(deposit.detected_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          deposit.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}