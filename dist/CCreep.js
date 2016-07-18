"use strict";

let Logger = require('Logger');
let Profiler = require('Profiler');

let CTask = require('CTask');

module.exports = function () {
    if ( Creep._initDebug !== true ) {
        Creep._initDebug = true;
        let methods = ['run', 'movePredefined', 'flee', 'fillStructure', 'taskAssign','taskDisassign', 'taskDisassign', 'taskHarvest', 'taskUpgrade', 'taskBuild', 'taskDeliver', 'taskFillstorage'];
        for (let i in methods) {
            Profiler._.wrap('Creep', Creep, methods[i]);
            Logger._.wrap('Creep', Creep, methods[i], 0.8);
        }
    }
}


/**
 * add getter and setter for memory
 */
Object.defineProperty(Creep.prototype, "bodyType", {
    get: function () {
        if (this.memory.body === undefined) {
            let work = this.getBodyPartCnt(WORK);
            let move = this.getBodyPartCnt(MOVE);
            let carry = this.getBodyPartCnt(CARRY);
            let attack = this.getBodyPartCnt(ATTACK);
            let rattack = this.getBodyPartCnt(RANGED_ATTACK);
            let heal = this.getBodyPartCnt(HEAL);
            if ( work > 0 ) {
                if ( work === carry )               this.memory.body = 'BODY_DEFAULT';
                else if ( work <= 5 )               this.memory.body = 'BODY_HARVESTER';
                else                                this.memory.body = 'BODY_UPGRADER';
            } else if ( carry > 0 ) {
                if ( carry === 1 && move === 1 )    this.memory.body = 'BODY_CARRIER_TINY';
                else                                this.memory.body = 'BODY_CARRIER';
            } else if ( rattack > 0 ) {
                this.memory.body = 'BODY_RANGER';
            } else if ( attack > 0 ) {
                this.memory.body = 'BODY_MELEE';
            } else if ( heal > 0 ) {
                this.memory.body = 'BODY_HEALER';
            } else {
                this.logError('can not assign body by body parts.');
            }
        }
        return this.memory.body;
    },
    set: function (v) {
        this.memory.body = v;
    },
});

/**
 * add getter and setter for task codes
 */
Object.defineProperty(Creep.prototype, "tasks", {
    get: function () {
        if (this.memory.tasks === undefined)
            this.memory.tasks = {};
        return this.memory.tasks;
    },
    set: function (v) {
        this.memory.tasks = v;
    },
});

/**
 * add getter and setter for task codes
 */
Object.defineProperty(Creep.prototype, "tasksMaster", {
    get: function () {
        if (this.memory.tasksMaster === undefined)
            this.memory.tasksMaster = {};
        return this.memory.tasksMaster;
    },
    set: function (v) {
        this.memory.tasksMaster = v;
    },
});

/**
 * add getter and setter for task codes
 */
Object.defineProperty(Creep.prototype, "taskCodes", {
    get: function () {
        if (this.memory.taskCodes === undefined)
            this.memory.taskCodes = [];
        return this.memory.taskCodes;
    },
    set: function (v) {
        this.memory.taskCodes = v;
    },
});

/**
 * add getter and setter for master task code
 */
Object.defineProperty(Creep.prototype, "taskCodesMaster", {
    get: function () {
        if (this.memory.taskCodesMaster === undefined)
            this.memory.taskCodesMaster = {};
        return this.memory.taskCodesMaster;
    },
    set: function (v) {
        this.memory.taskCodesMaster = v;
    },
});

Object.defineProperty(Creep.prototype, "posHandshake", {
    get: function () {
        if (this._posHandshake === undefined) {
            let targetPos = this.room.centerPos;
            let path = this.pos.findPathTo(targetPos, {ignoreCreeps:true});
            if ( path[0] ) {
                this._posHandshake = new RoomPosition(path[0].x, path[0].y, this.room.name);
            } else {
                this._posHandshake = this.pos;
                this.logError("no handshake spot for scree found");
            }
        }
        return this._posHandshake;
    },
});

// ########### GENERAL SECTION #########################################

Creep.prototype.run = function () {
    if ( this.spawning ) return;
    
    let r, collectionPoint;
    switch (this.bodyType) {
        case 'BODY_DEFAULT': case 'BODY_HARVESTER': case 'BODY_UPGRADER':
        case 'BODY_CARRIER': case 'BODY_CARRIER_TINY': case 'BODY_CLAIM':
            collectionPoint = Game.flags[this.room.name];
            r = this.generalActionWorker(); 
            break;
        case 'BODY_MELEE':  collectionPoint = Game.flags[this.room.name + '_M']; r = this.generalActionMelee(); break;
        case 'BODY_RANGER': collectionPoint = Game.flags[this.room.name + '_M']; r = this.generalActionRanger(); break;
        case 'BODY_HEALER': collectionPoint = Game.flags[this.room.name + '_M']; r = this.generalActionHealer(); break;
        default: this.logError("has no body type"); return;
    }
    if ( r ) return;
    
    
    if (
        this.memory.phase === undefined
        || this.memory.phase === 'PHASE_SEARCH'
        || ! this.getCurrentTask()
    ) {
        this.memory.phase = 'PHASE_SEARCH';
    }

    if (this.memory.phase === 'PHASE_SEARCH') {
        if ( this.energy < 50 && (this.bodyType === 'BODY_DEFAULT') ) {
            this.fillOnStructure(this.room.controllerRefill);
        } else {
            if (collectionPoint) {
                this.movePredefined(collectionPoint.pos, {}, 0);
            } else {
                this.moveAround();
            }
        }
    }
    if (this.memory.phase === 'PHASE_TASK') {
        //this.say(this.getCurrentTask().getCode());
        switch (this.getCurrentTask().getType()) {
            case 'TASK_HARVEST':      this.taskHarvest();  break;
            case 'TASK_COLLECT':      this.taskCollect();  break;
            case 'TASK_GATHER':       this.taskGather();  break;
            case 'TASK_DELIVER':      this.taskDeliver();  break;
            case 'TASK_UPGRADE':      this.taskUpgrade();  break;
            case 'TASK_BUILD':        this.taskBuild();    break;
            case 'TASK_REPAIR':       this.taskRepair();   break;
            case 'TASK_FILLSTORAGE':  this.taskFillStorage();   break;
            case 'TASK_RESERVE':      this.taskReserve();   break;
            case 'TASK_GUARD':        this.taskMoveAndStay();   break;
            case 'TASK_MOVE':         this.taskMoveAndStay();   break;
            case 'TASK_HARVEST_REMOTE':
            case 'TASK_GATHER_REMOTE':
            case 'TASK_BUILD_REMOTE':
            case 'TASK_RESERVE_REMOTE':  
            case 'TASK_GUARD_REMOTE': this.taskMoveAndStay();   break;
            default:
                this.logError("task type " + this.getCurrentTask().getType() + " not implemented.");
                return;
        }
    }
}

Creep.prototype.generalActionWorker = function () {
    //flee if near to enemy
    if ( this.room.getHostileCreeps().length ) {
        for ( let e of this.room.getHostileCreeps() ) {
            if ( this.pos.inRangeTo(e, 8) ) {
                this.flee(15);
                return true;
            }
        }
    }
}

// ########### MOVE SECTION ###########################################

Creep.prototype.movePredefined = function (target, opts = {}, range = 1) {
    if ( target instanceof RoomObject ) target = target.pos;
    if ( ! target || ! ( target instanceof RoomPosition || target instanceof RoomObject ) ) {
        this.logError("Can't move to " + target);
        return ERR_NO_PATH;
    }
    if ( ! this.pos.inRangeTo(target, range)) {
        opts.reusePath = 6;
        let r = this.moveTo(target, opts);
        if (r === ERR_NO_PATH) {
            opts.ignoreCreeps = true;
            r = this.moveTo(target, opts);
        }
        if (r !== OK) {
            this.logError("Can't find a way to " + JSON.stringifyOnce(target) + ". Result Code:" + r);
            this.moveRandom();
        }
        return r;
    } else {
        return OK;
    }
}

Creep.prototype.getBodyType = function () {
    return this.bodyType;
}

Creep.prototype.getBodyPartCnt = function (type) {
    let cnt = 0;
    for (let i in this.body)
        if (this.body[i].type === type && this.body[i].hits > 0)
            ++ cnt;
    return cnt;
}

Creep.prototype.moveAround = function () {
    if (this.pos.x === 1)  this.move(RIGHT);
    else if (this.pos.x === 48) this.move(LEFT);
    else if (this.pos.y === 1)  this.move(BOTTOM);
    else if (this.pos.y === 48) this.move(TOP);
    else this.move(Game.time % 8 + 1);
}

Creep.prototype.moveRandom = function () {
    if (this.pos.x === 1)  this.move(RIGHT);
    else if (this.pos.x === 48) this.move(LEFT);
    else if (this.pos.y === 1)  this.move(BOTTOM);
    else if (this.pos.y === 48) this.move(TOP);
    else this.move(Math.floor(Math.random() * 8) % 8 + 1);
}

Creep.prototype.flee = function (range) {
    let enemies = this.room.getHostileCreeps();
    let avoid = _.map(enemies,function (t) {return {'pos':t.pos,'range':range};});
    let res = PathFinder.search(this.pos,avoid,{flee:true,maxOps:2500*2});
    if ( res.path[0] instanceof RoomPosition ) {
        this.moveTo(res.path[0]);
        this.log('fleeing to pos ' + res.path[0].asString());
    }
};

// ########### ENERGY SECTION ###########################################

Creep.prototype.fillOnStructure = function (structure) {
    let r = -99;
    if ( structure instanceof StructureSpawn ) {
        this.movePredefined(structure.pos);
        if ( structure.room.isEnergyMax() )
            r = this.withdraw(structure, RESOURCE_ENERGY);
    } else if ( structure instanceof Structure ) {
        this.movePredefined(structure.pos);
        r = this.withdraw(structure, RESOURCE_ENERGY);
    } else {
        this.logError("structure " + typeof structure + " is not valid.");
    }
    return r;
}

Creep.prototype.fillStructure = function (structure) {
    let r = -99;
    if (
        structure instanceof StructureStorage || structure instanceof StructureLink 
        || structure instanceof StructureSpawn || structure instanceof StructureExtension 
        || structure instanceof StructureTower || structure instanceof StructureTerminal
        || structure instanceof StructureLab || structure instanceof StructureNuker
        || structure instanceof StructurePowerSpawn
    ) {
        this.movePredefined(structure.pos);
        r = this.transfer(structure, RESOURCE_ENERGY);
    } else {
        this.logError("this structure is not available");
    }
    return r;
}

// ########### LOGGING SECTION ############################################
Creep.prototype.log = function (message) {
    Logger.log('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Creep.prototype.logError = function (message) {
    Logger.logError('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}


// ########### TASK SECTION ############################################

Creep.prototype.getCurrentTask = function () {
    while ( ! (this.task instanceof CTask) && this.taskCodes.length > 0 ) {
        if ( _.isString(this.taskCodes[0]) ) {
            this.task = this.room.getTasks().collection[this.taskCodes[0]];
            if ( ! (this.task instanceof CTask) ) {
                this.logError("task " + JSON.stringify(this.taskCodes) + " not available");
                this.moveAround();
                this.taskDisassign();
            }
        } else {
            this.taskCodes.shift();
        }
    }
    return this.task;
};

Creep.prototype.taskAssign = function (task) {
    this.taskCodesMaster[this.room.name] = undefined; // remove master task of this room, because creep is back in room
this.tasksMaster[this.room.name] = undefined; // remove master task of this room, because creep is back in room
    this.taskCodes = new Array(task.getCode()).concat(this.taskCodes);
this.tasks[task.getRoom().name] = this.tasks[task.getRoom().name] ? this.tasks[task.getRoom().name].concat([task.getCode()]) : [task.getCode()];
    this.memory.phase = 'PHASE_TASK';
    if (task.getType() === 'TASK_HARVEST_REMOTE' || task.getType() === 'TASK_GATHER_REMOTE' || task.getType() === 'TASK_BUILD_REMOTE' || task.getType() === 'TASK_RESERVE_REMOTE' || task.getType() === 'TASK_GUARD_REMOTE') {
        this.taskMaster(task);
    }
};

Creep.prototype.taskDisassign = function (task) {
    if ( ! task ) task = this.room.getTasks().collection[this.taskCodes[0]];
    if (task instanceof CTask) {
        task.assignmentDelete(this.name);
        let i = this.taskCodes.indexOf(task.getCode());
        if (i >= 0) delete this.taskCodes[i];
if (this.tasks[task.getRoom().name]) {
    let i = this.tasks[task.getRoom().name].indexOf(task.getCode());
    if (i >= 0) delete this.tasks[task.getRoom().name][i];
}
    } else { // delete first task
        this.taskCodes.shift();
if (this.tasks[this.room.name]) this.tasks[this.room.name].shift();
    }
    if ( this.taskCodes.length === 0) {
        this.memory.phase = 'PHASE_SEARCH';
    }
    delete this.task;
};

Creep.prototype.taskMaster = function (task) {
    if (task instanceof CTask) {
        this.taskCodesMaster[task.getRoom().name] = task.getCode();
this.tasksMaster[task.getRoom().name] = task.getCode();
    } else {
        this.logError("master task invalid: " + task);
    }
};

Creep.prototype.hasTask = function (task) {
    return this.taskCodes.indexOf(task.getCode()) !== -1 || (this.taskCodesMaster[task.getRoom().name] === task.getCode() && this.room.name !== task.roomName);
};

Creep.prototype.taskHarvest = function () {
    if (this.bodyType === 'BODY_DEFAULT' && this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    let source = this.getCurrentTask().target;
    if ( source !== null ) {
        let busy = false;
        if ( this.bodyType === 'BODY_HARVESTER' && this.getActiveBodyparts(WORK) >= 5 ) {
            if ( ! this.pos.isEqualTo(source.spot) ) {
                busy = this.moveTo(source.spot);
            } else {
                if ( this.carry.energy > 38 )
                    if ( source.link instanceof Structure ) {
                        this.transfer(source.link, RESOURCE_ENERGY);
                    } else if ( source.container ) {
                        if ( source.container.needsRepair(true) )
                            busy = this.repair(source.container);
                    } else {
                        let c = source.spot.lookFor(LOOK_CONSTRUCTION_SITES);
                        if ( c.length && c[0] ) {
                            busy = this.build(c[0]);
                        } else {
                            this.room.constructionManager.buildContainers();
                        }
                    }
            }
        } else {if ( this.bodyType !== 'BODY_HARVESTER')
            busy = this.movePredefined(source);
        }
        this.harvest(source);
    } else {
        this.logError("target source not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskCollect = function () {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    let target = this.getCurrentTask().target;
    if (target instanceof Energy) {
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

Creep.prototype.taskGather = function () {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    let target = this.getCurrentTask().target;
    if (target instanceof Creep) {
        if ( ! this.pos.inRangeTo(target.pos, 1) ) {
            let r = this.movePredefined(target.posHandshake, undefined, 0);
        } else {
            if ( target.getCurrentTask() ) {
                if ( target.pos && target.pos.energy > 50 ) {
                    this.pickup(target.pos);
                } else {
                    let c = target.getCurrentTask().target.container;
                    if ( c && c.store.energy >= 50) {
                        this.withdraw(c, RESOURCE_ENERGY);
                    } else if ( target.carry.energy > 38 ) {
                        target.transfer(this,RESOURCE_ENERGY);
                    }
                }
            }
        }
    } else if (target instanceof Structure) {
        if ( this.pos.inRangeTo(target.pos, 1) ) {
            let r = this.withdraw(target,RESOURCE_ENERGY);
        } else {
            let r = this.movePredefined(target.pos);
        }
    } else {
        this.logError("target gather creep not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskDeliver = function () {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    if (this.getActiveBodyparts(WORK) ) {
        let s = this.pos.findInRange(FIND_STRUCTURES, 0, { filter: function (o) {return o.needsRepair(true);} });
        if ( s.length && s[0] ) this.repair(s[0]);
        else if (false &&  this.room.constructions.length ) {
            let c = this.pos.findInRange(FIND_CONSTRUCTION_SITES, 3);
            if ( c.length && c[0] ) this.build(c[0]);
        }
    }
    let target = this.getCurrentTask().target;
    let cur = 0, max = 0;
    if (target instanceof Structure) {
        if (target !== null) {
            switch (target.structureType) {
                case STRUCTURE_STORAGE:
                case STRUCTURE_CONTAINER:
                    cur = target.store.energy; max = target.storeCapacity; break;
                case STRUCTURE_TOWER:
                case STRUCTURE_EXTENSION:
                case STRUCTURE_SPAWN:
                case STRUCTURE_LINK:
                case STRUCTURE_LAB:
                    cur = target.energy; max = target.energyCapacity; break;
            }
        }
    }
    if (target instanceof Flag) {
        if ( this.pos.isNearTo(target) && this.fatigue === 0 ) {
            this.moveTo(target);
            this.taskDisassign();
        } else {
            this.movePredefined(target.pos);
        }
    } else if (target instanceof Structure && cur < max) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            let result = this.transfer(target, RESOURCE_ENERGY);
            if ( result === OK && this.getCurrentTask().getQty() <= this.carry.energy ) this.getCurrentTask().delete();
            this.taskDisassign();
        } else if (this.carry.energy >= max - cur + 50) {
            let exts = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {
                filter: function (object) {return object.structureType == STRUCTURE_EXTENSION && object.energy != object.energyCapacity;}
            });
            if (exts.length && exts[0]) {
                let result = this.transfer(exts[0], RESOURCE_ENERGY);
                if ( result === OK ) {
                    let code = 'TASK_DELIVER' + "_" + exts[0].pos.x + "_" + exts[0].pos.y;
                    this.room.getTasks().del(code);
                }
            }
        }
    } else if (target instanceof Creep) {
        if ( ! target.getCurrentTask() || ! ( target.getCurrentTask().getType() === 'TASK_BUILD' || target.getCurrentTask().getType() === 'TASK_REPAIR' ) ) {
            this.getCurrentTask().delete();
            this.taskDisassign();
        } else {
            if ( ! this.pos.inRangeTo(target.pos, 1) ) {
                this.movePredefined(target.pos);
            } else {
                if (target.pos.inRangeTo(target.getCurrentTask().target.pos), 3) {
                    let r = this.transfer(target, RESOURCE_ENERGY);
                    if ( r !== OK ) this.logError("can't deliver to " + target.name + ": " + r);
                }
            }
        }
    } else {
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskUpgrade = function () {
    if ( this.bodyType !== 'BODY_UPGRADER' && this.carry.energy <= 0 ) {
        this.taskDisassign();
        return;
    }
    let target = this.getCurrentTask().target;
    if ( target instanceof StructureController ) {
        // Creep uses 1 Energy per WORK body Part
        if ( this.bodyType === 'BODY_UPGRADER' && this.carry.energy < this.getActiveBodyparts(WORK) * 2 ) {
            let r = this.fillOnStructure(this.room.controllerRefill);
            if ( r !== OK && r !== ERR_NOT_IN_RANGE )  this.taskDisassign();
        } else {
            this.movePredefined(target, {}, 3);
        }
        this.upgradeController(target);
    } else {
        this.logError("target controller not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskBuild = function () {
//    if ( this.bodyType !== 'BODY_UPGRADER' && this.carry.energy <= 0 ) {
//        this.taskDisassign();
//        return;
//    }
this.say("I build!");
    let target = this.getCurrentTask().target;
    if ( target instanceof Flag ) {
        target = this.pos.findClosestByPath(this.room.constructions);
    }
    if ( target instanceof ConstructionSite ) {
        let deliverTask = this.room.getTasks().collection['TASK_DELIVER_' + this.name];
        if ( ! (deliverTask instanceof CTask) ) {
            deliverTask = this.room.createTask( 'TASK_DELIVER', this, target.progressTotal - target.progress, 1 );
        }
        //if ( this.carry.energy <= 0 && deliverTask.getAssignmentsCnt() === 0 ) {
            //let r = this.fillOnStructure(this.room.controllerRefill);
            //if ( r !== OK || this.room.controllerRefill.isEmpty() )  this.taskDisassign();
            //else return;
        //} else {
            this.movePredefined(target, {}, 3);
        //}
        if ( this.carry.energy > 0 && this.pos.inRangeTo(target, 3) ) {
            let r = this.build(target);
            if (r !== OK ) {
                this.logError(this.name + " can't build " + r);
                if (r === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos); //heal
            }
        }
    } else {
        let deliverTask = this.room.getTasks().collection['TASK_DELIVER_' + this.name];
        if ( deliverTask instanceof CTask ) deliverTask.delete();
        this.logError("target construction site not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskRepair = function () {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    let target = this.getCurrentTask().target;
    if (target instanceof Structure) {
        if (target.hits >= target.hitsMax) {
            this.getCurrentTask().delete();
            this.taskDisassign();
        } else {
            this.movePredefined(target.pos, {}, 3);
            let result = this.repair(target);
            if (result !== OK && result !== ERR_NOT_IN_RANGE) {
                this.logError(this.name + " can't repair " + result);
                if (result === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos);
            }
        }
    } else {
        this.logError("target structure not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskFillStorage = function () {
    let link = this.getCurrentTask().target;
    if (link instanceof StructureLink && this.room.storage instanceof StructureStorage) {
        if (this.carry.energy > 0) {
            let tower = undefined;
            for (let i of this.room.towers)
                if ( ! i.isFull() && link.pos.inRangeTo(i, 3) ) {
                    tower = i;
                    break;
                }
            if ( this.room.defaultSpawn && this.room.defaultSpawn.energy != this.room.defaultSpawn.energyCapacity ) {
                this.fillStructure(this.room.defaultSpawn);
            } else if ( tower instanceof StructureTower ) {
                this.fillStructure(tower);
            } else if ( this.room.terminal && this.room.terminal.store.energy < 100000 ) {
                this.fillStructure(this.room.terminal);
            } else {
                this.fillStructure(this.room.storage);
            }
        } else {
            if (link.energy <= 0) {
                if (this.bodyType !== 'BODY_CARRIER_TINY') {
                    this.getCurrentTask().delete();
                    this.taskDisassign();
                    return;
                } else {
                    this.moveAround();
                }
            }
            this.fillOnStructure(link);
        }
    } else {
        this.logError("storageLink or storage not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskMoveAndStay = function () {
    let target = this.getCurrentTask().target;
    if (target instanceof RoomObject) {
        let pos = target.pos;
        if ( ! this.pos.inRangeTo(pos, 0) ) {
            if (pos.roomName === this.room.name) {
                this.movePredefined(pos, {}, 0);
            } else {
                this.movePredefined(pos, {}, 0);
                this.logError("I'm in the wrong room.");
            }
        }
    } else {
        this.logError("move task: room pos not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskReserve = function () {
    if ( this.bodyType !== 'BODY_CLAIM' ) {
        this.taskDisassign();
        return;
    }
    let target = this.getCurrentTask().target;
    if ( target instanceof StructureController ) {
        if ( ! this.pos.inRangeTo(target.pos, 1) ) {
            this.movePredefined(target, {}, 1);
        } else {
            if ( target.owner ) {
                let r = this.attackController(target);
                if ( r !== OK ) this.logError(this.name + " can't attack " + r);
            } else {
                if (Game.flags['CLAIM_' + this.room.name] instanceof Flag) {
                    let r = this.claimController(target);
                    if ( r !== OK ) this.logError(this.name + " can't claim " + r);
                } else {
                    let r = this.reserveController(target);
                    if ( r !== OK ) this.logError(this.name + " can't reserve " + r);
                }
            }
        }
    } else {
        this.logError("target controller not valid for claim");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};