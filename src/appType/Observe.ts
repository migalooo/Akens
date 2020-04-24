interface Events {
  [event: string]: Function[]
}

export default class Observer {
  private readonly events: Events

  constructor() {
    this.events = {}
  }

  public on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = []
    }

    this.events[event].push(callback)

    return callback
  }

  public off(event: string, searchedHandler: Function) {
    if (this.events && this.events[event]) {
      for (let i = 0; i < this.events[event].length; i++) {
        let handler = this.events[event][i]
        if (handler.toString() === searchedHandler.toString()) {
          this.events[event].splice(i, 1)
        }
      }
    }
  }

  public emit(event: string, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        if (callback) {
          callback.apply(this, args)
        }
      })
    }
  }
}
