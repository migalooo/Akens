import {PixiGraphics} from './PixiInterfaces'

export interface Options {
  readonly imageH: number,
  readonly imageW: number,
  readonly maxTileZoom: number,
  readonly minTileZoom: number,
  readonly maxZoom: number,
  readonly minZoom: number,
  readonly defaultZoom: number,
  readonly tileSize: number,
  readonly tilePath: string,
  readonly dpr: number,
  readonly background: number,
  readonly panSpeed: number,
  readonly center?: Coordinate
}

export interface Mount {
  // el: HTMLElement
  canvasSize: Size
  mouseCoordinate: Coordinate
  lastAnimTime: number
  lastAnimTimeDelta: number
}

export interface Size {
  width: number
  height: number
}

export interface Coordinate {
  x: number
  y: number
}

export interface TileStore {
  [key: string]: PixiGraphics
}
