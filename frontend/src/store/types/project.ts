export interface ProjectTempData {
  title: string;
  description: string;
  serverUrl: string;
  requirementSpec: FileData[];
  erd: FileData[];
  utilityClass: FileData[];
  codeConvention: FileData[];
  dependencyFile: FileData[];
  errorCode: FileData[];
  architectureStructure: FileData[] | SelectionValue;
  securitySetting: FileData[] | SelectionValue;
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