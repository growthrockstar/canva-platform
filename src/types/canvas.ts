export type WidgetType = 'text_block' | 'accordion' | 'table' | 'image_base64';

export interface Widget {
  id: string;
  type: WidgetType;
  content?: string; // HTML content for text
  src?: string; // Base64 for images
  title?: string; // For accordion
  children?: Widget[]; // For accordion
  tableData?: string[][]; // For tables
}

export interface SyllabusSection {
  id: string;
  title: string;
  is_completed: boolean;
  widgets: Widget[];
}

export interface ProjectMeta {
  version: string;
  last_modified: string;
  theme: string;
}

export interface ProjectInfo {
  title: string;
  student_name: string;
}

export interface ProjectState {
  meta: ProjectMeta;
  project: ProjectInfo;
  syllabus_sections: SyllabusSection[];
}
