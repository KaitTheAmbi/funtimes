<template>
  <div class="container">
    <div class="winner-container">
      <div v-for="winner in winners" class="winner-div" :style="{backgroundColor: winner.color}"></div>
  </div>  
    <div class="timer-container">
      <timer ref="timer" :start-timer="startTimer" :starting-count.sync="startingCount" :current-count.sync="currentCount" :live-time.sync="liveTime" :timer-mode="timerMode" @timer-done="handleTimerDone" :class="{ done : isDone }" />
      <div class="timer-controls">
        <span v-if="!timerMode" tabindex="0" class="mode-toggle" :class="{disabled: startTimer}" @click="startTimer ? '' : handleSwitchMode()" @keypress.enter="startTimer ? '' : handleSwitchMode()">Switch to timer mode.</span>
        <span v-else tabindex="0" class="mode-toggle" :class="{disabled: startTimer}" @click="startTimer ? '' : handleSwitchMode()" @keypress.enter="startTimer ? '' : handleSwitchMode()">Switch to stopwatch mode.</span>
        <input v-if="timerMode" v-model="currentCount" type="number" class="timer-limit-input" :class="{disabled: startTimer}" placeholder="Enter in milliseconds" :disabled="!!startTimer" />
      </div>
      
      <div class="button-row">
        <div tabindex="0" class="button positive" :class="{disabled: startTimer}" @keypress.enter="startTimer ? '' : handleButton('start-timer')" @click="startTimer ? '' : handleButton('start-timer')">Start</div>
        
        <div tabindex="0" class="button negative" :class="{disabled: !startTimer}" @keypress.enter="startTimer ? handleButton('stop-timer') : ''" @click="startTimer ? handleButton('stop-timer') : ''">Stop</div>
        
        <div tabindex="0" class="button neutral" :class="{disabled: startTimer}" @keypress.enter="startTimer ? '' : handleButton('restart')" @click="startTimer ? '' : handleButton('restart')">Restart</div>
      </div>
    </div>
<!--     <input ref="wager" v-model="wager" :disabled="!!startTimer" @blur="placeWager" @keypress.enter="placeWager" @keypress="onlyNumber" /> -->
    <div class="message-wrapper">
      <div class="user-list">
      <div v-for="user in users" class="user" :style="{borderColor: user.color}">
          <div v-if="isMine(user)" class="change-color-button" :style="{backgroundColor: user.color}" @click="handleChangeColor"></div>
          <compact v-if="showColorPicker && isMine(user)" v-model="updatedColor" class="color-picker" @click-outside="handleBlurColorPicker" />
          <img :src="getAvatarPath(user)" /> 
          <div class="name">{{user.name}}</div>
          <input v-if="isMine(user)" ref="wager" v-model="wager" :disabled="!!startTimer" @blur="placeWager" @keypress.enter="placeWager" @keypress="onlyNumber" /> 
          <div v-else class="wager">{{user.wager | toSeconds}}</div>
      </div> 
    </div>
      
      <div class="message-area">
        <div class="message-area_messages" :class="{hasScroll: hasScroll}">
          <div v-for="message in messages" :class="{mine: isMine(message), bot: message.name === 'Bot'}" class="message" :style="getMessageColor(message)">
            <img v-if="!isMine" :src="getAvatarPath(message)" />
            <div class="text">
              <div class="message_name">{{message.name}}</div>
              <div class="message_message">{{message.message}}</div>
              <div class="message_message">{{message.timerMode}}</div>
              <div class="message_message">{{message.currentCount}}</div>
            </div>
          </div>
        </div>
        <div class="message-area_input">
            <textarea ref="message-input" type="text" v-model="message" class="input--message" placeholder="Press enter to send." @keypress.enter="sendMessage($event)" />
        </div>
      </div>
    </div>
    
    <div class="footer">
        <span>{{ user.name }} | Room: {{ user.roomName }} | Owner: {{ user.owner }} | {{ liveTime }} | {{ user.color }} </span>
    </div>
  </div>
</template>

<script>
import Timer from './timer.vue';
import VueSocketIO from 'vue-socket.io';
import socketio from 'socket.io';
import socketioClient from 'socket.io-client';
import { Compact } from 'vue-color';
import { mapGetters, mapState } from 'vuex'
import { validationMixin } from 'vuelidate';

export default {
  name: "App",
	data: () => ({
    avatars: ['bear', 'unicorn', 'panda', 'sloth', 'donkey'],
    avatar: '',
    currentCount: 0,
    hasScroll: false,
    isDone: false,
    liveTime: 0,
    message: '',
    messages: [],
    socket: socketioClient.connect('https://funtimes.glitch.me'),
    startTimer: false,
    startingCount: 0,
    timerMode: false,
    showColorPicker: false,
    updatedColor: '',
    users: [], 
    userLoaded: false,
    wager: ''
  }),
  components: {
    Timer, 
    Compact
  },
  computed: {
    user() {
      return this.$store.state.user;
    },
    computedUsers() {
      return this.users.filter(user => user.id !== this.user.id)
    },
    wagers() {
      return this.users.map(user => parseInt(user.wager)).sort(function(a, b){return a-b});
    },
    winningTime() {
      const timesPassed = this.wagers.filter((val, index, ar) => {
        return val < this.liveTime;
      });
      return timesPassed[timesPassed.length - 1];
    },
    winners() {
      return this.winningTime ? this.users.filter(user => user.wager === this.winningTime) : '';
    }
  },
  filters: {
    toSeconds: (millis) => {
      var minutes = Math.floor(millis / 60000);
      var seconds = Math.floor((millis % 60000) / 1000);
      return (minutes < 10 ? '0' : '0') + minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }
  },
  methods: {
    getAvatar() {
      this.avatar = this.avatars[Math.floor(Math.random() * this.avatars.length)];
    },
    getAvatarPath(avatarOwner){
      return `/assets/${avatarOwner.avatar}.svg`;
    },
    getMessageColor(message) {
      const style = {
        color: message.color
      }
      return style;
    },
    handleBlurColorPicker() {
      this.showColorPicker = false;
    },
    handleButton(message){
      this.socket.emit('send-message', {
          name: this.user.name,
          room: this.user.roomName,
          message: message,
          timerMode: this.timerMode,
          liveTime: this.liveTime,
          currentCount: this.currentCount
        });
    },
    handleChangeColor() {
      this.showColorPicker = true;
    },
    handleSwitchMode() {
      if(this.timerMode){
        this.timerLimit = null;
      }
      this.timerMode = !this.timerMode;
    },
    handleTimerDone() {
      this.isDone = true;
      this.startTimer = false;
    },
    isMine(message){
      return message.id === this.user.id || message.name === 'You';
    },
    onlyNumber ($event) {
       let keyCode = ($event.keyCode ? $event.keyCode : $event.which);
       if ((keyCode < 48 || keyCode > 57) && keyCode !== 46) { // 46 is dot
          $event.preventDefault();
       }
    },
    placeWager() {
      this.socket.emit('place-wager', { room: this.user.roomName, id: this.user.id, wager: this.wager * 60000 });
    },
    scrollToBottom() {
       const div = document.getElementsByClassName('message-area_messages')[0];
       div.scrollTop = div.scrollHeight - div.clientHeight;
        if(div.scrollTop !== 0) {
          this.hasScroll = true;
        };
    },
    sendMessage() {
        this.socket.emit('send-message', {
          avatar: this.avatar,
          color: this.user.color,
          currentCount: this.currentCount,
          liveTime: this.liveTime,
          message: this.message.trim(),
          name: this.user.name,
          room: this.user.roomName,
          timerMode: this.timerMode
        });
        this.messages.push({
          name: 'You',
          message: this.message,
          avatar: this.avatar
        });
        this.message = '';
        this.$nextTick(() => {
          this.scrollToBottom();
        })
    },
  }, 
  watch: {
    userLoaded() {
      if(this.userLoaded){
        this.placeWager();
        this.$refs['message-input'].focus();
      }
      if(this.wager === '') {
        this.$refs['wager'].focus();
      }
    },
    updatedColor() {
      this.$store.commit('setColor', this.updatedColor.hex)
      this.socket.emit('update-color', {id: this.user.id, color:this.updatedColor.hex, room: this.user.roomName});
      this.showColorPicker = false;
    }
  },
  mounted() {
    this.getAvatar();
    this.socket.emit('new-user', {
      avatar: this.avatar,
      color: this.user.color,
      name: this.user.name,
      room: this.user.roomName
    });
    
    this.socket.on('user-connected', (data) => {
      this.users = data.allUsers;
      this.messages.push({
        avatar: 'donut',
        name: "Bot", 
        message: data.name + " has joined!"
      });
      if(!this.user.owner){
        this.$store.commit('setOwner', data.roomOwner);
      } else {
        this.socket.emit("send-current-time", {
          currentCount: this.currentCount, 
          id: data.id,
          liveTime: this.liveTime,
          newUser:data.name,
          start: this.startTimer,
          timerMode: this.timerMode
        });
      }
      this.$nextTick(() => {
        this.scrollToBottom();
        this.userLoaded = true;
      })
    });
    this.socket.on('incoming-message', (data) => {
      this.messages.push(data);
      if(data.message.match('start-timer')){
        this.currentCount = data.currentCount,
        this.liveTime = data.liveTime;
        this.timerMode = data.timerMode;
        this.isDone = false;
        this.startTimer = true;
      }
      if(data.message.match('stop-timer')){
        this.startTimer = false;
      }
      if(data.message.match('restart')){
        this.$refs['timer'].restartTimer();
        this.currentCount = 0;
        this.liveTime = 0;
        this.isDone = false;
      }
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    });
    this.socket.on("get-current-time", time => {
      this.currentCount = time.liveTime;
      this.liveTime = time.liveTime;
      this.timerMode = time.timerMode;
      this.startTimer = time.start;
    });
    this.socket.on("set-new-owner", () => {
       this.$store.commit('setOwner', true);
    });
    this.socket.on("set-id", id => {
      this.$store.commit('setId', id);
    });
    this.socket.on("update-users", data => {
      this.users = data;
    })
    this.socket.on("user-disconnected", data => {
      this.messages.push({
        avatar: 'donut',
        name: "Bot", 
        message: data.name + " is outta here."
      });
      this.users = data.allUsers;
    })
    
    this.$nextTick(() => {
      if(this.user.initialBet)  {
        this.wager = this.user.initialBet;
      } 
    });
    
  }
}
</script>

<style scoped type="text/scss" lang="scss">
@import '../src/css/styles.scss';
@import '../src/css/variables.scss';

div.container {
  display: flex;
  flex-direction: column;
  height: 100%;

  div.timer-controls {
    display: flex;
    flex-direction: column;
    margin: 20px auto 1em auto;
    position: relative;
    text-align: center;
    width: 445px;
    
    span.mode-toggle {
      color: $gray;
      font-size: 0.8em;
      &:hover {
        cursor: pointer;
        text-decoration: underline;
      }
      &.disabled {
        opacity: 0.2;
        &:hover {
          cursor: not-allowed;
        }
      }
    }
    input.timer-limit-input {
      -webkit-appearance: none;
      font-size: 0.9em;
      margin: 0.5em auto 0 auto;
      width: unset;
    }

    input[type=number] {
      -moz-appearance: textfield;
    } 
  }
  div.button-row {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5em;
    div.button {
      font-size: 1em;
      max-width: 130px;
      margin: 0 0.16em;
    }
  }
  div.message-wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: calc(100% - 64px);
    justify-content: center;
    width: 100%;
  }
  div.user-list {
    margin: 0 auto;
    display: flex;
    max-width: 800px;
    margin-bottom: 10px;
    
    div.user {
      display: flex;
      align-items: center;
      border-width: 2px;
      border-style: solid;
      border-radius: 3px;
      min-width: 100px;
      flex-direction: column;
      padding: 10px;
      position: relative;
      margin: 3px;
      div.name {
        color: #757575;
        font-size: 0.70em;
        text-transform: uppercase;
        margin-top: 5px;
      }
      div.wager {
        font-size: 1.2em;
        font-weight: 900;
        font-family: proxima-nova, sans-serif;
      }
      div.change-color-button {
        position: absolute;
        right: 6px;
        top: 4px;
        height: 10px;
        width: 10px;
        border-radius: 50%;
      }
      div.color-picker {
        position: absolute;
        right: -234px;
        z-index: 100;
      }
      input {
        font-size: 1em;
        padding: 0.06em;
        position: relative;
        text-align: center;
        top: 3px;
        width: 100px;
      }
      img { 
        height: 52px;
        max-width: 50px;
      }
    }
  }
  div.message-area {
    border: 1px solid $gray;
    border-radius: 3px;
    height: 100%;
    max-height: 400px;
    max-width: 400px;
    padding: 0.5em;
    width: 100%;

    div.message-area_messages {
      display: flex;
      flex-direction: column;
      height: calc(100% - 64px);
      margin-bottom: 0.5em;
      overflow-y: auto;
      scrollbar-color: black $gray;
      scrollbar-width: thin;
      text-align: left;
      &.hasScroll {
        padding-right: 6px;
      }
      div.message {
        border-radius: 3px;
        border: 1px solid #282828;
        display: flex;
        align-self: flex-start;
        font-size: 0.8em;
        margin-top: 0.4em; 
        max-width: 100%;
        padding: 0.5em;
        &.mine {
          align-self: flex-end;
        }
        &.bot {
          align-self: center;
          background-color: #21162b;
          color: #ab7bd7;
          border: 1px solid #21162b;
          font-size: 0.8em;
          div.message_name {
            color: #ab7bd7;
          }
        }
        img {
          height: 60px;
          width: 60px;
        }
        div.text {
          padding: 0 5px;
          div.message_name {
            color: #757575;
            font-size: 0.70em;
            text-transform: uppercase;
          }
        }
      }
    }

    div.message-area_input{
      textarea.input--message {
        font-family: ibm-plex-sans, sans-serif;
        font-size: .9em;
        height: 147px;
        max-height: 56px;
        max-width: 100%;
        resize: none;
        width: 486px;
      }
    }  
  }

  div.footer {
    background-color: #000000;
    top: 20px;
    color: $gray;
    font-size: 0.7em;
    padding: 0.5em;
    position: fixed;
    text-align: right;
    width: 100%;
  }
  div.timer-container {
    padding-top: 20px;
  }
  div.winner-container {
    width: 100%;
    position: fixed;
    top: 0;
    height: 20px;
    display: flex;
    div.winner-div {
      width: 100%;
    } 
  }
}
</style>