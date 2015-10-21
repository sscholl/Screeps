// ########### GENERAL SECTION #########################################

Creep.prototype.runHealer = function() {
    //TIMER_BEGIN_(TIMER_MODULE_MAIN, 'runHealer', this.name);

    var damagedCreep = this.pos.findClosestByPath(FIND_MY_CREEPS, {
        filter: function(object) {
            return object !== this && object.hits < object.hitsMax;
        }
    });
    if (this.hits < this.hitsMax - 50 /* no more heal */) {
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
    //TIMER_END(TIMER_MODULE_MAIN, 'runHealer');
}