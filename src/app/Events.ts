import {Options, Mount, Coordinate, Snapshot, MovePath} from './interfaces'
import Map from './Map'
import Monitor from './Monitor'
import log  from './log'

export default class Events {
  private readonly map: Map
  private readonly monitor: Monitor 
  private readonly options: Options 

  private readonly mouseMovingCoordinate: Coordinate
  private readonly mouseStartCoordinate: Coordinate = {x: 0, y: 0}

  private mapSnapshot: Snapshot
  private movePaths: MovePath[] = []

  private isDragging: boolean = false
  private isPinching: boolean = false
  private isMoving: boolean = false
  private lastMouseUpTime: number = 0

  constructor(options: Options, mount: Mount, map: Map, monitor: Monitor) {
    this.options = options
    this.monitor = monitor
    this.map = map
    this.mouseMovingCoordinate = mount.mouseMovingCoordinate
    this.initEvents(mount.el)

    this.mapSnapshot = {
      center: {
        x: map.center.x,
        y: map.center.y
      },
      position: map.mapContainer.position.clone(),
      distance: 0,
      zoom: options.defaultZoom
    }
  }

  private initEvents(el) {
    el.addEventListener('mousedown',  this.start.bind(this))
    el.addEventListener('mousemove',  this.move.bind(this))
    el.addEventListener('mouseup',    this.end.bind(this))
    el.addEventListener('mouseout',    this.end.bind(this))

    el.addEventListener('touchstart', this.start.bind(this))
    el.addEventListener('touchmove',  this.move.bind(this))
    el.addEventListener('touchend',   this.end.bind(this))

    el.addEventListener('mousewheel', this.scroll.bind(this))
  }

  private setMouseMovingCoordinate(coordinate: Coordinate) {
    this.mouseMovingCoordinate.x = coordinate.x
    this.mouseMovingCoordinate.y = coordinate.y
  }

  private setMouseStartCoordinates(coordinate: Coordinate) {
    this.mouseStartCoordinate.x = coordinate.x
    this.mouseStartCoordinate.y = coordinate.y
  }

  private start(e) {
    e.preventDefault()

    this.setMouseMovingCoordinate({x: e.offsetX, y: e.offsetY})
    const map = this.map
    const mapSnapshot = this.mapSnapshot
    this.movePaths = []

    mapSnapshot.center.x = map.center.x
    mapSnapshot.center.y = map.center.y
    mapSnapshot.position = map.mapContainer.position.clone()
    this.setMouseStartCoordinates(this.mouseMovingCoordinate)

    this.isMoving = true

    if (e.touches && e.touches.length === 1) {
      this.isDragging = true
      this.isPinching = false
      return
    } 
    if (e.touches && e.touches.length === 2) {
      this.isDragging = false
      this.isPinching = true
      mapSnapshot.distance = Math.sqrt(
        Math.pow(e.touches[0].pageX - e.touches[1].pageX, 2) +
        Math.pow(e.touches[0].pageY - e.touches[1].pageY, 2)
      )
      mapSnapshot.zoom = map.zoom
      return
    }

    this.isDragging = true
    this.isPinching = false
  }
  move(e) {
    e.preventDefault()

    this.setMouseMovingCoordinate({x: e.offsetX, y: e.offsetY})
    if (this.isDragging && this.isMoving) {
      const map = this.map
      const dpr = this.options.dpr
      const mapSnapshot = this.mapSnapshot

      // Moving Delta
      const dx = this.mouseMovingCoordinate.x - this.mouseStartCoordinate.x
      const dy = this.mouseMovingCoordinate.y - this.mouseStartCoordinate.y

      const newX = mapSnapshot.center.x - dx * dpr * Math.pow(2, map.currentZoom - 1)
      const newY = mapSnapshot.center.y - dy * dpr * Math.pow(2, map.currentZoom - 1)

      this.movePaths.push({
        x: this.mouseMovingCoordinate.x,
        y: this.mouseMovingCoordinate.y,
        time: Date.now()
      })

      this.movePaths = this.movePaths.slice(-10)
      map.setCenter({x: newX, y: newY})
    }
  }
  end(e) {
    e.preventDefault()

    // Moving Delta abs
    const dx = Math.abs(this.mouseMovingCoordinate.x - this.mouseStartCoordinate.x)
    const dy = Math.abs(this.mouseMovingCoordinate.y - this.mouseStartCoordinate.y)
    const currentTime = Date.now()
    const timeDelta = currentTime - this.lastMouseUpTime

    this.isMoving = false 

    // Double click
    if (!this.isPinching && this.lastMouseUpTime && timeDelta < 300 && dx < 10 && dy < 10) {
      this.monitor.zooming(this.map.zoom - 1, true)
      this.lastMouseUpTime = 0
      return
    }
    this.lastMouseUpTime = currentTime

    // Pinching
    if(this.isPinching) {
      log('pinching')
      return
    }

    // Click
    if (dx<5 && dy<5) {
      const tiles: string[] = []
      const {minTileZoom, maxTileZoom, tileSize} = this.options

      let imageCoordinate = this.monitor.containerPixelToCoordinate(this.mouseMovingCoordinate)

      for (let i = minTileZoom; i <= maxTileZoom; i++) {
        const tx = Math.floor(imageCoordinate.x / Math.pow(2, i - 1) / tileSize) * tileSize
        const ty = Math.floor(imageCoordinate.y / Math.pow(2, i - 1) / tileSize) * tileSize
        tiles.push(i + "/tile_"+tx+"_"+ty+".jpg")
      }

      return
    }
    // Pan to
    const map = this.map
    const dpr = this.options.dpr
    const movePaths = this.movePaths
    const len = movePaths.length
    if (len > 2 && (Date.now() - movePaths[len-1].time) < 100) {
      const lastPath = this.movePaths[len-1]
      const firstPath = this.movePaths[0]
      const sx = (firstPath.x - lastPath.x) / (firstPath.time - lastPath.time) * dpr
      const sy = (firstPath.y - lastPath.y) / (firstPath.time - lastPath.time) * dpr

      const realX = sx * Math.pow(2, map.currentZoom-1) * 200
      const realY = sy * Math.pow(2, map.currentZoom-1) * 200

      this.monitor.isPanning = true
      this.monitor.panTo({x: map.center.x - realX, y: map.center.y - realY})
    }
  }
  scroll(e) {
    e.preventDefault()
    const delta = e.deltaY 
    if (delta) {
      let newZoom = this.map.zoom - delta / 3 / 32
      this.monitor.zooming(newZoom, true)
    }
  }
}
