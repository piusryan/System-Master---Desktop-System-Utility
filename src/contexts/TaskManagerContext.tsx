import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface TaskState {
  [taskId: string]: {
    isRunning: boolean;
    progress: number;
    output: string;
    isOutputOpen: boolean;
  };
}

interface TaskManagerContextType {
  tasks: TaskState;
  startTask: (taskId: string) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  updateTaskOutput: (taskId: string, output: string, append?: boolean) => void;
  stopTask: (taskId: string) => void;
  toggleTaskOutput: (taskId: string) => void;
  clearTaskOutput: (taskId: string) => void;
  isTaskRunning: (taskId: string) => boolean;
  getTaskProgress: (taskId: string) => number;
  getTaskOutput: (taskId: string) => string;
  isTaskOutputOpen: (taskId: string) => boolean;
}

const TaskManagerContext = createContext<TaskManagerContextType | undefined>(undefined);

export const TaskManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskState>({});

  const startTask = useCallback((taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        isRunning: true,
        progress: 0,
        output: prev[taskId]?.output || '',
        isOutputOpen: true,
      },
    }));
  }, []);

  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isRunning: true,
        progress: Math.min(progress, 100),
      },
    }));
  }, []);

  const updateTaskOutput = useCallback((taskId: string, output: string, append = true) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        output: append ? (prev[taskId]?.output || '') + output : output,
      },
    }));
  }, []);

  const stopTask = useCallback((taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isRunning: false,
        progress: 100,
      },
    }));
  }, []);

  const toggleTaskOutput = useCallback((taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isOutputOpen: !prev[taskId]?.isOutputOpen,
        output: prev[taskId]?.output || '',
      },
    }));
  }, []);

  const clearTaskOutput = useCallback((taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        output: '',
      },
    }));
  }, []);

  const isTaskRunning = useCallback((taskId: string) => tasks[taskId]?.isRunning || false, [tasks]);
  const getTaskProgress = useCallback((taskId: string) => tasks[taskId]?.progress || 0, [tasks]);
  const getTaskOutput = useCallback((taskId: string) => tasks[taskId]?.output || '', [tasks]);
  const isTaskOutputOpen = useCallback((taskId: string) => tasks[taskId]?.isOutputOpen || false, [tasks]);

  return (
    <TaskManagerContext.Provider
      value={{
        tasks,
        startTask,
        updateTaskProgress,
        updateTaskOutput,
        stopTask,
        toggleTaskOutput,
        clearTaskOutput,
        isTaskRunning,
        getTaskProgress,
        getTaskOutput,
        isTaskOutputOpen,
      }}
    >
      {children}
    </TaskManagerContext.Provider>
  );
};

export const useTaskManager = () => {
  const context = useContext(TaskManagerContext);
  if (!context) {
    throw new Error('useTaskManager must be used within a TaskManagerProvider');
  }
  return context;
};

