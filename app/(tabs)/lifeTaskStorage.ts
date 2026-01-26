// Updated storage with repeat functionality

export type TimeOfDay = 'morning' | 'midday' | 'evening';

export interface LifeTask {
  id: string;
  emoji: string;
  name: string;
  timeWindow: string;
  timeOfDay: TimeOfDay;
  enabled: boolean;
  completed: boolean;
  isDefault: boolean;
  repeats?: number; // How many times per day (e.g., 3 for "drink water 3x")
  completedCount: number; // How many times completed today
}

let lifeTasksData: LifeTask[] = [
  // Morning tasks
  { id: 'shower', emoji: '🚿', name: 'Shower', timeWindow: '6–10 AM', timeOfDay: 'morning', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  { id: 'breakfast', emoji: '🍳', name: 'Breakfast', timeWindow: '7–10 AM', timeOfDay: 'morning', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  { id: 'meds-morning', emoji: '💊', name: 'Take meds', timeWindow: '7–11 AM', timeOfDay: 'morning', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  { id: 'water-morning', emoji: '💧', name: 'Drink water', timeWindow: '6–12 PM', timeOfDay: 'morning', enabled: false, completed: false, isDefault: true, repeats: 2, completedCount: 0 },
  
  // Midday tasks
  { id: 'lunch', emoji: '🍽', name: 'Eat lunch', timeWindow: '12–2 PM', timeOfDay: 'midday', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  { id: 'walk', emoji: '🚶', name: 'Take a walk', timeWindow: '12–5 PM', timeOfDay: 'midday', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  { id: 'water-midday', emoji: '💧', name: 'Drink water', timeWindow: '12–6 PM', timeOfDay: 'midday', enabled: false, completed: false, isDefault: true, repeats: 3, completedCount: 0 },
  { id: 'exercise', emoji: '🏃', name: 'Exercise', timeWindow: '3–7 PM', timeOfDay: 'midday', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  
  // Evening tasks
  { id: 'dinner', emoji: '🍽', name: 'Eat dinner', timeWindow: '6–8 PM', timeOfDay: 'evening', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  { id: 'plants', emoji: '💧', name: 'Water plants', timeWindow: '5–9 PM', timeOfDay: 'evening', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  { id: 'meds-evening', emoji: '💊', name: 'Take meds', timeWindow: '7–10 PM', timeOfDay: 'evening', enabled: false, completed: false, isDefault: true, completedCount: 0 },
  { id: 'wind-down', emoji: '😴', name: 'Wind down', timeWindow: '8–11 PM', timeOfDay: 'evening', enabled: false, completed: false, isDefault: true, completedCount: 0 },
];

let lastResetDate: string | null = null;

export const getLifeTasks = (): LifeTask[] => {
  checkAndResetDaily();
  return lifeTasksData;
};

export const updateLifeTasks = (tasks: LifeTask[]) => {
  lifeTasksData = tasks;
};

export const toggleLifeTaskEnabled = (id: string) => {
  lifeTasksData = lifeTasksData.map(task => 
    task.id === id ? { ...task, enabled: !task.enabled } : task
  );
};

export const toggleLifeTaskCompleted = (id: string) => {
  lifeTasksData = lifeTasksData.map(task => {
    if (task.id === id) {
      // If it's a repeating task
      if (task.repeats && task.repeats > 1) {
        const newCount = task.completedCount + 1;
        const isFullyCompleted = newCount >= task.repeats;
        return {
          ...task,
          completedCount: newCount,
          completed: isFullyCompleted,
        };
      } else {
        // Regular task - just toggle
        return { ...task, completed: !task.completed };
      }
    }
    return task;
  });
};

export const addLifeTask = (task: Omit<LifeTask, 'id' | 'completed' | 'completedCount'>) => {
  const newTask: LifeTask = {
    ...task,
    id: `custom-${Date.now()}`,
    completed: false,
    completedCount: 0,
  };
  lifeTasksData = [...lifeTasksData, newTask];
  return newTask;
};

export const updateLifeTask = (id: string, updates: Partial<LifeTask>) => {
  lifeTasksData = lifeTasksData.map(task =>
    task.id === id ? { ...task, ...updates } : task
  );
};

export const deleteLifeTask = (id: string) => {
  lifeTasksData = lifeTasksData.filter(task => task.id !== id);
};

export const resetDailyLifeTasks = () => {
  lifeTasksData = lifeTasksData.map(task => ({
    ...task,
    completed: false,
    completedCount: 0,
  }));
  lastResetDate = new Date().toDateString();
};

// Check if we need to reset tasks (new day)
const checkAndResetDaily = () => {
  const today = new Date().toDateString();
  if (lastResetDate !== today) {
    resetDailyLifeTasks();
  }
};