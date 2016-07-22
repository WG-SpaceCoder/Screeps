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

    work(){
        var minerCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.room == this.room).length;
        var defenderCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender' && creep.room == this.room).length;
        var carrierCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier').length;
        var containerCount = this.room.find(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && !('progress' in i)})
        var hostileCreeps = this.room.find(FIND_HOSTILE_CREEPS);

        //IMMEDIATE ACTION REQUIRED - DO NOT CHECK FOR APPROPRIATEPOWER
        if(this.spawning == null){
            if(hostileCreeps.length > 0 && defenderCount == 0 && this.room.controller.level > 2){
                console.log('We need to defend room ' + this.room.name + '! As there are ' + hostileCreeps.length + ' hostile creeps!');
                this.spawnDefender();
                return;
            } else if(minerCount == 0){
                this.spawnMiner();
                return;
            } else if(carrierCount == 0){
                this.spawnCarrier();
                return;
            }
        }
        //Non-urgent spawning logic begins here
        if((this.spawning == null && this.room.energyAvailable == this.room.energyCapacityAvailable) || _.filter(Game.creeps).length == 0){
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
            } else if(defenderCount < 5){
                this.spawnDefender();
            } else {
                this.spawnBuilder();
            }
        }

    }

     OLDwork(){
        if((this.spawning == null && (this.room.find(FIND_MY_STRUCTURES, {filter: (i) => (i.structureType == STRUCTURE_SPAWN || i.structureType == STRUCTURE_EXTENSION) && !Util.isEnergyStorageFull(i)}).length == 0)) || _.filter(Game.creeps).length == 0){
            for (var role in this.roleList){
                var roleCount = _.filter(Game.creeps, (creep) => creep.memory.role == this.roleList[role]).length;
                // console.log('roleCount' + roleCount);
                if(this.spawning == null && roleCount < this.roleAmount[role]){
                    if(this.createWorkerCreep(this.roleList[role], [CARRY, WORK, MOVE], 3)){
                        return;
                    }
                }
            }
        } else {
            // console.log('Not spawning because we are waiting for more energy')
        }
    }

    spawnMiner(){
        this.spawnCustomCreep([CARRY, MOVE, WORK], [WORK], 'miner');
    }

    spawnCarrier(){
        this.spawnCustomCreep([WORK, CARRY, MOVE], [CARRY, MOVE], 'carrier');
    }

    spawnBuilder(){
        this.spawnCustomCreep([WORK, CARRY, MOVE], [WORK, CARRY, MOVE], 'builder');
    }

    spawnUpgrader(){
        this.spawnCustomCreep([WORK, CARRY, MOVE], [WORK, CARRY, MOVE], 'upgrader');
    }

    spawnDefender(){
        // this.spawnCustomCreep([CARRY, MOVE, RANGED_ATTACK], [RANGED_ATTACK, TOUGH], 'defender');
        this.spawnCustomCreep([CARRY, MOVE, ATTACK, ATTACK, TOUGH, TOUGH, TOUGH, TOUGH], [RANGED_ATTACK, TOUGH], 'defender');
    }

    spawnCustomCreep(bodyReqs, bodyDynamics, role){
        var availablePower = this.room.energyAvailable;
        var newBody = bodyReqs;
        var totalCost = 0;
        for(let part in bodyReqs){
            availablePower -= BODYPART_COST[bodyReqs[part]];
            totalCost += BODYPART_COST[bodyReqs[part]];
        }
        for(let part in bodyDynamics){
            var amountToAdd = Math.floor(availablePower / bodyDynamics.length / BODYPART_COST[bodyDynamics[part]]);
            if(amountToAdd >= 1){
                // console.log('Can afford ' + (amountToAdd) + ' new ' + bodyDynamics[part]);
                newBody = newBody.concat(Array(amountToAdd).fill(bodyDynamics[part]));
                totalCost += (amountToAdd) * BODYPART_COST[bodyDynamics[part]];
            } else {
                // console.log('Cannot afford to add any more parts!');
            }

        }

        newBody = newBody.sort().reverse();

        console.log('Body is ' + newBody + ' Cost: ' + totalCost + ' TotalEnergyAvailable: ' + this.room.energyAvailable);

        var newName = this.createCreep(newBody, undefined, {role: role});
        if(newName){
            console.log('Spawning new ' + role + ' with body ' + newBody + ' named ' + newName);
            return true;
        } else {
            console.log('Failed to spawn ' + role + ': ' + newName);
            return false;
        }
    }

     createWorkerCreep(role, bodyList, min){
        // console.log('Attempting to create creep');
        var body = [];
        var i = 0;
        while (this.room.energyAvailable > Util.calculateCosts(body)){
            if(i > bodyList.length - 1){
                i = 0;
                // console.log('i: ', i);
            }
            body.push(bodyList[i]);
            // console.log('Attempting new ', role, ' with body ', body, ' can create ', this.canCreateCreep(body));
            i+=1;
        }
        body.pop();
        if(body.length >= min){
            // console.log('Attempting final ', role, ' with body ', body, ' can create ', this.canCreateCreep(body));
            var newName = this.createCreep(body, undefined, {role: role});
            if(newName){
                console.log('Spawning new ' + role + ' with body ' + body + ' named ' + newName);
                return true;
            } else {
                // console.log('Failed to spawn ' + role + ': ' + newName);
                return false;
            }
        }
    }
}
