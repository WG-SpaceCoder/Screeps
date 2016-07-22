import Util from 'Util';
import CustomRoom from 'Room';

//Main Game Loop
export function loop() {
    Util.garbageCollection();
    // console.log('Game Time: ' + Game.time);
    // console.log('Real Time: ' + new Date().getTime());

    for(let roomName in Game.rooms){
        if('bucket' in Game.cpu || Game.cpu.bucket > 1000){
            Memory.map = Game.map.describeExits(Game.rooms[roomName].name);
            var repairCount = Game.rooms[roomName].find(FIND_STRUCTURES, {filter: (i) => i.hits / i.hitsMax < 0.75}).length;
            if(Memory.repairCount != repairCount){
                console.log('We have ' + repairCount + ' structures to repair.');
                Memory.repairCount = repairCount;
            }
            let room = new CustomRoom(Game.rooms[roomName]);
        }
    }
}