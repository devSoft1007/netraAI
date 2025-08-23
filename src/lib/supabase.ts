import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL and Anon Key are required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Auth helper functions
export const auth = {
  // Sign up new user
  signUp: async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // Sign in user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out user
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const database = {
  // Generic select function
  select: async (table: string, columns = '*', filters?: any) => {
    let query = supabase.from(table).select(columns)
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key])
      })
    }
    
    const { data, error } = await query
    return { data, error }
  },

  // Generic insert function
  insert: async (table: string, data: any) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
    return { data: result, error }
  },

  // Generic update function
  update: async (table: string, id: string, data: any) => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
    return { data: result, error }
  },

  // Generic delete function
  delete: async (table: string, id: string) => {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Real-time subscription
  subscribe: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe()
  }
}

// Storage helper functions
export const storage = {
  // Upload file
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    return { data, error }
  },

  // Download file
  download: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)
    return { data, error }
  },

  // Get public URL
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  },

  // Delete file
  remove: async (bucket: string, paths: string[]) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths)
    return { data, error }
  }
}

export default supabase