define((require, exports, module) => {
  const assert = require('chai').assert
  const m = require('mocha')
  describe('State', () => {
    const storeManager = require('State')
    const logger = store => dispatch => (action, data) => {
      console.group(`ACTION ${action}`)

      console.log(`action: %c${action}`, 'color:green')
      console.log('data: ', data)
      console.log('%cstore before: ', 'color:orange', store.getState())

      const newState = dispatch(action, data)
      console.log('%cnew state: ', 'color:green', newState)
      console.groupEnd()
      return newState
    }

    const mid = store => dispatch => (action, data) => {
      const oldState = store.getState()
      const oldStateCopy = JSON.parse(JSON.stringify(oldState))

      const newState = dispatch(action, data)

      function compare(o, n, os) {
        for (const i of Object.keys(o).concat(Object.keys(n))) {
          if (!n[i]) {
            if (os === n) {
              console.warn('nooohohoohoh did not change state, bro!')
              console.warn('element was removed, but parent not changed')
            }
          } else if (!o[i]) {
            if (os === n) {
              console.warn('nooohohoohoh did not change state, bro!')
              console.warn('element was added, but parent not changed')
            }
          } else if (!!o[i] && typeof (o[i]) === 'object') {
            // console.log('aaaa')
            //
            compare(o[i], n[i], os[i])
          } else {
            if (!n[i] || o[i] !== n[i]) { // el deleted, or value not same
              // value has changed todo iter over newState (missing ones were deleted, dont matter. new ones dont matter either hm....)

              // new state cant be old state, if a child changed
              if (os === n) {
                console.warn('nooohohoohoh did not change state, bro!')
                console.group(`state ${action}`)
                console.log(`oldStateCopy: ${o[i]}`)
                console.log(`oldState: %c${os[i]}`, 'color: red')
                console.log(`newState: ${n[i]}`)
                console.groupEnd()
              }
            }
            // console.log(i, o[i] === n[i])
          }
        }
      }
      compare(oldStateCopy, newState, oldState)

      return newState
    }

    storeManager.applyMiddleware(logger, mid)
    const defaultData = {
      propA: 'A',
      propB: 'B',
      lvl1: {
        arr: [1, 2, 3],
        objArr: [{
          a: 'a',
          b: 'b',
        }, {
          a: 1,
          b: 2,
        }],
        a: 1,
        b: 2,
        lvl2: {
          a: 3,
          b: 4,
          lvl3: {
            a: 5,
            b: 6,
          },
        },
      },
    }
    let testStore
    beforeEach((done) => {
      storeManager.removeStore('test')
      testStore = storeManager.createStore('test', defaultData)
      done()
    })

    describe('#createStore', () => {
      it('create a store', () => {
        assert.equal(testStore.getState(), defaultData)
      })
    })
    describe('#listen', () => {
      it('called with initial state when binding', () => {
        testStore.listen((state) => {
          assert.deepEqual(defaultData, state)
        })
      })

      it('listen to changes', () => {
        let calledTimes = 0
        testStore.listen(() => {
          calledTimes++
        })

        testStore.action('change_state', (state, data) => Object.assign({}, state, {
          propA: 'C',
        }))
        testStore.dispatch('change_state', {})

        assert.equal(calledTimes, 2)
      })

      it('called multiple times, when changes have the same value', () => {
        let calledTimes = 0
        testStore.listen(() => {
          calledTimes++
        })

        testStore.action('change_state', (state, data) => Object.assign({}, state, {
          propA: 'C',
        }))
        testStore.dispatch('change_state', {})
        testStore.dispatch('change_state', {})
        testStore.dispatch('change_state', {})

        assert.equal(calledTimes, 4)
      })

      it('called with new state', () => {
        let state = 0
        testStore.listen((data) => {
          state = data
        })

        testStore.action('change_state', (state, data) => Object.assign({}, state, {
          propA: 'C',
        }))
        testStore.dispatch('change_state', {})

        assert.notEqual(defaultData.propA, state.propA)
        assert.equal(state.propA, 'C')
      })
      it('called with part of the state', () => {
        let state = 0
        testStore.listen([state => state.lvl1.lvl2.lvl3], (lvl3) => {
          state = lvl3
        })

        testStore.action('change_state', state => state.lvl1.lvl2.lvl3, state => Object.assign({}, state, {
          a: 11,
        }))
        testStore.dispatch('change_state', {})

        assert.equal(state.a, 11)
        assert.equal(state.b, 6)
      })

      it('only called when state changes', () => {
        let calledTimesGlobalState = 0
        let calledTimesLocalState = 0

        testStore.listen([state => state.lvl1.lvl2.lvl3, state => state.lvl1, state => state], (lvl3, lvl1, state) => {
          calledTimesGlobalState++
        })
        testStore.listen([state => state.lvl1.lvl2.lvl3, state => state.lvl1], (lvl3, lvl1) => {
          calledTimesLocalState++
        })

        assert.equal(calledTimesGlobalState, 1)
        assert.equal(calledTimesLocalState, 1)

        testStore.action('change_state', state => state, state => Object.assign({}, state, {
          propA: 'B',
        }))
        testStore.dispatch('change_state', {})

        assert.equal(calledTimesGlobalState, 2)
        assert.equal(calledTimesLocalState, 1)
      })
      it('unsubscribe', () => {
        let calledTimes = 0

        const unsubscribe = testStore.listen((state) => {
          calledTimes++
        })

        assert.equal(calledTimes, 1)

        testStore.action('change_state', state => state, state => Object.assign({}, state, {
          propA: 'B',
        }))

        testStore.dispatch('change_state', {})
        assert.equal(calledTimes, 2)

        testStore.unsubscribe(unsubscribe)

        testStore.dispatch('change_state', {})
        assert.equal(calledTimes, 2)
      })
      it('call when child gets replaced', () => {
        let calledTimes = 0
        let aProp

        const unsubscribe = testStore.listen([state => state.lvl1.a], (a) => {
          calledTimes++
          aProp = a
        })

        testStore.action('change_child_obj', state => Object.assign({}, state, {
          lvl1: {
            a: 'a',
            b: 'b',
            arr: [1, 2, 3],
          },
        }))

        testStore.dispatch('change_child_obj')
        assert.equal(calledTimes, 2)
        assert.equal(aProp, 'a')
        assert.equal(testStore.getState().lvl1.a, 'a')
      })
    })
    describe('#dispatch', () => {
      it('dispatch action and change state', () => {
        const initialState = testStore.getState()
        testStore.action('change_state', (state, data) => Object.assign({}, state, {
          propA: 'C',
        }))

        testStore.dispatch('change_state', {})
        const newState = testStore.getState()
        assert.notEqual(initialState, newState)
        assert.notEqual(initialState.propA, newState.propA)

        testStore.dispatch('change_state', {})
        const newState2 = testStore.getState()
        assert.notEqual(newState, newState2)
        assert.equal(newState.propA, newState2.propA) // same Value
      })

      it('pass parameters', () => {
        const initialState = testStore.getState()
        testStore.action('change_propA', (state, data) => Object.assign({}, state, {
          propA: data,
        }))
        testStore.dispatch('change_propA', 'B')

        const newState = testStore.getState()
        assert.equal(newState.propA, 'B')

        testStore.dispatch('change_propA', 'C')
        assert.equal(testStore.getState().propA, 'C')
        assert.equal(newState.propA, 'B')
      })

      it('pass object', () => {
        const initialState = testStore.getState()
        testStore.action('change_propA_to_obj', (state, data) => Object.assign({}, state, {
          propA: object,
        }))
        const object = {
          A: '2',
          B: 'c',
        }
        testStore.dispatch('change_propA_to_obj', object)

        const newState = testStore.getState()
        assert.equal(newState.propA, object)
      })
    })

    describe('#action', () => {
      it('change array element', () => {
        const initialState = testStore.getState()

        testStore.action('change_array_element', (state, data) => Object.assign({}, state, {
          lvl1: Object.assign({}, state.lvl1, {
            t: 1,
            arr: state.lvl1.arr.map((el, index) => {
              if (index === data) {
                return data
              }
              return el
            }),
          }),
        }))

        testStore.dispatch('change_array_element', 2)
        assert.equal(testStore.getState().lvl1.arr[2], 2)

        testStore.dispatch('change_array_element', 1)
        assert.equal(testStore.getState().lvl1.arr[1], 1)
      })

      it('use state filters to change array element', () => {
        const initialState = testStore.getState()

        testStore.action('change_array_element_using_filter', state => state.lvl1.arr, (arr, data) => arr.map((el, index) => {
          if (index === data) {
            return data
          }
          return el
        }))

        testStore.dispatch('change_array_element_using_filter', 2)
        assert.equal(testStore.getState().lvl1.arr[2], 2)

        testStore.dispatch('change_array_element_using_filter', 1)
        assert.equal(testStore.getState().lvl1.arr[1], 1)
      })

      it('use state filters to change nested object', () => {
        const initialState = testStore.getState()
        testStore.action('change_nested_object_using_filter', state => state.lvl1.lvl2.lvl3, (lvl3, data) => Object.assign({}, lvl3, {
          c: 'C added',
        }))
        testStore.dispatch('change_nested_object_using_filter')
        assert.equal(testStore.getState().lvl1.lvl2.lvl3.c, 'C added')
      })

      it('remove object from array', () => {
        assert.isDefined(testStore.getState().lvl1.objArr[1])

        testStore.action('remove_object_from_array', state => state.lvl1.objArr, (objArr, data) => objArr.filter((el, index) =>
          index === 1,
        ))

        testStore.dispatch('remove_object_from_array')
        assert.isUndefined(testStore.getState().lvl1.objArr[1])
      })
      it('remove lvl2 object ', () => {
        assert.isDefined(testStore.getState().lvl1.lvl2)

        testStore.action('remove_object', state => state.lvl1, (lvl1, data) => {
          const obj = Object.assign({}, lvl1)
          delete obj.lvl2
          return obj
        })

        testStore.dispatch('remove_object')
        assert.isUndefined(testStore.getState().lvl1.lvl2)
      })
      it('add object', () => {
        assert.isUndefined(testStore.getState().newProp)

        testStore.action('add_object', state => state, (state, data) => Object.assign({}, state, {
          newProp: 'yea',
        }))

        testStore.dispatch('add_object')
        assert.isDefined(testStore.getState().newProp)
        assert.equal(testStore.getState().newProp, 'yea')
      })
      it('change primitive propery using selector', () => {
        const oldState = testStore.getState()

        testStore.action('change_prop', state => state.propA, propA => 'B')

        testStore.dispatch('change_prop')
        assert.equal(oldState.propA, 'A')
        assert.equal(testStore.getState().propA, 'B')
      })
      it('change child object', () => {
        const oldState = testStore.getState()

        testStore.action('change_child_obj', state => Object.assign({}, state, {
          lvl1: {
            a: 'a',
            b: 'b',
            arr: [1, 2, 3],
          },
        }))

        testStore.dispatch('change_child_obj')
        assert.equal(oldState.lvl1.a, 1)
        assert.equal(testStore.getState().lvl1.a, 'a')
      })
    })

    describe('cross module communication', () => {
      it('communicate between stores', () => {
        const books = storeManager.createStore('books', [{
          title: 'Don`t make me think',
          author: 'id1',
          uid: '321312',
        }, {
          title: 'Loriot`s Dramatische Werke',
          author: 'id2',
          uid: '1232133',
        }])
        const authors = storeManager.createStore('authors', {
          selected: 'id2',
          list: {
            id1: {
              name: 'Steve Krug',
            },
            id2: {
              name: 'Loriot',
            },
          },
        })

        authors.action('change_name', state => state.list, (state, data) => Object.assign({}, state, {
          [data.id]: {
            name: data.name,
          },
        }))

        authors.action('change_selected', (state, data) => Object.assign({}, state, {
          selected: data.selected,
        }))

        books.action('change_title', (state, data) => state.map((el, i) => {
          if (el.uid === data.uid) {
            return Object.assign({}, el, {
              title: data.title,
            })
          }
          return el
        }))

        const getAuthorList = () => authors.getState().list

        books.listen([state => state, getAuthorList], (state, authors) => {
          console.group('render')
          for (book of state) {
            console.log(`title:%c ${book.title}`, 'color: blue')
            console.log(`author:%c ${authors[book.author].name}`, 'color: lightblue')
          }
          console.groupEnd()
        })

        authors.dispatch('change_name', {
          id: 'id1',
          name: 'Steve',
        })
        books.dispatch('change_title', {
          uid: '321312',
          title: 'Make me think!',
        })
        authors.dispatch('change_selected', {
          selected: 'id1',
        })
      })
    })
  })

  module.exports = {}
})
