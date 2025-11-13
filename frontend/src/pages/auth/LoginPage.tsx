import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthModal from '../../components/auth/AuthModal'

export default function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const navigate = useNavigate()

  const handleClose = () => {
    setIsModalOpen(false)
    navigate('/')
  }

  return (
    <AuthModal
      isOpen={isModalOpen}
      onClose={handleClose}
      initialMode="login"
    />
  )
}
