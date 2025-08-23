import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import TodaysSchedule from "@/components/dashboard/todays-schedule";
import AiDiagnosisSection from "@/components/dashboard/ai-diagnosis-section";
import PatientSearch from "@/components/dashboard/patient-search";
import PendingTasks from "@/components/dashboard/pending-tasks";
import QuickActions from "@/components/dashboard/quick-actions";

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  aiDiagnoses: number;
  monthlyRevenue: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-professional-dark">Dashboard Overview</h2>
            <p className="text-gray-600 mt-1">Welcome back, Dr. Rodriguez. Here's your clinic overview for today.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="text-sm text-gray-500">
              Today: <span className="font-medium">{new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </span>
          </div>
        </div>

        <StatsCards stats={stats} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TodaysSchedule />
          <AiDiagnosisSection />
        </div>

        <div className="space-y-8">
          <PatientSearch />
          <PendingTasks />
          <QuickActions />
        </div>
      </div>
    </main>
  );
}
