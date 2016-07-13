//Just some useful methods that don't have a better home


function garbageCollection() {
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
}

function isEnergyStorageFull(storage){
    if('storeCapacity' in storage){
        // console.log('Has storage capacity');
        return storage.storeCapacity - storage.store[RESOURCE_ENERGY] == 0;
    } else{
        return storage.energyCapacity - storage.energy == 0;
    }
}

function calculateCosts(bodyParts){
    let cost = 0;
    bodyParts.forEach((bodyPart) => {
      const part = typeof bodyPart === 'string' ? bodyPart : bodyPart.type;
      cost += BODYPART_COST[part];
    });

    return cost;
}

module.exports = {
    garbageCollection: garbageCollection,
    isEnergyStorageFull: isEnergyStorageFull,
    calculateCosts: calculateCosts
};