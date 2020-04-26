import Map from './Map'
import Observe from './Observe'

import {Options, Coordinate, Mount, Size} from './interfaces'
import {PixiRender} from './PixiInterfaces'

import { PAN_DIRECTION_LEFT, PAN_DIRECTION_RIGHT } from './consts'
import { zoomDamping, dragDamping, threshold, panStop} from './factor'

export default class Handlers {
  private readonly options: Options
  private readonly map: Map
  private readonly observe: Observe
  private readonly mount: Mount 
  private readonly mouseMovingCoordinate: Coordinate 
  private readonly render: PixiRender

  public  isPanning: boolean = false

  constructor(options: Options, map: Map, observe: Observe, mount: Mount, render: PixiRender){
    this.options = options 
    this.map = map
    this.observe = observe
    this.mount = mount
    this.mouseMovingCoordinate = mount.mouseMovingCoordinate
    this.render = render
    this.bindEvents()
  }

  private bindEvents() {
    const observe = this.observe

    observe.on('beforeRender', this.updateZoom.bind(this))
    observe.on('beforeRender', this.updatePosition.bind(this))
    observe.on('beforeRender', this.updateAutoPan.bind(this))

    observe.on('updatePosition', this.updatePosition.bind(this))
    observe.on('resize', this.resize.bind(this))
    observe.on('stopAutoPan', this.stopAutoPan.bind(this))
    observe.on('setAutoPan', this.autoPan.bind(this))
  }

  private resize() {
    console.log('resize')
    this.render.resize(this.mount.canvasSize.width, this.mount.canvasSize.height)
  }

  public zooming (zoom: number, isFollowMouse: boolean) {
    const map = this.map
    const {minZoom, maxZoom} = this.options 
    const {tileLoadingCounter, zoomLevel} = map

    if (zoom === minZoom || zoom === maxZoom) return

    if      (zoom < minZoom) { zoom = minZoom }
    else if (zoom > maxZoom) { zoom = maxZoom }

    map.setFollowMouse( isFollowMouse)

    if (Math.floor(Math.round(zoom*10)/10) !== zoomLevel && tileLoadingCounter === 0) {
      map.setZoomLevel( Math.floor(Math.round(zoom*10)/10))
      console.log("Zooming with zoom layers hidden, show them all")
      map.showAllZoomLayers()
    }

    map.setZoom( zoom )
  }

  private updateZoom() {
    const map = this.map
    const lastAnimTimeDelta = this.mount.lastAnimTimeDelta
    const {zoom, center, currentZoom, followMouse} = map
    const {minZoom, maxZoom, maxTileZoom, minTileZoom} = this.options 

    if (Math.abs(currentZoom - zoom) > threshold) {

      // Easy zooming
      const zoomDiff = ((zoom - currentZoom) / Math.max(1, zoomDamping * (60 / lastAnimTimeDelta)))

      const zoomScale = Math.pow(2, -zoomDiff)

      if (followMouse) {
        const z = this.containerPixelToCoordinate(this.mouseMovingCoordinate)
        const c1 = center

        const c2 = {
          x: c1.x - (c1.x - z.x) * zoomScale * -zoomDiff * (Math.sqrt(2/zoomScale) / (2*zoomScale)),
          y: c1.y - (c1.y - z.y) * zoomScale * -zoomDiff * (Math.sqrt(2/zoomScale) / (2*zoomScale)),
        }

        // Set center & targetCenter
        map.setCenter(c2)
      }


      const newZoom = currentZoom + zoomDiff
      map.setCurrentZoom(newZoom)
      map.loadMapMedium()

      // Scale the actual containers
      for (let i = minZoom; i <= maxZoom; i++) {
        const newScale = 1 / Math.pow(2, newZoom - i);
        map.mapCollections[i].scale.x = map.mapCollections[i].scale.y = newScale;
      }

      map.mapContainerBackground.scale.x = map.mapContainerBackground.scale.y = 1 / Math.pow(2, newZoom- 1);

      map.mapCollections[Math.max(Math.min(map.zoomLevel, maxTileZoom), minTileZoom)].visible = true;

    }
  }

  private updatePosition () {
    const map = this.map
    const dpr = this.options.dpr
    const { center, targetCenter, currentZoom} = map
    const canvasSize = this.mount.canvasSize

    if (Math.abs(center.x - targetCenter.x) > threshold) {
      const x = center.x + ((targetCenter.x - center.x) / dragDamping)
      map.setCenterCoordinate('x', x)
      map.loadMapMedium()
    }

    if (Math.abs(center.y - targetCenter.y) > threshold) {
      const y = center.y + ((targetCenter.y - center.y) / dragDamping)
      map.setCenterCoordinate('y', y)
      map.loadMapMedium()
    }

    const pos_x = -(center.x / Math.pow(2, currentZoom - 1)) + (canvasSize.width  * dpr) / 2
    const pos_y = -(center.y / Math.pow(2, currentZoom - 1)) + (canvasSize.height * dpr) / 2

    map.setMapContainerCoordinate('x', pos_x) 
    map.setMapContainerCoordinate('y', pos_y) 
  }

  private autoPan(duration: number) {
    const width = this.options.imageSize.width
    const currentZoom = this.map.currentZoom
    // TODO
    // if ((map.getMapSizeForZoom(width, imageH, currentZoom).width - window.innerWidth) < 0) {
    //   // image does not fill window
    //   return
    // }
    const panSpeed = (width - window.innerWidth * this.options.dpr * Math.pow(2, currentZoom - 1)) / duration
    this.map.setPanSpeed(panSpeed)
  }

  private stopAutoPan() {
    this.map.setPanSpeed(0)
  }

  public panTo(coordinate: Coordinate) {
    this.map.setTargetCenterCoordinate('x', coordinate.x)
    this.map.setTargetCenterCoordinate('y', coordinate.y)
  }


  updateAutoPan() {
    const map = this.map

    if (this.isPanning) { // Easing
      if (Math.abs(map.center.x - map.targetCenter.x) <= panStop) {
        this.isPanning = false
      }
      return
    }
    // TODO: direction change err
    if (Math.abs(map.panSpeed) > 0) {
      const lastAnimTimeDelta = this.mount.lastAnimTimeDelta
      const {currentZoom, targetCenter, center, panDirection} = map
      const width = this.options.imageSize.width
      const canvasSize = this.mount.canvasSize

      const p1 = this.containerPixelToCoordinate({x: 0, y: 0})
      const p2 = this.containerPixelToCoordinate({x: canvasSize.width, y: canvasSize.height})


      if (p1.x < 0 && this.map.panDirection === PAN_DIRECTION_LEFT) {
        // Pan right 
        map.setPanDirection('right')
      } 
      else if (p2.x > width && this.map.panDirection === PAN_DIRECTION_RIGHT) {
        // Pan left
        map.setPanDirection('left')
      } else {
        map.setCenterCoordinate('x', targetCenter.x )
        const x = center.x + map.panSpeed*lastAnimTimeDelta*panDirection
        map.setTargetCenterCoordinate('x', x)
        map.loadMapSlow()
      }
    }
  }

  public containerPixelToCoordinate (point: Coordinate) {
    const {currentZoom, mapContainer} = this.map
    const dpr = this.options.dpr

    const x = Math.round(point.x * dpr)
    const y = Math.round(point.y * dpr)

    const realX = (x - mapContainer.position.x) * Math.pow(2, currentZoom-1)
    const realY = (y - mapContainer.position.y) * Math.pow(2, currentZoom-1)

    return {x: realX, y: realY}
  }


  // No use
  public coordinateToContainerPixel (coordinate: Coordinate) {
    const {currentZoom, mapContainer} = this.map
    const dpr = this.options.dpr

    const containerX = (coordinate.x / Math.pow(2, currentZoom-1) + mapContainer.position.x) / dpr
    const containerY = (coordinate.y / Math.pow(2, currentZoom-1) + mapContainer.position.y) / dpr

    return {x: containerX, y: containerY}
  }
}
