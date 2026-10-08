export interface FileInfo {
  originalName: string;
  extra?: string[];
  [key: string]: any;
}

export interface QueueItem {
  name: string;
  slug: string;
  url: string;
  filesInfo: {
    desktop?: FileInfo[];
    mobile?: FileInfo[];
  };
}
