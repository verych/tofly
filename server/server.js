var io = require('socket.io');
var http = require('http');

var app = http .createServer();
var io = io.listen(app);
console.log('listening on *:8888');
app.listen(8888);

var field = {
	w: 2000,
	h: 1800,
	d: 16
};
var stars = [];
/*
var stars = [
	{x: 8, y: 100, z: 1, visible: true},
	{x: 80, y: 300, z: 2, visible: true},
	{x: 45, y: 14, z: 3, visible: false},
	{x: 77, y: 225, z: 4, visible: true},
	{x: 19, y: 500, z: 5, visible: true},
	{x: 500, y: 45, z: 4, visible: true},
	{x: 335, y: 11, z: 3, visible: true},
	{x: 720, y: 224, z: 2, visible: false},
	{x: 15, y: 422, z: 1, visible: true},
	{x: 652, y: 67, z: 3, visible: true}
];
*/
var clients = [];
var sockets = {};
var connectionsCount = 0;

var generateStars = function() {
	var getColor = function(level) {
		var spread = 2;
		var newLevel = field.d - level;
		if(newLevel + spread >= field.d) {
			newLevel = field.d - 1 - spread;
		}

	    var letters = '7899AABBBCCDDEEF'.split('');
	    var color = '0x';
	    for (var i = 0; i < 6; i++ ) {
	        color += letters[Math.floor(Math.random() * (newLevel + spread))];
	    }
	    //debugger;
	    return parseInt(color);
	}

	var count = 1000;
	console.log('generating ' + count + ' stars');

	for(var i = 0; i < count; i++){
		var z = Math.round(Math.random() * field.d);
		stars.push({
			x: Math.round(Math.random() * field.w),
			y: Math.round(Math.random() * field.h),
			z: z,
			color: getColor(z),
			visible: true
		});
	}
};
generateStars();


var mainClientLoop = function() {
	for(var i = clients.length - 1; i >= 0; i--) {
		tickPlayer(clients[i]);
	}
}

var mainGameLoop = function() {
	/*
	for(var i = stars.length - 1; i >= 0; i--) {
		stars[i].x -= (stars[i].z / 128);
		if(stars[i].x < 0) {
			stars[i].x = field.w;
		}
	}
	*/
}

var tickPlayer = function(client) {
	//console.log(client.name + " tick");
	if(!client.viewport) {
		//console.log('waiting for viewport data: ' + client.id);
		return;
	}

	//tick data
	var tickData = {stars: stars};
	//me
	client.x = client.viewport.w / 2;
	client.y = client.viewport.h / 2;
	//client.a += 0.1;

	tickData.me = client;

	//stars
	sockets[client.id].emit('tick', tickData);

	//clearInterval(mainClientLoopInterval);
}

var mainClientLoopInterval = setInterval(function(){
	mainClientLoop();
}, 10);

var mainGameLoopInterval = setInterval(function(){
	mainGameLoop();
}, 10);


io.sockets.on('connection', function (socket) {
	connectionsCount++;
	var currentPlayer = {
        id: socket.id,
        name: 'Flyer #' + connectionsCount,
        x: null,
        y: null,
        a: Math.round(Math.random() * 360),
        created: new Date().getTime(),
        score: 1,
        w: 10,
        h: 50
    };
	sockets[socket.id] = socket;
	clients.push(currentPlayer);
	console.log('new ' + currentPlayer.name + ' is connected (' + currentPlayer.id + ')');

	socket.on('respawn', function (data) {
		socket.emit('respawn', {user: currentPlayer});
	});
	socket.on('resize', function (data) {
		currentPlayer.viewport = data;
	});
	socket.on('disconnect', function (data) {
		var clientIndex = findIndex(clients, this.id);
		sockets[this.id].emit('die', 'disconnect');
		sockets[this.id].disconnect();
		if(clientIndex >= 0) {
			clients.splice(clientIndex, 1);
		}
		console.log('user ' + currentPlayer.name + ' disconnected (' + currentPlayer.id + ')' );
		console.log(clientIndex);
	});
});

//*****************utils*******************

function findIndex(arr, id) {
    var len = arr.length;

    while (len--) {
        if (arr[len].id === id) {
            return len;
        }
    }

    return -1;
};