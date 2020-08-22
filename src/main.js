var Vue = require('vue')
var Vuex = require('vuex')
var VueRouter = require('vue-router')
var Vuelidate = require('vuelidate')

var Space = require('./space.vue')
var Foo = require('./test.vue')
var Startscreen = require('./startscreen.vue')

Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(Vuelidate)

const store = new Vuex.Store({
  state: {
    count: 0,
    user: {
      id: '',
      color: '',
      name: '',
      owner: false,
      roomName: '',
      wager: 0
    },
  },
  mutations: {
    setUser(state, newUser){
      state.user.name = newUser.userName,
      state.user.roomName = newUser.roomName,
      state.user.color = newUser.color.hex ? newUser.color.hex : newUser.color
      state.user.initialBet = newUser.initialBet
    },
    setColor(state, color){
      state.user.color = color
    },
    setId(state, id){
      state.user.id = id
    },
    setOwner(state, isOwner){
      state.user.owner = isOwner
    }
  }
})

const routes = [
  { 
    path: '/',
    props: true
  },
  { 
    path: '/Space',
    name: 'Space',
    props: true
  },
  { 
    path: '/Space/:id',
    props: true
  },
  { 
    path: '/Foo/:id',
    props: true
  },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

const app = new Vue({
  router,
  components: { Space, Foo, Startscreen },
  data: {
    //currentRoute: window.location.pathname
  },
  computed: {
    currentRoute() {
      return this.$route.path;
    },
    ViewComponent () {
      if(this.$route.path === '/' || this.$route.path.startsWith('/Foo')  ){
        return 'Startscreen'
      }
      if(this.$route.path.startsWith('/Space') && this.$route.params.id && !this.$store.state.user.name ||            this.$route.path.startsWith('/Space') && !this.$route.params.id){
        return 'Startscreen'
      }
      if(this.$route.path.startsWith('/Space') && this.$route.params.id && this.$store.state.user.name ){
        return 'Space'
      }
      let hasRoute = routes.some( route => route['path'] === this.currentRoute)
      return hasRoute ? this.currentRoute.replace('/', '') : 'NotFound';
    }
  },
  render (h) { 
    return h(this.ViewComponent) },
  store
}).$mount('#app')


