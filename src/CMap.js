Game.map.__proto__ = Map.prototype;

Map.prototype.getMemory = function () {
	if ( this.memory === undefined ) {
		if ( Memory.map === undefined ) Memory.map = {}; 
		this.memory = Memory.map;
	}
	return this.memory;
};

Map.prototype.getExits = function () {
	if ( this.getMemory().exits === undefined ) this.memory.exits = {}; 
	return this.getMemory().exits;
};

Map.prototype.getExit = function () {
	if ( this.getMemory().exits === undefined ) this.memory.exits = {}; 
	return this.getMemory().exits;
};

Map.prototype.findExitCached = function (fromRoom, toRoom) {
	var exits = this.getExits();
	if (exits[fromRoom + '_' + toRoom] === undefined)
		this.memory.exits[fromRoom + '_' + toRoom] = this.findExit(fromRoom, toRoom);
	return this.memory.exits[fromRoom + '_' + toRoom];
};