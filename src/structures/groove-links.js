(() => {
  "use strict";
  const voices = ["底鼓", "军鼓", "踩镲"];
  const beatName = id => "P" + (id + 1);
  const reference = id => id == null ? "nullptr" : beatName(id);
  const milliseconds = gap => Number.isFinite(gap) ? Math.round(gap) + " ms" : "—";

  function playbackOrder(chain) {
    const nodes = new Map(chain.nodes.map(node => [node.id, node]));
    const seen = new Set();
    const order = [];
    for (let id = chain.head; nodes.has(id) && !seen.has(id); id = nodes.get(id).next) {
      seen.add(id);
      order.push(nodes.get(id));
    }
    return order;
  }

  function grooveConnections(chain, selected) {
    const order = playbackOrder(chain);
    if (!order.length) {
      return `<section class="gl-panel"><h3>先敲下一拍</h3><p>现在 head 为空。录下第一拍后，它就会成为可以移动的节点。</p></section>`;
    }
    const index = Math.max(0, order.findIndex(n => n.id === Number(selected)));
    const moved = order[index], prev = order[index - 1];
    const current = beatName(moved.id);
    const sourceSlot = prev ? beatName(prev.id) + "->next" : "head";
    const cards = order.map((node, pos) => {
      const name = beatName(node.id), voice = voices[node.voice], gap = milliseconds(node.gap);
      return `<button type="button" class="gl-beat gl-voice-${node.voice}" data-beat-select="${node.id}" aria-pressed="${node.id === moved.id}" aria-label="选择 ${name}，${voice}，时距 ${gap}，当前是第 ${pos + 1} 拍"><span class="gl-ref">${name}</span><strong>${voice}</strong><span class="gl-gap">${gap}</span></button>`;
    }).join("");
    const picks = [];
    if (index !== 0) picks.push({id:-1, name:"队首", slot:"head", successor:order[0].id});
    for (const node of order) {
      if (node.id === moved.id || node.id === prev?.id) continue;
      picks.push({id:node.id, name:beatName(node.id) + " " + voices[node.voice] + " 后面",
        slot:beatName(node.id) + "->next", successor:node.next});
    }
    const firstPick = order[index + 1]?.id ?? -1;
    const options = picks.map((p,k) =>
      `<option value="${p.id}" data-choice="${k}"${p.id === firstPick ? " selected" : ""}>${p.name}</option>`).join("");
    const codeEscape = line => line.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
    const previews = picks.map((p,k) => {
      const remaining = order.filter(n => n.id !== moved.id).map(n => n.id);
      const insertAt = p.id === -1 ? 0 : remaining.indexOf(p.id) + 1;
      remaining.splice(insertAt, 0, moved.id);
      const code = [
        `Node* moved = ${sourceSlot};  // ${current}`,
        `${sourceSlot} = moved->next;  // 摘下，原链续到 ${reference(moved.next)}`,
        `moved->next = ${p.slot};  // 保留新位置原有后继 ${reference(p.successor)}`,
        `${p.slot} = moved;  // 把 ${current} 接进去`
      ].map(codeEscape).join("\n");
      return `<div class="gl-example" data-choice="${k}"><p>按当前选择移动后</p><p class="gl-route">${remaining.map(beatName).join(" → ")} → ∅</p><pre><code>${code}</code></pre></div>`;
    }).join("");
    const tail = beatName(order.at(-1).id);
    const currentRoute = order.map(n => beatName(n.id)).join(" → ");
    const detail = `<details class="gl-detail"><summary>查看这次重接的指针与 C++</summary>
      <p class="gl-route">head → ${currentRoute} → ∅</p>
      <p>Next(${current}) = ${moved.next == null ? "∅" : beatName(moved.next)}。${current} 持有自己的音色和时距；移动它会改变访问次序。</p>
      ${picks.length ? previews : '<p>单节点只有这一种次序，任何重接都不会产生新的节奏排列。</p>'}
      <p>${tail} 是当前尾拍。尾节点的 next 为空时，循环播放由播放器重新读取 head。</p>
      <p>P 编号代表固定节点，画在一起的相邻两拍可以位于不同内存地址。n 拍占用 Θ(n) 节点空间；从 head 寻找旧前驱最多走 n − 1 步。已定位前驱时，摘下与插入只需常数次指针读写和 O(1) 额外空间。</p>
    </details>`;
    return `<section class="gl-panel" aria-labelledby="gl-question"><h3 id="gl-question">把哪一拍移到哪里？</h3>
      <div class="gl-beats" role="group" aria-label="按播放顺序选择要移动的拍">${cards}</div>
      ${picks.length ? `<div class="gl-move"><label for="beat-after">把 <strong>${current} · ${voices[moved.voice]}</strong> 移到</label><select id="beat-after" class="gl-target">${options}</select><button type="button" id="apply-splice">移动这拍</button></div>` :
        `<div class="gl-move"><label for="beat-after">${current} 是唯一的一拍</label><select id="beat-after" disabled><option value="-1">队首</option></select><button type="button" id="apply-splice" disabled>移动这拍</button></div><p>再录一拍，就能交换它们的播放顺序。</p>`}
      ${detail}</section>`;
  }
  globalThis.grooveConnections = grooveConnections;
})();
