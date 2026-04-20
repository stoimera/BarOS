"use client";

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Task } from "@/types/task"
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar";

import { TaskStatus, TaskPriority } from "@/types/task";
import { Button } from "@/components/ui/button"
import { PlusCircleIcon } from "lucide-react"
import { FormModal } from "@/components/shared/FormModal"
import { FormField } from "@/components/shared/FormField"
import { formatDateForInput, formatTimeForInput } from '@/utils/dateUtils'
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { api } from '@/lib/api/client';
import { 
  PageHeaderSkeleton,
  ChartSkeleton
} from "@/components/ui/loading-states";

const EVENT_TYPES = ["booking", "bar_event", "other"];
const TASK_STATUS: TaskStatus[] = ["todo", "in_progress", "done"];
const TASK_PRIORITY: TaskPriority[] = ["low", "medium", "high"];

async function fetchEvents() {
  try {
    console.log('Calendar: Fetching events from API...');
    const res = await api.get<{ events: any[] }>("/api/events");
    console.log('Calendar: API response:', res);
    console.log('Calendar: API data:', res.data);
    const events = res.data.events || [];
    console.log('Calendar: Extracted events:', events);
    return events;
  } catch (error) {
    console.error('Calendar: Error fetching events:', error);
    return [];
  }
}
async function addEventApi(event: Partial<any>) {
  // Transform the event data to match API expectations
  const eventData = {
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time ? `${event.time} - ${event.time}` : null, // Format time for API
    location: event.location || null,
    capacity: event.capacity || null,
    price: event.price || null
  };
  console.log('Calendar: Sending event data to API:', eventData);
  const res = await api.post<any>("/api/events", eventData);
  return res.data;
}
async function updateEventApi(id: string, updates: Partial<any>) {
  // Transform the event data to match API expectations
  const eventData = {
    id,
    title: updates.title,
    description: updates.description,
    date: updates.date,
    time: updates.time ? `${updates.time} - ${updates.time}` : null, // Format time for API
    location: updates.location || null,
    capacity: updates.capacity || null,
    price: updates.price || null
  };
  console.log('Calendar: Sending update data to API:', eventData);
  const res = await api.put<any>("/api/events", eventData);
  return res.data;
}
async function deleteEventApi(id: string) {
  const res = await api.delete<any>("/api/events", { params: { id } });
  return res.data;
}
async function fetchTasks() {
  const res = await api.get<{ tasks: Task[] }>("/api/tasks");
  return res.data.tasks || [];
}
async function addTaskApi(task: Partial<Task>) {
  const res = await api.post<Task>("/api/tasks", task);
  return res.data;
}
async function updateTaskApi(id: string, updates: Partial<Task>) {
  const res = await api.put<Task>("/api/tasks", { id, ...updates });
  return res.data;
}
async function deleteTaskApi(id: string) {
  const res = await api.delete<any>("/api/tasks", { params: { id } });
  return res.data;
}

function CalendarContent() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventForm, setEventForm] = useState<Partial<any>>({ type: "bar_event", title: "" });
  const [eventSaving, setEventSaving] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<Partial<Task>>({ status: "todo", priority: "medium", tags: [], assigned_to: null });
  const [taskSaving, setTaskSaving] = useState(false);

      // Check if user is staff/admin (not customer)
    const isStaffOrAdmin = user && user.role !== 'customer';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchEvents(),
      fetchTasks()
    ]).then(([ev, ta]) => {
      console.log('Calendar: Events received:', ev);
      console.log('Calendar: Tasks received:', ta);
      setEvents(ev);
      setTasks(ta);
    }).catch((error) => {
      console.error('Calendar: Error fetching data:', error);
      setEvents([]);
      setTasks([]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading && events.length === 0 && tasks.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <PageHeaderSkeleton />
        <ChartSkeleton height={600} />
      </div>
    );
  }

  // Transform events and tasks into FullScreenCalendar data format
  const calendarData = (() => {
    const map = new Map<string, { day: Date; events: { id: number; name: string; time: string; datetime: string; type: string; isTask?: boolean }[] }>();
    let eventCounter = 1;
    
    // Ensure events is an array and handle each event
    if (Array.isArray(events)) {
      events.forEach(e => {
        if (e && e.date) {
          const key = e.date;
          if (!map.has(key)) map.set(key, { day: new Date(e.date), events: [] });
          
          // Format time for display - use the time field from API or format from start_time/end_time
          let displayTime = '';
          if (e.time) {
            displayTime = e.time;
          } else if (e.start_time) {
            displayTime = e.start_time;
            if (e.end_time) {
              displayTime += ` - ${e.end_time}`;
            }
          }
          
          map.get(key)!.events.push({
            id: eventCounter++,
            name: e.title || 'Untitled Event',
            time: displayTime,
            datetime: e.datetime || e.date,
            type: e.type || 'bar_event'
          });
        }
      });
    }
    
    // Ensure tasks is an array and handle each task
    if (Array.isArray(tasks)) {
      console.log('Calendar: Processing tasks:', tasks);
      tasks.forEach(t => {
        if (t && t.due_date) {
          const key = t.due_date;
          if (!map.has(key)) map.set(key, { day: new Date(t.due_date), events: [] });
          
          // Format time for display
          let displayTime = '';
          if (t.time) {
            displayTime = t.time;
          }
          
          map.get(key)!.events.push({
            id: eventCounter++,
            name: t.title || 'Untitled Task',
            time: displayTime,
            datetime: t.due_date,
            type: 'task',
            isTask: true
          });
        }
      });
    }
    
    return Array.from(map.values());
  })();

  function openAddEvent() {
    setEditingEvent(null);
    setEventForm({ type: "bar_event", title: "" });
    setEventDialogOpen(true);
  }
  function closeEventDialog() {
    setEventDialogOpen(false);
    setEditingEvent(null);
    setEventForm({ type: "bar_event", title: "" });
  }
  async function handleEventSave() {
    setEventSaving(true);
    try {
      console.log('Calendar: Event form data:', eventForm);
      
      // Validate required fields
      if (!eventForm.title?.trim()) {
        alert('Event title is required');
        return;
      }
      if (!eventForm.date) {
        alert('Event date is required');
        return;
      }
      if (!eventForm.time) {
        alert('Event time is required');
        return;
      }
      
      if (editingEvent) {
        await updateEventApi(editingEvent.id, eventForm);
      } else {
        await addEventApi(eventForm as any);
      }
      setEventDialogOpen(false);
      setEditingEvent(null);
      setEventForm({ type: "bar_event", title: "" });
      // Refresh events and tasks
      setLoading(true);
      Promise.all([
        fetchEvents(),
        fetchTasks()
      ]).then(([ev, ta]) => {
        setEvents(ev);
        setTasks(ta);
      }).finally(() => setLoading(false));
    } catch (error) {
      console.error('Calendar: Error saving event:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      alert(`Failed to save event: ${errorMessage}`);
    } finally {
      setEventSaving(false);
    }
  }
  async function handleEventDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    await deleteEventApi(id);
    setLoading(true);
    Promise.all([
      fetchEvents(),
      fetchTasks()
    ]).then(([ev, ta]) => {
      setEvents(ev);
      setTasks(ta);
    }).finally(() => setLoading(false));
  }

  function openAddTask() {
    setEditingTask(null);
    setTaskForm({ status: "todo", priority: "medium", tags: [], assigned_to: null });
    setTaskDialogOpen(true);
  }
  function closeTaskDialog() {
    setTaskDialogOpen(false);
    setEditingTask(null);
    setTaskForm({ status: "todo", priority: "medium", tags: [], assigned_to: null });
  }
  async function handleTaskSave() {
    setTaskSaving(true);
    try {
      if (editingTask) {
        await updateTaskApi(editingTask.id, taskForm);
      } else {
        await addTaskApi(taskForm as Omit<Task, "id" | "created_at" | "updated_at">);
      }
      setTaskDialogOpen(false);
      setEditingTask(null);
      setTaskForm({ status: "todo", priority: "medium", tags: [], assigned_to: null });
      // Refresh events and tasks
      setLoading(true);
      Promise.all([
        fetchEvents(),
        fetchTasks()
      ]).then(([ev, ta]) => {
        setEvents(ev);
        setTasks(ta);
      }).finally(() => setLoading(false));
    } finally {
      setTaskSaving(false);
    }
  }
  async function handleTaskDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    await deleteTaskApi(id);
    setLoading(true);
    Promise.all([
      fetchEvents(),
      fetchTasks()
    ]).then(([ev, ta]) => {
      setEvents(ev);
      setTasks(ta);
    }).finally(() => setLoading(false));
  }

  const handleEventFormChange = (field: string, value: string) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskFormChange = (field: string, value: string) => {
    setTaskForm(prev => ({ ...prev, [field]: value }));
  };

  const eventTypeOptions = EVENT_TYPES.map(t => ({ value: t, label: t.replace("_", " ") }));

  const taskStatusOptions = TASK_STATUS.map(s => ({ value: s, label: s.replace("_", " ") }));

  const taskPriorityOptions = TASK_PRIORITY.map(p => ({ value: p, label: p }));

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Calendar</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isStaffOrAdmin && (
            <>
              <Button variant="outline" className="flex gap-2 w-full sm:w-auto" onClick={openAddEvent} aria-label="Add New Event"><PlusCircleIcon className="w-4 h-4" /> New Event</Button>
              <Button variant="outline" className="flex gap-2 w-full sm:w-auto" onClick={openAddTask} aria-label="Add New Task"><PlusCircleIcon className="w-4 h-4" /> New Task</Button>
            </>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <FullScreenCalendar data={calendarData} />
      )}
      {isStaffOrAdmin && (
        <FormModal
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
          title={editingEvent ? "Edit Event" : "Add Event"}
          onSubmit={handleEventSave}
          onCancel={closeEventDialog}
          loading={eventSaving}
          submitText={eventSaving ? "Saving..." : "Save"}
          maxWidth="max-w-md"
        >
          <FormField
            label="Title"
            value={eventForm.title || ""}
            onChange={(value) => handleEventFormChange("title", value)}
            placeholder="Event title"
            required
          />
          <FormField
            label="Description"
            value={eventForm.description || ""}
            onChange={(value) => handleEventFormChange("description", value)}
            placeholder="Event description"
            type="textarea"
          />
          <FormField
            label="Date"
            value={formatDateForInput(eventForm.date ?? '')}
            onChange={(value) => handleEventFormChange("date", value)}
            type="date"
            required
          />
          <FormField
            label="Time"
            value={formatTimeForInput(eventForm.time ?? '')}
            onChange={(value) => handleEventFormChange("time", value)}
            type="time"
            required
          />
          <FormField
            label="Type"
            value={eventForm.type || "bar_event"}
            onChange={(value) => handleEventFormChange("type", value)}
            type="select"
            options={eventTypeOptions}
          />
          {editingEvent && (
            <div className="flex justify-start pt-2">
              <Button 
                variant="destructive" 
                onClick={() => handleEventDelete(editingEvent.id)}
                disabled={eventSaving}
              >
                Delete Event
              </Button>
            </div>
          )}
        </FormModal>
      )}
      {isStaffOrAdmin && (
        <FormModal
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          title={editingTask ? "Edit Task" : "Add Task"}
          onSubmit={handleTaskSave}
          onCancel={closeTaskDialog}
          loading={taskSaving}
          submitText={taskSaving ? "Saving..." : "Save"}
          maxWidth="max-w-md"
        >
          <FormField
            label="Title"
            value={taskForm.title || ""}
            onChange={(value) => handleTaskFormChange("title", value)}
            placeholder="Task title"
            required
          />
          <FormField
            label="Notes"
            value={taskForm.description || ""}
            onChange={(value) => handleTaskFormChange("description", value)}
            placeholder="Task notes"
            type="textarea"
          />
          <FormField
            label="Due Date"
            value={formatDateForInput(taskForm.due_date ?? '')}
            onChange={(value) => handleTaskFormChange("due_date", value)}
            type="date"
            required
          />
          <FormField
            label="Time"
            value={formatTimeForInput(taskForm.time ?? '')}
            onChange={(value) => handleTaskFormChange("time", value)}
            type="time"
            placeholder="Time (optional)"
          />
          <FormField
            label="Status"
            value={taskForm.status || "todo"}
            onChange={(value) => handleTaskFormChange("status", value)}
            type="select"
            options={taskStatusOptions}
          />
          <FormField
            label="Priority"
            value={taskForm.priority || "medium"}
            onChange={(value) => handleTaskFormChange("priority", value)}
            type="select"
            options={taskPriorityOptions}
          />
          <FormField
            label="Tags"
            value={taskForm.tags?.join(", ") || ""}
            onChange={(value) => handleTaskFormChange("tags", value)}
            placeholder="Tags (comma separated)"
          />
          {editingTask && (
            <div className="flex justify-start pt-2">
              <Button 
                variant="destructive" 
                onClick={() => handleTaskDelete(editingTask.id)}
                disabled={taskSaving}
              >
                Delete Task
              </Button>
            </div>
          )}
        </FormModal>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="max-w-6xl mx-auto p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Calendar</h1>
          </div>
          <div className="text-center py-10">
            <h2 className="text-lg font-semibold mb-2">Calendar Error</h2>
            <p className="text-muted-foreground mb-4">There was an error loading the calendar. Please refresh the page or try again later.</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <CalendarContent />
    </ErrorBoundary>
  );
} 