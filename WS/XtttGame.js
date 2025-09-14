

// ----	--------------------------------------------	--------------------------------------------	
// ----	--------------------------------------------	--------------------------------------------	

// New player has joined
function onNewPlayer(data) {

	util.log("New player has joined: "+data.name);

	// Create a new player
	var newPlayer = new Player(-1, data.name, "looking");
	newPlayer.sockid = this.id;

	this.player = newPlayer;

	// Add new player to the players array
	players.push(newPlayer);
	players_avail.push(newPlayer);

	// util.log("looking for pair - uid:"+newPlayer.uid + " ("+newPlayer.name + ")");

	pair_avail_players();

	// updAdmin("looking for pair - uid:"+p.uid + " ("+p.name + ")");

	// updAdmin("new player connected - uid:"+data.uid + " - "+data.name);

};

// ----	--------------------------------------------	--------------------------------------------	

function pair_avail_players() {

	if (players_avail.length < 2)
		return;


	var p1 = players_avail.shift();
	var p2 = players_avail.shift();

	p1.mode = 'm';
	p2.mode = 's';
	p1.status = 'paired';
	p2.status = 'paired';
	p1.opp = p2;
	p2.opp = p1;

	//util.log("connect_new_players p1: "+util.inspect(p1, { showHidden: true, depth: 3, colors: true }));

	// io.sockets.connected[p1.sockid].emit("pair_players", {opp: {name:p2.name, uid:p2.uid}, mode:'m'});
	// io.sockets.connected[p2.sockid].emit("pair_players", {opp: {name:p1.name, uid:p1.uid}, mode:'s'});
	io.to(p1.sockid).emit("pair_players", {opp: {name:p2.name, uid:p2.uid}, mode:'m'});
	io.to(p2.sockid).emit("pair_players", {opp: {name:p1.name, uid:p1.uid}, mode:'s'});

	util.log("connect_new_players - uidM:"+p1.uid + " ("+p1.name + ")  ++  uidS: "+p2.uid + " ("+p2.name+")");
	// updAdmin("connect_new_players - uidM:"+p1.uid + " ("+p1.name + ")  ++  uidS: "+p2.uid + " ("+p2.name+")");

};

// ----	--------------------------------------------	--------------------------------------------	

function onTurn(data) {
	//util.log("onGameLoadedS with qgid: "+data.qgid);

	io.to(this.player.opp.sockid).emit("opp_turn", {cell_id: data.cell_id});

	util.log("turn  --  usr:"+this.player.mode + " - :"+this.player.name + "  --  cell_id:"+data.cell_id);
	// updAdmin("Q answer - game - qgid:"+data.qgid + "  --  usr:"+this.player.mode + " - uid:"+this.player.uid + "  --  qnum:"+data.qnum + "  --  ans:"+data.ansnum);
};

// ----	--------------------------------------------	--------------------------------------------

// Handle rematch request
function onRematchRequest(data) {
	util.log("Rematch requested by: " + this.player.name);
	
	// Check if player has an opponent
	if (!this.player.opp) {
		util.log("No opponent found for rematch request from: " + this.player.name);
		return;
	}
	
	// Send rematch request to opponent
	io.to(this.player.opp.sockid).emit("rematch_request", {
		opponent_name: this.player.name
	});
	
	util.log("Rematch request sent to: " + this.player.opp.name);
}

// ----	--------------------------------------------	--------------------------------------------

// Handle rematch acceptance
function onRematchAccepted(data) {
	util.log("Rematch accepted by: " + this.player.name);
	
	// Check if player has an opponent
	if (!this.player.opp) {
		util.log("No opponent found for rematch acceptance from: " + this.player.name);
		return;
	}
	
	// Send rematch acceptance to opponent
	io.to(this.player.opp.sockid).emit("rematch_accepted", {});
	
	util.log("Rematch acceptance sent to: " + this.player.opp.name);
}

// ----	--------------------------------------------	--------------------------------------------

// Handle new game ready
function onNewGameReady(data) {
	util.log("New game ready from: " + this.player.name);
	
	// Check if player has an opponent
	if (!this.player.opp) {
		util.log("No opponent found for new game ready from: " + this.player.name);
		return;
	}
	
	// Reset player states for new game
	this.player.status = 'paired';
	this.player.mode = this.player.mode === 'm' ? 's' : 'm'; // Switch roles
	
	// Switch opponent's role too
	this.player.opp.mode = this.player.opp.mode === 'm' ? 's' : 'm';
	
	// Notify both players that new game is starting
	io.to(this.player.sockid).emit("pair_players", {
		opp: {name: this.player.opp.name, uid: this.player.opp.uid}, 
		mode: this.player.mode
	});
	io.to(this.player.opp.sockid).emit("pair_players", {
		opp: {name: this.player.name, uid: this.player.uid}, 
		mode: this.player.opp.mode
	});
	
	util.log("New game started - " + this.player.name + " is " + this.player.mode + ", " + this.player.opp.name + " is " + this.player.opp.mode);
}

// ----	--------------------------------------------	--------------------------------------------	
// ----	--------------------------------------------	--------------------------------------------	

// remove player from players and available players arrays
function removePlayerFromArr(arr, item) {
	var i = arr.indexOf(item);
	if (i > -1) arr.splice(i, 1);
}

// Socket client has disconnected
function onClientDisconnect() {
	// util.log("onClientDisconnect: "+this.id);

	var removePlayer = this.player;
	if (removePlayer) {
		removePlayerFromArr(players, removePlayer);
		removePlayerFromArr(players_avail, removePlayer);

		// If player had an opponent, notify them of disconnection
		if (removePlayer.opp) {
		io.to(removePlayer.opp.sockid).emit("opponent_disconnected", {});
		// Remove opponent relationship
		removePlayer.opp.opp = null;
		}
	}

	// Remove rematch event handlers
	if (this.status == "admin") {
		util.log("Admin has disconnected: "+this.uid);
//		updAdmin("Admin has disconnected - uid:"+this.uid + "  --  "+this.name);
	} else {
		util.log("Player has disconnected: "+this.id);
//		updAdmin("player disconnected - uid:"+removePlayer.uid + "  --  "+removePlayer.name);
	}

};

// ----	--------------------------------------------	--------------------------------------------	
// ----	--------------------------------------------	--------------------------------------------	

// ----	--------------------------------------------	--------------------------------------------	
// ----	--------------------------------------------	--------------------------------------------	

set_game_sock_handlers = function (socket) {

	// util.log("New game player has connected: "+socket.id);

	socket.on("new player", onNewPlayer);

	socket.on("ply_turn", onTurn);

	socket.on("disconnect", onClientDisconnect);

	// Add rematch event handlers
	socket.on("rematch_request", onRematchRequest);
	socket.on("rematch_accepted", onRematchAccepted);
	socket.on("new_game_ready", onNewGameReady);

};
