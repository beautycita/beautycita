import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  ClockIcon,
  CalculatorIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  StarIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { PageHero, GradientCard } from '../components/ui';

const CommissionsPage: React.FC = () => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [calculatorData, setCalculatorData] = useState({ services: 10, avgPrice: 500 });

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    const handleStorageChange = () => {
      setIsDarkMode(localStorage.getItem('darkMode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const paymentSteps = [
    { step: '1', title: t('pages.commissions.step1'), desc: t('pages.commissions.step1Desc'), icon: CheckCircleIcon, gradient: 'from-green-500 to-emerald-600' },
    { step: '2', title: t('pages.commissions.step2'), desc: t('pages.commissions.step2Desc'), icon: ClockIcon, gradient: 'from-blue-500 to-indigo-600' },
    { step: '3', title: t('pages.commissions.step3'), desc: t('pages.commissions.step3Desc'), icon: CreditCardIcon, gradient: 'from-purple-500 to-pink-600' },
    { step: '4', title: t('pages.commissions.step4'), desc: t('pages.commissions.step4Desc'), icon: BanknotesIcon, gradient: 'from-pink-500 to-red-600' }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title={t('pages.commissions.title')}
        subtitle={t('pages.commissions.subtitle')}
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-96"
      >
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link
            to="/register/stylist"
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Comenzar como Estilista
          </Link>
          <button
            onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            className="border-2 border-white text-white px-8 py-4 rounded-3xl font-semibold hover:bg-white/10 transition-all duration-300"
          >
            Calcular Ganancias
          </button>
        </div>
      </PageHero>

      {/* Commission Highlights */}
      <section className="container mx-auto px-4 max-w-6xl py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <GradientCard gradient="from-green-500/10 to-emerald-600/10" isDarkMode={isDarkMode}>
              <div className="text-center">
                <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  97%
                </div>
                <div className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('pages.commissions.youKeep')}
                </div>
                <div className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('pages.commissions.fromEveryService')}
                </div>
                <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-green-50'}`}>
                  <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('pages.commissions.platformFee')}
                  </div>
                  <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Solo 3% de comisión
                  </div>
                </div>
              </div>
            </GradientCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <GradientCard gradient="from-blue-500/10 to-indigo-600/10" isDarkMode={isDarkMode}>
              <div className="text-center">
                <ClockIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Pagos Rápidos
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Recibe tu dinero en 2-3 días hábiles después de cada servicio
                </p>
                <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-blue-50'}`}>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                    24-72h
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tiempo promedio de pago
                  </div>
                </div>
              </div>
            </GradientCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <GradientCard gradient="from-purple-500/10 to-pink-600/10" isDarkMode={isDarkMode}>
              <div className="text-center">
                <TrophyIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Bonos Extra
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gana hasta 5% adicional por excelencia en el servicio
                </p>
                <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-purple-50'}`}>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                    +5%
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Bono por 5 estrellas
                  </div>
                </div>
              </div>
            </GradientCard>
          </motion.div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section id="calculator" className="container mx-auto px-4 max-w-4xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <CalculatorIcon className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Calculadora de Ganancias
          </h2>
          <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Descubre cuánto podrías ganar con BeautyCita
          </p>
        </motion.div>

        <GradientCard gradient="from-purple-500/10 via-pink-500/10 to-blue-500/10" isDarkMode={isDarkMode}>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Ingresa tus datos
              </h3>
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Servicios por mes
                  </label>
                  <input
                    type="number"
                    value={calculatorData.services}
                    onChange={(e) => setCalculatorData(prev => ({ ...prev, services: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-4 py-3 rounded-3xl border transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500'
                    }`}
                    min="1"
                    max="200"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Precio promedio por servicio (MXN)
                  </label>
                  <input
                    type="number"
                    value={calculatorData.avgPrice}
                    onChange={(e) => setCalculatorData(prev => ({ ...prev, avgPrice: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-4 py-3 rounded-3xl border transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500'
                    }`}
                    min="100"
                    max="5000"
                  />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'} backdrop-blur-sm`}>
              <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Tus ganancias estimadas
              </h3>
              <div className="space-y-4">
                <div className={`flex justify-between items-center p-4 rounded-3xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Ingresos brutos mensuales:</span>
                  <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${(calculatorData.services * calculatorData.avgPrice).toLocaleString('es-MX')}
                  </span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-3xl ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Comisión BeautyCita (3%):</span>
                  <span className="text-lg font-semibold text-red-600">
                    -${Math.round(calculatorData.services * calculatorData.avgPrice * 0.03).toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="p-6 rounded-3xl bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-green-100">Tu ganancia neta:</span>
                    <span className="text-3xl font-bold">
                      ${Math.round(calculatorData.services * calculatorData.avgPrice * 0.97).toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${Math.round(calculatorData.services * calculatorData.avgPrice * 0.97 * 12).toLocaleString('es-MX')}
                  </div>
                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ganancia anual estimada
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GradientCard>
      </section>

      {/* Payment Process */}
      <section className="container mx-auto px-4 max-w-6xl pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <CreditCardIcon className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('pages.commissions.paymentsTitle')}
          </h2>
          <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('pages.commissions.paymentsDesc')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {paymentSteps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GradientCard gradient={`${item.gradient}/10`} isDarkMode={isDarkMode} className="text-center h-full">
                  <div className={`w-8 h-8 rounded-full mx-auto mb-4 bg-gradient-to-r ${item.gradient} text-white flex items-center justify-center font-bold`}>
                    {item.step}
                  </div>
                  <div className={`p-3 rounded-3xl bg-gradient-to-r ${item.gradient} inline-block mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.desc}
                  </p>
                </GradientCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Bonus System */}
      <section className="container mx-auto px-4 max-w-6xl pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('pages.commissions.bonusesTitle')}
          </h2>
          <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('pages.commissions.bonusesDesc')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <GradientCard gradient="from-yellow-500/10 to-orange-600/10" isDarkMode={isDarkMode} className="text-center">
              <StarIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Bono por Excelencia
              </h3>
              <div className="text-4xl font-bold text-yellow-500 mb-2">+2%</div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Por mantener 4.8+ estrellas de calificación durante el mes
              </p>
            </GradientCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <GradientCard gradient="from-blue-500/10 to-indigo-600/10" isDarkMode={isDarkMode} className="text-center">
              <UserGroupIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Bono por Referidos
              </h3>
              <div className="text-4xl font-bold text-blue-500 mb-2">$500</div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Por cada estilista que traigas y complete 10 servicios
              </p>
            </GradientCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <GradientCard gradient="from-green-500/10 to-emerald-600/10" isDarkMode={isDarkMode} className="text-center">
              <ChartBarIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Bono por Volumen
              </h3>
              <div className="text-4xl font-bold text-green-500 mb-2">+3%</div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Al completar 50+ servicios en un mes
              </p>
            </GradientCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para maximizar tus ganancias?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Únete a miles de estilistas que ya están creciendo su negocio con BeautyCita.
            Regístrate hoy y comienza a ganar más.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register/stylist"
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Registrarme como Estilista
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-3xl font-semibold hover:bg-white/10 transition-all duration-300"
            >
              Hablar con un Asesor
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default CommissionsPage;
