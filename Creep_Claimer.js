import CustomCreep from 'Creep';
import Util from 'Util';

export default class ClaimerCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work() {
        if (!('roomToClaim' in this.memory)) {
            this.memory.roomToClaim = '';
        }
        if (!('roomToReserve' in this.memory)) {
            this.memory.roomToReserve = '';
        }

        var roomToClaim = Util.roomsToClaim();
        if (roomToClaim.length > 0) {
            // console.log('setting roomsToClaim to ' + roomToClaim[0]);
            this.memory.roomToClaim = roomToClaim[0];
        }
        if (this.memory.roomToClaim != '') {
            if (this.room.name != this.memory.roomToClaim) {
                // console.log('setting2 roomsToClaim to ' + roomToReserve[0]);
                this.creepMove(new RoomPosition(25, 25, this.memory.roomToClaim));
            } else {
                if (this.claimController(this.room.controller) == ERR_NOT_IN_RANGE) {
                    this.creepMove(this.room.controller);
                }
            }
            return;
        }
        if (this.memory.roomToReserve == '' || this.memory.roomToReserve == undefined) {
            var roomToReserve = Util.roomsToReserve();
            if (roomToReserve.length > 0) {
                // console.log('setting roomsToReserve to ' + roomToReserve[0] + ' for creep ' + this.name);
                this.memory.roomToReserve = roomToReserve[0];
            }
        }
        if (this.memory.roomToReserve != '') {
            if (this.room.name != this.memory.roomToReserve) {
                // console.log('setting2 roomsToReserve to ' + this.memory.roomToReserve);
                this.creepMove(new RoomPosition(25, 25, this.memory.roomToReserve));
            } else {
                if (this.reserveController(this.room.controller) == ERR_NOT_IN_RANGE) {
                    this.creepMove(this.room.controller);
                }
            }
            return;
        }


    }
}