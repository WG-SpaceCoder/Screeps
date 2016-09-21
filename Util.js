//Just some useful methods that don't have a better home

//Simply removes dead creeps from memory
function garbageCollection() {
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            console.log('Clearing non-existing creep memory:', name, Memory.creeps[name].role);
            delete Memory.creeps[name];
        }
    }
}

//Given a structure that can hold energy, returns boolean if energy storage is full
function isEnergyStorageFull(storage) {
    if ('storeCapacity' in storage) {
        // console.log('Has storage capacity');
        return storage.storeCapacity - storage.store[RESOURCE_ENERGY] == 0;
    } else {
        return storage.energyCapacity - storage.energy == 0;
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

function roomsToScout() {
    var roomsToScout = [];
    for (let room in Memory.roomsToHarvest) {
        // console.log('Found room to scout ' + Memory.roomsToHarvest[room]);
        if (_.filter(Game.creeps, (creep) => creep.memory.role == 'scout' && creep.memory.roomToScout == Memory.roomsToHarvest[room]).length == 0) { //if a room is undefined you cannot 'see' it. Meaning there is no creep or building in it.
            console.log('Found room to scout ' + '\'' + Memory.roomsToHarvest[room] + '\', ' + _.filter(Game.creeps, (creep) => creep.memory.role == 'scout' && creep.memory.roomToScout == Memory.roomsToHarvest[room]));
            Array.prototype.push.apply(roomsToScout, [Memory.roomsToHarvest[room]]);
        }
    }
    return roomsToScout;
}

function roomsToClaim() {
    var roomsToClaim = [];
    for (let room in Memory.roomsToClaim) {
        // console.log('Found room to scout ' + Memory.roomsToClaim[room]);
        if (Game.rooms[Memory.roomsToClaim[room]] != undefined && Game.rooms[Memory.roomsToClaim[room]].find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_SPAWN }).length == 0) { //if a room is undefined you cannot 'see' it. Meaning there is no creep or building in it.
            if (_.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.roomToClaim == Memory.roomsToClaim[room]).length == 0) {
                // console.log('Found room to scout ' + Memory.roomsToClaim[room]);
                Array.prototype.push.apply(roomsToClaim, [Memory.roomsToClaim[room]]);
            }
        }
    }
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

module.exports = {
    garbageCollection: garbageCollection,
    isEnergyStorageFull: isEnergyStorageFull,
    calculateCosts: calculateCosts,
    bodyToString: bodyToString,
    roomsToScout: roomsToScout,
    roomsToClaim: roomsToClaim,
    roomsToReserve: roomsToReserve,
    getMostImportantStructureToBuild: getMostImportantStructureToBuild,
    getMostDamagedStructure: getMostDamagedStructure
};