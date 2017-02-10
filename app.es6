const commander = require('commander')
const SerialPort = require('serialport')
const colors = require('colors')
const io = require('socket.io')
const express = require('express')
const debug = require('debug')

// renderer.render()
const END_MESSAGE_CHAR = '#'

class App {

  constructor() {
    commander
      .version('0.0.1')
      .option('-p, --port [port]', 'port the server runs on [3000]', 3000)
      .option('-a, --aml [fileName]', 'name of the aml doc relative to the /aml directory', 'Anlage')
      .option('-b, --bbq-sauce', 'Add bbq sauce')
      .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
      .parse(process.argv)

    const log = debug('app')
    const appPort = 8080

    const app = express()

    log(`socket.io listening on ${appPort}`)

    log('booting webserver, stay calm')
      // Define the port to run on
    app.set('port', appPort)

    app.use(express.static(`${__dirname}/hmi`))
    app.use(express.static(`${__dirname}/`))

    // Listen for requests
    const server = app.listen(app.get('port'), () => {
      const port = server.address().port
      console.log(`Experience the future at http://localhost:${port}`)
    })

    // this.port = new SerialPort('/dev/cu.usbmodem1633611', {
    // 		baudRate: 9600,
    // 		parser: SerialPort.parsers.readline('\n')
    // });
    //
    // this.port.on('data', (d) => {
    //
    // 		console.log(d.blue)
    //
    // })
    //
    // this.port.on('error', function(err) {
    // 		console.error('Error: ', err.message);
    // })
    //
    // this.port.on('open', ()=> {
    //
    //
    // 	this.port.write('R1 10 R2 10\r', ()=>{
    // 		console.log('send'.green)
    // 	});
    //
    // });

    this.io = io.listen(server)

    const serialPorts = {}

    this.io.sockets.on('connection', (socket) => {
      console.log('client connected'.green)

      // retrieve serial ports
      socket.on('getPortList', (data, cb) => {
        SerialPort.list((err, ports) => {
          cb(ports.map(port => port.comName))
        })
      })

      // set port in setup
      socket.on('connectToPort', (data, cb) => {
        console.log('client setup'.green)
        console.log(data)

        console.log('connecting to port: '.green + data.port)

        if (serialPorts[data.port]) {
          cb('open')
        } else {
          serialPorts[data.port] = new SerialPort(data.port, {
            baudRate: data.baudrate || 38400,
            parser: SerialPort.parsers.readline('\n'),
          })

          serialPorts[data.port].on('data', (d) => {
            console.log(d.blue)
          })

          serialPorts[data.port].on('error', (err) => {
            console.error('Error: ', err.message)
          })

          serialPorts[data.port].on('open', () => {
            cb('open')
          })
          serialPorts[data.port].on('disconnect', () => {
            // setTimeout(() => {
            //   serialPorts[data.port] = new SerialPort(data.port, {
            //     baudRate: data.baudrate || 9600,
            //     parser: SerialPort.parsers.readline('\n'),
            //   })
            // }, 5000)
            socket.emit('portStatusChanged', {
              status: 'disconnected',
            })
          })
        }

        socket.on('write', (data, cb) => {
          console.log('received: '.green)
          console.log(data)
            // cb(data)
          serialPorts[data.port].write(data.message, cb)
        })
      })
    })
  }

}

const test = new App()
