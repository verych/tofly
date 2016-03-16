var io = require('socket.io');
var http = require('http');

var app = http .createServer();
var io = io.listen(app);
console.log('listening on *:8888');
app.listen(8888);

var field = {
	w: 800,
	h: 600,
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
	    return parseInt(color);
	}

	var count = 100;
	console.log('generating ' + count + ' stars');

	for(var i = 0; i < count; i++){
		var z = Math.round(Math.random() * field.d + 1);
		stars.push({
			id: 'star' + i,
			x: Math.round(Math.random() * field.w),
			y: Math.round(Math.random() * field.h),
			z: z,
			color: getColor(z)
		});
	}
};
generateStars();


var mainClientLoop = function() {
	for(var i = clients.length - 1; i >= 0; i--) {
		tickClient(clients[i]);
	}
}

var mainGameLoop = function() {
	
	for(var i = stars.length - 1; i >= 0; i--) {
		stars[i].x -= (stars[i].z / 128);
		if(stars[i].x < 0) {
			stars[i].x = field.w;
		}
	}
	
}

var tickClient = function(client) {
	if(!client.viewport) {
		return;
	}

	//tick data
	var tickData = {};

	moveClient(client);
	updateClientSize(client);

	//stars
	tickData.stars = getClientStars(client);
	//clients
	tickData.clients = getClientClients(client);

	sockets[client.id].emit('tick', tickData);
}

var mainClientLoopInterval = setInterval(function(){
	mainClientLoop();
}, 10);

var mainGameLoopInterval = setInterval(function(){
	mainGameLoop();
}, 10);


io.sockets.on('connection', function (socket) {
	connectionsCount++;
	var currentClient = {
        id: socket.id,
        name: 'Flyer #' + connectionsCount,
        x: null,
        y: null,
        globalX: Math.random() * field.w,
        globalY: Math.random() * field.h,
        a: Math.round(Math.random() * 360),
        created: new Date().getTime(),
        score: 1,
        w: 10,
        h: 50,
        realW: 10,
        realH: 50,
        viewSize: 10,
        vx: 0,
        vy: 0,
        targetX: 0,
        targetY: 0,
        speed: 1
    };
	sockets[socket.id] = socket;
	clients.push(currentClient);
	console.log('new ' + currentClient.name + ' is connected (' + currentClient.id + ')');

	socket.on('respawn', function (data) {
		socket.emit('respawn', {user: currentClient});
	});
	socket.on('move', function (data) {
		updateClientMove(currentClient, data);
	});
	socket.on('resize', function (data) {
		updateClientSize(currentClient, data);
	});
	socket.on('disconnect', function (data) {
		var clientIndex = findIndex(clients, this.id);
		sockets[this.id].emit('die', 'disconnect');
		sockets[this.id].disconnect();
		if(clientIndex >= 0) {
			clients.splice(clientIndex, 1);
		}
		console.log('user ' + currentClient.name + ' disconnected (' + currentClient.id + ')' );
		console.log(clientIndex);
	});
});

var moveClient = function(client) {
    var deltaX = client.targetX - client.globalX;
    var deltaY = client.targetY - client.globalY;

    if (Math.abs(client.vx) > Math.abs(deltaX)) {
    	client.globalX = client.targetX;
        client.vx = 0;
    }
    if (Math.abs(client.vy) > Math.abs(deltaY)) {
    	client.globalY = client.targetY;
        client.vy = 0;
    }

    console.log(client.targetX, client.targetY, client.globalX, client.globalY);

	client.globalX += client.vx;
	client.globalY += client.vy;

	//checking for end of field
	if(client.globalX > field.w) {
		client.globalX = field.w;
	}
	if(client.globalX < 0 ) {
		client.globalX = 0;
	}
	if(client.globalY > field.h) {
		client.globalY = field.h;
	}
	if(client.globalY < 0 ) {
		client.globalY = 0;
	}

	//draw coords 
	client.x = Math.round(client.globalX);
	client.y =Math.round(client.globalY);
	//client.a += 0.1;
}

var updateClientMove = function(client, data) {
	//new position calculation
	client.targetX = data.x;
	client.targetY = data.y;

    var deltaX = data.x - client.globalX;
    var deltaY = data.y - client.globalY;
    var absSum = Math.abs(deltaX) + Math.abs(deltaY);
    if(absSum == 0) {
    	client.vx = 0;
    	client.vy = 0;
    	return;
    }
    else {
	    client.vx = (deltaX / (absSum));
	    client.vy = (deltaY / (absSum));
    }
   
    //console.log(client.vx, client.vy);
}

var updateClientSize = function(client, data) {

	if(data) {
		client.viewport = data;
		client.viewport.max = Math.max(data.w, data.h); 
	}
	if (!client.viewport) {
		return;
	}
	var maxRealSize = Math.max(client.realW, client.realH);
	

	client.viewport.visible = {};
	client.viewport.visible.x1 = client.globalX - client.viewSize * maxRealSize;
	client.viewport.visible.x2 = client.globalX + client.viewSize * maxRealSize;
	client.viewport.visible.y1 = client.globalY - client.viewSize * maxRealSize;
	client.viewport.visible.y2 = client.globalY + client.viewSize * maxRealSize;
	
}

var getClientClients = function(client) {
	return clients;
}

var getClientStars = function(client) {
	return stars;
	/*
	var clientStars = [];
	for(var i = 0; i < stars.length; i++) {
		if(stars[i].x > client.viewport.visible.x1 && stars[i].x < client.viewport.visible.x2 && stars[i].y > client.viewport.visible.y1 && stars[i].y < client.viewport.visible.y2) {
			clientStars.push({
				x: stars[i].x - client.viewport.visible.x1,
				y: stars[i].y - client.viewport.visible.y1,
				z: stars[i].z,
				color: stars[i].color				
			});
		}
	}
	return clientStars;*/
}
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