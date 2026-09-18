import {handleTurn,newConversation} from './chat-engine.mjs';
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
export function mountChat(host,{records,endpoint='/api/chat'}){
  let state=newConversation(),busy=false,disposed=false,apiAvailable=false;
  const controller=new AbortController();
  host.replaceChildren();
  const top=node('div',undefined,'chat-top'),label=node('span',"Local chat preview",'mode');
  const reset=node('button',"New chat",'reset');reset.type='button';top.append(label,reset);
  const messages=node('div',undefined,'messages');messages.setAttribute('role','log');messages.setAttribute('aria-live','polite');messages.setAttribute('aria-label',"Recipe conversation");
  const context=node('div',undefined,'context');context.setAttribute('aria-label',"Current preferences");
  const form=node('form',undefined,'composer');
  const input=node('textarea');input.rows=2;input.maxLength=4000;input.placeholder="Tell me your preferred cuisine, hot or cold, and any allergies";input.setAttribute('aria-label',"Message HeatPlan");input.setAttribute('aria-describedby','chat-help');input.id='chat-message';
  const send=node('button',"Send",'send');send.type='submit';
  const help=node('p',"Try: \"Chinese food, mango allergy, cold.\" Then \"Another one\" or \"Make it room temperature.\"",'composer-help');help.id='chat-help';
  form.append(input,send);
  host.append(top,messages,context,form,help);
  const welcome=()=>{const row=node('section',undefined,'message assistant welcome');row.append(node('span','HeatPlan','speaker'),node('p',"Tell me what you would like to eat. Include your preferred cuisine, serving temperature, ingredients and any allergies in one message."),node('p',"Keep chatting — I will remember your preferences during this conversation.",'muted'));messages.append(row);};
  welcome();
  function renderResult(result){
    const row=node('section',undefined,'message assistant');row.dataset.status=result.status;
    row.append(node('span','HeatPlan','speaker'),node('p',result.reply,'reply'));
    if(result.selected){
      const {recipe:r,score,heat}=result.selected;
      const card=node('article',undefined,'recipe-card');card.dataset.recipeId=r.recipe_id;
      card.append(node('h2',r.standard_recipe_label),node('p',r.cuisine_label+' · '+r.temperature_label+' · '+r.dish_type_label,'recipe-meta'));
      const grid=node('div',undefined,'recipe-grid'),ing=node('section'),steps=node('section');
      ing.append(node('h3',"Ingredients"));const ul=node('ul');for(const b of r.ingredients)ul.append(node('li',(b.source_group?'['+b.source_group+'] ':'')+b.text));ing.append(ul);
      steps.append(node('h3',"Method"));const ol=node('ol');for(const b of r.steps)ol.append(node('li',b.text));steps.append(ol);
      grid.append(ing,steps);card.append(grid);
      card.append(node('p',r.allergen_reminder,'allergy'));
      for(const note of r.food_notes)card.append(node('p',note,'food-note'));
      const source=node('p',undefined,'source'),link=node('a',"Original recipe");
      link.href=r.source.revision_url;link.target='_blank';link.rel='noopener noreferrer';
      source.append(link,document.createTextNode(" · Wikibooks contributors · CC BY-SA 4.0 · Standard recipes and annotations have been adapted; changes are recorded in the dataset."));card.append(source);
      const explain=node('details',undefined,'explanation');explain.append(node('summary',"Why this recipe?"));
      explain.append(node('p',"Preferences: "+result.conditions.join('; ')+'.'));
      explain.append(node('p',r.temperature_label+" group; "+(r.heat_breakdown.map(m=>m.label+' +'+m.weight).join(', ')||"No active cooking heat +0")+"; cooking heat "+heat+", score within this temperature group "+score+'.'));
      explain.append(node('p',"Allergy and ingredient restrictions are applied first, followed by cold, room-temperature and hot groups, then cooking heat."));
      card.append(explain);row.append(card);
    }
    row.append(node('p',result.allergyNote,'allergy-followup'));
    messages.append(row);context.replaceChildren(...result.conditions.map(c=>node('span',c,'condition')));
    row.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function submit(event){
    event.preventDefault();const text=input.value.trim();if(!text||busy)return;
    busy=true;send.disabled=true;send.textContent="Replying…";input.disabled=true;
    const own=node('section',undefined,'message user');own.append(node('span',"You",'speaker'),node('p',text));messages.append(own);input.value='';
    try{
      let result;
      if(apiAvailable){
        try{
          const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,state}),signal:controller.signal});
          if(!response.ok)throw Error('Service unavailable');
          result=await response.json();
          label.textContent=result.mode==='nvidia'?"NVIDIA-assisted chat":result.mode==='groq'?(result.fallback?"Groq-assisted chat · backup":"Groq-assisted chat"):result.llm?.intent_provider!=='local'&&result.llm?.intent_provider?"AI-assisted preferences · standard reply":result.fallback?"Local chat · model unavailable":"Local chat preview";
        }catch(error){
          if(disposed)return;
          result=handleTurn(text,state,records);label.textContent="Local chat · service unavailable";
        }
      }else result=handleTurn(text,state,records);
      if(disposed)return;
      state=result.state;renderResult(result);
    }catch(error){
      if(!disposed)messages.append(node('p',"I could not process that message. Please try again; your confirmed preferences are still saved.",'error'));
    }finally{if(!disposed){busy=false;send.disabled=false;send.textContent="Send";input.disabled=false;input.focus();}}
  }
  form.addEventListener('submit',submit);
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  reset.addEventListener('click',()=>{if(busy)return;state=newConversation();messages.replaceChildren();context.replaceChildren();input.value='';welcome();input.focus();});
  // Only a same-origin server can offer model services; local-file preview stays entirely offline.
  if(/^https?:$/.test(location.protocol))fetch('/api/status',{signal:controller.signal}).then(r=>r.ok?r.json():null).then(status=>{
    if(!disposed&&status?.app==='heatplan-chat-en'){apiAvailable=true;label.textContent=status.nvidia_configured?"NVIDIA configured" : status.groq_configured?"Groq configured":"Local chat preview";}
  }).catch(()=>{});
  return ()=>{disposed=true;controller.abort();host.replaceChildren();};
}
