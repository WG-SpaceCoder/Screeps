import CustomCreep from 'Creep';

export default class BuilderCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // console.log('We got a builder creep ' + this.name);
        this.work();
    }

    work() {
        this.setState();

        // console.log(this.name + ' SpawnBuilder: ' + this.memory.spawn.room.name);

        if (this.room.name == this.memory.spawn.room.name) {
            if (this.memory.state == 'gathering') {
                this.harvestEnergy();
            } else {
                var spawn = Game.getObjectById(this.memory.spawn.id);
                this.creepMove(spawn, { range: 3 });
                this.build(spawn);
            }
        } else {
            this.creepMove(new RoomPosition(25, 25, this.memory.spawn.room.name));
        }

        // if (!('spawnRoom' in this.memory) || this.memory.spawnRoom == '') {
        //     this.memory.spawnRoom = this.room.name;
        // }

        // var carrierCount = _.filter(Game.creeps, (creep) => creep.memory.role == 'carrier').length;

        // // if (carrierCount == 0) {
        // //     this.memory.role = 'carrier';
        // // }

        // // this.say('builder');
        // if (this.memory.state == 'gathering') {
        //     this.withdrawEnergyFromClosestStorage();
        // } else {
        //     if (Game.rooms[this.memory.spawnRoom].controller.ticksToDowngrade < 1000) {
        //         // console.log(this.name + ' really needs to upgrade something');
        //         if (this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
        //             this.creepMove(this.room.controller);
        //         }
        //     } else {
        //         if (this.tryToConstruct(this.room.name)) {
        //             // console.log(this.name + ' is going to build in his home room');
        //             return;
        //         } else {
        //             for (let roomName in Game.rooms) {
        //                 if (this.tryToConstruct(roomName)) {
        //                     // console.log(this.name + ' is going to build in a remote room ' + roomName);
        //                     return;
        //                 }
        //             }
        //             // console.log(this.name + ' needs to upgrade something');
        //             if (this.upgradeController(Game.rooms[this.memory.spawnRoom].controller) == ERR_NOT_IN_RANGE) {
        //                 this.creepMove(Game.rooms[this.memory.spawnRoom].controller);
        //             }
        //         }
        // if (!this.tryToConstruct()) {
        //     this.upgradeWork();
        // }
    }
}