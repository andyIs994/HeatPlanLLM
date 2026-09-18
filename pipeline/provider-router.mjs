import {extractIntent,composeReply,milliseconds,ProviderError} from './llm.mjs';

/** A router belongs to ONE chat turn. Failed services are skipped for its reply. */
export function createTurnRouter({nvidiaKey='',groqKey='',nvidiaModel,groqModel,timeoutMs=12000,budgetMs=45000,fetcher=fetch}){
  const providers=[{id:'nvidia',key:nvidiaKey,model:nvidiaModel},{id:'groq',key:groqKey,model:groqModel}].filter(p=>p.key?.trim());
  const timeout=milliseconds(timeoutMs,12000),deadline=Date.now()+milliseconds(budgetMs,45000);
  const failed=new Set(),attempts=[];
  async function run(stage,message,data){
    for(const p of providers){
      if(failed.has(p.id))continue;
      const remaining=deadline-Date.now();
      if(remaining<=0){attempts.push({stage,provider:p.id,status:'failed',reason:'budget_exhausted'});break;}
      try{
        const fn=stage==='intent'?extractIntent:composeReply;
        const value=await fn(message,data,{provider:p.id,key:p.key,model:p.model,timeoutMs:Math.min(timeout,remaining)},fetcher);
        attempts.push({stage,provider:p.id,status:'ok'});
        return {provider:p.id,value};
      }catch(error){
        failed.add(p.id);
        attempts.push({stage,provider:p.id,status:'failed',reason:error instanceof ProviderError?error.code:'invalid_output'});
      }
    }
    return {provider:'local',value:null};
  }
  return {run,attempts};
}
