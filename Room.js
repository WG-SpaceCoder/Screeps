import Spawn from 'Spawn';
import Harvester from 'Creep_Harvester';
import Builder from 'Creep_Builder';
import Upgrader from 'Creep_Upgrader';
import Miner from 'Creep_Miner';
import Defender from 'Creep_Defender';
import Carrier from 'Creep_Carrier';
import Claimer from 'Creep_Claimer';
import Scout from 'Creep_Scout';
import Util from 'Util';
import {
    Room
} from 'screeps-globals';

export default class CustomRoom extends Room {
    constructor(room) {
        super(room.name);

        //Setting up Memory//
        //Add Room to Memory for this room
        if (!('Room' in Memory)) {
            Memory.Room = {};
        }
        if (!(this.name in Memory.Room)) {
            Memory.Room[this.name] = {};
        }
        this.controller = room.controller; //Not sure why I have to do this. Was having issues with the controller beng set correctly
        Memory.Room[room.name].mostDamagedStructure = Util.getMostDamagedStructure(room.name); //Add most damaged structure to the room memory
        //If room being attacked notify all the defenders
        if (this.find(FIND_HOSTILE_CREEPS).length > 0) {
            Memory.roomBeingAttacked = this.name;
        } else if (Memory.roomBeingAttacked == this.name) {
            Memory.roomBeingAttacked = '';
        }

        //Work
        if (room.controller != undefined && room.controller._my && this.find(FIND_MY_SPAWNS).length > 0) { //If this is one of MY controlled rooms
            this.workTowers();
            if (Game.time % 20 === 0) { this.buildAroundSpawn(STRUCTURE_TOWER); }
            if (Game.time % 20 === 5) { this.buildAroundSpawn(STRUCTURE_EXTENSION); }
            if (Game.time % 123 === 0) { this.buildRoads(); }
            if (Game.time % 3 === 0) { this.workDrops(); }

        }

        //If owned and no spawn, build one
        if (room.controller != undefined && room.controller._my && this.find(FIND_MY_SPAWNS).length == 0) {
            this.buildSpawn();
        }

        // console.log(Util.getControlledRooms());

        if (Util.getControlledRooms().includes(this.name) || Util.getMiningRooms().includes(this.name)) {
            this.buildSourceContainers();
        }

    }


    //####################################################################################
    //########################################WORK########################################
    //####################################################################################

    //Makes towers tick
    workTowers() {
        if (!('maxRepair' in Memory)) {
            Memory.maxRepair = 1000;
        }
        var towers = this.find(FIND_MY_STRUCTURES, {
            filter: (i) => i.structureType == STRUCTURE_TOWER
        });
        var priorityList = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_TOWER, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTROLLER];

        // console.log('Got ' + towers.length + ' towers!');
        for (let tower in towers) {
            var closestHostile = towers[tower].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                console.log('Closest hostile: ' + closestHostile);
                console.log(towers[tower].attack(closestHostile));
                continue;
            }

            var closestDamagedCreep = towers[tower].pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (creep) => creep.hits != creep.hitsMax
            });
            if (closestDamagedCreep) {
                towers[tower].heal(closestDamagedCreep);
                continue;
            }

            // console.log('Tower ' + towers[tower] + ' is at ' + (towers[tower].energy / towers[tower].energyCapacity) + ' capacity.');
            var mostDamagedStructure = Util.getMostDamagedStructure(this.name);
            if (mostDamagedStructure != undefined && (mostDamagedStructure.hits < 1000 || (mostDamagedStructure.structureType == STRUCTURE_CONTAINER && mostDamagedStructure.hits <= 5000))) {
                // console.log('mostDamagedStructure', mostDamagedStructure.structureType, mostDamagedStructure.hits);
                towers[tower].repair(mostDamagedStructure);
                continue;
            }
            if (mostDamagedStructure != undefined && (towers[tower].energy / towers[tower].energyCapacity > 0.70 && _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier').length > 1)) {
                towers[tower].repair(mostDamagedStructure);
                Memory.Room[this.name].mostDamagedStructure = mostDamagedStructure;
                // if (Game.time % 10 === 0) { console.log('Most damaged Structure in room ' + this.name + ' is ' + mostDamagedStructure + ' at ' + mostDamagedStructure.hits + ' hits'); }
                continue;
            }
        }
    }

    //Makes creepers creep
    workCreeps() {
        let creepList = this.find(FIND_MY_CREEPS)
        for (let creep in creepList) {
            creep = creepList[creep];
            switch (creep.memory.role) {
                case 'harvester':
                    var test = new Harvester(creep.id);
                    break;
                case 'builder':
                    var test = new Builder(creep.id);
                    break;
                case 'upgrader':
                    var test = new Upgrader(creep.id);
                    break;
                case 'miner':
                    var test = new Miner(creep.id);
                    break;
                case 'defender':
                    var test = new Defender(creep.id);
                    break;
                case 'carrier':
                    var test = new Carrier(creep.id);
                    break;
                case 'claimer':
                    var test = new Claimer(creep.id);
                    break;
                case 'scout':
                    var test = new Scout(creep.id);
                    break;
                default:
                    // console.log('Default screep role???????');
                    break;
            }
        }
    }

    //Makes spawners spawn
    workSpawn() {
        var spawns = this.find(FIND_MY_SPAWNS);
        // console.log(spawns);
        if (spawns.length > 0) {
            return new Spawn(spawns[0].id);
        }
    }

    //Tells Miners to pick up energy off the floor/clean their room :p
    workDrops() {
        var drops = this.find(FIND_DROPPED_ENERGY);

        for (var drop in drops) {
            // console.log('drop:' + drops[drop].id + ' creeps: ' + _.filter(Game.creeps, (creep) => creep.memory.drop == drops[drop].id).length);
            if (!_.filter(Game.creeps, (creep) => creep.memory.drop == drops[drop].id).length) {
                var creep = drops[drop].pos.findClosestByRange(FIND_MY_CREEPS, { filter: (creep) => creep.memory.role == 'carrier' && creep.memory.state == 'gathering' && (creep.memory.drop == undefined || !creep.memory.drop.length) });
                if (creep != undefined) {
                    creep.memory.drop = drops[drop].id;
                    // console.log('Found a creep (' + creep.name + ') to clean up in room: ' + this.name);
                } else {
                    // console.log('Could not find a creep to clean up in room: ' + this.name);
                }
            }

        }
    }


    //####################################################################################
    //########################################BUILD#######################################
    //####################################################################################

    //Builds roads between all spawns, controllers, towers, and sources
    buildRoads() {
        var built = false;
        if (!Object.keys(Memory).includes('roads')) {
            Memory.roads = [];
        }
        if (!Object.keys(Memory).includes('fullRoads')) {
            Memory.fullRoads = [];
        }
        if (this.find(FIND_CONSTRUCTION_SITES, {
                filter: (i) => i.structureType == STRUCTURE_ROAD
            }).length > 0) {
            return;
        }
        var sources = this.find(FIND_SOURCES)
        var points = this.find(FIND_STRUCTURES, {
            filter: (i) => (STRUCTURE_SPAWN + STRUCTURE_CONTROLLER + STRUCTURE_TOWER + STRUCTURE_RAMPART + STRUCTURE_EXTENSION).indexOf(i.structureType) != -1
        });
        // console.log('Need to build ' + points.length + ' roads.');
        points = points.concat(sources);
        // console.log('Need to build ' + points.length + ' roads.');
        for (var point1 in points) {
            point1 = points[point1];
            // console.log('Point: ', points[point]);
            if (Memory.fullRoads.indexOf(point1.toString()) == -1) {
                for (var point2 in points) {
                    point2 = points[point2];
                    // console.log('Points:', point1.toString(), point2.toString());
                    if (point1.toString() != point2.toString() && Memory.roads.indexOf(point1.toString() + point2.toString()) == -1) {
                        var path = PathFinder.search(point1.pos, point2.pos, {
                            ignoreCreeps: true,
                            plainCost: 1,
                            swampCost: 1
                        }).path;
                        console.log('Points:', point1.toString(), point2.toString() + ' path: ' + path);
                        if (this.canBuildConstructionSitesByQuantity(path.length)) {
                            console.log('Building a road between ', point1, ' and ', point2);
                            Memory.roads.push(point1.toString() + point2.toString());
                            for (var spot in path) {
                                spot = path[spot];
                                // console.log('Building road at ', spot.x, ', ', spot.y);
                                if (this.createConstructionSite(spot.x, spot.y, STRUCTURE_ROAD) == OK) {
                                    if (!built) {
                                        console.log('Building road at ' + spot.x + ', ' + spot.y + ' ' + this.name);
                                        built = true;
                                    }
                                }
                            }
                            return true;
                        }
                    }
                }
                Memory.fullRoads.push(point1.toString());
            }
        }
        return false;
    }

    buildSpawn() {
        if (this.find(FIND_CONSTRUCTION_SITES).length) {
            return;
        }
        var sources = this.find(FIND_SOURCES);
        var posList = [this.controller.pos];
        var createdSpawn = false;
        var maxX = 0;
        var minX = 50;
        var maxY = 0;
        var minY = 50;

        for (var source in sources) {
            Array.prototype.push.apply(posList, [sources[source].pos]);
        }
        for (var posIndex in posList) {
            var pos = posList[posIndex];
            if (pos.x > maxX) { maxX = pos.x; }
            if (pos.x < minX) { minX = pos.x; }
            if (pos.y > maxY) { maxY = pos.y; }
            if (pos.y < minY) { minY = pos.y; }
        }

        var currentPos = this.getPositionAt(Math.floor((maxX + minX) / 2), Math.floor((maxY + minY) / 2));
        console.log('maxX: ' + maxX);
        console.log('minX: ' + minX);
        console.log('maxY: ' + maxY);
        console.log('minY: ' + minY);
        console.log('Middle point for spawn in room ' + this.name + ' is x: ' + currentPos.x + ' y: ' + currentPos.y);
        var structure = STRUCTURE_SPAWN;
        var spacesToCheck = 2;

        while (!createdSpawn && currentPos.y >= 0 && currentPos.x <= 49) {
            if (this.buildAtPos(currentPos, structure)) { //top right corner pos
                return;
            }
            for (let i = 0; i < spacesToCheck; i++) { //go down
                currentPos.y += 1;
                if (this.buildAtPos(currentPos, structure)) {
                    return;
                }
            }
            for (let i = 0; i < spacesToCheck; i++) { //go left
                currentPos.x -= 1;
                if (this.buildAtPos(currentPos, structure)) {
                    return;
                }
            }
            for (let i = 0; i < spacesToCheck; i++) { //go up
                currentPos.y -= 1;
                if (this.buildAtPos(currentPos, structure)) {
                    return;
                }
            }
            for (let i = 0; i < spacesToCheck; i++) { //go right
                currentPos.x += 1;
                if (this.buildAtPos(currentPos, structure)) {
                    return;
                }
            }
            currentPos.y -= 1;
            currentPos.x += 1;
            spacesToCheck += 2;
        }
    }

    //This will attempt to build structures in a spiral around spawn
    //Does not build in spaces where structures exist directly above, below, left, or right (makes a checkerboard pattern)
    //(param) structure is the structureType to build (currently extenstions and towers in my logic)
    buildAroundSpawn(structure) {
        if (this.find(FIND_CONSTRUCTION_SITES, {
                filter: (i) => i.structureType == structure
            }).length == 0) { //If there are no extensions being made
            if (this.find(FIND_STRUCTURES, {
                    filter: (i) => i.structureType == structure
                }).length < CONTROLLER_STRUCTURES[structure][this.controller.level]) { //If we are allowed to build more extensions
                console.log('Building ' + structure + ' - or at least trying to...');
                var spawner = this.find(FIND_MY_SPAWNS)[0];
                var currentPos = spawner.pos;
                var spacesToCheck = 2;
                while (spacesToCheck < 100) {
                    currentPos.y -= 1;
                    currentPos.x += 1;
                    if (this.buildAtPos(currentPos, structure)) { //top right corner pos
                        return;
                    }
                    for (let i = 0; i < spacesToCheck; i++) { //go down
                        currentPos.y += 1;
                        if (this.buildAtPos(currentPos, structure)) {
                            return;
                        }
                    }
                    for (let i = 0; i < spacesToCheck; i++) { //go left
                        currentPos.x -= 1;
                        if (this.buildAtPos(currentPos, structure)) {
                            return;
                        }
                    }
                    for (let i = 0; i < spacesToCheck; i++) { //go up
                        currentPos.y -= 1;
                        if (this.buildAtPos(currentPos, structure)) {
                            return;
                        }
                    }
                    for (let i = 0; i < spacesToCheck; i++) { //go right
                        currentPos.x += 1;
                        if (this.buildAtPos(currentPos, structure)) {
                            return;
                        }
                    }
                    spacesToCheck += 2;
                }
            }

        }
    }

    //builds a container 'near' the controller
    buildControllerContainer() {
        // console.log('BuildingContainers');
        if (!('controllerContainers' in Memory)) {
            Memory.controllerContainers = [];
        }
        if (Memory.controllerContainers.toString().indexOf(this.name) == -1) {
            console.log(this.name + ' ' + Memory.controllerContainers);
            var spawn = this.find(FIND_MY_SPAWNS)[0]
            var path = this.findPath(this.controller.pos, spawn.pos, {
                ignoreCreeps: true
            });
            var x = path[2].x;
            var y = path[2].y;
            var ext = this.createConstructionSite(x, y, STRUCTURE_CONTAINER);
            if (!ext) {
                console.log('WOOT created a Container !');
                Memory.controllerContainers.push(this.name);
            } else {
                console.log('Could not create container: ' + ext + ' at ' + x + ',' + y);
            }
        }

        var sourcesWithoutContainers = this.find(FIND_SOURCES, {
            filter: (i) => _.map(Memory.sources.filter((i) => ('container' in i)), function(n) {
                return n.id
            }).toString().indexOf(i.id) == -1
        });
        // console.log(sourcesWithoutContainers + '|||||||||||||||' + _.map(Memory.sources.filter((i) => !('container' in i)), function(n) {return n.id}));
        if (sourcesWithoutContainers.length > 0) {
            // console.log('sourcesWithoutContainers: ' + sourcesWithoutContainers + ' find ' + _.map(Memory.sources.filter((i) => !('container' in i)), function(n) {return n.id}));
            var spawn = this.find(FIND_MY_SPAWNS)[0]
            for (let source in sourcesWithoutContainers) {
                var path = this.findPath(sourcesWithoutContainers[source].pos, spawn.pos, {
                    ignoreCreeps: true
                });
                // console.log('Path: ' + path[0].x + ',' + path[0].y);
                var x = path[0].x;
                var y = path[0].y;
                var ext = this.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                if (!ext) {
                    console.log('WOOT created a Container !');
                    // Memory.sources.filter((i) => i.pos.x == x && i.pos.y == y).container = this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER})[0];
                    console.log(source + ' | ' + Memory.sources[source].id + ' | ' + this.find(FIND_STRUCTURES, {
                        filter: (i) => i.pos.x == x && i.pos.y == y
                    }));
                    Memory.sources[source].container = {
                        x: x,
                        y: y
                    };
                    // Memory.sources[source].container = this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER})[0];
                } else {
                    console.log('Could not create container: ' + ext + ' at ' + x + ',' + y);
                }
            }
        }
    }

    //builds a container near each source
    buildSourceContainers() {
        // console.log('BuildingContainers');
        if (!('sources' in Memory)) {
            Memory.sources = this.find(FIND_SOURCES);
            console.log('Found sources ' + Memory.sources[0], Memory.sources[1])
        } else {
            var sources = this.find(FIND_SOURCES);
            for (let source in sources) {
                var inMemory = false;
                for (let memSource in Memory.sources) {
                    if (Memory.sources[memSource] != null && sources[source].id == Memory.sources[memSource].id) {
                        inMemory = true;
                    }
                }
                if (!inMemory) {
                    Array.prototype.push.apply(Memory.sources, [sources[source]]);
                }
            }
        }

        this.cleanSources();

        var sourcesWithoutContainers = this.find(FIND_SOURCES, {
            filter: (i) => _.map(Memory.sources.filter((i) => ('container' in i)), function(n) {
                return n.id
            }).toString().indexOf(i.id) == -1
        });
        // console.log(sourcesWithoutContainers + '|||||||||||||||' + _.map(Memory.sources.filter((i) => !('container' in i)), function(n) {return n.id}));
        if (sourcesWithoutContainers.length > 0) {
            // console.log('sourcesWithoutContainers: ' + sourcesWithoutContainers + ' find ' + _.map(Memory.sources.filter((i) => !('container' in i)), function(n) {return n.id}));
            var spawns = this.find(FIND_MY_SPAWNS);
            if (spawns.length == 0) {
                var pos = new RoomPosition(25, 25, this.name);
            } else {
                var pos = spawns[0].pos;
            }
            for (let sourceWithoutContainers in sourcesWithoutContainers) {
                var path = this.findPath(sourcesWithoutContainers[sourceWithoutContainers].pos, pos, {
                    ignoreCreeps: true
                });
                // console.log('Path: ' + path[0].x + ',' + path[0].y);
                var x = path[0].x;
                var y = path[0].y;
                if (this.find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == x && i.pos.y == y && i.pos.roomName == this.name }).length != 0 || this.find(FIND_CONSTRUCTION_SITES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == x && i.pos.y == y && i.pos.roomName == this.name }).length != 0) {
                    // console.log('Found a pre-existing container!');
                    // console.log('Memory was: ' + Memory.sourcesWithoutContainers[sourceWithoutContainers].container.room, this.find(FIND_CONSTRUCTION_SITES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == x && i.pos.y == y && i.pos.roomName == this.name }));
                    this.setMemorySourceContainer(sourcesWithoutContainers[sourceWithoutContainers].id, x, y, this.name);
                    console.log('Setting memory to: ' + sourceWithoutContainers, Memory.sources[sourceWithoutContainers].container.room);
                } else {
                    var ext = this.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                    if (!ext) {
                        console.log('WOOT created a Container !');
                        // Memory.sources.filter((i) => i.pos.x == x && i.pos.y == y).container = this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER})[0];
                        console.log(sourceWithoutContainers + ' | ' + Memory.sources[sourceWithoutContainers].id + ' | ' + this.find(FIND_STRUCTURES, {
                            filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER
                        }));
                        this.setMemorySourceContainer(sources[sourceWithoutContainers].id, x, y, this.name);
                        console.log(sourceWithoutContainers + ' | ' + Memory.sources[sourceWithoutContainers].id + ' | ' + this.find(FIND_STRUCTURES, {
                            filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER
                        }));
                        // Memory.sourcesWithoutContainers[sourceWithoutContainers].container = this.find(FIND_STRUCTURES, {filter: (i) => i.pos.x == x && i.pos.y == y && i.structureType == STRUCTURE_CONTAINER})[0];
                    } else {
                        console.log('Could not create container: ' + ext + ' at ' + x + ',' + y);
                    }
                }

            }
        }
    }

    //####################################################################################
    //########################################HELPERS#####################################
    //####################################################################################

    cleanSources() {
        var removed = _.remove(Memory.sources, function(source) {
            // console.log(JSON.stringify(source));
            return Game.getObjectById(source.id) == undefined || (source.container != undefined && source.container.id != undefined && Game.getObjectById(source.container.id) == undefined);
        });

        if (removed.length) { console.log('Removing sources: ' + removed); }
    }

    getMostDamagedStructure() {
        var damagedStructures = this.find(FIND_STRUCTURES, { filter: (i) => i.hits != i.hitsMax });
        if (damagedStructures.length > 0) {
            var mostDamagedStructure = damagedStructures[0];
            for (let struct in damagedStructures) {
                if (damagedStructures[struct].hits < mostDamagedStructure.hits) {
                    mostDamagedStructure = damagedStructures[struct];
                }
            }
            return mostDamagedStructure;
        }
        return;
    }

    setMemorySourceContainer(sourceId, containerX, containerY, containerRoom) {
        for (let source in Memory.sources) {
            if (Memory.sources[source].id == sourceId) {
                Memory.sources[source].container = { x: containerX, y: containerY, room: containerRoom };
            }
        }
    }

    //(param) quantity - the number of construction sites you want to make
    //Boolean - checks to see if you will hit the construction site limit
    canBuildConstructionSitesByQuantity(quantity) {
        var totalCurrentConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES).length;
        if (totalCurrentConstructionSites + quantity < MAX_CONSTRUCTION_SITES) {
            return true;
        }
        return false;
    }

    //(param) pos - the position to check if suitable for building
    //Boolean - if the current spot is buildable and if there is no blocking structure directly above, below, left, or right
    isValidPos(pos) {
        var searchSpots = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0]
        ];
        var available = false;
        var newPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        // console.log('newPos: ' + newPos);
        for (var i in searchSpots) {
            newPos.y = pos.y + searchSpots[i][1];
            newPos.x = pos.x + searchSpots[i][0];
            // console.log('location: ' + x + ',' + y);
            var objects = newPos.lookFor(LOOK_STRUCTURES);
            // console.log('objects: ' + objects + ' at ' + newPos + ' ' + pos);
            var tmpAvailable = true;
            for (let obj in objects) {
                // console.log('there is a ' + objects[obj].type + ' at ' + x + ',' + y);
                // console.log('structure: ' + objects[obj]);
                if (objects[obj].structureType != undefined && objects[obj].structureType != STRUCTURE_ROAD) {
                    return false;
                }
                if (objects[obj].structureType == undefined) {
                    return false;
                }
            }

            if (tmpAvailable) {
                available = true;
                // console.log('Space is available for ' + this.name + ' to harvest at ' + x + ',' + y);
            }
        }
        searchSpots = [
            [1, 1],
            [-1, -1],
            [1, -1],
            [-1, 1]
        ];

        for (var i in searchSpots) {
            newPos.y = pos.y + searchSpots[i][1];
            newPos.x = pos.x + searchSpots[i][0];
            // console.log('location: ' + x + ',' + y);
            var objects = newPos.lookFor(LOOK_SOURCES);
            if (objects.length) {
                return false;
            }
            return available;
        }
    }

    //(param) pos - the position to attempt the build at. structure - the structureType to attempt to build.
    //Boolean - true if the structure is build. Else, false.
    buildAtPos(pos, structure) {
        if (!this.isValidPos(pos)) {
            // console.log('Pos: ' + pos.x + ',' + pos.y + ' is not a valid pos for extensions.');
            return false;
        }
        if (!pos.createConstructionSite(structure)) {
            return true;
        }
        return false;
    }

    //Boolean - if the room is currently owned by me
    isMine() {
        if (this.controller != undefined && this.controller._my) {
            return true;
        }
        return false;
    }



}