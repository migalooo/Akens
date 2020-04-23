export interface Options {
  width: number,
  height: number,
  maxTileZoom: number,
  minTileZoom: number,
  maxZoom: number,
  minZoom: number,
  defaultZoom: number,
  tileSize: number,
  tilePath: string,
  dpr: number,
  background: number,
  panSpeed: number 
}

export interface Mount {
  el: HTMLElement
  size: {
    canvasH: number
    canvasW: number
  } 
  mouseCoordinate: Coordinate
}

export interface Coordinate {
  x: number
  y: number
}
