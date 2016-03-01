var io = require('socket.io');
var http = require('http');

var app = http .createServer();
var io = io.listen(app);
console.log('listening on *:8888');
app.listen(8888);

io.sockets.on('connection', function (socket) {
	console.log('new client is connected');
	console.log(socket);
	socket.on('eventServer', function (data) {
		console.log(data.action);
		socket.emit('eventClient', {'action': 'respawn', 'x': 5, 'y': 70});
	});
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
});
