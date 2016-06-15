let Profiler = require('Profiler');
let Logger = require('Logger');

let CTask = require('CTask');
let CTasks = require('CTasks');

// ########### Room Tasks ############################################
Room.prototype.getTasks = function() {
    if (this.memory.tasks === undefined) {
        this.memory.tasks = new CTasks();
    }
    if (!(this.memory.tasks instanceof CTasks))
        this.memory.tasks.__proto__ = CTasks.prototype;
    return this.memory.tasks;
}

Room.prototype.initTasksStatic = function() {
    for (var id in this.sources) {
        var source = this.sources[id];
        if (source.getMemory().isSave) {
            this.createTask(
                    'TASK_HARVEST',
                    source.id,
                    source.pos,
                    source.getSpotsCnt()
            );
        }
    }
    if (this.controller instanceof Structure && this.controller.my) {
        this.createTask(
            'TASK_UPGRADE',
            this.controller.id,
            this.controller.pos,
            9//this.controller.pos.getSpotsCnt()
        );
    } else {
        if (!this.defaultSpawn) {
            //No claimed controller
        }
    }
}

Room.prototype.initTasksDynamic = function() {

    if (this.name === 'W6N13') {
            /*var exits = Game.map.describeExits('W5N13');
            var exitDirW5N13 = false;
            for (var i in exits) {
                if (exits[i] === 'W5N13') exitDirW5N13 = i;
            }*/
            /*this.createTask(
                'TASK_MOVE',
                'W5N13',
                new RoomPosition(49, 24, this.name).findClosestByRange(Game.map.findExitCached(this.name, 'W5N13')),
                3,
                true,
                ['BODY_DEFAULT']
            );*/
    } else {
        if (!this.defaultSpawn) {
            this.createTask(
                'TASK_MOVE',
                'W6N13',
                new RoomPosition(1, 24, this.name).findClosestByRange(Game.map.findExitCached(this.name, 'W6N13')),
                1000,
                false,
                ['BODY_DEFAULT']
            );
        }
    }

    for (var i in this.energy) {
        var energy = this.energy[i];
        this.createTask(
                'TASK_COLLECT',
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
            if ( source !== null && this.storage instanceof StructureStorage && this.storage.energy > 10000) { // && !source.getMemory().linkId
                this.createTask(
                        'TASK_GATHER',
                        creep.id,
                        creep.pos,
                        2
                );
            }
        }
    }
    if (this.controller instanceof StructureController) {
        for (var i in this.extensions) {
            var ext = this.extensions[i];
            if (ext.energy < ext.energyCapacity) {
                this.createTask(
                        'TASK_DELIVER',
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
                        'TASK_DELIVER',
                        spawn.id,
                        spawn.pos,
                        spawn.energyCapacity - spawn.energy
                );
            }
        }
        if (this.storage instanceof Structure) {
            if (this.storage.store.energy < this.storage.storeCapacity) {
                this.createTask(
                    'TASK_DELIVER',
                    this.storage.id,
                    this.storage.pos,
                    this.storage.storeCapacity - this.storage.store.energy
                );
                if (this.storageLink instanceof Structure && this.storageLink.energy >= 0)
                    this.createTask(
                        'TASK_FILLSTORAGE',
                        this.storageLink.id,
                        this.storageLink.pos,
                        1
                    );
            }
        }
    }
}



Room.prototype.initTasksDynamic2 = function() {
    if (this.controller instanceof Structure) {
        for (var i in this.constructions) {
            var construction = this.constructions[i];
            if (construction instanceof ConstructionSite) {
                this.createTask(
                        'TASK_BUILD',
                        construction.id,
                        construction.pos,
                        2 //construction.pos.getSpotsCnt()
                );
            }
        }
    }
}

Room.prototype.createTask = function(type, targetId, pos, qty, energySource, bodyTypes) {
    var task = new CTask(type, targetId, pos, qty, energySource, bodyTypes);
    console.log(JSON.stringify(task));
    this.getTasks().add(task);
    console.log(JSON.stringify(task));
}

Room.prototype.assignTasks = function(withHandshake) {
    var tasks = this.getTasks();
    tasks.sort();
    var taskList = tasks.getList();
    for (var i in taskList) { //taskList[i] is the taskCode
        var task = tasks.get(taskList[i]);
        if ( task instanceof CTask ) {
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
                    //LOG_DEBUG("no creep found")
                    break;
                }
            }
        }
    }
}

var methods = ['initTasksStatic', 'initTasksDynamic', 'initTasksDynamic2', 'createTask', 'assignTasks', 'getTasks'];
for (var i in methods) {
    Profiler._.wrap('Room', Room, methods[i]);
    Logger._.wrap('Room', Room, methods[i]);
}
