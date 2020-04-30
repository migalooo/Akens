import Core from '../../src/app/Core'
jest.unmock("PIXI")

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

test('Core', () => {
  expect(new Core('#app', optins))
})
