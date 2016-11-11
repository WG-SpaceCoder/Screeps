import CustomCreep from 'Creep';
import Util from 'Util';

export default class HarvesterCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // console.log('We got a new creep ' + this.name);
        // console.log('test');
        // this.work();

        if (this.flee()) {
            return;
        }

        this.setContainer();
        this.work();
    }

    // work() {
    //     if (!this.harvestWork()) {
    //         this.buildWork()
    //     }
    // }

    work() {
        var say = false;
        if (this.memory.container != undefined) {
            var actualContainer = Game.getObjectById(this.memory.container.id);
            var actualSource = Game.getObjectById(this.memory.sourceID);
            if (actualContainer != undefined) {
                var move = this.creepMove(actualContainer);
                if (move == ERR_NO_PATH) {
                    this.memory.sourceID = Util.getSurroundingSourcesWithoutHarvesters(this.memory.spawnRoom)[0];
                    console.log(this.name + ' restting sourceID to ' + this.memory.sourceID);
                }
                var harvest = this.harvest(actualSource);
                if (harvest != OK) {
                    if (say) { this.say('harv:' + harvest); }
                    return;
                }
                // console.log(Object.keys(actualContainer));
                if (!Object.keys(actualContainer).includes('_store')) {
                    this.build(actualContainer);
                    if (say) { this.say('building'); }
                } else {
                    // console.log(this.name + ' repair ' + this.repair(actualContainer));
                    if (actualContainer.hits < actualContainer.hitsMax) {
                        var repair = this.repair(actualContainer);
                        if (repair != OK) {
                            if (say) { this.say('repair: ' + repair); }
                        }
                    } else {
                        this.drop(RESOURCE_ENERGY);
                        if (say) { this.say('dropping'); }
                    }
                }
            } else {
                this.creepMove(new RoomPosition(this.memory.container.x, this.memory.container.y, this.memory.container.room));
            }
        }
    }

    setContainer() {
        // console.log(this.name + ' setting container');
        if (this.memory.sourceID != undefined && this.memory.sourceID.length) {
            // console.log(this.name + ' setting container1');
            for (var source in Memory.sources) {
                if (this.memory.sourceID == Memory.sources[source].id) {
                    this.memory.container = Memory.sources[source].container;
                    var pos = new RoomPosition(this.memory.container.x, this.memory.container.y, this.memory.container.room);
                    if (Game.rooms[pos.roomName] != undefined) {
                        var structures = pos.lookFor(LOOK_STRUCTURES);
                        for (var struct in structures) {
                            if (structures[struct].structureType == STRUCTURE_CONTAINER) {
                                this.memory.container.id = structures[struct].id;
                                // console.log('setting container2');
                            }
                        }
                        var structures = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                        // console.log('structures.length: ' + structures.length);
                        for (var struct in structures) {
                            if (structures[struct].structureType == STRUCTURE_CONTAINER) {
                                this.memory.container.id = structures[struct].id;
                                // console.log('setting container2');
                            }
                        }
                    } else {
                        this.creepMove(pos);
                    }
                }
            }
        }
    }
}