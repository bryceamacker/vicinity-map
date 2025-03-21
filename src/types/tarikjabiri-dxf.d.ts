declare module '@tarikjabiri/dxf' {
  export class DxfWriter {
    constructor();
    
    setVariable(name: string, value: any): void;
    addLayer(name: string, colorIndex: number): void;
    addLine(start: point3d, end: point3d, options?: any): any;
    addText(position: point3d, height: number, text: string, options?: any): any;
    stringify(): string;
  }

  export class point3d {
    constructor(x: number, y: number, z: number);
  }

  export enum TextHorizontalAlignment {
    Left = 0,
    Center = 1,
    Right = 2,
    Aligned = 3,
    Middle = 4,
    Fit = 5
  }

  export enum TextVerticalAlignment {
    Baseline = 0,
    Bottom = 1,
    Middle = 2,
    Top = 3
  }
} 