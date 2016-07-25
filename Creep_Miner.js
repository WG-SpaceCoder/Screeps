import CustomCreep from 'Creep';
import Util from 'Util';

export default class MinerCreep extends CustomCreep{
    constructor(creep){
        super(creep);
        // return;
        // console.log('We got a new creep ' + this.name);

        this.setSource();
        this.setContainer();
        this.work();
    }

    setContainer(){
        // console.log('container.length ' + this.memory.source);
        // return;
        if(!('container' in this.memory) || 'progress' in this.memory.container){
            // console.log(this.name + ' looking for container for source ' + this.source.id + ' | ' + Memory.sources.filter((i) => 'container' in i && i.id == this.source.id));
            this.container = Memory.sources.filter((i) => 'container' in i && i.id == this.source.id)[0].container;
            // console.log('Miner ' + this.name + ' is set to container at ' + this.container.x + ',' + this.container.y);
            var tmp = this.room.find(FIND_STRUCTURES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == this.container.x && i.pos.y == this.container.y});
            if(tmp.length == 0){
                this.container = this.room.find(FIND_CONSTRUCTION_SITES, {filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.pos.x == this.container.x && i.pos.y == this.container.y})[0];
            } else {
                this.container = tmp[0];
            }
            this.memory.container = this.container;
        } else{
            this.container = this.memory.container;
        }

    }

    setSource(){
        // console.log('Getting source');
        var sources = this.getClaimedSources();
        // console.log('Found sources: ' + sources);
        if(!('source' in this.memory) || this.memory.source == undefined){ //If there is no source record we need to set one
            // console.log('Need to get a new source!');
            this.memory.source = this.room.find(FIND_SOURCES, {filter: (i) => sources.toString().indexOf(i.id) == -1 })[0];
            console.log('Setting source of ' + this.name + ' to ' + this.memory.source);
        }
        this.source = this.memory.source
    }

    getContainer(){
        return Game.getObjectById(this.container.id);
    }

    getSource(){
        return Game.getObjectById(this.source.id);
    }

    work(){
        var container = this.getContainer();
        var source = this.getSource();
        if('progress' in container){ //this is not built yet
            if(this.harvest(source) == ERR_NOT_IN_RANGE){
                this.creepMove(container);
            }
            this.build(container);
        } else{
            if(this.harvest(source) == ERR_NOT_IN_RANGE){
                this.creepMove(container);
            }
            if(container.hits != container.hitsMax){
                this.repair(container)
            } else{
                this.transfer(container, RESOURCE_ENERGY);
                this.drop(RESOURCE_ENERGY);
            }
        }
    }
}