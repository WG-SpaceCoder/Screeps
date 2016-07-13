import Util from 'Util';
import CustomRoom from 'Room';
 

//Main Game Loop
export function loop() {
    Util.garbageCollection();
    for(let roomName in Game.rooms){
        let room = new CustomRoom(Game.rooms[roomName]);
    }
}