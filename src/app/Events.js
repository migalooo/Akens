export default class Events {
  constructor(mount, map, handlers) {
    this.map = map
    this.handlers = handlers

    this.mouseCoordinate = mount.mouseCoordinate
    this.moveData = {
      start: { x: 0, y: 0, switch: false, center: null, position: null, zoom: null, distance: null}
    }
    this.dragging = false
    this.pinching = false
    this.moveLog = []
    this.lastMouseUp = 0

    this.initEvents(mount.el)
  }

  initEvents(el) {
    el.addEventListener('mousedown',  this.start.bind(this))
    el.addEventListener('mousemove',  this.move.bind(this))
    el.addEventListener('mouseup',    this.end.bind(this))
    el.addEventListener('mouseout',    this.end.bind(this))

    el.addEventListener('touchstart', this.start.bind(this))
    el.addEventListener('touchmove',  this.move.bind(this))
    el.addEventListener('touchend',   this.end.bind(this))

    el.addEventListener('mousewheel', this.scroll.bind(this))
  }

  setMouseCoordinates(coordinate) {
    this.mouseCoordinate.x = coordinate.x
    this.mouseCoordinate.y = coordinate.y
  }

  start(e) {
    e.preventDefault()
    this.setMouseCoordinates({x: e.offsetX, y: e.offsetY})
    const map = this.map
    this.moveLog = []
    const moveData = this.moveData

    moveData.start.center   = map.center
    moveData.start.position = map.mapContainer.position.clone()
    moveData.start.x = this.mouseCoordinate.x
    moveData.start.y = this.mouseCoordinate.y
    moveData.start.switch = true

    if (e.touches && e.touches.length === 1) {
      this.dragging = true
      this.pinching = false
      return
    } 
    if (e.touches && e.touches.length === 2) {
      this.dragging = false
      this.pinching = true
      moveData.start.distance = Math.sqrt(
        Math.pow(e.touches[0].pageX - e.touches[1].pageX, 2) +
        Math.pow(e.touches[0].pageY - e.touches[1].pageY, 2)
      )
      moveData.start.zoom = map.zoom
      return
    }

    this.dragging = true
    this.pinching = false
  }
  move(e) {
    e.preventDefault()
    this.setMouseCoordinates({x: e.offsetX, y: e.offsetY})
    
    const moveData = this.moveData
    if(this.dragging && moveData.start.switch) {

      const dx = this.mouseCoordinate.x - moveData.start.x
      const dy = this.mouseCoordinate.y - moveData.start.y
      const map = this.map

      console.log('center', moveData.start.center)
      const newX = moveData.start.center.x - dx * map.dpr * Math.pow(2, map.currentZoom - 1);
      const newY = moveData.start.center.y - dy * map.dpr * Math.pow(2, map.currentZoom - 1);

      this.moveLog.push({
        x: this.mouseCoordinate.x,
        y: this.mouseCoordinate.y,
        time: new Date()*1
      })

      this.moveLog = this.moveLog.slice(-10)

      map.setCenter({x: newX, y: newY})
    }
  }
  end(e) {
    e.preventDefault()
    const currentMoveCoordinate = {
      x: this.mouseCoordinate.x,
      y: this.mouseCoordinate.y
    }

    const mouseMoveDelta = {
      x: this.moveData.start.x - currentMoveCoordinate.x,
      y: this.moveData.start.y - currentMoveCoordinate.y
    }

    this.moveData.start.switch = false 
    // this.moveData.start = { x: 0, y: 0 }

    // Double click
    const currentTime = Date.now()
    const timeDelta = currentTime - this.lastMouseUp
    if (!this.pinching && this.lastMouseUp && timeDelta < 300 && Math.abs(mouseMoveDelta.x) < 10 && Math.abs(mouseMoveDelta.y) < 10) {
      this.handlers.setZoom(this.map.zoom - 1, true)
      this.lastMouseUp = 0
      return
    }
    this.lastMouseUp = currentTime

    // Pinching
    if(this.pinching) {
      console.log('pinching')
      return
    }

    // Click
    if (Math.abs(mouseMoveDelta.x) < 5 && Math.abs(mouseMoveDelta.y) < 5) {
      const tiles = [];
      const {minTileZoom, maxTileZoom, tileSize} = this.map.config

      let imageCoordinate = this.handlers.containerPixelToCoordinate(currentMoveCoordinate)

      for (let i = minTileZoom; i <= maxTileZoom; i++) {
        const tx = Math.floor(imageCoordinate.x / Math.pow(2, i - 1) / tileSize) * tileSize
        const ty = Math.floor(imageCoordinate.y / Math.pow(2, i - 1) / tileSize) * tileSize
        tiles.push(i + "/tile_"+tx+"_"+ty+".jpg")
      }

      console.log("Click at image:", imageCoordinate)
      console.log("Click on tiles:", tiles)
      return
    }
    // Pan to
    const map = this.map
    const moveLog = this.moveLog
    const len = moveLog.length
    if (len > 2 && ((new Date())*1 - moveLog[len - 1].time) < 100) {
      const sx = (moveLog[0].x - moveLog[len-1].x) / (moveLog[0].time - moveLog[len-1].time) * map.dpr
      const sy = (moveLog[0].y - moveLog[len-1].y) / (moveLog[0].time - moveLog[len-1].time) * map.dpr

      const realX = sx * Math.pow(2, this.map.currentZoom-1) * 200
      const realY = sy * Math.pow(2, this.map.currentZoom-1) * 200

      this.handlers.isPanning = true
      this.handlers.panTo({x: map.center.x - realX, y: map.center.y - realY})
      return
    }
  }
  scroll(e) {
    e.preventDefault()
    const delta = e.deltaY 
    if (delta) {
      let newZoom = this.map.zoom - delta / 3 / 32
      this.handlers.setZoom(newZoom, true /* follow mouse */)
    }
  }
}
