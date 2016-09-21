import CustomCreep from 'Creep';
import Util from 'Util';

export default class ScoutCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work() {
        var roomToScout = '';
        if ('roomToScout' in this.memory) {
            roomToScout = this.memory.roomToScout;
        }
        if (roomToScout == '') {
            // console.log(this.name + ' scouting');
            var roomsToScout = Util.roomsToScout();
            if (roomsToScout.length > 0) {
                roomToScout = roomsToScout[0];
                this.memory.roomToScout = roomToScout;
            }
        }
        this.say(roomToScout);
        this.creepMove(new RoomPosition(25, 25, roomToScout));
    }
}