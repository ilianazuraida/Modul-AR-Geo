const qs=[{q:'Antara berikut, yang manakah bentuk 3D?',a:['Bulatan','Kubus','Segi tiga'],ok:'Kubus'},{q:'Berapakah bilangan bucu sebuah kubus?',a:['6','8','10'],ok:'8'},{q:'Bentuk manakah mempunyai satu permukaan melengkung dan dua permukaan rata?',a:['Kubus','Silinder','Sfera'],ok:'Silinder'},{q:'Bentuk manakah menyerupai bola?',a:['Kon','Sfera','Kuboid'],ok:'Sfera'},{q:'Bentuk manakah mempunyai satu permukaan rata berbentuk bulatan dan satu permukaan melengkung?',a:['Silinder','Kon','Kubus'],ok:'Kon'}];const $=id=>document.getElementById(id),bs=[...document.querySelectorAll('.choices button')];let index=0,score=0,answered=false,stream=null,hands=null,sensorActive=false,processing=false,lastAt=0,hoverIndex=-1,hoverStart=0,palmWasOutside=true,palmLastX=null,palmLastY=null,palmLastT=0,hitCooldown=0;function draw(){answered=false;let q=qs[index];$('question').textContent=q.q;$('progress').textContent=`SOALAN ${index+1} DARIPADA 5`;$('score').textContent=`⭐ Markah: ${score} / 5`;const choices=[...q.a];for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}bs.forEach((b,i)=>{b.disabled=false;b.classList.remove('popped','hand-hover');b.dataset.answer=choices[i];b.querySelector('.answer').textContent=choices[i];b.setAttribute('aria-label',choices[i])});$('next').hidden=true;$('feedback').textContent='Sentuh belon atau gunakan kamera untuk memilih.'}function choose(n){if(answered)return;answered=true;const b=bs[n],correct=b.dataset.answer===qs[index].ok;if(correct)score++;b.classList.add('popped');const r=b.getBoundingClientRect(),s=$('stage').getBoundingClientRect(),burst=$('burst');burst.style.left=(r.left+r.width/2-s.left)+'px';burst.style.top=(r.top+r.height/2-s.top)+'px';burst.textContent='💥 POP!';burst.classList.remove('show');void burst.offsetWidth;burst.classList.add('show');bs.forEach(x=>x.disabled=true);$('score').textContent=`⭐ Markah: ${score} / 5`;$('feedback').textContent=correct?'🌟 POP! Jawapan betul!':`Jawapan betul: ${qs[index].ok}`;$('next').hidden=false;$('next').textContent=index===4?'Lihat keputusan ➜':'Soalan seterusnya ➜'}bs.forEach((b,i)=>b.addEventListener('click',()=>choose(i)));let phase='play',claps=0,lastClap=0;
function showModal(title,message,button){$('modalTitle').textContent=title;$('modalText').textContent=message;$('restart').textContent=button;$('modal').hidden=false}
$('next').onclick=()=>{if(index===4){if(score<4){phase='retry';showModal('🌸 Cuba Lagi!','Dapatkan sekurang-kurangnya 4 daripada 5 markah untuk membuka Belon Misteri.','Main Semula')}else{phase='bonus';showModal('🎁 Belon Misteri!','Saya mempunyai enam permukaan rata berbentuk segi empat sama yang sama saiz. Siapakah saya?','Pilih jawapan');$('bonusOptions').hidden=false;$('restart').hidden=true}}else{index++;draw()}};
document.querySelectorAll('[data-bonus]').forEach(b=>b.onclick=()=>{if(b.dataset.bonus!=='kubus'){$('modalText').textContent='Belum tepat. Cuba lagi!';return}phase='clap';claps=0;$('modal').hidden=true;showSecretBalloon()});
function clap(){if(phase!=='clap')return;const t=performance.now();if(t-lastClap<350)return;lastClap=t;claps++;$('clapProgress').textContent=claps+' / 2 tepukan';$('giantBalloon').classList.remove('clap-shake');void $('giantBalloon').offsetWidth;$('giantBalloon').classList.add('clap-shake');if(claps>=2){phase='done';revealSecretCode();}}
$('clapAction').onclick=clap;
$('restart').onclick=()=>{index=0;score=0;phase='play';$('modal').hidden=true;$('bonusOptions').hidden=true;$('clapSection').hidden=true;$('restart').hidden=false;draw()};
async function stopCam(){sensorActive=false;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$('camera').srcObject=null;$('camera').classList.remove('active');$('cameraBtn').textContent='📷 Aktifkan Kamera';$('cameraBtn').setAttribute('aria-label','Aktifkan Kamera');$('feedback').textContent='Kamera dimatikan. Mod sentuhan masih boleh digunakan.'}async function startSensor(){if(hands)return true;try{if(!window.Hands){await new Promise((resolve,reject)=>{let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});hands.setOptions({maxNumHands:2,modelComplexity:0,minDetectionConfidence:.55,minTrackingConfidence:.5});hands.onResults(results=>{if(!sensorActive)return;const all=results.multiHandLandmarks||[];
if(phase==='clap'){if(all.length>=2){const a=all[0][9],b=all[1][9],d=Math.hypot(a.x-b.x,a.y-b.y);if(d>.26){window.__clapApart=true;$('sensorStatus').textContent='🙌 Dua tangan dikesan. Rapatkan kedua-dua tapak tangan!'}if(d<.13&&window.__clapApart){window.__clapApart=false;clap();$('sensorStatus').textContent='👏 Tepukan dikesan!'}}else{$('sensorStatus').textContent='✋ Tunjukkan kedua-dua tangan kepada kamera.'}}
const lm=all[0];
if(!lm){hoverIndex=-1;palmWasOutside=true;palmLastX=null;bs.forEach(b=>b.classList.remove('hand-hover'));return}
if(phase!=='play'||answered)return;
// Require an OPEN PALM, not a pointing finger or incidental hand movement.
// At least three of the four non-thumb fingertips must be extended away from the wrist.
const wrist=lm[0],palm=lm[9];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const openFingers=[8,12,16,20].filter((tip,i)=>distance(lm[tip],wrist)>distance(lm[[6,10,14,18][i]],wrist)*1.12).length;
const isOpen=openFingers>=3;
const video=$('camera').getBoundingClientRect();
const x=video.left+(1-palm.x)*video.width;
const y=video.top+palm.y*video.height;
const now=performance.now();
const dt=palmLastT?Math.max(1,now-palmLastT):0;
const speed=dt?Math.hypot(x-(palmLastX??x),y-(palmLastY??y))/dt:0;
palmLastX=x;palmLastY=y;palmLastT=now;
let found=-1;
if(isOpen){
 found=bs.findIndex(b=>{
  const r=b.getBoundingClientRect();
  // Limit hits to the visible balloon body, not its answer label.
  return x>=r.left+r.width*.12&&x<=r.right-r.width*.12&&
         y>=r.top+r.height*.10&&y<=r.top+r.height*.72;
 });
}
bs.forEach((b,i)=>b.classList.toggle('hand-hover',isOpen&&i===found));
if(found<0||!isOpen){hoverIndex=-1;palmWasOutside=true;return}
if(now<hitCooldown)return;
// A deliberate pop requires an open palm to enter from outside, then
// remain inside for 650 ms. Random gestures and simple passing movements won't pop.
if(found!==hoverIndex){
 hoverIndex=found;hoverStart=now;
 if(!palmWasOutside)return;
}
if(palmWasOutside&&now-hoverStart>=650&&speed<.55){
 palmWasOutside=false;hitCooldown=now+1800;
 choose(found);hoverIndex=-1;
}
});return true}catch(e){$('feedback').textContent='Sensor tangan tidak dapat dimuatkan. Semak internet; sentuhan masih berfungsi.';return false}}async function detect(){if(!sensorActive||!stream)return;let now=performance.now();if(!processing&&now-lastAt>120&&$('camera').readyState>=2){processing=true;lastAt=now;try{await hands.send({image:$('camera')})}catch(e){sensorActive=false;$('feedback').textContent='Pengesanan tangan terhenti. Gunakan sentuhan.'}finally{processing=false}}requestAnimationFrame(detect)}$('cameraBtn').onclick=async()=>{if(stream){await stopCam();return}try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Gunakan HTTPS atau localhost untuk kamera');stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});$('camera').srcObject=stream;$('camera').classList.add('active');$('cameraBtn').textContent='📷 Matikan Kamera';await $('camera').play();$('feedback').textContent='Kamera aktif. Sedang memuatkan sensor tangan…';if(await startSensor()){sensorActive=true;$('feedback').textContent='Sensor aktif: buka tapak tangan, masukkan ke kawasan belon dan tahan sebentar untuk POP!';detect()}}catch(e){$('feedback').textContent='Kamera gagal: '+e.message}};$('touchBtn').onclick=()=>{$('feedback').textContent='Mod sentuhan aktif: sentuh atau klik belon untuk menjawab.'};draw();
function showSecretBalloon(){
 const screen=$('secretReveal');screen.hidden=false;
 $('giantBalloon').hidden=false;$('giantBalloon').classList.remove('explode');
 $('secretCode').hidden=true;$('clapProgress').hidden=false;$('clapProgress').textContent='0 / 2 tepukan';
 $('clapActionMystery').hidden=false;$('secretCameraBtn').hidden=false;$('sensorStatus').hidden=false;
 $('secretPrompt').textContent='Tepuk dua kali di hadapan kamera untuk POP! 🎈';$('sensorStatus').textContent=sensorActive?'✋ Sensor aktif. Tunjukkan kedua-dua tangan.':'📷 Aktifkan sensor atau gunakan butang Tepuk.';$('secretCameraBtn').textContent=sensorActive?'📷 Kamera Aktif':'📷 Aktifkan Sensor Tepukan';
 $('giantBalloon').onclick=clap;
 $('clapActionMystery').onclick=clap;
 $('secretCameraBtn').onclick=async()=>{if(sensorActive){$('sensorStatus').textContent='✋ Sensor aktif. Tepuk dua kali di hadapan kamera.';return}if(!navigator.mediaDevices?.getUserMedia){$('sensorStatus').textContent='⚠️ Kamera memerlukan HTTPS (GitHub Pages). Gunakan butang Tepuk.';return} $('secretCameraBtn').disabled=true;$('sensorStatus').textContent='⏳ Mengaktifkan kamera dan sensor tangan…';try{if(!stream){stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});$('camera').srcObject=stream;$('camera').classList.add('active');await $('camera').play();$('cameraBtn').textContent='📷 Matikan Kamera'}if(await startSensor()){sensorActive=true;window.__clapApart=false;detect();$('secretCameraBtn').textContent='📷 Kamera Aktif';$('sensorStatus').textContent='🙌 Tunjukkan dua tangan, renggangkan kemudian tepukkan bersama.'}else{$('sensorStatus').textContent='⚠️ Sensor tidak dapat dimuatkan. Gunakan butang Tepuk.'}}catch(e){$('sensorStatus').textContent='⚠️ Kamera tidak tersedia: '+e.message+' Gunakan butang Tepuk.'}finally{$('secretCameraBtn').disabled=false}};
 $('secretRestart').onclick=()=>{
   screen.hidden=true;$('confetti').innerHTML='';
   index=0;score=0;phase='play';draw();
 };
}
function revealSecretCode(){
 const balloon=$('giantBalloon');
 balloon.classList.add('explode');
 $('clapActionMystery').hidden=true;$('secretCameraBtn').hidden=true;$('sensorStatus').hidden=true;
 $('secretPrompt').textContent='POP! Belon Misteri berjaya dipecahkan!';
 const confetti=$('confetti');confetti.innerHTML='';
 const colors=['#ff5e9c','#ffcf3c','#4dd6ff','#9a6eff','#75e87a'];
 for(let i=0;i<125;i++){
  const c=document.createElement('i');c.style.left=(Math.random()*100)+'%';
  c.style.background=colors[i%colors.length];c.style.animationDelay=(Math.random()*.5)+'s';
  c.style.transform='rotate('+(Math.random()*360)+'deg)';c.style.animationDuration=(2.4+Math.random()*2.2)+'s';confetti.appendChild(c);
 }
 setTimeout(()=>{
  balloon.hidden=true;$('clapProgress').hidden=true;
  $('secretCode').hidden=false;launchCelebration();
  try{localStorage.setItem('argeo-pop-code','POP-182')}catch(e){}
 },650);
}

function launchCelebration(){const layer=$('confetti');for(let i=0;i<24;i++){const b=document.createElement('span');b.className='party-balloon';b.textContent=['🎈','🎉','⭐','✨','🎊'][i%5];b.style.left=(Math.random()*96)+'%';b.style.animationDelay=(Math.random()*1.5)+'s';b.style.animationDuration=(3.2+Math.random()*2)+'s';layer.appendChild(b)}setTimeout(()=>{layer.replaceChildren()},8500)}
