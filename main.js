import Util from 'Util';
import CustomRoom from 'Room';

//Main Game Loop
export function loop() {
    Util.garbageCollection(); //ALWAYS PERFORM THIS TASK TO PREVENT MEMORY LEAKS

    for(let roomName in Game.rooms){
        if('bucket' in Game.cpu || Game.cpu.bucket > 1000){ //If you have gone over you cpu limit you need to cool off bro ~.~

            Memory.map = Game.map.describeExits(Game.rooms[roomName].name); //store connected rooms in memory - this is not used and needs to be rewritten

            //This chunk is really only for logging and can be turned on or off, meh
            // var repairCount = Game.rooms[roomName].find(FIND_STRUCTURES, {filter: (i) => i.hits / i.hitsMax < 0.50}).length;
            // if(Memory.repairCount != repairCount){
            //     console.log('We have ' + repairCount + ' structures to repair.');
            //     Memory.repairCount = repairCount;
            // }


            //Here's the real logic bit. Let's have some fun.
            let room = new CustomRoom(Game.rooms[roomName]);
        }
    }
}