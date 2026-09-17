import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleTurn,newConversation} from './chat-engine.mjs';
import {CUISINES,FOOD_TERMS} from './recommendation.mjs';
import {extractIntent,composeReply} from './groq.mjs';
const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function validateState(value){
  if(!value)return newConversation();
  if(typeof value!=='object'||Array.isArray(value))throw Error('Invalid conversation state');
  const state={...newConversation()};
  const nullableEnum=(v,allowed)=>v===null||allowed.includes(v);
  if(!nullableEnum(value.cuisine,Object.keys(CUISINES))||!nullableEnum(value.temperature,['cold','room','hot'])||!nullableEnum(value.dishType,['main','side','salad','dessert','beverage','sauce','base']))throw Error('Invalid preference');
  for(const k of ['cuisine','temperature','dishType'])state[k]=value[k];
  for(const k of ['allergens','excludedIngredients','preferredIngredients']){
    if(!Array.isArray(value[k])||value[k].length>80||value[k].some(id=>!Object.hasOwn(FOOD_TERMS,id)))throw Error('Invalid food restriction');
    state[k]=[...new Set(value[k])];
  }
  if(!Array.isArray(value.unrecognizedAllergens)||value.unrecognizedAllergens.length>30||value.unrecognizedAllergens.some(v=>typeof v!=='string'||v.length>200))throw Error('Invalid pending terms');
  state.unrecognizedAllergens=value.unrecognizedAllergens;
  if(!Array.isArray(value.shownIds)||value.shownIds.length>100||value.shownIds.some(v=>!/^wb-\d{3}$/.test(v)))throw Error('Invalid seen recipes');
  state.shownIds=value.shownIds;
  for(const k of ['recipeId','lastRecipeId']){if(value[k]!==null&&!/^wb-\d{3}$/.test(value[k]))throw Error('Invalid recipe id');state[k]=value[k];}
  state.avoidHot=value.avoidHot===true;
  if(!Number.isInteger(value.turn)||value.turn<0||value.turn>1000)throw Error('Invalid turn');
  state.turn=value.turn;return state;
}
export function createServer({root=packageRoot,records,key=process.env.GROQ_API_KEY,fetcher=fetch}){
  return http.createServer(async(req,res)=>{
    function json(status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
    try{
      const expected='http://'+req.headers.host;
      if(req.headers.origin&&req.headers.origin!==expected)return json(403,{error:'Cross-origin request denied'});
      if(!/^127\.0\.0\.1:\d+$|^localhost:\d+$/.test(req.headers.host||''))return json(403,{error:'Local host required'});
      const url=new URL(req.url,expected);
      if(req.method==='GET'&&url.pathname==='/api/status')return json(200,{app:'heatplan-chat-en',groq_configured:Boolean(key)});
      if(req.method==='POST'&&url.pathname==='/api/chat'){
        if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'JSON required'});
        let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>32000)return json(413,{error:'Message too large'});}
        let input,state;
        try{input=JSON.parse(body);state=validateState(input.state);if(typeof input.message!=='string'||!input.message.trim()||input.message.length>4000)throw Error();}catch{return json(400,{error:'Invalid message or state'});}
        let intent=null,fallback=false,mode='local';
        if(key)try{intent=await extractIntent(input.message,state,{key},fetcher);mode='groq';}catch{fallback=true;}
        const result=handleTurn(input.message,state,records,intent);
        if(mode==='groq')try{result.reply=await composeReply(input.message,result,{key},fetcher);}catch{fallback=true;mode='local';}
        return json(200,{...result,mode,fallback});
      }
      if(req.method!=='GET')return json(405,{error:'Method not allowed'});
      // Serve only the preview UI. Source inputs and server environment are not web assets.
      const asset=url.pathname==='/'?'ui/preview.html':decodeURIComponent(url.pathname).replace(/^\/+/,'');
      if(!asset.startsWith('ui/')||asset.includes('..')||asset.includes('\\'))return json(404,{error:'Not found'});
      const target=path.resolve(root,asset),uiRoot=path.resolve(root,'ui')+path.sep;
      if(!target.startsWith(uiRoot))return json(404,{error:'Not found'});
      const content=await fs.readFile(target);
      const type={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.json':'application/json'}[path.extname(target)];
      if(!type)return json(404,{error:'Not found'});
      res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(content);
    }catch{if(!res.headersSent)json(404,{error:'Not found'});else res.end();}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const records=JSON.parse(await fs.readFile(path.join(packageRoot,'data/recipes.json'),'utf8'));
  const port=Number(process.env.PORT||8880);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');
  const server=createServer({records});
  server.listen(port,'127.0.0.1',()=>console.log('HeatPlan chat: http://127.0.0.1:'+port+' (Groq '+(process.env.GROQ_API_KEY?'configured':'not configured')+')'));
}
