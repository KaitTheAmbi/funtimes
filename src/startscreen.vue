<template>
  <div class="app start-card">
    <h1>It's Time</h1>
    <div class="row">
      <label for="name">Name</label>
      <input ref="name" v-model="newUser.userName" type="text" name="Name" :disabled="!!urlParams.name"  :class="{ error: $v.newUser.userName.$invalid, disabled: urlParams.name }" @keydown.enter="handleClickNext" />       
    </div>
    <div class="row">
      <label for="roomName">Room</label>
      <input v-model="newUser.roomName" type="text" name="roomName" :disabled="$route.params.id" :class="{ error: $v.newUser.roomName.$invalid, disabled: $route.params.id }" @keydown.enter="handleClickNext"  />
    </div>  
    <div class="row">
      <label for="initialBet">Time</label>
      <input ref="initial-bet" v-model="newUser.initialBet" type="text" name="initialBet" placeholder="minutes" :class="{ error: $v.newUser.initialBet.$invalid }" @keydown.enter="handleClickNext" @keypress="onlyNumber" />
    </div>  
    <!--<div class="row">
      <label for="roomName">Color</label>
      <input v-model="newUser.color.hex" type="text" name="color" placeholder="color here"/>
      <compact v-model="newUser.color" />
    </div>-->
    <div class="row">
      <div class="button" tabindex="0" @click="handleClickNext" @keydown.enter="handleClickNext">
        GO
      </div>
    </div>
    
  </div>
</template>


<script>
  import { validationMixin } from 'vuelidate';
  import { required } from 'vuelidate/lib/validators';
  import { Compact } from 'vue-color';
  
  export default {
  mixins: [validationMixin],
  components: { Compact },
  name: "Test",
  data() {
    return {
      colors: ['#fa26a0', '#05dfd7', '#a3f7bf', '#fff591', '#c3aed6'],
      newUser: {
        userName: '',
        roomName: this.$route.params.id ? this.$route.params.id : '',
        color: '',
        initialBet: ''
      },
      urlParams: {}
    }
  }, 
  validations: {
    newUser: {
      userName: {
        required
      },
      roomName: {
        required
      },
      initialBet: {
        required
      }
    }
  },
  methods: {
    getUrlParams() {
      const url = window.location.href;
      let params = {};
      let parser = document.createElement('a');
      parser.href = url;
      let query = parser.search.substring(1);
      
      let vars = query.split('&');
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[pair[0]] = decodeURIComponent(pair[1]);
      }
      this.urlParams = params;
    },
    handleClickNext() {
      if(!this.newUser.color){
        // Get completely random color
        // this.newUser.color = '#' + Math.floor(Math.random()*16777215).toString(16);
        
        // Get from set palette
        this.newUser.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
      }
      if(this.$v.newUser.$invalid) {
        return;
      }
      this.$store.commit('setUser', this.newUser);
      if(!this.$v.newUser.$invalid) {
        if(this.$route.params.id){
          return;
        }
        this.$root.$router.push({ path: `/Space/${this.newUser.roomName}?name=${this.newUser.userName}` });
      }
      
    },
    onlyNumber ($event) {
       let keyCode = ($event.keyCode ? $event.keyCode : $event.which);
       if ((keyCode < 48 || keyCode > 57) && keyCode !== 46) { // 46 is dot
          $event.preventDefault();
       }
    }
  },
  mounted() {
    this.getUrlParams();
    if(this.urlParams.name) {
      this.newUser.userName = this.urlParams.name;
    }
    if(this.urlParams.name && this.$route.params.id) {
      this.$refs['initial-bet'].focus();  
    }
    else {
      this.$refs['name'].focus();  
    }
  }
};
</script>
<style scoped type="text/scss" lang="scss">
  @import './css/styles.scss';
  @import './css/variables.scss';
  
  h1 {
    font-size: 4em;
    color: $white;
    margin: 0;
  }
  input.error {
    border: 2px solid #f00;
  }
  div.start-card {
    height: 100%;
    max-width: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: center;
    flex-direction: column;
    margin: 0 auto; 
    
    div.row {
      margin: 1em 0 0 0;
      box-sizing: border-box;
      display: block;
      width: 100%;
      label {
        display: block;
        width: 100%;
        text-align: center;
        margin-bottom: 0.26em;
        color: #757575;
        font-size: 1em;
      }
    }
  }
</style>