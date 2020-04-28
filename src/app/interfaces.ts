import {PixiGraphics} from './PixiInterfaces'

export interface Options {
  readonly imageSize: {
    readonly width: number
    readonly height: number
  }
  readonly dpr: number,
  readonly maxTileZoom: number,
  readonly minTileZoom: number,
  readonly maxZoom: number,
  readonly minZoom: number,
  readonly defaultZoom: number,
  readonly tileSize: number,
  readonly tilePath: string,
  readonly background: number,
  readonly panSpeed: number,
  readonly center?: Coordinate
}

export interface Mount {
  el: HTMLElement
  canvasSize: Size
  mouseMovingCoordinate: Coordinate
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

export interface Snapshot {
  center: Coordinate
  position: Coordinate
  distance: number
  zoom: number
}

export interface MovePath extends Coordinate {
  time: number 
} 
