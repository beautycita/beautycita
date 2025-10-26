import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  CameraIcon,
  BellIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

/**
 * Google Play Store Privacy Policy
 * Comprehensive policy meeting all Play Store requirements
 * URL: https://beautycita.com/privacy/play-store
 */

const PlayStorePrivacyPolicy: React.FC = () => {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <ShieldCheckIcon className="h-20 w-20" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mb-3">
            {t('pages.playStorePrivacy.header.title')}
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-4">
            {t('pages.playStorePrivacy.header.subtitle')}
          </h2>
          <p className="text-center text-lg text-white/90">
            {t('pages.playStorePrivacy.header.lastUpdated')}
          </p>
          <p className="text-center text-white/80 mt-2">
            {t('pages.playStorePrivacy.header.version')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Table of Contents */}
        <nav className={`mb-12 p-8 rounded-2xl border-2 ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-purple-50 border-purple-200'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('pages.playStorePrivacy.toc.heading')}
          </h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <a href="#introduction" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.introduction')}
            </a>
            <a href="#information-collected" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.informationCollected')}
            </a>
            <a href="#android-permissions" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.androidPermissions')}
            </a>
            <a href="#how-we-use" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.howWeUse')}
            </a>
            <a href="#third-party" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.thirdParty')}
            </a>
            <a href="#data-sharing" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.dataSharing')}
            </a>
            <a href="#data-retention" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.dataRetention')}
            </a>
            <a href="#account-deletion" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.accountDeletion')}
            </a>
            <a href="#your-rights" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.yourRights')}
            </a>
            <a href="#security" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.security')}
            </a>
            <a href="#children" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.children')}
            </a>
            <a href="#contact" className={`${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
              {t('pages.playStorePrivacy.toc.contact')}
            </a>
          </div>
        </nav>

        {/* Introduction */}
        <section id="introduction" className="mb-16 scroll-mt-8">
          <h2 className={`text-3xl font-serif font-bold mb-6 flex items-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent`}>
            <ShieldCheckIcon className="h-8 w-8 mr-3 text-purple-600" />
            {t('pages.playStorePrivacy.introduction.heading')}
          </h2>
          <div className={`prose prose-lg max-w-none leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p className="mb-4">
              {t('pages.playStorePrivacy.introduction.paragraph1')}
            </p>
            <p className="mb-4">
              <strong>{t('pages.playStorePrivacy.introduction.paragraph2')}</strong> {t('pages.playStorePrivacy.introduction.paragraph3')}
            </p>
            <p className="mb-4">
              {t('pages.playStorePrivacy.introduction.paragraph4')} <Link to="/privacy" className={`font-semibold ${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>{t('pages.playStorePrivacy.introduction.linkText')}</Link>.
            </p>
            <div className={`border-l-4 border-blue-500 p-6 rounded-xl mt-6 ${
              isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
            }`}>
              <p className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                {t('pages.playStorePrivacy.introduction.infoBox.title')}
              </p>
              <p className={isDarkMode ? 'text-blue-200' : 'text-blue-800'}>
                {t('pages.playStorePrivacy.introduction.infoBox.text')}
              </p>
            </div>
          </div>
        </section>

        {/* Information Collected */}
        <section id="information-collected" className="mb-16 scroll-mt-8">
          <h2 className={`text-3xl font-serif font-bold mb-6 flex items-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent`}>
            <DevicePhoneMobileIcon className="h-8 w-8 mr-3 text-purple-600" />
            {t('pages.playStorePrivacy.informationCollected.heading')}
          </h2>

          <h3 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('pages.playStorePrivacy.informationCollected.personalInfo.heading')}
          </h3>
          <div className={`rounded-xl p-6 mb-6 ${
            isDarkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'
          }`}>
            <ul className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.personalInfo.accountInfo.title')}</strong> {t('pages.playStorePrivacy.informationCollected.personalInfo.accountInfo.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.personalInfo.paymentInfo.title')}</strong> {t('pages.playStorePrivacy.informationCollected.personalInfo.paymentInfo.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.personalInfo.bookingInfo.title')}</strong> {t('pages.playStorePrivacy.informationCollected.personalInfo.bookingInfo.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.personalInfo.messagesInfo.title')}</strong> {t('pages.playStorePrivacy.informationCollected.personalInfo.messagesInfo.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.personalInfo.stylistInfo.title')}</strong> {t('pages.playStorePrivacy.informationCollected.personalInfo.stylistInfo.text')}
                </div>
              </li>
            </ul>
          </div>

          <h3 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('pages.playStorePrivacy.informationCollected.automaticInfo.heading')}
          </h3>
          <div className={`rounded-xl p-6 mb-6 ${
            isDarkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'
          }`}>
            <ul className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.automaticInfo.deviceInfo.title')}</strong> {t('pages.playStorePrivacy.informationCollected.automaticInfo.deviceInfo.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.automaticInfo.usageData.title')}</strong> {t('pages.playStorePrivacy.informationCollected.automaticInfo.usageData.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.automaticInfo.locationData.title')}</strong> {t('pages.playStorePrivacy.informationCollected.automaticInfo.locationData.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.automaticInfo.cameraPhotos.title')}</strong> {t('pages.playStorePrivacy.informationCollected.automaticInfo.cameraPhotos.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.automaticInfo.performanceData.title')}</strong> {t('pages.playStorePrivacy.informationCollected.automaticInfo.performanceData.text')}
                </div>
              </li>
            </ul>
          </div>

          <h3 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('pages.playStorePrivacy.informationCollected.thirdPartyInfo.heading')}
          </h3>
          <div className={`rounded-xl p-6 ${
            isDarkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'
          }`}>
            <ul className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.thirdPartyInfo.googleSignIn.title')}</strong> {t('pages.playStorePrivacy.informationCollected.thirdPartyInfo.googleSignIn.text')}
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>{t('pages.playStorePrivacy.informationCollected.thirdPartyInfo.paymentProcessors.title')}</strong> {t('pages.playStorePrivacy.informationCollected.thirdPartyInfo.paymentProcessors.text')}
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Android Permissions */}
        <section id="android-permissions" className="mb-16 scroll-mt-8">
          <h2 className={`text-3xl font-serif font-bold mb-6 flex items-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent`}>
            <DevicePhoneMobileIcon className="h-8 w-8 mr-3 text-purple-600" />
            {t('pages.playStorePrivacy.androidPermissions.heading')}
          </h2>
          <p className={`mb-6 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('pages.playStorePrivacy.androidPermissions.intro')}
          </p>

          <div className="space-y-6">
            {/* Location Permission */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-green-900/20 border-2 border-green-800' : 'bg-green-50 border-2 border-green-300'
            }`}>
              <div className="flex items-start mb-3">
                <MapPinIcon className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('pages.playStorePrivacy.androidPermissions.location.title')}
                  </h4>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-green-600">{t('pages.playStorePrivacy.androidPermissions.location.whyWeNeed')}</strong> {t('pages.playStorePrivacy.androidPermissions.location.whyText')}
                  </p>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-green-600">{t('pages.playStorePrivacy.androidPermissions.location.whenWeAccess')}</strong> {t('pages.playStorePrivacy.androidPermissions.location.whenText')}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    <strong className="text-green-600">{t('pages.playStorePrivacy.androidPermissions.location.canDeny')}</strong> {t('pages.playStorePrivacy.androidPermissions.location.canDenyText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Camera Permission */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-blue-900/20 border-2 border-blue-800' : 'bg-blue-50 border-2 border-blue-300'
            }`}>
              <div className="flex items-start mb-3">
                <CameraIcon className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('pages.playStorePrivacy.androidPermissions.camera.title')}
                  </h4>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-blue-600">{t('pages.playStorePrivacy.androidPermissions.camera.whyWeNeed')}</strong> {t('pages.playStorePrivacy.androidPermissions.camera.whyText')}
                  </p>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-blue-600">{t('pages.playStorePrivacy.androidPermissions.camera.whenWeAccess')}</strong> {t('pages.playStorePrivacy.androidPermissions.camera.whenText')}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    <strong className="text-blue-600">{t('pages.playStorePrivacy.androidPermissions.camera.canDeny')}</strong> {t('pages.playStorePrivacy.androidPermissions.camera.canDenyText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Photos/Media Permission */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-purple-900/20 border-2 border-purple-800' : 'bg-purple-50 border-2 border-purple-300'
            }`}>
              <div className="flex items-start mb-3">
                <div className="h-8 w-8 text-purple-600 mr-3 flex-shrink-0 text-2xl">🖼️</div>
                <div>
                  <h4 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('pages.playStorePrivacy.androidPermissions.photos.title')}
                  </h4>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-purple-600">{t('pages.playStorePrivacy.androidPermissions.photos.whyWeNeed')}</strong> {t('pages.playStorePrivacy.androidPermissions.photos.whyText')}
                  </p>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-purple-600">{t('pages.playStorePrivacy.androidPermissions.photos.whenWeAccess')}</strong> {t('pages.playStorePrivacy.androidPermissions.photos.whenText')}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    <strong className="text-purple-600">{t('pages.playStorePrivacy.androidPermissions.photos.canDeny')}</strong> {t('pages.playStorePrivacy.androidPermissions.photos.canDenyText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications Permission */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-yellow-900/20 border-2 border-yellow-800' : 'bg-yellow-50 border-2 border-yellow-300'
            }`}>
              <div className="flex items-start mb-3">
                <BellIcon className="h-8 w-8 text-yellow-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('pages.playStorePrivacy.androidPermissions.notifications.title')}
                  </h4>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-yellow-600">{t('pages.playStorePrivacy.androidPermissions.notifications.whyWeNeed')}</strong> {t('pages.playStorePrivacy.androidPermissions.notifications.whyText')}
                  </p>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-yellow-600">{t('pages.playStorePrivacy.androidPermissions.notifications.whenWeAccess')}</strong> {t('pages.playStorePrivacy.androidPermissions.notifications.whenText')}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    <strong className="text-yellow-600">{t('pages.playStorePrivacy.androidPermissions.notifications.canDeny')}</strong> {t('pages.playStorePrivacy.androidPermissions.notifications.canDenyText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Internet Permission */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-gray-50 border-2 border-gray-300'
            }`}>
              <div className="flex items-start mb-3">
                <GlobeAltIcon className="h-8 w-8 text-gray-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('pages.playStorePrivacy.androidPermissions.internet.title')}
                  </h4>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-gray-600">{t('pages.playStorePrivacy.androidPermissions.internet.whyWeNeed')}</strong> {t('pages.playStorePrivacy.androidPermissions.internet.whyText')}
                  </p>
                  <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong className="text-gray-600">{t('pages.playStorePrivacy.androidPermissions.internet.whenWeAccess')}</strong> {t('pages.playStorePrivacy.androidPermissions.internet.whenText')}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    <strong className="text-gray-600">{t('pages.playStorePrivacy.androidPermissions.internet.canDeny')}</strong> {t('pages.playStorePrivacy.androidPermissions.internet.canDenyText')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`border-l-4 border-orange-500 p-6 rounded-xl mt-8 ${
            isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'
          }`}>
            <p className={`font-semibold mb-2 ${isDarkMode ? 'text-orange-300' : 'text-orange-900'}`}>
              {t('pages.playStorePrivacy.androidPermissions.managingPermissions.title')}
            </p>
            <p className={isDarkMode ? 'text-orange-200' : 'text-orange-800'}>
              {t('pages.playStorePrivacy.androidPermissions.managingPermissions.text')} <strong>{t('pages.playStorePrivacy.androidPermissions.managingPermissions.path')}</strong>
            </p>
          </div>
        </section>

        {/* View Complete Policy CTA */}
        <div className={`text-center my-16 p-8 rounded-2xl ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-800 to-gray-700'
            : 'bg-gradient-to-r from-purple-50 to-pink-50'
        }`}>
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('pages.playStorePrivacy.viewComplete.text')}
          </p>
          <Link
            to="/privacy"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all hover:scale-105 text-lg"
          >
            {t('pages.playStorePrivacy.viewComplete.button')}
          </Link>
        </div>

        {/* Quick Contact */}
        <section id="contact" className="mb-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-8 rounded-2xl scroll-mt-8">
          <h2 className="text-3xl font-serif font-bold mb-6 flex items-center">
            <LockClosedIcon className="h-8 w-8 mr-3" />
            {t('pages.playStorePrivacy.contact.heading')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">{t('pages.playStorePrivacy.contact.privacyQuestions.title')}</h3>
              <p className="mb-2"><strong>{t('pages.playStorePrivacy.contact.privacyQuestions.email')}</strong> {t('pages.playStorePrivacy.contact.privacyQuestions.emailAddress')}</p>
              <p className="mb-2"><strong>{t('pages.playStorePrivacy.contact.privacyQuestions.responseTime')}</strong> {t('pages.playStorePrivacy.contact.privacyQuestions.responseText')}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">{t('pages.playStorePrivacy.contact.dataDeletion.title')}</h3>
              <p className="mb-2">{t('pages.playStorePrivacy.contact.dataDeletion.text')}</p>
              <p className="bg-white/20 px-4 py-2 rounded-full font-mono text-sm">{t('pages.playStorePrivacy.contact.dataDeletion.subject')}</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className={`border-t-2 pt-8 mt-16 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-center space-y-6">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('pages.playStorePrivacy.footer.copyright')}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/privacy" className={`font-semibold ${isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}`}>
                {t('pages.playStorePrivacy.footer.fullPrivacy')}
              </Link>
              <Link to="/terms/client" className={isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}>
                {t('pages.playStorePrivacy.footer.terms')}
              </Link>
              <Link to="/contact" className={isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}>
                {t('pages.playStorePrivacy.footer.contactSupport')}
              </Link>
              <Link to="/download-app" className={isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-purple-600 hover:underline'}>
                {t('pages.playStorePrivacy.footer.downloadApp')}
              </Link>
            </div>
            <div className={`p-6 rounded-xl inline-block ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-sm max-w-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>{t('pages.playStorePrivacy.footer.complianceTitle')}</strong> {t('pages.playStorePrivacy.footer.complianceText')}
              </p>
            </div>
            <p className={`text-xs max-w-2xl mx-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('pages.playStorePrivacy.footer.disclaimer')}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PlayStorePrivacyPolicy
