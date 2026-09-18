/** Compatibility exports for existing Groq callers and regression tests. */
import {extractIntent as extract,composeReply as compose} from './llm.mjs';
export {intentSchema,validateIntent} from './llm.mjs';
export const extractIntent=(message,state,options={},fetcher=fetch)=>extract(message,state,{...options,provider:'groq'},fetcher);
export const composeReply=(message,result,options={},fetcher=fetch)=>compose(message,result,{...options,provider:'groq'},fetcher);
