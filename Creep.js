import {Creep} from 'screeps-globals';
import Util from 'Util';

export default class CustomCreep extends Creep{
	constructor(creep){
        super(creep);
        // this.say(this.memory.role);
    }

    //####################################################################################
    //########################################WORK########################################
    //####################################################################################

    //Makes upgraders upgrade
    upgradeWork(){
        if(this.memory.state == 'gathering'){
            if(this.carry.energy < this.carryCapacity){
                this.withdrawEnergyFromClosestStorage();
            } else {
                this.memory.state = 'working';
            }
        } else if(this.memory.state == 'working'){
            if (this.carry.energy > 0){
                if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
                    this.creepMove(this.room.controller);
                }
            } else {
                this.memory.state = 'gathering';
            }
        } else{
            this.memory.state = 'gathering';
        }
        return true;
    }

    //Makes builders build
    buildWork(){
        if(this.room.controller.ticksToDowngrade < 1000){
            console.log('TicksToDowngrade are less than 1,000! Upgrading Controller.');
            this.upgradeWork();
        }else if(this.memory.state == 'gathering'){
            if(this.carry.energy < this.carryCapacity){
                this.withdrawEnergyFromClosestStorage();
            } else {
                this.memory.state = 'working';
            }
        } else if(this.memory.state == 'working'){
            if(this.carry.energy == 0){
                this.memory.state = 'gathering';
            }else{
                if(!this.tryToConstruct()){
                    this.upgradeWork();
                }
            }
        } else{
            this.memory.state = 'gathering';
        }
    }

    //Makes harvesters harvest
    harvestWork(){
        if(this.memory.state == 'gathering'){
            if(this.carry.energy < this.carryCapacity){
                this.harvestEnergy();
            } else {
                this.memory.state = 'working';
            }
        } else if(this.memory.state == 'working'){
            if (this.carry.energy > 0){
                var priorityList = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_CONTAINER, STRUCTURE_CONTROLLER];
                for(let structureType in priorityList){
                    var strorageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => !Util.isEnergyStorageFull(i) && i.structureType == priorityList[structureType]});
                    // console.log('harvester lookting to dump energy in ' + priorityList[structureType]);
                    if(strorageStructure != null){
                        // console.log('harvester ' + this.name + ' looking to dump energy in ' + priorityList[structureType] + ' - ' + strorageStructure);
                        this.transferEnergy(strorageStructure);
                        return true;
                    }
                }
                console.log('Attempt to harvest failed as we are full up on energy!');
                return false;
            } else {
                this.memory.state = 'gathering';
            }
        } else{
            this.memory.state = 'gathering';
        }
        return true;
    }

    //####################################################################################
    //########################################ACTIONS#####################################
    //####################################################################################

    //(param) storage - structure to dump energy into
    //Dumps energy into a given structure
    transferEnergy(storage){
        var result = this.transfer(storage, RESOURCE_ENERGY);
        if(result == ERR_NOT_IN_RANGE){
            this.creepMove(storage);
        }else if(result != 0){
            console.log(this.name + ' failed to transfer energy to ' + storage + ' with error: ' + result);
        }
    }

    //A customized version of the inherited creep.moveTo() that includes logging and hopefully some cpu savings
    //NOTE: this should not be used for attackers as they will not path through walls
    creepMove(destination){
        var moveCode = this.moveTo(destination, {noPathFinding: true})

        if(moveCode == ERR_NO_PATH || moveCode == ERR_NOT_FOUND){
            moveCode = this.moveTo(destination)
        }
        if(moveCode != 0 && moveCode != -11){
            // console.log('Creep ' + this.name + ' was unable to move. ERR: ' + moveCode);
        }
    }

    //When you just don't know what the heck to do with a creep... you let em dance?
    moveInRandomDirection(){
        const directions = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];
        this.move(Math.floor(Math.random(directions.length) * directions.length));
    }

    //(param) target - the hostile to attack
    //This will attempt to attack or ranged attack a given target - this needs to be thought out just a bit more
    generalAttack(target){
        var err = this.attack(target);
        if(err == ERR_NOT_IN_RANGE){
            err = this.rangedAttack(target);
            this.creepMove(target);
        } else {
            console.log('Creep ' + this.name + ' tried to attack ' + target + ', but instead returned ' + err);
        }
    }

    //Looks for the closest container and tries to withdraw energy
    //If there is not sufficient storage creep will try to manually harvest
    withdrawEnergyFromClosestStorage(){
        // console.log('Energy percent available: ' + this.room.energyCapacityAvailable + ' ' + this.room.energyAvailable + ' ' + (this.room.energyAvailable / this.room.energyCapacityAvailable));
        var storageStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && !('progress' in i) && i.store[RESOURCE_ENERGY] > (this.carryCapacity - _.sum(this.carry))});
        // console.log('strorageStructure: ' + storageStructure);
        if(storageStructure != null){
            // console.log('Energy percent available: ' + this.room.energyCapacityAvailable + ' ' + this.room.energyAvailable + ' ' + (this.room.energyAvailable / this.room.energyCapacityAvailable));
            // console.log(this.name + ' found Container with enough energy to grab');
            if(this.withdraw(storageStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creepMove(storageStructure);
            }
        } else{
            this.harvestEnergy();
        }
    }

    //Harvests energy from the closest source that has energy and that the creep can actually reach
    harvestEnergy(){
        // console.log('Harvesting Energy!');
        // var source = this.pos.findClosestByRange(FIND_SOURCES);
        var source = this.getClosestAvailableSource();
        if(this.harvest(source) == ERR_NOT_IN_RANGE){
            this.creepMove(source);
        }
    }

    //Tries to either repair existing structures or build new structures based on a prioritised list
    //Attempts to store the structure in memory to reduce cpu - THIS NEEDS TO BE DONE FOR BUILDING AS WELL YOU LAZY SCRUB
    tryToConstruct(){
        var priorityList = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTROLLER];
        var toRepair = Game.getObjectById(this.memory.toRepair);
        if(toRepair != null){
            if((toRepair.structureType == STRUCTURE_WALL || toRepair.structureType == STRUCTURE_RAMPART) ? (toRepair.hits < 5000 && toRepair.hits != toRepair.hitsMax) : (toRepair.hitsMax - toRepair.hits)){
                // console.log('Repairing ' + toRepair + ' based on Memory! ' + (toRepair.structureType == STRUCTURE_WALL), (toRepair.hits < 1000), toRepair.hits);
                if(this.repair(toRepair) == ERR_NOT_IN_RANGE){
                    this.creepMove(toRepair);
                }
                return true;
            }
        }
        for(let structure in priorityList){
            var closestConstructionSite = this.pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => (i.structureType == priorityList[structure]) && ((i.structureType == STRUCTURE_WALL || i.structureType == STRUCTURE_RAMPART) ? (i.hits < 2000 && i.hits != i.hitsMax) : (i.hits / i.hitsMax < 0.50))});
            if(closestConstructionSite != null){
                // console.log(this.name + ' needs to repair ' + closestConstructionSite);
                this.memory.toRepair = closestConstructionSite.id
                if(this.repair(closestConstructionSite) == ERR_NOT_IN_RANGE){
                    this.creepMove(closestConstructionSite);
                }
                return true;
            } else {
                // console.log('We don\'t have any ' + priorityList[structure] + ' to repair');
            }
        }
        for(let structure in priorityList){
            var closestConstructionSite = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {filter: (i) => i.structureType == priorityList[structure]});
            if(closestConstructionSite != null){
                if(this.build(closestConstructionSite) == ERR_NOT_IN_RANGE){
                    this.creepMove(closestConstructionSite);
                }
                return true;
            }
        }
        return false;
    }

    //####################################################################################
    //########################################INFO########################################
    //####################################################################################

    //Array - list of sources that are actively being mined by miners
    getClaimedSources(){
        var miners = _(Game.creeps).filter({ memory: { role: 'miner' }}).value();
        var sources = [];
        for(let miner in miners){
            if('source' in miners[miner].memory){
                // console.log('Source ' + miners[miner].memory.source.id + ' is taken');
                sources.push(miners[miner].memory.source.id);
            }

        }
        // console.log('Found sources: ' + sources.toString());
        return sources;
    }

    //Source - returns the closest source that has energy and that is accesible
    getClosestAvailableSource(){
        var source = Game.getObjectById(this.memory.source);
        if(source == null){
            // console.log('Source was null');
            source = this.pos.findClosestByRange(FIND_SOURCES, {filter: (i) => i.energy > 0});
            this.memory.source = source.id;
        }
        var idList = [source.id];
        var tmp = 0;
        while(!this.isSourceAvailable(source)){
            // console.log('Cannot use source: ' + source);
            source = this.pos.findClosestByRange(FIND_SOURCES, {filter: (i) => idList.indexOf(i.id) == -1});
            if(source == null){
                // console.log('OUCH: something went wrong and we could not find a source: ' + idList);
                return;
            }
            // console.log('source: ' + source);
            idList.push(source.id);
            tmp += 1;
        }
        this.memory.source = source.id;
        return source;
    }

    //Boolean - if the given source is accesible ie if a creep can path to it and mine it
    isSourceAvailable(source){
        var available = false;
        // console.log('Checking if ' + source + ' is available');
        if(Math.abs(source.pos.x - this.pos.x) <= 1 && Math.abs(source.pos.y - this.pos.y) <= 1){ //If you are already right next to the source
            // console.log('Creep ' + this.name + ' is right next to a source!');
            return true;
        } else {
            var searchSpots = [-1, 0, 1];
            for(var x in searchSpots){
                x = source.pos.x + searchSpots[x];
                for(var y in searchSpots){
                    y = source.pos.y + searchSpots[y];
                    if(x != source.pos.x && y != source.pos.y){
                        // console.log('location: ' + x + ',' + y);
                        var objects = this.room.lookAt(x, y);
                        var tmpAvailable = true;
                        for(let obj in objects){
                            // console.log('there is a ' + objects[obj].type + ' at ' + x + ',' + y);
                            if(['creep'].indexOf(objects[obj].type) == -1 && ((objects[obj].type == 'terrain') ? (objects[obj].terrain != 'wall') : (true))){
                                // console.log('Space is available for ' + this.name + ' to harvest at ' + x + ',' + y + ' for object ' + objects[obj].type + OBSTACLE_OBJECT_TYPES.indexOf(objects[obj].type));
                            } else {
                                tmpAvailable = false;
                                // console.log('Space is NOT available for ' + this.name + ' to harvest at ' + x + ',' + y + ' for object ' + objects[obj].type + OBSTACLE_OBJECT_TYPES.indexOf(objects[obj].type));
                            }
                        }
                        if(tmpAvailable){
                            available = true;
                            // console.log('Space is available for ' + this.name + ' to harvest at ' + x + ',' + y);
                        }
                    }
                }
            }
        }
        // console.log('Source is not available for ' + this.name + ' ' + available);
        return available;
    }
}