import CustomCreep from 'Creep';

export default class UpgraderCreep extends CustomCreep{
	constructor(creep){
        super(creep);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work(){
    	if(this.memory.upgrading && this.carry.energy == 0) {
            this.memory.upgrading = false;
	    }
	    if(!this.memory.upgrading && this.carry.energy == this.carryCapacity) {
	        this.memory.upgrading = true;
	    }

	    if(this.memory.upgrading) {
            if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
                this.moveTo(this.room.controller);
            }
        }
        else {
            this.withdrawEnergyFromColsestStorage();
        }
    }
}