export default function log(desc:string, ...args) {
  switch(process.env.NODE_ENV) {
    case 'test':
    case 'production':
      return
    default:
      console.log(desc, ...args)
  } 
}

log.groupCollapsed = (console.groupCollapsed) ? console.groupCollapsed : () => {}
log.groupEnd = (console.groupEnd) ? console.groupEnd : () => {}
