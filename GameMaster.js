import CustomRoom from 'Room';
import Spawn from 'Spawn';
import Util from 'Util';
import Harvester from 'Creep_Harvester';
import Builder from 'Creep_Builder';
import Upgrader from 'Creep_Upgrader';
import Miner from 'Creep_Miner';
import Defender from 'Creep_Defender';
import Carrier from 'Creep_Carrier';
import Claimer from 'Creep_Claimer';
import Scout from 'Creep_Scout';

export default class GameMaster {
    constructor() {
        this.workMemory();
        if (Game.cpu.bucket > 5000) { this.workRooms(); }
        this.clean()
        var tmpCPU = Game.cpu.getUsed();
        this.workCreeps();
        // console.log('Creeps used ' + Math.round(Game.cpu.getUsed() - tmpCPU) + ' CPU in room ' + this.name);
        // this.workSpawns();
        Memory.roomsToClearWalls = [];
        Memory.roomsToHarvest = ['E56N57', 'E56N59', 'E55N59', 'E57N57', 'E57N59', 'E59N59', 'E54N58'];
        Memory.roomsToAttack = [];
        Memory.roomsToClaim = [];
    }

    //####################################################################################
    //########################################WORK########################################
    //####################################################################################

    workMemory() {
        this.setRoomsBeingAttacked();
        this.setSpawnQueue();
    }

    workCreeps() {
        for (let creep in Game.creeps) {
            if (!Game.creeps[creep].spawning) {
                try {
                    var tmpCPU = Game.cpu.getUsed();
                    switch (Game.creeps[creep].memory.role) {
                        case 'harvester':
                            var test = new Harvester(Game.creeps[creep].id);
                            break;
                        case 'builder':
                            var test = new Builder(Game.creeps[creep].id);
                            break;
                        case 'upgrader':
                            var test = new Upgrader(Game.creeps[creep].id);
                            break;
                        case 'miner':
                            var test = new Miner(Game.creeps[creep].id);
                            break;
                        case 'defender':
                            var test = new Defender(Game.creeps[creep].id);
                            break;
                        case 'carrier':
                            var test = new Carrier(Game.creeps[creep].id);
                            break;
                        case 'claimer':
                            var test = new Claimer(Game.creeps[creep].id);
                            break;
                        case 'scout':
                            var test = new Scout(Game.creeps[creep].id);
                            break;
                        default:
                            // console.log('Default screep role???????');
                            break;
                    }
                    var usedCpu = Math.round(Game.cpu.getUsed() - tmpCPU);
                    if (usedCpu > 20) {
                        console.log(Game.creeps[creep].memory.role, Game.creeps[creep].name + ' used ' + usedCpu + ' CPU in room ' + Game.creeps[creep].room.name);
                    }
                } catch (err) {
                    console.log(creep, err, JSON.stringify(creep));
                    // console.log(JSON.stringify(creep));
                }
            }
        }
    }

    workSpawns() {
        // console.log('Highest controller ' + this.highestController());
        // if(this.rooms.length<=1 && this.rooms[0].){
        // 	console.log('need explorer');
        // }

        var numRoomsToHarvest = 2;
        var currentCountHarvesting = 0;
        var harvestableRooms = 0;
        for (let room in this.rooms) {
            if (_.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.room.name == this.rooms[room].name).length > 0) {
                currentCountHarvesting += 1;
            }
        }
        // console.log('Harvesting in ' + currentCountHarvesting + ' rooms and need to harvest ' + numRoomsToHarvest);
        if (currentCountHarvesting < numRoomsToHarvest) {
            // console.log('ok lets try to expand :p');
            for (let room in this.rooms) {
                // console.log(this.rooms[room].name + ' is mine? ' + this.rooms[room].isMine());
                if (this.rooms[room].isMine() || this.rooms[room].controller._owner == undefined) {
                    harvestableRooms += 1;
                }
            }
            // console.log('harvestableRooms ' + harvestableRooms);
            if (harvestableRooms < numRoomsToHarvest) { //This means we need to go exploring
                for (let room in this.rooms) {
                    var exits = Game.map.describeExits(this.rooms[room].name);
                    // console.log('need to explore ', this.rooms[room].name, Game.map.describeExits(this.rooms[room].name));
                    // console.log('First exit: ' + exits[Object.keys(exits)[0]]);
                    Memory.toExplore = exits[Object.keys(exits)[0]];
                }

                // Memory.roomToSearch = Game.map.describeExits(this.rooms[room].name)[0];
            }
        }

    }

    workRooms() {
        var rooms = [];
        for (let roomName in Game.rooms) {
            var room = new CustomRoom(Game.rooms[roomName]);
            Array.prototype.push.apply(rooms, [room]);
            if (room.controller != undefined && room.controller._my && room.find(FIND_MY_SPAWNS).length > 0) {
                var spawns = room.find(FIND_MY_SPAWNS);
                if (spawns.length > 0) {
                    var carriersAssignedToThisRoom = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier' && ('assignedRoom' in creep.memory ? creep.memory.assignedRoom == roomName : false));
                    // console.log('carriersAssignedToThisRoom ' + carriersAssignedToThisRoom.length);
                    if (carriersAssignedToThisRoom.length < 3) {
                        var nonAssignedCarriers = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier' && ('assignedRoom' in creep.memory ? creep.memory.assignedRoom.length == 0 : true));
                        // console.log('nonAssignedCarriers ' + nonAssignedCarriers.length);
                        if (nonAssignedCarriers.length > 1) {
                            nonAssignedCarriers[0].memory.assignedRoom = roomName;
                            // console.log('nonAssignedCarriers[0] ' + nonAssignedCarriers[0].name + ' ' + nonAssignedCarriers[0].memory.assignedRoom.length);
                        }
                    }
                }
                // console.log(spawns);
                for (let spawn in spawns) {
                    new Spawn(spawns[spawn].id);
                }
            }
        }
        this.rooms = rooms;
        // console.log('rooms ' + rooms[0].controller._my);
    }

    //####################################################################################
    //########################################MEMORY######################################
    //####################################################################################

    setSpawnQueue() {
        Memory.spawnQueue = '';

        var roomsToClaim = Util.roomsToClaim();
        var roomsToReserve = Util.roomsToReserve();
        // console.log('Rooms to Claim: ' + roomsToClaim);

        if (Memory.roomsBeingAttacked.length > 0) {
            for (let room in Memory.roomsBeingAttacked) {
                if (Game.rooms[Memory.roomsBeingAttacked[room]].find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_SPAWN }).length > 0) {
                    Memory.spawnQueue = 'defender';
                    return;
                }
            }
        }
        if (roomsToClaim.length > 0) {
            // console.log('roomsToClaim ' + roomsToClaim);
            for (let room in roomsToClaim) {
                if (_.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.room.name == roomsToClaim[room]).length == 0) {
                    Memory.spawnQueue = 'claimer';
                    return;
                }
            }
        }
        if (roomsToReserve.length > 0) {
            // console.log('roomsToReserve ' + roomsToReserve);
            Memory.spawnQueue = 'claimer';
            return;
        }

    }

    setRoomsBeingAttacked() {
        Memory.roomsBeingAttacked = [];
        for (let room in this.rooms) {
            var attackers = rooms[room].find(FIND_HOSTILE_CREEPS);
            if (attackers.length > 0) {
                Array.prototype.push.apply(Memory.roomsBeingAttacked, [rooms[room]]);
            }
        }
    }

    clean() {
        for (let source in Memory.sources) {
            if (Memory.sources[source] == null) {
                delete Memory.sources;
                break;
            }
        }
    }

    //####################################################################################
    //########################################HELPERS#####################################
    //####################################################################################

    //Returns int - level of highest level controller in all owned rooms
    highestController() {
        var highest = 0;
        for (let room in this.rooms) {
            if (this.rooms[room].controller._my && this.rooms[room].controller.level > highest) {
                highest = this.rooms[room].controller.level;
            }
        }
        return highest;
    }

    //Returns int - number of rooms available to controll based on GCL
    numberOfRooms() {
        return Game.gcl;
    }

}