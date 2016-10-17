define((require, exports, module) => {
  const bus = require('EventBus')
  bus.subscribe('test', () => {
    console.log('works')
  })
  const bus2 = require('EventBus')
  bus2.publish('test', {})
})
