export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  source?: string;
  children?: TreeNode[];
}

export interface FileContent {
  success: boolean;
  path?: string;
  language?: string;
  content?: string;
  error?: string;
}

export interface PreviewTreeResponse {
  success: boolean;
  framework: string;
  modules: string[];
  tree: TreeNode;
}
