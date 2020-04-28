export function throttle(fn: Function, wait: number): Function  {
  let context, args, result
  let timeout = null
  let previous = 0
  let later = function() {
    previous = Date.now()
    timeout = null
    result = fn.apply(context, args)
    context = args = null
  }
  return function() {
    let now = Date.now()
    let remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0) {
      clearTimeout(timeout)
      timeout = null
      previous = now
      result = fn.apply(context, args)
      context = args = null
    }
    return result
  }
}

export function debounce(fn: Function, wait: number) {
  let timeout, args, context, timestamp, result

  let later = function() {
    let last = Date.now() - timestamp
    if (last < wait) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
        result = fn.apply(context, args)
        context = args = null
    }
  }

  return function() {
    context = this
    args = arguments
    timestamp = Date.now()
    if (!timeout) {
      timeout = setTimeout(later, wait)
    }

    return result
  }
}

export function imageLoader(src: string, overTime: number = 10000): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>(function(resolve, reject) {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = src
    image.onload = function() {
      resolve(image)
    }
    image.onerror = function() {
      reject(new Error(`Image loading error. src ${src}`))
    }
  })
}
