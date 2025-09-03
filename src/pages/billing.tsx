import { useState } from "react";
import { DollarSign, Plus, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import AddPaymentModal from "@/components/modals/add-payment-modal";
import type { Payment, Patient } from "@shared/schema";
import { usePayments } from '@/services/use-payments';

export default function Billing() {
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const { data: paymentsData, isLoading } = usePayments({ limit: 50 });
  const payments = paymentsData?.payments || [];

  const patients: any[] = []; // Replace with actual patient data fetching logic
  // const { data: patients } = useQuery<Patient[]>({
  //   queryKey: ['/api/patients'],
  // });

  const getPatientName = (patientId: string) => {
    const patient = patients?.find((p: Patient) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRevenue = payments?.filter((payment: Payment) => payment.paymentStatus === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

  const pendingPayments = payments?.filter((payment: Payment) => payment.paymentStatus === 'pending')
    .reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

  const overduePayments = payments?.filter((payment: Payment) => payment.paymentStatus === 'overdue')
    .reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading billing information...</div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <AddPaymentModal isOpen={isAddPaymentOpen} onClose={() => setIsAddPaymentOpen(false)} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-professional-dark">Billing & Payments</h1>
          <p className="text-gray-600 mt-1">Manage invoices, payments, and financial records</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
      <Button className="medical-button-primary" onClick={() => setIsAddPaymentOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-professional-dark">
                ${totalRevenue.toLocaleString()}
              </span>
              <div className="w-8 h-8 bg-healthcare-green/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-healthcare-green" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-professional-dark">
                ${pendingPayments.toLocaleString()}
              </span>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-professional-dark">
                ${overduePayments.toLocaleString()}
              </span>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Requires follow-up</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter by Status
        </Button>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments?.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payment records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments?.map((payment: Payment) => (
                <div key={payment.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-professional-dark">
                        {getPatientName(payment.patientId)}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        Invoice: {payment.invoiceNumber || 'N/A'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Method: {payment.paymentMethod}</span>
                        {payment.dueDate && (
                          <span>Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-professional-dark">
                        ${Number(payment.amount).toLocaleString()}
                      </p>
                      <Badge className={getStatusColor(payment.paymentStatus)}>
                        {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                      </Badge>
                      {payment.paymentDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          Paid: {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {payment.insuranceClaim && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Insurance Amount:</span>
                        <span>${payment.insuranceAmount || '0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Patient Amount:</span>
                        <span>${payment.patientAmount || '0'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
