import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import db from '../firebase';

Vue.use(Vuex);
axios.defaults.baseURL = 'http://todo-laravel.test/api';

export const store = new Vuex.Store({
  state: {
    token: localStorage.getItem('access_token') || null,
    filter: 'all',
    todos: []
  },
  getters: {
    loggedIn(state) {
      return state.token !== null;
    },
    remaining(state) {
      return state.todos.filter(todo => !todo.completed).length;
    },
    anyRemaining(state, getters) {
      return getters.remaining != 0;
    },
    todosFiltered(state) {
      if (state.filter == 'all') {
        return state.todos;
      } else if (state.filter == 'active') {
        return state.todos.filter(todo => !todo.completed);
      } else if (state.filter == 'completed') {
        return state.todos.filter(todo => todo.completed);
      }
      return state.todos;
    },
    showClearCompletedButton(state) {
      return state.todos.filter(todo => todo.completed).length > 0;
    }
  },
  mutations: {
    addTodo(state, todo) {
      state.todos.push({
        id: todo.id,
        title: todo.title,
        completed: false,
        editing: false,
        timestamps: new Date()
      });
    },
    updateTodo(state, todo) {
      const index = state.todos.findIndex(item => item.id == todo.id);
      state.todos.splice(index, 1, {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        editing: todo.editing
      });
    },
    deleteTodo(state, id) {
      const index = state.todos.findIndex(item => item.id == id);

      if (index > 0) state.todos.splice(index, 1);
    },
    checkAll(state, checked) {
      state.todos.forEach(todo => (todo.completed = checked));
    },
    updateFilter(state, filter) {
      state.filter = filter;
    },
    clearCompleted(state) {
      state.todos = state.todos.filter(todo => !todo.completed);
    },
    retrieveTodos(state, todos) {
      state.todos = todos;
    },
    retrieveToken(state, token) {
      state.token = token;
    },
    destroyToken(state) {
      state.token = null;
    },
    clearTodos(state) {
      state.todos = [];
    }
  },
  actions: {
    initRealtimeListeners(context) {
      db.collection('cities').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const source = change.doc.metadata.hasPendingWrites
              ? 'Local'
              : 'Server';

            if (source === 'Server') {
              context.commit('addTodo', {
                id: change.doc.id,
                title: change.doc.data().title,
                completed: false
              });
            }
          }
          if (change.type === 'modified') {
            context.commit('updateTodo', {
              id: change.doc.id,
              title: change.doc.data().title,
              completed: change.doc.data().completed
            });
          }
          if (change.type === 'removed') {
            context.commit('deleteTodo', change.doc.id);
          }
        });
      });
    },
    retrieveName(context) {
      axios.defaults.headers.common['Authorization'] =
        'Bearer ' + context.state.token;

      return new Promise((resolve, reject) => {
        axios
          .get('/user')
          .then(response => {
            resolve(response);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    clearTodos(context) {
      context.commit('clearTodos');
    },
    register(context, data) {
      return new Promise((resolve, reject) => {
        axios
          .post('/register', {
            name: data.name,
            email: data.email,
            password: data.password
          })
          .then(response => {
            resolve(response);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    destroyToken(context) {
      axios.defaults.headers.common['Authorization'] =
        'Bearer ' + context.state.token;

      if (context.getters.loggedIn) {
        return new Promise((resolve, reject) => {
          axios
            .post('/logout')
            .then(response => {
              localStorage.removeItem('access_token');
              context.commit('destroyToken');
              resolve(response);
              // console.log(response);
              // context.commit('addTodo', response.data)
            })
            .catch(error => {
              localStorage.removeItem('access_token');
              context.commit('destroyToken');
              reject(error);
            });
        });
      }
    },
    retrieveToken(context, credentials) {
      return new Promise((resolve, reject) => {
        axios
          .post('/login', {
            username: credentials.username,
            password: credentials.password
          })
          .then(response => {
            const token = response.data.access_token;

            localStorage.setItem('access_token', token);
            context.commit('retrieveToken', token);
            resolve(response);
            // console.log(response);
            // context.commit('addTodo', response.data)
          })
          .catch(error => {
            console.log(error);
            reject(error);
          });
      });
    },
    retrieveTodos(context) {
      axios.defaults.headers.common['Authorization'] =
        'Bearer ' + context.state.token;

      // db
      //   .collection('todos')
      //   .get()
      //   .then(querySnapshot => {
      //     let tempTodos = [];

      //     querySnapshot.forEach(result => {
      //       console.log(result.data());

      //       const data = {
      //         id: result.id,
      //         title: result.data().title,
      //         completed: result.data().completed,
      //         timestamps: result.data().timestamps
      //       };

      //       tempTodos.push(data);
      //     });

      //     const tempTodosSorted = tempTodos.sort((a, b) => {
      //       return a.timestamps.seconds - b.timestamps.seconds;
      //     });

      //     context.commit('retrieveTodos', tempTodosSorted);
      //   });

      axios
        .get('/todos')
        .then(response => {
          context.commit('retrieveTodos', response.data);
        })
        .catch(error => {
          console.log(error);
        });
    },
    addTodo(context, todo) {
      // db
      //   .collection('todos')
      //   .add({
      //     title: todo.title,
      //     completed: todo.completed,
      //     timestamps: new Date()
      //   })
      //   .then(result => {
      //     context.commit('addTodo', {
      //       id: result.id,
      //       title: todo.title,
      //       completed: false
      //     });
      //   });

      axios
        .post('/todos', {
          title: todo.title,
          completed: false
        })
        .then(response => {
          context.commit('addTodo', response.data);
        })
        .catch(error => {
          console.log(error);
        });
    },
    updateTodo(context, todo) {
      // db
      //   .collection('todos')
      //   .doc(todo.id)
      //   .set(
      //     {
      //       id: todo.id,
      //       title: todo.title,
      //       completed: todo.completed
      //     },
      //     { merge: true }
      //   )
      //   .then(() => {
      //     context.commit('updateTodo', todo);
      //   });

      axios
        .patch('/todos/' + todo.id, {
          title: todo.title,
          completed: todo.completed
        })
        .then(response => {
          context.commit('updateTodo', response.data);
        })
        .catch(error => {
          console.log(error);
        });
    },
    deleteTodo(context, id) {
      // db
      //   .collection('todos')
      //   .doc(id)
      //   .delete()
      //   .then(() => {
      //     context.commit('deleteTodo', id);
      //   });

      axios
        .delete('/todos/' + id)
        .then(response => {
          context.commit('deleteTodo', id);
        })
        .catch(error => {
          console.log(error);
        });
    },
    checkAll(context, checked) {
      // db
      //   .collection('todos')
      //   .get()
      //   .then(querySnapshot => {
      //     querySnapshot.forEach(data => {
      //       data.ref
      //         .update({
      //           completed: checked
      //         })
      //         .then(() => {
      //           context.commit('checkAll', checked);
      //         });
      //     });
      //   });

      axios
        .patch('/todosCheckAll', {
          completed: checked
        })
        .then(response => {
          context.commit('checkAll', checked);
        })
        .catch(error => {
          console.log(error);
        });
    },
    updateFilter(context, filter) {
      context.commit('updateFilter', filter);
    },
    clearCompleted(context) {
      // db
      //   .collection('todos')
      //   .where('completed', '==', true)
      //   .get()
      //   .then(querySnapshot => {
      //     querySnapshot.forEach(data => {
      //       data.ref.delete().then(() => {
      //         context.commit('clearCompleted');
      //       });
      //     });
      //   });

      const completed = context.state.todos
        .filter(todo => todo.completed)
        .map(todo => todo.id);

      axios
        .delete('/todosDeleteCompleted', {
          data: {
            todos: completed
          }
        })
        .then(response => {
          context.commit('clearCompleted');
        })
        .catch(error => {
          console.log(error);
        });
    }
  }
});
