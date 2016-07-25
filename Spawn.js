import Util from 'Util';
import {Spawn} from 'screeps-globals';


export default class CustomSpawn extends Spawn {
    constructor(spawn){
        super(spawn);
        this.roleList = ['miner', 'harvester', 'builder', 'upgrader'];
        // console.log('We need ' + this.room.find(FIND_SOURCES).length + ' sources total');
        var sourcesCount = this.room.find(FIND_SOURCES).length;
        this.roleAmount = [sourcesCount, 0, 0, 0];
        // console.log('We need ' + this.roleAmount[0] + ' sources total');
        if (Game.time % 9 === 0) {
            this.work();
        }
    }

    //This is the main logic for all spawners
    work(){
        var minerCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.room == this.room).length;
        var defenderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender' && creep.room == this.room).length;
        var carrierCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier').length;
        var containerCount = this.room.find(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && !('progress' in i)})
        var hostileCreeps = this.room.find(FIND_HOSTILE_CREEPS);
        // console.log('WORKING SPAWN');


        if(this.spawning == null){ //IMMEDIATE ACTION REQUIRED - DO NOT CHECK FOR APPROPRIATEPOWER
            if(hostileCreeps.length > 0 && defenderCount == 0 && this.room.controller.level > 2){
                console.log('We need to defend room ' + this.room.name + '! As there are ' + hostileCreeps.length + ' hostile creeps!');
                this.spawnDefender();
                return;
            } else if(containerCount == 0){ //Early game builders are better than dedicated miners/carriers. Really just for the first cree though.
                this.spawnBuilder();
                return;
            } else if(minerCount == 0){
                this.spawnMiner();
                return;
            } else if(carrierCount == 0){
                this.spawnCarrier();
                return;
            }
        }

        if((this.spawning == null && this.room.energyAvailable == this.room.energyCapacityAvailable) || _.filter(Game.creeps).length == 0){ //Non-urgent spawning logic begins here
            // console.log('Checking non urgent spawning logic');
            var builderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder').length;
            var upgraderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader').length;
            var numberOfSources = this.room.find(FIND_SOURCES).length;
            if(builderCount == 0){
                this.spawnBuilder();
            } else if(upgraderCount == 0){
                this.spawnUpgrader();
            } else if(minerCount < numberOfSources){//if there are less miners than sources we need to spawn more miners
                this.spawnMiner();
            } else if(carrierCount < numberOfSources){
                this.spawnCarrier();
                return;
            } else if(defenderCount < 5 && this.room.controller.level > 2){
                this.spawnDefender();
            } else {
                this.spawnBuilder();
            }
        }

    }

    //Spawn a Miner
    spawnMiner(){
        this.spawnCustomCreep([CARRY, MOVE, WORK], [WORK], 'miner');
    }

    //Spawn a Carrier
    spawnCarrier(){
        this.spawnCustomCreep([WORK, CARRY, MOVE], [CARRY, MOVE], 'carrier');
    }

    //Spawn a Builder
    spawnBuilder(){
        this.spawnCustomCreep([WORK, CARRY, MOVE], [WORK, CARRY, MOVE], 'builder');
    }

    //Spawn a Upgrader
    spawnUpgrader(){
        this.spawnCustomCreep([WORK, CARRY, MOVE], [WORK, CARRY, MOVE], 'upgrader');
    }

    //Spawn a Defender
    spawnDefender(){
        if(this.availablePower <= 300){
            this.spawnCustomCreep([CARRY, MOVE, WORK, ATTACK, TOUGH, TOUGH], [], 'defender');
        } else { //This is to limit how much I was spending on defenders... too much
            this.spawnCustomCreep([CARRY, MOVE, WORK, ATTACK, ATTACK, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE], [], 'defender');
        }
    }

    //bodyReqs is the required minimum to form a creep
    //bodyDynamics will add parts in order until you cannot add anymore parts
    //role is the string role of hte creep in memory
    spawnCustomCreep(bodyReqs, bodyDynamics, role){
        var availablePower = this.room.energyAvailable;
        var newBody = bodyReqs;
        var totalCost = 0;
        for(let part in bodyReqs){ //
            availablePower -= BODYPART_COST[bodyReqs[part]];
            totalCost += BODYPART_COST[bodyReqs[part]];
        }
        var added = true;
        while(added){
            added = false;
            for(let part in bodyDynamics){
                if(availablePower >= BODYPART_COST[bodyDynamics[part]]){
                    newBody = newBody.concat(bodyDynamics[part]);
                    availablePower -= BODYPART_COST[bodyDynamics[part]];
                    totalCost += BODYPART_COST[bodyDynamics[part]];
                    added = true;
                }
            }
        }

        newBody = newBody.sort().reverse();

        var newName = this.createCreep(newBody, undefined, {role: role});
        if(newName){
            console.log('Spawning new ' + role + ' with body ' + Util.bodyToString(newBody) + ' named ' + newName + ' Cost: ' + totalCost + ' TotalEnergyAvailable: ' + this.room.energyAvailable);
            return true;
        } else {
            console.log('Failed to spawn ' + role + ': ' + newName);
            return false;
        }
    }
}
