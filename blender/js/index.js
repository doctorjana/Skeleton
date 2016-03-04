$(function(){

    /*global variables*/
	var scene, camera, renderer;
	var controls, guiControls, datGUI;
	var stats;
	var spotLight, hemi;
	var SCREEN_WIDTH, SCREEN_HEIGHT;
    var mouse, raycaster;
    var objects = [];

	function init(){
        $(".popup").hide();
        
		/*creates empty scene object and renderer*/
		scene = new THREE.Scene();
		camera =  new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, .1, 500);
		renderer = new THREE.WebGLRenderer({antialias:true});
		
		renderer.setClearColor(0xEBE0FF);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMapEnabled= false;
		renderer.shadowMapSoft = false;
		
		/*add controls*/
		controls = new THREE.OrbitControls( camera, renderer.domElement );
		controls.addEventListener( 'change', render );
					
		camera.position.x = -2;
		camera.position.y = 4;
		camera.position.z = -9;	
		camera.lookAt(scene.position);

		/*datGUI controls object*/
		guiControls = new function(){
            this.SceneToConsole= function(){
                console.log(scene);
                console.log(camera.position.x + " X Position");
                console.log(camera.position.y + " Y Position");
                console.log(camera.position.z + " Z Position");
            };
            
			this.rotationX  = 0.0;
			this.rotationY  = 0.0;
			this.rotationZ  = 0.0;
			
			this.lightX = 19;
			this.lightY = 47;
			this.lightZ = 19;
			this.intensity = .5;		
			this.distance = 373;
			this.angle = 1.6;
			this.exponent = 38;
			this.shadowCameraNear = 34;
			this.shadowCameraFar = 2635;
			this.shadowCameraFov = 68;
			this.shadowCameraVisible=false;
			this.shadowMapWidth=512;
			this.shadowMapHeight=512;
			this.shadowBias=0.00;
			this.shadowDarkness=0.11;		

		}
        
        //hemi light
        hemi = new THREE.HemisphereLight(0xbbbbbb, 0x660066);
        scene.add(hemi);        
        
		/*adds spot light with starting parameters*/
		spotLight = new THREE.SpotLight(0xffffff);
		spotLight.castShadow = false;
		spotLight.position.set (20, 35, 40);
		spotLight.intensity = guiControls.intensity;		
		spotLight.distance = guiControls.distance;
		spotLight.angle = guiControls.angle;
		spotLight.exponent = guiControls.exponent;
		spotLight.shadowCameraNear = guiControls.shadowCameraNear;
		spotLight.shadowCameraFar = guiControls.shadowCameraFar;
		spotLight.shadowCameraFov = guiControls.shadowCameraFov;
		spotLight.shadowCameraVisible = guiControls.shadowCameraVisible;
		spotLight.shadowBias = guiControls.shadowBias;
		spotLight.shadowDarkness = guiControls.shadowDarkness;
		scene.add(spotLight);
        
        
        //load blender scene
        var loader = new THREE.ObjectLoader();
        loader.load("https://cdn.rawgit.com/wpdildine/wpdildine.github.com/master/models/raycast_objects.json",function ( obj ) {
            
            scene.add( obj );
            
            scene.traverse(function(children){
                objects.push(children);
            });
                           
        }); 
        
        //add raycaster and mouse as 2D vector
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        
        //add event listener for mouse and calls function when activated
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'touchstart', onDocumentTouchStart, false );        
                   
		/*adds controls to scene*/
		datGUI = new dat.GUI();		
        datGUI.add(guiControls, 'SceneToConsole');
        
		datGUI.add(guiControls, 'lightX',-60,180);	
		datGUI.add(guiControls, 'lightY',0,180);	
		datGUI.add(guiControls, 'lightZ',-60,180);
		
		datGUI.add(guiControls, 'intensity',0.01, 5).onChange(function(value){
			spotLight.intensity = value;
		});		
		datGUI.add(guiControls, 'distance',0, 1000).onChange(function(value){
			spotLight.distance = value;
		});	
		datGUI.add(guiControls, 'angle',0.001, 1.570).onChange(function(value){
			spotLight.angle = value;
		});		
		datGUI.add(guiControls, 'exponent',0 ,50 ).onChange(function(value){
			spotLight.exponent = value;
		});
		datGUI.add(guiControls, 'shadowCameraNear',0,100).name("Near").onChange(function(value){		
			spotLight.shadowCamera.near = value;
			spotLight.shadowCamera.updateProjectionMatrix();		
		});
		datGUI.add(guiControls, 'shadowCameraFar',0,5000).name("Far").onChange(function(value){
			spotLight.shadowCamera.far = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.add(guiControls, 'shadowCameraFov',1,180).name("Fov").onChange(function(value){
			spotLight.shadowCamera.fov = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.add(guiControls, 'shadowCameraVisible').onChange(function(value){
			spotLight.shadowCameraVisible = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.add(guiControls, 'shadowBias',0,1).onChange(function(value){
			spotLight.shadowBias = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.add(guiControls, 'shadowDarkness',0,1).onChange(function(value){
			spotLight.shadowDarkness = value;
			spotLight.shadowCamera.updateProjectionMatrix();
		});
		datGUI.close();
        
		$("#webGL-container").append(renderer.domElement);
		/*stats*/
		stats = new Stats();		
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '0px';		
		$("#webGL-container").append( stats.domElement );
        
	} 
    
    function onDocumentTouchStart( event ) {

        event.preventDefault();

        event.clientX = event.touches[0].clientX;
        event.clientY = event.touches[0].clientY;
        onDocumentMouseDown( event );

    }
    
    function onDocumentMouseDown( event ) {

        event.preventDefault();

        mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects( objects );
        
        var color = (Math.random() * 0xffffff);

        if ( intersects.length > 0 ) {

            intersects[ 0 ].object.material.color.setHex( color );
            
            this.temp = intersects[ 0 ].object.material.color.getHexString();
            this.name = intersects[ 0 ].object.name;
            
            $( ".text" ).empty();
            $( ".popup" ).append( "<div class='text'><p>This is the color <strong>#" + this.temp + "</strong> and the name assigned in Blender is <strong>" + this.name  + "</strong></p></div>" );
            $(".popup").show();
            
        }
        
    }    
	function render() {	
		spotLight.position.x = guiControls.lightX;
		spotLight.position.y = guiControls.lightY;
		spotLight.position.z = guiControls.lightZ;
        scene.rotation.y += .001;
	}
	
	function animate(){
		requestAnimationFrame(animate);
		render();
		stats.update();		
		renderer.render(scene, camera);
	}
    
    init();
    animate();
    
    $(window).resize(function(){
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;
        camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
        camera.updateProjectionMatrix();
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    });
    
});