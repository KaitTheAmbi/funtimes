var express = require("express");
var app = express();
var assets = require("./assets");
var server = require("http").createServer(app);
var io = require("socket.io")(server);




app.use("/assets", assets);


app.use(express.static("public"));
app.get("/*", (request, response) => {
  response.sendFile(__dirname + "/public/index.html");
});

// listen for requests :)
const listener = server.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

let users = [];
io.on("connection", socket => {
  socket.on("new-user", user => {
    const isRoom = io.sockets.adapter.rooms[user.room];
    socket.join(user.room);
    users.push({ 
      id: socket.id,
      name: user.name,
      owner: !isRoom, 
      room: user.room, 
      avatar: user.avatar,
      color: user.color,
      wager: ''
    });
    io.to(socket.id).emit("set-id", socket.id);
    io.in(user.room).emit("user-connected", { 
        id: socket.id,  
        allUsers: users.filter(x => x.room === user.room),
        avatar: user.avatar,
        name:user.name,
        roomOwner: isRoom ? false : true
      });
  });
  socket.on("place-wager", data => {
    const user = users.filter(user => user.id === data.id); 
    if(user){
      user[0].wager = data.wager;
      const allUsers = users.filter(x => x.room === data.room)
      io.in(data.room).emit("update-users", allUsers);
    }
  });
  socket.on("update-color", data => {
    const user = users.filter(user => user.id === data.id); 
    const allUsers = users.filter(x => x.room === data.room)
    if(user){
      user[0].color = data.color;
      io.in(data.room).emit("update-users", allUsers);
    }
  });
  socket.on("update-avatar", data => {
    const user = users.filter(user => user.id === data.id); 
    const allUsers = users.filter(x => x.room === data.room)
    if(user){
      user[0].avatar = data.avatar;
      io.in(data.room).emit("update-users", allUsers);
    }
  });
  
  socket.on("send-message", message => {
    if(message.message === "start-timer" || message.message === "stop-timer" || message.message === "restart" ){
      io.in(message.room).emit("incoming-message", {
        id: socket.id,
        avatar: message.avatar,
        currentCount: message.currentCount,
        liveTime: message.liveTime,
        message: message.message,
        name: message.name, 
        timerLimit: message.timerLimit, 
        timerMode: message.timerMode
      });
    } else {
      socket.to(message.room).emit("incoming-message", {
        id: socket.id,
        avatar: message.avatar,
        name: message.name, 
        message: message.message,
        color: message.color
      });
    }
    
  });
  socket.on("send-current-time", data => {
    io.to(data.id).emit('get-current-time', data);
  })
  socket.on("wake-up", data => {
    console.log('waking up' + data );
    io.in(data).emit("nudge");
  })
            
  socket.on("disconnect", () => {
    const userToDisconnect = users.filter(user => user.id === socket.id);
    if(userToDisconnect.length > 0) {
      if(!!userToDisconnect[0].owner) {
        const otherUsers = users.filter(user => user.room === userToDisconnect[0].room);
        const newOwner = otherUsers[1];
        if(newOwner){
          newOwner.owner = true;
          io.to(newOwner.id).emit('set-new-owner');
        }
      }
      users = users.filter(user => user.id != socket.id);
      io.in(userToDisconnect[0].room).emit("user-disconnected", {
        name: userToDisconnect[0].name,
        allUsers: users                  
      });
    }
  });

});