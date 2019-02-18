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

//Player class
var User = function(id=0, color="#000000"){
    var self = {
        x: 250,
        y: 0,
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
        if (self.x <= 0 + 30){ // wall sticking
            if (self.hVelocity < 0)
                self.hVelocity = 0;
            self.stick = 1;
            self.x = 0 + 30;
            //self.left = false;
            if (!self.grounded){
                self.jump = false;
            }
            if (self.vVelocity > 1){
                self.gravity = -0.2;
            }
            else if (self.vVelocity > 0){
                self.vVelocity = 1;
            }
        }
        else if (self.x >= 1000){
            if (self.hVelocity > 0)
                self.hVelocity = 0;
            self.stick = 2;
            self.x = 1000;
            //self.right = false;
            if (!self.grounded){
                self.jump = false;
            }
            if (self.vVelocity > 1){
                self.gravity = -0.2;
            }
            else if (self.vVelocity > 0){
                self.vVelocity = 1;
            }
        }
        else {
            self.stick = 0;
        }


        if (self.y < 0 + 50){
            self.vVelocity = 0;
            self.y = 0 + 50;
        }
        else if (self.y >= 500){ // floor sticking
            if (self.hVelocity > 0 && !self.right){
                self.hVelocity -= self.speed*2;
                if (self.hVelocity <= 0)
                    self.hVelocity = 0;
            }
            else if (self.hVelocity < 0 && !self.left){
                self.hVelocity += self.speed*2;
                if (self.hVelocity >= 0)
                    self.hVelocity = 0;
            }

            self.vVelocity = 0;
            self.grounded = true;
            self.jump = false;
            self.y = 500;
        }
        else { // mid air
            self.vVelocity += self.gravity;
            self.grounded = false;
            if (self.stick == 0)
                self.jump = true;
        }

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


        if(self.down);
            //no use

        self.y += self.vVelocity;
        self.x += self.hVelocity;
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

