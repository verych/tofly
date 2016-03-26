$(function () {
    /*
    // Declare a proxy to reference the hub.
    var chat = $.connection.flyHub;
    // Create a function that the hub can call to broadcast messages.
    chat.client.broadcastMessage = function (name, message) {
        // Html encode display name and message.
        var encodedName = $('<div />').text(name).html();
        var encodedMsg = $('<div />').text(message).html();
        // Add the message to the page.
        $('#discussion').append('<li><strong>' + encodedName
            + '</strong>:&nbsp;&nbsp;' + encodedMsg + '</li>');
    };
    // Get the user name and store it to prepend to messages.
    $('#displayname').val(prompt('Enter your name:', ''));
    // Set initial focus to message input box.
    $('#message').focus();
    // Start the connection.
    $.connection.hub.start().done(function () {
        $('#sendmessage').click(function () {
            // Call the Send method on the hub.
            chat.server.send($('#displayname').val(), $('#message').val());
            // Clear text box and reset focus for next comment.
            $('#message').val('').focus();
        });
    });
    */
  
});

var tofly = {
    config: document.app.config
};

$(function () {
    tofly.storage = { clients: {}, stars: {} };
    tofly.initGraphics();
    tofly.initSockets();

    $(window).resize(function () {
        //tofly.resize();
    });
});

tofly.initGraphics = function () {
    this.renderer = PIXI.autoDetectRenderer(this.config.w, this.config.h, { backgroundColor: this.config.background });
    document.body.appendChild(this.renderer.view);

    /*$(this.renderer.view).mousemove(function (e) {
        tofly.doMove(e);
    });*/

    // create the root of the scene graph
    this.stage1 = new PIXI.Container();
    // create the root of the scene graph
    this.layerSubBackground = new PIXI.Container();
    this.layerBackground = new PIXI.Container();
    this.stage1.addChild(this.layerSubBackground);
    this.stage1.addChild(this.layerBackground);
    this.layerClients = new PIXI.Container();
    this.stage1.addChild(this.layerClients);

    // create a texture from an image path
    //var texture = PIXI.Texture.fromImage(this.config.images.flyer1.url);

    tofly.animate();
}

tofly.animate = function () {
    requestAnimationFrame($.proxy(this.animate, this));
    // render the container
    this.renderer.render(this.stage1);
};


tofly.initSockets = function () {
    this.hub = $.connection.flyHub;
    var self = this;

    this.hub.client.tick = function (data) {
        console.log(data);
    };

    $.connection.hub.start().done(function () {
        self.hub.server.register();
        self.respawn();
        self.resize();
    });

    /*
    this.socket = $.connection.flyHub;
    this.socket.on('tick', $.proxy(this.doTick, this));
    this.resize();
    */
    //this.socket.emit('respawn', { data: { 'action': 'respawn' } });
}

tofly.respawn = function() {
    this.hub.server.respawn();
}

tofly.doMove = function (e) {
    this.socket.emit('move', { x: e.clientX, y: e.clientY });
    //console.log({ x: e.clientX, y: e.clientY});
}

tofly.doTick = function (data) {
    this.updateClients(data.clients);
    this.drawBackground(data.stars);
}
/*
tofly.doRespawn = function (data) {
    //draw bgrd
    debugger;
    this.layerBackground = new PIXI.Container();
    var bgrd = new PIXI.Sprite(PIXI.Texture.fromImage(this.config.images.map1.url));
    bgrd.anchor.x = 0;
    bgrd.anchor.y = 0;
    bgrd.position.x = 0;
    bgrd.position.y = 0;
    bgrd.scale.x = data.field.w / this.config.images.map1.w;
    bgrd.scale.y = data.field.h / this.config.images.map1.h;
    //this.layerSubBackground.addChild(bgrd);
}
*/
tofly.drawBackground = function (stars) {
    for (var i = 0; i < stars.length; i++) {
        //checking if star exists
        if (this.storage.stars[stars[i].id]) {
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
            star.lineStyle(1, 0x333333, 1);
            star.drawCircle(0, 0, Math.ceil(stars[i].r));
            //star.drawRect(0,0,1,1);

            star.endFill();
            star.justUpdated = true;

            this.layerBackground.addChild(star);
            this.storage.stars[stars[i].id] = star;
        }
    }
    for (var id in this.storage.stars) {
        if (!this.storage.stars[id].justUpdated) {
            //debugger;
            this.layerBackground.removeChild(this.storage.stars[id]);
            delete this.storage.stars[i];
            continue;
        }
        this.storage.stars[id].justUpdated = false;
    }
}

tofly.updateClients = function (clients) {
    for (var i = 0; i < clients.length; i++) {
        //checking if client exists
        if (this.storage.clients[clients[i].id]) {
            this.storage.clients[clients[i].id].position.x = clients[i].x;
            this.storage.clients[clients[i].id].position.y = clients[i].y;
            this.storage.clients[clients[i].id].rotation = clients[i].a + this.config.images.flyer1.a;
            this.storage.clients[clients[i].id].justUpdated = true;
        }
        else {
            var client = new PIXI.Sprite(PIXI.Texture.fromImage(this.config.images.flyer1.url));
            client.anchor.x = 0.5;
            client.anchor.y = 0.5;
            client.position.x = clients[i].x;
            client.position.y = clients[i].y;
            client.justUpdated = true;
            client.scale.x = clients[i].w / this.config.images.flyer1.w;
            client.scale.y = clients[i].h / this.config.images.flyer1.h;
            client.rotation = clients[i].a;
            //console.log(client.rotation);
            this.layerClients.addChild(client);
            this.storage.clients[clients[i].id] = client;
        }
    }
    for (var id in this.storage.clients) {
        if (!this.storage.clients[id].justUpdated) {
            this.layerClients.removeChild(this.storage.clients[id]);
            delete this.storage.clients[i];
            continue;
        }
        this.storage.clients[id].justUpdated = false;
    }
}

tofly.resize = function () {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.hub.server.resize(window.innerWidth, window.innerHeight);
}


