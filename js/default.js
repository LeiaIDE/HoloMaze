var code = worker.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));
var blob = new Blob([code], {
    type: "application/javascript"
});
var path = URL.createObjectURL(blob);


var animate, initScene, render, _boxes = [],
    spawnBall, gameStep,
    renderer, scene, ground_material, ground, bottom, light, camera,
    bumper_x1, bumper_x2, bumper_z1, bumper_z2, ball, ball_radius,
    bumper_x1_s, bumper_x2_s, bumper_z1_s, bumper_z2_s,
    yard_x, yard_z, bush, wall_thick, ground_thick,
    slope_z1, slope_z2, wall_z1, wall_yard_z1, wall_bush, road_width,
    wall_z2, wall_z3, wall_z4, wall_z5, wall_z6, wall_z7, wall_z8,
    wall_x1, wall_x2, wall_x3, wall_x4, wall_x5, wall_x6,
    wall_yard_z2, wall_yard_z3, wall_yard_z4, wall_yard_z5, wall_yard_z6, wall_yard_z7, wall_yard_z8,
    wall_yard_x1, wall_yard_x2, wall_yard_x3, wall_yard_x4, wall_yard_x5, wall_yard_x6,
    tar_1, tar_2, tar_3, door_1, door_2, door_yard_1, door_yard_2,
    tar_size,
    tarBox, handleCollision,
    lastRoll, lastYaw, lastPitch,
    camMeshs64 = [],
    logo_1,
    holoScreenScale,
    holoCamFov;
var stats;

var showWidth = window.innerWidth;
var showHeight = window.innerHeight;
//  console.log("showWidth:" + showWidth);
//  console.log("showHeight:" + showHeight);
var frame = 0;
var showGview, Gview, Gcamera;
var camHeight = 100;
window.onload = function() {    
    initScene();
    animate();
};

function initScene() {
  Physijs.scripts.worker = path;
Physijs.scripts.ammo = 'https://holodevuserresource.s3.amazonaws.com/ammo.js';
  
  setInterval(function(){
    console.log(JSON.stringify(window.Gyro));
  }, 3000);
    renderer = new LeiaWebGLRenderer({
        antialias: false,
        renderMode: _renderMode,
        shaderMode: _nShaderMode,
        colorMode: _colorMode,
        devicePixelRatio: 1
    }); //1
    renderer.Leia_setSize({		
            width:showWidth, 
            height:showHeight, 
            autoFit:true}); //2
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    stats = new Stats();
    //var roll = document.getElementById("roll");
    //var pitch = document.getElementById("pitch");
    //var yaw = document.getElementById("yaw");
    //var x_g = Number(pitch.innerText) * -40;
    //var y_g = Number(roll.innerText) * 40;
    //var z_g = Number(yaw.innerText) * 40;

    var x_g = window.Gyro.pitch * 35;//Number(pitch.innerText) * 35;
    var y_g = window.Gyro.roll * 35;//Number(roll.innerText) * 35;
    var z_g = -window.Gyro.yaw * 35;//Number(yaw.innerText) * -35;

    lastRoll = z_g;
    lastPitch = x_g;

    document.body.appendChild(renderer.domElement);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.zIndex = 100;
    document.body.appendChild(stats.domElement);
    scene = new Physijs.Scene();
    var GravitySim = -9.8 * 20;
    scene.setGravity(new THREE.Vector3(0, GravitySim, 0));
    //scene.addEventListener(	'update', function() {scene.simulate( undefined, 0.001 );});

    // Ground
    yard_x = 60;
    yard_z = 60;
    bush = 20;
    wall_thick = 3;
    ground_thick = 20;
    ball_radius = 7;
    wall_yard_z1 = 96;
    wall_bush = 16;
    road_width = 3 * ball_radius;
    //var material_g = new THREE.MeshBasicMaterial({ color: 0x4BD121 });

    //ground_material = Physijs.createMaterial(
    //	new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/wood.jpg'), transparent: true, opacity: 0.5 }),
    //   //material_g,
    //	.9, 
    //	.2 
    //);
    ground_material = Physijs.createMaterial(
        //new THREE.MeshLambertMaterial({
        //    color: 0xffffff,
        //    shading: THREE.FlatShading,
        //    vertexColors: THREE.VertexColors
        //}),
        new THREE.MeshLambertMaterial({
            map: THREE.ImageUtils.loadTexture('resource/wood.jpg'),
            transparent: true,
            opacity: 1.0
        }),
        //new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('images/wood.jpg'), transparent: true, opacity: 1.0 }),
        //material_g,
        0.9,
        0.2
    );
    // box ground
    ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(yard_x * 2, ground_thick, yard_z * 2),
        ground_material,
        0
    );
    ground.receiveShadow = true;
    scene.add(ground);

    // plane bottom

    var bottom_material = Physijs.createMaterial(
        //new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/wood.jpg'), transparent: true, opacity: 0.8 }),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            shading: THREE.FlatShading,
            wireframe: true,
            transparent: true
        }),
        //material_g,
        0.9,
        0.2
    );
    bottom = new Physijs.PlaneMesh(
        new THREE.PlaneGeometry(yard_x * 2, yard_z * 2),
        bottom_material,
        0
    );

    bottom.receiveShadow = false;
    bottom.visible = false;
    scene.add(bottom);

    //Logo
    //var logo_mat = new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/wood.jpg') }),
    var logo_mat = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture('resource/leai_logo.png'),
        transparent: true,
        opacity: 1.0
    });
    //var logo_mat = new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/leai_logo.png'), transparent: true, opacity: 1.0 });
    var logo_geom = new THREE.PlaneGeometry(yard_x * 63 / 30, yard_z * 14 / 30);
    logo_1 = new THREE.Mesh(logo_geom, logo_mat);
    logo_1.position.x = 0; //wall_thick / 2;
    logo_1.position.y = 15;
    logo_1.position.z = -30;
    logo_1.rotation.x = -90;
    scene.add(logo_1);





    // Bumpers
    //THREE.ImageUtils.crossOrigin = "anonymous";
    var bumper_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({
            map: THREE.ImageUtils.loadTexture('resource/wood.jpg')
        }),
        //      new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('images/wood.jpg') }),
        //     new THREE.MeshLambertMaterial({ transparent: false, opacity: 0.5 }),
        0.4,
        0.8
    );
    var bumper_geom_x = new THREE.BoxGeometry(wall_thick, bush, yard_z * 2);
    // x1
    //var material_x1 = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0x216000  }), .4, .8);
    bumper_x1 = new Physijs.BoxMesh(bumper_geom_x, bumper_material, 0);
    bumper_x1.position.y = bush / 2 + ground_thick / 2;
    bumper_x1.position.x = -yard_x + wall_thick / 2;
    bumper_x1.receiveShadow = true;
    scene.add(bumper_x1);
    // x2
    var material_x2 = Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: 0x000021
    }), 0.4, 0.8);
    bumper_x2 = new Physijs.BoxMesh(bumper_geom_x, bumper_material, 0);
    bumper_x2.position.y = bush / 2 + ground_thick / 2;
    bumper_x2.position.x = yard_x - wall_thick / 2;
    bumper_x2.receiveShadow = true;
    scene.add(bumper_x2);
    // z1
    var material_z1 = Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: 0xFED100
    }), 0.4, 0.8);
    var bumper_geom_z = new THREE.BoxGeometry(yard_z * 2 - 2.5 * wall_thick, bush, wall_thick);
    bumper_z1 = new Physijs.BoxMesh(bumper_geom_z, bumper_material, 0);
    bumper_z1.position.y = bush / 2 + ground_thick / 2;
    bumper_z1.position.z = -yard_x + wall_thick / 2;
    bumper_z1.receiveShadow = true;
    scene.add(bumper_z1);
    // z2
    var material_z2 = Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: 0x4B0021
    }), 0.4, 0.8);
    bumper_z2 = new Physijs.BoxMesh(bumper_geom_z, bumper_material, 0);
    bumper_z2.position.y = bush / 2 + ground_thick / 2;
    bumper_z2.position.z = yard_x - wall_thick / 2;
    bumper_z2.receiveShadow = true;
    scene.add(bumper_z2);

    // bumpershadow
    //THREE.ImageUtils.crossOrigin = "anonymous";
    var bumper_s_material = Physijs.createMaterial(
        //      new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/space_6.jpg'), transparent: true, opacity: 0.0 }),
        new THREE.MeshLambertMaterial({
            transparent: true,
            opacity: 0.2
        }),
        0.4,
        0.8
    );
    var wall_strongScale = 5;
    var bumper_geom_x_s = new THREE.BoxGeometry(wall_thick, bush * wall_strongScale, yard_z * 2);
    // x1
    //var material_x1 = Physijs.createMaterial(new THREE.MeshBasicMaterial({ color: 0x216000  }), .4, .8);
    bumper_x1_s = new Physijs.BoxMesh(bumper_geom_x_s, bumper_s_material, 0);
    bumper_x1_s.position.y = bush / 2 + ground_thick / 2;
    bumper_x1_s.position.x = -yard_x + wall_thick / 2;
    bumper_x1_s.receiveShadow = true;
    bumper_x1_s.visible = false;
    scene.add(bumper_x1_s);
    // x2
    bumper_x2_s = new Physijs.BoxMesh(bumper_geom_x_s, bumper_s_material, 0);
    bumper_x2_s.position.y = bush / 2 + ground_thick / 2;
    bumper_x2_s.position.x = yard_x - wall_thick / 2;
    bumper_x2_s.receiveShadow = true;
    bumper_x2_s.visible = false;
    scene.add(bumper_x2_s);
    // z1
    var bumper_geom_z_s = new THREE.BoxGeometry(yard_z * 2 - 2.5 * wall_thick, bush * wall_strongScale, wall_thick);
    bumper_z1_s = new Physijs.BoxMesh(bumper_geom_z_s, bumper_s_material, 0);
    bumper_z1_s.position.y = bush / 2 + ground_thick / 2;
    bumper_z1_s.position.z = -yard_x + wall_thick / 2;
    bumper_z1_s.receiveShadow = true;
    bumper_z1_s.visible = false;
    scene.add(bumper_z1_s);
    // z2
    bumper_z2_s = new Physijs.BoxMesh(bumper_geom_z_s, bumper_s_material, 0);
    bumper_z2_s.position.y = bush / 2 + ground_thick / 2;
    bumper_z2_s.position.z = yard_x - wall_thick / 2;
    bumper_z2_s.receiveShadow = true;
    bumper_z2_s.visible = false;
    scene.add(bumper_z2_s);

    // Slopes
    // z1
    var slope_geo = new THREE.BoxGeometry(yard_z * 1, wall_thick, road_width);
    slope_z1 = new Physijs.BoxMesh(slope_geo, bumper_material, 0);
    slope_z1.position.x = -yard_x + 2 * road_width;
    slope_z1.position.y = wall_thick / 2 + ground_thick / 2;
    slope_z1.position.z = -yard_z + road_width / 2;
    slope_z1.receiveShadow = true;
    scene.add(slope_z1);

    // z2
    var slope_geo_z2 = new THREE.BoxGeometry(yard_z * 5.6 / 8, wall_thick, road_width);
    slope_z2 = new Physijs.BoxMesh(slope_geo_z2, bumper_material, 0);
    var slope_z2_x = yard_x - yard_x * 4.4 / 12;
    var slope_z2_y = wall_thick / 2 + ground_thick / 2 + 8;
    var slope_z2_z = -yard_z + road_width / 2;
    slope_z2.receiveShadow = true;
    scene.add(slope_z2);

    // Walls
    // z1
    var wall_geo_z = new THREE.BoxGeometry(wall_yard_z1, wall_bush, wall_thick);
    wall_z1 = new Physijs.BoxMesh(wall_geo_z, bumper_material, 0);
    var wall_z1_x = -yard_x + wall_yard_z1 / 2 + road_width;
    var wall_z1_y = wall_bush / 2 + ground_thick / 2;
    var wall_z1_z = -yard_z + road_width;
    wall_z1.receiveShadow = true;
    scene.add(wall_z1);
    // z2
    wall_yard_z2 = yard_x * 2 / 3;
    var wall_geo_z2 = new THREE.BoxGeometry(wall_yard_z2, wall_bush, wall_thick);
    wall_z2 = new Physijs.BoxMesh(wall_geo_z2, bumper_material, 0);
    var wall_z2_x = -yard_x + road_width + wall_yard_z2 / 2;
    var wall_z2_y = wall_bush / 2 + ground_thick / 2;
    var wall_z2_z = -yard_z + 2 * road_width + wall_thick / 2;
    wall_z2.receiveShadow = true;
    scene.add(wall_z2);
    // x1
    wall_yard_x1 = yard_z - wall_z2_z - road_width * 3 / 4 - 4; // tune bottom road
    var wall_geo_x1 = new THREE.BoxGeometry(wall_thick, wall_bush, wall_yard_x1);
    wall_x1 = new Physijs.BoxMesh(wall_geo_x1, bumper_material, 0);
    var wall_x1_x = -yard_x + road_width + wall_thick / 2;
    var wall_x1_y = wall_bush / 2 + ground_thick / 2;
    var wall_x1_z = wall_z2_z + wall_thick / 2 + wall_yard_x1 / 2;
    wall_x1.receiveShadow = true;
    scene.add(wall_x1);
    // x2
    wall_yard_x2 = wall_yard_x1 / 3;
    var wall_geo_x2 = new THREE.BoxGeometry(wall_thick, wall_bush, wall_yard_x2);
    wall_x2 = new Physijs.BoxMesh(wall_geo_x2, bumper_material, 0);
    var wall_x2_x = wall_z2_x + wall_yard_z2 / 2 + wall_thick / 2;
    var wall_x2_y = wall_bush / 2 + ground_thick / 2;
    var wall_x2_z = wall_z2_z - wall_thick / 2 + wall_yard_x2 / 2;
    wall_x2.receiveShadow = true;
    scene.add(wall_x2);
    // z3
    wall_yard_z3 = yard_x * 1.2 / 4;
    var wall_geo_z3 = new THREE.BoxGeometry(wall_yard_z3, wall_bush, wall_thick);
    wall_z3 = new Physijs.BoxMesh(wall_geo_z3, bumper_material, 0);
    var wall_z3_x = wall_x2_x + wall_yard_z3 / 2 - wall_thick / 2;
    var wall_z3_y = wall_bush / 2 + ground_thick / 2;
    var wall_z3_z = wall_x2_z + wall_yard_x2 / 2 + wall_thick / 2;
    wall_z3.receiveShadow = true;
    scene.add(wall_z3);
    // x3 target
    wall_yard_x3 = (wall_yard_x1 - wall_yard_x2) / 2;
    var wall_geo_x3 = new THREE.BoxGeometry(wall_thick, wall_bush, wall_yard_x3);
    wall_x3 = new Physijs.BoxMesh(wall_geo_x3, bumper_material, 0);
    var wall_x3_x = wall_z3_x + wall_yard_z3 / 2 - wall_thick / 2;
    var wall_x3_y = wall_bush / 2 + ground_thick / 2;
    var wall_x3_z = wall_z3_z + wall_yard_x3 / 2 + wall_thick / 2;
    wall_x3.receiveShadow = true;
    scene.add(wall_x3);
    // z4
    wall_yard_z4 = wall_yard_z3 + wall_yard_z2 * 0.9 / 2;
    var wall_geo_z4 = new THREE.BoxGeometry(wall_yard_z4, wall_bush, wall_thick);
    wall_z4 = new Physijs.BoxMesh(wall_geo_z4, bumper_material, 0);
    var wall_z4_x = wall_x3_x - wall_yard_z4 / 2 - wall_thick / 2;
    var wall_z4_y = wall_bush / 2 + ground_thick / 2;
    var wall_z4_z = wall_x3_z + wall_yard_x3 / 2 - wall_thick / 2;
    wall_z4.receiveShadow = true;
    scene.add(wall_z4);
    // x4
    wall_yard_x4 = wall_yard_x3;
    var wall_geo_x4 = new THREE.BoxGeometry(wall_thick, wall_bush, wall_yard_x4);
    wall_x4 = new Physijs.BoxMesh(wall_geo_x4, bumper_material, 0);
    var wall_x4_x = wall_z3_x - wall_yard_z4 / 2 + wall_thick / 2;
    var wall_x4_y = wall_bush / 2 + ground_thick / 2;
    var wall_x4_z = wall_z3_z + wall_yard_x4 / 2 + wall_thick / 2;
    wall_x4.receiveShadow = true;
    scene.add(wall_x4);
    // z5
    wall_yard_z5 = wall_yard_z4 / 2 + wall_x2_x - wall_x4_x;
    var wall_geo_z5 = new THREE.BoxGeometry(wall_yard_z5, wall_bush, wall_thick);
    wall_z5 = new Physijs.BoxMesh(wall_geo_z5, bumper_material, 0);
    var wall_z5_x = wall_x1_x + wall_yard_z5 / 2 + wall_thick / 2;
    var wall_z5_y = wall_bush / 2 + ground_thick / 2;
    var wall_z5_z = wall_x1_z + wall_yard_x1 / 2 - wall_thick / 2;
    wall_z5.receiveShadow = true;
    scene.add(wall_z5);

    // x5 right part
    wall_yard_x5 = wall_z2_z - wall_z1_z;
    var wall_geo_x5 = new THREE.BoxGeometry(wall_thick, wall_bush, wall_yard_x5);
    wall_x5 = new Physijs.BoxMesh(wall_geo_x5, bumper_material, 0);
    var wall_x5_x = wall_x3_x;
    var wall_x5_y = wall_bush / 2 + ground_thick / 2;
    var wall_x5_z = wall_z1_z + wall_yard_x5 / 2 + wall_thick / 2;
    wall_x5.receiveShadow = true;
    scene.add(wall_x5);
    // z6
    wall_yard_z6 = (yard_x - wall_x5_x) / 2;
    var wall_geo_z6 = new THREE.BoxGeometry(wall_yard_z6, wall_bush, wall_thick);
    wall_z6 = new Physijs.BoxMesh(wall_geo_z6, bumper_material, 0);
    var wall_z6_x = wall_x5_x + wall_yard_z6 / 2 + wall_thick / 2;
    var wall_z6_y = wall_bush / 2 + ground_thick / 2;
    var wall_z6_z = wall_x5_z + wall_yard_x5 / 2 - wall_thick / 2;
    wall_z6.receiveShadow = true;
    scene.add(wall_z6);
    // x6
    wall_yard_x6 = wall_yard_x1;
    var wall_geo_x6 = new THREE.BoxGeometry(wall_thick, wall_bush, wall_yard_x6);
    wall_x6 = new Physijs.BoxMesh(wall_geo_x6, bumper_material, 0);
    var wall_x6_x = wall_z6_x + wall_yard_z6 / 2 - wall_thick / 2;
    var wall_x6_y = wall_bush / 2 + ground_thick / 2;
    var wall_x6_z = wall_z6_z + wall_yard_x6 / 2 + wall_thick / 2;
    wall_x6.receiveShadow = true;
    scene.add(wall_x6);
    // z7
    wall_yard_z7 = wall_yard_z5;
    var wall_geo_z7 = new THREE.BoxGeometry(wall_yard_z7, wall_bush, wall_thick);
    wall_z7 = new Physijs.BoxMesh(wall_geo_z7, bumper_material, 0);
    var wall_z7_x = wall_x6_x - wall_yard_z7 / 2 - wall_thick / 2;
    var wall_z7_y = wall_bush / 2 + ground_thick / 2;
    var wall_z7_z = wall_z5_z;
    wall_z7.receiveShadow = true;
    scene.add(wall_z7);
    // z8
    wall_yard_z8 = wall_x1_x + yard_x;
    var wall_geo_z8 = new THREE.BoxGeometry(wall_yard_z8, wall_bush, wall_thick);
    wall_z8 = new Physijs.BoxMesh(wall_geo_z8, bumper_material, 0);
    var wall_z8_x = -yard_x + wall_yard_z8 / 2 - wall_thick / 2;
    var wall_z8_y = wall_bush / 2 + ground_thick / 2;
    var wall_z8_z = wall_z3_z;
    wall_z8.receiveShadow = true;
    scene.add(wall_z8);

    // tar_1
    tar_size = 4;
    var tar_material = Physijs.createMaterial(
        //new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/plywood.jpg') }),
        new THREE.MeshPhongMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.8,
            specular: 0xeeeeff,
            shininess: 20
        }), //0x4BD121
        0.4,
        0.8
    );

    var tar_geo_1 = new THREE.BoxGeometry(tar_size, tar_size, tar_size);
    tar_1 = new Physijs.BoxMesh(tar_geo_1, tar_material, 0);
    var tar_1_x = wall_x5_x + wall_thick / 2 + tar_size / 2 + 4;
    var tar_1_y = tar_size / 2 + ground_thick / 2;
    var tar_1_z = wall_z6_z - wall_thick / 2 - tar_size / 2 - 4;
    tar_1.receiveShadow = true;
    tar_1.castShadow = true;
    tar_1.collisions = 0;
    tar_1.addEventListener('collision', handleCollision);
    scene.add(tar_1);
    // tar_2
    var tar_material_2 = Physijs.createMaterial(
        //new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/plywood.jpg'), transparent: true, opacity: 0.0 }),
        new THREE.MeshPhongMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.8,
            specular: 0xeeeeff,
            shininess: 20
        }), //0x4BD121
        0.4,
        0.8
    );
    //tar_material_2.map.wrapS = tar_material_2.map.wrapT = THREE.RepeatWrapping;
    //tar_material_2.map.repeat.set(.5, .5);
    var tar_geo_2 = new THREE.BoxGeometry(tar_size, tar_size, tar_size);
    tar_2 = new Physijs.BoxMesh(tar_geo_2, tar_material_2, 0);
    var tar_2_x = wall_x3_x - wall_thick / 2 - tar_size / 2 - 1;
    var tar_2_y = tar_size / 2 + ground_thick / 2;
    var tar_2_z = wall_x3_z;
    tar_2.receiveShadow = true;
    //tar_2.castShadow = true;
    tar_2.collisions = 0;
    tar_2.addEventListener('collision', handleCollision2);
    scene.add(tar_2);
    // tar_3
    var tar_material_3 = Physijs.createMaterial(
        //new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/plywood.jpg'), transparent: true, opacity: 0.0 }),
        new THREE.MeshPhongMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.8,
            specular: 0xeeeeff,
            shininess: 20
        }), //0x4BD121
        0.4,
        0.8
    );
    var tar_geo_3 = new THREE.BoxGeometry(tar_size, tar_size, tar_size);
    tar_3 = new Physijs.BoxMesh(tar_geo_3, tar_material_3, 0);
    var tar_3_x = yard_x - wall_thick / 2 - tar_size / 2 - 1;
    var tar_3_y = slope_z2_y + tar_size / 2 + wall_thick / 2;
    var tar_3_z = slope_z2_z;
    tar_3.receiveShadow = true;
    //tar_3.castShadow = true;
    tar_3.collisions = 0;
    tar_3.addEventListener('collision', handleCollision3);
    scene.add(tar_3);

    // door_1
    door_yard_1 = (wall_z7_x - wall_yard_z7 / 2) - (wall_z5_x + wall_yard_z5 / 2);
    var door_geo_1 = new THREE.BoxGeometry(door_yard_1, wall_bush, wall_thick);
    door_1 = new Physijs.BoxMesh(door_geo_1, bumper_material, 0);
    var door_1_x = ((wall_z7_x - wall_yard_z7 / 2) + (wall_z5_x + wall_yard_z5 / 2)) / 2;
    var door_1_y = wall_bush / 2 + ground_thick / 2;
    var door_1_z = wall_z5_z;
    door_1.receiveShadow = true;
    scene.add(door_1);
    // door_2
    door_yard_2 = wall_z1_x - wall_yard_z1 / 2 + yard_x;
    var door_geo_2 = new THREE.BoxGeometry(door_yard_2, wall_bush, wall_thick);
    door_2 = new Physijs.BoxMesh(door_geo_2, bumper_material, 0);
    var door_2_x = (wall_z1_x - wall_yard_z1 / 2 - yard_x) / 2;
    var door_2_y = wall_bush / 2 + ground_thick / 2;
    var door_2_z = wall_z1_z;
    door_2.receiveShadow = true;
    scene.add(door_2);

    // camera
    //camera = new THREE.PerspectiveCamera(55, showWidth / showHeight, 1, 1000);
    //camera = new LeiaCamera(55, showWidth / showHeight, 1, 1000);//3
    camera = new LeiaCamera({
        cameraPosition: new THREE.Vector3(_camPosition.x, _camPosition.y, _camPosition.z),
        targetPosition: new THREE.Vector3(_tarPosition.x, _tarPosition.y, _tarPosition.z)
    });
    camera.up.set(0, 0, -1);
    holoCamFov = _camFov;
    //camera.lookAt(scene.position);
    ground.add(camera);

    // Light
    light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(-10, 100, 10);
    light.target.position.copy(scene.position);
    light.castShadow = true;
    light.shadowCameraLeft = -60;
    light.shadowCameraTop = -60;
    light.shadowCameraRight = 60;
    light.shadowCameraBottom = 60;
    light.shadowCameraNear = 20;
    light.shadowCameraFar = 200;
    light.shadowBias = -0.0001;
    light.shadowMapWidth = light.shadowMapHeight = 512;
    light.shadowDarkness = 0.7;
    ground.add(light);


    var globalP = new THREE.Vector3();
    globalP.x = yard_x - ball_radius - wall_thick;
    globalP.y = 20;
    globalP.z = yard_z - ball_radius - wall_thick;

    var groundMatrix = new THREE.Matrix4();
    groundMatrix.makeRotationFromEuler(new THREE.Euler(THREE.Math.degToRad(lastRoll), 0, THREE.Math.degToRad(lastPitch)));
    var gMatInv = new THREE.Matrix4();
    gMatInv.getInverse(groundMatrix);
    var localP = new THREE.Vector3();
    localP = globalP.applyMatrix4(gMatInv);

    spawnBall(localP.x, localP.y, localP.z);


}

function spawnBall(x, y, z) {
    var material;

    var sphere_geometry = new THREE.SphereGeometry(ball_radius, 32, 32);

    material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({
            map: THREE.ImageUtils.loadTexture('resource/rocks.jpg')
        }),
        //new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture('images/rocks.jpg') }),
        //new THREE.MeshPhongMaterial({ color: 0xaaaaaa, transparent: false, opacity: 0.8, specular: 0xeeeeff, shininess: 20 }),//0x4BD121
        0.6,
        0.9
    );
    //material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
    //material.map.repeat.set( .5, .5 );

    ball = new Physijs.SphereMesh(
        sphere_geometry,
        material,
        2000, {
            restitution: 1.0
        }
    );

    ball.position.set(x, y, z);
    ball.castShadow = true;
    ball.name = "ball";
    scene.add(ball);


}

function handleCollision(collided_with, linearVelocity, angularVelocity) {

    if (collided_with.id != ball.id)
        return;
    ++this.collisions;
    var forceScale = 0.2;
    var collided_with_velo = new THREE.Vector3();
    collided_with_velo = collided_with.getLinearVelocity();
    var impulseForce = new THREE.Vector3();
    impulseForce.x = collided_with_velo.x * 1e6 * forceScale;
    impulseForce.y = collided_with_velo.y * 1e6 * forceScale;
    impulseForce.z = collided_with_velo.z * 1e6 * forceScale;
    switch (this.collisions) {

        case 1:
            this.material.emissive.setHex(0x000000);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;
        case 2:
            this.material.color.setHex(0xbb9955);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 3:
            this.material.color.setHex(0xaaaa55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 4:
            //this.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/plywood.jpg');
            this.material.color.setHex(0x99bb55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 5:
            //this.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/grass.png');
            this.material.color.setHex(0x88cc55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 6:

            tar_2.material.transparent = true;
            tar_2.material.opacity = 1.0;
            scene.remove(tar_1);
            scene.remove(door_1);
            break;
    }
}

function handleCollision2(collided_with, linearVelocity, angularVelocity) {

    if (collided_with.id != ball.id)
        return;
    ++this.collisions;
    var forceScale = 0.2;
    var collided_with_velo = new THREE.Vector3();
    collided_with_velo = collided_with.getLinearVelocity();
    var impulseForce = new THREE.Vector3();
    impulseForce.x = collided_with_velo.x * 1e6 * forceScale;
    impulseForce.y = collided_with_velo.y * 1e6 * forceScale;
    impulseForce.z = collided_with_velo.z * 1e6 * forceScale;
    switch (this.collisions) {

        case 1:
            this.material.emissive.setHex(0x000000);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;
        case 2:
            this.material.color.setHex(0xbb9955);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 3:
            this.material.color.setHex(0xaaaa55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 4:
            //this.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/plywood.jpg');
            this.material.color.setHex(0x99bb55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 5:
            //this.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/grass.png');
            this.material.color.setHex(0x88cc55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 6:

            tar_3.material.transparent = true;
            tar_3.material.opacity = 1.0;
            scene.remove(tar_2);
            scene.remove(door_2);
            break;


    }
}

function handleCollision3(collided_with, linearVelocity, angularVelocity) {

    if (collided_with.id != ball.id)
        return;
    ++this.collisions;
    var forceScale = 0.2;
    var collided_with_velo = new THREE.Vector3();
    collided_with_velo = collided_with.getLinearVelocity();
    var impulseForce = new THREE.Vector3();
    impulseForce.x = collided_with_velo.x * 1e6 * forceScale;
    impulseForce.y = collided_with_velo.y * 1e6 * forceScale;
    impulseForce.z = collided_with_velo.z * 1e6 * forceScale;
    switch (this.collisions) {

        case 1:
            this.material.emissive.setHex(0x000000);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;
        case 2:
            this.material.color.setHex(0xbb9955);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 3:
            this.material.color.setHex(0xaaaa55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 4:
            //THREE.ImageUtils.crossOrigin = "anonymous";
            //this.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/plywood.jpg');
            this.material.color.setHex(0x99bb55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 5:
            //this.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/grass.png');
            this.material.color.setHex(0x88cc55);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 6:
            //this.material.color.setHex(0x77dd55);
            //THREE.ImageUtils.crossOrigin = "anonymous";
            //this.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/space_5.jpg');
            this.material.color.setHex(0xffffff);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;

        case 7:
            //this.material.color.setHex(0x77dd55);
            //THREE.ImageUtils.crossOrigin = "anonymous";
            //this.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/space_1.jpg');
            //collided_with.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/earth.jpg');
            //ground.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/space_1.jpg');
            this.material.color.setHex(0xffffff);
            this.applyCentralImpulse(new THREE.Vector3(impulseForce.x, impulseForce.y, impulseForce.z));
            collided_with.applyCentralImpulse(new THREE.Vector3(-impulseForce.x * 0.0000005, -impulseForce.y * 0.0000005, -impulseForce.z * 0.0000005));
            break;
        case 8:
            //this.material.color.setHex(0x77dd55);
            bumper_z1.material.transparent = true;
            bumper_z1.material.opacity = 0.0;
            bumper_z1_s.material.transparent = true;
            bumper_z1_s.material.opacity = 0.0;
            //ball.material.map = THREE.ImageUtils.loadTexture('https://holodevuserresource.s3.amazonaws.com/earth.jpg');
            scene.remove(tar_2);
            break;
    }
}

function render() {
    frame++;
    var x_g = window.Gyro.pitch * 35;//Number(pitch.innerText) * 35;
    var y_g = window.Gyro.roll * 35;//Number(roll.innerText) * 35;
    var z_g = -window.Gyro.yaw * 35;//Number(yaw.innerText) * -35;
    //console.log("x_g: ", x_g, "y_g: ", y_g, "z_g: ", z_g);
    var totalRoll, totalPitch;
    if (renderer.GyroSimRoll !== undefined)
        totalRoll = THREE.Math.degToRad(z_g + renderer.GyroSimRoll);
    else
        totalRoll = THREE.Math.degToRad(z_g);
    if (renderer.GyroSimPitch !== undefined)
        totalPitch = THREE.Math.degToRad(x_g + renderer.GyroSimPitch);
    else
        totalPitch = THREE.Math.degToRad(x_g);
    //console.log("totalRoll: ", totalRoll, "totalRoll: ", "totalRoll: ");
    renderer.GyroRealRoll = z_g;
    renderer.GyroRealPitch = x_g;
    renderer.GyroRealYaw = y_g;

    // ground
    // box
    ground.matrixAutoUpdate = false;
    ground.matrixWorldNeedsUpdate = true;
    ground.matrix.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    var quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    var update = {
        id: ground._physijs.id
    };
    update.pos = {
        x: 0,
        y: 0,
        z: 0
    };
    update.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    ground.world.execute('updateTransform', update);

    // bottom
    // plane
    bottom.matrixAutoUpdate = false;
    bottom.matrixWorldNeedsUpdate = true;
    var r1Mat = new THREE.Matrix4();
    r1Mat.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    var r2Mat = new THREE.Matrix4();
    r2Mat.makeRotationFromEuler(new THREE.Euler(THREE.Math.degToRad(-90), 0, 0));
    r1Mat.multiply(r2Mat);
    var t1Mat = new THREE.Matrix4();
    t1Mat.makeTranslation(0, 0, (ground_thick / 2 - 1)); //+2 can see wood botttom
    r1Mat.multiply(t1Mat);
    bottom.matrix = r1Mat;
    var qqq = new THREE.Quaternion().setFromRotationMatrix(r1Mat);
    var update_bottom = {
        id: bottom._physijs.id
    };
    var t1Vec = new THREE.Vector3().setFromMatrixPosition(r1Mat);
    update_bottom.pos = {
        x: t1Vec.x,
        y: t1Vec.y,
        z: t1Vec.z
    };
    update_bottom.quat = {
        x: qqq.x,
        y: qqq.y,
        z: qqq.z,
        w: qqq.w
    };
    bottom.world.execute('updateTransform', update_bottom);
    // logo

    //logo_1.position.y = bush + ground_thick / 2;
    //logo_1.position.x = 0//wall_thick / 2;
    //logo_1.rotation.x = -90;

    logo_1.matrixAutoUpdate = false;
    logo_1.matrixWorldNeedsUpdate = true;
    var tMatlogo = new THREE.Matrix4();
    tMatlogo.makeTranslation(0, 16.5, -30);
    var rMatlogo = new THREE.Matrix4();
    rMatlogo.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMatlogo.multiply(tMatlogo);

    var rSelflogo = new THREE.Matrix4();
    rSelflogo.makeRotationFromEuler(new THREE.Euler(THREE.Math.degToRad(-90), 0, 0));
    rMatlogo.multiply(rSelflogo);


    logo_1.matrix = rMatlogo;
    //var update_bumper = { id: bumper_x1._physijs.id };
    //var tVec = new THREE.Vector3().setFromMatrixPosition(rMat);
    //update_bumper.pos = { x: tVec.x, y: tVec.y, z: tVec.z };
    //update_bumper.quat = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
    //bumper_x1.world.execute('updateTransform', update_bumper);

    // bumper
    // x1 left
    bumper_x1.matrixAutoUpdate = false;
    bumper_x1.matrixWorldNeedsUpdate = true;
    var tMat = new THREE.Matrix4();
    tMat.makeTranslation(-yard_x + wall_thick / 2, bush / 2 + ground_thick / 2, 0);
    var rMat = new THREE.Matrix4();
    rMat.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat.multiply(tMat);
    bumper_x1.matrix = rMat;
    var update_bumper = {
        id: bumper_x1._physijs.id
    };
    var tVec = new THREE.Vector3().setFromMatrixPosition(rMat);
    update_bumper.pos = {
        x: tVec.x,
        y: tVec.y,
        z: tVec.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    bumper_x1.world.execute('updateTransform', update_bumper);

    // x2 right
    bumper_x2.matrixAutoUpdate = false;
    bumper_x2.matrixWorldNeedsUpdate = true;
    var tMat2 = new THREE.Matrix4();
    tMat2.makeTranslation(yard_x - wall_thick / 2, bush / 2 + ground_thick / 2, 0);
    var rMat2 = new THREE.Matrix4();
    rMat2.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat2.multiply(tMat2);
    bumper_x2.matrix = rMat2;
    update_bumper = {
        id: bumper_x2._physijs.id
    };
    var tVec2 = new THREE.Vector3().setFromMatrixPosition(rMat2);
    update_bumper.pos = {
        x: tVec2.x,
        y: tVec2.y,
        z: tVec2.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    bumper_x2.world.execute('updateTransform', update_bumper);

    // z1 up
    bumper_z1.matrixAutoUpdate = false;
    bumper_z1.matrixWorldNeedsUpdate = true;
    var tMat3 = new THREE.Matrix4();
    tMat3.makeTranslation(0, bush / 2 + ground_thick / 2, -yard_x + wall_thick / 2);
    var rMat3 = new THREE.Matrix4();
    rMat3.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat3.multiply(tMat3);
    bumper_z1.matrix = rMat3;
    update_bumper = {
        id: bumper_z1._physijs.id
    };
    var tVec3 = new THREE.Vector3().setFromMatrixPosition(rMat3);
    update_bumper.pos = {
        x: tVec3.x,
        y: tVec3.y,
        z: tVec3.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    bumper_z1.world.execute('updateTransform', update_bumper);

    // z2 down
    bumper_z2.matrixAutoUpdate = false;
    bumper_z2.matrixWorldNeedsUpdate = true;
    var tMat4 = new THREE.Matrix4();
    tMat4.makeTranslation(0, bush / 2 + ground_thick / 2, yard_x - wall_thick / 2);
    var rMat4 = new THREE.Matrix4();
    rMat4.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat4.multiply(tMat4);
    bumper_z2.matrix = rMat4;
    update_bumper = {
        id: bumper_z2._physijs.id
    };
    var tVec4 = new THREE.Vector3().setFromMatrixPosition(rMat4);
    update_bumper.pos = {
        x: tVec4.x,
        y: tVec4.y,
        z: tVec4.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    bumper_z2.world.execute('updateTransform', update_bumper);

    // bumper_s
    // x1 left
    bumper_x1_s.matrixAutoUpdate = false;
    bumper_x1_s.matrixWorldNeedsUpdate = true;
    var tMat_s = new THREE.Matrix4();
    tMat_s.makeTranslation(-yard_x - wall_thick / 2, bush / 2 + ground_thick / 2, 0);
    var rMat_s = new THREE.Matrix4();
    rMat_s.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_s.multiply(tMat_s);
    bumper_x1_s.matrix = rMat_s;
    var update_bumper_s = {
        id: bumper_x1_s._physijs.id
    };
    var tVec_s = new THREE.Vector3().setFromMatrixPosition(rMat_s);
    update_bumper_s.pos = {
        x: tVec_s.x,
        y: tVec_s.y,
        z: tVec_s.z
    };
    update_bumper_s.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    bumper_x1_s.world.execute('updateTransform', update_bumper_s);

    // x2 right
    bumper_x2_s.matrixAutoUpdate = false;
    bumper_x2_s.matrixWorldNeedsUpdate = true;
    var tMat2_s = new THREE.Matrix4();
    tMat2_s.makeTranslation(yard_x + wall_thick / 2, bush / 2 + ground_thick / 2, 0);
    var rMat2_s = new THREE.Matrix4();
    rMat2_s.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat2_s.multiply(tMat2_s);
    bumper_x2_s.matrix = rMat2_s;
    update_bumper_s = {
        id: bumper_x2_s._physijs.id
    };
    var tVec2_s = new THREE.Vector3().setFromMatrixPosition(rMat2_s);
    update_bumper_s.pos = {
        x: tVec2_s.x,
        y: tVec2_s.y,
        z: tVec2_s.z
    };
    update_bumper_s.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    bumper_x2_s.world.execute('updateTransform', update_bumper_s);

    // z1 up
    bumper_z1_s.matrixAutoUpdate = false;
    bumper_z1_s.matrixWorldNeedsUpdate = true;
    var tMat3_s = new THREE.Matrix4();
    tMat3_s.makeTranslation(0, bush / 2 + ground_thick / 2, -yard_x - wall_thick / 2);
    var rMat3_s = new THREE.Matrix4();
    rMat3_s.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat3_s.multiply(tMat3_s);
    bumper_z1_s.matrix = rMat3_s;
    update_bumper_s = {
        id: bumper_z1_s._physijs.id
    };
    var tVec3_s = new THREE.Vector3().setFromMatrixPosition(rMat3_s);
    update_bumper_s.pos = {
        x: tVec3_s.x,
        y: tVec3_s.y,
        z: tVec3_s.z
    };
    update_bumper_s.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    bumper_z1_s.world.execute('updateTransform', update_bumper_s);

    // z2 down
    bumper_z2_s.matrixAutoUpdate = false;
    bumper_z2_s.matrixWorldNeedsUpdate = true;
    var tMat4_s = new THREE.Matrix4();
    tMat4_s.makeTranslation(0, bush / 2 + ground_thick / 2, yard_x + wall_thick / 2);
    var rMat4_s = new THREE.Matrix4();
    rMat4_s.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat4_s.multiply(tMat4_s);
    bumper_z2_s.matrix = rMat4_s;
    update_bumper_s = {
        id: bumper_z2_s._physijs.id
    };
    var tVec4_s = new THREE.Vector3().setFromMatrixPosition(rMat4_s);
    update_bumper_s.pos = {
        x: tVec4_s.x,
        y: tVec4_s.y,
        z: tVec4_s.z
    };
    update_bumper_s.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    bumper_z2_s.world.execute('updateTransform', update_bumper_s);

    // slope_z1
    slope_z1.matrixAutoUpdate = false;
    slope_z1.matrixWorldNeedsUpdate = true;
    var tMat_slopez1 = new THREE.Matrix4();
    tMat_slopez1.makeTranslation(-yard_x + 2 * road_width, wall_thick / 2 + ground_thick / 2, -yard_z + road_width / 2);
    var rMat_slopez1 = new THREE.Matrix4();
    rMat_slopez1.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_slopez1.multiply(tMat_slopez1);
    var rSelf = new THREE.Matrix4();
    rSelf.makeRotationFromEuler(new THREE.Euler(0, 0, THREE.Math.degToRad(15)));
    rMat_slopez1.multiply(rSelf);
    slope_z1.matrix = rMat_slopez1;
    var update_slopez1 = {
        id: slope_z1._physijs.id
    };
    var tVec_slopez1 = new THREE.Vector3().setFromMatrixPosition(rMat_slopez1);
    update_slopez1.pos = {
        x: tVec_slopez1.x,
        y: tVec_slopez1.y,
        z: tVec_slopez1.z
    };
    var quaternion_slope = new THREE.Quaternion().setFromRotationMatrix(rMat_slopez1);
    update_slopez1.quat = {
        x: quaternion_slope.x,
        y: quaternion_slope.y,
        z: quaternion_slope.z,
        w: quaternion_slope.w
    };
    slope_z1.world.execute('updateTransform', update_slopez1);

    // slope_z2
    //slope_z2.setCcdMotionThreshold(4);
    //slope_z2.setCcdSweptSphereRadius(1);
    var slope_z2_x = yard_x - yard_x * 4.4 / 12;
    var slope_z2_y = wall_thick / 2 + ground_thick / 2 + 8;
    var slope_z2_z = -yard_z + road_width / 2;
    slope_z2.matrixAutoUpdate = false;
    slope_z2.matrixWorldNeedsUpdate = true;
    var tMat_slopez2 = new THREE.Matrix4();
    tMat_slopez2.makeTranslation(slope_z2_x, slope_z2_y, slope_z2_z);
    var rMat_slopez2 = new THREE.Matrix4();
    rMat_slopez2.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_slopez2.multiply(tMat_slopez2);
    var rSelfz2 = new THREE.Matrix4();
    rSelfz2.makeRotationFromEuler(new THREE.Euler(0, 0, THREE.Math.degToRad(0)));
    rMat_slopez2.multiply(rSelfz2);
    slope_z2.matrix = rMat_slopez2;
    var update_slopez2 = {
        id: slope_z2._physijs.id
    };
    var tVec_slopez2 = new THREE.Vector3().setFromMatrixPosition(rMat_slopez2);
    update_slopez2.pos = {
        x: tVec_slopez2.x,
        y: tVec_slopez2.y,
        z: tVec_slopez2.z
    };
    var quaternion_slope_z2 = new THREE.Quaternion().setFromRotationMatrix(rMat_slopez2);
    update_slopez2.quat = {
        x: quaternion_slope_z2.x,
        y: quaternion_slope_z2.y,
        z: quaternion_slope_z2.z,
        w: quaternion_slope_z2.w
    };
    slope_z2.world.execute('updateTransform', update_slopez2);

    // wall_z1
    var wall_z1_x = -yard_x + wall_yard_z1 / 2 + road_width;
    var wall_z1_y = wall_bush / 2 + ground_thick / 2;
    var wall_z1_z = -yard_z + road_width;
    wall_z1.matrixAutoUpdate = false;
    wall_z1.matrixWorldNeedsUpdate = true;
    var tMat_wallz1 = new THREE.Matrix4();
    tMat_wallz1.makeTranslation(wall_z1_x, wall_z1_y, wall_z1_z);
    var rMat_wallz1 = new THREE.Matrix4();
    rMat_wallz1.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallz1.multiply(tMat_wallz1);
    wall_z1.matrix = rMat_wallz1;
    update_bumper = {
        id: wall_z1._physijs.id
    };
    var tVec_wallz1 = new THREE.Vector3().setFromMatrixPosition(rMat_wallz1);
    update_bumper.pos = {
        x: tVec_wallz1.x,
        y: tVec_wallz1.y,
        z: tVec_wallz1.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_z1.world.execute('updateTransform', update_bumper);
    // wall_z2
    var wall_z2_x = -yard_x + road_width + wall_yard_z2 / 2;
    var wall_z2_y = wall_bush / 2 + ground_thick / 2;
    var wall_z2_z = -yard_z + 2 * road_width + wall_thick / 2;
    wall_z2.matrixAutoUpdate = false;
    wall_z2.matrixWorldNeedsUpdate = true;
    var tMat_wallz2 = new THREE.Matrix4();
    tMat_wallz2.makeTranslation(wall_z2_x, wall_z2_y, wall_z2_z);
    var rMat_wallz2 = new THREE.Matrix4();
    rMat_wallz2.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallz2.multiply(tMat_wallz2);
    wall_z2.matrix = rMat_wallz2;
    update_bumper = {
        id: wall_z2._physijs.id
    };
    var tVec_wallz2 = new THREE.Vector3().setFromMatrixPosition(rMat_wallz2);
    update_bumper.pos = {
        x: tVec_wallz2.x,
        y: tVec_wallz2.y,
        z: tVec_wallz2.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_z2.world.execute('updateTransform', update_bumper);
    // wall_x1
    var wall_x1_x = -yard_x + road_width + wall_thick / 2;
    var wall_x1_y = wall_bush / 2 + ground_thick / 2;
    var wall_x1_z = wall_z2_z + wall_thick / 2 + wall_yard_x1 / 2;
    wall_x1.matrixAutoUpdate = false;
    wall_x1.matrixWorldNeedsUpdate = true;
    var tMat_wallx1 = new THREE.Matrix4();
    tMat_wallx1.makeTranslation(wall_x1_x, wall_x1_y, wall_x1_z);
    var rMat_wallx1 = new THREE.Matrix4();
    rMat_wallx1.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallx1.multiply(tMat_wallx1);
    wall_x1.matrix = rMat_wallx1;
    update_bumper = {
        id: wall_x1._physijs.id
    };
    var tVec_wallx1 = new THREE.Vector3().setFromMatrixPosition(rMat_wallx1);
    update_bumper.pos = {
        x: tVec_wallx1.x,
        y: tVec_wallx1.y,
        z: tVec_wallx1.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_x1.world.execute('updateTransform', update_bumper);
    // wall_x2
    var wall_x2_x = wall_z2_x + wall_yard_z2 / 2 + wall_thick / 2;
    var wall_x2_y = wall_bush / 2 + ground_thick / 2;
    var wall_x2_z = wall_z2_z - wall_thick / 2 + wall_yard_x2 / 2;
    wall_x2.matrixAutoUpdate = false;
    wall_x2.matrixWorldNeedsUpdate = true;
    var tMat_wallx2 = new THREE.Matrix4();
    tMat_wallx2.makeTranslation(wall_x2_x, wall_x2_y, wall_x2_z);
    var rMat_wallx2 = new THREE.Matrix4();
    rMat_wallx2.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallx2.multiply(tMat_wallx2);
    wall_x2.matrix = rMat_wallx2;
    update_bumper = {
        id: wall_x2._physijs.id
    };
    var tVec_wallx2 = new THREE.Vector3().setFromMatrixPosition(rMat_wallx2);
    update_bumper.pos = {
        x: tVec_wallx2.x,
        y: tVec_wallx2.y,
        z: tVec_wallx2.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_x2.world.execute('updateTransform', update_bumper);
    // wall_z3
    var wall_z3_x = wall_x2_x + wall_yard_z3 / 2 - wall_thick / 2;
    var wall_z3_y = wall_bush / 2 + ground_thick / 2;
    var wall_z3_z = wall_x2_z + wall_yard_x2 / 2 + wall_thick / 2;
    wall_z3.matrixAutoUpdate = false;
    wall_z3.matrixWorldNeedsUpdate = true;
    var tMat_wallz3 = new THREE.Matrix4();
    tMat_wallz3.makeTranslation(wall_z3_x, wall_z3_y, wall_z3_z);
    var rMat_wallz3 = new THREE.Matrix4();
    rMat_wallz3.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallz3.multiply(tMat_wallz3);
    wall_z3.matrix = rMat_wallz3;
    update_bumper = {
        id: wall_z3._physijs.id
    };
    var tVec_wallz3 = new THREE.Vector3().setFromMatrixPosition(rMat_wallz3);
    update_bumper.pos = {
        x: tVec_wallz3.x,
        y: tVec_wallz3.y,
        z: tVec_wallz3.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_z3.world.execute('updateTransform', update_bumper);
    // wall_x3
    var wall_x3_x = wall_z3_x + wall_yard_z3 / 2 - wall_thick / 2;
    var wall_x3_y = wall_bush / 2 + ground_thick / 2;
    var wall_x3_z = wall_z3_z + wall_yard_x3 / 2 + wall_thick / 2;
    wall_x3.matrixAutoUpdate = false;
    wall_x3.matrixWorldNeedsUpdate = true;
    var tMat_wallx3 = new THREE.Matrix4();
    tMat_wallx3.makeTranslation(wall_x3_x, wall_x3_y, wall_x3_z);
    var rMat_wallx3 = new THREE.Matrix4();
    rMat_wallx3.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallx3.multiply(tMat_wallx3);
    wall_x3.matrix = rMat_wallx3;
    update_bumper = {
        id: wall_x3._physijs.id
    };
    var tVec_wallx3 = new THREE.Vector3().setFromMatrixPosition(rMat_wallx3);
    update_bumper.pos = {
        x: tVec_wallx3.x,
        y: tVec_wallx3.y,
        z: tVec_wallx3.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_x3.world.execute('updateTransform', update_bumper);
    // wall_z4
    var wall_z4_x = wall_x3_x - wall_yard_z4 / 2 - wall_thick / 2;
    var wall_z4_y = wall_bush / 2 + ground_thick / 2;
    var wall_z4_z = wall_x3_z + wall_yard_x3 / 2 - wall_thick / 2;
    wall_z4.matrixAutoUpdate = false;
    wall_z4.matrixWorldNeedsUpdate = true;
    var tMat_wallz4 = new THREE.Matrix4();
    tMat_wallz4.makeTranslation(wall_z4_x, wall_z4_y, wall_z4_z);
    var rMat_wallz4 = new THREE.Matrix4();
    rMat_wallz4.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallz4.multiply(tMat_wallz4);
    wall_z4.matrix = rMat_wallz4;
    update_bumper = {
        id: wall_z4._physijs.id
    };
    var tVec_wallz4 = new THREE.Vector3().setFromMatrixPosition(rMat_wallz4);
    update_bumper.pos = {
        x: tVec_wallz4.x,
        y: tVec_wallz4.y,
        z: tVec_wallz4.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_z4.world.execute('updateTransform', update_bumper);
    // wall_x4
    var wall_x4_x = wall_z4_x - wall_yard_z4 / 2 + wall_thick / 2;
    var wall_x4_y = wall_bush / 2 + ground_thick / 2;
    var wall_x4_z = wall_z3_z + wall_yard_x4 / 2 + wall_thick / 2;
    wall_x4.matrixAutoUpdate = false;
    wall_x4.matrixWorldNeedsUpdate = true;
    var tMat_wallx4 = new THREE.Matrix4();
    tMat_wallx4.makeTranslation(wall_x4_x, wall_x4_y, wall_x4_z);
    var rMat_wallx4 = new THREE.Matrix4();
    rMat_wallx4.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallx4.multiply(tMat_wallx4);
    wall_x4.matrix = rMat_wallx4;
    update_bumper = {
        id: wall_x4._physijs.id
    };
    var tVec_wallx4 = new THREE.Vector3().setFromMatrixPosition(rMat_wallx4);
    update_bumper.pos = {
        x: tVec_wallx4.x,
        y: tVec_wallx4.y,
        z: tVec_wallx4.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_x4.world.execute('updateTransform', update_bumper);
    // wall_z5
    var wall_z5_x = wall_x1_x + wall_yard_z5 / 2 + wall_thick / 2;
    var wall_z5_y = wall_bush / 2 + ground_thick / 2;
    var wall_z5_z = wall_x1_z + wall_yard_x1 / 2 - wall_thick / 2;
    wall_z5.matrixAutoUpdate = false;
    wall_z5.matrixWorldNeedsUpdate = true;
    var tMat_wallz5 = new THREE.Matrix4();
    tMat_wallz5.makeTranslation(wall_z5_x, wall_z5_y, wall_z5_z);
    var rMat_wallz5 = new THREE.Matrix4();
    rMat_wallz5.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallz5.multiply(tMat_wallz5);
    wall_z5.matrix = rMat_wallz5;
    update_bumper = {
        id: wall_z5._physijs.id
    };
    var tVec_wallz5 = new THREE.Vector3().setFromMatrixPosition(rMat_wallz5);
    update_bumper.pos = {
        x: tVec_wallz5.x,
        y: tVec_wallz5.y,
        z: tVec_wallz5.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_z5.world.execute('updateTransform', update_bumper);
    // wall_x5
    var wall_x5_x = wall_x3_x + 2;
    var wall_x5_y = wall_bush / 2 + ground_thick / 2;
    var wall_x5_z = wall_z1_z + wall_yard_x5 / 2 + wall_thick / 2;
    wall_x5.matrixAutoUpdate = false;
    wall_x5.matrixWorldNeedsUpdate = true;
    var tMat_wallx5 = new THREE.Matrix4();
    tMat_wallx5.makeTranslation(wall_x5_x, wall_x5_y, wall_x5_z);
    var rMat_wallx5 = new THREE.Matrix4();
    rMat_wallx5.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallx5.multiply(tMat_wallx5);
    wall_x5.matrix = rMat_wallx5;
    update_bumper = {
        id: wall_x5._physijs.id
    };
    var tVec_wallx5 = new THREE.Vector3().setFromMatrixPosition(rMat_wallx5);
    update_bumper.pos = {
        x: tVec_wallx5.x,
        y: tVec_wallx5.y,
        z: tVec_wallx5.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_x5.world.execute('updateTransform', update_bumper);
    // wall_z6
    var wall_z6_x = wall_x5_x + wall_yard_z6 / 2 + wall_thick / 2;
    var wall_z6_y = wall_bush / 2 + ground_thick / 2;
    var wall_z6_z = wall_x5_z + wall_yard_x5 / 2 - wall_thick / 2;
    wall_z6.matrixAutoUpdate = false;
    wall_z6.matrixWorldNeedsUpdate = true;
    var tMat_wallz6 = new THREE.Matrix4();
    tMat_wallz6.makeTranslation(wall_z6_x, wall_z6_y, wall_z6_z);
    var rMat_wallz6 = new THREE.Matrix4();
    rMat_wallz6.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallz6.multiply(tMat_wallz6);
    wall_z6.matrix = rMat_wallz6;
    update_bumper = {
        id: wall_z6._physijs.id
    };
    var tVec_wallz6 = new THREE.Vector3().setFromMatrixPosition(rMat_wallz6);
    update_bumper.pos = {
        x: tVec_wallz6.x,
        y: tVec_wallz6.y,
        z: tVec_wallz6.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_z6.world.execute('updateTransform', update_bumper);
    // wall_x6
    var wall_x6_x = wall_z6_x + wall_yard_z6 / 2 - wall_thick / 2;
    var wall_x6_y = wall_bush / 2 + ground_thick / 2;
    var wall_x6_z = wall_z6_z + wall_yard_x6 / 2 + wall_thick / 2;
    wall_x6.matrixAutoUpdate = false;
    wall_x6.matrixWorldNeedsUpdate = true;
    var tMat_wallx6 = new THREE.Matrix4();
    tMat_wallx6.makeTranslation(wall_x6_x, wall_x6_y, wall_x6_z);
    var rMat_wallx6 = new THREE.Matrix4();
    rMat_wallx6.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallx6.multiply(tMat_wallx6);
    wall_x6.matrix = rMat_wallx6;
    update_bumper = {
        id: wall_x6._physijs.id
    };
    var tVec_wallx6 = new THREE.Vector3().setFromMatrixPosition(rMat_wallx6);
    update_bumper.pos = {
        x: tVec_wallx6.x,
        y: tVec_wallx6.y,
        z: tVec_wallx6.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_x6.world.execute('updateTransform', update_bumper);
    // wall_z7
    var wall_z7_x = wall_x6_x - wall_yard_z7 / 2 - wall_thick / 2;
    var wall_z7_y = wall_bush / 2 + ground_thick / 2;
    var wall_z7_z = wall_z5_z;
    wall_z7.matrixAutoUpdate = false;
    wall_z7.matrixWorldNeedsUpdate = true;
    var tMat_wallz7 = new THREE.Matrix4();
    tMat_wallz7.makeTranslation(wall_z7_x, wall_z7_y, wall_z7_z);
    var rMat_wallz7 = new THREE.Matrix4();
    rMat_wallz7.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallz7.multiply(tMat_wallz7);
    wall_z7.matrix = rMat_wallz7;
    update_bumper = {
        id: wall_z7._physijs.id
    };
    var tVec_wallz7 = new THREE.Vector3().setFromMatrixPosition(rMat_wallz7);
    update_bumper.pos = {
        x: tVec_wallz7.x,
        y: tVec_wallz7.y,
        z: tVec_wallz7.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_z7.world.execute('updateTransform', update_bumper);
    // wall_z8
    var wall_z8_x = -yard_x + wall_yard_z8 / 2 - wall_thick / 2;
    var wall_z8_y = wall_bush / 2 + ground_thick / 2;
    var wall_z8_z = wall_z3_z;
    wall_z8.matrixAutoUpdate = false;
    wall_z8.matrixWorldNeedsUpdate = true;
    var tMat_wallz8 = new THREE.Matrix4();
    tMat_wallz8.makeTranslation(wall_z8_x, wall_z8_y, wall_z8_z);
    var rMat_wallz8 = new THREE.Matrix4();
    rMat_wallz8.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_wallz8.multiply(tMat_wallz8);
    wall_z8.matrix = rMat_wallz8;
    update_bumper = {
        id: wall_z8._physijs.id
    };
    var tVec_wallz8 = new THREE.Vector3().setFromMatrixPosition(rMat_wallz8);
    update_bumper.pos = {
        x: tVec_wallz8.x,
        y: tVec_wallz8.y,
        z: tVec_wallz8.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    wall_z8.world.execute('updateTransform', update_bumper);

    // tar_1
    var tar_1_x = wall_x5_x + wall_thick / 2 + tar_size / 2 + 4;
    var tar_1_y = tar_size / 2 + ground_thick / 2;
    var tar_1_z = wall_z6_z - wall_thick / 2 - tar_size / 2 - 4;
    tar_1.matrixAutoUpdate = false;
    tar_1.matrixWorldNeedsUpdate = true;
    var tMat_tar_1 = new THREE.Matrix4();
    tMat_tar_1.makeTranslation(tar_1_x, tar_1_y, tar_1_z);
    var rMat_tar_1 = new THREE.Matrix4();
    rMat_tar_1.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_tar_1.multiply(tMat_tar_1);
    tar_1.matrix = rMat_tar_1;
    update_bumper = {
        id: tar_1._physijs.id
    };
    var tVec_tar_1 = new THREE.Vector3().setFromMatrixPosition(rMat_tar_1);
    update_bumper.pos = {
        x: tVec_tar_1.x,
        y: tVec_tar_1.y,
        z: tVec_tar_1.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    tar_1.world.execute('updateTransform', update_bumper);
    //tar_2
    var tar_2_x = wall_x3_x - wall_thick / 2 - tar_size / 2 - 1;
    var tar_2_y = tar_size / 2 + ground_thick / 2;
    var tar_2_z = wall_x3_z;
    tar_2.matrixAutoUpdate = false;
    tar_2.matrixWorldNeedsUpdate = true;
    var tMat_tar_2 = new THREE.Matrix4();
    tMat_tar_2.makeTranslation(tar_2_x, tar_2_y, tar_2_z);
    var rMat_tar_2 = new THREE.Matrix4();
    rMat_tar_2.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_tar_2.multiply(tMat_tar_2);
    tar_2.matrix = rMat_tar_2;
    update_bumper = {
        id: tar_2._physijs.id
    };
    var tVec_tar_2 = new THREE.Vector3().setFromMatrixPosition(rMat_tar_2);
    update_bumper.pos = {
        x: tVec_tar_2.x,
        y: tVec_tar_2.y,
        z: tVec_tar_2.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    tar_2.world.execute('updateTransform', update_bumper);
    //tar_3
    var tar_3_x = yard_x - wall_thick / 2 - tar_size / 2 - 1;
    var tar_3_y = slope_z2_y + tar_size / 2 + wall_thick / 2;
    var tar_3_z = slope_z2_z;
    tar_3.matrixAutoUpdate = false;
    tar_3.matrixWorldNeedsUpdate = true;
    var tMat_tar_3 = new THREE.Matrix4();
    tMat_tar_3.makeTranslation(tar_3_x, tar_3_y, tar_3_z);
    var rMat_tar_3 = new THREE.Matrix4();
    rMat_tar_3.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_tar_3.multiply(tMat_tar_3);
    tar_3.matrix = rMat_tar_3;
    update_bumper = {
        id: tar_3._physijs.id
    };
    var tVec_tar_3 = new THREE.Vector3().setFromMatrixPosition(rMat_tar_3);
    update_bumper.pos = {
        x: tVec_tar_3.x,
        y: tVec_tar_3.y,
        z: tVec_tar_3.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    tar_3.world.execute('updateTransform', update_bumper);

    // door_1
    var door_1_x = ((wall_z7_x - wall_yard_z7 / 2) + (wall_z5_x + wall_yard_z5 / 2)) / 2;
    var door_1_y = wall_bush / 2 + ground_thick / 2;
    var door_1_z = wall_z5_z;
    door_1.matrixAutoUpdate = false;
    door_1.matrixWorldNeedsUpdate = true;
    var tMat_door1 = new THREE.Matrix4();
    tMat_door1.makeTranslation(door_1_x, door_1_y, door_1_z);
    var rMat_door1 = new THREE.Matrix4();
    rMat_door1.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_door1.multiply(tMat_door1);
    door_1.matrix = rMat_door1;
    update_bumper = {
        id: door_1._physijs.id
    };
    var tVec_door1 = new THREE.Vector3().setFromMatrixPosition(rMat_door1);
    update_bumper.pos = {
        x: tVec_door1.x,
        y: tVec_door1.y,
        z: tVec_door1.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    door_1.world.execute('updateTransform', update_bumper);
    // door_2
    var door_2_x = (wall_z1_x - wall_yard_z1 / 2 - yard_x) / 2;
    var door_2_y = wall_bush / 2 + ground_thick / 2;
    var door_2_z = wall_z1_z;
    door_2.matrixAutoUpdate = false;
    door_2.matrixWorldNeedsUpdate = true;
    var tMat_door2 = new THREE.Matrix4();
    tMat_door2.makeTranslation(door_2_x, door_2_y, door_2_z);
    var rMat_door2 = new THREE.Matrix4();
    rMat_door2.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    rMat_door2.multiply(tMat_door2);
    door_2.matrix = rMat_door2;
    update_bumper = {
        id: door_2._physijs.id
    };
    var tVec_door2 = new THREE.Vector3().setFromMatrixPosition(rMat_door2);
    update_bumper.pos = {
        x: tVec_door2.x,
        y: tVec_door2.y,
        z: tVec_door2.z
    };
    update_bumper.quat = {
        x: quaternion.x,
        y: quaternion.y,
        z: quaternion.z,
        w: quaternion.w
    };
    door_2.world.execute('updateTransform', update_bumper);

    var A_velo = new THREE.Vector3();
    A_velo = ball.getAngularVelocity();
    var L_velo = new THREE.Vector3();
    L_velo = ball.getLinearVelocity();
    if (A_velo.x === 0 && A_velo.y === 0 && A_velo.z === 0)
        ball.setAngularVelocity(new THREE.Vector3(0, 0.01, 0));
    var globalP = new THREE.Vector3();
    globalP.x = ball.position.x;
    globalP.y = ball.position.y;
    globalP.z = ball.position.z;

    var groundMatrix = new THREE.Matrix4();
    groundMatrix.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
    var gMatInv = new THREE.Matrix4();
    gMatInv.getInverse(groundMatrix);
    var localP = new THREE.Vector3();
    localP = globalP.applyMatrix4(gMatInv);
    var guard_off = 5;

    //console.log("aaa", frame);
    if (frame >= 10) {
        if (localP.x > (yard_x - ball_radius - 2 + guard_off)) {
            localP.x = yard_x - ball_radius - 2 - 1;
            if (ball) scene.remove(ball);
        }
        if (localP.x < (-yard_x + ball_radius + 2 - guard_off)) {
            localP.x = -yard_x + ball_radius + 2 + 1;
            if (ball) scene.remove(ball);
        }
        if (localP.z > (yard_z - ball_radius - 2 + guard_off)) {
            localP.z = yard_z - ball_radius - 2 - 1;
            if (ball) scene.remove(ball);
        }
        if (localP.z < (-yard_z + ball_radius + 2 - guard_off)) {
            localP.z = -yard_z + ball_radius + 2 + 1;
            if (ball) scene.remove(ball);
        }
        if (localP.y < (ball_radius + ground_thick / 2 - 12)) {
            localP.y = ball_radius + ground_thick / 2;
            if (ball) scene.remove(ball);
        }
        if (localP.y > (50 + 2)) {
            localP.y = 50 + 2;
            if (ball) scene.remove(ball);
        }
    }
    var _gP = localP.applyMatrix4(groundMatrix);
    if (undefined === scene.getObjectByName("ball")) spawnBall(_gP.x, _gP.y, _gP.z);


    var deltaRoll = totalRoll - lastRoll;
    //var deltaYaw = Number(yaw.innerText) - lastYaw;
    var deltaPitch = totalPitch - lastPitch;
    //if (deltaRoll > 5 || deltaRoll<-5)
    //    console.log("aaa", deltaRoll);
    //if (deltaPitch > 5 || deltaPitch < -5)
    //    console.log("bbb", deltaPitch);

    lastRoll = totalRoll;
    //lastYaw = Number(yaw.innerText);
    lastPitch = totalPitch;

    scene.simulate();
    //console.log("aaa", deltaPitch);
    if (deltaRoll > 2 || deltaRoll < -2 || deltaPitch > 2 || deltaPitch < -2) {
        var boxMat_last = new THREE.Matrix4();
        boxMat_last.makeRotationFromEuler(new THREE.Euler(THREE.Math.degToRad(lastRoll), 0, THREE.Math.degToRad(lastPitch)));
        var boxMat_lInv = new THREE.Matrix4();
        boxMat_lInv.getInverse(boxMat_last);
        var boxMat_cur = new THREE.Matrix4();
        boxMat_cur.makeRotationFromEuler(new THREE.Euler(totalRoll, 0, totalPitch));
        boxMat_cur.multiply(boxMat_lInv);
        var ballMat = ball.matrix;
        boxMat_cur.multiply(ballMat);
        var me = boxMat_cur.elements;
        ball.position.x = me[12];
        ball.position.y = me[13];
        ball.position.z = me[14];
        ball.rotation.setFromRotationMatrix(boxMat_cur);
        //ball.setAngularFactor(0.1, 0.1, 0.1);
    }

    renderer.setViewport(0, 0, showWidth, showHeight);
    renderer.setScissor(0, 0, showWidth, showHeight);
    renderer.enableScissorTest(true);
    renderer.setClearColor(new THREE.Color().setRGB(0.0, 0.0, 0.0));
    //renderer.render(scene, camera);

    // if(frame<=100)
    renderer.Leia_render({
        scene: scene,
        camera: camera,
        holoScreenSize: _holoScreenSize,
        holoCamFov: _camFov,
        upclip: _up,
        downclip:  _down,
        messageFlag: _messageFlag
    });
}

function animate() {    
    render();
    requestAnimationFrame(animate);
    stats.update();
}

function setMode(mode) {
    renderer.setRenderMode(mode);
}

function setResolution(width, height) {
        var windowW = width;
        var windowH = height;
        renderer.Leia_setSize(windowW, windowH); //5
    }
    //function setFov(fov) {
    //    var _fov = fov;
    //    renderer.setFov(_fov);
    //}


document.onkeydown = function(event) {
     var strValue;
     var data;
    if (event && event.keyCode == 73) {

         strValue = document.body.style.marginTop;
         data = parseInt(strValue);
        if (strValue === "") {
            data = 0;
        }
        data = data - 1;
        document.body.style.marginTop = data + "px";
    }
    if (event && event.keyCode == 74) {
         strValue = document.body.style.marginLeft;
         data = parseInt(strValue);
        if (strValue === "") {
            data = 0;
        }
        data = data - 1;
        document.body.style.marginLeft = data + "px";
    }
    if (event && event.keyCode == 75) {
         strValue = document.body.style.marginTop;
         data = parseInt(strValue);
        if (strValue === "") {
            data = 0;
        }
        data = data + 1;
        document.body.style.marginTop = data + "px";
    }
    if (event && event.keyCode == 76) {
         strValue = document.body.style.marginLeft;
         data = parseInt(strValue);
        if (strValue === "") {
            data = 0;
        }
        data = data + 1;
        document.body.style.marginLeft = data + "px";
    }

};


var game_step_timer;

function gameStep() {
    game_step_timer = setTimeout(gameStep, 1000 / 120);
}

function worker() {
        var transferableMessage = self.webkitPostMessage || self.postMessage,

            // enum
            MESSAGE_TYPES = {
                WORLDREPORT: 0,
                COLLISIONREPORT: 1,
                VEHICLEREPORT: 2,
                CONSTRAINTREPORT: 3
            },

            // temp variables
            _object,
            _vector,
            _transform,

            // functions
            public_functions = {},
            getShapeFromCache,
            setShapeCache,
            createShape,
            reportWorld,
            reportVehicles,
            reportCollisions,
            reportConstraints,

            // world variables
            fixedTimeStep, // used when calling stepSimulation
            rateLimit, // sets whether or not to sync the simulation rate with fixedTimeStep
            last_simulation_time,
            last_simulation_duration = 0,
            world,
            transform,
            _vec3_1,
            _vec3_2,
            _vec3_3,
            _quat,
            // private cache
            _objects = {},
            _vehicles = {},
            _constraints = {},
            _materials = {},
            _objects_ammo = {},
            _num_objects = 0,
            _num_wheels = 0,
            _num_constraints = 0,
            _object_shapes = {},

            // The following objects are to track objects that ammo.js doesn't clean
            // up. All are cleaned up when they're corresponding body is destroyed.
            // Unfortunately, it's very difficult to get at these objects from the
            // body, so we have to track them ourselves.
            _motion_states = {},
            // Don't need to worry about it for cached shapes.
            _noncached_shapes = {},
            // A body with a compound shape always has a regular shape as well, so we
            // have track them separately.
            _compound_shapes = {},

            // object reporting
            REPORT_CHUNKSIZE, // report array is increased in increments of this chunk size

            WORLDREPORT_ITEMSIZE = 14, // how many float values each reported item needs
            worldreport,

            COLLISIONREPORT_ITEMSIZE = 5, // one float for each object id, and a Vec3 contact normal
            collisionreport,

            VEHICLEREPORT_ITEMSIZE = 9, // vehicle id, wheel index, 3 for position, 4 for rotation
            vehiclereport,

            CONSTRAINTREPORT_ITEMSIZE = 6, // constraint id, offset object, offset, applied impulse
            constraintreport;

        var ab = new ArrayBuffer(1);

        transferableMessage(ab, [ab]);
        var SUPPORT_TRANSFERABLE = (ab.byteLength === 0);

        getShapeFromCache = function(cache_key) {
            if (_object_shapes[cache_key] !== undefined) {
                return _object_shapes[cache_key];
            }
            return null;
        };

        setShapeCache = function(cache_key, shape) {
            _object_shapes[cache_key] = shape;
        };

        createShape = function(description) {
            var cache_key, shape;

            _transform.setIdentity();
            switch (description.type) {
                case 'plane':
                    cache_key = 'plane_' + description.normal.x + '_' + description.normal.y + '_' + description.normal.z;
                    if ((shape = getShapeFromCache(cache_key)) === null) {
                        _vec3_1.setX(description.normal.x);
                        _vec3_1.setY(description.normal.y);
                        _vec3_1.setZ(description.normal.z);
                        shape = new Ammo.btStaticPlaneShape(_vec3_1, 0);
                        setShapeCache(cache_key, shape);
                    }
                    break;

                case 'box':
                    cache_key = 'box_' + description.width + '_' + description.height + '_' + description.depth;
                    if ((shape = getShapeFromCache(cache_key)) === null) {
                        _vec3_1.setX(description.width / 2);
                        _vec3_1.setY(description.height / 2);
                        _vec3_1.setZ(description.depth / 2);
                        shape = new Ammo.btBoxShape(_vec3_1);
                        setShapeCache(cache_key, shape);
                    }
                    break;

                case 'sphere':
                    cache_key = 'sphere_' + description.radius;
                    if ((shape = getShapeFromCache(cache_key)) === null) {
                        shape = new Ammo.btSphereShape(description.radius);
                        setShapeCache(cache_key, shape);
                    }
                    break;

                case 'cylinder':
                    cache_key = 'cylinder_' + description.width + '_' + description.height + '_' + description.depth;
                    if ((shape = getShapeFromCache(cache_key)) === null) {
                        _vec3_1.setX(description.width / 2);
                        _vec3_1.setY(description.height / 2);
                        _vec3_1.setZ(description.depth / 2);
                        shape = new Ammo.btCylinderShape(_vec3_1);
                        setShapeCache(cache_key, shape);
                    }
                    break;

                case 'capsule':
                    cache_key = 'capsule_' + description.radius + '_' + description.height;
                    if ((shape = getShapeFromCache(cache_key)) === null) {
                        // In Bullet, capsule height excludes the end spheres
                        shape = new Ammo.btCapsuleShape(description.radius, description.height - 2 * description.radius);
                        setShapeCache(cache_key, shape);
                    }
                    break;

                case 'cone':
                    cache_key = 'cone_' + description.radius + '_' + description.height;
                    if ((shape = getShapeFromCache(cache_key)) === null) {
                        shape = new Ammo.btConeShape(description.radius, description.height);
                        setShapeCache(cache_key, shape);
                    }
                    break;

                case 'concave':
                    var i, triangle, triangle_mesh = new Ammo.btTriangleMesh();
                    if (!description.triangles.length) return false;

                    for (i = 0; i < description.triangles.length; i++) { //noprotect
                        triangle = description.triangles[i];

                        _vec3_1.setX(triangle[0].x);
                        _vec3_1.setY(triangle[0].y);
                        _vec3_1.setZ(triangle[0].z);

                        _vec3_2.setX(triangle[1].x);
                        _vec3_2.setY(triangle[1].y);
                        _vec3_2.setZ(triangle[1].z);

                        _vec3_3.setX(triangle[2].x);
                        _vec3_3.setY(triangle[2].y);
                        _vec3_3.setZ(triangle[2].z);

                        triangle_mesh.addTriangle(
                            _vec3_1,
                            _vec3_2,
                            _vec3_3,
                            true
                        );
                    }

                    shape = new Ammo.btBvhTriangleMeshShape(
                        triangle_mesh,
                        true,
                        true
                    );
                    _noncached_shapes[description.id] = shape;
                    break;

                case 'convex':
                    var i, point, shape = new Ammo.btConvexHullShape();
                    for (i = 0; i < description.points.length; i++) { //noprotect
                        point = description.points[i];

                        _vec3_1.setX(point.x);
                        _vec3_1.setY(point.y);
                        _vec3_1.setZ(point.z);

                        shape.addPoint(_vec3_1);

                    }
                    _noncached_shapes[description.id] = shape;
                    break;

                case 'heightfield':

                    var ptr = Ammo.allocate(4 * description.xpts * description.ypts, "float", Ammo.ALLOC_NORMAL);

                    for (var f = 0; f < description.points.length; f++) { //noprotect
                        Ammo.setValue(ptr + f, description.points[f], 'float');
                    }

                    shape = new Ammo.btHeightfieldTerrainShape(
                        description.xpts,
                        description.ypts,
                        ptr,
                        1, -description.absMaxHeight,
                        description.absMaxHeight,
                        2,
                        0,
                        false
                    );

                    _vec3_1.setX(description.xsize / (description.xpts - 1));
                    _vec3_1.setY(description.ysize / (description.ypts - 1));
                    _vec3_1.setZ(1);

                    shape.setLocalScaling(_vec3_1);
                    _noncached_shapes[description.id] = shape;
                    break;

                default:
                    // Not recognized
                    return;
                    //break;
            }

            return shape;
        };

        public_functions.init = function(params) {
            importScripts(params.ammo);

            _transform = new Ammo.btTransform();
            _vec3_1 = new Ammo.btVector3(0, 0, 0);
            _vec3_2 = new Ammo.btVector3(0, 0, 0);
            _vec3_3 = new Ammo.btVector3(0, 0, 0);
            _quat = new Ammo.btQuaternion(0, 0, 0, 0);

            REPORT_CHUNKSIZE = params.reportsize || 50;
            if (SUPPORT_TRANSFERABLE) {
                // Transferable messages are supported, take advantage of them with TypedArrays
                worldreport = new Float32Array(2 + REPORT_CHUNKSIZE * WORLDREPORT_ITEMSIZE); // message id + # of objects to report + chunk size * # of values per object
                collisionreport = new Float32Array(2 + REPORT_CHUNKSIZE * COLLISIONREPORT_ITEMSIZE); // message id + # of collisions to report + chunk size * # of values per object
                vehiclereport = new Float32Array(2 + REPORT_CHUNKSIZE * VEHICLEREPORT_ITEMSIZE); // message id + # of vehicles to report + chunk size * # of values per object
                constraintreport = new Float32Array(2 + REPORT_CHUNKSIZE * CONSTRAINTREPORT_ITEMSIZE); // message id + # of constraints to report + chunk size * # of values per object
            } else {
                // Transferable messages are not supported, send data as normal arrays
                worldreport = [];
                collisionreport = [];
                vehiclereport = [];
                constraintreport = [];
            }
            worldreport[0] = MESSAGE_TYPES.WORLDREPORT;
            collisionreport[0] = MESSAGE_TYPES.COLLISIONREPORT;
            vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
            constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;

            var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
                dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
                solver = new Ammo.btSequentialImpulseConstraintSolver(),
                broadphase;

            if (!params.broadphase) params.broadphase = {
                type: 'dynamic'
            };
            switch (params.broadphase.type) {
                case 'sweepprune':

                    _vec3_1.setX(params.broadphase.aabbmin.x);
                    _vec3_1.setY(params.broadphase.aabbmin.y);
                    _vec3_1.setZ(params.broadphase.aabbmin.z);

                    _vec3_2.setX(params.broadphase.aabbmax.x);
                    _vec3_2.setY(params.broadphase.aabbmax.y);
                    _vec3_2.setZ(params.broadphase.aabbmax.z);

                    broadphase = new Ammo.btAxisSweep3(
                        _vec3_1,
                        _vec3_2
                    );

                    break;

                case 'dynamic':
                default:
                    broadphase = new Ammo.btDbvtBroadphase();
                    break;
            }

            world = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);

            fixedTimeStep = params.fixedTimeStep;
            rateLimit = params.rateLimit;

            transferableMessage({
                cmd: 'worldReady'
            });
        };

        public_functions.registerMaterial = function(description) {
            _materials[description.id] = description;
        };

        public_functions.unRegisterMaterial = function(description) {
            delete _materials[description.id];
        };

        public_functions.setFixedTimeStep = function(description) {
            fixedTimeStep = description;
        };

        public_functions.setGravity = function(description) {
            _vec3_1.setX(description.x);
            _vec3_1.setY(description.y);
            _vec3_1.setZ(description.z);
            world.setGravity(_vec3_1);
        };

        public_functions.addObject = function(description) {

            var i,
                localInertia, shape, motionState, rbInfo, body;

            shape = createShape(description);
            if (!shape) return;
            // If there are children then this is a compound shape
            if (description.children) {
                var compound_shape = new Ammo.btCompoundShape(),
                    _child;
                compound_shape.addChildShape(_transform, shape);

                for (i = 0; i < description.children.length; i++) {
                    _child = description.children[i];

                    var trans = new Ammo.btTransform();
                    trans.setIdentity();

                    _vec3_1.setX(_child.position_offset.x);
                    _vec3_1.setY(_child.position_offset.y);
                    _vec3_1.setZ(_child.position_offset.z);
                    trans.setOrigin(_vec3_1);

                    _quat.setX(_child.rotation.x);
                    _quat.setY(_child.rotation.y);
                    _quat.setZ(_child.rotation.z);
                    _quat.setW(_child.rotation.w);
                    trans.setRotation(_quat);

                    shape = createShape(description.children[i]);
                    compound_shape.addChildShape(trans, shape);
                    Ammo.destroy(trans);
                }

                shape = compound_shape;
                _compound_shapes[description.id] = shape;
            }
            _vec3_1.setX(0);
            _vec3_1.setY(0);
            _vec3_1.setZ(0);
            shape.calculateLocalInertia(description.mass, _vec3_1);

            _transform.setIdentity();

            _vec3_2.setX(description.position.x);
            _vec3_2.setY(description.position.y);
            _vec3_2.setZ(description.position.z);
            _transform.setOrigin(_vec3_2);

            _quat.setX(description.rotation.x);
            _quat.setY(description.rotation.y);
            _quat.setZ(description.rotation.z);
            _quat.setW(description.rotation.w);
            _transform.setRotation(_quat);

            motionState = new Ammo.btDefaultMotionState(_transform); // #TODO: btDefaultMotionState supports center of mass offset as second argument - implement
            rbInfo = new Ammo.btRigidBodyConstructionInfo(description.mass, motionState, shape, _vec3_1);

            if (description.materialId !== undefined) {
                rbInfo.set_m_friction(_materials[description.materialId].friction);
                rbInfo.set_m_restitution(_materials[description.materialId].restitution);
            }

            body = new Ammo.btRigidBody(rbInfo);
            Ammo.destroy(rbInfo);

            if (typeof description.collision_flags !== 'undefined') {
                body.setCollisionFlags(description.collision_flags);
            }

            world.addRigidBody(body);

            body.id = description.id;
            _objects[body.id] = body;
            _motion_states[body.id] = motionState;

            var ptr = body.a !== undefined ? body.a : body.ptr;
            _objects_ammo[ptr] = body.id;
            _num_objects++;

            transferableMessage({
                cmd: 'objectReady',
                params: body.id
            });
        };

        public_functions.addVehicle = function(description) {
            var vehicle_tuning = new Ammo.btVehicleTuning(),
                vehicle;

            vehicle_tuning.set_m_suspensionStiffness(description.suspension_stiffness);
            vehicle_tuning.set_m_suspensionCompression(description.suspension_compression);
            vehicle_tuning.set_m_suspensionDamping(description.suspension_damping);
            vehicle_tuning.set_m_maxSuspensionTravelCm(description.max_suspension_travel);
            vehicle_tuning.set_m_maxSuspensionForce(description.max_suspension_force);

            vehicle = new Ammo.btRaycastVehicle(vehicle_tuning, _objects[description.rigidBody], new Ammo.btDefaultVehicleRaycaster(world));
            vehicle.tuning = vehicle_tuning;

            _objects[description.rigidBody].setActivationState(4);
            vehicle.setCoordinateSystem(0, 1, 2);

            world.addVehicle(vehicle);
            _vehicles[description.id] = vehicle;
        };
        public_functions.removeVehicle = function(description) {
            delete _vehicles[description.id];
        };

        public_functions.addWheel = function(description) {
            if (_vehicles[description.id] !== undefined) {
                var tuning = _vehicles[description.id].tuning;
                if (description.tuning !== undefined) {
                    tuning = new Ammo.btVehicleTuning();
                    tuning.set_m_suspensionStiffness(description.tuning.suspension_stiffness);
                    tuning.set_m_suspensionCompression(description.tuning.suspension_compression);
                    tuning.set_m_suspensionDamping(description.tuning.suspension_damping);
                    tuning.set_m_maxSuspensionTravelCm(description.tuning.max_suspension_travel);
                    tuning.set_m_maxSuspensionForce(description.tuning.max_suspension_force);
                }

                _vec3_1.setX(description.connection_point.x);
                _vec3_1.setY(description.connection_point.y);
                _vec3_1.setZ(description.connection_point.z);

                _vec3_2.setX(description.wheel_direction.x);
                _vec3_2.setY(description.wheel_direction.y);
                _vec3_2.setZ(description.wheel_direction.z);

                _vec3_3.setX(description.wheel_axle.x);
                _vec3_3.setY(description.wheel_axle.y);
                _vec3_3.setZ(description.wheel_axle.z);

                _vehicles[description.id].addWheel(
                    _vec3_1,
                    _vec3_2,
                    _vec3_3,
                    description.suspension_rest_length,
                    description.wheel_radius,
                    tuning,
                    description.is_front_wheel
                );
            }

            _num_wheels++;

            if (SUPPORT_TRANSFERABLE) {
                vehiclereport = new Float32Array(1 + _num_wheels * VEHICLEREPORT_ITEMSIZE); // message id & ( # of objects to report * # of values per object )
                vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
            } else {
                vehiclereport = [MESSAGE_TYPES.VEHICLEREPORT];
            }
        };

        public_functions.setSteering = function(details) {
            if (_vehicles[details.id] !== undefined) {
                _vehicles[details.id].setSteeringValue(details.steering, details.wheel);
            }
        };
        public_functions.setBrake = function(details) {
            if (_vehicles[details.id] !== undefined) {
                _vehicles[details.id].setBrake(details.brake, details.wheel);
            }
        };
        public_functions.applyEngineForce = function(details) {
            if (_vehicles[details.id] !== undefined) {
                _vehicles[details.id].applyEngineForce(details.force, details.wheel);
            }
        };

        public_functions.removeObject = function(details) {
            world.removeRigidBody(_objects[details.id]);
            Ammo.destroy(_objects[details.id]);
            Ammo.destroy(_motion_states[details.id]);
            if (_compound_shapes[details.id]) Ammo.destroy(_compound_shapes[details.id]);
            if (_noncached_shapes[details.id]) Ammo.destroy(_noncached_shapes[details.id]);
            var ptr = _objects[details.id].a !== undefined ? _objects[details.id].a : _objects[details.id].ptr;
            delete _objects_ammo[ptr];
            delete _objects[details.id];
            delete _motion_states[details.id];
            if (_compound_shapes[details.id]) delete _compound_shapes[details.id];
            if (_noncached_shapes[details.id]) delete _noncached_shapes[details.id];
            _num_objects--;
        };

        public_functions.updateTransform = function(details) {
            _object = _objects[details.id];
            _object.getMotionState().getWorldTransform(_transform);

            if (details.pos) {
                _vec3_1.setX(details.pos.x);
                _vec3_1.setY(details.pos.y);
                _vec3_1.setZ(details.pos.z);
                _transform.setOrigin(_vec3_1);
            }

            if (details.quat) {
                _quat.setX(details.quat.x);
                _quat.setY(details.quat.y);
                _quat.setZ(details.quat.z);
                _quat.setW(details.quat.w);
                _transform.setRotation(_quat);
            }

            _object.setWorldTransform(_transform);
            _object.activate();
        };

        public_functions.updateMass = function(details) {
            // #TODO: changing a static object into dynamic is buggy
            _object = _objects[details.id];

            // Per http://www.bulletphysics.org/Bullet/phpBB3/viewtopic.php?p=&f=9&t=3663#p13816
            world.removeRigidBody(_object);

            _vec3_1.setX(0);
            _vec3_1.setY(0);
            _vec3_1.setZ(0);

            _object.setMassProps(details.mass, _vec3_1);
            world.addRigidBody(_object);
            _object.activate();
        };

        public_functions.applyCentralImpulse = function(details) {

            _vec3_1.setX(details.x);
            _vec3_1.setY(details.y);
            _vec3_1.setZ(details.z);

            _objects[details.id].applyCentralImpulse(_vec3_1);
            _objects[details.id].activate();
        };

        public_functions.applyImpulse = function(details) {

            _vec3_1.setX(details.impulse_x);
            _vec3_1.setY(details.impulse_y);
            _vec3_1.setZ(details.impulse_z);

            _vec3_2.setX(details.x);
            _vec3_2.setY(details.y);
            _vec3_2.setZ(details.z);

            _objects[details.id].applyImpulse(
                _vec3_1,
                _vec3_2
            );
            _objects[details.id].activate();
        };

        public_functions.applyCentralForce = function(details) {

            _vec3_1.setX(details.x);
            _vec3_1.setY(details.y);
            _vec3_1.setZ(details.z);

            _objects[details.id].applyCentralForce(_vec3_1);
            _objects[details.id].activate();
        };

        public_functions.applyForce = function(details) {

            _vec3_1.setX(details.impulse_x);
            _vec3_1.setY(details.impulse_y);
            _vec3_1.setZ(details.impulse_z);

            _vec3_2.setX(details.x);
            _vec3_2.setY(details.y);
            _vec3_2.setZ(details.z);

            _objects[details.id].applyForce(
                _vec3_1,
                _vec3_2
            );
            _objects[details.id].activate();
        };

        public_functions.setAngularVelocity = function(details) {

            _vec3_1.setX(details.x);
            _vec3_1.setY(details.y);
            _vec3_1.setZ(details.z);

            _objects[details.id].setAngularVelocity(
                _vec3_1
            );
            _objects[details.id].activate();
        };

        public_functions.setLinearVelocity = function(details) {

            _vec3_1.setX(details.x);
            _vec3_1.setY(details.y);
            _vec3_1.setZ(details.z);

            _objects[details.id].setLinearVelocity(
                _vec3_1
            );
            _objects[details.id].activate();
        };

        public_functions.setAngularFactor = function(details) {

            _vec3_1.setX(details.x);
            _vec3_1.setY(details.y);
            _vec3_1.setZ(details.z);

            _objects[details.id].setAngularFactor(
                _vec3_1
            );
        };

        public_functions.setLinearFactor = function(details) {

            _vec3_1.setX(details.x);
            _vec3_1.setY(details.y);
            _vec3_1.setZ(details.z);

            _objects[details.id].setLinearFactor(
                _vec3_1
            );
        };

        public_functions.setDamping = function(details) {
            _objects[details.id].setDamping(details.linear, details.angular);
        };

        public_functions.setCcdMotionThreshold = function(details) {
            _objects[details.id].setCcdMotionThreshold(details.threshold);
        };

        public_functions.setCcdSweptSphereRadius = function(details) {
            _objects[details.id].setCcdSweptSphereRadius(details.radius);
        };

        public_functions.addConstraint = function(details) {
            var constraint;
           var transforma, transformb, rotation;
            switch (details.type) {

                case 'point':
                    if (details.objectb === undefined) {

                        _vec3_1.setX(details.positiona.x);
                        _vec3_1.setY(details.positiona.y);
                        _vec3_1.setZ(details.positiona.z);

                        constraint = new Ammo.btPoint2PointConstraint(
                            _objects[details.objecta],
                            _vec3_1
                        );
                    } else {

                        _vec3_1.setX(details.positiona.x);
                        _vec3_1.setY(details.positiona.y);
                        _vec3_1.setZ(details.positiona.z);

                        _vec3_2.setX(details.positionb.x);
                        _vec3_2.setY(details.positionb.y);
                        _vec3_2.setZ(details.positionb.z);

                        constraint = new Ammo.btPoint2PointConstraint(
                            _objects[details.objecta],
                            _objects[details.objectb],
                            _vec3_1,
                            _vec3_2
                        );
                    }
                    break;

                case 'hinge':
                    if (details.objectb === undefined) {

                        _vec3_1.setX(details.positiona.x);
                        _vec3_1.setY(details.positiona.y);
                        _vec3_1.setZ(details.positiona.z);

                        _vec3_2.setX(details.axis.x);
                        _vec3_2.setY(details.axis.y);
                        _vec3_2.setZ(details.axis.z);

                        constraint = new Ammo.btHingeConstraint(
                            _objects[details.objecta],
                            _vec3_1,
                            _vec3_2
                        );
                    } else {

                        _vec3_1.setX(details.positiona.x);
                        _vec3_1.setY(details.positiona.y);
                        _vec3_1.setZ(details.positiona.z);

                        _vec3_2.setX(details.positionb.x);
                        _vec3_2.setY(details.positionb.y);
                        _vec3_2.setZ(details.positionb.z);

                        _vec3_3.setX(details.axis.x);
                        _vec3_3.setY(details.axis.y);
                        _vec3_3.setZ(details.axis.z);

                        constraint = new Ammo.btHingeConstraint(
                            _objects[details.objecta],
                            _objects[details.objectb],
                            _vec3_1,
                            _vec3_2,
                            _vec3_3,
                            _vec3_3
                        );
                    }
                    break;

                case 'slider':
                   

                    transforma = new Ammo.btTransform();

                    _vec3_1.setX(details.positiona.x);
                    _vec3_1.setY(details.positiona.y);
                    _vec3_1.setZ(details.positiona.z);

                    transforma.setOrigin(_vec3_1);

                     rotation = transforma.getRotation();
                    rotation.setEuler(details.axis.x, details.axis.y, details.axis.z);
                    transforma.setRotation(rotation);

                    if (details.objectb) {
                        transformb = new Ammo.btTransform();

                        _vec3_2.setX(details.positionb.x);
                        _vec3_2.setY(details.positionb.y);
                        _vec3_2.setZ(details.positionb.z);

                        transformb.setOrigin(_vec3_2);

                        rotation = transformb.getRotation();
                        rotation.setEuler(details.axis.x, details.axis.y, details.axis.z);
                        transformb.setRotation(rotation);

                        constraint = new Ammo.btSliderConstraint(
                            _objects[details.objecta],
                            _objects[details.objectb],
                            transforma,
                            transformb,
                            true
                        );
                    } else {
                        constraint = new Ammo.btSliderConstraint(
                            _objects[details.objecta],
                            transforma,
                            true
                        );
                    }

                    Ammo.destroy(transforma);
                    if (transformb !== undefined) {
                        Ammo.destroy(transformb);
                    }
                    break;

                case 'conetwist':
                  
                    transforma = new Ammo.btTransform();
                    transforma.setIdentity();

                    transformb = new Ammo.btTransform();
                    transformb.setIdentity();

                    _vec3_1.setX(details.positiona.x);
                    _vec3_1.setY(details.positiona.y);
                    _vec3_1.setZ(details.positiona.z);

                    _vec3_2.setX(details.positionb.x);
                    _vec3_2.setY(details.positionb.y);
                    _vec3_2.setZ(details.positionb.z);

                    transforma.setOrigin(_vec3_1);
                    transformb.setOrigin(_vec3_2);

                     rotation = transforma.getRotation();
                    rotation.setEulerZYX(-details.axisa.z, -details.axisa.y, -details.axisa.x);
                    transforma.setRotation(rotation);

                    rotation = transformb.getRotation();
                    rotation.setEulerZYX(-details.axisb.z, -details.axisb.y, -details.axisb.x);
                    transformb.setRotation(rotation);

                    constraint = new Ammo.btConeTwistConstraint(
                        _objects[details.objecta],
                        _objects[details.objectb],
                        transforma,
                        transformb
                    );

                    constraint.setLimit(Math.PI, 0, Math.PI);

                    Ammo.destroy(transforma);
                    Ammo.destroy(transformb);

                    break;

                case 'dof':
                    
                    transforma = new Ammo.btTransform();
                    transforma.setIdentity();

                    _vec3_1.setX(details.positiona.x);
                    _vec3_1.setY(details.positiona.y);
                    _vec3_1.setZ(details.positiona.z);

                    transforma.setOrigin(_vec3_1);

                    rotation = transforma.getRotation();
                    rotation.setEulerZYX(-details.axisa.z, -details.axisa.y, -details.axisa.x);
                    transforma.setRotation(rotation);

                    if (details.objectb) {
                        transformb = new Ammo.btTransform();
                        transformb.setIdentity();

                        _vec3_2.setX(details.positionb.x);
                        _vec3_2.setY(details.positionb.y);
                        _vec3_2.setZ(details.positionb.z);

                        transformb.setOrigin(_vec3_2);

                        rotation = transformb.getRotation();
                        rotation.setEulerZYX(-details.axisb.z, -details.axisb.y, -details.axisb.x);
                        transformb.setRotation(rotation);

                        constraint = new Ammo.btGeneric6DofConstraint(
                            _objects[details.objecta],
                            _objects[details.objectb],
                            transforma,
                            transformb
                        );
                    } else {
                        constraint = new Ammo.btGeneric6DofConstraint(
                            _objects[details.objecta],
                            transforma
                        );
                    }
                    Ammo.destroy(transforma);
                    if (transformb !== undefined) {
                        Ammo.destroy(transformb);
                    }
                    break;

                default:
                    return;

            }

            world.addConstraint(constraint);

            constraint.enableFeedback();
            _constraints[details.id] = constraint;
            _num_constraints++;

            if (SUPPORT_TRANSFERABLE) {
                constraintreport = new Float32Array(1 + _num_constraints * CONSTRAINTREPORT_ITEMSIZE); // message id & ( # of objects to report * # of values per object )
                constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;
            } else {
                constraintreport = [MESSAGE_TYPES.CONSTRAINTREPORT];
            }
        };

        public_functions.removeConstraint = function(details) {
            var constraint = _constraints[details.id];
            if (constraint !== undefined) {
                world.removeConstraint(constraint);
                delete _constraints[details.id];
                _num_constraints--;
            }
        };

        public_functions.constraint_setBreakingImpulseThreshold = function(details) {
            var constraint = _constraints[details.id];
            if (constraint !== undefind) {
                constraint.setBreakingImpulseThreshold(details.threshold);
            }
        };

        public_functions.simulate = function simulate(params) {
            if (world) {
                params = params || {};

                if (!params.timeStep) {
                    if (last_simulation_time) {
                        params.timeStep = 0;
                        while (params.timeStep + last_simulation_duration <= fixedTimeStep) {
                            params.timeStep = (Date.now() - last_simulation_time) / 1000; // time since last simulation
                        }
                    } else {
                        params.timeStep = fixedTimeStep; // handle first frame
                    }
                } else {
                    if (params.timeStep < fixedTimeStep) {
                        params.timeStep = fixedTimeStep;
                    }
                }

                params.maxSubSteps = params.maxSubSteps || Math.ceil(params.timeStep / fixedTimeStep); // If maxSubSteps is not defined, keep the simulation fully up to date

                last_simulation_duration = Date.now();
                world.stepSimulation(params.timeStep, params.maxSubSteps, fixedTimeStep);

                reportVehicles();
                reportCollisions();
                reportConstraints();
                reportWorld();

                last_simulation_duration = (Date.now() - last_simulation_duration) / 1000;
                last_simulation_time = Date.now();
            }
        };


        // Constraint functions
        public_functions.hinge_setLimits = function(params) {
            _constraints[params.constraint].setLimit(params.low, params.high, 0, params.bias_factor, params.relaxation_factor);
        };
        public_functions.hinge_enableAngularMotor = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.enableAngularMotor(true, params.velocity, params.acceleration);
            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.hinge_disableMotor = function(params) {
            _constraints[params.constraint].enableMotor(false);
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };

        public_functions.slider_setLimits = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.setLowerLinLimit(params.lin_lower || 0);
            constraint.setUpperLinLimit(params.lin_upper || 0);

            constraint.setLowerAngLimit(params.ang_lower || 0);
            constraint.setUpperAngLimit(params.ang_upper || 0);
        };
        public_functions.slider_setRestitution = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.setSoftnessLimLin(params.linear || 0);
            constraint.setSoftnessLimAng(params.angular || 0);
        };
        public_functions.slider_enableLinearMotor = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.setTargetLinMotorVelocity(params.velocity);
            constraint.setMaxLinMotorForce(params.acceleration);
            constraint.setPoweredLinMotor(true);
            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.slider_disableLinearMotor = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.setPoweredLinMotor(false);
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.slider_enableAngularMotor = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.setTargetAngMotorVelocity(params.velocity);
            constraint.setMaxAngMotorForce(params.acceleration);
            constraint.setPoweredAngMotor(true);
            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.slider_disableAngularMotor = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.setPoweredAngMotor(false);
            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };

        public_functions.conetwist_setLimit = function(params) {
            _constraints[params.constraint].setLimit(params.z, params.y, params.x); // ZYX order
        };
        public_functions.conetwist_enableMotor = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.enableMotor(true);
            constraint.getRigidBodyA().activate();
            constraint.getRigidBodyB().activate();
        };
        public_functions.conetwist_setMaxMotorImpulse = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.setMaxMotorImpulse(params.max_impulse);
            constraint.getRigidBodyA().activate();
            constraint.getRigidBodyB().activate();
        };
        public_functions.conetwist_setMotorTarget = function(params) {
            var constraint = _constraints[params.constraint];

            _quat.setX(params.x);
            _quat.setY(params.y);
            _quat.setZ(params.z);
            _quat.setW(params.w);

            constraint.setMotorTarget(_quat);

            constraint.getRigidBodyA().activate();
            constraint.getRigidBodyB().activate();
        };
        public_functions.conetwist_disableMotor = function(params) {
            var constraint = _constraints[params.constraint];
            constraint.enableMotor(false);
            constraint.getRigidBodyA().activate();
            constraint.getRigidBodyB().activate();
        };

        public_functions.dof_setLinearLowerLimit = function(params) {
            var constraint = _constraints[params.constraint];

            _vec3_1.setX(params.x);
            _vec3_1.setY(params.y);
            _vec3_1.setZ(params.z);

            constraint.setLinearLowerLimit(_vec3_1);

            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.dof_setLinearUpperLimit = function(params) {
            var constraint = _constraints[params.constraint];

            _vec3_1.setX(params.x);
            _vec3_1.setY(params.y);
            _vec3_1.setZ(params.z);

            constraint.setLinearUpperLimit(_vec3_1);

            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.dof_setAngularLowerLimit = function(params) {
            var constraint = _constraints[params.constraint];

            _vec3_1.setX(params.x);
            _vec3_1.setY(params.y);
            _vec3_1.setZ(params.z);

            constraint.setAngularLowerLimit(_vec3_1);

            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.dof_setAngularUpperLimit = function(params) {
            var constraint = _constraints[params.constraint];

            _vec3_1.setX(params.x);
            _vec3_1.setY(params.y);
            _vec3_1.setZ(params.z);

            constraint.setAngularUpperLimit(_vec3_1);

            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.dof_enableAngularMotor = function(params) {
            var constraint = _constraints[params.constraint];

            var motor = constraint.getRotationalLimitMotor(params.which);
            motor.set_m_enableMotor(true);

            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.dof_configureAngularMotor = function(params) {
            var constraint = _constraints[params.constraint];

            var motor = constraint.getRotationalLimitMotor(params.which);

            motor.set_m_loLimit(params.low_angle);
            motor.set_m_hiLimit(params.high_angle);
            motor.set_m_targetVelocity(params.velocity);
            motor.set_m_maxMotorForce(params.max_force);

            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };
        public_functions.dof_disableAngularMotor = function(params) {
            var constraint = _constraints[params.constraint];

            var motor = constraint.getRotationalLimitMotor(params.which);
            motor.set_m_enableMotor(false);

            constraint.getRigidBodyA().activate();
            if (constraint.getRigidBodyB()) {
                constraint.getRigidBodyB().activate();
            }
        };

        reportWorld = function() {
            var index, object,
                transform, origin, rotation,
                offset = 0,
                i = 0;

            if (SUPPORT_TRANSFERABLE) {
                if (worldreport.length < 2 + _num_objects * WORLDREPORT_ITEMSIZE) {
                    worldreport = new Float32Array(
                        2 + // message id & # objects in report
                        (Math.ceil(_num_objects / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE) * WORLDREPORT_ITEMSIZE // # of values needed * item size
                    );
                    worldreport[0] = MESSAGE_TYPES.WORLDREPORT;
                }
            }

            worldreport[1] = _num_objects; // record how many objects we're reporting on

            //for ( i = 0; i < worldreport[1]; i++ ) {
            for (index in _objects) { //noprotect
                if (_objects.hasOwnProperty(index)) {
                    object = _objects[index];

                    // #TODO: we can't use center of mass transform when center of mass can change,
                    //        but getMotionState().getWorldTransform() screws up on objects that have been moved
                    //object.getMotionState().getWorldTransform( transform );
                    transform = object.getCenterOfMassTransform();

                    origin = transform.getOrigin();
                    rotation = transform.getRotation();

                    // add values to report
                    offset = 2 + (i++) * WORLDREPORT_ITEMSIZE;

                    worldreport[offset] = object.id;

                    worldreport[offset + 1] = origin.x();
                    worldreport[offset + 2] = origin.y();
                    worldreport[offset + 3] = origin.z();

                    worldreport[offset + 4] = rotation.x();
                    worldreport[offset + 5] = rotation.y();
                    worldreport[offset + 6] = rotation.z();
                    worldreport[offset + 7] = rotation.w();

                    _vector = object.getLinearVelocity();
                    worldreport[offset + 8] = _vector.x();
                    worldreport[offset + 9] = _vector.y();
                    worldreport[offset + 10] = _vector.z();

                    _vector = object.getAngularVelocity();
                    worldreport[offset + 11] = _vector.x();
                    worldreport[offset + 12] = _vector.y();
                    worldreport[offset + 13] = _vector.z();
                }
            }


            if (SUPPORT_TRANSFERABLE) {
                transferableMessage(worldreport.buffer, [worldreport.buffer]);
            } else {
                transferableMessage(worldreport);
            }

        };

        reportCollisions = function() {
            var i, offset,
                dp = world.getDispatcher(),
                num = dp.getNumManifolds(),
                manifold, num_contacts, j, pt,
                _collided = false;

            if (SUPPORT_TRANSFERABLE) {
                if (collisionreport.length < 2 + num * COLLISIONREPORT_ITEMSIZE) {
                    collisionreport = new Float32Array(
                        2 + // message id & # objects in report
                        (Math.ceil(_num_objects / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE) * COLLISIONREPORT_ITEMSIZE // # of values needed * item size
                    );
                    collisionreport[0] = MESSAGE_TYPES.COLLISIONREPORT;
                }
            }

            collisionreport[1] = 0; // how many collisions we're reporting on

            for (i = 0; i < num; i++) { //noprotect
                manifold = dp.getManifoldByIndexInternal(i);

                num_contacts = manifold.getNumContacts();
                if (num_contacts === 0) {
                    continue;
                }

                for (j = 0; j < num_contacts; j++) { //noprotect
                    pt = manifold.getContactPoint(j);
                    //if ( pt.getDistance() < 0 ) {
                    offset = 2 + (collisionreport[1] ++) * COLLISIONREPORT_ITEMSIZE;
                    collisionreport[offset] = _objects_ammo[manifold.getBody0()];
                    collisionreport[offset + 1] = _objects_ammo[manifold.getBody1()];

                    _vector = pt.get_m_normalWorldOnB();
                    collisionreport[offset + 2] = _vector.x();
                    collisionreport[offset + 3] = _vector.y();
                    collisionreport[offset + 4] = _vector.z();
                    break;
                    //}

                    //transferableMessage(_objects_ammo);

                }
            }


            if (SUPPORT_TRANSFERABLE) {
                transferableMessage(collisionreport.buffer, [collisionreport.buffer]);
            } else {
                transferableMessage(collisionreport);
            }
        };

        reportVehicles = function() {
            var index, vehicle,
                transform, origin, rotation,
                offset = 0,
                i = 0,
                j = 0;

            if (SUPPORT_TRANSFERABLE) {
                if (vehiclereport.length < 2 + _num_wheels * VEHICLEREPORT_ITEMSIZE) {
                    vehiclereport = new Float32Array(
                        2 + // message id & # objects in report
                        (Math.ceil(_num_wheels / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE) * VEHICLEREPORT_ITEMSIZE // # of values needed * item size
                    );
                    vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
                }
            }

            for (index in _vehicles) { //noprotect
                if (_vehicles.hasOwnProperty(index)) {
                    vehicle = _vehicles[index];

                    for (j = 0; j < vehicle.getNumWheels(); j++) { //noprotect

                        //vehicle.updateWheelTransform( j, true );

                        //transform = vehicle.getWheelTransformWS( j );
                        transform = vehicle.getWheelInfo(j).get_m_worldTransform();

                        origin = transform.getOrigin();
                        rotation = transform.getRotation();

                        // add values to report
                        offset = 1 + (i++) * VEHICLEREPORT_ITEMSIZE;

                        vehiclereport[offset] = index;
                        vehiclereport[offset + 1] = j;

                        vehiclereport[offset + 2] = origin.x();
                        vehiclereport[offset + 3] = origin.y();
                        vehiclereport[offset + 4] = origin.z();

                        vehiclereport[offset + 5] = rotation.x();
                        vehiclereport[offset + 6] = rotation.y();
                        vehiclereport[offset + 7] = rotation.z();
                        vehiclereport[offset + 8] = rotation.w();

                    }

                }
            }

            if (j !== 0) {
                if (SUPPORT_TRANSFERABLE) {
                    transferableMessage(vehiclereport.buffer, [vehiclereport.buffer]);
                } else {
                    transferableMessage(vehiclereport);
                }
            }
        };

        reportConstraints = function() {
            var index, constraint,
                offset_body,
                transform, origin,
                offset = 0,
                i = 0;

            if (SUPPORT_TRANSFERABLE) {
                if (constraintreport.length < 2 + _num_constraints * CONSTRAINTREPORT_ITEMSIZE) {
                    constraintreport = new Float32Array(
                        2 + // message id & # objects in report
                        (Math.ceil(_num_constraints / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE) * CONSTRAINTREPORT_ITEMSIZE // # of values needed * item size
                    );
                    constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;
                }
            }

            for (index in _constraints) { //noprotect
                if (_constraints.hasOwnProperty(index)) {
                    constraint = _constraints[index];
                    offset_body = constraint.getRigidBodyA();
                    transform = constraint.getFrameOffsetA();
                    origin = transform.getOrigin();

                    // add values to report
                    offset = 1 + (i++) * CONSTRAINTREPORT_ITEMSIZE;

                    constraintreport[offset] = index;
                    constraintreport[offset + 1] = offset_body.id;
                    constraintreport[offset + 2] = origin.getX();
                    constraintreport[offset + 3] = origin.getY();
                    constraintreport[offset + 4] = origin.getZ();
                    constraintreport[offset + 5] = constraint.getAppliedImpulse();
                }
            }


            if (i !== 0) {
                if (SUPPORT_TRANSFERABLE) {
                    transferableMessage(constraintreport.buffer, [constraintreport.buffer]);
                } else {
                    transferableMessage(constraintreport);
                }
            }

        };

        self.onmessage = function(event) {

            if (event.data instanceof Float32Array) {
                // transferable object

                switch (event.data[0]) {
                    case MESSAGE_TYPES.WORLDREPORT:
                        worldreport = new Float32Array(event.data);
                        break;

                    case MESSAGE_TYPES.COLLISIONREPORT:
                        collisionreport = new Float32Array(event.data);
                        break;

                    case MESSAGE_TYPES.VEHICLEREPORT:
                        vehiclereport = new Float32Array(event.data);
                        break;

                    case MESSAGE_TYPES.CONSTRAINTREPORT:
                        constraintreport = new Float32Array(event.data);
                        break;
                }

                return;
            }

            if (event.data.cmd && public_functions[event.data.cmd]) {
                //if ( event.data.params.id !== undefined && _objects[event.data.params.id] === undefined && event.data.cmd !== 'addObject' && event.data.cmd !== 'registerMaterial' ) return;
                public_functions[event.data.cmd](event.data.params);
            }

        };

    }
    //FileEnd