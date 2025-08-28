// React import not needed in newer JSX runtimes
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Stethoscope, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import type { Appointment, Procedure, Payment } from '@shared/schema'

interface Props {
  activeTab: string
  setActiveTab: (v: string) => void
  appointments?: Appointment[]
  procedures?: Procedure[]
  payments?: Payment[]
  getStatusColor: (status: string) => string
  toSafeDate: (v: any) => Date | null
}

export default function PatientTabs({ activeTab, setActiveTab, appointments, procedures, payments, getStatusColor, toSafeDate }: Props) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="medical-history">Medical History</TabsTrigger>
        <TabsTrigger value="appointments">Appointments</TabsTrigger>
        <TabsTrigger value="procedures">Procedures</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>

      <TabsContent value="medical-history" className="mt-6">
        {/* original medical-history content is small and left in parent to avoid large prop passing */}
        <div className="text-sm text-gray-600">Use the parent to render medical history card</div>
      </TabsContent>

      <TabsContent value="appointments" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appointment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments && appointments.length > 0 ? (
                appointments.map((appointment: Appointment) => (
                  <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-professional-dark">{appointment.procedure}</p>
                        <p className="text-sm text-gray-600">Dr. {appointment.doctorName}</p>
                        <p className="text-sm text-gray-500">
                          {(() => {
                            const ad = toSafeDate(appointment.appointmentDate);
                            return `${ad ? format(ad, 'MMM dd, yyyy') : 'Unknown date'}${appointment.appointmentTime ? ` at ${appointment.appointmentTime}` : ''}`;
                          })()}
                        </p>
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments recorded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="procedures" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Procedure History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {procedures && procedures.length > 0 ? (
                procedures.map((procedure: Procedure) => (
                  <div key={procedure.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-professional-dark">{procedure.procedureName}</h4>
                      <Badge className={getStatusColor(procedure.status)}>
                        {procedure.status.charAt(0).toUpperCase() + procedure.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Dr. {procedure.doctorName}</p>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        const pd = toSafeDate(procedure.performedDate);
                        return pd ? format(pd, 'MMM dd, yyyy') : 'Unknown date';
                      })()}
                      {procedure.duration && ` • ${procedure.duration} minutes`}
                      {procedure.cost && ` • $${procedure.cost}`}
                    </p>
                    {procedure.description && (
                      <p className="text-sm text-gray-600 mt-2">{procedure.description}</p>
                    )}
                    {procedure.notes && (
                      <p className="text-sm text-gray-500 mt-1">Notes: {procedure.notes}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No procedures recorded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments && payments.length > 0 ? (
                payments.map((payment: Payment) => (
                  <div key={payment.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-professional-dark">
                          Invoice: {payment.invoiceNumber || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Amount: ${Number(payment.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Method: {payment.paymentMethod}
                          {payment.paymentDate && (() => {
                            const pdate = toSafeDate(payment.paymentDate);
                            return pdate ? ` • Paid: ${format(pdate, 'MMM dd, yyyy')}` : '';
                          })()}
                          {payment.dueDate && (() => {
                            const ddate = toSafeDate(payment.dueDate);
                            return ddate ? ` • Due: ${format(ddate, 'MMM dd, yyyy')}` : '';
                          })()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(payment.paymentStatus)}>
                        {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    {payment.insuranceClaim && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
                        <div className="flex justify-between">
                          <span>Insurance Amount:</span>
                          <span>${payment.insuranceAmount || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Patient Amount:</span>
                          <span>${payment.patientAmount || '0.00'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No billing records found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
