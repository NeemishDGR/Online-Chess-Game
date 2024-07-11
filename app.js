const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");


const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.set("view engine","ejs");
app.set("views", path.join(__dirname, "views"));  // Added this line to ensure the views directory is set correctly
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res) => {
    res.render("index",{title:"Chess Game"});
});


io.on("connection", function (uniquesocket){
    console.log("connected");

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }else if (!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("SpectatorRole");
    }

    uniquesocket.on("disconnect", function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) => {
        try{
            if(chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if(chess.turn() === "b" && uniquesocket.id !== players.black) return;
           
            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState", chess.fen())
            }else{
                console.log("Invalid Move :",move);
                uniquesocket.emit("Invalid Move : ",move);
            }

        }catch(err){
            console.loh(err);
            uniquesocket.emit("Invalid Move :",move);
        }
    });


});



server.listen(3000,function() {
    console.log("Online on port 3000")
});