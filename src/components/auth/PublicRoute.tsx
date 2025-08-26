import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuthContext } from './AuthProvider'

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
  restrictWhenAuthenticated?: boolean
}

export default function PublicRoute({ 
  children, 
  redirectTo = '/dashboard',
  restrictWhenAuthenticated = true 
}: PublicRouteProps) {
  const { user, loading } = useAuthContext()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && user && restrictWhenAuthenticated) {
      setLocation(redirectTo)
    }
  }, [user, loading, setLocation, redirectTo, restrictWhenAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-gray-300 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user && restrictWhenAuthenticated) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}
