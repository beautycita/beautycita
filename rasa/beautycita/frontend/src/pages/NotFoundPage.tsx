import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* 404 Number */}
          <div className="relative">
            <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              404
            </h1>
            <div className="absolute inset-0 text-8xl md:text-9xl font-bold text-primary-100 opacity-50 blur-sm">
              404
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
              Página no encontrada
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/"
              className="btn btn-primary btn-lg flex items-center space-x-2"
            >
              <HomeIcon className="h-5 w-5" />
              <span>Ir al Inicio</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn btn-outline btn-lg flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Volver Atrás</span>
            </button>
          </div>

          {/* Suggestions */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              ¿Qué te gustaría hacer?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                to="/services"
                className="text-primary-600 hover:text-primary-700 text-sm underline"
              >
                Ver Servicios
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/stylists"
                className="text-primary-600 hover:text-primary-700 text-sm underline"
              >
                Buscar Estilistas
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/contact"
                className="text-primary-600 hover:text-primary-700 text-sm underline"
              >
                Contacto
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}