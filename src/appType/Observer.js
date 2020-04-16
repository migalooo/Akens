export default class Observer {
  constructor() {
    this.events = {}
  }
  on(event, callback) {

    if (!this.events[event]) {
      this.events[event] = []
    }

    this.events[event].push(callback)

    return callback
  }
  off(event, searchedHandler) {

    if (this.events && this.events[event]) {
      for (let i = 0; i < this.events[event].length; i++) {
        let handler = this.events[event][i]
        if (handler.toString() === searchedHandler.toString()) {
          this.events[event].splice(i, 1)
        }
      }
    }
  }
  trigger(event, ...args) {

    if (this.events[event]) {
      this.events[event].forEach(callback => {
        if (callback) {
          callback.apply(this, args)
        }
      })
    }
  }
}
