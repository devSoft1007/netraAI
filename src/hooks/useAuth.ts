import { useAuthContext } from '@/components/auth/AuthProvider'
import { useLocation } from 'wouter'
import { useCallback } from 'react'

export const useAuth = () => {
  const authContext = useAuthContext()
  const [, setLocation] = useLocation()

  const loginAndRedirect = useCallback(async (
    email: string, 
    password: string, 
    redirectTo: string = '/dashboard'
  ) => {
    const { error } = await authContext.signIn(email, password)
    if (!error) {
      setLocation(redirectTo)
    }
    return { error }
  }, [authContext, setLocation])

  const signUpAndRedirect = useCallback(async (
    email: string, 
    password: string, 
    userData?: any,
    redirectTo: string = '/registration-success'
  ) => {
    const { error } = await authContext.signUp(email, password, userData)
    if (!error) {
      setLocation(redirectTo)
    }
    return { error }
  }, [authContext, setLocation])

  const logoutAndRedirect = useCallback(async (redirectTo: string = '/login') => {
    const { error } = await authContext.signOut()
    if (!error) {
      setLocation(redirectTo)
    }
    return { error }
  }, [authContext, setLocation])

  const isAuthenticated = Boolean(authContext.user && authContext.session)

  return {
    ...authContext,
    loginAndRedirect,
    signUpAndRedirect,
    logoutAndRedirect,
    isAuthenticated,
  }
}
