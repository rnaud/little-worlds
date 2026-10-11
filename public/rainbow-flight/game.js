'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s),colors=['#f394a7','#ffbd8d','#ffe8a2','#b5dea6','#91d6da','#b6b0e1'];
let w=1200,h=580,mode='welcome',time=0,last=0,scroll=0,score=0,spawn=0,bananas=[],particles=[],sound=false,audio;
const keys=new Set(),player={x:320,y:290},pointer={active:false,x:0,y:0};
function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;canvas.width=w*devicePixelRatio;canvas.height=h*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);player.x=Math.min(Math.max(60,player.x),w-60);player.y=Math.min(Math.max(100,player.y),h-70)}
new ResizeObserver(resize).observe(canvas);
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function path(points,fill,stroke,width=2){ctx.beginPath();for(const [i,p]of points.entries()){if(i===0)ctx.moveTo(...p);else if(p.length===6)ctx.bezierCurveTo(...p);else if(p.length===4)ctx.quadraticCurveTo(...p);else ctx.lineTo(...p)}if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}}
function star(x,y,r,color){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<8;i++){let a=i*Math.PI/4,rr=i%2?r*.25:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.fill();ctx.restore()}
function rainbow(x,y,r,alpha=.5){ctx.save();ctx.globalAlpha=alpha;ctx.lineWidth=9;colors.forEach((c,i)=>{ctx.strokeStyle=c;ctx.beginPath();ctx.arc(x,y,r-i*9,Math.PI,0);ctx.stroke()});ctx.restore()}
function tree(x,base,s,c){ctx.save();ctx.translate(x,base);ctx.scale(s,s);path([[0,0],[-8,-110],[-38,-175],[-5,-131],[-2,-260],[10,-142],[38,-198],[13,-117],[18,0]],'#729991');ellipse(0,-230,63,92,c);ellipse(-43,-189,48,68,c);ellipse(43,-189,50,73,c);path([[5,-30],[0,-250]],null,'#ffffff25',3);path([[0,-140],[-32,-181]],null,'#ffffff22',2);ctx.restore()}
function background(dt){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#b6ddd9');g.addColorStop(.5,'#d7ecd7');g.addColorStop(1,'#8bc2ac');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ellipse(w*.64,h*.32,130,130,'#f5f7c526');ellipse(w*.64,h*.32,88,88,'#fff8d32b');
rainbow(w*.75-scroll*.025%(w+400),h*.67,h*.56,.44);
for(let i=0;i<9;i++){let x=((i*187-scroll*.16)%(w+240)+(w+240))%(w+240)-100;tree(x,h*.8,.85+(i%3)*.15,['#aed1bd','#bad8c7','#a1cbbb'][i%3])}
ctx.fillStyle='#a7cdb370';ctx.beginPath();ctx.moveTo(0,h);ctx.bezierCurveTo(w*.2,h*.56,w*.55,h*.9,w,h*.65);ctx.lineTo(w,h);ctx.fill();
for(let i=0;i<6;i++){let x=((i*263-scroll*.3)%(w+300)+(w+300))%(w+300)-110;tree(x,h+30,1.12+(i%2)*.15,['#75b29e','#8dbfa8'][i%2])}
// A winding ribbon of rainbow light through the woodland.
ctx.save();ctx.globalAlpha=.16;colors.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,h*.84+i*7);ctx.bezierCurveTo(w*.35,h*.58+i*7,w*.67,h*.99+i*7,w,h*.65+i*7);ctx.stroke()});ctx.restore();
for(let i=0;i<22;i++){let x=((i*91-scroll*.47)%(w+80)+(w+80))%(w+80)-40,y=h-15-(Math.sin(i*7)*.5+.5)*35;ellipse(x,y,27,10,['#6fa48e','#7daf91','#89b99c'][i%3]);if(i%3===0){path([[x,y],[x+1,y-20]],null,'#64896f',2);ellipse(x,y-22,8,4,'#e8becc');ellipse(x,y-23,3,3,'#fff0b0')}}
for(let i=0;i<34;i++){let x=((i*73.17-scroll*.1)%(w+20)+(w+20))%(w+20),y=(i*47.9)%h+Math.sin(time+i)*6;star(x,y,2+Math.sin(time*2+i),'#fffad6aa')}
// Delicate foliage frames the flight.
for(let side of[0,1]){ctx.save();ctx.translate(side?w:0,0);ctx.scale(side?-1:1,1);path([[-10,-20],[20,50,65,37,95,-10]],null,'#527f79',10);for(let i=0;i<5;i++){ctx.save();ctx.translate(i*24,14+Math.sin(i)*14);ctx.rotate(i*.5);ellipse(0,0,12,29,'#659f92');ctx.restore()}ctx.restore()}}
function unicorn(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);let flap=Math.sin(time*5)*10;
// Rainbow tail, fluttering behind a round, pearl-white unicorn.
colors.forEach((c,i)=>path([[-46,10],[-92,0+i*7,-85,46+i*3,-119,34+i*5]],null,c,10));
path([[-31,29],[-43,63],[-28,66],[-12,36]],'#f2f2ef');path([[24,29],[41,60],[55,55],[39,21]],'#e2ebe8');
ellipse(-35,64,10,5,'#b5a4cd');ellipse(49,58,10,5,'#b5a4cd');
ellipse(0,14,55,32,'#fffdf5');path([[22,12],[39,-42],[65,-44],[78,-17],[59,23]],'#fffdf5');
// Far wing and pastel mane.
path([[-3,4],[-35,-34,-40,-58,-49,-53],[-65,-17,-45,10,-12,20]],'#dce8ef');
for(let i=0;i<5;i++)path([[42+i*5,-37],[19+i*4,-22,42+i*4,10,27+i*4,17]],null,colors[(i+3)%6],8);
ellipse(65,-39,27,19,'#fffdf5');ellipse(82,-30,19,13,'#fffdf5');
path([[58,-51],[56,-78],[69,-57]],'#f8f8ed');path([[61,-55],[60,-69],[66,-57]],'#ebbad0');path([[76,-54],[92,-83],[86,-49]],'#efc27d');path([[81,-59],[87,-57]],null,'#fff2bc',2);
ellipse(78,-41,3.2,4,'#425c5b');ellipse(79,-42.5,1,1,'white');ellipse(86,-28,6,3,'#f4cad2');path([[92,-28],[96,-27]],null,'#bdac9c',1.4);
// Gaia: five years old, golden pigtails, a violet dress and pink boots.
ellipse(-9,-39,15,23,'#cf91bc');path([[-15,-22],[-3,-10],[8,13]],null,'#efbd99',8);path([[4,11],[15,14]],null,'#9e71a4',9);
path([[-1,-47],[12,-33],[39,-30]],null,'#f2c9aa',7);ellipse(-13,-69,22,26,'#f5d278');ellipse(-31,-59,11,17,'#efd078');ellipse(8,-60,10,18,'#efd078');ellipse(-11,-64,17,19,'#f8d7b7');
path([[-28,-70],[-17,-93,7,-83,8,-67],[-3,-73],[-12,-69],[-13,-78],[-28,-63]],'#f4d67c');ellipse(-4,-65,2,2.5,'#496062');ellipse(-18,-65,2,2.5,'#496062');ellipse(-23,-58,4,2,'#eeafa4');ellipse(0,-58,4,2,'#eeafa4');path([[-15,-56],[-10,-52,-6,-56]],null,'#a16d67',1.5);ellipse(-31,-68,5,4,'#b98bc3');ellipse(9,-68,5,4,'#b98bc3');star(-15,-86,6,'#fff3b1');
// Near wing moves with flight.
path([[-6,7],[-28,-7,-42,-29-flap,-49,-29-flap],[-65,-15,-51,19,-23,25],[-11,21]],'#f6f8f4','#d8e6e1',1);for(let i=0;i<3;i++)path([[-17-i*7,15],[-33-i*7,5,-38-i*5,-12-flap*.5]],null,'#dfe8e6',2);
path([[34,-22],[20,-13,-1,-27,-7,-32]],null,'#b8a57d',1.5);ctx.restore()}
function banana(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.rotate(-.35+Math.sin(time*2+x)*.1);ctx.scale(s,s);ellipse(0,0,23,23,'#fff2aa27');path([[-11,-14],[-13,11,2,22,15,5],[2,16,-5,2,-5,-12]],'#ffdf68','#e9b646',1.5);path([[-6,-12],[-7,-17]],null,'#8c8953',3);star(17,-13,4,'#fff9d7');ctx.restore()}
function chime(notes){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();notes.forEach((n,i)=>{let o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.09;o.type='sine';o.frequency.value=n;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.4);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.42)})}catch{}}
function burst(x,y,count=20){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*170,vy:(Math.random()-.7)*170,life:1.2,c:colors[i%6]})}
function begin(){mode='playing';score=0;bananas=[];particles=[];spawn=0;player.x=w*.26;player.y=h*.48;$('#score').textContent=0;$('#welcome').hidden=true;$('#finish').hidden=true;$('#pause').hidden=false;$('#hint').textContent='Move with arrow keys, or touch & drag to fly';$('#status').textContent='Follow the golden bananas';chime([392,523,659])}
function pause(){if(mode==='playing'){mode='paused';$('#paused').hidden=false;keys.clear();pointer.active=false}else if(mode==='paused'){mode='playing';$('#paused').hidden=true}}
$('#start').onclick=begin;$('#restart').onclick=begin;$('#pause').onclick=pause;$('#resume').onclick=pause;
$('#sound').onclick=()=>{sound=!sound;$('#sound').innerHTML='♫ <span>Sound '+(sound?'on':'off')+'</span>';$('#sound').setAttribute('aria-label','Turn sound '+(sound?'off':'on'));if(sound)chime([523,659])};
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Escape'].includes(e.key)){if(e.target.tagName!=='BUTTON')e.preventDefault();if(e.key==='Escape')pause();else keys.add(e.key)}});window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>{keys.clear();if(mode==='playing')pause()});
function target(e){const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top}
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;pointer.active=true;target(e);canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(pointer.active)target(e)});canvas.addEventListener('pointerup',()=>pointer.active=false);canvas.addEventListener('pointercancel',()=>pointer.active=false);
function frame(now){let dt=Math.min((now-last)/1000||0,.04);last=now;if(mode!=='paused'){time+=dt;scroll+=dt*(mode==='playing'?80:15)}background(dt);
if(mode==='playing'){const speed=230;player.x+=((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*speed*dt;player.y+=((keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')||keys.has(' ')?1:0))*speed*dt;if(pointer.active){player.x+=(pointer.x-player.x)*Math.min(1,dt*7);player.y+=(pointer.y-player.y)*Math.min(1,dt*7)}player.x=Math.max(55,Math.min(w-65,player.x));player.y=Math.max(113,Math.min(h-65,player.y));spawn-=dt;if(spawn<=0){spawn=1.3;bananas.push({x:w+25,y:125+Math.random()*Math.max(10,h-210),phase:Math.random()*6})}
for(let i=bananas.length-1;i>=0;i--){let b=bananas[i];b.x-=dt*85;let by=b.y+Math.sin(time*2+b.phase)*9;if(Math.hypot((b.x-player.x)*.85,by-player.y)<57){bananas.splice(i,1);score++;$('#score').textContent=score;burst(b.x,by);chime([660,880]);if(score===20){mode='won';$('#finish').hidden=false;$('#pause').hidden=true;$('#hint').textContent='✦ A little explorer with a whole lot of magic ✦';$('#status').textContent='Rainbow adventure complete!';for(let j=0;j<12;j++)burst(Math.random()*w,Math.random()*h,16);chime([523,659,784,1047]);break}}else if(b.x<-35)bananas.splice(i,1)}}
if(mode==='welcome'||mode==='won'){for(let i=0;i<5;i++)banana(w*.62+i*46,h*.43-Math.sin(i*.7)*45,.8);unicorn(w*(w<600?.71:.7),h*(w<600?.73:.64)+Math.sin(time*2)*7,w<600?.82:1.18)}else{for(let b of bananas)banana(b.x,b.y+Math.sin(time*2+b.phase)*9);for(let i=0;i<7;i++)star(player.x-60-i*15,player.y+Math.sin(time*4-i)*8,3-i*.3,colors[i%6]);unicorn(player.x,player.y+Math.sin(time*3)*2,w<600?.67:.8)}
for(let i=particles.length-1;i>=0;i--){let p=particles[i];if(mode!=='paused'){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=60*dt}ctx.globalAlpha=Math.max(0,p.life/1.2);star(p.x,p.y,5,p.c);ctx.globalAlpha=1;if(p.life<=0)particles.splice(i,1)}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
