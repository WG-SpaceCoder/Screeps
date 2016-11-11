import CustomCreep from 'Creep';
import Util from 'Util';

export default class ScoutCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // console.log('We got a new creep ' + this.name);

        if (this.flee()) {
            return;
        }

        if (!this.memory.done) {
            this.work();
        }

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
        var newPos = new RoomPosition(25, 25, roomToScout);
        if ([newPos.x, newPos.y, newPos.room] == [this.pos.x, this.pos.y, this.pos.room]) {
            console.log('Look at that! ' + this.name + ', scout, made it to 25, 25, in the right room.');
        }
        var moveCode = this.creepMove(newPos);
        if (moveCode == ERR_NO_PATH && this.room.name == roomToScout) {
            console.log(this.name + ' moveCode: ' + moveCode);
            this.memory.done = true;
        }


    }
}