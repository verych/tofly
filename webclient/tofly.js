var tofly = {
	//config
	config: {
		w: 1200,
		h: 350,
		background: 0x010122,
		me: {
			/*
			w: 10,
			h: 50
			*/
		},
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
	tofly.initGraphics();
	tofly.initSockets();
	//adding resize handler
	$(window).resize(function() {
		//console.log(1);
	  	tofly.resize();
	});
});

tofly.initGraphics = function(){
	this.renderer = PIXI.autoDetectRenderer(this.config.w, this.config.h,{backgroundColor : this.config.background});
	document.body.appendChild(this.renderer.view);

	// create the root of the scene graph
	this.stage1 = new PIXI.Container();
	// create the root of the scene graph
	this.background = new PIXI.Container();
	this.stage1.addChild(this.background);

	// create a texture from an image path
	var texture = PIXI.Texture.fromImage(this.config.images.disk.url);
	// create a new Sprite using the texture

	//ME
	this.me = new PIXI.Sprite(texture);
	// center the sprite's anchor point
	this.me.anchor.x = 0.5;
	this.me.anchor.y = 0.5;
	this.me.kw = 1 / this.config.images.disk.w;
	this.me.kh = 1 / this.config.images.disk.h;

	// move the sprite to the center of the screen
	this.me.position.x = this.config.w / 2;
	this.me.position.y =  this.config.h / 2;
	this.me.rotation = 0; 	

	// start animating
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

tofly.doTick = function(data){
	this.updateMe(data);
	this.drawBackground(data.stars);
}

tofly.doRespawn = function(data){
	/*
	this.me.scale.x = this.me.kw * data.user.w;
	this.me.scale.y = this.me.kh * data.user.h;
	this.me.rotation = data.user.a;
	*/
	this.stage1.addChild(this.me);
}

tofly.drawBackground = function(stars) {
	if(!this.background.children.length) {
		for(var i = 0; i < stars.length; i++) {
			var star = new PIXI.Graphics();
			star.position.x = stars[i].x;
			star.position.y = stars[i].y;

			// set fill and line style
			star.beginFill(stars[i].color);
			//star.lineStyle(0.1, 0xeeeeff, 1);
			star.drawCircle(0, 0, Math.ceil(stars[i].z / 8));
			star.endFill();

			this.background.addChild(star);
		}
	}
	else if (this.background.children.length == stars.length) {
		for(var i = 0; i < stars.length; i++) {
			var star = this.background.children[i];
			star.position.x = stars[i].x;
			star.position.y = stars[i].y;
		}
	}
	else {
		console.log('stars problem');
	}
}

tofly.updateMe = function(data) {
	console.log(data.me);
	this.me.position.x = data.me.x;
	this.me.position.y = data.me.y;
	this.me.scale.x = this.me.kw * data.me.w;
	this.me.scale.y = this.me.kh * data.me.h;
	this.me.rotation = data.me.a;
}

tofly.resize = function() {
	//debugger;
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.socket.emit('resize', { w: window.innerWidth, h: window.innerHeight});
}


