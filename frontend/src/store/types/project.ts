export interface ProjectTempData {
  title: string;
  description: string;
  serverUrl: string;
  requirementSpec: FileWithContent[];
  erd: FileWithContent[];
  utilityClass: FileWithContent[];
  codeConvention: FileWithContent[];
  dependencyFile: FileWithContent[]; // 업로드한 파일 리스트
  dependencyFiles?: { name: string; content: string; source?: string }; // Spring 메타데이터 (단일 객체)
  dependencySelections: string[];
  errorCode: FileWithContent[];
  architectureStructure:
    | {
        type: 'selection';
        selection: SelectionValue;
      }
    | {
        type: 'file';
        files: FileWithContent[];
      };
  securitySetting:
    | {
        type: 'selection';
        selection: SelectionValue;
      }
    | {
        type: 'file';
        files: FileWithContent[];
      };
}

export interface FileWithContent {
  name: string;
  content: string;
  isGitHub?: boolean;
  source?: string;
}

export interface SelectionValue {
  type: string;
  label: string;
  imageUrl?: string;
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
  imageUrl?: string;
}
