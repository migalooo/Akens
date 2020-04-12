import PIXI  from 'PIXI'
import Map from './Map'
import Events from './Events.js'
import Handlers from './Handlers.js'
import Observer from './Observer'

const  defaultConfig = {
  width: 158701,
  height: 26180,
  maxTileZoom: 8,
  minTileZoom: 1,
  maxZoom: 8,
  minZoom: 1,
  defaultZoom: 6,
  tileSize: 512,
  tilePath: null,
  dpr: 1,
  background: 0x363636,
  panSpeed: 0.1 
}

// TODO: resize mobile support border controll

function TiledImageViewer (el, config) {
  console.log('Running TiledImageViewer service');

  if (typeof el === 'string') el = document.querySelector(el)
  this.el = el;
  this.followMouse = false;

  this.config = Object.assign({}, defaultConfig, config);
  this.dpr = this.config.dpr || 1;

  this.observe= new Observer()

  this.init();
}


TiledImageViewer.prototype.init = function() {

  this.mount = {
    size: this.getSize(),
    mouseCoordinate: {x: 0, y: 0},
    el: this.el
  }
  
  this.setupPixi();


  this.map = new Map(this.config, this.stage, this.observe, this.mount)

  this.handlers  = new Handlers(this.map, this.observe, this.mount, this.render)

  this.listener = new Events(this.mount, this.map, this.handlers)


  this.animateRender();
};

TiledImageViewer.prototype.getSize = function() {
  return {
    canvasW: Math.min(window.innerWidth, this.el.offsetWidth),
    canvasH: Math.min(window.innerHeight, this.el.offsetHeight)
  }
}

TiledImageViewer.prototype.animateRender = function(time) {
  time = time || 0;

  window.requestAnimationFrame(this.animateRender.bind(this))
  this.map.lastAnimTimeDelta = time - (this.lastAnimTime || 0)
  this.lastAnimTime = time

  this.observe.trigger('beforeRender', time)
  this.render.render(this.stage)
  this.observe.trigger('afterRender', time)

};

TiledImageViewer.prototype.setupPixi = function() {
  this.stage = new PIXI.Stage()

  console.log("Initialize pixi with dpr:", this.dpr)

  const size = this.mount.size
  const renderDimensions = {width: size.canvasW * this.dpr, height: size.canvasH * this.dpr};

  if (this.dpr < 1) {
    this.el.className += ' lowperf-device';
  }

  this.render = PIXI.autoDetectRenderer(renderDimensions.width, renderDimensions.height, null, true, false)
  console.log("Renderer:", this.render)

  this.el.appendChild(this.render.view)

  console.log("Client dimensions:", this.render.view.clientWidth, this.render.view.clientHeight)
}


export default TiledImageViewer
