// SERVER SETUP
var express = require('express');
var app = express();
var serv = require('http').Server(app);

var port = 2323;


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(port);

var now = new Date();
console.log(now.getHours() + ":" + now.getMinutes() + " - Server started on port 2323. Use Ctrl+C to stop it");

/*----------------------------------------------------------*/

var number_of_users = 0;
var list_of_users = {};
var list_of_sockets = {};

var User = function(id=0, color="#000000"){
    var self = {
        x: 250,
        y: 50,
        id: id,
        vVelocity: 0,
        hVelocity: 0,
        gravity: 1,
        color: color,

        right: false,
        left: false,
        up: false,
        down: false,
        jump: false,
        grounded: true,
        stick: 0, // 0 - no, 1 - left, 2 - right

        speed: 1,
        jump_power: 20,
    }

    self.updatePosition = function(){
        self.gravity = 1;
        self.checkCollision([
            Block(0,500,1000,1),
            Block(-20, 0, 20, 500),
            Block(0, -20, 1000, 20),
            Block(1000, 0, 20, 500),
            Block(150,400,200,100),
        ]);
        if(self.right){ // move
            if (self.hVelocity < self.speed*20) {
                if (self.grounded)
                    self.hVelocity += self.speed;
                else self.hVelocity += self.speed/3;
            }
            else {
                self.hVelocity = self.speed*20;
            }
        }
        if(self.left){
            if (self.hVelocity > -self.speed*20) {
                if (self.grounded)
                    self.hVelocity -= self.speed;
                else self.hVelocity -= self.speed/3;
            } 
            else {
                self.hVelocity = -self.speed*20;
            }
        }


        if(self.up && !self.jump){ // jump
            if (self.stick == 1){ // wall jump
                self.hVelocity = self.jump_power/2;
                self.vVelocity = -self.jump_power*0.7;
            }
            else if (self.stick == 2){
                self.hVelocity = -self.jump_power/2;
                self.vVelocity = -self.jump_power*0.7
            }
            else {
                self.y--;
                self.vVelocity = -self.jump_power;
            }
        }
        if (!self.up && self.jump && self.vVelocity < 0) {
            self.vVelocity *= 0.8;
        }


        if(self.down);
            //no use

        self.y += self.vVelocity;
        self.x += self.hVelocity;
    }
    
    self.checkCollision = function(blocks){
        var found_floor = false;
        var found_wall = false;
        var stick = 0;
        for (var i = 0; i < blocks.length ; i++){
            var block = blocks[i];
            //check floor
            if (self.y >= block.top && self.y <= block.top + 1 + (self.vVelocity + Math.abs(self.vVelocity))/2 && self.x >= block.left && self.x <= block.right + 30){
                if (self.hVelocity > 0 && !self.right){
                    self.hVelocity -= self.speed*1.5;
                    if (self.hVelocity <= 0)
                        self.hVelocity = 0;
                }
                else if (self.hVelocity < 0 && !self.left){
                    self.hVelocity += self.speed*1.5;
                    if (self.hVelocity >= 0)
                        self.hVelocity = 0;
                }

                self.vVelocity = 0;
                self.grounded = true;
                self.jump = false;
                self.y = block.top;

                found_floor = true;
            }
            //check ceiling
            else if (self.y < block.bottom + 50 && self.y >= block.bottom + 50 - 1 + (self.vVelocity - Math.abs(self.vVelocity))/2 && self.x >= block.left && self.x <= block.right + 30){
                self.vVelocity = 0;
                self.y = block.bottom + 50;

                found_floor = true;
            }
            

            //check left wall
            if (self.x <= block.right + 30 && self.x >= block.right + 30 - 1 + (self.hVelocity - Math.abs(self.hVelocity))/2 && self.y < block.bottom + 50 && self.y > block.top){
                if (self.hVelocity < 0)
                    self.hVelocity = 0;
                self.stick = 1;
                self.x = block.right + 30;
                if (!self.grounded){
                    self.jump = false;
                }
                if (self.vVelocity > 1){
                    self.gravity = -0.2;
                }

                found_wall = true;
            }
            //check right wall
            else if (self.x >= block.left && self.x <= block.left + 1 + (self.hVelocity + Math.abs(self.hVelocity))/2 && self.y < block.bottom + 50 && self.y > block.top){
                if (self.hVelocity > 0)
                    self.hVelocity = 0;
                self.stick = 2;
                self.x = block.left;
                if (!self.grounded){
                    self.jump = false;
                }
                if (self.vVelocity > 1){
                    self.gravity = -0.2;
                }

                found_wall = true;
            }
        }

        if (!found_wall){
            self.stick = 0;
        }
        else {
            if (self.up)
                self.up = false;
        }

        if (!found_floor){
            self.grounded = false;
            if (self.stick == 0)
                self.jump = true;
        }

        if (!self.grounded){
            self.vVelocity += self.gravity;
        }
        
    }
    return self;
}

// BLOCK CLASS
var Block = function(x = 0, y = 0, width = 20, height = 20, color = "#000000"){
    var self = {
        x: x,
        y: y,
        width: width,
        height: height,
        color: color,
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
    }
    return self;
}

// USER EVENTS
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    number_of_users++;
    
    now = new Date();
    console.log(now.getHours() + ":" + now.getMinutes() + ' - User connected. Socket connection is on. ' + number_of_users + ' users on server.');

    // put unique player in list on a connection
    socket.id = Math.random(); //generate id
    socket.emit('playerId', socket.id);
    list_of_sockets[socket.id] = socket;

    var user = User(socket.id, '#'+Math.random().toString(16).substr(-6)); //random color
    list_of_users[socket.id] = user;

    // user controls character 
    socket.on('keyPress', function(data){
        if(data.inputId == 'up')
            user.up = data.state;
        else if(data.inputId == 'down')
            user.down = data.state;
        else if(data.inputId == 'left')
            user.left = data.state;
        else if(data.inputId == 'right')
            user.right = data.state;
    });


    // user disconnects
    socket.on('disconnect', function(){
        delete list_of_sockets[socket.id];
        delete list_of_users[socket.id];
        number_of_users--;

        now = new Date();
        console.log(now.getHours() + ":" + now.getMinutes() + ' - User disconnected. ' + number_of_users + ' users on server.');
    });
});

// FRAME ACTIONS (60 fps) send to client
setInterval(function(){
    var info_package = [];
    for(var i in list_of_users){
        var user = list_of_users[i];
        
        user.updatePosition();
        info_package.push({
            x: user.x,
            y: user.y,
            color: user.color,
            id: user.id,
        });
    }
    for(var i in list_of_sockets){
        var socket = list_of_sockets[i];
        socket.emit('newPosition', info_package);
    }
},1000/60);

