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
    var _this = this;
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
            this._renderMode = 0;
        } else {
            this.bGlobalView = false;
            this.bGyroSimView = true;
            this._renderMode = 0;
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

    //if (parameters.camPanelVisible == undefined) {
    //    this.bGlobalView = true;
    //    console.log("camPanelVisible undefined!");
    //} else {
    //    this.bGlobalView = parameters.camPanelVisible;
    //    console.log("set camPanelVisible:" + parameters.camPanelVisible);
    //}

    //if (parameters.gyroPanelVisible == undefined) {
    //    this.bGyroSimView = true;
    //    console.log("gyroPanelVisible undefined!");
    //} else {
    //    this.bGyroSimView = parameters.gyroPanelVisible;
    //    console.log("set gyroPanelVisible:" + parameters.gyroPanelVisible);
    //}

    //if (parameters.camFov == undefined) {
    //    this.view64fov = 50;
    //    console.log("camFov undefined, set it to default 50!");
    //} else {
    //    this.view64fov = parameters.camFov;
    //    console.log("set camFov:" + parameters.camFov);
    //}



    var _canvas = parameters.canvas !== undefined ? parameters.canvas : document.createElement('canvas'),
    _viewportWidth,
	_viewportHeight;
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
            _this.screen.left = _canvas.width * _that.GGyroSimView.left;
            _this.screen.top = _canvas.height * (1.0-_that.GGyroSimView.bottom - _that.GGyroSimView.height);
            _this.screen.width = _canvas.width * _that.GGyroSimView.width;
            _this.screen.height = _canvas.height * _that.GGyroSimView.height;

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
    this.spanSphereMode = false;
    var _that = this;
    var drapControls = function (object, domElement) {
        var _this = this;
        var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
        this.object = object;
        this.domElement = (domElement !== undefined) ? domElement : document;
        this.enabled = true;
        this.screen = { left: 0, top: 0, width: 0, height: 0 };
        this.rotateSpeed = 0.2;
        this.zoomSpeed = 0.2;
        this.panSpeed = 0.6;
        this.noRotate = false;
        this.noZoom = false;
        this.noPan = false;
        this.noRoll = false;
        this.staticMoving = false;
        this.dynamicDampingFactor = 0.3;
        this.minDistance = 0;
        this.maxDistance = Infinity;
        this.screen.left = 0;
        this.screen.top = _canvas.height * (1.0-_that.GObserveView.bottom - _that.GObserveView.height);
        this.screen.width = _canvas.width * _that.GObserveView.width;
        this.screen.height = _canvas.height * _that.GObserveView.height;

        this.target = new THREE.Vector3();
        var EPS = 0.000001;
        var lastPosition = new THREE.Vector3();
        var _state = STATE.NONE,
        _prevState = STATE.NONE,
        _eye = new THREE.Vector3(),
        _rotateStart = new THREE.Vector3(),
        _rotateEnd = new THREE.Vector3(),
        _zoomStart = new THREE.Vector2(),
        _zoomEnd = new THREE.Vector2(),
        _touchZoomDistanceStart = 0,
        _touchZoomDistanceEnd = 0,
        _panStart = new THREE.Vector2(),
        _panEnd = new THREE.Vector2();

        this.target0 = this.target.clone();
        this.position0 = this.object.position.clone();
        this.up0 = this.object.up.clone();

        var changeEvent = { type: 'change' };
        var startEvent = { type: 'start' };
        var endEvent = { type: 'end' };
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
        var getMouseProjectionOnBall = (function () {
            var vector = new THREE.Vector3();
            var objectUp = new THREE.Vector3();
            var mouseOnBall = new THREE.Vector3();
            return function (layerX, layerY) {
                mouseOnBall.set(
                    (layerX - _this.screen.width * 0.5 - _this.screen.left) / (_this.screen.width * .5),
                    (_this.screen.height * 0.5 + _this.screen.top - layerY) / (_this.screen.height * .5),
                    0.0
                );

                var length = mouseOnBall.length();
                if (_this.noRoll) {
                    if (length < Math.SQRT1_2) {
                        mouseOnBall.z = Math.sqrt(1.0 - length * length);
                    } else {
                        mouseOnBall.z = .5 / length;
                    }
                } else if (length > 1.0) {
                    mouseOnBall.normalize();
                } else {
                    mouseOnBall.z = Math.sqrt(1.0 - length * length);
                }

                _eye.copy(_this.object.position).sub(_this.target);
                vector.copy(_this.object.up).setLength(mouseOnBall.y)
                vector.add(objectUp.copy(_this.object.up).cross(_eye).setLength(mouseOnBall.x));
                vector.add(_eye.setLength(mouseOnBall.z));
                return vector;
            };
        }());

        this.rotateCamera = (function () {
            var axis = new THREE.Vector3(),
                quaternion = new THREE.Quaternion();
            return function () {
                var angle = Math.acos(_rotateStart.dot(_rotateEnd) / _rotateStart.length() / _rotateEnd.length());
                if (angle) {
                    axis.crossVectors(_rotateStart, _rotateEnd).normalize();
                    angle *= _this.rotateSpeed;
                    quaternion.setFromAxisAngle(axis, -angle);
                    _eye.applyQuaternion(quaternion);
                    _this.object.up.applyQuaternion(quaternion);
                    _rotateEnd.applyQuaternion(quaternion);
                    if (_this.staticMoving) {
                        _rotateStart.copy(_rotateEnd);
                    } else {
                        quaternion.setFromAxisAngle(axis, angle * (_this.dynamicDampingFactor - 1.0));
                        _rotateStart.applyQuaternion(quaternion);
                    }
                }
            }
        }());

        this.zoomCamera = function () {
            if (_state === STATE.TOUCH_ZOOM_PAN) {
                var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
                _touchZoomDistanceStart = _touchZoomDistanceEnd;
                _eye.multiplyScalar(factor);
            } else {
                var factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * _this.zoomSpeed;
                if (factor !== 1.0 && factor > 0.0) {
                    _eye.multiplyScalar(factor);
                    if (_this.staticMoving) {
                        _zoomStart.copy(_zoomEnd);
                    } else {
                        _zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
                    }
                }
            }
        };

        this.panCamera = (function () {
            var mouseChange = new THREE.Vector2(),
                objectUp = new THREE.Vector3(),
                pan = new THREE.Vector3();
            return function () {
                mouseChange.copy(_panEnd).sub(_panStart);
                if (mouseChange.lengthSq()) {
                    mouseChange.multiplyScalar(_eye.length() * _this.panSpeed);
                    pan.copy(_eye).cross(_this.object.up).setLength(mouseChange.x);
                    pan.add(objectUp.copy(_this.object.up).setLength(mouseChange.y));
                    _this.object.position.add(pan);
                    _this.target.add(pan);
                    if (_this.staticMoving) {
                        _panStart.copy(_panEnd);
                    } else {
                        _panStart.add(mouseChange.subVectors(_panEnd, _panStart).multiplyScalar(_this.dynamicDampingFactor));
                    }
                }
            }
        }());

        this.checkDistances = function () {
            if (!_this.noZoom || !_this.noPan) {
                if (_eye.lengthSq() > _this.maxDistance * _this.maxDistance) {
                    _this.object.position.addVectors(_this.target, _eye.setLength(_this.maxDistance));
                }
                if (_eye.lengthSq() < _this.minDistance * _this.minDistance) {
                    _this.object.position.addVectors(_this.target, _eye.setLength(_this.minDistance));
                }
            }
        };

        this.update = function () {
            _this.screen.left = 0;
            _this.screen.top = _canvas.height * (1.0-_that.GObserveView.bottom - _that.GObserveView.height);
            _this.screen.width = _canvas.width * _that.GObserveView.width;
            _this.screen.height = _canvas.height * _that.GObserveView.height;
            _eye.subVectors(_this.object.position, _this.target);
            if (!_this.noRotate) {
                _this.rotateCamera();
            }
            if (!_this.noZoom) {
                _this.zoomCamera();
            }
            if (!_this.noPan) {
                _this.panCamera();
            }
            _this.object.position.addVectors(_this.target, _eye);
            _this.checkDistances();
            _this.object.lookAt(_this.target);
            if (lastPosition.distanceToSquared(_this.object.position) > EPS) {
                _this.dispatchEvent(changeEvent);
                lastPosition.copy(_this.object.position);
            }
        };

        this.reset = function () {
            _state = STATE.NONE;
            _prevState = STATE.NONE;
            _this.target.copy(_this.target0);
            _this.object.position.copy(_this.position0);
            _this.object.up.copy(_this.up0);
            _eye.subVectors(_this.object.position, _this.target);
            _this.object.lookAt(_this.target);
            _this.dispatchEvent(changeEvent);
            lastPosition.copy(_this.object.position);
        };

        function mousedown(event) {
            if (_this.enabled == false) return;
            var leftBunder = _this.screen.left;
            var rightBunder = _this.screen.left + _this.screen.width;
            var topBunder = _this.screen.top;
            var bottomBunder = _this.screen.top + _this.screen.height;
            if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
                if (_this.enabled === false) return;
                //event.preventDefault();
                //  event.stopPropagation();
                if (_state === STATE.NONE) {
                    _state = event.button;
                }

                if (_state === STATE.ROTATE && !_this.noRotate) {
                    _rotateStart.copy(getMouseProjectionOnBall(event.layerX, event.layerY));
                    _rotateEnd.copy(_rotateStart);
                } else if (_state === STATE.ZOOM && !_this.noZoom) {
                    _zoomStart.copy(getMouseOnScreen(event.layerX, event.layerY));
                    _zoomEnd.copy(_zoomStart);
                } else if (_state === STATE.PAN && !_this.noPan) {
                    _panStart.copy(getMouseOnScreen(event.layerX, event.layerY));
                    _panEnd.copy(_panStart)
                }
                document.addEventListener('mousemove', mousemove, false);
                document.addEventListener('mouseup', mouseup, false);
                _this.dispatchEvent(startEvent);
            }
        }

        function mousemove(event) {
            if (_this.enabled == false) return;
            var leftBunder = _this.screen.left;
            var rightBunder = _this.screen.left + _this.screen.width;
            var topBunder = _this.screen.top;
            var bottomBunder = _this.screen.top + _this.screen.height;
            if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
                if (_this.enabled === false) return;
                event.preventDefault();
                // event.stopPropagation();
                if (_state === STATE.ROTATE && !_this.noRotate) {
                    _rotateEnd.copy(getMouseProjectionOnBall(event.layerX, event.layerY));
                } else if (_state === STATE.ZOOM && !_this.noZoom) {
                    _zoomEnd.copy(getMouseOnScreen(event.layerX, event.layerY));
                } else if (_state === STATE.PAN && !_this.noPan) {
                    _panEnd.copy(getMouseOnScreen(event.layerX, event.layerY));
                }
            }
        }

        function mouseup(event) {
            var leftBunder = _this.screen.left;
            var rightBunder = _this.screen.left + _this.screen.width;
            var topBunder = _this.screen.top;
            var bottomBunder = _this.screen.top + _this.screen.height;
            if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
                //event.preventDefault();
                // event.stopPropagation();
                _state = STATE.NONE;
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
                _this.dispatchEvent(endEvent);
            }
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', mouseup);
        }

        function mousewheel(event) {
            var leftBunder = _this.screen.left;
            var rightBunder = _this.screen.left + _this.screen.width;
            var topBunder = _this.screen.top;
            var bottomBunder = _this.screen.top + _this.screen.height;
            if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
                if (_this.enabled === false) return;
                event.preventDefault();
                //  event.stopPropagation();
                var delta = 0;
                if (event.wheelDelta) {
                    delta = event.wheelDelta / 40;
                } else if (event.detail) {
                    delta = - event.detail / 3;
                }
                _zoomStart.y += delta * 0.01;
                _this.dispatchEvent(startEvent);
                _this.dispatchEvent(endEvent);
            }
        }
        this.domElement.addEventListener('mousedown', mousedown, false);
        this.domElement.addEventListener('mousewheel', mousewheel, false);
        this.update();
    };
    drapControls.prototype = Object.create(THREE.EventDispatcher.prototype);

    var AxisPickerMater = function (parameters) {
        THREE.MeshBasicMaterial.call(this);
        this.depthTest = false;
        this.depthWrite = false;
        this.side = THREE.FrontSide;
        this.transparent = true;
        this.setValues(parameters);
        this.oldColor = this.color.clone();
        this.oldOpacity = this.opacity;
        this.highlight = function (highlighted) {
            if (highlighted) {
                this.color.setRGB(1, 1, 0);
                this.opacity = 1;
            } else {
                this.color.copy(this.oldColor);
                this.opacity = this.oldOpacity;
            }
        };
    };
    AxisPickerMater.prototype = Object.create(THREE.MeshBasicMaterial.prototype);
    var AxisPickerLineMater = function (parameters) {
        THREE.LineBasicMaterial.call(this);
        this.depthTest = false;
        this.depthWrite = false;
        this.transparent = true;
        this.linewidth = 1;
        this.setValues(parameters);
        this.oldColor = this.color.clone();
        this.oldOpacity = this.opacity;
        this.highlight = function (highlighted) {
            if (highlighted) {
                this.color.setRGB(1, 1, 0);
                this.opacity = 1;
            } else {
                this.color.copy(this.oldColor);
                this.opacity = this.oldOpacity;
            }
        };
    };
    AxisPickerLineMater.prototype = Object.create(THREE.LineBasicMaterial.prototype);
    var AxisPickerTransForm = function (pickerSize) {
        var _this = this;
        var bShowShell = false;
        var bShowActPlane = false;
        this.init = function () {
            THREE.Object3D.call(this);
            this.handles = new THREE.Object3D();
            this.pickers = new THREE.Object3D();
            this.planes = new THREE.Object3D();
            this.add(this.handles);
            this.add(this.pickers);
            this.add(this.planes);
            var geoPlane = new THREE.PlaneGeometry(20 * pickerSize, 20 * pickerSize, 1, 1);
            var matPlane = new THREE.MeshBasicMaterial({ wireframe: true });
            matPlane.side = THREE.DoubleSide;
            var planes = {
                "XY": new THREE.Mesh(geoPlane, matPlane),
                "YZ": new THREE.Mesh(geoPlane, matPlane),
                "XZ": new THREE.Mesh(geoPlane, matPlane),
                "XYZE": new THREE.Mesh(geoPlane, matPlane)
            };
            this.actPlane = planes["XY"];
            planes["YZ"].rotation.set(0, Math.PI / 2, 0);
            planes["XZ"].rotation.set(-Math.PI / 2, 0, 0);
            for (var i in planes) {
                planes[i].name = i;
                this.planes.add(planes[i]);
                this.planes[i] = planes[i];
                planes[i].visible = false;
            }
            var setupAxisPickers = function (pickersMap, parent) {
                for (var name in pickersMap) {
                    for (i = pickersMap[name].length; i--;) {
                        var object = pickersMap[name][i][0];
                        var position = pickersMap[name][i][1];
                        var rotation = pickersMap[name][i][2];
                        object.name = name;
                        if (position)
                            object.position.set(position[0], position[1], position[2]);
                        if (rotation)
                            object.rotation.set(rotation[0], rotation[1], rotation[2]);
                        parent.add(object);
                    }
                }
            };
            setupAxisPickers(this.handleAxisPickers, this.handles);
            setupAxisPickers(this.pickerAxisPickers, this.pickers);

            this.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.updateMatrix();
                    var tempGeometry = new THREE.Geometry();
                    tempGeometry.merge(child.geometry, child.matrix);
                    child.geometry = tempGeometry;
                    child.position.set(0, 0, 0);
                    child.rotation.set(0, 0, 0);
                    child.scale.set(1, 1, 1);
                }
            });
        }
        this.show = function (oneDir) {
            this.traverse(function (child) {
                child.visible = false;
                if (child.parent == _this.pickers)
                    child.visible = bShowShell;
                if (child.parent == _this.planes)
                    child.visible = false;
                if (child.parent == _this.handles && (child.name == "X" || child.name == "Z") && oneDir)
                    child.visible = false;
            });
            this.actPlane.visible = bShowActPlane;
        }

        this.hide = function () {
            this.traverse(function (child) {
                child.visible = false;
            });
        }

        this.highlight = function (axis) {
            this.traverse(function (child) {
                if (child.material && child.material.highlight) {
                    if (child.name == axis) {
                        child.material.highlight(true);
                    } else {
                        child.material.highlight(false);
                    }
                }
            });
        };
        this.update = function (rotation) {
            this.traverse(function (child) {
                child.quaternion.setFromEuler(rotation);
            });
        };

    };
    AxisPickerTransForm.prototype = Object.create(THREE.Object3D.prototype);
    //AxisPickerTransForm.prototype.update = function (rotation) {
    //    this.traverse(function (child) {
    //        child.quaternion.setFromEuler(rotation);
    //    });
    //};
    var AxisPickerTranslate = function (pickerSize) {
        AxisPickerTransForm.call(this, pickerSize);
        var geoArrow = new THREE.Geometry();
        var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.05 * pickerSize, 0.2 * pickerSize, 12, 1, false));
        mesh.position.y = 0.5 * pickerSize;
        mesh.matrix.compose(mesh.position, mesh.quaternion, mesh.scale);
        geoArrow.merge(mesh.geometry, mesh.matrix);
        var lineXGeometry = new THREE.Geometry();
        lineXGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1 * pickerSize, 0, 0));
        var lineYGeometry = new THREE.Geometry();
        lineYGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1 * pickerSize, 0));
        var lineZGeometry = new THREE.Geometry();
        lineZGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1 * pickerSize));
        this.handleAxisPickers = {
            X: [
				[new THREE.Mesh(geoArrow, new AxisPickerMater({ color: 0xff0000 })), [0.5 * pickerSize, 0, 0], [0, 0, -Math.PI / 2]],
				[new THREE.Line(lineXGeometry, new AxisPickerLineMater({ color: 0xff0000 }))]
            ],
            Y: [
				[new THREE.Mesh(geoArrow, new AxisPickerMater({ color: 0x00ff00 })), [0, 0.5 * pickerSize, 0]],
				[new THREE.Line(lineYGeometry, new AxisPickerLineMater({ color: 0x00ff00 }))]
            ],
            Z: [
				[new THREE.Mesh(geoArrow, new AxisPickerMater({ color: 0x0000ff })), [0, 0, 0.5 * pickerSize], [Math.PI / 2, 0, 0]],
				[new THREE.Line(lineZGeometry, new AxisPickerLineMater({ color: 0x0000ff }))]
            ]
        };
        this.pickerAxisPickers = {
            X: [
				[new THREE.Mesh(new THREE.CylinderGeometry(0.2 * pickerSize, 0, 1 * pickerSize, 4, 1, false), new AxisPickerMater({ color: 0xff0000, opacity: 0.25 })), [0.6 * pickerSize, 0, 0], [0, 0, -Math.PI / 2]]
            ],
            Y: [
				[new THREE.Mesh(new THREE.CylinderGeometry(0.2 * pickerSize, 0, 1 * pickerSize, 4, 1, false), new AxisPickerMater({ color: 0x00ff00, opacity: 0.25 })), [0, 0.6 * pickerSize, 0]]
            ],
            Z: [
				[new THREE.Mesh(new THREE.CylinderGeometry(0.2 * pickerSize, 0, 1 * pickerSize, 4, 1, false), new AxisPickerMater({ color: 0x0000ff, opacity: 0.25 })), [0, 0, 0.6 * pickerSize], [Math.PI / 2, 0, 0]]
            ]
        };
        this.setActPlane = function (axis) {
            if (axis == "X") {
                this.actPlane = this.planes["XY"];
            }
            if (axis == "Y") {
                this.actPlane = this.planes["XY"];
            }
            if (axis == "Z") {
                this.actPlane = this.planes["XZ"];
            }
        };

        this.init();
    };
    AxisPickerTranslate.prototype = Object.create(AxisPickerTransForm.prototype);
    var pickControls = function (camera, domElement, pickerSize) {
        THREE.Object3D.call(this);
        domElement = (domElement !== undefined) ? domElement : document;
        this.axisPickers = {};
        this.axisPickers[0] = new AxisPickerTranslate(pickerSize);
        this.add(this.axisPickers[0]);
        var _this = this;
        this.object = undefined;
        var _dragging = false;
        this.axis = null;
        this.screen = { left: 0, top: 0, width: 0, height: 0 };
        this.screen.left = 0;
        this.screen.top = _canvas.height * (1.0-_that.GObserveView.bottom - _that.GObserveView.height);
        this.screen.width = _canvas.width * _that.GObserveView.width;
        this.screen.height = _canvas.height * _that.GObserveView.height;
        var ray = new THREE.Raycaster();
        var projector = new THREE.Projector();
        var pointerVec = new THREE.Vector3();
        var camPosition = new THREE.Vector3();
        var camPos = new THREE.Vector3();
        var lastPos = new THREE.Vector3();
        var parentRMat = new THREE.Matrix4();
        var curPos = new THREE.Vector3();
        var startPos = new THREE.Vector3();

        domElement.addEventListener("mousemove", onMouseHover, false);
        domElement.addEventListener("mousedown", onMouseDown, false);
        domElement.addEventListener("mousemove", onMouseMove, false);
        domElement.addEventListener("mousewheel", onMouseWheel, false);
        domElement.addEventListener("mouseup", onMouseUp, false);

        this.attach = function (obj, oneDir) {
            _this.object = obj;
            _this.update();
            this.axisPickers[0].show(oneDir);
        };
        this.update = function () {
            _this.screen.left = 0;
            _this.screen.top = _canvas.height * (1.0-_that.GObserveView.bottom - _that.GObserveView.height);
            _this.screen.width = _canvas.width * _that.GObserveView.width;
            _this.screen.height = _canvas.height * _that.GObserveView.height;
            if (_this.object == undefined)
                return;
            camPosition.setFromMatrixPosition(_this.object.matrix);
            camPos.setFromMatrixPosition(camera.matrix);
            _this.position.copy(camPosition);
            _this.axisPickers[0].highlight(_this.axis);
        };

        function onMouseHover(event) {
            if (_this.object == undefined || _dragging == true) return;
            event.preventDefault();
            var pointer = event;
            var intersect = intersectObjs(pointer, _this.axisPickers[0].pickers.children);
            if (intersect) {
                _this.axis = intersect.object.name;
                _this.update();
            } else if (_this.axis != null) {
                _this.axis = null;
                _this.update();
            }
        }

        function onMouseDown(event) {
            //var _state = event.button;
            //if (_state != 2) {
            if (_this.object == undefined || _dragging == true) return;
           // event.preventDefault();
            //  event.stopPropagation();
            var pointer = event;
            if (pointer.button == 0 || pointer.button == undefined) {
                var intersect = intersectObjs(pointer, _this.axisPickers[0].pickers.children);
                if (intersect) {
                    _this.axis = intersect.object.name;
                    _this.update();
                    _this.axisPickers[0].setActPlane(_this.axis);
                    var planeIntersect = intersectObjs(pointer, [_this.axisPickers[0].actPlane]);
                    if (planeIntersect) {
                        lastPos.copy(_this.object.position);
                        parentRMat.extractRotation(_this.object.parent.matrixWorld);
                        startPos.copy(planeIntersect.point);
                    }
                }
                _dragging = true;
            } else if (pointer.button == 2 && _this.axis !== null && _this.object.name == "eyeCenter") {
                if (_this.object == undefined || _dragging == true) return;
               // event.preventDefault();
                //event.stopPropagation();
                _that.spanSphereMode = !_that.spanSphereMode;

            } else {
                _this.axisPickers[0].traverse(function (child) {
                    child.visible = !child.visible;
                    if (child.parent == _this.axisPickers[0].pickers)
                        child.visible = false;
                    if (child.parent == _this.axisPickers[0].planes)
                        child.visible = false;
                    //if (child.parent == _this.axisPickers[0].handles)
                    //    child.visible = false;
                });
                _this.object.visible = !_this.object.visible;
                if (_this.object.name == "tarPlane") {
                    console.log("tarPlane distance:");
                }
            }

        }

        function onMouseMove(event) {
            if (_this.object == undefined || _this.axis == null || _dragging == false) return;
            event.preventDefault();
            //  event.stopPropagation();
            var pointer = event;
            var planeIntersect = intersectObjs(pointer, [_this.axisPickers[0].actPlane]);
            if (planeIntersect) {
                curPos.copy(planeIntersect.point);
                curPos.sub(startPos);
                if (_this.axis.search("X") == -1) curPos.x = 0;
                if (_this.axis.search("Y") == -1) curPos.y = 0;
                if (_this.axis.search("Z") == -1) curPos.z = 0;
                _this.object.position.copy(lastPos);
                _this.object.position.add(curPos);
            }
            _this.update();
        }
        function onMouseUp(event) {
            _dragging = false;
            onMouseHover(event);
        }
        function onMouseWheel(event) {
            if (_this.object == undefined || _this.axis == null || _dragging == true) return;
            event.preventDefault();
            //   event.stopPropagation();
            var delta = 0;
            if (event.wheelDelta) {
                delta = event.wheelDelta / 40;
            } else if (event.detail) {
                delta = - event.detail / 3;
            }
            if (_this.object.name == "eyeCenter") {
                _that.view64fov += delta * 0.1;
            }
            if (_this.object.name == "tarPlane") {
                _this.object.scale.x += delta * 0.01;
                _this.object.scale.y += delta * 0.01;
            }
        }

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

        function intersectObjs(pointer, objs) {
            var _MousePos = new THREE.Vector2();
            _MousePos.copy(getMouseOnScreen(pointer.layerX, pointer.layerY));
            pointerVec.set(_MousePos.x * 2 - 1, -2 * _MousePos.y + 1, 0.5);
            projector.unprojectVector(pointerVec, camera);
            ray.set(camPos, pointerVec.sub(camPos).normalize());
            var intersections = ray.intersectObjects(objs, true);
            return intersections[0] ? intersections[0] : false;
        }
    }
    pickControls.prototype = Object.create(THREE.Object3D.prototype);

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

    // shaders start
    //this.nShaderMode = 0; // 0:basic; 1:sharpen; 2:surpersample
    this._shaderManager = undefined;
    this.bShaderManInit = false;
    var CShaderManager = function () {
        this._swizzleRenderTarget = undefined;
        this.cameraSWIZZLE = undefined;
        this.LEIA_output;
        this.swizzleMesh;
        this.materialSwizzle;
        this.matBasic;
        this.matSuperSample;
        this.matSharpen;
        this._swizzleRenderTargetSftX;
        this._swizzleRenderTargetSftY;
        this._swizzleRenderTargetSftXY;
        this.width = _viewportWidth;
        this.height = _viewportHeight;

        this.cameraSWIZZLE = new THREE.OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / -2, -1, 1);
        this.cameraSWIZZLE.position.z = 0;
        this.LEIA_output = new THREE.Scene();
        if (this.LEIA_output.children.length > 0) this.LEIA_output.remove(this.swizzleMesh);
        var swizzleBackgroundGeometry = new THREE.PlaneGeometry(this.width, this.height);
        var _SwizzleVertexShaderSrc =
        "varying vec2 vUv;" +
        "void main() {" +
        "    vUv = uv;" +
        "    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );" +
        "}";
        var _SwizzleFragmentShaderSrc =
        "precision highp float;" +
        "varying  vec2 vUv; 			\n" +
        "uniform sampler2D tNormalViews; 			\n" +
        "uniform vec2 renderSize;              \n " +
        "float getPixel( in float amplitude, in sampler2D texture, in vec2 viewId, in vec2 sPixId) {  \n" +
            "vec2 id  = vec2( ( sPixId.s + viewId.s*renderSize.x/8.0 )/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t + viewId.t*renderSize.y/8.0 )/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n" +
            "vec4 p   = texture2D( texture, id );\n" +
            "float pb = amplitude * ( p.r + p.g + p.b ) / 3.0;\n" +
            "return pb;\n" +
            "}\n" +
        "void main(void) {						\n" +
            "vec2 pixelCoord = vec2( floor((vUv.s)*renderSize.x), floor(vUv.t*renderSize.y) ); " +
            "pixelCoord      = vec2(max(pixelCoord.s - 0.0, 0.0), max(pixelCoord.t - 0.0, 0.0));" +
            "vec2 viewId     = vec2(   mod(pixelCoord.s,8.0)  ,   mod(pixelCoord.t,8.0)  ); " +
            "vec2 sPixId     = vec2( floor(pixelCoord.s/8.0)  , floor(pixelCoord.t/8.0)  ); " +
            //"vec2 sPixId     = vec2(   mod(pixelCoord.s, 200.0)  ,   mod(pixelCoord.t, 150.0)  ); " +
            //"vec2 viewId     = vec2( floor(pixelCoord.s/200.0)  , floor(pixelCoord.t/150.0)  ); " +
            "float fc        = 0.0;" +
            "fc = getPixel( 1.0, tNormalViews, viewId, sPixId);" +
           // "fc = 1.0 - fc;" +
            "gl_FragColor = vec4(fc, fc, fc, 1.0);" +
        "}";
        var _SuperSampleSwizzleFragmentShaderSrc =
        "precision highp float;" +
        "varying  vec2 vUv; 			\n" +
        "uniform sampler2D tNormalViews; 			\n" +
        "uniform sampler2D tSuperX; 			\n" +
        "uniform sampler2D tSuperY; 			\n" +
        "uniform sampler2D tSuperD; 			\n" +
        "uniform vec2 renderSize;              \n " +
        "float getPixel( in float amplitude, in sampler2D texture, in vec2 viewId, in vec2 sPixId) {  \n" +
            "vec2 id  = vec2( ( sPixId.s + viewId.s*renderSize.x/8.0 )/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t + viewId.t*renderSize.y/8.0 )/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n" +
            "vec4 p   = texture2D( texture, id );\n" +
            "float pb = amplitude * ( p.r + p.g + p.b ) / 3.0;\n" +
            "return pb;\n" +
            "}\n" +
        "void main(void) {						\n" +
            "vec2 pixelCoord = vec2( floor((vUv.s)*renderSize.x), floor(vUv.t*renderSize.y) ); " +
            "pixelCoord      = vec2(max(pixelCoord.s - 0.0, 0.0), max(pixelCoord.t - 0.0, 0.0));" +
            "vec2 viewId     = vec2(   mod(pixelCoord.s,8.0)  ,   mod(pixelCoord.t,8.0)  ); " +
            "vec2 sPixId     = vec2( floor(pixelCoord.s/8.0)  , floor(pixelCoord.t/8.0)  ); " +
            //"vec2 sPixId     = vec2(   mod(pixelCoord.s, 200.0)  ,   mod(pixelCoord.t, 150.0)  ); " +
            //"vec2 viewId     = vec2( floor(pixelCoord.s/200.0)  , floor(pixelCoord.t/150.0)  ); " +
            "float fc        = 0.0;" +
            "fc = getPixel( 1.0, tNormalViews, viewId, sPixId);" +
            "float imgCoeff = 1.0;" +
            "float nnCoeff = 0.2;" +
            "float nxnCoeff = 0.1;" +
            "float coeff = imgCoeff+2.0*nnCoeff+nxnCoeff;" +
            "fc = getPixel(imgCoeff, tNormalViews, viewId, sPixId);" +
            "fc = fc+getPixel( nnCoeff, tSuperX, viewId, sPixId );" +
            "fc = fc+getPixel( nnCoeff, tSuperY, viewId, sPixId );" +
            "fc = fc+getPixel( nxnCoeff, tSuperD, viewId, sPixId );" +
            "if (viewId.s > 0.0) { \n" +
            "   coeff = coeff + nnCoeff + nxnCoeff;" +
            "   fc = fc+getPixel( nnCoeff, tSuperX, viewId-vec2(1.0, 0.0), sPixId );" +
            "   fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(1.0, 0.0), sPixId );" +
            "}\n" +
            "if (viewId.t > 0.0) { \n" +
            "   coeff = coeff + nnCoeff + nxnCoeff;" +
            "   fc = fc+getPixel( nnCoeff, tSuperY, viewId-vec2(0.0, 1.0), sPixId );" +
            "   fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(0.0, 1.0), sPixId );" +
            "   if (viewId.s > 0.0) { \n" +
            "       coeff = coeff + nxnCoeff;" +
            "       fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(1.0, 1.0), sPixId );" +
            "   }\n" +
            "}\n" +
            "fc = fc/coeff;" +
        //    "fc = 1.0 - fc;" +
            "gl_FragColor = vec4(fc, fc, fc, 1.0);" +
        "}";

        var invA = [1.1146, -0.1909, 0.0343, 0.0, 0.0, 0.0];
        var _SharpenSwizzleFragmentShaderSrc =
        "precision highp float;" +
        "varying  vec2 vUv; 			\n" +
        "uniform sampler2D tNormalViews; 			\n" +
        "uniform vec2 renderSize;              \n " +
        "float getPixel( in float amplitude, in sampler2D texture, in vec2 viewId, in vec2 sPixId) {  \n" +
            "vec2 id  = vec2( ( sPixId.s + viewId.s*renderSize.x/8.0 )/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t + viewId.t*renderSize.y/8.0 )/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n" +
            "vec4 p   = texture2D( texture, id );\n" +
            "float pb = amplitude * ( p.r + p.g + p.b ) / 3.0;\n" +
            "return pb;\n" +
            "}\n" +
         LEIA_internal_fragmentShaderFunction_getSharpPixel5() +
        "void main(void) {						\n" +
            "vec2 pixelCoord = vec2( floor((vUv.s)*renderSize.x), floor(vUv.t*renderSize.y) ); " +
            "pixelCoord      = vec2(max(pixelCoord.s - 0.0, 0.0), max(pixelCoord.t - 0.0, 0.0));" +
            "vec2 viewId     = vec2(   mod(pixelCoord.s,8.0)  ,   mod(pixelCoord.t,8.0)  ); " +
            "vec2 sPixId     = vec2( floor(pixelCoord.s/8.0)  , floor(pixelCoord.t/8.0)  ); " +
            //"vec2 sPixId     = vec2(   mod(pixelCoord.s, 200.0)  ,   mod(pixelCoord.t, 150.0)  ); " +
            //"vec2 viewId     = vec2( floor(pixelCoord.s/200.0)  , floor(pixelCoord.t/150.0)  ); " +
            "float fc        = 0.0;" +
            "fc = getSharpPixel( invA, tNormalViews, viewId, sPixId);\n" +
          //  "fc = 1.0 - fc;" +
            "gl_FragColor = vec4(fc, fc, fc, 1.0);" +
        "}";
        function LEIA_internal_fragmentShaderFunction_getSharpPixel5() {
            var snipplet;
            var B1X = 8.0 - 1.0;
            var B1Y = 8.0 - 1.0;
            var B2X = 8.0 - 2.0;
            var B2Y = 8.0 - 2.0;
            snipplet = "uniform float invA [6]; \n";
            snipplet += (false) ? "vec4" : "float";
            snipplet += " getSharpPixel( in float amplitudes [6], in sampler2D texture, in vec2 viewId, in vec2 sPixId) { \n";
            snipplet += "    ";
            snipplet += "    float s1m = viewId.s - 1.0;\n";
            snipplet += "    float s1p = viewId.s + 1.0;\n";
            snipplet += "    float t1m = viewId.t - 1.0;\n";
            snipplet += "    float t1p = viewId.t + 1.0;\n";
            snipplet += "    float s2m = viewId.s - 2.0;\n";
            snipplet += "    float s2p = viewId.s + 2.0;\n";
            snipplet += "    float t2m = viewId.t - 2.0;\n";
            snipplet += "    float t2p = viewId.t + 2.0;\n";
            snipplet += "    ";
            snipplet += (false) ? "vec4" : "float";
            snipplet += " p = getPixel( amplitudes[0], texture, viewId, sPixId);\n";
            snipplet += "    float q = amplitudes[0];\n";
            snipplet += "    if (viewId.s > 0.0) { \n";
            snipplet += "        p += getPixel( amplitudes[1], texture, vec2( s1m, viewId.t ), sPixId );\n";
            snipplet += "        q += amplitudes[1];\n";
            snipplet += "        if (viewId.t > 0.0) { \n";
            snipplet += "            p += getPixel( amplitudes[2], texture, vec2( s1m, t1m ), sPixId );\n";
            snipplet += "            q += amplitudes[2];\n";
            snipplet += "        }\n";
            snipplet += "        if (viewId.t < " + B1Y.toFixed(1) + ") { \n";
            snipplet += "            p += getPixel( amplitudes[2], texture, vec2( s1m, t1p ), sPixId );\n";
            snipplet += "            q += amplitudes[2];\n";
            snipplet += "        }\n";
            snipplet += "        if (viewId.s > 1.0) { \n";
            snipplet += "            p += getPixel( amplitudes[3], texture, vec2( s2m, viewId.t ), sPixId );\n";
            snipplet += "            q += amplitudes[3];\n";
            snipplet += "            if (viewId.t > 0.0) { \n";
            snipplet += "                p += getPixel( amplitudes[4], texture, vec2( s2m, t1m ), sPixId );\n";
            snipplet += "                q += amplitudes[4];\n";
            snipplet += "                if (viewId.t > 1.0) { \n";
            snipplet += "                    p += getPixel( amplitudes[5], texture, vec2( s2m, t2m ), sPixId );\n";
            snipplet += "                    q += amplitudes[5];\n";
            snipplet += "                }\n";
            snipplet += "            }\n";
            snipplet += "            if (viewId.t < " + B1Y.toFixed(1) + ") { \n";
            snipplet += "                p += getPixel( amplitudes[4], texture, vec2( s2m, t1p ), sPixId );\n";
            snipplet += "                q += amplitudes[4];\n";
            snipplet += "                if (viewId.t < " + B2Y.toFixed(2) + ") { \n";
            snipplet += "                    p += getPixel( amplitudes[5], texture, vec2( s2m, t2p ), sPixId );\n";
            snipplet += "                    q += amplitudes[5];\n";
            snipplet += "                }\n";
            snipplet += "            }\n";
            snipplet += "        }\n";
            snipplet += "    }\n";
            snipplet += "    if (viewId.t > 0.0) { \n";
            snipplet += "        p += getPixel( amplitudes[1], texture, vec2( viewId.s, t1m ), sPixId );\n";
            snipplet += "        q += amplitudes[1];\n";
            snipplet += "        if (viewId.t > 1.0) { \n";
            snipplet += "            p += getPixel( amplitudes[3], texture, vec2( viewId.s, t2m ), sPixId );\n";
            snipplet += "            q += amplitudes[3];\n";
            snipplet += "            if (viewId.s > 0.0) { \n";
            snipplet += "                p += getPixel( amplitudes[4], texture, vec2( s1m, t2m ), sPixId );\n";
            snipplet += "                q += amplitudes[4];\n";
            snipplet += "            }\n";
            snipplet += "            if (viewId.s < " + B1X.toFixed(1) + ") { \n";
            snipplet += "                p += getPixel( amplitudes[4], texture, vec2( s1p, t2m ), sPixId );\n";
            snipplet += "                q += amplitudes[4];\n";
            snipplet += "            }\n";
            snipplet += "        }\n";
            snipplet += "    }\n";
            snipplet += "    if (viewId.s < " + B1X.toFixed(1) + ") { \n";
            snipplet += "        p += getPixel( amplitudes[1], texture, vec2( s1p, viewId.t ), sPixId );\n";
            snipplet += "        q += amplitudes[1];\n";
            snipplet += "        if (viewId.t > 0.0) { \n";
            snipplet += "            p += getPixel( amplitudes[2], texture, vec2( s1p, t1m ), sPixId );\n";
            snipplet += "            q += amplitudes[2];\n";
            snipplet += "        }\n";
            snipplet += "        if (viewId.t < " + B1Y.toFixed(1) + ") { \n";
            snipplet += "            p += getPixel( amplitudes[2], texture, vec2( s1p, t1p ), sPixId );\n";
            snipplet += "            q += amplitudes[2];\n";
            snipplet += "        }\n";
            snipplet += "        if (viewId.s < " + B2X.toFixed(1) + ") { \n";
            snipplet += "            p += getPixel( amplitudes[3], texture, vec2( s2p, viewId.t ), sPixId );\n";
            snipplet += "            q += amplitudes[3];\n";
            snipplet += "            if (viewId.t > 0.0) { \n";
            snipplet += "                p += getPixel( amplitudes[4], texture, vec2( s2p, t1m ), sPixId );\n";
            snipplet += "                q += amplitudes[4];\n";
            snipplet += "                if (viewId.t > 1.0) { \n";
            snipplet += "                    p += getPixel( amplitudes[5], texture, vec2( s2p, t2m ), sPixId );\n";
            snipplet += "                    q += amplitudes[5];\n";
            snipplet += "                }\n";
            snipplet += "            }\n";
            snipplet += "            if (viewId.t < " + B1Y.toFixed(1) + ") { \n";
            snipplet += "                p += getPixel( amplitudes[4], texture, vec2( s2p, t1p ), sPixId );\n";
            snipplet += "                q += amplitudes[4];\n";
            snipplet += "                if (viewId.t < " + B2Y.toFixed(2) + ") { \n";
            snipplet += "                    p += getPixel( amplitudes[5], texture, vec2( s2p, t2p ), sPixId );\n";
            snipplet += "                    q += amplitudes[5];\n";
            snipplet += "                }\n";
            snipplet += "            }\n";
            snipplet += "        }\n";
            snipplet += "    }\n";
            snipplet += "    if (viewId.t < " + B1Y.toFixed(1) + ") { \n";
            snipplet += "        p += getPixel( amplitudes[1], texture, vec2( viewId.s, t1p ), sPixId );\n";
            snipplet += "        q += amplitudes[1];\n";
            snipplet += "        if (viewId.t < " + B2Y.toFixed(1) + ") { \n";
            snipplet += "            p += getPixel( amplitudes[3], texture, vec2( viewId.s, t2p ), sPixId );\n";
            snipplet += "            q += amplitudes[3];\n";
            snipplet += "            if (viewId.s > 0.0) { \n";
            snipplet += "                p += getPixel( amplitudes[4], texture, vec2( s1m, t2p ), sPixId );\n";
            snipplet += "                q += amplitudes[4];\n";
            snipplet += "            }\n";
            snipplet += "            if (viewId.s < " + B1X.toFixed(1) + ") { \n";
            snipplet += "                p += getPixel( amplitudes[4], texture, vec2( s1p, t2p ), sPixId );\n";
            snipplet += "                q += amplitudes[4];\n";
            snipplet += "            }\n";
            snipplet += "        }\n";
            snipplet += "    }\n";
            snipplet += "    p *= (1.0/q);\n";
            snipplet += "    return(p);\n";
            snipplet += "}\n";
            return snipplet;
        }

        // member func
        this.useBasicSwizzleShader = function () {
            this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
            this._swizzleRenderTarget.generateMipmaps = false;
                this.matBasic = new THREE.ShaderMaterial({
                    uniforms: {
                        "tNormalViews": { type: "t", value: this._swizzleRenderTarget },
                        "renderSize": { type: "v2", value: new THREE.Vector2(this.width, this.height) }
                    },
                    vertexShader: _SwizzleVertexShaderSrc,
                    fragmentShader: _SwizzleFragmentShaderSrc,
                    depthWrite: false
                });
            this.materialSwizzle = this.matBasic;
        };
        this.useSuperSampleSwizzleShader = function () {
            this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
            this._swizzleRenderTargetSftX = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
            this._swizzleRenderTargetSftY = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
            this._swizzleRenderTargetSftXY = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
            this._swizzleRenderTarget.generateMipmaps = false; this._swizzleRenderTargetSftX.generateMipmaps = false;
            this._swizzleRenderTargetSftY.generateMipmaps = false; this._swizzleRenderTargetSftXY.generateMipmaps = false;
                this.matSuperSample = new THREE.ShaderMaterial({
                    uniforms: {
                        "tNormalViews": { type: "t", value: this._swizzleRenderTarget },
                        "tSuperX": { type: "t", value: this._swizzleRenderTargetSftX },
                        "tSuperY": { type: "t", value: this._swizzleRenderTargetSftY },
                        "tSuperD": { type: "t", value: this._swizzleRenderTargetSftXY },
                        "fader": { type: "f", value: 1.0 },
                        "renderSize": { type: "v2", value: new THREE.Vector2(this.width, this.height) }
                    },
                    vertexShader: _SwizzleVertexShaderSrc,
                    fragmentShader: _SuperSampleSwizzleFragmentShaderSrc,
                    depthWrite: false
                });
            this.materialSwizzle = this.matSuperSample;
        };
        this.useSharpenSwizzleShader = function () {
            this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
            this._swizzleRenderTarget.generateMipmaps = false;
            this.matSharpen = new THREE.ShaderMaterial({
                uniforms: {
                    "tNormalViews": { type: "t", value: this._swizzleRenderTarget },
                    "fader"		: { type: "f", value:1.0},
                    "invA"		: { type: "fv1", value: invA },
                    "renderSize": { type: "v2", value: new THREE.Vector2(this.width, this.height) }
                },
                vertexShader: _SwizzleVertexShaderSrc,
                fragmentShader: _SharpenSwizzleFragmentShaderSrc,
                depthWrite: false
            });
            this.materialSwizzle = this.matSharpen;
        }

        //choose shaders to use
        switch (_that.nShaderMode) {
            case 0: this.useBasicSwizzleShader(); break;
            case 1: this.useSharpenSwizzleShader(); break;
            case 2: this.useSuperSampleSwizzleShader(); break;
            default:
                this.useBasicSwizzleShader();
        }
        this.swizzleMesh = new THREE.Mesh(swizzleBackgroundGeometry, this.materialSwizzle);
        this.LEIA_output.add(this.swizzleMesh);

        this.changeSzie = function (w, h) {
            this.width = w;
            this.height = h;
            this.cameraSWIZZLE = new THREE.OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / -2, -1, 1);
            this.cameraSWIZZLE.position.z = 0;
            if (this.LEIA_output.children.length > 0) this.LEIA_output.remove(this.swizzleMesh);
            var swizzleBackgroundGeometry = new THREE.PlaneGeometry(this.width, this.height);

            switch (_that.nShaderMode) {
                case 0: this.useBasicSwizzleShader(); break;
                case 1: this.useSharpenSwizzleShader(); break;
                case 2: this.useSuperSampleSwizzleShader(); break;
                default:
                    this.useBasicSwizzleShader();
            }
            this.swizzleMesh = new THREE.Mesh(swizzleBackgroundGeometry, this.materialSwizzle);
            this.LEIA_output.add(this.swizzleMesh);
        };


        // call back
        document.addEventListener('keydown', onDocumentKeyDown, false);
        function onDocumentKeyDown(event) {
            var keyCode = event.which;
            //console.log(keyCode);
            switch (keyCode) {
                case 83: // 's'
                    //_that.bSuperSample = !_that.bSuperSample;
                    _that.nShaderMode++;
                    _that.nShaderMode = _that.nShaderMode % 3;
                    if (_that._shaderManager != undefined) {
                        switch (_that.nShaderMode) {
                            case 0: _that._shaderManager.useBasicSwizzleShader(); _that._shaderManager.LEIA_output.children[0].material = _that._shaderManager.matBasic; break;
                            case 1: _that._shaderManager.useSharpenSwizzleShader(); _that._shaderManager.LEIA_output.children[0].material = _that._shaderManager.matSharpen; break;
                            case 2: _that._shaderManager.useSuperSampleSwizzleShader(); _that._shaderManager.LEIA_output.children[0].material = _that._shaderManager.matSuperSample; break;
                            //default:
                            //    _that._shaderManager.useBasicSwizzleShader(); _that._shaderManager.LEIA_output.children[0].material = _that._shaderManager.matBasic;
                        }
                    }
                    break;
            }
        }
    }
    // shaders end
    
    this.getCameraPosition = function (position, targetPosition, up, npart, xIndex, yIndex, Gradient, EachTarPos, spanMode, shiftX, shiftY) {
        if (position.x == 0 && position.y != 0 && position.z == 0) {
            position.z = position.y / 100;
        }
        var scale = this.view64fov / (npart - 1);
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
    this.getCameraIntrinsic = function (camera, _tarObj) {
        var _local_lrbt = [];
        for (var i = 0; i < 4; i++) {
            var point = new THREE.Vector3();
            _local_lrbt.push(point);
        }
       // if (screen[0] !== undefined) {
            var camMat = new THREE.Matrix4();
            camMat.getInverse(camera.matrix);
            camMat.multiply(_tarObj.matrix);

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

        camera.near = d * 0.6;
        camera.far = d * 3;
        return d;
    }

    // Global view interaction, Gyro simulation signal generator&visual indicator, and MultiView Rendering
    // global view
    
    this._holoScreen = undefined;
    this.bHoloScreenInit = false;
    var CHoloScreen = function (camera, _scale) {
        this.position = new THREE.Vector3(0, 0, 0);
        this.position.copy(camera.targetPosition);
        this.scale = _scale;

        var __point = new THREE.Vector3();
        __point.copy(camera.position.clone().sub(camera.targetPosition));
        var _length = __point.length() / 2;
        var geoTarRect = new THREE.PlaneGeometry(1 * _length * 4, 1 * _length *3, 1, 1);
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
            this.tarObj.rotation.setFromRotationMatrix(camera.matrix);        
        }
        this.setData = function () {
            this.tarObj.position.copy(this.position);
            //save var _tarPosition in index here 
            this.tarObj.scale.x = this.scale;
			this.tarObj.scale.y = this.scale;
			this.tarObj.scale.z = this.scale;
            //save var _holoScreenSize in index here 
            this.tarObj.rotation.setFromRotationMatrix(camera.matrix);
        }
    }

    this._holoCamCenter = undefined;
    this.bHoloCamCenterInit = false;
    var CHoloCamCenter = function (camera, _fov) {
        this.position = new THREE.Vector3();
        this.position.copy(camera.position);
        this.fov = _fov;
        _that.view64fov = this.fov;

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
            this.fov = _that.view64fov;
        }
        this.setData = function () {
            this.eyeCenter.position.copy(this.position);
            _that.view64fov  = this.fov;
        }
        

    }

    this.bGlobalViewInit = false;
    var _globalView;
    var CGlobalView = function (camera, scene, renderTarget, forceClear) {
        var _this = this;
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
            _this.LocalControls = new drapControls(_this.Gcamera);
            _this.camControls = new pickControls(_this.Gcamera, undefined, __length / 5);
            _this.tarControls = new pickControls(_this.Gcamera, undefined, __length / 2.5);
            // add virtual cams
            var camGeometry = new THREE.CylinderGeometry(0, __length / 40, __length / 20, 20);
            camGeometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0)));
            var camMaterial = new THREE.MeshNormalMaterial();
            var bHasCam = false;
            var obj, subObj, tarId;
            for (var i = 0, l = scene.children.length; i < l; i++) {
                obj = scene.children[i];
                if (obj == camera) {
                    bHasCam = true;
                }
            }
            if (!bHasCam) {
                for (var i = 0, l = scene.children.length; i < l; i++) {
                    obj = scene.children[i];
                    for (var j = 0, l = obj.children.length; j < l; j++) {
                        subObj = obj.children[j];
                        if (subObj == camera) {
                            tarId = j;
                        }
                    }
                }
            }
            for (var i = 0; i < npart; i++)
                for (var j = 0; j < npart; j++) {
                    var mesh = new THREE.Mesh(camGeometry, camMaterial);
                    var Gradient = new THREE.Vector3();
                    var EachTarPos = new THREE.Vector3();
                    var meshPosition = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode);
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
                    var meshPosSX = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode, 0.5, 0);
                    meshSX.position.x = meshPosSX.x;
                    meshSX.position.y = meshPosSX.y;
                    meshSX.position.z = meshPosSX.z;
                    meshSX.lookAt(EachTarPos);
                    this.camMeshs64.push(meshSX);
                    var meshSY = mesh.clone();
                    var meshPosSY = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode, 0, -0.5);
                    meshSY.position.x = meshPosSY.x;
                    meshSY.position.y = meshPosSY.y;
                    meshSY.position.z = meshPosSY.z;
                    meshSY.lookAt(EachTarPos);
                    this.camMeshs64.push(meshSY);
                    var meshSXY = mesh.clone();
                    var meshPosSXY = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode, 0.5, -0.5);
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

                    if (_that.nShaderMode!=2) {
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
                    if (_that.nShaderMode!=2) {
                        var meshPosition = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode);
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
                        var meshPosition = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode);
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.x = meshPosition.x;
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.y = meshPosition.y;
                        this.camMeshs64[(i * npart + j) * 4 + 0].position.z = meshPosition.z;
                        this.camMeshs64[(i * npart + j) * 4 + 0].lookAt(EachTarPos);

                        var meshPosSX = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode, 0.5, 0);
                        this.camMeshs64[(i * npart + j) * 4 + 1].position.x = meshPosSX.x;
                        this.camMeshs64[(i * npart + j) * 4 + 1].position.y = meshPosSX.y;
                        this.camMeshs64[(i * npart + j) * 4 + 1].position.z = meshPosSX.z;
                        this.camMeshs64[(i * npart + j) * 4 + 1].lookAt(EachTarPos);

                        var meshPosSY = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode, 0, -0.5);
                        this.camMeshs64[(i * npart + j) * 4 + 2].position.x = meshPosSY.x;
                        this.camMeshs64[(i * npart + j) * 4 + 2].position.y = meshPosSY.y;
                        this.camMeshs64[(i * npart + j) * 4 + 2].position.z = meshPosSY.z;
                        this.camMeshs64[(i * npart + j) * 4 + 2].lookAt(EachTarPos);

                        var meshPosSXY = _that.getCameraPosition(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, _that.spanSphereMode, 0.5, -0.5);
                        this.camMeshs64[(i * npart + j) * 4 + 3].position.x = meshPosSXY.x;
                        this.camMeshs64[(i * npart + j) * 4 + 3].position.y = meshPosSXY.y;
                        this.camMeshs64[(i * npart + j) * 4 + 3].position.z = meshPosSXY.z;
                        this.camMeshs64[(i * npart + j) * 4 + 3].lookAt(EachTarPos);
                    }
                }
            this.LocalControls.enabled = true;
            if (this.tarControls.axis != null || this.camControls.axis != null)
                this.LocalControls.enabled = false;
            this.LocalControls.update();
            this.camControls.update();
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
            _that.render(this.GyroSimScene, this.GyroSimCam, renderTarget, forceClear);
        }
    }
        
    // rendering
    var Leia_compute_renderViews = function (scene, camera, renderTarget, forceClear, shiftX, shiftY) {
        var spanMode = _that.spanSphereMode;
        var camPositionCenter = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        var tmpM = new THREE.Matrix4();
        var tmpV = new THREE.Vector3(camPositionCenter.x - camera.targetPosition.x, camPositionCenter.y - camera.targetPosition.y, camPositionCenter.z - camera.targetPosition.z);
        var npart = 8;
        var _d = 0;
        if (shiftX == undefined)
            shiftX = 0;
        if (shiftY == undefined)
            shiftY = 0;
        for (var ii = 0; ii < npart; ii++)
            for (var jj = 0; jj < npart; jj++) {
                _that.setViewport(_canvas.width / npart * ii, _canvas.height / npart * jj, _canvas.width / npart, _canvas.height / npart);// debug shadow, modify _viewport*** here
                _that.setScissor(_viewportWidth / npart * ii, _viewportHeight / npart * jj, _viewportWidth / npart, _viewportHeight / npart);
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
                if (_that._holoScreen.tarObj.geometry.vertices[0] !== undefined) {
                    _d = _that.getCameraIntrinsic(camera, _that._holoScreen.tarObj);
                }
                //if (renderTarget == _swizzleRenderTarget || renderTarget == _swizzleRenderTargetSftX || renderTarget == _swizzleRenderTargetSftY || renderTarget == _swizzleRenderTargetSftXY) {
                if (renderTarget !== undefined) {
                    renderTarget.sx = _canvas.width / npart * ii;
                    renderTarget.sy = _canvas.height / npart * jj;
                    renderTarget.w = _canvas.width / npart;
                    renderTarget.h = _canvas.height / npart;
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
	this.SetUpRenderStates = function (scene, camera, renderTarget, forceClear, holoScreenScale, holoCamFov, messageFlag){
		
		var _holoCamFov = 50;
		var _holoScreenScale = 1;
		if (holoCamFov !== undefined)
            _holoCamFov = holoCamFov;
        if (holoScreenScale !== undefined)
            _holoScreenScale = holoScreenScale;
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
			this._holoScreen = new CHoloScreen(camera, _holoScreenScale);
			this.bHoloScreenInit = true;
			this.stateData._holoScreenScale = this._holoScreen.scale;
			this.stateData._tarPosition = new THREE.Vector3(0, 0, 0);
			this.stateData._tarPosition.copy(this._holoScreen.position);
		}
		if (!this.bShaderManInit) {
			this._shaderManager = new CShaderManager();
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
				_holoScreenScale:this._holoScreen.scale,
				_tarPosition:{x:this._holoScreen.position.x,y:this._holoScreen.position.y,z:this._holoScreen.position.z},}
				});
				window.top.postMessage(message,"*");
				this.stateData._camFov = this._holoCamCenter.fov;
				this.stateData._camPosition.copy(this._holoCamCenter.position);
				this.stateData._holoScreenScale = this._holoScreen.scale;
				this.stateData._tarPosition.copy(this._holoScreen.position);
			}
			//this.messageFlag++;
			var self = this;
			if(bStateChange == true){
				//this.messageFlag = 0;
				console.log("post data to emulator");
				 (function(){
					var dataObject = {action: "UpdateDisplayParams"};
					dataObject.params = JSON.stringify({type:'tuning', data:{_camFov:self._holoCamCenter.fov,
				_camPosition:{x:self._holoCamCenter.position.x,y:self._holoCamCenter.position.y,z:self._holoCamCenter.position.z},
				_holoScreenScale:self._holoScreen.scale,
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
    this.Leia_render = function (scene, camera, renderTarget, forceClear, holoScreenScale, holoCamFov, messageFlag) {
		
		this.SetUpRenderStates(scene, camera, renderTarget, forceClear, holoScreenScale, holoCamFov, messageFlag);
		
		if (this.bRendering) {
		    if (this.messageFlag !== 0 || (this.messageFlag == 0 && this.bGlobalView == false && this.bGyroSimView == false)) {
		        if (0 == this._renderMode) {
		            var spanMode = this.spanSphereMode;
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
		            this.render(scene, camera, renderTarget, forceClear);
		        } else if (1 == this._renderMode) {
		            console.log("render64");
		            Leia_compute_renderViews(scene, camera, renderTarget, forceClear);
		            if (this.nShaderMode == 2) {
		                Leia_compute_renderViews(scene, camera, renderTarget, forceClear, 0.5, 0.0);
		                Leia_compute_renderViews(scene, camera, renderTarget, forceClear, 0.0, -0.5);
		                Leia_compute_renderViews(scene, camera, renderTarget, forceClear, 0.5, -0.5);
		            }
		        } else if (2 == this._renderMode) {
		            Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTarget, forceClear);
		            if (this.nShaderMode == 2) {
		                Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftX, forceClear, 0.5, 0.0);
		                Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftY, forceClear, 0.0, -0.5);
		                Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftXY, forceClear, 0.5, -0.5);
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
            //if (this.bGlobalView) {
            if (!this.bGlobalViewInit) {
                _globalView = new CGlobalView(camera, scene, renderTarget, forceClear);
                this.bGlobalViewInit = true;
                //_globalView.update();
            } else {
                _globalView.update();
            }
            //}
            // gyro simulation panel
            if (this.bGyroSimView) {
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