export type WidgetType = 'text_block' | 'accordion' | 'table' | 'image_base64' | 'graph_plot';

export interface Widget {
  id: string;
  type: WidgetType;
  content?: string; // HTML content for text
  src?: string; // Base64 for images
  title?: string; // For accordion
  children?: Widget[]; // For accordion
  tableData?: string[][]; // For tables
  graphConfig?: {
    tableId: string;
    chartType: 'bar' | 'line' | 'pie' | 'area';
    xAxisColumn: number;
    dataColumns: number[];
  };
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
  grid_columns?: 1 | 2 | 3;
  dbId?: string; // Database ID for cloud sync
}

export interface ProjectInfo {
  id?: string;
  title: string;
  student_name: string;
}

export interface ProjectState {
  meta: ProjectMeta;
  project: ProjectInfo;
  syllabus_sections: SyllabusSection[];
}
