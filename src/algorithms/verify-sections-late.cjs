'use strict';

// Run with Node 18+ from any directory. A path argument overrides the sibling source file.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'sections-late.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const sections = vm.runInNewContext(source + '\n;SECTIONS_LATE', {}, {filename: sourcePath});
const byId = new Map(sections.map(section => [section.id, section]));
const expectedIds = ['9.1','9.2','9.3','9.4','10.1','10.2','10.3','11.1','11.2','11.3','11.4','11.5','12.1','12.2','12.3'];
assert.deepEqual([...byId.keys()], expectedIds);
assert.equal(sections.length, expectedIds.length);
assert.ok(byId.get('12.1').labs.includes('quicksort-recursive'), '§12.1 needs a direct complete-quicksort lab');

for (const section of sections) {
  for (const field of ['title','premise','mechanism','check','answer']) {
    assert.equal(typeof section[field], 'string', section.id + ' / ' + field);
    assert.ok(section[field].trim());
  }
  assert.ok(section.trace.length >= 3);
  assert.ok(section.topics.length && section.labs.length);
  if (section.demo) {
    assert.ok(section.presets.length >= 2);
    for (const preset of section.presets) {
      const result = section.demo(preset.input);
      assert.ok(result.length >= 2 && result.every(line => typeof line === 'string' && line.trim()));
    }
  }
}

const probe = byId.get('9.3').demo;
const heapSort = byId.get('10.2').demo;
const search = byId.get('11.4').demo;
const select = byId.get('12.2').demo;
assert.equal(probe('5 12 19').at(-1), '槽 0–6：19 / · / · / · / · / 5 / 12');
assert.equal(probe('-2 5 12 5').at(-1), '槽 0–6：12 / · / · / · / · / -2 / 5');
assert.ok(probe('0 1 2 3 4 5 6 7').some(line => line.includes('表满')));

const heapExample = heapSort('2 8 4 1 6 7');
assert.ok(heapExample.includes('修好以槽 0 为根的堆：[8, 6, 7, 1, 2, 4]'));
assert.ok(heapExample.includes('堆 [7, 6, 4, 1, 2]，已排后缀 [8]'));
assert.ok(search('AAABABA|ABABA')[1].includes('坏字符 1，好后缀 2，右移 2'));
assert.ok(search('ZZZZZABABA|ABABA')[1].includes('坏字符 5，好后缀 1，右移 5'));

// indexOf is a separate oracle here. Binary strings cover repetitive borders,
// overlaps, absent patterns, empty operands, and patterns longer than the text.
function binaryWords(length) {
  if (!length) return [''];
  return Array.from({length: 2 ** length}, (_,i) => i.toString(2).padStart(length, '0'));
}
let searches = 0;
for (let n=0; n<=7; n++) {
  for (const text of binaryWords(n)) {
    for (let m=0; m<=4; m++) {
      for (const pattern of binaryWords(m)) {
        const index = text.indexOf(pattern);
        const final = search(text + '|' + pattern).at(-1);
        assert.ok(final.includes(index === -1 ? '没有匹配' : '下标 ' + index + '。'), text + '|' + pattern + ': ' + final);
        searches++;
      }
    }
  }
}
// The demo reports Unicode code-point positions; indexOf reports UTF-16 units.
assert.ok(search('🥁🪈🥁|🪈').at(-1).includes('下标 1。'));

const arrays = [Array(17).fill(2), [-7], [4,3,2,1,0], [0,1,2,3,4]];
for (let n=1; n<=30; n++) {
  arrays.push(Array.from({length:n}, (_,i) => ((i*13+n*3)**2 % 31)-15));
}
let selections = 0;
for (const a of arrays) {
  const sorted = [...a].sort((x,y) => x-y);
  const input = a.join(' ');
  assert.equal(heapSort(input).at(-1), '升序结果 [' + sorted.join(', ') + ']');
  for (let k=1; k<=a.length; k++) {
    assert.equal(select(input + '|' + k).at(-1), '第 ' + k + ' 项 = ' + sorted[k-1] + '。');
    selections++;
  }
}

function checkRejected(demo, input, word) {
  const result = demo(input);
  assert.equal(result.length, 1, 'expected a single validation message for '+input);
  assert.ok(result[0].includes(word), result[0]);
}
for (const demo of [probe, heapSort]) {
  for (const bad of ['', '2 abc', '1.5', '2 '.repeat(41)]) checkRejected(demo, bad, '整数');
}
for (const bad of ['2 3','2 3|0','2 3|3','2 3|1.5','|1','1|1|1']) checkRejected(select, bad, 'k');
checkRejected(search,'no separator','格式');
checkRejected(search,'AA|A|B','格式');
checkRejected(search,'A'.repeat(81)+'|B','最多');
checkRejected(search,'T|'+'A'.repeat(21),'最多');

console.log('PASS 15 sections; '+searches+' BM comparisons with indexOf, '+arrays.length+' heapsorts and '+selections+' selections with an independent numeric sort; presets, linkage and input guards.');
