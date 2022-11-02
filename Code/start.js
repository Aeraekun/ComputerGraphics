window.onload = function init()
{
	const canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(canvas.width, canvas.height);

    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    //camera.rotation.y = 45/180*Math.PI;
    camera.position.x = 0;
    camera.position.y = 30;
    camera.position.z = 0;
    camera.rotation.x = -1.5;
   
	//const controls = new THREE.OrbitControls(camera, renderer.domElement);

    hlight = new THREE.AmbientLight(0x040404, 80);
    scene2.add(hlight);

	Game = new Game(canvas,camera,renderer);

	// use click event listener
	// use once:ture to execute one time
	canvas.addEventListener("mousedown", function(event){
		var t = vec2(2*event.clientX/canvas.width-1, 2*(canvas.height-event.clientY)/canvas.height-1);
		// if click play button
		if (t[0] <= 0.613 && t[0] >= 0.185 && t[1] <= -0.069 && t[1] >= -0.198)
		{
			const loader = new THREE.GLTFLoader();
			
			//scene2 load
			var ball = loader.load('../Graphic/sugar3Text.gltf', function (gltf) {
				ball = gltf.scene;
				ball.scale.set(25, 25, 25);
				scene2.add(gltf.scene);
				render1();
			}, undefined, function (error) {
				console.error(error);
			});

			render1();

			canvas.addEventListener("mousedown", function(event){
				var t = vec2(2*event.clientX/canvas.width-1, 2*(canvas.height-event.clientY)/canvas.height-1);
				// if click square
				if (t[0] <= 0.23 && t[0] >= -0.217 && t[1] <= 0.51 && t[1] >= 0.0615)
				{
					Game.loadSquare();

					Game.animate();
				}
				// if click triangle
				else if(t[0] <= -0.115 && t[0] >= -0.529 && t[1] <= -0.22 && t[1] >= -0.68)
				{
					
					Game.loadTriangle();

					Game.animate();
				}
				// if click Pentagon
				else if(t[0] <= 0.618 && t[0] >= 0.273 && t[1] <= -0.29 && t[1] >= -0.654)
				{
					
					Game.loadPentagon();

					Game.animate();
				}
				else ;
			},{once:true});
		}
		else ;
	},{once:true});

	function render1() {
        renderer.render(scene2, camera);
        requestAnimationFrame(render1);
    }

}

class Game{
    constructor(canvas,camera,renderer){
        this._canvas = canvas;
        this._camera = camera;
        this._camera.position.y = 30;
        this._camera.rotation.x = -1.5;
        this._renderer = renderer;
        this._renderer.domElement.addEventListener('click', this.onClick.bind(this), false);

        const scene = new THREE.Scene();
        this._scene = scene;
        this._scene.background = new THREE.Color(0x000000);
        this.loader = new THREE.GLTFLoader();

        window.onresize = this.resize.bind(this);

		this.controls = new THREE.OrbitControls(this._camera, this._renderer.domElement );
        this.controls.update();

	    this.hlight = new THREE.AmbientLight (0x404040,10);
	    this._scene.add(this.hlight);

        this.frameId;

        this.particleObject = [];

        this.rectangle = [];
        this.mainShapeObject;

        this.animationObject = [];
        this.animationDestinationVector = [];
        this.animationMovingVector = [];
        this.animationParticle = [];

        this.alreadyIn = false;

        this.loadParticle();
        this.setupBackground();

        this.stoped = false;
    }

    loadSquare(){
        for(var i=1; i<10; i++){
            var url = '../Graphic/model/sugarRec*.gltf'
            if(i==9)setTimeout(() => this.loadPiece(url.replace('*',String(9))), 300);
            else this.loadPiece(url.replace('*',String(i)));
        }
    }

    loadTriangle(){
        for(var i=1; i<5; i++){
            var url = '../Graphic/model/sugarTri*.gltf'
            if(i==4)setTimeout(() => this.loadPiece(url.replace('*',String(4))), 300);
            else this.loadPiece(url.replace('*',String(i)));
        }
    }
    
    loadPentagon(){
        for(var i=1; i<7; i++){
            var url = '../Graphic/model/sugarpoly*.gltf'
            if(i==6)setTimeout(() => this.loadPiece(url.replace('*',String(6))), 300);
            else this.loadPiece(url.replace('*',String(i)));
        }
    }

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
    
    loadPiece(url){
        this.loader.load(url, (gltf)=>{
            gltf.scene.children[0].scale.set(10,10,10);
            this._scene.add(gltf.scene);
            this.rectangle.push(gltf.scene.children[0].id);
            this.mainShapeObject = gltf.scene.children[0];
        },  undefined, function (error) {
            console.log(error);
        });
    }

    onClick() {
        event.preventDefault();
        var mouse = new THREE.Vector2();
        var raycaster = new THREE.Raycaster();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this._camera);
        var intersects = raycaster.intersectObjects(this._scene.children, true);
        if (intersects.length > 0) {
            var clickedPosition = new THREE.Vector3(intersects[0].point.x,intersects[0].point.y,intersects[0].point.z);
            var cameraPosition = new THREE.Vector3(this._camera.position.x,this._camera.position.y,this._camera.position.z);
    
            var vectorToMove = clickedPosition.clone().sub(cameraPosition).normalize().multiplyScalar(20);
            var objectToMove = intersects[0].object;
    
            this.animationObject.forEach((object) =>{if(objectToMove.id == object.id)this.alreadyIn = true;});
            if(!this.alreadyIn && !(objectToMove.id == this.mainShapeObject.id)){
                this.prepareParticle(clickedPosition);
                this.animationObject.push(objectToMove);
                this.animationDestinationVector.push(objectToMove.clone().position.add(vectorToMove.clone().normalize()).add(vectorToMove).ceil());
                this.animationMovingVector.push(vectorToMove.normalize());
            }
            this.alreadyIn = false;
        }

        if(this.rectangle.length == 1){
            this.exit();
            this.ended = true;
        }
    }

    moveAnimation() {
        this.animationObject.forEach((object,index) =>{
            if (!this.animationDestinationVector[index].equals(object.clone().position.ceil())) {
                object.position.add(this.animationMovingVector[index]);
            }else{
                this.animationObject[index].visible=false;
                this.rectangle = this.rectangle.filter((element) => element != this.animationObject[index].id);
                this.animationObject.splice(index,1);
                this.animationDestinationVector.splice(index,1);
                this.animationMovingVector.splice(index,1);
                this.animationParticle.splice(index,1);
            }
        });
    }

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
    
    fadeOutAnimation() {
        this.animationObject.forEach((object) =>{
            object.material.transparent = true;
            object.material.opacity -= 0.03;
            object.material.format = THREE.RGBAFormat
        });
    }
    
    finallAnimation() {
        this._camera.position.set(0,30,0);
        this._camera.rotation.set(-1.5,0,0);
        this.mainShapeObject.rotation.z -= 0.1;
    }
    
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

    exit(){
        cancelAnimationFrame(this.frameId);
        while(this._scene.children.length > 0){
            this._scene.remove(this._scene.children[0]);
        }
		location.reload();
    }

    animate() {
        this._renderer.render(this._scene,this._camera);
        this.moveAnimation();
        this.rotateAnimation();
        this.fadeOutAnimation();
        this.particleAnimation();
        if(this.rectangle.length == 1)this.finallAnimation();
        this.frameId = requestAnimationFrame(this.animate.bind(this));
    }

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

        textureLoader.load(backgroundList[ramdomTextureNumber], texture => {

            const renderTarget = new THREE.WebGLCubeRenderTarget(texture.image.height);
            renderTarget.fromEquirectangularTexture(this._renderer, texture);
            this._scene.background = renderTarget.texture;
        });
    }
}

