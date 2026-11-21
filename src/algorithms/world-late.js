const WORLD_LATE = {
  9: {
    title: '仓位里的空牌',
    question: '两块空牌都没放货。为什么其中一块会让后面的箱子查无此物？',
    condition: '仓有 7 格，箱号对 7 取余作起点，遇占用就向右探测。依次存 6、13、20，移走 13；只换被腾空位置的标记。',
    choices: ['留下移走标记','换成全新空牌'],
    experiment(variant) {
      const slots=Array(7).fill(null);
      for(const key of [6,13,20]){
        let i=key%slots.length;
        while(slots[i]!==null)i=(i+1)%slots.length;
        slots[i]=key;
      }
      slots[slots.indexOf(13)]=variant===1?null:'已移走';
      const route=[];let found=-1;
      for(let d=0;d<slots.length;d++){
        const i=(20%slots.length+d)%slots.length;
        route.push(i);
        if(slots[i]===null)break;
        if(slots[i]===20){found=i;break;}
      }
      return {rows:[{label:'实物仓位',value:'20 号 / '+slots.indexOf(20)+' 格'},{label:'探测路线',value:route.join(' → ')},{label:'台账查询',value:found<0?'查无此箱':'命中 '+found+' 格'}],
        observation:found<0?'箱子还在 1 格。查询在 0 格读到全新空牌，提前收工。':'查到 0 格时，移走标记提醒值班员继续向右，下一格就是 20 号箱。',
        mechanism:'从未占用的槽才能证明这条探测路径在这里结束。删除只改变一个箱子的存活状态，仍须保存其他箱子的探测路径。',
        limit:'本例为无重排的线性探测。若删除时把后继键正确回移，腾空的槽也可以重新成为终止点。'};
    }
  },
  10: {
    title: '换场前的最后一声',
    question: '最急的抢修晚到 0.2 秒，会等上多久？',
    condition: '第 2、4、6 秒各派发一项，占满该时段。返听第 0 秒到，和声第 1 秒到，均为 4 级。抢修为 9 级，只改变它的到场时刻。',
    choices: ['1.9 秒到场','2.1 秒到场'],
    experiment(variant) {
      const doors=[2,4,6];
      const jobs=[{name:'返听',arrive:0,p:4},{name:'和声',arrive:1,p:4},{name:'抢修',arrive:variant===1?2.1:1.9,p:9}];
      const order=[],served=new Set();let at=0;
      for(const t of doors){
        const ready=jobs.filter(j=>j.arrive<=t&&!served.has(j));
        ready.sort((a,b)=>b.p-a.p||a.arrive-b.arrive);
        const chosen=ready[0];
        if(chosen){served.add(chosen);order.push(chosen.name);if(chosen.name==='抢修')at=t;}
      }
      const waiting=(at-jobs[2].arrive).toFixed(1);
      return {rows:[{label:'抢修到场',value:jobs[2].arrive.toFixed(1)+' 秒'},{label:'三个时段',value:order.join(' › ')},{label:'抢修等待',value:waiting+' 秒'}],
        observation:'抢修在第 '+at+' 秒获派，实际等待 '+waiting+' 秒。返听与和声的相对先后仍按到场顺序。',
        mechanism:'优先级队列每次只能从当时已经入队的请求中选取最高级；这里把先到顺序作为同级请求的第二排序键。',
        limit:'调度不可抢占。若允许高优先级请求中断正在处理的工作，晚到的代价就会变化。'};
    }
  },
  11: {
    title: '乐句共用的最后一拍',
    question: '同一拍能同时结束上一句，又开始下一句吗？',
    condition: '在「咚啪咚啪咚啪咚」里找「咚啪咚」。命中后，两组都读作品的下一拍。只改变保留的动机前缀长度 j，一组留 1 拍，另一组清零。',
    choices: ['承接重叠的一拍','命中后从零开始'],
    experiment(variant) {
      const score=Array.from('咚啪咚啪咚啪咚'),motif=Array.from('咚啪咚');
      const pi=Array(motif.length).fill(0);
      for(let i=1,j=0;i<motif.length;i++){
        while(j&&motif[j]!==motif[i])j=pi[j-1];
        if(motif[j]===motif[i])++j;
        pi[i]=j;
      }
      const carry=variant===1?0:pi[motif.length-1],starts=[];
      for(let i=0,j=0;i<score.length;i++){
        while(j&&motif[j]!==score[i])j=pi[j-1];
        if(score[i]===motif[j])++j;
        if(j===motif.length){starts.push(i-j+2);j=carry;}
      }
      return {rows:[{label:'命中起拍',value:starts.join('、')+' 拍'},{label:'乐句数',value:starts.length+' 句'},{label:'续用前缀',value:carry+' 拍'}],
        observation:carry?'第 3 拍和第 5 拍都一拍两用，三次出现都被记下。':'第一次命中后抹去已接上的前缀，第 3 拍开始的那句被略过，只留下两句。',
        mechanism:'完整动机的最长相等真前后缀是「咚」。KMP 在一次命中后把匹配长度设回该前缀长度，下一拍就能接着比。',
        limit:'若约定同一拍只能属于一次演奏，命中后清零正好枚举从左往右贪心取得的不重叠出现。'};
    }
  },
  12: {
    title: '终点的两只表',
    question: '跑者顺序相同，只把计时表调粗，快排会多做多少比较？',
    condition: '同一批 7 位跑者，真实时间均在 12 秒之后。算法每次取末项为基准，严格较小者入左段。只改变读数精度，均向下截断。',
    choices: ['读到 1 毫秒','读到 100 毫秒'],
    experiment(variant) {
      const ticks=variant===1?100:1;
      const a=[12001,12003,12002,12006,12005,12007,12004].map(ms=>Math.floor(ms/ticks)*ticks);
      const diversity=new Set(a).size;
      let comparisons=0,levels=0;
      const byDepth=[];
      function sort(lo,hi,depth){
        if(lo>=hi)return;
        levels=Math.max(levels,depth);
        byDepth[depth-1]=(byDepth[depth-1]||0)+(hi-lo);
        const pivot=a[hi];let wall=lo;
        for(let j=lo;j<hi;j++){
          ++comparisons;
          if(a[j]<pivot){[a[j],a[wall]]=[a[wall],a[j]];++wall;}
        }
        [a[wall],a[hi]]=[a[hi],a[wall]];
        sort(lo,wall-1,depth+1);sort(wall+1,hi,depth+1);
      }
      sort(0,a.length-1,1);
      return {rows:[{label:'不同读数',value:diversity+' 种'},{label:'键比较',value:comparisons+' 次'},{label:'最深划分',value:levels+' 层'}],
        plot:{type:'partitions',byDepth,max:a.length-1},
        observation:diversity===1?'7 个成绩被钟面压成同一个读数。每一轮左段都为空，共比较 '+comparisons+' 次。':'首个基准把六位同伴均分到两侧，这批记录只用 '+comparisons+' 次键比较。',
        mechanism:'粗读数制造了大量等键。本二路划分把所有等键送入右段，划分规模变为 0 和 n−1；三向划分可一次收拢整段等键。',
        limit:'这是指定输入与分区规则的实测。互异输入也可能出现偏斜划分；这里没有计算时间量化误差以外的测量噪声。'};
    }
  }
};
