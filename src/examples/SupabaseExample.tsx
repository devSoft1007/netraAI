import { useState } from 'react'
import { useSupabaseQuery, useSupabaseMutation, useAuth, useSupabaseStorage } from '@/hooks/useSupabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, Trash2, Plus } from 'lucide-react'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
}

export default function SupabaseExample() {
  const { user, signOut } = useAuth()
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientEmail, setNewPatientEmail] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Example: Fetch patients from Supabase
  const { data: patients, isLoading, error } = useSupabaseQuery('patients')

  // Example: Mutation for creating patients
  const createPatient = useSupabaseMutation('patients', 'insert')
  const deletePatient = useSupabaseMutation('patients', 'delete')
  const updatePatient = useSupabaseMutation('patients', 'update')

  // Example: File storage
  const { uploadFile, deleteFile, getPublicUrl } = useSupabaseStorage('patient-files')

  const handleCreatePatient = () => {
    if (newPatientName && newPatientEmail) {
      createPatient.mutate({
        data: {
          first_name: newPatientName.split(' ')[0],
          last_name: newPatientName.split(' ')[1] || '',
          email: newPatientEmail,
          phone: '+1234567890'
        }
      })
      setNewPatientName('')
      setNewPatientEmail('')
    }
  }

  const handleFileUpload = () => {
    if (selectedFile && user) {
      const filePath = `${user.id}/${Date.now()}-${selectedFile.name}`
      uploadFile.mutate({ path: filePath, file: selectedFile })
      setSelectedFile(null)
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading patients...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error.message}</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Supabase Integration Example</h1>
        {user && (
          <div className="flex items-center space-x-4">
            <span>Welcome, {user.email}</span>
            <Button onClick={signOut} variant="outline">Sign Out</Button>
          </div>
        )}
      </div>

      {/* Create New Patient */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create New Patient</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Patient Name"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newPatientEmail}
              onChange={(e) => setNewPatientEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleCreatePatient}
            disabled={createPatient.isPending}
            className="medical-button-primary"
          >
            {createPatient.isPending ? 'Creating...' : 'Create Patient'}
          </Button>
        </CardContent>
      </Card>

      {/* File Upload Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>File Upload Example</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*,.pdf,.doc,.docx"
            />
            <Button 
              onClick={handleFileUpload}
              disabled={!selectedFile || uploadFile.isPending}
            >
              {uploadFile.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          {selectedFile && (
            <div className="text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Patients from Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          {patients && patients.length > 0 ? (
            <div className="space-y-4">
              {patients.map((patient: Patient) => (
                <div key={patient.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{patient.first_name} {patient.last_name}</h3>
                    <p className="text-sm text-gray-600">{patient.email}</p>
                    {patient.phone && (
                      <p className="text-sm text-gray-600">{patient.phone}</p>
                    )}
                    <Badge variant="outline" className="mt-1">
                      Created: {new Date(patient.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePatient.mutate({
                        id: patient.id,
                        data: { phone: '+1987654321' }
                      })}
                      disabled={updatePatient.isPending}
                    >
                      Update Phone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePatient.mutate({ id: patient.id })}
                      disabled={deletePatient.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No patients found in Supabase</p>
          )}
        </CardContent>
      </Card>

      {/* Real-time Example */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Features</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This component automatically updates when data changes in Supabase using real-time subscriptions.
            Try adding/editing patients from another browser tab or the Supabase dashboard.
          </p>
          <Badge variant="secondary">Real-time subscriptions active</Badge>
        </CardContent>
      </Card>

      {/* API Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Available Supabase Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Authentication</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• signUp(email, password)</li>
                <li>• signIn(email, password)</li>
                <li>• signOut()</li>
                <li>• getCurrentUser()</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Database</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• select(table, columns, filters)</li>
                <li>• insert(table, data)</li>
                <li>• update(table, id, data)</li>
                <li>• delete(table, id)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Storage</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• upload(bucket, path, file)</li>
                <li>• download(bucket, path)</li>
                <li>• getPublicUrl(bucket, path)</li>
                <li>• remove(bucket, paths)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">React Hooks</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• useSupabaseQuery()</li>
                <li>• useSupabaseMutation()</li>
                <li>• useAuth()</li>
                <li>• useSupabaseStorage()</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}