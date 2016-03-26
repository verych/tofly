var io = require('socket.io');
var http = require('http');

var app = http .createServer();
var io = io.listen(app);
console.log('listening on *:8888');
app.listen(8888);

var field = {
	w: 1920,
	h: 1080,
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

var isBusyPlace = function(place) {
		for(var j = stars.length - 1; j >= 0; j--){
			if(place == stars[j]) {
				continue;
			}
			if(isObjectsIntersection(place, stars[j])) {
				return true;
			}
		}
		for(var j = clients.length - 1; j >= 0; j--){
			if(place == clients[j]) {
				continue;
			}
			if(isObjectsIntersection(place, clients[j])) {
				return true;
			}
		}
}

var getPlace = function(src, tries) {
	tries = tries ? tries : 100;
	src = src?src : {};

	var res = {
		x: Math.round(Math.random() * field.w),
		y: Math.round(Math.random() * field.h),
		r: src.r?src.r: Math.round(Math.random() * 16 + 1),
		vx: 0,
		vy: 0
	}

	if(isBusyPlace(res)) {
		if(tries > 0) {
			return getPlace(src, --tries);
		}
		else {
			console.log('Cannot allocate a place for star.');
		}
	}
	return res;
}

var generateStars = function() {
	var getColor = function(level) {
		var spread = 3;
		var newLevel = field.d - level;
		if(newLevel + spread >= field.d) {
			newLevel = field.d - 1 - spread;
		}

	    var letters = '12345678999ABCDE'.split('');
	    var color = '0x';
	    for (var i = 0; i < 6; i++ ) {
	        color += letters[Math.floor(Math.random() * (newLevel + spread))];
	    }
	    return parseInt(color);
	}

	var count = 500;
	//console.log('generating ' + count + ' stars');

	for(var i = 0; i < count; i++){
		var place = getPlace();
		var z = Math.round(Math.random() * field.d + 1);
		stars.push({
			id: 'star' + i,
			x: place.x,
			y: place.y,
			z: z,
			r: place.r, //Math.round(Math.random() * field.d * 2),
			vx: 3, //(Math.random() - 0.5) / 2, //(Math.random() - 0.5) * z,
			vy: 0, //(Math.random() - 0.5) / 2, //(Math.random() - 0.5) * z,
			color: getColor(z)
		});
	}
};


var mainClientLoop = function() {
	for(var i = clients.length - 1; i >= 0; i--) {
		tickClient(clients[i]);
	}
}

var mainGameLoop = function() {
	
	for(var i = stars.length - 1; i >= 0; i--) {

		//stars collision
		for(var j = i - 1; j >= 0; j--){
			if(isObjectsIntersection(stars[i], stars[j])) {
				//console.log('Bang!', stars[i].r, stars[j].r);
				doStarsCollision(stars[i], stars[j]);
			}
		}
		//clients collision
		for(var j = clients.length - 1; j >= 0; j--){
			if(isObjectsIntersection(stars[i], clients[j])) {
				//console.log('Bang!', stars[i].r, stars[j].r);
				doStarsCollision(stars[i], clients[j]);
			}
		}

		stars[i].x += stars[i].vx;
		stars[i].y += stars[i].vy;
		//stars[i].y -= Math(stars[i].z / 16)
		if(stars[i].x < 0) {
			stars[i].x = field.w;
		}
		if(stars[i].y < 0) {
			stars[i].y = field.h;
		}
		if(stars[i].x > field.w) {
			stars[i].x = 0;
		}
		if(stars[i].y > field.h) {
			stars[i].y = 0;
		}
	}
	
}

var doStarsCollision = function(s1, s2) {
	var m1 = s1.m;
	var m2 = s2.m;
	if(!m1) {
		m1 = Math.PI * s1.r * s1.r;
	}
	if(!m2) {
		m2 = Math.PI * s2.r * s2.r;
	}

	var dx = s1.x - s2.x;
	var dy = s1.y - s2.y;
	var alpha = Math.atan2(dy, dx);
	var cosA = Math.cos(alpha);
	var sinA = Math.sin(alpha);
	//projections
	var vxp1 = s1.vx * cosA + s1.vy * sinA;
	var vxp2 = s2.vx * cosA + s2.vy * sinA;
	var vyp1 = s1.vy * cosA - s1.vx * sinA;
	var vyp2 = s2.vy * cosA - s2.vx * sinA;
	//P
	var p = m1 * vxp1 + m2 * vxp2;
	var k = 0.99;

	var v = vxp1 - vxp2;
	var v2f = (p + m1 * v) / (m1 + m2);
	var v1f = v2f - vxp1 + vxp2;
	var vxp1 = v1f;
	var vxp2 = v2f;

	s1.vx = (vxp1 * cosA - vyp1 * sinA) * k;
	s2.vx = (vxp2 * cosA - vyp2 * sinA) * k;
	s1.vy = (vyp1 * cosA + vxp1 * sinA) * k;
	s2.vy = (vyp2 * cosA + vxp2 * sinA) * k;

	/*s1.x += s1.vx;
	s1.y += s1.vy;
	s2.x += s2.vx;
	s2.y += s2.vy;
	*/
	//separateObjects(s1, s2, 3);
	if(s1.confused < 1) {
		s1.confused = 3;
	}
	if(s2.confused < 1) {
		s2.confused = 3;
	}
	

	//console.log(alpha);
}

var separateObjects = function(o1, o2, d) {
	try {
		if(isObjectsIntersection(o1, o2) && d > 0) {
			if(o1.x == 0 && o1.y == 0 && o2.x == 0 && o2.y == 0) {
				return;
			}
			if(o1.x == o2.x && o1.y == o2.y) {
				return;
			}
			o1.x += o1.vx;
			o1.y += o1.vy;
			o2.x += o2.vx;
			o2.y += o2.vy;
			separateObjects(o1, o2, --d);
		}
	}
	catch (e){
		console.log(e);
	}
}

var isObjectsIntersection = function(o1, o2) {
	return Math.sqrt(Math.pow(o1.x + o1.vx - o2.x - o2.vx, 2) + Math.pow(o1.y + o1.vy - o2.y - o2.vy, 2)) < (o1.r + o2.r);
}



var tickClient = function(client) {
	if(client.confused > 0) {
		client.confused--;
		console.log(client.confused);
	}

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

io.sockets.on('connection', function (socket) {
	connectionsCount++;

	var place = getPlace({r: 25});

	var currentClient = {
        id: socket.id,
        name: 'Flyer #' + connectionsCount,
        x: place.x,
        y: place.y,
        a: Math.round(Math.random() * 360),
        created: new Date().getTime(),
        score: 1,
        w: 60,
        h: 50,
        r: place.r,
        m: 3000,
        realW: 10,
        realH: 50,
        viewSize: 10,
        vx: 0,
        vy: 0,
        targetX: 0,
        targetY: 0,
        speed: 1,
        confused: 0,
    };
	sockets[socket.id] = socket;
	clients.push(currentClient);
	console.log('new ' + currentClient.name + ' is connected (' + currentClient.id + ')');

	socket.on('respawn', function (data) {
		socket.emit('respawn', {user: currentClient, field: field});
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
	if(client.confused > 0) {
		if(isBusyPlace(client)) {
			console.log('moving to busy place');
		}
		client.x += client.vx;
		client.y += client.vy;
	}
	else {

	    var deltaX = client.targetX - client.x;
	    var deltaY = client.targetY - client.y;

	    var absSum = Math.abs(deltaX) + Math.abs(deltaY);
	    if(absSum == 0) {
	    	return;
	    }
	    else {
		    client.vx = (deltaX / (absSum));
		    client.vy = (deltaY / (absSum));
	    }


	    if (Math.abs(client.vx) > Math.abs(deltaX)) {
	    	client.x = client.targetX;
	        //client.vx = 0;
	    }
	    if (Math.abs(client.vy) > Math.abs(deltaY)) {
	    	client.y = client.targetY;
	        //client.vy = 0;
	    }

    
		calcNewRotation(client);

		client.x += Math.cos(client.a) ;
		client.y += Math.sin(client.a);
	}


    //console.log(client.vx, client.vy, client.a);


	//checking for end of field
	if(client.x > field.w) {
		client.x = field.w;
	}
	if(client.x < 0 ) {
		client.x = 0;
	}
	if(client.y > field.h) {
		client.y = field.h;
	}
	if(client.y < 0 ) {
		client.y = 0;
	}

	//draw coords 
	//client.x = Math.round(client.x);
	//client.y = Math.round(client.y);
	//client.a += 0.1;
}

var updateClientMove = function(client, data) {
	//new position calculation
	client.targetX = data.x;
	client.targetY = data.y;
}

var calcNewRotation = function (client) {
    var step = 0.02;
    var a = normalizeAngle(Math.atan2(client.vy, client.vx));
    var delta = Math.abs(client.a - a);

    //checking for optimal rotation direction
    if (180 < delta * (180 / Math.PI)) {
        if (a > client.a) {
            a = a - 360 / (180 / Math.PI);
            delta = Math.abs(client.a - a);
        }
        else if (a < client.a) {
            client.a = client.a - 360 / (180 / Math.PI);
            delta = Math.abs(client.a - a);
        }
    }
    //the last rotation step checking
    if (delta <= step) {
        client.a = a;
        if (client.a < 0) {
            client.a = client.a + (360 / (180 / Math.PI));
        }
        //this.removeAction(this.actions.rotate);
        return;
    }

    //rotation
    if (client.a > a) {
        client.a -= step;
    }
    else {
        client.a += step;
    }
};

var normalizeAngle = function(a) {
	var pi2 = 3.14*2;
	if(a < 0) {
		return normalizeAngle(a + pi2);
	}
	if(a > pi2) {
		return normalizeAngle(a - pi2);
	}
	return a;
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
	client.viewport.visible.x1 = client.x - client.viewSize * maxRealSize;
	client.viewport.visible.x2 = client.x + client.viewSize * maxRealSize;
	client.viewport.visible.y1 = client.y - client.viewSize * maxRealSize;
	client.viewport.visible.y2 = client.y + client.viewSize * maxRealSize;
	
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



var mainClientLoopInterval = setInterval(function(){
	mainClientLoop();
}, 10);

var mainGameLoopInterval = setInterval(function(){
	mainGameLoop();
}, 10);

generateStars();

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