export interface PixiRender {
  view: HTMLCanvasElement
  render: (stage: PixiStage) => {}
  resize: (width: number, height: number) => {}
} 

export interface PixiStage {
  addChild: (mapContainer) => {}
} 

export interface PixiDisplayObjectContainer {
  position: {
    x: number
    y: number
  } 
  scale: {
    x: number
    y: number
  } 
  visible: boolean
  interactive: boolean
  addChild: (sprite: PixiDisplayObjectContainer | PixiGraphics) => {}
  removeChild: (container: PixiDisplayObjectContainer | PixiGraphics) => {}
} 

export interface PixiGraphics {
  position: {
    x: number
    y: number
  } 
  anchor: {
    x: number
    y: number
  }
  visible: boolean
  drawRect: (originX: number, originY: number, imageW: number, imageH:number) => {}
} 

