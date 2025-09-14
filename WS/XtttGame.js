

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

var rematch_started = new Map(); // key: "sockA:sockB" -> true

function pairKeyBySockids(aSock, bSock) {
  return aSock < bSock ? (aSock + ":" + bSock) : (bSock + ":" + aSock);
}
function pairKeyFromPlayer(p) {
  return (p && p.opp) ? pairKeyBySockids(p.sockid, p.opp.sockid) : null;
}

// Handle rematch request
function onRematchRequest() {
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
function onRematchAccepted() {
	util.log("Rematch accepted by: " + this.player.name);
	var me = this.player;
	if (!me || !me.opp) return;
  
	// Tell the requester their opponent accepted (so their UI resets)
	io.to(me.opp.sockid).emit("rematch_accepted", {});
}

// ----	--------------------------------------------	--------------------------------------------

// Handle new game ready
function onNewGameReady() {
	util.log("New game ready from: " + (this.player && this.player.name));
	var me = this.player;
	if (!me || !me.opp) return;
  
	var key = pairKeyFromPlayer(me);
	if (!key) return;
  
	if (rematch_started.get(key)) {
	  util.log("Rematch already started for " + key + " — ignoring extra new_game_ready");
	  return;
	}
	rematch_started.set(key, true);
	// auto-expire guard after a short window, just in case
	setTimeout(function(){ rematch_started.delete(key); }, 2000);
  
	// Flip roles once
	me.status = 'paired';
	me.opp.status = 'paired';
	me.mode = (me.mode === 'm') ? 's' : 'm';
	me.opp.mode = (me.opp.mode === 'm') ? 's' : 'm';
  
	// Notify both with the existing contract
	io.to(me.sockid).emit("pair_players", { opp: { name: me.opp.name, uid: me.opp.uid }, mode: me.mode });
	io.to(me.opp.sockid).emit("pair_players", { opp: { name: me.name,   uid: me.uid   }, mode: me.opp.mode });
  
	util.log("Rematch started — " + me.name + " is " + me.mode + ", " + me.opp.name + " is " + me.opp.mode);
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
	if (removePlayer && removePlayer.opp) {
		var key = pairKeyFromPlayer(removePlayer);
		if (key) rematch_started.delete(key);
	}

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
