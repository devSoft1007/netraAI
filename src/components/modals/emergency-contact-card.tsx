import React from 'react'
import { User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Patient } from '@shared/schema'

interface Props {
  patient: Patient
  editedPatient: Partial<Patient> & Record<string, any>
  setEditedPatient: React.Dispatch<React.SetStateAction<Partial<Patient> & Record<string, any>>>
}

export default function EmergencyContactCard({ patient, editedPatient, setEditedPatient }: Props) {
  if (!(patient.emergencyContactName || patient.emergencyContactPhone)) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Emergency Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <User className="h-5 w-5 text-gray-400" />
          <div className="w-full">
            <Input
              value={editedPatient.emergencyContactName ?? ''}
              onChange={(e) => setEditedPatient(prev => ({ ...prev, emergencyContactName: e.target.value }))}
              className="w-full p-1 rounded border text-sm mb-1"
              placeholder="Contact name"
            />
            <Input
              value={editedPatient.emergencyContactPhone ?? ''}
              onChange={(e) => setEditedPatient(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
              className="w-full p-1 rounded border text-sm"
              placeholder="Contact phone"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
