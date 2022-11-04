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

    var scene;
    // mainScene = choose dalgona
    const mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    //camera.rotation.y = 45/180*Math.PI;
    camera.position.x = 0;
    camera.position.y = 30;
    camera.position.z = 0;
    camera.rotation.x = -1.5;

    hlight = new THREE.AmbientLight(0x040404, 80);
    mainScene.add(hlight);

    var inMenu = false;
    var gameStarted = false;

    Game = new Game(camera,renderer);
	canvas.addEventListener("mousedown",onMainClick);

	// render choose scene
    //If you are in the game, render the scene of the game, or the main scene
	function render() {
        if(gameStarted == true)scene = Game._scene;
        else scene = mainScene;
        
        //When the game is over, change the gameStarted to false
        //and start preloading the background and particles for the next game's quick start
        if(gameStarted && Game.ended == true){
            gameStarted = false;
            Game.loadParticle();
            Game.setupBackground();
        }
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    //The function executed on the menu screen and the first screen is different
    function onMainClick(event){
		var t = vec2(2*event.clientX/canvas.width-1, 2*(canvas.height-event.clientY)/canvas.height-1);
        if(!inMenu){
            // if click play button
            // use position of play button
            if (t[0] <= 0.613 && t[0] >= 0.185 && t[1] <= -0.069 && t[1] >= -0.198)
            {
                //load gltf loader
                const loader = new THREE.GLTFLoader();
                
                //mainScene load
                var ball = loader.load('../Graphic/model/sugar3Text.gltf', function (gltf) {
                    ball = gltf.scene;
                    ball.scale.set(25, 25, 25);
                    mainScene.add(gltf.scene);
                    render();
                }, undefined, function (error) {
                    console.error(error);
                });
                inMenu = true;
                //render choose models scene
                render();
            }
            else ;
        }else{
			// if click square position
			if (t[0] <= 0.23 && t[0] >= -0.217 && t[1] <= 0.51 && t[1] >= 0.0615)
			{
				// load game class as sqaure
				Game.loadSquare();
				// animate game
				Game.start();

                gameStarted = true;
			}
			// if click triangle position
			else if(t[0] <= -0.115 && t[0] >= -0.529 && t[1] <= -0.22 && t[1] >= -0.68)
			{
				// load game class as triangle
				Game.loadTriangle();
				// animate game
				Game.start();
                
                gameStarted = true;
			}
			// if click Pentagon position
			else if(t[0] <= 0.618 && t[0] >= 0.273 && t[1] <= -0.29 && t[1] >= -0.654)
			{
				// load game class as pentagon
				Game.loadPentagon();
				// animate game]
				Game.start();
                
                gameStarted = true;
			}
			else ;
		};
	}

}
