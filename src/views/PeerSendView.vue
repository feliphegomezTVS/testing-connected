<script setup lang="ts">
</script>

<template>
  <main>
    <table class="control">
        <tr>
            <td class="title">Status:</td>
            <td class="title">Messages:</td>
        </tr>
        <tr>
            <td>
                <span style="font-weight: bold">ID: </span>
                <input type="text" v-model="recvIdInput" title="Input the ID from receive.html">
                <button @click="join">Connect</button>
            </td>
            <td>
                <input type="text" v-model="messageInput" placeholder="Enter a message..." autofocus="true" />
                <button type="button" @click="sendMessage">Send</button>
                <button type="button" @click="clearMessages">Clear Msgs (Local)</button>
            </td>
        </tr>
        <tr>
            <td><div id="status" class="status">{{status}}</div></td>
            <td><div class="message" id="message" v-html="message"></div></td>
        </tr>
        <tr>
            <td><button type="button" class="control-button" @click="signal('Reset')">Reset</button></td>
            <td><button type="button" class="control-button" @click="signal('Go')">Go</button></td>
        </tr>
        <tr>
            <td><button type="button" class="control-button" @click="signal('Fade')">Fade</button></td>
            <td><button type="button" class="control-button" @click="signal('Off')">Off</button></td>
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
        ping_counter: 0,
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
        status: '',
        lastPeerId: '',
        conn: null,
        recvIdInput: '',
        message: '',
        messageInput: '',
        cueString: "<span class=\"cueMsg\">Cue: </span>",
      }
    },
    mounted() {
      console.log("mounted Peer Send");
      let self = this;
      this.initialize();

    },
    methods: {
      initialize() {
        let self = this;

        self.peer.on('open', function (id) {
          if (self.peer.id === null) {
            console.log('Received null id from peer open');
            self.peer.id = self.lastPeerId;
          } else self.lastPeerId = self.peer.id;
          console.log('ID: ' + self.peer.id);
        });
        self.peer.on('connection', function (c) {
          // Disallow incoming connections
          c.on('open', function() {
            c.send("Sender does not accept incoming connections");
            setTimeout(function() { c.close(); }, 500);
          });
        });
        self.peer.on('disconnected', function () {
          self.status = "Connection lost. Please reconnect";
          console.log('Connection lost. Please reconnect');

          // Workaround for peer.reconnect deleting previous id
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
          alert('x00 ' + err);
        });
      },
      join() {
        let self = this;
        console.log('connected to: ', self.recvIdInput)
        if (self.conn) self.conn.close();
        self.conn = self.peer.connect(self.recvIdInput, {
            reliable: true
        });
        self.conn.on('open', function () {
            self.status = "Connected to: " + self.conn.peer;
            console.log("Connected to: " + self.conn.peer);
            var command = self.getUrlParam("command");
            if (command) self.conn.send(command);
        });

        self.conn.on('data', function (data) {
          // console.log('data', data)
          if(data.type != undefined) {
            if(data.type == 'ping' && data.data == (self.ping_counter+1)){
              var TS = window.performance.timing.navigationStart + window.performance.now();
              self.ping_counter++;
              self.signal({
                type: 'Pong',
                data: self.ping_counter,
                date_r: TS - data.date_s
              });
            }
            self.addMessage("<span class=\"peerMsg\">Peer:</span> " + JSON.stringify(data));
          } else {
            self.addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
          }
        });
        self.conn.on('close', function () {
          self.status = "Connection closed";
          self.ping_counter = 0;
        });
      }, 
      getUrlParam(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if (results == null) return null;
        else return results[1];
      }, 
      signal(sigName) {
        if (this.conn && this.conn.open) {
          this.conn.send(sigName);
          console.log(sigName + " signal sent");
          this.addMessage(this.cueString + JSON.stringify(sigName));
        } else {
          console.log('Connection is closed');
        }
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
      },
      sendMessage() {
        if (this.conn && this.conn.open) {
          var msg = this.messageInput;
          this.messageInput = "";
          this.conn.send(msg);
          console.log("Sent: " + msg);
          this.addMessage("<span class=\"selfMsg\">Self: </span> " + msg);
        } else {
          console.log('Connection is closed');
        }
      }
    }
  }
</script>