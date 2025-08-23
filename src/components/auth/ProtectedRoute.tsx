import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuthContext } from './AuthProvider'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      setLocation(redirectTo)
    }
  }, [user, loading, setLocation, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-medical-blue" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}