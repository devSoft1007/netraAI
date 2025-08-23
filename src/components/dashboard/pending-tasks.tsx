import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Task } from "@shared/schema";

export default function PendingTasks() {
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks', { assignedTo: 'Dr. Rodriguez' }],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const pendingTasks = tasks?.filter((task: Task) => task.status === 'pending').slice(0, 5);

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    updateTaskMutation.mutate({
      taskId,
      status: checked ? 'completed' : 'pending',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-alert-orange';
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="medical-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-professional-dark">Pending Tasks</h3>
        <span className="bg-alert-orange/10 text-alert-orange text-xs px-2 py-1 rounded-full">
          {pendingTasks?.length || 0}
        </span>
      </div>
      
      <div className="space-y-3">
        {pendingTasks?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending tasks
          </div>
        ) : (
          pendingTasks?.map((task: Task) => (
            <div key={task.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                className="mt-1"
                checked={task.status === 'completed'}
                onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-professional-dark">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  {task.dueDate && (
                    <p className="text-xs text-gray-500">
                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                  <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="w-full mt-4 text-center text-medical-blue text-sm font-medium hover:text-blue-700">
        View All Tasks
      </button>
    </div>
  );
}
