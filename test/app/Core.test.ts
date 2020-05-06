import Core from '../../src/app/Core'


describe('Test Core.ts', () => {
  document.body.innerHTML = `
  <div id="app"></div>
`
  const optins = {
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


  const core = new Core('#app', optins)

  it('Test Core constructor init', () => {
    expect(core.el).toEqual(document.querySelector('#app'))
    expect(core.options).toEqual(optins)
  })

  it('Test mount init value', () => {
    expect(core.el).toEqual(document.querySelector('#app'))
    expect(core.options).toEqual(optins)
  })
})
