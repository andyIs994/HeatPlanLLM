import {handleTurn,newConversation} from './chat-engine.mjs';
import {heatExplanation,ingredientOptions} from './recommendation.mjs';
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
  const input=node('textarea');input.rows=2;input.maxLength=4000;input.placeholder="Tell me which ingredients you have, hot or cold, and any allergies";input.setAttribute('aria-label',"Message HeatPlan");input.setAttribute('aria-describedby','chat-help');input.id='chat-message';
  const send=node('button',"Send",'send');send.type='submit';
  const help=node('p',"Try: \"I have blueberries and yogurt, cold.\" Mention any allergies. Cuisine is optional. Ask for \"Another one\" to keep exploring.",'composer-help');help.id='chat-help';
  form.append(input,send);
  host.append(top,messages,context,form,help);
  const options=ingredientOptions(records),browse=node('details',undefined,'ingredient-browser');
  browse.append(node('summary',`Explore ${options.length} available ingredients`));
  const search=node('input');search.type='search';search.placeholder='Find an ingredient';search.setAttribute('aria-label','Search available ingredients');
  const list=node('div',undefined,'ingredient-options');
  const refresh=()=>{const filtered=options.filter(o=>o.label.includes(search.value.toLowerCase()));list.replaceChildren(...filtered.map(o=>{const b=node('button',`${o.label} (${o.recipe_ids.length})`);b.type='button';b.addEventListener('click',()=>{input.value='I have '+o.label;input.focus();});return b;}));if(!filtered.length)list.append(node('p','No ingredient matches this search. You can still describe your request in the chat.'));};
  search.addEventListener('input',refresh);browse.append(node('p','Each ingredient has a recipe in the collection. Additional restrictions may reduce the matches.'),search,list);host.append(browse);refresh();
  const welcome=()=>{const row=node('section',undefined,'message assistant welcome');row.append(node('span','HeatPlan','speaker'),node('p',"What ingredients do you have? Tell me your serving-temperature preference and any allergies. Cuisine is optional."),node('p',"Keep chatting — I will remember your preferences during this conversation.",'muted'));messages.append(row);};
  welcome();
  function renderResult(result){
    const row=node('section',undefined,'message assistant');row.dataset.status=result.status;
    row.append(node('span','HeatPlan','speaker'),node('p',result.reply,'reply'));
    if(result.selected){
      const {recipe:r,heatAssessment}=result.selected;
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
      source.append(link,document.createTextNode(r.licence.id==='CC-BY-SA-4.0'?" · Wikibooks contributors · CC BY-SA 4.0 · Adapted recipe and annotations.":" · Preparation facts from Allrecipes via Kaggle. HeatPlan wording; upstream content is not relicensed."));card.append(source);
      const explain=node('details',undefined,'explanation');explain.append(node('summary',"Why this recipe?"));
      explain.append(node('p',"Preferences: "+result.conditions.join('; ')+'.'));
      explain.append(node('p',r.temperature_label+' group. '+heatExplanation(heatAssessment)));
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
