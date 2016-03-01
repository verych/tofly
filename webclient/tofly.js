var tofly = {
	//config
	config: {
		w: 1200,
		h: 350,
		background: 0x010122,
		me: {
			w: 10,
			h: 50
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
});

tofly.initGraphics = function(){
	this.renderer = PIXI.autoDetectRenderer(this.config.w, this.config.h,{backgroundColor : this.config.background});
	document.body.appendChild(this.renderer.view);

	// create the root of the scene graph
	this.stage1 = new PIXI.Container();

	// create a texture from an image path
	var texture = PIXI.Texture.fromImage(this.config.images.disk.url);
	// create a new Sprite using the texture

	//ME
	this.me = new PIXI.Sprite(texture);
	// center the sprite's anchor point
	this.me.anchor.x = 0.5;
	this.me.anchor.y = 0.5;
	this.me.scale.x = this.config.me.w / this.config.images.disk.w;
	this.me.scale.y = this.config.me.h / this.config.images.disk.h;
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


    // just for fun, let's rotate mr rabbit a little
    //this.me.rotation += 0.05;
};

tofly.initSockets = function (){
	this.socket = io.connect('http://tofly:8888');
	this.socket.on('eventClient', $.proxy(this.handleEvent, this));
	this.socket.emit('eventServer', { data: {'action': 'respawn'}});
}

tofly.handleEvent = function(data) {
	debugger;
	switch (data.action) {
		case 'respawn':
		this.doRespawn(data);
		break;

	}
	console.log(data);
}

tofly.doRespawn = function(data){
	this.me.position.x = data.x;
	this.me.position.y = data.y;
	this.stage1.addChild(this.me);
}