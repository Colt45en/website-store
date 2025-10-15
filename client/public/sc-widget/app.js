(async function(){
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');
  const patchSelect = document.getElementById('patchSelect');
  const tempoEl = document.getElementById('tempo');
  const tempoVal = document.getElementById('tempoVal');
  const volEl = document.getElementById('volume');
  const volVal = document.getElementById('volumeVal');

  tempoEl.addEventListener('input', ()=> tempoVal.textContent = tempoEl.value);
  volEl.addEventListener('input', ()=> volVal.textContent = volEl.value + ' dB');

  // Tone.js objects
  const master = new Tone.Gain().toDestination();
  const vol = new Tone.Volume(parseFloat(volEl.value)).connect(master);

  let drumPart, hatPart, ringOsc, ringGain, noiseNode;

  function createDrumLoop(){
    const kick = new Tone.MembraneSynth({pitchDecay:0.01,octaves:10,envelope:{attack:0.001,decay:0.4,sustain:0}}).toDestination();
    const snare = new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:0.001,decay:0.2}}).connect(vol);
    const hat = new Tone.MetalSynth({frequency:500,envelope:{attack:0.001,decay:0.05,release:0.01},harmonicity:5,modulationIndex:32}).connect(vol);

    // patterns
    const kickPattern = new Tone.Sequence((time)=>{ kick.triggerAttackRelease('C2','8n',time); }, ['C2', null, null, null], '4n');
    const snarePattern = new Tone.Sequence((time)=>{ snare.triggerAttack(time); }, [null, null, 'open', null], '4n');
    const hatPattern = new Tone.Sequence((time)=>{ hat.triggerAttackRelease('16n',time); }, ['16n','16n','16n','16n'], '16n');

    drumPart = [kickPattern, snarePattern, hatPattern];
  }

  function createRingMod(){
    ringOsc = new Tone.Oscillator(220,'sine');
    const carrier = new Tone.Oscillator(110,'sine');
    ringGain = new Tone.Gain(0.3).connect(vol);
    // simple ring mod: multiply carrier * modulator via amplitude modulation
    const am = new Tone.AmplitudeEnvelope({attack:0.01,decay:0.3,sustain:0.0});
    carrier.connect(ringGain);
    ringOsc.connect(new Tone.Gain(0.5)).connect(am);
    am.connect(ringGain.gain);
    ringOsc.start(); carrier.start();
  }

  function createNoiseTexture(){
    noiseNode = new Tone.Noise('white');
    const filt = new Tone.Filter(3000,'highpass').connect(vol);
    const env = new Tone.AmplitudeEnvelope({attack:0.01,decay:0.8,sustain:0});
    noiseNode.connect(filt);
    env.connect(filt.volume);
    noiseNode.start();
  }

  function startPatch(){
    Tone.Transport.bpm.value = Number(tempoEl.value);
    vol.volume.value = Number(volEl.value);
    const patch = patchSelect.value;
    if (patch === 'drum'){
      createDrumLoop();
      drumPart.forEach(p=>p.start(0));
      Tone.Transport.start();
    } else if (patch === 'ring'){
      createRingMod();
      Tone.Transport.start();
    } else if (patch === 'noise'){
      createNoiseTexture();
      Tone.Transport.start();
    }
  }

  function stopPatch(){
    Tone.Transport.stop();
    if (drumPart) drumPart.forEach(p=>p.stop());
    if (ringOsc){ ringOsc.stop(); ringOsc.dispose(); ringOsc = null }
    if (noiseNode){ noiseNode.stop(); noiseNode.dispose(); noiseNode = null }
  }

  startBtn.addEventListener('click', async ()=>{
    await Tone.start();
    startPatch();
  });
  stopBtn.addEventListener('click', ()=> stopPatch());

  // live update BPM and volume
  tempoEl.addEventListener('input', ()=> Tone.Transport.bpm.value = Number(tempoEl.value));
  volEl.addEventListener('input', ()=> vol.volume.value = Number(volEl.value));
})();

// Original SC snippets (for reference)
const snippets = {
  drum: `{
  var snare, bdrum, hihat;
  var tempo = 4;

  tempo = Impulse.ar(tempo);
  snare = WhiteNoise.ar(Decay2.ar(PulseDivider.ar(tempo, 4, 2), 0.005, 0.5));
  bdrum = SinOsc.ar(Line.ar(120,60, 1), 0, Decay2.ar(PulseDivider.ar(tempo, 4, 0), 0.005, 0.5));
  hihat = HPF.ar(WhiteNoise.ar(1), 10000) * Decay2.ar(tempo, 0.005, 0.5);

  Out.ar(0, (snare + bdrum + hihat) * 0.4 ! 2)
}.play`,
  ring: `{Splay.ar(Ringz.ar(Impulse.ar([2, 1, 4], [0.1, 0.11, 0.12]), [0.1, 0.1, 0.5])) * EnvGen.kr(Env([1, 1, 0], [120, 10]), doneAction: 2)}.play`,
  noise: `{LocalOut.ar(a=CombN.ar(BPF.ar(LocalIn.ar(2)*7.5+Saw.ar([32,33],0.2),2**LFNoise0.kr(4/3,4)*300,0.1).distort,2,2,40));a}.play`
}

document.getElementById('showOriginal').addEventListener('change', (e)=>{
  const p = document.getElementById('patchSelect').value;
  const pre = document.getElementById('origCode');
  if (e.target.checked){ pre.style.display='block'; pre.textContent = snippets[p] || '' } else { pre.style.display='none'; }
});
document.getElementById('patchSelect').addEventListener('change', ()=>{
  if (document.getElementById('showOriginal').checked){ document.getElementById('origCode').textContent = snippets[document.getElementById('patchSelect').value] }
});

// Send patch summary to parent chat (if embedded in NovaAI)
document.getElementById('sendToChat').addEventListener('click', ()=>{
  const p = document.getElementById('patchSelect').value;
  const summary = p === 'drum' ? 'Drum loop: kick/snare/hat pattern (mapped from SC example)' : p === 'ring' ? 'Ring-mod synth (modulated oscillators)' : 'Filtered noise texture (white noise + HPF)';
  const code = snippets[p] || '';
  // post message to parent window
  if (window.parent && window.parent !== window){
    window.parent.postMessage({ type: 'sc-widget-patch', patch: p, summary, code }, '*')
  } else {
    // fallback: copy to clipboard
    navigator.clipboard.writeText(summary + '\n\n' + code).then(()=> alert('Patch copied to clipboard'))
  }
});
