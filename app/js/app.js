/* AI-CT TEACHER application. Loaded by index.html and app/index.html */
/* =====================================================================
   UTILITIES
   ===================================================================== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const W=s=>(String(s||'').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)||[]).length;
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const setPath=(o,p,v)=>{const ks=p.split('.');let a=o;for(let i=0;i<ks.length-1;i++){if(a[ks[i]]==null)a[ks[i]]={};a=a[ks[i]]}a[ks[ks.length-1]]=v};
const excerpt=(s,n=110)=>{s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1).trimEnd()+'…':s};
const fmtDate=t=>new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const fmtTime=t=>new Date(t).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
const uid=(p='x')=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const toks=s=>String(s||'').toLowerCase().match(/[\p{L}\p{N}']+/gu)||[];
const STOP=new Set('about after again against because before being between could during their there these those through under until where which while would should other really students student teacher class lesson english language think their them then than that this with from have what when will your into more some such also only over very much many most just like make made each both'.split(' '));
const contentSet=s=>new Set(toks(s).filter(t=>t.length>=5&&!STOP.has(t)));
const sharedCount=(a,b)=>{const A=contentSet(a),B=contentSet(b);let n=0;A.forEach(x=>{if(B.has(x))n++});return n};
const ngrams=(t,n)=>{const s=new Set();for(let i=0;i+n<=t.length;i++)s.add(t.slice(i,i+n).join(' '));return s};
function overlap(student,ai,n=4){const st=toks(student);if(st.length<n)return 0;const g=ngrams(st,n),a=ngrams(toks(ai),n);if(!g.size)return 0;let h=0;g.forEach(x=>{if(a.has(x))h++});return h/g.size}
const pct=(a,b)=>b?Math.round(a/b*100):0;
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;

let toastT=null;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('hidden'),2600)}

function modal({title,html,actions}){
  return new Promise(res=>{
    const ov=$('#overlay'),prev=document.activeElement;
    ov.innerHTML=`<div class="modal-bg" data-modal-bg><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mtitle"><h3 id="mtitle">${esc(title)}</h3><div>${html}</div><div class="row">${actions.map((a,i)=>`<button class="btn ${a.cls||''}" data-mi="${i}">${esc(a.label)}</button>`).join('')}</div></div></div>`;
    const done=v=>{ov.innerHTML='';document.removeEventListener('keydown',key);prev&&prev.focus&&prev.focus();res(v)};
    const key=e=>{if(e.key==='Escape')done(null)};
    document.addEventListener('keydown',key);
    ov.querySelector('[data-modal-bg]').addEventListener('click',e=>{if(e.target.hasAttribute('data-modal-bg'))done(null)});
    ov.querySelectorAll('[data-mi]').forEach(b=>b.addEventListener('click',()=>done(actions[+b.dataset.mi].val)));
    const first=ov.querySelector('[data-mi]:last-child');first&&first.focus();
  });
}
const confirmBox=(title,text,okLabel='Continue')=>modal({title,html:`<p>${esc(text)}</p>`,actions:[{label:'Cancel',cls:'quiet',val:false},{label:okLabel,val:true}]});

/* =====================================================================
   STATE + STORAGE  (localStorage, guarded; falls back to memory)
   ===================================================================== */
/* =====================================================================
   STATIC DATA
   ===================================================================== */
/* Six-stage AI-CT 6C cycle. Reflection is not a separate seventh stage —
   it is the last part of CONCLUDE (final decision, reasoning, evidence,
   and a short reflection on what changed and how confident the learner
   is), matching the model exactly as specified. */
const STAGES = [
  {n:1,key:'context', name:'Context', task:'Analyse the classroom situation on your own, before you see any AI output.',
   why:'Your unaided thinking is the baseline. Without it, you cannot tell later what AI changed in your thinking.', next:'Consult'},
  {n:2,key:'consult', name:'Consult', task:'Write your own prompt, send it to AI, and read what comes back.',
   why:'The way you ask shapes the answer you get. The response is material to examine, not a verdict to accept.', next:'Critique'},
  {n:3,key:'critique',name:'Critique',task:'Examine the AI response: its claims, assumptions, strengths, weaknesses and fit to this classroom.',
   why:'A teacher who cannot judge an AI suggestion cannot safely use one. Justified judgment is the skill being practised.', next:'Check'},
  {n:4,key:'check',   name:'Check',   task:'Test the claims that matter against sources you find yourself, and record a verdict for each.',
   why:'Fluent text is not evidence. Checking separates what is supported from what only sounds plausible.', next:'Challenge'},
  {n:5,key:'challenge',name:'Challenge',task:'Argue against the AI response and build at least one alternative solution.',
   why:'Generating alternatives and counterarguments shows whether you can think beyond the first suggestion.', next:'Conclude'},
  {n:6,key:'conclude',name:'Conclude',task:'State your final decision, your reasoning and evidence, whether the AI response should be accepted, modified or rejected — and briefly reflect on what changed and how confident you are.',
   why:'This is your independent, accountable judgment. It should be traceable to your analysis, not copied from the AI, and it is where you look back on how your thinking moved.', next:'Assessment'}
];

const COMP = [
  {key:'analysis',name:'Analysis',short:'Analysis',
   about:'Breaking a problem or an AI response into parts: causes, claims, assumptions, information needs.'},
  {key:'evaluation',name:'Evaluation',short:'Evaluation',
   about:'Judging strengths, weaknesses and omissions with reasons that fit the specific classroom.'},
  {key:'inference',name:'Inference',short:'Inference',
   about:'Drawing conclusions that follow from checked evidence, and staying proportionate to what it shows.'},
  {key:'argumentation',name:'Argumentation',short:'Argument',
   about:'Building a connected case: claim, reasoning, evidence and conclusion, with a counterargument in view.'},
  {key:'alternative',name:'Alternative Thinking',short:'Alternatives',
   about:'Generating and testing options other than the first one offered.'},
  {key:'reflection',name:'Reflection',short:'Reflection',
   about:'Explaining how your own thinking changed, and how confident you are in relation to the evidence.'}
];
const LEVELS = ['','Beginning','Developing','Proficient','Advanced'];

const RUBRIC = {
  analysis:[
    'Describes the situation or the AI response in general terms; few causes, claims or information needs are stated.',
    'Names some causes or claims but does not separate facts from assumptions.',
    'Separates the problem, plausible causes and missing information; identifies the main claim and assumptions of the AI response.',
    'Breaks the problem and the AI response into parts, shows how the parts relate, and ties assumptions to the specific classroom context.'],
  evaluation:[
    'Accepts or rejects the AI response with little or no justification.',
    'Gives a judgment with general reasons (for example "not realistic") that are not tied to the context.',
    'Judges strengths and weaknesses with reasons tied to the classroom context.',
    'Weighs strengths, weaknesses and omissions against the specific context, and qualifies the overall judgment.'],
  inference:[
    'Draws conclusions with no visible link to evidence.',
    'Links conclusions to evidence loosely; verdicts are not clearly connected to sources.',
    'Verdicts are consistent with the evidence recorded, and the conclusion draws on checked material.',
    'Distinguishes what the evidence shows, what it does not show, and what remains uncertain; conclusions are proportionate.'],
  argumentation:[
    'States an opinion only.',
    'States a claim with a reason, but evidence or a conclusion is missing.',
    'Presents claim, reasoning, evidence and conclusion in a connected way.',
    'As Proficient, and anticipates and answers a counterargument.'],
  alternative:[
    'Repeats or lightly rephrases the AI suggestion.',
    'Offers an alternative with little development.',
    'Offers a developed alternative that differs from the AI response and explains its disadvantages.',
    'Tests the alternative against changed conditions and carries the insight into the final judgment.'],
  reflection:[
    'Describes what was done without describing thinking.',
    'Notes that thinking changed, in general terms.',
    'Explains what AI changed or challenged, what was rejected and why, and which evidence mattered.',
    'As Proficient, and relates own confidence to the evidence and names a specific change for next time.']
};

const VERDICTS = [
  {v:'SUPPORTED',label:'Supported',cls:'g',def:'A reliable source clearly backs the claim in this context.'},
  {v:'PARTIALLY',label:'Partially supported',cls:'w',def:'Some support exists, but it is limited, conditional or not a full match.'},
  {v:'UNSUPPORTED',label:'Unsupported',cls:'b',def:'You looked and found no support, or found evidence against it.'},
  {v:'UNCERTAIN',label:'Uncertain',cls:'',def:'You cannot decide yet: sources conflict or you could not access any.'}
];
const SOURCE_TYPES = ['Peer-reviewed article','Academic book or textbook','Official curriculum or exam document','Professional organisation or teacher guide','Website or blog','Colleague or mentor teacher','Could not find a source'];

/* ---------------------------------------------------------------------
   TASK LIBRARY CATEGORIES
   The 8 categories below are the main browsing structure of the Task
   Library. Every task (existing and new) belongs to exactly one category.
   The task's original "skill" (Speaking, Grammar, etc.) is still shown as
   a chip for context, but categories — not skills — are how tasks are
   organised and found.
   --------------------------------------------------------------------- */
const CATEGORIES = [
  {key:'critical-thinking',icon:'🧠',name:'Critical Thinking',
   desc:'Analyse causes, weigh evidence and question assumptions in everyday teaching decisions.'},
  {key:'ai-teaching',icon:'🤖',name:'AI & Teaching',
   desc:'Decide when and how to bring AI tools into your own classroom, and what to watch for.'},
  {key:'fact-checking',icon:'🔍',name:'Fact Checking',
   desc:'Verify claims before you repeat them: statistics, sources and confident-sounding advice.'},
  {key:'communication',icon:'💬',name:'Communication',
   desc:'Help learners speak and listen with confidence in real classroom conditions.'},
  {key:'ethics',icon:'⚖️',name:'Ethics',
   desc:'Work through fairness, integrity and privacy questions that English teachers actually meet.'},
  {key:'media-info',icon:'📰',name:'Media & Information',
   desc:'Spot invented sources, shaky citations and misleading claims in teaching content.'},
  {key:'methods',icon:'👩‍🏫',name:'Teaching Methods',
   desc:'Compare methods and approaches, and judge which one fits a real class.'},
  {key:'problem-solving',icon:'💡',name:'Problem Solving',
   desc:'Turn a messy classroom problem into a workable plan.'}
];
const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map(c=>[c.key,c]));

const TASKS = [
 {id:'t1',num:1,skill:'Speaking',category:'communication',topics:['Motivation','Communicative language teaching'],level:'A2–B1',mins:'40–50 min',
  title:'The silent classroom',
  blurb:'Students are reluctant to speak English in pair work and whole-class talk.',
  context:'You are on teaching practice in a state secondary school. In a Grade 9 class, most students stay silent during speaking activities. When one student does try, others giggle if there is a mistake. The course book is mostly grammar exercises, and the mentor teacher tells you that "they just do not want to speak". You have to plan the next four lessons.',
  facts:[['Class','24 students, ages 14–15'],['Level','A2–B1'],['Lesson','45 minutes, fixed desks in pairs'],['Materials','Grammar-focused course book']],
  keywords:['24','giggle','laugh','mistake','pair','45','course book','textbook','grammar','ages','a2','desk'],
  whatIf:'The class grows from 24 to 40 students and the desks are fixed in rows. Which parts of your solution still work, and which would you drop?',
  ai:['Reluctance to speak is almost always caused by low language proficiency, so the most effective solution is to increase students\' vocabulary and grammar knowledge before asking them to speak.',
      'Research shows that 90% of students speak more when the teacher corrects every error immediately.',
      'Introduce structured pair work with clear roles and short time limits so that students speak in low-risk settings before whole-class talk.',
      'Use role-plays with scripted dialogues and gradually remove the scripts as confidence grows.',
      'Reward students with points for speaking English so that motivation becomes high in every class.',
      'These steps work in all classrooms, regardless of class size, culture or learner age.'],
  design:['Segment 1 treats one cause (proficiency) as the only cause and ignores anxiety and peer response.','Segment 2 contains an unsourced statistic, and its advice sits uneasily with fluency-focused speaking practice.','Segment 5 promises a strong motivational effect from external rewards without support.','Segment 6 is a universal claim that ignores the context you were given.']},

 {id:'t2',num:2,skill:'Grammar',category:'methods',topics:['Communicative language teaching','Error correction'],level:'B1',mins:'40–50 min',
  title:'Rules known, rules unused',
  blurb:'Students can state grammar rules but cannot use them when speaking.',
  context:'You teach a pre-university English group. Students score well on gap-fill exercises with the present perfect and can recite the rule. In conversation, they almost always use the simple past instead ("I lived here for five years" when they still do). Your programme expects you to prepare students for spoken interaction, not only for written tests.',
  facts:[['Class','18 students, ages 17–18'],['Level','B1'],['Lesson','90 minutes, twice a week'],['Test format','Mostly written gap-fill']],
  keywords:['18','present perfect','gap-fill','simple past','spoken','written','test','90','b1','17'],
  whatIf:'Your programme adds a written end-of-term test that is 80% gap-fill and counts for most of the final grade. How does that change what you would do in class?',
  ai:['The present perfect is difficult because it does not exist in students\' first language, so the rule should be explained in the mother tongue until every student understands it.',
      'Once students understand the rule, communicative use follows automatically.',
      'Design information-gap activities in which students ask "Have you ever…?" questions to complete a class survey.',
      'Give delayed feedback after the activity by noting common errors on the board and discussing them together.',
      'Grammar teaching should be avoided completely, because the best research shows explicit instruction has no effect on acquisition.',
      'In each lesson, spend about 20 minutes on explanation and 5 minutes on practice.'],
  design:['Segments 2 and 5 overstate: understanding a rule does not guarantee use, and research does not show that explicit instruction has no effect.','Segments 2 and 5 also pull in different directions, which is worth noticing.','Segment 6 gives an arbitrary time ratio that reverses the practice emphasis of segment 3.','Segment 1 generalises about first languages without knowing the students\' language.']},

 {id:'t3',num:3,skill:'Vocabulary',category:'critical-thinking',topics:['Error correction','Lesson planning'],level:'B1',mins:'35–45 min',
  title:'The same word errors, again',
  blurb:'Students repeatedly confuse make/do and say/tell, and misuse false friends.',
  context:'In the last three writing tasks, students in your class confused "make" and "do", used "say" where "tell" was needed, and repeated several false-friend errors. You have corrected these in red pen each time. The errors keep coming back. Your mentor suggests giving longer word lists and a weekly test.',
  facts:[['Class','20 students, ages 13–14'],['Level','B1'],['Current practice','Red-pen correction, weekly word list'],['Time available','10 minutes of each lesson for vocabulary']],
  keywords:['20','make','do','say','tell','false','friend','red','list','weekly','13','10 minutes','writing'],
  whatIf:'A colleague says the students "do not care about accuracy". What evidence would you look for before accepting that explanation?',
  ai:['Give students a list of 50 new words each week to memorise for a weekly test.',
      'Spaced repetition is supported by extensive research, and words can be revisited after one day, three days and one week.',
      'Since the errors are repeated, the students clearly do not care about accuracy and need stricter penalties.',
      'Use collocation activities, such as matching verbs with nouns (make a mistake, do homework), so that students notice patterns.',
      'Vocabulary is learned best in isolation, without context, because context distracts from the form of the word.',
      'Encourage students to keep a personal vocabulary notebook with example sentences they write themselves.'],
  design:['Segment 3 attributes motives to students without evidence.','Segment 5 contradicts segment 4 and the notebook idea in segment 6.','Segment 2 is partly well founded (the spacing effect), but the exact intervals are a rule of thumb, which is worth separating out.','Segment 1 repeats the approach that is already not working, without asking why.']},

 {id:'t4',num:4,skill:'Writing',category:'media-info',topics:['Lesson planning','Differentiation'],level:'B1',mins:'40–50 min',
  title:'A letter that stops after two lines',
  blurb:'You need to design a writing activity that produces connected text and useful feedback.',
  context:'You plan a 45-minute lesson in which students write a letter to a friend about a memorable trip. In earlier tasks, students wrote short, disconnected sentences and rarely reread their work. Students have not done peer feedback before, and some are worried about "being judged" by classmates.',
  facts:[['Class','22 students, ages 16'],['Level','B1'],['Lesson','45 minutes'],['Peer feedback','Never used before']],
  keywords:['22','letter','trip','45','disconnected','peer','feedback','judged','16','b1','friend'],
  whatIf:'Only 25 minutes are left for the writing lesson because of a school event. Which stages of your plan would you keep, shorten or move to homework?',
  ai:['Begin with a model text and analyse its structure and useful phrases before students write.',
      'Students should write the entire letter individually in silence, without any planning, so that their real ability is visible.',
      'Use a process approach with planning, drafting, peer feedback and revision.',
      'Give a grade to every draft to keep students serious about the task.',
      'Provide a checklist so students can review their own work for organisation, linking words and accuracy.',
      'According to the International Writing Instruction Report (2019), 78% of teachers say process writing doubles students\' scores.'],
  design:['Segment 6 cites a source that the demonstration response invented, with a statistic that is easy to repeat and hard to trace.','Segment 2 conflicts with segment 3, and the "no planning" claim is asserted without a reason.','Segment 4 raises a question of grading against learning, and it does not consider students who fear judgment.','Segment 3 is reasonable, but a full process cycle in 45 minutes is not discussed.']},

 {id:'t5',num:5,skill:'Assessment',category:'methods',topics:['Speaking'],level:'B1',mins:'40–50 min',
  title:'Assessing speaking fairly',
  blurb:'You must decide how to assess speaking with limited time and a fairness concern.',
  context:'You are asked to assess speaking at the end of term. You have one afternoon and can give each student about four minutes. A parent has already asked how you can be sure that speaking marks are "not just your opinion". You want an approach that is practical, fair and useful for students.',
  facts:[['Class','16 students'],['Level','B1'],['Time','About 4 minutes per student'],['Concern','Fairness and subjectivity of marks']],
  keywords:['16','four minutes','4 minutes','parent','fair','subjective','opinion','term','afternoon','b1'],
  whatIf:'Your school will not allow audio recording. How would that change your approach to fairness?',
  ai:['The most objective way to assess speaking is a multiple-choice test on spoken-language grammar.',
      'Use an analytic rubric with criteria such as fluency, accuracy, range, pronunciation and interaction.',
      'Paired tasks can show interaction, although teachers should watch for partner effects.',
      'One rater is always enough, as long as the rater is an experienced teacher.',
      'Record the performances so they can be re-scored and shared with students.',
      'Assess pronunciation by checking whether learners sound like native speakers.'],
  design:['Segment 1 confuses objectivity with validity: it measures something other than speaking.','Segment 4 is an absolute claim about reliability.','Segment 6 sets an unjustified standard (native-like sound) instead of intelligibility.','Segment 5 is useful but ignores consent and time, which matter in the given context.']},

 {id:'t6',num:6,skill:'Mixed-ability classroom',category:'critical-thinking',topics:['Reading','Differentiated instruction'],level:'A2–B2',mins:'40–55 min',
  title:'One text, four levels',
  blurb:'You must teach one reading text to learners from A2 to B2.',
  context:'Your class of 28 includes a few students who barely follow the text and a few who finish everything early and disengage. You have one coursebook text about city life, one hour, and no teaching assistant. You do not want to label students or prepare four separate lessons.',
  facts:[['Class','28 students'],['Range','A2 to B2'],['Lesson','60 minutes, no assistant'],['Resource','One coursebook text']],
  keywords:['28','a2','b2','one text','coursebook','60','assistant','finish','early','label','city'],
  whatIf:'Two students in your class have reading difficulties linked to dyslexia. What would you add or change?',
  ai:['Divide the class permanently into three ability groups and give each group a different text throughout the term.',
      'Use tiered tasks on a single text, with comprehension questions at different levels of challenge.',
      'Let stronger students finish first and then give them extra worksheets to fill the time.',
      'Pre-teach key vocabulary to weaker students before the lesson so that they can access the text.',
      'Differentiation is unnecessary for motivated students, because motivation alone removes level differences.',
      'Set up mixed-level peer support pairs, with clear roles for both partners.'],
  design:['Segment 1 proposes permanent tracking with little discussion of its effects on students or your workload.','Segment 3 gives "more of the same" rather than deeper work.','Segment 5 is an unsupported claim.','Segment 4 is plausible, but it needs time you were told you do not have.']},

 {id:'t7',num:7,skill:'Classroom management',category:'problem-solving',topics:['Participation','Communicative language teaching'],level:'B1',mins:'35–45 min',
  title:'Group work turns into chatter',
  blurb:'Group work drifts into first-language side talk, and participation is uneven.',
  context:'When you set group tasks, several groups switch to their first language and off-topic talk within two minutes. Two or three students do most of the work. You have started raising your voice, and it works for about a minute. You want students on task without turning the lesson into a battle.',
  facts:[['Class','32 students, ages 15–16'],['Level','B1'],['Lesson','45 minutes, movable desks'],['Symptom','Off-task talk, uneven participation']],
  keywords:['32','group','first language','l1','off-task','voice','two or three','movable','45','15','b1'],
  whatIf:'A group task planned for 20 minutes must run in 10. How would you keep accountability without long instructions?',
  ai:['Establish clear routines and expectations for group work, including roles and a visible timer.',
      'Punish any use of the first language with lost marks, since English-only rules always increase English use.',
      'Circulate during group work and use proximity and brief check-ins.',
      'Raise your voice sharply so that students learn the teacher is in control.',
      'Give tasks with a concrete, visible product, such as a completed table or a poster, to keep groups accountable.',
      'Classroom management is only about discipline and has nothing to do with the design of the task.'],
  design:['Segment 2 is absolute, and it ignores possible purposeful use of the first language.','Segment 6 is false and conflicts with segments 1 and 5, which are about task design.','Segment 4 recommends the behaviour you already found is short-lived.','Segments 1, 3 and 5 are sensible, but they leave open how to fit them into the time you have.']},

 {id:'t8',num:8,skill:'Listening',category:'communication',topics:['Translation dependence','Lesson planning'],level:'B1',mins:'35–45 min',
  title:'Stop, translate, stop listening',
  blurb:'Students demand translation of each unknown word and stop listening.',
  context:'In listening lessons, students stop attending as soon as they meet an unknown word and ask you to translate it. Several say the recording is "too fast". You have only the course-book audio, which plays twice. You want students to keep listening and infer, without making them feel that their first language is forbidden.',
  facts:[['Class','20 students, ages 15–16'],['Level','B1'],['Materials','Course-book audio, played twice'],['Symptom','Stop listening, ask for translation']],
  keywords:['20','translate','translation','unknown word','too fast','twice','audio','course-book','coursebook','first language','15'],
  whatIf:'The audio in the next unit is a natural-speed conversation with a regional accent. What would you adapt before class?',
  ai:['Ban translation completely in every lesson, since any use of the first language always slows acquisition.',
      'Use pre-listening tasks that activate prior knowledge and invite predictions about the content.',
      'Ask students to listen for gist first and for detail on the second listening, so that they build a strategy.',
      'Listening comprehension is mainly a matter of vocabulary size, so teaching listening strategies is unnecessary.',
      'Teach students to infer the meaning of unknown words from context, and to keep listening when they miss a word.',
      'Use short dictation of sentences from the recording to draw attention to connected speech and linking.'],
  design:['Segment 1 is absolute and clashes with your wish to respect the first language.','Segment 4 is an overstated claim that also contradicts segments 3 and 5.','Segments 2, 3, 5 and 6 are plausible but say nothing about how to do them with two plays of the audio.','Nothing in the response addresses "too fast" directly, which is worth noticing.']},

 {id:'t9',num:9,skill:'AI in language learning',category:'ai-teaching',topics:['AI-assisted Learning','Speaking practice'],level:'B1',mins:'35–45 min',
  title:'Should students practise with an AI conversation partner?',
  blurb:'Decide whether, and how, to recommend an AI chatbot for extra speaking practice.',
  context:'Several students in your evening group have started using a free AI chatbot app to practise speaking English at home, and they ask whether you recommend it to the whole class. Some students are excited; one says she feels "less embarrassed talking to a robot". Your school has no budget for a paid classroom tool, and you have not checked what the app does with students\' recordings.',
  facts:[['Class','19 adult students, mixed levels'],['Setting','Evening course, homework-based practice'],['Budget','No school budget for paid apps'],['Unknown','What the app stores or does with voice data']],
  keywords:['chatbot','ai app','recording','data','privacy','budget','free','robot','embarrassed','evening','homework'],
  whatIf:'One student has no smartphone and only a basic shared family computer. How does that change what you recommend to the whole class?',
  ai:['AI conversation partners are extremely effective and should replace traditional pair-work speaking practice, since students get unlimited patient practice.',
      'Recommend the app to the whole class as homework, since students who tried it already report feeling more confident.',
      'Before recommending any app, check its privacy policy and what happens to students\' voice recordings and personal data.',
      'AI chatbots are good for low-stakes practice and building confidence, but they cannot replace real interaction, such as reading a partner\'s reaction or negotiating meaning.',
      'Studies confirm that AI conversation partners improve speaking scores by 40% within one month.',
      'Consider whether every student can access the app equally, including cost, devices and internet access.'],
  design:['Segment 1 overstates the case and treats replacement of human interaction as automatically good.','Segment 5 gives a precise, confident statistic with no traceable source.','Segment 2 recommends the app to everyone before the privacy question in segment 3 has even been answered.','Segments 3, 4 and 6 are the ones worth building on: privacy, realistic limits and equal access.']},

 {id:'t10',num:10,skill:'Evaluating claims',category:'fact-checking',topics:['Fact Checking','Professional development'],level:'B1–B2',mins:'30–40 min',
  title:'The viral vocabulary statistic',
  blurb:'A colleague shares a confident claim from social media. Decide whether to trust it and repeat it.',
  context:'In a teachers\' group chat, a colleague shares a post: "Research proves students need to meet a word exactly 17 times to learn it — plan your lessons around this number." She wants to redesign the whole vocabulary curriculum around it and asks what you think before she proposes it to the head teacher.',
  facts:[['Source','A social media post with no citation'],['Claim','A word must be met exactly 17 times to be learned'],['Context','Used to justify a curriculum-wide change'],['Your role','Asked for an opinion before it goes to the head teacher']],
  keywords:['17 times','viral','social media','curriculum','head teacher','colleague','post','research proves','vocabulary'],
  whatIf:'The same colleague finds a second post giving a different number, 12 times, from a different account. How does that change how you check the claim?',
  ai:['The claim is plausible because vocabulary research does discuss repeated exposure as one factor in learning new words.',
      'The exact number 17 is a very specific figure, and specific numbers like this should be checked against a traceable, citable source before they are used.',
      'Repetition research generally reports a wide range of estimates rather than one fixed number, and the ideal number likely depends on the word, the learner and the context.',
      'Since the claim appeared online and sounds confident, it is safe to use it to redesign the curriculum immediately.',
      'A curriculum change based on one unsourced number is risky; it would be worth checking a methodology textbook or an applied linguistics journal first.',
      'If no source can be found, the honest response is to say the number is unverified, not to repeat it as settled fact.'],
  design:['Segment 4 draws the opposite conclusion from segment 2, and is the one to be suspicious of.','Segment 1 is reasonable but could be read as endorsing the specific number rather than just the general idea.','Segments 2, 3, 5 and 6 model exactly the checking habit this task is asking you to practise.','Notice that no segment claims to have found the actual source — that work is still yours to do in Check.']},

 {id:'t11',num:11,skill:'Academic integrity',category:'ethics',topics:['Ethics','Assessment'],level:'B2',mins:'35–45 min',
  title:'The AI-written essay',
  blurb:'A student submits homework that reads very differently from their usual writing. Decide how to respond.',
  context:'A student who usually writes short, simple sentences submits a homework essay with advanced vocabulary and complex structures unlike anything she has written in class. You suspect she used an AI tool to write some or all of it, but you are not certain, and you know detection tools can be wrong. You need to respond in a way that is fair to her and consistent for the rest of the class.',
  facts:[['Student','Usually writes short, simple sentences in class'],['Evidence','One essay, unusually advanced, no direct proof'],['Policy','No clear school policy on AI use yet'],['Stakes','The essay counts toward her term grade']],
  keywords:['essay','detector','plagiarism','ai tool','policy','grade','fair','proof','advanced vocabulary','suspect'],
  whatIf:'The school later adopts an AI-detection tool that flags the essay as "98% likely AI-generated". How much should that change your response, given that such tools can be wrong?',
  ai:['Run the essay through an AI-detection tool, and treat a high AI score as proof that the student cheated.',
      'Talk to the student directly and ask her to explain her writing process, rather than opening with an accusation.',
      'AI-detection tools are known to produce false positives, including for capable students and non-native writers, so a detection score alone should not decide the outcome.',
      'Redesign future writing assessments to include an in-class writing sample, so unsupported work is not the only evidence used.',
      'Since this is unfair to other students, give her a zero immediately to protect the class average.',
      'Consider that unequal access to AI tools outside class could itself be a fairness issue worth discussing with the whole class.'],
  design:['Segment 1 treats an unreliable detector score as proof, which segment 3 directly contradicts.','Segment 5 jumps to a punitive outcome before any conversation or evidence in segments 2 and 3.','Segments 2, 4 and 6 build a fairer process: talk first, redesign assessment, and think about equity.','No segment mentions your school\'s policy, because the scenario tells you none clearly exists yet — that gap is part of the problem.']}
];
const SKILLS = ['All',...TASKS.map(t=>t.skill)];
const TASK_BY_ID = Object.fromEntries(TASKS.map(t=>[t.id,t]));

/* Sample record (pre-filled, clearly labelled) */
const SAMPLE = {
  taskId:'t1',
  context:{problem:'Students do not speak English in pair work or whole-class talk, and they laugh when someone makes a mistake. The main problem seems to be fear of being judged, not only lack of language.',
    causes:'Possible causes are anxiety about mistakes, low confidence at A2–B1, a grammar-heavy course book with few speaking tasks, and a class culture where laughing at errors is normal. Lack of vocabulary may also play a part.',
    info:'I need to know how students behave in small groups, whether they speak more in their first language, how the mentor reacts to errors, and what speaking activities the course book already has.',
    approach:'I would start with low-risk pair work with short, clear tasks, agree a simple rule about respecting mistakes, and correct after the activity instead of interrupting students while they speak.',conf:3},
  consult:{checks:['ctx','prob','cons','fmt'],prompt:'I am a student teacher with a Grade 9 class of 24 students at A2–B1 who are silent in speaking activities and laugh at each other\'s mistakes. I have 45-minute lessons and a grammar-focused course book. Suggest practical steps for the next four lessons and explain the reasons behind each step and any limits.',
    mode:'demo',response:''},
  critique:{tags:{0:'q',1:'check',2:'ok',3:'ok',4:'q',5:'check'},
    claim:'The main claim is that speaking reluctance is mostly a proficiency problem, solved by structured, scaffolded speaking practice.',
    assumptions:'It assumes that language knowledge is the main cause, that all classes are alike, and that points and immediate correction motivate speaking.',
    convincing:'The structured pair work with roles and time limits, and the gradual removal of scripts, are convincing because they lower risk step by step.',
    questionable:'Correcting every error immediately and giving points for speaking are questionable, and the 90% figure has no source.',
    weaknesses:'It ignores anxiety and peer laughter, which I noted as key causes, and it treats "every class" as if the context did not matter.',
    missing:'It does not mention a class agreement about respecting mistakes, or how to deal with the giggling.',
    fit:'Only partly fits. Pair work suits my fixed desks and 45-minute lessons, but immediate correction would make 24 anxious students even quieter.',
    stance:'partly',justification:'I partly agree because the pair work and scaffolding ideas fit my class, but I disagree with the claims about proficiency being the cause and about correcting every error immediately, since they conflict with what I know about anxiety and fluency practice.'},
  check:{rows:[
    {claim:'90% of students speak more when the teacher corrects every error immediately.',source:'Searched Google Scholar and two teacher-training textbooks for the figure.',sourceType:'Could not find a source',evidence:'I could not find any study reporting this number. Textbooks I read advise delaying correction during fluency activities, so the claim also conflicts with them.',verdict:'UNSUPPORTED'},
    {claim:'Reluctance to speak is almost always caused by low proficiency.',source:'Horwitz, Horwitz & Cope (1986), foreign language classroom anxiety.',sourceType:'Peer-reviewed article',evidence:'The article treats anxiety as a factor in learners\' speaking difficulties, so proficiency alone is not a full explanation, although it may be part of it.',verdict:'PARTIALLY'},
    {claim:'These steps work in all classrooms regardless of size, culture or age.',source:'Course-book teacher\'s guide and my mentor\'s comments.',sourceType:'Professional organisation or teacher guide',evidence:'The teacher\'s guide itself says activities need adapting to class size, so a universal claim is not supported.',verdict:'UNSUPPORTED'}],
    reliability:'The AI wrote confidently, but one statistic could not be traced anywhere, so it may have been invented. I cannot assume any specific number or claim from AI is real without a source.',
    nextSources:'I could check journals on classroom anxiety and books on communicative language teaching.'},
  challenge:{alternative:'I would first build safety: agree a class rule about respecting mistakes, use short pair tasks with a clear outcome, and give delayed correction on the board without names. Then I would move to small-group role plays and remove supports gradually.',
    change:'I would remove the points system and the immediate correction, and add a class agreement and anonymous delayed feedback.',
    disadvantages:'The AI plan risks raising anxiety through immediate correction, and points may reward quantity over meaning and make quiet students feel worse.',
    counter:'Someone could argue that immediate correction prevents errors from fossilising, but for beginners in this class, the cost in confidence is likely higher than the gain.',
    whatif:'With 40 students in rows, I would keep short pair tasks with the neighbour, drop role plays that need movement, and use whole-class choral practice before pair work.'},
  conclude:{claim:'The most suitable approach for this class is safe, scaffolded pair work with delayed correction, not immediate correction and rewards.',
    reasoning:'Students are silent mainly because they fear peer judgment, so the first step is to make mistakes safe. Because pair work is low-risk and fits fixed desks, it lets them practise before speaking to the class. Delayed correction protects fluency, whereas immediate correction would increase anxiety.',
    evidence:'The 90% figure could not be traced, and Horwitz et al. link anxiety to speaking difficulty. The teacher\'s guide also says activities must be adapted to class size.',
    conclusion:'I will use structured pair work, a class agreement on respecting mistakes and delayed feedback for four lessons, and check after each lesson whether more students speak.',decision:'modify',
    reflectBefore:'I thought the problem was fear of mistakes and that pair work and delayed correction would help.',
    reflectChanged:'The AI made me notice that I had not thought about a gradual removal of support, and it made me question my own assumption that motivation was the main issue.',
    reflectRejected:'I rejected immediate correction, the points system and the universal claim, because I found no support and they conflicted with my classroom analysis.',
    reflectLearned:'I learned that a confident answer can include a made-up number, and that checking one claim changes how I read the rest.',
    reflectNext:'Next time I will check sources for the claims I plan to act on before I write my alternative, and write a more specific prompt.',confidence:4}
};
/* =====================================================================
   METHOD CHALLENGE — question bank
   10 English-teaching methods x 3 difficulties (easy / medium / advanced).
   Each question: a short classroom scenario, 3 options, one correct
   answer, and a short explanation shown after answering.
   ===================================================================== */
const METHODS = [
  {key:'clt',name:'Communicative Language Teaching'},
  {key:'tblt',name:'Task-Based Language Teaching'},
  {key:'pbl',name:'Project-Based Learning'},
  {key:'prbl',name:'Problem-Based Learning'},
  {key:'coop',name:'Cooperative Learning'},
  {key:'gtm',name:'Grammar-Translation Method'},
  {key:'direct',name:'Direct Method'},
  {key:'alm',name:'Audio-Lingual Method'},
  {key:'flipped',name:'Flipped Classroom'},
  {key:'cbi',name:'Content-Based Instruction'}
];
const METHOD_BY_KEY=Object.fromEntries(METHODS.map(m=>[m.key,m]));

const MC_QUESTIONS=[
 {id:'clt-e',method:'clt',diff:'easy',
  q:'Students work in pairs. One has a picture, the other does not. They ask questions to find the differences. The teacher does not correct every mistake during the activity.',
  options:['Communicative Language Teaching','Grammar-Translation Method','Audio-Lingual Method','Flipped Classroom'],correct:0,
  explain:'CLT focuses on real communication and getting the message across, not perfect grammar during speaking.'},
 {id:'clt-m',method:'clt',diff:'medium',
  q:'The teacher gives students a real-life topic, like planning a class trip, and lets them use any English they know to discuss it. Getting the message across matters more than perfect grammar.',
  options:['Grammar-Translation Method','Communicative Language Teaching','Direct Method','Audio-Lingual Method'],correct:1,
  explain:'This is a CLT activity: meaningful communication is the goal, and fluency is valued over perfect accuracy.'},
 {id:'clt-a',method:'clt',diff:'advanced',
  q:'In a CLT lesson, the teacher notices a grammar mistake while students are doing a role-play. What does the teacher most likely do?',
  options:['Stop the activity at once and explain the rule','Note the mistake and address it briefly after the activity ends','Ignore every mistake forever','Stop the activity and ask students to translate the sentence into their first language'],correct:1,
  explain:'In CLT, teachers usually let communication continue and give feedback afterward, so the flow of the conversation is not interrupted.'},

 {id:'tblt-e',method:'tblt',diff:'easy',
  q:'Students work together to plan a birthday party in English: make a list, agree a budget, and write invitations. Grammar is discussed only after the task is finished.',
  options:['Task-Based Language Teaching','Grammar-Translation Method','Audio-Lingual Method','Flipped Classroom'],correct:0,
  explain:'A real task with a clear outcome, followed by language feedback, is the core pattern of Task-Based Language Teaching.'},
 {id:'tblt-m',method:'tblt',diff:'medium',
  q:'The lesson has three parts: the teacher introduces the topic; students complete a real task, like booking a hotel room by role-play, using any language they can; then the class reviews useful language that came up.',
  options:['Direct Method','Task-Based Language Teaching','Content-Based Instruction','Grammar-Translation Method'],correct:1,
  explain:'This pre-task, task, and language-focus structure is a classic TBLT lesson shape.'},
 {id:'tblt-a',method:'tblt',diff:'advanced',
  q:'How is Task-Based Language Teaching usually different from a typical Communicative Language Teaching activity?',
  options:['TBLT always avoids group work','TBLT is built around one specific, outcome-focused task, with language form usually addressed afterward','TBLT never allows any communication','TBLT is just the Grammar-Translation Method with a new name'],correct:1,
  explain:'TBLT is organised specifically around completing a task with a clear outcome; explicit language work usually comes after the task, not before it.'},

 {id:'pbl-e',method:'pbl',diff:'easy',
  q:'Over three weeks, students research a topic, interview people, and create a short documentary video in English to present to the school.',
  options:['Project-Based Learning','Audio-Lingual Method','Grammar-Translation Method','Direct Method'],correct:0,
  explain:'An extended activity that produces a real final product, like a video, is the hallmark of Project-Based Learning.'},
 {id:'pbl-m',method:'pbl',diff:'medium',
  q:'A class spends two weeks creating an English-language magazine about their city, with articles, interviews and photos, to send to a partner school abroad.',
  options:['Direct Method','Project-Based Learning','Content-Based Instruction','Audio-Lingual Method'],correct:1,
  explain:'A multi-step activity building toward one real, shareable product over an extended time is Project-Based Learning.'},
 {id:'pbl-a',method:'pbl',diff:'advanced',
  q:'What most distinguishes Project-Based Learning from a single Problem-Based Learning lesson?',
  options:['Projects are usually shorter than one class period','Project-Based Learning typically runs over an extended period and ends in a tangible product; a Problem-Based Learning task can be solved within one lesson','There is no real difference between them','Project-Based Learning never produces anything that students can share'],correct:1,
  explain:'Both involve investigation, but Project-Based Learning is usually longer and ends with a concrete product, while Problem-Based Learning can be a single focused lesson.'},

 {id:'prbl-e',method:'prbl',diff:'easy',
  q:'Students work in small groups. They discuss a real-life problem and find a solution.',
  options:['Problem-Based Learning','Grammar-Translation Method','Lecture Method','Audio-Lingual Method'],correct:0,
  explain:'Correct! Problem-Based Learning helps students learn through solving meaningful problems.'},
 {id:'prbl-m',method:'prbl',diff:'medium',
  q:'The teacher presents a case: "A tourist is lost and cannot speak the local language. What should they do?" Groups investigate and propose solutions in English, picking up vocabulary as they need it.',
  options:['Problem-Based Learning','Audio-Lingual Method','Direct Method','Grammar-Translation Method'],correct:0,
  explain:'Starting from a real problem and learning language along the way, as it is needed, is typical of Problem-Based Learning.'},
 {id:'prbl-a',method:'prbl',diff:'advanced',
  q:'In Problem-Based Learning, when is new language or content usually introduced?',
  options:['Before the problem, in a full lecture','As students need it, while they work to solve the problem','Never — PrBL avoids introducing anything new','Only after the final test, as a review'],correct:1,
  explain:'In PrBL, learning happens in response to the problem, not before it in a separate lecture.'},

 {id:'coop-e',method:'coop',diff:'easy',
  q:'Each student in a group of four has one job: reader, note-taker, reporter, or timekeeper. The group only succeeds if everyone contributes.',
  options:['Cooperative Learning','Grammar-Translation Method','Direct Method','Audio-Lingual Method'],correct:0,
  explain:'Clear individual roles combined with a shared group goal is a key feature of Cooperative Learning.'},
 {id:'coop-m',method:'coop',diff:'medium',
  q:'Each group member gets a different piece of information about a story. No one has the whole story, so the group must share what each person knows to answer questions together.',
  options:['Cooperative Learning','Audio-Lingual Method','Content-Based Instruction','Grammar-Translation Method'],correct:0,
  explain:'This is a classic "jigsaw" technique used in Cooperative Learning, where every member\'s contribution is needed for the group to succeed.'},
 {id:'coop-a',method:'coop',diff:'advanced',
  q:'What makes an activity "Cooperative Learning" rather than simply "group work"?',
  options:['Students happen to sit together','Structured roles, a shared goal, and individual accountability within the group','The teacher gives no instructions at all','Students compete against each other and only the best student gets a mark'],correct:1,
  explain:'Cooperative Learning specifically requires structure: defined roles, positive interdependence, and each member being individually accountable.'},

 {id:'gtm-e',method:'gtm',diff:'easy',
  q:'Students translate a paragraph from their first language into English, then study a list of grammar rules and complete written exercises. There is little speaking practice.',
  options:['Grammar-Translation Method','Communicative Language Teaching','Direct Method','Project-Based Learning'],correct:0,
  explain:'Translation exercises and explicit grammar rules, with little spoken practice, describe the Grammar-Translation Method.'},
 {id:'gtm-m',method:'gtm',diff:'medium',
  q:'The teacher writes a grammar rule on the board, explains it in the students\' first language, and asks students to translate sentences to practise it. Pronunciation is not a focus of the lesson.',
  options:['Grammar-Translation Method','Task-Based Language Teaching','Flipped Classroom','Communicative Language Teaching'],correct:0,
  explain:'Explaining rules in the first language and practising through translation is a classic Grammar-Translation lesson.'},
 {id:'gtm-a',method:'gtm',diff:'advanced',
  q:'What is a well-known limitation of the Grammar-Translation Method that future teachers should keep in mind?',
  options:['It builds strong reading and grammar knowledge but gives little practice in speaking or listening','It focuses too heavily on real, spontaneous conversation','It never uses the students\' first language','It gives students too little practice in reading and writing'],correct:0,
  explain:'Grammar-Translation builds grammar and reading/writing skills well, but on its own gives students little spoken practice.'},

 {id:'direct-e',method:'direct',diff:'easy',
  q:'The teacher speaks only English in class, uses pictures and gestures instead of translation, and asks students to answer in full English sentences from the first lesson.',
  options:['Direct Method','Grammar-Translation Method','Content-Based Instruction','Flipped Classroom'],correct:0,
  explain:'Using only the target language and avoiding translation is the defining feature of the Direct Method.'},
 {id:'direct-m',method:'direct',diff:'medium',
  q:'A student asks what a word means. Instead of translating, the teacher draws a picture and mimes an action until the student understands, without using the first language at all.',
  options:['Direct Method','Audio-Lingual Method','Cooperative Learning','Grammar-Translation Method'],correct:0,
  explain:'Demonstration instead of translation, kept entirely in the target language, is central to the Direct Method.'},
 {id:'direct-a',method:'direct',diff:'advanced',
  q:'How does the Direct Method usually treat grammar rules?',
  options:['Rules are explained in detail in the first language before any practice','Grammar is learned inductively, through examples and practice in the target language, with little formal rule explanation','Grammar is never taught at all','Students memorise long lists of grammar rules and translate them'],correct:1,
  explain:'The Direct Method favours learning grammar inductively from examples and use, rather than through explicit rule explanation.'},

 {id:'alm-e',method:'alm',diff:'easy',
  q:'Students repeat a dialogue many times after the teacher and practise substitution drills, changing one word in a sentence pattern, until it becomes automatic.',
  options:['Audio-Lingual Method','Problem-Based Learning','Project-Based Learning','Content-Based Instruction'],correct:0,
  explain:'Repetition and pattern drills until a response becomes automatic are the core technique of the Audio-Lingual Method.'},
 {id:'alm-m',method:'alm',diff:'medium',
  q:'The teacher plays a recorded dialogue, and the whole class repeats each line in chorus. Mistakes are corrected immediately so an incorrect habit does not form.',
  options:['Audio-Lingual Method','Content-Based Instruction','Flipped Classroom','Project-Based Learning'],correct:0,
  explain:'Immediate correction and repeated drilling, to build correct language "habits", is typical of the Audio-Lingual Method.'},
 {id:'alm-a',method:'alm',diff:'advanced',
  q:'Which learning theory is the Audio-Lingual Method most closely based on?',
  options:['Behaviourism: language as habits formed through repetition and reinforcement','Constructivism: learners building their own understanding by solving problems','Humanism: learning driven mainly by emotion and personal choice','Connectivism: learning mainly through online networks and social media'],correct:0,
  explain:'The Audio-Lingual Method grew out of behaviourist psychology, treating language learning as habit formation through drilling.'},

 {id:'flip-e',method:'flipped',diff:'easy',
  q:'Students watch a short grammar video at home before class. In class, they do practice exercises and ask the teacher questions about anything that was unclear.',
  options:['Flipped Classroom','Audio-Lingual Method','Grammar-Translation Method','Direct Method'],correct:0,
  explain:'Moving instruction to before class, and using class time for practice, is the core idea of the Flipped Classroom.'},
 {id:'flip-m',method:'flipped',diff:'medium',
  q:'A teacher records a short lecture about reported speech for students to watch as homework. The next day, class time is used entirely for practice activities and individual help, not for the lecture itself.',
  options:['Flipped Classroom','Direct Method','Cooperative Learning','Content-Based Instruction'],correct:0,
  explain:'Recording the input for homework and freeing class time for practice and support is a Flipped Classroom design.'},
 {id:'flip-a',method:'flipped',diff:'advanced',
  q:'What is the main purpose of moving direct instruction outside class time in a Flipped Classroom?',
  options:['To free up class time for practice, discussion and support with the teacher present','To remove the teacher\'s role from the lesson completely','To reduce the total amount of content students see','To make students work alone with no feedback from anyone'],correct:0,
  explain:'The point of flipping is to use limited class time for the things that benefit most from a teacher being present: practice, questions and feedback.'},

 {id:'cbi-e',method:'cbi',diff:'easy',
  q:'Students learn English by studying a science topic, such as the water cycle, with all the reading, discussion and vocabulary work done in English.',
  options:['Content-Based Instruction','Grammar-Translation Method','Audio-Lingual Method','Flipped Classroom'],correct:0,
  explain:'Teaching language through subject content, like science, is exactly what Content-Based Instruction means.'},
 {id:'cbi-m',method:'cbi',diff:'medium',
  q:'An English class is combined with a history topic. Students read history texts in English, discuss the causes of an event, and build academic English vocabulary at the same time.',
  options:['Content-Based Instruction','Problem-Based Learning','Direct Method','Audio-Lingual Method'],correct:0,
  explain:'CBI integrates learning subject content, such as history, with learning the language needed to discuss it.'},
 {id:'cbi-a',method:'cbi',diff:'advanced',
  q:'What is a common challenge for teachers using Content-Based Instruction?',
  options:['Balancing attention between the subject content and the language-learning goals','Avoiding the use of any English at all','Preventing students from learning any new vocabulary','Teaching grammar rules only through translation exercises'],correct:0,
  explain:'A recognised challenge of CBI is keeping both the subject content and the language objectives properly supported, rather than one crowding out the other.'}
];
const MC_BY_DIFF={easy:MC_QUESTIONS.filter(q=>q.diff==='easy'),medium:MC_QUESTIONS.filter(q=>q.diff==='medium'),advanced:MC_QUESTIONS.filter(q=>q.diff==='advanced')};

/* Badges awarded so far (Method Challenge only, in this build). Kept as a
   small registry so later phases can add more without changing the shape. */
/* Every badge below is awarded only at the exact moment its condition is
   met — never for merely opening a page. Awarding happens once, at the
   point in code named in each comment, and is persisted immediately. */
const BADGES={
  'method-master':{icon:'📚',name:'Method Master',desc:'Scored 8 or more out of 10 in a single Method Challenge round.'},
  'first-step':{icon:'🔍',name:'First Step',desc:'Completed your first 6C activity.'},
  'deep-thinker':{icon:'🧠',name:'Deep Thinker',desc:'Completed a 6C activity with an Advanced overall rubric level.'},
  'ai-critic':{icon:'🤖',name:'AI Critic',desc:'Tagged an AI response as questionable or "check this" and then checked it with a real source.'},
  'team-player':{icon:'🏆',name:'Team Player',desc:'Completed a Team Competition with 2 or more teams.'}
};
/* =====================================================================
   QUESTION BANKS
   topic 'methods'    : recognising ELT methods (the 30 original questions + new ones)
   topic 'situations' : "what should the teacher do?" classroom decisions
   topic 'grammar'    : general English grammar
   Authoring format: the CORRECT option is written first; the builder
   places it at a rotating position, and every game shuffles the options
   again at run time (mcShuffleQ), so the answer is never predictable.
   ===================================================================== */
(function(){
  MC_QUESTIONS.forEach(q=>{q.topic='methods'});
  const counters={me:0,si:0,gr:0};let seq=0;
  const add=(prefix,topic,diff,stem,opts,explain,method)=>{
    const n=String(++counters[prefix]).padStart(3,'0'),pos=(seq++)%4,wrong=opts.slice(1),o=wrong.slice();
    o.splice(pos,0,opts[0]);
    MC_QUESTIONS.push({id:prefix+'-'+n,topic,method:method||'',diff,q:stem,options:o,correct:pos,explain})};
  const M=(m,d,s,o,e)=>add('me','methods',d,s,o,e,m);
  const S=(d,s,o,e)=>add('si','situations',d,s,o,e);
  const G=(d,s,o,e)=>add('gr','grammar',d,s,o,e);

  /* ---------- METHODS (45 new) ---------- */
  M('clt','easy',"Students interview each other about their weekend plans. The teacher cares more that they understand each other than about perfect grammar.",["Communicative Language Teaching","Grammar-Translation Method","Audio-Lingual Method","Lecture Method"],"CLT puts real communication and meaning first.");
  M('clt','easy',"In CLT, the main goal of learning English is to...",["communicate meaning in real situations","memorise grammar rules","translate texts word by word","copy the teacher's pronunciation perfectly"],"CLT aims at communicative ability, not only knowledge about the language.");
  M('clt','medium',"The teacher gives pairs a bus timetable with missing information. Each student has different information and must ask questions to complete it.",["Communicative Language Teaching (information gap)","Audio-Lingual Method","Flipped Classroom","Grammar-Translation Method"],"An information gap creates a real need to communicate.");
  M('clt','medium',"Which activity is MOST typical of CLT?",["A role-play about booking a hotel room","Repeating a dialogue ten times in chorus","Translating a paragraph into English","Filling in a grammar table alone"],"Role-play uses language for a purpose, in a realistic situation.");
  M('clt','advanced',"A CLT teacher hears many grammar mistakes in a discussion. Which reason best explains why she waits before correcting?",["Interrupting can reduce fluency and confidence, so feedback can come after the activity","Grammar is not important in CLT at all","Students never learn from correction","Correction is forbidden by school rules"],"CLT does not ignore accuracy. Timing of feedback protects communication.");
  M('tblt','easy',"Students must plan a class trip: choose a place, compare prices, and present the plan. The teacher gives language help after they finish.",["Task-Based Language Teaching","Audio-Lingual Method","Grammar-Translation Method","Direct Method"],"A real task with an outcome comes first, and language focus follows.");
  M('tblt','medium',"In TBLT, what is a 'task'?",["An activity with a real outcome where language is a tool","A grammar exercise with one correct answer","A list of new words for homework","A test at the end of the unit"],"The outcome (a plan, a decision, a list) drives the language use.");
  M('tblt','medium',"The three phases of a typical task-based lesson are...",["pre-task, task, and language focus","warm-up, drill, and test","lecture, quiz, and homework","translate, memorise, and recite"],"Pre-task prepares, the task is done, then language is reviewed.");
  M('tblt','advanced',"A teacher asks students to write a real email to a company asking for information, then reflect on useful phrases. Why is this task-based?",["The goal is a real outcome, and language is chosen to achieve it","It uses the past tense","It is written","It has a time limit"],"In TBLT, language serves a non-linguistic outcome.");
  M('pbl','easy',"Students spend a month making a class magazine in English and sell it at a school event.",["Project-Based Learning","Audio-Lingual Method","Grammar-Translation Method","Direct Method"],"A long activity with a real product and audience is typical of project work.");
  M('pbl','medium',"Which is a key feature of Project-Based Learning?",["A final product shared with an audience","Only listening exercises","Silent individual drills","A single test question"],"The product and audience give the work purpose.");
  M('pbl','medium',"A class makes a short video guide to their university for new students, working in groups over three weeks. Why is this Project-Based Learning?",["Long-term group work leads to a real product for an audience","Students translate from Uzbek","The teacher lectures the whole time","There are no groups"],"Time, product and audience define a project.");
  M('pbl','advanced',"A risk of Project-Based Learning in a language class is that...",["students may use their first language a lot unless English use is planned","there is never any speaking","it cannot include writing","it needs no planning"],"Teachers must plan how English will be used during the project.");
  M('prbl','easy',"Students read a case: 'A new student cannot find the library and is too shy to ask.' Groups discuss what to do and present solutions.",["Problem-Based Learning","Grammar-Translation Method","Audio-Lingual Method","Lecture Method"],"Learning starts from a real problem that students try to solve.");
  M('prbl','medium',"How does Problem-Based Learning usually start?",["With a real problem for students to investigate","With a long grammar lecture","With a vocabulary test","With memorising a dialogue"],"The problem comes first, and knowledge is built while solving it.");
  M('prbl','medium',"The teacher's role in Problem-Based Learning is mainly to...",["guide with questions and support","dictate every answer","leave the room","translate everything"],"The teacher facilitates while students investigate.");
  M('prbl','advanced',"What usually distinguishes Problem-Based Learning from Task-Based Learning?",["PrBL centres on investigating and solving a problem, while TBLT centres on completing a communicative task","There is no difference at all","TBLT uses only grammar drills","PrBL never uses group work"],"Both are learner-centred, but the starting point and focus differ.");
  M('coop','easy',"Students in groups of four each get a role: leader, writer, checker, speaker. The group gets one shared mark.",["Cooperative Learning","Grammar-Translation Method","Direct Method","Audio-Lingual Method"],"Clear roles and a shared goal are typical of cooperative learning.");
  M('coop','easy',"Think-Pair-Share means students...",["think alone, discuss with a partner, then share with the class","listen to the teacher only","take a written test","translate a text"],"It is a simple cooperative structure.");
  M('coop','medium',"What does 'positive interdependence' mean in Cooperative Learning?",["Group members need each other to succeed","Students compete against each other","The best student works alone","The teacher decides everything"],"Success depends on everyone's contribution.");
  M('coop','medium',"Why is individual accountability important in Cooperative Learning?",["Every member must learn and contribute","So the teacher can punish students","So groups become larger","So nobody has to speak"],"Without it, one student may do all the work.");
  M('coop','advanced',"In a group project, one student does all the work while others copy. Which change best supports cooperative learning?",["Give each member a role and a part that must be reported individually","Remove groups completely","Give everyone the same mark without checking","Let the strongest student decide"],"Roles and individual reporting create real accountability.");
  M('gtm','easy',"The teacher explains the past perfect in Uzbek, writes rules on the board, and students translate ten sentences.",["Grammar-Translation Method","Communicative Language Teaching","Direct Method","Task-Based Language Teaching"],"Rules in the first language plus translation are typical of GTM.");
  M('gtm','medium',"Which skill is usually LEAST developed by the Grammar-Translation Method?",["Speaking and listening","Reading literary texts","Grammar knowledge","Vocabulary lists"],"GTM focuses on written language and rules.");
  M('gtm','medium',"In GTM, the main language of instruction is usually...",["the students' first language","only English","only gestures","only pictures"],"Explanations and translation use the first language.");
  M('gtm','advanced',"Why do some teachers still use short translation activities today?",["To check understanding and compare structures between languages, in small amounts","Because translation is the only good method","To avoid speaking","Because translation replaces all practice"],"A small amount of translation can be useful without being the whole method.");
  M('direct','easy',"The teacher never uses Uzbek. She shows a picture of an apple, says 'apple', and asks 'What is this?'",["Direct Method","Grammar-Translation Method","Flipped Classroom","Content-Based Instruction"],"No translation, and meaning is shown directly.");
  M('direct','medium',"In the Direct Method, meaning is usually shown by...",["pictures, objects and actions","translation lists","grammar tables","reading aloud only"],"The target language is linked directly to meaning.");
  M('direct','medium',"What is a difficulty of the Direct Method for beginners?",["Explaining abstract words without translation can be hard","There are no textbooks","Students cannot hear English","It uses only writing"],"Without translation, abstract meanings take more effort.");
  M('direct','advanced',"Which pair is correctly matched?",["Direct Method – no translation in class","Direct Method – heavy grammar rules first","Direct Method – silent classes","Direct Method – reading only"],"Avoiding the first language is the core idea.");
  M('alm','easy',"Students repeat 'Where is the pen? It is on the table.' and then replace 'pen' with 'book' and 'table' with 'desk' in drills.",["Audio-Lingual Method","Problem-Based Learning","Project-Based Learning","Content-Based Instruction"],"Repetition and substitution drills are typical of ALM.");
  M('alm','medium',"The Audio-Lingual Method believes language learning is mostly...",["habit formation through repetition","problem solving","project work","translation"],"ALM grew from behaviourist ideas.");
  M('alm','medium',"Which activity is most typical of ALM?",["Substitution drills","Debates","Group projects","Case studies"],"Drills build patterns until they are automatic.");
  M('alm','advanced',"A common criticism of ALM is that students may...",["perform drills well but struggle to use the language creatively","never learn any words","be unable to repeat sentences","never hear English"],"Pattern practice does not always transfer to real conversation.");
  M('flipped','easy',"Students watch a six-minute video about 'used to' at home. In class, they use it in speaking practice.",["Flipped Classroom","Audio-Lingual Method","Grammar-Translation Method","Direct Method"],"Input at home, practice in class.");
  M('flipped','medium',"In a flipped classroom, class time is best used for...",["practice, discussion and help from the teacher","the first explanation of everything","silent copying","only tests"],"The teacher's time is used for interaction and support.");
  M('flipped','medium',"Some students did not watch the homework video. What is a sensible response?",["Start with a quick check task or short recap and support those students","Cancel the method for ever","Give the whole lecture again to everyone","Punish the whole class"],"Plan for missing preparation instead of abandoning the method.");
  M('flipped','advanced',"Which issue should a teacher consider before assigning video homework?",["Whether all students have devices and internet at home","The colour of the slides","The teacher's handwriting","Whether videos are long enough to be boring"],"Equal access is a basic condition.");
  M('cbi','easy',"In a lesson about renewable energy, students read and discuss the topic in English and learn the key vocabulary.",["Content-Based Instruction","Grammar-Translation Method","Audio-Lingual Method","Direct Method"],"Language is learned through subject content.");
  M('cbi','medium',"What is the main aim of Content-Based Instruction?",["Learn language while learning subject content","Only memorise grammar","Only translate texts","Avoid using English"],"Content and language are learned together.");
  M('cbi','medium',"Which class is closest to CBI?",["A geography lesson taught in English to language learners","A grammar drill","A translation exam","A phonics chart"],"Subject teaching in English with language support.");
  M('cbi','advanced',"A CBI teacher plans a history unit. Which is a good language objective?",["Students can use past tenses and time expressions to describe causes and results","Students memorise dates only","Students copy the textbook","Students learn all history terms in Uzbek"],"Language objectives support the content objectives.");
  M('mixed','easy',"Which method uses the students' first language MOST?",["Grammar-Translation Method","Direct Method","Task-Based Language Teaching","Communicative Language Teaching"],"GTM explains and practises through the first language.");
  M('mixed','medium',"Which two approaches both put communication ahead of drills?",["Communicative Language Teaching and Task-Based Language Teaching","Audio-Lingual Method and Grammar-Translation Method","Grammar-Translation Method and Lecture Method","Audio-Lingual Method and Direct Method"],"CLT and TBLT are both communicative approaches.");
  M('mixed','medium',"Which method treats mistakes as bad habits to prevent immediately?",["Audio-Lingual Method","Communicative Language Teaching","Project-Based Learning","Task-Based Language Teaching"],"ALM stresses accuracy through repetition and immediate correction.");

  /* ---------- CLASSROOM SITUATIONS (36) ---------- */
  S('easy',"Two students finish an activity early while others are still working. What is the best action?",["Give them a short extension task on the same topic","Tell them to sit quietly","Ask them to clean the board","Collect all the work immediately"],"Extension tasks keep fast finishers learning without stopping others.");
  S('easy',"A student asks the meaning of a word during a listening task while the recording is still playing. What is best?",["Ask them to note it and discuss it after listening","Stop the audio and explain","Ignore the student for ever","Translate the whole recording"],"Interrupting the task breaks concentration. Deal with the word afterwards.");
  S('easy',"You want quiet students to speak more. Which is the best first step?",["Give thinking time and let them talk in pairs before the whole class","Call on them suddenly and demand a full answer","Lower their marks when they are silent","Ask only the confident students"],"Rehearsal in pairs makes speaking safer.");
  S('easy',"Students keep using Uzbek in pair work. What should you try first?",["Check that the task is clear and possible in English, give useful phrases, and monitor","Punish every Uzbek word","Stop pair work for ever","Speak only Uzbek yourself"],"Often the task is too difficult or unclear. Support makes English use easier.");
  S('easy',"How can you check that students understood the instructions?",["Ask short questions such as 'How many minutes? Who speaks first?'","Ask 'Do you understand?'","Repeat the instructions louder","Start without instructions"],"Concept-checking questions show real understanding.");
  S('easy',"A student makes a small grammar mistake during a fluency activity. What is a good approach?",["Note it and give delayed feedback after the activity","Stop and correct in front of everyone every time","Laugh and repeat it","Ignore all mistakes for the whole year"],"Delayed feedback protects fluency.");
  S('easy',"Which is the best way to introduce the word 'crowded'?",["Show a picture and give an example sentence","Write only the Uzbek translation","Give a long grammar explanation","Ask students to guess with no help"],"A picture and an example give meaning and use.");
  S('easy',"Before a reading task you want students to be ready. What can you do?",["Ask them to predict the content from the title and a picture","Give them the answer key","Tell them to read silently with no purpose","Read the whole text yourself first"],"Prediction activates knowledge and gives a purpose for reading.");
  S('easy',"You have 20 minutes left and a 30-minute activity. What is best?",["Shorten the activity to the key part and keep the objective","Ignore the lesson objective","Continue and say nothing about the time","Cancel the class"],"Adapt the plan and keep the main learning goal.");
  S('easy',"A student says 'I don't understand this at all.' What should you do?",["Ask which part is unclear and give a simpler example","Tell them to try harder","Skip them","Repeat the same explanation louder"],"Find the problem first, then simplify.");
  S('easy',"How can pair work be organised in a class of 32 with fixed desks?",["Students turn to the person next to or behind them","Cancel pair work","Move all the desks every time","Choose only four students"],"Simple pairing works even with fixed desks.");
  S('easy',"What is the best purpose for a warm-up activity?",["Activate students' minds and prepare for the topic","Test the students strictly","Fill time with silence","Introduce the exam"],"A warm-up gets students ready to learn.");
  S('medium',"Half the class finds a text too easy and half too hard. Which approach helps most?",["Use the same text with tasks at different levels","Give the hard text to everyone","Give the easy text to everyone","Skip reading"],"Tiered tasks let everyone work on the same text.");
  S('medium',"A student is fluent but makes many tense errors. What feedback is best after the activity?",["Show two or three anonymous examples and ask the class to correct them","Give a long lecture on all tenses","Mark them down heavily","Say nothing"],"Anonymous examples are safe and focus on real errors.");
  S('medium',"Which is most useful for assessing speaking fairly?",["A rubric with clear criteria such as fluency, accuracy and range","A feeling about who is 'good'","Only pronunciation","A written vocabulary test only"],"Criteria make assessment more consistent and explainable.");
  S('medium',"Students are unmotivated in a compulsory English class. Which is a good step?",["Connect tasks to their interests and goals, with small successes","Increase homework as punishment","Tell them English is easy","Reduce speaking"],"Relevance and success build motivation.");
  S('medium',"A student copies homework from a classmate. What is the most educational response?",["Talk privately, explain expectations, and design tasks that need personal input","Shame the student publicly","Ignore it","Cancel homework for ever"],"Address the cause and improve the task design.");
  S('medium',"The same three students answer every question. What can you change?",["Use pair discussion and choose different students after thinking time","Ask only those three","Stop asking questions","Ask only volunteers"],"Structure gives everyone a chance.");
  S('medium',"During group work one group is off-task. What should you do first?",["Go to the group, ask about their progress, and refocus them on the task","Shout across the room","Remove the group","End the activity"],"Quiet intervention respects the students and the class.");
  S('medium',"Which lesson order is most logical?",["Lead-in, presentation, practice, production, feedback","Test, lecture, lecture, test","Homework, break, break","Production before any input for beginners"],"Learners need input and practice before free production.");
  S('medium',"How can you teach a grammar structure communicatively?",["Show it in a meaningful context, practise with an information gap, then give feedback","Only list the rules","Only translate sentences","Only test it"],"Meaning, use and feedback belong together.");
  S('medium',"A parent asks why you do not correct every speaking mistake. What is a sound answer?",["Constant correction can block fluency, so I focus on important errors and give feedback later","I do not care about grammar","Correction is illegal","My students never make mistakes"],"It explains a principled choice.");
  S('medium',"Which support is most useful in a mixed-ability writing task?",["Sentence frames for weaker students and an extension prompt for stronger students","The same task and no support","Only an advanced task","No task"],"Support and extension let everyone succeed.");
  S('medium',"What is the best way to give instructions for a complicated activity?",["Break them into steps, demonstrate with an example, and check understanding","Give them all at once, quickly","Give them only in writing without checking","Let students guess"],"Clear steps and a demonstration reduce confusion.");
  S('advanced',"A teacher uses AI to produce a reading text but does not check it. What is the main risk?",["The text may contain errors, a wrong level or unsuitable content that nobody noticed","AI texts are always perfect","Students will read too much","There is no risk"],"The teacher remains responsible for the quality of materials.");
  S('advanced',"You must choose between covering the whole syllabus and deeper speaking practice. What is the most balanced decision?",["Prioritise objectives, cut low-value exercises, and keep meaningful speaking practice","Cover everything as fast as possible","Ignore the syllabus completely","Ignore objectives"],"Decisions should follow learning objectives.");
  S('advanced',"What is the strongest reason to use formative assessment during a unit?",["It gives information to adjust teaching while learning is still happening","It replaces the final exam","It only produces marks","It is easier to grade"],"Formative assessment improves teaching and learning in time.");
  S('advanced',"One student is fluent but inaccurate. Another is accurate but very slow. What does this mean for feedback?",["They need different feedback targets: accuracy work for the first, fluency practice for the second","Both need the same feedback","Neither needs feedback","Only accuracy matters"],"Feedback should match each learner's needs.");
  S('advanced',"Which use of the first language (Uzbek) can be pedagogically justified?",["Briefly clarifying an abstract concept or giving complex instructions to beginners","Teaching the whole lesson in Uzbek","Punishing all use of English","Replacing all English speaking"],"Limited, purposeful use can help learning.");
  S('advanced',"You want to reduce teacher talking time. Which change is most effective?",["Use pair or group tasks and short, clear instructions","Talk more to explain everything","Read the textbook aloud","Speak faster"],"More student activity means less teacher talk.");
  S('advanced',"How can you make sure a listening task is not just a test?",["Teach strategies: predict, listen for gist, then detail, and discuss","Play it once with no purpose","Give only a mark","Skip listening"],"Strategy teaching builds listening ability.");
  S('advanced',"A class does very badly in a test. What should a reflective teacher do first?",["Analyse which items were missed and why, then adjust teaching","Blame the students","Cancel the test","Lower the pass mark without checking"],"Analysis comes before action.");
  S('advanced',"Which is an ethical concern when AI is used to grade student writing?",["Fairness, privacy of student text, and loss of teacher judgement","AI is too fast","Students like it","It is free"],"Ethical use protects fairness and privacy.");
  S('advanced',"A colleague says: 'Students learn best when taught in their preferred learning style.' What should you do?",["Check reliable research reviews before changing your teaching","Accept it immediately","Ignore all colleagues","Ask students to take a quiz and stop planning"],"Claims should be checked before they change practice.");
  S('advanced',"Which is the best reason to use authentic materials with B1 students?",["They show real language use, if supported with suitable tasks","They are always easy","They replace teaching","They are always shorter"],"Authentic input is valuable when the task is graded.");
  S('advanced',"You have 40 students and little time. Which approach can still promote speaking?",["Structured pair work and short group tasks with clear roles","An individual oral exam for everyone every lesson","Only choral repetition","No speaking at all"],"Structure makes speaking possible in large classes.");

  /* ---------- GRAMMAR (45) ---------- */
  G('easy',"She ___ to school every day.",["goes","go","going","gone"],"Third person singular in the present simple takes -s or -es.");
  G('easy',"There ___ two books on the table.",["are","is","am","be"],"Plural noun, so 'are'.");
  G('easy',"I have ___ apple and ___ orange.",["an / an","a / a","an / a","a / an"],"Use 'an' before a vowel sound.");
  G('easy',"He is ___ than his brother.",["taller","tall","tallest","more tall"],"Short adjectives take -er in the comparative.");
  G('easy',"We are ___ TV now.",["watching","watch","watches","watched"],"Present continuous: be + verb-ing.");
  G('easy',"My birthday is ___ May.",["in","at","on","by"],"Months take 'in'.");
  G('easy',"There isn't ___ milk in the fridge.",["much","many","few","a few"],"'Milk' is uncountable, so use 'much'.");
  G('easy',"Yesterday I ___ a film.",["saw","see","seen","seeing"],"Past simple of 'see' is 'saw'.");
  G('easy',"___ you like some tea?",["Would","Do","Are","Can"],"'Would you like...?' is the polite offer.");
  G('easy',"These are my ___.",["children","child","childs","childrens"],"'Child' has an irregular plural: 'children'.");
  G('easy',"They ___ students.",["are","is","am","be"],"'They' takes 'are'.");
  G('easy',"I'm interested ___ music.",["in","on","at","for"],"'Interested in' is the fixed pattern.");
  G('easy',"She can ___ very well.",["swim","swims","swimming","to swim"],"After a modal verb use the base form.");
  G('easy',"___ is your name?",["What","Who","Where","When"],"We ask for a name with 'What'.");
  G('easy',"My brother is the ___ in our family.",["tallest","tall","taller","most tall"],"Superlative of a short adjective: -est.");
  G('medium',"I ___ here since 2020.",["have lived","live","lived","am living"],"'Since' + a time point needs the present perfect.");
  G('medium',"If it rains tomorrow, we ___ at home.",["will stay","stay","would stay","stayed"],"First conditional: if + present, will + verb.");
  G('medium',"The letter ___ yesterday.",["was written","wrote","is written","has written"],"Past passive: was/were + past participle.");
  G('medium',"You ___ smoke here. It is forbidden.",["mustn't","don't have to","needn't","may"],"'Mustn't' expresses prohibition.");
  G('medium',"I enjoy ___ English.",["studying","to study","study","studied"],"'Enjoy' is followed by the -ing form.");
  G('medium',"The man ___ lives next door is a doctor.",["who","which","whose","whom"],"'Who' refers to a person as the subject.");
  G('medium',"I'm looking forward to ___ you.",["seeing","see","saw","seen"],"'To' here is a preposition, so use -ing.");
  G('medium',"We ___ dinner when the phone rang.",["were having","had","have","are having"],"Past continuous for an action in progress when another happened.");
  G('medium',"He is good ___ mathematics.",["at","in","on","for"],"'Good at' is the fixed pattern.");
  G('medium',"If I ___ you, I would study more.",["were","am","was","be"],"Second conditional in standard usage: 'if I were you'.");
  G('medium',"How ___ people came to the party?",["many","much","few","little"],"'People' is countable, so use 'many'.");
  G('medium',"She has lived here ___ ten years.",["for","since","from","during"],"'For' + a length of time.");
  G('medium',"This is the house ___ I was born.",["where","which","who","whom"],"'Where' refers to a place.");
  G('medium',"I didn't go out because it ___ heavily.",["was raining","rained","has rained","rains"],"Past continuous describes the situation at that time.");
  G('medium',"By the time we arrived, the film ___.",["had already started","already started","has already started","was already starting"],"Past perfect for an earlier past event.");
  G('advanced',"If she had studied harder, she ___ the exam.",["would have passed","would pass","will pass","passed"],"Third conditional: if + past perfect, would have + past participle.");
  G('advanced',"I wish I ___ more time yesterday.",["had had","have","had","would have"],"A wish about the past uses the past perfect.");
  G('advanced',"Not only ___ late, but he also forgot the tickets.",["was he","he was","he is","is he"],"Inversion follows 'not only' at the start of a clause.");
  G('advanced',"He suggested that she ___ a doctor.",["should see","sees","saw","is seeing"],"After 'suggest that' use 'should' + verb or the base form.");
  G('advanced',"She is said ___ five languages.",["to speak","speaking","speak","that speaks"],"Passive reporting structure: is said to + infinitive.");
  G('advanced',"By next June, I ___ here for ten years.",["will have been working","will work","work","have worked"],"Future perfect continuous for duration up to a future time.");
  G('advanced',"The report needs ___ before Friday.",["finishing","to finish","finished","being finish"],"'Need' + -ing has a passive meaning: needs finishing.");
  G('advanced',"Hardly ___ the room when the alarm went off.",["had I entered","I had entered","I entered","did I enter"],"Inversion after 'hardly' with the past perfect.");
  G('advanced',"It's high time we ___ the problem.",["solved","solve","will solve","have solving"],"'It's high time' is followed by the past simple.");
  G('advanced',"She would rather you ___ me the truth.",["told","tell","will tell","telling"],"'Would rather' + subject + past simple.");
  G('advanced',"___ the weather, we went for a walk.",["Despite","Despite of","In spite","Although"],"'Despite' is followed directly by a noun phrase.");
  G('advanced',"Had I known about the delay, I ___ earlier.",["would have left","would leave","will leave","left"],"Inverted third conditional.");
  G('advanced',"The book, ___ cover is red, is mine.",["whose","who","which","that"],"'Whose' shows possession.");
  G('advanced',"He denied ___ the window.",["breaking","to break","break","to have break"],"'Deny' is followed by the -ing form.");
  G('advanced',"Neither of the students ___ the answer.",["knows","know","are knowing","have known"],"In standard usage 'neither' takes a singular verb.");
})();

/* Draw questions so that a student does not see the same one again until the whole pool has been used. */
function qPool(topics,diff){return MC_QUESTIONS.filter(q=>topics.includes(q.topic)&&(!diff||diff==='mixed'||q.diff===diff))}
function pickQs(pool,n){
  const seen=S.seenQ||(S.seenQ={});let fresh=pool.filter(q=>!seen[q.id]);
  let chosen=shuffle(fresh).slice(0,n);
  if(chosen.length<n){                 /* pool exhausted: start a new cycle for this pool */
    pool.forEach(q=>{delete seen[q.id]});
    const ids=new Set(chosen.map(q=>q.id));
    chosen=chosen.concat(shuffle(pool.filter(q=>!ids.has(q.id))).slice(0,n-chosen.length))}
  chosen.forEach(q=>{seen[q.id]=1});
  const keys=Object.keys(seen);if(keys.length>800)keys.slice(0,keys.length-800).forEach(k=>delete seen[k]);
  persist();return chosen}
/* =====================================================================
   TASK BANK — 32 tasks, exactly 4 in each of the 8 categories.
   Every task has an explicit category, a scenario, one "main problem"
   question, an AI response made of short segments (some deliberately
   weak), the indexes of the weak segments (fl), claims to verify (cl)
   and an "improve it" question (im). These keys are used for instant
   feedback ONLY when the AI response is the pre-written demonstration
   response. For a live AI response there is no answer key, and the app
   says so.
   ===================================================================== */

/* answer keys for the 11 tasks that already existed (their scenarios and AI segments are unchanged) */
const TASK_EXT={
 t1:{q:{a:"What is the main problem?",o:["Students are lazy","Students may feel unsafe or anxious about speaking","The lesson is too short"],b:1,w:"Silence and giggling point to fear of mistakes, not laziness."},
  fl:[0,1,4,5],cl:[{s:1,t:"90% of students speak more when the teacher corrects every error immediately.",v:"UNSUPPORTED",w:"No source is given, and immediate correction can reduce fluency."},{s:5,t:"These steps work in all classrooms, whatever the size, culture or age.",v:"UNSUPPORTED",w:"Advice must fit the class. Universal claims are a warning sign."}],
  im:{a:"Which change fits this class best?",o:["Correct every mistake at once","Short pair tasks, a class agreement on respecting mistakes, and delayed feedback","Give points for every English word"],b:1,w:"It lowers the risk of speaking and protects fluency."}},
 t2:{q:{a:"What is the main problem?",o:["Students do not remember the rule","Students know the rule but do not use it in speaking","The test is too hard"],b:1,w:"They can state the rule, so the gap is between knowing and using."},
  fl:[1,4,5],cl:[{s:1,t:"Once students understand the rule, communicative use follows automatically.",v:"UNSUPPORTED",w:"Understanding a rule does not guarantee that it is used in speech."},{s:4,t:"Research shows explicit grammar instruction has no effect on acquisition.",v:"UNSUPPORTED",w:"Too absolute, and no source is given. Check reviews of the research."}],
  im:{a:"Which fix is best?",o:["Longer rule explanations","Short speaking tasks that need the tense, with delayed feedback","Stop teaching grammar"],b:1,w:"Practice in meaningful use closes the gap."}},
 t3:{q:{a:"What should you find out first?",o:["Why the same errors return","Which student is the worst","How many more words to add"],b:0,w:"Repeated errors need a diagnosis before a new plan."},
  fl:[0,2,4],cl:[{s:2,t:"Since the errors repeat, students clearly do not care about accuracy.",v:"UNSUPPORTED",w:"This guesses at motives without any evidence."},{s:4,t:"Vocabulary is learned best in isolation, without context.",v:"UNSUPPORTED",w:"Words are usually learned better with context and collocations."}],
  im:{a:"Which approach is better?",o:["More words and a test every week","Collocation practice and a personal notebook with example sentences","Stricter penalties"],b:1,w:"It links words to use and to the learner."}},
 t4:{q:{a:"What is the main problem?",o:["Students dislike letters","The task and feedback do not help students write connected text","Letters are old-fashioned"],b:1,w:"Short disconnected sentences show the task needs support."},
  fl:[1,3,5],cl:[{s:5,t:"A 2019 report says 78% of teachers say process writing doubles students' scores.",v:"UNSUPPORTED",w:"The report cannot be traced. Treat invented-looking sources as unverified."},{s:1,t:"Students should write with no planning so their real ability is visible.",v:"UNSUPPORTED",w:"No reason is given, and planning usually helps writing quality."}],
  im:{a:"Which plan is better?",o:["Silent writing and a grade for every draft","Plan, draft, peer feedback with a checklist, then revise","Only a model text"],b:1,w:"The process gives support and feedback before the final version."}},
 t5:{q:{a:"What is the main problem?",o:["Time is too short for any fair assessment","You need a practical and fair way to assess speaking","Parents dislike marks"],b:1,w:"The concern is fairness and practicality with limited time."},
  fl:[0,3,5],cl:[{s:0,t:"The most objective way to assess speaking is a multiple-choice test.",v:"UNSUPPORTED",w:"A multiple-choice test does not measure speaking."},{s:5,t:"Good pronunciation means sounding like a native speaker.",v:"UNSUPPORTED",w:"Intelligibility matters more than a native-like accent."}],
  im:{a:"Which approach is best?",o:["A multiple-choice test","An analytic rubric with clear criteria and a short paired task","One quick impression"],b:1,w:"Criteria make marks more consistent and easier to explain."}},
 t6:{q:{a:"What is the main problem?",o:["Students are too different in level","One text must work for very different levels","The text is about cities"],b:1,w:"The task is to make one text usable for many levels."},
  fl:[0,2,4],cl:[{s:4,t:"Differentiation is unnecessary for motivated students.",v:"UNSUPPORTED",w:"Motivation does not remove differences in level."},{s:0,t:"Permanent ability groups for the whole term work best.",v:"UNCERTAIN",w:"Effects of fixed grouping are debated, so check sources before deciding."}],
  im:{a:"Which plan is best?",o:["Permanent groups with different texts","One text with tiered tasks and peer support pairs","Extra worksheets for fast finishers only"],b:1,w:"Everyone works on the same text, at a suitable level of challenge."}},
 t7:{q:{a:"What is the main problem?",o:["Students dislike English","Group tasks are not structured or accountable","The desks are movable"],b:1,w:"Off-task talk shows the task design gives no clear roles or product."},
  fl:[1,3,5],cl:[{s:1,t:"Punishing first-language use always increases English use.",v:"UNSUPPORTED",w:"'Always' is too strong, and punishment can harm motivation."},{s:5,t:"Classroom management is only about discipline.",v:"UNSUPPORTED",w:"Task design strongly affects behaviour."}],
  im:{a:"Which plan is best?",o:["Raise your voice and punish first-language use","Clear roles, a visible product and a timer","Cancel group work"],b:1,w:"Structure and accountability keep groups on task."}},
 t8:{q:{a:"What is the main problem?",o:["The audio is too old","Students stop listening when they meet an unknown word","Audio should be played only once"],b:1,w:"They stop at one word instead of using the rest of the message."},
  fl:[0,3],cl:[{s:0,t:"Any use of the first language always slows acquisition.",v:"UNSUPPORTED",w:"'Any' and 'always' make this claim too strong."},{s:3,t:"Listening comprehension depends only on vocabulary size.",v:"UNSUPPORTED",w:"Strategies, speed and sound knowledge also matter."}],
  im:{a:"Which plan is best?",o:["Ban translation completely","Predict, listen for gist first, then detail, and teach guessing from context","Play the audio faster"],b:1,w:"It builds listening strategies for a two-play recording."}},
 t9:{q:{a:"What should you decide first?",o:["Which chatbot has the best logo","Whether and how to use it safely and fairly for all students","How to ban all phones"],b:1,w:"Privacy, cost and access matter before recommending a tool."},
  fl:[0,1,4],cl:[{s:4,t:"AI conversation partners improve speaking scores by 40% within one month.",v:"UNSUPPORTED",w:"A precise figure with no source should be treated as unverified."},{s:0,t:"AI partners are extremely effective and should replace pair work.",v:"UNSUPPORTED",w:"No evidence is given, and real interaction still matters."}],
  im:{a:"Which advice is best?",o:["Recommend it to everyone now","Suggest it as optional extra practice after checking privacy, cost and access","Ban it"],b:1,w:"It keeps the benefit and reduces the risks."}},
 t10:{q:{a:"What should you do before agreeing?",o:["Repeat it to the head teacher","Check for a source and how strong the evidence is","Redesign the curriculum"],b:1,w:"A surprising exact number needs a traceable source."},
  fl:[3],cl:[{s:3,t:"Since the claim is online and sounds confident, it is safe to redesign the curriculum at once.",v:"UNSUPPORTED",w:"Confidence and popularity are not evidence."},{s:0,t:"The claim is plausible because repeated exposure to words matters.",v:"PARTIALLY",w:"Repetition matters, but the exact number is unverified."}],
  im:{a:"What do you tell your colleague?",o:["The number is proven","Repetition matters, but the exact number is unverified. Find a source first","Ignore vocabulary teaching"],b:1,w:"It separates what is likely true from what is unchecked."}},
 t11:{q:{a:"What is the main issue?",o:["Style differences in writing","Deciding fairly when evidence of AI use is uncertain","The essay is too long"],b:1,w:"You cannot be sure, and the decision affects the student's grade."},
  fl:[0,4],cl:[{s:0,t:"A high AI-detector score is proof of cheating.",v:"UNSUPPORTED",w:"Detectors can be wrong, so a score alone is not proof."},{s:2,t:"AI detectors can produce false positives.",v:"SUPPORTED",w:"This is widely reported. Check the tool's own accuracy notes."}],
  im:{a:"What is the best next step?",o:["Give a zero now","Talk to the student, compare with in-class writing, and clarify the AI rules","Ignore it"],b:1,w:"It is fair, based on evidence, and educational."}}
};

/* 21 new tasks */
const TASKS_NEW=[
 {id:"t12",cat:"critical-thinking",skill:"Evaluating advice",title:"Two textbooks disagree",blurb:"Two books give opposite advice on teaching the present perfect.",
  ctx:"You teach B1 students at a university. One textbook says: teach the present perfect with 'for' and 'since' first. Another says: start with life experiences ('Have you ever...?'). Your students keep mixing the present perfect and the past simple. Your mentor says 'just follow the newer book'.",
  q:{a:"What is the real problem?",o:["The two books use different examples","You need a reason to choose an approach for these students","Students do not open their books"],b:1,w:"Both approaches can work. The teacher must decide with evidence about these learners."},
  ai:["The experience approach is better because it is more communicative, so you should use it in every class.","Students often confuse the two tenses because both talk about the past, and the difference is the link to now.","Try each approach for one week and compare how many students can use the tense in a short speaking task.","Research proves that starting with life experiences is always more effective than starting with time expressions.","Keep a simple record of errors so you can see whether your choice is working."],
  fl:[0,3],cl:[{s:0,t:"The experience approach is better and should be used in every class.",v:"UNSUPPORTED",w:"'Every class' ignores the learners. No evidence is given."},{s:3,t:"Research proves that starting with life experiences is always more effective.",v:"UNSUPPORTED",w:"'Proves' and 'always' with no source are warning signs."}],
  im:{a:"What is the best way to decide?",o:["Follow the newer book without testing","Try a short comparison in your own class and check the results","Let students vote and keep the winner forever"],b:1,w:"A small test with your class gives real evidence."}},
 {id:"t13",cat:"critical-thinking",skill:"Finding causes",title:"'This lesson is boring'",blurb:"Three students say a lesson was boring. Why?",
  ctx:"After a lesson on the passive voice, three students say: 'This is boring.' Your mentor says the class needs more games. You are not sure what caused the boredom: the topic, the level, or the way the lesson was organised.",
  q:{a:"Before changing anything, what should you do?",o:["Add games immediately","Find out the possible causes (level, topic, type of activity)","Ignore the comments"],b:1,w:"A change without a diagnosis may not fix the real cause."},
  ai:["Boredom is always caused by a lack of games, so add a game to every lesson.","Ask students which part felt slow or unclear. A two-minute anonymous note can show patterns.","Check whether the task was too easy or too difficult, because both can cause boredom.","Games raise motivation in 95% of classes.","Change one thing at a time so you can see what helped."],
  fl:[0,3],cl:[{s:0,t:"Boredom is always caused by a lack of games.",v:"UNSUPPORTED",w:"'Always' is too strong. There are many possible causes."},{s:3,t:"Games raise motivation in 95% of classes.",v:"UNSUPPORTED",w:"An exact percentage with no source should not be trusted."}],
  im:{a:"Which plan is most useful?",o:["Add a game, a video and group work next lesson","Collect quick feedback, change one element, then ask again","Tell students boredom is normal"],b:1,w:"One change at a time shows what really helps."}},
 {id:"t14",cat:"ai-teaching",skill:"Checking AI materials",title:"The AI reading text",blurb:"An AI text looks good, but you have not checked it.",
  ctx:"You ask an AI tool for a B1 reading text about life in Tashkent. The text has 350 words and looks good. You have five minutes before class and are tempted to print it and go.",
  q:{a:"What is the main problem?",o:["The text has no title","You have not checked level, facts and content","AI cannot write about Tashkent"],b:1,w:"AI text can contain errors or a wrong level, so the teacher must check."},
  ai:["This text is at B1 level because it uses only simple sentences.","The text says the city has exactly 3,412,000 residents and 41 museums.","The text includes a short glossary of five useful words.","You can ask students to underline unknown words and guess the meaning from context.","You do not need to read it before class because AI texts are always accurate."],
  fl:[0,1,4],cl:[{s:1,t:"The city has exactly 3,412,000 residents and 41 museums.",v:"UNCERTAIN",w:"Exact figures need a reliable source, such as official statistics."},{s:4,t:"AI texts are always accurate, so you do not need to read them.",v:"UNSUPPORTED",w:"AI can make mistakes, so teachers must check."}],
  im:{a:"What should you do before using it?",o:["Read it, check facts and vocabulary level, and edit","Print it immediately","Ask students to check it for you"],b:0,w:"The teacher is responsible for the material."}},
 {id:"t15",cat:"ai-teaching",skill:"AI feedback",title:"AI marks the essays",blurb:"A colleague wants AI marks to be final grades.",
  ctx:"A colleague suggests pasting all 25 student essays into a free AI tool and using its marks as the final grades, to save time. She says AI is 'more objective than a teacher'.",
  q:{a:"Which question matters most here?",o:["Is the tool fast enough?","Is it fair, accurate and safe to use student texts this way?","Do students like AI?"],b:1,w:"Fairness, accuracy and privacy come before speed."},
  ai:["AI grading is objective, so it is fairer than a teacher.","Use AI feedback as a first draft of comments and check it before giving it to students.","Student essays can be pasted into any free tool because they are not personal data.","Give the AI a clear rubric so its feedback follows your criteria.","AI marks are 98% the same as teacher marks."],
  fl:[0,2,4],cl:[{s:0,t:"AI grading is objective, so it is fairer than a teacher.",v:"UNSUPPORTED",w:"AI can be inconsistent and can reflect bias."},{s:4,t:"AI marks are 98% the same as teacher marks.",v:"UNSUPPORTED",w:"No source is given for this exact figure."}],
  im:{a:"What is the best plan?",o:["Use AI marks as final grades","Use AI only for draft comments, keep teacher judgement for grades, and remove names first","Stop giving feedback"],b:1,w:"It saves time without giving up responsibility."}},
 {id:"t16",cat:"ai-teaching",skill:"AI mistakes",title:"The AI quiz has an error",blurb:"An AI-made vocabulary quiz has a wrong answer key.",
  ctx:"You asked AI for a 10-question vocabulary quiz on 'travel' for A2 students. Question 4 says: 'Which word means a place where planes land? a) station b) airport c) harbour'. The answer key says (a). You ask the AI whether the quiz is reliable.",
  q:{a:"What does this show?",o:["AI answer keys can contain mistakes","Students should not do quizzes","Question 4 is correct"],b:0,w:"An answer key made by AI must be checked by a teacher."},
  ai:["Yes, the quiz is reliable because I was trained on a large amount of data.","Answer keys made by AI should be checked, especially for multiple-choice questions.","Question 4 is correct: a station is where planes land.","If you tell me an answer is wrong I can correct it, but you still need to verify.","AI never makes factual mistakes in vocabulary tasks."],
  fl:[0,2,4],cl:[{s:2,t:"A station is where planes land.",v:"UNSUPPORTED",w:"Planes land at an airport. A station is for trains or buses."},{s:4,t:"AI never makes factual mistakes in vocabulary tasks.",v:"UNSUPPORTED",w:"The quiz itself shows a mistake."}],
  im:{a:"What should a careful teacher do?",o:["Trust the key because AI wrote it","Solve the quiz yourself first and correct the key","Delete the quiz and never use AI"],b:1,w:"Checking is quick and keeps the benefit of AI."}},
 {id:"t17",cat:"fact-checking",skill:"Checking a popular claim",title:"'Children learn faster'",blurb:"A colleague says adults cannot learn languages well.",
  ctx:"At a teachers' meeting, a colleague says: 'It is a fact that children always learn languages faster, so adults should not expect to learn English well.' She wants to move the adult evening group to a much slower course.",
  q:{a:"What should you do first?",o:["Agree, because it is common knowledge","Check what the claim really says and how strong the evidence is","Move the students at once"],b:1,w:"Popular ideas need checking before they change decisions."},
  ai:["Children often reach native-like pronunciation more easily, but this does not mean they learn everything faster.","Adults may progress faster at first in some areas, because they can use study strategies.","Therefore adults cannot reach a good level of English.","Studies prove that after age 12 nobody can learn a language well.","It is better to check research reviews than to rely on one teacher's opinion."],
  fl:[2,3],cl:[{s:3,t:"Studies prove that after age 12 nobody can learn a language well.",v:"UNSUPPORTED",w:"No study is named, and many adults learn languages well."},{s:2,t:"Adults cannot reach a good level of English.",v:"UNSUPPORTED",w:"This overgeneralises from one pattern."}],
  im:{a:"What is the best decision?",o:["Keep the group and adapt pace and tasks to adult learners","Move them to a slower course","Tell them they are too old"],b:0,w:"It is based on the learners' real progress."}},
 {id:"t18",cat:"fact-checking",skill:"Checking exam tips",title:"The IELTS tip on Telegram",blurb:"A channel guarantees Band 8 for long essays.",
  ctx:"A Telegram channel with 50,000 followers posts: 'Write more than 300 words in Task 2 and you will get Band 8 automatically. Guaranteed!' Your students ask you if this is true.",
  q:{a:"What is suspicious about the post?",o:["It uses Telegram","It makes a guarantee without evidence or a source","It mentions IELTS"],b:1,w:"A guarantee with no source is a warning sign."},
  ai:["Length alone cannot guarantee a band score. Examiners assess task response, coherence, vocabulary and grammar.","Check the official IELTS information and the public band descriptors.","Any channel with many followers must be reliable.","Writing 300 words always gives Band 8.","Teachers who post confidently usually have inside knowledge."],
  fl:[2,3,4],cl:[{s:3,t:"Writing 300 words always gives Band 8.",v:"UNSUPPORTED",w:"Scores depend on several criteria, not length alone."},{s:2,t:"Any channel with many followers must be reliable.",v:"UNSUPPORTED",w:"Popularity is not evidence."}],
  im:{a:"What should you tell students?",o:["Follow the tip because it has many followers","Check the official band descriptors and practise the criteria, not only length","Ignore IELTS"],b:1,w:"It points students to reliable sources."}},
 {id:"t19",cat:"fact-checking",skill:"Checking a training slide",title:"Learning styles",blurb:"A slide says lessons must match each student's style.",
  ctx:"A training slide says: 'Students learn better when the teacher matches teaching to their learning style (visual, auditory, kinaesthetic).' Your school wants every teacher to test students and plan lessons by style.",
  q:{a:"What is the best first step?",o:["Accept it because it is on an official slide","Check reliable research reviews about this claim","Ask students to choose a style and stop planning"],b:1,w:"Official slides can still repeat popular myths."},
  ai:["Many people believe in learning styles, and the idea is popular in teacher training.","Reviews of research have not found convincing evidence that matching teaching to a preferred style improves learning.","Studies prove that every student has one fixed learning style.","Using a variety of activities and modes (pictures, speaking, movement) can help many learners.","You should test all students and group them by style for the whole year."],
  fl:[2,4],cl:[{s:2,t:"Studies prove that every student has one fixed learning style.",v:"UNSUPPORTED",w:"No study is named, and the idea of fixed styles is disputed."},{s:1,t:"Reviews of research have not found convincing evidence that matching teaching to a preferred style improves learning.",v:"SUPPORTED",w:"Recent research reviews say the evidence is weak. Check a current review."}],
  im:{a:"Which plan is better?",o:["Test styles and group students","Use varied activities and check what actually helps your learners","Remove all pictures"],b:1,w:"Variety helps, and results in your own class are real evidence."}},
 {id:"t20",cat:"communication",skill:"Sharing speaking turns",title:"The same three students",blurb:"Three students answer everything. The others stay silent.",
  ctx:"In your Grade 10 class of 30, the same three students answer every question. The others look down or whisper. You want more students to speak without embarrassing anyone.",
  q:{a:"What is the main problem?",o:["Three students are too clever","Speaking chances are not shared and quiet students may feel unsafe","The classroom is too small"],b:1,w:"The pattern is about opportunity and safety."},
  ai:["Call on silent students at random and require full answers immediately so they learn to speak.","Give thinking time and let students discuss with a partner before you ask the class.","Use short pair or group tasks so every student speaks for at least a minute.","Students who do not speak are always lazy.","Use different ways to choose students (cards, numbers) so it feels fair."],
  fl:[0,3],cl:[{s:3,t:"Students who do not speak are always lazy.",v:"UNSUPPORTED",w:"There can be many reasons, such as anxiety or low confidence."},{s:0,t:"Calling on silent students at random helps them learn to speak.",v:"UNCERTAIN",w:"It can raise anxiety. Check research on wait time and low-stakes speaking."}],
  im:{a:"What should you try first?",o:["Only ask volunteers","Think, pair, then share before whole-class answers","Give extra marks to the three students"],b:1,w:"Rehearsal in pairs makes speaking safer."}},
 {id:"t21",cat:"communication",skill:"Pronunciation feedback",title:"'Sree' for 'three'",blurb:"Feedback on a sound without embarrassing the student.",
  ctx:"A student regularly says 'sree' for 'three' and 'dis' for 'this'. Classmates sometimes laugh. You want to help her improve without embarrassing her.",
  q:{a:"What is the main problem?",o:["The student should be moved","Pronunciation feedback must be useful and safe","The words are too difficult"],b:1,w:"The teacher must help with the sound and protect the learner."},
  ai:["Correct her immediately every time in front of the class so she never repeats the mistake.","Teach the sound with a quick demonstration (tongue between the teeth) and short whole-class practice.","Pronunciation always improves within one week of daily drills.","Set a class rule that laughing at mistakes is not allowed, and praise effort.","Focus first on intelligibility: does the mistake make her hard to understand?"],
  fl:[0,2],cl:[{s:0,t:"Correcting her in front of the class every time means she never repeats the mistake.",v:"UNSUPPORTED",w:"Public correction can embarrass students, and there is no guarantee."},{s:2,t:"Pronunciation always improves within one week of daily drills.",v:"UNSUPPORTED",w:"Progress varies. 'Always' and 'one week' are unsupported."}],
  im:{a:"What is the best approach?",o:["Correct every time in public","Model the sound for the whole class, give private tips, and praise progress","Ignore pronunciation"],b:1,w:"It is useful for everyone and safe for her."}},
 {id:"t22",cat:"ethics",skill:"Student privacy",title:"Photos in the class chat",blurb:"You want to post photos of students speaking.",
  ctx:"You want to share photos of your students' speaking activity in the class Telegram group to motivate them. Some students say nothing, and one looks unhappy.",
  q:{a:"What should come first?",o:["Post immediately","Ask permission and check school rules on photos","Post only the best photos"],b:1,w:"Consent and rules come before sharing images of people."},
  ai:["Photos taken in class belong to the teacher, so you can post them without asking.","Ask students (and parents or school policy for minors) before sharing any image or recording.","Sharing only first names makes photos completely anonymous.","You can show classwork (without faces) instead of photos of people.","Delete the images from your phone after sharing so nobody can misuse them."],
  fl:[0,2,4],cl:[{s:0,t:"Photos taken in class belong to the teacher, so you can post them without asking.",v:"UNSUPPORTED",w:"Privacy and consent rules apply. Check school policy."},{s:2,t:"Sharing only first names makes photos completely anonymous.",v:"UNSUPPORTED",w:"Faces and context can still identify a person."}],
  im:{a:"What is the best solution?",o:["Post faces with names","Share classwork or anonymised examples and ask consent for anything else","Post in a public channel"],b:1,w:"It motivates students while protecting them."}},
 {id:"t23",cat:"ethics",skill:"Using AI tools safely",title:"Essays in a public AI tool",blurb:"You pasted a student's essay with her name into an AI tool.",
  ctx:"To get quick feedback ideas, you paste a student's essay, with her name, class and a personal story, into a free public AI tool.",
  q:{a:"What is the ethical issue?",o:["The essay is too long","Personal data and student work may be shared without permission","AI is too slow"],b:1,w:"Student texts can contain personal data."},
  ai:["Free AI tools are private by default, so there is no risk.","Remove names and personal details, or get permission, before using student text in an online tool.","Check the tool's privacy policy and your school's rules.","If the essay is good it is fine, because students are happy to be famous.","Use an example essay that you wrote yourself to demonstrate AI feedback."],
  fl:[0,3],cl:[{s:0,t:"Free AI tools are private by default, so there is no risk.",v:"UNSUPPORTED",w:"Check the tool's privacy policy. Many tools store or use inputs."},{s:3,t:"If the essay is good it is fine because students are happy to be famous.",v:"UNSUPPORTED",w:"Consent must be asked, not assumed."}],
  im:{a:"What is the best next step?",o:["Continue, nothing happened","Anonymise the text or use your own sample, and tell students how AI is used","Ask the AI to forget the essay"],b:1,w:"It protects the student and builds trust."}},
 {id:"t24",cat:"ethics",skill:"Copyright",title:"The copied worksheet",blurb:"An AI worksheet closely copies a published textbook.",
  ctx:"A colleague gives you a worksheet made by AI that closely copies pages from a published textbook. She says: 'It is on the internet, so it is free to use with all our classes.'",
  q:{a:"What should you ask first?",o:["Is the worksheet colourful?","Who owns the content, and are we allowed to copy it?","Can we print more?"],b:1,w:"Ownership and permission come first."},
  ai:["Everything on the internet is free to copy for teaching.","Many countries allow limited educational use, but rules differ, so check your institution's policy or the licence.","AI-generated text can include copied material, so check where content comes from.","If you change three words, it becomes your own work.","Use open-licensed materials or write your own examples, and credit sources."],
  fl:[0,3],cl:[{s:0,t:"Everything on the internet is free to copy for teaching.",v:"UNSUPPORTED",w:"Copyright still applies to material on the internet."},{s:3,t:"If you change three words, it becomes your own work.",v:"UNSUPPORTED",w:"Small changes do not remove the original author's rights."}],
  im:{a:"What is the best decision?",o:["Copy it as it is","Replace it with open-licensed or self-written material and credit the sources","Delete all worksheets"],b:1,w:"It is legal, fair and still saves time."}},
 {id:"t25",cat:"media-info",skill:"Grammar myths",title:"The Instagram grammar rule",blurb:"'Never end a sentence with a preposition!'",
  ctx:"An Instagram post says: 'Never end a sentence with a preposition. It is always a mistake!' Your students ask whether they will lose marks for sentences like 'What are you looking at?'",
  q:{a:"What should you do?",o:["Agree with the post","Check a reliable grammar reference before answering","Tell students to avoid all questions"],b:1,w:"Viral rules can be myths. Check a reliable source."},
  ai:["Ending a sentence with a preposition is always wrong in English.","In many common questions and phrases, ending with a preposition is natural, for example 'What are you looking at?'","Some very formal writing avoids it, so style can matter, but it is not a strict rule for all contexts.","Instagram posts with many likes are usually written by linguists.","Check a dictionary or grammar book from a reliable publisher to confirm."],
  fl:[0,3],cl:[{s:0,t:"Ending a sentence with a preposition is always wrong in English.",v:"UNSUPPORTED",w:"It is natural in many sentences. 'Always' is too strong."},{s:3,t:"Instagram posts with many likes are usually written by linguists.",v:"UNSUPPORTED",w:"Likes do not show expertise."}],
  im:{a:"What do you tell students?",o:["Never end with a preposition","Both are possible: natural questions can end with a preposition, and formal style may avoid it","Ignore prepositions"],b:1,w:"It is accurate and useful."}},
 {id:"t26",cat:"media-info",skill:"Machine translation",title:"'I am agree'",blurb:"A translation app gives a wrong sentence.",
  ctx:"A student uses a translation app for her homework. The English result includes 'I am agree with this opinion.' She keeps it because 'the app cannot be wrong'.",
  q:{a:"What should the class learn from this?",o:["Never use apps","Apps can make errors, so check the output with a reliable source","Apps are always right"],b:1,w:"Apps are useful tools, but their output must be checked."},
  ai:["The sentence is correct because it is a direct translation.","'I agree with this opinion' is the correct form. 'Agree' is a verb, so we do not use 'am' before it.","Translation apps are 100% accurate for all languages.","Compare the output with a dictionary, or ask a teacher, when a sentence looks unusual.","Short simple sentences are often easier for apps to translate well."],
  fl:[0,2],cl:[{s:0,t:"'I am agree with this opinion' is correct because it is a direct translation.",v:"UNSUPPORTED",w:"The correct form is 'I agree'."},{s:2,t:"Translation apps are 100% accurate for all languages.",v:"UNSUPPORTED",w:"No app is perfect. Check the output."}],
  im:{a:"How should you respond?",o:["Accept her sentence","Show the correct form and teach a three-step check for app output","Ban translation apps"],b:1,w:"It teaches a skill she can reuse."}},
 {id:"t27",cat:"media-info",skill:"Style advice",title:"'Never use the passive'",blurb:"A famous video says the passive is always bad.",
  ctx:"A popular video says: 'The passive voice is always bad writing. Delete every passive sentence.' A student asks whether she should remove all passive sentences from her science report.",
  q:{a:"What is the best response?",o:["Delete all passives","Check when the passive is useful and why the video says this","Ignore the question"],b:1,w:"Style advice needs context and a check."},
  ai:["The passive is always bad, so never use it.","The passive is often useful when the doer is unknown or unimportant, for example in describing a science method.","Too many passives can make writing heavy, so check clarity and choose the best form.","The video's creator is famous, so the rule must be correct.","Look at good examples in journals or style guides to see how the passive is used."],
  fl:[0,3],cl:[{s:0,t:"The passive is always bad, so never use it.",v:"UNSUPPORTED",w:"The passive is normal and useful in many kinds of writing."},{s:3,t:"The video's creator is famous, so the rule must be correct.",v:"UNSUPPORTED",w:"Fame is not evidence."}],
  im:{a:"What advice is best?",o:["Remove all passives","Use the passive when the action matters more than the doer, and the active when clarity needs it","Use only passives"],b:1,w:"It gives a real reason to choose."}},
 {id:"t28",cat:"methods",skill:"Flipped learning",title:"The video nobody watched",blurb:"Only 8 of 26 students watched the homework video.",
  ctx:"You planned a flipped lesson on reported speech. Only 8 of 26 students watched the 6-minute video at home. Many said they had no internet or forgot.",
  q:{a:"What is the main issue?",o:["Video is a bad method","The plan did not consider access and accountability","Reported speech is too hard"],b:1,w:"A flipped lesson only works if students can and will prepare."},
  ai:["Flipped classrooms always work, so keep the same plan and blame the students.","Give a quick in-class version of the key input for those who missed it, then move to practice.","Ask students in advance about devices and internet, and offer offline options such as a printed summary.","Research proves flipped classrooms raise test scores by 30%.","Add a one-minute check task at the start (a question about the video) so students see that it matters."],
  fl:[0,3],cl:[{s:0,t:"Flipped classrooms always work, so keep the same plan.",v:"UNSUPPORTED",w:"No method always works. Access and preparation matter."},{s:3,t:"Research proves flipped classrooms raise test scores by 30%.",v:"UNSUPPORTED",w:"An exact figure with no source is unverified."}],
  im:{a:"What is the best plan for next time?",o:["Keep the same plan","Check access first, give offline options, and start with a quick check task","Stop all homework"],b:1,w:"It fixes the real causes."}},
 {id:"t29",cat:"methods",skill:"Project or textbook",title:"Project or textbook?",blurb:"Eight weeks, six units, and a project idea.",
  ctx:"You have 8 weeks. The department wants you to finish 6 textbook units before an exam. You also want a group project (a class brochure in English). Students have little time outside class.",
  q:{a:"What is the main problem?",o:["Projects are boring","Balancing exam coverage and project learning","There is no paper for a brochure"],b:1,w:"The choice is about balance, not one method against the other."},
  ai:["Skip the textbook completely. Projects are always better than textbooks.","Choose which units are essential for the exam and use them as language input for the project.","A short project (3–4 weeks) with clear milestones can fit alongside textbook work.","Students will learn all the exam grammar automatically through projects.","Ask what the exam actually tests and plan checkpoints so you can see whether students are ready."],
  fl:[0,3],cl:[{s:0,t:"Projects are always better than textbooks.",v:"UNSUPPORTED",w:"'Always' ignores the goals and the exam."},{s:3,t:"Students will learn all the exam grammar automatically through projects.",v:"UNSUPPORTED",w:"'All' and 'automatically' are unsupported."}],
  im:{a:"What is the best plan?",o:["Only the textbook","Link the project to exam-relevant language and use short milestones","Only the project"],b:1,w:"It serves both goals."}},
 {id:"t30",cat:"problem-solving",skill:"Lateness",title:"Late after lunch",blurb:"Eight students arrive ten minutes late every day.",
  ctx:"Every day after lunch, 8 of your 28 students arrive about 10 minutes late and miss the first activity. Other teachers say 'that is their problem'.",
  q:{a:"What is the first step?",o:["Punish the late students","Find out why they are late","Start every class ten minutes later"],b:1,w:"The right solution depends on the cause."},
  ai:["Lock the door when the bell rings so lateness stops immediately.","Talk to a few late students to learn the reasons (queues, distance, habit).","Design a short, useful settling activity for the first five minutes so latecomers miss less.","Lateness is always caused by a lack of respect.","Agree on a simple class routine and keep a lateness log for two weeks to see patterns."],
  fl:[0,3],cl:[{s:3,t:"Lateness is always caused by a lack of respect.",v:"UNSUPPORTED",w:"There are many possible reasons."},{s:0,t:"Locking the door stops lateness immediately.",v:"UNSUPPORTED",w:"It may only cause conflict or missed lessons."}],
  im:{a:"What is the best plan?",o:["Punish everyone","Ask for reasons, adapt the first five minutes, and track patterns","Ignore it"],b:1,w:"It is based on evidence and keeps learning going."}},
 {id:"t31",cat:"problem-solving",skill:"Limited resources",title:"12 books for 30 students",blurb:"There are not enough coursebooks.",
  ctx:"The school has only 12 copies of the coursebook for 30 students. You cannot buy more this term. You need students to read and do exercises in every lesson.",
  q:{a:"What is the main problem?",o:["Students do not like books","Limited resources need a fair and workable plan","The book is too heavy"],b:1,w:"The task is to share resources fairly and still meet the goals."},
  ai:["Give the books only to the best students so they learn faster.","Rotate books in groups of two or three, with roles (reader, writer, checker).","Copy key pages if your school's rules and copyright allow it, or project the page on the board.","Students always learn less when they share resources.","Use tasks that do not need the book, such as pair speaking with prompt cards."],
  fl:[0,3],cl:[{s:3,t:"Students always learn less when they share resources.",v:"UNSUPPORTED",w:"Shared work can be effective when it is well organised."},{s:0,t:"Giving books only to the best students helps them learn faster.",v:"UNSUPPORTED",w:"It is unfair and does not solve the problem."}],
  im:{a:"What is the best solution?",o:["Give books to the top students","Groups of two or three with roles, plus board work and prompt cards","Cancel reading tasks"],b:1,w:"It is fair and keeps everyone active."}},
 {id:"t32",cat:"problem-solving",skill:"Homework copying",title:"Identical homework",blurb:"Many students hand in the same answers.",
  ctx:"Many students bring identical homework answers. Some admit they copy from classmates or use AI. You do not want to punish everyone.",
  q:{a:"What is the main problem?",o:["Students are lazy","The homework design makes copying easy","Homework is too easy"],b:1,w:"Task design can make copying easy or hard."},
  ai:["Ban homework completely, because copying cannot be prevented.","Ask for personal answers (experience, opinion, local examples) that are harder to copy.","Do a quick follow-up in class: students explain one answer to a partner.","Use AI detectors and give a zero to anyone who is flagged.","Explain why homework helps learning and how you will check it."],
  fl:[0,3],cl:[{s:3,t:"AI detectors are reliable enough to give a zero to anyone who is flagged.",v:"UNSUPPORTED",w:"Detectors can be wrong, so this could be unfair."},{s:0,t:"Copying cannot be prevented, so homework should be banned.",v:"UNSUPPORTED",w:"Task design can reduce copying a lot."}],
  im:{a:"What is the best change?",o:["Ban homework","Personalise tasks and add a quick in-class check","Give a zero to everyone"],b:1,w:"It reduces copying and keeps learning."}}
];

/* ---- normalise: merge answer keys into old tasks, add new tasks, fill all fields the app uses ---- */
(function(){
  const mk=(t,e)=>{t.q1={ask:e.q.a,options:e.q.o,best:e.q.b,why:e.q.w};t.flaws=e.fl;t.claims=e.cl.map(c=>({seg:c.s,text:c.t,verdict:c.v,why:c.w}));t.improve={ask:e.im.a,options:e.im.o,best:e.im.b,why:e.im.w}};
  TASKS.forEach(t=>{mk(t,TASK_EXT[t.id]);t.mins="5–8 min";t.level=t.level||"B1"});
  TASKS_NEW.forEach(n=>{
    const t={id:n.id,num:0,skill:n.skill,category:n.cat,topics:[],level:"B1",mins:"5–8 min",title:n.title,blurb:n.blurb,context:n.ctx,facts:[],ai:n.ai};
    mk(t,n);TASKS.push(t)});
  TASKS.sort((a,b)=>parseInt(a.id.slice(1))-parseInt(b.id.slice(1)));
  TASKS.forEach((t,i)=>{t.num=i+1;t.kw=[...contentSet(t.context)];TASK_BY_ID[t.id]=t});
})();
/* All Uzbek (Latin) text of the app lives here. Written with ASCII apostrophes inside
   double-quoted strings; build_site.py converts them to the correct marks:
   o' and g'  ->  oʻ gʻ  (U+02BB),  any other apostrophe between letters -> ʼ  (U+02BC). */
const UZ={
 role:"PhD tadqiqotchi",
 forTeachers:"Oʻqituvchilar uchun",
 bn:{home:"Bosh",tasks:"Topshiriq",methods:"Metodlar",comp:"Musobaqa",progress:"Natija"},
 nav:{home:"Bosh sahifa",tasks:"Topshiriqlar",cycle:"6C sikli",methods:"Metodlar oʻyini",comp:"Jamoaviy musobaqa",progress:"Natijalarim",about:"Loyiha haqida",teacher:"Oʻqituvchi paneli"},
 home:{eyebrow:"Elektron metodik prototip",sub:"Boʻlajak ingliz tili oʻqituvchilari uchun sunʼiy intellekt va tanqidiy fikrlash",choose:"Nima qilmoqchisiz?",hello:"Salom",nameAsk:"Ismingizni yozing",namePh:"Ismingiz (taxallus ham mumkin)",save:"Saqlash",
  nameHint:"Ism faqat shu qurilmada saqlanadi. Sinfga qoʻshilsangiz, oʻqituvchi shu ismni koʻradi.",days:"kun ketma-ket",cont:"Davom etish",random:"Tasodifiy topshiriq",how:"6 qadamda qanday ishlaydi",
  aiNote:"AI faqat 2-qadamda ishlatiladi. Qolgan besh qadam — sizning oʻz fikringiz va tekshiruvingiz.",what:"AI-CT TEACHER nima?",
  whatP:"Bu platforma boʻlajak ingliz tili oʻqituvchilariga sunʼiy intellekt javoblarini koʻr-koʻrona qabul qilmasdan, tanqidiy oʻrganishni, tekshirishni va oʻz qarorini asoslashni oʻrgatadi.",more:"Batafsil"},
 tiles:{tasks:"32 ta real sinf vaziyati, 8 ta kategoriya",cycle:"6 qadamli oʻrganish sikli",methods:"Metodlar boʻyicha tez savollar",comp:"Sinf bilan jamoaviy oʻyin",progress:"XP, nishonlar va natijalaringiz",teacher:"Sinf yarating va natijalarni koʻring"},
 stage:[
  {n:"Vaziyat",t:"Vaziyatni oʻqing va AI ishlatmasdan oʻzingiz tahlil qiling."},
  {n:"Maslahat (AI)",t:"AIʼdan javob soʻrang. Bu — AI ishlatiladigan yagona bosqich."},
  {n:"Tanqid",t:"AI javobining qaysi qismi ishonarli, qaysi biri shubhali ekanini belgilang."},
  {n:"Tekshiruv",t:"Daʼvolarni tekshiring: manba turi, topilgan dalil va hukm (tasdiqlandi, qisman, tasdiqlanmadi, noaniq)."},
  {n:"Yaxshilash",t:"Yaxshiroq variantni tanlang yoki oʻzingiz yozing va uning xavfini ayting."},
  {n:"Xulosa",t:"Qaror qiling: qabul qilish, oʻzgartirish yoki rad etish. Sababini yozing va nimani oʻrganganingizni ayting."}],
 consultNote:"Bu sahifa javob toʻgʻri yoki notoʻgʻri ekanini aytmaydi. Buni keyingi bosqichlarda oʻzingiz aniqlaysiz.",
 checkNote:"Ilova manbalarni sizning oʻrningizga tekshirmaydi: hukmni oʻzingiz chiqarasiz.",
 lookBack:"Orqaga nazar",
 cycleLead:"Har bir topshiriq aynan 6 bosqichdan oʻtadi va bosqichlar har doim shu tartibda keladi.",
 cycleNote:"Aynan olti bosqich, har doim shu tartibda. Mulohaza (refleksiya) alohida bosqich emas, u Xulosa bosqichining yakuniy qismi.",
 result:"Natijangiz",stageBy:"Bosqichlar boʻyicha fikr-mulohaza",classStatus:"Sinf holati",record:"Yozuvni koʻrish",
 aboutTitle:"Loyiha haqida",aboutLead:"Sunʼiy intellekt bilan tuzilgan oʻzaro taʼsir orqali tanqidiy fikrlashni rivojlantiruvchi elektron metodik prototip.",
 institution:"MUASSASA",dissLabel:"Dissertatsiya mavzusi",
 dissertation:"Sunʼiy intellekt vositalari asosida boʻlajak ingliz tili oʻqituvchilarining tanqidiy fikrlash koʻnikmalarini rivojlantirish metodikasi",
 cols:["Bosqich","Talaba nima qiladi","Qisqacha"],
 about:[
  {h:"AI-CT TEACHER nima?",p:["AI-CT TEACHER — boʻlajak ingliz tili oʻqituvchilarining tanqidiy fikrlashini sunʼiy intellekt bilan tuzilgan oʻzaro taʼsir orqali rivojlantirishga moʻljallangan elektron metodik prototip.","Koʻpchilik vositalar talabaga tayyor javob beradi va uni qabul qilishni kutadi. Bu platforma esa sunʼiy intellektni tanqidiy tahlil obʼekti sifatida koʻradi: talaba avval oʻzi oʻylaydi, AIʼdan bir marta soʻraydi, soʻng javobni tahlil qiladi, tekshiradi, unga eʼtiroz bildiradi va oʻz masʼuliyatli qarorini yozadi."]},
  {h:"AI-CT 6C sikli",p:[],table:true},
  {h:"AI qanday ishlatiladi?",p:["AI faqat 2-bosqichda (Maslahat) ishlatiladi. Xavfsiz AI xizmati ulangan boʻlsa, javobni Gemini server orqali beradi: API kaliti serverda saqlanadi, talaba hech qachon kalit kiritmaydi. Ulanmagan boʻlsa, ilova oldindan yozilgan namunaviy javobni koʻrsatadi; u har doim \"DEMONSTRATION\" deb belgilanadi va savolingizga bogʻliq emas.","AI javoblarida xato boʻlishi mumkin. Aynan shu xatolarni topish oʻrganilayotgan koʻnikmadir."]},
  {h:"Ballar va fikr-mulohaza",p:["Olti bosqichning har birida uchta koʻrinadigan koʻrsatkich bor. Daraja = 1 + bajarilgan koʻrsatkichlar soni (1 dan 4 gacha); jami ball 6 dan 24 gacha. Nima uchun aynan shu daraja berilgani har doim koʻrinib turadi.","Bu oʻquv faoliyati koʻrsatkichlari: ular tanqidiy fikrlash elementlari ishingizda borligini koʻrsatadi. Bu tasdiqlangan (validatsiya qilingan) psixologik test emas va gʻoyaning sifatini baholay olmaydi."]},
  {h:"Oʻqituvchi va talaba sinflari",p:["Oʻqituvchi sinf yaratishi, havola ulashishi va qoʻshilgan talabalarning natijalarini koʻrishi mumkin. Talaba ism (taxallus ham boʻladi) yozadi va havola orqali qoʻshiladi.","Sinfga faqat ballar yuboriladi: topshiriq, har bosqich darajasi, jami ball, XP va oʻyin natijalari. Yozgan javoblaringiz faqat oʻz qurilmangizda qoladi. Sinfdan istalgan vaqtda chiqish mumkin.","Sinflar ishlashi uchun xavfsiz server ulangan boʻlishi kerak. U ulanmaguncha bu boʻlim faqat nima qilishini tushuntiradi."]},
  {h:"Tadqiqotda foydalanish va cheklovlar",p:["Bu tadqiqot prototipi boʻlib, biror muassasaning rasmiy mahsuloti yoki u tomonidan tasdiqlangan vosita emas. Tadqiqotda yozuvlarni oʻqitilgan baholovchilar oʻsha mezon boʻyicha baholashi kerak; ilmiy asoslilik dasturdan emas, tadqiqot dizaynidan, tanlanmadan va tahlildan keladi."]}],
 cls:{title:"Mening sinfim",none:"Siz hozircha hech qanday sinfga qoʻshilmagansiz.",ph:"Sinf kodi yoki havolasi",join:"Qoʻshilish",privacy:"Sinfga faqat ballar yuboriladi, yozgan javoblaringiz yuborilmaydi."},
 progLead:"Sizning hisobingiz, XP, nishonlar va natijalar. Maʼlumotlar shu qurilmada saqlanadi.",
 prof:{title:"Mening hisobim",update:"Yangilash",note:"Hisob shu brauzerda saqlanadi (parolsiz). Boshqa qurilmada alohida hisob ochiladi."},
 badges:"Nishonlar",profile6c:"Mening 6C profilim",recent:"Soʻnggi faoliyat",learned:"Nimani oʻrgandim",nothing:"Hozircha natija yoʻq",nothingP:"Birinchi topshiriqni bajaring, natijalar shu yerda paydo boʻladi.",
 exportT:"Eksport va maʼlumotlar",exportP:"Yozuvlarni JSON yoki CSV koʻrinishida yuklab olish mumkin (oʻqituvchiga yoki tadqiqot uchun).",
 cat:{"critical-thinking":"Tanqidiy fikrlash","ai-teaching":"AI va oʻqitish","fact-checking":"Faktlarni tekshirish","communication":"Muloqot","ethics":"Etika","media-info":"Media va axborot","methods":"Oʻqitish metodlari","problem-solving":"Muammolarni yechish"},
 libLead:"ta real sinf vaziyati sakkizta kategoriyada. Har biri toʻliq 6 bosqichdan oʻtadi.",
 footNote:"Maʼlumotlar brauzeringizda saqlanadi.",
 j:{title:"Sinfga qoʻshilish",lead:"Quyida sinf nomini koʻrasiz. Ismingizni yozing va qoʻshiling.",nameLabel:"Ismingiz (taxallus ham mumkin)",btn:"Qoʻshilish",privacy:"Oʻqituvchi faqat ismingizni va ballaringizni koʻradi. Yozgan javoblaringiz yuborilmaydi."},
 t:{notConnected:"Sinflar hozircha ulanmagan.",notConnectedP:"Oʻqituvchi sinf yaratib natijalarni koʻrishi uchun xavfsiz server ulangan boʻlishi kerak. Quyida namuna (demo) maʼlumotlar bilan koʻrinish koʻrsatilgan.",
  lead:"Sinf yarating, havolani talabalarga bering va ularning natijalarini koʻring.",preview:"Namuna koʻrinish",created:"Sinf yaratildi",code:"Sinf kodi",link:"Qoʻshilish havolasi",key:"Oʻqituvchi kaliti",
  keyWarn:"Kalitni saqlab qoʻying: u faqat shu qurilmada va hozir koʻrinadi. Kalit yoʻqolsa, sinf natijalarini koʻra olmaysiz. Uni talabalarga bermang.",openClass:"Sinfni ochish",create:"Yangi sinf yaratish",className:"Sinf nomi",classPh:"Masalan: 3-kurs, A guruh",yourName:"Ismingiz",optional:"ixtiyoriy",createBtn:"Sinf yaratish",
  myClasses:"Mening sinflarim",open:"Ochish",noClasses:"Hozircha sinf yoʻq.",otherDevice:"Boshqa qurilmada yaratilgan sinfni ochish",classLead:"Talabalar havola orqali qoʻshiladi. Faqat ballar koʻrinadi.",showCode:"Kodni ekranga chiqarish",
  joinHow:"Talabalar havolani oching yoki ilovada \"Natijalarim\" boʻlimida kodni kiritadi.",joinAt:"Qoʻshilish kodi",refresh:"Yangilash",exportCsv:"CSV yuklab olish",hideKey:"Kalitni yashirish",showKeyBtn:"Kalitni koʻrsatish",updated:"Yangilandi",deleteClass:"Sinfni oʻchirish",
  students:"talaba",activities:"faoliyat",avgScore:"oʻrtacha ball",games:"oʻyinlar",stageProfile:"Bosqichlar boʻyicha natija",byTask:"Topshiriqlar boʻyicha",noResults:"Hozircha 6C natijalari yoʻq. Talabalar topshiriqni tugatganda shu yerda koʻrinadi.",studentTable:"Talabalar",noStudents:"Hali hech kim qoʻshilmagan.",
  lockedTitle:"Sinf yaratish hozircha mavjud emas.",soon:"server ulanmagan",example:"namuna",
  afterCreate:"Sinf yaratilgach siz sinf kodi, qoʻshilish havolasi va oʻqituvchi kalitini olasiz. Havolani talabalarga yuborasiz, ular ism yozib qoʻshiladi.",
  privacy:"Serverda faqat ismlar va ballar saqlanadi. Talabalarning yozgan javoblari yuborilmaydi."}
};
/* =====================================================================
   SOUND — short Web Audio beeps only. No audio files, no autoplay music.
   Browsers block sound until the visitor first taps, clicks or presses a
   key, so the welcome chime plays on that first interaction. After that,
   sound plays in response to actions, and only while the ON/OFF toggle
   (persisted like the theme preference) is on. Default: on.
   ===================================================================== */
const SND={ctx:null};
const sndEnabled=()=>S.prefs.sound!==false;
function sndCtx(){
  if(!SND.ctx){try{SND.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}
  if(SND.ctx.state==='suspended')SND.ctx.resume().catch(()=>{});
  return SND.ctx}
function beep(freq,dur,delay=0,gain=0.07,type='sine'){
  const ctx=sndCtx();if(!ctx)return;
  const t0=ctx.currentTime+delay,osc=ctx.createOscillator(),g=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,t0);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(gain,t0+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  osc.connect(g);g.connect(ctx.destination);osc.start(t0);osc.stop(t0+dur+0.03)}
function sndPlay(name){
  if(!sndEnabled())return;
  switch(name){
    case 'correct':beep(880,.12);beep(1180,.14,.09);break;
    case 'wrong':beep(280,.22,0,.06,'triangle');break;
    case 'start':beep(520,.1);beep(660,.12,.11);beep(880,.18,.22);break;
    case 'achievement':beep(660,.1);beep(880,.1,.1,.08);beep(1108,.24,.2,.09);break;
    case 'complete':beep(784,.14);beep(988,.14,.12,.08);beep(1318,.3,.24,.09);break;
    case 'welcome':beep(392,.18,0,.05);beep(523,.18,.14,.05);beep(659,.2,.28,.055);beep(784,.42,.44,.06);beep(1046,.5,.62,.04);break;
    case 'stage':beep(740,.09,0,.05);beep(988,.16,.08,.055);break;
    /* Team Competition: little jingles. Correct = bright rising fanfare; wrong = soft falling "aww"; time up = three falling beeps. */
    case 'tc-correct':[523,659,784,1046].forEach((f,i)=>beep(f,.16,i*.085,.075,'triangle'));[1046,1318,1568].forEach(f=>beep(f,.7,.36,.05,'sine'));beep(2093,.5,.42,.025,'sine');break;
    case 'tc-wrong':[392,349,311,262].forEach((f,i)=>beep(f,.24,i*.17,.07,'triangle'));beep(131,.7,.6,.07,'sawtooth');break;
    case 'tc-timeup':beep(660,.13,0,.07,'square');beep(520,.13,.17,.07,'square');beep(390,.34,.34,.07,'square');break;
    case 'tc-turn':beep(587,.09,0,.05,'triangle');beep(784,.15,.09,.055,'triangle');break;
    case 'ai':beep(330,.07,0,.04,'triangle');beep(494,.07,.07,.04,'triangle');beep(659,.12,.14,.045,'triangle');break;
  }}
function sndToggleBtn(){return `<button class="sound-toggle" data-act="snd-toggle" aria-pressed="${sndEnabled()}">${sndEnabled()?'🔊':'🔈'} Sound ${sndEnabled()?'on':'off'}</button>`}
/* =====================================================================
   STATE — everything is stored in this browser's localStorage and is
   validated on load, so corrupted or old data can never crash the app.
   Sensitive items kept on this device only: the student's class token
   and a teacher's class key (see README, "Data and privacy").
   ===================================================================== */
const KEY='aict-teacher:prototype:v1', SCHEMA=2;
let storageOk=true, persistT=null, lastSaved=null;

function defaultState(){return{schema:SCHEMA,attempts:{},order:[],notes:{},prefs:{},xp:0,badges:[],competitions:[],methodRounds:[],
  seenQ:{},streak:{last:'',count:0},profile:{name:'',id:''},classes:[],teacherClasses:[],outbox:[],legacy:0}}
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const arr=v=>Array.isArray(v)?v:[];
function validAttempt(a){
  try{return isObj(a)&&typeof a.id==='string'&&TASK_BY_ID[a.taskId]&&isObj(a.d)&&['context','consult','critique','check','challenge','conclude'].every(k=>isObj(a.d[k]))
    &&Number.isInteger(a.stage)&&a.stage>=1&&a.stage<=6&&(a.status==='in_progress'||a.status==='completed')&&Array.isArray(a.d.check.rows)&&isObj(a.d.critique.tags)&&Array.isArray(a.d.consult.segs)}catch(e){return false}}
function sanitizeState(raw){
  const d=defaultState();
  if(!isObj(raw))return d;
  d.prefs=isObj(raw.prefs)?raw.prefs:{};
  d.xp=Number.isFinite(raw.xp)?Math.max(0,Math.floor(raw.xp)):0;
  d.badges=arr(raw.badges).filter(x=>typeof x==='string');
  d.competitions=arr(raw.competitions).filter(isObj).slice(-200);
  d.methodRounds=arr(raw.methodRounds).filter(isObj).slice(-300);
  d.seenQ=isObj(raw.seenQ)?raw.seenQ:{};
  const st=isObj(raw.streak)?raw.streak:{};d.streak={last:typeof st.last==='string'?st.last:'',count:Number.isFinite(st.count)?st.count:0};
  const pr=isObj(raw.profile)?raw.profile:{};d.profile={name:typeof pr.name==='string'?pr.name.slice(0,40):'',id:typeof pr.id==='string'?pr.id.slice(0,40):''};
  d.classes=arr(raw.classes).filter(c=>isObj(c)&&typeof c.code==='string'&&typeof c.token==='string'&&typeof c.studentId==='string');
  d.teacherClasses=arr(raw.teacherClasses).filter(c=>isObj(c)&&typeof c.code==='string'&&typeof c.key==='string');
  d.outbox=arr(raw.outbox).filter(o=>isObj(o)&&typeof o.cid==='string'&&typeof o.code==='string').slice(-500);
  if(raw.schema===SCHEMA){
    const at=isObj(raw.attempts)?raw.attempts:{};
    Object.keys(at).forEach(id=>{if(validAttempt(at[id]))d.attempts[id]=at[id]});
    d.order=arr(raw.order).filter(id=>d.attempts[id]);
    d.notes=isObj(raw.notes)?raw.notes:{}}
  else d.legacy=Object.keys(isObj(raw.attempts)?raw.attempts:{}).length;   // older version: its task records are not shown, only counted
  return d}
function loadState(){try{const raw=localStorage.getItem(KEY);return sanitizeState(raw?JSON.parse(raw):null)}catch(e){storageOk=false;return defaultState()}}
let S=loadState();
function persistNow(){clearTimeout(persistT);try{localStorage.setItem(KEY,JSON.stringify(S));storageOk=true}catch(e){storageOk=false}lastSaved=Date.now();updateSaved()}
function persist(){clearTimeout(persistT);persistT=setTimeout(persistNow,350)}
function updateSaved(){const el=$('#savedAt');if(el)el.textContent=lastSaved?`Saved ${fmtTime(lastSaved)}`:'Not saved yet'}

const ui={page:'home',params:{},menu:false,streaming:false,stream:'',aiErr:'',libCategory:null,
  mc:null,tc:{phase:'setup',mode:1,teams:[{name:'You',score:0}],count:5,diff:'easy',topic:'mixed'},
  teacher:{view:'home',code:null,data:null,loading:false,err:'',newKey:null,showKey:false,projector:false},
  join:{code:'',info:null,err:'',busy:false},sync:{busy:false,last:0,err:''},
  tSort:{k:'avg',dir:-1},tTask:'All',tStudent:null,assessId:null,justCompleted:null,justBadges:null,justXp:0,feedback:null,aboutLang:'uz'};

/* ---------- attempts ---------- */
function blankData(){return{
  context:{pick:-1,first:'',conf:0},
  consult:{prompt:'',mode:'',response:'',segs:[],history:[],ts:0,extra:null},
  critique:{tags:{},stance:'',reason:''},
  check:{rows:[],seeded:false},
  challenge:{pick:-1,own:'',limit:''},
  conclude:{decision:'',reasoning:'',learned:'',confidence:0}}}
function newAttempt(taskId){
  const at={id:uid('a'),taskId,createdAt:Date.now(),updatedAt:Date.now(),stage:1,maxStage:1,status:'in_progress',d:blankData(),self:{}};
  S.attempts[at.id]=at;S.order.push(at.id);persistNow();return at}
const attemptsList=()=>S.order.map(id=>S.attempts[id]).filter(Boolean);
const completedList=()=>attemptsList().filter(a=>a.status==='completed');
const attemptsFor=t=>attemptsList().filter(a=>a.taskId===t);
const inProgressFor=t=>attemptsFor(t).find(a=>a.status==='in_progress');
const latestInProgress=()=>attemptsList().filter(a=>a.status==='in_progress').sort((a,b)=>b.updatedAt-a.updatedAt)[0];
function touch(at){at.updatedAt=Date.now();persist()}

/* ---------- XP, badges, streak, profile ---------- */
function addXP(n){S.xp=(S.xp||0)+Math.max(0,Math.floor(n));persist();return S.xp}
function awardBadge(key){if(!BADGES[key]||S.badges.includes(key))return false;S.badges.push(key);persistNow();return true}
function hasBadge(key){return S.badges.includes(key)}
const dayKey=(t=Date.now())=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function bumpStreak(){const today=dayKey(),y=dayKey(Date.now()-864e5);
  if(S.streak.last===today)return S.streak.count;
  S.streak.count=S.streak.last===y?S.streak.count+1:1;S.streak.last=today;persist();return S.streak.count}
function currentStreak(){const today=dayKey(),y=dayKey(Date.now()-864e5);return(S.streak.last===today||S.streak.last===y)?S.streak.count:0}
function cleanName(v){return String(v||'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,40)}
function setProfileName(v){const n=cleanName(v);if(!n)return false;S.profile.name=n;if(!S.profile.id)S.profile.id=uid('u');persistNow();return true}
const profileName=()=>S.profile.name||'';
/* =====================================================================
   AI — one place decides which AI answers in the Consult stage:
     'backend' : Gemini through the secure server (when the server says AI is ready)
     'live'    : Claude's own connection (only inside claude.ai)
     'demo'    : pre-written demonstration response (always labelled)
   The student never enters a key. Connecting the server later (API_BASE in
   api.js) switches Consult to 'backend' with no other change.
   ===================================================================== */
const AI={sample:null,downloads:null,checked:false};
async function initCaps(){
  try{if(window.claude&&typeof claude.use==='function'){AI.sample=await claude.use('sample');AI.downloads=await claude.use('downloads')}}catch(e){}
  AI.checked=true}
const aiMode=()=>API.caps.ai?'backend':(AI.sample?'live':'demo');
const aiModeLabel=m=>m==='backend'?'AI RESPONSE — LIVE (Gemini, via server)':m==='live'?'AI RESPONSE — LIVE (Claude)':'AI RESPONSE — DEMONSTRATION';
const FRAME='You are a general-purpose AI assistant. A student teacher of English has sent you the request below. Answer as you normally would, in plain prose only: 4 to 6 short paragraphs or about 6 to 8 sentences, no headings, no bullet points, no markdown formatting. Keep it under 230 words.\n\nRequest:\n';
function splitSegs(text){
  const clean=String(text).replace(/\*\*|__|`/g,'').replace(/^#{1,6}\s*/gm,'').replace(/^\s*[-*•]\s+/gm,'').replace(/^\s*\d+[.)]\s+/gm,'').trim();
  const paras=clean.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
  let segs=[];
  if(paras.length>=4&&paras.length<=10)segs=paras;
  else paras.forEach(p=>{(p.match(/[^.!?]+(?:[.!?]+["'”’)\]]*|$)\s*/g)||[p]).map(s=>s.trim()).filter(Boolean).forEach(s=>segs.push(s))});
  const merged=[];segs.forEach(s=>{if(merged.length&&W(s)<5)merged[merged.length-1]+=' '+s;else merged.push(s)});
  let out=merged;
  if(out.length>10){out=[];for(let i=0;i<merged.length;i+=2)out.push(merged.slice(i,i+2).join(' '))}
  return out.slice(0,12)}
const responseParas=t=>String(t||'').replace(/\*\*|__|`/g,'').split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);


function demoParas(t){const a=t.ai,out=[];for(let i=0;i<a.length;i+=2)out.push(a.slice(i,i+2).join(' '));return out.join('\n\n')}
function recordConsult(at,mode,prompt,text,segs,extra){
  const c=at.d.consult;
  if(c.response)c.history.push({prompt:c.prompt,mode:c.mode,response:c.response,ts:c.ts});
  c.prompt=prompt;c.mode=mode;c.response=text;c.segs=segs;c.ts=Date.now();c.extra=extra||null;
  at.d.critique.tags={};at.d.check.rows=[];at.d.check.seeded=false;touch(at)}
/* =====================================================================
   API CLIENT
   API_BASE is the address of the secure server (Cloudflare Worker, see
   backend/README.md). It is an address, not a secret. While it is empty
   the app works fully on its own: demonstration AI, and classes are
   explained but not available. Once it is set, the server reports what
   it has ready (Gemini key, class database) and the app switches those
   features on by itself.
   ===================================================================== */
const API_BASE='https://ai-ct-teacher-api.ai-ct-teacher-api.workers.dev';
const API={base:String(API_BASE||'').replace(/\/+$/,''),caps:{ai:false,classes:false,checked:false,checking:false,err:''}};

function apiErr(code,status){const e=new Error(code);e.code=code;e.status=status||0;return e}
async function apiFetch(path,o={}){
  if(!API.base)throw apiErr('not_configured',0);
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),o.timeout||15000);
  let res;
  try{res=await fetch(API.base+path,{method:o.method||'GET',signal:ctl.signal,
    headers:Object.assign({},o.body?{'content-type':'application/json'}:{},o.token?{authorization:'Bearer '+o.token}:{}),
    body:o.body?JSON.stringify(o.body):undefined})}
  catch(e){clearTimeout(timer);throw apiErr('network',0)}
  clearTimeout(timer);
  let data=null;try{data=await res.json()}catch(e){}
  if(!res.ok)throw apiErr((data&&typeof data.error==='string'&&data.error)||'server_error',res.status);
  return data||{}}

async function apiCheck(force){
  if(!API.base){API.caps.checked=true;return API.caps}
  if(API.caps.checking||(API.caps.checked&&!force&&!API.caps.err))return API.caps;
  API.caps.checking=true;
  try{const d=await apiFetch('/api/health',{timeout:8000});API.caps.ai=!!d.ai;API.caps.classes=!!d.classes;API.caps.err=''}
  catch(e){API.caps.ai=false;API.caps.classes=false;API.caps.err=e.code||'network'}
  API.caps.checking=false;API.caps.checked=true;return API.caps}

/* ---------- AI through the server ---------- */
async function askBackendAI(scenario,stage,studentResponse){
  const d=await apiFetch('/api/ai',{method:'POST',body:{scenario,stage,studentResponse},timeout:25000});
  if(typeof d.response!=='string'||!d.response.trim())throw apiErr('bad_response',0);
  return d}

/* ---------- links and codes ---------- */
function siteBase(){
  if(typeof location==='undefined')return '';
  return location.origin+location.pathname.replace(/(index\.html)?$/,'').replace(/app\/$/,'')}
const joinLink=code=>siteBase()+'#join='+code;
function parseClassCode(s){
  const t=String(s||'').trim();
  const m=t.match(/join=([A-Za-z0-9]{6})\b/);if(m)return m[1].toUpperCase();
  const c=t.replace(/[^A-Za-z0-9]/g,'').toUpperCase();return c.length===6?c:''}
const memberOf=code=>S.classes.find(c=>c.code===code);

/* ---------- student: join, leave ---------- */
async function classInfo(code){return apiFetch('/api/classes/'+code,{timeout:10000})}
async function joinClass(code,name){
  const ex=memberOf(code);if(ex)return ex;
  const d=await apiFetch('/api/classes/'+code+'/join',{method:'POST',body:{name}});
  const m={code,className:d.className,studentId:d.studentId,token:d.token,name:d.name,joinedAt:Date.now()};
  S.classes.push(m);if(!S.profile.name)setProfileName(d.name);persistNow();return m}
async function leaveClass(code,localOnly){
  const m=memberOf(code);if(!m)return;
  if(!localOnly)await apiFetch('/api/classes/'+code+'/me',{method:'DELETE',token:m.token});
  S.classes=S.classes.filter(c=>c.code!==code);S.outbox=S.outbox.filter(o=>o.code!==code);persistNow()}

/* ---------- student: results outbox (idempotent, retried until the server confirms) ---------- */
let flushing=false;
function queueResult(kind,ref,data){
  if(!S.classes.length)return 0;
  const at=Date.now();
  S.classes.forEach(m=>S.outbox.push({cid:uid('r'),code:m.code,kind,ref:String(ref||''),at,data}));
  persistNow();flushOutbox();return S.classes.length}
async function flushOutbox(){
  if(flushing||!API.base||!S.outbox.length)return;
  flushing=true;ui.sync.busy=true;
  try{
    for(const code of [...new Set(S.outbox.map(o=>o.code))]){
      const m=memberOf(code);
      if(!m){S.outbox=S.outbox.filter(o=>o.code!==code);continue}
      for(;;){
        const batch=S.outbox.filter(o=>o.code===code).slice(0,20);
        if(!batch.length)break;
        const ids=new Set(batch.map(o=>o.cid));
        try{
          await apiFetch('/api/classes/'+code+'/results',{method:'POST',token:m.token,body:{items:batch.map(o=>({cid:o.cid,kind:o.kind,ref:o.ref,at:o.at,data:o.data}))}});
          S.outbox=S.outbox.filter(o=>!ids.has(o.cid));ui.sync.err='';ui.sync.last=Date.now()}
        catch(e){
          if(e.status===401||e.status===403||e.status===404){S.classes=S.classes.filter(c=>c.code!==code);S.outbox=S.outbox.filter(o=>o.code!==code);ui.sync.err='class_gone';break}
          if(e.status===400){S.outbox=S.outbox.filter(o=>!ids.has(o.cid));continue}   // invalid item: drop it so it cannot block the queue
          ui.sync.err=e.code||'network';return}}}}
  finally{flushing=false;ui.sync.busy=false;persistNow();if(typeof refreshSyncChip==='function')refreshSyncChip()}}
function syncState(){
  if(!S.classes.length)return{text:'Not in a class',cls:''};
  if(S.outbox.length)return{text:ui.sync.err==='class_gone'?'Class no longer exists':`Waiting to send (${S.outbox.length})`,cls:'w'};
  return{text:'Results sent to your teacher',cls:'g'}}

/* ---------- teacher ---------- */
async function createClass(className,teacherName){
  const d=await apiFetch('/api/classes',{method:'POST',body:{className,teacherName}});
  const c={code:d.code,key:d.teacherKey,name:className,createdAt:Date.now()};
  S.teacherClasses=S.teacherClasses.filter(x=>x.code!==c.code);S.teacherClasses.push(c);persistNow();return c}
const teacherClass=code=>S.teacherClasses.find(c=>c.code===code);
async function fetchDashboard(code){const c=teacherClass(code);if(!c)throw apiErr('no_key',0);return apiFetch('/api/classes/'+code+'/dashboard',{token:c.key})}
async function deleteClass(code){const c=teacherClass(code);if(!c)return;await apiFetch('/api/classes/'+code,{method:'DELETE',token:c.key});S.teacherClasses=S.teacherClasses.filter(x=>x.code!==code);persistNow()}
async function removeStudent(code,sid){const c=teacherClass(code);if(!c)throw apiErr('no_key',0);return apiFetch('/api/classes/'+code+'/students/'+encodeURIComponent(sid),{method:'DELETE',token:c.key})}
function openClassWithKey(code,key,name){
  S.teacherClasses=S.teacherClasses.filter(x=>x.code!==code);S.teacherClasses.push({code,key:String(key).replace(/\s+/g,''),name:name||code,createdAt:Date.now()});persistNow()}
/* =====================================================================
   6C CORE — requirements to move on, transparent scoring, XP, badges,
   records and export.
   Scoring is stage-aligned: each of the six stages has three visible
   indicators, level = 1 + indicators met (1 to 4), total 6 to 24.
   These are LEARNING ACTIVITY INDICATORS, not a validated measure of
   critical thinking. When the AI answer is the pre-written demo, the
   indicators can use an answer key; for a live AI answer there is no
   key, so different indicators are used and the screen says so.
   ===================================================================== */
COMP.length=0;
[['context','Understanding the problem','Context'],['consult','Using AI as a source','Consult'],['critique','Analysing the AI response','Critique'],
 ['check','Verification and evidence','Check'],['challenge','Alternative perspective','Challenge'],['conclude','Final justification and reflection','Conclude']]
 .forEach((c,i)=>COMP.push({key:c[0],stage:i+1,name:c[1],short:c[2],about:c[1]}));
STAGES.forEach((s,i)=>{s.uz=UZ.stage[i]});
['Read the situation and think for yourself. No AI yet.','Ask the AI. Read its answer as a claim to examine, not as the truth. This is the only stage where AI is used.','Tap the parts of the answer that are convincing, questionable, or worth checking.','Check the claims: where would you look, what did you find, what is your verdict?','Make it better: choose or write an improvement and name its risk.','Decide whether to accept, modify or reject the AI answer. Explain, and say what you learned.']
 .forEach((t,i)=>{STAGES[i].task=t});
Object.assign(BADGES,{
  'sharp-eye':{icon:'👁️',name:'Sharp Eye',desc:'Found every weak part of a demonstration AI answer without marking solid parts as weak.'},
  'fact-checker':{icon:'🧾',name:'Fact Checker',desc:'Every verdict in a demonstration task matched the expected reading of the claim.'},
  'streak-3':{icon:'🔥',name:'3-Day Streak',desc:'Finished an activity on three days in a row.'}});
BADGES['first-step'].desc='Completed your first 6C activity.';
BADGES['ai-critic'].desc='Marked an AI claim as questionable or "check this", then checked it with a source and a verdict.';

const isDemo=at=>at.d.consult.mode==='demo';
const rowComplete=r=>!!r.sourceType&&!!r.verdict&&W(r.evidence)>=3;
function verdictScore(a,b){
  if(a===b)return 1;
  const close=(x,y)=>(x==='UNSUPPORTED'&&y==='UNCERTAIN')||(x==='UNCERTAIN'&&y==='UNSUPPORTED')||(x==='SUPPORTED'&&y==='PARTIALLY')||(x==='PARTIALLY'&&y==='SUPPORTED');
  return close(a,b)?0.5:0}
function checkAlignment(at){
  const rs=at.d.check.rows.filter(r=>rowComplete(r)&&r.exp);
  return rs.length?rs.reduce((a,r)=>a+verdictScore(r.verdict,r.exp),0)/rs.length:null}
function critiqueStats(at){
  const t=TASK_BY_ID[at.taskId],tags=at.d.critique.tags,keys=Object.keys(tags);
  const flagged=keys.filter(k=>tags[k]==='q'||tags[k]==='check').map(Number);
  const hit=flagged.filter(i=>t.flaws.includes(i)).length;
  return{tagged:keys.length,flagged:flagged.length,hit,falseFlags:flagged.length-hit,flaws:t.flaws.length}}
function defaultPrompt(t){
  const parts=t.context.match(/[^.?!]+[.?!]+/g)||[t.context];
  return 'I am an English teacher. '+parts.slice(0,3).join(' ').trim()+' What would you advise, and why?'}

function seedCheckRows(at){
  const c=at.d.check;if(c.seeded)return;c.seeded=true;
  const t=TASK_BY_ID[at.taskId],tags=at.d.critique.tags,mk=(seg,claim,exp,why)=>({id:uid('r'),seg,claim,sourceType:'',evidence:'',verdict:'',exp:exp||'',why:why||''});
  if(isDemo(at)){t.claims.forEach(cl=>c.rows.push(mk(cl.seg,cl.text,cl.verdict,cl.why)))}
  else{
    const ex=at.d.consult.extra;
    ((ex&&ex.claims)||[]).slice(0,3).forEach(text=>c.rows.push(mk(null,String(text).slice(0,300))));
    at.d.consult.segs.forEach((s,i)=>{if(tags[i]==='check'&&c.rows.length<4)c.rows.push(mk(i,excerpt(s,240)))});
    if(!c.rows.length){const q=Object.keys(tags).find(k=>tags[k]==='q');if(q!=null)c.rows.push(mk(+q,excerpt(at.d.consult.segs[+q]||'',240)))}}}

/* ---------- what is needed to move to the next stage (kept deliberately small) ---------- */
function reqs(at,stage){
  const d=at.d,o=[];
  if(stage===1)o.push({label:'Choose the main problem',ok:d.context.pick>=0},{label:'Write what you would do first (3+ words)',ok:W(d.context.first)>=3},{label:'Rate your confidence (1 to 5)',ok:d.context.conf>0});
  if(stage===2)o.push({label:'Ask the AI and read its answer',ok:!!d.consult.response});
  if(stage===3)o.push({label:'Mark at least 2 parts of the answer',ok:Object.keys(d.critique.tags).length>=2},{label:'Agree, partly agree or disagree',ok:!!d.critique.stance},{label:'Give your reason (4+ words)',ok:W(d.critique.reason)>=4});
  if(stage===4){const need=Math.min(2,Math.max(1,d.check.rows.length)),n=d.check.rows.filter(rowComplete).length;
    o.push({label:`Complete ${need} claim${need>1?'s':''}: source type, evidence (3+ words), verdict`,ok:n>=need})}
  if(stage===5)o.push({label:'Choose an improvement or write your own (5+ words)',ok:d.challenge.pick>=0||W(d.challenge.own)>=5},{label:'Say what could go wrong (3+ words)',ok:W(d.challenge.limit)>=3});
  if(stage===6)o.push({label:'Accept, modify or reject the AI answer',ok:!!d.conclude.decision},{label:'Explain your decision (5+ words)',ok:W(d.conclude.reasoning)>=5},{label:'Write what you learned (3+ words)',ok:W(d.conclude.learned)>=3},{label:'Rate your final confidence',ok:d.conclude.confidence>0});
  return o}
const stageOk=(at,s)=>reqs(at,s).every(r=>r.ok);
function canEnter(at,n){if(n>at.maxStage)return false;for(let s=1;s<n;s++)if(!stageOk(at,s))return false;return true}

/* ---------- scoring ---------- */
function computeAssessment(at){
  const d=at.d,t=TASK_BY_ID[at.taskId],demo=isDemo(at),ks=critiqueStats(at),rows=d.check.rows.filter(rowComplete),al=checkAlignment(at);
  const why=d.conclude.reasoning,link=/\b(because|since|so|but|however|although|if|therefore|which|as)\b/i,chk=/(check|source|evidence|verif|found)/i;
  const reason=d.critique.reason,ind=(l,ok,tip)=>({l,ok:!!ok,tip});
  const I=[
   [ind('Chose the most useful description of the problem',d.context.pick===t.q1.best,'Ask: what is the real problem, not only a symptom?'),
    ind('Wrote a first step of 5+ words',W(d.context.first)>=5,'Write a full, concrete first step.'),
    ind('First step uses a detail from the scenario',sharedCount(d.context.first,t.context)>=1,'Mention the level, class size, time or another detail.')],
   [ind('Asked the AI a question',!!d.consult.response,'Ask the AI before you judge it.'),
    ind('Question has 8+ words',W(d.consult.prompt)>=8,'A longer question gives the AI more to work with.'),
    ind('Question mentions details from the scenario',sharedCount(d.consult.prompt,t.context)>=2,'Include class level, size or the problem itself.')],
   demo?[ind('Found at least half of the weak parts',ks.hit/ks.flaws>=0.5,'Look for claims with no source, exact numbers, or words like always and never.'),
         ind('Did not mark many solid parts as weak',ks.flagged>0&&ks.falseFlags<=1,'Keep "questionable" for parts that really lack support.'),
         ind('Explained your position in 6+ words',!!d.critique.stance&&W(reason)>=6,'Give a full reason, not only a label.')]
       :[ind('Marked 3+ parts of the answer',ks.tagged>=3,'Mark more parts so you judge the whole answer.'),
         ind('Marked at least one part questionable or "check this"',ks.flagged>=1,'Good critique finds at least one thing to question.'),
         ind('Explained your position in 6+ words',!!d.critique.stance&&W(reason)>=6,'Give a full reason, not only a label.')],
   [ind('Completed 2+ claims with source type and verdict',rows.length>=2,'Check at least two claims.'),
    ind('Wrote evidence notes of 4+ words',rows.length>0&&rows.every(r=>W(r.evidence)>=4),'Say what you found or where you would look.'),
    demo?ind('Verdicts mostly match the expected reading',al!==null&&al>=0.5,'Claims with no source or absolute words are usually unsupported.')
        :ind('No claim marked Supported without a real source',rows.length>0&&!rows.some(r=>r.verdict==='SUPPORTED'&&r.sourceType==='Could not find a source'),'Supported needs a source you actually found.')],
   [ind('Chose an improvement or wrote your own',d.challenge.pick>=0||W(d.challenge.own)>=5,'Offer a better option.'),
    demo?ind('Chose the best-fitting improvement',d.challenge.pick===t.improve.best,'Choose the change that fits this class, time and level.')
        :ind('Wrote your own alternative of 8+ words',W(d.challenge.own)>=8,'Describe your alternative in a full sentence or two.'),
    ind('Named a risk of your change (4+ words)',W(d.challenge.limit)>=4,'Every change has a cost. Name one.')],
   [ind('Decided and explained in 6+ words',!!d.conclude.decision&&W(why)>=6,'Give a clear reason for accepting, modifying or rejecting.'),
    ind('Reason uses a link word or mentions checking',link.test(why)||chk.test(why),'Use because, since, but, or mention what you checked.'),
    ind('Wrote what you learned (4+ words) and rated confidence',W(d.conclude.learned)>=4&&d.conclude.confidence>0,'Say one thing you would do differently.')]];
  const items=COMP.map((c,i)=>{const met=I[i].filter(x=>x.ok).length;return{key:c.key,name:c.name,short:c.short,stage:i+1,indicators:I[i],met,level:1+met}});
  const total=items.reduce((a,b)=>a+b.level,0),max=24,mean=total/6;
  const band=mean<1.75?'Beginning':mean<2.5?'Developing':mean<3.25?'Proficient':'Advanced';
  const hi=Math.max(...items.map(i=>i.level)),lo=Math.min(...items.map(i=>i.level));
  const calib=d.conclude.confidence>=4&&demo&&al!==null&&al<0.5?'Your confidence was high, but your verdicts did not match the evidence. Next time, check before you feel sure.':'';
  return{items,total,max,pct:pct(total,max),mean,band,demo,ks,al,calib,even:hi===lo,hi,lo,
    strongest:hi>lo?items.filter(i=>i.level===hi):[],develop:hi>lo?items.filter(i=>i.level===lo):[]}}
const xpFor=a=>10+4*(a.total-6);
function profileText(a){
  const names=l=>l.map(i=>i.short).join(', ').replace(/, ([^,]*)$/,' and $1');
  if(a.even)return{strong:`Your stage profile is even (every stage at level ${a.hi}, ${LEVELS[a.hi]}).`,dev:'Choose the stage you want to strengthen next and compare with your own rating.'};
  return{strong:`Your current profile shows stronger performance in ${names(a.strongest)} (level ${a.hi}, ${LEVELS[a.hi]}).`,dev:`Further development may be useful in ${names(a.develop)} (level ${a.lo}, ${LEVELS[a.lo]}).`}}

/* ---------- finishing an activity ---------- */
function completeAttempt(at,opt){
  opt=opt||{};
  at.status='completed';at.completedAt=Date.now();
  const a=computeAssessment(at),t=TASK_BY_ID[at.taskId],xp=xpFor(a),badges=[];
  at.result={total:a.total,pct:a.pct,band:a.band,levels:a.items.map(i=>i.level),xp};
  if(!opt.sample){
    addXP(xp);bumpStreak();
    const tags=at.d.critique.tags;
    if(completedList().length===1&&awardBadge('first-step'))badges.push('first-step');
    if(a.band==='Advanced'&&awardBadge('deep-thinker'))badges.push('deep-thinker');
    if(at.d.check.rows.some(r=>r.seg!=null&&(tags[r.seg]==='q'||tags[r.seg]==='check')&&rowComplete(r))&&awardBadge('ai-critic'))badges.push('ai-critic');
    if(a.demo&&a.ks.hit===a.ks.flaws&&a.ks.falseFlags===0&&awardBadge('sharp-eye'))badges.push('sharp-eye');
    if(a.demo&&a.al===1&&at.d.check.rows.filter(r=>rowComplete(r)&&r.exp).length>=2&&awardBadge('fact-checker'))badges.push('fact-checker');
    if(currentStreak()>=3&&awardBadge('streak-3'))badges.push('streak-3');
    queueResult('6c',t.id,{task:t.id,total:a.total,max:24,pct:a.pct,band:a.band,levels:a.items.map(i=>i.level),decision:at.d.conclude.decision,conf:at.d.conclude.confidence,
      aiMode:at.d.consult.mode||'demo',xp,hit:a.demo?a.ks.hit:0,flaws:a.demo?a.ks.flaws:0,align:a.al===null?-1:Math.round(a.al*100)})}
  persistNow();return{assessment:a,xp,badges}}

/* ---------- sample record (built from the task's own answer key; no XP, no badges, never sent) ---------- */
function createSample(){
  const t=TASK_BY_ID.t1,at=newAttempt(t.id),d=at.d;
  d.context.pick=t.q1.best;d.context.first='Start with short pair tasks and agree a class rule about respecting mistakes.';d.context.conf=3;
  recordConsult(at,'demo',defaultPrompt(t),demoParas(t),t.ai.slice());
  t.ai.forEach((s,i)=>{d.critique.tags[i]=t.flaws.includes(i)?'q':(i<3?'ok':'')});Object.keys(d.critique.tags).forEach(k=>{if(!d.critique.tags[k])delete d.critique.tags[k]});
  d.critique.stance='partly';d.critique.reason='The pair work idea fits my class, but the statistic has no source and immediate correction would make students quieter.';
  at.stage=4;seedCheckRows(at);
  d.check.rows.forEach(r=>{r.sourceType='Academic book or textbook';r.evidence='I compared it with a methodology book and found no support.';r.verdict=r.exp});
  d.challenge.pick=t.improve.best;d.challenge.limit='Some students may still stay silent at first.';
  d.conclude.decision='modify';d.conclude.reasoning='I checked the claims and found no source, so I keep the pair work idea but change the correction and rewards.';d.conclude.learned='A confident answer can still contain an invented number.';d.conclude.confidence=4;
  at.stage=6;at.maxStage=6;at.sample=true;completeAttempt(at,{sample:true});return at}

/* ---------- structured records and export ---------- */
const VERDICT_LABEL={SUPPORTED:'Supported',PARTIALLY:'Partially supported',UNSUPPORTED:'Unsupported',UNCERTAIN:'Uncertain'};
function recordObject(at){
  const t=TASK_BY_ID[at.taskId],d=at.d,a=computeAssessment(at);
  return{recordId:at.id,sampleRecord:!!at.sample,status:at.status,startedAt:new Date(at.createdAt).toISOString(),completedAt:at.completedAt?new Date(at.completedAt).toISOString():null,
    student:S.profile.name||null,classCodes:S.classes.map(c=>c.code),
    task:{id:t.id,number:t.num,category:t.category,skill:t.skill,title:t.title,scenario:t.context},
    context:{mainProblemChoice:t.q1.options[d.context.pick]||null,correctChoice:d.context.pick===t.q1.best,firstStep:d.context.first,confidence:d.context.conf},
    consult:{mode:d.consult.mode==='backend'?'LIVE (Gemini, via server)':d.consult.mode==='live'?'LIVE (Claude)':'DEMONSTRATION (pre-written)',prompt:d.consult.prompt,response:d.consult.response,aiExtra:d.consult.extra},
    critique:{marks:d.consult.segs.map((s,i)=>({text:s,mark:({ok:'convincing',q:'questionable',check:'check-this'})[d.critique.tags[i]]||'unmarked',weakInAnswerKey:isDemo(at)?t.flaws.includes(i):null})),stance:d.critique.stance,reason:d.critique.reason},
    check:{note:'Verdicts are the student\'s own judgments; the platform does not verify sources.',rows:d.check.rows.map(r=>({claim:r.claim,sourceType:r.sourceType,evidence:r.evidence,verdict:r.verdict,expectedVerdict:r.exp||null}))},
    challenge:{improvement:t.improve.options[d.challenge.pick]||null,bestFit:d.challenge.pick===t.improve.best,own:d.challenge.own,risk:d.challenge.limit},
    conclude:{decision:d.conclude.decision,reasoning:d.conclude.reasoning,learned:d.conclude.learned,confidence:d.conclude.confidence},
    indicators:{method:'Stage-aligned activity indicators: level = 1 + indicators met (3 per stage). Not a validated measure of critical thinking.',levels:Object.fromEntries(a.items.map(i=>[i.key,i.level])),total:a.total,max:a.max,percentage:a.pct,band:a.band,xp:at.result?at.result.xp:null}}}
/* CSV cell: quotes escaped, and text that a spreadsheet could run as a formula (=, +, -, @) is neutralised with a leading apostrophe. Real numbers are left alone. */
const csvCell=v=>{const isNum=typeof v==='number'&&isFinite(v);v=v==null?'':String(v);
  if(!isNum&&/^[=+\-@\t\r]/.test(v))v="'"+v;
  return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function toCSV(list){
  const cols=['record_id','sample','student','class_codes','task_id','category','task','started','completed','ai_mode','ai_prompt','main_problem_correct','first_step','confidence_start','critique_stance','critique_reason','critique_marks_json','check_rows_json','improvement','improvement_best_fit','own_alternative','risk','decision','reasoning','learned','confidence_end',...COMP.map(c=>'level_'+c.key),'total','max','percent','band','xp'];
  const rows=list.map(at=>{const r=recordObject(at),a=computeAssessment(at);
    return[at.id,at.sample?'yes':'no',r.student,r.classCodes.join(' '),r.task.id,r.task.category,r.task.title,r.startedAt,r.completedAt,r.consult.mode,r.consult.prompt,r.context.correctChoice,r.context.firstStep,r.context.confidence,r.critique.stance,r.critique.reason,JSON.stringify(r.critique.marks),JSON.stringify(r.check.rows),r.challenge.improvement,r.challenge.bestFit,r.challenge.own,r.challenge.risk,r.conclude.decision,r.conclude.reasoning,r.conclude.learned,r.conclude.confidence,...a.items.map(i=>i.level),a.total,a.max,a.pct,a.band,r.indicators.xp].map(csvCell).join(',')});
  return[cols.join(','),...rows].join('\n')}
async function doExport(kind,id){
  const list=id?[S.attempts[id]]:completedList();
  if(!list.length){toast('No completed records to export yet');return}
  const stamp=new Date().toISOString().slice(0,10);
  const data=kind==='json'?JSON.stringify({prototype:'AI-CT TEACHER',exportedAt:new Date().toISOString(),note:'Pilot records from one student\'s device. Scores are learning-activity indicators, not validated measures.',records:list.map(recordObject)},null,2):toCSV(list);
  const filename=`ai-ct-teacher-${id?'record':'records'}-${stamp}.${kind}`;
  if(AI.downloads){try{await AI.downloads.save({filename,data});toast('Export ready');return}catch(e){if(e&&e.code==='declined')return}}
  try{const blob=new Blob([(kind==='csv'?'\ufeff':'')+data],{type:kind==='json'?'application/json':'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Export downloaded');return}catch(e){}
  await modal({title:'Copy your export',html:`<p class="small muted">Downloading is not available here. Copy the text into a file named <b>${esc(filename)}</b>.</p><pre class="export" tabindex="0">${esc(data.slice(0,60000))}</pre>`,actions:[{label:'Close',val:true}]})}
/* charts + demo dashboard */
function radarSVG(vals,labels,size=280){
  const c=size/2,R=size/2-44,n=vals.length,ang=i=>-Math.PI/2+i*2*Math.PI/n;
  const P=(i,v)=>{const r=R*v/4;return[c+r*Math.cos(ang(i)),c+r*Math.sin(ang(i))]};
  const ring=k=>vals.map((_,i)=>P(i,k).map(x=>x.toFixed(1)).join(',')).join(' ');
  const poly=vals.map((v,i)=>P(i,v).map(x=>x.toFixed(1)).join(',')).join(' ');
  return `<svg class="radar" viewBox="-40 0 ${size+80} ${size}" role="img" aria-label="Radar chart of component levels: ${labels.map((l,i)=>l+' '+vals[i].toFixed(1)).join(', ')}">
   ${[1,2,3,4].map(k=>`<polygon points="${ring(k)}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join('')}
   ${vals.map((_,i)=>{const[x,y]=P(i,4);return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/>`}).join('')}
   <polygon points="${poly}" fill="var(--primary)" fill-opacity=".18" stroke="var(--primary)" stroke-width="2"/>
   ${vals.map((v,i)=>{const[x,y]=P(i,v);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--primary)"/>`}).join('')}
   ${labels.map((l,i)=>{const a=ang(i),x=c+(R+14)*Math.cos(a),y=c+(R+14)*Math.sin(a)+4,cs=Math.cos(a);return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${Math.abs(cs)<.2?'middle':cs>0?'start':'end'}">${esc(l)}</text>`}).join('')}
   ${[1,2,3,4].map(k=>`<text x="${c+3}" y="${(c-R*k/4+3).toFixed(1)}" style="font-size:9px;fill:var(--ink-3)">${k}</text>`).join('')}</svg>`}
function lineSVG(pts,w=560,h=230,xl='Record'){
  if(!pts.length)return '';const l=40,r=14,t=14,b=32,iw=w-l-r,ih=h-t-b,n=pts.length;
  const X=i=>l+(n===1?iw/2:iw*i/(n-1)),Y=v=>t+ih*(1-v/100);
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img" aria-label="Line chart of percentage scores over ${xl}: ${pts.map(p=>p.label+' '+p.v+'%').join(', ')}">
   ${[0,25,50,75,100].map(v=>`<line x1="${l}" x2="${w-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${l-6}" y="${Y(v)+4}" text-anchor="end">${v}%</text>`).join('')}
   <polyline fill="none" stroke="var(--primary)" stroke-width="2.5" points="${pts.map((p,i)=>X(i)+','+Y(p.v)).join(' ')}"/>
   ${pts.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.v)}" r="4" fill="var(--primary)"/><text x="${X(i)}" y="${h-10}" text-anchor="middle">${esc(p.label)}</text>`).join('')}</svg>`}


function gameActivityHTML(){
  const rounds=S.methodRounds||[],comps=S.competitions||[];
  if(!rounds.length&&!comps.length)return'';
  const ap=rounds.length?Math.round(avg(rounds.map(r=>pct(r.correct,r.total)))):null,last=comps[comps.length-1];
  return `<div class="panel" style="margin-bottom:18px"><h3>🎮 Games <span class="en">Method Challenge and Team Competition</span></h3>
   <div class="grid3"><div class="stat"><b>${rounds.length}</b><span>Method Challenge rounds</span></div><div class="stat"><b>${ap===null?'–':ap+'%'}</b><span>average score</span></div><div class="stat"><b>${comps.length}</b><span>Team Competitions</span></div></div>
   ${last?`<p class="small muted" style="margin-top:8px">Last competition: ${last.mode} team${last.mode===1?'':'s'}, ${last.difficulty}${last.topic?', '+last.topic:''}. Scores: ${last.results.map(r=>esc(r.name)+' '+r.score).join(', ')}.</p>`:''}
   <p class="small muted">Game results are learning-activity data. They are not part of the 6C indicators.</p></div>`}

const DEMO=(()=>{const m=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296},rnd=m(20260924),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  const st=[];for(let i=1;i<=24;i++){const base=1.7+rnd()*1.5,bias=COMP.map(()=>(rnd()-.5)*1.0),n=2+Math.floor(rnd()*7),at=[];
    for(let k=0;k<n;k++){const wk=Math.min(8,1+Math.floor(k*8/n+rnd()*1.5));at.push({task:Math.floor(rnd()*8),week:wk,scores:COMP.map((_,c)=>cl(Math.round(base+bias[c]+k*.07+(rnd()-.5)*1.1),1,4))})}
    st.push({id:'S'+String(i).padStart(2,'0'),at})}return st})();
const sPct=s=>pct(s.reduce((a,b)=>a+b,0),24);
function teacherStats(taskFilter){
  const rows=DEMO.map(s=>{const at=s.at.filter(a=>taskFilter==='All'||TASKS[a.task].id===taskFilter);if(!at.length)return null;
    const cm=COMP.map((_,c)=>avg(at.map(a=>a.scores[c]))),ap=avg(at.map(a=>sPct(a.scores)));return{id:s.id,n:at.length,avg:ap,cm,low:COMP[cm.indexOf(Math.min(...cm))].name,at}}).filter(Boolean);
  return rows}
function viewTeacherDemo(){
  const rows=teacherStats(ui.tTask),allAt=rows.flatMap(r=>r.at),cm=COMP.map((_,c)=>avg(allAt.map(a=>a.scores[c])));
  const weeks=[1,2,3,4,5,6,7,8].map(w=>{const a=allAt.filter(x=>x.week===w);return a.length?{label:'W'+w,v:Math.round(avg(a.map(x=>sPct(x.scores))))}:null}).filter(Boolean);
  const comp=TASKS.map((t,i)=>({t,n:DEMO.filter(s=>s.at.some(a=>a.task===i)).length}));
  const {k,dir}=ui.tSort,sorted=[...rows].sort((a,b)=>{const va=k==='id'?a.id:k==='n'?a.n:k==='avg'?a.avg:k==='low'?a.low:a.cm[+k.slice(1)],vb=k==='id'?b.id:k==='n'?b.n:k==='avg'?b.avg:k==='low'?b.low:b.cm[+k.slice(1)];return(va>vb?1:va<vb?-1:0)*dir});
  const sel=rows.find(r=>r.id===ui.tStudent);
  const th=(key,l)=>`<th ${k===key?`aria-sort="${dir>0?'ascending':'descending'}"`:''}><button data-act="teacher-sort" data-k="${key}">${l}${k===key?(dir>0?' ▲':' ▼'):''}</button></th>`;
  return `<div class="page"><div class="page-head"><h1>Teacher dashboard</h1><p>A prototype of what a teacher-educator could see for a cohort: completion, performance and critical-thinking component profile.</p></div>
  <div class="demo-banner"><span class="chip demo">DEMO DATA</span><span><b>All figures on this page are randomly generated.</b> They show the layout only and have no evidential meaning. Your own records are on My progress.</span></div>
  <div class="notice w" style="margin-bottom:18px"><p><strong>How data works in this version.</strong> This dashboard is not connected to a shared database. Every student's records are stored only in that student's own browser, so a teacher cannot see live class data here. For a pilot, each student exports their records (JSON or CSV) from <b>My progress</b> and sends the file to the researcher or teacher. A real shared class dashboard would need a secure database and teacher sign-in, which this prototype does not include.</p></div>
  <div class="row" style="margin-bottom:18px"><div class="fld" style="min-width:260px"><label class="lab" for="tt">Task</label><select id="tt" data-sel="ttask"><option value="All">All tasks</option>${TASKS.map(t=>`<option value="${t.id}" ${ui.tTask===t.id?'selected':''}>Task ${t.num}: ${esc(t.title)}</option>`).join('')}</select></div></div>
  <div class="panel" style="margin-bottom:22px"><div class="grid4"><div class="stat"><b>${DEMO.length}</b><span>students enrolled (demo)</span></div><div class="stat"><b>${allAt.length}</b><span>completed task records</span></div><div class="stat"><b>${allAt.length?Math.round(avg(allAt.map(a=>sPct(a.scores))))+'%':'—'}</b><span>average performance</span></div><div class="stat"><b>${rows.length}</b><span>students with records${ui.tTask==='All'?'':' on this task'}</span></div></div></div>
  <div class="grid2" style="margin-bottom:22px"><div class="panel"><h3>Component profile (cohort mean)</h3>${allAt.length?radarSVG(cm,COMP.map(c=>c.short)):'<p class="muted">No records for this task.</p>'}<div class="stack" style="gap:8px;margin-top:10px">${COMP.map((c,i)=>`<div class="row" style="gap:10px;flex-wrap:nowrap"><span class="small" style="width:120px;flex:none">${c.name}</span><div class="bar" style="flex:1"><i style="width:${cm[i]/4*100}%"></i></div><span class="small num" style="width:28px;text-align:right">${cm[i].toFixed(1)}</span></div>`).join('')}</div></div>
  <div class="panel"><h3>Progress over time (weeks)</h3>${weeks.length?lineSVG(weeks,560,240,'weeks'):'<p class="muted">No data.</p>'}<p class="small muted">Mean percentage of rubric maximum for records completed each week.</p></div></div>
  <div class="panel" style="margin-bottom:22px"><h3>Task completion</h3><p class="small muted">Share of students who completed each task at least once.</p><div class="stack" style="gap:10px">${comp.map(c=>`<div class="row" style="gap:10px;flex-wrap:nowrap"><span class="small" style="width:min(240px,42%);flex:none">${c.t.num}. ${esc(c.t.title)}</span><div class="bar" style="flex:1"><i style="width:${pct(c.n,DEMO.length)}%"></i></div><span class="small num" style="width:44px;text-align:right">${pct(c.n,DEMO.length)}%</span></div>`).join('')}</div></div>
  <h2>Individual student results</h2><p class="small muted">Select a column to sort, or a row for detail. IDs are anonymised demo IDs.</p>
  <div class="tablewrap"><table><thead><tr>${th('id','Student')}${th('n','Records')}${th('avg','Average')}${COMP.map((c,i)=>th('c'+i,c.short)).join('')}${th('low','Development area')}</tr></thead><tbody>${sorted.map(r=>`<tr class="click" tabindex="0" data-act="teacher-student" data-id="${r.id}" ${ui.tStudent===r.id?'style="background:var(--primary-soft)"':''}><td><b>${r.id}</b></td><td class="num">${r.n}</td><td class="num">${Math.round(r.avg)}%</td>${r.cm.map(v=>`<td class="num">${v.toFixed(1)}</td>`).join('')}<td>${esc(r.low)}</td></tr>`).join('')||'<tr><td colspan="10">No students have records for this task.</td></tr>'}</tbody></table></div>
  ${sel?`<div class="panel" style="margin-top:22px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Student ${sel.id} <span class="chip demo">DEMO DATA</span></h3><button class="btn quiet sm" data-act="teacher-student" data-id="">Close</button></div><div class="grid2"><div>${radarSVG(sel.cm,COMP.map(c=>c.short),260)}</div><div>${lineSVG(sel.at.map((a,i)=>({label:'#'+(i+1),v:sPct(a.scores)})),480,220,'records')}<p class="small muted">Records in order. Average ${Math.round(sel.avg)}%. Lowest component: ${esc(sel.low)}.</p></div></div></div>`:''}</div>`}

/* =====================================================================
   SHELL + MAIN PAGES
   ===================================================================== */
const curAttempt=()=>S.attempts[ui.params.attemptId];
const MARK=`<span class="mark" aria-hidden="true"><span>AI<b>–</b>CT</span></span>`;
const AUTHOR_NAME='SARVINOZ SOLEXONOVNA', INSTITUTION='Samarkand State Institute of Foreign Languages (SamDChTI)';
const statusOf=t=>{const ip=inProgressFor(t.id),done=attemptsFor(t.id).filter(a=>a.status==='completed');
  if(ip)return{chip:`<span class="chip w">In progress, stage ${ip.stage} of 6</span>`,ip,done};
  if(done.length)return{chip:`<span class="chip g">Completed${done.length>1?' ×'+done.length:''}</span>`,ip:null,done};
  return{chip:`<span class="chip">New</span>`,ip:null,done}};
const bandChip=b=>`<span class="chip ${b==='Advanced'?'g':b==='Proficient'?'p':b==='Developing'?'w':''}">${b}</span>`;
function empty(title,text,btns=''){return `<div class="empty"><h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="row" style="justify-content:center">${btns}</div></div>`}
const xpPillHTML=()=>`<span class="xp-pill" id="xpPill">⭐ ${S.xp||0} XP</span>`;
function badgeHTML(key,anim){const b=BADGES[key];if(!b)return'';return `<span class="badge ${anim?'new':''}" title="${esc(b.desc)}">${b.icon} ${esc(b.name)}</span>`}
const soundBtn=()=>`<button class="ic-btn" data-act="sound" aria-pressed="${sndEnabled()}" aria-label="Sound on or off" title="Sound on / off">${sndEnabled()?'🔊':'🔇'}</button>`;

/* ---------- navigation ---------- */
const NAV=[['home','🏠','home','Home'],['library','📚','tasks','Tasks'],['cycle','🧭','cycle','6C cycle'],['methods','🎓','methods','Method Challenge'],
  ['competition','🏆','comp','Team Competition'],['progress','📈','progress','My progress'],['about','ℹ️','about','About the project']];
const navBtn=(k,ic,uzk,en,page)=>`<button data-go="${k}" ${page===k?'aria-current="page"':''}><span class="nav-ic" aria-hidden="true">${ic}</span><span class="nav-tx"><b>${UZ.nav[uzk]}</b><small>${en}</small></span></button>`;
function brandHTML(){
  return `<div class="brandbox"><button class="brand" data-go="home" aria-label="AI-CT TEACHER, go to home">${MARK}<span class="brand-tt">AI-CT TEACHER</span></button>
   <div class="authorcard" aria-label="Author"><span class="ac-role">PhD RESEARCHER <i>·</i> ${UZ.role}</span><span class="ac-name">${AUTHOR_NAME}</span><span class="ac-inst">${INSTITUTION}</span></div></div>`}
function renderShell(){
  const page=ui.page==='record'||ui.page==='assessment'?(ui.page==='assessment'?'library':'progress'):ui.page==='dashboard'||ui.page==='history'?'progress':ui.page;
  const inClass=S.classes.length?`<span class="chip g">In class: ${esc(S.classes.map(c=>c.className||c.code).join(', '))}</span>`:'';
  $('#side').innerHTML=`${brandHTML()}
   <nav class="nav" aria-label="Pages">${NAV.map(n=>navBtn(n[0],n[1],n[2],n[3],page)).join('')}<div class="sep"></div><div class="grp">${UZ.forTeachers} · For teachers</div>${navBtn('teacher','👩‍🏫','teacher','Teacher dashboard',page)}</nav>
   <div class="side-foot"><div class="tools">${soundBtn()}<button class="ic-btn" data-act="projector" aria-pressed="${!!S.prefs.projector}" title="Projector mode: larger text for interactive whiteboards">📽️</button><button class="ic-btn" data-act="fullscreen" title="Full screen">⛶</button><button class="ic-btn" data-act="theme" title="Light / dark">🌓</button></div>
    ${inClass}<span id="storeState">${storageOk?'Saved in this browser':'Memory only (not persistent)'}</span></div>`;
  $('#topbar').innerHTML=`${MARK}<span class="tb-t"><strong class="serif">AI-CT TEACHER</strong><span class="tb-a">PhD researcher · <b>${AUTHOR_NAME}</b></span></span>${soundBtn()}<button class="menu" data-act="menu" aria-expanded="${ui.menu}" aria-controls="side">☰</button>`;
  let b=$('#bnav');if(!b){b=document.createElement('nav');b.id='bnav';b.className='bnav';b.setAttribute('aria-label','Quick navigation');document.body.appendChild(b)}
  b.innerHTML=[['home','🏠','home'],['library','📚','tasks'],['methods','🎓','methods'],['competition','🏆','comp'],['progress','📈','progress']].map(([k,ic,u])=>`<button data-go="${k}" ${page===k?'aria-current="page"':''}><span aria-hidden="true">${ic}</span><small>${UZ.bn[u]}</small></button>`).join('');
  $('#side').classList.toggle('open',ui.menu);$('#scrim').classList.toggle('hidden',!ui.menu)}

/* ---------- HOME ---------- */
const STAGE_ICONS=['📖','🤖','🧐','🧾','💡','✅'];
function greetHTML(){
  const n=profileName(),st=currentStreak(),ip=latestInProgress();
  if(!n)return `<section class="panel greet"><div><h3>${UZ.home.hello}! 👋 <span class="en">Welcome</span></h3><p class="muted">${UZ.home.nameAsk} <span class="en">— write your name to keep your own progress.</span></p>
    <div class="namerow"><input id="nameIn" type="text" maxlength="40" autocomplete="nickname" placeholder="${UZ.home.namePh}" aria-label="Your name"><button class="btn" data-act="profile-save">${UZ.home.save}</button></div><p class="hint">${UZ.home.nameHint}</p></div></section>`;
  return `<section class="panel greet"><div><h3>${UZ.home.hello}, ${esc(n)}! 👋</h3><div class="row" style="gap:8px;margin-top:8px">${xpPillHTML()}<span class="chip ${st?'w':''}">🔥 ${st} ${UZ.home.days}</span><span class="chip">🏅 ${S.badges.length}/${Object.keys(BADGES).length}</span>${S.classes.length?`<span class="chip g">👥 ${esc(S.classes[0].className||S.classes[0].code)}</span>`:''}</div></div>
   ${ip?`<button class="btn" data-act="continue" data-attempt="${ip.id}">${UZ.home.cont} ▶ <small>Continue: ${esc(TASK_BY_ID[ip.taskId].title)}</small></button>`:`<button class="btn" data-act="random-task">🎲 ${UZ.home.random}</button>`}</section>`}
function viewHome(){
  const tiles=[['library','📚','tasks','Tasks',UZ.tiles.tasks],['cycle','🧭','cycle','6C cycle',UZ.tiles.cycle],['methods','🎓','methods','Method Challenge',UZ.tiles.methods],['competition','🏆','comp','Team Competition',UZ.tiles.comp],['progress','📈','progress','My progress',UZ.tiles.progress],['teacher','👩‍🏫','teacher','Teacher dashboard',UZ.tiles.teacher]];
  return `<div class="page home">
   <section class="hero"><span class="orb o1" aria-hidden="true"></span><span class="orb o2" aria-hidden="true"></span><span class="orb o3" aria-hidden="true"></span>
    <div class="hero-in"><p class="eyebrow">${UZ.home.eyebrow}</p><h1 class="hero-t">AI-CT TEACHER</h1>
     <p class="hero-s">Artificial Intelligence – Critical Thinking for Future English Teachers</p><p class="hero-uz">${UZ.home.sub}</p>
     <div class="hero-flow" aria-label="The 6C cycle">${STAGES.map((s,i)=>`<span class="hf ${s.key==='consult'?'ai':''}" style="animation-delay:${i*90}ms"><span aria-hidden="true">${STAGE_ICONS[i]}</span><b>${s.n}</b> ${s.name}</span>`).join('')}</div>
     <div class="hero-author"><span class="ha-l">PhD RESEARCHER · ${UZ.role}</span><span class="ha-n">${AUTHOR_NAME}</span><span class="ha-i">${INSTITUTION}</span></div></div></section>
   ${greetHTML()}
   <h2 class="h-choose">${UZ.home.choose} <span class="en">What would you like to do?</span></h2>
   <div class="tiles">${tiles.map(([k,ic,u,en,d],i)=>`<button class="tile" data-go="${k}" style="animation-delay:${i*70}ms"><span class="tile-ic" aria-hidden="true">${ic}</span><span class="tile-t">${UZ.nav[u]}</span><span class="tile-en">${en}</span><span class="tile-d">${d}</span></button>`).join('')}</div>
   <section class="panel steps6"><h3>${UZ.home.how} <span class="en">How it works, in 6 steps</span></h3><ol class="s6">${STAGES.map((s,i)=>`<li class="${s.key==='consult'?'ai':''}"><span class="s6-ic" aria-hidden="true">${STAGE_ICONS[i]}</span><div><b>${s.n}. ${s.name} <em>${UZ.stage[i].n}</em></b><p>${esc(s.task)}</p><p class="uz">${UZ.stage[i].t}</p></div></li>`).join('')}</ol>
    <p class="small muted">${UZ.home.aiNote}</p></section>
   <section class="panel"><h3>${UZ.home.what}</h3><p>${UZ.home.whatP}</p><p class="muted small">AI-CT TEACHER is an electronic methodological prototype that helps future English teachers learn to analyse, verify and challenge AI output instead of accepting it. <button class="linkbtn" data-go="about">${UZ.home.more} · Read more</button></p></section></div>`}

/* ---------- ABOUT (Uzbek and English) ---------- */
const ABOUT_EN=[
 {h:'What is AI-CT TEACHER?',p:['AI-CT TEACHER is an electronic methodological prototype for developing future English teachers\' critical thinking through structured interaction with artificial intelligence.','Most tools give students an answer to accept. This one treats AI as an object of critical analysis: students think first, consult AI once, then examine, verify and challenge what it said, and record their own accountable decision.']},
 {h:'The AI-CT 6C cycle',p:[],table:true},
 {h:'How AI is used',p:['AI is used only in the Consult stage. Where a secure AI service is connected, the answer comes from Gemini through a server; the API key is kept on the server and students never enter a key. Where it is not connected, the app shows a pre-written demonstration answer that is always labelled "DEMONSTRATION" and does not react to your question.','AI answers can contain mistakes. Finding them is the skill being practised.']},
 {h:'Scores and feedback',p:['Each of the six stages has three visible indicators. Level = 1 + the indicators you met (1 to 4); the total is 6 to 24. You can always see exactly why a level was given.','These are learning-activity indicators. They show whether elements of critical thinking are present in your work; they are not a validated psychological test and cannot judge the quality of an idea.']},
 {h:'Classes for teachers and students',p:['A teacher can create a class, share a link, and see the scores of students who join. Students write a name (it can be a nickname) and join by link.','Only scores are sent to the class: task, level in each stage, totals, XP and game results. Your written answers stay on your own device. You can leave a class at any time.','Classes need the secure server to be connected. Until then, this part of the app explains what it will do.']},
 {h:'Research use and limits',p:['This is a research prototype, not an official product of any institution. For research use, trained human raters should score records with the same rubric, and scientific validity comes from the study design, sample and analysis, not from the software alone.']}];
const UZ_CYCLE_ROWS=()=>STAGES.map((s,i)=>`<tr><td><b>${s.n} ${s.name}</b> <em>${UZ.stage[i].n}</em></td><td>${esc(s.task)}</td><td>${UZ.stage[i].t}</td></tr>`).join('');
function viewAbout(){
  const uz=ui.aboutLang==='uz',src=uz?UZ.about:ABOUT_EN;
  return `<div class="page prose"><div class="page-head"><h1>${uz?UZ.aboutTitle:'About the project'}</h1><p>${uz?UZ.aboutLead:'An electronic methodological prototype for developing critical thinking through structured interaction with AI.'}</p></div>
   <div class="tabs" role="tablist" aria-label="Language"><button role="tab" aria-selected="${uz}" data-act="about-lang" data-lang="uz">Oʻzbekcha</button><button role="tab" aria-selected="${!uz}" data-act="about-lang" data-lang="en">English</button></div>
   <div class="about-id"><div class="author"><span class="author-l">PhD RESEARCHER · ${UZ.role}</span><span class="author-n">${AUTHOR_NAME}</span></div><div class="author"><span class="author-l">${uz?UZ.institution:'INSTITUTION'}</span><span class="author-n">${INSTITUTION}</span></div></div>
   <p class="diss"><b>${uz?UZ.dissLabel:'Dissertation topic'}:</b> <em>${UZ.dissertation}</em></p>
   ${src.map(s=>`<h3>${s.h}</h3>${(s.p||[]).map(p=>`<p>${p}</p>`).join('')}${s.table?`<div class="tablewrap"><table><thead><tr><th>${uz?UZ.cols[0]:'Stage'}</th><th>${uz?UZ.cols[1]:'What the student does'}</th><th>${uz?UZ.cols[2]:'Oʻzbekcha'}</th></tr></thead><tbody>${UZ_CYCLE_ROWS()}</tbody></table></div><p class="muted small">${uz?UZ.cycleNote:'Exactly six stages, always in this order. Reflection is the closing part of Conclude.'}</p>`:''}`).join('')}</div>`}

/* ---------- MY PROGRESS (student account) ---------- */
function syncChipHTML(){const s=syncState();return `<span class="chip ${s.cls}" id="syncChip">${s.text}</span>`}
function refreshSyncChip(){const e=$('#syncChip');if(e)e.outerHTML=syncChipHTML()}
function classBoxHTML(){
  const mem=S.classes.map(m=>`<div class="row" style="justify-content:space-between;gap:10px"><div><b>${esc(m.className||m.code)}</b> <span class="chip">${esc(m.code)}</span><div class="small muted">You joined as ${esc(m.name)}</div></div><button class="btn quiet sm" data-act="leave-class" data-code="${m.code}">Leave</button></div>`).join('');
  return `<div class="panel"><h3>${UZ.cls.title} <span class="en">My class</span></h3>${mem||`<p class="muted small">${UZ.cls.none}</p>`}
   <div class="row" style="margin-top:10px;gap:10px;flex-wrap:wrap"><input id="joinIn" type="text" maxlength="200" placeholder="${UZ.cls.ph}" aria-label="Class code or link" style="flex:1;min-width:200px"><button class="btn" data-act="join-open">${UZ.cls.join}</button></div>
   <div class="row" style="margin-top:10px;gap:8px">${syncChipHTML()}<span class="small muted">${UZ.cls.privacy}</span></div></div>`}
function viewProgress(){
  const done=completedList().filter(a=>!a.sample),all=completedList(),ips=attemptsList().filter(a=>a.status==='in_progress'),name=profileName();
  const as=done.map(a=>({a,r:computeAssessment(a)})),cm=COMP.map((_,c)=>as.length?avg(as.map(x=>x.r.items[c].level)):0);
  return `<div class="page"><div class="page-head"><h1>${UZ.nav.progress} <span class="en">My progress</span></h1><p>${UZ.progLead}</p></div>
   <div class="grid2" style="margin-bottom:18px"><div class="panel"><h3>${UZ.prof.title} <span class="en">My account</span></h3>
     <div class="namerow"><input id="nameIn" type="text" maxlength="40" value="${esc(name)}" placeholder="${UZ.home.namePh}" aria-label="Your name"><button class="btn" data-act="profile-save">${name?UZ.prof.update:UZ.home.save}</button></div>
     <p class="hint">${UZ.prof.note}</p>
     <div class="grid3" style="margin-top:10px"><div class="stat"><b>${S.xp||0}</b><span>XP</span></div><div class="stat"><b>🔥 ${currentStreak()}</b><span>${UZ.home.days}</span></div><div class="stat"><b>${done.length}</b><span>6C activities</span></div></div></div>${classBoxHTML()}</div>
   <div class="panel" style="margin-bottom:18px"><h3>${UZ.badges} <span class="en">Badges</span></h3><div class="badge-row">${Object.entries(BADGES).map(([k,b])=>{const e=hasBadge(k);return `<span class="badge ${e?'':'locked'}" title="${esc(b.desc)}">${b.icon} ${esc(b.name)}${e?'':' 🔒'}</span>`}).join('')}</div><p class="small muted" style="margin-top:8px">Hover or tap a badge to see how to earn it.</p></div>
   ${ips.length?`<h2>In progress</h2><div class="stack" style="margin-bottom:20px">${ips.map(a=>`<div class="panel row" style="justify-content:space-between"><div><b>Task ${TASK_BY_ID[a.taskId].num}: ${esc(TASK_BY_ID[a.taskId].title)}</b><div class="muted small">Stage ${a.stage} of 6, ${STAGES[a.stage-1].name}</div></div><button class="btn" data-act="continue" data-attempt="${a.id}">Continue</button></div>`).join('')}</div>`:''}
   ${done.length?`<div class="grid2" style="margin-bottom:18px"><div class="panel"><h3>${UZ.profile6c} <span class="en">My 6C profile (average level)</span></h3>${radarSVG(cm,COMP.map(c=>c.short))}<p class="small muted">Level 1 (Beginning) to 4 (Advanced), averaged over your activities. Learning-activity indicators, not a validated test.</p></div>
     <div class="panel"><h3>${UZ.recent} <span class="en">Recent activities</span></h3><div class="stack" style="gap:8px">${done.slice(-6).reverse().map(a=>{const t=TASK_BY_ID[a.taskId],r=a.result||{};return `<div class="row act-row"><div><b>${esc(t.title)}</b><div class="small muted">${fmtDate(a.completedAt)} · ${r.total||'–'}/24 · ${bandChip(r.band||'Beginning')}</div></div><div class="row" style="gap:6px"><button class="btn quiet sm" data-go="assessment" data-id="${a.id}">Result</button><button class="btn quiet sm" data-go="record" data-id="${a.id}">Record</button></div></div>`}).join('')}</div></div></div>
     <div class="panel" style="margin-bottom:18px"><h3>${UZ.learned} <span class="en">What I learned</span></h3><ul class="learned">${done.slice(-8).reverse().map(a=>`<li><b>${esc(TASK_BY_ID[a.taskId].title)}:</b> ${esc(a.d.conclude.learned)}</li>`).join('')}</ul></div>`
    :empty(UZ.nothing,UZ.nothingP,`<button class="btn" data-go="library">${UZ.nav.tasks}</button><button class="btn quiet" data-act="sample">Load a sample record</button>`)}
   ${gameActivityHTML()}
   <div class="panel"><h3>${UZ.exportT} <span class="en">Export and data</span></h3><p class="small muted">${UZ.exportP}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-act="export" data-kind="json" ${all.length?'':'disabled'}>Export JSON</button><button class="btn" data-act="export" data-kind="csv" ${all.length?'':'disabled'}>Export CSV</button><button class="btn quiet" data-act="sample">Load sample record</button><button class="btn danger" data-act="reset">Delete all my data</button></div>
    ${S.legacy?`<p class="small muted" style="margin-top:8px">${S.legacy} record(s) from an older version of the app are kept on this device but are not shown.</p>`:''}</div></div>`}

/* ---------- TASK LIBRARY ---------- */
const catTasks=key=>TASKS.filter(t=>t.category===key);
const catProgress=key=>{const ts=catTasks(key),done=ts.filter(t=>attemptsFor(t.id).some(a=>a.status==='completed')).length;return{total:ts.length,done}};
function taskCard(t){const s=statusOf(t);
  return `<article class="task"><div class="tn" aria-hidden="true">${t.num}</div><div><h3>${esc(t.title)}</h3><p>${esc(t.blurb)}</p><div class="meta"><span class="chip p">${esc(t.skill)}</span><span class="chip">${esc(t.mins)}</span>${s.chip}</div></div>
   <div class="acts">${s.ip?`<button class="btn" data-act="continue" data-attempt="${s.ip.id}">Continue</button>`:`<button class="btn" data-act="start-task" data-task="${t.id}">${s.done.length?'Again':'Start'} ▶</button>`}</div></article>`}
function viewLibrary(){
  if(!ui.libCategory)return viewLibraryCategories();
  const cat=CAT_BY_KEY[ui.libCategory];if(!cat){ui.libCategory=null;return viewLibraryCategories()}
  return `<div class="page"><div class="page-head"><button class="btn quiet sm" data-act="lib-back" style="margin-bottom:14px">← All categories</button><h1>${cat.icon} ${esc(cat.name)} <span class="en">${UZ.cat[cat.key]}</span></h1><p>${esc(cat.desc)}</p></div><div class="tasks">${catTasks(cat.key).map(taskCard).join('')}</div></div>`}
function viewLibraryCategories(){
  return `<div class="page"><div class="page-head"><h1>${UZ.nav.tasks} <span class="en">Task library</span></h1><p>${TASKS.length} ${UZ.libLead}</p><button class="btn ghost" data-act="random-task">🎲 ${UZ.home.random}</button></div>
   <div class="cat-grid">${CATEGORIES.map((c,i)=>{const p=catProgress(c.key);return `<button class="cat-card" data-act="lib-open" data-cat="${c.key}" style="animation-delay:${i*50}ms" aria-label="${esc(c.name)}: ${p.total} tasks, ${p.done} completed"><span class="cat-icon" aria-hidden="true">${c.icon}</span><span class="cat-name">${esc(c.name)}</span><span class="cat-uz">${UZ.cat[c.key]}</span><span class="cat-desc">${esc(c.desc)}</span><span class="cat-meta"><span class="cat-count">${p.total} tasks</span>${p.done?`<span class="cat-done">${p.done} done</span>`:''}</span></button>`}).join('')}</div></div>`}

function footerHTML(){return `<footer class="site-foot"><div class="author sm"><span class="author-l">PhD RESEARCHER</span><span class="author-n">${AUTHOR_NAME}</span></div><div class="author sm"><span class="author-l">INSTITUTION</span><span class="author-n">${INSTITUTION}</span></div><p class="ft"><b>AI-CT TEACHER</b> · Research prototype. ${UZ.footNote}</p></footer>`}
/* =====================================================================
   6C VIEWS — six short, interactive stages. Choices and taps first,
   small text fields second. Uzbek hints sit under every stage.
   ===================================================================== */
const scaleHTML=(at,path,label,l,r)=>{const v=+getPath(at.d,path)||0,id='sc-'+path.replace(/\./g,'-');
  return `<div class="fld"><span class="lab" id="${id}">${esc(label)}</span><div class="scale" role="group" aria-labelledby="${id}">${[1,2,3,4,5].map(n=>`<button type="button" data-scale="${path}" data-val="${n}" aria-pressed="${v===n}">${n}</button>`).join('')}</div><div class="scale-l"><span>${esc(l)}</span><span>${esc(r)}</span></div></div>`};
function fld2(at,path,o){const v=getPath(at.d,path)||'',n=W(v),min=o.min||0,id='f-'+path.replace(/\./g,'-');
  return `<div class="fld"><label class="lab" for="${id}">${esc(o.label)}</label>${o.hint?`<p class="hint">${esc(o.hint)}</p>`:''}<textarea id="${id}" rows="${o.rows||2}" data-b="${path}" placeholder="${esc(o.ph||'')}" maxlength="600">${esc(v)}</textarea><div class="cnt ${n>=min?'ok':''}" data-cnt="${path}" data-min="${min}">${min?`${n} / ${min}+ words`:`${n} words`}</div></div>`}
const choiceHTML=(label,cls,act,i,extra='')=>`<button type="button" class="choice ${cls}" data-act="${act}" data-i="${i}" ${extra}><span class="ch-k" aria-hidden="true">${'ABC'[i]}</span><span>${esc(label)}</span></button>`;
const scenarioCard=t=>`<article class="card scen"><p>${esc(t.context)}</p></article>`;

/* ---------- Stage 1: Context ---------- */
function stage1(at){
  const t=TASK_BY_ID[at.taskId],c=at.d.context,q=t.q1,locked=c.pick>=0;
  return `${scenarioCard(t)}
   <div class="card"><h3>${esc(q.ask)}</h3><div class="choices" role="group" aria-label="${esc(q.ask)}">${q.options.map((o,i)=>choiceHTML(o,(c.pick===i?'sel ':'')+(locked&&i===q.best?'right ':'')+(locked&&c.pick===i&&i!==q.best?'miss':''),'pick1',i,locked?'aria-disabled="true"':'')).join('')}</div>
    ${locked?`<p class="fb ${c.pick===q.best?'g':'w'}" role="status">${c.pick===q.best?'✓ Good thinking. ':'Not the best choice. '}${esc(q.why)}</p>`:`<p class="hint">Choose one. You can only choose once, so go with your first thought.</p>`}</div>
   <div class="card">${fld2(at,'context.first',{label:'What would you do first? (1 sentence)',min:3,ph:'First I would…'})}${scaleHTML(at,'context.conf','How sure are you of your choice?','1 = not sure','5 = very sure')}</div>`}

/* ---------- Stage 2: Consult (the only AI stage) ---------- */
function aiStatusHTML(){const m=aiMode();
  return m==='backend'?'<b>🟢 Live AI (Gemini) is connected.</b> You never enter an API key. Live answers can still contain errors.'
   :m==='live'?'<b>🟢 Live AI (Claude) is available in this view.</b> Live answers can still contain errors.'
   :'<b>🟡 Demonstration mode.</b> This answer is pre-written and does not react to your question. When the secure AI service is connected, this button will use live AI automatically.'}
const aiParas=t=>responseParas(t).map(p=>`<p>${esc(p)}</p>`).join('');
function aiExtraHTML(x){if(!x||(!x.claims.length&&!x.assumptions.length&&!x.uncertainty&&!x.followUp))return'';
  return `<div class="ai-foot" style="display:grid;gap:8px">${x.claims.length?`<div><b>Claims worth checking:</b> ${x.claims.map(esc).join('; ')}</div>`:''}${x.assumptions.length?`<div><b>Possible assumptions:</b> ${x.assumptions.map(esc).join('; ')}</div>`:''}${x.uncertainty?`<div><b>The AI is least sure about:</b> ${esc(x.uncertainty)}</div>`:''}${x.followUp?`<div><b>The AI asks:</b> ${esc(x.followUp)}</div>`:''}</div>`}
function aiOutHTML(at){
  const c=at.d.consult;
  if(ui.streaming)return `<div class="ai-box"><div class="ai-label"><span>${aiModeLabel(aiMode())}</span></div><div class="ai-body">${ui.stream?aiParas(ui.stream):`<span class="thinking" aria-live="polite">Thinking <i></i><i></i><i></i></span>`}</div></div>`;
  const err=ui.aiErr?`<div class="notice b"><p>${esc(ui.aiErr)}</p></div>`:'';
  if(!c.response)return `${err}<div class="empty"><p class="muted">Press "Ask AI". The answer appears here as material to examine.</p></div>`;
  const live=c.mode==='live'||c.mode==='backend';
  return `${err}<div class="ai-box"><div class="ai-label"><span>${aiModeLabel(c.mode)}</span><span class="small">${fmtTime(c.ts)}</span></div><div class="ai-body">${aiParas(c.response)}</div><div class="ai-foot">${live?'Generated from your question. AI output can contain mistakes, including invented facts and sources.':'Pre-written for this task with deliberate weak points. No live AI was used.'}</div>${aiExtraHTML(c.extra)}</div>
   <div class="notice"><p><strong>This page does not say whether the answer is right.</strong> Judging it is your work in the next stages. <span class="uz">${UZ.consultNote}</span></p></div>`}
function stage2(at){
  const t=TASK_BY_ID[at.taskId],c=at.d.consult,has=!!c.response,m=aiMode(),n=W(c.prompt);
  return `${scenarioCard(t)}
   <div class="card ai-card"><div class="ai-status" id="aiStatus">${aiStatusHTML()}</div>
    <div class="fld"><label class="lab" for="f-consult-prompt">Your question to the AI (you can change it)</label><textarea id="f-consult-prompt" rows="4" data-b="consult.prompt" maxlength="900">${esc(c.prompt)}</textarea><div class="cnt ${n>=4?'ok':''}" data-cnt="consult.prompt" data-min="4">${n} words</div></div>
    <div class="row" style="gap:10px;flex-wrap:wrap" id="aiCtl">${aiCtlHTML(at)}</div></div>
   <div id="aiOut" aria-live="polite">${aiOutHTML(at)}</div>`}
function aiCtlHTML(at){const c=at.d.consult,ok=W(c.prompt)>=4&&!ui.streaming,has=!!c.response,m=aiMode();
  return `<button class="btn" data-act="ask" ${ok?'':'disabled'}>${ui.streaming?'Asking…':has?'Ask again':'Ask AI ▶'} <small>${m==='demo'?'demo':'live'}</small></button>${m!=='demo'?`<button class="btn quiet" data-act="ask-demo" ${ok?'':'disabled'}>Use the demonstration answer</button>`:''}`}

/* ---------- Stage 3: Critique ---------- */
const TAGS=[['ok','✅','Convincing'],['q','❓','Questionable'],['check','🔍','Check this']];
function segsHTML(at){
  const c=at.d.consult,tags=at.d.critique.tags;
  return c.segs.map((s,i)=>`<div class="seg ${tags[i]?'t-'+tags[i]:''}"><p>${esc(s)}</p><div class="tagrow" role="group" aria-label="Mark part ${i+1}">${TAGS.map(([k,ic,l])=>`<button type="button" class="tg ${k}" data-act="tag" data-i="${i}" data-t="${k}" aria-pressed="${tags[i]===k}"><span aria-hidden="true">${ic}</span> ${l}</button>`).join('')}</div></div>`).join('')}
function stage3(at){
  const cr=at.d.critique;
  return `<div class="card"><h3>Tap to mark each part of the AI answer</h3><p class="hint">✅ Convincing · ❓ Questionable (no support, too absolute) · 🔍 Check this (you would verify it). Tap again to clear.</p><div id="segs">${segsHTML(at)}</div></div>
   <div class="card"><div class="fld"><span class="lab" id="stl">Overall, do you agree with the AI answer?</span><div class="opts" role="radiogroup" aria-labelledby="stl">${[['agree','I agree'],['partly','I partly agree'],['disagree','I disagree']].map(([v,l])=>`<label><input type="radio" name="stance" value="${v}" data-b="critique.stance" ${cr.stance===v?'checked':''}> ${l}</label>`).join('')}</div></div>
    ${fld2(at,'critique.reason',{label:'Why? (1–2 sentences)',min:4,ph:'I think this because…'})}</div>`}

/* ---------- Stage 4: Check ---------- */
const VCLS={SUPPORTED:'g',PARTIALLY:'w',UNSUPPORTED:'b',UNCERTAIN:''};
function rowHTML(r,i){
  const own=!r.exp;
  return `<div class="evrow" data-row="${r.id}"><div class="ev-claim"><span class="chip p">Claim ${i+1}</span>${own?`<textarea rows="2" data-row-f="claim" data-rid="${r.id}" maxlength="300" placeholder="Write the claim you want to check" aria-label="Claim ${i+1}">${esc(r.claim)}</textarea>`:`<p>${esc(r.claim)}</p>`}</div>
   <div class="ev-f"><label class="lab" for="src-${r.id}">Where would you check it?</label><select id="src-${r.id}" data-row-f="sourceType" data-rid="${r.id}"><option value="">Choose a source type…</option>${SOURCE_TYPES.map(s=>`<option ${r.sourceType===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
   <div class="ev-f"><label class="lab" for="ev-${r.id}">What did you find, or what would you look for? (3+ words)</label><input id="ev-${r.id}" type="text" data-row-f="evidence" data-rid="${r.id}" maxlength="300" value="${esc(r.evidence)}"></div>
   <div class="ev-f"><span class="lab" id="vl-${r.id}">Your verdict</span><div class="verdicts" role="group" aria-labelledby="vl-${r.id}">${VERDICTS.map(v=>`<button type="button" class="vd ${v.cls}" data-act="verdict" data-rid="${r.id}" data-v="${v.v}" aria-pressed="${r.verdict===v.v}">${v.label}</button>`).join('')}</div></div>
   ${own?`<button class="btn quiet sm" data-act="del-row" data-rid="${r.id}">Remove this claim</button>`:''}</div>`}
function stage4(at){
  const rows=at.d.check.rows;
  return `<div class="card"><h3>Check the claims</h3><p class="hint">AI sounds sure even when it is wrong. For each claim, say where you would check it, what you found, and your verdict. The app does not check sources for you. <span class="uz">${UZ.checkNote}</span></p>
   <div id="rows">${rows.length?rows.map(rowHTML).join(''):'<p class="muted">No claims yet. Add one from the AI answer.</p>'}</div><button class="btn ghost" data-act="add-row">+ Add a claim</button></div>`}

/* ---------- Stage 5: Challenge ---------- */
function stage5(at){
  const t=TASK_BY_ID[at.taskId],c=at.d.challenge,q=t.improve,locked=c.pick>=0,demo=isDemo(at);
  return `<div class="card"><h3>${esc(q.ask)}</h3><div class="choices" role="group">${q.options.map((o,i)=>choiceHTML(o,(c.pick===i?'sel ':'')+(locked&&demo&&i===q.best?'right ':'')+(locked&&demo&&c.pick===i&&i!==q.best?'miss':''),'pick5',i,locked?'aria-disabled="true"':'')).join('')}</div>
    ${locked?`<p class="fb ${demo?(c.pick===q.best?'g':'w'):''}" role="status">${demo?(c.pick===q.best?'✓ Good choice. ':'Another option fits better. '):'Saved. One reason this could fit: '}${esc(q.why)}</p>`:`<p class="hint">Choose one option. You can write your own version below.</p>`}</div>
   <div class="card">${fld2(at,'challenge.own',{label:'Your own improvement (optional if you chose one)',ph:'I would also…',hint:isDemo(at)?'':'Because this is a live AI answer, describe your own alternative in a sentence or two.'})}${fld2(at,'challenge.limit',{label:'What could go wrong with your change?',min:3,ph:'A risk is…'})}</div>`}

/* ---------- Stage 6: Conclude ---------- */
function stage6(at){
  const c=at.d.conclude;
  return `<div class="card"><h3>Your decision about the AI answer</h3><div class="decide" role="group" aria-label="Decision">${[['accept','👍','Accept','Use it as it is'],['modify','✏️','Modify','Use it, with changes'],['reject','🚫','Reject','Do not use it']].map(([v,ic,l,d])=>`<button type="button" class="dec ${v}" data-act="decide" data-v="${v}" aria-pressed="${c.decision===v}"><span aria-hidden="true">${ic}</span><b>${l}</b><small>${d}</small></button>`).join('')}</div>
    ${fld2(at,'conclude.reasoning',{label:'Why? Use what you found while checking. (5+ words)',min:5,rows:3,ph:'I decided this because…'})}</div>
   <div class="card"><h3>Look back <span class="uz">${UZ.lookBack}</span></h3>${fld2(at,'conclude.learned',{label:'What did you learn? (1 sentence)',min:3,ph:'I learned that…'})}${scaleHTML(at,'conclude.confidence','How sure are you about your final decision?','1 = not sure','5 = very sure')}</div>`}
function stageHTML(at){return[stage1,stage2,stage3,stage4,stage5,stage6][at.stage-1](at)}

/* ---------- instant feedback (only when the demonstration answer is used: it has an answer key) ---------- */
function critiqueFeedbackHTML(at){
  const t=TASK_BY_ID[at.taskId],ks=critiqueStats(at),tags=at.d.critique.tags,segs=at.d.consult.segs;
  return `<p class="big">${ks.hit===ks.flaws?'🎯 ':'🔎 '}You found <b>${ks.hit} of ${ks.flaws}</b> weak parts.</p>
   <ul class="fbl">${t.flaws.map(i=>{const f=tags[i]==='q'||tags[i]==='check';return `<li class="${f?'g':'w'}"><span aria-hidden="true">${f?'✓':'✗'}</span> <span>${esc(excerpt(segs[i]||'',130))}</span></li>`}).join('')}</ul>
   ${ks.falseFlags?`<p class="small muted">You also questioned ${ks.falseFlags} part${ks.falseFlags>1?'s':''} that the answer key treats as solid. That is fine if you had a reason.</p>`:''}
   <p class="small muted">Tip: weak parts often have no source, an exact number, or words like <i>always</i>, <i>never</i>, <i>all</i> and <i>proves</i>.</p>`}
function checkFeedbackHTML(at){
  const rs=at.d.check.rows.filter(r=>r.exp&&r.verdict);
  return `<ul class="fbl">${rs.map(r=>{const sc=verdictScore(r.verdict,r.exp),cls=sc===1?'g':sc>0?'w':'b',mk=sc===1?'✓':sc>0?'≈':'✗';
    return `<li class="${cls}"><span aria-hidden="true">${mk}</span><span><b>${esc(excerpt(r.claim,110))}</b><br>Your verdict: ${VERDICT_LABEL[r.verdict]}. Expected: <b>${VERDICT_LABEL[r.exp]}</b>. ${esc(r.why)}</span></li>`}).join('')}</ul>
   <p class="small muted">Expected verdicts come from the answer key of this demonstration task. Your real sources may lead you to a different, well-supported verdict.</p>`}

/* ---------- cycle page ---------- */
function traceHTML(at){const d=at.d,t=TASK_BY_ID[at.taskId];
  const tag=Object.values(d.critique.tags);
  const items=[[1,d.context.pick>=0?esc(t.q1.options[d.context.pick]):''],[2,d.consult.response?aiModeLabel(d.consult.mode).replace('AI RESPONSE — ',''):''],[3,tag.length?`${tag.length} parts marked`:''],[4,d.check.rows.filter(rowComplete).length?`${d.check.rows.filter(rowComplete).length} claim(s) checked`:''],[5,d.challenge.pick>=0?esc(excerpt(t.improve.options[d.challenge.pick],80)):''],[6,d.conclude.decision?({accept:'Accepted',modify:'Modified',reject:'Rejected'})[d.conclude.decision]:'']];
  return items.filter(x=>x[1]).map(([n,v])=>`<span class="tr-chip"><b>${STAGES[n-1].name}</b> ${v}</span>`).join('')}
function viewCycle(){const at=curAttempt();return at?stageScreen(at):cycleExplainer()}
function cycleExplainer(){
  const ips=attemptsList().filter(a=>a.status==='in_progress');
  return `<div class="page"><div class="page-head"><h1>${UZ.nav.cycle} <span class="en">The AI-CT 6C cycle</span></h1><p>${UZ.cycleLead}</p></div>
   <ol class="cyc6">${STAGES.map((s,i)=>`<li class="${s.key==='consult'?'ai':''}" style="animation-delay:${i*80}ms"><span class="c6-n">${s.n}</span><span class="c6-ic" aria-hidden="true">${STAGE_ICONS[i]}</span><div><h3>${s.name} <em>${UZ.stage[i].n}</em>${s.key==='consult'?' <span class="chip ai">the only stage with AI</span>':''}</h3><p>${esc(s.task)}</p><p class="uz">${UZ.stage[i].t}</p></div></li>`).join('')}</ol>
   ${ips.length?`<h2>In progress</h2><div class="stack" style="margin-bottom:20px">${ips.map(a=>`<div class="panel row" style="justify-content:space-between"><div><b>${esc(TASK_BY_ID[a.taskId].title)}</b><div class="muted small">Stage ${a.stage} of 6, ${STAGES[a.stage-1].name}</div></div><button class="btn" data-act="continue" data-attempt="${a.id}">Continue</button></div>`).join('')}</div>`:''}
   <div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn" data-go="library">📚 ${UZ.nav.tasks}</button><button class="btn ghost" data-act="random-task">🎲 ${UZ.home.random}</button></div></div>`}
function stageScreen(at){
  const t=TASK_BY_ID[at.taskId],st=STAGES[at.stage-1];
  return `<div class="page"><div class="cyc-head"><h2>${esc(t.title)}</h2><div class="row" style="gap:8px"><span class="chip p">${esc(t.skill)}</span>${at.sample?'<span class="chip demo">SAMPLE RECORD</span>':''}${at.status==='completed'?'<span class="chip g">Completed</span>':''}</div></div>
   <ol class="stepper" aria-label="AI-CT 6C progress">${STAGES.map(s=>{const done=s.n<at.stage||(at.status==='completed'&&s.n<=at.stage),cur=s.n===at.stage,can=canEnter(at,s.n)||cur;
     return `<li class="step ${s.key==='consult'?'ai':''} ${cur?'current':''} ${done&&!cur?'done':''} ${!can?'locked':''}"><button data-act="stage" data-stage="${s.n}" ${cur?'aria-current="step"':''} ${!can?'aria-disabled="true"':''} aria-label="Stage ${s.n}: ${s.name}${cur?', current':done?', completed':can?'':', locked'}"><span class="dot">${done&&!cur?'✓':STAGE_ICONS[s.n-1]}</span><span class="lb">${s.name}</span></button></li>`}).join('')}</ol>
   <section class="brief2"><div><b>Stage ${st.n} of 6 · ${st.name}</b>${st.key==='consult'?' <span class="chip ai">AI</span>':''}<p>${esc(st.task)}</p></div><div class="b-uz"><b>${UZ.stage[st.n-1].n}</b><p>${UZ.stage[st.n-1].t}</p></div></section>
   <div class="stage-main" id="stageMain">${stageHTML(at)}</div>
   <div class="trace2" id="traceList">${traceHTML(at)}</div>
   <div class="actionbar"><details class="reqs"><summary id="reqSum"></summary><ul id="reqList"></ul></details><div class="acts-r"><span class="saved" id="savedAt">${lastSaved?'Saved '+fmtTime(lastSaved):''}</span>
    <button class="btn quiet sm" data-act="back" ${at.stage===1?'disabled':''}>← Back</button><button class="btn quiet sm" data-act="later">Continue later</button>
    ${at.stage<6?`<button class="btn" id="nextBtn" data-act="next">Next: ${st.next} ▶</button>`:`<button class="btn" id="nextBtn" data-act="finish">${at.status==='completed'?'View result':'Complete 6C Activity ✓'}</button>`}</div></div></div>`}

/* ---------- result page: stage-by-stage feedback ---------- */
function dotsHTML(level){return `<span class="lvl-dots" aria-label="Level ${level} of 4">${[1,2,3,4].map(n=>`<i class="${n<=level?'on':''}"></i>`).join('')}</span>`}
function viewAssessment(){
  const done=completedList(),at=(S.attempts[ui.assessId]&&S.attempts[ui.assessId].status==='completed')?S.attempts[ui.assessId]:done[done.length-1];
  if(!at)return `<div class="page"><div class="page-head"><h1>Result</h1></div>${empty('No completed activity yet','Finish a task to see stage-by-stage feedback.',`<button class="btn" data-go="library">${UZ.nav.tasks}</button>`)}</div>`;
  const t=TASK_BY_ID[at.taskId],a=computeAssessment(at),pt=profileText(a),jc=ui.justCompleted===at.id,xp=at.result?at.result.xp:xpFor(a);
  return `<div class="page"><div class="page-head"><h1>${jc?'🎉 ':''}Your result <span class="en">${UZ.result}</span></h1><p>${esc(t.title)} · ${fmtDate(at.completedAt)}${at.sample?' · <span class="chip demo">SAMPLE RECORD</span>':''}</p></div>
   <div class="panel score-top"><div class="big-score"><b id="scoreNum" data-to="${a.total}">${jc?0:a.total}</b><span>/ ${a.max}</span></div><div><div class="row" style="gap:8px">${bandChip(a.band)}${at.sample?'':`<span class="xp-pill big" id="xpGain" data-to="${xp}">⭐ +${jc?0:xp} XP</span>`}</div><p class="muted small" style="margin-top:6px">${a.pct}% of the maximum. Level = 1 + indicators met, in each of the six stages.</p>${jc&&(ui.justBadges||[]).length?`<div class="badge-row" style="margin-top:8px">${ui.justBadges.map(k=>badgeHTML(k,true)).join('')}</div>`:''}</div></div>
   ${a.demo?'':`<div class="notice w"><p><strong>Live AI answer: no answer key.</strong> Because the AI answer was not pre-written, the indicators in Critique, Check and Challenge use your own reasoning instead of an answer key. Discuss your verdicts with your teacher.</p></div>`}
   ${a.calib?`<div class="notice b"><p>${esc(a.calib)}</p></div>`:''}
   <h2>${UZ.stageBy} <span class="en">Stage-by-stage feedback</span></h2>
   <div class="stage-cards">${a.items.map(it=>`<article class="sc2 ${it.key==='consult'?'ai':''}"><header><span class="sc2-ic" aria-hidden="true">${STAGE_ICONS[it.stage-1]}</span><div><b>${it.stage}. ${it.short}</b> <em>${UZ.stage[it.stage-1].n}</em><small>${esc(it.name)}</small></div><div class="sc2-l">${dotsHTML(it.level)}<span>${it.level}/4 · ${LEVELS[it.level]}</span></div></header>
    <ul>${it.indicators.map(x=>`<li class="${x.ok?'g':'w'}"><span aria-hidden="true">${x.ok?'✓':'○'}</span><span>${esc(x.l)}${x.ok?'':`<small> Tip: ${esc(x.tip)}</small>`}</span></li>`).join('')}</ul></article>`).join('')}</div>
   <div class="panel" style="margin:18px 0"><p>${esc(pt.strong)}</p><p>${esc(pt.dev)}</p><p class="small muted">These are learning-activity indicators, not a validated measure of critical thinking, and they cannot judge the quality of an idea.</p></div>
   ${at.sample?'':`<div class="row" style="gap:8px;margin-bottom:12px"><span class="small muted">${UZ.classStatus}:</span>${syncChipHTML()}</div>`}
   <div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn" data-act="random-task">🎲 ${UZ.home.random}</button><button class="btn ghost" data-go="record" data-id="${at.id}">${UZ.record}</button><button class="btn ghost" data-go="progress">${UZ.nav.progress}</button><button class="btn quiet" data-go="library">${UZ.nav.tasks}</button></div></div>`}

/* ---------- record ---------- */
function viewRecord(){
  const at=S.attempts[ui.params.id];if(!at||at.status!=='completed')return `<div class="page"><div class="page-head"><h1>Record</h1></div>${empty('No record','This record does not exist.',`<button class="btn" data-go="progress">${UZ.nav.progress}</button>`)}</div>`;
  const r=recordObject(at),QA=(q,a)=>a||a===0?`<div class="qa"><div class="q">${esc(q)}</div><div class="a">${esc(a)}</div></div>`:'',a=computeAssessment(at);
  return `<div class="page"><div class="page-head"><h1>Record: ${esc(r.task.title)}</h1><p>${fmtDate(at.completedAt)} ${at.sample?'· <span class="chip demo">SAMPLE RECORD</span>':''}</p></div>
   <div class="row" style="gap:8px;margin-bottom:16px;flex-wrap:wrap"><button class="btn quiet" data-go="progress">← My progress</button><button class="btn" data-go="assessment" data-id="${at.id}">Result</button><button class="btn ghost" data-act="export" data-kind="json" data-id="${at.id}">JSON</button><button class="btn ghost" data-act="export" data-kind="csv" data-id="${at.id}">CSV</button><button class="btn danger" data-act="delete-record" data-id="${at.id}">Delete</button></div>
   <div class="rec-sec"><h3>1 Context</h3>${QA('Scenario',r.task.scenario)}${QA('Main problem (your choice)',r.context.mainProblemChoice)}${QA('First step',r.context.firstStep)}${QA('Confidence',r.context.confidence+' / 5')}</div>
   <div class="rec-sec"><h3>2 Consult</h3>${QA('Mode',r.consult.mode)}${QA('Your question',r.consult.prompt)}${QA('AI answer',r.consult.response)}</div>
   <div class="rec-sec"><h3>3 Critique</h3>${r.critique.marks.map((m,i)=>`<div class="qa"><div class="q">Part ${i+1}: ${m.mark}</div><div class="a">${esc(m.text)}</div></div>`).join('')}${QA('Position',r.critique.stance)}${QA('Reason',r.critique.reason)}</div>
   <div class="rec-sec"><h3>4 Check</h3>${r.check.rows.map((x,i)=>`<div class="qa"><div class="q">Claim ${i+1}: ${esc(x.claim)}</div><div class="a">${esc(x.sourceType)}; ${esc(x.evidence)}; verdict: ${esc(VERDICT_LABEL[x.verdict]||'')}</div></div>`).join('')}</div>
   <div class="rec-sec"><h3>5 Challenge</h3>${QA('Chosen improvement',r.challenge.improvement)}${QA('Your own version',r.challenge.own)}${QA('Risk',r.challenge.risk)}</div>
   <div class="rec-sec"><h3>6 Conclude</h3>${QA('Decision',({accept:'Accepted',modify:'Modified',reject:'Rejected'})[r.conclude.decision])}${QA('Reasoning',r.conclude.reasoning)}${QA('What I learned',r.conclude.learned)}${QA('Final confidence',r.conclude.confidence+' / 5')}</div>
   <div class="rec-sec"><h3>Result</h3>${QA('Total',a.total+' / '+a.max+' ('+a.band+')')}${QA('Levels',a.items.map(i=>i.short+' '+i.level).join(' · '))}</div></div>`}
/* =====================================================================
   TEACHER — classes are real only when the secure server is connected.
   Without it this page says so and shows clearly labelled DEMO DATA.
   Only scores are stored on the server; students' written answers never
   leave their devices.
   ===================================================================== */
const errText=e=>({network:'Cannot reach the server. Check your internet and try again.',not_configured:'The server address is not set.',rate_limited:'Too many requests. Wait a minute and try again.',class_full:'This class is full.',not_found:'Class not found. Check the code.',forbidden:'The teacher key is not correct.',unauthorized:'The teacher key is not correct.',invalid_input:'Please check what you typed.',classes_not_configured:'The class database is not set up on the server yet.'})[e]||'Something went wrong. Please try again.';
const copyBtn=(txt,label)=>`<button class="btn quiet sm" data-act="copy" data-text="${esc(txt)}">${label||'Copy'}</button>`;
function setupBanner(){
  return `<div class="notice w"><p><strong>${UZ.t.notConnected}</strong> ${UZ.t.notConnectedP}</p><p class="small">Classes need the secure server (a free Cloudflare Worker with a small database). Set it up once with <code>backend/README.md</code>, put its address in <code>API_BASE</code>, and this page switches on by itself.</p></div>`}
/* The "Create class" card is ALWAYS visible. When the server is not ready it is greyed out, says why, and shows what the teacher will get. */
function lockedPanels(noticeHTML){
  return `${noticeHTML}<div class="grid2 teacher-top"><div class="panel locked-panel"><h3>${UZ.t.create} <span class="en">Create a class</span> <span class="chip">${UZ.t.soon}</span></h3>
   <div class="fld"><label class="lab" for="tcName">${UZ.t.className}</label><input id="tcName" type="text" disabled placeholder="${UZ.t.classPh}"></div>
   <div class="fld"><label class="lab" for="tcTeacher">${UZ.t.yourName} (${UZ.t.optional})</label><input id="tcTeacher" type="text" disabled></div>
   <button class="btn" disabled>${UZ.t.createBtn}</button>
   <p class="hint">${UZ.t.afterCreate}</p><p class="hint">After you create a class you get a class code, a join link and a teacher key.</p>
   <p class="small"><b>${UZ.t.link} (${UZ.t.example}):</b> <code class="wrapcode">${esc(joinLink('ABC234'))}</code></p></div>
   <div class="panel"><h3>${UZ.t.myClasses} <span class="en">My classes</span></h3><p class="muted small">${UZ.t.noClasses}</p></div></div>`}
const tHead=()=>`<div class="page-head"><h1>${UZ.nav.teacher} <span class="en">Teacher dashboard</span></h1><p>${UZ.t.lead}</p></div>`;
function viewTeacher(){
  const T=ui.teacher;
  if(!API.base)return viewTeacherDemo().replace('<div class="page">','<div class="page">'+lockedPanels(setupBanner()));
  if(!API.caps.checked||API.caps.checking)return `<div class="page">${tHead()}${lockedPanels('<div class="panel"><span class="thinking">Connecting to the server <i></i><i></i><i></i></span></div>')}</div>`;
  if(API.caps.err)return `<div class="page">${tHead()}${lockedPanels(`<div class="notice b"><p><strong>${UZ.t.lockedTitle}</strong> ${errText(API.caps.err)}</p><p><button class="btn" data-act="api-retry">Try again</button></p></div>`)}</div>`;
  if(!API.caps.classes)return `<div class="page">${tHead()}${lockedPanels(`<div class="notice w"><p><strong>${UZ.t.lockedTitle}</strong> ${errText('classes_not_configured')} The server answers, but its class database is not connected yet: see <code>backend/README.md</code>, step 4 "Classes".</p><p><button class="btn" data-act="api-retry">Check again</button></p></div>`)}</div>`;
  return T.view==='class'&&T.code?classView():teacherHome()}

function teacherHome(){
  const T=ui.teacher,cls=S.teacherClasses;
  return `<div class="page"><div class="page-head"><h1>${UZ.nav.teacher} <span class="en">Teacher dashboard</span></h1><p>${UZ.t.lead}</p></div>
   ${T.err?`<div class="notice b"><p>${esc(T.err)}</p></div>`:''}
   ${T.newKey?`<div class="panel keybox"><h3>✅ ${UZ.t.created}</h3><p><b>${UZ.t.code}:</b> <span class="bigcode">${esc(T.newKey.code)}</span></p><p><b>${UZ.t.link}:</b> <code>${esc(joinLink(T.newKey.code))}</code> ${copyBtn(joinLink(T.newKey.code),'Copy link')}</p>
     <p><b>${UZ.t.key}:</b> <code class="keytxt">${esc(T.newKey.key)}</code> ${copyBtn(T.newKey.key,'Copy key')}</p><div class="notice w"><p>${UZ.t.keyWarn}</p></div><button class="btn" data-act="class-open" data-code="${esc(T.newKey.code)}">${UZ.t.openClass}</button></div>`:''}
   <div class="grid2"><div class="panel"><h3>${UZ.t.create}</h3><div class="fld"><label class="lab" for="tcName">${UZ.t.className}</label><input id="tcName" type="text" maxlength="60" placeholder="${UZ.t.classPh}"></div>
     <div class="fld"><label class="lab" for="tcTeacher">${UZ.t.yourName} (${UZ.t.optional})</label><input id="tcTeacher" type="text" maxlength="40"></div><button class="btn" data-act="class-create" ${T.loading?'disabled':''}>${T.loading?'…':UZ.t.createBtn}</button></div>
    <div class="panel"><h3>${UZ.t.myClasses}</h3>${cls.length?`<div class="stack" style="gap:8px">${cls.map(c=>`<div class="row" style="justify-content:space-between;gap:8px"><div><b>${esc(c.name)}</b> <span class="chip">${esc(c.code)}</span></div><button class="btn sm" data-act="class-open" data-code="${esc(c.code)}">${UZ.t.open}</button></div>`).join('')}</div>`:`<p class="muted small">${UZ.t.noClasses}</p>`}
     <details style="margin-top:12px"><summary>${UZ.t.otherDevice}</summary><div class="fld"><label class="lab" for="okCode">${UZ.t.code}</label><input id="okCode" type="text" maxlength="12"></div><div class="fld"><label class="lab" for="okKey">${UZ.t.key}</label><input id="okKey" type="text" maxlength="40" autocomplete="off"></div><button class="btn ghost" data-act="class-attach">${UZ.t.open}</button></details></div></div></div>`}

/* ---------- aggregation (all on the teacher's screen; the server only stores scores) ---------- */
function aggregateClass(d){
  const st={};(d.students||[]).forEach(s=>{st[s.id]={id:s.id,name:s.name,joinedAt:s.joinedAt,lastAt:s.lastAt||s.joinedAt,sixc:[],methods:[],comps:[],xp:0}});
  const task={},ai={demo:0,live:0,backend:0},stageSum=[0,0,0,0,0,0];let n6=0;
  (d.results||[]).forEach(r=>{const s=st[r.studentId];if(!s)return;const x=r.data||{};
    if(r.at>s.lastAt)s.lastAt=r.at;
    if(r.kind==='6c'){s.sixc.push(r);s.xp+=x.xp||0;const t=(task[r.ref]=task[r.ref]||{ref:r.ref,n:0,sum:0});t.n++;t.sum+=x.pct||0;if(ai[x.aiMode]!=null)ai[x.aiMode]++;(x.levels||[]).forEach((l,i)=>{stageSum[i]+=l});n6++}
    else if(r.kind==='method'){s.methods.push(r);s.xp+=x.xp||0}
    else if(r.kind==='competition')s.comps.push(r)});
  const students=Object.values(st).map(s=>{
    const lv=[0,0,0,0,0,0];s.sixc.forEach(r=>(r.data.levels||[]).forEach((l,i)=>{lv[i]+=l}));
    const m=s.sixc.length?lv.map(v=>v/s.sixc.length):null;
    return Object.assign(s,{avg:s.sixc.length?avg(s.sixc.map(r=>r.data.pct||0)):null,stageAvg:m,weak:m?COMP[m.indexOf(Math.min(...m))].short:'–',bestMethod:s.methods.length?Math.max(...s.methods.map(r=>pct(r.data.correct,r.data.total))):null})});
  return{students,task:Object.values(task),ai,stageAvg:n6?stageSum.map(v=>v/n6):null,n6,methods:students.reduce((a,s)=>a+s.methods.length,0),comps:students.reduce((a,s)=>a+s.comps.length,0)}}
function classCSV(d){
  const nm={};(d.students||[]).forEach(s=>{nm[s.id]=s.name});
  const cols=['student','kind','ref','time','total','percent','band',...COMP.map(c=>'level_'+c.key),'decision','confidence','ai_mode','xp','details'];
  const rows=(d.results||[]).map(r=>{const x=r.data||{},lv=x.levels||[];
    return[nm[r.studentId]||'',r.kind,r.ref,new Date(r.at).toISOString(),x.total,x.pct,x.band,...COMP.map((_,i)=>lv[i]),x.decision,x.conf,x.aiMode,x.xp,r.kind==='method'?`${x.correct}/${x.total} ${x.diff}`:r.kind==='competition'?`mode ${x.mode} ${x.diff} scores ${(x.scores||[]).join('/')}`:''].map(csvCell).join(',')});
  return[cols.join(','),...rows].join('\n')}

function classView(){
  const T=ui.teacher,c=teacherClass(T.code),d=T.data;
  if(!c)return `<div class="page"><button class="btn quiet" data-act="class-back">← ${UZ.t.myClasses}</button></div>`;
  const head=`<div class="page"><button class="btn quiet sm" data-act="class-back" style="margin-bottom:12px">← ${UZ.t.myClasses}</button>
   <div class="page-head"><h1>${esc(c.name)} <span class="chip">${esc(c.code)}</span></h1><p>${UZ.t.classLead}</p></div>
   <div class="panel"><div class="row" style="gap:10px;flex-wrap:wrap;justify-content:space-between"><div><b>${UZ.t.link}:</b> <code>${esc(joinLink(c.code))}</code></div><div class="row" style="gap:8px">${copyBtn(joinLink(c.code),'Copy link')}${copyBtn(c.code,'Copy code')}<button class="btn quiet sm" data-act="projector-code">📽️ ${UZ.t.showCode}</button></div></div>
    <p class="small muted" style="margin-top:6px">${UZ.t.joinHow}</p></div>
   ${T.showCode?`<div class="codebig" role="dialog" aria-label="Class code"><button class="btn quiet" data-act="projector-code" style="position:absolute;top:14px;right:14px">✕</button><p>${UZ.t.joinAt}</p><div class="bigcode xl">${esc(c.code)}</div><p class="small">${esc(joinLink(c.code))}</p></div>`:''}`;
  if(T.err)return head+`<div class="notice b"><p>${esc(T.err)}</p></div><button class="btn" data-act="class-refresh">Try again</button></div>`;
  if(!d)return head+`<div class="panel"><span class="thinking">Loading <i></i><i></i><i></i></span></div></div>`;
  const g=aggregateClass(d),sorted=[...g.students].sort((a,b)=>{const k=ui.tSort.k,dir=ui.tSort.dir,va=k==='name'?a.name.toLowerCase():k==='n'?a.sixc.length:k==='avg'?(a.avg==null?-1:a.avg):k==='xp'?a.xp:a.lastAt,vb=k==='name'?b.name.toLowerCase():k==='n'?b.sixc.length:k==='avg'?(b.avg==null?-1:b.avg):k==='xp'?b.xp:b.lastAt;return(va>vb?1:va<vb?-1:0)*dir});
  const th=(k,l)=>`<th ${ui.tSort.k===k?`aria-sort="${ui.tSort.dir>0?'ascending':'descending'}"`:''}><button data-act="teacher-sort" data-k="${k}">${l}${ui.tSort.k===k?(ui.tSort.dir>0?' ▲':' ▼'):''}</button></th>`;
  const when=t=>t?fmtDate(t):'–';
  return head+`<div class="row" style="gap:8px;margin:14px 0;flex-wrap:wrap"><button class="btn" data-act="class-refresh">↻ ${UZ.t.refresh}</button><button class="btn ghost" data-act="class-csv">${UZ.t.exportCsv}</button><button class="btn quiet" data-act="key-toggle">${T.showKey?UZ.t.hideKey:UZ.t.showKeyBtn}</button><button class="btn danger" data-act="class-delete" data-code="${esc(c.code)}">${UZ.t.deleteClass}</button><span class="small muted" id="lastRefresh">${T.updated?UZ.t.updated+' '+fmtTime(T.updated):''}</span></div>
   ${T.showKey?`<div class="notice w"><p><b>${UZ.t.key}:</b> <code class="keytxt">${esc(c.key)}</code> ${copyBtn(c.key,'Copy')}<br>${UZ.t.keyWarn}</p></div>`:''}
   <div class="panel" style="margin-bottom:18px"><div class="grid4"><div class="stat"><b>${g.students.length}</b><span>${UZ.t.students}</span></div><div class="stat"><b>${g.n6}</b><span>6C ${UZ.t.activities}</span></div><div class="stat"><b>${g.n6?Math.round(avg(g.students.filter(s=>s.avg!=null).map(s=>s.avg))):'–'}${g.n6?'%':''}</b><span>${UZ.t.avgScore}</span></div><div class="stat"><b>${g.methods}+${g.comps}</b><span>${UZ.t.games}</span></div></div></div>
   ${g.n6?`<div class="grid2" style="margin-bottom:18px"><div class="panel"><h3>${UZ.t.stageProfile} <span class="en">Stage performance (class average, level 1–4)</span></h3>${radarSVG(g.stageAvg,COMP.map(x=>x.short))}<div class="stack" style="gap:6px;margin-top:6px">${COMP.map((x,i)=>`<div class="row" style="gap:8px"><span style="width:84px">${x.short}</span><div class="bar"><i style="width:${Math.round(g.stageAvg[i]/4*100)}%"></i></div><b>${g.stageAvg[i].toFixed(1)}</b></div>`).join('')}</div></div>
     <div class="panel"><h3>${UZ.t.byTask} <span class="en">By task</span></h3><div class="tablewrap"><table><thead><tr><th>Task</th><th>Done</th><th>Average</th></tr></thead><tbody>${g.task.sort((a,b)=>b.n-a.n).map(t=>{const tk=TASK_BY_ID[t.ref];return `<tr><td>${tk?esc(tk.title):esc(t.ref)}</td><td>${t.n}</td><td>${Math.round(t.sum/t.n)}%</td></tr>`}).join('')}</tbody></table></div>
      <p class="small muted" style="margin-top:8px">AI answers used: demonstration ${g.ai.demo}, live ${g.ai.live+g.ai.backend}.</p></div></div>`:`<div class="notice"><p>${UZ.t.noResults}</p></div>`}
   <h2>${UZ.t.studentTable} <span class="en">Students</span></h2>
   <div class="tablewrap"><table><thead><tr>${th('name','Name')}${th('n','6C')}${th('avg','Average')}<th>Weakest stage</th><th>Best Method %</th>${th('xp','XP')}${th('last','Last active')}<th></th></tr></thead>
    <tbody>${sorted.length?sorted.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.sixc.length}</td><td>${s.avg==null?'–':Math.round(s.avg)+'%'}</td><td>${esc(s.weak)}</td><td>${s.bestMethod==null?'–':s.bestMethod+'%'}</td><td>${s.xp}</td><td>${when(s.lastAt)}</td><td><button class="btn quiet sm" data-act="student-remove" data-sid="${esc(s.id)}" data-name="${esc(s.name)}">Remove</button></td></tr>`).join(''):`<tr><td colspan="8" class="muted">${UZ.t.noStudents}</td></tr>`}</tbody></table></div>
   <p class="small muted" style="margin-top:10px">${UZ.t.privacy}</p></div>`}

/* ---------- join a class (opened from a link like  .../#join=ABC123) ---------- */
function viewJoin(){
  const J=ui.join,m=J.code&&memberOf(J.code);
  const body=!API.base?`<div class="notice w"><p>Classes are not connected on this site yet, so you cannot join one. ${setupBanner()}</p></div>`
   :!API.caps.checked||API.caps.checking?`<div class="panel"><span class="thinking">Connecting <i></i><i></i><i></i></span></div>`
   :API.caps.err||!API.caps.classes?`<div class="notice b"><p>${errText(API.caps.err||'classes_not_configured')}</p></div><button class="btn" data-act="api-retry">Try again</button>`
   :m?`<div class="notice g"><p>You are already in <b>${esc(m.className||m.code)}</b> as ${esc(m.name)}.</p></div><button class="btn" data-go="home">Continue</button>`
   :!J.info?(J.err?`<div class="notice b"><p>${esc(J.err)}</p></div>`:`<div class="panel"><span class="thinking">Looking for the class <i></i><i></i><i></i></span></div>`)
   :`<div class="panel"><h3>${esc(J.info.name)} <span class="chip">${esc(J.code)}</span></h3>${J.err?`<div class="notice b"><p>${esc(J.err)}</p></div>`:''}
     <div class="fld"><label class="lab" for="jName">${UZ.j.nameLabel}</label><input id="jName" type="text" maxlength="40" autocomplete="nickname" value="${esc(profileName())}"></div>
     <button class="btn" data-act="join-confirm" ${J.busy?'disabled':''}>${J.busy?'…':UZ.j.btn}</button><p class="hint">${UZ.j.privacy}</p></div>`;
  return `<div class="page"><div class="page-head"><h1>${UZ.j.title} <span class="en">Join a class</span></h1><p>${UZ.j.lead}</p></div>${body}</div>`}
/* =====================================================================
   METHOD CHALLENGE — a short quiz that helps future English teachers
   recognise teaching methods from simple classroom situations.
   This is a learning game, separate from the 6C task pedagogy; it does
   not use AI and awards XP, not rubric scores.
   ===================================================================== */
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* Returns a COPY of a question with its options in random order. The correct
   answer is tracked by position, so it moves together with its option text.
   The shared question bank (MC_QUESTIONS) is never modified. */
function mcShuffleQ(q){
  const perm=shuffle(q.options.map((_,i)=>i));
  return {id:q.id,method:q.method,diff:q.diff,q:q.q,explain:q.explain,
    options:perm.map(i=>q.options[i]),correct:perm.indexOf(q.correct)}}
function mcNewRound(diff){
  /* 10 questions about teaching methods, drawn so that none repeats until the whole bank has been used */
  const qs=pickQs(qPool(['methods'],diff),10).map(mcShuffleQ);
  ui.mc={phase:'play',diff,order:qs.map(q=>q.id),qs,idx:0,picked:null,correct:0,justEarned:0,newBadge:null}}

function viewMethods(){
  if(!ui.mc||ui.mc.phase==='setup')return mcSetupHTML();
  if(ui.mc.phase==='play')return mcPlayHTML();
  return mcDoneHTML()}

function mcSetupHTML(){
  return `<div class="page"><div class="game-head"><div><h1>🎮 Method Challenge</h1><p class="muted" style="margin:0">Read a short classroom situation. Choose the teaching method it shows. Get instant feedback and XP.</p></div>
   <div class="row" style="gap:10px">${xpPillHTML()}${sndToggleBtn()}</div></div>
  <div class="mc-setup">
   <div class="notice"><p>Each round has 10 quick questions with 4 options, drawn from a bank of ${qPool(['methods']).length} questions. You will not see the same question again until you have been through the whole bank. This game is separate from the 6C cycle and does not use AI.</p></div>
   <div>
    <h3 style="margin-bottom:8px">Choose a difficulty</h3>
    <div class="tc-choice" role="group" aria-label="Difficulty">
     <button data-act="mc-start" data-diff="easy">🟢 Easy</button>
     <button data-act="mc-start" data-diff="medium">🟡 Medium</button>
     <button data-act="mc-start" data-diff="advanced">🔴 Advanced</button>
     <button data-act="mc-start" data-diff="mixed">🔀 Mixed</button>
    </div>
   </div>
   <div>
    <h3 style="margin-bottom:8px">10 methods in this challenge</h3>
    <div class="mc-methods">${METHODS.map(m=>`<span>${esc(m.name)}</span>`).join('')}</div>
   </div>
   ${hasBadge('method-master')?`<div class="badge-row">${badgeHTML('method-master')}</div>`:''}
  </div></div>`}

function mcPlayHTML(){
  const g=ui.mc,q=g.qs[g.idx],answered=g.picked!=null;
  const letters=['A','B','C','D'];
  return `<div class="page"><div class="game-head"><h1>🎮 Method Challenge</h1><div class="row" style="gap:10px">${xpPillHTML()}${sndToggleBtn()}</div></div>
  <div class="mc-card">
   <p class="mc-progress">Question ${g.idx+1} of ${g.order.length} · ${g.correct} correct so far</p>
   <div class="bar" style="margin-bottom:18px"><i style="width:${Math.round(g.idx/g.order.length*100)}%"></i></div>
   <p class="mc-scenario">${esc(q.q)}</p>
   <div class="mc-opts" role="radiogroup" aria-label="Choose the method">
    ${q.options.map((o,i)=>{let cls='';if(answered){if(i===q.correct)cls='correct';else if(i===g.picked)cls='wrong'}
      return `<button class="mc-opt ${cls}" data-act="mc-answer" data-i="${i}" ${answered?'disabled':''} aria-pressed="${g.picked===i}"><b>${letters[i]}</b><span>${esc(o)}</span></button>`}).join('')}
   </div>
   ${answered?`<div class="mc-explain ${g.picked===q.correct?'g':'b'}"><b>${g.picked===q.correct?'Correct! +10 XP':'Not quite.'}</b>${esc(q.explain)}</div>
   <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="mc-next">${g.idx+1<g.order.length?'Next question':'See results'}</button></div>`:''}
  </div></div>`}

function mcDoneHTML(){
  const g=ui.mc,pct=Math.round(g.correct/g.order.length*100);
  return `<div class="page"><div class="mc-card mc-done" style="margin:0 auto">
   <div style="font-size:2.6rem" aria-hidden="true">🎉</div>
   <h2>Round complete!</h2>
   <p class="big">${g.correct} / ${g.order.length}</p>
   <p class="muted">${pct}% correct · +${g.justEarned} XP this round · ${S.xp||0} XP total</p>
   ${g.newBadge?`<div class="badge-row" style="justify-content:center">${badgeHTML(g.newBadge,true)}</div>`:''}
   <p class="muted small">${pct>=80?'Great work — you recognised most methods correctly.':pct>=50?'Good effort — a solid start on recognising these methods.':'Keep practising — recognising methods gets easier with repetition.'}</p>
   <div class="row" style="justify-content:center;margin-top:18px"><button class="btn" data-act="mc-restart">Play again</button><button class="btn quiet" data-go="home">Back to home</button></div>
  </div></div>`}

/* =====================================================================
   TEAM COMPETITION — a classroom quiz for one shared screen, played in TURNS.
   Every question is asked to ONE team (A, B, C, A, B, C ...). The team's answer is
   marked on the screen; the moment it is marked the result is revealed with an
   animation and a short jingle, and only that team scores. A countdown runs for
   every question; when it ends the question counts as unanswered. Reuses the Method Challenge question bank so the
   two features share one source of truth instead of duplicating content.
   ===================================================================== */
const TC_COLORS=['var(--primary)','var(--ai)','var(--warn)','var(--good)'];
const TC_SECONDS=20;

function tcSetMode(n){
  const g=ui.tc,old=g.teams;
  g.mode=n;
  if(n===1){g.teams=[{name:'You',score:0}]}
  else{g.teams=Array.from({length:n},(_,i)=>({name:(old[i]&&old[i].name&&old[i].name!=='You')?old[i].name:`Team ${String.fromCharCode(65+i)}`,score:0}))}}

const TC_TOPICS=[['mixed','🔀','Mixed'],['methods','🎓','Methods'],['situations','🏫','Classroom situations'],['grammar','✍️','Grammar']];
const tcTopics=t=>t==='methods'?['methods']:t==='situations'?['situations']:t==='grammar'?['grammar']:['methods','situations','grammar'];
/* Draw `count` questions: a balanced mix of the chosen topics, none repeated until the pool is used up.
   If one difficulty has too few questions, the rest come from the other difficulties of the same topics. */
function tcBuildOrder(diff,count,topic){
  const tp=tcTopics(topic),out=[],base=Math.floor(count/tp.length);let extra=count-base*tp.length;
  shuffle(tp).forEach(t=>{const p=qPool([t],diff),want=base+(extra-->0?1:0);pickQs(p,Math.min(want,p.length)).forEach(q=>out.push(q))});
  if(out.length<count){const ids=new Set(out.map(q=>q.id));shuffle(qPool(tp).filter(q=>!ids.has(q.id))).slice(0,count-out.length).forEach(q=>out.push(q))}
  return shuffle(out).slice(0,count).map(q=>q.id)}

const TC_PER_TEAM=[3,5,8,10];
const tcTurn=g=>g.idx%g.teams.length;
const tcTotal=g=>g.count*g.teams.length;

function tcClearTimer(){if(ui.tc.timerId){clearInterval(ui.tc.timerId);ui.tc.timerId=null}}
function tcStartTimer(){
  tcClearTimer();ui.tc.timeLeft=TC_SECONDS;
  ui.tc.timerId=setInterval(()=>{
    ui.tc.timeLeft--;
    const el=$('#tcTimer'),bar=$('#tcBar');
    if(el){el.textContent='⏱ '+Math.max(0,ui.tc.timeLeft)+'s';el.classList.toggle('low',ui.tc.timeLeft<=5)}
    if(bar)bar.style.width=Math.max(0,ui.tc.timeLeft)/TC_SECONDS*100+'%';
    if(ui.tc.timeLeft<=0){tcClearTimer();if(!ui.tc.revealed){tcAnswer(null);render()}}
  },1000)}

function tcStart(){
  const g=ui.tc;
  if(!TC_PER_TEAM.includes(g.count))g.count=5;
  g.teams.forEach(t=>{t.score=0;t.correct=0;t.answered=0});
  g.order=tcBuildOrder(g.diff,tcTotal(g),g.topic||'mixed');
  g.qs=g.order.map(id=>mcShuffleQ(MC_QUESTIONS.find(x=>x.id===id)));
  g.idx=0;g.picked=null;g.lastOk=false;g.timedOut=false;g.revealed=false;g.justScored=[];g.phase='play';
  tcStartTimer()}

/* The active team's answer (oi = option index, or null when time ran out). Only that team can score. */
function tcAnswer(oi){
  const g=ui.tc;if(g.revealed)return;tcClearTimer();g.revealed=true;
  const q=g.qs[g.idx],ti=tcTurn(g),t=g.teams[ti];
  g.picked=oi;g.timedOut=oi===null;g.lastOk=oi===q.correct;g.justScored=[];t.answered=(t.answered||0)+1;
  if(g.lastOk){t.score+=10;t.correct=(t.correct||0)+1;g.justScored=[ti]}
  sndPlay(g.timedOut?'tc-timeup':g.lastOk?'tc-correct':'tc-wrong')}

function tcNextRound(){
  const g=ui.tc;g.justScored=[];
  if(g.idx+1<g.order.length){g.idx++;g.picked=null;g.lastOk=false;g.timedOut=false;g.revealed=false;tcStartTimer();sndPlay('tc-turn')}
  else{tcClearTimer();g.phase='done';
    S.competitions.push({ts:Date.now(),mode:g.mode,questionCount:g.order.length,perTeam:g.count,difficulty:g.diff,topic:g.topic||'mixed',results:g.teams.map(t=>({name:t.name,score:t.score}))});
    queueResult('competition',g.diff,{mode:g.mode,diff:g.diff,topic:g.topic||'mixed',questions:g.order.length,scores:g.teams.map(t=>t.score)});
    g.newBadge=(g.mode>=2&&awardBadge('team-player'))?'team-player':null;
    persistNow();sndPlay(g.newBadge?'achievement':'complete')}}

function viewCompetition(){
  const g=ui.tc;
  if(g.phase==='play')return tcPlayHTML();
  if(g.phase==='done')return tcDoneHTML();
  return tcSetupHTML()}

function tcAvailNote(g){
  const tp=tcTopics(g.topic||'mixed'),all=qPool(tp).length,diff=qPool(tp,g.diff).length,total=tcTotal(g);
  return `${g.teams.length>1?`${g.teams.length} teams × ${g.count} questions = ${total} questions in total. `:''}Question bank for this choice: ${all} questions (${diff} at this difficulty). Questions do not repeat until the bank has been used. ${total>diff?'Some extra questions from other difficulties will be added.':''}`}
function tcSetupHTML(){
  const g=ui.tc;
  return `<div class="page"><div class="game-head"><div><h1>🏆 Team Competition</h1><p class="muted" style="margin:0">A classroom quiz on one screen. Teams play in turns: each question goes to one team, which answers and scores on its own.</p></div>${sndToggleBtn()}</div>
  <div class="tc-setup">
   <div><h3 style="margin-bottom:8px">Who is playing?</h3>
    <div class="tc-choice" role="group" aria-label="Number of teams">
     <button data-act="tc-mode" data-n="1" aria-pressed="${g.mode===1}">👤 Solo</button>
     <button data-act="tc-mode" data-n="2" aria-pressed="${g.mode===2}">👥 2 Teams</button>
     <button data-act="tc-mode" data-n="3" aria-pressed="${g.mode===3}">👥 3 Teams</button>
     <button data-act="tc-mode" data-n="4" aria-pressed="${g.mode===4}">👥 4 Teams</button>
    </div></div>
   ${g.mode>1?`<div><h3 style="margin-bottom:8px">Team names</h3><div class="tc-teams">${g.teams.map((t,i)=>`<label><span class="tc-swatch" style="background:${TC_COLORS[i]}"></span><input type="text" value="${esc(t.name)}" data-team="${i}" maxlength="24" aria-label="Name for team ${i+1}"></label>`).join('')}</div></div>`:''}
   <div><h3 style="margin-bottom:8px">Topic</h3>
    <div class="tc-choice" role="group" aria-label="Topic">${TC_TOPICS.map(([k,ic,l])=>`<button data-act="tc-topic" data-topic="${k}" aria-pressed="${(g.topic||'mixed')===k}">${ic} ${l}</button>`).join('')}</div></div>
   <div><h3 style="margin-bottom:8px">Questions per team</h3>
    <div class="tc-choice" role="group" aria-label="Questions per team">${TC_PER_TEAM.map(n=>`<button data-act="tc-count" data-n="${n}" aria-pressed="${g.count===n}">${n}</button>`).join('')}</div>
    <p class="tiny dim" style="margin-top:6px">${tcAvailNote(g)}</p></div>
   <div><h3 style="margin-bottom:8px">Difficulty</h3>
    <div class="tc-choice" role="group" aria-label="Difficulty">
     <button data-act="tc-diff" data-diff="easy" aria-pressed="${g.diff==='easy'}">🟢 Easy</button>
     <button data-act="tc-diff" data-diff="medium" aria-pressed="${g.diff==='medium'}">🟡 Medium</button>
     <button data-act="tc-diff" data-diff="advanced" aria-pressed="${g.diff==='advanced'}">🔴 Advanced</button>
    </div></div>
   <div><p class="tiny dim" style="margin:0 0 8px">Each question has a ${TC_SECONDS}-second countdown. A correct answer scores 10 points for the team whose turn it is.</p><button class="btn" data-act="tc-start" style="min-height:52px;padding:0 28px;font-size:1.05rem">Start Competition</button></div>
  </div></div>`}

function tcPlayHTML(){
  const g=ui.tc,q=g.qs[g.idx],letters=['A','B','C','D'],n=g.teams.length,ti=tcTurn(g),team=g.teams[ti],nextTeam=g.teams[(g.idx+1)%n],last=g.idx+1>=g.order.length;
  const round=Math.floor(g.idx/n)+1,pctLeft=Math.max(0,g.timeLeft)/TC_SECONDS*100;
  const optCls=oi=>{if(!g.revealed)return'';if(oi===q.correct)return 'correct'+(g.picked===oi?' pop':'');if(g.picked===oi)return 'wrong shake';return 'dim'};
  const verdict=!g.revealed?'':g.timedOut
    ?`<div class="tc-verdict late" role="status"><span class="vi" aria-hidden="true">⏰</span><div><b>Time's up!</b> No points this turn. The correct answer is <b>${letters[q.correct]}</b>.<span>${esc(q.explain)}</span></div></div>`
    :g.lastOk
    ?`<div class="tc-verdict ok" role="status"><span class="vi" aria-hidden="true">✅</span><div><b>Correct! +10 for ${esc(team.name)}</b><span>${esc(q.explain)}</span></div></div>`
    :`<div class="tc-verdict bad" role="status"><span class="vi" aria-hidden="true">❌</span><div><b>Not correct.</b> The right answer is <b>${letters[q.correct]}</b>.<span>${esc(q.explain)}</span></div></div>`;
  return `<div class="page"><div class="game-head"><h1>🏆 Team Competition</h1>${sndToggleBtn()}</div>
  <div class="tc-round"><b>ROUND ${round} / ${g.count}${n>1?` · QUESTION ${g.idx+1} / ${g.order.length}`:''}</b><span class="tc-timer ${g.timeLeft<=5&&!g.revealed?'low':''}" id="tcTimer">⏱ ${Math.max(0,g.timeLeft)}s</span></div>
  <div class="tc-timebar" aria-hidden="true"><i id="tcBar" style="width:${g.revealed?pctLeft:pctLeft}%"></i></div>
  <div class="tc-board">${g.teams.map((t,i)=>`<div class="tc-team ${i===ti?'turn':''}" style="--tc:${TC_COLORS[i%4]}"><div class="nm">${esc(t.name)}${i===ti&&n>1?' <span class="now">PLAYING</span>':''}</div><div class="sc ${g.justScored&&g.justScored.includes(i)?'bump':''}">⭐ ${t.score}${g.justScored&&g.justScored.includes(i)?'<span class="tc-float" aria-hidden="true">+10</span>':''}</div><div class="sub">${t.correct||0} / ${t.answered||0} correct</div></div>`).join('')}</div>
  <div class="tc-turnbanner" style="--tc:${TC_COLORS[ti%4]}"><span aria-hidden="true">🎯</span> <b>${esc(team.name)}</b>${n>1?'<span>, your question</span>':''}</div>
  <div class="mc-card tc-q">
   <p class="mc-scenario">${esc(q.q)}</p>
   <div class="tc-options tc-answers" role="group" aria-label="Answer options for ${esc(team.name)}">${q.options.map((o,oi)=>`<button type="button" class="tc-option ${optCls(oi)}" data-act="tc-answer" data-o="${oi}" ${g.revealed?'disabled':''} aria-label="Option ${letters[oi]}: ${esc(o)}"><b>${letters[oi]}</b><span>${esc(o)}</span></button>`).join('')}</div>
   ${!g.revealed?`<p class="tc-hint tiny dim">Tap the answer ${esc(team.name)} chooses. It is marked immediately.</p>`
    :`${verdict}<div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="tc-next">${last?'See final results':n>1?`Next: ${esc(nextTeam.name)} ▶`:'Next question ▶'}</button></div>`}
  </div></div>`}

function tcDoneHTML(){
  const g=ui.tc,ranked=g.teams.slice().sort((a,b)=>b.score-a.score);
  return `<div class="page"><div class="mc-card tc-final" style="max-width:520px;margin:0 auto">
   <div style="font-size:2.6rem" aria-hidden="true">🏆</div>
   <h2>Competition Complete!</h2>
   <div class="tc-podium">${ranked.map((t,i)=>`<div class="${i===0&&ranked.length>1&&t.score>ranked[ranked.length-1].score?'first':''}">${i===0&&ranked.length>1&&t.score>ranked[ranked.length-1].score?'🏆 ':''}${esc(t.name)}<span>⭐ ${t.score}</span><small class="tc-sub">${t.correct||0} / ${t.answered||0} correct</small></div>`).join('')}</div>
   ${g.newBadge?`<div class="badge-row" style="justify-content:center">${badgeHTML(g.newBadge,true)}</div>`:''}
   <p class="muted">Great effort! Every challenge helps you learn — keep thinking and keep practising.</p>
   <div class="row" style="justify-content:center;margin-top:14px"><button class="btn" data-act="tc-restart">Play again</button><button class="btn quiet" data-go="home">Back to home</button></div>
  </div></div>`}
/* =====================================================================
   APP CONTROLLER
   ===================================================================== */
const VIEWS={home:viewHome,about:viewAbout,cycle:viewCycle,library:viewLibrary,methods:viewMethods,competition:viewCompetition,progress:viewProgress,assessment:viewAssessment,record:viewRecord,teacher:viewTeacher,join:viewJoin};
const PAGE_ALIAS={dashboard:'progress',history:'progress'};
const HASH_PAGES=['home','about','cycle','library','methods','competition','progress','assessment','teacher'];
const PAGE_TITLES={home:'AI-CT TEACHER',about:'About the project / Loyiha haqida',cycle:'AI-CT 6C cycle',library:'Tasks / Topshiriqlar',methods:'Method Challenge',competition:'Team Competition',progress:'My progress / Natijalarim',assessment:'Result',record:'Record',teacher:'Teacher dashboard',join:'Join a class'};
let teacherTimer=null;
function stopTeacherTimer(){if(teacherTimer){clearInterval(teacherTimer);teacherTimer=null}}
function startTeacherTimer(){stopTeacherTimer();teacherTimer=setInterval(()=>{if(ui.page==='teacher'&&ui.teacher.view==='class'&&!document.hidden)teacherLoad(true);else if(ui.page!=='teacher')stopTeacherTimer()},30000)}

function render(keep){
  const y=window.scrollY;renderShell();
  try{$('#main').innerHTML=VIEWS[ui.page]()+footerHTML()}catch(e){console.error(e);$('#main').innerHTML=`<div class="page"><div class="notice b"><p>Something went wrong showing this page. Go to the home page and try again.</p></div></div>`}
  afterRender();window.scrollTo(0,keep?y:0)}
function afterRender(){
  updateLive();updateSaved();
  if(ui.page==='assessment'&&ui.justCompleted){
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    [['#scoreNum',n=>String(n)],['#xpGain',n=>'⭐ +'+n+' XP']].forEach(([sel,fmt])=>{const el=$(sel);if(!el)return;const to=+el.dataset.to;
      if(reduce){el.textContent=fmt(to);return}
      const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/900);el.textContent=fmt(Math.round(to*k));if(k<1)requestAnimationFrame(f)})(t0);setTimeout(()=>{el.textContent=fmt(to)},1100)})}}
function celebrate(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const box=document.createElement('div');box.className='confetti';box.setAttribute('aria-hidden','true');
  const cols=['#F2C14E','#2B3F8F','#237552','#5A4A98','#A3303F'];
  for(let i=0;i<28;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.background=cols[i%5];p.style.animationDelay=Math.random()*.4+'s';p.style.setProperty('--dx',(Math.random()*160-80)+'px');box.appendChild(p)}
  document.body.appendChild(box);setTimeout(()=>box.remove(),2300)}

/* ---------- routing (hash links work on GitHub Pages: #library, #join=ABC123 ...) ---------- */
function parseHash(){const h=(location.hash||'').replace(/^#/,''),m=h.match(/^join=([A-Za-z0-9]{6})$/);
  if(m)return{page:'join',code:m[1].toUpperCase()};const p=PAGE_ALIAS[h]||h;return HASH_PAGES.includes(p)?{page:p}:null}
function syncUrl(page){try{document.title=(PAGE_TITLES[page]||'AI-CT TEACHER')+' | AI-CT TEACHER';
  const want=page==='join'?'#join='+ui.join.code:HASH_PAGES.includes(page)?'#'+page:null;if(want&&location.hash!==want)history.pushState(null,'',want)}catch(e){}}
function go(page,params){
  page=PAGE_ALIAS[page]||page;params=params||{};
  if(ui.page==='competition'&&page!=='competition')tcClearTimer();
  if(ui.page==='teacher'&&page!=='teacher')stopTeacherTimer();
  ui.page=page;ui.params=params;ui.menu=false;syncUrl(page);
  if(page==='library')ui.libCategory=null;
  if(page==='assessment'&&params.id)ui.assessId=params.id;
  if(page!=='assessment'){ui.justCompleted=ui.justCompleted&&page==='record'?ui.justCompleted:null;ui.justBadges=null}
  if(page==='progress')flushOutbox();
  render();const m=$('#main');m&&m.focus({preventScroll:true});
  if(page==='teacher'&&API.base)apiCheck(!API.caps.checked||!!API.caps.err).then(()=>{if(ui.page==='teacher'){render(true);if(API.caps.classes&&ui.teacher.view==='class'&&!ui.teacher.data)teacherLoad(false)}});
  if(page==='join')joinLoad()}
function openAttempt(at){ui.aiErr='';ui.streaming=false;enterStage(at);go('cycle',{attemptId:at.id})}
function enterStage(at){
  if(at.stage===2&&!at.d.consult.prompt)at.d.consult.prompt=defaultPrompt(TASK_BY_ID[at.taskId]);
  if(at.stage===4)seedCheckRows(at)}
function rerenderStage(){const at=curAttempt(),m=$('#stageMain');if(!at||!m)return;const y=window.scrollY;m.innerHTML=stageHTML(at);updateLive();window.scrollTo(0,y)}

function updateLive(){
  if(ui.page!=='cycle')return;const at=curAttempt();if(!at)return;
  $$('[data-cnt]').forEach(el=>{const n=W(getPath(at.d,el.dataset.cnt)),min=+el.dataset.min;el.classList.toggle('ok',n>=min);el.textContent=min?`${n} / ${min}+ words`:`${n} words`});
  const rq=reqs(at,at.stage),okc=rq.filter(r=>r.ok).length,all=okc===rq.length;
  const sum=$('#reqSum');if(sum){sum.textContent=all?'✓ Ready to continue':`${rq.length-okc} thing${rq.length-okc===1?'':'s'} left before you can continue`;sum.style.color=all?'var(--good)':'var(--warn)'}
  const ul=$('#reqList');if(ul)ul.innerHTML=rq.map(r=>`<li class="${r.ok?'ok':'no'}"><i>${r.ok?'✓':'○'}</i><span>${esc(r.label)}</span></li>`).join('');
  const nb=$('#nextBtn');if(nb)nb.setAttribute('aria-disabled',String(at.stage<6?!all:![1,2,3,4,5,6].every(s=>stageOk(at,s))));
  const tl=$('#traceList');if(tl)tl.innerHTML=traceHTML(at);
  if(at.stage===2){const ctl=$('#aiCtl');if(ctl){const want=aiCtlHTML(at);if(ctl.dataset.h!==want){ctl.innerHTML=want;ctl.dataset.h=want}}}}
function refreshAi(){const at=curAttempt();if(!at||ui.page!=='cycle'||at.stage!==2)return;const o=$('#aiOut'),c=$('#aiCtl'),s=$('#aiStatus');if(s)s.innerHTML=aiStatusHTML();if(o)o.innerHTML=aiOutHTML(at);if(c){const w=aiCtlHTML(at);c.innerHTML=w;c.dataset.h=w}updateLive()}
function refreshAiOut(){const at=curAttempt(),o=$('#aiOut');if(at&&o&&ui.page==='cycle'&&at.stage===2)o.innerHTML=aiOutHTML(at)}

/* ---------- AI (Consult) ---------- */
const AI_DOWN='AI service is temporarily unavailable. You can continue the activity using the verification and reasoning steps. The demonstration answer is always available.';
async function askAI(forceDemo){
  const at=curAttempt();if(!at||ui.streaming)return;
  const t=TASK_BY_ID[at.taskId],prompt=(at.d.consult.prompt||'').trim();
  if(W(prompt)<4){toast('Write a question of at least 4 words');return}
  if(at.d.consult.response&&(Object.keys(at.d.critique.tags).length||at.d.check.rows.length)){
    const ok=await confirmBox('Replace the AI answer?','Your marks and checked claims for the current answer will be cleared.','Replace');if(!ok)return}
  ui.aiErr='';const m=forceDemo?'demo':aiMode();
  if(m==='demo'){recordConsult(at,'demo',prompt,demoParas(t),t.ai.slice());sndPlay('ai');refreshAi();return}
  ui.streaming=true;ui.stream='';refreshAi();
  try{
    if(m==='backend'){
      const d=await askBackendAI(t.context,'consult',prompt);ui.streaming=false;
      recordConsult(at,'backend',prompt,d.response,splitSegs(d.response),{claims:d.claims_to_check||[],assumptions:d.possible_assumptions||[],uncertainty:d.uncertainty||'',followUp:d.follow_up_question||''})}
    else{
      const r=await AI.sample(FRAME+'Scenario: '+t.context+'\n\nRequest: '+prompt,{cache:false,onText:({text})=>{ui.stream=text;refreshAiOut()}});
      ui.streaming=false;recordConsult(at,'live',prompt,r.text,splitSegs(r.text))}
    sndPlay('ai')}
  catch(e){ui.streaming=false;ui.aiErr=AI_DOWN}
  refreshAi()}

/* ---------- classes: student ---------- */
async function joinLoad(){
  const J=ui.join;J.info=null;J.err='';J.busy=false;
  if(!API.base||!J.code){render(true);return}
  await apiCheck();
  if(ui.page!=='join')return;
  if(!API.caps.classes||memberOf(J.code)){render(true);return}
  try{J.info=await classInfo(J.code)}catch(e){J.err=e.status===404?'Class not found. Check the link or the code.':errText(e.code)}
  if(ui.page==='join')render(true)}
function refreshAfterCaps(){
  if(ui.page==='cycle')refreshAi();
  else if(ui.page==='teacher'){render(true);if(API.caps.classes&&ui.teacher.view==='class'&&!ui.teacher.data)teacherLoad(false)}
  else if(ui.page==='join')joinLoad();
  if(API.caps.classes)flushOutbox()}

/* ---------- classes: teacher ---------- */
async function teacherLoad(silent){
  const T=ui.teacher;if(!T.code)return;
  if(!silent){T.data=null;T.err=''}
  try{T.data=await fetchDashboard(T.code);T.err='';T.updated=Date.now()}
  catch(e){
    if(e.status===401||e.status===403)T.err='This device\'s teacher key is not accepted for this class. Open the class again with the correct key.';
    else if(e.status===404)T.err='This class no longer exists on the server.';
    else if(!silent)T.err=errText(e.code)}
  if(ui.page==='teacher'&&ui.teacher.view==='class')render(true)}
function saveText(filename,data,mime){
  try{const blob=new Blob([data],{type:mime}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('File downloaded')}
  catch(e){modal({title:'Copy this text',html:`<p class="small muted">Save it as <b>${esc(filename)}</b>.</p><pre class="export" tabindex="0">${esc(data.slice(0,60000))}</pre>`,actions:[{label:'Close',val:true}]})}}
async function copyText(txt){
  try{await navigator.clipboard.writeText(txt);toast('Copied');return}catch(e){}
  try{const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Copied')}catch(e){toast('Select the text and copy it')}}

/* ---------- preferences ---------- */
function applyPrefs(){
  const r=document.documentElement;if(S.prefs.theme)r.dataset.theme=S.prefs.theme;
  if(S.prefs.projector)r.dataset.projector='1';else delete r.dataset.projector}

/* ---------- click handling ---------- */
document.addEventListener('click',async e=>{
  if(e.target.id==='scrim'){ui.menu=false;renderShell();return}
  const el=e.target.closest('[data-go],[data-act],[data-scale]');if(!el)return;
  if(el.getAttribute('aria-disabled')==='true'&&!['stage','next','finish','pick1','pick5'].includes(el.dataset.act))return;
  if(el.dataset.go){go(el.dataset.go,el.dataset.id?{id:el.dataset.id}:{});return}
  if(el.dataset.scale){const at=curAttempt();if(!at)return;setPath(at.d,el.dataset.scale,+el.dataset.val);touch(at);$$(`[data-scale="${el.dataset.scale}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b===el)));updateLive();return}
  const a=el.dataset.act,at=curAttempt(),T=ui.teacher;
  switch(a){
   case 'menu':ui.menu=!ui.menu;renderShell();break;
   case 'theme':{const cur=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');S.prefs.theme=cur==='dark'?'light':'dark';persist();applyPrefs();break}
   case 'sound':case 'snd-toggle':S.prefs.sound=!sndEnabled();persist();if(sndEnabled())sndPlay('start');render(true);break;
   case 'projector':S.prefs.projector=!S.prefs.projector;persist();applyPrefs();render(true);toast(S.prefs.projector?'Projector mode on: larger text':'Projector mode off');break;
   case 'fullscreen':try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen()}catch(x){toast('Full screen is not available here')}break;
   case 'copy':copyText(el.dataset.text);break;
   case 'about-lang':ui.aboutLang=el.dataset.lang;render(true);break;
   case 'profile-save':{const v=($('#nameIn')||{}).value;if(!setProfileName(v)){toast('Please write a name');break}sndPlay('start');toast('Saved. Salom, '+profileName()+'!');render(true);break}
   case 'random-task':{const todo=TASKS.filter(t=>!attemptsFor(t.id).some(x=>x.status==='completed')),pool=todo.length?todo:TASKS,t=pool[Math.floor(Math.random()*pool.length)];sndPlay('start');openAttempt(inProgressFor(t.id)||newAttempt(t.id));break}
   case 'start-task':{const t=el.dataset.task;sndPlay('start');openAttempt(inProgressFor(t)||newAttempt(t));break}
   case 'continue':{const x=S.attempts[el.dataset.attempt];if(x)openAttempt(x);break}
   case 'lib-open':ui.libCategory=el.dataset.cat;render();break;
   case 'lib-back':ui.libCategory=null;render();break;
   /* --- 6C stages --- */
   case 'pick1':{if(!at||at.d.context.pick>=0)break;at.d.context.pick=+el.dataset.i;touch(at);sndPlay(at.d.context.pick===TASK_BY_ID[at.taskId].q1.best?'correct':'wrong');rerenderStage();break}
   case 'pick5':{if(!at||at.d.challenge.pick>=0)break;at.d.challenge.pick=+el.dataset.i;touch(at);sndPlay('start');rerenderStage();break}
   case 'decide':if(at){at.d.conclude.decision=el.dataset.v;touch(at);$$('[data-act="decide"]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));updateLive()}break;
   case 'ask':askAI(false);break;
   case 'ask-demo':askAI(true);break;
   case 'tag':{if(!at)break;const tg=at.d.critique.tags,i=+el.dataset.i,t=el.dataset.t;if(tg[i]===t)delete tg[i];else tg[i]=t;touch(at);$('#segs').innerHTML=segsHTML(at);updateLive();break}
   case 'verdict':{if(!at)break;const r=at.d.check.rows.find(x=>x.id===el.dataset.rid);if(!r)break;r.verdict=r.verdict===el.dataset.v?'':el.dataset.v;touch(at);$$(`[data-act="verdict"][data-rid="${r.id}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===r.verdict)));updateLive();break}
   case 'add-row':if(at){at.d.check.rows.push({id:uid('r'),seg:null,claim:'',sourceType:'',evidence:'',verdict:'',exp:'',why:''});touch(at);rerenderStage()}break;
   case 'del-row':if(at){at.d.check.rows=at.d.check.rows.filter(x=>x.id!==el.dataset.rid);touch(at);rerenderStage()}break;
   case 'stage':{if(!at)break;const n=+el.dataset.stage;if(n===at.stage)break;if(canEnter(at,n)){at.stage=n;enterStage(at);persistNow();render()}else toast('Complete the earlier stages first. Stages are done in order.');break}
   case 'next':{
     if(!at)break;
     if(!stageOk(at,at.stage)){toast('Complete the checklist to continue');const d=$('.reqs');if(d)d.open=true;break}
     if(isDemo(at)&&at.stage===3)await modal({title:'Your critique, checked',html:critiqueFeedbackHTML(at),actions:[{label:'Continue',val:true}]});
     if(isDemo(at)&&at.stage===4&&at.d.check.rows.some(r=>r.exp&&r.verdict))await modal({title:'Your verdicts, checked',html:checkFeedbackHTML(at),actions:[{label:'Continue',val:true}]});
     at.stage++;at.maxStage=Math.max(at.maxStage,at.stage);enterStage(at);persistNow();sndPlay('stage');render();break}
   case 'back':if(at&&at.stage>1){at.stage--;persistNow();render()}break;
   case 'later':if(at){persistNow();go('progress');toast('Progress saved. Continue any time.')}break;
   case 'finish':{
     if(!at)break;
     if(at.status==='completed'){go('assessment',{id:at.id});break}
     const bad=[1,2,3,4,5,6].find(s=>!stageOk(at,s));
     if(bad){toast(`Stage ${bad} (${STAGES[bad-1].name}) is not complete yet`);const d=$('.reqs');if(d)d.open=true;break}
     const res=completeAttempt(at);ui.justCompleted=at.id;ui.justBadges=res.badges;ui.justXp=res.xp;
     sndPlay(res.badges.length?'achievement':'complete');celebrate();go('assessment',{id:at.id});break}
   /* --- games --- */
   case 'mc-start':mcNewRound(el.dataset.diff);sndPlay('start');render();break;
   case 'mc-answer':{const g=ui.mc;if(!g||g.picked!=null)break;const i=+el.dataset.i,q=g.qs[g.idx];g.picked=i;
     if(i===q.correct){g.correct++;g.justEarned+=10;addXP(10);sndPlay('correct')}else sndPlay('wrong');render();break}
   case 'mc-next':{const g=ui.mc;if(!g)break;
     if(g.idx+1<g.order.length){g.idx++;g.picked=null;render()}
     else{g.phase='done';S.methodRounds.push({ts:Date.now(),diff:g.diff,correct:g.correct,total:g.order.length,xp:g.justEarned});bumpStreak();
       queueResult('method',g.diff,{diff:g.diff,correct:g.correct,total:g.order.length,xp:g.justEarned});
       if(g.correct>=8&&awardBadge('method-master')){g.newBadge='method-master';sndPlay('achievement');celebrate()}else sndPlay('complete');
       persistNow();render()}break}
   case 'mc-restart':ui.mc={phase:'setup'};render();break;
   case 'tc-mode':tcSetMode(+el.dataset.n);render();break;
   case 'tc-count':ui.tc.count=+el.dataset.n;render(true);break;
   case 'tc-diff':ui.tc.diff=el.dataset.diff;render(true);break;
   case 'tc-topic':ui.tc.topic=el.dataset.topic;render(true);break;
   case 'tc-start':tcStart();sndPlay('start');render();break;
   case 'tc-answer':{const g=ui.tc;if(g.revealed)break;tcAnswer(+el.dataset.o);render();if(g.lastOk)celebrate();break}
   case 'tc-next':tcNextRound();render();break;
   case 'tc-restart':ui.tc={phase:'setup',mode:1,teams:[{name:'You',score:0}],count:5,diff:'easy',topic:'mixed'};render();break;
   /* --- records, data --- */
   case 'sample':{const x=createSample();ui.assessId=x.id;toast('Sample record loaded. It is labelled SAMPLE.');render(true);break}
   case 'export':doExport(el.dataset.kind,el.dataset.id||null);break;
   case 'delete-record':{const ok=await confirmBox('Delete this record?','It will be removed from this device. XP already earned stays.','Delete');if(ok){delete S.attempts[el.dataset.id];S.order=S.order.filter(i=>i!==el.dataset.id);persistNow();go('progress')}break}
   case 'reset':{const ok=await confirmBox('Delete all my data on this device?','This removes your account, records, XP and badges here. If you are in a class, leave the class first so your results are also removed from your teacher\'s list. This cannot be undone.','Delete everything');
     if(ok){try{localStorage.removeItem(KEY)}catch(x){}const p=S.prefs;S=sanitizeState(null);S.prefs=p;persistNow();ui.assessId=null;go('home');toast('All data deleted')}break}
   /* --- student: class --- */
   case 'join-open':{const code=parseClassCode(($('#joinIn')||{}).value);if(!code){toast('Enter the 6-character class code or the link');break}ui.join={code,info:null,err:'',busy:false};go('join');break}
   case 'join-confirm':{
     const J=ui.join,name=cleanName(($('#jName')||{}).value);if(!name){toast('Please write your name');break}
     J.busy=true;J.err='';render(true);
     try{await joinClass(J.code,name);sndPlay('achievement');toast('You joined the class');go('home')}
     catch(x){J.busy=false;J.err=x.code==='class_full'?errText('class_full'):x.status===404?'Class not found.':errText(x.code);render(true)}break}
   case 'leave-class':{
     const code=el.dataset.code,ok=await confirmBox('Leave this class?','Your results will be removed from the teacher\'s list. Your own records stay on this device.','Leave');if(!ok)break;
     try{await leaveClass(code,false);toast('You left the class');render(true)}
     catch(x){const f=await confirmBox('Could not reach the server','Remove the class from this device only? Your teacher may still see earlier results until you leave again when you are online.','Remove here');if(f){await leaveClass(code,true);render(true)}}break}
   case 'api-retry':apiCheck(true).then(refreshAfterCaps);render(true);break;
   /* --- teacher --- */
   case 'class-create':{
     const name=cleanName(($('#tcName')||{}).value),tn=cleanName(($('#tcTeacher')||{}).value);if(!name){toast('Please write a class name');break}
     T.loading=true;T.err='';render(true);
     try{const c=await createClass(name,tn);T.newKey={code:c.code,key:c.key};sndPlay('achievement')}catch(x){T.err=errText(x.code)}
     T.loading=false;render(true);break}
   case 'class-open':{T.code=el.dataset.code;T.view='class';T.data=null;T.err='';T.showCode=false;T.showKey=false;T.newKey=null;render();teacherLoad(false);startTeacherTimer();break}
   case 'class-attach':{
     const code=parseClassCode(($('#okCode')||{}).value),key=(($('#okKey')||{}).value||'').trim();if(!code||!key){toast('Enter the class code and the teacher key');break}
     openClassWithKey(code,key,code);T.code=code;T.view='class';T.data=null;T.err='';render();
     try{T.data=await fetchDashboard(code);const nm=T.data.class&&T.data.class.name;const c=teacherClass(code);if(c&&nm)c.name=nm;persistNow();T.updated=Date.now();startTeacherTimer()}
     catch(x){S.teacherClasses=S.teacherClasses.filter(c=>c.code!==code);persistNow();T.view='home';T.code=null;T.err=x.status===403||x.status===401?errText('forbidden'):x.status===404?errText('not_found'):errText(x.code)}
     render(true);break}
   case 'class-back':stopTeacherTimer();T.view='home';T.code=null;T.data=null;T.err='';T.showCode=false;render();break;
   case 'class-refresh':T.err='';render(true);teacherLoad(true);break;
   case 'class-csv':if(T.data)saveText(`ai-ct-class-${T.code}-${new Date().toISOString().slice(0,10)}.csv`,'\ufeff'+classCSV(T.data),'text/csv;charset=utf-8');break;
   case 'key-toggle':T.showKey=!T.showKey;render(true);break;
   case 'projector-code':T.showCode=!T.showCode;render(true);break;
   case 'class-delete':{const ok=await confirmBox('Delete this class?','All students and results of this class are deleted from the server. This cannot be undone.','Delete class');if(!ok)break;
     try{await deleteClass(el.dataset.code);stopTeacherTimer();T.view='home';T.code=null;T.data=null;toast('Class deleted')}catch(x){T.err=errText(x.code)}render();break}
   case 'student-remove':{const ok=await confirmBox('Remove '+el.dataset.name+'?','Their results are deleted from this class.','Remove');if(!ok)break;
     try{await removeStudent(T.code,el.dataset.sid);toast('Student removed');teacherLoad(true)}catch(x){toast(errText(x.code))}break}
   case 'teacher-sort':{const k=el.dataset.k;ui.tSort=ui.tSort.k===k?{k,dir:-ui.tSort.dir}:{k,dir:(k==='id'||k==='low'||k==='name')?1:-1};render(true);break}
   case 'teacher-student':ui.tStudent=el.dataset.id||null;render(true);break;
  }});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('tr[data-act]')){e.preventDefault();e.target.click()}});

/* ---------- input handling (autosave) ---------- */
function onField(e){
  const t=e.target;if(!t||!t.dataset)return;
  if(t.dataset.b){const at=curAttempt();if(!at||ui.page!=='cycle')return;setPath(at.d,t.dataset.b,t.value);touch(at);updateLive();return}
  if(t.dataset.rowF){const at=curAttempt();if(!at)return;const r=at.d.check.rows.find(x=>x.id===t.dataset.rid);if(!r)return;r[t.dataset.rowF]=t.value;touch(at);updateLive();return}
  if(t.dataset.team!==undefined){const g=ui.tc,i=+t.dataset.team;if(g&&g.teams[i])g.teams[i].name=t.value.slice(0,24)||`Team ${String.fromCharCode(65+i)}`;return}
  if(e.type==='change'){const s=t.dataset.sel;if(s==='ttask'){ui.tTask=t.value;ui.tStudent=null;render(true)}}}
document.addEventListener('input',onField);document.addEventListener('change',onField);
window.addEventListener('beforeunload',()=>{try{persistNow()}catch(e){}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='nameIn'){e.preventDefault();const b=$('[data-act="profile-save"]');b&&b.click()}});

/* ---------- init ---------- */
(function init(){
  applyPrefs();
  /* Browsers only allow sound after the first tap, click or key press, so the welcome chime plays then. */
  let welcomed=false;const welcome=()=>{if(welcomed)return;welcomed=true;if(sndEnabled())sndPlay('welcome')};
  ['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,welcome,{passive:true}));
  const h=parseHash();if(h){ui.page=h.page;if(h.page==='join')ui.join={code:h.code,info:null,err:'',busy:false}}
  window.addEventListener('popstate',()=>{const p=parseHash();ui.page=p?p.page:'home';ui.params={};ui.menu=false;if(p&&p.page==='join')ui.join={code:p.code,info:null,err:'',busy:false};render();if(ui.page==='join')joinLoad()});
  try{document.title=(PAGE_TITLES[ui.page]||'AI-CT TEACHER')+' | AI-CT TEACHER'}catch(e){}
  render();initCaps();
  if(ui.page==='join')joinLoad();
  apiCheck().then(refreshAfterCaps);
  window.addEventListener('online',()=>apiCheck(true).then(refreshAfterCaps));
  setInterval(()=>{if(S.outbox.length&&API.base)flushOutbox()},60000)})();
