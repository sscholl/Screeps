var time = Game.getUsedCpu();
console.log("LOAD TIME " + time);







    Memory.logger = {};
    Memory.logger.level = 0;
    Memory.logger.indentation = ["", "  ", "    ", "      ", "        ", "          ", "            ", "              ", "                ", "                "];
    function logCompact(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + text
        );
    }
    function logDetail(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + text
        );
    }
    function logError(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + '!!!ERROR!!!' + text
        );
    }
    function logLevelIncrease() {
        Memory.logger.level ++;
    }
    function logLevelDecrease() {
        Memory.logger.level --;
    }
    Memory.timer = {};

    function timerBegin(module, timerName) { timerBegin_(module, timerName, ""); }
    function timerEnd(module, timerName) { timerEnd_(module, timerName, ""); }
    function timerBegin_(module, timerName, text) {
        logDetail('--> ' + timerName + ' ' + text);
        logLevelIncrease();
        Memory.timer[timerName] = Game.getUsedCpu();
    }
    function timerEnd_(module, timerName, text) {
        Memory.timer[timerName] = Game.getUsedCpu() - Memory.timer[timerName];
        logLevelDecrease();
        logDetail('<-- ' + timerName + ' [' + Memory.timer[timerName].toFixed(2) + '] ' + text
        );
    }


    console.log('===============================================' + Game.time +
                 '========================================= with cpu limit of ' + Game.cpuLimit);




var CTask = function CTask(type, targetId, pos, qty, energySource, bodyTypes) {
    this.type = type;
    this.targetId = targetId;
    this.pos = pos;
    this.qty = qty;
    this.qtyAssigned = 0;




    this.assignments = {};
    switch (this.type) {
        case 'T_HARVEST': this.bodyTypes = ['harvester', 'default'];
            this.energySource = true;
            break;
        case 'T_COLLECT':
        case 'T_GATHER': this.bodyTypes = ['carrier', 'default'];
            this.energySource = true;
            break;
        case 'T_DELIVER': this.bodyTypes = ['carrier', 'default'];
            this.energySource = false;
            break;
        case 'T_UPGRADE': this.bodyTypes = ['upgrader', 'default'];
            this.energySource = false;
            break;
        case 'T_BUILD': this.bodyTypes = ['default'];
            this.energySource = false;
            break;
        case 'T_REPAIR': this.bodyTypes = ['default'];
            this.energySource = false;
            break;
        case 'T_FILLSTORAGE': this.bodyTypes = ['carrier_tiny', 'default', 'carrier'];
            this.energySource = null;
            break;
        case 'T_MOVE': this.bodyTypes = ['carrier', 'default'];
            this.energySource = null;
            break;
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
    if (energySource !== undefined) this.energySource = energySource;
    if (bodyTypes !== undefined) this.bodyTypes = bodyTypes;
};


CTask.prototype.getType = function() {
    return this.type;
};
CTask.prototype.getTarget = function() {
    return Game.getObjectById(this.targetId);
};
CTask.prototype.getPos = function() {
    if (this.pos.constructor !== RoomPosition) {
        this.pos.__proto__ = RoomPosition.prototype;
    }
    return this.pos;
};



CTask.prototype.getRoom = function() {
    return Game.rooms[this.pos.roomName];
};
CTask.prototype.getQty = function() {
    return this.qty;
};




CTask.prototype.getQtyAssigned = function() {

        var qtyAssigned = 0;
        _.forEach(this.getAssignments(), function(assignment) {
            qtyAssigned += assignment;
        });
        this.qtyAssigned = qtyAssigned;

    return this.qtyAssigned;
};
CTask.prototype.getAssignments = function() {
    return this.assignments;
};
CTask.prototype.getAssignmentsCnt = function() {
    return Object.keys(this.assignments).length;
};
CTask.prototype.getBodyTypes = function() {
    return this.bodyTypes;
};




CTask.prototype.getCode = function() {
    if (this.code === undefined) {
        if (this.getTarget() instanceof Creep)
            this.code = this.type + "_" + this.getTarget().name;
        else
            this.code = this.type + "_" + this.pos.x + "_" + this.pos.y;
    }
    return this.code;
};

CTask.prototype.getPrio = function() {
    if (this.prio === undefined) {
        switch (this.type) {
            case 'T_HARVEST': this.prio = 50; break;
            case 'T_COLLECT':
                if (this.getTarget().energy >= 100) this.prio = 65;
                else this.prio = 60;
            break;
            case 'T_GATHER': this.prio = 62; break;
            case 'T_DELIVER':
                if (this.getTarget() instanceof Spawn)
                    this.prio = 56;
                else if (this.getTarget().structureType === STRUCTURE_STORAGE)
                    this.prio = 15;
                else
                    this.prio = 55;
                break;
            case 'T_UPGRADE': this.prio = 10; break;
            case 'T_BUILD': this.prio = 30; break;
            case 'T_REPAIR': this.prio = 40; break;
            case 'T_FILLSTORAGE': this.prio = 20; break;
            case 'T_MOVE': this.prio = 5; break;
            default:
                this.logError('task type ' + type + ' not available.');
                return;
        }
    }
    return this.prio;
};







CTask.prototype.assignmentSearch = function() {
    var creep = null;
    var task = this;
    _.forEach(this.getBodyTypes(), function(bodyType) {
        var room = task.getRoom();
        if (!creep) {
            if (task.energySource === true) {
                if (room.hasCreepEmpty(bodyType)) {
                    creep = task.getPos().findClosestCreepEmpty(bodyType);
                    if (!(creep instanceof Creep)) room.hasCreepEmpty(bodyType, true);
                }
            } else if (task.energySource === false) {
                if (room.hasCreepFull(bodyType)) {
                    creep = task.getPos().findClosestCreepFull(bodyType);
                    if (!(creep instanceof Creep)) room.hasCreepFull(bodyType, true);
                }
            } else {
                if (room.hasCreepFull(bodyType)) {
                    creep = task.getPos().findClosestCreep(bodyType);
                    if (!(creep instanceof Creep)) room.hasCreep(bodyType, true);
                }
            }
        }
    });
    return creep;
};






CTask.prototype.assignmentCreate = function(creep) {
    var qty = 0;
    switch (this.type) {
        case 'T_HARVEST':
            if (creep.getBodyType() === 'harvester') qty = this.qty;
            else qty = 1;
            break;
        case 'T_COLLECT':
        case 'T_GATHER': qty = 1; break;
        case 'T_DELIVER': qty = creep.carry.energy; break;
        case 'T_UPGRADE': qty = 1; break;
        case 'T_BUILD':
        case 'T_REPAIR': qty = 1; break;
        case 'T_FILLSTORAGE': qty = 1; break;
        case 'T_MOVE': qty = 1; break;
        default:
            this.logError("Can't assign task, type " + type + " not available.");
            return;
    }
    if (qty > this.qty) qty = this.qty;
    this.assignments[creep.name] = qty;
    delete this.qtyAssigned;
};





CTask.prototype.assignmentDelete = function(creepName) {
    delete this.assignments[creepName];
    delete this.qtyAssigned;
};






CTask.prototype.equals = function(task) {
    if (this.type === task.type
        && this.targetId === task.targetId
        && this.pos === task.pos
        && this.qty === task.qty
        && this.energySource === task.energySource
        && this.energySink === task.energySink
    ) {
        return true;
    } else {
        return false;
    }
};





CTask.prototype.update = function(task) {
    this.type = task.type;
    this.targetId = task.targetId;
    this.pos = task.pos;
    this.qty = task.qty;
    this.energySource = task.energySource;
    this.energySink = task.energySink;
};




CTask.prototype.delete = function() {
    this.getRoom().getTasks().del(this);
};






var CTasks = function CTasks()
{
    this.list = [];
    this.collection = {};
};



CTasks.prototype.getList = function() {
    return this.list;
};
CTasks.prototype.getCollection = function() {
    return this.collection;
};
CTasks.prototype.getPositions = function() {
    var poss = [];
    for (var i in this.getCollection()) {
        poss.push(this.get(i).getPos());
    }
    return poss;
};
CTasks.prototype.get = function(taskCode) {
    var task = this.collection[taskCode];
    if (task && task.constructor !== CTask)
        task.__proto__ = CTask.prototype;
    return task;
};
CTasks.prototype.add = function(task) {
    var myTask = this.get(task.getCode());
    if (myTask === undefined) {
        this.list.push(task.getCode());
        this.collection[task.getCode()] = task;
    } else if (!myTask.equals(task)) {
        myTask.update(task);
    }
};




CTasks.prototype.del = function(task) {
    var taskCode;
    if (typeof task === 'string') taskCode = task;
    else taskCode = task.getCode();
    if (this.get(taskCode) instanceof CTask) {
        this.list.splice(this.list.indexOf(taskCode), 1);
        delete this.collection[taskCode];
    } else {
        logError("Task does not exist.");
    }
};

CTasks.prototype.sort = function() {
    var tasks = this;
    this.list.sort(
        function(taskCodeA, taskCodeB) {
            var a = 0, b = 0;
            var taskA = tasks.get(taskCodeA), taskB = tasks.get(taskCodeB);
            if (taskA instanceof CTask) a = taskA.getPrio();
            else logError("wrong task " + taskCodeA);
            if (taskB instanceof CTask) b = taskB.getPrio();
            else logError("wrong task " + taskCodeB);
            return b - a;
        }
    );
};

CTasks.prototype.getCount = function() {
    return this.count = Object.keys(this.collection).length;;
};

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


Spawn.prototype.spawn = function(body, bodyParts) {
    var result = this.createCreep(bodyParts);
    if(_.isString(result)) {
        this.room.logCompact('Spawning: ' + result + " with Body: " + bodyParts
                + " / new sum: " + (this.room.creeps.length + 1));
        if (body == 'ranger') Memory.creeps[result].role = 'guard';
        Memory.creeps[result].body = body;
    } else {
        if (result != ERR_BUSY)
            this.room.logCompact('Spawn error: ' + result
                + ' while try to spawn ' + JSON.stringify(bodyParts));
    }
    return result;
}

Spawn.prototype.spawnDefault = function() {
    var bodyParts;
    if (
        this.room.creepsHarvester.length >= 1
        && this.room.energyAvailable >= 750
    ) {
        bodyParts = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsHarvester.length >= 1
        && this.room.energyAvailable >= 550
    ) {
        bodyParts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsHarvester.length >= 1
        && this.room.energyAvailable >= 500
    ) {
        bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsHarvester.length >= 1
        && this.room.energyAvailable >= 400
    ) {
        bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if ( this.room.creepsHarvester.length >= 1 ) {
        bodyParts = [WORK, CARRY, MOVE, MOVE];
    } else {
        bodyParts = [WORK, CARRY, MOVE];
    }
    this.spawn('default', bodyParts);
    var r = this.spawn('default', bodyParts);
    if (r === ERR_NOT_ENOUGH_ENERGY && this.room.creepsDefault.length < 1) {
        this.spawnDefault();
    }
}

Spawn.prototype.spawnHarvester = function() {
    var bodyParts;
    if (this.room.energyAvailable >= 800)
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE ];
    else if (this.room.energyAvailable >= 600)
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, CARRY, MOVE ];
    else if (this.room.energyAvailable >= 550)
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, MOVE ];
    else
        this.room.logError("can't create harvester");
    var r = this.spawn('harvester', bodyParts);
    if (r === ERR_NOT_ENOUGH_ENERGY && this.room.creepsDefault.length < 1) {
        this.spawnDefault();
    }
}

Spawn.prototype.spawnUpgrader = function() {
    var bodyParts;
    if (this.room.extensions.length >= 40 && this.room.getCreepsUpgraderCnt() > 2)
        bodyParts = [
            WORK, WORK, WORK, WORK, WORK,
            WORK, WORK, WORK, WORK, WORK,
            WORK, WORK, WORK, WORK, WORK,
            WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE
        ];
    else if (this.room.extensions.length >= 30 && this.room.getCreepsUpgraderCnt() > 1)
        bodyParts = [
            WORK, WORK, WORK, WORK, WORK,
            WORK, WORK, WORK, WORK, WORK,
            WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, CARRY, MOVE, CARRY, MOVE
        ];
    else if (this.room.extensions.length >= 20)
        bodyParts = [
            WORK, WORK, WORK, WORK, WORK,
            WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE, CARRY, MOVE
        ];
    else
        this.room.logError("can't create upgrader");
    this.spawn('upgrader', bodyParts);
}

Spawn.prototype.spawnCarrier = function() {
    var bodyParts;
    if (this.room.extensions.length >= 10)
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
            CARRY, MOVE, CARRY, MOVE
        ];
    else if (this.room.extensions.length >= 5)
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,
            CARRY, MOVE, CARRY, MOVE
        ];
    else
        bodyParts = [ CARRY, MOVE, CARRY, MOVE, CARRY, MOVE ];
    this.spawn('carrier', bodyParts);
}

Spawn.prototype.spawnCarrierTiny = function() {
    var bodyParts = [ CARRY, MOVE ];
    this.spawn('carrier_tiny', bodyParts);
}

Spawn.prototype.spawnHealer = function() {
    var bodyParts;
    if (this.room.extensions.length >= 20) {
        bodyParts = [
            HEAL, MOVE,
            HEAL, MOVE,
            HEAL, MOVE,
            HEAL, MOVE
        ];
    } else {
        bodyParts = [MOVE, HEAL];
    }
    this.spawn('healer', bodyParts);
}

Spawn.prototype.spawnRanger = function() {
    var bodyParts;
    if (false && this.room.extensions.length >= 40) {
        bodyParts = [
            TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE,
            RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
            RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE
        ];
    } else if (this.room.extensions.length >= 30) {
        bodyParts = [
            TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE,
            RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
            RANGED_ATTACK, MOVE,
            RANGED_ATTACK, MOVE
        ];
    } else if (this.room.extensions.length >= 20) {
        bodyParts = [
            TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE,
            RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE,
                RANGED_ATTACK, MOVE
        ];
    } else {
        this.room.logError("can't create ranger");
    }
    this.spawn('ranger', bodyParts);
}
Structure.prototype.isFull = function() {
    return this.energy >= this.energyCapacity;
}

Structure.prototype.isEmpty = function() {
    return this.energy <= 0;
}


Source.prototype.memory = undefined;

Source.prototype.getMemory = function() {
    if (!this.memory) {
        this.memory = this.room.memory.sources[this.id];
    }
    return this.memory;
}

Source.prototype.getSpotsCnt = function() {
    if (this.getMemory().spotsCnt === undefined) {
        this.getMemory().spotsCnt = this.pos.getSpotsCnt();
    }
    return this.getMemory().spotsCnt;
}

RoomPosition.prototype.findEnemiesInAttackRange = function(opts) {
    return this.findInRange(FIND_HOSTILE_CREEPS, 4, opts);
};
RoomPosition.prototype.findEnemyStructuresInAttackRange = function(opts) {
    return this.findInRange(FIND_HOSTILE_STRUCTURES, 6, opts);
};

RoomPosition.prototype.findClosestEmptyExtension = function(opts) {
    return this.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: function(object) {return object.structureType == STRUCTURE_EXTENSION && object.energy != object.energyCapacity;}
    });
};
RoomPosition.prototype.findClosestEnergyContainer = function(opts) {
    var spawn = this.findClosestByPath(FIND_MY_SPAWNS, {
        filter: function(object) { return object.energy > 0;}
    });
    var extension = this.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: function(object) { return object.structureType == STRUCTURE_EXTENSION && object.energy > 0;}
    });
    if ( spawn ) rangeS = this.getRangeTo(spawn);
    else rangeS = 99999999;
    if ( extension ) rangeE = this.getRangeTo(extension);
    else rangeE = 99999999;
    if (!extension && !spawn) return this.findClosestByPath(FIND_MY_SPAWNS);
    else if (extension && rangeE <= rangeS ) return extension;
    else if (spawn && rangeS <= rangeE ) return spawn;
    else logDetail(JSON.stringify("error while findng a energy source"));;
};

RoomPosition.prototype.findInRangeLink = function(range) {
    return this.findInRange(FIND_MY_STRUCTURES, range, {
        filter: function(object) {return object.structureType == STRUCTURE_LINK}
    });
};

RoomPosition.prototype.findClosestSearchingDefaultWorker = function() {
    return this.findClosestByPath(FIND_MY_CREEPS,
        { filter:
            function (creep) {
                return creep.memory.body == 'default' && (creep.memory.phase == undefined || creep.memory.phase == 'search');
            }
        }
    );
}
RoomPosition.prototype.findClosestSearchingHarvester = function() {
    return this.findClosestByPath(FIND_MY_CREEPS,
        { filter:
            function (creep) {
                return creep.memory.body == 'harvester' && (creep.memory.phase == undefined || creep.memory.phase == 'search');
            }
        }
    );
}
RoomPosition.prototype.findClosestSearchingUpgrader = function() {
    return this.findClosestByPath(FIND_MY_CREEPS,
        { filter:
            function (creep) {
                return creep.memory.body == 'upgrader' && (creep.memory.phase == undefined || creep.memory.phase == 'search');
            }
        }
    );
}






RoomPosition.prototype.findClosestCreep = function(_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body === bodyType
                    && (creep.memory.phase === 'search'
                        || creep.memory.phase === undefined)
        }
    });
};

RoomPosition.prototype.findClosestCreepEmpty = function(_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body === bodyType
                    && (creep.memory.phase === 'search'
                        || creep.memory.phase === undefined)
                    && creep.carry.energy < 50;
        }
    });
};

RoomPosition.prototype.findClosestCreepFull = function(_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body === bodyType
                    && (creep.memory.phase === 'search'
                        || creep.memory.phase === undefined)
                    && creep.carry.energy >= 50;
        }
    });
};

RoomPosition.prototype.getRoom = function() {
    return Game.rooms[this.roomName];
}


RoomPosition.prototype.getSpotsCnt = function() {
    timerBegin_("room", 'getSpotsCnt', 'of room ' + this.getRoom().name);
    var cnt = 0;
    var positions = this.getRoom().lookForAtArea('terrain', this.y - 1, this.x - 1, this.y + 1, this.x + 1);

    for (var y in positions) {
        for (var x in positions[y]) {
            var isFree = true;
            for (var i in positions[y][x])
                if (positions[y][x][i] === 'wall') isFree = false;
            if (isFree) ++ cnt;
        }
    }
    timerBegin_("room", 'getSpotsCnt', cnt);
    return cnt;
};

RoomPosition.prototype.getInRangePositions = function(distance) {
    var poss = new Array(9);
    var i = 0;
    for (var y = this.y - distance; y < this.y + distance; ++ y) {
        for (var x = this.x - distance; x < this.x + distance; ++ x) {
            poss[i ++] = new RoomPosition(x,y,this.roomName);
        }
    }
    return poss;
}


Creep.prototype.runDefault = function() {
    if (
        this.memory.phase === undefined
        || this.memory.phase === 'search'
        || !this.getCurrentTask()
    ) {
        this.memory.phase = 'search';
    }

    if (this.memory.phase === 'search') {
        this.moveAround();
    }
    if (this.memory.phase === 'task') {

        switch (this.getCurrentTask().getType()) {
            case 'T_HARVEST': this.taskHarvest(); break;
            case 'T_COLLECT': this.taskCollect(); break;
            case 'T_GATHER': this.taskGather(); break;
            case 'T_DELIVER': this.taskDeliver(); break;
            case 'T_UPGRADE': this.taskUpgrade(); break;
            case 'T_BUILD': this.taskBuild(); break;
            case 'T_REPAIR': this.taskRepair(); break;
            case 'T_FILLSTORAGE': this.taskFillStorage(); break;
            case 'T_MOVE': this.taskMove(); break;
            default:
                this.logError("task type " + this.getCurrentTask().getType() + " not available");
                return;
        }
    }
};

Creep.prototype.getCurrentTask = function() {
    this.getTaskCodes();
    if (!this.task && this.memory.taskCodes[0]) {
        this.task = this.room.getTasks().get(this.memory.taskCodes[0]);
        if (!(this.task instanceof CTask)) {
            this.moveAround();
            this.taskDisassign();
            this.logError("task " + this.memory.taskCodes[0] + " not available");
        }
    }
    return this.task;
};

Creep.prototype.taskAssign = function(task) {
    this.getTaskCodes().push(task.getCode());
    this.memory.phase = 'task';
};

Creep.prototype.taskDisassign = function(task) {
    if (task instanceof CTask) {
        var i = this.memory.taskCodes.indexOf(task.getCode());
        if (i >= 0) delete this.memory.taskCodes[i];
    } else {

        this.memory.taskCodes.shift();
    }
    if (!this.memory.taskCodes[0]) {
        this.memory.phase = 'search';
    }
    delete this.task;
};

Creep.prototype.getTaskCodes = function() {
    if (!this.memory.taskCodes)
        this.memory.taskCodes = [];
    return this.memory.taskCodes;
};

Creep.prototype.hasTask = function(task) {
    if ( this.memory.phase !== 'task'
        || this.getTaskCodes().indexOf(task.getCode()) === -1
    ) {
        return false;
    }
    return true;
};

Creep.prototype.taskHarvest = function() {
    if (this.memory.body === 'default' && this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var source = this.getCurrentTask().getTarget();
    if ( source !== null ) {
        var link = Game.getObjectById(source.getMemory().linkId);
        if (this.memory.body === 'harvester' && this.carry.energy > 0 && link instanceof Structure) {
            this.movePredefined(link.pos);
            this.transferEnergy(link);
        } else {
            this.movePredefined(source.pos);
        }
        this.harvest(source);
    } else {
        this.logError("target source not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskCollect = function() {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            this.pickup(target);
            this.taskDisassign();
        }
    } else {
        this.logError("target collect item not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskGather = function() {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            target.transferEnergy(this);
            var energys = target.pos.lookFor('energy');
            if (energys.length && energys[0] instanceof Energy)
                this.pickup(energys[0]);
        }
    } else {
        this.logError("target gather creep not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskDeliver = function() {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    var cur = 0, max = 0;
    if (target !== null) {
        switch (target.structureType) {
            case STRUCTURE_STORAGE:
                cur = target.store.energy; max = target.storeCapacity; break;
            case STRUCTURE_EXTENSION:
            case STRUCTURE_SPAWN:
            case STRUCTURE_LINK:
                cur = target.energy; max = target.energyCapacity; break;
        }
    }
    if (cur < max) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            var result = this.transferEnergy(target);
            if ( result === OK && this.getCurrentTask().getQty() <= this.carry.energy )
                this.getCurrentTask().delete();
            this.taskDisassign();
        } else if (this.carry.energy >= max - cur + 50) {
            var exts = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {
                filter: function(object) {return object.structureType == STRUCTURE_EXTENSION && object.energy != object.energyCapacity;}
            });
            if (exts.length && exts[0]) {
                var result = this.transferEnergy(exts[0]);
                if ( result === OK ) {
                    var code = 'T_DELIVER' + "_" + exts[0].pos.x + "_" + exts[0].pos.y;
                    this.room.getTasks().del(code);
                }
            }
        }
    } else {
        this.logError("energy container not valid " + this.getCurrentTask().getCode());
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskUpgrade = function() {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {

        this.movePredefined(target.pos);
        this.upgradeController(target);
    } else {
        this.logError("target controller not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskBuild = function() {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {
        this.movePredefined(target.pos);
        var result = this.build(target);
        if (result !== OK && result !== ERR_NOT_IN_RANGE) {
            if (result === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos);
            else this.logError(this.name + " can't build " + result);
        }
    } else {
        this.logError("target construction site not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskRepair = function() {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {


    } else {
        this.logError("target structure not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskFillStorage = function() {
    var link = this.getCurrentTask().getTarget();
    if (link instanceof Structure && this.room.controllerStorage instanceof Structure) {
        if (this.carry.energy > 0) {
            if (this.room.defaultSpawn.energy != this.room.defaultSpawn.energyCapacity)
                this.fillStructure(this.room.defaultSpawn)
            else
                this.fillStructure(this.room.controllerStorage)
        } else {
            if (link.energy <= 0) {
                if (this.memory.body !== 'carrier_tiny') {
                    this.getCurrentTask().delete();
                    this.taskDisassign();
                    return;
                } else this.moveAround();
            }
            this.fillOnStructure(link);
        }
    } else {
        this.logError("link or controllerStorage not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskMove = function() {
    var pos = this.getCurrentTask().getPos();
    if (pos instanceof RoomPosition) {
        if (pos === this.pos) {

            this.taskDisassign();
        } else {
            if (pos.roomName === this.room.name) {
                this.movePredefined(pos, undefined, true);
            } else {
                this.movePredefined(pos, undefined, true);
            }
        }
    } else {
        this.logError("link or controllerStorage not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};



Creep.prototype.runUpgrader = function() {
    if (!this.memory.phase || this.memory.phase === 'search') {
        this.fillOnStructure(this.room.controllerStorage);
    }
    if (this.memory.phase === 'task') {
        if (this.carry.energy > 20) {
            this.movePredefined(this.room.controller.pos);
        } else {
            this.fillOnStructure(this.room.controllerStorage);
        }
        this.upgradeController(this.room.controller);
    }
}



Creep.prototype.runRanger = function() {
    var target = this.pos.findClosestByPath(this.room.getHostileCreeps());
    if (target && target.owner.username === "NhanHo") target = false;
    if (target) {
        if (!this.pos.inRangeTo(target, 3))
            this.movePredefined(target);
        if (this.pos.inRangeTo(target, 2) || this.hits < this.hitsMax * 0.3)
            this.movePredefined(this.room.defaultSpawn);
        this.rangedAttack(target);
        this.memory.currentTargetId = target.id;

    } else {
        var collectionPoint = Game.flags[this.room.name];
        if (collectionPoint) {
            this.movePredefined(collectionPoint.pos, {}, true);
        }







        delete this.memory.currentTargetId;
    }
}


Creep.prototype.runHealer = function() {


    var damagedCreep = this.pos.findClosestByPath(FIND_MY_CREEPS, {
        filter: function(object) {
            return object !== this && object.hits < object.hitsMax;
        }
    });
    if (this.hits < this.hitsMax - 50 ) {
        this.movePredefined(this.room.defaultSpawn);
        this.heal(damagedCreep);
        this.rangedHeal(damagedCreep);
        return;
    }

    if(damagedCreep) {
        var hisTarget = Game.getObjectById(damagedCreep.memory.currentTargetId);
        if (hisTarget && this.pos.inRangeTo(hisTarget, 3))
            this.movePredefined(this.room.defaultSpawn);
        else
            if (!this.pos.inRangeTo(damagedCreep, 1))
                this.movePredefined(damagedCreep);
        this.rangedHeal(damagedCreep);
        this.heal(damagedCreep);
        return;
    }
    var guard;
    if (this.memory.currentTargetId)
        guard = Game.getObjectById(this.memory.currentTargetId);
    else
        guard = this.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: function(creep) {
                return creep.memory.role === 'guard';
            }
        });
    if (guard) {
        if (!this.pos.inRangeTo(guard, 1))
           this.movePredefined(guard);
       this.memory.currentTargetId = guard.id;
    } else {
        var collectionPoint = Game.flags[this.room.name];
        if (collectionPoint) {
          this.movePredefined(collectionPoint.pos, {}, true);
        } else {
            this.movePredefined(this.room.defaultSpawn);
        }
    }

}



Creep.prototype.run = function() {
    var body = this.memory.body;
    if (body === 'default') this.runDefault();
    else if (body === 'harvester') this.runDefault();
    else if (body === 'upgrader') this.runUpgrader();
    else if (body === 'carrier') this.runDefault();
    else if (body === 'carrier_tiny')this.runDefault();
    else if (body === 'upgrader') this.runUpgrader();
    else if (body === 'healer') this.runHealer();
    else if (body === 'ranger') this.runRanger();
    else this.logError("has no body type");
}



Creep.prototype.movePredefined = function(targetPos, opts, onPos) {
    if (!this.pos.inRangeTo(targetPos, 1) || onPos) {
        if (!opts) opts = {};
        opts.reusePath = 6;
        opts.avoid = this.room.getUnsavePostions();
        var result = this.moveTo(targetPos, opts);
        if (result === ERR_NO_PATH) {
            opts.ignoreCreeps = true;
            result = this.moveTo(targetPos, opts);
            if (result === ERR_NO_PATH) {
                logDetail(JSON.stringify(result));;
                this.moveRandom();
            }
        }
    }
}

Creep.prototype.getBodyType = function() {
    return this.memory.body;
}

Creep.prototype.moveAround = function() {
    if (this.pos.x === 1) this.move(RIGHT);
    else if (this.pos.x === 48) this.move(LEFT);
    else if (this.pos.y === 1) this.move(BOTTOM);
    else if (this.pos.y === 48) this.move(TOP);
    else this.move(Game.time % 8 + 1);
}

Creep.prototype.moveRandom = function() {
    this.move(Math.floor(Math.random() * 8) % 8 + 1);
}



Creep.prototype.fillOnStructure = function(structure) {
    if (structure instanceof Structure) {
        this.movePredefined(structure.pos);
        structure.transferEnergy(this);
    } else {
        this.logError("this structure is not available");
    }
}

Creep.prototype.fillStructure = function(structure) {
    if (structure instanceof Structure || structure instanceof Spawn) {
        this.movePredefined(structure.pos);
        this.transferEnergy(structure);
    } else {
        this.logError("this structure is not available");
    }
}


Creep.prototype.logCompact = function(message) {
    logCompact('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Creep.prototype.logDetail = function(message) {
    logDetail('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Creep.prototype.logError = function(message) {
    logError('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Room.prototype.findDroppedEnergy = function() {
    return this.find(FIND_DROPPED_ENERGY,
        { filter: function (energy) { return energy.energy >= 20; } }
    );
};

Room.prototype.getTasks = function() {
    if (this.memory.tasks === undefined) {
        this.memory.tasks = new CTasks();
    }
    if (!(this.memory.tasks instanceof CTasks))
        this.memory.tasks.__proto__ = CTasks.prototype;
    return this.memory.tasks;
}

Room.prototype.initTasksStatic = function() {
    timerBegin_("room", 'initTasksStatic', 'of room ' + this.name);
    for (var id in this.sources) {
        var source = this.sources[id];
        if (source.getMemory().isSave) {
            this.createTask(
                    'T_HARVEST',
                    source.id,
                    source.pos,
                    source.getSpotsCnt()
            );
        }
    }
    if (this.controller instanceof Structure && this.controller.my) {
        this.createTask(
            'T_UPGRADE',
            this.controller.id,
            this.controller.pos,
            this.controller.pos.getSpotsCnt()
        );
    } else {
        if (!this.defaultSpawn) {

        }
    }
    timerEnd("room", 'initTasks');
}

Room.prototype.initTasksDynamic = function() {
    timerBegin_("room", 'initTasksDynamic', 'of room ' + this.name);

    if (this.name === 'W6N13') {
    } else {
        if (!this.defaultSpawn) {
            this.createTask(
                'T_MOVE',
                'W6N13',
                new RoomPosition(1, 24, this.name).findClosestByRange(Game.map.findExitCached(this.name, 'W6N13')),
                1000,
                false,
                ['default']
            );
        }
    }

    for (var i in this.energy) {
        var energy = this.energy[i];
        this.createTask(
                'T_COLLECT',
                energy.id,
                energy.pos,
                energy.energy
        );
    }
    for (var i in this.creepsHarvester) {
        var creep = this.creepsHarvester[i];
        var task = creep.getCurrentTask();
        if ( task instanceof CTask ) {
            var source = task.getTarget();
            if ( source !== null && !source.getMemory().linkId ) {
                this.createTask(
                        'T_GATHER',
                        creep.id,
                        creep.pos,
                        2
                );
            }
        }
    }
    if (this.controller instanceof Structure) {
        for (var i in this.extensions) {
            var ext = this.extensions[i];
            if (ext.energy < ext.energyCapacity) {
                this.createTask(
                        'T_DELIVER',
                        ext.id,
                        ext.pos,
                        ext.energyCapacity - ext.energy
                );
            }
        }
        for (var i in this.spawns) {
            var spawn = this.spawns[i];
            if (spawn.energy < spawn.energyCapacity) {
                this.createTask(
                        'T_DELIVER',
                        spawn.id,
                        spawn.pos,
                        spawn.energyCapacity - spawn.energy
                );
            }
        }
        if (this.storage instanceof Structure) {
            if (this.storage.store.energy < this.storage.storeCapacity) {
                this.createTask(
                    'T_DELIVER',
                    this.storage.id,
                    this.storage.pos,
                    this.storage.storeCapacity - this.storage.store.energy
                );
                if (this.storageLink instanceof Structure && this.storageLink.energy >= 0)
                    this.createTask(
                        'T_FILLSTORAGE',
                        this.storageLink.id,
                        this.storageLink.pos,
                        1
                    );
            }
        }
    }
    timerEnd("room", 'initTasksDynamic');
}



Room.prototype.initTasksDynamic2 = function() {
    timerBegin_("room", 'initTasksDynamic2', 'of room ' + this.name);
    if (this.controller instanceof Structure) {
        for (var i in this.constructions) {
            var construction = this.constructions[i];
            if (construction instanceof ConstructionSite) {
                this.createTask(
                        'T_BUILD',
                        construction.id,
                        construction.pos,
                        2
                );
            }
        }
    }
    timerEnd("room", 'initTasksDynamic2');
}

Room.prototype.createTask = function(type, targetId, pos, qty, energySource, bodyTypes) {

    var task = new CTask(type, targetId, pos, qty, energySource, bodyTypes);
    this.getTasks().add(task);

}

Room.prototype.assignTasks = function(withHandshake) {
    timerBegin_("room", 'assignTasks', 'of room ' + this.name);
    var tasks = this.getTasks();
    tasks.sort();
    var taskList = tasks.getList();
    for (var i in taskList) {
        var task = tasks.get(taskList[i]);

        var assignments = task.getAssignments();
        if (withHandshake) {
            for (var creepName in assignments) {
                var creep = Game.creeps[creepName];
                if ( !creep ) {
                    task.assignmentDelete(creepName);
                } else if (!creep.hasTask(task)) {
                    task.assignmentDelete(creepName);
                    creep.taskDisassign(task);
                }
            }
        }
        while (task.getQtyAssigned() < task.getQty()) {
            var creep = task.assignmentSearch();
            if (creep instanceof Creep) {
                task.assignmentCreate(creep);
                creep.taskAssign(task);
            } else {

                break;
            }
        }

    }

    timerEnd("room", 'assignTasks');
}



Room.prototype.run = function() {
    this.initCreeps();
    if (!this.memory.timer || this.memory.timer <= 0) {
        timerBegin_("room", 'static_init', 'of room ' + this.name);
            this.memory.timer = -1;
            this.initSources();
            this.memory.timer = 600;
        timerEnd("room", 'static_init');
    }

    timerBegin_("room", 'load', 'of room ' + this.name);
        this.loadSources();
        this.loadStructures();
        this.loadConstructions();
        this.energy = this.findDroppedEnergy();
    timerEnd("room", 'load');


    if (this.memory.timer % 15 == 0) {
        timerBegin_("room", 'dynamic_init', 'of room ' + this.name);
            this.initDynamicSources();
            this.initDynamicConstructions();
            this.initDynamicStructures();
        timerEnd("room", 'dynamic_init');
    }

    if (this.memory.timer === 600) {
        this.initTasksStatic();
    } else if (this.memory.timer % 30 == 0) {
        this.initTasksDynamic2();
    } else if (this.memory.timer % 1 == 0) {
        this.initTasksDynamic();
    }

    timerBegin_("room", 'actions', 'of room ' + this.name);
        var withHandshake = this.memory.timer % 15 == 0;
        this.assignTasks(withHandshake);
        this.linkAction();
        this.spawnAction();
    timerEnd("room", 'actions');

    -- this.memory.timer;
}


Room.prototype.initSources = function() {
    timerBegin_("room", 'initSources', 'of room ' + this.name);

    if (!this.memory.sources)
        this.memory.sources = {};
    for (var source of this.find(FIND_SOURCES))
        if (!this.memory.sources[source.id])
            this.memory.sources[source.id] = {id: source.id};

    this.memory.hostileSpawnIds = [];
    this.memory.hostileSpawns = this.find(FIND_HOSTILE_STRUCTURES);
    for (var hostileSpawnNr in this.memory.hostileSpawns) {
        this.memory.hostileSpawnIds[hostileSpawnNr] = this.memory.hostileSpawns[hostileSpawnNr].id;
    }
    timerEnd("room", 'initSources');
}
Room.prototype.loadSources = function() {
    this.sources = {};
    for (var id in this.memory.sources) {
        this.sources[id] = Game.getObjectById(id);
    }

    this.hostileSpawns = [];
    for (var hostileSpawnNr in this.memory.hostileSpawns) {
        var hostileSpawnId = this.memory.hostileSpawns[hostileSpawnNr].id;
        this.hostileSpawns[hostileSpawnNr] = Game.getObjectById(hostileSpawnId);
    }
}
Room.prototype.initDynamicSources = function() {
    this.memory.sourcesSaveCount = 0;
    this.memory.sourceSpotCount = 0;
    this.memory.sourceLinkCnt = 0;
    for (var id in this.sources) {
        var source = this.sources[id];

        source.getMemory().isSave = (
                this.creepsHealer.length >= 4 * this.hostileSpawns.length
                && this.creepsRanger.length >= 3 * this.hostileSpawns.length
            ) || !source.getMemory().hasHostileSpawn;
        if (source.getMemory().isSave) {
            this.memory.sourcesSaveCount ++;
            this.memory.sourceSpotCount += source.getSpotsCnt();
        }

        var link = source.pos.findInRangeLink(2);
        if (link[0] !== undefined) {
            source.getMemory().linkId = link[0].id;
            this.memory.sourceLinkCnt ++;
        }
    }
};


Room.prototype.initDynamicStructures = function() {
    this.memory.extensionIds = [];

    this.extensions = this.find(
        FIND_MY_STRUCTURES,
        {filter: {structureType: STRUCTURE_EXTENSION}}
    );
    for (var extensionNr in this.extensions)
        this.memory.extensionIds[extensionNr] = this.extensions[extensionNr].id;

    var storages = this.controller.pos.findInRange(
        FIND_MY_STRUCTURES, 2, {filter: {structureType: STRUCTURE_STORAGE}}
    );
    if (storages[0] != undefined) this.memory.controllerStorageId = storages[0].id;

    if (this.getStorage() instanceof Structure) {
        var links = this.getStorage().pos.findInRangeLink(2);
        if (links[0] != undefined) this.memory.storageLinkId = links[0].id;
    }
}
Room.prototype.loadStructures = function() {
    this.extensions = [];
    for (var extensionNr in this.memory.extensionIds) {
        var extensionId = this.memory.extensionIds[extensionNr];
        this.extensions[extensionNr] = Game.getObjectById(extensionId);
    }
    this.storageLink = Game.getObjectById(this.memory.storageLinkId);
    this.controllerStorage = Game.getObjectById(this.memory.controllerStorageId);

};
Room.prototype.linkAction = function() {
    if (this.storageLink instanceof Structure)
        for (var i in this.sources) {
            var linkId = this.sources[i].getMemory().linkId;
            if (linkId) {
                var link = Game.getObjectById(linkId);
                if (link.isFull() && this.storageLink.isEmpty()) {
                    link.transferEnergy(this.storageLink);
                    break;
                }
            }
        }
};
Room.prototype.getStorage = function() {
    if (this.storage === undefined) {
        var storages = this.find(FIND_MY_STRUCTURES,
            {filter: {structureType: STRUCTURE_STORAGE}}
        );
        if (storages[0] != undefined) {
            this.storage = storages[0];
        } else {
            this.storage = false;
        }
    }
    return this.storage;
}

Room.prototype.initDynamicConstructions = function() {
    this.memory.constructionIds = [];

    this.constructions = this.find(FIND_CONSTRUCTION_SITES);
    for (var i in this.constructions)
        this.memory.constructionIds[i] = this.constructions[i].id;
}
Room.prototype.loadConstructions = function() {
    this.constructions = [];
    for (var i in this.memory.constructionIds) {
        this.constructions[i] = (Game.getObjectById(this.memory.constructionIds[i]));
    }
}


Room.prototype.initCreeps = function() {
    this.creepsDefault = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'default'}}});
    this.creepsHarvester = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'harvester'}}});
    this.creepsUpgrader = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'upgrader'}}});
    this.creepsCarrier = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'carrier'}}});
    this.creepsCarrierTiny = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'carrier_tiny'}}});
    this.creepsRanger = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'ranger'}}});
    this.creepsHealer = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'healer'}}});

    this.creeps = this.creepsDefault.concat(this.creepsHarvester, this.creepsUpgrader, this.creepsRanger, this.creepsHealer, this.creepsCarrierTiny);
}
Room.prototype.getDefaultHarvesterCount = function() {
    if (this.defaultHarvesterCount == undefined) {
        this.defaultHarvesterCount = 0;
        if (this.creepsHarvester.length <= 0) {
            for (var id in this.sources) {
                var source = this.sources[id];
                if (source.getMemory().isSave)
                    if (source.getMemory().creepName) ++ this.defaultHarvesterCount;
                    else this.defaultHarvesterCount += source.getSpotsCnt();
            }
        }
    }
    return this.defaultHarvesterCount;
};
Room.prototype.getDefaultUpgraderCount = function() {
    if (this.controllerStorage instanceof Structure) return 0;
    else return 1;
};
Room.prototype.getDefaultCarrierCount = function() {
    if (! (this.controllerStorage instanceof Structure)){
        return 2 * (this.memory.sourcesSaveCount - this.memory.sourceLinkCnt);
    }else return 0;
};
Room.prototype.getDefaultBuilderCount = function() {
    var cnt = 0;
    if (this.constructions.length > 4) ++ cnt;
    if (this.constructions.length > 3) ++ cnt;
    if (this.constructions.length > 2) ++ cnt;
    if (this.constructions.length > 1) ++ cnt;
    return cnt;
};
Room.prototype.creepsRequired = function() {
    return this.getDefaultHarvesterCount()
        + this.getDefaultCarrierCount()
        + this.getDefaultUpgraderCount()
        + this.getDefaultBuilderCount();
};
Room.prototype.creepsCarrierCnt = function() {
    var cnt = 0;
    if (this.controllerStorage instanceof Structure)
        cnt += 2 * (this.memory.sourcesSaveCount - this.memory.sourceLinkCnt);
    if (this.constructions.length > 4) -- cnt;
    if (this.constructions.length > 3) -- cnt;
    if (this.constructions.length > 2) -- cnt;

    return cnt;
};
Room.prototype.creepsCarrierTinyCnt = function() {
    var cnt = 0;
    if (this.memory.storageLinkId) cnt ++;
    return cnt;
};
Room.prototype.getCreepsUpgraderCnt = function() {
    if (this.creepsUpgraderCnt === undefined) {
        if (this.controllerStorage instanceof Structure) {
            this.creepsUpgraderCnt = 1;
            if (this.controllerStorage.store.energy > 100000) {
                ++ this.creepsUpgraderCnt;
                if (this.controllerStorage.store.energy > 200000) ++ this.creepsUpgraderCnt;
            }
        }
    }
    return this.creepsUpgraderCnt;
};


Room.prototype.spawnAction = function() {
    for (var spawnId in this.spawns) {
        var spawn = this.spawns[spawnId];

        var bodyParts;
        var body;
        if ( this.creepsDefault.length >= this.creepsRequired()
            && this.creepsHarvester.length < this.memory.sourcesSaveCount
            && this.extensions.length >= 5
        ) {
            spawn.spawnHarvester();
        } else if (this.creepsDefault.length < this.creepsRequired()) {
            spawn.spawnDefault();
        } else if ( this.creepsHarvester.length >= 1
            && this.creepsUpgrader.length < this.getCreepsUpgraderCnt()
            && this.extensions.length >= 20
        ) {
            spawn.spawnUpgrader();
        } else if ( this.controllerStorage instanceof Structure
            && this.storageLink instanceof Structure
            && this.creepsCarrierTiny.length < this.creepsCarrierTinyCnt()
        ) {
            spawn.spawnCarrierTiny();
        } else if ( this.creepsCarrier.length < this.creepsCarrierCnt() ) {
            spawn.spawnCarrier();
        } else if ( this.creepsHealer.length < 2
            && this.extensions.length >= 20
            && this.energyAvailable >= this.energyCapacityAvailable
        ) {
            spawn.spawnHealer();
        } else if ( this.creepsRanger.length < 4
            && this.extensions.length >= 20
            && this.energyAvailable >= this.energyCapacityAvailable
        ) {
            spawn.spawnRanger();
        } else {
            this.logCompact('SPAWN: no creep is required');
        }
        break;
    }
}


Room.prototype.getHostileCreeps = function() {
    if (this.hostileCreeps == undefined) {
        var opts = {};
        opts.filter = function(object) { return object.owner.username !== 'NhanHo';}
        this.hostileCreeps = this.find(FIND_HOSTILE_CREEPS, opts);
        for (var i in this.hostileCreeps) {
            var c = this.hostileCreeps[i];
            if (c.owner.username != 'Source Keeper') {
                Game.notify("User " + c.owner.username + " moved into room " + this.name + " with body " + JSON.stringify(c.body), 0);
            }
        }
    }
    return this.hostileCreeps;
}
Room.prototype.getUnsavePostions = function() {
    if (this.poss === undefined) {
        this.poss = [];
        var creeps = this.getHostileCreeps();
        for (var i in creeps) {
            var creep = creeps[i];
            this.poss = this.poss.concat(creep.pos.getInRangePositions(3));
        }
    }
    return this.poss;
}


Room.prototype.logCompact = function(message) {
    logCompact('[' + this.name + "] " + message);
}
Room.prototype.logDetail = function(message) {
    logDetail('[' + this.name + "] " + message);
}
Room.prototype.logError = function(message) {
    logError('[' + this.name + "] " + message);
}

Room.prototype.hasCreep = function(bodyType, setNoCreep) {
    if (this.noCreep === undefined)
        this.noCreep = [];
    if (setNoCreep)
        this.noCreep[bodyType] = true;
    return this.noCreep[bodyType] === undefined;
}
Room.prototype.hasCreepEmpty = function(bodyType, setNoCreep) {
    if (this.noCreepEmpty === undefined)
        this.noCreepEmpty = [];
    if (setNoCreep)
        this.noCreepEmpty[bodyType] = true;
    return this.noCreepEmpty[bodyType] === undefined;
}
Room.prototype.hasCreepFull = function(bodyType, setNoCreep) {
    if (this.noCreepFull === undefined)
        this.noCreepFull = [];
    if (setNoCreep)
        this.noCreepFull[bodyType] = true;
    return this.noCreepFull[bodyType] === undefined;
}


var enable_profiling = true;
if (enable_profiling) {
    Memory.p = Memory.p || {};

    var wrap = function(c, n) {
        var p = Memory.p[n] || { usage: 0, count: 0 };
        Memory.p[n] = p;

        var f = c.prototype[n];
        c.prototype[n] = function() {
            var ts = Game.getUsedCpu();
            var rc = f.apply(this, arguments);
            p.usage += Game.getUsedCpu() - ts;
            ++p.count;
            return rc;
        };
    };

    wrap(RoomPosition, 'isNearTo');
    wrap(RoomPosition, 'findPathTo');
    wrap(RoomPosition, 'isEqualTo');
    wrap(RoomPosition, 'findClosestByPath');
    wrap(RoomPosition, 'findClosestByDistance');
    wrap(Creep, 'moveByPath');
    wrap(Creep, 'moveTo');
    wrap(Creep, 'movePredefined');
    wrap(Creep, 'pickup');
    wrap(Creep, 'build');
    wrap(Creep, 'repair');
    wrap(Creep, 'harvest');
    wrap(Creep, 'upgradeController');
    wrap(Room, 'lookAt');
    wrap(Room, 'lookFor');
    wrap(Room, 'lookForAt');
    wrap(Room, 'lookForAtArea');
    wrap(Room, 'find');
    wrap(Spawn, 'createCreep');
    wrap(Spawn, 'spawn');
}




timerBegin("main", 'game');
var managerGame = require('CManagerGame');
managerGame.run();
timerEnd("main", 'game');


timerBegin("main", 'room');
for (var roomName in Game.rooms) {
    var room = Game.rooms[roomName];

    room.spawns = room.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_SPAWN}});
    if (room.spawns.length > 0) {
        room.defaultSpawn = room.spawns[0];
    }

    room.run();
}
timerEnd("main", 'room');


timerBegin("main", 'creeps');
for(var creepName in Game.creeps) {
    var creep = Game.creeps[creepName];


        creep.run();

}
timerEnd("main", 'creeps');




var report_interval = 10000;
if (Game.time % report_interval == 0) {
        var summary = 0;
        for (var n in Memory.p) {
            var p = Memory.p[n];
            if (p.count === 0) {
                p.average = 0;
                continue;
            }
            p.average = p.usage / p.count;
            summary += p.average;
        }
        var msg;
        for (var n in Memory.p) {
            var p = Memory.p[n];
            msg = n + ': ' + p.usage.toFixed(2) + '/' + p.count + ' == ' + p.average.toFixed(2)
                        + ' (' + (p.average * 100 / summary).toFixed(2) + '%)';
            logDetail(msg);
            Game.notify(msg, 1);
        }
        msg = '--- ' + summary.toFixed(2);
        logDetail(msg);
        Game.notify(msg, 1);

        Memory.p = {};
}


console.log("MAIN TIME " + (Game.getUsedCpu() - time));
