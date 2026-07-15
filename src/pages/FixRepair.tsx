import React, { useState, useRef, useEffect } from 'react';
import {
  HardDrive,
  Activity,
  Monitor,
  Smartphone,
  Speaker,
  Bluetooth,
  Camera,
  Wifi,
  Printer,
  Settings,
  Video,
  Disc,
  RefreshCw,
  Shield,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
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
}

const FixRepair: React.FC = () => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'category-0': true,
    'category-1': false,
    'category-2': false,
    'category-3': false,
    'category-4': false,
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
      progress += Math.floor(Math.random() * 6) + 1;
      if (progress >= 95) {
        progress = 95;
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
      title: 'Hardware Diagnostics',
      description: 'Test your hardware components for issues',
      features: [
        {
          id: 'check-disk',
          title: 'Check Disk',
          description: 'Scan your hard drive for errors and fix them',
          icon: <HardDrive className="w-6 h-6" />,
          color: 'from-blue-500 to-cyan-500',
          terminalColor: 'border-blue-500/30 bg-blue-950/40',
          commandName: 'Check Disk',
          runCommand: window.electronAPI.checkDisk,
        },
        {
          id: 'windows-memory-diagnostic',
          title: 'Memory Diagnostic',
          description: 'Check your RAM for problems',
          icon: <Activity className="w-6 h-6" />,
          color: 'from-green-500 to-emerald-500',
          terminalColor: 'border-green-500/30 bg-green-950/40',
          commandName: 'Windows Memory Diagnostic',
          runCommand: window.electronAPI.windowsMemoryDiagnostic,
        },
        {
          id: 'directx-diagnostic',
          title: 'DirectX Diagnostic',
          description: 'Test your graphics and sound hardware',
          icon: <Monitor className="w-6 h-6" />,
          color: 'from-purple-500 to-pink-500',
          terminalColor: 'border-purple-500/30 bg-purple-950/40',
          commandName: 'DirectX Diagnostic Tool',
          runCommand: window.electronAPI.directxDiagnostic,
        },
      ],
    },
    {
      title: 'Quick Fixes',
      description: 'One-click fixes for common problems',
      features: [
        {
          id: 'fix-windows-apps',
          title: 'Fix Windows Apps',
          description: 'Repair apps that won\'t open or crash',
          icon: <Smartphone className="w-6 h-6" />,
          color: 'from-orange-500 to-red-500',
          terminalColor: 'border-orange-500/30 bg-orange-950/40',
          commandName: 'Fix Windows Apps',
          runCommand: window.electronAPI.fixWindowsApps,
        },
        {
          id: 'fix-bluetooth',
          title: 'Fix Bluetooth',
          description: 'Restart Bluetooth services to fix connection issues',
          icon: <Bluetooth className="w-6 h-6" />,
          color: 'from-cyan-500 to-blue-500',
          terminalColor: 'border-cyan-500/30 bg-cyan-950/40',
          commandName: 'Fix Bluetooth',
          runCommand: window.electronAPI.fixBluetooth,
        },
        {
          id: 'fix-audio',
          title: 'Fix Audio',
          description: 'Restart audio services when there\'s no sound',
          icon: <Speaker className="w-6 h-6" />,
          color: 'from-yellow-500 to-orange-500',
          terminalColor: 'border-yellow-500/30 bg-yellow-950/40',
          commandName: 'Fix Audio',
          runCommand: window.electronAPI.fixAudio,
        },
      ],
    },
    {
      title: 'Windows Troubleshooters',
      description: 'Built-in Windows tools to automatically fix issues',
      features: [
        {
          id: 'troubleshoot-bluetooth',
          title: 'Bluetooth Troubleshooter',
          description: 'Let Windows fix Bluetooth problems for you',
          icon: <Bluetooth className="w-6 h-6" />,
          color: 'from-indigo-500 to-purple-500',
          terminalColor: 'border-indigo-500/30 bg-indigo-950/40',
          commandName: 'Bluetooth Troubleshooter',
          runCommand: window.electronAPI.troubleshootBluetooth,
        },
        {
          id: 'troubleshoot-camera',
          title: 'Camera Troubleshooter',
          description: 'Fix webcam not working issues',
          icon: <Camera className="w-6 h-6" />,
          color: 'from-pink-500 to-red-500',
          terminalColor: 'border-pink-500/30 bg-pink-950/40',
          commandName: 'Camera Troubleshooter',
          runCommand: window.electronAPI.troubleshootCamera,
        },
        {
          id: 'troubleshoot-network',
          title: 'Network Troubleshooter',
          description: 'Fix Wi-Fi and internet connection issues',
          icon: <Wifi className="w-6 h-6" />,
          color: 'from-green-500 to-teal-500',
          terminalColor: 'border-green-500/30 bg-green-950/40',
          commandName: 'Network Troubleshooter',
          runCommand: window.electronAPI.troubleshootNetwork,
        },
        {
          id: 'troubleshoot-printer',
          title: 'Printer Troubleshooter',
          description: 'Fix printer not printing or connecting',
          icon: <Printer className="w-6 h-6" />,
          color: 'from-gray-500 to-gray-600',
          terminalColor: 'border-gray-500/30 bg-gray-950/40',
          commandName: 'Printer Troubleshooter',
          runCommand: window.electronAPI.troubleshootPrinter,
        },
        {
          id: 'troubleshoot-compatibility',
          title: 'Compatibility Troubleshooter',
          description: 'Make old apps work on new Windows',
          icon: <Settings className="w-6 h-6" />,
          color: 'from-orange-500 to-amber-500',
          terminalColor: 'border-orange-500/30 bg-orange-950/40',
          commandName: 'Program Compatibility Troubleshooter',
          runCommand: window.electronAPI.troubleshootCompatibility,
        },
        {
          id: 'troubleshoot-video-playback',
          title: 'Video Playback Troubleshooter',
          description: 'Fix videos that won\'t play or are choppy',
          icon: <Video className="w-6 h-6" />,
          color: 'from-purple-500 to-violet-500',
          terminalColor: 'border-purple-500/30 bg-purple-950/40',
          commandName: 'Video Playback Troubleshooter',
          runCommand: window.electronAPI.troubleshootVideoPlayback,
        },
        {
          id: 'troubleshoot-windows-media-player',
          title: 'Media Player Troubleshooter',
          description: 'Fix Windows Media Player issues',
          icon: <Disc className="w-6 h-6" />,
          color: 'from-blue-500 to-indigo-500',
          terminalColor: 'border-blue-500/30 bg-blue-950/40',
          commandName: 'Windows Media Player Troubleshooter',
          runCommand: window.electronAPI.troubleshootWindowsMediaPlayer,
        },
        {
          id: 'troubleshoot-windows-update',
          title: 'Windows Update Troubleshooter',
          description: 'Fix updates that won\'t install',
          icon: <RefreshCw className="w-6 h-6" />,
          color: 'from-green-500 to-cyan-500',
          terminalColor: 'border-green-500/30 bg-green-950/40',
          commandName: 'Windows Update Troubleshooter',
          runCommand: window.electronAPI.troubleshootWindowsUpdate,
        },
      ],
    },
    {
      title: 'System Protection',
      description: 'Advanced recovery and protection features',
      features: [
        {
          id: 'enable-quick-recovery',
          title: 'Enable Quick Recovery',
          description: 'Help your PC boot faster after failures',
          icon: <Shield className="w-6 h-6" />,
          color: 'from-emerald-500 to-green-600',
          terminalColor: 'border-emerald-500/30 bg-emerald-950/40',
          commandName: 'Enable Quick Machine Recovery',
          runCommand: window.electronAPI.enableQuickRecovery,
        },
        {
          id: 'disable-quick-recovery',
          title: 'Disable Quick Recovery',
          description: 'Turn off quick recovery mode',
          icon: <Shield className="w-6 h-6" />,
          color: 'from-red-500 to-rose-600',
          terminalColor: 'border-red-500/30 bg-red-950/40',
          isDangerous: true,
          commandName: 'Disable Quick Machine Recovery',
          runCommand: window.electronAPI.disableQuickRecovery,
        },
        {
          id: 'activate-self-healing',
          title: 'Activate Self-Healing',
          description: 'Let Windows automatically fix file system issues',
          icon: <Shield className="w-6 h-6" />,
          color: 'from-purple-500 to-pink-600',
          terminalColor: 'border-purple-500/30 bg-purple-950/40',
          commandName: 'Activate Self-Healing Mode',
          runCommand: window.electronAPI.activateSelfHealing,
        },
      ],
    },
    {
      title: 'Generate Logs',
      description: 'Collect system logs for troubleshooting',
      features: [
        {
          id: 'generate-system-logs',
          title: 'System Logs',
          description: 'Save recent system event logs',
          icon: <FileText className="w-6 h-6" />,
          color: 'from-blue-500 to-cyan-600',
          terminalColor: 'border-blue-500/30 bg-blue-950/40',
          commandName: 'Generate System Logs',
          runCommand: window.electronAPI.generateSystemLogs,
        },
        {
          id: 'generate-application-logs',
          title: 'Application Logs',
          description: 'Save recent app crash and error logs',
          icon: <FileText className="w-6 h-6" />,
          color: 'from-orange-500 to-red-600',
          terminalColor: 'border-orange-500/30 bg-orange-950/40',
          commandName: 'Generate Application Logs',
          runCommand: window.electronAPI.generateApplicationLogs,
        },
        {
          id: 'generate-security-logs',
          title: 'Security Logs',
          description: 'Save security-related event logs',
          icon: <ShieldCheck className="w-6 h-6" />,
          color: 'from-red-500 to-rose-600',
          terminalColor: 'border-red-500/30 bg-red-950/40',
          commandName: 'Generate Security Logs',
          runCommand: window.electronAPI.generateSecurityLogs,
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
                  <button
                    onClick={() => handleStopTask(taskId)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Stop
                  </button>
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
        <h2 className="text-2xl font-bold text-white">Fix & Repair</h2>
        <p className="text-gray-400 mt-1">Diagnose and fix common Windows problems</p>
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

export default FixRepair;
