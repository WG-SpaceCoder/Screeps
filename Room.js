import Spawn from 'Spawn';
import Harvester from 'Creep_Harvester';
import Builder from 'Creep_Builder';
import Upgrader from 'Creep_Upgrader';
import Miner from 'Creep_Miner';
import Defender from 'Creep_Defender';
import Carrier from 'Creep_Carrier';
import {Room} from 'screeps-globals';

export default class CustomRoom extends Room{
    constructor(room){
        super(room.name);
        // console.log('Room ' + this.name);
        this.controller = room.controller;

        this.workTowers();
        this.workCreeps();
        this.workSpawn();


        if (Game.time % 20 === 0) {
            this.buildAroundSpawn(STRUCTURE_EXTENSION);
            this.buildAroundSpawn(STRUCTURE_TOWER);
        }
        if (Game.time % 25 === 0) {
            this.buildSourceContainers();
            this.buildControllerContainer();
        }
        if (Game.time % 30 === 0) {
            this.buildRoads();
        }


    }


    //####################################################################################
    //########################################WORK########################################
    //####################################################################################

    //Makes towers tick
    workTowers(){
        var towers = this.find(FIND_MY_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_TOWER});
        var maxRepair = 11000;
        var priorityList = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_TOWER, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTROLLER];

        // console.log('Got ' + towers.length + ' towers!');
        for(let tower in towers){
            var closestHostile = towers[tower].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                // console.log('Closest hostile: ' + closestHostile);
                towers[tower].attack(closestHostile);
            }

            for(let structure in priorityList){
                var closestDamagedStructure = towers[tower].pos.findClosestByRange(FIND_STRUCTURES, {filter: (i) => (i.structureType == priorityList[structure]) && ((i.structureType == STRUCTURE_WALL || i.structureType == STRUCTURE_RAMPART) ? (i.hits < maxRepair && i.hits != i.hitsMax) : (i.hits != i.hitsMax))});
                if(closestDamagedStructure) {
                    towers[tower].repair(closestDamagedStructure);
                }
            }

            var closestDamagedCreep = towers[tower].pos.findClosestByRange(FIND_MY_CREEPS, {filter: (creep) => creep.hits != creep.hitsMax});
            if(closestDamagedCreep){
                towers[tower].heal(closestDamagedCreep);
            }
        }
    }

    //Makes creepers creep
    workCreeps(){
        let creepList = this.find(FIND_MY_CREEPS)
        for(let creep in creepList){
            creep = creepList[creep];
            switch (creep.memory.role){
                case 'harvester':
                    // console.log('harvester screep role???????');
                    var test = new Harvester(creep.id);
                    break;
                case 'builder':
                    // console.log('builder screep role???????');
                    var test = new Builder(creep.id);
                    break;
                case 'upgrader':
                    // console.log('upgrader screep role???????');
                    var test = new Upgrader(creep.id);
                    break;
                case 'miner':
                    // console.log('upgrader screep role???????');
                    var test = new Miner(creep.id);
                    break;
                case 'defender':
                    // console.log('upgrader screep role???????');
                    var test = new Defender(creep.id);
                    break;
                case 'carrier':
                    // console.log('upgrader screep role???????');
                    var test = new Carrier(creep.id);
                    break;
                default:
                    // console.log('Default screep role???????');
                    break;
            }
        }
    }

    //Makes spawners spawn
    workSpawn(){
        const spawns = this.find(FIND_MY_SPAWNS);
        if (spawns.length) {
          return new Spawn(spawns[0].id);
        }
        return new Spawn(spawns.id);
    }


    //####################################################################################
    //########################################BUILD#######################################
    //####################################################################################

    //Builds roads between all spawns, controllers, towers, and sources
    buildRoads(){
        if(!Memory.hasOwnProperty('roads')){
            Memory.roads = [];
        }
        if(this.find(FIND_CONSTRUCTION_SITES, {filter: (i) => i.structureType == STRUCTURE_ROAD}).length > 0){
            return;
        }
        var sources = this.find(FIND_SOURCES)
        var points = this.find(FIND_STRUCTURES, {filter: (i) => (STRUCTURE_SPAWN + STRUCTURE_CONTROLLER + STRUCTURE_TOWER).indexOf(i.structureType) != -1});
        // console.log('Need to build ' + points.length + ' roads.');
        points = points.concat(sources);
        // console.log('Need to build ' + points.length + ' roads.');
        for(var point1 in points){
            point1 = points[point1];
            // console.log('Point: ', points[point]);
            for(var point2 in points){
                point2 = points[point2];
                // console.log('Points:', point1.toString(), point2.toString());
                if(Memory.roads.indexOf(point1.toString() + point2.toString()) == -1 && Memory.roads.indexOf(point2.toString() + point1.toString()) == -1){
                    var path = this.findPath(point1.pos, point2.pos, {ignoreCreeps: true});
                    console.log('Points:', point1.toString(), point2.toString());
                    if(this.canBuildConstructionSitesByQuantity(path.length)){
                        console.log('Building a road between ', point1, ' and ', point2);
                        Memory.roads.push(point1.toString() + point2.toString());
                        for (var spot in path) {
                            spot = path[spot];
                            // console.log('Building road at ', spot.x, ', ', spot.y);
                            this.createConstructionSite(spot.x, spot.y, STRUCTURE_ROAD, {ignoreCreeps: true, ignoreDestructibleStructures: true});
                        }
                        return;
                    }
                }
            }
        }
    }

    //This will attempt to build structures in a spiral around spawn
    //Does not build in spaces where structures exist directly above, below, left, or right (makes a checkerboard pattern)
    //(param) structure is the structureType to build (currently extenstions and towers in my logic)
    buildAroundSpawn(structure){
        if(this.find(FIND_CONSTRUCTION_SITES, {filter: (i) => i.structureType == structure}).length == 0){ //If there are no extensions being made
            if(this.find(FIND_STRUCTURES, {filter: (i) => i.structureType == structure}).length < CONTROLLER_STRUCTURES[structure][this.controller.level]){ //If we are allowed to build more extensions
                console.log('Building ' + structure + ' - or at least trying to...');
                var spawner = this.find(FIND_MY_SPAWNS)[0];
                var currentPos = spawner.pos;
                var spacesToCheck = 2;
                while(spacesToCheck < 100){
                    currentPos.y -= 1;
                    currentPos.x +=1;
                    if(this.buildAtPos(currentPos, structure)){ //top right corner pos
                        return;
                    }
                    for(let i = 0; i < spacesToCheck; i++){ //go down
                        currentPos.y += 1;
                        if(this.buildAtPos(currentPos, structure)){
                            return;
                        }
                    }
                    for(let i = 0; i < spacesToCheck; i++){ //go left
                        currentPos.x -= 1;
                        if(this.buildAtPos(currentPos, structure)){
                            return;
                        }
                    }
                    for(let i = 0; i < spacesToCheck; i++){ //go up
                        currentPos.y -= 1;
                        if(this.buildAtPos(currentPos, structure)){
                            return;
                        }
                    }
                    for(let i = 0; i < spacesToCheck; i++){ //go right
                        currentPos.x += 1;
                        if(this.buildAtPos(currentPos, structure)){
                            return;
                        }
                    }
                    spacesToCheck += 2;
                }
            }

        }
    }

    //builds a container 'near' the controller
    buildControllerContainer(){
        // console.log('BuildingContainers');
        if(!('controllerContainers' in Memory)){
            Memory.controllerContainers = [];
        }
        if(Memory.controllerContainers.toString().indexOf(this.name) == -1){
            console.log(this.name + ' ' + Memory.controllerContainers);
            var spawn = this.find(FIND_MY_SPAWNS)[0]
            var path = this.findPath(this.controller.pos, spawn.pos, {ignoreCreeps: true});
            var x = path[2].x;
            var y = path[2].y;
            var ext = this.createConstructionSite(x, y, STRUCTURE_CONTAINER);
            if(!ext){
                console.log('WOOT created a Container !');
                Memory.controllerContainers.push(this.name);
            } else{
                console.log('Could not create container: ' + ext + ' at ' + x + ',' + y);
            }
        }

        var sourcesWithoutContainers = this.find(FIND_SOURCES, {filter: (i) => _.map(Memory.sources.filter((i) => ('container' in i)), function(n) {return n.id}).toString().indexOf(i.id) == -1});
        // console.log(sourcesWithoutContainers + '|||||||||||||||' + _.map(Memory.sources.filter((i) => !('container' in i)), function(n) {return n.id}));
        if(sourcesWithoutContainers.length > 0){
            // console.log('sourcesWithoutContainers: ' + sourcesWithoutContainers + ' find ' + _.map(Memory.sources.filter((i) => !('container' in i)), function(n) {return n.id}));
            var spawn = this.find(FIND_MY_SPAWNS)[0]
            for(let source in sourcesWithoutContainers){
                var path = this.findPath(sourcesWithoutContainers[source].pos, spawn.pos, {ignoreCreeps: true});
                // console.log('Path: ' + path[0].x + ',' + path[0].y);
                var x = path[0].x;
                var y = path[0].y;
                var ext = this.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                if(!ext){
                    console.log('WOOT created a Container !');
                    // Memory.sources.filter((i) => i.pos.x == x && i.pos.y == y).container = this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER})[0];
                    console.log(source + ' | ' + Memory.sources[source].id + ' | ' + this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y}));
                    Memory.sources[source].container = {x: x, y: y};
                    // Memory.sources[source].container = this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER})[0];
                } else{
                    console.log('Could not create container: ' + ext + ' at ' + x + ',' + y);
                }
            }
        }
    }

    //builds a container near each source
    buildSourceContainers(){
        // console.log('BuildingContainers');
        if(!('sources' in Memory)){
            Memory.sources = this.find(FIND_SOURCES);
            console.log('Found sources ' + Memory.sources[0], Memory.sources[1])
        }
        var sourcesWithoutContainers = this.find(FIND_SOURCES, {filter: (i) => _.map(Memory.sources.filter((i) => ('container' in i)), function(n) {return n.id}).toString().indexOf(i.id) == -1});
        // console.log(sourcesWithoutContainers + '|||||||||||||||' + _.map(Memory.sources.filter((i) => !('container' in i)), function(n) {return n.id}));
        if(sourcesWithoutContainers.length > 0){
            // console.log('sourcesWithoutContainers: ' + sourcesWithoutContainers + ' find ' + _.map(Memory.sources.filter((i) => !('container' in i)), function(n) {return n.id}));
            var spawn = this.find(FIND_MY_SPAWNS)[0]
            for(let source in sourcesWithoutContainers){
                var path = this.findPath(sourcesWithoutContainers[source].pos, spawn.pos, {ignoreCreeps: true});
                // console.log('Path: ' + path[0].x + ',' + path[0].y);
                var x = path[0].x;
                var y = path[0].y;
                var ext = this.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                if(!ext){
                    console.log('WOOT created a Container !');
                    // Memory.sources.filter((i) => i.pos.x == x && i.pos.y == y).container = this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER})[0];
                    console.log(source + ' | ' + Memory.sources[source].id + ' | ' + this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y}));
                    Memory.sources[source].container = {x: x, y: y};
                    // Memory.sources[source].container = this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER})[0];
                } else{
                    console.log('Could not create container: ' + ext + ' at ' + x + ',' + y);
                }
            }
        }
    }

    //####################################################################################
    //########################################HELPERS#####################################
    //####################################################################################

    //(param) quantity - the number of construction sites you want to make
    //Boolean - checks to see if you will hit the construction site limit
    canBuildConstructionSitesByQuantity(quantity){
        var totalCurrentConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES).length;
        if(totalCurrentConstructionSites + quantity < MAX_CONSTRUCTION_SITES){
            return true;
        }
        return false;
    }

    //(param) pos - the position to check if suitable for building
    //Boolean - if the current spot is buildable and if there is no blocking structure directly above, below, left, or right
    isValidPos(pos){
        var searchSpots = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        var available = false;
        var newPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        // console.log('newPos: ' + newPos);
        for(var i in searchSpots){
            newPos.y = pos.y + searchSpots[i][1];
            newPos.x = pos.x + searchSpots[i][0];
            // console.log('location: ' + x + ',' + y);
            var objects = newPos.lookFor(LOOK_STRUCTURES);
            // console.log('objects: ' + objects + ' at ' + newPos + ' ' + pos);
            var tmpAvailable = true;
            for(let obj in objects){
                // console.log('there is a ' + objects[obj].type + ' at ' + x + ',' + y);
                // console.log('structure: ' + objects[obj]);
                if(objects[obj].structureType != STRUCTURE_ROAD){
                    return false;
                }
            }
            if(tmpAvailable){
                available = true;
                // console.log('Space is available for ' + this.name + ' to harvest at ' + x + ',' + y);
            }
        }
        return available;
    }

    //(param) pos - the position to attempt the build at. structure - the structureType to attempt to build.
    //Boolean - true if the structure is build. Else, false.
    buildAtPos(pos, structure){
        if(!this.isValidPos(pos)){
            // console.log('Pos: ' + pos.x + ',' + pos.y + ' is not a valid pos for extensions.');
            return false;
        }
        if(!pos.createConstructionSite(structure)){
            return true;
        }
        return false;
    }



}