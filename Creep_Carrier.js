import CustomCreep from 'Creep';
import Util from 'Util';

export default class CarrierCreep extends CustomCreep{
    constructor(creep){
        super(creep);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work(){
        var closestHostile = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        // console.log('closestHostile: ' + closestHostile);

        if(this.memory.state == 'gathering'){
            if(this.carry.energy < this.carryCapacity){
                this.withdrawEnergyFromClosestStorage();
            } else {
                this.memory.state = 'working';
            }
        } else if(this.memory.state == 'working'){
            if (this.carry.energy > 0){
                var priorityList = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_CONTAINER];
                for(let structureType in priorityList){
                    if(priorityList[structureType] == STRUCTURE_CONTAINER){
                        var containerIds = [];
                        for(let source in Memory.sources){
                            let container = this.room.find(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == Memory.sources[source].container.x && i.pos.y == Memory.sources[source].container.y});
                            containerIds.push(container);
                        }
                        var strorageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && !Util.isEnergyStorageFull(i) && !(i.id in containerIds)});
                        // console.log('harvester lookting to dump energy in ' + priorityList[structureType]);
                        if(strorageStructure != null){
                            // console.log('harvester ' + this.name + ' looking to dump energy in ' + priorityList[structureType] + ' - ' + strorageStructure);
                            this.transferEnergy(strorageStructure);
                            return true;
                        }
                    }
                    var strorageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType]});
                    // console.log('harvester lookting to dump energy in ' + priorityList[structureType]);
                    if(strorageStructure != null){
                        // console.log('harvester ' + this.name + ' looking to dump energy in ' + priorityList[structureType] + ' - ' + strorageStructure);
                        this.transferEnergy(strorageStructure);
                        return true;
                    }
                }
                this.buildWork();
            } else {
                this.memory.state = 'gathering';
            }
        } else{
            this.memory.state = 'gathering';
        }
        return true;
    }
}