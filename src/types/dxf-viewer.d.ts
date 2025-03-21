declare module 'dxf-viewer' {
  import * as THREE from 'three';

  export class DxfViewer {
    constructor(container: HTMLElement, options?: Record<string, any>);
    
    Load(params: DxfViewerLoadParams): Promise<void>;
    Destroy(): void;
    Clear(): void;
    GetLayers(sort?: boolean): { name: string, color: number, isVisible: boolean, displayName: string }[];
    ShowLayer(name: string, show: boolean): void;
    Subscribe(eventName: string, callback: (e: any) => void): void;
    
    static SetupWorker(): void;
  }

  export interface DxfViewerLoadParams {
    url: string;
    fonts?: string[];
    progressCbk?: (phase: string, size: number, totalSize: number | null) => void;
    workerFactory?: () => Worker;
  }

  export enum MessageLevel {
    INFO,
    WARN,
    ERROR
  }
} 