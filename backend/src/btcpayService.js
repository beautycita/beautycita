const axios = require('axios');

class BTCPayService {
  constructor() {
    this.baseUrl = process.env.BTCPAY_URL || 'https://beautycita.com/btcpay';
    this.apiKey = process.env.BTCPAY_API_KEY;
    this.storeId = process.env.BTCPAY_STORE_ID;
  }

  /**
   * Get BTCPay statistics for admin dashboard
   */
  async getStats() {
    try {
      if (!this.apiKey || !this.storeId) {
        throw new Error('BTCPay configuration missing');
      }

      // Fetch invoices from BTCPay
      const invoicesResponse = await axios.get(
        `${this.baseUrl}/api/v1/stores/${this.storeId}/invoices`,
        {
          headers: {
            'Authorization': `token ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            take: 50 // Get last 50 invoices
          }
        }
      );

      const invoices = invoicesResponse.data || [];

      // Calculate statistics
      const stats = {
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(inv =>
          inv.status === 'New' || inv.status === 'Processing'
        ).length,
        completedInvoices: invoices.filter(inv =>
          inv.status === 'Settled' || inv.status === 'Complete'
        ).length,
        totalBTC: this.calculateTotalBTC(invoices.filter(inv =>
          inv.status === 'Settled' || inv.status === 'Complete'
        )),
        storeBalance: '0.00', // BTCPay API doesn't expose balance directly
        recentInvoices: invoices.slice(0, 5).map(inv => ({
          id: inv.id,
          amount: inv.amount ? `${inv.amount} ${inv.currency}` : 'N/A',
          status: inv.status,
          createdTime: inv.createdTime
        }))
      };

      return stats;
    } catch (error) {
      console.error('BTCPay Service Error:', error.message);

      // Return dummy data if BTCPay is not accessible
      return {
        totalInvoices: 0,
        pendingInvoices: 0,
        completedInvoices: 0,
        totalBTC: '0.00000000',
        storeBalance: '0.00000000',
        recentInvoices: [],
        error: error.message
      };
    }
  }

  /**
   * Calculate total BTC from invoices
   */
  calculateTotalBTC(invoices) {
    let total = 0;

    for (const invoice of invoices) {
      if (invoice.amount && invoice.currency === 'BTC') {
        total += parseFloat(invoice.amount);
      }
    }

    return total.toFixed(8); // Bitcoin has 8 decimal places
  }

  /**
   * Get store information
   */
  async getStoreInfo() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/stores/${this.storeId}`,
        {
          headers: {
            'Authorization': `token ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching store info:', error.message);
      throw error;
    }
  }
}

module.exports = new BTCPayService();