// @ts-ignore
import PIXI  from 'PIXI'
import {Options, Mount, Size} from './interfaces'
import {PixiRender, PixiStage} from './PixiInterfaces'

import Map from './Map'
import Events from './Events'
import Monitor from './Monitor'
import Observe from './Observe'

export default class Core {
  private readonly el: HTMLElement 
  private mount: Mount
  private options: Options

  private map: Map
  private observe: Observe
  private monitor: Monitor
  private events: Events 

  private render: PixiRender 
  private stage: PixiStage 

  constructor(el: string | HTMLElement, options: Options){
    if (typeof el === 'string') el = document.querySelector(el) as HTMLElement
    this.el = el
    this.options = options
    this.init()
  }

  public init() {
    this.mount = {
      el: this.el,
      mouseMovingCoordinate: {
        x: 0,
        y: 0
      },
      canvasSize: this.getCanvasSize(),
      lastAnimTime: 0,
      lastAnimTimeDelta: 0
    }
    this.observe= new Observe()
    this.setupPixi()
    this.map = new Map(this.options, this.stage, this.observe, this.mount)
    this.monitor  = new Monitor(this.options, this.map, this.observe, this.mount, this.render)
    this.events = new Events(this.options, this.mount, this.map, this.monitor)
    this.animateRender()
  }

  private getCanvasSize(): Size {
    return {
      width: Math.min(window.innerWidth, this.el.offsetWidth),
      height: Math.min(window.innerHeight, this.el.offsetHeight)
    }
  }

  private setupPixi() {
    this.stage = new PIXI.Stage()

    console.log("Initialize pixi with dpr:", this.options.dpr)

    const canvasSize = this.mount.canvasSize
    const renderDimensions = {width: canvasSize.width * this.options.dpr, height: canvasSize.height * this.options.dpr}

    this.render = PIXI.autoDetectRenderer(renderDimensions.width, renderDimensions.height, null, true, false)
    console.log("Renderer:", this.render)

    this.el.appendChild(this.render.view)
    console.log("Client dimensions:", this.render.view.clientWidth, this.render.view.clientHeight)
  }

  private animateRender(time: number = 0) {
    window.requestAnimationFrame(this.animateRender.bind(this))
    this.mount.lastAnimTimeDelta = time - this.mount.lastAnimTime
    this.mount.lastAnimTime = time

    this.observe.emit('beforeRender', time)
    this.render.render(this.stage)
    this.observe.emit('afterRender', time)
  }
}
