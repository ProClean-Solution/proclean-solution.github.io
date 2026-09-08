(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,34778,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(75056),s=e.i(94800),n=e.i(70950),n=n,o=e.i(90072);let i=(0,r.forwardRef)(function({lowPower:e=!1},a){let s=function(){let[e,t]=(0,r.useState)(!1);return(0,r.useEffect)(()=>{let e=!1;return document.fonts?.ready.then(()=>{e||t(!0)}),()=>{e=!0}},[]),(0,r.useMemo)(()=>{if("u"<typeof document)return null;let e=document.createElement("canvas");e.width=1024,e.height=512;let t=e.getContext("2d");if(!t)return null;let r=t.createLinearGradient(0,0,0,512);r.addColorStop(0,"#16385a"),r.addColorStop(.5,"#1d4a75"),r.addColorStop(1,"#132f4d"),t.fillStyle=r,t.fillRect(0,0,1024,512),t.strokeStyle="rgba(210,232,255,0.35)",t.lineWidth=3,t.strokeRect(232,40,560,432),t.textAlign="center",t.fillStyle="#f4f9ff",t.font="700 62px 'Plus Jakarta Sans', system-ui, sans-serif",t.fillText("ProClean",512,196),t.font="300 44px 'Plus Jakarta Sans', system-ui, sans-serif",t.fillStyle="#a9cdf0",t.fillText("SOLUTION",512,250),t.strokeStyle="rgba(169,205,240,0.45)",t.lineWidth=2,t.beginPath(),t.moveTo(407,292),t.lineTo(617,292),t.stroke(),t.fillStyle="#8fb4d8",t.font="500 24px 'Plus Jakarta Sans', system-ui, sans-serif",t.letterSpacing="5px",t.fillText("GLASREINIGER",512,340),t.font="400 18px 'Plus Jakarta Sans', system-ui, sans-serif",t.fillStyle="#6f93b5",t.fillText("500 ML",512,382);let a=new o.CanvasTexture(e);return a.colorSpace=o.SRGBColorSpace,a.anisotropy=4,a},[e])}(),n=(0,r.useMemo)(()=>{let t;return new o.LatheGeometry(((t=[]).push(new o.Vector2(0,-1.05)),t.push(new o.Vector2(.44,-1.05)),t.push(new o.Vector2(.475,-.99)),t.push(new o.Vector2(.475,.3)),t.push(new o.Vector2(.47,.42)),t.push(new o.Vector2(.4,.56)),t.push(new o.Vector2(.27,.68)),t.push(new o.Vector2(.2,.74)),t.push(new o.Vector2(.2,.84)),t),e?32:64)},[e]),i=(0,r.useMemo)(()=>new o.CylinderGeometry(.445,.42,1.45,e?24:48),[e]);return(0,r.useEffect)(()=>()=>{n.dispose(),i.dispose(),s?.dispose()},[n,i,s]),(0,t.jsxs)("group",{ref:a,name:"bottle",children:[(0,t.jsx)("mesh",{geometry:i,position:[0,-.31,0],name:"liquid",children:(0,t.jsx)("meshStandardMaterial",{color:"#2b6ea8",transparent:!0,opacity:.72,roughness:.15,metalness:0})}),(0,t.jsx)("mesh",{geometry:n,name:"body",children:e?(0,t.jsx)("meshStandardMaterial",{color:"#cfe4f5",transparent:!0,opacity:.34,roughness:.08,metalness:.1,side:o.DoubleSide}):(0,t.jsx)("meshPhysicalMaterial",{color:"#eaf4ff",transmission:.92,thickness:.5,ior:1.46,roughness:.07,metalness:0,clearcoat:1,clearcoatRoughness:.06,transparent:!0,side:o.DoubleSide})}),(0,t.jsxs)("mesh",{position:[0,-.22,0],rotation:[0,Math.PI,0],name:"label",children:[(0,t.jsx)("cylinderGeometry",{args:[.483,.483,.66,e?32:64,1,!0]}),(0,t.jsx)("meshStandardMaterial",{map:s??void 0,emissiveMap:s??void 0,emissive:"#ffffff",emissiveIntensity:.72,roughness:.5,metalness:.05,side:o.DoubleSide,transparent:!0})]}),(0,t.jsxs)("mesh",{position:[0,.82,0],name:"collar",children:[(0,t.jsx)("cylinderGeometry",{args:[.235,.225,.13,e?20:40]}),(0,t.jsx)("meshStandardMaterial",{color:"#15181c",roughness:.45,metalness:.35})]}),(0,t.jsxs)("group",{position:[0,.88,0],scale:1.18,name:"head",children:[(0,t.jsxs)("mesh",{position:[0,.2,.13],name:"shroud",children:[(0,t.jsx)("boxGeometry",{args:[.27,.23,.58]}),(0,t.jsx)("meshStandardMaterial",{color:"#252b33",roughness:.28,metalness:.55})]}),(0,t.jsxs)("mesh",{position:[0,.29,.13],rotation:[Math.PI/2,0,0],children:[(0,t.jsx)("cylinderGeometry",{args:[.132,.132,.58,e?16:28]}),(0,t.jsx)("meshStandardMaterial",{color:"#2b323b",roughness:.24,metalness:.6})]}),(0,t.jsxs)("mesh",{position:[0,.2,.45],rotation:[Math.PI/2,0,0],children:[(0,t.jsx)("cylinderGeometry",{args:[.09,.095,.1,e?16:28]}),(0,t.jsx)("meshStandardMaterial",{color:"#1d232a",roughness:.3,metalness:.6})]}),(0,t.jsxs)("mesh",{position:[0,.2,.53],rotation:[Math.PI/2,0,0],name:"nozzle",children:[(0,t.jsx)("cylinderGeometry",{args:[.036,.055,.08,e?12:20]}),(0,t.jsx)("meshStandardMaterial",{color:"#161b21",roughness:.2,metalness:.75})]}),(0,t.jsxs)("mesh",{position:[0,-.02,-.06],name:"grip",children:[(0,t.jsx)("boxGeometry",{args:[.25,.34,.24]}),(0,t.jsx)("meshStandardMaterial",{color:"#20262e",roughness:.42,metalness:.4})]}),(0,t.jsxs)("group",{position:[0,.07,.27],rotation:[.3,0,0],name:"trigger",children:[(0,t.jsxs)("mesh",{position:[0,-.16,-.01],children:[(0,t.jsx)("boxGeometry",{args:[.115,.32,.05]}),(0,t.jsx)("meshStandardMaterial",{color:"#2a313a",roughness:.34,metalness:.45})]}),(0,t.jsxs)("mesh",{position:[0,-.31,.01],rotation:[-.3,0,0],children:[(0,t.jsx)("boxGeometry",{args:[.12,.09,.07]}),(0,t.jsx)("meshStandardMaterial",{color:"#323a44",roughness:.44,metalness:.35})]})]}),(0,t.jsxs)("mesh",{position:[0,-.72,0],children:[(0,t.jsx)("cylinderGeometry",{args:[.026,.026,1.62,10]}),(0,t.jsx)("meshStandardMaterial",{color:"#20262c",roughness:.5})]})]})]})}),l=`
  uniform float uTime;        // Spr\xfchfortschritt, 0..1
  uniform float uSize;        // Grundgr\xf6sse in Pixel
  uniform float uPixelRatio;

  attribute float aBirth;     // wann das Partikel startet, 0..1
  attribute float aLife;      // wie lange es lebt
  attribute float aScale;     // individuelle Gr\xf6sse
  attribute vec3  aDir;       // Richtung im Spr\xfchkegel
  attribute vec3  aTurb;      // Turbulenzphasen

  varying float vAlpha;
  varying float vDepth;

  void main() {
    // Lebensphase: 0 = gerade ausgetreten, 1 = aufgel\xf6st
    float age = (uTime - aBirth) / aLife;

    if (age < 0.0 || age > 1.0) {
      // Ausserhalb der Lebenszeit hinter die Kamera schieben statt zu zeichnen
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }

    // Grundbewegung entlang der Kegelrichtung, mit Abbremsen
    float travel = 1.0 - exp(-age * 2.6);
    vec3 pos = aDir * travel * 2.4;

    // Turbulenz: nimmt mit dem Alter zu, damit der Nebel nach vorn ausfranst
    float t = age * 6.28318;
    pos += vec3(
      sin(t * 1.7 + aTurb.x) * 0.06,
      sin(t * 1.3 + aTurb.y) * 0.05 - age * age * 0.12,  // leichtes Absinken
      cos(t * 1.9 + aTurb.z) * 0.06
    ) * age;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Tr\xf6pfchen wachsen beim Auff\xe4chern
    float grow = 0.35 + age * 0.9;
    gl_PointSize = uSize * aScale * grow * uPixelRatio / max(0.4, -mvPosition.z);

    // Dicht an der D\xfcse, weiche Aufl\xf6sung nach vorn
    vAlpha = smoothstep(0.0, 0.06, age) * (1.0 - smoothstep(0.35, 1.0, age));
    vDepth = -mvPosition.z;
  }
`,u=`
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vDepth;

  void main() {
    if (vAlpha <= 0.001) discard;

    // Weiches rundes Tr\xf6pfchen statt hartem Quadrat
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float mask = 1.0 - smoothstep(0.12, 0.5, d);
    if (mask <= 0.001) discard;

    // Tiefenabfall: was weit vorn ist, verliert sich im Dunkeln
    float depthFade = 1.0 - smoothstep(2.0, 7.0, vDepth);

    gl_FragColor = vec4(uColor, mask * vAlpha * uOpacity * depthFade);
  }
`;function c({progressRef:e,count:a=1800,position:n=[0,0,0],rotation:i=[0,0,0]}){let h=(0,r.useRef)(null),f=(0,r.useMemo)(()=>{let e=new o.BufferGeometry,t=new Float32Array(3*a),r=new Float32Array(a),s=new Float32Array(a),n=new Float32Array(a),i=new Float32Array(3*a),l=new Float32Array(3*a),u=o.MathUtils.degToRad(15);for(let e=0;e<a;e++){let t=Math.random()*Math.PI*2,a=Math.sqrt(Math.random())*u,o=Math.sin(a);i[3*e]=Math.cos(t)*o,i[3*e+1]=Math.sin(t)*o,i[3*e+2]=Math.cos(a),r[e]=.72*Math.random(),s[e]=.28+.4*Math.random(),n[e]=.25+1.5*Math.pow(Math.random(),2.4),l[3*e]=6.283*Math.random(),l[3*e+1]=6.283*Math.random(),l[3*e+2]=6.283*Math.random()}return e.setAttribute("position",new o.BufferAttribute(t,3)),e.setAttribute("aBirth",new o.BufferAttribute(r,1)),e.setAttribute("aLife",new o.BufferAttribute(s,1)),e.setAttribute("aScale",new o.BufferAttribute(n,1)),e.setAttribute("aDir",new o.BufferAttribute(i,3)),e.setAttribute("aTurb",new o.BufferAttribute(l,3)),e.boundingSphere=new o.Sphere(new o.Vector3(0,0,1.2),4),e},[a]),m=(0,r.useMemo)(()=>({uTime:{value:0},uSize:{value:20},uPixelRatio:{value:1},uColor:{value:new o.Color("#dbeaf7")},uOpacity:{value:0}}),[]);return(0,s.useFrame)(t=>{let r=e.current?.value??0;h.current&&(m.uTime.value=r,m.uOpacity.value=.9*(r>0&&r<1),m.uPixelRatio.value=Math.min(t.gl.getPixelRatio(),1.5))}),(0,t.jsxs)("points",{position:n,rotation:i,frustumCulled:!1,children:[(0,t.jsx)("primitive",{object:f,attach:"geometry"}),(0,t.jsx)("shaderMaterial",{ref:h,args:[{uniforms:m,vertexShader:l,fragmentShader:u,transparent:!0,depthWrite:!1,blending:o.AdditiveBlending}]})]})}var h=e.i(24932);function f({progressRef:e,lowPower:a}){let o=(0,r.useRef)(null),l=(0,r.useRef)(null),u=(0,r.useRef)({value:0}),m=(0,r.useRef)(null),d=(0,r.useRef)(null),p=(0,r.useRef)(null),{camera:g,size:x}=(0,n.C)();return(0,s.useFrame)(()=>{let t=e.current?.value??0,r=(0,h.smoothstep)((0,h.beat)(t,h.BEATS.reveal)),a=(0,h.smoothstep)((0,h.beat)(t,h.BEATS.emerge));if(d.current&&(d.current.intensity=(0,h.lerp)(4,40,r)+22*a),m.current&&(m.current.intensity=(0,h.lerp)(0,78,a)),p.current&&(p.current.intensity=(0,h.lerp)(0,20,a)),o.current){let e=(0,h.smoothstep)((0,h.beat)(t,h.BEATS.turn)),r=(0,h.smoothstep)((0,h.beat)(t,h.BEATS.logo)),s=(0,h.smoothstep)((0,h.beat)(t,h.BEATS.aim));o.current.rotation.y=(0,h.lerp)(-1.25,-.8,e)+(0,h.lerp)(0,.35,r),o.current.rotation.x=(0,h.lerp)(0,.2,s),o.current.rotation.z=(0,h.lerp)(0,-.06,s);let n=(0,h.lerp)(-.35,0,a),i=(0,h.smoothstep)((0,h.beat)(t,[.83,.97]));o.current.position.x=(0,h.lerp)(0,-5.4,i),o.current.position.z=(0,h.lerp)(0,2.4,i),o.current.position.y=(0,h.lerp)(n,-1.1,i);let l=(0,h.lerp)(1,.72,i);o.current.scale.setScalar(l);let u=(0,h.smoothstep)((0,h.beat)(t,h.BEATS.trigger)),c=o.current.getObjectByName("trigger");c&&(c.rotation.x=(0,h.lerp)(.34,.06,u))}let s=h.BEATS.trigger[0],n=h.BEATS.clear[1];u.current.value=Math.min(1,Math.max(0,(t-s)/(n-s)));let i=(0,h.smoothstep)((0,h.beat)(t,[.05,.62])),l=x.height/Math.max(1,x.width),c=(0,h.lerp)(6.4,4.7,i)*(l>1?1+(l-1)*.5:1),f=(0,h.lerp)(-.16,.1,i);g.position.set(Math.sin(f)*c,(0,h.lerp)(.6,.35,i),Math.cos(f)*c),g.lookAt(0,(0,h.lerp)(.2,.3,i),0)}),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("ambientLight",{intensity:.16,color:"#7f9dc0"}),(0,t.jsx)("pointLight",{ref:d,position:[-3.2,1.6,-2.4],intensity:2,color:"#5b9fe0",distance:14}),(0,t.jsx)("spotLight",{ref:m,position:[3.4,5.2,3.2],angle:.5,penumbra:.9,intensity:0,color:"#eaf3ff",distance:20}),(0,t.jsx)("pointLight",{ref:p,position:[1.1,-1.4,3.4],intensity:0,color:"#bcd6f0",distance:12}),(0,t.jsx)("pointLight",{position:[1.5,2.6,2.2],intensity:16,color:"#ffffff",distance:8}),(0,t.jsxs)("group",{ref:o,children:[(0,t.jsx)(i,{ref:l,lowPower:a}),(0,t.jsx)("group",{position:[0,1.08,.6],rotation:[-.14,0,0],children:(0,t.jsx)(c,{progressRef:u,count:a?700:2400})})]})]})}e.s(["IntroScene",0,function({progressRef:e,lowPower:r}){return(0,t.jsx)(a.Canvas,{dpr:r?[1,1.2]:[1,1.75],camera:{position:[0,.5,6.2],fov:38,near:.1,far:40},gl:{antialias:!r,alpha:!0,powerPreference:"high-performance"},style:{background:"transparent"},children:(0,t.jsx)(f,{progressRef:e,lowPower:r})})}],34778)},4769,function(e){e.n(e.i(34778))}]);