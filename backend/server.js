import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';

const app=express();
const port=process.env.PORT||8787;
const origin=process.env.ALLOWED_ORIGIN||'https://sssprojectai.github.io';
app.use(cors({origin}));
app.use(express.json({limit:'32kb'}));
app.use(rateLimit({windowMs:60_000,max:30,standardHeaders:true,legacyHeaders:false}));

app.get('/health',(req,res)=>res.json({ok:true,service:'AI-CT TEACHER Gemini backend'}));

const SYSTEM=`You are the AI layer of AI-CT TEACHER, an educational research-pilot application for future English teachers. AI is a thinking partner and an object of critical analysis, not a final-answer machine. Never complete the student's reasoning. Give useful but fallible classroom-oriented suggestions. Include uncertainty when appropriate. Never invent sources, studies, statistics, URLs or citations. Encourage verification and alternative perspectives. Use simple clear English. The six stages are exactly Context, Consult, Critique, Check, Challenge, Conclude. For Consult, produce a plausible response that contains at least one point the learner should examine rather than presenting it as unquestionably correct. Return valid JSON with keys: response, claims_to_check, possible_assumptions, uncertainty, follow_up_question.`;

function cleanText(v,max=6000){return typeof v==='string'?v.trim().slice(0,max):''}
app.post('/api/ai',async(req,res)=>{
  try{
    if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'AI service is not configured.'});
    const scenario=cleanText(req.body?.scenario,2500);
    const stage=cleanText(req.body?.stage,80);
    const studentResponse=cleanText(req.body?.studentResponse,3000);
    const task=cleanText(req.body?.task,1200);
    if(!scenario||!stage)return res.status(400).json({error:'Scenario and stage are required.'});
    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const prompt=`6C stage: ${stage}\nScenario: ${scenario}\nTask: ${task}\nStudent response: ${studentResponse||'(none yet)'}\n\nGenerate the stage-appropriate response. For CONSULT, respond to the scenario as a teaching assistant but deliberately leave reasonable claims/assumptions for the learner to critique and verify. For later stages, do not give the student's final answer.`;
    const result=await ai.models.generateContent({model:process.env.GEMINI_MODEL||'gemini-3.8-flash',contents:prompt,config:{systemInstruction:SYSTEM,responseMimeType:'application/json',temperature:.7,maxOutputTokens:900}});
    const raw=result.text||'';
    let data; try{data=JSON.parse(raw)}catch{data={response:raw,claims_to_check:[],possible_assumptions:[],uncertainty:'The response was returned as plain text; verify important claims.',follow_up_question:'What would you verify before accepting this response?'}}
    return res.json({ok:true,...data});
  }catch(err){console.error('AI request failed:',err?.message||err);return res.status(502).json({error:'AI service is temporarily unavailable.'});}
});
app.listen(port,()=>console.log(`AI-CT Gemini backend listening on ${port}`));
