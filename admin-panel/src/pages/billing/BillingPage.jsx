import React from 'react';

const BillingPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Payments</h1>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Monthly Revenue</h3>
        <p className="text-3xl font-bold text-green-600">$45,678</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">+23.1% from last month</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Active Subscriptions</h3>
        <p className="text-3xl font-bold text-blue-600">1,234</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">+12% from last month</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed Payments</h3>
        <p className="text-3xl font-bold text-red-600">23</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Requires attention</p>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {[
          { id: 'tx_001', user: 'Venkatesh Lahori', amount: '$29.99', status: 'Success', date: '2 min ago' },
          { id: 'tx_002', user: 'Sarah Wilson', amount: '$99.99', status: 'Success', date: '15 min ago' },
          { id: 'tx_003', user: 'Mike Johnson', amount: '$29.99', status: 'Failed', date: '1 hour ago' },
          { id: 'tx_004', user: 'Emma Davis', amount: '$299.99', status: 'Success', date: '3 hours ago' },
        ].map((tx, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.user}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{tx.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{tx.amount}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default BillingPage;
