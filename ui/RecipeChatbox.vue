<script setup>
import {onMounted,onBeforeUnmount,ref} from 'vue'
import {mountChat} from './chat-ui.mjs'
import css from './chat.css?raw'
const props=defineProps({recipes:{type:Array,required:true},endpoint:{type:String,default:'/api/chat'}})
const host=ref(null)
let dispose
onMounted(()=>{
  const shadow=host.value.attachShadow({mode:'open'})
  const style=document.createElement('style')
  style.textContent=css.replace(':root',':host')+'\n:host{display:block;font:16px/1.65 system-ui;color:#213e36}'
  const root=document.createElement('div')
  shadow.append(style,root)
  dispose=mountChat(root,{records:props.recipes,endpoint:props.endpoint})
})
onBeforeUnmount(()=>dispose?.())
</script>
<template><section ref="host" aria-label="HeatPlan recipe chat"></section></template>
