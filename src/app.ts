import Viewer from './appType/Core'

new Viewer('#app', {
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
  tilePath: 'https://s3-eu-west-1.amazonaws.com/eye-for-detail/v2/stockholm/tiles_512/',
  dpr: 1,
  background: 0x363636,
  panSpeed: 0.1 
})
