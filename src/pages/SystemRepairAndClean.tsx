import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  RefreshCw,
  Activity,
  Wrench,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
  Trash2,
  HardDrive,
  Store,
  Mail,
  MessageSquare,
  Image,
  FileText,
  Database,
  Eraser,
  LayoutGrid,
  History,
  MapPin,
  Square,
} from 'lucide-react';
import { useTaskManager } from '../contexts/TaskManagerContext';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  terminalColor: string;
  isDangerous?: boolean;
  commandName: string;
  runCommand: () => Promise<string>;
}

interface Category {
  title: string;
  description: string;
  features: Feature[];
  defaultOpen?: boolean;
}

const SystemRepairAndClean: React.FC = () => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'category-0': true,
    'category-1': true,
    'category-2': false,
    'category-3': false,
  });

  const {
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
  } = useTaskManager();

  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const simulateProgress = (taskId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 90) {
        progress += Math.floor(Math.random() * 6) + 1;
      } else if (progress < 100) {
        progress += 1;
      }
      if (progress >= 99) {
        progress = 99;
      }
      updateTaskProgress(taskId, progress);
    }, 500);
    intervalRefs.current[taskId] = interval;
    return interval;
  };

  const stopProgressSimulation = (taskId: string) => {
    if (intervalRefs.current[taskId]) {
      clearInterval(intervalRefs.current[taskId]);
      delete intervalRefs.current[taskId];
    }
  };

  const handleRunCommand = async (feature: Feature) => {
    const taskId = feature.id;
    if (isTaskRunning(taskId)) {
      return;
    }

    startTask(taskId);
    updateTaskOutput(taskId, `--- Running ${feature.commandName} ---\n`, false);

    const progressInterval = simulateProgress(taskId);

    try {
      const result = await feature.runCommand();
      updateTaskOutput(taskId, result);
    } catch (error: any) {
      updateTaskOutput(taskId, `Error: ${error.message || error}`);
    } finally {
      clearInterval(progressInterval);
      stopProgressSimulation(taskId);
      updateTaskProgress(taskId, 100);
      stopTask(taskId);
    }
  };

  const handleStopTask = (taskId: string) => {
    stopProgressSimulation(taskId);
    updateTaskOutput(taskId, '\n--- Task stopped by user ---\n');
    updateTaskProgress(taskId, 100);
    stopTask(taskId);
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const categories: Category[] = [
    {
      title: 'System Repair',
      description: 'Fix corrupted system files and restore Windows health',
      defaultOpen: true,
      features: [
        {
          id: 'sfc-scan',
          title: 'SFC Scan',
          description: 'Scan for and repair corrupted system files',
          icon: <Shield className="w-6 h-6" />,
          color: 'from-blue-500 to-cyan-500',
          terminalColor: 'border-blue-500/30 bg-blue-950/40',
          commandName: 'SFC Scan',
          runCommand: window.electronAPI.sfcScan,
        },
        {
          id: 'dism-check-health',
          title: 'Check System Health',
          description: 'Quick check if your system has any issues',
          icon: <Activity className="w-6 h-6" />,
          color: 'from-green-500 to-emerald-500',
          terminalColor: 'border-green-500/30 bg-green-950/40',
          commandName: 'DISM Check Health',
          runCommand: window.electronAPI.dismCheckHealth,
        },
        {
          id: 'dism-scan-health',
          title: 'Deep System Scan',
          description: 'Thorough scan for system corruption (takes longer)',
          icon: <RefreshCw className="w-6 h-6" />,
          color: 'from-yellow-500 to-orange-500',
          terminalColor: 'border-yellow-500/30 bg-yellow-950/40',
          commandName: 'DISM Scan Health',
          runCommand: window.electronAPI.dismScanHealth,
        },
        {
          id: 'dism-restore-health',
          title: 'Repair System',
          description: 'Fix system corruption using Windows Update',
          icon: <Wrench className="w-6 h-6" />,
          color: 'from-purple-500 to-pink-500',
          terminalColor: 'border-purple-500/30 bg-purple-950/40',
          commandName: 'DISM Restore Health',
          runCommand: window.electronAPI.dismRestoreHealth,
        },
      ],
    },
    {
      title: 'System Cleanup',
      description: 'Free up space by removing temporary and unnecessary files',
      features: [
        {
          id: 'clean-temp-folders',
          title: 'Clean All Temp Folders',
          description: 'One-click cleanup of Temp, %Temp%, and Prefetch folders',
          icon: <Trash2 className="w-6 h-6" />,
          color: 'from-cyan-500 to-blue-600',
          terminalColor: 'border-cyan-500/30 bg-cyan-950/40',
          commandName: 'Clean Temp Folders',
          runCommand: window.electronAPI.cleanTempFolders,
        },
        {
          id: 'clear-recycle-bin',
          title: 'Empty Recycle Bin',
          description: 'Permanently delete all files in Recycle Bin',
          icon: <Trash2 className="w-6 h-6" />,
          color: 'from-red-500 to-rose-600',
          terminalColor: 'border-red-500/30 bg-red-950/40',
          isDangerous: true,
          commandName: 'Clear Recycle Bin',
          runCommand: window.electronAPI.clearRecycleBin,
        },
        {
          id: 'delete-temp-internet-files',
          title: 'Delete Temporary Internet Files',
          description: 'Clear old internet files from Edge and IE',
          icon: <FileText className="w-6 h-6" />,
          color: 'from-cyan-500 to-blue-500',
          terminalColor: 'border-cyan-500/30 bg-cyan-950/40',
          commandName: 'Delete Temp Internet Files',
          runCommand: window.electronAPI.deleteTempInternetFiles,
        },
        {
          id: 'clear-windows-update-cache',
          title: 'Clear Windows Update Cache',
          description: 'Delete old update files that are no longer needed',
          icon: <Database className="w-6 h-6" />,
          color: 'from-green-500 to-teal-500',
          terminalColor: 'border-green-500/30 bg-green-950/40',
          commandName: 'Clear Windows Update Cache',
          runCommand: window.electronAPI.clearWindowsUpdateCache,
        },
        {
          id: 'clear-thumbnail-cache',
          title: 'Clear Thumbnail Cache',
          description: 'Refresh file and folder preview images',
          icon: <Image className="w-6 h-6" />,
          color: 'from-purple-500 to-indigo-500',
          terminalColor: 'border-purple-500/30 bg-purple-950/40',
          commandName: 'Clear Thumbnail Cache',
          runCommand: window.electronAPI.clearThumbnailCache,
        },
        {
          id: 'delete-old-windows',
          title: 'Delete Old Windows Installation',
          description: 'Remove the Windows.old folder (previous version)',
          icon: <HardDrive className="w-6 h-6" />,
          color: 'from-amber-500 to-red-600',
          terminalColor: 'border-amber-500/30 bg-amber-950/40',
          isDangerous: true,
          commandName: 'Delete Old Windows',
          runCommand: window.electronAPI.deleteOldWindows,
        },
        {
          id: 'delete-recent-items',
          title: 'Clear Recent Items History',
          description: 'Remove recent files list from File Explorer',
          icon: <History className="w-6 h-6" />,
          color: 'from-slate-500 to-gray-600',
          terminalColor: 'border-slate-500/30 bg-slate-950/40',
          commandName: 'Delete Recent Items',
          runCommand: window.electronAPI.deleteRecentItems,
        },
        {
          id: 'delete-run-history',
          title: 'Clear Run Command History',
          description: 'Remove history from the Run dialog',
          icon: <History className="w-6 h-6" />,
          color: 'from-orange-500 to-red-500',
          terminalColor: 'border-orange-500/30 bg-orange-950/40',
          commandName: 'Delete Run History',
          runCommand: window.electronAPI.deleteRunHistory,
        },
        {
          id: 'delete-address-bar-history',
          title: 'Clear Address Bar History',
          description: 'Remove typed paths from File Explorer',
          icon: <MapPin className="w-6 h-6" />,
          color: 'from-sky-500 to-blue-600',
          terminalColor: 'border-sky-500/30 bg-sky-950/40',
          commandName: 'Delete Address Bar History',
          runCommand: window.electronAPI.deleteAddressBarHistory,
        },
      ],
    },
    {
      title: 'App Cache Cleanup',
      description: 'Clear cache for common apps to fix issues and free space',
      features: [
        {
          id: 'clear-microsoft-store-cache',
          title: 'Microsoft Store Cache',
          description: 'Fix Store download and update issues',
          icon: <Store className="w-6 h-6" />,
          color: 'from-blue-600 to-indigo-600',
          terminalColor: 'border-blue-600/30 bg-blue-950/40',
          commandName: 'Clear Microsoft Store Cache',
          runCommand: window.electronAPI.clearMicrosoftStoreCache,
        },
        {
          id: 'clear-outlook-cache',
          title: 'Outlook Cache',
          description: 'Fix email sync issues in Outlook',
          icon: <Mail className="w-6 h-6" />,
          color: 'from-blue-500 to-purple-500',
          terminalColor: 'border-blue-500/30 bg-blue-950/40',
          commandName: 'Clear Outlook Cache',
          runCommand: window.electronAPI.clearOutlookCache,
        },
        {
          id: 'clear-teams-cache',
          title: 'Microsoft Teams Cache',
          description: 'Fix Teams performance and loading issues',
          icon: <MessageSquare className="w-6 h-6" />,
          color: 'from-purple-600 to-pink-600',
          terminalColor: 'border-purple-600/30 bg-purple-950/40',
          commandName: 'Clear Teams Cache',
          runCommand: window.electronAPI.clearTeamsCache,
        },
      ],
    },
    {
      title: 'Disk Tools',
      description: 'Manage and optimize your hard drives',
      features: [
        {
          id: 'defragment-drive',
          title: 'Defragment Drive',
          description: 'Optimize your hard drive for better performance',
          icon: <HardDrive className="w-6 h-6" />,
          color: 'from-emerald-500 to-green-600',
          terminalColor: 'border-emerald-500/30 bg-emerald-950/40',
          commandName: 'Defragment Drive',
          runCommand: window.electronAPI.defragmentDrive,
        },
        {
          id: 'wipe-free-space',
          title: 'Securely Wipe Free Space',
          description: 'Overwrite free space to prevent file recovery',
          icon: <Eraser className="w-6 h-6" />,
          color: 'from-red-600 to-rose-700',
          terminalColor: 'border-red-600/30 bg-red-950/40',
          isDangerous: true,
          commandName: 'Wipe Free Space',
          runCommand: window.electronAPI.wipeFreeSpace,
        },
        {
          id: 'manage-disk-partitions',
          title: 'Manage Disk Partitions',
          description: 'Open Windows Disk Management tool',
          icon: <LayoutGrid className="w-6 h-6" />,
          color: 'from-indigo-500 to-violet-600',
          terminalColor: 'border-indigo-500/30 bg-indigo-950/40',
          commandName: 'Manage Disk Partitions',
          runCommand: window.electronAPI.manageDiskPartitions,
        },
      ],
    },
  ];

  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, []);

  const renderFeatureCard = (feature: Feature) => {
    const taskId = feature.id;
    const isRunning = isTaskRunning(taskId);
    const progress = getTaskProgress(taskId);
    const output = getTaskOutput(taskId);
    const outputOpen = isTaskOutputOpen(taskId);

    return (
      <div
        key={taskId}
        className={`glass rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
          feature.isDangerous
            ? 'border-red-500/30 hover:border-red-500/50'
            : 'border-transparent hover:border-primary-500/50'
        }`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0`}>
              {feature.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-semibold ${feature.isDangerous ? 'text-red-300' : 'text-white'}`}>
                {feature.title}
              </h3>
              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{feature.description}</p>
              <div className="flex items-center gap-2 mt-3">
                {isRunning ? (
                  <>
                    <button
                      onClick={() => handleStopTask(taskId)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      Stop
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleRunCommand(feature)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      feature.isDangerous
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                        : 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
                    }`}
                  >
                    Run
                  </button>
                )}
                {output && (
                  <button
                    onClick={() => toggleTaskOutput(taskId)}
                    className="p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    {outputOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {isRunning && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        feature.isDangerous ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {output && outputOpen && (
          <div className={`border-t ${feature.terminalColor} p-3`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] text-gray-400 font-mono">output</span>
              </div>
              <div className="flex gap-0.5">
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="p-1 hover:bg-dark-700 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => clearTaskOutput(taskId)}
                  className="p-1 hover:bg-dark-700 rounded transition-colors"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <pre className="bg-dark-950/50 rounded-lg p-2.5 text-xs text-gray-200 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
              {output}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Repair & Clean</h2>
        <p className="text-gray-400 mt-1">Keep your PC healthy, fast, and clean</p>
      </div>

      <div className="space-y-4">
        {categories.map((category, index) => {
          const categoryId = `category-${index}`;
          return (
            <div key={categoryId} className="glass rounded-2xl overflow-hidden border border-dark-600">
              <button
                onClick={() => toggleCategory(categoryId)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-dark-750/50 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{category.description}</p>
                </div>
                {openCategories[categoryId] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {openCategories[categoryId] && (
                <div className="border-t border-dark-600 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.features.map(renderFeatureCard)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemRepairAndClean;
