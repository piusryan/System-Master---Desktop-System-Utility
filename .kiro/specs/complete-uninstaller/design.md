# Design Document: Complete Uninstaller - Deep Cleanup & Registry Cleaner

## Overview

The Complete Uninstaller feature provides comprehensive removal of leftover application files and registry entries from uninstalled programs on Windows systems. This feature scans multiple system locations including Program Files, AppData directories, and Windows Registry to identify artifacts associated with removed applications, then safely removes them with user confirmation and backup capabilities. The system integrates with the existing Electron-based utility architecture, leveraging Windows Management Infrastructure (WMI) queries, PowerShell scripts, and the Windows Registry API to perform deep system analysis and cleanup operations while maintaining system integrity through whitelisting and dry-run validation modes.

## Architecture

The Complete Uninstaller feature follows a modular architecture with clear separation between UI, analysis, and system interaction layers:

```mermaid
graph TB
    subgraph UI["UI Layer (React/Electron)"]
        A["Complete Uninstaller Page<br/>(UninstallerControl.tsx)"]
        B["Results Display<br/>(Scan Results, Registry Entries)"]
        C["Confirmation Dialog<br/>(Risk Assessment, Preview)"]
    end
    
    subgraph MAIN["Main Process (Node.js/Electron)"]
        D["IPC Router"]
        E["Scanner Module<br/>(File & Registry)"]
        F["Analyzer Module<br/>(Matching & Risk)"]
        G["Cleanup Module<br/>(Delete & Restore)"]
    end
    
    subgraph SYSTEM["System Layer (PowerShell/WMI)"]
        H["Registry Query Engine<br/>(HKCU, HKLM)"]
        I["File System Scanner<br/>(Directory Traversal)"]
        J["WMI Query Engine<br/>(Installed Programs)"]
        K["Backup Manager<br/>(Quarantine Folder)"]
    end
    
    A -->|scan-request| D
    D -->|handle-scan| E
    E -->|query-registry| H
    E -->|scan-files| I
    E -->|get-installed-apps| J
    E -->|scan-results| F
    F -->|analysis-results| B
    B -->|cleanup-request| D
    D -->|handle-cleanup| G
    G -->|backup-files| K
    G -->|delete-registry| H
    G -->|delete-files| I
    G -->|cleanup-results| C


## Sequence Diagrams

### Scan Workflow

```mermaid
sequenceDiagram
    participant User as User/UI
    participant Page as Uninstaller Page
    participant IPC as IPC Channel
    participant Scanner as Scanner Module
    participant System as System (PS/WMI)
    participant Analyzer as Analyzer Module
    
    User->>Page: Click "Scan for Leftovers"
    Page->>Page: Show scan progress, disable buttons
    Page->>IPC: send scan-request (target-programs: optional)
    IPC->>Scanner: handle scan request
    
    Scanner->>System: get installed programs (WMI)
    System-->>Scanner: program list
    
    Scanner->>System: scan registry (HKCU, HKLM)
    System-->>Scanner: registry entries + values
    
    Scanner->>System: scan file system (Program Files, AppData)
    System-->>Scanner: file list
    
    Scanner->>Analyzer: analyze results
    Analyzer->>Analyzer: match files to programs
    Analyzer->>Analyzer: match registry to programs
    Analyzer->>Analyzer: calculate risk scores
    Analyzer-->>Scanner: structured scan results
    
    Scanner-->>IPC: scan results (JSON)
    IPC-->>Page: display results
    Page->>User: Show scanned items, grouped by program
```

### Cleanup Workflow (With Dry-Run)

```mermaid
sequenceDiagram
    participant User as User/UI
    participant Page as Uninstaller Page
    participant Dialog as Confirmation Dialog
    participant IPC as IPC Channel
    participant Cleanup as Cleanup Module
    participant System as System (PS)
    participant Backup as Backup Manager
    
    User->>Page: Select items for deletion
    User->>Page: Click "Clean Up Selected"
    Page->>Dialog: Show preview (dry-run mode)
    Dialog->>IPC: send dry-run-request
    IPC->>Cleanup: handle dry-run
    
    Cleanup->>Cleanup: validate deletion targets
    Cleanup->>Cleanup: check whitelist
    Cleanup->>Cleanup: generate report
    Cleanup-->>IPC: dry-run report
    IPC-->>Dialog: Display preview report
    
    User->>Dialog: Review & confirm cleanup
    Dialog->>IPC: send cleanup-request (confirmed)
    IPC->>Cleanup: handle cleanup
    
    Cleanup->>Backup: backup selected files
    Backup->>System: copy files to quarantine folder
    System-->>Backup: backup complete
    
    Cleanup->>System: delete files (in background)
    System-->>Cleanup: deletion status
    
    Cleanup->>System: delete registry keys
    System-->>Cleanup: registry deletion status
    
    Cleanup-->>IPC: cleanup results
    IPC-->>Page: Show results + option to restore


## Components and Interfaces

### Component 1: Scanner Module

**Purpose**: Scans the file system and Windows Registry to identify leftover files and registry entries from uninstalled applications.

**Interface**:
```typescript
interface ScannerModule {
  scanInstalledPrograms(): Promise<InstalledProgram[]>
  scanRegistry(registryPaths: RegistryPath[]): Promise<RegistryEntry[]>
  scanFileSystem(locations: string[]): Promise<FileSystemEntry[]>
  scanForOrphans(program?: string): Promise<ScanResult>
}

interface InstalledProgram {
  name: string
  version: string
  publisher: string
  installPath: string
  uninstallString?: string
  registryPath: string // HKCU or HKLM
}

interface RegistryEntry {
  hive: 'HKCU' | 'HKLM'
  path: string
  name: string
  value: any
  type: 'REG_SZ' | 'REG_DWORD' | 'REG_BINARY'
  lastModified: Date
}

interface FileSystemEntry {
  path: string
  type: 'file' | 'directory'
  size: number
  createdDate: Date
  modifiedDate: Date
  isSystemFile: boolean
}

interface ScanResult {
  orphanedFiles: FileSystemEntry[]
  orphanedRegistry: RegistryEntry[]
  matchedPrograms: Map<string, ProgramOrphans>
  scanDurationMs: number
  totalItemsFound: number
}

interface ProgramOrphans {
  program: InstalledProgram
  files: FileSystemEntry[]
  registryEntries: RegistryEntry[]
  estimatedSize: number
  riskLevel: 'low' | 'medium' | 'high'
}
```

**Responsibilities**:
- Query installed programs from registry (HKCU\Software, HKCU\Software\Classes, HKLM\Software)
- Traverse file system locations (Program Files, AppData\Local, AppData\Roaming) efficiently
- Query registry hives for leftover entries matching program names/versions
- Handle access denied errors gracefully
- Cache results during active scan to avoid duplicate queries

### Component 2: Analyzer Module

**Purpose**: Matches orphaned files and registry entries to uninstalled programs, calculates risk scores, and identifies system/important files.

**Interface**:
```typescript
interface AnalyzerModule {
  matchFileToProgram(filePath: string, programs: InstalledProgram[]): MatchResult
  matchRegistryToProgram(regEntry: RegistryEntry, programs: InstalledProgram[]): MatchResult
  calculateRiskScore(item: FileSystemEntry | RegistryEntry): number
  isSystemOrImportantFile(filePath: string): boolean
  analyzeOrphans(scanResult: ScanResult, whitelist: Whitelist): AnalysisResult
}

interface MatchResult {
  matchedProgram?: InstalledProgram
  matchScore: number // 0-100, higher is more confident
  matchReason: string
  alternativeMatches: InstalledProgram[]
}

interface AnalysisResult {
  categorizedOrphans: Map<string, OrphanCategory>
  totalSizeFreeable: number
  highRiskItems: (FileSystemEntry | RegistryEntry)[]
  safeToDeleteItems: (FileSystemEntry | RegistryEntry)[]
  recommendedForManualReview: (FileSystemEntry | RegistryEntry)[]
}

interface OrphanCategory {
  programName: string
  files: FileSystemEntry[]
  registry: RegistryEntry[]
  totalSize: number
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
}

interface Whitelist {
  systemPaths: Set<string>
  criticalRegistry: Set<string>
  importantPrograms: Set<string>
  userDefinedExclusions: Set<string>
}
```

**Responsibilities**:
- Use fuzzy string matching to correlate files/registry with program names
- Maintain whitelist of critical system files and registry paths
- Calculate risk scores based on file location, registry path, and match confidence
- Flag system-critical files and paths for manual review only
- Provide detailed matching rationale for each orphaned item

### Component 3: Cleanup Module

**Purpose**: Safely removes selected orphaned files and registry entries with backup and restore capabilities.

**Interface**:
```typescript
interface CleanupModule {
  validateDeletion(items: CleanupItem[]): ValidationResult
  performDryRun(items: CleanupItem[]): DryRunResult
  backupItems(items: CleanupItem[]): Promise<BackupResult>
  deleteFiles(filePaths: string[], backup: boolean): Promise<FileDeleteResult>
  deleteRegistry(regEntries: RegistryEntry[]): Promise<RegistryDeleteResult>
  executeCleanup(items: CleanupItem[], dryRun?: boolean): Promise<CleanupExecutionResult>
  restoreFromBackup(backupId: string): Promise<RestoreResult>
}

interface CleanupItem {
  id: string
  type: 'file' | 'registry'
  path: string // file path or registry path
  size?: number
  riskLevel: 'low' | 'medium' | 'high'
  selected: boolean
  reason: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  unsafeItems: CleanupItem[]
}

interface DryRunResult {
  wouldDeleteCount: number
  wouldFreeSize: number
  estimatedTime: number
  potentialIssues: string[]
  operations: string[]
}

interface BackupResult {
  backupId: string
  backupPath: string
  itemsBackedUp: number
  totalSize: number
  createdAt: Date
  canRestore: boolean
}

interface FileDeleteResult {
  deletedCount: number
  failedCount: number
  failedPaths: string[]
  freedSize: number
  deletionDurationMs: number
  requiresReboot: boolean
}

interface RegistryDeleteResult {
  deletedCount: number
  failedCount: number
  failedPaths: string[]
  deletionDurationMs: number
  requiresReboot: boolean
}

interface CleanupExecutionResult {
  success: boolean
  filesDeleted: FileDeleteResult
  registryDeleted: RegistryDeleteResult
  backupInfo: BackupResult
  totalDurationMs: number
  requiresReboot: boolean
}

interface RestoreResult {
  success: boolean
  restoredCount: number
  failedCount: number
  restoredAt: Date
}
```

**Responsibilities**:
- Validate all deletion targets against whitelist before deletion
- Create backup of all items in quarantine folder before deletion
- Delete files with proper error handling and lock detection
- Delete registry entries with elevation handling
- Provide rollback capability through backup restoration
- Detect if reboot is required for cleanup completion

### Component 4: IPC Handler (electron/main.ts)

**Purpose**: Manages Electron IPC communication between renderer process and Node.js main process.

**Interface**:
```typescript
interface UninstallerIPC {
  'uninstaller-scan': (targetPrograms?: string[]) => Promise<ScanResult>
  'uninstaller-analyze': (scanResult: ScanResult) => Promise<AnalysisResult>
  'uninstaller-dry-run': (items: CleanupItem[]) => Promise<DryRunResult>
  'uninstaller-cleanup': (items: CleanupItem[]) => Promise<CleanupExecutionResult>
  'uninstaller-restore': (backupId: string) => Promise<RestoreResult>
  'uninstaller-get-backups': () => Promise<BackupResult[]>
  'uninstaller-delete-backup': (backupId: string) => Promise<boolean>
  'uninstaller-whitelist-get': () => Promise<Whitelist>
  'uninstaller-whitelist-update': (whitelist: Whitelist) => Promise<void>
}
```

**Responsibilities**:
- Route IPC messages to appropriate modules
- Handle async operations with proper error reporting
- Maintain session state for multi-step operations
- Provide progress callbacks for long-running scans
- Handle elevation/privilege escalation when needed


## Data Models

### Program Identification Model

```typescript
interface ProgramIdentifier {
  name: string
  version: string
  publisher: string
  installPath: string
  registryKey: string
  uninstallString?: string
  estimatedSize?: number
}

// Validation Rules:
// - name must be non-empty and match registry display name
// - publisher must be a valid string or null
// - installPath must be absolute Windows path
// - registryKey must be in HKCU\Software or HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall
// - version must match semantic versioning or be partial (e.g., "1.0", "2.0.1")
```

### Scan Result Model

```typescript
interface ScanResultData {
  scanId: string
  timestamp: Date
  totalProgramsAnalyzed: number
  totalFilesScanned: number
  totalRegistryKeysScanned: number
  orphanedFiles: FileSystemEntry[]
  orphanedRegistry: RegistryEntry[]
  matches: Map<string, ProgramMatch>
  scanDurationMs: number
  systemInfo: {
    windowsVersion: string
    adminRights: boolean
    diskFreeSpace: number
  }
}

interface ProgramMatch {
  program: ProgramIdentifier
  files: FileSystemEntry[]
  registryEntries: RegistryEntry[]
  matchConfidence: number // 0-100
  estimatedSize: number
  potentialDataLoss: boolean
}

// Validation Rules:
// - totalFilesScanned >= 0
// - orphanedFiles array must not contain duplicates by path
// - orphanedRegistry array must not contain duplicates by (hive, path, name)
// - matchConfidence between 0-100
// - scanDurationMs >= 0
```

### Cleanup Selection Model

```typescript
interface CleanupSelection {
  selectionId: string
  createdAt: Date
  items: CleanupItem[]
  totalSize: number
  estimatedFreedSpace: number
  programsAffected: string[]
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
}

interface CleanupItem {
  id: string
  scanResultId: string
  type: 'file' | 'registry'
  path: string
  size?: number
  riskLevel: 'low' | 'medium' | 'high'
  programName: string
  matchConfidence: number
  selected: boolean
  reason: string // e.g., "matched to program install path"
  modificationDate?: Date
}

// Validation Rules:
// - items cannot be empty when performing cleanup
// - at least one item must have selected === true
// - riskLevel must correspond to predefined risk assessment
// - programName must match an installed or uninstalled program
```

### Backup Model

```typescript
interface BackupMetadata {
  backupId: string
  createdAt: Date
  expiresAt: Date
  backupPath: string
  itemsBackedUp: number
  totalSize: number
  checksumMap: Map<string, string> // path -> SHA256
  restoreLog: RestoreLogEntry[]
}

interface RestoreLogEntry {
  timestamp: Date
  itemPath: string
  status: 'success' | 'failed'
  reason?: string
}

// Validation Rules:
// - backupId must be UUID
// - backupPath must be absolute and exist
// - expiresAt > createdAt
// - itemsBackedUp > 0
// - checksumMap provides integrity verification
```

## Error Handling

### Error Scenario 1: Access Denied During Registry Access

**Condition**: User lacks administrative privileges to read registry hives (HKLM)
**Response**: 
- Detect insufficient privilege error from Windows API call
- Log error with details about which registry path failed
- Return partial results with HKCU entries and accessible HKLM entries
- Notify UI that full scan requires administrator privileges
**Recovery**: 
- Offer to restart app with admin privileges via IPC elevation request
- Allow user to continue scan with available data
- Mark results as "Incomplete - administrator access required"

### Error Scenario 2: File in Use During Deletion

**Condition**: Application holds lock on file marked for deletion
**Response**:
- Detect file lock error (ERROR_SHARING_VIOLATION)
- Query locking process using WMI or Restart Manager
- Offer user options: skip file, kill process, or retry later
- Schedule deletion for post-reboot if user permits
**Recovery**:
- Use Restart Manager API to gracefully request process termination
- If process termination succeeds, retry deletion
- If unsuccessful, add to post-reboot deletion list
- Optionally use IObit Unlocker integration for stubborn locks

### Error Scenario 3: Protected Registry Key

**Condition**: Registry key cannot be deleted due to system protection
**Response**:
- Detect registry deletion error from Windows API
- Determine if key is in whitelist or system-protected
- Log attempt with details
- Skip deletion and mark as "Protected - cannot delete"
**Recovery**:
- Move to "Manual Review Required" section in UI
- Document why key cannot be deleted
- Allow user to manually decide action

### Error Scenario 4: Insufficient Disk Space for Backup

**Condition**: Not enough disk space to backup files before deletion
**Response**:
- Check available disk space before backup operation
- Calculate total size of items to backup
- Display warning to user with free/required space
- Offer option to proceed without backup (dangerous!)
**Recovery**:
- Recommend disk cleanup first
- Allow user to manually delete some backup items
- Proceed with cleanup without backup if user explicitly permits

### Error Scenario 5: PowerShell Execution Failure

**Condition**: PowerShell script fails during execution
**Response**:
- Capture stderr output and exit code
- Log full PowerShell error message
- Parse error to determine root cause
- Display user-friendly error message
**Recovery**:
- Retry operation with different approach (direct Win32 API if available)
- Fall back to manual deletion methods
- Provide diagnostic information for troubleshooting

## Testing Strategy

### Unit Testing Approach

**Scope**: Individual functions in Scanner, Analyzer, and Cleanup modules

**Key Test Cases**:
- `matchFileToProgram()`: Test fuzzy matching with various program names and file paths
- `matchRegistryToProgram()`: Test registry key pattern matching
- `calculateRiskScore()`: Test risk scoring algorithm with edge cases
- `isSystemOrImportantFile()`: Test whitelist matching
- Whitelist validation: Ensure protected paths are never marked for deletion
- Error handling: Test graceful handling of permission errors, missing files, etc.

**Coverage Goals**: 
- 100% coverage for critical functions (deletion, whitelist checks, backup)
- 95% coverage for analysis functions
- 90% coverage for UI-facing functions

### Property-Based Testing Approach

**Property Test Library**: fast-check (already in project via dependencies)

**Properties to Verify**:
1. **File Deletion Idempotence**: Running deletion twice should produce same result
2. **Backup Integrity**: All backed-up files must be restorable to original state
3. **Registry Entry Consistency**: No orphaned registry entries should remain after cleanup
4. **Whitelist Safety**: Whitelisted items must never be selected for deletion
5. **Match Confidence Bounds**: Match scores must always be 0-100
6. **Size Calculation Accuracy**: Calculated freed space must equal sum of deleted item sizes

**Property Test Examples**:
```typescript
// Property: Cleanup of identical selections produces identical results
property('cleanup idempotent', fc.array(fc.record({
  path: fc.string({minLength: 1}),
  type: fc.constantFrom('file', 'registry'),
  size: fc.nat()
})), (selections) => {
  const result1 = cleanup(selections);
  const result2 = cleanup(selections);
  return result1.deletedCount === result2.deletedCount &&
         result1.freedSize === result2.freedSize;
});

// Property: Match scores always within bounds
property('match score bounds', 
  fc.string({minLength: 1}),
  fc.string({minLength: 1}),
  (programName, filePath) => {
    const score = calculateMatchScore(programName, filePath);
    return score >= 0 && score <= 100;
  }
);

// Property: Total freed size equals sum of individual file sizes
property('freed size equals sum of components', 
  fc.array(fc.nat(1000000)), 
  (sizes) => {
    const items = sizes.map(s => ({ size: s, type: 'file' }));
    const result = executeCleanup(items);
    return result.freedSize === sizes.reduce((a, b) => a + b, 0);
  }
);
```

### Integration Testing Approach

**Scope**: Full workflow from scan through cleanup and restore

**Test Scenarios**:
1. **Full Cleanup Cycle**: Scan → Analyze → Review → Dry-Run → Cleanup → Verify
   - Install test application
   - Uninstall via Windows Add/Remove Programs
   - Run full uninstaller workflow
   - Verify all artifacts removed
   - Restore from backup
   - Verify restoration successful

2. **Whitelist Protection**: Ensure whitelisted items never deleted
   - Create test file in whitelisted location
   - Scan and analyze
   - Verify file not marked for deletion

3. **Registry Cleanup**: Verify orphaned registry entries removed correctly
   - Query registry before cleanup
   - Perform cleanup
   - Query registry after cleanup
   - Verify entries removed

4. **Dry-Run Accuracy**: Dry-run predictions must match actual cleanup results
   - Execute dry-run
   - Record predicted deleted count and freed space
   - Perform actual cleanup
   - Verify predictions match reality

5. **Backup and Restore**: Verify backup creation and restore functionality
   - Backup items
   - Delete backed-up files/registry
   - Restore from backup
   - Verify complete restoration

## Performance Considerations

### Scan Performance

**Challenge**: Large file systems and deep registry hives can make scanning slow

**Optimization Strategies**:
- **Parallel Scanning**: Scan multiple directory trees concurrently using Node.js Worker Threads
- **Caching**: Cache registry queries and file system snapshots to avoid redundant scans
- **Lazy Loading**: Load file details on-demand rather than loading all metadata upfront
- **Progress Reporting**: Stream scan progress to UI in real-time to maintain responsiveness
- **Early Termination**: Allow user to cancel ongoing scans

**Performance Targets**:
- Initial scan: < 30 seconds for typical 5000-file scan
- Registry query: < 5 seconds per hive
- Analysis pass: < 10 seconds for 5000-file results

### Cleanup Performance

**Challenge**: Large number of files to delete and registry modifications can be slow

**Optimization Strategies**:
- **Batch Operations**: Group file deletions into batch commands
- **Parallel Deletion**: Delete files in parallel using multiple processes
- **Registry Batch Operations**: Combine multiple registry deletions into single operation
- **Reboot Optimization**: Defer post-reboot deletions to batch operation

**Performance Targets**:
- File deletion: < 100ms per file average
- Registry deletion: < 50ms per entry average
- Full cleanup: < 60 seconds for 5000 items

## Security Considerations

### Principle: Defense in Depth

**Layer 1 - Whitelist Protection**:
- Maintain comprehensive whitelist of system-critical paths and registry locations
- Never allow whitelisted items to be marked for deletion
- Whitelist must be hardcoded with option for user-defined additions (not removals)

**Layer 2 - Risk Assessment**:
- Calculate risk score for each item (0-100 scale)
- Mark high-risk items for manual review only
- Provide detailed rationale for each risk assessment
- Require explicit confirmation before deleting high-risk items

**Layer 3 - Dry-Run Validation**:
- Always show dry-run preview before actual deletion
- Display what will be deleted in clear, readable format
- Highlight high-risk items in preview
- Allow user to deselect items before proceeding

**Layer 4 - Backup Before Delete**:
- Create backup of all items before deletion
- Store backup in isolated quarantine folder
- Implement restore functionality with audit log
- Retain backups for configurable period (default: 30 days)

**Layer 5 - Integrity Verification**:
- Calculate SHA256 checksum of backed-up files
- Verify checksums before deletion to ensure file integrity
- Detect corrupted files and alert user

### Threat Model

**Threat: Malicious Registry Modification**
- **Mitigation**: Validate registry entries against whitelist before deletion; never delete entries matching known system patterns

**Threat: Accidental System File Deletion**
- **Mitigation**: Comprehensive whitelist; risk assessment; dry-run preview; backup before delete

**Threat: Privilege Escalation**
- **Mitigation**: Detect and request admin elevation explicitly; never silently escalate privileges

**Threat: Loss of User Data**
- **Mitigation**: Backup all deleted items; implement reliable restore functionality; provide clear warnings for risky operations

## Dependencies

**Internal**:
- Electron (already in package.json)
- React (UI components)
- TypeScript (type safety)
- Existing IPC infrastructure (electron/main.ts)

**External - Windows APIs**:
- Windows Registry API (Advapi32.dll)
- WMI (Windows Management Instrumentation)
- Windows Restart Manager API (rstrtmgr.dll)
- PowerShell Core Runtime

**External - NPM Packages**:
- `winreg` (npm package for Windows Registry access from Node.js)
- `windows-api` (native Windows API bindings)
- `fast-check` (property-based testing - already in devDependencies)

**Storage**:
- Quarantine folder: `%APPDATA%\SystemMaster\Uninstaller\Backups`
- Logs folder: `%APPDATA%\SystemMaster\Uninstaller\Logs`


---

# Low-Level Design: Code-First Implementation

## Main Algorithm/Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant React as React Component
    participant Main as Main Process
    participant Scanner as Scanner
    participant Registry as Registry API
    participant FileSystem as File System
    participant Analyzer as Analyzer
    participant Display as Display Results
    
    User->>React: Initiate Scan
    React->>Main: IPC: uninstaller-scan
    Main->>Scanner: scanForOrphans()
    
    par Registry Scan
        Scanner->>Registry: Query HKCU\Software
        Scanner->>Registry: Query HKCU\Software\Classes
        Scanner->>Registry: Query HKLM\Software
    and File System Scan
        Scanner->>FileSystem: Traverse Program Files
        Scanner->>FileSystem: Traverse AppData\Local
        Scanner->>FileSystem: Traverse AppData\Roaming
    and Program Enumeration
        Scanner->>Registry: Get Installed Programs (WMI)
    end
    
    Scanner->>Analyzer: analyzeOrphans(scanResult)
    Analyzer->>Analyzer: Match files to programs
    Analyzer->>Analyzer: Match registry to programs
    Analyzer->>Analyzer: Calculate risk scores
    Main-->>React: Send analysis results
    React-->>Display: Render organized results


## Core Interfaces/Types

```typescript
// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

/**
 * Represents an installed or previously installed Windows application
 */
interface InstalledProgram {
  id: string // Unique identifier (registry path hash)
  name: string
  version: string
  publisher: string
  installPath: string
  registryPath: string // Full registry path to Uninstall key
  registryHive: 'HKCU' | 'HKLM'
  installDate?: Date
  uninstallString?: string
  estimatedSize?: number
  isStillInstalled: boolean
}

/**
 * Represents a registry entry (key-value pair)
 */
interface RegistryEntry {
  id: string
  hive: 'HKCU' | 'HKLM'
  path: string // Full registry path (e.g., "Software\Microsoft\Program")
  valueName: string // Name of the value
  value: any
  valueType: 'REG_SZ' | 'REG_DWORD' | 'REG_BINARY' | 'REG_EXPAND_SZ' | 'REG_MULTI_SZ'
  lastModified: Date
  isKey: boolean // true if this is a key, false if it's a value
}

/**
 * Represents a file or directory entry
 */
interface FileSystemEntry {
  id: string
  path: string
  type: 'file' | 'directory'
  size: number // bytes
  createdDate: Date
  modifiedDate: Date
  isSystemFile: boolean // true if in protected location (C:\Windows, etc.)
  isHidden: boolean
  attributes: number // Windows file attributes
}

/**
 * Result of matching a file/registry entry to a program
 */
interface MatchResult {
  matchedProgram: InstalledProgram | null
  matchScore: number // 0-100, higher confidence
  matchMethod: 'path_match' | 'name_match' | 'version_match' | 'fuzzy_match'
  matchReason: string
  alternativeMatches: Array<{program: InstalledProgram, score: number}>
}

/**
 * Complete scan result with all discovered orphans
 */
interface ScanResult {
  id: string
  timestamp: Date
  orphanedFiles: FileSystemEntry[]
  orphanedRegistry: RegistryEntry[]
  installedPrograms: InstalledProgram[]
  scanDurationMs: number
  filesScanned: number
  registryKeysScanned: number
  systemInfo: {
    windowsVersion: string
    adminRights: boolean
    diskFreeSpaceBytes: number
  }
}

/**
 * Analysis of scan results with program matching and risk assessment
 */
interface AnalysisResult {
  id: string
  scanId: string
  timestamp: Date
  categorizedOrphans: Map<string, {
    program: InstalledProgram
    files: FileSystemEntry[]
    registryEntries: RegistryEntry[]
    totalSize: number
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
  }>
  uncategorizedFiles: FileSystemEntry[]
  uncategorizedRegistry: RegistryEntry[]
  totalSizeFreeable: number
  totalItemCount: number
  highRiskCount: number
}

/**
 * Item selected for cleanup
 */
interface CleanupItem {
  id: string
  type: 'file' | 'registry'
  path: string
  size?: number
  riskLevel: 'low' | 'medium' | 'high'
  programName: string
  matchConfidence: number
  selected: boolean
  reason: string
}

/**
 * Backup metadata for restore capability
 */
interface BackupInfo {
  id: string
  createdAt: Date
  expiresAt: Date
  backupPath: string
  itemsBackedUp: number
  totalSize: number
  checksumMap: Map<string, string> // file path -> SHA256
}

/**
 * Whitelist configuration to prevent accidental deletion
 */
interface Whitelist {
  systemPaths: Set<string> // Paths to never delete
  criticalRegistry: Set<string> // Registry paths to never delete
  fileExtensions: Set<string> // File extensions to be cautious with (e.g., .sys, .dll)
  processNames: Set<string> // Running processes to preserve
}
```

## Key Functions with Formal Specifications

### Function 1: scanInstalledPrograms()

```typescript
async function scanInstalledPrograms(): Promise<InstalledProgram[]>
```

**Preconditions**:
- Windows system is accessible
- Registry API is available (requires Windows 10+)
- Current process has at least user-level privileges (admin recommended for HKLM)

**Postconditions**:
- Returns array of installed programs from HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall and HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall
- Each program has unique id, name, version, publisher
- Programs marked with isStillInstalled boolean indicating current installation status
- Handles missing registry hives gracefully (returns empty array for inaccessible hives)

**Loop Invariants**:
- All processed programs have non-empty name field
- installPath is absolute Windows path or null
- Each program appears at most once in result array (no duplicates)

### Function 2: scanRegistry(registryPaths: RegistryPath[]): Promise<RegistryEntry[]>

```typescript
async function scanRegistry(registryPaths: RegistryPath[]): Promise<RegistryEntry[]>
```

**Preconditions**:
- registryPaths is non-empty array of valid registry paths
- Each path follows format: "HKCU\..." or "HKLM\..."
- Current process has read permissions for requested hives

**Postconditions**:
- Returns all registry entries (both keys and values) recursively from specified paths
- Each entry includes: hive, path, valueName, value, valueType, lastModified, isKey
- Gracefully handles access denied errors (returns partial results)
- Entries are deduplicated by (hive, path, valueName)
- Returns empty array if path doesn't exist

**Loop Invariants**:
- Each entry processed exactly once
- valueType matches actual Windows registry value type
- path is valid registry path with backslashes

### Function 3: scanFileSystem(locations: string[]): Promise<FileSystemEntry[]>

```typescript
async function scanFileSystem(locations: string[]): Promise<FileSystemEntry[]>
```

**Preconditions**:
- locations is non-empty array of absolute Windows paths
- Each path exists and is readable
- Current process has file system read permissions

**Postconditions**:
- Returns all files and directories recursively from specified locations
- Each entry includes: path, type, size, dates, attributes
- Skips symbolic links and junction points to avoid infinite loops
- Gracefully handles access denied (skips inaccessible subdirectories)
- isSystemFile marked true for files in protected locations

**Loop Invariants**:
- No duplicate paths in result set
- All paths are absolute and normalized
- Size field matches actual file size or 0 for directories
- No circular path references

### Function 4: matchFileToProgram(file: FileSystemEntry, programs: InstalledProgram[]): MatchResult

```typescript
function matchFileToProgram(
  file: FileSystemEntry, 
  programs: InstalledProgram[]
): MatchResult
```

**Preconditions**:
- file.path is absolute Windows path
- programs array is non-empty

**Postconditions**:
- Returns MatchResult with matchScore between 0-100
- matchedProgram is non-null only if matchScore >= 60 (confidence threshold)
- matchReason explains matching logic clearly
- alternativeMatches contains programs with score 30-59 (possible matches)

**Algorithm**: 
- Check if file path is under any program's installPath (highest priority)
- Perform fuzzy string matching on file path vs program name/version
- Check for AppData paths matching program publisher/name pattern
- Score based on path specificity and name match confidence

### Function 5: calculateRiskScore(item: FileSystemEntry | RegistryEntry): number

```typescript
function calculateRiskScore(item: FileSystemEntry | RegistryEntry): number
```

**Preconditions**:
- item is valid FileSystemEntry or RegistryEntry
- Whitelist is initialized and loaded

**Postconditions**:
- Returns integer between 0-100 representing deletion risk
- 0-40: Low risk (safe to delete)
- 41-70: Medium risk (review recommended)
- 71-100: High risk (manual review strongly recommended)
- Whitelisted items always return 100 (high risk, protected)

**Risk Factors** (additive):
- Located in C:\Windows or C:\Program Files: +60
- System file attribute set: +40
- File extension in critical list (.sys, .drv): +30
- Registry path in HKLM: +20
- Item has dependencies detected: +25
- Recently modified (< 7 days): +15

### Function 6: performCleanup(items: CleanupItem[], dryRun: boolean): Promise<CleanupResult>

```typescript
async function performCleanup(
  items: CleanupItem[], 
  dryRun: boolean = true
): Promise<CleanupResult>
```

**Preconditions**:
- items array contains at least one item with selected === true
- No whitelisted items marked for deletion
- All items have riskLevel assigned
- Current process has admin privileges (required for HKLM registry access)

**Postconditions**:
- If dryRun === true: returns prediction of what would be deleted, no actual changes
- If dryRun === false: 
  - Creates backup of all items before deletion
  - Deletes all selected files (with lock handling)
  - Deletes all selected registry entries
  - Returns CleanupResult with counts and any errors
  - Sets requiresReboot flag if post-reboot deletion needed

**Post-Deletion Verification**:
- Verify files are actually deleted using file system check
- Verify registry entries removed using registry query
- Return any failures in result

## Algorithmic Pseudocode

### Main Processing Algorithm: scanForOrphans()

```typescript
async function scanForOrphans(targetPrograms?: string[]): Promise<ScanResult> {
  // Initialize result structures
  const startTime = Date.now()
  const scanResult: ScanResult = {
    id: generateUUID(),
    timestamp: new Date(),
    orphanedFiles: [],
    orphanedRegistry: [],
    installedPrograms: [],
    scanDurationMs: 0,
    filesScanned: 0,
    registryKeysScanned: 0,
    systemInfo: getSystemInfo()
  }

  // STEP 1: Get all installed programs
  console.log('Scanning installed programs...')
  const installedPrograms = await scanInstalledPrograms()
  scanResult.installedPrograms = installedPrograms
  
  if (targetPrograms && targetPrograms.length > 0) {
    // Filter to only specified programs
    scanResult.installedPrograms = installedPrograms.filter(p =>
      targetPrograms.some(t => p.name.toLowerCase().includes(t.toLowerCase()))
    )
  }

  // STEP 2: Scan registry for leftover entries
  console.log('Scanning registry for leftover entries...')
  const registryHives = [
    'HKCU\\Software',
    'HKCU\\Software\\Classes',
    'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion'
  ]
  
  let registryResults: RegistryEntry[] = []
  for (const hive of registryHives) {
    try {
      const entries = await scanRegistry([hive])
      registryResults = registryResults.concat(entries)
    } catch (error) {
      console.warn(`Registry scan failed for ${hive}:`, error)
      // Continue scanning other hives
    }
  }
  
  scanResult.registryKeysScanned = registryResults.length

  // STEP 3: Scan file system for leftover files
  console.log('Scanning file system for leftover files...')
  const scanLocations = [
    process.env.ProgramFiles || 'C:\\Program Files',
    process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
    `${process.env.LOCALAPPDATA}\\`,
    `${process.env.APPDATA}\\`
  ]
  
  let fileResults: FileSystemEntry[] = []
  for (const location of scanLocations) {
    try {
      const files = await scanFileSystem([location])
      fileResults = fileResults.concat(files)
    } catch (error) {
      console.warn(`File scan failed for ${location}:`, error)
      // Continue scanning other locations
    }
  }
  
  scanResult.filesScanned = fileResults.length

  // STEP 4: Identify orphans (not in installed programs list)
  console.log('Identifying orphaned entries...')
  
  // Orphaned registry: entries that don't match any installed program
  const orphanedRegistry: RegistryEntry[] = []
  for (const regEntry of registryResults) {
    let isOrphaned = true
    for (const program of installedPrograms) {
      if (regEntry.path.includes(program.name) || 
          regEntry.path.includes(program.publisher)) {
        isOrphaned = false
        break
      }
    }
    if (isOrphaned) {
      orphanedRegistry.push(regEntry)
    }
  }
  
  // Orphaned files: files not in any installed program path
  const orphanedFiles: FileSystemEntry[] = []
  for (const file of fileResults) {
    let isOrphaned = true
    for (const program of installedPrograms) {
      if (program.installPath && file.path.startsWith(program.installPath)) {
        isOrphaned = false
        break
      }
    }
    if (isOrphaned && !isSystemProtectedPath(file.path)) {
      orphanedFiles.push(file)
    }
  }

  scanResult.orphanedFiles = orphanedFiles
  scanResult.orphanedRegistry = orphanedRegistry
  scanResult.scanDurationMs = Date.now() - startTime

  console.log(`Scan complete: ${orphanedFiles.length} orphaned files, ${orphanedRegistry.length} orphaned registry entries`)
  
  return scanResult
}
```

### Analysis Algorithm: analyzeOrphans()

```typescript
function analyzeOrphans(
  scanResult: ScanResult, 
  whitelist: Whitelist
): AnalysisResult {
  const result: AnalysisResult = {
    id: generateUUID(),
    scanId: scanResult.id,
    timestamp: new Date(),
    categorizedOrphans: new Map(),
    uncategorizedFiles: [],
    uncategorizedRegistry: [],
    totalSizeFreeable: 0,
    totalItemCount: 0,
    highRiskCount: 0
  }

  // STEP 1: Match orphaned files to programs
  console.log('Matching orphaned files to programs...')
  for (const file of scanResult.orphanedFiles) {
    // Check whitelist first
    if (isWhitelisted(file.path, whitelist)) {
      result.totalItemCount++
      continue
    }

    // Try to match to a program
    const match = matchFileToProgram(file, scanResult.installedPrograms)
    
    if (match.matchedProgram && match.matchScore >= 60) {
      // Add to categorized orphans
      const programName = match.matchedProgram.name
      if (!result.categorizedOrphans.has(programName)) {
        result.categorizedOrphans.set(programName, {
          program: match.matchedProgram,
          files: [],
          registryEntries: [],
          totalSize: 0,
          riskLevel: 'low',
          confidence: 0
        })
      }
      
      const category = result.categorizedOrphans.get(programName)!
      category.files.push(file)
      category.totalSize += file.size
    } else {
      // No confident match
      result.uncategorizedFiles.push(file)
    }
    
    result.totalItemCount++
  }

  // STEP 2: Match orphaned registry entries to programs
  console.log('Matching orphaned registry entries to programs...')
  for (const regEntry of scanResult.orphanedRegistry) {
    // Check whitelist first
    if (isWhitelistedRegistry(regEntry.path, whitelist)) {
      result.totalItemCount++
      continue
    }

    // Try to match to a program
    const match = matchRegistryToProgram(regEntry, scanResult.installedPrograms)
    
    if (match.matchedProgram && match.matchScore >= 60) {
      const programName = match.matchedProgram.name
      if (!result.categorizedOrphans.has(programName)) {
        result.categorizedOrphans.set(programName, {
          program: match.matchedProgram,
          files: [],
          registryEntries: [],
          totalSize: 0,
          riskLevel: 'low',
          confidence: 0
        })
      }
      
      const category = result.categorizedOrphans.get(programName)!
      category.registryEntries.push(regEntry)
    } else {
      result.uncategorizedRegistry.push(regEntry)
    }
    
    result.totalItemCount++
  }

  // STEP 3: Calculate risk levels for each category
  console.log('Calculating risk levels...')
  for (const [programName, category] of result.categorizedOrphans.entries()) {
    let maxRisk = 0
    
    for (const file of category.files) {
      const riskScore = calculateRiskScore(file)
      maxRisk = Math.max(maxRisk, riskScore)
    }
    
    for (const regEntry of category.registryEntries) {
      const riskScore = calculateRiskScore(regEntry)
      maxRisk = Math.max(maxRisk, riskScore)
    }

    if (maxRisk >= 71) {
      category.riskLevel = 'high'
      result.highRiskCount += category.files.length + category.registryEntries.length
    } else if (maxRisk >= 41) {
      category.riskLevel = 'medium'
    } else {
      category.riskLevel = 'low'
    }

    result.totalSizeFreeable += category.totalSize
  }

  return result
}
```

## Example Usage

```typescript
// ============================================================================
// EXAMPLE 1: Complete uninstallation workflow
// ============================================================================

async function runCompleteUninstallation() {
  // Step 1: Perform initial scan
  console.log('Starting scan...')
  const scanResult = await scanForOrphans()
  console.log(`Found ${scanResult.orphanedFiles.length} orphaned files`)
  console.log(`Found ${scanResult.orphanedRegistry.length} orphaned registry entries`)

  // Step 2: Analyze results
  console.log('Analyzing results...')
  const whitelist = loadWhitelist()
  const analysis = analyzeOrphans(scanResult, whitelist)
  
  console.log(`Total freeable space: ${formatBytes(analysis.totalSizeFreeable)}`)
  console.log(`Programs with orphans: ${analysis.categorizedOrphans.size}`)

  // Step 3: Display results by program
  for (const [programName, category] of analysis.categorizedOrphans.entries()) {
    console.log(`\n${programName} (Risk: ${category.riskLevel})`)
    console.log(`  Files: ${category.files.length}`)
    console.log(`  Registry entries: ${category.registryEntries.length}`)
    console.log(`  Size: ${formatBytes(category.totalSize)}`)
  }

  // Step 4: Create cleanup selection
  const cleanupItems: CleanupItem[] = []
  
  for (const [programName, category] of analysis.categorizedOrphans.entries()) {
    for (const file of category.files) {
      cleanupItems.push({
        id: generateUUID(),
        type: 'file',
        path: file.path,
        size: file.size,
        riskLevel: category.riskLevel,
        programName,
        matchConfidence: 85,
        selected: category.riskLevel !== 'high',
        reason: `Orphaned file from ${programName}`
      })
    }

    for (const regEntry of category.registryEntries) {
      cleanupItems.push({
        id: generateUUID(),
        type: 'registry',
        path: regEntry.path,
        riskLevel: category.riskLevel,
        programName,
        matchConfidence: 85,
        selected: category.riskLevel !== 'high',
        reason: `Orphaned registry entry from ${programName}`
      })
    }
  }

  // Step 5: Perform dry-run
  console.log('\nPerforming dry-run...')
  const dryRunResult = await performCleanup(cleanupItems, true)
  console.log(`Would delete: ${dryRunResult.wouldDeleteCount} items`)
  console.log(`Would free: ${formatBytes(dryRunResult.wouldFreeSize)}`)

  // Step 6: Get user confirmation
  const userConfirmed = await getUserConfirmation(dryRunResult)
  
  if (!userConfirmed) {
    console.log('Cleanup cancelled by user')
    return
  }

  // Step 7: Perform actual cleanup
  console.log('Performing cleanup...')
  const cleanupResult = await performCleanup(cleanupItems, false)
  
  console.log(`\nCleanup Results:`)
  console.log(`Files deleted: ${cleanupResult.filesDeleted.deletedCount}`)
  console.log(`Registry entries deleted: ${cleanupResult.registryDeleted.deletedCount}`)
  console.log(`Total space freed: ${formatBytes(cleanupResult.filesDeleted.freedSize)}`)
  
  if (cleanupResult.requiresReboot) {
    console.log('Reboot required to complete cleanup')
  }

  if (cleanupResult.backupInfo) {
    console.log(`Backup created: ${cleanupResult.backupInfo.id}`)
    console.log(`Backup expires: ${cleanupResult.backupInfo.expiresAt}`)
  }
}

// ============================================================================
// EXAMPLE 2: Scan for specific program orphans
// ============================================================================

async function scanSpecificProgram(programName: string) {
  console.log(`Scanning for ${programName} orphans...`)
  const scanResult = await scanForOrphans([programName])
  
  if (scanResult.orphanedFiles.length === 0 && 
      scanResult.orphanedRegistry.length === 0) {
    console.log(`No orphans found for ${programName}`)
    return
  }

  console.log(`Found ${scanResult.orphanedFiles.length} files and ` +
    `${scanResult.orphanedRegistry.length} registry entries`)
  
  for (const file of scanResult.orphanedFiles.slice(0, 10)) {
    console.log(`  File: ${file.path} (${formatBytes(file.size)})`)
  }

  for (const reg of scanResult.orphanedRegistry.slice(0, 10)) {
    console.log(`  Registry: ${reg.path}\\${reg.valueName}`)
  }
}

// ============================================================================
// EXAMPLE 3: Dry-run before cleanup
// ============================================================================

async function previewCleanup(programs: string[]) {
  // Scan specified programs
  const scanResult = await scanForOrphans(programs)
  
  // Analyze
  const whitelist = loadWhitelist()
  const analysis = analyzeOrphans(scanResult, whitelist)

  // Select low-risk items only
  const safeItems = Array.from(analysis.categorizedOrphans.values())
    .filter(cat => cat.riskLevel === 'low')
    .flatMap(cat => [
      ...cat.files.map(f => ({
        type: 'file' as const,
        path: f.path,
        size: f.size,
        riskLevel: 'low' as const
      })),
      ...cat.registryEntries.map(r => ({
        type: 'registry' as const,
        path: r.path,
        riskLevel: 'low' as const
      }))
    ])

  // Dry-run
  const preview = await performCleanup(safeItems as any, true)
  console.log(`Preview: Would delete ${preview.wouldDeleteCount} items`)
  console.log(`Would free: ${formatBytes(preview.wouldFreeSize)}`)
}

// ============================================================================
// EXAMPLE 4: Restore from backup
// ============================================================================

async function restoreFromBackup(backupId: string) {
  console.log(`Restoring backup ${backupId}...`)
  
  const backup = await getBackupInfo(backupId)
  if (!backup) {
    console.log('Backup not found')
    return
  }

  console.log(`Backup created: ${backup.createdAt}`)
  console.log(`Items in backup: ${backup.itemsBackedUp}`)
  console.log(`Total size: ${formatBytes(backup.totalSize)}`)

  const success = await restoreBackup(backupId)
  if (success) {
    console.log('Restore completed successfully')
  } else {
    console.log('Restore failed - some items could not be restored')
  }
}
```

## Correctness Properties

**Property 1: Deletion Idempotence**
```typescript
∀ items: CleanupItem[], 
  cleanup(items, false).deletedCount = cleanup(cleanup(items, false), false).deletedCount
```
Explanation: Running cleanup twice on the same items should produce the same deleted count the second time (most already deleted).

**Property 2: Whitelist Safety**
```typescript
∀ items: FileSystemEntry[], whitelist: Whitelist,
  ¬(∃ item ∈ items : isWhitelisted(item.path, whitelist) ∧ item.selected = true)
```
Explanation: No whitelisted item can ever be marked as selected for deletion.

**Property 3: Match Score Bounds**
```typescript
∀ file: FileSystemEntry, programs: InstalledProgram[],
  0 ≤ matchFileToProgram(file, programs).matchScore ≤ 100
```
Explanation: Match scores always stay within valid range (0-100).

**Property 4: Risk Level Monotonicity**
```typescript
∀ file: FileSystemEntry,
  file.isSystemFile = true ⟹ calculateRiskScore(file) > 40
```
Explanation: System files always get marked with at least medium risk.

**Property 5: Backup Completeness**
```typescript
∀ items: CleanupItem[], backup: BackupInfo,
  (∃ backup : createBackup(items)) ⟹ 
  (canRestoreAllItems(backup) = true)
```
Explanation: All backed-up items can be completely restored.

**Property 6: Size Calculation Accuracy**
```typescript
∀ items: CleanupItem[],
  sum(items[i].size) = cleanup(items, false).filesDeleted.freedSize
```
Explanation: Total freed space equals sum of individual file sizes.

**Property 7: Registry Entry Uniqueness**
```typescript
∀ entries: RegistryEntry[],
  ¬(∃ i, j : i ≠ j ∧ entries[i].hive = entries[j].hive ∧ 
    entries[i].path = entries[j].path ∧ entries[i].valueName = entries[j].valueName)
```
Explanation: No duplicate registry entries exist in scan results.

**Property 8: Match Confidence Correlation**
```typescript
∀ file: FileSystemEntry, program: InstalledProgram,
  containsInPath(file.path, program.name) ⟹ 
  matchFileToProgram(file, [program]).matchScore > 
  matchFileToProgram(file, []).matchScore
```
Explanation: Path-based match scoring improves with more specific program data.
