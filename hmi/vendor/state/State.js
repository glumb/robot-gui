define((require, exports, module) => {
  /**
   * thoughts:
   * - objecty must not be added, items can only be added to arrays
   * - -> initial data is the schema
   *
   * store.listen([(state, getStore) => getStore('Robot').getState().angles]) // only acces other stores in the listen method
   * - only acces the state in the listen method and in actions
   * store.action('NAME', (state, data, getStore) => {
   *   getStore('Robot').dispatch('SOME_ACTION', {data}) // do not get state from other stores?
   * })
   *
   * - dispatching actions within actions may leed to false undo. Outer action causes inner action, so only outer action has to be called
   * - -> catch this case like InnerFunction = true
   *
   * - disable listeners, when applying undo - redo actions
   */
  class Store {
    constructor(state, name, storeManager) {
      this.state = state
      this.name = name
      this.storeManager = storeManager
      this.actions = {}
      this.listeners = {}
      this.listenerId = 1
    }

    action(name, ...args) {
      if (this.actions.hasOwnProperty(name)) {
        console.warn(`action name in use: ${name}`)
      }

      let callback = args[0]

      // selector given
      if (args.length === 2) {
        const selector = args[0]
        const cb = args[1]
        callback = (state, data) => {
          const recursivelyAssignObjects = (object, selectedObj, newValue) => {
            if (object === selectedObj) {
              return newValue
            }
            for (const key in object) {
              if (object.hasOwnProperty(key)) {
                // key authors object book[0]
                if (object[key] === selectedObj) {
                  return Object.assign({}, object, {
                    [key]: newValue,
                  })
                } else {
                  // key 0 object books
                  if (Array.isArray(object[key]) || typeof (object[key]) === 'object') {
                    const newObject = recursivelyAssignObjects(object[key], selectedObj, newValue)
                    if (newObject) {
                      return Object.assign({}, object, {
                        [key]: newObject,
                      })
                    }
                  }
                }
              }
            }
            return false
          }
          const selectedObj = selector(state)

          if (typeof selectedObj !== 'object') {
            console.warn(`Action selector must select an object! (${selectedObj}) selected`)
          }

          const newState = recursivelyAssignObjects(state, selectedObj, cb(selectedObj, data))
          if (!newState) {
            console.warn('selector does not match any object', selector, state)
          }

          return newState
        }
      }

      this.actions[name] = callback
    }

    listen(...args) {
      let callback
      // selectros given
      if (args.length === 2) {
        const selects = args[0]
        const cb = args[1]
        const currentStates = []

        for (const select of selects) {
          currentStates.push(select(this.state))
        }

        const handleChange = (state) => {
          let changed = false
          for (const i in selects) {
            const newState = selects[i](state)
            if (newState !== currentStates[i]) {
              changed = true
              currentStates[i] = newState
            }
          }

          if (changed) {
            cb.apply(this, currentStates)
          }
        }

        callback = handleChange
        // execute cb once on init
        cb.apply(this, currentStates)
      } else {
        callback = args[0]
      }
      const id = this.listenerId++
      this.listeners[id] = callback
      // call once to init. Default state is already set
      callback(this.state)
      return id
    }

    unsubscribe(id) {
      if (this.listeners[id]) {
        delete this.listeners[id]
      } else {
        console.warn(`Could not find listener for id: ${id}`)
      }
    }

    dispatch(action, data) {
      this.storeManager.notify(action, data, this.name, this)
    }

    getState() {
      return this.state
    }

    getStore(storeName) {
      console.log(`%cStore [${this.name}] requesting data from [${storeName}]`, 'font-weight:bold')
      return this.storeManager.getStore(storeName)
    }
  }

  class StoreManager {
    constructor() {
      this.state = {}
      this.store = this
      this.middlewares = []
      this.stores = {}
    }

    getState() {
      return this.state
    }

    getStore(storeName) {
      return this.stores[storeName]
    }

    createStore(name, defaultState) {
      this.state[name] = defaultState
      if (this.stores[name]) {
        console.error(`store ${name} already exists`)
      }
      const store = new Store(this.state[name], name, this)
      this.stores[name] = store
      return store
    }

    removeStore(name) {
      if (!this.stores[name]) {
        console.warn(`cannot find store with name: ${name}`)
      } else {
        delete this.stores[name]
      }
    }

    notify(action, data, name, store) {
      const newState = this.runMiddleware(action, data, store)

      this.state = Object.assign({}, this.state, {
        [name]: newState,
      })
      store.state = this.state[name]

      // call listeners
      for (const storeId in this.stores) {
        if (this.stores[storeId]) {
          for (const id in this.stores[storeId].listeners) {
            if (this.stores[storeId].listeners[id]) {
              this.stores[storeId].listeners[id](this.stores[storeId].state)
            }
          }
        }
      }

      // todo check if state was changed in listeners
    }

    runMiddleware(action, data, store) {
      // cant prechain the middleware, sonce the scope of getStae is matching the local store
      const middlewareAPI = {
        getState: store.getState.bind(store),
        getGlobalState: this.getState.bind(this),
        dispatch: (action, data) => store.dispatch(action, data), // allow for further dispatches in middleware //todo check this if we need to bind
      }

      // mid1,mid2,mid3
      const chain = this.middlewares.map(middleware => middleware(middlewareAPI))
      // mid1(mid2(mid3(dispatch))(name, data)
      function executeAction(name, data) {
        if (!this.actions.hasOwnProperty(name)) {
          console.warn(`action not found: ${name}`)
        }
        return this.actions[name](this.state, data)
      }

      // mid1,mid2,mid3,dispatch
      // (prev, current) (mid3, dispatch)
      const runMiddleware = [...chain, executeAction.bind(store)].reduceRight((composed, f) => f(composed))
      return runMiddleware(action, data)
    }

    applyMiddleware(...middlewares) {
      this.middlewares = [...this.middlewares, ...middlewares]
    }

  }
  const storeManager = new StoreManager()

  module.exports = storeManager
})

// s.commit('CHANGE_CONTROL_MODE', mode, (state, data) => {
//     return [
//       ...state, {
//         controlMode: data,
//       },
//     ]
//   })
//   // global state (app state)
// GlobalDataDomain.setMode(mode)
//
// function onChange(store, select, onChange) {
//   let currentState;
//
//   function handleChange() {
//     let nextState = select(store.getState());
//     if (nextState !== currentState) {
//       currentState = nextState;
//       onChange(currentState);
//     }
//   }
//
//   let unsubscribe = store.subscribe(handleChange);
//   handleChange();
//   return unsubscribe;
// }
//
// store.onChange(store, [state, Module.getState(), Module.getClicked()](state) => {
//
// })
