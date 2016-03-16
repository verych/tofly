var tofly = {
	//config
	config: {
		w: 1200,
		h: 350,
		background: 0x010122,
		images: {
			disk: {
				url: 'img/disk.png',
				w: 725,
				h: 725	
			}
		}
	}
};

$(function(){
	tofly.storage = {clients: {}, stars: {}};
	tofly.initGraphics();
	tofly.initSockets();

	$(window).resize(function() {
	  	tofly.resize();
	});
});

tofly.initGraphics = function(){
	this.renderer = PIXI.autoDetectRenderer(this.config.w, this.config.h,{backgroundColor : this.config.background});
	document.body.appendChild(this.renderer.view);
	$(this.renderer.view).mousemove(function(e){
		tofly.doMove(e);
	});

	// create the root of the scene graph
	this.stage1 = new PIXI.Container();
	// create the root of the scene graph
	this.layerBackground = new PIXI.Container();
	this.stage1.addChild(this.layerBackground);
	this.layerClients = new PIXI.Container();
	this.stage1.addChild(this.layerClients);

	// create a texture from an image path
	var texture = PIXI.Texture.fromImage(this.config.images.disk.url);

	tofly.animate();
}

tofly.animate = function(){
	requestAnimationFrame($.proxy(this.animate, this));
    // render the container
    this.renderer.render(this.stage1);
};


tofly.initSockets = function (){
	this.socket = io.connect('http://tofly:8888');
	this.socket.on('respawn', $.proxy(this.doRespawn, this));
	this.socket.on('tick', $.proxy(this.doTick, this));
	this.resize();
	this.socket.emit('respawn', { data: {'action': 'respawn'}});
}

tofly.doMove = function(e) {
	this.socket.emit('move', { x: e.clientX, y: e.clientY});
	//console.log({ x: e.clientX, y: e.clientY});
}

tofly.doTick = function(data){
	this.updateClients(data.clients);
	this.drawBackground(data.stars);
}

tofly.doRespawn = function(data){
	//do nothing
}

tofly.drawBackground = function(stars) {
	for(var i = 0; i < stars.length; i++) {
		//checking if star exists
		if(this.storage.stars[stars[i].id]) {
			this.storage.stars[stars[i].id].position.x = stars[i].x;
			this.storage.stars[stars[i].id].position.y = stars[i].y;
			this.storage.stars[stars[i].id].justUpdated = true;
		}
		else {
			var star = new PIXI.Graphics();
			star.position.x = stars[i].x;
			star.position.y = stars[i].y;

			// set fill and line style
			star.beginFill(stars[i].color);
			//star.lineStyle(0.1, 0xeeeeff, 1);
			//star.drawCircle(0, 0, Math.ceil(stars[i].z / 8));
			star.drawRect(0,0,1,1);

			star.endFill();
			star.justUpdated = true;

			this.layerBackground.addChild(star);
			this.storage.stars[stars[i].id] = star;
		}	
	}
	for(var id in this.storage.stars) {
		if(!this.storage.stars[id].justUpdated) {
			//debugger;
			this.layerBackground.removeChild(this.storage.stars[id]);
			delete this.storage.stars[i];
			continue;
		}
		this.storage.stars[id].justUpdated = false;
	}
}

tofly.updateClients = function(clients) {
	for(var i = 0; i < clients.length; i++) {
		//checking if client exists
		if(this.storage.clients[clients[i].id]) {
			this.storage.clients[clients[i].id].position.x = clients[i].x;
			this.storage.clients[clients[i].id].position.y = clients[i].y;
			this.storage.clients[clients[i].id].justUpdated = true;
		}
		else {
			var client = new PIXI.Graphics();
			client.position.x = clients[i].x;
			client.position.y = clients[i].y;

			// set fill and line style
			client.beginFill(0xeeeeff);
			//star.lineStyle(0.1, 0xeeeeff, 1);
			client.drawCircle(0, 0, 10);
			client.endFill();
			client.justUpdated = true;

			this.layerClients.addChild(client);
			this.storage.clients[clients[i].id] = client;
		}	
	}
	for(var id in this.storage.clients) {
		if(!this.storage.clients[id].justUpdated) {
			//debugger;
			this.layerClients.removeChild(this.storage.clients[id]);
			delete this.storage.clients[i];
			continue;
		}
		this.storage.clients[id].justUpdated = false;
	}
}

tofly.resize = function() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.socket.emit('resize', { w: window.innerWidth, h: window.innerHeight});
}


