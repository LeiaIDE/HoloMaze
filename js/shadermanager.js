var CShaderManager = function (leia_renderer, _viewportWidth, _viewportHeight) {
    this.render = leia_renderer;
    this._swizzleRenderTarget = undefined;
    this.cameraSWIZZLE = undefined;
    this.LEIA_output;
    this.swizzleMesh;
    this.materialSwizzle;
    this.matBasic;
    this.matSharpen;
    this.matSuperSample;
    this.matSSS;
    this.matSSSTest;
    this.matDepth;
    this._swizzleRenderTargetSftX;
    this._swizzleRenderTargetSftY;
    this._swizzleRenderTargetSftXY;
    this._swizzleRenderTargetSSS;
    this._DepthRenderTarget;
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

    // Basic
    var _SwizzleFragmentShaderSrc =
    "precision highp float;" +
    "varying  vec2 vUv; 			\n" +
    "uniform sampler2D tNormal; 			\n" +
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
        "fc = getPixel( 1.0, tNormal, viewId, sPixId);" +
       // "fc = 1.0 - fc;" +
        "gl_FragColor = vec4(fc, fc, fc, 1.0);" +
    "}";

    // S
    var invA = [1.1146, -0.1909, 0.0343, 0.0, 0.0, 0.0];
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
    var _SharpenSwizzleFragmentShaderSrc =
    "precision highp float;" +
    "varying  vec2 vUv; 			\n" +
    "uniform sampler2D tNormal; 			\n" +
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
        "fc = getSharpPixel( invA, tNormal, viewId, sPixId);\n" +
      //  "fc = 1.0 - fc;" +
        "gl_FragColor = vec4(fc, fc, fc, 1.0);" +
    "}";

    //SS
    var _SuperSampleSwizzleFragmentShaderSrc =
    "precision highp float;" +
    "varying  vec2 vUv; 			\n" +
    "uniform sampler2D tNormal; 			\n" +
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
        "fc = getPixel( 1.0, tNormal, viewId, sPixId);" +
        "float imgCoeff = 1.0;" +
        "float nnCoeff = 0.2;" +
        "float nxnCoeff = 0.1;" +
        "float coeff = imgCoeff+2.0*nnCoeff+nxnCoeff;" +

        "fc = getPixel(imgCoeff, tNormal, viewId, sPixId);" +
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


    //SSS
    var invA_66 = [-0.0197, -0.0271, 0.0864, 0.1460, 0.0306, -0.1038,
                    -0.0271, -0.0373, 0.1189, 0.2011, 0.0422, -0.1430,
                     0.0393, 0.0542, -0.0946, -0.1845, -0.4679, -0.4598,
                     0.0813, 0.1119, -0.2493, -0.4552, -0.6865, -0.4902,
                     0.0545, 0.0750, -0.3056, -0.4959, 1.2043, 2.1543,
                    -0.0063, -0.0086, -0.1716, -0.2276, 2.3449, 3.4569];
    var _SSSSwizzleFragmentShaderSrc =
    "precision highp float;" +
    "varying  vec2 vUv; 			\n" +
    "uniform sampler2D tNormal; 			\n" +
    "uniform sampler2D tSuperX; 			\n" +
    "uniform sampler2D tSuperY; 			\n" +
    "uniform sampler2D tSuperD; 			\n" +
    "uniform vec2 renderSize;              \n " +
    "uniform float invASSS[36];                \n" +
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

        //"float imgCoeff = 1.0 - 4.0*(-0.95) - 4.0*0.64;" +
        //"float nnCoeff = -0.95;" +
        //"float nxnCoeff = 0.64;" +
        "float coeff = 0.0;" +

        "if (viewId.s>=3.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 0];fc = fc+getPixel(invASSS[0*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 1];fc = fc+getPixel(invASSS[0*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 2];fc = fc+getPixel(invASSS[0*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 3];fc = fc+getPixel(invASSS[0*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 4];fc = fc+getPixel(invASSS[0*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t-3.00), sPixId);}};\n" +
        "                   {if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 5];fc = fc+getPixel(invASSS[0*6 + 5],tSuperY, vec2(viewId.s,      viewId.t-3.00), sPixId);}};\n" +
        "                   {if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 4];fc = fc+getPixel(invASSS[0*6 + 4],tSuperD, vec2(viewId.s,      viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 3];fc = fc+getPixel(invASSS[0*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 2];fc = fc+getPixel(invASSS[0*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 1];fc = fc+getPixel(invASSS[0*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 0];fc = fc+getPixel(invASSS[0*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t-3.00), sPixId);}};\n" +

        "if (viewId.s>=3.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 0];fc = fc+getPixel(invASSS[1*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 1];fc = fc+getPixel(invASSS[1*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 2];fc = fc+getPixel(invASSS[1*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 3];fc = fc+getPixel(invASSS[1*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 4];fc = fc+getPixel(invASSS[1*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        "                   {if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 5];fc = fc+getPixel(invASSS[1*6 + 5],tNormal, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" +
        "                   {if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 4];fc = fc+getPixel(invASSS[1*6 + 4],tSuperX, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 3];fc = fc+getPixel(invASSS[1*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 2];fc = fc+getPixel(invASSS[1*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 1];fc = fc+getPixel(invASSS[1*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s <6.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 0];fc = fc+getPixel(invASSS[1*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +

        "if (viewId.s>=3.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 0];fc = fc+getPixel(invASSS[2*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 1];fc = fc+getPixel(invASSS[2*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 2];fc = fc+getPixel(invASSS[2*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 3];fc = fc+getPixel(invASSS[2*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 4];fc = fc+getPixel(invASSS[2*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        "                   {if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 5];fc = fc+getPixel(invASSS[2*6 + 5],tSuperY, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" +
        "                   {if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 4];fc = fc+getPixel(invASSS[2*6 + 4],tSuperD, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 3];fc = fc+getPixel(invASSS[2*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 2];fc = fc+getPixel(invASSS[2*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 1];fc = fc+getPixel(invASSS[2*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 0];fc = fc+getPixel(invASSS[2*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +

        "if (viewId.s>=3.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 0];fc = fc+getPixel(invASSS[3*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 1];fc = fc+getPixel(invASSS[3*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 2];fc = fc+getPixel(invASSS[3*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 3];fc = fc+getPixel(invASSS[3*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 4];fc = fc+getPixel(invASSS[3*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        "                   {if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 5];fc = fc+getPixel(invASSS[3*6 + 5],tNormal, vec2(viewId.s, viewId.t-1.00), sPixId);}};\n" +
        "                   {if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 4];fc = fc+getPixel(invASSS[3*6 + 4],tSuperX, vec2(viewId.s, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 3];fc = fc+getPixel(invASSS[3*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 2];fc = fc+getPixel(invASSS[3*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 1];fc = fc+getPixel(invASSS[3*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 0];fc = fc+getPixel(invASSS[3*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +

        "if (viewId.s>=3.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 0];fc = fc+getPixel(invASSS[4*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 1];fc = fc+getPixel(invASSS[4*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 2];fc = fc+getPixel(invASSS[4*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 3];fc = fc+getPixel(invASSS[4*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 4];fc = fc+getPixel(invASSS[4*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        "                   {if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 5];fc = fc+getPixel(invASSS[4*6 + 5],tSuperY, vec2(viewId.s,      viewId.t-1.00), sPixId);}};\n" +
        "                   {if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 4];fc = fc+getPixel(invASSS[4*6 + 4],tSuperD, vec2(viewId.s,      viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 3];fc = fc+getPixel(invASSS[4*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 2];fc = fc+getPixel(invASSS[4*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 1];fc = fc+getPixel(invASSS[4*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 0];fc = fc+getPixel(invASSS[4*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +

        "if (viewId.s>=3.00){                   { coeff = coeff+invASSS[5*6 + 0];fc = fc+getPixel(invASSS[5*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=2.00){                   { coeff = coeff+invASSS[5*6 + 1];fc = fc+getPixel(invASSS[5*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=2.00){                   { coeff = coeff+invASSS[5*6 + 2];fc = fc+getPixel(invASSS[5*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=1.00){                   { coeff = coeff+invASSS[5*6 + 3];fc = fc+getPixel(invASSS[5*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=1.00){                   { coeff = coeff+invASSS[5*6 + 4];fc = fc+getPixel(invASSS[5*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        "                   {                   { coeff = coeff+invASSS[5*6 + 5];fc = fc+getPixel(invASSS[5*6 + 5],tNormal, vec2(viewId.s, viewId.t), sPixId);}};\n" +
        "                   {                   { coeff = coeff+invASSS[5*6 + 4];fc = fc+getPixel(invASSS[5*6 + 4],tSuperX, vec2(viewId.s, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 7.00){                   { coeff = coeff+invASSS[5*6 + 3];fc = fc+getPixel(invASSS[5*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 7.00){                   { coeff = coeff+invASSS[5*6 + 2];fc = fc+getPixel(invASSS[5*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 6.00){                   { coeff = coeff+invASSS[5*6 + 1];fc = fc+getPixel(invASSS[5*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 6.00){                   { coeff = coeff+invASSS[5*6 + 0];fc = fc+getPixel(invASSS[5*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" +

        "if (viewId.s>=3.00){                   { coeff = coeff+invASSS[4*6 + 0];fc = fc+getPixel(invASSS[4*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=2.00){                   { coeff = coeff+invASSS[4*6 + 1];fc = fc+getPixel(invASSS[4*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=2.00){                   { coeff = coeff+invASSS[4*6 + 2];fc = fc+getPixel(invASSS[4*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=1.00){                   { coeff = coeff+invASSS[4*6 + 3];fc = fc+getPixel(invASSS[4*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=1.00){                   { coeff = coeff+invASSS[4*6 + 4];fc = fc+getPixel(invASSS[4*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        "                   {                   { coeff = coeff+invASSS[4*6 + 5];fc = fc+getPixel(invASSS[4*6 + 5],tSuperY, vec2(viewId.s,      viewId.t), sPixId);}};\n" +
        "                   {                   { coeff = coeff+invASSS[4*6 + 4];fc = fc+getPixel(invASSS[4*6 + 4],tSuperD, vec2(viewId.s,      viewId.t), sPixId);}};\n" +
        "if (viewId.s< 7.00){                   { coeff = coeff+invASSS[4*6 + 3];fc = fc+getPixel(invASSS[4*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 7.00){                   { coeff = coeff+invASSS[4*6 + 2];fc = fc+getPixel(invASSS[4*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 6.00){                   { coeff = coeff+invASSS[4*6 + 1];fc = fc+getPixel(invASSS[4*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 6.00){                   { coeff = coeff+invASSS[4*6 + 0];fc = fc+getPixel(invASSS[4*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" +

        "if (viewId.s>=3.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 0];fc = fc+getPixel(invASSS[3*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 1];fc = fc+getPixel(invASSS[3*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 2];fc = fc+getPixel(invASSS[3*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 3];fc = fc+getPixel(invASSS[3*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 4];fc = fc+getPixel(invASSS[3*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" +
        "                   {if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 5];fc = fc+getPixel(invASSS[3*6 + 5],tNormal, vec2(viewId.s, viewId.t+1.00), sPixId);}};\n" +
        "                   {if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 4];fc = fc+getPixel(invASSS[3*6 + 4],tSuperX, vec2(viewId.s, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 3];fc = fc+getPixel(invASSS[3*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 2];fc = fc+getPixel(invASSS[3*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 1];fc = fc+getPixel(invASSS[3*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 0];fc = fc+getPixel(invASSS[3*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +

        "if (viewId.s>=3.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 0];fc = fc+getPixel(invASSS[2*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 1];fc = fc+getPixel(invASSS[2*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 2];fc = fc+getPixel(invASSS[2*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 3];fc = fc+getPixel(invASSS[2*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 4];fc = fc+getPixel(invASSS[2*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" +
        "                   {if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 5];fc = fc+getPixel(invASSS[2*6 + 5],tSuperY, vec2(viewId.s,      viewId.t+1.00), sPixId);}};\n" +
        "                   {if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 4];fc = fc+getPixel(invASSS[2*6 + 4],tSuperD, vec2(viewId.s,      viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 3];fc = fc+getPixel(invASSS[2*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 2];fc = fc+getPixel(invASSS[2*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 1];fc = fc+getPixel(invASSS[2*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 0];fc = fc+getPixel(invASSS[2*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +

        "if (viewId.s>=3.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 0];fc = fc+getPixel(invASSS[1*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 1];fc = fc+getPixel(invASSS[1*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 2];fc = fc+getPixel(invASSS[1*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 3];fc = fc+getPixel(invASSS[1*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 4];fc = fc+getPixel(invASSS[1*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        "                   {if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 5];fc = fc+getPixel(invASSS[1*6 + 5],tNormal, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" +
        "                   {if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 4];fc = fc+getPixel(invASSS[1*6 + 4],tSuperX, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 3];fc = fc+getPixel(invASSS[1*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 2];fc = fc+getPixel(invASSS[1*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 1];fc = fc+getPixel(invASSS[1*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s <6.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 0];fc = fc+getPixel(invASSS[1*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" +

        "if (viewId.s>=3.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 0];fc = fc+getPixel(invASSS[0*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 1];fc = fc+getPixel(invASSS[0*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 2];fc = fc+getPixel(invASSS[0*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 3];fc = fc+getPixel(invASSS[0*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 4];fc = fc+getPixel(invASSS[0*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        "                   {if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 5];fc = fc+getPixel(invASSS[0*6 + 5],tSuperY, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" +
        "                   {if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 4];fc = fc+getPixel(invASSS[0*6 + 4],tSuperD, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 3];fc = fc+getPixel(invASSS[0*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 2];fc = fc+getPixel(invASSS[0*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 1];fc = fc+getPixel(invASSS[0*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 0];fc = fc+getPixel(invASSS[0*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" +
        "fc = fc/coeff;" +
    //    "fc = 1.0 - fc;" +
        "gl_FragColor = vec4(fc, fc, fc, 1.0);" +
    "}";


    // SSS test
    var _SSSSwizzleFragmentShaderSrcTest =
    "precision highp float;" +
    "varying  vec2 vUv; 			\n" +
    //"uniform sampler2D tNormal; 			\n" +
    //"uniform sampler2D tSuperX; 			\n" +
    //"uniform sampler2D tSuperY; 			\n" +
    //"uniform sampler2D tSuperD; 			\n" +
    "uniform sampler2D tSuperSSS; 			\n" +
    "uniform vec2 renderSize;              \n " +
    "float getPixel( in float amplitude, in sampler2D texture, in vec2 id) {  \n" +
    //    "vec2 id  = vec2( ( sPixId.s + viewId.s*renderSize.x/8.0 )/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t + viewId.t*renderSize.y/8.0 )/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n" +
        "vec4 p   = texture2D( texture, id );\n" +
        "float pb = amplitude * ( p.r + p.g + p.b ) / 3.0;\n" +
        "return pb;\n" +
        "}\n" +
    "void main(void) {						\n" +
        "vec2 pixelCoord = vec2( floor((vUv.s)*renderSize.x), floor(vUv.t*renderSize.y) ); " +
        "pixelCoord      = vec2(max(pixelCoord.s - 0.0, 0.0), max(pixelCoord.t - 0.0, 0.0));" +
        //"vec2 viewId     = vec2(   mod(pixelCoord.s,16.0)  ,   mod(pixelCoord.t,16.0)  ); " +
         //"vec2 sPixId     = vec2( floor(pixelCoord.s/16.0)  , floor(pixelCoord.t/16.0)  ); " +
        "vec2 sPixId     = vec2(   mod(pixelCoord.s, 200.0)  ,   mod(pixelCoord.t, 150.0)  ); " +
       "vec2 viewId     = vec2( floor(pixelCoord.s/200.0)  , floor(pixelCoord.t/150.0)  ); " +
        "vec2 id         = vec2( ( sPixId.s + viewId.s       *renderSize.x/16.0)/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t + viewId.t       *renderSize.y/16.0)/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n" +

        //"float fc        = 0.0;" +
        //"float coeff = 0.0;" +
        //"if (viewId.s>=3.00){if (viewId.t>=3.00){ coeff = coeff-0.00373;fc = fc+getPixel(-0.00373,tSuperD, vec2(viewId.s-3.00, viewId.t-3.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=3.00){ coeff = coeff-0.00559;fc = fc+getPixel(-0.00559,tSuperY, vec2(viewId.s-2.00, viewId.t-3.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=3.00){ coeff = coeff+0.01638;fc = fc+getPixel(0.01638,tSuperD, vec2(viewId.s-2.00, viewId.t-3.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=3.00){ coeff = coeff+0.03016;fc = fc+getPixel(0.03016,tSuperY, vec2(viewId.s-1.00, viewId.t-3.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=3.00){ coeff = coeff+0.00581;fc = fc+getPixel(0.00581,tSuperD, vec2(viewId.s-1.00, viewId.t-3.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=3.00){ coeff = coeff-0.02145;fc = fc+getPixel(-0.02145,tSuperY, vec2(viewId.s,     viewId.t-3.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=3.00){ coeff = coeff+0.00581;fc = fc+getPixel(0.00581,tSuperD, vec2(viewId.s,      viewId.t-3.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=3.00){ coeff = coeff+0.03016;fc = fc+getPixel(0.03016,tSuperY, vec2(viewId.s+1.00, viewId.t-3.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=3.00){ coeff = coeff+0.01638;fc = fc+getPixel(0.01638,tSuperD, vec2(viewId.s+1.00, viewId.t-3.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=3.00){ coeff = coeff-0.00559;fc = fc+getPixel(-0.00559,tSuperY, vec2(viewId.s+2.00, viewId.t-3.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=3.00){ coeff = coeff-0.00373;fc = fc+getPixel(-0.00373,tSuperD, vec2(viewId.s+2.00, viewId.t-3.00), sPixId);}};\n" +

        //"if (viewId.s>=3.00){if (viewId.t>=2.00){ coeff = coeff-0.00559;fc = fc+getPixel(-0.00559,tSuperX, vec2(viewId.s-3.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff-0.03730;fc = fc+getPixel(-0.03730,tNormal, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+0.02457;fc = fc+getPixel(0.02457,tSuperX, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+0.20110;fc = fc+getPixel(0.20110,tNormal, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+0.00871;fc = fc+getPixel(0.00871,tSuperX, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=2.00){ coeff = coeff-0.14301;fc = fc+getPixel(-0.14301,tNormal, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=2.00){ coeff = coeff+0.00871;fc = fc+getPixel(0.00871,tSuperX, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+0.20110;fc = fc+getPixel(0.20110,tNormal, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+0.02457;fc = fc+getPixel(0.02457,tSuperX, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff-0.03730;fc = fc+getPixel(-0.03730,tNormal, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s <6.00){if (viewId.t>=2.00){ coeff = coeff-0.00559;fc = fc+getPixel(-0.00559,tSuperX, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +

        //"if (viewId.s>=3.00){if (viewId.t>=2.00){ coeff = coeff+0.00746;fc = fc+getPixel(0.00746,tSuperD, vec2(viewId.s-3.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+0.01119;fc = fc+getPixel(0.01119,tSuperY, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff-0.01795;fc = fc+getPixel(-0.01795,tSuperD, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff-0.03811;fc = fc+getPixel(-0.03811,tSuperY, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff-0.08873;fc = fc+getPixel(-0.08873,tSuperD, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=2.00){ coeff = coeff-0.09498;fc = fc+getPixel(-0.09498,tSuperY, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=2.00){ coeff = coeff-0.08873;fc = fc+getPixel(-0.08873,tSuperD, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff-0.03811;fc = fc+getPixel(-0.03811,tSuperY, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff-0.01795;fc = fc+getPixel(-0.01795,tSuperD, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff+0.01119;fc = fc+getPixel(0.01119,tSuperY, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff+0.00746;fc = fc+getPixel(0.00746,tSuperD, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +

        //"if (viewId.s>=3.00){if (viewId.t>=1.00){ coeff = coeff+0.01679;fc = fc+getPixel(0.01679,tSuperX, vec2(viewId.s-3.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+0.11192;fc = fc+getPixel(0.11192,tNormal, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff-0.05149;fc = fc+getPixel(-0.05149,tSuperX, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff-0.45520;fc = fc+getPixel(-0.45520,tNormal, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff-0.14181;fc = fc+getPixel(-0.14181,tSuperX, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=1.00){ coeff = coeff-0.49018;fc = fc+getPixel(-0.49018,tNormal, vec2(viewId.s, viewId.t-1.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=1.00){ coeff = coeff-0.14181;fc = fc+getPixel(-0.14181,tSuperX, vec2(viewId.s, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff-0.45520;fc = fc+getPixel(-0.45520,tNormal, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff-0.05149;fc = fc+getPixel(-0.05149,tSuperX, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+0.11192;fc = fc+getPixel(0.11192,tNormal, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+0.01679;fc = fc+getPixel(0.01679,tSuperX, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +

        //"if (viewId.s>=3.00){if (viewId.t>=1.00){ coeff = coeff+0.01033;fc = fc+getPixel(0.01033,tSuperD, vec2(viewId.s-3.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+0.01549;fc = fc+getPixel(0.01549,tSuperY, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff-0.05796;fc = fc+getPixel(-0.05796,tSuperD, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff-0.10243;fc = fc+getPixel(-0.10243,tSuperY, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+0.22839;fc = fc+getPixel(0.22839,tSuperD, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=1.00){ coeff = coeff+0.44501;fc = fc+getPixel(0.44501,tSuperY, vec2(viewId.s, viewId.t-1.00), sPixId);}};\n" +
        //"                   {if (viewId.t>=1.00){ coeff = coeff+0.22839;fc = fc+getPixel(0.22839,tSuperD, vec2(viewId.s, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff-0.10243;fc = fc+getPixel(-0.10243,tSuperY, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff-0.05796;fc = fc+getPixel(-0.05796,tSuperD, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+0.01549;fc = fc+getPixel(0.01549,tSuperY, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+0.01033;fc = fc+getPixel(0.01033,tSuperD, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +

        //"if (viewId.s>=3.00){{ coeff = coeff-0.00130;fc = fc+getPixel(-0.00130,tSuperX, vec2(viewId.s-3.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s>=2.00){{ coeff = coeff-0.00864;fc = fc+getPixel(-0.00864,tNormal, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s>=2.00){{ coeff = coeff-0.03544;fc = fc+getPixel(-0.03544,tSuperX, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s>=1.00){{ coeff = coeff-0.22765;fc = fc+getPixel(-0.22765,tNormal, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s>=1.00){{ coeff = coeff+0.48439;fc = fc+getPixel(0.48439,tSuperX, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        //"                   {{ coeff = coeff+3.45690;fc = fc+getPixel(3.45690,tNormal, vec2(viewId.s, viewId.t), sPixId);}};\n" +
        //"                   {{ coeff = coeff+0.48439;fc = fc+getPixel(0.48439,tSuperX, vec2(viewId.s, viewId.t), sPixId);}};\n" +
        //"if (viewId.s< 7.00){{ coeff = coeff-0.22765;fc = fc+getPixel(-0.22765,tNormal, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s< 7.00){{ coeff = coeff-0.03544;fc = fc+getPixel(-0.03544,tSuperX, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s< 6.00){{ coeff = coeff-0.00864;fc = fc+getPixel(-0.00864,tNormal, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s< 6.00){{ coeff = coeff-0.00130;fc = fc+getPixel(-0.00130,tSuperX, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" +

        //"if (viewId.s>=3.00){{ coeff = coeff+0.01033;fc = fc+getPixel(0.01033,tSuperD, vec2(viewId.s-3.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s>=2.00){{ coeff = coeff+0.01549;fc = fc+getPixel(0.01549,tSuperY, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s>=2.00){{ coeff = coeff-0.05796;fc = fc+getPixel(-0.05796,tSuperD, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s>=1.00){{ coeff = coeff-0.10243;fc = fc+getPixel(-0.10243,tSuperY, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s>=1.00){{ coeff = coeff+0.22839;fc = fc+getPixel(0.22839,tSuperD, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        //"                   {{ coeff = coeff+0.44501;fc = fc+getPixel(0.44501,tSuperY, vec2(viewId.s, viewId.t), sPixId);}};\n" +
        //"                   {{ coeff = coeff+0.22839;fc = fc+getPixel(0.22839,tSuperD, vec2(viewId.s, viewId.t), sPixId);}};\n" +
        //"if (viewId.s< 7.00){{ coeff = coeff-0.10243;fc = fc+getPixel(-0.10243,tSuperY, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s< 7.00){{ coeff = coeff-0.05796;fc = fc+getPixel(-0.05796,tSuperD, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s< 6.00){{ coeff = coeff+0.01549;fc = fc+getPixel(0.01549,tSuperY, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" +
        //"if (viewId.s< 6.00){{ coeff = coeff+0.01033;fc = fc+getPixel(0.01033,tSuperD, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" +

        //"if (viewId.s>=3.00){if (viewId.t<7.00){ coeff = coeff+0.01679;fc = fc+getPixel(0.01679,tSuperX, vec2(viewId.s-3.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+0.11192;fc = fc+getPixel(0.11192,tNormal, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff-0.05149;fc = fc+getPixel(-0.05149,tSuperX, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff-0.45520;fc = fc+getPixel(-0.45520,tNormal, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff-0.14181;fc = fc+getPixel(-0.14181,tSuperX, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" +
        //"                   {if (viewId.t<7.00){ coeff = coeff-0.49018;fc = fc+getPixel(-0.49018,tNormal, vec2(viewId.s, viewId.t+1.00), sPixId);}};\n" +
        //"                   {if (viewId.t<7.00){ coeff = coeff-0.14181;fc = fc+getPixel(-0.14181,tSuperX, vec2(viewId.s, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff-0.45520;fc = fc+getPixel(-0.45520,tNormal, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff-0.05149;fc = fc+getPixel(-0.05149,tSuperX, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+0.11192;fc = fc+getPixel(0.11192,tNormal, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+0.01679;fc = fc+getPixel(0.01679,tSuperX, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +

        //"if (viewId.s>=3.00){if (viewId.t<7.00){ coeff = coeff+0.00746;fc = fc+getPixel(0.00746,tSuperD, vec2(viewId.s-3.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+0.01119;fc = fc+getPixel(0.01119,tSuperY, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff-0.01795;fc = fc+getPixel(-0.01795,tSuperD, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff-0.03811;fc = fc+getPixel(-0.03811,tSuperY, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff-0.08873;fc = fc+getPixel(-0.08873,tSuperD, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" +
        //"                   {if (viewId.t<7.00){ coeff = coeff-0.09498;fc = fc+getPixel(-0.09498,tSuperY, vec2(viewId.s, viewId.t+1.00), sPixId);}};\n" +
        //"                   {if (viewId.t<7.00){ coeff = coeff-0.08873;fc = fc+getPixel(-0.08873,tSuperD, vec2(viewId.s, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff-0.03811;fc = fc+getPixel(-0.03811,tSuperY, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff-0.01795;fc = fc+getPixel(-0.01795,tSuperD, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+0.01119;fc = fc+getPixel(0.01119,tSuperY, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+0.00746;fc = fc+getPixel(0.00746,tSuperD, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +

        //"if (viewId.s>=3.00){if (viewId.t<6.00){ coeff = coeff-0.00559;fc = fc+getPixel(-0.00559,tSuperX, vec2(viewId.s-3.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff-0.03730;fc = fc+getPixel(-0.03730,tNormal, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+0.02457;fc = fc+getPixel(0.02457,tSuperX, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+0.20110;fc = fc+getPixel(0.20110,tNormal, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+0.00871;fc = fc+getPixel(0.00871,tSuperX, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        //"                   {if (viewId.t<6.00){ coeff = coeff-0.14301;fc = fc+getPixel(-0.14301,tNormal, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" +
        //"                   {if (viewId.t<6.00){ coeff = coeff+0.00871;fc = fc+getPixel(0.00871,tSuperX, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+0.20110;fc = fc+getPixel(0.20110,tNormal, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+0.02457;fc = fc+getPixel(0.02457,tSuperX, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff-0.03730;fc = fc+getPixel(-0.03730,tNormal, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s <6.00){if (viewId.t<6.00){ coeff = coeff-0.00559;fc = fc+getPixel(-0.00559,tSuperX, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" +

        //"if (viewId.s>=3.00){if (viewId.t<6.00){ coeff = coeff-0.00373;fc = fc+getPixel(-0.00373,tSuperD, vec2(viewId.s-3.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff-0.00559;fc = fc+getPixel(-0.00559,tSuperY, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+0.01638;fc = fc+getPixel(0.01638,tSuperD, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+0.03016;fc = fc+getPixel(0.03016,tSuperY, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+0.00581;fc = fc+getPixel(0.00581,tSuperD, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        //"                   {if (viewId.t<6.00){ coeff = coeff-0.02145;fc = fc+getPixel(-0.02145,tSuperY, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" +
        //"                   {if (viewId.t<6.00){ coeff = coeff+0.00581;fc = fc+getPixel(0.00581,tSuperD, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+0.03016;fc = fc+getPixel(0.03016,tSuperY, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+0.01638;fc = fc+getPixel(0.01638,tSuperD, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff-0.00559;fc = fc+getPixel(-0.00559,tSuperY, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" +
        //"if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff-0.00373;fc = fc+getPixel(-0.00373,tSuperD, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" +
        //"fc = fc/coeff;" +
    //    "fc = 1.0 - fc;" +


        "float fc        = 0.0;" +
        "fc = getPixel( 1.0, tSuperSSS, id);" +
        "gl_FragColor = vec4(fc, fc, fc, 1.0);" +
    "}";

    // depth 
    var _DepthFragmentShaderSrc =
    "precision highp float;" +
    "varying  vec2 vUv; 			\n" +
    "uniform sampler2D tDepth; 			\n" +
    "uniform vec2 renderSize;              \n " +
    "float getPixel( in float amplitude, in sampler2D texture, in vec2 viewId, in vec2 sPixId) {  \n" +
        "vec2 id  = vec2( ( sPixId.s + viewId.s*renderSize.x/8.0 )/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t + viewId.t*renderSize.y/8.0 )/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n" +
        //"vec4 p   = texture2D( texture, id );\n" +
        //"float pb = amplitude * ( p.r + p.g + p.b ) / 3.0;\n" +
        //"vec4 p    = texture2D( texture, id );\n" +
        //"float pb = amplitude * p.r ;\n" +
        "float pb = texture2D( texture, id ).r ;\n" +
        "return pb;\n" +
        "}\n" +

    //"float bdepth(vec2 coords) {"+ss
    //	//"// Depth buffer blur"+
    //	//"float d = 0.0;"+
    //	//"float kernel[9];"+
    //	//"vec2 offset[9];"+

    //	//"vec2 wh = vec2(texel.x, texel.y) * dbsize;"+

    //	//"offset[0] = vec2(-wh.x,-wh.y);"+
    //	//"offset[1] = vec2( 0.0, -wh.y);"+
    //	//"offset[2] = vec2( wh.x -wh.y);"+

    //	//"offset[3] = vec2(-wh.x,  0.0);"+
    //	//"offset[4] = vec2( 0.0,   0.0);"+
    //	//"offset[5] = vec2( wh.x,  0.0);"+

    //	//"offset[6] = vec2(-wh.x, wh.y);"+
    //	//"offset[7] = vec2( 0.0,  wh.y);"+
    //	//"offset[8] = vec2( wh.x, wh.y);"+

    //	//"kernel[0] = 1.0/16.0;   kernel[1] = 2.0/16.0;   kernel[2] = 1.0/16.0;"+
    //	//"kernel[3] = 2.0/16.0;   kernel[4] = 4.0/16.0;   kernel[5] = 2.0/16.0;"+
    //	//"kernel[6] = 1.0/16.0;   kernel[7] = 2.0/16.0;   kernel[8] = 1.0/16.0;"+


    //	//"for( int i=0; i<9; i++ ) {"+
    //		"float tmp = texture2D(tDepth, coords).r;"+
    //		"d = tmp;"+
    //	//"}"+

    //	"return d;"+
    //"}"+
    "void main(void) {						\n" +
        "vec2 pixelCoord = vec2( floor((vUv.s)*renderSize.x), floor(vUv.t*renderSize.y) ); " +
        "pixelCoord      = vec2(max(pixelCoord.s - 0.0, 0.0), max(pixelCoord.t - 0.0, 0.0));" +
        "vec2 viewId     = vec2(   mod(pixelCoord.s,8.0)  ,   mod(pixelCoord.t,8.0)  ); " +
        "vec2 sPixId     = vec2( floor(pixelCoord.s/8.0)  , floor(pixelCoord.t/8.0)  ); " +
        //"vec2 sPixId     = vec2(   mod(pixelCoord.s, 200.0)  ,   mod(pixelCoord.t, 150.0)  ); " +
        //"vec2 viewId     = vec2( floor(pixelCoord.s/200.0)  , floor(pixelCoord.t/150.0)  ); " +
        "float fc        = 0.5;" +
        "fc = getPixel( 1.0, tDepth, viewId, sPixId);" +
       // "fc = texture2D(tDepth, vUv.xy).r;" +
       // "fc = 1.0 - fc;" +
        "gl_FragColor = vec4(fc, fc, fc, 1.0);" +
    "}";



    // member func
    this.useBasicSwizzleShader = function () {
        this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTarget.generateMipmaps = false;
        this.matBasic = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": { type: "t", value: this._swizzleRenderTarget },
                "renderSize": { type: "v2", value: new THREE.Vector2(this.width, this.height) }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SwizzleFragmentShaderSrc,
            depthWrite: false
        });
        this.materialSwizzle = this.matBasic;
    };
    this.useSharpenSwizzleShader = function () {
        this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTarget.generateMipmaps = false;
        this.matSharpen = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": { type: "t", value: this._swizzleRenderTarget },
                "fader": { type: "f", value: 1.0 },
                "invA": { type: "fv1", value: invA },
                "renderSize": { type: "v2", value: new THREE.Vector2(this.width, this.height) }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SharpenSwizzleFragmentShaderSrc,
            depthWrite: false
        });
        this.materialSwizzle = this.matSharpen;
    }
    this.useSuperSampleSwizzleShader = function () {
        this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTargetSftX = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTargetSftY = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTargetSftXY = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTarget.generateMipmaps = false; this._swizzleRenderTargetSftX.generateMipmaps = false;
        this._swizzleRenderTargetSftY.generateMipmaps = false; this._swizzleRenderTargetSftXY.generateMipmaps = false;
        this.matSuperSample = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": { type: "t", value: this._swizzleRenderTarget },
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
    this.useSSSSShader = function () {
        this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTargetSftX = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTargetSftY = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTargetSftXY = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTarget.generateMipmaps = false; this._swizzleRenderTargetSftX.generateMipmaps = false;
        this._swizzleRenderTargetSftY.generateMipmaps = false; this._swizzleRenderTargetSftXY.generateMipmaps = false;
        this.matSSS = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": { type: "t", value: this._swizzleRenderTarget },
                "tSuperX": { type: "t", value: this._swizzleRenderTargetSftX },
                "tSuperY": { type: "t", value: this._swizzleRenderTargetSftY },
                "tSuperD": { type: "t", value: this._swizzleRenderTargetSftXY },
                "invASSS": { type: "fv1", value: invA_66 },
                "fader": { type: "f", value: 1.0 },
                "renderSize": { type: "v2", value: new THREE.Vector2(this.width, this.height) }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SSSSwizzleFragmentShaderSrc,
            depthWrite: false
        });
        this.materialSwizzle = this.matSSS;
    }
    this.useSSSSTestShader = function () {
        //this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        //this._swizzleRenderTargetSftX = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        //this._swizzleRenderTargetSftY = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        //this._swizzleRenderTargetSftXY = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
        this._swizzleRenderTargetSSS = new THREE.WebGLRenderTarget(this.width * 2, this.height * 2, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });

        //this._swizzleRenderTarget.generateMipmaps = false; this._swizzleRenderTargetSftX.generateMipmaps = false;
        //this._swizzleRenderTargetSftY.generateMipmaps = false; this._swizzleRenderTargetSftXY.generateMipmaps = false;
        this._swizzleRenderTargetSSS.generateMipmaps = false;
        this.matSSSTest = new THREE.ShaderMaterial({
            uniforms: {
                //"tNormal": { type: "t", value: this._swizzleRenderTarget },
                //"tSuperX": { type: "t", value: this._swizzleRenderTargetSftX },
                //"tSuperY": { type: "t", value: this._swizzleRenderTargetSftY },
                //"tSuperD": { type: "t", value: this._swizzleRenderTargetSftXY },

                "tSuperSSS": { type: "t", value: this._swizzleRenderTargetSSS },

                "invASSS": { type: "fv1", value: invA_66 },
                "fader": { type: "f", value: 1.0 },
                "renderSize": { type: "v2", value: new THREE.Vector2(this._swizzleRenderTargetSSS.width, this._swizzleRenderTargetSSS.height) }// quat of real size
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SSSSwizzleFragmentShaderSrcTest,
            depthWrite: false
        });
        this.materialSwizzle = this.matSSSTest;
    }
    this.useDepthShader = function () {
        this._DepthRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat });
        this._DepthRenderTarget.generateMipmaps = false;
        this.matDepth = new THREE.ShaderMaterial({
            uniforms: {
                "tDepth": { type: "t", value: this._DepthRenderTarget },
                "renderSize": { type: "v2", value: new THREE.Vector2(this.width, this.height) }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _DepthFragmentShaderSrc,
            //depthWrite: true
        });
        this.materialSwizzle = this.matDepth;
    };






    //choose shaders to use
    switch (this.render.nShaderMode) {
        case 0: this.useBasicSwizzleShader(); break;
        case 1: this.useSharpenSwizzleShader(); break;
        case 2: this.useSuperSampleSwizzleShader(); break;
        case 3: this.useSSSSShader(); break;
        case 4: this.useSSSSTestShader(); break;
        case 5: this.useDepthShader(); break;
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

        switch (this.render.nShaderMode) {
            case 0: this.useBasicSwizzleShader(); break;
            case 1: this.useSharpenSwizzleShader(); break;
            case 2: this.useSuperSampleSwizzleShader(); break;
            case 3: this.useSSSSShader(); break;
            case 4: this.useSSSSTestShader(); break;
            case 5: this.useDepthShader(); break;
            default:
                this.useBasicSwizzleShader();
        }
        this.swizzleMesh = new THREE.Mesh(swizzleBackgroundGeometry, this.materialSwizzle);
        this.LEIA_output.add(this.swizzleMesh);
    };

    var _this = this;
    // call back
    document.addEventListener('keydown', onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        //console.log(keyCode);
        switch (keyCode) {
            case 83: // 's'
                //_that.bSuperSample = !_that.bSuperSample;
                _this.render.nShaderMode++;
                _this.render.nShaderMode = _this.render.nShaderMode % 6;
                if (_this.render._shaderManager != undefined) {
                    switch (_this.render.nShaderMode) {
                        case 0: _this.render._shaderManager.useBasicSwizzleShader(); _this.render._shaderManager.LEIA_output.children[0].material = _this.render._shaderManager.matBasic; break;
                        case 1: _this.render._shaderManager.useSharpenSwizzleShader(); _this.render._shaderManager.LEIA_output.children[0].material = _this.render._shaderManager.matSharpen; break;
                        case 2: _this.render._shaderManager.useSuperSampleSwizzleShader(); _this.render._shaderManager.LEIA_output.children[0].material = _this.render._shaderManager.matSuperSample; break;
                        case 3: _this.render._shaderManager.useSSSSShader(); _this.render._shaderManager.LEIA_output.children[0].material = _this.render._shaderManager.matSSS;; break;
                        case 4: _this.render._shaderManager.useSSSSTestShader(); _this.render._shaderManager.LEIA_output.children[0].material = _this.render._shaderManager.matSSSTest;; break;
                        case 5: _this.render._shaderManager.useDepthShader(); _this.render._shaderManager.LEIA_output.children[0].material = _this.render._shaderManager.matDepth;; break;
                            //default:
                            //    _that._shaderManager.useBasicSwizzleShader(); _that._shaderManager.LEIA_output.children[0].material = _that._shaderManager.matBasic;
                    }
                }
                break;
        }
    }
}
// shaders end