import CustomCreep from 'Creep';
import Util from 'Util';

export default class DefenderCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work() {
        // var manualKill = this.pos.findClosestByRange(FIND_STRUCTURES, { filter: (i) => i.hits == 1 });
        // // console.log('manual kill ' + manualKill);
        // if (manualKill != null) {
        //     if (this.attack(manualKill) != OK) {
        //         this.rangedAttack(manualKill);
        //         this.moveTo(manualKill, { ignoreDestructibleStructures: true });
        //     }
        //     return
        // }

        if (!('spawnRoom' in this.memory)) {
            this.memory.spawnRoom = this.room.name;
        }

        var closestHostile = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var priorityListToAttack = [STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION];
        var roomToAttack = '';

        //Figure out what room to attack/defend
        if (Memory.roomBeingAttacked.length > 0) {
            roomToAttack = Memory.roomBeingAttacked;
        } else if (Memory.roomsToAttack.length > 0) {
            for (let room in Memory.roomsToAttack) {
                if (roomToAttack == '' && (Game.rooms[Memory.roomsToAttack[room]] == undefined || Game.rooms[Memory.roomsToAttack[room]].find(FIND_MY_CREEPS).length < 2)) {
                    roomToAttack = Memory.roomsToAttack[room];
                }
            }
        }

        //Attack/defend logic

        if (roomToAttack == this.room.name && (('controller' in this.room) && !this.room.controller._my)) { //We are attacking the room we are in
            if (this.pos.getRangeTo(closestHostile) > 3) { //this means we are attacking a structure and there are no creeps to attact nearby
                for (let struct in priorityListToAttack) {
                    var closestTarget = this.pos.findClosestByRange(FIND_STRUCTURES, { filter: (i) => i.structureType == priorityListToAttack[struct] && !i.my });
                    if (closestTarget != null) {
                        console.log(this.name + ' is attacking ' + closestTarget);
                        this.generalAttack(closestTarget);
                        return;
                    }
                }
            }
        }

        if (closestHostile != null) { //If there is a hostile creep we need to kill it
            console.log(this.name + ' is attacking ' + closestHostile);
            this.generalAttack(closestHostile);
            return;
        }

        if (roomToAttack.length > 0 && this.room.name != roomToAttack) { //Need to move to room to attack
            console.log(this.name + ' need to move to ' + roomToAttack + ' to attack!');
            if (this.moveTo(new RoomPosition(25, 25, roomToAttack), { reusePath: 2, maxOps: 5000 }) == ERR_NO_PATH) {
                this.moveTo(new RoomPosition(25, 25, roomToAttack), { reusePath: 2, maxOps: 5000, ignoreDestructibleStructures: true });
                return;
            }
        }

        if (Memory.roomsToClearWalls.length > 0) {
            var roomToClear = {};
            for (let room in Memory.roomsToClearWalls) {
                roomToClear = Game.rooms[Memory.roomsToClearWalls[room]];
                if (roomToClear != undefined) {
                    var walls = roomToClear.find(FIND_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_WALL && struct.hits < 100000 });
                    if (walls.length > 0) {
                        if (this.room.name == roomToClear.name) {
                            var closestWall = this.pos.findClosestByRange(FIND_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_WALL && struct.hits < 100000 });
                            this.moveTo(closestWall);
                            this.generalAttack(closestWall);
                            return;
                        } else {
                            this.moveTo(new RoomPosition(25, 25, roomToClear.name));
                            return;
                        }
                    }
                }
            }
        }
        if (roomToAttack.length == 0 && this.room.name != this.memory.spawnRoom) { //If there's nothing to attack go home
            console.log(this.name + ' has nothing to do in this room. Going home');
            if (this.moveTo(new RoomPosition(25, 25, this.memory.spawnRoom), { reusePath: 2, maxOps: 5000 }) == ERR_NO_PATH) {
                this.moveTo(new RoomPosition(25, 25, this.memory.spawnRoom), { reusePath: 2, maxOps: 5000, ignoreDestructibleStructures: true });
                return;
            }
        }
        var flags = this.room.find(FIND_FLAGS);
        if (flags.length > 0) {
            this.creepMove(flags[0]);
        } else { this.moveInRandomDirection(); } //If there's nothing else to do... dance?

    }
}