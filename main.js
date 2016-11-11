import Util from 'Util';
import GameMaster from 'GameMaster';


//Main Game Loop
export function loop() {
    Util.garbageCollection(); //ALWAYS PERFORM THIS TASK TO PREVENT MEMORY LEAKS

    if (!('bucket' in Game.cpu) || Game.cpu.bucket > 1000) {
        let gameMaster = new GameMaster();
    } else {
        // console.log('Game.cpu.bucket:', Game.cpu.bucket);
        let gameMaster = new GameMaster();
    }
}