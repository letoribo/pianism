var express = require('express'),
app = express(),
server = require('http').createServer(app),
io = require('socket.io').listen(server);
io.set('log level', 1);
app.use(express.static(__dirname + '/static'));

io.sockets.on('connection', function(socket) {
  socket.on('noteOn', function(data) {
    socket.broadcast.emit('onNoteOn', data);
  });

  socket.on('noteOff', function(data) {
	 socket.broadcast.emit('onNoteOff', data);
  });
});

var port = Number(process.env.PORT || 3000);
server.listen(port);
