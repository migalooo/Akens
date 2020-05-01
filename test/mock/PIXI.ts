export default {
  Stage: jest.fn().mockReturnValue({
    addChild: jest.fn(),
  }),
  autoDetectRenderer: jest.fn((width, height) => {
    const canvas = document.createElement('canvas')
    canvas.setAttribute("clientWidth", width)
    canvas.setAttribute("clientHeight", height)
    return {
      view: canvas, 
      render: jest.fn()
    }
  }
  ),
  DisplayObjectContainer: jest.fn().mockReturnValue({
    addChild: jest.fn(),
    position: {
      x: 0,
      y: 0,
      clone: jest.fn()
    },
    scale: {
      x: 0,
      y: 0
    }
  }),
  Graphics: jest.fn().mockReturnValue({
    beginFill: jest.fn().mockReturnThis(),
    drawRect: jest.fn().mockReturnThis(),
    endFill: jest.fn().mockReturnThis(),
    position: {
      x: 0,
      y: 0 
    },
    scale: {
      x: 0,
      y: 0
    },
  }),
  ImageLoader: jest.fn().mockReturnValue({
    load: jest.fn()
  })
}
