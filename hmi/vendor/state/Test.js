define((require, exports, module) => {
  const storeManager = require('State')

  class BooksModule {
    constructor() {
      const defaultState = {
        highlight: 'abc',
        books: [{
          id: 1,
          title: 'abc',
          author: 'Erwin',
        }, {
          id: 2,
          title: 'test',
          author: 'Albert',
        }, ],
      }
        //
      this.store = storeManager.createStore('books', defaultState)

      //
      // + list possible actions
      // + dispatch call from other module Module.getState().dispatch('add_book') withou module api (addBook())
      // this.store.action('add_book', (state, data) => {
      //   // {
      //   //   ...state,
      //   //   books: {
      //   //     ...state.books,
      //   //     [data.id]: {
      //   //       title: data.title,
      //   //       author: data.title,
      //   //     },
      //   //   },
      //   // }
      //   return Object.assign({}, state, {
      //     books: [...state.books, {
      //       id: data.id,
      //       title: data.title,
      //       author: data.author,
      //     }, ],
      //   })
      // })

      this.store.action('add_book', state => state.books, (state, data) => {
        return [...state, {
          id: data.id,
          title: data.title,
          author: data.author,
        }, ]
      })

      this.store.action('change_title', state => state.books, (books, data) => {
        return books.map((book, index) => {
          if (book.id === data.id) {
            return Object.assign({}, book, {
              title: data.title,
            })
          }
          return book
        })
      })

      this.store.action('change_highlight', (state, {
        highlight,
      }) => {
        return Object.assign({}, state, {
          highlight,
        })
      })

      this.store.onChange([state => state.highlight], (state) => {
        console.log('highlight changed')
      })
      this.store.onChange([state => state], (state) => {
        console.log('state changed')
      })
      this.store.onChange([state => state.books], (state) => {
        console.log('books changed')
      })
        // this.store.onChange([state => state.title, Module.getState, Module.getClicked], (state) => {
        //   console.log('title changed')
        // })
      this.store.listen((state) => {
        // console.log(state)
      })
    }

    addBook(title, author, id) {
      this.store.dispatch('add_book', {
        title,
        author,
        id,
      })
    }

    changeTitle(id, title) {
      this.store.dispatch('change_title', {
        title,
        id,
      })
    }

    highlightBook(id) {
      this.store.commit('highlight_book', {
        id,
      }, (state, data) => {
        // return [
        //   ...state, {
        //     highlight: data.id,
        //   },
        // ]
      })
    }

    getState() {
      this.store.getState()
    }

  }

  const booksModule = new BooksModule()
  booksModule.changeTitle(2, 'muh')
  booksModule.addBook('Its Me, Frank', 'Mr T', 13)
  booksModule.changeTitle(13, 'Its Me, Max')
  booksModule.store.dispatch('change_highlight', {
    highlight: '12',
  })
  const state1 = {
    name: 'tim',
    type: {
      gender: {
        a: 'm',
      },
      age: 34,
    },
  }

  const state2 = Object.assign({}, state1, {
    type: Object.assign({}, state1.type, {
      age: 35,
    }),
  })

  console.log(state1)
  console.log(state2)
  console.log(state2.type === state1.type) // false
  console.log(state2.type.gender === state1.type.gender) // true

  // test
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
  const testStore = storeManager.createStore('test', defaultData)
  const initialState = testStore.getState()
  console.log(initialState)
  testStore.action('change_state', state => state, (state, data) => {
    return Object.assign({}, state, {
      propA: 'C',
    })
  })
  testStore.dispatch('change_state', {})
  console.log(testStore.getState())
  const newState = testStore.getState()
  console.log(initialState !== newState)
  console.log(initialState.propA !== newState.propA)
  testStore.dispatch('change_state', {})
  const newState2 = testStore.getState()
  console.log(newState !== newState2)
  console.log(newState.propA === newState2.propA) // same Value
})
