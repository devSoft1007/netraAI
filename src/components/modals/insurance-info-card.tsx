import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Patient } from '@shared/schema'

interface Props {
  editedPatient: Partial<Patient> & Record<string, any>
  setEditedPatient: React.Dispatch<React.SetStateAction<Partial<Patient> & Record<string, any>>>
}

export default function InsuranceInfoCard({ editedPatient, setEditedPatient }: Props) {
  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Insurance Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-600">Provider</p>
              <Input
                value={editedPatient.insuranceProvider ?? ''}
                onChange={(e) => setEditedPatient(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                className="w-full p-1 rounded border text-sm"
                placeholder="Insurance provider"
              />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Policy Number</p>
              <Input
                value={editedPatient.insurancePolicyNumber ?? ''}
                onChange={(e) => setEditedPatient(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                className="w-full p-1 rounded border text-sm"
                placeholder="Policy number"
              />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Group Number</p>
              <Input
                value={editedPatient.insuranceGroupNumber ?? ''}
                onChange={(e) => setEditedPatient(prev => ({ ...prev, insuranceGroupNumber: e.target.value }))}
                className="w-full p-1 rounded border text-sm"
                placeholder="Group number"
              />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
