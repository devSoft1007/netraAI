import { UserPlus, CalendarPlus, Brain, FileText } from "lucide-react";
import { Link } from "wouter";

export default function QuickActions() {
  const actions = [
    {
      icon: UserPlus,
      label: "New Patient",
      href: "/patients",
      color: "medical-blue",
    },
    {
      icon: CalendarPlus,
      label: "Book Appointment",
      href: "/appointments",
      color: "healthcare-green",
    },
    {
      icon: Brain,
      label: "AI Analysis",
      href: "/ai-diagnosis",
      color: "diagnostic-purple",
    },
    {
      icon: FileText,
      label: "Generate Invoice",
      href: "/billing",
      color: "alert-orange",
    },
  ];

  return (
    <div className="medical-card">
      <h3 className="text-lg font-semibold text-professional-dark mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <button className={`flex flex-col items-center justify-center p-4 bg-${action.color}/5 hover:bg-${action.color}/10 rounded-lg transition-colors w-full`}>
              <action.icon className={`text-${action.color} text-xl mb-2`} />
              <span className={`text-sm font-medium text-${action.color}`}>{action.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
