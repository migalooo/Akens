import PIXI  from 'PIXI'
import {throttle, debounce} from './tools'
import consts from './consts'
const {PAN_DIRECTION_LEFT, PAN_DIRECTION_RIGHT}  = consts

export default class Map {
  constructor(config, stage, observe, events){
    this.observe = observe
    this.config = config

    this.size = events.size 
   

    this.zoom = config.defaultZoom
    this.currentZoom = config.defaultZoom 
    this.zoomLevel = Math.floor(Math.round(this.currentZoom*10)/10)


    const coordinate = config.center || {x: config.width/2, y: config.height/2}
    this.center = coordinate
    this.targetCenter = coordinate

    this.dpr = config.dpr

    this.followMouse = false

    this.panSpeed = config.panSpeed
    this.panDirection = PAN_DIRECTION_RIGHT

    this.tiles = {}
    this.tileLoadingCounter = 0

    this.initMapLoaders()

    this.initContainer(stage)
    this.preLoadTiles()

    this.initEvents()

  }

  initContainer(stage) {
    const {maxZoom, minZoom, width, height, maxTileZoom, tileSize} = this.config

    this.mapContainerZoom = []
    this.mapContainer = new PIXI.DisplayObjectContainer()
    this.mapContainerZoomLevels = new PIXI.DisplayObjectContainer()
    this.mapContainer.interactive = true
    this.mapContainerBackground = new PIXI.DisplayObjectContainer()

    let box = new PIXI.Graphics()
      // .beginFill(background)
      .drawRect(0, 0, width, height)
      .endFill()

    box.position.x = 0
    box.position.y = 0

    this.mapContainerBackground.addChild(box)
    this.mapContainerBackground.scale.x = this.mapContainerBackground.scale.y = 1 / Math.pow(2, this.currentZoom - 1)
    this.mapContainer.addChild(this.mapContainerBackground);

    for (let i = maxZoom; i >= minZoom; i--) {
      this.mapContainerZoom[i] = new PIXI.DisplayObjectContainer()
      this.mapContainerZoom[i].visible = true;
      // Scale the containers
      this.mapContainerZoom[i].scale.x = this.mapContainerZoom[i].scale.y = 1 / Math.pow(2, this.currentZoom - i)
      this.mapContainerZoomLevels.addChild(this.mapContainerZoom[i])
    }

    this.mapContainer.addChild(this.mapContainerZoomLevels)

    stage.addChild(this.mapContainer)
  }
  initEvents() {
    const observe = this.observe

    const allTilesLoadedHandler = () => {
      this.loadMap()
      observe.off('allTilesLoaded', allTilesLoadedHandler);
    }
    observe.on('allTilesLoaded', allTilesLoadedHandler)
  }
  
  preLoadTiles() {
    const {tileSize, maxTileZoom, width, height} = this.config
    // Preload all tiles in top layer
    const scaleFactor = Math.pow(2, maxTileZoom - 1)
    const maxAvailableXTile = Math.floor((width  / scaleFactor - 1) / tileSize) * tileSize
    const maxAvailableYTile = Math.floor((height / scaleFactor - 1) / tileSize) * tileSize

    for (let x = 0; x <= maxAvailableXTile; x+=tileSize) {
      for (let y = 0; y <= maxAvailableYTile; y+=tileSize) {
        this.addTile(x, y, maxTileZoom);
      }
    }
  }

  mapLoader() {
    const {tileSize, maxTileZoom, minTileZoom, width, height} = this.config

    const currentZoom = Math.floor(Math.max(Math.min(this.currentZoom, maxTileZoom), minTileZoom)*10) / 10

    // place current zoom level at top of containers children
    if (Math.floor(currentZoom) !== this.zoomLevel) {
      // Loading a new zoom level
      console.log("Load a new zoom level!")
      this.zoomLevel = Math.floor(Math.round(this.currentZoom*10)/10)
      this.mapContainerZoomLevels.removeChild(this.mapContainerZoom[this.zoomLevel])
      this.mapContainerZoomLevels.addChild(this.mapContainerZoom[this.zoomLevel])
    }

    if (console.groupCollapsed) {
      console.groupCollapsed("TiledImageViewer.loadMap")
    }

    console.log("Find out which tiles are needed")
    console.log("Dimensions of the map:", width, height)
    console.log("Current zoom:", currentZoom)
    console.log("Zoom level:", this.zoomLevel)

    const mapDimensions = this.getMapSizeForZoom(width, height, this.zoomLevel)
    const zoomDiff   = currentZoom - this.zoomLevel
    const map_width  = mapDimensions.width
    const map_height = mapDimensions.height
    const pos_x      = this.mapContainer.position.x * -1   * Math.pow(2, zoomDiff)
    const pos_y      = this.mapContainer.position.y * -1   * Math.pow(2, zoomDiff)
    const w          = this.size.canvasW                   * Math.pow(2, zoomDiff)
    const h          = this.size.canvasH                  * Math.pow(2, zoomDiff)

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
  //public
  getMapSizeForZoom(width, height, zoomLevel) {
    const map_width  = Math.ceil(width / Math.pow(2, zoomLevel-1))
    const map_height = Math.ceil(height / Math.pow(2, zoomLevel-1))

    return {width: map_width, height: map_height}
  }

  addTile(tileX,tileY, zoomLevel) {
    const mapContainer = this.mapContainerZoom[zoomLevel]
    const tileName = `${zoomLevel}_${tileX}_${tileY}`

    if (typeof this.tiles[tileName] !== 'undefined') {
      console.log('Show existing sprite')

      this.tiles[tileName].visible = true
      return false
    } else {
      this.showAllZoomLayers()
      this.tileLoadingCounter++

      const src = this.config.tilePath + zoomLevel + "/tile_"+tileX+"_"+tileY+".jpg"
      console.log('Loading', src)

      this.imageLoader(src, true)
        .then(texture => {
          this.tiles[tileName] = this.addSpriteToMap(tileX, tileY, texture, mapContainer)
          if (--this.tileLoadingCounter === 0) {
            console.log("All tiles loaded, hiding other zoom levels");
            this.observe.trigger('allTilesLoaded')
            this.hideZoomLayers()
          }
        })
        .catch(err => {
          throw err
        })
      return true
    }
  }

  hideTile(x, y, zoomLevel) {
    if (typeof this.tiles[zoomLevel + '_' + x + '_' + y] !== 'undefined') {
      console.log('Hide existing sprite')
      this.tiles[zoomLevel + '_' + x + '_' + y].visible = false
      return true
    }
    return false
  }

  imageLoader (src, crossOrigin) {
    return new Promise(function(resolve, reject){
      const loader = new PIXI.ImageLoader(src, crossOrigin)
      loader.onLoaded = function(ctx) {
        resolve(this.texture)
      }
      loader.load()
    })
  }

  showAllZoomLayers() {
    const {minTileZoom, maxTileZoom} = this.config
    for (let i = minTileZoom; i <= maxTileZoom; i++) {
      this.mapContainerZoom[i].visible = true
    }
  }

  hideZoomLayers() {
    const {minTileZoom, maxTileZoom} = this.config
    for (let i = minTileZoom; i <= maxTileZoom; i++) {
      if (i !== this.zoomLevel) {
        this.mapContainerZoom[i].visible = false
      }
    }
    this.mapContainerZoom[this.zoomLevel].visible = true
  }

  addSpriteToMap (x, y, texture, mapContainer) {
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.x = sprite.anchor.y = 0
    sprite.position.x = x
    sprite.position.y = y
    sprite.visible = true

    mapContainer.addChild(sprite)
    return sprite
  }


  initMapLoaders() {
    this.loadMap          = throttle(this.mapLoader, 250)
    this.loadMapMedium    = throttle(this.mapLoader, 1250)
    this.loadMapSlow      = throttle(this.mapLoader, 3000)
    this.loadMapDebounced = debounce(this.mapLoader, 250)
  }

  // public
  setFollowMouse(bool) {
    if (this.followMouse === bool) return
    this.followMouse = bool
  }
  setZoom(value) {
    if (this.zoom === value) return
    this.zoom = value 
  }
  setCurrentZoom(value) {
    if (this.currentZoom === value) return
    this.currentZoom = value 
  }
  setZoomLevel(value) {
    if (this.zoomLevel === value) return
    this.zoomLevel = value 
  }
  setCenter(coordinate) {
    const center = this.center
    if (coordinate.x === center.x && coordinate.y === center.y) return
    this.center = this.targetCenter = coordinate
    this.observe.trigger('updatePosition')
    this.loadMap()
  }
  setCenterCoordinate(axis, value) {
    if (this.center[axis] === value) return
    this.center[axis] = value 
  }
  setTargetCenter(coordinate) {
    if (coordinate.x === this.targetCenter.x && coordinate.y === this.targetCenter.y) return
    this.targetCenter = coordinate 
  }
  setTargetCenterCoordinate(axis, value) {
    if (this.targetCenter[axis] === value) return
    this.targetCenter[axis] = value 
  }
  setMapContainerCoordinate(axis, value) {
    this.mapContainer.position[axis] = value
  }
  setPanSpeed(value) {
    if(this.panSpeed === value) return
    this.panSpeed = value
  }
  setPanDirection(direction) {
    this.panDirection = direction === 'right' ?  PAN_DIRECTION_RIGHT : PAN_DIRECTION_LEFT
  }
}
