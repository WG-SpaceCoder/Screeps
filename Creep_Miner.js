import CustomCreep from 'Creep';
import Util from 'Util';

export default class MinerCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // return;
        // console.log('We got a new creep ' + this.name);

        if (this.flee()) {
            return;
        }

        this.work();
    }

    work() {
        this.setState();
        // this.say('miner');
        if (!('storage' in this.memory)) {
            this.memory.storage = '';
        }
        if (!('assignedRoom' in this.memory)) {
            this.memory.assignedRoom = this.room.name;
        }

        if (this.memory.state == 'gathering') {
            // this.memory.buildSpawn = '';
            if (this.memory.drop != undefined && this.memory.drop.length && Game.getObjectById(this.memory.drop) != undefined) {
                var drop = Game.getObjectById(this.memory.drop);
                this.creepMove(drop);
                if (this.pickup(drop) == OK) {
                    // console.log(this.name + ' cleaned up their room.');
                    if (Game.getObjectById(this.memory.drop) == undefined) {
                        this.memory.drop = '';
                    }
                }
            } else {
                if (this.memory.sourceId == undefined) {
                    this.setSourceID();
                    if (this.memory.sourceId == undefined) {
                        // console.log(this.name + ' could not find any available sources from room ' + this.memory.assignedRoom);
                        this.mineClosest();
                        return;
                    }
                }
                var source = Game.getObjectById(this.memory.sourceId);
                this.creepMove(source, { range: 1 });
                this.harvest(source);
            }

        } else if (this.memory.state == 'working') {
            if (!this.buildSpawn()) {
                if (!this.carryToRoom(this.memory.assignedRoom)) {
                    // console.log(this.name + ' could not find anywhere to store energy');
                    if (!this.tryToConstruct(this.memory.assignedRoom)) {
                        // console.log(this.name + ' could not find anything to repair');
                        if (!this.setBuildSpawn()) {
                            var upgradeTry = this.upgradeController(Game.rooms[this.memory.assignedRoom].controller);
                            // this.say('upgrade ' + upgradeTry);
                            if (upgradeTry == ERR_NOT_IN_RANGE) {
                                // console.log(this.name + ' could not reach the controller in ' + this.memory.assignedRoom);
                                this.creepMove(Game.rooms[this.memory.assignedRoom].controller);
                            } else if (upgradeTry != OK) {
                                console.log(this.name + ' failed to upgrade conrtoller in room ' + this.room.name + ' err: ' + upgradeTry);
                            }
                        }

                    }
                }
            }

            this.memory.sourceId = undefined;
        }
    }

    buildSpawn() {
        if (this.memory.buildSpawn != undefined && Game.getObjectById(this.memory.buildSpawn) != undefined) {
            var spawn = Game.getObjectById(this.memory.buildSpawn);
            this.creepMove(spawn, { range: 3 });
            this.build(spawn);
            return true;
        }
        return false;

    }



    mineClosest() {
        var closestSource = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        this.creepMove(closestSource, { range: 1 });
        this.harvest(closestSource);
    }

    setSourceID() {
        this.memory.sourceId = this.getAvailableSource(this.room.name);
        if (this.memory.sourceId == undefined) {
            var exits = Game.map.describeExits(this.memory.assignedRoom);
            for (let roomName in exits) {
                // console.log('Room Name: ' + exits[roomName]);
                this.memory.sourceId = this.getAvailableSource(exits[roomName]);
                if (this.memory.sourceId != undefined) {
                    break;
                }
            }
        }
    }

    getAvailableSource(roomName) {
        var room = Game.rooms[roomName];
        if (room == undefined) {
            // console.log(this.name, 'Room ' + roomName + ' is undefined.');
            return;
        }
        var sourcesUsed = _.values(_.mapValues(_.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.memory.sourceId != undefined), 'memory.sourceId'));
        var sourceFilter = { filter: (source) => sourcesUsed.join(',').indexOf(source.id) == -1 };
        var sources = {};
        var source = {};
        if (roomName == this.room.name) {
            source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE, sourceFilter);
        } else {
            sources = room.find(FIND_SOURCES_ACTIVE, sourceFilter);
        }
        // console.log(this.name, 'sources:', _.values(_.mapValues(sources, 'id')));
        // console.log(this.name, 'sourcesUsed:', sourcesUsed);
        // console.log(this.name, 'sources: ' + JSON.stringify(sources));
        // console.log(this.name, 'Sources length: ' + sources.length);
        if (sources.length) {
            source = sources[0];
        }
        if (source != null && source.id != null) {
            // console.log(this.name, 'found a source in room ' + source.room);
            return source.id;
        }
    }

    carryToRoom(roomName) {
        var priorityList = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_CONTAINER];
        for (let structureType in priorityList) { //This loops through the priorityList to fill structures based on priority instead of by closest
            var room = Game.rooms[roomName];
            if (priorityList[structureType] == STRUCTURE_CONTAINER) { //if the structure is a container we need to make sure it's not one we are gathering from to prevent an energy loop
                var containerIds = [];
                for (let source in Memory.sources) {
                    if (Memory.sources[source] != null && 'container' in Memory.sources[source]) {
                        let container = room.find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == Memory.sources[source].container.x && i.pos.y == Memory.sources[source].container.y });
                        Array.prototype.push.apply(containerIds, container);
                    } else {
                        // console.log()
                    }
                }
                var storageStructure = room.find(FIND_STRUCTURES, {
                    filter: (i) => i.structureType == STRUCTURE_CONTAINER && (!Util.isEnergyStorageFull(i)) && containerIds.toString().indexOf(i.id) == -1
                });
                // console.log(containerIds.toString());
                if (storageStructure.length > 0) {
                    // console.log('Creep ' + this.name + ' transferring energy to ' + storageStructure);

                    this.transferEnergy(storageStructure[0]);
                    return true;
                }
            } else if (priorityList[structureType] == STRUCTURE_TOWER) { //The tower is a priority, but if there are not enough creeps to maintain it we need to create more creeps
                if (_.filter(Game.creeps, (creep) => creep.memory.role == 'miner').length > 1) {
                    var storageStructure = room.find(FIND_STRUCTURES, {
                        filter: (i) => (i.energy / i.energyCapacity < 0.8) && i.structureType == priorityList[structureType]
                    });
                    if (storageStructure.length > 0) {
                        // console.log('Creep ' + this.name + ' transferring energy to ' + storageStructure);
                        this.transferEnergy(storageStructure[0]);
                        return true;
                    }
                }
            } else { //This is the standard logic for finding the closest structure from the priority list and fillin 'em up
                var storageStructure = room.find(FIND_STRUCTURES, { filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType] });
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
}