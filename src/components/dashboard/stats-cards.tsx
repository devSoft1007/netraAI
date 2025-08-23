import { Calendar, Users, Brain, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  stats?: {
    todayAppointments: number;
    totalPatients: number;
    aiDiagnoses: number;
    monthlyRevenue: number;
  };
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="medical-card">
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: "medical-blue",
      trend: "+8%",
      trendLabel: "from yesterday"
    },
    {
      title: "Total Patients",
      value: stats?.totalPatients || 0,
      icon: Users,
      color: "healthcare-green",
      trend: "+12",
      trendLabel: "new this week"
    },
    {
      title: "AI Diagnoses",
      value: stats?.aiDiagnoses || 0,
      icon: Brain,
      color: "diagnostic-purple",
      trend: "94%",
      trendLabel: "accuracy rate"
    },
    {
      title: "Revenue",
      value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "healthcare-green",
      trend: "+15%",
      trendLabel: "from last month"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="medical-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-semibold text-professional-dark mt-1">{card.value}</p>
            </div>
            <div className={`w-12 h-12 bg-${card.color}/10 rounded-lg flex items-center justify-center`}>
              <card.icon className={`text-${card.color} text-lg`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-healthcare-green font-medium">{card.trend}</span>
            <span className="text-gray-500 ml-1">{card.trendLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
