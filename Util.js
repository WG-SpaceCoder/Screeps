//Just some useful methods that don't have a better home

//Simply removes dead creeps from memory
function garbageCollection() {
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            // console.log('Clearing non-existing creep memory:', name, Memory.creeps[name].role);
            delete Memory.creeps[name];
        }
    }
}

//Given a structure that can hold energy, returns boolean if energy storage is full
function isEnergyStorageFull(storage) {
    if ('storeCapacity' in storage) {
        // console.log('Has storage capacity');
        return storage.storeCapacity - storage.store[RESOURCE_ENERGY] <= 0;
    } else {
        return storage.energyCapacity - storage.energy <= 0;
    }
}


//Given an array of body parts returns boolean of if the room spawner can afford it
function calculateCosts(bodyParts) {
    let cost = 0;
    bodyParts.forEach((bodyPart) => {
        const part = typeof bodyPart === 'string' ? bodyPart : bodyPart.type;
        cost += BODYPART_COST[part];
    });

    return cost;
}

//Returns a 'nicely' formated easier for a human to read body. Without this body text can get really really long
//IE returns work 3, carry 3, move 3 instead of work,work,work,carry,carry,move,move,move
function bodyToString(body) {
    var tmp = {};
    var tmpStr = '';
    body.forEach(function(i) { tmp[i] = (tmp[i] || 0) + 1; });
    _.each(tmp, function(key, value) {
        tmpStr += value + ' ' + key + ', ';
    });
    return tmpStr.trim().slice(0, -1);

}

function roomsToScout(roomName) {
    var exits = _.values(Game.map.describeExits(roomName));
    var roomsToScout = [];
    for (let room in exits) {
        room = exits[room];
        // console.log('Found room to scout ' + room);
        if (_.filter(Game.creeps, (creep) => creep.memory.role == 'scout' && creep.memory.roomToScout == room).length == 0) { //if a room is undefined you cannot 'see' it. Meaning there is no creep or building in it.
            // console.log('Found room to scout ' + '\'' + room + '\', ' + _.filter(Game.creeps, (creep) => creep.memory.role == 'scout' && creep.memory.roomToScout == room));
            Array.prototype.push.apply(roomsToScout, [room]);
        }
    }
    for (let roomName in Memory.roomsToClaim) {
        var room = Game.rooms[Memory.roomsToClaim[roomName]];
        if (_.filter(Game.creeps, (creep) => creep.memory.role == 'scout' && creep.memory.roomToScout == Memory.roomsToClaim[roomName]).length == 0) {
            Array.prototype.push.apply(roomsToScout, [Memory.roomsToClaim[roomName]]);
        }
    }
    if (canClaimMoreRooms()) {
        var possibleClaimRooms = getPossibleClaimRooms();
        var controlledRooms = getControlledRooms();
        for (var room in possibleClaimRooms) {
            if (_.filter(Game.creeps, (creep) => creep.memory.role == 'scout' && creep.memory.roomToScout == possibleClaimRooms[room]).length == 0) {
                if (!controlledRooms.includes(possibleClaimRooms[room])) {
                    Array.prototype.push.apply(roomsToScout, [possibleClaimRooms[room]]);
                }

            }

        }
    }
    return roomsToScout;
}

function setClaimRoom() {
    var possibleClaimRooms = getPossibleClaimRooms();
    var goodRoom;

    if (Memory.roomsToClaim != undefined && Memory.roomsToClaim.length && !possibleClaimRooms.includes(Memory.roomsToClaim[0])) {
        Memory.roomsToClaim = [];
    }

    for (var room in possibleClaimRooms) {
        var actualRoom = Game.rooms[possibleClaimRooms[room]];
        if ((Memory.roomsToClaim == undefined || Memory.roomsToClaim.length == 0)) {
            // console.log('1-' + possibleClaimRooms[room]);
            if (actualRoom != undefined) {
                // console.log('2-' + possibleClaimRooms[room]);
                if (actualRoom.controller != undefined && actualRoom.controller.reservation == undefined) {
                    // console.log('3-' + possibleClaimRooms[room]);
                    if (actualRoom.find(FIND_SOURCES) != undefined && actualRoom.find(FIND_SOURCES).length == 2) {
                        // console.log('4-' + possibleClaimRooms[room] + ' | ' + Object.keys(Game.map.describeExits(possibleClaimRooms[room])).length);
                        if (Object.keys(Game.map.describeExits(possibleClaimRooms[room])).length >= 2) {
                            Memory.roomsToClaim = [possibleClaimRooms[room]];
                            console.log('Setting rooms to claim to: ' + possibleClaimRooms[room]);
                        }
                    }
                }
            }
        }
    }
}

function getPossibleClaimRooms() {
    var controlledRooms = getControlledRooms();
    var miningRooms = getMiningRooms();
    var possibleClaimRooms = [];

    for (var room in miningRooms) {
        var gameRoom = Game.rooms[miningRooms[room]];
        if (gameRoom != undefined) {
            var exits = Game.map.describeExits(gameRoom.name);
            for (var exit in exits) {
                if (!controlledRooms.includes(exits[exit]) && !miningRooms.includes(exits[exit])) {
                    Array.prototype.push.apply(possibleClaimRooms, [exits[exit]]);
                }

            }
        }
    }
    return possibleClaimRooms;
}

function canClaimMoreRooms() {
    return Game.gcl.level > getControlledRooms().length;
}

function getControlledRooms() {
    var controlledRooms = [];
    var controllerCount = 0;
    for (let struct in Game.structures) {
        struct = Game.getObjectById(struct);
        // console.log(JSON.stringify(struct));
        if (struct.structureType == STRUCTURE_CONTROLLER) {
            Array.prototype.push.apply(controlledRooms, [struct.room.name]);
        }
    }
    return controlledRooms;
}

function getMiningRooms() {
    var miningRooms = [];
    var controlledRooms = getControlledRooms();

    for (var room in controlledRooms) {
        if (Game.rooms[controlledRooms[room]] != undefined) {
            var exits = Game.map.describeExits(controlledRooms[room]);
            for (var exit in exits) {
                Array.prototype.push.apply(miningRooms, [exits[exit]]);
            }
        }
    }
    return miningRooms;
}

function roomsToClaim() {
    var roomsToClaim = [];
    var controlledRooms = getControlledRooms();

    for (let struct in Game.structures) {
        struct = Game.getObjectById(struct);
        // console.log(JSON.stringify(struct));
        if (struct.structureType == STRUCTURE_CONTROLLER) {
            Array.prototype.push.apply(controlledRooms, [struct.room.name]);
        }
    }
    for (let room in Memory.roomsToClaim) {
        // console.log('Found room to scout ' + Memory.roomsToClaim[room]);
        if (Game.rooms[Memory.roomsToClaim[room]] != undefined && Game.rooms[Memory.roomsToClaim[room]].find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_SPAWN }).length == 0) { //if a room is undefined you cannot 'see' it. Meaning there is no creep or building in it.
            if (_.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.roomToClaim == Memory.roomsToClaim[room]).length == 0) {
                // console.log('Found room to scout ' + Memory.roomsToClaim[room]);
                Array.prototype.push.apply(roomsToClaim, [Memory.roomsToClaim[room]]);
            }
        }
    }
    // console.log('roomsToClaim: ' + roomsToClaim.length);
    return roomsToClaim;
}

function roomsToReserve() {
    var roomsToReserve = [];
    for (let room in Memory.roomsToHarvest) {
        // console.log('Found room to scout ' + Memory.roomsToHarvest[room]);
        if (Game.rooms[Memory.roomsToHarvest[room]] == undefined || _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.roomToReserve == Memory.roomsToHarvest[room]).length < 1) { //if a room is undefined you cannot 'see' it. Meaning there is no creep or building in it.
            // console.log('Found room to scout ' + Memory.roomsToHarvest[room]);
            Array.prototype.push.apply(roomsToReserve, [Memory.roomsToHarvest[room]]);
        }
    }
    return roomsToReserve;
}

function getMostImportantStructureToBuild() {
    for (let room in Game.rooms) {
        let importantStructs = Game.rooms[room].find(FIND_CONSTRUCTION_SITES, { filter: (i) => i.structureType == STRUCTURE_SPAWN });
        // console.log('importantStructs ' + importantStructs[0]);
        if (importantStructs.length > 0) {
            return importantStructs[0];
        }
    }
}

function getMostDamagedStructure(roomName) {
    var damagedStructures = Game.rooms[roomName].find(FIND_STRUCTURES, { filter: (i) => i.hits != i.hitsMax });
    if (damagedStructures.length > 0) {
        var mostDamagedStructure = damagedStructures[0];
        for (let struct in damagedStructures) {
            if (damagedStructures[struct].hits < mostDamagedStructure.hits || (damagedStructures[struct].structureType == STRUCTURE_CONTAINER && damagedStructures[struct].hits <= 5000)) {
                mostDamagedStructure = damagedStructures[struct];
            }
        }
        return mostDamagedStructure;
    }
    return;
}

function getSurroundingSources(roomName) {
    if (Game.rooms[roomName] == undefined) {
        console.log(roomName + ' is not defined');
        return;
    }
    var sources = _.values(_.mapValues(Game.rooms[roomName].find(FIND_SOURCES), 'id'));
    var roomList = Game.map.describeExits(roomName);
    for (let room in roomList) {
        if (Game.rooms[roomList[room]] != undefined) {
            var newSources = _.values(_.mapValues(Game.rooms[roomList[room]].find(FIND_SOURCES), 'id'));
            sources = sources.concat(newSources);
        }
    }
    return sources;
}

function getSurroundingSourcesWithoutHarvesters(roomName) {
    var sourcesWithoutHarvesters = [];
    var roomsToCheck = _.values(Game.map.describeExits(roomName));
    Array.prototype.push.apply(roomsToCheck, [roomName]);

    for (var source in Memory.sources) {
        if (roomsToCheck.includes(Memory.sources[source].room.name)) {
            if (_.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.sourceID != undefined && creep.memory.sourceID == Memory.sources[source].id).length == 0) {
                Array.prototype.push.apply(sourcesWithoutHarvesters, [Memory.sources[source].id]);
            }
        }
    }

    return sourcesWithoutHarvesters;
}

function getContructionSpawns(maxBuilders) {
    maxBuilders = maxBuilders == undefined ? 1 : maxBuilders;
    // console.log(maxBuilders);
    var returnSpawns = [];
    for (var room in Game.rooms) {
        var spawns = Game.rooms[room].find(FIND_CONSTRUCTION_SITES, { filter: (struct) => struct.structureType == STRUCTURE_SPAWN });
        if (spawns.length && _.filter(Game.creeps, (creep) => creep.memory.role == 'spawnBuilder' && creep.memory.spawn.room.name == room).length < maxBuilders) {
            Array.prototype.push.apply(returnSpawns, spawns);
        }
    }
    return returnSpawns;
}

module.exports = {
    garbageCollection: garbageCollection,
    getContructionSpawns: getContructionSpawns,
    getSurroundingSourcesWithoutHarvesters: getSurroundingSourcesWithoutHarvesters,
    getControlledRooms: getControlledRooms,
    getMiningRooms: getMiningRooms,
    isEnergyStorageFull: isEnergyStorageFull,
    calculateCosts: calculateCosts,
    bodyToString: bodyToString,
    roomsToScout: roomsToScout,
    roomsToClaim: roomsToClaim,
    roomsToReserve: roomsToReserve,
    getMostImportantStructureToBuild: getMostImportantStructureToBuild,
    getMostDamagedStructure: getMostDamagedStructure,
    setClaimRoom: setClaimRoom,
    canClaimMoreRooms: canClaimMoreRooms,
    getSurroundingSources: getSurroundingSources
};