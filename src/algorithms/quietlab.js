// A lab is a single reading surface. Native disclosures stay open across redraws.
function quietLabView() {
  const frame = lesson.frames[step];
  const last = lesson.frames.length - 1;
  const current = document.querySelector('.quiet-lab');
  const sameLesson = current?.dataset.lessonId === lesson.id;

  function opened(key) {
    return sameLesson && current.querySelector('[data-fold="' + key + '"]')?.open ? ' open' : '';
  }

  const inspect = '<details class="quiet-inspect" data-fold="inspect"' + opened('inspect') + '>';
  const code = lesson.code.map((source, i) =>
    '<div class="cline' + (i === frame.line ? ' current' : '') + '"><span>' +
    (i + 1) + '</span><code>' + esc(source) + '</code></div>'
  ).join('');
  const rateOptions = [[2300,'慢速'],[1400,'标准速度'],[700,'快速']].map(([ms,name]) =>
    '<option value="' + ms + '"' + (ms === speed ? ' selected' : '') + '>' + name + '</option>'
  ).join('');
  const stateInfo = frame.line < 0 ? (step === 0 ? '运行前' : '当前无对应代码行') : '正在读第 ' + (frame.line + 1) + ' 行';
  const q = lesson.quiz;
  const answers = q.choices.map((choice,index) =>
    '<button class="choice' + (selection === index ? index === q.answer ? ' selected' : ' miss' : '') +
    '" data-answer="' + index + '" aria-pressed="' + (selection === index) + '">' + esc(choice) + '</button>'
  ).join('');
  const response = selection === null ? '' :
    '<p class="quiet-response" role="status">' + (selection === q.answer ? '答对了。' :
    '核对一下。正确答案是「' + esc(q.choices[q.answer]) + '」。') + esc(q.why) + '</p>';
  const notes = [['不变量', lesson.invariant], ['时间与空间', lesson.cost], ['适用边界', lesson.boundary]].map(([label,body]) =>
    '<div><dt>' + label + '</dt><dd>' + esc(body) + '</dd></div>'
  ).join('');
  const tag = lesson.group === '指针与链表' ? '地址为示意值' : '';
  const diagram = stage(frame, '结构图', tag);
  return '<article class="quiet-lab" data-lesson-id="' + esc(lesson.id) + '">' +
    '<header class="quiet-heading"><h1>' + esc(lesson.title) + '</h1><p>' + esc(lesson.subtitle) + '</p></header>' +
    '<div class="quiet-work">' +
      '<div class="quiet-figure">' + diagram + nodeRead + '</div>' +
      '<section class="readout quiet-observation" aria-live="' + (timer ? 'off' : 'polite') + '">' +
        '<h2>' + esc(frame.title) + '</h2><p>' + esc(frame.note) + '</p>' +
      '</section>' +
      '<div class="transport quiet-controls">' +
        '<button id="prev" aria-label="上一步"' + (step === 0 ? ' disabled' : '') + '>上一步</button>' +
        '<output aria-label="当前进度">第 ' + (step + 1) + ' / ' + (last + 1) + ' 幅</output>' +
        '<button id="next" aria-label="下一步"' + (step === last ? ' disabled' : '') + '>下一步</button>' +
        '<details class="quiet-replay" data-fold="replay"' + opened('replay') + '><summary>回放</summary>' +
          '<div class="quiet-replay-options"><button id="play">' + (timer ? '暂停' : step === last ? '重播' : '播放') + '</button>' +
          '<input id="timeline" type="range" min="0" max="' + last + '" value="' + step + '" aria-label="步骤时间线">' +
          '<select id="speed" aria-label="播放速度">' + rateOptions + '</select></div>' +
        '</details>' +
      '</div>' +
      inspect + '<summary>同步看代码与变量</summary><div class="quiet-code">' +
        '<p class="quiet-line">' + stateInfo + '</p><div class="codebox" tabindex="0" aria-label="C++ 代码">' + code + '</div>' +
        '<dl class="quiet-vars">' + (frame.vars || []).map(([name,value]) =>
          '<div><dt>' + esc(name) + '</dt><dd>' + esc(value) + '</dd></div>').join('') + '</dl>' +
      '</div></details>' +
    '</div>' +
    '<div class="quiet-appendix"><details data-fold="notes"' + opened('notes') + '><summary>翻看原理手稿</summary>' +
      '<dl class="quiet-notes">' + notes + '</dl></details>' +
      '<details data-fold="test"' + opened('test') + '><summary>做一道预测题</summary>' +
        '<div class="quiet-question"><p>' + esc(q.ask) + '</p>' + answers + response + '</div></details></div>' +
    '</article>';
}
