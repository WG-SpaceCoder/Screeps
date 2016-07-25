import CustomCreep from 'Creep';
import Util from 'Util';

export default class CarrierCreep extends CustomCreep{
    constructor(creep){
        super(creep);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work(){
        if(this.memory.state == 'gathering'){
            if(this.carry.energy < this.carryCapacity){
                this.withdrawEnergyFromClosestStorage();
            } else {
                this.memory.state = 'working';
            }
        } else if(this.memory.state == 'working'){
            if (this.carry.energy > 0){
                var priorityList = [STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_CONTAINER];
                for(let structureType in priorityList){ //This loops through the priorityList to fill structures based on priority instead of by closest
                    if(priorityList[structureType] == STRUCTURE_CONTAINER){ //if the structure is a container we need to make sure it's not one we are gathering from to prevent an energy loop
                        var containerIds = [];
                        for(let source in Memory.sources){
                            let container = this.room.find(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == Memory.sources[source].container.x && i.pos.y == Memory.sources[source].container.y});
                            Array.prototype.push.apply(containerIds, container);
                        }
                        var strorageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && !Util.isEnergyStorageFull(i) && !(i.id in containerIds)});
                        // console.log('harvester lookting to dump energy in ' + priorityList[structureType]);
                        if(strorageStructure != null){
                            // console.log('harvester ' + this.name + ' looking to dump energy in ' + priorityList[structureType] + ' - ' + strorageStructure);
                            this.transferEnergy(strorageStructure);
                            return true;
                        }
                    } else if(priorityList[structureType] == STRUCTURE_TOWER){ //The tower is a priority, but if there are not enough creeps to maintain it we need to create more creeps
                        if(_.filter(Game.creeps, (creep) => creep.memory.role == 'carrier').length > 1){
                            var strorageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType]});
                            // console.log('harvester lookting to dump energy in ' + priorityList[structureType]);
                            if(strorageStructure != null){
                                // console.log('harvester ' + this.name + ' looking to dump energy in ' + priorityList[structureType] + ' - ' + strorageStructure);
                                this.transferEnergy(strorageStructure);
                                return true;
                            }
                        }
                    } else { //This is the standard logic for finding the closest structure from the priority list and fillin 'em up
                        var strorageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType]});
                        // console.log('harvester lookting to dump energy in ' + priorityList[structureType]);
                        if(strorageStructure != null){
                            // console.log('harvester ' + this.name + ' looking to dump energy in ' + priorityList[structureType] + ' - ' + strorageStructure);
                            this.transferEnergy(strorageStructure);
                            return true;
                        }
                    }

                }
                this.buildWork(); //If there is really nothing for the carrier to do it will act as a builder (this almost never happens)
            } else { //If carrier is empty it needs tp fill up
                this.memory.state = 'gathering';
            }
        } else{ //If state is not right let's make it right
            this.memory.state = 'gathering';
        }
        return true;
    }
}