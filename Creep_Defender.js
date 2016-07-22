import CustomCreep from 'Creep';
import Util from 'Util';

export default class DefenderCreep extends CustomCreep{
	constructor(creep){
        super(creep);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work(){
        var closestHostile = this.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        // console.log('closestHostile: ' + closestHostile);

        if(this.memory.state == 'gathering'){
            if(this.carry.energy < this.carryCapacity){
                // console.log('Defender ' + this.name + ' needs to withdrawEnergyFromClosestStorage');
                this.withdrawEnergyFromClosestStorage();
            } else {
                this.memory.state = 'working';
            }
        } else if(this.memory.state == 'working'){
            if (this.carry.energy > 0){
                // console.log('closestHostile: ' + closestHostile);
                if(closestHostile == null){
                    this.moveInRandomDirection();
                }
                else if(this.generalAttack(closestHostile) == ERR_NOT_IN_RANGE){
                    this.creepMove(closestHostile);
                }
            } else {
                this.memory.state = 'gathering';
            }
        } else{
            this.memory.state = 'gathering';
        }
        return true;


    }
}