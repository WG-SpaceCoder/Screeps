import Util from 'Util';
import { Spawn } from 'screeps-globals';

export default class CustomSpawn extends Spawn {
    constructor(spawn) {
        super(spawn);
        // console.log('Util.roomsToScout()', Util.roomsToScout());
        var sourcesCount = this.room.find(FIND_SOURCES).length;
        if (Game.time % 1 === 0) {
            this.work();
        }
    }

    //This is the main logic for all spawners
    work() {
        var minerCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner').length;
        var defenderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender' && ('spawnRoom' in creep.memory) && creep.memory.spawnRoom == this.room.name).length;
        var carrierCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier').length;
        var carrierThisRoomCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier' && ('assignedRoom' in creep.memory) && creep.memory.assignedRoom == this.room.name).length;
        var builderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && ('spawnRoom' in creep.memory) && creep.memory.spawnRoom == this.room.name).length;
        var scoutCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'scout' && creep.room == this.room).length;
        var containerCount = this.room.find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && !('progress' in i) });
        var hostileCreeps = this.room.find(FIND_HOSTILE_CREEPS);
        var totalRoomCreepCount = _.filter(Game.creeps, (creep) => creep.room == this.room).length;

        // if (this.room.controller.level <= 2) {
        //     this.spawnCarrier();
        // }

        if (this.spawning == null) { //IMMEDIATE ACTION REQUIRED - DO NOT CHECK FOR APPROPRIATEPOWER
            if (hostileCreeps.length > 0 && defenderCount == 0 && this.room.controller.level > 2) {
                console.log('We need to defend room ' + this.room.name + '! As there are ' + hostileCreeps.length + ' hostile creeps!');
                this.spawnDefender();
                return;
            } else if (carrierThisRoomCount == 0 || containerCount == 0 && carrierCount < 3) { //Early game builders are better than dedicated miners/carriers. Really just for the first cree though.
                this.spawnCarrier();
                return;
            } else if (minerCount == 0) {
                this.spawnMiner();
                return;
            } else if (carrierCount == 0) {
                this.spawnCarrier();
                return;
            } else if (upgraderCount == 0) {
                this.spawnUpgrader();
            }
        }

        // if (this.spawnFromMemory()) {
        //     return;
        // }

        if ((this.spawning == null && this.room.energyAvailable == this.room.energyCapacityAvailable) || _.filter(Game.creeps).length == 0) { //Non-urgent spawning logic begins here
            // console.log('Checking non urgent spawning logic');
            var upgraderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.room == this.room).length;
            var numberOfSources = Memory.sources.length;
            var spaceInContainers = this.room.find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && !Util.isEnergyStorageFull(i) }).length > 0;
            var claimerCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.room == this.room).length;
            var roomsToScout = Util.roomsToScout()
                // console.log('Util.roomsToClaim().length ' + Util.roomsToClaim().length);
                // console.log('Util.roomsToScout().length ', Util.roomsToScout().length, Util.roomsToScout());
            if (builderCount == 0) {
                this.spawnBuilder();
            } else if (upgraderCount == 0) {
                this.spawnUpgrader();
            } else if (roomsToScout.length > 0) {
                this.spawnScout(roomsToScout[0]);
            } else if (carrierCount < numberOfSources || minerCount < numberOfSources) {
                if (carrierCount < minerCount) {
                    this.spawnCarrier();
                } else {
                    this.spawnMiner();
                }
            } else if (defenderCount < 1 && this.room.controller.level > 2) {
                this.spawnDefender();
            } else if (builderCount < 2) {
                this.spawnBuilder();
            } else if (upgraderCount < 2) {
                this.spawnUpgrader();
            } else if (carrierThisRoomCount < 3) {
                this.spawnCarrier();
            } else if (claimerCount == 0 && Util.roomsToClaim().length > 0 && this.room.energyAvailable > 650) {
                this.spawnClaimer();
                // } else if (!spaceInContainers) {
                //     this.spawnBuilder();
            } else {
                this.spawnFromMemory();
            }
        }
    }

    //Spawn a Miner
    spawnMiner() {
        this.spawnCustomCreep([CARRY, MOVE, WORK], [WORK], 'miner', 750);
    }

    //Spawn a Scout
    spawnScout(roomToScout) {
        this.spawnCustomCreep([MOVE], [], 'scout', undefined, { roomToScout: roomToScout });
    }

    //Spawn a Carrier
    spawnCarrier() {
        this.spawnCustomCreep([WORK, CARRY, MOVE], [CARRY, MOVE], 'carrier', 1500);
    }

    //Spawn a Builder
    spawnBuilder() {
        this.spawnCustomCreep([WORK, CARRY, MOVE], [WORK, CARRY, MOVE], 'builder', 1000, { spawnRoom: this.room.name });
    }

    //Spawn a Upgrader
    spawnUpgrader() {
        this.spawnCustomCreep([WORK, CARRY, MOVE], [WORK, CARRY, MOVE], 'upgrader', 1000);
    }

    //Spawn a Claimer
    spawnClaimer() {
        return this.spawnCustomCreep([MOVE, MOVE, CLAIM], [CLAIM], 'claimer', 1300);
    }

    //Spawn a Defender
    spawnDefender() {
        if (this.availablePower <= 300) {
            this.spawnCustomCreep([MOVE, ATTACK, TOUGH, TOUGH], [], 'defender', { spawnRoom: this.room.name });
        } else { //This is to limit how much I was spending on defenders... too much
            this.spawnCustomCreep([MOVE, RANGED_ATTACK, ATTACK, TOUGH], [MOVE, ATTACK, TOUGH], 'defender', { spawnRoom: this.room.name });
        }
    }

    spawnFromMemory() {
        switch (Memory.spawnQueue) {
            case 'claimer':
                if (this.room.energyAvailable >= 700 && _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.room == this.room).length == 0) {
                    return this.spawnClaimer();
                }
                return false;
            default:
                return false;
        }
    }

    //bodyReqs is the required minimum to form a creep
    //bodyDynamics will add parts in order until you cannot add anymore parts
    //role is the string role of hte creep in memory
    spawnCustomCreep(bodyReqs, bodyDynamics, role, maxCost, ops) {
        var availablePower = this.room.energyAvailable;
        if (maxCost != undefined) {
            availablePower = Math.min(availablePower, maxCost);
        }
        var newBody = bodyReqs;
        var totalCost = 0;
        for (let part in bodyReqs) { //
            availablePower -= BODYPART_COST[bodyReqs[part]];
            totalCost += BODYPART_COST[bodyReqs[part]];
        }
        var added = true;
        while (added) {
            added = false;
            for (let part in bodyDynamics) {
                if (availablePower >= BODYPART_COST[bodyDynamics[part]]) {
                    newBody = newBody.concat(bodyDynamics[part]);
                    availablePower -= BODYPART_COST[bodyDynamics[part]];
                    totalCost += BODYPART_COST[bodyDynamics[part]];
                    added = true;
                }
            }
        }

        newBody = newBody.sort().reverse();
        ops = Object.assign({ role: role }, ops);

        var newName = this.createCreep(newBody, undefined, ops);
        if (newName) {
            console.log(this.name + ' is spawning a ' + role + ' with body [' + Util.bodyToString(newBody) + '] named ' + newName + ' Cost: ' + totalCost + '/' + this.room.energyAvailable + ' in room ' + this.room.name);
            return true;
        } else {
            console.log('Failed to spawn ' + role + ': ' + newName);
            return false;
        }
    }
}