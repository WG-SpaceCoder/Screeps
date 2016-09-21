import CustomCreep from 'Creep';
import Util from 'Util';

export default class MinerCreep extends CustomCreep {
    constructor(creep) {
        super(creep);
        // return;
        // console.log('We got a new creep ' + this.name);

        this.setSource();
        this.setContainer();
        this.work();
    }

    setContainer() {
        // console.log('container.length ' + this.memory.source);
        // return;
        if (this.memory.source == null) {
            // console.log('source is null for ' + this.name);
            return;
        }
        if (!('container' in this.memory) || 'progress' in this.memory.container) {
            // console.log(this.name + ' looking for container for source ' + this.memory.source.id + ' | ' + Memory.sources.filter((i) => ('container' in i) && i.id == this.memory.source.id));
            try {
                var tmpContainer = Memory.sources.filter((i) => ('container' in i) && i.id == this.memory.source.id)[0].container;
            } catch (err) {
                // console.log(this.name + ' miner did not find a container for source ' + this.memory.source.id);
                this.memory.source = undefined;
                return;
            }
            // console.log('tmp container ' + Object.keys(tmpContainer) + ' and sourceID ' + this.memory.source.id);
            // console.log('tmp container values:', tmpContainer.x, tmpContainer.y, tmpContainer.room);
            // console.log('Miner ' + this.name + ' is set to container at ' + this.memory.container.x + ',' + this.memory.container.y);
            // console.log('testing to see if we can see the assigned room for miner');
            if (Game.rooms[this.memory.source.room.name] == undefined) { //this means we cant see the room
                console.log(this.name + ' (miner) cannot see ' + this.memory.source.room.name + '. Pathing anyways.');
                this.creepMove(new RoomPosition(25, 25, this.memory.source.room.name));
                return;
            }
            var tmp = Game.rooms[this.memory.source.room.name].find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == tmpContainer.x && i.pos.y == tmpContainer.y });
            Array.prototype.push.apply(tmp, Game.rooms[this.memory.source.room.name].find(FIND_CONSTRUCTION_SITES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == tmpContainer.x && i.pos.y == tmpContainer.y }));
            // console.log('TMP ' + tmp);
            if (tmp.length > 0) {
                this.memory.container = tmp[0];
            } else {
                console.log('I guess we didn\'t find a container?');
                for (let room in Game.rooms) {
                    var tmp = this.room.find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == tmpContainer.x && i.pos.y == tmpContainer.y });
                    Array.prototype.push.apply(tmp, this.room.find(FIND_CONSTRUCTION_SITES, { filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == tmpContainer.x && i.pos.y == tmpContainer.y }));
                    if (tmp.length > 0) {
                        this.memory.container = tmp[0];
                    } else {
                        console.log('We did not find a container at', tmpContainer.x, tmpContainer.y, tmpContainer.room);
                        for (let source in Memory.sources) {
                            if (Memory.sources[source].id == this.memory.source.id) {
                                Memory.sources[source] = undefined;
                                this.memory.source = undefined;
                            }
                        }
                    }
                }
            }
        } else {
            // console.log(this.name + ' has container id ' + this.memory.container);
        }

    }

    setSource() {
        // console.log('Getting source');
        var sources = this.getClaimedSources();
        // console.log('Found sources: ' + sources);
        if (!('source' in this.memory) || this.memory.source == undefined) { //If there is no source record we need to set one
            // console.log('Need to get a new source!');
            var tmpSrcs = this.room.find(FIND_SOURCES, { filter: (i) => sources.toString().indexOf(i.id) == -1 });
            if (tmpSrcs.length > 0 && (Memory.roomsToHarvest.join(',').indexOf(this.room.name) != -1 || (this.room.controller != undefined && this.room.controller.my))) {
                this.memory.source = tmpSrcs[0];
                // console.log('1Setting source of ' + this.name + ' to ' + this.memory.source + ' in room ' + tmpSrcs[0].room.name);
                return;
            }
            for (let roomName in Game.rooms) {
                if (Memory.roomsToHarvest.join(',').indexOf(roomName) != -1 || (Game.rooms[roomName].controller != undefined && Game.rooms[roomName].controller.my)) {
                    // console.log('before controller1');
                    tmpSrcs = Game.rooms[roomName].find(FIND_SOURCES, { filter: (i) => sources.toString().indexOf(i.id) == -1 });
                    if (tmpSrcs.length > 0 && (Game.rooms[roomName].controller == undefined || Game.rooms[roomName].controller.owner == undefined || Game.rooms[roomName].controller.my)) {
                        this.memory.source = tmpSrcs[0];
                        // console.log('2Setting source of ' + this.name + ' to ' + this.memory.source + ' in room ' + tmpSrcs[0].room.name);
                        return;
                    }
                }
            }
        } else if (this.memory.source.length <= 1) {
            this.memory.source = undefined;
        }
    }

    getContainer() {
        try {
            return Game.getObjectById(this.memory.container.id);
        } catch (err) {
            if ('container' in this.memory) {
                this.memory.container = undefined;
            }
            return;
        }
    }

    getSource() {
        return Game.getObjectById(this.memory.source.id);
    }

    work() {
        var container = this.getContainer();
        if (container == null) {
            // console.log('Container is ' + container + ' for ' + this.name);
            this.memory.container = undefined;
            // console.log('Container is ' + this.memory.container + ' for ' + this.name);
            return;
        }
        var source = this.getSource();
        // this.setState();
        if ('progress' in container) { //this is not built yet
            this.creepMove(container);
            this.harvest(source);
            this.build(container);
        } else {
            this.harvest(source);
            this.creepMove(container);
            if (container.hits != container.hitsMax) {
                this.repair(container)
            } else {
                if (this.transfer(container, RESOURCE_ENERGY) == ERR_FULL) {
                    this.say('full');
                    this.drop(RESOURCE_ENERGY);
                    // console.log(this.name + ' dropped: ' + this.drop(RESOURCE_ENERGY));
                }

            }
        }
    }
}