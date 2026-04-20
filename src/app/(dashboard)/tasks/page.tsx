"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { getStaffMembers } from "@/lib/staff";
import { 
  Task, 
  TaskStatus,
  TaskPriority,
  TaskCategory
} from "@/types/task"
import { StaffMember } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  PlusCircleIcon, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Package,
  Users,
  Calendar,
  Wrench,
  Headphones,
  Settings,
  User,
  CalendarDays,
  TrendingUp,
  Search as SearchIcon
} from "lucide-react";
import { FormModal } from "@/components/shared/FormModal";
import { FormField } from "@/components/shared/FormField";
import { formatDateGB, isOverdue, isDueSoon } from '@/utils/dateUtils'
import { containerBg, border } from "@/styles/theme";
import { toast } from "sonner";
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  CardGridSkeleton
} from "@/components/ui/loading-states";

const STATUS: TaskStatus[] = ["todo", "in_progress", "done"];
const PRIORITY: TaskPriority[] = ["low", "medium", "high", "critical"];
const CATEGORIES: TaskCategory[] = ["inventory", "staff", "events", "maintenance", "customer_service", "general"];

const CATEGORY_ICONS = {
  inventory: Package,
  staff: Users,
  events: Calendar,
  maintenance: Wrench,
  customer_service: Headphones,
  general: Settings
};

const CATEGORY_NAMES = {
  inventory: "Inventory",
  staff: "Staff",
  events: "Events",
  maintenance: "Maintenance",
  customer_service: "Customer Service",
  general: "General"
};

const PRIORITY_COLORS = {
  critical: "bg-destructive/10 text-destructive border-border",
  high: "bg-muted text-foreground border-border",
  medium: "bg-muted text-foreground border-border",
  low: "bg-muted text-foreground border-border"
};

const STATUS_COLORS = {
  todo: "bg-muted text-foreground border-border",
  in_progress: "bg-muted text-foreground border-border",
  done: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
};

export default function TasksPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterCategory, setFilterCategory] = useState<TaskCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<Partial<Task>>({ 
    status: "todo", 
    priority: "medium", 
    category: "general",
    tags: [],
    assigned_to: null
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Use React Query hook for tasks
  const {
    tasks,
    isLoading: loading,
    createTask,
    updateTask,
    deleteTask,
    isCreating: saving,
    isUpdating: _updating,
    isDeleting: _deleting
  } = useTasks({
    status: filterStatus === "all" ? undefined : filterStatus,
    priority: filterPriority === "all" ? undefined : filterPriority,
    category: filterCategory === "all" ? undefined : filterCategory,
    search: search || undefined
  });

  void _updating;
  void _deleting;

  const handleFormChange = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const statusOptions = useMemo(() => 
    STATUS.map(s => ({ value: s, label: s.replace("_", " ") })), 
    []
  );

  const priorityOptions = useMemo(() => 
    PRIORITY.map(p => ({ value: p, label: p })), 
    []
  );

  const categoryOptions = useMemo(() => 
    CATEGORIES.map(c => ({ value: c, label: CATEGORY_NAMES[c] })), 
    []
  );

  const staffOptions = useMemo(() => 
    staffMembers.map(s => ({ 
      value: s.id, 
      label: s.name || 'Unknown Staff Member' 
    })), 
    [staffMembers]
  );

  // Load staff members
  useEffect(() => {
    async function loadStaff() {
      try {
        const staffData = await getStaffMembers();
        setStaffMembers(staffData);
      } catch (error) {
        console.error('Error loading staff:', error);
      }
    }
    loadStaff();
  }, []);

  // Filter tasks by search and category (client-side filtering for additional filters)
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Note: Basic filtering is now handled by the API, but we can add client-side filtering here if needed
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(task => task.category === filterCategory);
    }

    return filtered;
  }, [tasks, search, filterCategory]);

  // Calculate progress
  const progress = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [tasks]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups = {
      todo: filteredTasks.filter(t => t.status === 'todo'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      done: filteredTasks.filter(t => t.status === 'done')
    };
    return groups;
  }, [filteredTasks]);

  function openAdd() {
    setEditing(null);
    setForm({ status: "todo", priority: "medium", category: "general", tags: [], assigned_to: null });
    setDialogOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setForm(task);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm({ status: "todo", priority: "medium", category: "general", tags: [], assigned_to: null });
  }

  async function handleSave() {
    try {
      // Validate required fields
      if (!form.title?.trim()) {
        toast.error('Title is required');
        return;
      }
      if (!form.due_date) {
        toast.error('Due date is required');
        return;
      }

      if (editing) {
        await updateTask({ id: editing.id, data: form });
      } else {
        // Prepare task data with proper type handling
        const taskData: Omit<Task, "id" | "created_at" | "updated_at"> = {
          title: form.title!,
          description: form.description || '',
          due_date: form.due_date!,
          time: form.time || undefined,
          status: form.status || 'todo',
          priority: form.priority || 'medium',
          category: form.category || 'general',
          assigned_to: form.assigned_to || undefined, // Convert null to undefined
          tags: form.tags || [],
          created_by: '', // This will be set by the API
          related_event_id: form.related_event_id || undefined
        };
        
        await createTask(taskData);
      }
      setDialogOpen(false);
      setEditing(null);
      setForm({ status: "todo", priority: "medium", category: "general", tags: [], assigned_to: null });
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }

  const openDeleteModal = (task: Task) => {
    setItemToDelete(task);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setDeleteModalOpen(false);
  };

  async function handleDelete() {
    if (!itemToDelete) return;

    setIsDeletingTask(true);
    try {
      await deleteTask(itemToDelete.id);
      closeDeleteModal();
    } catch (error) {
      console.error('Delete error in component:', error);
    } finally {
      setIsDeletingTask(false);
    }
  }

  async function quickUpdateStatus(taskId: string, newStatus: TaskStatus) {
    try {
      await updateTask({ id: taskId, data: { status: newStatus } });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  }

  function getUrgencyColor(task: Task) {
    if (isOverdue(task.due_date)) return "border-destructive bg-destructive/10";
    if (isDueSoon(task.due_date)) return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
    return "";
  }

  function getAssignedStaffName(task: Task) {
    if (!task.assigned_to) return null;
    const staff = staffMembers.find(s => s.id === task.assigned_to);
    return staff?.name || "Unknown";
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={3} />
        <CardGridSkeleton count={6} columns={3} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your bar operations and staff tasks</p>
        </div>
        <Button onClick={openAdd} className="flex gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white" aria-label="Add New Task">
          <PlusCircleIcon className="w-4 h-4" /> New Task
        </Button>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Task Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-medium">{progress}% Complete</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <span>To Do: {groupedTasks.todo.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>In Progress: {groupedTasks.in_progress.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 dark:bg-green-500 rounded-full"></div>
              <span>Completed: {groupedTasks.done.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 w-full mb-6">
        <div className={`flex flex-col sm:flex-row gap-2 w-full ${containerBg} ${border} rounded-md p-3 items-center`}>
          <div className="w-full sm:w-40">
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as TaskStatus | "all") }>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select value={filterPriority} onValueChange={v => setFilterPriority(v as TaskPriority | "all") }>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select value={filterCategory} onValueChange={v => setFilterCategory(v as TaskCategory | "all") }>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_NAMES[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-64 relative">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10"
              aria-label="Search tasks"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className={`grid w-full grid-cols-4 mb-6 ${containerBg} ${border} rounded-md`}>
          <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="todo">To Do ({groupedTasks.todo.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({groupedTasks.in_progress.length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({groupedTasks.done.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {filteredTasks.map((task) => (
               <TaskCard 
                 key={task.id} 
                 task={task} 
                 onEdit={openEdit}
                 onDelete={openDeleteModal}
                 onStatusUpdate={quickUpdateStatus}
                 assignedStaffName={getAssignedStaffName(task)}
                 urgencyColor={getUrgencyColor(task)}
               />
             ))}
          </div>
        </TabsContent>

        <TabsContent value="todo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {groupedTasks.todo.map((task) => (
               <TaskCard 
                 key={task.id} 
                 task={task} 
                 onEdit={openEdit}
                 onDelete={openDeleteModal}
                 onStatusUpdate={quickUpdateStatus}
                 assignedStaffName={getAssignedStaffName(task)}
                 urgencyColor={getUrgencyColor(task)}
               />
             ))}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {groupedTasks.in_progress.map((task) => (
               <TaskCard 
                 key={task.id} 
                 task={task} 
                 onEdit={openEdit}
                 onDelete={openDeleteModal}
                 onStatusUpdate={quickUpdateStatus}
                 assignedStaffName={getAssignedStaffName(task)}
                 urgencyColor={getUrgencyColor(task)}
               />
             ))}
          </div>
        </TabsContent>

        <TabsContent value="done" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {groupedTasks.done.map((task) => (
               <TaskCard 
                 key={task.id} 
                 task={task} 
                 onEdit={openEdit}
                 onDelete={openDeleteModal}
                 onStatusUpdate={quickUpdateStatus}
                 assignedStaffName={getAssignedStaffName(task)}
                 urgencyColor={getUrgencyColor(task)}
               />
             ))}
          </div>
        </TabsContent>
      </Tabs>

      <FormModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Task" : "Add Task"}
        onSubmit={handleSave}
        onCancel={closeDialog}
        loading={saving}
        submitText={saving ? "Saving..." : "Save"}
        maxWidth="max-w-md"
      >
        <FormField
          label="Title"
          value={form.title || ""}
          onChange={(value) => handleFormChange("title", value)}
          placeholder="Task title"
          required
        />
        <FormField
          label="Notes"
          value={form.description || ""}
          onChange={(value) => handleFormChange("description", value)}
          placeholder="Task notes"
          type="textarea"
        />
        <FormField
          label="Category"
          value={form.category || "general"}
          onChange={(value) => handleFormChange("category", value)}
          type="select"
          options={categoryOptions}
        />
        <FormField
          label="Due Date"
          value={form.due_date || ""}
          onChange={(value) => handleFormChange("due_date", value)}
          type="date"
          required
        />
        <FormField
          label="Time"
          value={form.time || ""}
          onChange={(value) => handleFormChange("time", value)}
          type="time"
          placeholder="Time (optional)"
        />
        <FormField
          label="Priority"
          value={form.priority || "medium"}
          onChange={(value) => handleFormChange("priority", value)}
          type="select"
          options={priorityOptions}
        />
        <FormField
          label="Status"
          value={form.status || "todo"}
          onChange={(value) => handleFormChange("status", value)}
          type="select"
          options={statusOptions}
        />
        <FormField
          label="Assign To"
          value={form.assigned_to || "unassigned"}
          onChange={(value) => handleFormChange("assigned_to", value === "unassigned" ? null : value)}
          type="select"
          options={
            staffOptions.length === 0
              ? [{ value: "no_staff", label: "No staff available" }]
              : [{ value: "unassigned", label: "Unassigned" }, ...staffOptions]
          }
          disabled={staffOptions.length === 0}
        />
        <FormField
          label="Tags"
          value={form.tags?.join(", ") || ""}
          onChange={(value) => {
            // Convert comma-separated string to array
            const tagsArray = value ? value.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
            handleFormChange("tags", tagsArray);
          }}
          placeholder="Tags (comma separated)"
                 />
       </FormModal>

       {/* Delete Confirmation Dialog */}
       <Dialog open={deleteModalOpen} onOpenChange={closeDeleteModal}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                 <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
               </div>
               <div>
                 <DialogTitle className="text-lg font-semibold">
                   Delete Task
                 </DialogTitle>
                 <DialogDescription className="text-sm text-muted-foreground">
                   This action cannot be undone.
                 </DialogDescription>
               </div>
             </div>
           </DialogHeader>

           {itemToDelete && (
             <div className="space-y-4">
               <div className="rounded-lg border bg-muted/50 p-4">
                 <div className="flex items-center gap-3">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                     {(() => {
                       const CategoryIcon = CATEGORY_ICONS[itemToDelete.category];
                       return <CategoryIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
                     })()}
                   </div>
                   <div>
                     <h4 className="font-medium text-foreground">{itemToDelete.title}</h4>
                     <p className="text-sm text-muted-foreground">
                       {CATEGORY_NAMES[itemToDelete.category]} • {itemToDelete.priority} priority
                       {itemToDelete.due_date && ` • Due ${formatDateGB(itemToDelete.due_date)}`}
                     </p>
                   </div>
                 </div>
               </div>

               <div className="rounded-lg bg-muted border border-border p-3">
                 <div className="flex items-start gap-2">
                   <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                   <div className="text-sm">
                     <p className="font-medium text-amber-800 dark:text-amber-200">
                       Warning
                     </p>
                     <p className="text-amber-700 dark:text-amber-300 mt-1">
                       Deleting this task will remove it from your task management system. This action cannot be undone.
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           )}

           <DialogFooter className="gap-2 sm:gap-0">
             <Button
               variant="outline"
               onClick={closeDeleteModal}
               disabled={isDeletingTask}
               className="flex-1 sm:flex-none"
             >
               Cancel
             </Button>
             <Button
               variant="destructive"
               onClick={handleDelete}
               disabled={isDeletingTask}
               className="flex-1 sm:flex-none"
             >
               {isDeletingTask ? (
                 <>
                   <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                   Deleting...
                 </>
               ) : (
                 <>
                   <Trash2 className="mr-2 h-4 w-4" />
                   Delete Task
                 </>
               )}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }

// Task Card Component
function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusUpdate, 
  assignedStaffName, 
  urgencyColor 
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusUpdate: (id: string, status: TaskStatus) => void;
  assignedStaffName: string | null;
  urgencyColor: string;
}) {
  const CategoryIcon = CATEGORY_ICONS[task.category];
  const isOverdueTask = isOverdue(task.due_date);
  const isDueSoonTask = isDueSoon(task.due_date);

  return (
    <Card className={`hover:shadow-md transition-shadow ${urgencyColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {CATEGORY_NAMES[task.category]}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onEdit(task)}
              aria-label="Edit Task"
            >
              <Edit className="h-3 w-3" />
            </Button>
                         <Button 
               size="sm" 
               variant="ghost" 
               onClick={() => onDelete(task)}
               aria-label="Delete Task"
             >
               <Trash2 className="h-3 w-3" />
             </Button>
          </div>
        </div>
        <CardTitle className="text-base">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span className={isOverdueTask ? "text-red-600 dark:text-red-400 font-medium" : isDueSoonTask ? "text-yellow-600 dark:text-yellow-400 font-medium" : ""}>
              {formatDateGB(task.due_date)}
              {task.time && ` at ${task.time}`}
            </span>
            {isOverdueTask && <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400" />}
            {isDueSoonTask && <Clock className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />}
          </div>
          
          {assignedStaffName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              <span>{assignedStaffName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <Badge className={`${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </Badge>
          <Badge className={`${STATUS_COLORS[task.status]}`}>
            {task.status.replace("_", " ")}
          </Badge>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {task.status !== 'done' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onStatusUpdate(task.id, 'done')}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Button>
          )}
          {task.status === 'todo' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onStatusUpdate(task.id, 'in_progress')}
            >
              Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 