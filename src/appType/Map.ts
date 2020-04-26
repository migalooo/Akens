// @ts-ignore
import PIXI  from 'PIXI'
import Observe from './Observe'
import {Options, Coordinate, TileStore, Mount, Size} from './interfaces'
import {PixiStage, PixiGraphics, PixiDisplayObjectContainer} from './PixiInterfaces'

import {throttle, debounce} from './tools'
import {PAN_DIRECTION_LEFT, PAN_DIRECTION_RIGHT} from './consts'

export default class Map {
  private readonly options: Options
  private readonly observe: Observe
  private readonly canvasSize: Size 

  private readonly tileStore: TileStore = {}

  public  zoom: number
  public  currentZoom: number
  public  zoomLevel: number

  public   center: Coordinate = {x: 0, y: 0}
  public   targetCenter: Coordinate = {x: 0, y: 0}
  public  followMouse: boolean = false

  public  panSpeed: number
  public  panDirection: number

  public  tileLoadingCounter: number = 0

  public  loadMap: Function
  public  loadMapMedium: Function
  public  loadMapSlow: Function
  public  loadMapDebounced: Function

  public  mapCollections: PixiDisplayObjectContainer[] = []
  public  mapContainer: PixiDisplayObjectContainer
  private mapContainerZoomLevels: PixiDisplayObjectContainer
  public  mapContainerBackground: PixiDisplayObjectContainer

  constructor(options: Options, stage: PixiStage, observe: Observe, mount: Mount){
    this.observe = observe
    this.options = options
    this.canvasSize = mount.canvasSize

    this.zoom = options.defaultZoom
    this.currentZoom = options.defaultZoom 
    this.zoomLevel = Math.floor(Math.round(this.currentZoom*10)/10)


    const coordinate = options.center || {x: options.imageSize.width/2, y: options.imageSize.height/2}
    this.center.x = coordinate.x
    this.center.y = coordinate.y
    this.targetCenter.x = coordinate.x
    this.targetCenter.y = coordinate.y

    this.panSpeed = options.panSpeed
    this.panDirection = PAN_DIRECTION_RIGHT

    this.initMapLoaders()
    this.initContainer(stage)
    this.preLoadTiles()
    this.bindEvents()
  }

  initContainer(stage: PixiStage) {
    const {maxZoom, minZoom, imageSize, maxTileZoom, tileSize} = this.options

    this.mapContainer = new PIXI.DisplayObjectContainer()
    this.mapContainer.interactive = true
    this.mapContainerZoomLevels = new PIXI.DisplayObjectContainer()
    this.mapContainerBackground = new PIXI.DisplayObjectContainer()

    let graphics: PixiGraphics = new PIXI.Graphics()
      // .beginFill(this.options.background)
      .drawRect(0, 0, imageSize.width, imageSize.height)
      .endFill()

    graphics.position.x = 0
    graphics.position.y = 0

    this.mapContainerBackground.addChild(graphics)
    this.mapContainerBackground.scale.x = this.mapContainerBackground.scale.y = 1 / Math.pow(2, this.currentZoom - 1)
    this.mapContainer.addChild(this.mapContainerBackground);

    for (let i = maxZoom; i >= minZoom; i--) {
      this.mapCollections[i] = new PIXI.DisplayObjectContainer()
      this.mapCollections[i].visible = true;
      // Scale the containers
      this.mapCollections[i].scale.x = this.mapCollections[i].scale.y = 1 / Math.pow(2, this.currentZoom - i)
      this.mapContainerZoomLevels.addChild(this.mapCollections[i])
    }

    this.mapContainer.addChild(this.mapContainerZoomLevels)

    stage.addChild(this.mapContainer)
  }
  private bindEvents() {
    const observe = this.observe

    const allTilesLoadedHandler = () => {
      this.loadMap()
      observe.off('allTilesLoaded', allTilesLoadedHandler);
    }
    observe.on('allTilesLoaded', allTilesLoadedHandler)
  }
  
  private preLoadTiles() {
    const {tileSize, maxTileZoom, imageSize} = this.options
    // Preload all tiles in top layer
    const scaleFactor = Math.pow(2, maxTileZoom - 1)
    const maxAvailableXTile = Math.floor((imageSize.width / scaleFactor - 1) / tileSize) * tileSize
    const maxAvailableYTile = Math.floor((imageSize.height/ scaleFactor - 1) / tileSize) * tileSize

    for (let x = 0; x <= maxAvailableXTile; x+=tileSize) {
      for (let y = 0; y <= maxAvailableYTile; y+=tileSize) {
        this.addTile(x, y, maxTileZoom);
      }
    }
  }

  private mapLoader() {
    const {tileSize, maxTileZoom, minTileZoom, imageSize} = this.options

    const currentZoom = Math.floor(Math.max(Math.min(this.currentZoom, maxTileZoom), minTileZoom)*10) / 10
    // place current zoom level at top of containers children
    if (Math.floor(currentZoom) !== this.zoomLevel) {
      // Loading a new zoom level
      console.log("Load a new zoom level!")
      this.zoomLevel = Math.floor(Math.round(this.currentZoom*10)/10)
      this.mapContainerZoomLevels.removeChild(this.mapCollections[this.zoomLevel])
      this.mapContainerZoomLevels.addChild(this.mapCollections[this.zoomLevel])
    }

    if (console.groupCollapsed) {
      console.groupCollapsed("TiledImageViewer.loadMap")
    }

    console.log("Find out which tiles are needed")
    console.log("Full Dimensions of the map:", imageSize.width, imageSize.height)
    console.log("Current zoom:", currentZoom)
    console.log("Zoom level:", this.zoomLevel)

    const mapDimensions = this.getMapSizeForZoom(imageSize.width, imageSize.height, this.zoomLevel)
    const zoomDiff   = currentZoom - this.zoomLevel
    const map_width  = mapDimensions.width
    const map_height = mapDimensions.height
    const pos_x      = this.mapContainer.position.x * -1   * Math.pow(2, zoomDiff)
    const pos_y      = this.mapContainer.position.y * -1   * Math.pow(2, zoomDiff)
    const w          = this.canvasSize.width * Math.pow(2, zoomDiff)
    const h          = this.canvasSize.height * Math.pow(2, zoomDiff)

    console.log("Zoom difference:", zoomDiff)
    console.log("Closest zoomed dimensions of the map:", map_width, map_height)
    console.log("Current part of map visible:", pos_x, pos_y)

    const startPointX = Math.floor(pos_x / tileSize) * tileSize
    const startPointY = Math.floor(pos_y / tileSize) * tileSize

    const endPointX = Math.floor((pos_x + w) / tileSize) * tileSize + tileSize
    const endPointY = Math.floor((pos_y + h) / tileSize) * tileSize + tileSize

    console.log(startPointX, endPointX)
    console.log(startPointY, endPointY)

    const maxAvailableXTile = Math.floor((map_width - 1) / tileSize) * tileSize
    const maxAvailableYTile = Math.floor((map_height - 1) / tileSize) * tileSize

    console.log("Max available tiles: ", maxAvailableXTile, maxAvailableYTile)

    const maxXTile = Math.min(maxAvailableXTile, endPointX)
    const maxYTile = Math.min(maxAvailableYTile, endPointY)

    console.log("Load X tiles from", startPointX, maxXTile)
    console.log("Load Y tiles from", startPointY, maxYTile)

    let added = 0, removed = 0

    for (let x = 0; x <= maxAvailableXTile; x+=tileSize) {
      for (let y = 0; y <= maxAvailableYTile; y+=tileSize) {

        if (startPointX <= x && x <= endPointX &&
            startPointY <= y && y <= endPointY)
        {
          if (this.addTile(x, y, this.zoomLevel)) {
            added++
          }
        } else {
          if (this.hideTile(x, y, this.zoomLevel)) {
            removed++
          }
        }

      }
    }

    // add next tiles outside of visible area
    for (let x = Math.max(0, startPointX - tileSize); x <= Math.min(maxAvailableXTile, endPointX + tileSize); x+=tileSize) {
      for (let y = Math.max(0, startPointY - tileSize); y <= Math.min(maxAvailableYTile, endPointY + tileSize); y+=tileSize) {

        if (startPointX > x || x > endPointX &&
            startPointY > y || y > endPointY)
        {
          if (this.addTile(x, y, this.zoomLevel)) {
            added++
          }
        }

      }
    }

    console.log("Added", added, "tiles");

    if (added === 0) {
      console.log('No added tiles for this view, hide layers');
      this.hideZoomLayers()
    }

    if (console.groupEnd) {
      console.groupEnd()
    }

  }

  // Get map size in viewport
  private getMapSizeForZoom(imageW: number, imageH: number, zoomLevel: number): Size {
    const map_width  = Math.ceil(imageW / Math.pow(2, zoomLevel-1))
    const map_height = Math.ceil(imageH / Math.pow(2, zoomLevel-1))

    return {width: map_width, height: map_height}
  }

  private addTile(tileX: number, tileY: number, zoomLevel: number): boolean {
    const mapContainer = this.mapCollections[zoomLevel]
    const tileName = `${zoomLevel}_${tileX}_${tileY}`

    if (typeof this.tileStore[tileName] !== 'undefined') {
      console.log('Show existing sprite')

      this.tileStore[tileName].visible = true
      return false
    } else {
      this.showAllZoomLayers()
      this.tileLoadingCounter++

      const src = this.options.tilePath + zoomLevel + "/tile_"+tileX+"_"+tileY+".jpg"
      console.log('Loading', src)

      this.imageLoader(src, true)
        .then(texture => {
          this.tileStore[tileName] = this.addSpriteToMap(tileX, tileY, texture, mapContainer)
          if (--this.tileLoadingCounter === 0) {
            console.log("All tiles loaded, hiding other zoom levels");
            this.observe.emit('allTilesLoaded')
            this.hideZoomLayers()
          }
        })
        .catch(err => {
          throw err
        })
      return true
    }
  }

  private hideTile(x: number, y: number, zoomLevel: number): boolean {
    if (typeof this.tileStore[zoomLevel + '_' + x + '_' + y] !== 'undefined') {
      console.log('Hide existing sprite')
      this.tileStore[zoomLevel + '_' + x + '_' + y].visible = false
      return true
    }
    return false
  }

  private imageLoader (src: string, crossOrigin: boolean) {
    return new Promise(function(resolve, reject){
      const loader = new PIXI.ImageLoader(src, crossOrigin)
      loader.onLoaded = function(ctx) {
        resolve(this.texture)
      }
      loader.load()
    })
  }

  public showAllZoomLayers() {
    const {minTileZoom, maxTileZoom} = this.options
    for (let i = minTileZoom; i <= maxTileZoom; i++) {
      this.mapCollections[i].visible = true
    }
  }

  private hideZoomLayers() {
    const {minTileZoom, maxTileZoom} = this.options
    for (let i = minTileZoom; i <= maxTileZoom; i++) {
      if (i !== this.zoomLevel) {
        this.mapCollections[i].visible = false
      }
    }
    this.mapCollections[this.zoomLevel].visible = true
  }

  addSpriteToMap (x: number, y: number, texture: object | unknown, mapContainer: PixiDisplayObjectContainer): PixiGraphics {
    const sprite: PixiGraphics = new PIXI.Sprite(texture);
    sprite.anchor.x = sprite.anchor.y = 0
    sprite.position.x = x
    sprite.position.y = y
    sprite.visible = true

    mapContainer.addChild(sprite)
    return sprite
  }


  private initMapLoaders() {
    this.loadMap          = throttle(this.mapLoader, 250)
    this.loadMapMedium    = throttle(this.mapLoader, 1250)
    this.loadMapSlow      = throttle(this.mapLoader, 3000)
    this.loadMapDebounced = debounce(this.mapLoader, 250)
  }

  public setFollowMouse(bool: boolean) {
    if (this.followMouse === bool) return
    this.followMouse = bool
  }
  public setZoom(value: number) {
    if (this.zoom === value) return
    this.zoom = value 
  }
  public setCurrentZoom(value: number) {
    if (this.currentZoom === value) return
    this.currentZoom = value 
  }
  public setZoomLevel(value: number) {
    if (this.zoomLevel === value) return
    this.zoomLevel = value 
  }
  public setCenter(coordinate: Coordinate) {
    if (coordinate.x === this.center.x && coordinate.y === this.center.y) return
    this.center.x = coordinate.x
    this.center.y = coordinate.y
    this.targetCenter.x = coordinate.x
    this.targetCenter.y = coordinate.y
    this.observe.emit('updatePosition')
    this.loadMap()
  }
  public setCenterCoordinate(axis: 'x' | 'y', value: number) {
    if (this.center[axis] === value) return
    this.center[axis] = value 
  }
  public setTargetCenterCoordinate(axis: 'x' | 'y', value: number) {
    if (this.targetCenter[axis] === value) return
    this.targetCenter[axis] = value 
  }
  public setMapContainerCoordinate(axis: 'x' | 'y', value: number) {
    this.mapContainer.position[axis] = value
  }
  public setPanSpeed(value: number) {
    if(this.panSpeed === value) return
    this.panSpeed = value
  }
  public setPanDirection(direction: 'left' | 'right') {
    // PAN_DIRECTION_RIGHT: 1 PAN_DIRECTION_LEFT: -1
    this.panDirection = direction === 'right' ?  1 : -1
  }
}
