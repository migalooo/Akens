// @ts-ignore
import PIXI  from 'PIXI'
import {Options, Mount, Size} from './interfaces'
import {PixiRender, PixiStage} from './PixiInterfaces'

import Map from './Map'
import Events from './Events'
import Monitor from './Monitor'
import Observe from './Observe'

// const defaultOptions: Options = {
//   width: 158701,
//   height: 26180,
//   maxTileZoom: 8,
//   minTileZoom: 1,
//   maxZoom: 8,
//   minZoom: 1,
//   defaultZoom: 6,
//   tileSize: 512,
//   tilePath: '',
//   dpr: 1,
//   background: 0x363636,
//   panSpeed: 0.1 
// }

export default class ImageViewer {
  private readonly el: HTMLElement 
  // followMouse: boolean
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
    // this.followMouse = false
    this.options = options
      // Object.assign({}, defaultOptions, options)
    this.init()
  }

  public init() {
    this.mount = {
      mouseCoordinate: {
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
    this.events = new Events(this.mount, this.map, this.monitor)
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

    // if (this.options.dpr < 1) {
    //   this.el.className += ' lowperf-device';
    // }

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

// TODO: resize mobile support border controll

// function TiledImageViewer (el, config) {
//   console.log('Running TiledImageViewer service');
//
//   if (typeof el === 'string') el = document.querySelector(el)
//   this.el = el;
//   this.followMouse = false;
//
//   this.config = Object.assign({}, defaultConfig, config);
//   this.dpr = this.config.dpr || 1;
//
//   this.observe= new Observer()
//
//   this.init();
// }


// TiledImageViewer.prototype.init = function() {
//
//   this.mount = {
//     size: this.getSize(),
//     mouseCoordinate: {x: 0, y: 0},
//     el: this.el
//   }
//   
//   this.setupPixi();
//
//
//   this.map = new Map(this.config, this.stage, this.observe, this.mount)
//
//   this.handlers  = new Handlers(this.map, this.observe, this.mount, this.render)
//
//   this.listener = new Events(this.mount, this.map, this.handlers)
//
//
//   this.animateRender();
// };

// TiledImageViewer.prototype.getSize = function() {
//   return {
//     canvasW: Math.min(window.innerWidth, this.el.offsetWidth),
//     canvasH: Math.min(window.innerHeight, this.el.offsetHeight)
//   }
// }

// TiledImageViewer.prototype.animateRender = function(time) {
//   time = time || 0;
//
//   window.requestAnimationFrame(this.animateRender.bind(this))
//   this.map.lastAnimTimeDelta = time - (this.lastAnimTime || 0)
//   this.lastAnimTime = time
//
//   this.observe.trigger('beforeRender', time)
//   this.render.render(this.stage)
//   this.observe.trigger('afterRender', time)
//
// };

// TiledImageViewer.prototype.setupPixi = function() {
//   this.stage = new PIXI.Stage()
//
//   console.log("Initialize pixi with dpr:", this.dpr)
//
//   const size = this.mount.size
//   const renderDimensions = {width: size.canvasW * this.dpr, height: size.canvasH * this.dpr};
//
//   if (this.dpr < 1) {
//     this.el.className += ' lowperf-device';
//   }
//
//   this.render = PIXI.autoDetectRenderer(renderDimensions.width, renderDimensions.height, null, true, false)
//   console.log("Renderer:", this.render)
//
//   this.el.appendChild(this.render.view)
//
//   console.log("Client dimensions:", this.render.view.clientWidth, this.render.view.clientHeight)
// }

