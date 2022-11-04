/*
window.onload = function init(){
	const canvas = document.getElementById( "gl-canvas" );
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	renderer = new THREE.WebGLRenderer({canvas});
	renderer.setSize(canvas.width,canvas.height);

	camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.1, 1000);
    
    Game = new Game(canvas,camera,renderer);

    Game.loadSquare();
    //Game.loadPentagon();
    //Game.loadTriangle();

    Game.animate();
}
*/

//Encapsulated game logic class
class Game{

	//Receive Camera, and Render used in existing programs as parameters
    constructor(camera,renderer){
        //Store the augments inside the class
        this._camera = camera;
        this._renderer = renderer;

        //Scene is declared separately inside the class to avoid touching the scene used outside
        const scene = new THREE.Scene();
        this._scene = scene;
        this._scene.background = new THREE.Color(0x000000);
        this.loader = new THREE.GLTFLoader();

        window.onresize = this.resize.bind(this);

        this.controls = new THREE.OrbitControls(this._camera, this._renderer.domElement );
        this.controls.update();

	    this.hlight = new THREE.AmbientLight (0x404040,10);

        //Variables
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        this.onClick = this.onClick.bind(this);
        this.onMove = this.onMove.bind(this);

        this.frameId;
        this.mainShapeObject;

        this.particleObject = [];
        this.objectId = [];

        //The animationObject stores the object for which the animation should occur
        //The animationDestinationVector stores the vector where the animationObject should finally arrive
        //The animationMovingVector stores vectors that need to be added to the animationObject to reach the animationDestinationVector
        //The animationParticle stores the copied particles near the coordinates where the animationObject is clicked
        this.animationObject = [];
        this.animationDestinationVector = [];
        this.animationMovingVector = [];
        this.animationParticle = [];

        this.alreadyIn = false;

        //Variable that allow external confirmation that this game is over
        this.ended = false;
        
        //Basic Preparation
        this.loadParticle();
        this.setupBackground();
    }

    //Functions that load dalgona
    loadSquare(){
        for(var i=1; i<10; i++){
            var url = '../Graphic/model/sugarRec*.gltf'
            if(i==9)this.loadPiece(url.replace('*',String(9)),true);
            else this.loadPiece(url.replace('*',String(i))),false;
        }
    }

    loadTriangle(){
        for(var i=1; i<5; i++){
            var url = '../Graphic/model/sugarTri*.gltf'
            if(i==4)this.loadPiece(url.replace('*',String(4)),true);
            else this.loadPiece(url.replace('*',String(i)),false);
        }
    }
    
    loadPentagon(){
        for(var i=1; i<7; i++){
            var url = '../Graphic/model/sugarpoly*.gltf'
            if(i==6)this.loadPiece(url.replace('*',String(6)),true);
            else this.loadPiece(url.replace('*',String(i)),false);
        }
    }

    //Particle, a function that pre-loads effects when clicked
    loadParticle(){
        for(var i=0; i<10; i++){
            var url = '../Graphic/model/sugarRec1.gltf'
                this.loader.load((url), (gltf)=>{
                    var object = gltf.scene.children[0];
                    object.scale.set(3,3,3);
                    object.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
                    object.visible = false;
                    this._scene.add(gltf.scene);
                    this.particleObject.push(object);
                },  undefined, function (error) {
                    console.log(error);
            });
        }
    }
    
    //A function that effectively loads pieces of the model
    //The path of the model to be loaded, and whether this model is MainShape or boolean value is received
    //After loading, save the objectId of the loaded model and save the object in the mainShapeObject if isMainShape is true.
    loadPiece(url, isMainShape){
        this.loader.load(url, (gltf)=>{
            gltf.scene.children[0].scale.set(10,10,10);
            this._scene.add(gltf.scene);
            this.objectId.push(gltf.scene.children[0].id);
            if(isMainShape)this.mainShapeObject = gltf.scene.children[0];
        },  undefined, function (error) {
            console.log(error);
        });
    }

    //Functions for click events
    //If the clicked object is a Dalgona piece rather than a mainShapeObject, save the object in the animationObject to be the target of the animation functions
    //And in that process, the various vectors required for animation are also calculated and stored
    onClick() {
        event.preventDefault();
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this._camera);
        var intersects = this.raycaster.intersectObjects(this._scene.children, true);

        if (intersects.length > 0) {
            var clickedPosition = new THREE.Vector3(intersects[0].point.x,intersects[0].point.y,intersects[0].point.z);
            var cameraPosition = new THREE.Vector3(this._camera.position.x,this._camera.position.y,this._camera.position.z);
    
            //In order to make the clicked Dalgona piece fly in the direction we're looking at, we calculate the vector of the direction to move by calculating the camera vector and click position vector
            var vectorToMove = clickedPosition.clone().sub(cameraPosition).normalize().multiplyScalar(20);
            var objectToMove = intersects[0].object;
    
            //If it is already in the animation object, change readyIn to true and enter the animation object again to prevent the animation from running several times
            this.animationObject.forEach((object) =>{if(objectToMove.id == object.id)this.alreadyIn = true;});
            if(!this.alreadyIn && !(objectToMove.id == this.mainShapeObject.id)){
                this.prepareParticle(clickedPosition);
                this.animationObject.push(objectToMove);
                this.animationDestinationVector.push(objectToMove.clone().position.add(vectorToMove.clone().normalize()).add(vectorToMove).ceil());
                this.animationMovingVector.push(vectorToMove.normalize());
            }
            this.alreadyIn = false;
        }

        //If a click event occurred when finalAnimation was running, call exit and change the ended to true to notify the outside
        if(this.objectId.length == 1){
            this.exit();
            document.getElementById('modal').style.visibility = 'hidden';
        }
    }

    //Functions for hover events
    //If an object is detected using raycaster, make only the Dalgona pieces translucent, not the mainShapeObject
    //It also makes the pieces that the mouse is not pointing opaque again
    onMove() {
        event.preventDefault();
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this._camera);
        var intersects = this.raycaster.intersectObjects(this._scene.children, true);

        this._scene.traverse((object)=>{
            if(object.isMesh && this.objectId.includes(object.id))object.material.opacity = 1;
        });

        if (intersects.length > 0 && intersects[0].object.id != this.mainShapeObject.id && this.objectId.includes(intersects[0].object.id)) {
            intersects[0].object.material.transparent = true;
            intersects[0].object.material.format = THREE.RGBAFormat
            intersects[0].object.material.opacity = 0.5;
        }
    }

    //Almost all animation functions below this are executed by navigating through the animationObject array
    //So your mouse click is so fast that even if you click several pieces at a very short interval, they'll all run in parallel
    //Also, the object in the animation object deletes only when the moveAnimation below is finished, so all animations are repeated until the end of the moveAnimation

    //Move the animationObject toward the animationMovingVector until it reaches the animationDestinationVector.
    //If it arrives, erase all animation data related to the object
    moveAnimation() {
        this.animationObject.forEach((object,index) =>{
            if (!this.animationDestinationVector[index].equals(object.clone().position.ceil())) {
                object.position.add(this.animationMovingVector[index]);
            }else{
                this.animationObject[index].visible=false;
                this.objectId = this.objectId.filter((element) => element != this.animationObject[index].id);
                this.animationObject.splice(index,1);
                this.animationDestinationVector.splice(index,1);
                this.animationMovingVector.splice(index,1);
                this.animationParticle.splice(index,1);
            }
        });
    }

    //Rotate the animationObject
    rotateAnimation() {
        this.animationObject.forEach((object) =>{
            var box = new THREE.Box3().setFromObject( object );
            var offset = new THREE.Vector3();
            box.getCenter(offset);
            if(Math.abs(offset.x)>Math.abs(offset.z)){
                object.rotation.z -= 0.1;
            }else{
                object.rotation.x += 0.1;
            }
        });
    }
    
    //Make the animationObject more and more transparent
    fadeOutAnimation() {
        this.animationObject.forEach((object) =>{
            object.material.opacity -= 0.03;
        });
    }
    
    //When the function is excuted, the camera is fixed and the mainShapeObject is rotated to show
    finalAnimation() {
        this._camera.position.set(0,30,0);
        this._camera.rotation.set(-1.5,0,0);
        this.mainShapeObject.rotation.z -= 0.1;
        //modal
        document.getElementById('modal').style.visibility = 'visible';
    }
    
    //Function that receives clickedPosition as a parameter and copies the preloaded particle near the coordinates you clicked on
    prepareParticle(clickedPosition) {
        var particle = [];
        this.particleObject.forEach((object) =>{
            var temp = object.clone();
            temp.position.add(clickedPosition);
            temp.material = new THREE.MeshStandardMaterial();
            temp.material.copy(object.material);
            temp.material.needsUpdate = true;
            particle.push(temp);
        });
        this.animationParticle.push(particle);
    }
    
    //A function that randomly scatters copied particles near the pre-click location
    //It becomes invisible quickly because the transparency is gradually decreasing
    particleAnimation() {
        this.animationObject.forEach((list,index) =>{
            var cameraPosition = new THREE.Vector3(this._camera.position.x,this._camera.position.y,this._camera.position.z).normalize();
            this.animationParticle[index].forEach((object) =>{
                object.position.add(cameraPosition);
                var ramdomMoveVector = new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5);
                object.position.add(ramdomMoveVector);
                object.material.format = THREE.RGBAFormat;
                object.material.transparent = true;
                object.material.opacity -= 0.20;
                object.visible = true;
                this._scene.add(object);
            });
        });
    }

    //Function to end animation and clear the scene
    //Within this program, it is executed only when the final animation is being output and clicking anywhere.
    //In the next game, reset the non-recyclable parts and remove the listener
    exit(){
        this.particleObject = [];
        this.objectId = [];
        this.controls.enabled = false;
        this._renderer.domElement.removeEventListener('pointerdown', this.onClick);
        this._renderer.domElement.removeEventListener('pointermove', this.onMove);
        cancelAnimationFrame(this.frameId);
        this.ended = true;
        while(this._scene.children.length > 0){
            this._scene.remove(this._scene.children[0]);
        }
    }

    //Function that starts a game
    //Add a listener to start the game, set up some settings, and call animate
    start(){
        this._camera.position.set(0,30,0);
        this._camera.rotation.set(-1.5,0,0);

	    this._scene.add(this.hlight);

        //Add listener, pointmove is later used for hover events using raycaster
        this._renderer.domElement.addEventListener('pointerdown', this.onClick);
        this._renderer.domElement.addEventListener('pointermove', this.onMove);
        this.controls.enabled = true;
        this.ended = false;
        this.animate();
    }

    //A rendering function that outputs all animations and calls requestAnimationFrame
    //If there is only one object left (= only mainShapeObject left), output the finalAnimation
    animate() {
        this.moveAnimation();
        this.rotateAnimation();
        this.fadeOutAnimation();
        this.particleAnimation();
        if(this.objectId.length == 1 && typeof this.mainShapeObject != 'undefined')this.finalAnimation();
        this.frameId = requestAnimationFrame(this.animate.bind(this));
    }

    //Function that resizes in response to resize of the web browser
    resize(){
        const width = window.innerWidth;
        const height = window.innerHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);

        const backgroundTexture = this._scene.background;
        if(backgroundTexture) {
            const divAspect = width / height;
            const img = backgroundTexture.image;
            const bgAspect = img.width / img.height;
            const aspect = bgAspect / divAspect;

            backgroundTexture.offset.x = aspect > 1 ? (1 - 1 / aspect) / 2 : 0;
            backgroundTexture.repeat.x = aspect > 1 ? 1 / aspect : 1;
            backgroundTexture.offset.y = aspect > 1 ? 0 : (1 - aspect) / 2;
            backgroundTexture.repeat.y = aspect > 1 ? 1 : aspect;
        }
    }
    
    //A function that sets the background at random
    //Within the range of numOfBackground, randomly select the path in the backgroundList and designate it as a background
    setupBackground() {
        //https://www.humus.name/index.php?page=Textures&start=56
        var backgroundList = [
                            '../Background/data/1.jpg',
                            '../Background/data/2.jpg',
                            '../Background/data/3.jpg',
                            '../Background/data/4.jpg',
                            '../Background/data/5.jpg',
                            '../Background/data/6.jpg',

        ];
        var numOfBackground = 6;
        var ramdomTextureNumber = Math.round((Math.random()*(numOfBackground-1)));

        var textureLoader = new THREE.TextureLoader();
        //if(Array.isArray(backgroundList[ramdomTextureNumber])) textureLoader = new THREE.WebGLCubeRenderTarget();

        textureLoader.load(backgroundList[ramdomTextureNumber], texture => {

            const renderTarget = new THREE.WebGLCubeRenderTarget(texture.image.height);
            renderTarget.fromEquirectangularTexture(this._renderer, texture);
            this._scene.background = renderTarget.texture;

            // textureLoader.fromEquirectangularTexture();
            // this._scene.background = texture;
            // this.resize();
        });
    }
}
