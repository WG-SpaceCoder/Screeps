import CustomCreep from 'Creep';

export default class BuilderCreep extends CustomCreep{
	constructor(creep){
        super(creep);
        // console.log('We got a new creep ' + this.name);
        this.work();
    }

    work(){
    	this.buildWork();
    }
}