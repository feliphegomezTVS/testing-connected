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
                <button type="button" @click="pingHeroku">Ping/Pong</button>
                <button type="button" @click="clickConnect">Connect Serial</button>
            </td>
        </tr>
        <tr>
            <td><div id="status" class="status">{{status}}</div></td>
            <td><div class="message" id="message" v-html="message"></div></td>
        </tr>
        <tr>
            <td><div class="message">PING</div></td>
            <td><div class="message">{{ping_counters}}</div></td>
        </tr>
        <tr>
            <td><div class="message">SUM Timer</div></td>
            <td><div class="message">{{latency_sum}}</div></td>
        </tr>
        <tr>
            <td><div class="message">Calc Ping</div></td>
            <td><div class="message">{{latencyR}}</div></td>
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

    
  class LineBreakTransformer {
      constructor() {
          // A container for holding stream data until a new line.
          this.chunks = "";
      }

      transform(chunk, controller) {
          // Append new chunks to existing chunks.
          this.chunks += chunk;
          // For each line breaks in chunks, send the parsed lines out.
          const lines = this.chunks.split("\r\n");
          this.chunks = lines.pop();
          lines.forEach((line) => controller.enqueue(line));
      }

      flush(controller) {
          // When the stream is closed, flush any remaining chunks out.
          controller.enqueue(this.chunks);
      }
  }


  export default {
    data () {
      return {
        ping_counters: 0,
        latency_sum: 0,
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
        timeoutID: null,

        port: null,
        portConected: false,
        usbVendorId: '',
        usbProductId: '',
        isReadLoopConnected: false,

        
        dinf: {
          a: '^001([0-9A-F]){0,17}|^200([0-9A-F]){0,17}|^201([0-9A-F]){0,17}|^301([0-9A-F]){0,17}|^300([0-9A-F]){0,17}|^7([0-9A-F]){0,19}|^6([0-9A-F]){0,19}$',
          b: '^7([0-9A-F]){0,2}80([0-9])([0-9A-F]){0,14}$',
          c: '^7([0-9A-F]){0,3}0([0-9A-F]){0,1}04([0-9A-F]){0,12}|^7([0-9A-F]){0,2}82([0-9A-F]){0,15}|^7([0-9A-F]){0,3}023E([0-9A-F]){0,12}|^7DF([0-9A-F]){0,17}|^700([0-9A-F]){0,17}$',
          d: '^7([0-9A-F]){0,2}81([0-9A-F]){0,3}36([0-9A-F]){0,10}|^7([0-9A-F]){0,2}80([0-9A-F]){0,1}37([0-9A-F]){0,12}$',
          e: '^7([0-9A-F]){0,2}80276([0-9A-F]){0,12}|^7([0-9A-F]){0,2}80([0-9A-F]){0,1}74([0-9A-F]){0,12}$',
          f: '^001([0-9A-F]){0,17}|^7([0-9A-F]){0,3}3([0-9A-F]){0,13}|^([0-6]){0,1}([0-9A-F]){0,19}$',
          g: '^001([0-9A-F]){0,17}|^7([0-9A-F]){0,2}82([0-9A-F]){0,15}|^700([0-9A-F]){0,17}|^7([0-9A-F]){0,3}023E80([0-9A-F]){0,10}$',
          h: '^7([0-9A-F]){0,2}82([0-9A-F]){0,15}|^700([0-9A-F]){0,17},$',
          i: '^7([0-9A-F]){0,3}1([0-9A-F]){0,3}36([0-9A-F]){0,10}$',
          j: '^7([0-9A-F]){0,3}037F3672([0-9A-F]){0,8}$',
          k: '^7([0-9A-F]){0,2}80276([0-9A-F]){0,12}$',
          l: '^7([0-9A-F]){0,3}3([0-9A-F]){0,15}$',
          m: '^7([0-9A-F]){0,2}80276([0-9A-F]){0,12}|^7([0-9A-F]){0,3}037F3672([0-9A-F]){0,8}$',
          n: '^7([0-9A-F]){0,2}80([0-9A-F]){0,1}74([0-9A-F]){0,12}$',
          o: 0,
          p: null,
          q: 150,
          r: '^7([0-9A-F]){0,3}0([0-9A-F]){0,1}5003([0-9A-F]){0,10}$',
          s: '^7([0-9A-F]){0,3}0([0-9A-F]){0,1}51([0-9A-F]){0,12}|^7([0-9A-F]){0,3}0([0-9A-F]){0,1}11([0-9A-F]){0,12}$',
          t: '^7E([0-9A-F]){0,1}8044142([0-9A-F]){0,10}$',
          y: '^7([0-9A-F]){0,2}83([0-9A-F]){0,15}|^7([0-9A-F]){0,3}037F3672([0-9A-F]){0,8}|^7([0-9A-F]){0,3}037F0111([0-9A-F]){0,8}|^7([0-9A-F]){0,3}037F([0-9A-F]){0,2}78([0-9A-F]){0,8}|^7([0-9A-F]){0,3}0([0-9A-F]){0,1}76([0-9A-F]){0,12}$',
        },
        info: {
          a: "7DF80201429999999999",
          b: "pauseIPafterThisMessage",
          c: "pauseIPinstant",
          d: "pauseFlashBlockArrayafterThisMessage",
          e: "0028991200000000",
          f: "00189900000000000083",
          g: "full Reset",
          h: "70080211019999999999",
          i: "70080214009999999999",
          j: "7008023E009999999999",
          k: "unpauseIP",
          l: "skippauseIPinstant",
          m: "recallLastFlashBlock",
          n: "blockCANBUSMessage",
          o: "00189900000000000083",
        },
        inputDone: '',
        inputStream: null,
        reader: null,
        CANCounterGUI: 0,
        CANMessageGUI: '',
        CANActionGUI: '',
        pauseIP: false,
        recallLastFlashBlock: false,
        pauseFlashBlockArray: false,
        arrayLastFlashBlock: [],
        pauseIPinstant: false,
        skippauseIPinstant: false,
      }
    },
    mounted() {
      console.log("mounted Peer Receive");
      this.initialize()
    },
    computed: {
      latencyR() {
        return ((this.latency_sum / this.ping_counters) / this.ping_counters) || -1;
      },
    },
    methods: {
      async clickConnect() {
        if (this.port) {
          await this.disconnect();
        } else {
          await this.connect();
        }
      },
      async openSerialPort() {
        this.port = await navigator.serial.requestPort();
        try {
          await this.port.open({baudRate: 57600});
          // this.reconnectSocket();
          this.usbVendorId = this.port.getInfo().usbVendorId;
          this.usbProductId = this.port.getInfo().usbProductId;
          this.portConected = true
        } catch (e) {
          this.port = null;
          console.log("Connection failed, please try again!")
        }
      },
      async connect() {
        await this.openSerialPort();
        if (this.portConected) {
          // await this.streamWriter();
          await this.streamReader();
          this.isReadLoopConnected = true;
          await this.readLoop(this.isReadLoopConnected);
        }
      },
      streamReader() {
        let decoder = new TextDecoderStream();
        this.inputDone = this.port.readable.pipeTo(decoder.writable);
        this.inputStream = decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));
        this.reader = this.inputStream.getReader();
      },
      streamWriter() {
        const encoder = new TextEncoderStream();
        this.outputDone = encoder.readable.pipeTo(this.port.writable);
        this.outputStream = encoder.writable;
      },
      async disconnect() {
        if (this.reader) {
          await this.reader.cancel();
          await this.inputDone.catch(() => {
          });
          this.reader = null;
          this.inputDone = null;
        }
        if (this.outputStream) {
          await this.outputStream.getWriter().close();
          await this.outputDone;
          this.outputStream = null;
          this.outputDone = null;
        }
        this.isReadLoopConnected = false;
        if (this.port) {
          await this.port.close();
        }
        this.portConected = false;
        this.port = null;
      },
      writeToStream(...lines) {
        if (this.outputStream !== null) {
          const writer = this.outputStream.getWriter();
          lines.forEach((line) => {
            let lineWithoutEndOfLine = line.replace(/(\r\n|\n|\r)/gm, "")
            writer.write(lineWithoutEndOfLine + "X");
          });
          writer.releaseLock();
        }
      },
      async readLoop(isConnected) {
        while (isConnected) {
          const {value, done} = await this.reader.read();
          //this.Filters(value);
          console.log('CANBUSMessage', value)
          if (done) {
            this.reader.releaseLock();
            break;
          }
        }
      },
      emitToSocket(CANBUSMessage) {
        this.arrayTemp.push(CANBUSMessage)
        this.contador = this.contador + this.arrayTemp.length;
        // this.socket.emit("canMessages", this.arrayTemp)
        if (this.channel){
          this.channel.send(JSON.stringify(this.arrayTemp))
        }

        this.arrayTemp = [];
      },
      UIIPRendering(IPMessage) {
        if (this.IPMessages.length <= 20) {
          this.IPMessages.push(IPMessage);
        } else {
          this.IPMessages = [];
        }
      },
      Filters(CANBUSMessage) {
        if (CANBUSMessage.indexOf('ERROR') === -1) {
          this.CANCounterGUI++;
          if (CANBUSMessage.slice(4, 5) !== "2") {
            this.CANMessageGUI = CANBUSMessage;
          }
          if (this.info.a.test(CANBUSMessage)) {
            this.pauseIP = false;
            this.CANActionGUI = this.dinf.k;

            if (this.info.k.test(CANBUSMessage)) {
              this.recallLastFlashBlock = false;
              this.pauseFlashBlockArray = true;
              this.arrayLastFlashBlock = [];

            }
            if (this.info.e.test(CANBUSMessage) && (this.pauseFlashBlockArray === true)) {
              this.pauseIPinstant = false;
              this.pauseIP = true;
              this.skippauseIPinstant = true;
              this.CANActionGUI = this.dinf.l
            }
            if (this.info.t.test(CANBUSMessage)) {
              // this.changeVoltageGUI(CANBUSMessage);
            }
            if (this.info.j.test(CANBUSMessage)) {
              this.recallLastFlashBlock = true;
              this.CANActionGUI = this.dinf.m
              this.pauseFlashBlockArray = false;
            }
            if ((this.recallLastFlashBlock === true) && this.info.l.test(CANBUSMessage)) {
              this.pauseFlashBlockArray = false;
            }
            if ((this.info.m.test(CANBUSMessage) === true)) {
              if (this.info.o !== 255) {
                this.info.o = this.info.o + 1;
              } else {
                this.info.o = 0
              }
              this.convertFlashBlockCounter()
            }
            if ((this.info.n.test(CANBUSMessage) === true)) {
              this.info.o = 1;
              this.convertFlashBlockCounter()
            }
            if ((this.info.y.test(CANBUSMessage))) {
              this.CANActionGUI = this.dinf.n;
            } else {
              this.emitToSocket(CANBUSMessage);
            }
          }
        }
      },
      convertFlashBlockCounter() {
        this.info.p = this.info.o.toString(16);
        if (this.info.o < 16) {
          this.info.p = "0" + this.info.p;
        }
      },
      async blockIPMessage(line) {
        this.letIPMessagePass = true;
        this.writeToStream(line);
      },



      async connectSerialport() {
        let self = this;
        if ("serial" in navigator) {
          // const ports = await navigator.serial.getPorts();
          // console.log('ports', ports)
          const port = await navigator.serial.requestPort();
          console.log('port', port)
          await port.open({ baudRate: 57600 });
          const { usbProductId, usbVendorId } = port.getInfo();
          // console.log('usbProductId', usbProductId, 'usbVendorId', usbVendorId)

          // const signals = await port.getSignals();
          // console.log(`Clear To Send:       ${signals.clearToSend}`);
          // console.log(`Data Carrier Detect: ${signals.dataCarrierDetect}`);
          // console.log(`Data Set Ready:      ${signals.dataSetReady}`);
          // console.log(`Ring Indicator:      ${signals.ringIndicator}`);
          
          // const textDecoder = new TextDecoderStream();
          // const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
          // const reader = textDecoder.readable.getReader();

          // // Listen to data coming from the serial device.
          // while (true) {
          //   const { value, done } = await reader.read();
          //   if (done) {
          //     reader.releaseLock();
          //     break;
          //   }
          //   // value is a string.
          //   console.log(value);
          // }

          // const textEncoder = new TextEncoderStream();
          // const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);}
          // console.log(textEncoder)
            /*
          var reader;
          while (port.readable) {
            try {
              reader = port.readable.getReader({ mode: "byob" });
            }
            catch {
              reader = port.readable.getReader();
            }
            let buffer = null;
            for (;;) {
              const {value, done} = await (async () => {
                if (reader instanceof ReadableStreamBYOBReader) {
                  if (!buffer) {
                    buffer = new ArrayBuffer(bufferSize);
                  }
                  const {value, done} =
                      await reader.read(new Uint8Array(buffer, 0, bufferSize));
                  buffer = value?.buffer;
                  return {value, done};
                } else {
                  return await reader.read();
                }
              })();

              if (value) {
                self.conn.send(value)
              }
              if (done) {
                break;
              }
            }
          } catch (e) {
            console.error(e);
            console.log(`<ERROR: ${e.message}>`)
          } finally {
            if (reader) {
              reader.releaseLock();
              reader = undefined;
            }
          }
          */
        } else {
          console.log("Serial port no soportado");
        }
      },
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
            self.ping_counters = 0;
            self.latency_sum = 0;
            console.log('Connection lost. Please reconnect');
            // Workaround for self.peer.reconnect deleting previous id
            self.peer.id = self.lastPeerId;
            self.peer._lastServerId = self.lastPeerId;
            self.peer.reconnect();
        });
        self.peer.on('close', function() {
            self.conn = null;
            self.ping_counters = 0;
            self.latency_sum = 0;
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
        if (this.conn && this.conn.open) {
          var TS = window.performance.timing.navigationStart + window.performance.now();
          this.ping_counters++;
          this.conn.send({
            type: 'ping',
            data: this.ping_counters,
            date_s: TS
          });
          this.addMessage("<span class=\"selfMsg\">Self: </span>" + 'ping:'+this.ping_counters);
          // this.timeoutID = setTimeout(this.pingHeroku, 2000);
        } else {
          console.log('Connection is closed');
        }
      },
      
      ready() {
        let self = this;
        this.conn.on('data', function (data) {
            console.log("Data recieved",data);

            if(data.type != undefined) {
              if(data.type == 'Pong' && data.data == self.ping_counters){
                self.latency_sum += data.date_r;
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
            self.ping_counters = 0;
            self.latency_sum = 0;
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