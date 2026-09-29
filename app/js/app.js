/* AI-CT TEACHER — Sarvinoz Solexonovna | SamDChTI
   Standalone educational app. No external libraries required.
   AI endpoint can be connected later via Settings -> AI endpoint.
*/
(() => {
'use strict';

const AUTHOR='Sarvinoz Solexonovna';
const INSTITUTION='Samarkand State Institute of Foreign Languages (SamDChTI)';
const APP='AI-CT TEACHER';
const METHODS=[
 ['Evidence before conclusion','Use evidence before accepting a claim','🔎'],
 ['Socratic questioning','Ask questions that uncover assumptions','❓'],
 ['Compare perspectives','Examine more than one reasonable viewpoint','🪞'],
 ['Cause and effect','Separate causes, effects and coincidences','🔗'],
 ['Claim–Evidence–Reasoning','Connect a claim to evidence and reasoning','🧩'],
 ['Fact vs opinion','Distinguish verifiable facts from personal views','⚖️'],
 ['Source evaluation','Check who created information and why','🌐'],
 ['Bias detection','Look for wording, selection and framing bias','🧠'],
 ['Problem decomposition','Break a large problem into smaller parts','🧱'],
 ['Counterargument','Test an idea against a credible alternative','🥊'],
 ['Reflection','Review how and why you reached a conclusion','🪞'],
 ['Decision matrix','Compare choices using explicit criteria','📊']
];
const CATEGORIES=[
 ['Critical Thinking','🧠','Reasoning, evidence and judgement'],['AI & Teaching','🤖','AI in real English lessons'],['Fact Checking','🔍','Claims, sources and verification'],['Communication','💬','Clear questions, dialogue and feedback'],['Ethics','⚖️','Fair, responsible and human-centred AI'],['Media & Information','📰','Posts, headlines and digital information'],['Teaching Methods','👩‍🏫','Practical classroom decisions'],['Problem Solving','💡','Break down and solve teaching problems']
];
const STAGES=[
 ['Context','Read the real classroom situation','📍'],
 ['Consult','Ask or use a source','🤖'],
 ['Critique','Question the answer','🧐'],
 ['Check','Check evidence or details','🔎'],
 ['Challenge','Try another possibility','⚡'],
 ['Reflect','Explain what you learned','💭']
];
const BADGES=[['first','First Step','Complete your first activity','🌱'],['sharp','Sharp Eye','Get 5 correct answers in a row','👁️'],['checker','Fact Checker','Complete a verification task','🔎'],['thinker','Deep Thinker','Finish a 6C task','🧠'],['team','Team Player','Finish a competition','🤝'],['streak','Hot Streak','Reach a 7-answer streak','🔥'],['ai','AI Critic','Use AI Coach feedback','🤖'],['master','Critical Thinker','Earn 1000 XP','🏆']];

function Q(id,method,diff,text,options,correct,why){return {id,method,diff,text,options,correct,why};}
const METHOD_BANK=[
  Q("m01", "Communicative Language Teaching", "Easy", "Students practise ordering food by speaking to each other. The teacher focuses on communication. Which method is this?", ["Communicative Language Teaching", "Grammar-Translation Method", "Audio-Lingual Method", "PPP"], "Communicative Language Teaching", "Students use language to communicate in a realistic situation."),
  Q("m02", "Communicative Language Teaching", "Easy", "Students work in pairs and ask each other about their weekend. What is the main idea?", ["Real communication", "Only grammar translation", "Only repetition", "Silent reading"], "Real communication", "Pair interaction and meaningful communication are central to CLT."),
  Q("m03", "Communicative Language Teaching", "Medium", "The teacher gives a speaking task and lets students choose their own words. Which method fits?", ["Communicative Language Teaching", "Grammar-Translation Method", "Audio-Lingual Method", "Direct Method"], "Communicative Language Teaching", "The focus is meaningful communication rather than controlled translation."),
  Q("m04", "Communicative Language Teaching", "Easy", "A teacher wants students to use English for real-life conversations. Which method is a natural choice?", ["Communicative Language Teaching", "Grammar-Translation Method", "Audio-Lingual Method", "TPR"], "Communicative Language Teaching", "CLT gives learners opportunities to communicate in meaningful situations."),
  Q("m05", "Task-Based Language Teaching", "Easy", "Students must plan a class trip and use English to agree on a plan. Which method is this?", ["Task-Based Language Teaching", "Grammar-Translation Method", "Audio-Lingual Method", "Direct Method"], "Task-Based Language Teaching", "Students use English to complete a meaningful task."),
  Q("m06", "Task-Based Language Teaching", "Easy", "The teacher gives students a problem to solve in English. The task comes first. Which method?", ["Task-Based Language Teaching", "PPP", "Grammar-Translation Method", "TPR"], "Task-Based Language Teaching", "TBLT uses meaningful tasks as the main part of learning."),
  Q("m07", "Task-Based Language Teaching", "Medium", "Students work in groups to decide how to spend a small travel budget. What is the key feature?", ["Using English to complete a task", "Translating ten sentences", "Repeating one sentence", "Memorising rules"], "Using English to complete a task", "The language is used as students work toward a clear outcome."),
  Q("m08", "Task-Based Language Teaching", "Easy", "Which classroom activity best matches TBLT?", ["Solve a problem together in English", "Copy ten grammar rules", "Translate a paragraph", "Repeat one sentence 20 times"], "Solve a problem together in English", "A meaningful task is the centre of TBLT."),
  Q("m09", "PPP", "Easy", "The teacher first explains the present simple, then students practise it, then speak using it. Which method?", ["PPP", "TPR", "Project-Based Learning", "Grammar-Translation Method"], "PPP", "PPP means Presentation, Practice and Production."),
  Q("m10", "PPP", "Easy", "Which order is correct in PPP?", ["Presentation → Practice → Production", "Production → Translation → Test", "Practice → Presentation → Translation", "Reading → Translation → Grammar"], "Presentation \u2192 Practice \u2192 Production", "The three stages give PPP its name."),
  Q("m11", "PPP", "Medium", "Students first see examples of a new grammar point. Then they do controlled exercises. What usually comes next?", ["Production", "Translation only", "Silent reading", "A new presentation"], "Production", "In PPP, learners then use the language more freely."),
  Q("m12", "PPP", "Easy", "A teacher models new vocabulary, gives controlled practice, then asks students to use it in a short dialogue. Which method?", ["PPP", "TPR", "Audio-Lingual", "Grammar-Translation"], "PPP", "The lesson follows presentation, practice and production."),
  Q("m13", "Direct Method", "Easy", "The teacher teaches the word \u201capple\u201d by showing an apple and saying the English word. No translation is used. Which method?", ["Direct Method", "Grammar-Translation Method", "PPP", "Flipped Classroom"], "Direct Method", "The Direct Method teaches meaning through the target language rather than translation."),
  Q("m14", "Direct Method", "Easy", "The teacher asks simple questions in English and students answer in English. Translation is avoided. Which method fits?", ["Direct Method", "Grammar-Translation Method", "Audio-Lingual Method", "Project-Based Learning"], "Direct Method", "The target language is used directly in classroom interaction."),
  Q("m15", "Direct Method", "Medium", "Which activity best matches the Direct Method?", ["Show a picture and ask students questions in English", "Translate a grammar rule", "Translate a long text", "Memorise a word list in the first language"], "Show a picture and ask students questions in English", "Meaning is taught through demonstration and target-language use."),
  Q("m16", "Direct Method", "Easy", "A teacher wants students to connect English words directly with meaning. Which method?", ["Direct Method", "Grammar-Translation Method", "PPP", "Audio-Lingual Method"], "Direct Method", "The method avoids relying on first-language translation."),
  Q("m17", "Grammar-Translation Method", "Easy", "Students translate an English text into Uzbek and study grammar rules. Which method?", ["Grammar-Translation Method", "CLT", "TPR", "Task-Based Language Teaching"], "Grammar-Translation Method", "Translation and explicit grammar study are central features."),
  Q("m18", "Grammar-Translation Method", "Easy", "The teacher asks students to translate ten sentences and explain grammar rules. Which method?", ["Grammar-Translation Method", "Project-Based Learning", "TPR", "CLT"], "Grammar-Translation Method", "The lesson centres on translation and grammar rules."),
  Q("m19", "Grammar-Translation Method", "Medium", "Which activity best matches Grammar-Translation?", ["Translate a passage and study its grammar", "Role-play a restaurant conversation", "Solve a group task", "Act out classroom commands"], "Translate a passage and study its grammar", "Translation and grammar analysis are key features."),
  Q("m20", "Grammar-Translation Method", "Easy", "Students learn grammar rules and translate sentences. What is the main focus?", ["Grammar and translation", "Free conversation", "Physical movement", "A long project"], "Grammar and translation", "The method focuses on form, rules and translation."),
  Q("m21", "Audio-Lingual Method", "Easy", "The teacher says \u201cI am a student\u201d and the class repeats it several times. Which method?", ["Audio-Lingual Method", "Project-Based Learning", "CLT", "Flipped Classroom"], "Audio-Lingual Method", "Repetition and pattern practice are typical of the Audio-Lingual Method."),
  Q("m22", "Audio-Lingual Method", "Easy", "Students repeat a sentence and change one word each time: \u201cI like tea / I like coffee.\u201d What method?", ["Audio-Lingual Method", "Grammar-Translation Method", "TPR", "Project-Based Learning"], "Audio-Lingual Method", "Students practise language patterns through repetition and substitution."),
  Q("m23", "Audio-Lingual Method", "Medium", "Which activity best matches the Audio-Lingual Method?", ["Repeat and practise a sentence pattern", "Write a project report", "Translate a story", "Choose a research topic"], "Repeat and practise a sentence pattern", "Pattern drills are a key feature."),
  Q("m24", "Audio-Lingual Method", "Easy", "A teacher uses many oral drills before students create their own sentences. Which method?", ["Audio-Lingual Method", "CLT", "Flipped Classroom", "Project-Based Learning"], "Audio-Lingual Method", "The method relies strongly on controlled oral practice."),
  Q("m25", "Total Physical Response", "Easy", "The teacher says \u201cStand up\u201d and students stand up. Which method?", ["Total Physical Response", "Grammar-Translation Method", "PPP", "Project-Based Learning"], "Total Physical Response", "Students respond to language with physical actions."),
  Q("m26", "Total Physical Response", "Easy", "Students learn classroom commands by doing the actions. Which method?", ["Total Physical Response", "Audio-Lingual Method", "CLT", "Grammar-Translation Method"], "Total Physical Response", "TPR links language with physical movement."),
  Q("m27", "Total Physical Response", "Medium", "Which activity best matches TPR for beginners?", ["Listen to commands and do the actions", "Translate a paragraph", "Write a research report", "Memorise grammar rules"], "Listen to commands and do the actions", "Physical response helps beginners connect language with meaning."),
  Q("m28", "Total Physical Response", "Easy", "A teacher says \u201copen your book\u201d and students perform the action. What method is being used?", ["Total Physical Response", "Project-Based Learning", "PPP", "Grammar-Translation Method"], "Total Physical Response", "The language is learned through physical response."),
  Q("m29", "Cooperative Learning", "Easy", "Students work in small groups, share roles and help each other complete a task. Which approach?", ["Cooperative Learning", "Grammar-Translation Method", "Direct Method", "Audio-Lingual Method"], "Cooperative Learning", "Students learn through structured group work and shared responsibility."),
  Q("m30", "Cooperative Learning", "Easy", "Each student in a group has a role: speaker, writer, checker and timekeeper. What approach?", ["Cooperative Learning", "TPR", "PPP", "Grammar-Translation Method"], "Cooperative Learning", "Clear roles support cooperation and shared responsibility."),
  Q("m31", "Cooperative Learning", "Medium", "Which classroom plan best shows cooperative learning?", ["Students solve a task together and each member has a role", "Students work alone silently", "The teacher translates every sentence", "Students repeat one sentence together"], "Students solve a task together and each member has a role", "Cooperative learning uses purposeful group interaction."),
  Q("m32", "Cooperative Learning", "Easy", "The teacher wants students to learn from each other in small groups. Which approach?", ["Cooperative Learning", "Audio-Lingual Method", "Grammar-Translation Method", "Direct Method"], "Cooperative Learning", "Peer interaction and shared work are central."),
  Q("m33", "Project-Based Learning", "Easy", "Students spend several weeks creating an English poster about local tourism and present it. Which approach?", ["Project-Based Learning", "Audio-Lingual Method", "TPR", "Grammar-Translation Method"], "Project-Based Learning", "Students create a meaningful final product over time."),
  Q("m34", "Project-Based Learning", "Easy", "Students choose a topic, research it and present a final product. Which approach?", ["Project-Based Learning", "PPP", "Direct Method", "Audio-Lingual Method"], "Project-Based Learning", "A longer project leads to a final product."),
  Q("m35", "Project-Based Learning", "Medium", "Which activity best matches Project-Based Learning?", ["Create and present a project about a real topic", "Repeat ten sentence patterns", "Translate ten sentences", "Practise one grammar rule for five minutes"], "Create and present a project about a real topic", "Projects involve sustained work toward a meaningful product."),
  Q("m36", "Project-Based Learning", "Easy", "A class creates a final English magazine after researching a topic. What approach?", ["Project-Based Learning", "TPR", "Grammar-Translation Method", "Audio-Lingual Method"], "Project-Based Learning", "Students produce a substantial final product."),
  Q("m37", "Flipped Classroom", "Easy", "Students watch a short lesson video at home and practise the language in class. Which model?", ["Flipped Classroom", "Grammar-Translation Method", "TPR", "Audio-Lingual Method"], "Flipped Classroom", "Basic input is studied before class and class time is used for practice."),
  Q("m38", "Flipped Classroom", "Easy", "Students read the teacher\u2019s short explanation before class. In class they solve tasks with the teacher. Which model?", ["Flipped Classroom", "Project-Based Learning", "Direct Method", "Audio-Lingual Method"], "Flipped Classroom", "Students prepare before class so class time can focus on active learning."),
  Q("m39", "Flipped Classroom", "Medium", "Which plan best matches a flipped classroom?", ["Watch a short lesson before class, then practise and discuss in class", "Explain everything for the whole lesson and give no practice", "Translate a text in class only", "Repeat one sentence all lesson"], "Watch a short lesson before class, then practise and discuss in class", "The model moves some direct instruction before class."),
  Q("m40", "Flipped Classroom", "Easy", "The teacher wants class time for speaking practice, so students study the grammar video before class. Which model?", ["Flipped Classroom", "Grammar-Translation Method", "TPR", "Audio-Lingual Method"], "Flipped Classroom", "Pre-class study frees class time for active practice.")
];

const COMP_EXTRA=[["A student is silent in pair work. What is a simple first step?",["Give both students a clear question to discuss","Give the student a zero","Stop pair work","Ask AI to speak"],"Give both students a clear question to discuss"],["Students make many grammar mistakes while speaking. What should the teacher do?",["Let them finish, then give useful feedback","Stop every sentence","End the speaking task","Translate everything"],"Let them finish, then give useful feedback"],["A speaking task is too difficult for the class. What is a good response?",["Make the task shorter or add an example","Give a harder task","Remove all speaking","Use only grammar"],"Make the task shorter or add an example"],["Students know a new word but do not use it. What can help?",["Ask them to use it in a short real-life sentence","Make them copy it 20 times","Skip the word","Test spelling only"],"Ask them to use it in a short real-life sentence"],["A teacher wants more student talk. Which activity helps?",["Pair information-gap speaking","Teacher talks for the whole lesson","Silent copying","Grammar translation only"],"Pair information-gap speaking"],["A student gives a wrong answer but has a good reason. What should the teacher do?",["Ask the student to explain the reason and guide them","Say only 'wrong'","Move on immediately","Give the answer without discussion"],"Ask the student to explain the reason and guide them"],["AI gives a useful activity but it is too long. What should the teacher do?",["Adapt it to the lesson time","Use it exactly","Delete all activities","Ask students to finish at home"],"Adapt it to the lesson time"],["A student says a source is true because many people shared it. What should they check?",["The original source and evidence","The number of shares only","The picture","The comments only"],"The original source and evidence"],["Two students have different answers. What is the best classroom move?",["Ask both to explain their evidence","Choose one quickly","Let the louder student win","Stop the task"],"Ask both to explain their evidence"],["A teacher uses an AI-generated worksheet. What should be checked before class?",["Accuracy and fit with the lesson","The AI logo","The number of colours","The file name"],"Accuracy and fit with the lesson"],["Students finish a task very quickly. What should the teacher do?",["Check whether the task was clear and challenging enough","Always give more homework","End the course","Ignore it"],"Check whether the task was clear and challenging enough"],["A student asks for the answer before trying. What is a helpful response?",["Ask a guiding question first","Give the answer immediately","Refuse to help","Ask another student to do it"],"Ask a guiding question first"],["A teacher wants to check speaking progress. What is useful?",["Use a simple speaking task and compare performance","Count notebook pages","Count emojis","Check handwriting only"],"Use a simple speaking task and compare performance"],["Students use phones during a lesson. What should the teacher do first?",["Check what they are doing and set a clear task rule","Take every phone immediately","Ignore everything","Cancel the lesson"],"Check what they are doing and set a clear task rule"],["A lesson activity needs fast internet, but the connection is weak. What should the teacher do?",["Have a simple offline backup","Continue without a plan","End the lesson","Ask students to leave"],"Have a simple offline backup"],["A student is afraid to speak. Which support is useful?",["Let them practise with a partner first","Force a long speech immediately","Give a zero","Do nothing"],"Let them practise with a partner first"],["A group has one strong speaker and three quiet students. What can help?",["Give each student a turn or role","Let the strong speaker do everything","Cancel the group","Choose a new class"],"Give each student a turn or role"],["A teacher wants to use a new method. What should come first?",["Set a clear learning goal","Choose a colourful slide","Buy a new app","Choose background music"],"Set a clear learning goal"],["A student copies an AI answer but cannot explain it. What should the teacher ask?",["Ask the student to explain the idea in their own words","Give a higher mark","Ignore it","Ask AI to explain instead"],"Ask the student to explain the idea in their own words"],["A lesson has a clear goal but the activity does not match it. What should change?",["The activity should be changed to support the goal","The goal should always be removed","Nothing","The classroom should change"],"The activity should be changed to support the goal"],["A student says, 'This method is popular, so it works.' What should they do?",["Look for evidence of effectiveness","Count followers","Use it immediately","Ask for more advertising"],"Look for evidence of effectiveness"],["A teacher wants students to think critically about an AI answer. What is a good question?",["What could be wrong with this answer?","Do you like the AI?","Is the answer long?","Is the screen bright?"],"What could be wrong with this answer?"],["A source has no date. What should a student do?",["Look for a current version or another reliable source","Assume it is current","Share it immediately","Delete all sources"],"Look for a current version or another reliable source"],["Students need to practise a dialogue. Which task is more communicative?",["Role-play the situation with a partner","Copy the dialogue ten times","Translate every line","Underline verbs only"],"Role-play the situation with a partner"],["A teacher asks students to solve a real problem in English. Which approach fits?",["Task-Based Language Teaching","Grammar-Translation Method","Audio-Lingual Method","Direct Method"],"Task-Based Language Teaching"],["The teacher presents new grammar, students practise, then use it in a dialogue. Which model?",["PPP","TPR","Project-Based Learning","Flipped Classroom"],"PPP"],["Students learn 'open the book' by hearing it and doing the action. Which method?",["Total Physical Response","Grammar-Translation Method","PPP","Project-Based Learning"],"Total Physical Response"],["Students create a final English magazine over several weeks. Which approach?",["Project-Based Learning","Audio-Lingual Method","TPR","Grammar-Translation Method"],"Project-Based Learning"],["Students study a short video before class and use class time for speaking practice. Which model?",["Flipped Classroom","Grammar-Translation Method","Audio-Lingual Method","TPR"],"Flipped Classroom"],["Students repeat sentence patterns many times. Which method?",["Audio-Lingual Method","Project-Based Learning","CLT","Flipped Classroom"],"Audio-Lingual Method"]].map((x,i)=>Q('c'+String(i+1).padStart(2,'0'),'Classroom Practice',i%3===0?'Easy':i%3===1?'Medium':'Advanced',x[0],x[1],x[2],'Choose the option that best fits the real classroom situation.'));

const SCENARIOS=[["AI lesson idea","AI suggests a speaking game for your class. The game needs 40 laptops, but your class has only a few.","What should you check first?",["The real classroom resources","The AI logo","The colour of the game","The number of emojis"],"How could you change the activity for your class?"],["Homework claim","A student says, “AI homework always improves English.” No evidence is given.","What should you ask for?",["Evidence of improvement","A longer sentence","More followers","A new app"],"What evidence would make the claim stronger?"],["AI feedback","AI gives feedback on a student’s speaking task, but one comment does not match what the student said.","What should the teacher do?",["Check the original student work","Accept every AI comment","Delete the student work","Give the same feedback to everyone"],"Why should the teacher check AI feedback?"],["Group work","In a group of four, one student does all the writing.","What should the teacher check first?",["Roles and participation","The classroom colour","The students’ phones","The group name"],"What simple rule could make the work fairer?"],["Translation","AI translates a classroom instruction, but the meaning sounds different in Uzbek.","What should you compare?",["The original and the translation","The font size","The AI logo","The number of words only"],"How would you check the best translation?"],["Source check","A website gives an education statistic but gives no source.","What should you do first?",["Find the original source","Share the statistic","Trust the website design","Count the comments"],"Why is the original source useful?"],["AI essay","A student asks AI to write an essay and wants to submit it unchanged.","What is the main learning problem?",["The student may not understand or produce the work","The essay may be too colourful","The internet may be slow","The title may be short"],"How could AI help without doing all the work?"],["Class survey","Only 8 students answer a class survey about AI.","What should you be careful about?",["Do not claim it represents everyone","Call it a national result","Ignore the answers","Say it proves everything"],"What would make the survey stronger?"],["Online lesson","Some students join a lesson by phone, not laptop. AI suggests a laptop-only task.","What should the teacher do?",["Adapt the task for available devices","Use it unchanged","Cancel the lesson","Ask students to buy laptops"],"What simple phone-friendly option could work?"],["Teaching method","A teacher wants students to speak more English during a lesson.","What should the teacher focus on?",["Meaningful student interaction","Only grammar rules","Only translation","Only copying"],"Give one short speaking activity you would use."],["News headline","A post says, “AI DESTROYS English teaching!”","What should you notice?",["The strong and emotional wording","The font only","The number of likes","The picture size"],"How could you rewrite the claim more neutrally?"],["Two sources","Two websites give different numbers about students.","What should you compare?",["Date, source and definition","Website colour","Number of pictures","Title length"],"What would make one source more trustworthy?"],["Quiet students","Several students rarely speak during group work.","What should the teacher try first?",["Give clear turn-taking roles","Remove the students","Let one student speak for all","Stop group work forever"],"What role could help a quiet student join?"],["AI exam questions","AI creates 20 questions, but some are outside the course topic.","What should the teacher check?",["Course goals and lesson content","The AI logo","The question font","The number of emojis"],"What would you change before using the questions?"],["Privacy","A free AI website asks students to upload personal information.","What should the teacher consider?",["Student privacy and data safety","Only the website colour","The number of buttons","The logo"],"What safer choice could the teacher make?"],["Attendance","Attendance rises after a timetable change.","Can the teacher immediately say the timetable caused it?",["No, other reasons may exist","Yes, always","Yes, because the numbers changed","No, attendance cannot be measured"],"What other reason could explain the change?"],["Peer disagreement","Two students give different answers. Both give a reason.","What should they do next?",["Compare their evidence","Choose the louder student","Stop the discussion","Ask AI to choose"],"What evidence could help them decide?"],["Lesson plan","AI gives a lesson plan with examples from another country.","What should the teacher do?",["Adapt examples to the students and lesson","Copy it exactly","Delete the whole plan","Ignore the students"],"What local classroom detail should you consider?"],["AI detector","A website says its AI detector is 100% accurate.","What should you check?",["Evidence for the accuracy claim","The website colour","Its follower count","The logo"],"Why should you be careful with a 100% claim?"],["Project roles","A group project is late.","What should the teacher check first?",["Roles, deadlines and workload","Who has the nicest notebook","The classroom poster","The group logo"],"What could you change for the next project?"],["Vocabulary task","Students know the words but cannot use them in speaking.","What should the teacher add?",["A short speaking task using the words","More copying","A longer word list","Only translation"],"How would you make students use the words?"],["AI answer","AI gives a confident answer about a new education rule.","What should you do?",["Check an official or reliable source","Trust the confidence","Share it immediately","Add more AI details"],"Why is confidence not evidence?"],["Feedback","AI gives the same feedback to three students with different mistakes.","What should the teacher do?",["Check and personalise the feedback","Use it unchanged","Give it to the whole class","Ignore the student work"],"Why does feedback need to match the student’s work?"],["Classroom rule","A teacher says, “Group work always works.”","What is a good question?",["When might group work not work?","Who invented group work?","What colour are the groups?","How many chairs are there?"],"Give one situation where group work may need a different plan."]];

const state={page:'home',name:localStorage.getItem('aict_name')||'Student',xp:+localStorage.getItem('aict_xp')||0,correct:+localStorage.getItem('aict_correct')||0,answered:+localStorage.getItem('aict_answered')||0,streak:+localStorage.getItem('aict_streak')||0,best:+localStorage.getItem('aict_best')||0,badges:JSON.parse(localStorage.getItem('aict_badges')||'[]'),history:JSON.parse(localStorage.getItem('aict_history')||'[]'),sound:localStorage.getItem('aict_sound')!=='off',aiEndpoint:localStorage.getItem('aict_ai_endpoint')||'',classCode:localStorage.getItem('aict_class')||new URLSearchParams(location.search).get('class')||'',libraryFilter:'All',libraryCategory:null,game:null,competition:null,ai:null};
function save(){for(const [k,v] of Object.entries({aict_name:state.name,aict_xp:state.xp,aict_correct:state.correct,aict_answered:state.answered,aict_streak:state.streak,aict_best:state.best,aict_badges:JSON.stringify(state.badges),aict_history:JSON.stringify(state.history),aict_sound:state.sound?'on':'off',aict_ai_endpoint:state.aiEndpoint,aict_class:state.classCode}))localStorage.setItem(k,v)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function shuffle(a){const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function sample(a,n){return shuffle(a).slice(0,n)}
function level(){return Math.floor(state.xp/250)+1}
function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2400)}
function sound(type){if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);const map={click:[300,.06],correct:[660,.13],wrong:[170,.18],start:[420,.1],win:[[523,659,784],.14],tick:[420,.05],badge:[880,.12]};let m=map[type]||map.click;const tones=Array.isArray(m[0])?m[0]:[m[0]];let t=c.currentTime;tones.forEach((f,i)=>{const x=c.createOscillator(),gg=c.createGain();x.frequency.value=f;x.type='sine';x.connect(gg);gg.connect(c.destination);gg.gain.setValueAtTime(.0001,t+i*.1);gg.gain.exponentialRampToValueAtTime(.08,t+i*.1+.015);gg.gain.exponentialRampToValueAtTime(.0001,t+i*.1+.09);x.start(t+i*.1);x.stop(t+i*.1+.1)});o.stop();g.gain.value=.0001}catch(e){}}
function confetti(){const c=document.createElement('div');c.className='confetti';for(let i=0;i<70;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.setProperty('--x',(Math.random()*300-150)+'px');p.style.background=['#7c5cff','#19d3ae','#ffc857','#ff6685','#fff'][i%5];p.style.animationDelay=Math.random()*.4+'s';c.appendChild(p)}document.body.appendChild(c);setTimeout(()=>c.remove(),2300)}
function award(id){if(state.badges.includes(id))return;state.badges.push(id);const b=BADGES.find(x=>x[0]===id);if(b){sound('badge');toast(`${b[3]} Badge unlocked: ${b[1]}`)}}
function earn(xp,good=true){state.xp+=xp;state.answered++;if(good){state.correct++;state.streak++;state.best=Math.max(state.best,state.streak);if(state.streak>=5)award('sharp');if(state.streak>=7)award('streak')}else state.streak=0;if(state.answered===1)award('first');if(state.xp>=1000)award('master');save()}
function nav(page){state.page=page;state.libraryCategory=null;render();window.scrollTo({top:0,behavior:'smooth'});sound('click')}
function shell(content){return `<div class="app-shell"><header class="topbar"><div class="brand"><div class="brand-mark">🧠</div><div><strong>${APP}</strong><small>${INSTITUTION}</small></div></div><div class="top-actions"><span class="pill">Lv ${level()} · ${state.xp} XP</span><button class="icon-btn" data-action="sound" title="Sound">${state.sound?'🔊':'🔇'}</button><button class="icon-btn" data-action="profile">👤</button></div></header><main class="main">${content}<div class="footer">${APP} · ${AUTHOR} · ${INSTITUTION}<br><small>AI is a thinking partner, not a substitute for evidence, teacher judgement or student reflection.</small></div></main>${mobileNav()}</div>`}
function navHTML(){const items=[['home','🏠','Home'],['library','📚','Task Library'],['cycle','🧠','6C Cycle'],['challenge','🎮','Method Challenge'],['competition','🏆','Team Competition'],['ai','🤖','AI Critical Thinking Lab'],['progress','📈','My Progress'],['teacher','👩‍🏫','Teacher Dashboard']];return `<nav class="nav-group">${items.map(i=>`<button class="nav-item ${state.page===i[0]?'active':''}" data-nav="${i[0]}"><span class="nav-icon">${i[1]}</span>${i[2]}</button>`).join('')}</nav>`}
function mobileNav(){return `<div class="mobile-nav">${[['home','🏠','Home'],['library','📚','Library'],['cycle','🧠','6C Cycle'],['challenge','🎮','Challenge'],['competition','🏆','Competition'],['ai','🤖','AI Lab'],['progress','📈','Progress'],['teacher','👩‍🏫','Teacher']].map(x=>`<button class="${state.page===x[0]?'active':''}" data-nav="${x[0]}"><span>${x[1]}</span><small>${x[2]}</small></button>`).join('')}</div>`}
function home(){const features=[['library','📚','Task Library','Short real-life scenarios across 8 critical-thinking areas.'],['cycle','🧠','6C Cycle','Context → Consult → Critique → Check → Challenge → Conclude.'],['challenge','🎮','Method Challenge','Fast, varied multiple-choice practice with 40 method questions.'],['competition','🏆','Team Competition','Solo or team quiz with timer, score and random questions.'],['ai','🤖','AI Critical Thinking Lab','One-click AI coaching for student answers.'],['progress','📈','My Progress','XP, streaks, badges and learning history.'],['teacher','👩‍🏫','Teacher Dashboard','Classroom-ready activity overview and quick launch tools.'],['library','🇺🇿','Real Classroom Context','Situations built around everyday English teaching.']];return shell(`<section class="hero"><span class="eyebrow">Artificial Intelligence · Critical Thinking · English Teacher Education</span><h1>Think first. Check twice. Teach better.</h1><p>A modern learning environment for future English teachers. Use AI as something to question, verify, challenge and reflect on — not simply as an answer machine.</p><div class="author"><div class="avatar">SS</div><div><strong>${AUTHOR}</strong><br><span class="muted">${INSTITUTION} · PhD Research Project</span></div></div><div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><button class="primary-btn" data-nav="cycle">🚀 Start 6C Learning</button><button class="ghost-btn" data-nav="challenge">🎮 Quick Challenge</button></div></section><div class="stats"><div class="stat"><strong>${state.xp}</strong><span>Total XP</span></div><div class="stat"><strong>${state.correct}</strong><span>Correct answers</span></div><div class="stat"><strong>${state.best}</strong><span>Best streak</span></div><div class="stat"><strong>${state.badges.length}</strong><span>Badges</span></div></div><div class="section-title"><div><h2>Learning Studio</h2><p>Choose a route — every route strengthens critical thinking.</p></div></div><div class="grid grid-4">${features.map(f=>`<button class="card feature-card" data-nav="${f[0]}"><div class="big-icon">${f[1]}</div><h3>${f[2]}</h3><p>${f[3]}</p><span class="arrow">→</span></button>`).join('')}</div><div class="section-title"><div><h2>AI-CT 6C Cycle</h2><p>Six small moves that keep the learner in control.</p></div></div><div class="cycle">${STAGES.map((s,i)=>`<div class="cycle-step"><b>${s[2]}</b><strong>${i+1}. ${s[0]}</strong><span>${s[1]}</span></div>`).join('')}</div>`)}
function library(){let tasks=[];if(state.libraryCategory){tasks=SCENARIOS.map((s,i)=>({i,title:s[0],scenario:s[1],cat:CATEGORIES[i%8][0]})).filter(x=>x.cat===state.libraryCategory)}else tasks=SCENARIOS.map((s,i)=>({i,title:s[0],scenario:s[1],cat:CATEGORIES[i%8][0]}));return shell(`<div class="section-title"><div><h2>📚 Task Library</h2><p>Short, practical scenarios. No heavy vocabulary. No unnecessary reading.</p></div><span class="pill">${SCENARIOS.length} scenarios</span></div><div class="tabs"><button class="chip ${!state.libraryCategory?'active':''}" data-cat="All">All</button>${CATEGORIES.map(c=>`<button class="chip ${state.libraryCategory===c[0]?'active':''}" data-cat="${esc(c[0])}">${c[1]} ${c[0]}</button>`).join('')}</div><div class="grid grid-4">${tasks.map(t=>`<article class="card task-card"><div class="task-icon">${CATEGORIES[t.i%8][1]}</div><span class="pill">${t.cat}</span><h3>${esc(t.title)}</h3><p class="muted">${esc(t.scenario)}</p><div class="task-foot"><small class="muted">2 critical questions</small><button class="primary-btn" data-scenario="${t.i}">Open →</button></div></article>`).join('')}</div>`)}
function cycle(){
  if(!state.scenario) pickScenario();
  const s=state.scenario.s;
  const labels=['Context','Consult','Critique','Check','Challenge','Conclude'];
  return shell(`<div class="game-shell cycle-page">
    <div class="section-title"><div><h2>🧠 6C Critical Thinking Cycle</h2><p>One real classroom situation — six short thinking moves.</p></div><span class="pill">Stage ${state.scenario.step+1} of 6</span></div>
    <div class="sixc">${STAGES.slice(0,6).map((x,i)=>`<span class="sixc-step ${i===state.scenario.step?'active':''}"><b>${x[2]}</b>${labels[i]}</span>`).join('')}</div>
    <div class="scenario-hero">
      <span class="eyebrow">Real classroom scenario</span>
      <div class="scenario-title-row"><h1>${esc(s[0])}</h1><button class="ghost-btn" data-action="newScenario">🔀 New scenario</button></div>
      <p class="scenario-text">${esc(s[1])}</p>
    </div>
    <div id="sc-q"></div>
  </div>`);
}

function pickScenario(){
  const i=Math.floor(Math.random()*SCENARIOS.length);
  state.scenario={i,s:SCENARIOS[i],answers:[],step:0,selected:'',aiResponse:''};
}
function startScenario(){pickScenario();renderScenario();sound('start')}
function aiDemoFor(s,choice){
  return `AI RESPONSE — DEMONSTRATION\n\nBased on the situation, I would suggest: “${choice}.”\n\nThis may be useful, but the teacher should still check whether it fits the students, available resources and lesson goal. The suggestion should not be accepted automatically.`;
}
function renderScenario(){
  const root=document.getElementById('sc-q'), s=state.scenario;
  if(!root||!s)return;
  const step=s.step, labels=['CONTEXT','CONSULT','CRITIQUE','CHECK','CHALLENGE','CONCLUDE'];
  let body='';
  if(step===0){
    body=`<p class="stage-kicker">📍 CONTEXT · Understand the situation</p><h2 class="q-title">${esc(s.s[2])}</h2><div class="choices">${shuffle(s.s[3]).map((o,i)=>`<button class="choice scenario-choice" data-scenario-answer="${esc(o)}"><span class="letter">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
  }else if(step===1){
    body=`<p class="stage-kicker">🤖 CONSULT · Look at the AI response</p><div class="ai-response cycle-ai">${esc(s.aiResponse||aiDemoFor(s.s,s.answers[0]||s.s[3][0]))}</div><h2 class="q-title">What is useful in this AI response, and what should you question?</h2><textarea id="sc-answer" rows="4" placeholder="Write 1–2 short sentences."></textarea>`;
  }else if(step===2){
    body=`<p class="stage-kicker">🧐 CRITIQUE · Question the answer</p><h2 class="q-title">${esc(s.s[4])}</h2><textarea id="sc-answer" rows="4" placeholder="What might be missing or unsuitable? Why?"></textarea>`;
  }else if(step===3){
    body=`<p class="stage-kicker">🔎 CHECK · Verify before trusting</p><h2 class="q-title">What would you check before using this AI suggestion in a real lesson?</h2><textarea id="sc-answer" rows="4" placeholder="Mention one source, fact, student need or classroom detail to check."></textarea>`;
  }else if(step===4){
    body=`<p class="stage-kicker">⚡ CHALLENGE · Improve the idea</p><h2 class="q-title">How would you change the AI suggestion to make it work better for your students?</h2><textarea id="sc-answer" rows="4" placeholder="Give one practical improvement."></textarea>`;
  }else{
    body=`<p class="stage-kicker">🎯 CONCLUDE · Make your reasoned decision</p><h2 class="q-title">What is your final decision? Explain it briefly using what you checked.</h2><textarea id="sc-answer" rows="4" placeholder="Write 1–2 short sentences: I would… because…"></textarea>`;
  }
  root.innerHTML=`<div class="question-card pop"><div class="q-meta"><span class="pill">${labels[step]} · ${step+1}/6</span><span class="muted">Short thinking task</span></div>${body}<div class="scenario-action"><button class="primary-btn" data-action="${step===0?'chooseScenario':step===5?'finishScenario':'nextCycleStage'}">${step===0?'Analyze AI response →':step===5?'Finish 6C ✓':'Continue →'}</button></div></div>`;
}
function chooseScenario(){
  const btn=document.querySelector('.scenario-choice.selected');
  if(!btn){toast('Choose one answer first.');return}
  state.scenario.answers[0]=btn.dataset.scenarioAnswer;
  state.scenario.aiResponse=aiDemoFor(state.scenario.s,state.scenario.answers[0]);
  state.scenario.step=1;
  renderScenario();sound('correct');
}
function nextCycleStage(){
  const a=document.getElementById('sc-answer')?.value.trim();
  if(!a){toast('Write 1–2 short sentences first.');return}
  state.scenario.answers[state.scenario.step]=a;
  state.scenario.step++;
  renderScenario();sound('click');
}
function finishScenario(){
  const a=document.getElementById('sc-answer')?.value.trim();
  if(!a){toast('Write your final decision first.');return}
  state.scenario.answers[5]=a;
  state.xp+=60;state.answered+=1;state.correct+=1;state.streak++;state.best=Math.max(state.best,state.streak);
  award('thinker');save();confetti();sound('win');
  document.getElementById('sc-q').innerHTML=`<div class="feedback pop"><strong>🎯 6C complete!</strong><p>You moved from a real situation to an AI response, critique, verification, improvement and a final reasoned decision.</p><div class="answer-summary"><div><small>Context choice</small><p>${esc(state.scenario.answers[0]||'—')}</p></div><div><small>Final decision</small><p>${esc(state.scenario.answers[5]||'—')}</p></div></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button class="primary-btn" data-action="newScenario">🔀 Try another scenario</button><button class="ghost-btn" data-nav="home">🏠 Back home</button></div></div>`;
}

function aiLab(){
 return shell(`<div class="section-title"><div><h2>🤖 AI Critical Thinking Coach</h2><p>No prompt writing. Give your answer, press the button, and the coach responds.</p></div><span class="pill">One-click AI</span></div>
 <div class="ai-box">
  <div class="grid grid-2">
   <div>
    <h3>✍️ Your answer</h3>
    <p class="muted">Write what you think about a classroom problem. You do not need to write an AI prompt.</p>
    <textarea id="ai-input" rows="8" placeholder="Example: I would check the source before using the information in class."></textarea>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
      <button class="primary-btn" data-action="aiCoach">🤖 Ask AI Coach</button>
      <button class="ghost-btn" data-action="aiExample">✨ Give me an example</button>
    </div>
   </div>
   <div>
    <h3>🔎 What the coach checks</h3>
    <div class="ai-checks">
      <div>📌 Is your idea clear?</div><div>🔎 Did you mention evidence?</div><div>⚖️ Did you consider another possibility?</div><div>💭 Can you explain your reason?</div>
    </div>
    <div id="ai-result" class="feedback"><span class="muted">Your feedback will appear here.</span></div>
   </div>
  </div>
 </div>
 <div class="card ai-connection">
   <h3>AI connection</h3>
   <p class="muted">The interface is ready for a secure Gemini/Claude/OpenAI backend. A private API key must not be placed in this GitHub Pages code.</p>
   <div class="field"><label>Secure AI endpoint (optional)</label><input id="ai-endpoint" value="${esc(state.aiEndpoint)}" placeholder="https://your-server.example/api/ai"></div>
   <button class="ghost-btn" data-action="saveAI">💾 Save connection</button>
 </div>`);
}
async function aiCoach(){
 const input=document.getElementById('ai-input')?.value.trim();
 if(!input){toast('Write your answer first.');return}
 award('ai');
 const box=document.getElementById('ai-result');
 box.innerHTML='<span class="muted">🤖 Thinking…</span>';
 if(state.aiEndpoint){
  try{
   const r=await fetch(state.aiEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'critical-thinking-feedback',prompt:`Give short, student-friendly feedback on this future English teacher's reasoning. Do not give a final answer. Mention one strength, one thing to check, and one follow-up question. Answer in simple English.\n\nStudent answer:\n${input}`,context:{framework:'AI-CT 6C',institution:INSTITUTION}})});
   if(!r.ok)throw new Error('endpoint');
   const data=await r.json().catch(()=>null);
   box.innerHTML=`<div class="ai-response">${esc(data?.text||data?.response||'The AI returned no text.')}</div>`;
   state.xp+=20;save();return;
  }catch(e){toast('AI server is not connected yet. Local coach is working now.')}
 }
 const lower=input.toLowerCase(),flags=[];
 if(!/evidence|source|data|study|example|fact|check/.test(lower))flags.push('Add one piece of evidence or say how you would check it.');
 if(!/because|reason|so|therefore|since/.test(lower))flags.push('Add a short reason: “because …”');
 if(!/but|however|alternative|another|different|except/.test(lower))flags.push('Think of one other possibility.');
 const feedback=`Strength: your answer gives a clear idea.\n\nNext step:\n${flags.length?flags.map(x=>'• '+x).join('\n'):'• Your reasoning is clear. Now connect it to evidence.'}\n\nCoach question:\nWhat could make you change your decision?\n\n6C: Context → Consult → Critique → Check → Challenge → Reflect`;
 box.innerHTML=`<div class="ai-response">${esc(feedback)}</div>`;
 state.xp+=20;save();
}
function aiExample(){
 document.getElementById('ai-input').value='I would check the original source before using the AI answer in my English lesson because the AI may be wrong.';
 toast('Example added — now ask the coach.');
}
function profile(){
 const modal=document.createElement('div');modal.className='modal';
 modal.innerHTML=`<div class="modal-box"><div class="modal-head"><h2>👤 Student profile</h2><button class="icon-btn" data-close>✕</button></div>
 <div class="field"><label>Name</label><input id="profile-name" value="${esc(state.name)}"></div>
 <div class="field"><label>Class code</label><input id="profile-class" value="${esc(state.classCode)}" placeholder="Example: EN7K2P"></div>
 <p class="muted">Enter the code from your teacher so your exported progress is linked to the class.</p>
 <div style="display:flex;gap:10px;justify-content:flex-end"><button class="ghost-btn" data-close>Cancel</button><button class="primary-btn" data-save-profile>Save</button></div>
 </div>`;
 document.body.appendChild(modal);
 modal.addEventListener('click',e=>{
  if(e.target.hasAttribute('data-close'))modal.remove();
  if(e.target.hasAttribute('data-save-profile')){
   state.name=document.getElementById('profile-name').value.trim()||'Student';
   state.classCode=document.getElementById('profile-class').value.trim().toUpperCase();
   save();modal.remove();render()
  }
 });
}
function exportProgress(){
 const data={app:APP,author:AUTHOR,institution:INSTITUTION,name:state.name,classCode:state.classCode,xp:state.xp,correct:state.correct,answered:state.answered,bestStreak:state.best,badges:state.badges,history:state.history,exportedAt:new Date().toISOString()};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=`AI-CT-${(state.name||'student').replace(/[^a-z0-9_-]/gi,'_')}-progress.json`;a.click();URL.revokeObjectURL(a.href);toast('Progress file exported.');
}
function createClass(){
 const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code='';for(let i=0;i<6;i++)code+=chars[Math.floor(Math.random()*chars.length)];
 state.classCode=code;save();render();toast(`Class ${code} created.`);
}
async function copyClassLink(){
 const link=`${location.origin}${location.pathname}?class=${encodeURIComponent(state.classCode)}`;
 try{await navigator.clipboard.writeText(link);toast('Student link copied.')}catch(e){toast(link)}
}
async function importProgress(files){
 const rows=[];
 for(const file of [...files]){try{const d=JSON.parse(await file.text());rows.push(d)}catch(e){}}
 const box=document.getElementById('teacher-results');if(!box)return;
 box.innerHTML=rows.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Class</th><th>XP</th><th>Answers</th><th>Correct</th><th>Best streak</th></tr></thead><tbody>${rows.map(d=>`<tr><td>${esc(d.name||'Student')}</td><td>${esc(d.classCode||'—')}</td><td>${esc(d.xp||0)}</td><td>${esc(d.answered||0)}</td><td>${esc(d.correct||0)}</td><td>${esc(d.bestStreak||0)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">No valid progress files were found.</p>';
}
function ensureStyle(){
 if(document.getElementById('aict-modern-style'))return;
 const s=document.createElement('style');s.id='aict-modern-style';s.textContent=`
 :root{--bg:#f5f7ff;--panel:#fff;--ink:#17213d;--muted:#66708f;--line:#dfe4f2;--brand:#6657e8;--brand2:#19bda0}
 body{background:var(--bg)!important;color:var(--ink)!important;font-size:17px!important}
 .app-shell{background:var(--bg)!important;min-height:100vh}
 .topbar{background:#fff!important;color:var(--ink)!important;border-bottom:1px solid var(--line)!important;box-shadow:0 2px 14px rgba(30,40,80,.06)}
 .brand strong,.brand small{color:var(--ink)!important}
 .sidebar{background:#f0f3ff!important;border-right:1px solid var(--line)!important}
 .nav-item{color:#34405f!important;font-size:17px!important;min-height:52px}
 .nav-item.active{background:#e5e8ff!important;color:#4f43c9!important}
 .main{background:var(--bg)!important}
 .card,.question-card,.scenario-hero,.ai-box,.feedback{background:#fff!important;color:var(--ink)!important;border:1px solid var(--line)!important;box-shadow:0 8px 28px rgba(38,48,90,.07)}
 .muted,.card p,.scenario-text{color:var(--muted)!important}
 h1{font-size:clamp(30px,4vw,48px)!important;line-height:1.12!important}
 h2{font-size:clamp(24px,3vw,34px)!important}
 h3{font-size:21px!important}
 .q-title{font-size:clamp(25px,3vw,38px)!important;line-height:1.2!important}
 .choice{background:#f7f8ff!important;color:var(--ink)!important;border:1px solid #d8ddf0!important;font-size:18px!important;min-height:74px!important;text-align:left}
 .choice:hover{border-color:#8a7df1!important;transform:translateY(-1px)}
 .choice.selected{border:2px solid #6657e8!important;background:#eceaff!important}
 textarea,input,select{background:#fff!important;color:var(--ink)!important;border:1px solid #cdd4e7!important;font-size:17px!important;border-radius:14px!important}
 textarea{min-height:120px!important}
 .primary-btn{font-size:17px!important;border-radius:14px!important}
 .ghost-btn,.icon-btn{color:var(--ink)!important}
 .sixc{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 18px}
 .sixc-step{background:#fff;border:1px solid var(--line);padding:9px 12px;border-radius:999px;color:#475170}
 .sixc-step b{margin-right:5px}
 .scenario-hero{padding:28px;border-radius:22px;margin-bottom:16px}
 .scenario-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
 .scenario-text{font-size:20px!important;line-height:1.55!important;max-width:950px}
 .scenario-action{display:flex;justify-content:flex-end;margin-top:14px}
 .answer-summary{display:grid;grid-template-columns:1fr 1fr;gap:14px}
 .answer-summary>div{background:#f6f7ff;border:1px solid var(--line);padding:15px;border-radius:14px}
 .class-code{font-size:42px;font-weight:900;letter-spacing:7px;color:#5648d8;margin:18px 0}
 .teacher-stat strong{font-size:36px}
 .ai-checks{display:grid;gap:9px;margin:14px 0}.ai-checks div{padding:12px 14px;background:#f6f7ff;border-radius:12px;border:1px solid var(--line)}
 .ai-response{white-space:pre-wrap;line-height:1.65;font-size:17px}
 .footer{color:#69738f!important}
 .sixc-step.active{background:#eceaff!important;border-color:#8a7df1!important;color:#4f43c9!important;box-shadow:0 6px 16px rgba(102,87,232,.12)}
 .stage-kicker{font-weight:800;letter-spacing:.08em;color:#5648d8;margin:0 0 10px}
 .cycle-ai{background:#f6f7ff;border:1px solid #dfe4f2;border-radius:16px;padding:18px;margin:12px 0 18px;white-space:pre-wrap;line-height:1.6}

 .tabs{display:flex;flex-wrap:wrap;gap:10px!important;margin:18px 0!important}
 .tabs .chip{color:#34405f!important;background:#fff!important;border:1px solid #d6dcef!important;font-weight:700!important;opacity:1!important;box-shadow:none!important}
 .tabs .chip.active{color:#4f43c9!important;background:#eceaff!important;border-color:#9a8ff5!important}
 .task-card .pill{color:#4f43c9!important;background:#f0edff!important;border-color:#c9c1ff!important;opacity:1!important}
 .task-card h3{color:#17213d!important}
 .task-card .muted{color:#5c6785!important}
 .section-title p{color:#5c6785!important}
 @media(min-width:801px){.layout{display:block!important}.sidebar{display:none!important}.main{display:block!important;position:relative!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;padding-left:125px!important;padding-right:28px!important;box-sizing:border-box!important}.main>*{width:100%!important;max-width:none!important;box-sizing:border-box!important}.mobile-nav{display:grid!important}}
 @media(max-width:800px){.main{padding-left:16px!important;padding-right:16px!important;width:100%!important;box-sizing:border-box!important}.mobile-nav{display:grid!important;grid-template-columns:repeat(4,1fr)!important;left:12px!important;right:12px!important;bottom:12px!important}.mobile-nav button:nth-child(n+5){display:none!important}}
 .mobile-nav{position:fixed;left:18px;right:18px;bottom:16px;z-index:50;background:rgba(255,255,255,.96)!important;border:1px solid var(--line);border-radius:20px;box-shadow:0 14px 36px rgba(38,48,90,.18);display:grid!important;grid-template-columns:repeat(8,1fr);padding:8px;gap:5px;backdrop-filter:blur(12px)}
 .mobile-nav button{border:0;background:transparent;color:#56607d;border-radius:14px;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:18px;min-height:54px}
 .mobile-nav button small{font-size:10px;font-weight:700;white-space:nowrap}.mobile-nav button.active{background:#eceaff;color:#4f43c9}
 @media(min-width:801px){.mobile-nav{position:fixed;left:18px;right:auto;top:92px;bottom:18px;width:86px;grid-template-columns:1fr;align-content:start;overflow:auto;padding:9px}.mobile-nav button{min-height:68px}.mobile-nav button small{font-size:10px}.main{padding-left:125px!important;padding-right:28px!important}.main>.grid,.main>.section-title,.main>.tabs,.main>.hero,.main>.stats,.main>.cycle{width:100%!important;max-width:none!important}.grid{display:grid!important;width:100%!important;grid-template-columns:repeat(4,minmax(240px,1fr))!important;gap:20px!important}.grid-4{grid-template-columns:repeat(4,minmax(240px,1fr))!important}.card{min-width:0!important}.footer{padding-bottom:30px}}
 @media(max-width:800px){.mobile-nav{grid-template-columns:repeat(4,1fr);overflow-x:auto}.mobile-nav button:nth-child(n+5){display:none}.main{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;padding:16px 16px 105px!important;box-sizing:border-box!important}.main>*{width:100%!important;max-width:none!important;box-sizing:border-box!important}.grid{display:grid!important;width:100%!important;grid-template-columns:1fr!important;gap:16px!important}.grid-4{grid-template-columns:1fr!important}.card{min-width:0!important}.sidebar{display:none!important}}
 @media(min-width:801px) and (max-width:1250px){.grid,.grid-4{grid-template-columns:repeat(2,minmax(240px,1fr))!important}}
 @media(max-width:800px){.answer-summary{grid-template-columns:1fr}.scenario-title-row{align-items:flex-start}.scenario-title-row h1{font-size:30px!important}.choice{font-size:16px!important}.sidebar{display:none!important}}
 `;
 document.head.appendChild(s);
}

function render(){ensureStyle();let c='';switch(state.page){case'home':c=home();break;case'library':c=library();break;case'cycle':c=cycle();break;case'challenge':c=gameSetup('challenge');break;case'competition':c=competitionSetup();break;case'ai':c=aiLab();break;case'progress':c=progress();break;case'teacher':c=teacher();break;default:c=home()}document.getElementById('app').innerHTML=c}

document.addEventListener('click',e=>{
 const navEl=e.target.closest('[data-nav]');if(navEl){nav(navEl.dataset.nav);return}
 const cat=e.target.closest('[data-cat]');if(cat){state.libraryCategory=cat.dataset.cat==='All'?null:cat.dataset.cat;render();return}
 const scenario=e.target.closest('[data-scenario]');if(scenario){nav('cycle');setTimeout(()=>startSpecific(+scenario.dataset.scenario),0);return}
 const ans=e.target.closest('[data-answer]');if(ans){answerGame(+ans.dataset.answer);return}
 const cans=e.target.closest('[data-comp-answer]');if(cans){answerCompetition(+cans.dataset.compAnswer);return}
 const sAns=e.target.closest('[data-scenario-answer]');if(sAns){document.querySelectorAll('[data-scenario-answer]').forEach(b=>b.classList.remove('selected'));sAns.classList.add('selected');sound('click');return}
 const act=e.target.closest('[data-action]');if(!act)return;
 const a=act.dataset.action;
 if(a==='sound'){state.sound=!state.sound;save();render();sound('click')}
 else if(a==='profile')profile();
 else if(a==='startScenario')startScenario();
 else if(a==='newScenario')startScenario();
 else if(a==='chooseScenario')chooseScenario();
 else if(a==='finishScenario')finishScenario();
 else if(a==='beginGame')beginGame(act.dataset.kind);
 else if(a==='nextGame')nextGame();
 else if(a==='nextCompetition')nextCompetition();
 else if(a==='aiCoach')aiCoach();
 else if(a==='aiExample')aiExample();
 else if(a==='saveAI'){state.aiEndpoint=document.getElementById('ai-endpoint').value.trim();save();toast('AI connection setting saved.')}
 else if(a==='exportProgress')exportProgress();
 else if(a==='createClass')createClass();
 else if(a==='copyClassLink')copyClassLink();
});
document.addEventListener('change',e=>{
 if(e.target.id==='progress-files')importProgress(e.target.files);
});
document.addEventListener('input',e=>{if(e.target.id==='team-count'){const n=+e.target.value;const box=document.getElementById('team-fields');if(box)box.innerHTML=n>1?Array.from({length:n},(_,i)=>`<div class="team-box"><div class="field"><label>Team ${i+1} name</label><input id="team-${i}" value="Team ${i+1}"></div></div>`).join(''):''}});
function startSpecific(i){state.scenario={i,s:SCENARIOS[i%SCENARIOS.length],answers:[],step:0,selected:''};render();sound('start')}
render();
})();