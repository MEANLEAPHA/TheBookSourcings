
 
const io = require('socket.io')(3000, {
    cors: {
        origin: ['http://127.0.0.1:5501'],
    }
})

io.on('connection', socket => {
    console.log(socket.id)
})