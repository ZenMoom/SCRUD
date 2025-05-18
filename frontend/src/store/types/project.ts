export interface ProjectTempData {
  title: string;
  description: string;
  serverUrl: string;
  requirementSpec: FileData[];
  erd: FileData[];
  utilityClass: FileData[];
  codeConvention: FileData[];
  dependencyFile: FileData[];
  dependencySelections: string[];
  errorCode: FileData[];
  architectureStructure: ArchitectureSettingData;
  securitySetting: SecuritySettingData;
}

export interface FileData {
  name?: string;
  fileName?: string;
  content: string | Record<string, unknown>;
  isGitHub?: boolean;
  path?: string;
  fileType?: string;
}

export interface SelectionValue {
  type: string;
  label: string;
  name?: string;
  content?: string;
}

export interface SecuritySettingData {
  type: 'selection' | 'file';
  selection?: SelectionValue;
  files?: FileData[];
}

export interface ArchitectureSettingData {
  type: 'selection' | 'file';
  selection?: ArchitectureOption;
  files?: FileData[];
}

export interface ArchitectureOption {
  type: string;
  label: string;
  imageUrl: string;
} 