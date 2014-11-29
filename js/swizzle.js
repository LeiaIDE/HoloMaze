var LeiaCamera = function (fov, aspect, near, far) {
    THREE.PerspectiveCamera.call(this, fov, aspect, near, far);
    this.targetPosition = new THREE.Vector3(0, 0, 0);
}
LeiaCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
LeiaCamera.prototype.lookAt = function () {
    var m1 = new THREE.Matrix4();
    return function (vector) {
        this.targetPosition = vector;
        m1.lookAt(this.position, vector, this.up);
        this.quaternion.setFromRotationMatrix(m1);
    };
}();
LeiaCamera.prototype.clone = function (camera) {
    if (camera === undefined) camera = new LeiaCamera();
    THREE.PerspectiveCamera.prototype.clone.call(this, camera);
    camera.targetPosition.copy(this.targetPosition);
    return camera;
};

var LeiaWebGLRenderer = function (parameters) {
    parameters = parameters || {};
    THREE.WebGLRenderer.call(this, parameters);

    //0: one view 1: 64 view 2: swizzle
    if (parameters.renderMode == undefined) {
        this._renderMode = 0;
        console.log("renderMode undefined!");
    } else {
        if (parameters.renderMode <= 2) {
            this._renderMode = parameters.renderMode;
            this.bGlobalView = false;
            this.bGyroSimView = false;
        }
        else if (parameters.renderMode == 3) {
            this.bGlobalView = true;
            this.bGyroSimView = false;
            this._renderMode = 2;
        } else {
            this.bGlobalView = false;
            this.bGyroSimView = true;
            this._renderMode = 2;
        }
        console.log("setRenderMode:" + parameters.renderMode);
    }

    //0: basic; 1: sharpen; 2:supersampler
    if (parameters.shaderMode == undefined) {
        this.nShaderMode = 0;
        console.log("nShaderMode undefined!");
    } else {
        this.nShaderMode = parameters.shaderMode;
        console.log("setShaderMode:" + this.nShaderMode);
    }

    var _canvas = parameters.canvas !== undefined ? parameters.canvas : document.createElement('canvas'),
    _viewportWidth,
	_viewportHeight;
    var _that = this;
    // for 64 view YSCL
    this.setRenderMode = function (renderMode) {
        this._renderMode = renderMode;
    }
    //this.setFov = function (fov) {
    //    this.view64fov = fov;
    //}
    
    // for 64 view arrangement YSCL
    this.GGyroSimView = {
        //left: 0.75,
        //bottom: 0.5,
        //width: 0.25,
        //height: 0.25,
        left: 0.0,
        bottom: 0.0,
        width: 1.0,
        height: 1.0,
        up: [0, 1, 0],
    };
    var simulateGyro = function (object) {
        var _this = this;
        this.screen = { left: 0, top: 0, width: 0, height: 0 };
        this.screen.left = _canvas.width * _that.GGyroSimView.left;
        this.screen.top = _canvas.height * (1.0-_that.GGyroSimView.bottom - _that.GGyroSimView.height);
        this.screen.width = _canvas.width * _that.GGyroSimView.width;
        this.screen.height = _canvas.height * _that.GGyroSimView.height;
        var _lastPos = new THREE.Vector2();
        var _accuDelta = new THREE.Vector2();
        var getMouseOnScreen = (function () {
            var vector = new THREE.Vector2();
            return function (layerX, layerY) {
                vector.set(
                    (layerX - _this.screen.left) / _this.screen.width,
                    (layerY - _this.screen.top) / _this.screen.height
                );
                return vector;
            };
        }());
        function mousedown(event) {
            var leftBunder = _this.screen.left;
            var rightBunder = _this.screen.left + _this.screen.width;
            var topBunder = _this.screen.top;
            var bottomBunder = _this.screen.top + _this.screen.height;
            if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
               // event.preventDefault();
                // event.stopPropagation();
                _lastPos.copy(getMouseOnScreen(event.layerX, event.layerY));
                document.addEventListener('mousemove', mousemove, false);
                document.addEventListener('mouseup', mouseup, false);
            }
        }
        function mousemove(event) {
            var leftBunder = _this.screen.left;
            var rightBunder = _this.screen.left + _this.screen.width;
            var topBunder = _this.screen.top;
            var bottomBunder = _this.screen.top + _this.screen.height;
            if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
                event.preventDefault();
                // event.stopPropagation();
                var _curPos = new THREE.Vector2();
                _curPos.copy(getMouseOnScreen(event.layerX, event.layerY));
                var _deltaPos = new THREE.Vector2();
                _accuDelta.add(_deltaPos.subVectors(_curPos, _lastPos));
                _lastPos.copy(_curPos);
            }
        }
        function mouseup(event) {
            var leftBunder = _this.screen.left;
            var rightBunder = _this.screen.left + _this.screen.width;
            var topBunder = _this.screen.top;
            var bottomBunder = _this.screen.top + _this.screen.height;
            if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
               // event.preventDefault();
                //  event.stopPropagation();
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
            }
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', mouseup);
        }
        _that.GyroRealRoll = 0;
        _that.GyroRealPitch = 0;
        _that.GyroRealYaw = 0;
        this.update = function () {
            this.screen.left = _canvas.width * _that.GGyroSimView.left;
            this.screen.top = _canvas.height * (1.0-_that.GGyroSimView.bottom - _that.GGyroSimView.height);
            this.screen.width = _canvas.width * _that.GGyroSimView.width;
            this.screen.height = _canvas.height * _that.GGyroSimView.height;

            _that.GyroSimRoll = _accuDelta.y * 30;
            _that.GyroSimPitch = _accuDelta.x * -30;
            _that.GyroSimYaw = 0;

            object.quaternion.setFromEuler(new THREE.Euler(THREE.Math.degToRad(_that.GyroSimRoll + _that.GyroRealRoll), 0, THREE.Math.degToRad(_that.GyroSimPitch + _that.GyroRealPitch)));
        }
        document.addEventListener('mousedown', mousedown, false);
        this.update();
    }

    // global view
    this.GObserveView = {
        left: 0.0,
        bottom: 0.0,
        width: 1.0,
        height: 1.0,
        //bottom: 0.5,
        //width: 0.25,
        //height: 0.25,
        up: [0, 1, 0],
    };
   // this.spanSphereMode = false;
    
    this.Leia_setSize = function (width, height, updateStyle) {
        _canvas.width = width * this.devicePixelRatio;
        _canvas.height = height * this.devicePixelRatio;
        _viewportWidth = _canvas.width,
        _viewportHeight = _canvas.height;
        if (updateStyle !== false) {
            _canvas.style.width = width + 'px';
            _canvas.style.height = height + 'px';
        }
        this.setSize(width, height, updateStyle);
        if (this._shaderManager !== undefined)
            this._shaderManager.changeSzie(width, height);
    };

    //this.nShaderMode = 0; // 0:basic; 1:sharpen; 2:surpersample
    this._shaderManager = undefined;
    this.bShaderManInit = false;
    
    this.getCameraPosition = function (position, targetPosition, up, npart, xIndex, yIndex, Gradient, EachTarPos, spanMode, shiftX, shiftY) {
        if (position.x == 0 && position.y != 0 && position.z == 0) {
            position.z = position.y / 100;
        }
        //var scale = this.view64fov / (npart - 1);
        var scale = _that._holoCamCenter.fov / (npart - 1);
        
        var mat20, mat21, mat22;
        var v0, v1, v2;
        v0 = mat20 = position.x - targetPosition.x;
        v1 = mat21 = position.y - targetPosition.y;
        v2 = mat22 = position.z - targetPosition.z;
        var len = Math.sqrt(mat20 * mat20 + mat21 * mat21 + mat22 * mat22);
        mat20 /= len;
        mat21 /= len;
        mat22 /= len;
        var mat00, mat01, mat02;
        mat00 = mat22;
        mat01 = 0;
        mat02 = -mat20;
        if (v1 > 0 && v1 >= Math.abs(v0) * 2 && v1 >= Math.abs(v2) * 2) {
            mat00 = mat21;
            mat01 = -mat20;
            mat02 = 0;
        }
        len = Math.sqrt(mat00 * mat00 + mat02 * mat02);
        mat00 /= len;
        mat01 /= len;
        mat02 /= len;
        var mat10, mat11, mat12;
        mat10 = mat21 * mat02;
        mat11 = mat22 * mat00 - mat20 * mat02;
        mat12 = -mat21 * mat00;
        len = Math.sqrt(mat10 * mat10 + mat11 * mat11 + mat12 * mat12);
        mat10 /= len;
        mat11 /= len;
        mat12 /= len;

        // baseline
        len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
        var halfRange = Math.tan(THREE.Math.degToRad(3.5 * scale)) * len;
        var baseLine = halfRange / 3.5;

        // add cam here
        if (shiftX == undefined)
            shiftX = 0;
        if (shiftY == undefined)
            shiftY = 0;
        var curX = xIndex - 3.5 + shiftX;
        var curY = yIndex - 3.5 + shiftY;
        //var curXAng = curY * scale;
        //var curYAng = curX * scale;
        var curXRange = curY * baseLine;
        var curYRange = curX * baseLine;
        var curXAng = THREE.Math.radToDeg(Math.atan(curXRange / len) );
        var curYAng = THREE.Math.radToDeg(Math.atan(curYRange / len) );

        len = v0 * v0 + v1 * v1 + v2 * v2;
        var phi = curYAng;
        var alpha = curXAng;
        var u0, u1, u2;
        var theta = 90 - Math.atan(Math.tan(THREE.Math.degToRad(alpha)) * Math.cos(THREE.Math.degToRad(phi))) * 180 / Math.PI;
        u0 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta)) * Math.sin(THREE.Math.degToRad(phi));
        u1 = Math.sqrt(len) * Math.cos(THREE.Math.degToRad(theta));
        u2 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta)) * Math.cos(THREE.Math.degToRad(phi));
        if (!spanMode) {
            u0 = Math.sqrt(len) * Math.tan(THREE.Math.degToRad(phi));;
            u1 = Math.sqrt(len) / (Math.tan(THREE.Math.degToRad(theta)) * Math.cos(THREE.Math.degToRad(phi)));;
            u2 = Math.sqrt(len);
        }
        var s0, s1, s2;
        s0 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta) - 1.0) * Math.sin(THREE.Math.degToRad(phi));
        s1 = Math.sqrt(len) * Math.cos(THREE.Math.degToRad(theta) - 1.0);
        s2 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta) - 1.0) * Math.cos(THREE.Math.degToRad(phi));
        var t0, t1, t2;
        t0 = mat00 * s0 + mat10 * s1 + mat20 * s2 + targetPosition.x;
        t1 = mat11 * s1 + mat21 * s2 + targetPosition.y;
        t2 = mat02 * s0 + mat12 * s1 + mat22 * s2 + targetPosition.z;
        Gradient.x = t0;
        Gradient.y = t1;
        Gradient.z = t2;
        var w0, w1, w2;
        w0 = mat00 * u0 + mat10 * u1 + mat20 * u2 + targetPosition.x;
        w1 = mat11 * u1 + mat21 * u2 + targetPosition.y;
        w2 = mat02 * u0 + mat12 * u1 + mat22 * u2 + targetPosition.z;
        var outPosition = new THREE.Vector3();
        outPosition.x = w0;
        outPosition.y = w1;
        outPosition.z = w2;
        var _eachTarPos = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
        _eachTarPos.add(outPosition.clone().sub(position));
        EachTarPos.copy(_eachTarPos);

        return outPosition;
    }
    this.getCameraIntrinsic = function (camera, _tarObj, _i, _j) {
        //if (_i == 0 && _j == 0) {
        //    //console.log("_tarObj.geometry.vertices ", _i, _j, _tarObj.geometry.vertices[3]);
        //    //console.log("camera.matrix ", _i, _j, camera.matrix.elements);
        ////    console.log("_tarObj.matrix ", _i, _j, _tarObj.matrix.elements);
        //}

        var _local_lrbt = [];
        for (var i = 0; i < 4; i++) {
            var point = new THREE.Vector3();
            _local_lrbt.push(point);
        }
       // if (screen[0] !== undefined) {
            var camMat = new THREE.Matrix4();
            camMat.getInverse(camera.matrix);

            camMat.multiply(_tarObj.matrix);
            //if (_i == 0 && _j == 0) {
            //    console.log("camMat ", _i, _j, camMat.elements);
            //}
            for (var i = 0; i < 4; i++) {
               // _local_lrbt[i].copy(screen[i]);
                var __point = new THREE.Vector3(_tarObj.geometry.vertices[i].x, _tarObj.geometry.vertices[i].y, _tarObj.geometry.vertices[i].z);
                _local_lrbt[i].copy(__point);
            }
            for (var i = 0; i < 4; i++) {
                _local_lrbt[i].applyMatrix4(camMat);
            }
      //  }
        var n = camera.near;
        var f = camera.far;
        var d = 0;
        if (_local_lrbt[0] !== undefined) {
            var r = _local_lrbt[3].x;
            var l = _local_lrbt[2].x;
            var t = _local_lrbt[1].y;
            var b = _local_lrbt[3].y;
            d = -1 * _local_lrbt[3].z;
            var m11 = 2 * d / (r - l); var m12 = 0;               var m13 = (r + l) / (r - l); var m14 = 0;
            var m21 = 0;               var m22 = 2 * d / (t - b); var m23 = (t + b) / (t - b); var m24 = 0;
            var m31 = 0;               var m32 = 0;               var m33 = (f + n) / (n - f); var m34 = 2 * f * n / (n - f);
            var m41 = 0;               var m42 = 0;               var m43 = -1;                var m44 = 0;
            camera.projectionMatrix.set(m11, m12, m13, m14,
                                        m21, m22, m23, m24,
                                        m31, m32, m33, m34,
                                        m41, m42, m43, m44);
        }
        //camera.near = d * 0.6 ;
        //camera.far = d * 3.0 ;
        camera.near = d * 0.6;
        camera.far = d * 1.15;
        //if (_i == 0 && _j == 0) {
        //    console.log("d ", d);
        //    console.log("camera.near ", n);
        //    console.log("camera.far ", f);
        //}
        //camera.updateProjectionMatrix();
        return d;
    }

    // Global view interaction, Gyro simulation signal generator&visual indicator, and MultiView Rendering
    // global view
    
    this._holoScreen = undefined;
    this.bHoloScreenInit = false;
    var CHoloScreen = function (camera, _sizeX) {
        this.position = new THREE.Vector3(0, 0, 0);
        this.position.copy(camera.targetPosition);
        this.scale = 1.0;
		var originSize = _sizeX;
        this.sizeX = _sizeX;

        //var __point = new THREE.Vector3();
        //__point.copy(camera.position.clone().sub(camera.targetPosition));
        //var _length = __point.length() / 2;

        var _length = this.sizeX / 4.0;
        var geoTarRect = new THREE.PlaneGeometry(1 * _length * 4, 1 * _length * 3, 1, 1);
      //  var matTarRect = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide, overdraw: 0.5 });
        var matTarRect = new THREE.MeshBasicMaterial({ color: 0x0066aa, transparent: true, opacity: 0.2 });//0x4BD121
        matTarRect.side = THREE.DoubleSide;
        this.tarObj = new THREE.Mesh(geoTarRect, matTarRect);
        this.tarObj.name = "tarPlane";
        this.tarObj.visible = true;
        this.tarObj.rotation.setFromRotationMatrix(camera.matrix);
        this.tarObj.position.set(this.position.x, this.position.y, this.position.z);
        this.tarObj.scale.x = this.scale;
        this.tarObj.scale.y = this.scale;
        this.tarObj.scale.z = this.scale;
        this.tarObj.updateMatrix();

        this.getData = function () {
            this.position.copy(this.tarObj.position);
            //save var _tarPosition in index here 
            this.scale = this.tarObj.scale.x;
            //save var _holoScreenSize in index here 
            this.sizeX = originSize * this.scale;
            this.tarObj.rotation.setFromRotationMatrix(camera.matrix);        
        }
        this.setData = function () {
            this.tarObj.position.copy(this.position);
            //save var _tarPosition in index here 
            this.tarObj.scale.x = this.scale;
			this.tarObj.scale.y = this.scale;
			this.tarObj.scale.z = this.scale;
            //save var _holoScreenSize in index here
			this.sizeX = originSize * this.scale;
            this.tarObj.rotation.setFromRotationMatrix(camera.matrix);
        }
    }

    this._holoCamCenter = undefined;
    this.bHoloCamCenterInit = false;
    var CHoloCamCenter = function (camera, _fov) {
        this.position = new THREE.Vector3();
        this.position.copy(camera.position);
        this.fov = _fov;
        this.spanSphereMode = false;
        //_that.view64fov = this.fov;_that.spanSphereMode

        var __point = new THREE.Vector3();
        __point.copy(camera.position.clone().sub(camera.targetPosition));
        var _length = __point.length() / 2;
        var EyeCenterSize = _length / 80;
        var geoEyeCenter = new THREE.SphereGeometry(EyeCenterSize, 32, 32);
        var matEyeCenter = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: false, opacity: 0.8 });//0x4BD121
        this.eyeCenter = new THREE.Mesh(geoEyeCenter, matEyeCenter);
        this.eyeCenter.position.set(this.position.x, this.position.y, this.position.z);
        this.eyeCenter.name = "eyeCenter";
        this.eyeCenter.visible = true;
        this.eyeCenter.updateMatrix();

        this.getData = function () {
            this.position.copy(this.eyeCenter.position);
            //this.fov = _that.view64fov;
        }
        this.setData = function () {
            this.eyeCenter.position.copy(this.position);
            //_that.view64fov  = this.fov;
        }
    }

    this.bGlobalViewInit = false;
    var _globalView;
    var CGlobalView = function (camera, scene, renderTarget, forceClear) {
        var npart = 8;
        this.camMeshs64 = [];
        this.ObjMesh2 = [];
        this.Gcamera = new THREE.PerspectiveCamera(90, _canvas.width / _canvas.height, 0.01, 40000);

        this.init = function () {
            var vecCend = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
            var vecGT = new THREE.Vector3((camera.position.x + camera.targetPosition.x) / 2, (camera.position.y + camera.targetPosition.y) / 2, (camera.position.z + camera.targetPosition.z) / 2);
            vecCend.x -= vecGT.x;
            vecCend.y -= vecGT.y;
            vecCend.z -= vecGT.z;
            var vecUp = new THREE.Vector3(0, -vecCend.z, vecCend.y);
            var lengthVecUp = Math.sqrt(vecUp.x * vecUp.x + vecUp.y * vecUp.y + vecUp.z * vecUp.z);
            vecUp.x /= lengthVecUp;
            vecUp.y /= lengthVecUp;
            vecUp.z /= lengthVecUp;
            var __length = Math.sqrt(vecCend.x * vecCend.x + vecCend.y * vecCend.y + vecCend.z * vecCend.z);
            vecUp.x = vecUp.x * 2 * __length + vecGT.x;
            vecUp.y = vecUp.y * 2 * __length + vecGT.y;
            vecUp.z = vecUp.z * 2 * __length + vecGT.z;
            this.Gcamera = new THREE.PerspectiveCamera(90, _canvas.width / _canvas.height, 0.01, 40000);
            this.Gcamera.position.x = vecUp.x;
            this.Gcamera.position.y = vecUp.y;
            this.Gcamera.position.z = vecUp.z;
            this.Gcamera.up.x = vecCend.x;
            this.Gcamera.up.y = vecCend.y;
            this.Gcamera.up.z = vecCend.z;
            this.Gcamera.lookAt(new THREE.Vector3(vecGT.x, vecGT.y, vecGT.z));
            this.LocalControls = new dragControls(this.Gcamera);
            this.LocalControls.screen.left = 0;
            this.LocalControls.screen.top = _canvas.height * (1.0 - _that.GObserveView.bottom - _that.GObserveView.height);
            this.LocalControls.screen.width = _canvas.width * _that.GObserveView.width;
            this.LocalControls.screen.height = _canvas.height * _that.GObserveView.height;
            this.camControls = new pickControls(this.Gcamera, undefined, __length / 5);
            //this.camControls.view64fov = _that.view64fov;
            this.camControls.view64fov = _that._holoCamCenter.fov;
            this.camControls.spanSphereMode = _that._holoCamCenter.spanSphereMode;
            this.camControls.screen.left = 0;
            this.camControls.screen.top = _canvas.height * (1.0 - _that.GObserveView.bottom - _that.GObserveView.height);
            this.camControls.screen.width = _canvas.width * _that.GObserveView.width;
            this.camControls.screen.height = _canvas.height * _that.GObserveView.height;
            this.tarControls = new pickControls(this.Gcamera, undefined, __length / 2.5);
            this.tarControls.screen.left = 0;
            this.tarControls.screen.top = _canvas.height * (1.0 - _that.GObserveView.bottom - _that.GObserveView.height);
            this.tarControls.screen.width = _canvas.width * _that.GObserveView.width;
            this.tarControls.screen.height = _canvas.height * _that.GObserveView.height;

            // add virtual cams
            var camGeometry = new THREE.CylinderGeometry(0, __length / 40, __length / 20, 20);
            camGeometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0)));
            var camMaterial = new THREE.MeshNormalMaterial();
            var bHasCam = false;
            var obj, subObj, tarId;
            for (var _i = 0, _l = scene.children.length; _i < _l; _i++) {
                obj = scene.children[_i];
                if (obj == camera) {
                    bHasCam = true;
                }
            }
            if (!bHasCam) {
                for (var _ii = 0, _ll = scene.children.length; _ii < _ll; _ii++) {
                    obj = scene.children[_ii];
                    for (var _jj = 0, lll = obj.children.length; _jj < lll; _jj++) {
                        subObj = obj.children[_jj];
                        if (subObj == camera) {
                            tarId = _ii;
                        }
                    }
                }
            }

            var spanM = _that._holoCamCenter.spanSphereMode;
            for (var i = 0; i < npart; i++)
                for (var j = 0; j < npart; j++) {
                    var mesh = new THREE.Mesh(camGeometry, camMaterial);
                    var Gradient = new THREE.Vector3();
                    var EachTarPos = new THREE.Vector3();
                    var meshPosition = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanM);
                    mesh.position.x = meshPosition.x;
                    mesh.position.y = meshPosition.y;
                    mesh.position.z = meshPosition.z;
                    mesh.lookAt(EachTarPos);
                    this.camMeshs64.push(mesh);
                    if (bHasCam || tarId == undefined)
                        scene.add(mesh);
                    else
                        scene.children[tarId].add(mesh);
                   
                    var meshSX = mesh.clone();
                    var meshPosSX = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanM, 0.5, 0);
                    meshSX.position.x = meshPosSX.x;
                    meshSX.position.y = meshPosSX.y;
                    meshSX.position.z = meshPosSX.z;
                    meshSX.lookAt(EachTarPos);
                    this.camMeshs64.push(meshSX);
                    var meshSY = mesh.clone();
                    var meshPosSY = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanM, 0, -0.5);
                    meshSY.position.x = meshPosSY.x;
                    meshSY.position.y = meshPosSY.y;
                    meshSY.position.z = meshPosSY.z;
                    meshSY.lookAt(EachTarPos);
                    this.camMeshs64.push(meshSY);
                    var meshSXY = mesh.clone();
                    var meshPosSXY = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanM, 0.5, -0.5);
                    meshSXY.position.x = meshPosSXY.x;
                    meshSXY.position.y = meshPosSXY.y;
                    meshSXY.position.z = meshPosSXY.z;
                    meshSXY.lookAt(EachTarPos);
                    this.camMeshs64.push(meshSXY);
                    if (bHasCam || tarId == undefined) {
                        scene.add(meshSX);
                        scene.add(meshSY);
                        scene.add(meshSXY);
                    }
                    else {
                        scene.children[tarId].add(meshSX);
                        scene.children[tarId].add(meshSY);
                        scene.children[tarId].add(meshSXY);
                    }

                    if (_that.nShaderMode == 0 || _that.nShaderMode == 1 || _that.nShaderMode == 5) {
                        meshSX.visible = false;
                        meshSY.visible = false;
                        meshSXY.visible = false;
                    }
                }
            //============
            //this.ObjMesh2.push(EyeCenter);
            this.ObjMesh2.push(_that._holoCamCenter.eyeCenter);
            //this.ObjMesh2.push(tarRect2);
            this.ObjMesh2.push(_that._holoScreen.tarObj);

            this.camControls.attach(this.ObjMesh2[0], false);
            this.tarControls.attach(this.ObjMesh2[1], false);
            this.ObjMesh2[0].visible = false;
            this.ObjMesh2[1].visible = false;
            if (bHasCam || tarId == undefined) {
                scene.add(this.ObjMesh2[0]);
                scene.add(this.ObjMesh2[1]);
                scene.add(this.camControls);
                scene.add(this.tarControls);
            } else {
                scene.children[tarId].add(this.ObjMesh2[0]);
                scene.children[tarId].add(this.ObjMesh2[1]);
                scene.children[tarId].add(this.camControls);
                scene.children[tarId].add(this.tarControls);
            }
            //============
        }
        this.init();

        this.update = function () {
            var spanMode = _that._holoCamCenter.spanSphereMode;
            var _left = Math.floor(_canvas.width * _that.GObserveView.left);
            var _bottom = Math.floor(_canvas.height * _that.GObserveView.bottom);
            var _width = Math.floor(_canvas.width * _that.GObserveView.width);
            var _height = Math.floor(_canvas.height * _that.GObserveView.height);
            _that.setViewport(_left, _bottom, _width, _height);
            _that.setScissor(_left, _bottom, _width, _height);
            _that.enableScissorTest(true);
            _that.setClearColor(new THREE.Color().setRGB(0.11, 0.12, 0.18));
            this.Gcamera.aspect = _width / _height;
            this.Gcamera.updateProjectionMatrix();
            for (var i = 0; i < npart; i++)
                for (var j = 0; j < npart; j++) {
                    var Gradient = new THREE.Vector3();
                    var EachTarPos = new THREE.Vector3();
                    if (_that.nShaderMode == 0 || _that.nShaderMode == 1 || _that.nShaderMode == 5) {
                        var meshPosition = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode);
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.x = meshPosition.x;
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.y = meshPosition.y;
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.z = meshPosition.z;
                        this.camMeshs64[(i * npart + j) * 4 + 0].lookAt(EachTarPos);
                        this.camMeshs64[(i * npart + j) * 4 + 1].visible = false;
                        this.camMeshs64[(i * npart + j) * 4 + 2].visible = false;
                        this.camMeshs64[(i * npart + j) * 4 + 3].visible = false;
                    }else {
                       // this.camMeshs64[(i * npart + j) * 4 + 0].visible = true;
                        this.camMeshs64[(i * npart + j) * 4 + 1].visible = true;
                        this.camMeshs64[(i * npart + j) * 4 + 2].visible = true;
                        this.camMeshs64[(i * npart + j) * 4 + 3].visible = true;
                        var meshPosition = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode);
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.x = meshPosition.x;
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.y = meshPosition.y;
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.z = meshPosition.z;
                        this.camMeshs64[(i * npart + j) * 4 + 0].lookAt(EachTarPos);

                        var meshPosSX = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode, 0.5, 0);
                        this.camMeshs64[(i * npart + j) * 4 + 1].position.x = meshPosSX.x;
                        this.camMeshs64[(i * npart + j) * 4 + 1].position.y = meshPosSX.y;
                        this.camMeshs64[(i * npart + j) * 4 + 1].position.z = meshPosSX.z;
                        this.camMeshs64[(i * npart + j) * 4 + 1].lookAt(EachTarPos);

                        var meshPosSY = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode, 0, -0.5);
                        this.camMeshs64[(i * npart + j) * 4 + 2].position.x = meshPosSY.x;
                        this.camMeshs64[(i * npart + j) * 4 + 2].position.y = meshPosSY.y;
                        this.camMeshs64[(i * npart + j) * 4 + 2].position.z = meshPosSY.z;
                        this.camMeshs64[(i * npart + j) * 4 + 2].lookAt(EachTarPos);

                        var meshPosSXY = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode, 0.5, -0.5);
                        this.camMeshs64[(i * npart + j) * 4 + 3].position.x = meshPosSXY.x;
                        this.camMeshs64[(i * npart + j) * 4 + 3].position.y = meshPosSXY.y;
                        this.camMeshs64[(i * npart + j) * 4 + 3].position.z = meshPosSXY.z;
                        this.camMeshs64[(i * npart + j) * 4 + 3].lookAt(EachTarPos);
                    }
                }
            this.LocalControls.enabled = true;
            if (this.tarControls.axis != null || this.camControls.axis != null)
                this.LocalControls.enabled = false;

            //vvv
            this.LocalControls.screen.left = 0;
            this.LocalControls.screen.top = _canvas.height * (1.0 - _that.GObserveView.bottom - _that.GObserveView.height);
            this.LocalControls.screen.width = _canvas.width * _that.GObserveView.width;
            this.LocalControls.screen.height = _canvas.height * _that.GObserveView.height;
            this.LocalControls.update();
            this.camControls.screen.left = 0;
            this.camControls.screen.top = _canvas.height * (1.0 - _that.GObserveView.bottom - _that.GObserveView.height);
            this.camControls.screen.width = _canvas.width * _that.GObserveView.width;
            this.camControls.screen.height = _canvas.height * _that.GObserveView.height;
            this.camControls.update();
           // _that.view64fov = this.camControls.view64fov;
            _that._holoCamCenter.fov = this.camControls.view64fov;
            _that._holoCamCenter.spanSphereMode = this.camControls.spanSphereMode;

            this.tarControls.screen.left = 0;
            this.tarControls.screen.top = _canvas.height * (1.0 - _that.GObserveView.bottom - _that.GObserveView.height);
            this.tarControls.screen.width = _canvas.width * _that.GObserveView.width;
            this.tarControls.screen.height = _canvas.height * _that.GObserveView.height;
            this.tarControls.update();
            camera.position.copy(this.camControls.object.position);
            camera.targetPosition.copy(this.tarControls.object.position);
            camera.lookAt(camera.targetPosition);

            //_that._holoScreen.tarObj = this.tarControls.object;
            //_that._holoScreen.tarObj.rotation.setFromRotationMatrix(camera.matrix);
            //_that._holoScreen.getData();
            //_that._holoCamCenter.getData();

            if (_that.bGlobalView)
                _that.render(scene, this.Gcamera, renderTarget, forceClear);
        }

        var lastBgView, lastBgyro;
        if (_that.bHidePanels) {
            lastBgView = _that.bGlobalView;
            lastBgyro = _that.bGyroSimView;
        }
        document.addEventListener('keydown', onDocumentKeyDown, false);
        function onDocumentKeyDown(event) {
            var keyCode = event.which;
            //console.log(keyCode);
            switch (keyCode) {
                case 27: // escape key
                    //case 32: // ' '
                case 71: // 'g'                
                    _that.bHidePanels = !_that.bHidePanels;
                    if (_that.bHidePanels) {
                        lastBgView = _that.bGlobalView;
                        lastBgyro = _that.bGyroSimView;
                        _that.bGlobalView = false;
                        _that.bGyroSimView = false;
                    }
                    if (!_that.bHidePanels) {
                        _that.bGlobalView = lastBgView;
                        _that.bGyroSimView = lastBgyro;
                    }
                    break;
                case 82: // 'r'
                    _that.bRendering = !_that.bRendering;
                    break;
            }
        }
    }
    this.bHidePanels = false;
    // Gyro simulation
    this.bGyroSimViewInit = false;
    var _gyroView;
    var CGyroView = function (renderTarget, forceClear) {
        this.init = function () {
            this.GyroSimCam = new THREE.PerspectiveCamera(90, _canvas.width / _canvas.height, 0.01, 10000);
            this.GyroSimCam.position.x = 0;
            this.GyroSimCam.position.y = 0;
            this.GyroSimCam.position.z = 20;
            this.GyroSimCam.up.x = 0;
            this.GyroSimCam.up.y = 1;
            this.GyroSimCam.up.z = 0;

            this.GyroSimScene = new THREE.Scene();
            this.GyroSimCam.lookAt(this.GyroSimScene.position);
            this.GyroSimScene.add(this.GyroSimCam);
            var boxScale = 1;
            var boxX = 10, boxY = 2, boxZ = 10;
            var geoBox = new THREE.BoxGeometry(boxX * boxScale, boxY * boxScale, boxZ * boxScale);
            var materBox = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.8, specular: 0xeeeeff, shininess: 20 });//0x4BD121
            this.GyroBox = new THREE.Mesh(geoBox, materBox);
            this.GyroSimScene.add(this.GyroBox);
            this.localSim = new simulateGyro(this.GyroBox);
            var light = new THREE.DirectionalLight(0xffffff);
            light.position.set(0, 5, 5);
            this.GyroSimScene.add(light);
        }
        this.init();
        this.update = function () {
            var _left = Math.floor(_canvas.width * _that.GGyroSimView.left);
            var _bottom = Math.floor(_canvas.height * _that.GGyroSimView.bottom);
            var _width = Math.floor(_canvas.width * _that.GGyroSimView.width);
            var _height = Math.floor(_canvas.height * _that.GGyroSimView.height);
            _that.setViewport(_left, _bottom, _width, _height);
            _that.setScissor(_left, _bottom, _width, _height);
            _that.enableScissorTest(true);
            _that.setClearColor(new THREE.Color().setRGB(0.11, 0.12, 0.18));
            this.GyroSimCam.aspect = _width / _height;
            this.GyroSimCam.updateProjectionMatrix();
            this.localSim.update();
            if (_that.bGyroSimView)
                _that.render(this.GyroSimScene, this.GyroSimCam, renderTarget, forceClear);
        }
    }
        
    // rendering
    var Leia_compute_renderViews = function (scene, camera, renderTarget, forceClear, shiftX, shiftY, _npart) {
        var spanMode = _that._holoCamCenter.spanSphereMode;
        var camPositionCenter = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        var tmpM = new THREE.Matrix4();
        var tmpV = new THREE.Vector3(camPositionCenter.x - camera.targetPosition.x, camPositionCenter.y - camera.targetPosition.y, camPositionCenter.z - camera.targetPosition.z);
        var npart = 8;
        if (_npart !== undefined)
            npart = _npart;
        var _d = 0;
        if (shiftX == undefined)
            shiftX = 0;
        if (shiftY == undefined)
            shiftY = 0;

        camera.updateMatrix();
        _that._holoScreen.tarObj.rotation.setFromRotationMatrix(camera.matrix);
        _that._holoScreen.tarObj.updateMatrix();
        for (var ii = 0; ii < npart; ii++)
            for (var jj = 0; jj < npart; jj++) {
                if (renderTarget !== undefined) {
                    _that.setViewport(renderTarget.width / npart * ii, renderTarget.height / npart * jj, renderTarget.width / npart, renderTarget.height / npart);// debug shadow, modify _viewport*** here
                    _that.setScissor(renderTarget.width / npart * ii, renderTarget.height / npart * jj, renderTarget.width / npart, renderTarget.height / npart);
                } else {
                    _that.setViewport(_canvas.width / npart * ii, _canvas.height / npart * jj, _canvas.width / npart, _canvas.height / npart);// debug shadow, modify _viewport*** here
                    _that.setScissor(_viewportWidth / npart * ii, _viewportHeight / npart * jj, _viewportWidth / npart, _viewportHeight / npart);
                }
                _that.enableScissorTest(true);
                var Gradient = new THREE.Vector3();
                var EachTarPos = new THREE.Vector3();
                var camPosition = _that.getCameraPosition(camPositionCenter, camera.targetPosition, camera.up, npart, ii, jj, Gradient, EachTarPos, spanMode, shiftX, shiftY);
                camera.position.x = camPosition.x;
                camera.position.y = camPosition.y;
                camera.position.z = camPosition.z;
               
                tmpM.lookAt(camera.position, EachTarPos, camera.up);
                camera.quaternion.setFromRotationMatrix(tmpM);
                camera.updateMatrix();
               // _that._holoScreen.tarObj.updateMatrix();
                //if(ii == 0&&jj==0)
                //    console.log("_tarObj.geometry.vertices ", ii, jj, _that._holoScreen.tarObj.geometry.vertices[3]);
                if (_that._holoScreen.tarObj.geometry.vertices[0] !== undefined) {
                    _d = _that.getCameraIntrinsic(camera, _that._holoScreen.tarObj, ii, jj);
                }
                //if (renderTarget == _swizzleRenderTarget || renderTarget == _swizzleRenderTargetSftX || renderTarget == _swizzleRenderTargetSftY || renderTarget == _swizzleRenderTargetSftXY) {
                if (renderTarget !== undefined) {
                    renderTarget.sx = renderTarget.width / npart * ii;
                    renderTarget.sy = renderTarget.height / npart * jj;
                    renderTarget.w = renderTarget.width / npart;
                    renderTarget.h = renderTarget.height / npart;
                }
                
                _that.render(scene, camera, renderTarget, forceClear);
            }
        camera.position.x = camPositionCenter.x;
        camera.position.y = camPositionCenter.y;
        camera.position.z = camPositionCenter.z;
        camera.up.set(0, 1, 0);
        if (tmpV.y > 0 && tmpV.y >= Math.abs(tmpV.x) * 2 && tmpV.y >= Math.abs(tmpV.z) * 2) {
            camera.up.set(0, 0, -1);
        }
        camera.lookAt(camera.targetPosition);
    }

    this.stateData = {};
	this.messageFlag = 0;
	this.SetUpRenderStates = function (scene, camera, renderTarget, forceClear, holoScreenSize, holoCamFov, messageFlag){
		
		var _holoCamFov = 50;
		var _holoScreenScale = 1;
		if (holoCamFov !== undefined)
            _holoCamFov = holoCamFov;
        //if (holoScreenScale !== undefined)
	    //    _holoScreenScale = holoScreenScale;
		var _holoScreenSize = 100;
		if (holoScreenSize !== undefined)
		    _holoScreenSize = holoScreenSize;
		if (camera.position.x == 0 && camera.position.y != 0 && camera.position.z == 0)
                camera.position.z = camera.position.y / 100;
		if (!this.bHoloCamCenterInit) {
			this._holoCamCenter = new CHoloCamCenter(camera, _holoCamFov);
			this.bHoloCamCenterInit = true;
			this.stateData._camFov = this._holoCamCenter.fov;
			this.stateData._camPosition = new THREE.Vector3(0, 0, 0);
			this.stateData._camPosition.copy(this._holoCamCenter.position);
		}
		if ((!this.bHoloScreenInit) && camera.position.length() >= 0) {
		    this._holoScreen = new CHoloScreen(camera, _holoScreenSize);
			this.bHoloScreenInit = true;
			this.stateData._holoScreenScale = this._holoScreen.scale;
			this.stateData._holoScreenSize = this._holoScreen.sizeX;
			this.stateData._tarPosition = new THREE.Vector3(0, 0, 0);
			this.stateData._tarPosition.copy(this._holoScreen.position);
			scene.add(this._holoScreen.tarObj);
			this._holoScreen.tarObj.visible = false;
		}
		if (!this.bShaderManInit) {
			this._shaderManager = new CShaderManager(_that, _viewportWidth, _viewportHeight);
			this.bShaderManInit = true;
		}
		
		//passing parameters
		if(messageFlag == undefined){
			console.log("messageFlag undefined");
		}else if(messageFlag == 0){  //IDE
			
			this._holoScreen.getData();
            this._holoCamCenter.getData();
			
			var bStateChange = false;
			if(this.stateData._camFov != this._holoCamCenter.fov || this.stateData._holoScreenScale != this._holoScreen.scale){
				bStateChange = true;
			}
			if(this.stateData._camPosition.x != this._holoCamCenter.position.x || this.stateData._camPosition.y != this._holoCamCenter.position.y || this.stateData._camPosition.z != this._holoCamCenter.position.z){
				bStateChange = true;
			}
			if(this.stateData._tarPosition.x != this._holoScreen.position.x || this.stateData._tarPosition.y != this._holoScreen.position.y || this.stateData._tarPosition.z != this._holoScreen.position.z){
				bStateChange = true;
			}
			
			//post to top window, modify code in IDE
			if(bStateChange == true){
				var message = JSON.stringify({type:'tuning', data:{_camFov:this._holoCamCenter.fov,
				_camPosition:{x:this._holoCamCenter.position.x,y:this._holoCamCenter.position.y,z:this._holoCamCenter.position.z},
				_holoScreenScale: this._holoScreen.scale,
                _holoScreenSize: this._holoScreen.sizeX,
				_tarPosition:{x:this._holoScreen.position.x,y:this._holoScreen.position.y,z:this._holoScreen.position.z},}
				});
				window.top.postMessage(message,"*");
				this.stateData._camFov = this._holoCamCenter.fov;
				this.stateData._camPosition.copy(this._holoCamCenter.position);
				this.stateData._holoScreenScale = this._holoScreen.scale;
				this.stateData._holoScreenSize = this._holoScreen.sizeX;
				this.stateData._tarPosition.copy(this._holoScreen.position);
			}
			//this.messageFlag++;
			var self = this;
			if(bStateChange == true){
				//this.messageFlag = 0;
				console.log("post data to emulator");
				console.log("self._holoScreen.sizeX:" + self._holoScreen.sizeX);
				 (function(){
					var dataObject = {action: "UpdateDisplayParams"};
					dataObject.params = JSON.stringify({type:'tuning', data:{_camFov:self._holoCamCenter.fov,
				_camPosition:{x:self._holoCamCenter.position.x,y:self._holoCamCenter.position.y,z:self._holoCamCenter.position.z},
				_holoScreenScale: self._holoScreen.scale,
				_holoScreenSize: self._holoScreen.sizeX,
				_tarPosition:{x:self._holoScreen.position.x,y:self._holoScreen.position.y,z:self._holoScreen.position.z},}
				});
					var xmlhttp = new XMLHttpRequest();
					xmlhttp.onreadystatechange=function() {
					  if(this.readyState == this.DONE) {
						if(this.status == 200 && this.response != null ) {
						  var params =  JSON.parse(this.responseText);
						  console.log("Update Display Params:" + this.responseText);
						  return;
						}
					  }
					};
					xmlhttp.open("POST","http://127.0.0.1:8887/updateDisplayParams",true);
					xmlhttp.setRequestHeader('Content-Type', 'text/plain');
					xmlhttp.send(JSON.stringify(dataObject));
				  })();
			}
		}else if(messageFlag == 1){   //Emulator
			
			this._holoScreen.setData();
            this._holoCamCenter.setData();
			this.messageFlag++;
			
			if(this.messageFlag > 5){
			//	console.log("messageFlag Emulator");
				this.messageFlag = 0;
				var self = this;
			   (function(){
					var xmlhttp = new XMLHttpRequest();
					xmlhttp.onreadystatechange=function() {
					  if(this.readyState == this.DONE) {
						if(this.status == 200 && this.response != null ) {
						  var params =  JSON.parse(this.responseText);
	
						  if(params.data != undefined && params.type == "tuning"){
							self._holoCamCenter.fov = params.data._camFov.toFixed(2);
							self._holoCamCenter.position.x = params.data._camPosition.x.toFixed(2);
							self._holoCamCenter.position.y = params.data._camPosition.y.toFixed(2);
							self._holoCamCenter.position.z = params.data._camPosition.z.toFixed(2);
							self._holoCamCenter.setData();
							
							self._holoScreen.scale = params.data._holoScreenScale.toFixed(2);
							self._holoScreen.sizeX = params.data._holoScreenSize.toFixed(2);
							self._holoScreen.position.x = params.data._tarPosition.x;
							self._holoScreen.position.y = params.data._tarPosition.y;
							self._holoScreen.position.z = params.data._tarPosition.z;
							self._holoScreen.setData();
						}
						  return;
						}else{
							console.log("something wrong");
						}
						// something went wrong
					  }
					};
					xmlhttp.open("GET","http://127.0.0.1:8887/queryDisplayParams",true);
					//xmlhttp.setRequestHeader('Cache-Control', 'no-cache');
					//xmlhttp.setRequestHeader('User-Agent', 'holoide');
					xmlhttp.send();
				  })();
			}
		}else{
			console.log("messageFlag Error!");
		}
	}
	this.bRendering = true;
	this.material_depth = new THREE.MeshDepthMaterial();
	this.Leia_render = function (scene, camera, renderTarget, forceClear, holoScreenSize, holoCamFov, messageFlag) {
	    //camera.near = 25;
	    //camera.far = 100;
        scene.overrideMaterial = null;
		this.SetUpRenderStates(scene, camera, renderTarget, forceClear, holoScreenSize, holoCamFov, messageFlag);
		
		if (this.bRendering) {
		    if (this.messageFlag !== 0 || (this.messageFlag == 0 && this.bGlobalView == false && this.bGyroSimView == false)) {
		        if (0 == this._renderMode) {
		            //var spanMode = this.spanSphereMode;
		            var camPositionCenter = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
		            var tmpM = new THREE.Matrix4();
		            var tmpV = new THREE.Vector3(camPositionCenter.x - camera.targetPosition.x, camPositionCenter.y - camera.targetPosition.y, camPositionCenter.z - camera.targetPosition.z);
		            var _d = 0;
		            this.setViewport(0, 0, _canvas.width, _canvas.height);// debug shadow from _gl.viewport
		            this.setScissor(0, 0, _viewportWidth, _viewportHeight);
		            this.enableScissorTest(true);
		            camera.up.set(0, 1, 0);
		            if (tmpV.y > 0 && tmpV.y >= Math.abs(tmpV.x) * 2 && tmpV.y >= Math.abs(tmpV.z) * 2) {
		                camera.up.set(0, 0, -1);
		            }
		            if (_that._holoScreen.tarObj.geometry.vertices[0] !== undefined) {
		                _d = this.getCameraIntrinsic(camera, _that._holoScreen.tarObj);
		            }
		            scene.overrideMaterial = _that.material_depth;
		            this.render(scene, camera, renderTarget, forceClear);
		        } else if (1 == this._renderMode) {
		            console.log("render64");
		            Leia_compute_renderViews(scene, camera, renderTarget, forceClear);
		            if (this.nShaderMode == 2 || this.nShaderMode == 3 || this.nShaderMode == 4) {
		                Leia_compute_renderViews(scene, camera, renderTarget, forceClear, 0.5, 0.0);
		                Leia_compute_renderViews(scene, camera, renderTarget, forceClear, 0.0, -0.5);
		                Leia_compute_renderViews(scene, camera, renderTarget, forceClear, 0.5, -0.5);
		            }
		        } else if (2 == this._renderMode) {
		           // scene.overrideMaterial = null;
		            if (this.nShaderMode == 0 || this.nShaderMode == 1 || this.nShaderMode == 2 || this.nShaderMode == 3 || this.nShaderMode == 5) {
		                Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTarget, forceClear);
		                if (this.nShaderMode == 2 || this.nShaderMode == 3 ) {
		                    Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftX, forceClear, 0.5, 0.0);
		                    Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftY, forceClear, 0.0, -0.5);
		                    Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftXY, forceClear, 0.5, -0.5);
		                }
		            }
		            if (this.nShaderMode == 4) {
		              //  scene.overrideMaterial = null;
		                Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSSS, forceClear, 0, 0, 16);
		            }
		            if (this.nShaderMode == 5) {
		               // renderer.clear();
		                scene.overrideMaterial = _that.material_depth;
		                Leia_compute_renderViews(scene, camera, this._shaderManager._DepthRenderTarget, true);
		            }
		            this.setViewport(0, 0, _canvas.width, _canvas.height);// debug shadow, modify _viewport*** here
		            this.setScissor(0, 0, _viewportWidth, _viewportHeight);
		            this.enableScissorTest(true);
		            renderer.render(this._shaderManager.LEIA_output, this._shaderManager.cameraSWIZZLE);
		        } else {
		            //mode error
		            console.log("renderMode error!");
		        }
		    }

            // holo tuning panel  
		    if (this.bGlobalView) 
            {
		        if (!this.bGlobalViewInit) {
		            _globalView = new CGlobalView(camera, scene, renderTarget, forceClear);
		            this.bGlobalViewInit = true;
		        } else {
		            _globalView.update();
		        }
		    }

		    // gyro simulation panel
		    if (this.bGyroSimView)
		    {
		        if (!this.bGyroSimViewInit) {
		            _gyroView = new CGyroView(renderTarget, forceClear);
		            this.bGyroSimViewInit = true;
		        } else {
		            _gyroView.update();
		        }
		    }
        }

    }
}
LeiaWebGLRenderer.prototype = Object.create(THREE.WebGLRenderer.prototype);