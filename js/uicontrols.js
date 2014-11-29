var dragControls = function (object, domElement) {
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
    //this.screen.left = 0;
    //this.screen.top = _canvas.height * (1.0-_that.GObserveView.bottom - _that.GObserveView.height);
    //this.screen.width = _canvas.width * _that.GObserveView.width;
    //this.screen.height = _canvas.height * _that.GObserveView.height;

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
        //_this.screen.left = 0;
        //_this.screen.top = _canvas.height * (1.0 - _that.GObserveView.bottom - _that.GObserveView.height);
        //_this.screen.width = _canvas.width * _that.GObserveView.width;
        //_this.screen.height = _canvas.height * _that.GObserveView.height;
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
dragControls.prototype = Object.create(THREE.EventDispatcher.prototype);




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
    //this.screen.left = 0;
    //this.screen.top = _canvas.height * (1.0-_that.GObserveView.bottom - _that.GObserveView.height);
    //this.screen.width = _canvas.width * _that.GObserveView.width;
    //this.screen.height = _canvas.height * _that.GObserveView.height;
    this.view64fov = undefined;
    this.spanSphereMode = undefined;
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
        //_this.screen.left = 0;
        //_this.screen.top = _canvas.height * (1.0 - _that.GObserveView.bottom - _that.GObserveView.height);
        //_this.screen.width = _canvas.width * _that.GObserveView.width;
        //_this.screen.height = _canvas.height * _that.GObserveView.height;
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
            _this.spanSphereMode = !_this.spanSphereMode;

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
            _this.view64fov += delta * 0.1;
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


