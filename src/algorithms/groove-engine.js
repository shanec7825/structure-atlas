/* Each gap travels with its beat. next=null ends one pass; the player loops at head. */
function makeBeatChain(hits, tailMs) {
  const rows = Array.isArray(hits) ? hits.filter(hit =>
    hit && Number.isInteger(hit.voice) && hit.voice >= 0 && hit.voice <= 2 &&
    Number.isFinite(hit.time)
  ) : [];
  const limitGap = ms => Math.max(1, Math.min(60000, ms));
  const previousSpacing = rows.length > 1
    ? rows[rows.length - 1].time - rows[rows.length - 2].time
    : 400;
  const tail = Number.isFinite(tailMs) ? tailMs : previousSpacing;
  return {
    head: rows.length ? 0 : null,
    nodes: rows.map((hit, id) => {
      const next = id + 1 < rows.length ? id + 1 : null;
      return {id, voice:hit.voice, gap:limitGap(next === null ? tail : rows[next].time - hit.time), next};
    })
  };
}

function beatOrder(chain) {
  if (!chain || !Array.isArray(chain.nodes)) return [];
  const lookup = new Map(chain.nodes.map(node => [node.id, node]));
  const result = [], seen = new Set();
  let id = chain.head;
  while (id != null && lookup.has(id) && !seen.has(id)) {
    const node = lookup.get(id);
    result.push(node);
    seen.add(id);
    id = node.next;
  }
  return result;
}

function moveBeatAfter(chain, movedId, afterId) {
  const order = beatOrder(chain);
  const index = order.findIndex(node => node.id === movedId);
  if (index < 0 || movedId === afterId || order[order.length - 1].next !== null) return chain;
  if (afterId !== null && !order.some(node => node.id === afterId)) return chain;
  const previousId = index === 0 ? null : order[index - 1].id;
  if (previousId === afterId) return chain;

  const nodes = chain.nodes.map(node => ({...node}));
  const slots = new Map(nodes.map(node => [node.id, node]));
  const moved = slots.get(movedId);
  let head = chain.head;
  if (previousId === null) head = moved.next;
  else slots.get(previousId).next = moved.next;

  if (afterId === null) {
    moved.next = head;
    head = movedId;
  } else {
    const after = slots.get(afterId);
    moved.next = after.next;
    after.next = movedId;
  }
  return {head, nodes};
}

function makeDrumAudio() {
  let enabled = true;
  let session = null;
  const nowMs = () => globalThis.performance?.now() ?? Date.now();

  function open() {
    const Constructor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Constructor) return null;
    const ctx = new Constructor();
    const master = ctx.createGain();
    const limiter = ctx.createDynamicsCompressor();
    master.gain.value = 0.65;
    limiter.threshold.value = -14;
    limiter.knee.value = 12;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    master.connect(limiter);
    limiter.connect(ctx.destination);

    const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.4), ctx.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; ++i) samples[i] = Math.random() * 2 - 1;
    return {ctx, master, limiter, noise, active:new Set(), waiting:[], unlocking:false, lastStart:0};
  }

  function synth(s, voice, when) {
    const {ctx, master} = s;
    // Each layer owns its signal chain so rapidly retriggered drums can overlap.
    function layer(source, filters, level, attack, duration, offset) {
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(level, when + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      const path = [source, ...filters, env];
      for (let i = 0; i < path.length - 1; ++i) path[i].connect(path[i+1]);
      env.connect(master);
      s.active.add(source);
      source.onended = () => {
        for (const element of path) element.disconnect();
        s.active.delete(source);
      };
      if (offset === undefined) source.start(when);
      else source.start(when, offset);
      source.stop(when + duration + 0.005);
    }
    function tone(wave, f0, f1, pitchTime, level, duration) {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.setValueAtTime(f0, when);
      osc.frequency.exponentialRampToValueAtTime(f1, when + pitchTime);
      layer(osc, [], level, 0.002, duration);
    }
    function hiss(highpass, lowpass, level, duration) {
      const source = ctx.createBufferSource();
      source.buffer = s.noise;
      const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = highpass; hp.Q.value = 0.65;
      lp.type = 'lowpass'; lp.frequency.value = lowpass; lp.Q.value = 0.65;
      layer(source, [hp,lp], level, 0.002, duration, Math.random() * 0.1);
    }
    if (voice === 0) {
      tone('sine', 144, 48, 0.085, 0.9, 0.25);
      tone('triangle', 170, 85, 0.025, 0.10, 0.04);
    } else if (voice === 1) {
      tone('triangle', 210, 140, 0.06, 0.30, 0.13);
      hiss(1050, 7800, 0.65, 0.17);
    } else {
      hiss(5900, 12400, 0.40, 0.085);
      tone('triangle', 5700, 4860, 0.015, 0.04, 0.035);
    }
  }

  function flush(s) {
    if (s !== session || !enabled || s.ctx.state !== 'running' || !s.waiting.length) return;
    const events = s.waiting.splice(0), first = events[0].at;
    // Preserve attacks entered during a normal unlock. Compress a long browser
    // permission delay into a short roll instead of replaying stale seconds later.
    const span = events[events.length - 1].at - first;
    const scale = span > 90 ? 90 / span : 1;
    const start = Math.max(s.ctx.currentTime + 0.004, s.lastStart + 0.001);
    for (const event of events) {
      const when = start + (event.at - first) * scale;
      synth(s, event.voice, when);
      s.lastStart = when;
    }
  }

  function release(s) {
    if (!s) return;
    s.waiting.length = 0;
    s.master.disconnect(); s.limiter.disconnect();
    for (const source of s.active) {
      try { source.stop(); } catch { /* A layer may already have ended. */ }
    }
    s.active.clear();
    if (s.ctx.state !== 'closed') {
      try { Promise.resolve(s.ctx.close()).catch(() => {}); } catch { /* Already closed by the device. */ }
    }
  }
  function stop() {
    const old = session;
    session = null;
    release(old);
  }
  function hit(voice) {
    if (!enabled || !Number.isInteger(voice) || voice < 0 || voice > 2) return false;
    try {
      if (!session || session.ctx.state === 'closed') {
        stop();
        session = open();
      }
      if (!session) return false;
      const s = session;
      s.waiting.push({voice, at:nowMs()});
      if (s.ctx.state === 'running') flush(s);
      else if (!s.unlocking) {
        s.unlocking = true;
        Promise.resolve(s.ctx.resume()).then(() => {
          s.unlocking = false;
          if (s.ctx.state === 'running') flush(s);
          else s.waiting.length = 0;
        }).catch(() => {
          if (session === s) stop();
        });
      }
      return true;
    } catch {
      stop();
      return false;
    }
  }
  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
  }
  return {hit, setEnabled, stop};
}
