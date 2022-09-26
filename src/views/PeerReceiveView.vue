<script setup lang="ts">
</script>

<template>
  <main>
    <table class="display">
        <tr>
            <td class="title">Status:</td>
            <td class="title">Messages:</td>
        </tr>
        <tr>
            <td>
                <div id="receiver-id" style="font-weight: bold;" title="Copy this ID to the input on send.html.">ID: {{recvId}}</div>
            </td>
            <td>
                <input type="text" v-model="sendMessageInput" placeholder="Enter a message..." autofocus="true" />
                <button type="button" @click="sendMessageClick">Send</button>
                <button type="button" @click="clearMessages">Clear Msgs (Local)</button>
                <button type="button" @click="pingHeroku">ping</button>
            </td>
        </tr>
        <tr>
            <td><div id="status" class="status">{{status}}</div></td>
            <td><div class="message" id="message" v-html="message"></div></td>
        </tr>
        <tr>
            <td class="display-box standby" id="standby"><h2>Standby</h2></td>
            <td class="display-box hidden" id="go"><h2>Go</h2></td>
        </tr>
        <tr>
            <td class="display-box hidden" id="fade"><h2>Fade</h2></td>
            <td class="display-box hidden" id="off"><h2>All Off</h2></td>
        </tr>
    </table>
  </main>
</template>

<style scoped>
  @import "../assets/peer.css";
</style>

<script>
  import { Peer } from "peerjs";

  export default {
    data () {
      return {
        ping_counters: 0,
        peer: new Peer(null, {
          debug: 2,
          pingInterval: 1,
          // host: 'localhost',
          // path: '/myapp',
          // port: 9000,
          config: {
            'iceServers': [
              {
                urls: 'stun:stun.obd2-ip.com:5349'
              },
              {
                urls: 'turn:turn.obd2-ip.com:5349',
                username: 'someone',
                credential: 'some_pass'
              }
            ]
          }
        }),
        conn: 'any',
        lastPeerId: 'any',
        peerId: null,
        status: '',
        recvId: 'any',
        message: '',
        sendMessageInput: '',
        timeoutID: null
      }
    },
    mounted() {
      console.log("mounted Peer Receive");
      this.initialize()
    },
    methods: {
      initialize(){
        let self = this;
        
        self.peer.on('open', function (id) {
            // Workaround for self.peer.reconnect deleting previous id
            if (self.peer.id === null) {
                console.log('Received null id from peer open');
                self.peer.id = self.lastPeerId;
            } else {
                self.lastPeerId = self.peer.id;
            }
            console.log('ID: ' + self.peer.id);
            self.recvId = self.peer.id;
            self.status = "Awaiting connection...";
        });
        self.peer.on('connection', function (c) {
            // Allow only a single connection
            if (self.conn && self.conn.open) {
                c.on('open', function() {
                    c.send("Already connected to another client");
                    setTimeout(function() { c.close(); }, 500);
                });
                return;
            }
            self.conn = c;
            console.log("Connected to: " + self.conn.peer);
            self.status = "Connected";
            self.ready();
        });
        self.peer.on('disconnected', function () {
            self.status = "Connection lost. Please reconnect";
            console.log('Connection lost. Please reconnect');
            // Workaround for self.peer.reconnect deleting previous id
            self.peer.id = self.lastPeerId;
            self.peer._lastServerId = self.lastPeerId;
            self.peer.reconnect();
        });
        self.peer.on('close', function() {
            self.conn = null;
            self.status = "Connection destroyed. Please refresh";
            console.log('Connection destroyed');
        });
        self.peer.on('error', function (err) {
            console.log(err);
            alert('' + err);
        });
      },
      sendMessageClick() {
        if (this.conn && this.conn.open) {
          var msg = this.sendMessageInput;
          this.sendMessageInput = "";
          this.conn.send(msg);
          console.log("Sent: " + msg)
          this.addMessage("<span class=\"selfMsg\">Self: </span>" + msg);
        } else {
          console.log('Connection is closed');
        }
      },

      pingHeroku() {
        var TS = window.performance.timing.navigationStart + window.performance.now();
        this.ping_counters++;
        this.conn.send({
          type: 'ping',
          data: this.ping_counters,
          date: TS
        });
        this.addMessage("<span class=\"selfMsg\">Self: </span>" + 'ping:'+this.ping_counters);
        // this.timeoutID = setTimeout(this.pingHeroku, 2000);
      },
      
      ready() {
        let self = this;
        this.conn.on('data', function (data) {
            console.log("Data recieved",data);

            if(data.type != undefined) {
              if(data.type == 'Pong' && data.data == self.ping_counters){
                self.pingHeroku();
              }
              self.addMessage("<span class=\"peerMsg\">Peer:</span> " + JSON.stringify(data));
            } else {
              var cueString = "<span class=\"cueMsg\">Cue: </span>";
              switch (data) {
                case 'Go':
                    self.go();
                    self.addMessage(cueString + data);
                    break;
                case 'Fade':
                    self.fade();
                    self.addMessage(cueString + data);
                    break;
                case 'Off':
                    self.off();
                    self.addMessage(cueString + data);
                    break;
                case 'Reset':
                    self.reset();
                    self.addMessage(cueString + data);
                    break;
                default:
                    self.addMessage("<span class=\"peerMsg\">Peer: </span>" + data);
                    break;
              };
            }
            
        });
        self.conn.on('close', function () {
            self.status = "Connection reset<br>Awaiting connection...";
            self.conn = null;
        });
      },
      go() {
          var standbyBox = document.getElementById("standby");
          var goBox = document.getElementById("go");
          var fadeBox = document.getElementById("fade");
          var offBox = document.getElementById("off");
          standbyBox.className = "display-box hidden";
          goBox.className = "display-box go";
          fadeBox.className = "display-box hidden";
          offBox.className = "display-box hidden";
          return;
      },
      fade() {
          var standbyBox = document.getElementById("standby");
          var goBox = document.getElementById("go");
          var fadeBox = document.getElementById("fade");
          var offBox = document.getElementById("off");
          standbyBox.className = "display-box hidden";
          goBox.className = "display-box hidden";
          fadeBox.className = "display-box fade";
          offBox.className = "display-box hidden";
          return;
      },
      off() {
          var standbyBox = document.getElementById("standby");
          var goBox = document.getElementById("go");
          var fadeBox = document.getElementById("fade");
          var offBox = document.getElementById("off");
          standbyBox.className = "display-box hidden";
          goBox.className = "display-box hidden";
          fadeBox.className = "display-box hidden";
          offBox.className = "display-box off";
          return;
      },
      reset() {
          var standbyBox = document.getElementById("standby");
          var goBox = document.getElementById("go");
          var fadeBox = document.getElementById("fade");
          var offBox = document.getElementById("off");
          standbyBox.className = "display-box standby";
          goBox.className = "display-box hidden";
          fadeBox.className = "display-box hidden";
          offBox.className = "display-box hidden";
          return;
      }, 
      addZero(t) {
            if (t < 10) t = "0" + t;
            return t;
      },
      addMessage(msg) {
        var now = new Date();
        var h = now.getHours();
        var m = this.addZero(now.getMinutes());
        var s = this.addZero(now.getSeconds());
        var ms = this.addZero(now.getMilliseconds());
        if (h > 12) h -= 12;
        else if (h === 0) h = 12;
        this.message = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "." + ms + "</span>  -  " + msg + this.message;
      },
      clearMessages() {
        this.message = "";
        this.addMessage("Msgs cleared");
      }
    }
  }
</script>