const chapters=[...document.querySelectorAll('.chapter')];
const journey=document.querySelector('.journey');
const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
let still=prefersReduced.matches, progress=0, target=0, lastTime=0, animationTime=0, active=-1;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
function updateTarget(){target=clamp(-journey.getBoundingClientRect().top/(journey.offsetHeight-innerHeight));}
addEventListener('scroll',updateTarget,{passive:true});
addEventListener('resize',updateTarget);
prefersReduced.addEventListener('change',e=>{still=e.matches;});
const film=document.querySelector('#film'), video=film.querySelector('video');
document.querySelector('.film-open').addEventListener('click',()=>{film.showModal();video.play().catch(()=>{});});
document.querySelector('.film-close').addEventListener('click',()=>film.close());
film.addEventListener('close',()=>video.pause());
film.addEventListener('click',e=>{if(e.target===film)film.close()});
function overlay(p){
 const weights=[1-smooth(.14,.27,p),smooth(.22,.34,p)*(1-smooth(.57,.69,p)),smooth(.64,.76,p)];
 const best=weights.indexOf(Math.max(...weights));
 chapters.forEach((el,i)=>{el.style.opacity=weights[i];el.style.transform=`translateY(${still?0:(1-weights[i])*20}px)`;el.classList.toggle('active',weights[i]>.005);el.inert=i!==best;});
 if(active!==best){active=best;document.querySelector('.scene-name').textContent=['Притяжение','Встреча','Программа'][best];}
 document.querySelector('.scene-progress i').style.width=`${p*100}%`;
}
let draw=()=>{},resize3D=()=>{};
async function setup(){
 const T=await import('./vendor/three.module.min.js');
 const mobile=()=>innerWidth<=800;
 const renderer=new T.WebGLRenderer({canvas:document.querySelector('#universe'),antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.4:1.7));
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new T.Scene();
 const camera=new T.PerspectiveCamera(37,innerWidth/innerHeight,.1,100);camera.position.z=10.4;
 // An original procedural studio environment gives the metal broad, continuous highlights.
 const w=512,h=256,values=new Float32Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h,i=(y*w+x)*4;
  const soft=(cx,cy,sx,sy)=>Math.exp(-((u-cx)**2/sx+(v-cy)**2/sy));
  const white=soft(.22,.36,.0018,.11)*6+soft(.69,.65,.005,.003)*5;
  const blue=soft(.55,.36,.016,.025)*3+soft(.94,.5,.002,.12)*2;
  values[i]=.025+white+blue*.055;values[i+1]=.04+white+blue*.27;values[i+2]=.08+white+blue;values[i+3]=1;
 }
 const env=new T.DataTexture(values,w,h,T.RGBAFormat,T.FloatType);env.mapping=T.EquirectangularReflectionMapping;env.needsUpdate=true;
 const pmrem=new T.PMREMGenerator(renderer),envTarget=pmrem.fromEquirectangular(env);scene.environment=envTarget.texture;env.dispose();pmrem.dispose();
 scene.add(new T.AmbientLight(0x608bc7,1));
 const key=new T.DirectionalLight(0xc8e2ff,4);key.position.set(-3,6,5);scene.add(key);
 const side=new T.DirectionalLight(0x155bff,6);side.position.set(4,-2,3);scene.add(side);
 const sculpture=new T.Group();scene.add(sculpture);
 const silver=new T.MeshPhysicalMaterial({color:0xa1b7de,metalness:1,roughness:.22,clearcoat:1,clearcoatRoughness:.18,envMapIntensity:1.5});
 const cobalt=new T.MeshPhysicalMaterial({color:0x1655f2,metalness:.92,roughness:.21,clearcoat:1,envMapIntensity:1.8});
 const darkMetal=new T.MeshPhysicalMaterial({color:0x132d64,metalness:1,roughness:.3,envMapIntensity:1.5});
 const rings=[];
 const segments=mobile()?160:256;
 for(let i=0;i<8;i++){
  const radius=1.13+i*.145;
  const geo=new T.TorusGeometry(radius,i===7?.155:.062,12,segments);
  const mesh=new T.Mesh(geo,i===7?silver:i%3===0?cobalt:silver);
  mesh.scale.z=i===7?.7:.65;
  mesh.position.z=(i-3.5)*.085;
  sculpture.add(mesh);rings.push(mesh);
 }
 const edgeMat=new T.MeshBasicMaterial({color:0x87d7ff,transparent:true,opacity:.86});
 const lightRing=new T.Mesh(new T.TorusGeometry(1.078,.012,8,segments),edgeMat);lightRing.position.z=.08;sculpture.add(lightRing);
 const halos=[];
 for(let i=0;i<3;i++){
  const g=new T.TorusGeometry(2.35+i*.35,.0028,3,220);
  const m=new T.Mesh(g,new T.MeshBasicMaterial({color:0x4986df,transparent:true,opacity:.20-i*.035}));
  m.rotation.set(.1+i*.23,i*.3,0);sculpture.add(m);halos.push(m);
 }
 const sparkPositions=new Float32Array(180*3);
 let seed=37;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
 for(let i=0;i<180;i++){sparkPositions[i*3]=(random()-.5)*24;sparkPositions[i*3+1]=(random()-.5)*15;sparkPositions[i*3+2]=-random()*15-2;}
 const starsGeometry=new T.BufferGeometry();starsGeometry.setAttribute('position',new T.BufferAttribute(sparkPositions,3));
 const stars=new T.Points(starsGeometry,new T.PointsMaterial({color:0x95b9ff,size:.018,transparent:true,opacity:.55,sizeAttenuation:true}));scene.add(stars);
 const satellites=new T.Group();sculpture.add(satellites);
 for(let i=0;i<4;i++){
  const dot=new T.Mesh(new T.SphereGeometry(.038,12,8),new T.MeshBasicMaterial({color:0xa3dcff}));
  const a=i*Math.PI/2+.3;dot.position.set(Math.cos(a)*2.45,Math.sin(a)*2.45,0);satellites.add(dot);
 }
 let pointer={x:0,y:0},smoothPointer={x:0,y:0};
 addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){pointer.x=e.clientX/innerWidth-.5;pointer.y=e.clientY/innerHeight-.5;}},{passive:true});
 document.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0});
 resize3D=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.4:1.7));};resize3D();
 document.querySelector('#universe').addEventListener('webglcontextlost',e=>{e.preventDefault();document.body.classList.add('no-webgl');draw=()=>{};});
 draw=(p,time)=>{
  smoothPointer.x=lerp(smoothPointer.x,still?0:pointer.x,.035);smoothPointer.y=lerp(smoothPointer.y,still?0:pointer.y,.035);
  const toMeeting=smooth(.12,.38,p),toProgram=smooth(.58,.79,p);
  const narrow=mobile();
  sculpture.position.x=lerp(narrow?.65:2.18,narrow?0:2.0,toMeeting);sculpture.position.x=lerp(sculpture.position.x,narrow?-1.9:-2.8,toProgram);
  sculpture.position.y=lerp(narrow?-1.0:.0,narrow?-1.15:-.1,toMeeting);sculpture.position.y=lerp(sculpture.position.y,narrow?-4.0:-1.65,toProgram);
  sculpture.rotation.x=lerp(.52,1.08,toMeeting)+smoothPointer.y*.13+Math.sin(time*.19)*.024*(1-toProgram);
  sculpture.rotation.y=lerp(-.62,.06,toMeeting)+smoothPointer.x*.18;
  sculpture.rotation.z=lerp(-.55,.03,toMeeting)+time*.023*(1-toMeeting);
  sculpture.rotation.x=lerp(sculpture.rotation.x,1.27,toProgram);sculpture.rotation.y=lerp(sculpture.rotation.y,-.25,toProgram);
  const scale=lerp(narrow?.78:1.28,narrow?.83:1.02,toMeeting);sculpture.scale.setScalar(lerp(scale,narrow?1.3:1.25,toProgram));
  rings.forEach((ring,i)=>{ring.position.z=(i-3.5)*lerp(.085,.13,toMeeting)+(i-3.5)*toProgram*.19;ring.rotation.x=(Math.sin(time*.18+i*.28)*.025+smoothPointer.y*.02)*(1-toProgram);});
  lightRing.position.z=lerp(.08,-.65,toProgram);
  halos.forEach((ring,i)=>{ring.rotation.z=time*.035*(i%2?1:-1);ring.material.opacity=(.2-i*.035)*(1-toProgram*.75)});
  satellites.rotation.z=still?0:time*.065;satellites.visible=p>.12&&p<.7;
  stars.rotation.z=time*.003;stars.material.opacity=lerp(.5,.15,toProgram);
  renderer.render(scene,camera);
 };
 document.body.classList.add('webgl-ready');
}
setup().catch(error=>{console.warn('Orbit fallback:',error);document.body.classList.add('no-webgl')});
// Do not animate when the page is hidden or the WebGL stage has left the viewport.
let stageVisible=true;new IntersectionObserver(entries=>{stageVisible=entries[0].isIntersecting}).observe(journey);
function tick(now){
 const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
 if(!document.hidden&&stageVisible){progress=still?(target<.27?0:target<.67?.45:1):lerp(progress,target,1-Math.exp(-dt*9));if(!still)animationTime+=dt;overlay(progress);draw(progress,animationTime);}
 requestAnimationFrame(tick);
}
addEventListener('resize',()=>resize3D());
updateTarget();progress=target;overlay(progress);requestAnimationFrame(tick);
