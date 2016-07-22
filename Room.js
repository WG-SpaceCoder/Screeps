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
        this.controller = room.controller;
        this.getSpawn();
        this.buildRoads();
        this.getMyCreeps();


        if (Game.time % 30 === 0){
            this.buildExtensions()
        }

        // if (Game.time % 100 === 0) {
        //     this.buildAlongRoads(STRUCTURE_CONTAINER);
        // }
        this.buildSourceContainers();
        this.buildControllerContainer()

    }

    canBuildConstructionSitesByQuantity(quantity){
        var totalCurrentConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES).length;
        if(totalCurrentConstructionSites + quantity < MAX_CONSTRUCTION_SITES){
            return true;
        }
        return false;
    }

    isValidBuildPos(x, y){
        // console.log('Checking valid position');
        var objects = this.lookAt(x, y);
        var closestStructure = this.getPositionAt(x, y).findClosestByRange(FIND_STRUCTURES, {filter: (i) => i.structureType != STRUCTURE_ROAD});
        if(Math.abs(x - closestStructure.pos.x) < 2 && Math.abs(y - closestStructure.pos.y) < 2){
            console.log('Build site at ' + x + ',' + y +' too close to ' + closestStructure + ' xdiff ' + Math.abs(x - closestStructure.pos.x) + ' ydiff ' + Math.abs(y - closestStructure.pos.y));
            return false; //Build pos is too close to another object
        }
        var closestStructure = this.getPositionAt(x, y).findClosestByRange(FIND_SOURCES);
        if(Math.abs(x - closestStructure.pos.x) < 2 && Math.abs(y - closestStructure.pos.y) < 32){
            console.log('Build site at ' + x + ',' + y +' too close to ' + closestStructure.structureType);
            return false; //Build pos is too close to another object
        }
        for(let obj in objects){
            // console.log('there is a ' + objects[obj].type + ' at ' + x + ',' + y);
            if(['structure', 'constructionSite', 'source'].indexOf(objects[obj].type) != -1){
                // console.log('Can\'t Build as there is a ' + objects[obj].type + ' at ' + x + ',' + y);
                return false;
            }
        }
        return true;
    }

    buildRoads(){
        if(!Memory.hasOwnProperty('roads')){
            Memory.roads = [];
        }
        if(this.find(FIND_CONSTRUCTION_SITES, {filter: (i) => i.structureType == STRUCTURE_ROAD}).length > 0){
            return;
        }
        var sources = this.find(FIND_SOURCES)
        var points = this.find(FIND_STRUCTURES, {filter: (i) => i.structureType in [STRUCTURE_SPAWN, STRUCTURE_CONTROLLER]});
        for(var source in sources){
            points.push(sources[source]);
        }
        for(var point1 in points){
            point1 = points[point1];
            // console.log('Point: ', points[point]);
            for(var point2 in points){
                point2 = points[point2];
                // console.log('Points: ', (point1.toString(), point2.toString()));
                if(Memory.roads.indexOf(point1.toString() + point2.toString()) == -1 && Memory.roads.indexOf(point2.toString() + point1.toString()) == -1){
                    var path = this.findPath(point1.pos, point2.pos, {ignoreCreeps: true});
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

    getMyCreeps(){
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

    getSpawn(){
        const spawns = this.find(FIND_MY_SPAWNS);
        if (spawns.length) {
          return new Spawn(spawns[0].id);
        }
        return new Spawn(spawns.id);
    }

    buildAlongRoads(structureType){
        // console.log('Running buildAlongRoads()');
        if(!this.canBuildConstructionSitesByQuantity(1)){
            return;
        }
        var searchSpots = [-1, 0, 1];
        var roads = this.find(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_ROAD});
        // console.log('Count: ' + roads.length);
        roads = roads.concat(this.find(FIND_CONSTRUCTION_SITES, {filter: (i) => i.structureType == STRUCTURE_ROAD}));
        // console.log('Count: ' + roads.length);
        var count = this.find(FIND_STRUCTURES, {filter: (i) => i.structureType == structureType}).length;
        if(this.find(FIND_MY_CONSTRUCTION_SITES, {filter: (i) => i.structureType == structureType}).length == 0){
            if(count < CONTROLLER_STRUCTURES[structureType][this.controller.level]) {
                // console.log('Attempting to build a ' + structureType);
                console.log('Building ' + structureType + ' as controller can make ' + CONTROLLER_STRUCTURES[structureType][this.controller.level] + ' and we have ' + count);
                for(let road in roads){
                    var spot = roads[road].pos;
                    for(var x in searchSpots){
                        x = spot.x + searchSpots[x];
                        for(var y in searchSpots){
                            y = spot.y + searchSpots[y];
                            // console.log('Tyring to create ' + structureType + ' at ' + x + ',' + y + ' orig spot ' + spot.x + ',' + spot.y);
                            if(this.isValidBuildPos(x, y)){
                                let ext = this.createConstructionSite(x, y, structureType);
                                if(!ext){
                                    console.log('WOOT created a(n) ' + structureType + '!')
                                    return;
                                } else{
                                    // console.log('Tyring to create ' + structureType + ' at ' + x + ',' + y + ' orig spot ' + spot.x + ',' + spot.y + ' Failed due to ' + ext);
                                }
                            }
                        }
                    }
                }
            } else {
                return;
            }
        } else {
            return;
        }
        console.log('Attempted to build ' + structureType + ', but failed');
    }

    isValidExtensionPos(pos){
        var searchSpots = [-1, 0, 1];
        var available = false;
        var newPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        console.log('newPos: ' + newPos);
        for(var x in searchSpots){
            for(var y in searchSpots){
                newPos.y = pos.y + searchSpots[y];
                newPos.x = pos.x + searchSpots[x];
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
        }
        return available;
    }

    buildExtensionAtPos(pos){
        if(pos in Memory.extentionCheckList){
            console.log('Pos: ' + x + ',' + y + ' has already been checked for extensions.');
            return false;
        }
        if(!this.isValidExtensionPos(pos)){
            console.log('Pos: ' + pos.x + ',' + pos.y + ' is not a valid pos for extensions.');
            Memory.extentionCheckList.push(pos);
            return false;
        }
        Memory.extentionCheckList.push(pos);
        console.log('Creating extension: ' + this.createConstructionSite(pos, STRUCTURE_EXTENSION));
        return true;
    }

    buildExtensions(){
        // console.log('Building extensions - or at least trying to...');
        if(!('extentionCheckList' in Memory)){
            Memory.extentionCheckList = [];
        }
        if(this.find(FIND_CONSTRUCTION_SITES, {filter: (i) => i.structureType == STRUCTURE_EXTENSION}).length == 0){ //If there are no extensions being made
            if(this.find(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_EXTENSION}).length < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][this.controller.level]){ //If we are allowed to build more extensions
                console.log('Building extensions - or at least trying to...');
                var spawner = this.find(FIND_MY_SPAWNS)[0];
                var currentPos = spawner.pos;
                var spacesToCheck = 2;
                while(spacesToCheck < 16){
                    currentPos.y -= 1;
                    currentPos.x +=1;
                    if(this.buildExtensionAtPos(currentPos)){ //top right corner pos
                        return;
                    }
                    for(let i = 0; i < spacesToCheck; i++){ //go down
                        currentPos.y += 1;
                        if(this.buildExtensionAtPos(currentPos)){
                            return;
                        }
                    }
                    for(let i = 0; i < spacesToCheck; i++){ //go left
                        currentPos.x -= 1;
                        if(this.buildExtensionAtPos(currentPos)){
                            return;
                        }
                    }
                    for(let i = 0; i < spacesToCheck; i++){ //go up
                        currentPos.y -= 1;
                        if(this.buildExtensionAtPos(currentPos)){
                            return;
                        }
                    }
                    for(let i = 0; i < spacesToCheck; i++){ //go right
                        currentPos.x += 1;
                        if(this.buildExtensionAtPos(currentPos)){
                            return;
                        }
                    }
                    spacesToCheck += 2;
                }
            }

        }

    }

    buildAlongRoads(structureType){
        // console.log('Running buildAlongRoads()');
        if(!this.canBuildConstructionSitesByQuantity(1)){
            return;
        }
        var searchSpots = [-1, 0, 1];
        var roads = this.find(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_ROAD});
        // console.log('Count: ' + roads.length);
        roads = roads.concat(this.find(FIND_CONSTRUCTION_SITES, {filter: (i) => i.structureType == STRUCTURE_ROAD}));
        // console.log('Count: ' + roads.length);
        var count = this.find(FIND_STRUCTURES, {filter: (i) => i.structureType == structureType}).length;
        if(this.find(FIND_MY_CONSTRUCTION_SITES, {filter: (i) => i.structureType == structureType}).length == 0){
            if(count < CONTROLLER_STRUCTURES[structureType][this.controller.level]) {
                // console.log('Attempting to build a ' + structureType);
                console.log('Building ' + structureType + ' as controller can make ' + CONTROLLER_STRUCTURES[structureType][this.controller.level] + ' and we have ' + count);
                for(let road in roads){
                    var spot = roads[road].pos;
                    for(var x in searchSpots){
                        x = spot.x + searchSpots[x];
                        for(var y in searchSpots){
                            y = spot.y + searchSpots[y];
                            // console.log('Tyring to create ' + structureType + ' at ' + x + ',' + y + ' orig spot ' + spot.x + ',' + spot.y);
                            if(this.isValidBuildPos(x, y)){
                                let ext = this.createConstructionSite(x, y, structureType);
                                if(!ext){
                                    console.log('WOOT created a(n) ' + structureType + '!')
                                    return;
                                } else{
                                    // console.log('Tyring to create ' + structureType + ' at ' + x + ',' + y + ' orig spot ' + spot.x + ',' + spot.y + ' Failed due to ' + ext);
                                }
                            }
                        }
                    }
                }
            } else {
                return;
            }
        } else {
            return;
        }
        console.log('Attempted to build ' + structureType + ', but failed');
    }

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

    buildSourceContainers(){
        // console.log('BuildingContainers');
        if(!('sources' in Memory)){
            Memory.sources = this.find(FIND_SOURCES);
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

}