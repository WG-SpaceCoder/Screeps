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
        var upgraderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.room == this.room).length;
        var defenderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender' && ('spawnRoom' in creep.memory) && creep.memory.spawnRoom == this.room.name).length;
        var hostileCreeps = this.room.find(FIND_HOSTILE_CREEPS);
        var roomsToScout = Util.roomsToScout(this.room.name);
        var sourcesWithoutHarvesters = Util.getSurroundingSourcesWithoutHarvesters(this.room.name);
        var claimerCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.room == this.room).length;
        var carrierCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier' && creep.memory.spawnRoom == this.room.name).length;
        var roomsToClaim = Util.roomsToClaim();
        var constructionSpawns = Util.getContructionSpawns(3);
        // console.log('roomsToClaim:' + roomsToClaim);

        if (this.spawning == null) { //IMMEDIATE ACTION REQUIRED - DO NOT CHECK FOR APPROPRIATEPOWER
            if (Memory.roomBeingAttacked.length && defenderCount < 1 && this.room.controller.level > 2) {
                // console.log('We need to defend room ' + this.room.name + '! As there are ' + hostileCreeps.length + ' hostile creeps!');
                this.spawnDefender();
            } else if (carrierCount < 3) { //Early game builders are better than dedicated miners/carriers. Really just for the first cree though.
                this.spawnCarrier();
            } else if (upgraderCount == 0) {
                this.spawnUpgrader();
            } else if (carrierCount < Util.getSurroundingSources(this.room.name).length) {
                this.spawnCarrier();
            } else if (sourcesWithoutHarvesters.length) {
                // console.log('sourcesWithoutHarvesters: ' + sourcesWithoutHarvesters);
                this.spawnHarvester(sourcesWithoutHarvesters[0]);
                // } else if (builderCount == 0 && false) {
                //     this.spawnBuilder();
                // } else if (minerCount < _.ceil(sourceCount * 1.2)) {
                //     this.spawnMiner();
            } else if (roomsToScout.length && this.room.controller.level > 2) {
                // console.log('RoomsToScout = ' + roomsToScout.length);
                this.spawnScout(roomsToScout[0]);
                // } else if (defenderCount < 1 && this.room.controller.level > 2) {
                //     this.spawnDefender();
            } else if (Util.roomsToClaim().length) {
                this.spawnClaimer();
            } else if (constructionSpawns.length) {
                this.spawnSpawnBuilder(constructionSpawns[0]);
            } else {
                this.spawnFromMemory();
            }
        }

    }

    //Spawn a Miner
    spawnMiner() {
        this.spawnCustomCreep([CARRY, MOVE, WORK], [CARRY, WORK, MOVE, MOVE], 'miner', undefined, { assignedRoom: this.room.name }); //1450
    }

    //Spawn a SpawnBuilder
    spawnSpawnBuilder(spawn) {
        this.spawnCustomCreep([CARRY, MOVE, WORK], [CARRY, MOVE, WORK], 'spawnBuilder', undefined, { spawn: spawn }); //1450
    }

    //Spawn a Harvester
    spawnHarvester(source) {
        // console.log('spawning harvester: ' + source);
        this.spawnCustomCreep([CARRY, MOVE, MOVE, WORK], [WORK], 'harvester', 850, { sourceID: source, spawnRoom: this.room.name }); //1450
    }

    //Spawn a Scout
    spawnScout(roomToScout) {
        this.spawnCustomCreep([MOVE], [], 'scout', undefined, { roomToScout: roomToScout });
    }

    //Spawn a Carrier
    spawnCarrier() {
        this.spawnCustomCreep([WORK, CARRY, MOVE], [CARRY, MOVE], 'carrier', 1500, { spawnRoom: this.room.name });
    }

    //Spawn a Builder
    spawnBuilder() {
        this.spawnCustomCreep([WORK, CARRY, MOVE], [CARRY, MOVE, WORK], 'builder', undefined, { spawnRoom: this.room.name });
    }

    //Spawn a Upgrader
    spawnUpgrader() {
        this.spawnCustomCreep([WORK, CARRY, MOVE], [], 'upgrader', undefined, { spawnRoom: this.room.name });
    }

    //Spawn a Claimer
    spawnClaimer() {
        return this.spawnCustomCreep([MOVE, MOVE, CLAIM], [CLAIM], 'claimer', 1300);
    }

    //Spawn a Defender
    spawnDefender() {
        if (this.availablePower <= 300) {
            this.spawnCustomCreep([MOVE, ATTACK, TOUGH, TOUGH], [], 'defender', undefined, { spawnRoom: this.room.name });
        } else { //This is to limit how much I was spending on defenders... too much
            this.spawnCustomCreep([MOVE, RANGED_ATTACK, ATTACK, TOUGH], [MOVE, ATTACK, TOUGH, MOVE], 'defender', undefined, { spawnRoom: this.room.name });
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

        if (newBody.length > MAX_CREEP_SIZE) {
            newBody = newBody.slice(0, MAX_CREEP_SIZE);
        }

        newBody = newBody.sort().reverse();
        // console.log('pre-ops: ' + JSON.stringify(ops));
        ops = Object.assign({ role: role }, ops);
        // console.log('post-ops: ' + JSON.stringify(ops));

        var newName = this.createCreep(newBody, undefined, ops);
        if (isNaN(newName)) {
            // console.log(this.name + ' in ' + this.room.name + ' is spawning a ' + role + ' with body [' + Util.bodyToString(newBody) + '] named ' + newName + ' Cost: ' + totalCost + '/' + this.room.energyAvailable + ' in room ' + this.room.name + ' with ops ' + JSON.stringify(ops));
            return true;
        } else {
            // console.log('Failed to spawn ' + role + ': ' + newName);
            return false;
        }
    }
}