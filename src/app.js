import TiledImageViewer from './app/Core.js'

var el = document.getElementById('app'),
    image = {width: 158701, height: 26180, tilePath: 'https://s3-eu-west-1.amazonaws.com/eye-for-detail/v2/stockholm/tiles_512/'},
    tiledImage = new TiledImageViewer(el, {
        width: image.width,
        height: image.height,
        maxTileZoom: 8,
        minTileZoom: 1,
        defaultZoom: Math.log(1 / (window.innerHeight / image.height)) / Math.log(2) + 1,
        tilePath: image.tilePath,
    });
