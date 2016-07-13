import CustomCreep from 'Creep';
import Util from 'Util';

export default class HarvesterCreep extends CustomCreep{
	constructor(creep){
        super(creep);
        // console.log('We got a new creep ' + this.name);
        // console.log('test');
        this.work();
    }

    work(){
		if(!this.harvestWork()){
            this.buildWork()
        }
    }
}