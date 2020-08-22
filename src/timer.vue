<template>
  <div>
    <div v-if="timerMode" class="timer">{{ liveTime | millisToMinutesAndSecondsCeil }}</div>
    <div v-else class="timer">{{ liveTime | millisToMinutesAndSecondsFloor }}</div>
  </div>
</template>

<script>
export default {
  name: "Timer",
  props: {
    startTimer: {
      type: Boolean
    },
    startingCount: {
      type: Number
    },
    timerLimit: {
      type: String
    },
    currentCount: {
      type: [ Number, String ]
    },
    liveTime: {
      type: Number
    },
    timerMode: {
      type: Boolean, 
      default: false
    }
  },
  data() {
    return {
      count: 0, 
      timeNow: 0
    }
  },
  computed: {
    totalTime() {
      return this.startingCount + this.count;
    }
  },
  filters: {
    millisToMinutesAndSecondsFloor: (millis) => {
      var minutes = Math.floor(millis / 60000);
      var seconds = Math.floor((millis % 60000) / 1000);
      return (minutes < 10 ? '0' : '0') + minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    },
    millisToMinutesAndSecondsCeil: (millis) => {
      var minutes = Math.floor(millis / 60000);
      var seconds = Math.ceil((millis % 60000) / 1000);
      return (minutes < 10 ? '0' : '0') + minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }
  },
  methods: {
    countdown() {
      if(!this.startTimer) {
        this.$emit('update:current-count', this.totalTime);
        return;
      }
      this.timeNow = new Date().getTime();
      if(this.timerMode){
        if(this.liveTime < 0){
          this.count = 0;
          this.$emit('update:live-time', 0);
          this.$emit('timer-done');
          return;
        }
        this.count = parseInt(this.currentCount) - (this.timeNow - this.time);
      } else {
        this.count = this.currentCount + (this.timeNow - this.time);
      }
      this.$emit('update:live-time', this.count);
    },
    restartTimer() {
      this.count = 0;
    }
  }, 
  watch: {
    startTimer() {
      if(this.startTimer){
        this.time = new Date().getTime();
      }
      const clock = setInterval(() => {
        if(!this.startTimer) {
          clearInterval(clock);
        }
        this.countdown();
      }, 10);
      
    }
  }
};
</script>

<style type="text/scss" lang="scss">
  @import '../src/css/styles.scss';
  @import '../src/css/variables.scss';
  
  div.timer {
    color: $white;
    font-family: proxima-nova, sans-serif;
    font-size: 11em;
    font-weight: 900;
    height: 180px;
    margin: 0 auto;
    text-align: left;
    width: 488px;
  }
  div.done {
    div.timer {
      color: $salmon;
    }
  }
</style>