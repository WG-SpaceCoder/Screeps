import CustomCreep from 'Creep';
import Util from 'Util';

export default class CarrierCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // this.say(this.memory.assignedRoom);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work() {
        this.setState();
        // this.say('carrier');
        if (!('storage' in this.memory)) {
            this.memory.storage = '';
        }
        if (!('assignedRoom' in this.memory)) {
            this.memory.assignedRoom = '';
        }

        if (this.memory.state == 'gathering') {
            // var closestDroppedEnergy = this.pos.findClosestByRange(FIND_DROPPED_ENERGY, { filter: (i) => i.amount > 1000 });
            // if (closestDroppedEnergy != null) {
            //     this.say('dropped');
            //     if (this.pickup(closestDroppedEnergy) == ERR_NOT_IN_RANGE) {
            //         this.creepMove(closestDroppedEnergy);
            //     }
            //     return;
            // }

            // this.withdrawEnergyFromClosestMinerStorage();
            if (this.memory.storage.length > 0 && _.sum(Game.getObjectById(this.memory.storage).store) > this.carryCapacity) {
                this.creepMove(Game.getObjectById(this.memory.storage));
                this.withdraw(Game.getObjectById(this.memory.storage), RESOURCE_ENERGY)

            } else {
                this.findClosestMinerStorage();
                if (this.memory.storage == '') {
                    // console.log(this.name + ' (carrier) could not find a container with ' + this.carryCapacity + ' energy.');
                    this.harvestEnergy();
                }
                // console.log('Set carrier ' + this.name + ' to ' + this.memory.storage);
            }
        } else {
            this.memory.storage = '';
            var priorityList = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_CONTAINER];
            if (('assignedRoom' in this.memory) && this.memory.assignedRoom.length > 0) {
                var tmpObj = {};
                tmpObj[this.memory.assignedRoom] = Game.rooms[this.memory.assignedRoom];
                if (this.carryToRooms(tmpObj)) {
                    return;
                }
            }
            if (this.carryToRooms(Game.rooms)) {
                return;
            }
            this.buildWork(); //If there is really nothing for the carrier to do it will act as a builder (this almost never happens)
        }
    }

    carryToRoom(room) {
        var priorityList = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_CONTAINER];
        for (let structureType in priorityList) { //This loops through the priorityList to fill structures based on priority instead of by closest
            if (priorityList[structureType] == STRUCTURE_CONTAINER) { //if the structure is a container we need to make sure it's not one we are gathering from to prevent an energy loop
                var containerIds = [];
                for (let source in Memory.sources) {
                    if (Memory.sources[source] != null && 'container' in Memory.sources[source]) {
                        let container = Game.rooms[room].find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == Memory.sources[source].container.x && i.pos.y == Memory.sources[source].container.y });
                        Array.prototype.push.apply(containerIds, container);
                    } else {
                        // console.log()
                    }
                }
                var storageStructure = Game.rooms[room].find(FIND_STRUCTURES, {
                    filter: (i) => i.structureType == STRUCTURE_CONTAINER && (!Util.isEnergyStorageFull(i)) && containerIds.toString().indexOf(i.id) == -1
                });
                // console.log(containerIds.toString());
                if (storageStructure.length > 0) {
                    // console.log('Creep ' + this.name + ' transferring energy to ' + storageStructure);

                    this.transferEnergy(storageStructure[0]);
                    return true;
                }
            } else if (priorityList[structureType] == STRUCTURE_TOWER) { //The tower is a priority, but if there are not enough creeps to maintain it we need to create more creeps
                if (_.filter(Game.creeps, (creep) => creep.memory.role == 'carrier').length > 1) {
                    var storageStructure = Game.rooms[room].find(FIND_STRUCTURES, {
                        filter: (i) => (i.energy / i.energyCapacity < 0.8) && i.structureType == priorityList[structureType]
                    });
                    if (storageStructure.length > 0) {
                        // console.log('Creep ' + this.name + ' transferring energy to ' + storageStructure);
                        this.transferEnergy(storageStructure[0]);
                        return true;
                    }
                }
            } else { //This is the standard logic for finding the closest structure from the priority list and fillin 'em up
                var storageStructure = Game.rooms[room].find(FIND_STRUCTURES, { filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType] });
                if (storageStructure.length > 0) {
                    if (storageStructure[0].room.name == this.room.name) {
                        storageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType]
                        });
                        // console.log('Creep ' + this.name + 'Transferring energy to ' + storageStructure);
                        this.transferEnergy(storageStructure);
                        return true;
                    } else {
                        this.transferEnergy(storageStructure[0]);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    carryToRooms(rooms) {
        var priorityList = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_CONTAINER];
        for (let structureType in priorityList) { //This loops through the priorityList to fill structures based on priority instead of by closest
            for (let room in rooms) {
                // console.log('roomIndex, rooms', room, rooms);
                if (priorityList[structureType] == STRUCTURE_CONTAINER) { //if the structure is a container we need to make sure it's not one we are gathering from to prevent an energy loop
                    var containerIds = [];
                    for (let source in Memory.sources) {
                        if (Memory.sources[source] != null && 'container' in Memory.sources[source]) {
                            let container = Game.rooms[room].find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == Memory.sources[source].container.x && i.pos.y == Memory.sources[source].container.y });
                            Array.prototype.push.apply(containerIds, container);
                        } else {
                            // console.log()
                        }
                    }
                    var storageStructure = Game.rooms[room].find(FIND_STRUCTURES, {
                        filter: (i) => i.structureType == STRUCTURE_CONTAINER && (!Util.isEnergyStorageFull(i)) && containerIds.toString().indexOf(i.id) == -1
                    });
                    // console.log(containerIds.toString());
                    if (storageStructure.length > 0) {
                        // console.log('Creep ' + this.name + ' transferring energy to ' + storageStructure);

                        this.transferEnergy(storageStructure[0]);
                        return true;
                    }
                } else if (priorityList[structureType] == STRUCTURE_TOWER) { //The tower is a priority, but if there are not enough creeps to maintain it we need to create more creeps
                    if (_.filter(Game.creeps, (creep) => creep.memory.role == 'carrier').length > 1) {
                        var storageStructure = Game.rooms[room].find(FIND_STRUCTURES, {
                            filter: (i) => (i.energy / i.energyCapacity < 0.8) && i.structureType == priorityList[structureType]
                        });
                        if (storageStructure.length > 0) {
                            // console.log('Creep ' + this.name + ' transferring energy to ' + storageStructure);
                            this.transferEnergy(storageStructure[0]);
                            return true;
                        }
                    }
                } else { //This is the standard logic for finding the closest structure from the priority list and fillin 'em up
                    var storageStructure = Game.rooms[room].find(FIND_STRUCTURES, { filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType] });
                    if (storageStructure.length > 0) {
                        if (storageStructure[0].room.name == this.room.name) {
                            storageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
                                filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType]
                            });
                            // console.log('Creep ' + this.name + 'Transferring energy to ' + storageStructure);
                            this.transferEnergy(storageStructure);
                            return true;
                        } else {
                            this.transferEnergy(storageStructure[0]);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    availableStorage(storageID) {
        var availableStorage = _.sum(Game.getObjectById(storageID).store);
        // console.log(this.name, '1', storageID, availableStorage);
        var creepUsage = _.sum(_.map(_.filter(Game.creeps, (creep) => ('storage' in creep.memory) && creep.memory.storage == storageID), function(creep) {
            return creep.carryCapacity
        }));
        // console.log(this.name, 'availableStorage-creepUsage=totalAvailable', availableStorage + '-' + creepUsage + '=' + (availableStorage - creepUsage) + ' room ' + Game.getObjectById(storageID).room.name);
        return availableStorage - creepUsage;
    }

    setStorageFromList(storageStructures) {
        for (let structure in storageStructures) {
            // console.log(this.name + ' looking at ' + storageStructures[structure].id, this.availableStorage(storageStructures[structure].id));
            if (this.availableStorage(storageStructures[structure].id) > this.carryCapacity) {
                // console.log('Found a container for ' + this.name + ' in room ' + storageStructures[structure].room.name, this.availableStorage(storageStructures[structure].id) + '/' + this.carryCapacity);
                this.memory.storage = storageStructures[structure].id;
                return true;
            }
        }
        return false;
    }

    findClosestMinerStorage() {
        var minerContainerStr = '';
        var creepRoom = this.memory.assignedRoom;
        if (creepRoom == '') {
            creepRoom = this.room.name
        }
        for (let source in Memory.sources) {
            if (Memory.sources[source] != null && 'container' in Memory.sources[source]) {
                minerContainerStr += Memory.sources[source].container.x.toString() + Memory.sources[source].container.y.toString() + ' ';
            }
        }
        // console.log('assignedRoom: ' + this.memory.assignedRoom, this.name);
        var storageStructures = Game.rooms[creepRoom].find(FIND_STRUCTURES, {
            filter: (i) => i.structureType == STRUCTURE_CONTAINER && minerContainerStr.indexOf(i.pos.x.toString() + i.pos.y.toString()) != -1
        });
        // console.log('storageStructures length ' + storageStructures.length, minerContainerStr);

        if (!this.setStorageFromList(storageStructures)) {
            var roomList = _.values(Game.map.describeExits(creepRoom));
            // console.log(this.name + ' could not find storage in ' + creepRoom + ' checking list: ' + roomList);
            for (let room in roomList) {
                // console.log('room', room, 'roomList', roomList, 'actual', roomList[room], 'object', Game.rooms[roomList[room]]);
                if (Game.rooms[roomList[room]] != undefined) {
                    // console.log('looking for storage to carry from at ' + roomList[room]);
                    var storageStructures = Game.rooms[roomList[room]].find(FIND_STRUCTURES, {
                        filter: (i) => i.structureType == STRUCTURE_CONTAINER && minerContainerStr.indexOf(i.pos.x.toString() + i.pos.y.toString()) != -1
                    });
                    if (this.setStorageFromList(storageStructures)) {
                        return true;
                    }
                }
            }
        }
    }
}