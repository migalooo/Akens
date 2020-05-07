import Core from '../../src/app/Core'

describe('Test Core.ts', () => {

  document.body.innerHTML = `
  <div id="app"></div>
  `
  const options = {
    imageSize: {
      width: 158701,
      height: 26180,
    },
    maxTileZoom: 8,
    minTileZoom: 1,
    maxZoom: 8,
    minZoom: 1,
    defaultZoom: 6,
    tileSize: 512,
    tilePath: 'https://www.test.com',
    dpr: 1,
    background: 0x363636,
    panSpeed: 0.1 
  }

  let core
  it('Test Core constructor init options', () => {
    core = new Core('#app', options)
  })

  it('Test Core getCanvasSize', () => {
    const app = document.querySelector('#app')
    Object.defineProperty(document.body, 'clientWidth', { value: 1200 })
    Object.defineProperty(document.body, 'clientHeight', { value: 900 })
    expect(core.getCanvasSize()).toEqual({
      width: 0,
      height: 0
    })
    Object.defineProperty(app, 'offsetWidth', { value: 1000 })
    Object.defineProperty(app, 'offsetHeight', { value: 800 })
    expect(core.getCanvasSize()).toEqual({
      width: 1000,
      height: 800
    })
  })
})
