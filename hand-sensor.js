/* Optional webcam hand-pointing sensor. Uses MediaPipe Hands from CDN; requires HTTPS + internet. */
(()=>{'use strict';
const $=id=>document.getElementById(id),video=$('camview'),cursor=$('handCursor'),status=$('status');
const buttons=[...document.querySelectorAll('.answer')];let detector=null,loading=false,running=false,processing=false,raf=0,hover=-1,since=0,lastTriggered=0;
function say(message){status.textContent=message;status.classList.remove('hidden')}
function clearHover(){buttons.forEach(b=>b.classList.remove('hand-hover'));hover=-1;since=0;cursor.style.display='none'}
function loadScript(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>reject(new Error('Pustaka pengesanan tangan gagal dimuatkan. Semak sambungan internet.'));document.head.appendChild(s)})}
function result(r){if(!running)return;const lm=r.multiHandLandmarks?.[0];if(!lm){clearHover();return}
const finger=lm[8],wrist=lm[0],pip=lm[6];if(!finger){clearHover();return}
// Mirror X, matching the selfie camera. Map the fingertip into the central camera stage.
const stage=document.querySelector('.stage'),rect=stage.getBoundingClientRect(),vr=video.getBoundingClientRect();const x=vr.left+(1-finger.x)*vr.width,y=vr.top+finger.y*vr.height;
cursor.style.display='block';cursor.style.left=((x-rect.left)/rect.width*100)+'%';cursor.style.top=((y-rect.top)/rect.height*100)+'%';
const pointing=Math.hypot(finger.x-wrist.x,finger.y-wrist.y)>.12 && Math.hypot(finger.x-pip.x,finger.y-pip.y)>.045;
let target=-1;if(pointing){buttons.forEach((b,i)=>{const a=b.getBoundingClientRect();if(!b.disabled&&x>=a.left-12&&x<=a.right+12&&y>=a.top-12&&y<=a.bottom+12)target=i})}
buttons.forEach((b,i)=>b.classList.toggle('hand-hover',i===target));if(target<0){hover=-1;since=0;return}
const now=performance.now();if(hover!==target){hover=target;since=now;return}if(now-since>=1000&&now-lastTriggered>1600){lastTriggered=now;clearHover();buttons[target].click();say('🎈 POP! Belon dipilih dengan gerakan jari.')}}
async function tick(){if(!running)return;if(!processing&&video.readyState>=2){processing=true;try{await detector.send({image:video})}catch(e){say('Sensor tangan terganggu: '+e.message);stop()}finally{processing=false}}if(running)raf=requestAnimationFrame(tick)}
async function start(){if(loading||running)return;loading=true;try{
if(!video.srcObject){say('Aktifkan Kamera dahulu, kemudian halakan jari pada belon.');return}
say('Memuatkan sensor tangan…');if(!window.Hands)await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js');
detector=new window.Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`});detector.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:.55,minTrackingConfidence:.5});detector.onResults(result);running=true;say('Sensor tangan aktif. Halakan hujung jari telunjuk pada belon dan tahan 1 saat. Sentuhan skrin juga boleh digunakan.');tick();
}catch(e){say('Sensor tangan belum tersedia: '+e.message+' Gunakan sentuhan skrin.')}finally{loading=false}}
function stop(){running=false;cancelAnimationFrame(raf);clearHover();if(detector){detector.close?.();detector=null}}
// Camera button from base game starts/stops video. Start hand detection only after stream exists.
$('cameraBtn').addEventListener('click',()=>{setTimeout(()=>{if(video.srcObject&&video.readyState>=2)start();else if(!video.srcObject)stop()},1100)});
$('touchBtn').addEventListener('click',()=>{stop();say('Mod sentuhan aktif: sentuh atau klik belon untuk menjawab.')});
window.addEventListener('pagehide',stop);
})();