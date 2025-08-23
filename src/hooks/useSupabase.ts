import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, auth, database } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Auth hook
export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    auth.getCurrentSession().then(({ session }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN') {
        toast({
          title: "Signed In",
          description: "Welcome back!",
        })
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed Out",
          description: "You have been signed out.",
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [toast])

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true)
    const { data, error } = await auth.signUp(email, password, userData)
    setLoading(false)
    
    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link.",
      })
    }
    
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await auth.signIn(email, password)
    setLoading(false)
    
    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      })
    }
    
    return { data, error }
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await auth.signOut()
    setLoading(false)
    
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      })
    }
    
    return { error }
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  }
}

// Data fetching hooks
export function useSupabaseQuery(table: string, columns?: string, filters?: any) {
  return useQuery({
    queryKey: ['supabase', table, columns, filters],
    queryFn: () => database.select(table, columns, filters),
    select: (data) => data.data,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSupabaseMutation(table: string, operation: 'insert' | 'update' | 'delete') {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data?: any }) => {
      switch (operation) {
        case 'insert':
          return database.insert(table, data)
        case 'update':
          return database.update(table, id!, data)
        case 'delete':
          return database.delete(table, id!)
        default:
          throw new Error(`Unsupported operation: ${operation}`)
      }
    },
    onSuccess: (result) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['supabase', table] })
      
      if (result.error) {
        toast({
          title: "Operation Failed",
          description: result.error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: `${operation === 'insert' ? 'Created' : operation === 'update' ? 'Updated' : 'Deleted'} successfully`,
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  })
}

// Real-time subscription hook
export function useSupabaseSubscription(table: string, callback?: (payload: any) => void) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const subscription = database.subscribe(table, (payload) => {
      // Invalidate queries when data changes
      queryClient.invalidateQueries({ queryKey: ['supabase', table] })
      
      // Call custom callback if provided
      if (callback) {
        callback(payload)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [table, callback, queryClient])
}

// Storage hooks
export function useSupabaseStorage(bucket: string) {
  const { toast } = useToast()

  const uploadFile = useMutation({
    mutationFn: async ({ path, file }: { path: string; file: File }) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file)
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "File uploaded successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const deleteFile = useMutation({
    mutationFn: async (paths: string[]) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths)
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Delete Successful",
        description: "File deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const getPublicUrl = (path: string) => {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  return {
    uploadFile,
    deleteFile,
    getPublicUrl
  }
}