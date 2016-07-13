import Spawn from 'Spawn';
import Harvester from 'Creep_Harvester';
import Builder from 'Creep_Builder';
import Upgrader from 'Creep_Upgrader';
import {Room} from 'screeps-globals';

export default class CustomRoom extends Room{
    constructor(room){
        super(room.name);
        this.controller = room.controller;
        this.getSpawn();
        this.buildRoads();
        this.getMyCreeps();
        // this.buildExtensions();
        if (Game.time % 19 === 0) {
            this.buildAlongRoads(STRUCTURE_EXTENSION);
        }
        if (Game.time % 21 === 0) {
            this.buildAlongRoads(STRUCTURE_CONTAINER);
        }


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
        if(Math.abs(x - closestStructure.pos.x) < 3 && Math.abs(y - closestStructure.pos.y) < 3){
            // console.log('Build site at ' + x + ',' + y +' too close to ' + closestStructure.structureType);
            return false; //Build pos is too close to another object
        }
        var closestStructure = this.getPositionAt(x, y).findClosestByRange(FIND_SOURCES);
        if(Math.abs(x - closestStructure.pos.x) < 3 && Math.abs(y - closestStructure.pos.y) < 3){
            // console.log('Build site at ' + x + ',' + y +' too close to ' + closestStructure.structureType);
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
        var sources = this.find(FIND_SOURCES)
        var points = this.find(FIND_STRUCTURES, {filter: (i) => i.structureType != STRUCTURE_ROAD && i.structureType != STRUCTURE_WALL && i.structureType != STRUCTURE_EXTENSION && i.structureType != STRUCTURE_CONTAINER});
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
                    var path = this.findPath(point1.pos, point2.pos);
                    if(this.canBuildConstructionSitesByQuantity(path.length)){
                        console.log('Building a road between ', point1, ' and ', point2);
                        for (var spot in path) {
                            spot = path[spot];
                            // console.log('Building road at ', spot.x, ', ', spot.y);
                            this.createConstructionSite(spot.x, spot.y, STRUCTURE_ROAD, {ignoreCreeps: true, ignoreDestructibleStructures: true});
                            Memory.roads.push(point1.toString() + point2.toString());
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
                default:
                    // console.log('Default screep role???????');
                    break;
            }
        }
    }

    getStructures(){
        if (!this._structures) {
          this._structures = this.find(FIND_STRUCTURES);
        }
        return this._structures;
    }

    getMyStructures(){
        if (!this._myStructures) {
          this._myStructures = this.find(FIND_MY_STRUCTURES);
        }

    return this._myStructures;
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


}