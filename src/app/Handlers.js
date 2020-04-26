import consts from './consts'
import factor from './factor'
const { PAN_DIRECTION_LEFT, PAN_DIRECTION_RIGHT }  = consts
const { zoomDamping, dragDamping, threshold, panStop} = factor

export default class Handlers {

  constructor(map, observe, events, render){
    this.map = map
    this.observe = observe
    this.size = events.size
    this.mouseCoordinate = events.mouseCoordinate
    this.render = render
    this.bindEvents()
    this.isPanning = false 
  }

  bindEvents() {
    const observe = this.observe

    observe.on('beforeRender', this.updateZoom.bind(this))
    observe.on('beforeRender', this.updatePosition.bind(this))
    observe.on('beforeRender', this.updateAutoPan.bind(this))

    observe.on('updatePosition', this.updatePosition.bind(this))
    observe.on('resize', this.resize.bind(this))
    observe.on('stopAutoPan', this.stopAutoPan.bind(this))
    observe.on('setAutoPan', this.autoPan.bind(this))
  }

  resize() {
    console.log('resize')
    this.render.resize(this.size.canvasW, this.size.canvasH)
  }

  setZoom (zoom, zoomPoint, force) {
    const map = this.map
    const {minZoom, maxZoom} = map.config 
    const {tileLoadingCounter, zoomLevel} = map

    if (zoom === minZoom || zoom === maxZoom) return

    if      (zoom < minZoom) { zoom = minZoom }
    else if (zoom > maxZoom) { zoom = maxZoom }

    map.setFollowMouse( !!zoomPoint )

    if (Math.floor(Math.round(zoom*10)/10) !== zoomLevel && tileLoadingCounter === 0) {
      map.setZoomLevel( Math.floor(Math.round(zoom*10)/10))
      console.log("Zooming with zoom layers hidden, show them all")
      map.showAllZoomLayers()
    }

    map.setZoom( zoom )

    // force is invaluable
    if (force) {
      this.updateZoom('', true)
    }
  }

  updateZoom(time, force) {
    const map = this.map
    const {zoom, center, currentZoom, lastAnimTimeDelta, followMouse} = map
    const {minZoom, maxZoom, maxTileZoom, minTileZoom} = map.config 

    if (Math.abs(currentZoom - zoom) > threshold) {

      let zoomDiff
      if (force) {
        zoomDiff = zoom - currentZoom;
      } else {
        zoomDiff = ((zoom - currentZoom) / Math.max(1, zoomDamping * (60 / lastAnimTimeDelta)))
      }

      const zoomScale = Math.pow(2, -zoomDiff)

      if (followMouse) {
        const z = this.containerPixelToCoordinate(this.mouseCoordinate)
        const c1 = center

        const c2 = {
          x: c1.x - (c1.x - z.x) * zoomScale * -zoomDiff * (Math.sqrt(2/zoomScale) / (2*zoomScale)),
          y: c1.y - (c1.y - z.y) * zoomScale * -zoomDiff * (Math.sqrt(2/zoomScale) / (2*zoomScale)),
        }

        map.setCenter(c2)
      }


      const newZoom = currentZoom + zoomDiff
      map.setCurrentZoom(newZoom)
      map.loadMapMedium()

      // Scale the actual containers
      for (let i = minZoom; i <= maxZoom; i++) {
        const newScale = 1 / Math.pow(2, newZoom - i);
        map.mapContainerZoom[i].scale.x = map.mapContainerZoom[i].scale.y = newScale;
      }

      map.mapContainerBackground.scale.x = map.mapContainerBackground.scale.y = 1 / Math.pow(2, newZoom- 1);

      map.mapContainerZoom[Math.max(Math.min(map.zoomLevel, maxTileZoom), minTileZoom)].visible = true;

    }
  }

  updatePosition (e) {
    const map = this.map
    const { center, targetCenter, currentZoom, dpr} = map
    const size = this.size

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

    const pos_x = -(center.x / Math.pow(2, currentZoom - 1)) + (size.canvasW * dpr) / 2
    const pos_y = -(center.y / Math.pow(2, currentZoom - 1)) + (size.canvasH * dpr) / 2

    map.setMapContainerCoordinate('x', pos_x) 
    map.setMapContainerCoordinate('y', pos_y) 
  }

  autoPan(duration) {
    const width = this.map.config.width
    const {currentZoom, dpr}= this.map

    // TODO
    if ((map.getMapSizeForZoom(currentZoom).width - window.innerWidth) < 0) {
      // image does not fill window
      return
    }
    const panSpeed = (width - window.innerWidth * dpr * Math.pow(2, currentZoom - 1)) / duration
    map.setPanSpeed(panSpeed)
  }

  stopAutoPan() {
    this.map.setPanSpeed(0)
  }

  panTo(coordinate) {
    this.map.setTargetCenter(coordinate)
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
      const {currentZoom, targetCenter, center, lastAnimTimeDelta, panDirection} = map
      const width = this.map.config.width

      const p1 = this.containerPixelToCoordinate({x: 0, y: 0})
      const p2 = this.containerPixelToCoordinate({x: this.size.canvasW, y: this.size.canvasH})


      if (p1.x < 0 && this.panDirection === PAN_DIRECTION_LEFT) {
        // Pan right 
        map.setPanDirection('right')
      } 
      else if (p2.x > width && this.panDirection === PAN_DIRECTION_RIGHT) {
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

  containerPixelToCoordinate (point) {
    const {dpr, currentZoom, mapContainer} = this.map

    const x = Math.round(point.x * dpr)
    const y = Math.round(point.y * dpr)

    const realX = (x - mapContainer.position.x) * Math.pow(2, currentZoom-1)
    const realY = (y - mapContainer.position.y) * Math.pow(2, currentZoom-1)

    return {x: realX, y: realY}
  }


  coordinateToContainerPixel (coordinate) {
    const {dpr, mapContainer} = this.map

    const containerX = (coordinate.x / Math.pow(2, currentZoom-1) + mapContainer.position.x) / dpr
    const containerY = (coordinate.y / Math.pow(2, currentZoom-1) + mapContainer.position.y) / dpr

    return {x: containerX, y: containerY}
  }
}
