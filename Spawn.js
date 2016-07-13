import Util from 'Util';
import {Spawn} from 'screeps-globals';


export default class CustomSpawn extends Spawn {
    constructor(spawn){
        super(spawn);
        this.roleList = ['harvester', 'builder', 'upgrader'];
        this.roleAmount = [5, 1, 1];
        this.work();
    }

     work(){
        if(this.spawning == null){
            for (var role in this.roleList){
                var roleCount = _.filter(Game.creeps, (creep) => creep.memory.role == this.roleList[role]).length;
                // console.log('roleCount' + roleCount);
                if(this.spawning == null && roleCount < this.roleAmount[role]){
                    if(this.createWorkerCreep(this.roleList[role], [CARRY, WORK, MOVE, CARRY, WORK], 3)){
                        return;
                    }
                }
            }
        }
    }

     createWorkerCreep(role, bodyList, min){
        // console.log('Attempting to create creep');
        var body = [];
        var i = 0;
        while (this.room.energyAvailable > Util.calculateCosts(body)){
            if(i > bodyList.length - 1){
                i = 0;
                // console.log('i: ', i);
            }
            body.push(bodyList[i]);
            // console.log('Attempting new ', role, ' with body ', body, ' can create ', this.canCreateCreep(body));
            i+=1;
        }
        body.pop();
        if(body.length >= min){
            // console.log('Attempting final ', role, ' with body ', body, ' can create ', this.canCreateCreep(body));
            var newName = this.createCreep(body, undefined, {role: role});
            if(newName){
                console.log('Spawning new ' + role + ' with body ' + body + ' named ' + newName);
                return true;
            } else {
                // console.log('Failed to spawn ' + role + ': ' + newName);
                return false;
            }
        }
    }
}
