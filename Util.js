//Just some useful methods that don't have a better home

//Simply removes dead creeps from memory
function garbageCollection() {
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
}

//Given a structure that can hold energy, returns boolean if energy storage is full
function isEnergyStorageFull(storage){
    if('storeCapacity' in storage){
        // console.log('Has storage capacity');
        return storage.storeCapacity - storage.store[RESOURCE_ENERGY] == 0;
    } else{
        return storage.energyCapacity - storage.energy == 0;
    }
}


//Given an array of body parts returns boolean of if the room spawner can afford it
function calculateCosts(bodyParts){
    let cost = 0;
    bodyParts.forEach((bodyPart) => {
      const part = typeof bodyPart === 'string' ? bodyPart : bodyPart.type;
      cost += BODYPART_COST[part];
    });

    return cost;
}

//Returns a 'nicely' formated easier for a human to read body. Without this body text can get really really long
//IE returns 3work 3carry 3move instead of work,work,work,carry,carry,move,move,move
function bodyToString(body){
    var tmp = {};
    var tmpStr = '';
    body.forEach(function(i) {tmp[i] = (tmp[i]||0)+1;});
    _.each(tmp, function(key, value) {
        tmpStr += value + key + ' ';
    });
    return tmpStr;

}

module.exports = {
    garbageCollection: garbageCollection,
    isEnergyStorageFull: isEnergyStorageFull,
    calculateCosts: calculateCosts,
    bodyToString: bodyToString
};