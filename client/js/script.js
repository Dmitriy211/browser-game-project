onload = function(){
    var game_screen = document.getElementById('game_screen').getContext('2d');
    game_screen.font = '30px Arial';
    
    var socket = io();
    var playerId = null;
    socket.on('playerId', function(id){
        playerId = id;
    })
    // DRAW POSITION
    socket.on('newPosition', function(data, blocks){
        game_screen.clearRect(0,0,1000,500);
        for(var i = 0; i < data.length; i++){
            game_screen.fillStyle = data[i].color;
            game_screen.fillRect(data[i].x, data[i].y, -30, -50);
            if (data[i].id == playerId){
                game_screen.fillRect(data[i].x - 30 + 10, data[i].y - 50 - 20, 10, 10);
            }
        }
        for(var i = 0; i < blocks.length; i++){
            game_screen.fillStyle = blocks[i].color;
            game_screen.fillRect(blocks[i].x, blocks[i].y, blocks[i].width, blocks[i].height);
        }
    });


    // CONTROLS
    document.onkeydown = function(event){
        if([87, 38, 32].includes(event.keyCode)){ //W UP SPACE
            socket.emit('keyPress', {inputId:'up', state: true});
        }
        else if([83, 40].includes(event.keyCode)){ //S DOWN
            socket.emit('keyPress', {inputId:'down', state: true});
        }
        else if([65, 37].includes(event.keyCode)){ //A LEFT
            socket.emit('keyPress', {inputId:'left', state: true});
        }
        else if([68, 39].includes(event.keyCode)){ //D RIGHT
            socket.emit('keyPress', {inputId:'right', state: true});
        }
    }
    document.onkeyup = function(event){
        if([87, 38, 32].includes(event.keyCode)){ //W UP SPACE
            socket.emit('keyPress', {inputId:'up', state: false});
        }
        else if([83, 40].includes(event.keyCode)){ //S DOWN
            socket.emit('keyPress', {inputId:'down', state: false});
        }
        else if([65, 37].includes(event.keyCode)){ //A LEFT
            socket.emit('keyPress', {inputId:'left', state: false});
        }
        else if([68, 39].includes(event.keyCode)){ //D RIGHT
            socket.emit('keyPress', {inputId:'right', state: false});
        }
    }


}