import {handleTurn,newConversation} from './chat-engine.mjs';
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
export function mountChat(host,{records,endpoint='/api/chat'}){
  let state=newConversation(),busy=false,disposed=false,apiAvailable=false;
  const controller=new AbortController();
  host.replaceChildren();
  const top=node('div',undefined,'chat-top'),label=node('span','本地对话预览','mode');
  const reset=node('button','新对话','reset');reset.type='button';top.append(label,reset);
  const messages=node('div',undefined,'messages');messages.setAttribute('role','log');messages.setAttribute('aria-live','polite');messages.setAttribute('aria-label','菜谱对话');
  const context=node('div',undefined,'context');context.setAttribute('aria-label','当前对话条件');
  const form=node('form',undefined,'composer');
  const input=node('textarea');input.rows=2;input.maxLength=4000;input.placeholder='请选择您想要的菜系，冷热，另注明过敏原';input.setAttribute('aria-label','发送菜谱需求');input.setAttribute('aria-describedby','chat-help');input.id='chat-message';
  const send=node('button','发送','send');send.type='submit';
  const help=node('p','例如：中国菜，芒果过敏，冷。也可以接着说“换一道”或“改成常温”。','composer-help');help.id='chat-help';
  form.append(input,send);
  host.append(top,messages,context,form,help);
  const welcome=()=>{const row=node('section',undefined,'message assistant welcome');row.append(node('span','HeatPlan','speaker'),node('p','告诉我你想吃什么，我会先给一份常规菜谱。菜系、冷热、食材和过敏原都可以写在同一句话里。'),node('p','接着聊就好，我会记住这轮对话中的条件。','muted'));messages.append(row);};
  welcome();
  function renderResult(result){
    const row=node('section',undefined,'message assistant');row.dataset.status=result.status;
    row.append(node('span','HeatPlan','speaker'),node('p',result.reply,'reply'));
    if(result.selected){
      const {recipe:r,score,heat}=result.selected;
      const card=node('article',undefined,'recipe-card');card.dataset.recipeId=r.recipe_id;
      card.append(node('h2',r.standard_recipe_label),node('p',r.cuisine_label+' · '+r.temperature_label+' · '+r.dish_type_label,'recipe-meta'));
      const grid=node('div',undefined,'recipe-grid'),ing=node('section'),steps=node('section');
      ing.append(node('h3','食材'));const ul=node('ul');for(const b of r.ingredients)ul.append(node('li',(b.source_group?'['+b.source_group+'] ':'')+b.text));ing.append(ul);
      steps.append(node('h3','做法'));const ol=node('ol');for(const b of r.steps)ol.append(node('li',b.text));steps.append(ol);
      grid.append(ing,steps);card.append(grid);
      card.append(node('p',r.allergen_reminder,'allergy'));
      for(const note of r.food_notes)card.append(node('p',note,'food-note'));
      const source=node('p',undefined,'source'),link=node('a','原始菜谱');
      link.href=r.source.revision_url;link.target='_blank';link.rel='noopener noreferrer';
      source.append(link,document.createTextNode(' · Wikibooks contributors · CC BY-SA 4.0 · 常规版本及标注经过整理，修改记录随数据保留。'));card.append(source);
      const explain=node('details',undefined,'explanation');explain.append(node('summary','为什么推荐这道菜？'));
      explain.append(node('p','已识别：'+result.conditions.join('；')+'。'));
      explain.append(node('p',r.temperature_label+'档；'+(r.heat_breakdown.map(m=>m.label+' +'+m.weight).join('，')||'无需加热 +0')+'。热力 '+heat+'，同档推荐分 '+score+'。'));
      explain.append(node('p','先按过敏原与食材要求筛选，再按冰食、常温、热食及热力排序。'));
      card.append(explain);row.append(card);
    }
    row.append(node('p',result.allergyNote,'allergy-followup'));
    messages.append(row);context.replaceChildren(...result.conditions.map(c=>node('span',c,'condition')));
    row.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function submit(event){
    event.preventDefault();const text=input.value.trim();if(!text||busy)return;
    busy=true;send.disabled=true;send.textContent='正在回复…';input.disabled=true;
    const own=node('section',undefined,'message user');own.append(node('span','你','speaker'),node('p',text));messages.append(own);input.value='';
    try{
      let result;
      if(apiAvailable){
        try{
          const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,state}),signal:controller.signal});
          if(!response.ok)throw Error('Service unavailable');
          result=await response.json();
          label.textContent=result.mode==='groq'?'Groq 辅助对话':result.fallback?'本地对话 · 模型暂不可用':'本地对话预览';
        }catch(error){
          if(disposed)return;
          result=handleTurn(text,state,records);label.textContent='本地对话 · 服务暂不可用';
        }
      }else result=handleTurn(text,state,records);
      if(disposed)return;
      state=result.state;renderResult(result);
    }catch(error){
      if(!disposed)messages.append(node('p','这条消息暂时没处理好，请再发一次；已确认的条件仍保留。','error'));
    }finally{if(!disposed){busy=false;send.disabled=false;send.textContent='发送';input.disabled=false;input.focus();}}
  }
  form.addEventListener('submit',submit);
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  reset.addEventListener('click',()=>{if(busy)return;state=newConversation();messages.replaceChildren();context.replaceChildren();input.value='';welcome();input.focus();});
  // Only a same-origin server can offer Groq; local-file preview stays entirely offline.
  if(/^https?:$/.test(location.protocol))fetch('/api/status',{signal:controller.signal}).then(r=>r.ok?r.json():null).then(status=>{
    if(!disposed&&status?.app==='heatplan-chat'){apiAvailable=true;label.textContent=status.groq_configured?'Groq 辅助对话':'本地对话预览';}
  }).catch(()=>{});
  return ()=>{disposed=true;controller.abort();host.replaceChildren();};
}
