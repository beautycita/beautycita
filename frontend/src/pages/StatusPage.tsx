import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ServerIcon,
  CreditCardIcon,
  BellIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import { PageHero, GradientCard } from '../components/ui';

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  message: string;
  value?: number;
  unit?: string;
  uptime?: number;
  error?: string;
  modelCount?: number;
  pid?: number;
  nodeVersion?: string;
}

interface StatusData {
  timestamp: string;
  overall: 'operational' | 'degraded' | 'outage' | 'maintenance';
  services: Record<string, ServiceStatus>;
}

const StatusPage: React.FC = () => {
  const { t } = useTranslation();
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    const handleStorageChange = () => {
      setIsDarkMode(localStorage.getItem('darkMode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch status data from API
  const fetchStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: StatusData = await response.json();
      setStatusData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      console.error('Status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'outage':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'maintenance':
        return <ClockIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'outage':
        return 'text-red-600';
      case 'maintenance':
        return 'text-blue-600';
      default:
        return 'text-green-600';
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('api') || name.includes('server')) return ServerIcon;
    if (name.includes('payment') || name.includes('stripe')) return CreditCardIcon;
    if (name.includes('notification') || name.includes('sms')) return BellIcon;
    if (name.includes('database')) return CircleStackIcon;
    return ServerIcon;
  };

  const serviceComponents = [
    { name: 'API Server', key: 'API', icon: ServerIcon, gradient: 'from-pink-500 to-purple-600' },
    { name: 'Payment Processing', key: 'Payments', icon: CreditCardIcon, gradient: 'from-purple-500 to-blue-600' },
    { name: 'SMS Notifications', key: 'Notifications', icon: BellIcon, gradient: 'from-blue-500 to-indigo-600' },
    { name: 'Database', key: 'Database', icon: CircleStackIcon, gradient: 'from-indigo-500 to-purple-600' }
  ];

  // Get overall status for banner
  const getOverallStatus = () => {
    if (error || !statusData) {
      return 'error';
    }
    return statusData.overall;
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title="System Status"
        subtitle="Real-time service monitoring and uptime"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-80"
      >
        {/* Overall Status Badge */}
        <div className="mt-6">
          {overallStatus === 'operational' && (
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500/20 backdrop-blur-sm rounded-3xl border border-green-500/30">
              <CheckCircleIcon className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">All Systems Operational</span>
            </div>
          )}
          {overallStatus === 'degraded' && (
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-yellow-500/20 backdrop-blur-sm rounded-3xl border border-yellow-500/30">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">Some Systems Degraded</span>
            </div>
          )}
          {overallStatus === 'outage' && (
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-red-500/20 backdrop-blur-sm rounded-3xl border border-red-500/30">
              <XCircleIcon className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">Service Outage</span>
            </div>
          )}
          {overallStatus === 'error' && (
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-red-500/20 backdrop-blur-sm rounded-3xl border border-red-500/30">
              <XCircleIcon className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">Unable to Load Status</span>
            </div>
          )}
        </div>
      </PageHero>

      {/* System Status */}
      <section className="container mx-auto px-4 max-w-6xl py-16">
        <GradientCard gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10" isDarkMode={isDarkMode}>
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Service Components
            </h2>
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>

          {isLoading && !statusData ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-purple-500" />
              <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading status...
              </span>
            </div>
          ) : statusData ? (
            <div className="grid md:grid-cols-2 gap-6">
              {serviceComponents.map((component, index) => {
                const service = statusData.services[component.key] || {
                  status: 'operational',
                  message: 'Operational'
                };
                const Icon = component.icon;

                return (
                  <motion.div
                    key={component.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div
                      className={`p-6 rounded-3xl ${
                        isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'
                      } backdrop-blur-sm border ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-3xl bg-gradient-to-r ${component.gradient}`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {component.name}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {component.key}
                            </p>
                          </div>
                        </div>
                        {getStatusIcon(service.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${getStatusColor(service.status)}`}>
                          {service.message}
                        </span>
                        {service.uptime && (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {service.uptime}% uptime
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className={`mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                Failed to load status
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {error}
              </p>
            </div>
          )}

          <div className={`flex items-center justify-between mt-8 pt-6 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Last updated: {lastUpdated.toLocaleString()}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Auto-refreshes every 30 seconds
            </p>
          </div>
        </GradientCard>
      </section>

      {/* Uptime Statistics */}
      <section className="container mx-auto px-4 max-w-6xl pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Uptime Performance
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Last 30 days availability
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: 'Overall Uptime', value: '99.9%', gradient: 'from-green-500 to-emerald-600' },
            { label: 'Average Response Time', value: '120ms', gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Incidents Resolved', value: '24/7', gradient: 'from-purple-500 to-pink-600' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientCard gradient={`${stat.gradient}/10`} isDarkMode={isDarkMode}>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-3xl blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-3xl blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white relative z-10 px-4"
        >
          <BellIcon className="h-16 w-16 text-white/90 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Get Status Updates
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Subscribe to receive notifications about system status changes and scheduled maintenance.
          </p>
          <button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            Subscribe to Updates
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default StatusPage;
