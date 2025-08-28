import React from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { Patient } from '@shared/schema'

interface Props {
  patient: Patient
  editedPatient: Partial<Patient> & Record<string, any>
  setEditedPatient: React.Dispatch<React.SetStateAction<Partial<Patient> & Record<string, any>>>
  getInitials: (firstName: string, lastName: string) => string
  getAge: (dateOfBirth: any) => string | number
  toSafeDate: (value: any) => Date | null
}

export default function PatientBasicInfo({ patient, editedPatient, setEditedPatient, getInitials, getAge, toSafeDate }: Props) {
  return (
    <div className="md:col-span-2">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-medical-blue/10 rounded-full flex items-center justify-center">
          <span className="text-lg font-medium text-medical-blue">
            {getInitials(editedPatient.firstName || '', editedPatient.lastName || '')}
          </span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              value={editedPatient.firstName ?? ''}
              onChange={(e) => setEditedPatient(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full"
              placeholder="First name"
            />
            <Input
              value={editedPatient.lastName ?? ''}
              onChange={(e) => setEditedPatient(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full"
              placeholder="Last name"
            />
          </div>

          <p className="text-gray-600 mt-2">
            <div className="w-40 inline-block align-middle mr-3">
              {/* Gender select kept in parent to avoid extra props; render a placeholder area here if needed */}
            </div>
            {getAge(editedPatient.dateOfBirth ?? patient.dateOfBirth)} years old
          </p>

          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Mail className="h-4 w-4" />
              <Input
                value={editedPatient.email ?? ''}
                onChange={(e) => setEditedPatient(prev => ({ ...prev, email: e.target.value }))}
                className="w-56"
                placeholder="Email"
              />
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <Input
                value={editedPatient.phone ?? ''}
                onChange={(e) => setEditedPatient(prev => ({ ...prev, phone: e.target.value }))}
                className="w-40"
                placeholder="Phone"
              />
            </div>
          </div>
          <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <Input
              value={editedPatient.address ?? ''}
              onChange={(e) => setEditedPatient(prev => ({ ...prev, address: e.target.value }))}
              className="w-full"
              placeholder="Address"
            />
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <Badge className={(editedPatient.isActive ?? patient.isActive) ? 'medical-badge-normal' : 'bg-gray-100 text-gray-800'}>
              {(editedPatient.isActive ?? patient.isActive) ? 'Active Patient' : 'Inactive'}
            </Badge>
            <div className="flex items-center space-x-2">
              <Label className="text-xs text-gray-500">Active</Label>
              <Switch
                checked={!!(editedPatient.isActive ?? patient.isActive)}
                onCheckedChange={(val) => setEditedPatient(prev => ({ ...prev, isActive: !!val }))}
              />
            </div>
            <span className="text-xs text-gray-500">
              Member since {(() => {
                const ms = toSafeDate(editedPatient.memberSince ?? patient.memberSince);
                return ms ? ms.getFullYear() : 'N/A';
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
