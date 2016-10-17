define((require, exports, module) => {
  class EventBus {

    constructor() {
      this.topics = {}
      this.subUid = -1
    }

    /**
     * subscribe - description
     *
     * @param  {string|array}  topic description
     * @param  {function} func description
     * @return {string}        token to unsubscribe
     * @example EventBus.subscribe('topic', (data)=>{})
     * @example EventBus.subscribe('topic1', callback)
     * @example EventBus.subscribe(['topic1', 'topic2'], (data)=>{})
     */
    subscribe(topic, func) {
      let topics = topic
      if (!Array.isArray(topics)) {
        topics = [topics]
      }

      const token = (++this.subUid).toString()
      for (const topicI of topics) {
        if (!this.topics[topicI]) {
          this.topics[topicI] = []
        }

        this.topics[topicI].push({
          token,
          func,
        })
      }

      return token
    }

    /**
     * publish
     *
     * @param  {string} topic
     * @param  {object} args  test
     * @return {bool}         subscribers exist for topic
     * @example EventBus.pusblish('topic', {data})
     */
    publish(topic, args) {
      if (!this.topics[topic]) {
        return false
      }

      const subscribers = this.topics[topic]
      let len = subscribers ? subscribers.length : 0

      while (len--) {
        subscribers[len].func(args)
      }

      return true
    }

    /**
     * unsubscribe - description
     *
     * @param  {string} token retrieved when subscribing
     * @return {boolean}      subscription found
     * @example EventBus.unsubscribe('12')
     * @example EventBus.unsubscribe(token)
     */
    unsubscribe(token) {
      let tokenFound = false

      for (const m in this.topics) {
        if (this.topics[m]) {
          for (let i = 0, j = this.topics[m].length; i < j; i++) {
            if (this.topics[m][i].token === token) {
              this.topics[m].splice(i, 1)
              tokenFound = true
            }
          }
        }
      }
      return tokenFound
    }
  }

  // default exports
  module.exports = new EventBus()
})
