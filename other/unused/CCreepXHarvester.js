// ########### GENERAL SECTION #########################################

Creep.prototype.runHarvester = function() {
    if (this.memory.phase == PHASE_SEARCH) {
        delete this.memory.harvesterSourceId;
        LOG_DETAIL_THIS("worker has no idea what to do")
        this.moveAround();
    }
    if (this.memory.phase == PHASE_HARVEST) {
        LOG_DETAIL_THIS("worker " + source.memory.linkId)
        var source = this.room.sources[this.memory.harvesterSourceId];
        if ( source != null ) {
            if (this.carry.energy < this.carryCapacity || !source.memory.linkId) {
                this.movePredefined(source.pos);
            } else {
                var link = Game.getObjectById(source.memory.linkId)
                this.movePredefined(link.pos);
                this.transferEnergy(link);
            }
            this.harvest(source);
        } else {
            this.memory.phase = PHASE_SEARCH;
        }
    }
}