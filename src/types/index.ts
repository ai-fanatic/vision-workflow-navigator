// Types for Vision-to-Workflow Navigator

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UIElement {
  id: string;
  tag: string;
  text: string;
  boundingBox: BoundingBox;
  selector?: string;
  clickable?: boolean;
  inputable?: boolean;
}

export interface Action {
  id: string;
  type: 'click' | 'type' | 'select' | 'wait' | 'navigate' | 'scroll';
  target?: UIElement;
  value?: string;
  description: string;
  order: number;
  status: 'pending' | 'analyzing' | 'ready' | 'executing' | 'completed' | 'failed';
  reason?: string;
}

export interface ExecutionLog {
  timestamp: string;
  action: string;
  status: 'success' | 'error' | 'info';
  details?: string;
}

export interface Artifact {
  type: 'screenshot' | 'playwright-script' | 'run-log' | 'summary';
  content: string;
  filename?: string;
}

export interface AgentState {
  status: 'idle' | 'listening' | 'analyzing' | 'planning' | 'executing' | 'completed' | 'error';
  goal?: string;
  actions: Action[];
  logs: ExecutionLog[];
  artifacts: Artifact[];
  currentStep?: number;
  error?: string;
}

export interface ScreenCapture {
  imageData: string;
  timestamp: number;
  elements?: UIElement[];
}

// Demo site configuration
export const DEMO_SITE = 'https://demo.playwright.dev/todomvc';
