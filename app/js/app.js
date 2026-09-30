/* AI-CT TEACHER application. Loaded by app/index.html */
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
const KEY='aict-teacher:prototype:v1';
let storageOk=true, persistT=null, lastSaved=null;
function loadState(){try{const raw=localStorage.getItem(KEY);if(raw){const s=JSON.parse(raw);if(s&&s.attempts)return s}}catch(e){storageOk=false}return null}
let S=loadState()||{attempts:{},order:[],notes:{},prefs:{}};
S.notes=S.notes||{};S.prefs=S.prefs||{};S.order=S.order||[];
S.xp=S.xp||0;S.badges=S.badges||[];S.competitions=S.competitions||[];S.methodRounds=S.methodRounds||[];
function persistNow(){clearTimeout(persistT);try{localStorage.setItem(KEY,JSON.stringify(S));storageOk=true}catch(e){storageOk=false}lastSaved=Date.now();updateSaved()}
function persist(){clearTimeout(persistT);persistT=setTimeout(persistNow,350)}
function updateSaved(){const el=$('#savedAt');if(el)el.textContent=lastSaved?`Saved ${fmtTime(lastSaved)}`:'Not saved yet';const s=$('#storeState');if(s)s.textContent=storageOk?'Saved in this browser':'Memory only (not persistent)'}

const ui={page:'home',params:{},menu:false,streaming:false,stream:'',aiErr:'',ctl:null,libCategory:null,histFilter:'All',
  mc:null,tc:{phase:'setup',mode:1,teams:[{name:'You',score:0}],count:10,diff:'easy'},
  tSort:{k:'avg',dir:-1},tTask:'All',tStudent:null,station:1,justCompleted:null,assessId:null,exportText:null};

function blankData(){return{
  context:{problem:'',causes:'',info:'',approach:'',conf:0},
  consult:{checks:[],prompt:'',mode:'',response:'',segs:[],history:[],ts:0,extra:null},
  critique:{tags:{},claim:'',assumptions:'',convincing:'',questionable:'',weaknesses:'',missing:'',fit:'',stance:'',justification:''},
  check:{rows:[],reliability:'',nextSources:'',seeded:[]},
  challenge:{alternative:'',change:'',disadvantages:'',counter:'',whatif:''},
  conclude:{claim:'',reasoning:'',evidence:'',conclusion:'',decision:'',
    reflectBefore:'',reflectChanged:'',reflectRejected:'',reflectLearned:'',reflectNext:'',confidence:0}}}
function newAttempt(taskId){
  const at={id:uid('a'),taskId,createdAt:Date.now(),updatedAt:Date.now(),stage:1,maxStage:1,status:'in_progress',d:blankData(),self:{}};
  S.attempts[at.id]=at;S.order.push(at.id);persistNow();return at}
const attemptsList=()=>S.order.map(id=>S.attempts[id]).filter(Boolean);
const completedList=()=>attemptsList().filter(a=>a.status==='completed');
const attemptsFor=t=>attemptsList().filter(a=>a.taskId===t);
const inProgressFor=t=>attemptsFor(t).find(a=>a.status==='in_progress');
const latestInProgress=()=>attemptsList().filter(a=>a.status==='in_progress').sort((a,b)=>b.updatedAt-a.updatedAt)[0];
function touch(at){at.updatedAt=Date.now();persist()}

function createSample(){
  const t=TASK_BY_ID[SAMPLE.taskId],at=newAttempt(t.id),d=at.d,s=SAMPLE;
  Object.assign(d.context,s.context);
  Object.assign(d.consult,s.consult,{segs:t.ai.slice(),response:demoText(t),ts:Date.now(),history:[]});
  Object.assign(d.critique,s.critique);
  d.check.rows=s.check.rows.map((r,i)=>({id:uid('r'),fromSeg:[1,0,5][i],...r}));d.check.seeded=[1,5];
  d.check.reliability=s.check.reliability;d.check.nextSources=s.check.nextSources;
  Object.assign(d.challenge,s.challenge);Object.assign(d.conclude,s.conclude);
  at.stage=6;at.maxStage=6;at.status='completed';at.completedAt=Date.now();at.sample=true;persistNow();return at}
function demoText(t){const a=t.ai;return[[0,1],[2,3],[4,5]].map(p=>p.map(i=>a[i]).join(' ')).join('\n\n')}

/* =====================================================================
   AI (live via `sample` capability where available; demonstration otherwise)
   ===================================================================== */
const AI={sample:null,downloads:null,checked:false};
/* Secure backend AI endpoint (Cloudflare Worker; see backend/README.md).
   Empty by default: the Consult stage then offers only Claude-in-app
   (inside claude.ai) and the labelled demonstration text, exactly as
   before. Set this to your deployed Worker URL to enable a third,
   real option, "Ask AI (live, backend)". The key itself is never here
   or anywhere in the frontend — see backend/README.md. */
const AI_ENDPOINT='';
async function askBackendAI(scenario,stage,studentResponse){
  const controller=new AbortController(),t=setTimeout(()=>controller.abort(),20000);
  let res;
  try{res=await fetch(AI_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({scenario,stage,studentResponse}),signal:controller.signal})}
  catch(e){clearTimeout(t);throw new Error('backend_unreachable')}
  clearTimeout(t);
  let data;try{data=await res.json()}catch(e){throw new Error('backend_bad_response')}
  if(!res.ok||data.error)throw new Error('backend_error');
  if(typeof data.response!=='string'||!data.response.trim())throw new Error('backend_bad_response');
  return data}
async function initCaps(){
  try{if(window.claude&&typeof claude.use==='function'){AI.sample=await claude.use('sample');AI.downloads=await claude.use('downloads')}}catch(e){}
  AI.checked=true;refreshAiStatus()}
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

function recordConsult(at,mode,prompt,text,segs,extra){
  const c=at.d.consult;
  if(c.response)c.history.push({prompt:c.prompt,mode:c.mode,response:c.response,ts:c.ts});
  c.prompt=prompt;c.mode=mode;c.response=text;c.segs=segs;c.ts=Date.now();c.extra=extra||null;
  at.d.critique.tags={};at.d.check.rows=at.d.check.rows.filter(r=>r.fromSeg==null||false);
  at.d.check.seeded=[];touch(at)}

/* =====================================================================
   VALIDATION  (what is needed before moving on)
   ===================================================================== */
const fr=(label,text,min)=>{const n=W(text);return{label,ok:n>=min,detail:n>=min?'':`${n}/${min} words`}};
const rowComplete=r=>W(r.claim)>=3&&(r.source||'').trim().length>=3&&!!r.sourceType&&W(r.evidence)>=8&&!!r.verdict;
const tagCounts=at=>{const c={ok:0,q:0,check:0};Object.values(at.d.critique.tags).forEach(v=>{if(c[v]!=null)c[v]++});return c};
function aiText(at){return at.d.consult.response||''}
function copyScore(at){const c=at.d.conclude;return overlap([c.claim,c.reasoning,c.conclusion].join(' '),aiText(at),4)}
function reqs(at,stage){
  const d=at.d,o=[];
  if(stage===1){
    o.push(fr('Main problem',d.context.problem,8),fr('Possible causes',d.context.causes,8),fr('Information you would need',d.context.info,6),fr('What you would do first',d.context.approach,12),{label:'Initial confidence rating',ok:d.context.conf>0})}
  if(stage===2){
    o.push(fr('Your own prompt to AI',d.consult.prompt,12),{label:'An AI response to analyse',ok:!!d.consult.response})}
  if(stage===3){
    const c=tagCounts(at),t=c.ok+c.q+c.check,x=d.critique;
    o.push({label:'Tag at least 2 parts of the response',ok:t>=2,detail:`${t}/2`},{label:'Mark at least 1 part as "Check this"',ok:c.check>=1},
      fr('Main claim',x.claim,6),fr('Assumptions',x.assumptions,8),fr('Convincing parts',x.convincing,8),fr('Questionable parts',x.questionable,8),fr('Weaknesses',x.weaknesses,8),fr('What is missing',x.missing,6),fr('Fit to this classroom',x.fit,10),
      {label:'Agree or disagree',ok:!!x.stance},fr('Reasons for your position',x.justification,20))}
  if(stage===4){
    const n=d.check.rows.filter(rowComplete).length;
    o.push({label:'At least 2 evidence rows completed',ok:n>=2,detail:`${n}/2`},fr('Reliability and possible invention',d.check.reliability,10),fr('Sources you could consult next',d.check.nextSources,6))}
  if(stage===5){
    const x=d.challenge;
    o.push(fr('Alternative solution',x.alternative,15),fr('What you would change',x.change,8),fr('Disadvantages of the AI approach',x.disadvantages,8),fr('Counterargument',x.counter,10),fr('If conditions changed',x.whatif,10))}
  if(stage===6){
    const x=d.conclude;
    o.push(fr('Claim',x.claim,8),fr('Reasoning',x.reasoning,15),fr('Evidence',x.evidence,10),fr('Conclusion',x.conclusion,12),{label:'Accept, modify or reject the AI response',ok:!!x.decision},
      {label:'In your own words (not copied from AI)',ok:copyScore(at)<0.5,detail:copyScore(at)>=0.5?'too close to AI text':''},
      fr('Before consulting AI',x.reflectBefore,8),fr('What AI changed or challenged',x.reflectChanged,8),fr('What you rejected',x.reflectRejected,8),fr('What you learned',x.reflectLearned,8),fr('What you would do differently',x.reflectNext,8),{label:'Final confidence rating',ok:x.confidence>0})}
  return o}
const stageOk=(at,s)=>reqs(at,s).every(r=>r.ok);

/* =====================================================================
   ASSESSMENT: transparent, indicator-based rubric scoring
   Level = 1 + number of the 3 indicators met.  Indicators check that
   elements of critical thinking are PRESENT in the record; they cannot
   judge the quality of ideas.  Human rating is required for research.
   ===================================================================== */
const divers=s=>{const t=toks(s);return t.length<15||new Set(t).size/t.length>=0.5};
const CONNECT=/\b(because|therefore|since|so that|however|although|whereas|which means|as a result|for example|for instance|if|unless|thus|consequently|given that|whereas|but)\b/gi;
function calibrated(at){const rows=at.d.check.rows.filter(rowComplete);if(!rows.length)return true;const good=rows.filter(r=>r.verdict==='SUPPORTED'||r.verdict==='PARTIALLY').length/rows.length;return !(at.d.conclude.confidence>=4&&good<0.5)}
function computeAssessment(at){
  const d=at.d,task=TASK_BY_ID[at.taskId],x=d.critique,tags=Object.values(x.tags),rows=d.check.rows.filter(rowComplete),c=d.conclude,ch=d.challenge,rf=d.conclude;
  const ai=aiText(at),rowText=rows.map(r=>[r.claim,r.source,r.evidence].join(' ')).join(' ');
  const conns=new Set((c.reasoning.toLowerCase().match(CONNECT)||[]));
  const fitLow=x.fit.toLowerCase();
  const I={
   analysis:[
    {label:'Tagged at least 3 parts of the AI response, including a convincing and a questionable or to-check part',ok:tags.length>=3&&tags.includes('ok')&&(tags.includes('q')||tags.includes('check'))},
    {label:'Wrote at least 15 words on the assumptions behind the response',ok:W(x.assumptions)>=15},
    {label:'In Context, gave at least 20 words on causes and 12 on information needed',ok:W(d.context.causes)>=20&&W(d.context.info)>=12}],
   evaluation:[
    {label:'Justified agreement or disagreement in at least 30 words',ok:W(x.justification)>=30},
    {label:'Named both a weakness (12+ words) and something missing (10+ words)',ok:W(x.weaknesses)>=12&&W(x.missing)>=10},
    {label:'Judged fit to the classroom (15+ words) and referred to a detail of the scenario',ok:W(x.fit)>=15&&task.keywords.some(k=>fitLow.includes(k))}],
   inference:[
    {label:'Completed at least 3 evidence rows with source, evidence and verdict',ok:rows.length>=3},
    {label:'No row marked Supported or Partially supported while also recording "Could not find a source"',ok:rows.length>0&&!rows.some(r=>(r.verdict==='SUPPORTED'||r.verdict==='PARTIALLY')&&r.sourceType==='Could not find a source')},
    {label:'Evidence in the conclusion shares at least 2 key terms with the evidence rows',ok:sharedCount(c.evidence,rowText)>=2}],
   argumentation:[
    {label:'Wrote all four parts (claim 10+, reasoning 25+, evidence 15+, conclusion 15+ words) with varied wording rather than repetition',ok:W(c.claim)>=10&&W(c.reasoning)>=25&&W(c.evidence)>=15&&W(c.conclusion)>=15&&divers([c.claim,c.reasoning,c.evidence,c.conclusion].join(' '))},
    {label:'Wrote a counterargument of at least 20 words',ok:W(ch.counter)>=20},
    {label:'Reasoning uses at least 2 different linking words such as because, since, however, if',ok:conns.size>=2}],
   alternative:[
    {label:'Alternative solution of at least 30 words, not repetitive',ok:W(ch.alternative)>=30&&divers(ch.alternative)},
    {label:'Tested a changed condition (20+ words) and named disadvantages (15+ words)',ok:W(ch.whatif)>=20&&W(ch.disadvantages)>=15},
    {label:'Alternative is in different words from the AI response and shares key terms with your conclusion',ok:overlap(ch.alternative,ai,4)<0.2&&sharedCount(ch.alternative,[c.claim,c.reasoning,c.conclusion].join(' '))>=2}],
   reflection:[
    {label:'Reflection answers average at least 15 words',ok:avg([rf.reflectBefore,rf.reflectChanged,rf.reflectRejected,rf.reflectLearned,rf.reflectNext].map(W))>=15},
    {label:'Explained what AI changed (15+ words) and what you rejected (15+ words)',ok:W(rf.reflectChanged)>=15&&W(rf.reflectRejected)>=15},
    {label:'Named a change for next time (12+ words) and confidence is consistent with your evidence verdicts',ok:W(rf.reflectNext)>=12&&calibrated(at)}]
  };
  const items=COMP.map(cp=>{const ind=I[cp.key],met=ind.filter(i=>i.ok).length;return{key:cp.key,name:cp.name,short:cp.short,indicators:ind,met,level:1+met}});
  const total=items.reduce((a,b)=>a+b.level,0),max=24,mean=total/6;
  const band=mean<1.75?'Beginning':mean<2.5?'Developing':mean<3.25?'Proficient':'Advanced';
  const hi=Math.max(...items.map(i=>i.level)),lo=Math.min(...items.map(i=>i.level));
  return{items,total,max,pct:pct(total,max),mean,band,strongest:hi>lo?items.filter(i=>i.level===hi):[],develop:hi>lo?items.filter(i=>i.level===lo):[],even:hi===lo,hi,lo}}
function profileText(a){
  const names=l=>l.map(i=>i.name).join(', ').replace(/, ([^,]*)$/,' and $1');
  if(a.even)return{strong:`Your current performance profile is even across the six components (each at level ${a.hi}, ${LEVELS[a.hi]}).`,dev:'Further development may be useful in whichever component matters most for your next task; compare this profile with your own self-ratings below.'};
  return{strong:`Your current performance profile indicates stronger performance in ${names(a.strongest)} (level ${a.hi}, ${LEVELS[a.hi]}).`,dev:`Further development may be useful in ${names(a.develop)} (level ${a.lo}, ${LEVELS[a.lo]}).`}}

/* =====================================================================
   STRUCTURED RECORDS + EXPORT
   ===================================================================== */
function recordObject(at){
  const t=TASK_BY_ID[at.taskId],d=at.d,a=computeAssessment(at),tagName={ok:'convincing',q:'questionable',check:'check-this'};
  return{recordId:at.id,sampleRecord:!!at.sample,status:at.status,startedAt:new Date(at.createdAt).toISOString(),completedAt:at.completedAt?new Date(at.completedAt).toISOString():null,
   task:{id:t.id,number:t.num,skill:t.skill,title:t.title,context:t.context},
   initialResponse:d.context,
   aiInteraction:{mode:d.consult.mode==='live'?'LIVE (Claude, in-app)':d.consult.mode==='backend'?'LIVE (Gemini, via backend)':d.consult.mode==='demo'?'DEMONSTRATION (pre-written)':'',prompt:d.consult.prompt,promptElementsConsidered:d.consult.checks,response:d.consult.response,aiExtra:d.consult.extra,earlierAttempts:d.consult.history},
   criticalAnalysis:{...d.critique,segments:d.consult.segs.map((s,i)=>({text:s,tag:tagName[d.critique.tags[i]]||'untagged'}))},
   evidenceChecking:{note:'Verdicts are the student\'s own judgments; the platform does not verify sources.',rows:d.check.rows,reliability:d.check.reliability,nextSources:d.check.nextSources},
   alternativeSolution:d.challenge,
   finalConclusion:{claim:d.conclude.claim,reasoning:d.conclude.reasoning,evidence:d.conclude.evidence,conclusion:d.conclude.conclusion,decision:d.conclude.decision,
     reflection:{before:d.conclude.reflectBefore,changed:d.conclude.reflectChanged,rejected:d.conclude.reflectRejected,learned:d.conclude.reflectLearned,next:d.conclude.reflectNext,confidence:d.conclude.confidence}},
   assessmentProfile:{method:'Indicator-based rubric (level = 1 + indicators met, 3 per component); provisional, structural evidence only.',scores:Object.fromEntries(a.items.map(i=>[i.key,i.level])),total:a.total,max:a.max,percentage:a.pct,band:a.band,selfRatings:at.self||{}}}}
const csvCell=v=>{v=v==null?'':String(v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function toCSV(list){
  const cols=['record_id','sample','task','skill','started','completed','ctx_problem','ctx_causes','ctx_info','ctx_approach','ctx_conf','ai_mode','ai_prompt','ai_response','crit_claim','crit_assumptions','crit_convincing','crit_questionable','crit_weaknesses','crit_missing','crit_fit','crit_stance','crit_justification','check_rows_json','check_reliability','check_next_sources','alt_solution','alt_change','alt_disadvantages','alt_counter','alt_whatif','fin_claim','fin_reasoning','fin_evidence','fin_conclusion','fin_decision','ref_before','ref_changed','ref_rejected','ref_learned','ref_next','ref_confidence',...COMP.map(c=>'score_'+c.key),'total','max','percent','band'];
  const rows=list.map(at=>{const r=recordObject(at),d=at.d,s=r.assessmentProfile.scores;
    return[at.id,at.sample?'yes':'no',r.task.title,r.task.skill,r.startedAt,r.completedAt,d.context.problem,d.context.causes,d.context.info,d.context.approach,d.context.conf,r.aiInteraction.mode,d.consult.prompt,d.consult.response,d.critique.claim,d.critique.assumptions,d.critique.convincing,d.critique.questionable,d.critique.weaknesses,d.critique.missing,d.critique.fit,d.critique.stance,d.critique.justification,JSON.stringify(d.check.rows),d.check.reliability,d.check.nextSources,d.challenge.alternative,d.challenge.change,d.challenge.disadvantages,d.challenge.counter,d.challenge.whatif,d.conclude.claim,d.conclude.reasoning,d.conclude.evidence,d.conclude.conclusion,d.conclude.decision,d.conclude.reflectBefore,d.conclude.reflectChanged,d.conclude.reflectRejected,d.conclude.reflectLearned,d.conclude.reflectNext,d.conclude.confidence,...COMP.map(c=>s[c.key]),r.assessmentProfile.total,r.assessmentProfile.max,r.assessmentProfile.percentage,r.assessmentProfile.band].map(csvCell).join(',')});
  return[cols.join(','),...rows].join('\n')}
async function doExport(kind,id){
  const list=id?[S.attempts[id]]:completedList();
  if(!list.length){toast('No completed records to export yet');return}
  const stamp=new Date().toISOString().slice(0,10);
  const data=kind==='json'?JSON.stringify({prototype:'AI-CT TEACHER',exportedAt:new Date().toISOString(),note:'Prototype records for research piloting. Scores are provisional indicators, not validated measures.',records:list.map(recordObject)},null,2):toCSV(list);
  const filename=`ai-ct-teacher-${id?'record':'records'}-${stamp}.${kind}`;
  if(AI.downloads){try{await AI.downloads.save({filename,data});toast('Export ready');return}catch(e){if(e&&e.code==='declined')return}}
  if(window.AICT_STANDALONE){try{const blob=new Blob([(kind==='csv'?'\ufeff':'')+data],{type:kind==='json'?'application/json':'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Export downloaded');return}catch(e){}}
  await modal({title:'Copy your export',html:`<p class="small muted">Downloading is not available in this view. Select the text below and copy it into a file named <b>${esc(filename)}</b>.</p><pre class="export" tabindex="0">${esc(data.slice(0,60000))}${data.length>60000?'\n… (truncated in this preview)':''}</pre>`,actions:[{label:'Close',val:true}]})}
/* =====================================================================
   SOUND — short Web Audio beeps only. No audio files, no autoplay music.
   Sound plays only in direct response to a user action (answering a
   question, starting a game, ...), and only while the ON/OFF toggle
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
  }}
function sndToggleBtn(){return `<button class="sound-toggle" data-act="snd-toggle" aria-pressed="${sndEnabled()}">${sndEnabled()?'🔊':'🔈'} Sound ${sndEnabled()?'on':'off'}</button>`}
/* =====================================================================
   VIEW HELPERS
   ===================================================================== */
const curAttempt=()=>S.attempts[ui.params.attemptId];
const MARK=`<span class="mark" aria-hidden="true"><span>AI<b>–</b>CT</span></span>`;
const statusOf=t=>{const ip=inProgressFor(t.id),done=attemptsFor(t.id).filter(a=>a.status==='completed');
  if(ip)return{chip:`<span class="chip w">In progress, stage ${ip.stage} of 6</span>`,ip,done};
  if(done.length)return{chip:`<span class="chip g">Completed${done.length>1?' ×'+done.length:''}</span>`,ip:null,done};
  return{chip:`<span class="chip">Not started</span>`,ip:null,done}};
const bandChip=b=>`<span class="chip ${b==='Advanced'?'g':b==='Proficient'?'p':b==='Developing'?'w':''}">${b}</span>`;
function fld(at,path,o){const v=getPath(at.d,path)||'',n=W(v),min=o.min||0,id='f-'+path.replace(/\./g,'-');
  return `<div class="fld"><label class="lab" for="${id}">${esc(o.label)}</label>${o.hint?`<p class="hint">${esc(o.hint)}</p>`:''}<textarea id="${id}" rows="${o.rows||4}" data-b="${path}" placeholder="${esc(o.ph||'')}">${esc(v)}</textarea><div class="cnt ${n>=min?'ok':''}" data-cnt="${path}" data-min="${min}">${min?`${n} / ${min} words minimum`:`${n} words`}</div></div>`}
function scale(at,path,label,l,r){const v=+getPath(at.d,path)||0;
  return `<div class="fld"><span class="lab" id="sc-${path.replace(/\./g,'-')}">${esc(label)}</span><div class="scale" role="group" aria-labelledby="sc-${path.replace(/\./g,'-')}">${[1,2,3,4,5].map(n=>`<button type="button" data-scale="${path}" data-val="${n}" aria-pressed="${v===n}">${n}</button>`).join('')}</div><div class="scale-l"><span>${esc(l)}</span><span>${esc(r)}</span></div></div>`}
function scenarioBlock(t,open){
  return `<details class="scenario" ${open?'open':''}><summary>Scenario: ${esc(t.title)} <span class="chip p">${esc(t.skill)}</span></summary><div class="inner"><p class="txt">${esc(t.context)}</p><dl class="facts">${t.facts.map(f=>`<div><dt>${esc(f[0])}:</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl></div></details>`}
function empty(title,text,btns=''){return `<div class="empty"><h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="row" style="justify-content:center">${btns}</div></div>`}

const AUTHOR_HTML=(cls='')=>`<div class="author ${cls}"><span class="author-l">AUTHOR</span><span class="author-n">Sarvinoz Solexonovna</span></div>`;
function footerHTML(){return `<footer class="site-foot">${AUTHOR_HTML('sm')}<div class="author sm"><span class="author-l">INSTITUTION</span><span class="author-n">Samarkand State Institute of Foreign Languages (SamDChTI)</span></div><p class="ft"><b>AI-CT TEACHER</b><br>Artificial Intelligence – Critical Thinking for Future English Teachers. Prototype: records stay in your browser.</p></footer>`}
/* ---------- shell ---------- */
const NAV=[['home','Home'],['about','About AI-CT TEACHER'],['dashboard','Student dashboard'],['cycle','AI-CT 6C cycle'],['library','Task library'],['methods','🎮 Method Challenge'],['competition','🏆 Team Competition'],['progress','My progress'],['assessment','Assessment'],['history','Reflection history']];
function renderShell(){
  const page=ui.page==='record'?'progress':ui.page;
  $('#side').innerHTML=`<button class="brand" data-go="home" aria-label="AI-CT TEACHER, go to home">${MARK}<span><span class="brand-t">AI-CT TEACHER</span><span class="brand-s" style="display:block">Artificial Intelligence – Critical Thinking for Future English Teachers</span></span></button>
   <nav class="nav" aria-label="Pages">${NAV.map(([k,l])=>`<button data-go="${k}" ${page===k?'aria-current="page"':''}>${l}</button>`).join('')}<div class="sep"></div><div class="grp">For teachers and researchers</div><button data-go="teacher" ${page==='teacher'?'aria-current="page"':''}>Teacher dashboard <span class="chip demo" style="font-size:.68rem;padding:1px 7px">DEMO DATA</span></button></nav>
   <div class="side-foot"><span id="storeState">${storageOk?'Saved in this browser':'Memory only (not persistent)'}</span><span>Prototype. Data stays in your browser and is not sent anywhere.</span><button data-act="theme">Switch light / dark</button>${window.AICT_STANDALONE?'<a href="../">About this website</a>':''}</div>`;
  $('#topbar').innerHTML=`${MARK}<strong class="serif">AI-CT TEACHER</strong><button class="menu" data-act="menu" aria-expanded="${ui.menu}" aria-controls="side">Menu</button>`;
  $('#side').classList.toggle('open',ui.menu);$('#scrim').classList.toggle('hidden',!ui.menu)}

/* ---------- HOME ---------- */
function viewHome(){
  const ip=latestInProgress(),st=STAGES[ui.station-1],first=TASKS.find(t=>!attemptsFor(t.id).length)||TASKS[0];
  return `<div class="page">
  <section class="hero"><div>
    <h1 class="motto"><span>Think first.</span><span>Ask AI.</span><span>Challenge the answer.</span><span>Check the evidence.</span><span>Build your own conclusion.</span></h1>
    <p class="muted" style="font-size:1.08rem">AI-CT TEACHER is a practice space for future English teachers. You work through real classroom problems, use AI as one source among several, and record how your own judgment forms.</p>
    <div class="row" style="margin-top:8px">${ip?`<button class="btn" data-act="continue" data-attempt="${ip.id}">Continue Task ${TASK_BY_ID[ip.taskId].num}, stage ${ip.stage}</button><button class="btn quiet" data-go="library">Browse tasks</button>`:`<button class="btn" data-act="start-task" data-task="${first.id}">Start Task ${first.num}: ${esc(first.skill)}</button><button class="btn quiet" data-go="library">Browse all 8 tasks</button>`}</div>${AUTHOR_HTML('home-author')}</div>
    <div class="principle"><q>AI is not a ready-answer provider. <em>AI is a didactic tool and an object for critical analysis.</em></q><p class="small muted" style="margin:14px 0 0">In every task, the AI response is treated as something to examine, verify and challenge. Your independent conclusion is the outcome that counts.</p></div>
  </section>
  <section class="route" aria-labelledby="rt">
    <h2 id="rt" style="margin-bottom:2px">The AI-CT 6C cycle</h2>
    <p class="muted small" style="margin:0">Every task passes through the same six stages, always in this order. Select a stage to see what you do there.</p>
    <ol class="route-line">${STAGES.map(s=>`<li class="station ${s.n===2?'ai':''}" ${ui.station===s.n?'aria-current="true"':''}><button data-act="station" data-n="${s.n}" aria-label="Stage ${s.n}: ${s.name}"><span class="dot">${s.n}</span><span class="lb">${s.name}</span></button></li>`).join('')}</ol>
    <p class="route-note">AI appears in one stage out of six. Reflection is part of the final Conclude stage, not a separate stage.</p>
    <div class="route-detail"><div><h4>What you do</h4><p>${esc(st.task)}</p></div><div><h4>Why it matters</h4><p>${esc(st.why)}</p></div><div><h4>What comes next</h4><p>${esc(st.next)}${st.n===7?', where you see a scored profile of your record':''}</p></div></div>
  </section>
  <section><h2>Six working dimensions of critical thinking</h2>
   <p class="muted">The prototype uses these dimensions to organise tasks and to score records. They are working assessment dimensions, not claims about validated measurement.</p>
   <div class="dims">${COMP.map(c=>`<div><h4>${c.name}</h4><p>${c.about}</p></div>`).join('')}</div></section>
  <hr class="rule">
  <section class="grid2"><div><h3>Built for English teacher education</h3><p class="muted">All eight tasks come from language classrooms: speaking, grammar, vocabulary, writing, assessment, mixed-ability teaching, classroom management and listening.</p></div>
  <div><h3>What this prototype does not claim</h3><p class="muted">It does not prove that critical thinking develops. Scores are transparent indicators from the record you write. Effectiveness has to be tested later in classroom research.</p></div></section></div>`}

/* ---------- ABOUT ---------- */
function viewAbout(){return `<div class="page prose"><div class="page-head"><h1>About AI-CT TEACHER</h1><p>An electronic methodological prototype for developing and organising critical thinking through structured interaction with AI, for future English language teachers.</p></div>
 <div class="row" style="align-items:flex-start;gap:40px;margin:-6px 0 26px;flex-wrap:wrap">${AUTHOR_HTML()}<div class="author"><span class="author-l">INSTITUTION</span><span class="author-n">Samarkand State Institute of Foreign Languages (SamDChTI)</span></div></div>
 <p class="tiny dim" style="max-width:74ch;margin-top:-14px">This is the author's research prototype. It is not an official product of, or endorsed by, any institution. Dissertation topic: "Sun'iy intellekt vositalari asosida bo'lajak ingliz tili o'qituvchilarining tanqidiy fikrlash ko'nikmalarini rivojlantirish metodikasi".</p>
 <h3 style="margin-top:0">About the method</h3><p>AI-CT TEACHER treats artificial intelligence not only as a source of information but as an <b>object of critical analysis</b>. Many tools give students an answer to accept. This one asks students to think first, consult AI, and then critically examine, verify and challenge what it produced, before recording their own accountable decision. The platform makes that thinking process visible, in order: student thinking, AI interaction, critical analysis, evidence checking, alternative reasoning, and an independent conclusion that includes reflection.</p>
 <h3>The AI-CT 6C cycle</h3><div class="tablewrap"><table><thead><tr><th>Stage</th><th>The student</th><th>What is recorded</th></tr></thead><tbody>
 <tr><td><b>1 Context</b></td><td>Analyses the classroom problem with no AI</td><td>Problem, causes, information needed, first approach, initial confidence</td></tr>
 <tr><td><b>2 Consult</b></td><td>Writes their own prompt and reads the response — the only stage where AI is used</td><td>Prompt, prompt elements considered, AI response and its mode (live or demonstration)</td></tr>
 <tr><td><b>3 Critique</b></td><td>Tags and examines the response</td><td>Segment tags, claim, assumptions, strengths, weaknesses, omissions, fit, position and reasons</td></tr>
 <tr><td><b>4 Check</b></td><td>Verifies claims with self-found sources</td><td>Claim, source, source type, evidence, verdict</td></tr>
 <tr><td><b>5 Challenge</b></td><td>Argues against the response</td><td>Alternative solution, changes, disadvantages, counterargument, changed conditions</td></tr>
 <tr><td><b>6 Conclude</b></td><td>Writes an independent judgment, decides whether to accept, modify or reject the AI response, and reflects on how thinking changed</td><td>Claim, reasoning, evidence, conclusion, decision, five reflection answers, final confidence</td></tr></tbody></table></div>
 <div class="notice"><p>Exactly six stages, always in this order. Reflection is not a separate seventh stage; it is the closing part of Conclude, so that a final decision and a look back at one's own thinking happen together.</p></div>
 <h3>Assessment rubric</h3><p>Each of six components is scored 1 to 4 (Beginning, Developing, Proficient, Advanced) as a <b>learning activity indicator</b>, not a validated psychological measurement. For each component, three indicators are checked against the record. The level is 1 plus the number of indicators met. Every indicator is shown on the Assessment page, so you can see exactly why a level was given. You can also rate yourself and compare.</p>
 <div class="notice w"><p><strong>What the score is and is not.</strong> The indicators check whether elements of critical thinking are present in the record (for example, a counterargument of a certain length, or verdicts that match the sources listed). They cannot judge the quality of an idea, and this application alone does not constitute a validated critical-thinking test. For research use, a trained human rater should score records with the same rubric, and scientific validity comes from the research design, sample and analysis, not from the software alone.</p></div>
 <h3>Research-oriented records</h3><p>Each completed task produces one structured record containing task, initial response, AI interaction, critical analysis, evidence checking, alternative solution, final conclusion (including the reflection questions), and assessment profile. Records can be exported as JSON or CSV from My progress.</p>
 <h3>Prototype limitations</h3><ul>
  <li><b>Storage.</b> Records are saved in this browser only (local storage). There is no server database, no accounts, and no sharing between devices. Clearing browser data removes them.</li>
  <li><b>AI.</b> Where the environment allows, you can ask live Claude from the Consult stage; the first request asks for permission. Otherwise a pre-written demonstration response is shown, clearly labelled. It does not react to your prompt.</li>
  <li><b>Evidence checking.</b> The platform does not verify sources. Verdicts are your own judgments.</li>
  <li><b>Teacher dashboard.</b> It uses randomly generated demo data and carries no evidential meaning.</li>
  <li><b>Effectiveness.</b> Whether the platform develops critical thinking must be tested in later pedagogical experimental research.</li></ul>
 <div class="row" style="margin-top:22px"><button class="btn" data-go="library">Open the task library</button></div></div>`}

/* ---------- STUDENT DASHBOARD ---------- */
function viewDashboard(){
  const done=completedList(),ip=latestInProgress(),uniq=new Set(done.map(a=>a.taskId)).size;
  const as=done.map(computeAssessment),avgP=as.length?Math.round(avg(as.map(a=>a.pct))):null;
  const means=COMP.map((c,i)=>as.length?avg(as.map(a=>a.items[i].level)):0);
  const next=TASKS.find(t=>!attemptsFor(t.id).length);
  return `<div class="page"><div class="page-head"><h1>Student dashboard</h1><p>Your work in progress, your record so far and what to do next.</p></div>
  <div class="panel" style="margin-bottom:22px"><div class="grid4">
   <div class="stat"><b>${uniq} / ${TASKS.length}</b><span>tasks completed at least once</span></div>
   <div class="stat"><b>${done.length}</b><span>completed records</span></div>
   <div class="stat"><b>${avgP==null?'—':avgP+'%'}</b><span>average rubric score</span></div>
   <div class="stat"><b>${done.length}</b><span>reflections saved</span></div></div></div>
  <div class="grid2" style="margin-bottom:22px">
   <div class="panel"><h3>${ip?'Continue where you stopped':'Start your next task'}</h3>
    ${ip?`<p><b>Task ${TASK_BY_ID[ip.taskId].num}: ${esc(TASK_BY_ID[ip.taskId].title)}</b><br><span class="muted small">Stage ${ip.stage} of 6, ${STAGES[ip.stage-1].name}. Last saved ${fmtDate(ip.updatedAt)} ${fmtTime(ip.updatedAt)}.</span></p><div class="bar" style="margin-bottom:14px"><i style="width:${Math.round((ip.stage-1)/7*100)}%"></i></div><button class="btn" data-act="continue" data-attempt="${ip.id}">Continue</button>`
     :next?`<p><b>Task ${next.num}: ${esc(next.title)}</b><br><span class="muted small">${esc(next.skill)}. ${esc(next.blurb)}</span></p><button class="btn" data-act="start-task" data-task="${next.id}">Start task</button>`:`<p class="muted">You have started every task. Repeat any task from the library to compare a new attempt.</p><button class="btn" data-go="library">Open library</button>`}</div>
   <div class="panel"><h3>Your component profile</h3>${as.length?`<div class="stack" style="gap:12px">${COMP.map((c,i)=>`<div><div class="row" style="justify-content:space-between;gap:4px"><span class="small">${c.name}</span><span class="small num">${means[i].toFixed(1)} / 4</span></div><div class="bar"><i style="width:${means[i]/4*100}%"></i></div></div>`).join('')}</div>`:`<p class="muted">Complete one task to see your profile. It is built from the indicators in your own records.</p>`}</div></div>
  <h2>Tasks</h2><div class="tablewrap"><table><thead><tr><th>Task</th><th>Context</th><th>Status</th><th></th></tr></thead><tbody>${TASKS.map(t=>{const s=statusOf(t);return `<tr><td class="num"><b>${t.num}</b> ${esc(t.title)}</td><td>${esc(t.skill)}</td><td>${s.chip}</td><td style="text-align:right">${s.ip?`<button class="btn sm" data-act="continue" data-attempt="${s.ip.id}">Continue</button>`:`<button class="btn sm ghost" data-act="start-task" data-task="${t.id}">${s.done.length?'Try again':'Start'}</button>`}</td></tr>`}).join('')}</tbody></table></div>
  <hr class="rule"><div class="panel flat"><h3>Prototype tools</h3><p class="muted small">Load a pre-filled sample record to explore Assessment, My progress and Reflection history without writing a full task first. It is labelled SAMPLE everywhere it appears.</p><div class="row"><button class="btn quiet sm" data-act="sample">Load sample record</button><button class="btn danger sm" data-act="reset">Delete all my saved data</button></div></div></div>`}

/* ---------- TASK LIBRARY ---------- */
const catTasks=key=>TASKS.filter(t=>t.category===key);
const catProgress=key=>{const ts=catTasks(key),done=ts.filter(t=>attemptsFor(t.id).some(a=>a.status==='completed')).length;return{total:ts.length,done}};
function viewLibrary(){
  if(!ui.libCategory)return viewLibraryCategories();
  const cat=CAT_BY_KEY[ui.libCategory];
  if(!cat){ui.libCategory=null;return viewLibraryCategories()}
  const list=catTasks(cat.key);
  return `<div class="page"><div class="page-head"><button class="btn quiet sm" data-act="lib-back" style="margin-bottom:14px">← All categories</button>
  <h1>${cat.icon} ${esc(cat.name)}</h1><p>${esc(cat.desc)}</p></div>
  <div class="tasks">${list.map(t=>{const s=statusOf(t);return `<article class="task"><div class="tn" aria-hidden="true">${t.num}</div><div><h3>Task ${t.num}: ${esc(t.title)}</h3><p>${esc(t.blurb)}</p><div class="meta"><span class="chip p">${esc(t.skill)}</span>${t.topics.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}<span class="chip">${esc(t.level)}</span><span class="chip">${esc(t.mins)}</span>${s.chip}</div></div>
   <div class="acts">${s.ip?`<button class="btn" data-act="continue" data-attempt="${s.ip.id}">Continue</button>`:`<button class="btn" data-act="start-task" data-task="${t.id}">${s.done.length?'Start new attempt':'Start task'}</button>`}${s.done.length?`<button class="btn quiet sm" data-go="record" data-id="${s.done[s.done.length-1].id}">View last record</button>`:''}</div></article>`}).join('')}</div></div>`}
function viewLibraryCategories(){
  return `<div class="page"><div class="page-head"><h1>Task library</h1><p>${TASKS.length} classroom tasks, organised into eight categories. Every task runs through the full AI-CT 6C cycle, whichever category it sits in.</p></div>
  <div class="cat-grid">${CATEGORIES.map(c=>{const p=catProgress(c.key);return `<button class="cat-card" data-act="lib-open" data-cat="${c.key}" aria-label="${esc(c.name)}: ${p.total} task${p.total===1?'':'s'}, ${p.done} completed">
    <span class="cat-icon" aria-hidden="true">${c.icon}</span>
    <span class="cat-name">${esc(c.name)}</span>
    <span class="cat-desc">${esc(c.desc)}</span>
    <span class="cat-meta"><span class="cat-count">${p.total} task${p.total===1?'':'s'}</span>${p.done?`<span class="cat-done">${p.done} completed</span>`:''}</span>
  </button>`}).join('')}</div></div>`}

/* ---------- 6C CYCLE ---------- */
function viewCycle(){
  const at=curAttempt();
  if(!at){
    const ips=attemptsList().filter(a=>a.status==='in_progress');
    return `<div class="page"><div class="page-head"><h1>AI-CT 6C cycle</h1><p>Choose a task to begin, or continue one you have started. Stages must be completed in order.</p></div>
    ${ips.length?`<h3>In progress</h3><div class="stack" style="margin-bottom:26px">${ips.map(a=>`<div class="panel row" style="justify-content:space-between"><div><b>Task ${TASK_BY_ID[a.taskId].num}: ${esc(TASK_BY_ID[a.taskId].title)}</b><div class="muted small">Stage ${a.stage} of 6, ${STAGES[a.stage-1].name}</div></div><button class="btn" data-act="continue" data-attempt="${a.id}">Continue</button></div>`).join('')}</div>`:''}
    <h3>Start a task</h3><div class="grid2">${TASKS.map(t=>`<div class="panel"><span class="chip p">${esc(t.skill)}</span><h4 style="margin-top:8px">Task ${t.num}: ${esc(t.title)}</h4><p class="muted small">${esc(t.blurb)}</p><button class="btn sm ghost" data-act="start-task" data-task="${t.id}">${inProgressFor(t.id)?'Continue':'Start'}</button></div>`).join('')}</div></div>`}
  const t=TASK_BY_ID[at.taskId],st=STAGES[at.stage-1];
  return `<div class="page"><div class="cyc-head"><h2>Task ${t.num}: ${esc(t.title)}</h2><div class="row" style="gap:8px"><span class="chip p">${esc(t.skill)}</span>${at.sample?'<span class="chip demo">SAMPLE RECORD</span>':''}${at.status==='completed'?'<span class="chip g">Completed</span>':''}</div></div>
  <ol class="stepper" aria-label="AI-CT 6C progress">${STAGES.map(s=>{const done=s.n<at.stage||(at.status==='completed'&&s.n<=at.stage),cur=s.n===at.stage,can=canEnter(at,s.n)||cur;
   return `<li class="step ${cur?'current':''} ${done&&!cur?'done':''} ${!can?'locked':''}"><button data-act="stage" data-stage="${s.n}" ${cur?'aria-current="step"':''} ${!can?'aria-disabled="true"':''} aria-label="Stage ${s.n}: ${s.name}${cur?', current':done?', completed':can?'':', locked'}"><span class="dot">${done&&!cur?'✓':s.n}</span><span class="lb">${s.name}</span></button></li>`}).join('')}</ol>
  <section class="brief" aria-label="Where you are"><div class="here"><h4>Where am I?</h4><p><b>Stage ${st.n} of 6: ${st.name}</b></p></div><div><h4>What do I have to do?</h4><p>${esc(st.task)}</p></div><div><h4>Why am I doing it?</h4><p>${esc(st.why)}</p></div><div><h4>What comes next?</h4><p>${st.n===7?'Assessment of your record':st.next}</p></div></section>
  <div class="cyc-grid with-trace"><div class="stage-main" id="stageMain">${stageHTML(at)}</div><details class="trace" id="trace"><summary>Your thinking trace</summary><ol class="tl" id="traceList">${traceHTML(at)}</ol></details></div>
  <div class="actionbar"><details class="reqs"><summary id="reqSum"></summary><ul id="reqList"></ul></details><div class="acts-r"><span class="saved" id="savedAt">${lastSaved?'Saved '+fmtTime(lastSaved):'Not saved yet'}</span>
   <button class="btn quiet sm" data-act="back" ${at.stage===1?'disabled':''}>Back</button><button class="btn quiet sm" data-act="save">Save</button><button class="btn quiet sm" data-act="later">Continue later</button>
   ${at.stage<6?`<button class="btn" id="nextBtn" data-act="next">Next: ${st.next}</button>`:`<button class="btn" id="nextBtn" data-act="finish">${at.status==='completed'?'View assessment':'Complete 6C Activity'}</button>`}</div></div></div>`}
function canEnter(at,n){if(n>at.maxStage)return false;for(let s=1;s<n;s++)if(!stageOk(at,s))return false;return true}

function stageHTML(at){switch(at.stage){case 1:return stage1(at);case 2:return stage2(at);case 3:return stage3(at);case 4:return stage4(at);case 5:return stage5(at);case 6:return stage6(at)}}
function stage1(at){const t=TASK_BY_ID[at.taskId];return `${scenarioBlock(t,true)}
 <div class="panel form"><div class="notice"><strong>No AI in this stage.</strong> The next stage opens only after you have written your own analysis. It becomes your baseline for later comparison.</div>
 ${fld(at,'context.problem',{label:'What is the main problem?',hint:'Say it in your own words, as the teacher responsible for this class.',min:8,rows:3})}
 ${fld(at,'context.causes',{label:'What may be causing it?',hint:'Give more than one possible cause if you can. Which are facts from the scenario and which are your guesses?',min:8})}
 ${fld(at,'context.info',{label:'What information do you need before proposing a solution?',min:6,rows:3})}
 ${fld(at,'context.approach',{label:'What would you initially do as a future English teacher?',hint:'A concrete first step or plan, with a reason.',min:12})}
 ${scale(at,'context.conf','How confident are you in this initial approach?','1 = not at all confident','5 = very confident')}</div>`}

const PROMPT_ELEMS=[['ctx','Classroom context: level, age, class size'],['prob','The specific problem you analysed'],['cons','Constraints such as time, materials, room layout'],['fmt','The kind of answer you want (options, steps, reasons)'],['unc','A request that AI states its assumptions and uncertainties']];
function aiStatusHTML(){return !AI.checked?'Checking whether live AI is available in this view…':AI_ENDPOINT?'<b>Live AI (Gemini) is available through a secure server.</b> You never enter an API key. Live responses can still contain errors, so treat them as claims to check.':AI.sample?'<b>Live AI is available.</b> Your first request will ask for permission and uses your own Claude usage. Live responses can still contain errors.':'<b>Live AI is not available in this view.</b> The demonstration response is pre-written for this task and does not react to your prompt.'}
function aiCtlHTML(at){const n=W(at.d.consult.prompt),ok=n>=12&&!ui.streaming,has=!!at.d.consult.response,anyLive=AI.sample||AI_ENDPOINT;
  return `${AI.sample?`<button class="btn" data-act="ask-live" ${ok?'':'disabled'}>${has?'Ask live AI again':'Ask AI (live)'}</button>`:''}${AI_ENDPOINT?`<button class="btn ${AI.sample?'quiet':''}" data-act="ask-backend" ${ok?'':'disabled'}>${has?'Ask live AI again (Gemini)':'Ask AI (live, Gemini)'}</button>`:''}<button class="btn ${anyLive?'quiet':''}" data-act="ask-demo" ${ok?'':'disabled'}>${has?'Show demonstration response again':'Show demonstration response'}</button>${ui.streaming?'<button class="btn danger" data-act="stop-ai">Stop</button>':''}`}
function aiParas(t){return responseParas(t).map(p=>`<p>${esc(p)}</p>`).join('')}
function aiExtraHTML(x){if(!x||(!x.claims.length&&!x.assumptions.length&&!x.uncertainty&&!x.followUp))return'';
  return `<div class="ai-foot" style="display:grid;gap:8px">
   ${x.claims.length?`<div><b>Claims worth checking:</b> ${x.claims.map(esc).join('; ')}</div>`:''}
   ${x.assumptions.length?`<div><b>Possible assumptions:</b> ${x.assumptions.map(esc).join('; ')}</div>`:''}
   ${x.uncertainty?`<div><b>Stated uncertainty:</b> ${esc(x.uncertainty)}</div>`:''}
   ${x.followUp?`<div><b>Follow-up question from the AI:</b> ${esc(x.followUp)}</div>`:''}
  </div>`}
function aiOutHTML(at){const c=at.d.consult;
  if(ui.streaming)return `<div class="ai-box"><div class="ai-label"><span>AI RESPONSE — LIVE (Claude)</span></div><div class="ai-body">${ui.stream?aiParas(ui.stream):`<span class="thinking" aria-live="polite">Thinking <i></i><i></i><i></i></span>`}</div></div>`;
  if(ui.aiErr&&!c.response)return `<div class="notice b"><p>${esc(ui.aiErr)}</p></div>`;
  if(!c.response)return `<div class="empty"><p class="muted">Write your prompt, then ask AI. The response will appear here as material to analyse.</p></div>`;
  const live=c.mode==='live'||c.mode==='backend',label=c.mode==='live'?'AI RESPONSE — LIVE (Claude)':c.mode==='backend'?'AI RESPONSE — LIVE (Gemini, via backend)':'AI RESPONSE — DEMONSTRATION';
  return `${ui.aiErr?`<div class="notice b"><p>${esc(ui.aiErr)}</p></div>`:''}<div class="ai-box"><div class="ai-label"><span>${label}</span><span class="small">${fmtTime(c.ts)}</span></div><div class="ai-body">${aiParas(c.response)}</div><div class="ai-foot">${live?'Generated just now from your prompt. AI output can contain mistakes, including invented facts and sources.':'Pre-written for this task. It was not generated from your prompt, and no live model was used.'}</div>${aiExtraHTML(c.extra)}</div>
  <div class="notice"><p><strong>This page does not say whether the response is correct.</strong> Deciding that is your work in the next three stages.</p></div>`}
function stage2(at){const c=at.d.consult,t=TASK_BY_ID[at.taskId];
  return `${scenarioBlock(t,false)}<div class="panel form"><h3 style="margin:0">Write your own prompt</h3><p class="muted small" style="margin:0">Write the request yourself. What you include, and leave out, will shape what AI says. Tick the elements you deliberately included; this is recorded for reflection.</p>
  <div class="checklist" role="group" aria-label="Prompt elements">${PROMPT_ELEMS.map(([k,l])=>`<label><input type="checkbox" data-check="${k}" ${c.checks.includes(k)?'checked':''}> ${esc(l)}</label>`).join('')}</div>
  ${fld(at,'consult.prompt',{label:'Your prompt to AI',hint:'For example, ask for possible solutions, with reasons.',min:12,rows:5,ph:'Type your request to AI here…'})}
  <div class="row" id="aiCtl">${aiCtlHTML(at)}</div><p class="small muted" id="aiStatus" style="margin:0">${aiStatusHTML()}</p></div>
  <div id="aiOut">${aiOutHTML(at)}</div>
  ${c.history.length?`<details class="panel"><summary style="cursor:pointer;font-weight:600">Earlier prompts and responses (${c.history.length})</summary>${c.history.map((h,i)=>`<div style="margin-top:14px"><div class="small muted">Attempt ${i+1}, ${h.mode==='live'?'live':'demonstration'}</div><p class="small"><b>Prompt:</b> ${esc(h.prompt)}</p><p class="small muted">${esc(excerpt(h.response,260))}</p></div>`).join('')}</details>`:''}`}

function segsHTML(at){const c=at.d.consult,tg=at.d.critique.tags;
  return c.segs.map((s,i)=>`<div class="seg ${tg[i]?'t-'+tg[i]:''}"><p>${esc(s)}</p><div class="tags" role="group" aria-label="Tag segment ${i+1}"><button class="ok" data-act="tag" data-i="${i}" data-t="ok" aria-pressed="${tg[i]==='ok'}">Convincing</button><button class="q" data-act="tag" data-i="${i}" data-t="q" aria-pressed="${tg[i]==='q'}">Questionable</button><button class="check" data-act="tag" data-i="${i}" data-t="check" aria-pressed="${tg[i]==='check'}">Check this</button></div></div>`).join('')}
function stage3(at){const c=at.d.consult,x=at.d.critique,live=c.mode==='live';
  return `${scenarioBlock(TASK_BY_ID[at.taskId],false)}<div class="split"><div class="stick"><div class="ai-box"><div class="ai-label"><span>${live?'AI RESPONSE — LIVE (Claude)':'AI RESPONSE — DEMONSTRATION'}</span></div><div class="ai-body"><p class="small muted" style="font-family:var(--sans)">Tag each part as you read. Mark anything whose truth you cannot yet vouch for as "Check this"; those parts go to the next stage.</p><div id="segs">${segsHTML(at)}</div></div></div></div>
  <div class="panel form"><h3 style="margin:0">Examine the response</h3>
  ${fld(at,'critique.claim',{label:'What is the main claim?',min:6,rows:2})}
  ${fld(at,'critique.assumptions',{label:'What assumptions does the AI make?',hint:'What must be true for its advice to work?',min:8,rows:3})}
  ${fld(at,'critique.convincing',{label:'Which parts are convincing, and why?',min:8,rows:3})}
  ${fld(at,'critique.questionable',{label:'Which parts are questionable, and why?',min:8,rows:3})}
  ${fld(at,'critique.weaknesses',{label:'What weaknesses do you see?',min:8,rows:3})}
  ${fld(at,'critique.missing',{label:'Is anything missing?',min:6,rows:2})}
  ${fld(at,'critique.fit',{label:'Does the recommendation fit this specific classroom?',hint:'Refer to details in the scenario: numbers, level, time, materials.',min:10,rows:3})}
  <div class="fld"><span class="lab" id="stl">Do you agree with the AI response?</span><div class="opts" role="radiogroup" aria-labelledby="stl">${[['agree','I agree'],['partly','I partly agree'],['disagree','I disagree']].map(([v,l])=>`<label><input type="radio" name="stance" value="${v}" data-b="critique.stance" ${x.stance===v?'checked':''}> ${l}</label>`).join('')}</div></div>
  ${fld(at,'critique.justification',{label:'Give your reasons',hint:'A position without reasons is not enough. Which specific parts lead you to this view?',min:20})}</div></div>`}

function verdictChip(v){const o=VERDICTS.find(x=>x.v===v);return o?`<span class="chip ${o.cls}">${o.label}</span>`:'<span class="chip">No verdict yet</span>'}
function rowHTML(at,r,i){const p=`check.rows.${i}`;
  return `<div class="evrow" data-row="${i}"><div class="top"><b>Claim ${i+1}</b><span class="row" style="gap:8px"><span data-vb="${i}">${verdictChip(r.verdict)}</span><button class="btn danger sm" data-act="del-row" data-i="${i}" aria-label="Remove claim ${i+1}">Remove</button></span></div>
  <div class="fld"><label class="lab" for="rc${i}">Claim to verify</label><textarea id="rc${i}" rows="2" data-b="${p}.claim">${esc(r.claim)}</textarea></div>
  <div class="evgrid"><div class="fld"><label class="lab" for="rs${i}">Source you consulted</label><input type="text" id="rs${i}" data-b="${p}.source" value="${esc(r.source)}" placeholder="Author, year, title or link"></div>
  <div class="fld"><label class="lab" for="rt${i}">Type of source</label><select id="rt${i}" data-b="${p}.sourceType"><option value="">Choose…</option>${SOURCE_TYPES.map(s=>`<option ${r.sourceType===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div></div>
  <div class="fld"><label class="lab" for="re${i}">Evidence: what did the source say, and how does it relate to the claim?</label><textarea id="re${i}" rows="3" data-b="${p}.evidence">${esc(r.evidence)}</textarea><div class="cnt ${W(r.evidence)>=8?'ok':''}" data-cnt="${p}.evidence" data-min="8">${W(r.evidence)} / 8 words minimum</div></div>
  <div class="fld"><label class="lab" for="rv${i}">Your verdict</label><select id="rv${i}" data-b="${p}.verdict"><option value="">Choose a verdict…</option>${VERDICTS.map(v=>`<option value="${v.v}" ${r.verdict===v.v?'selected':''}>${v.v.replace('PARTIALLY','PARTIALLY SUPPORTED')}</option>`).join('')}</select></div></div>`}
function stage4(at){const c=at.d.check;
  return `${scenarioBlock(TASK_BY_ID[at.taskId],false)}<div class="notice w"><p><strong>The platform does not check sources for you.</strong> You find the sources; you decide the verdict. If you cannot find support, "Unsupported" or "Uncertain" is a legitimate result. Fluent text can contain invented facts, figures and references.</p></div>
  <div class="verdicts">${VERDICTS.map(v=>`<div><b>${v.v}</b>${v.def}</div>`).join('')}</div>
  <div class="stack" id="rows">${c.rows.map((r,i)=>rowHTML(at,r,i)).join('')||`<div class="empty"><p class="muted">No claims yet. Add a claim from the AI response that you want to test.</p></div>`}</div>
  <div class="row"><button class="btn quiet" data-act="add-row">Add another claim</button></div>
  <div class="panel form">${fld(at,'check.reliability',{label:'Is the AI information reliable? Could it have produced inaccurate or invented information?',hint:'Base this on what you found, not on a general feeling.',min:10})}
  ${fld(at,'check.nextSources',{label:'Which other sources could you consult for the claims you could not settle?',min:6,rows:3})}</div>`}

function stage5(at){const t=TASK_BY_ID[at.taskId];
  return `${scenarioBlock(t,false)}<div class="panel form"><div class="notice"><p><strong>Your turn to argue back.</strong> Propose something different from the AI response and say what its costs are.</p></div>
  ${fld(at,'challenge.alternative',{label:'Propose an alternative solution',hint:'Different in substance from the AI response, with a reason it could work here.',min:15,rows:5})}
  ${fld(at,'challenge.change',{label:'What would you change in the AI recommendation?',min:8,rows:3})}
  ${fld(at,'challenge.disadvantages',{label:'What are possible disadvantages of the AI recommendation?',min:8,rows:3})}
  ${fld(at,'challenge.counter',{label:'Formulate a counterargument',hint:'A reasoned argument against the AI position, or against your own.',min:10,rows:3})}
  <div class="notice w"><p><strong>What if conditions changed?</strong> ${esc(t.whatIf)}</p></div>
  ${fld(at,'challenge.whatif',{label:'Your answer to the changed conditions',min:10,rows:4})}</div>`}

function stage6(at){const x=at.d.context,c0=x.conf,cs=copyScore(at);
  return `${scenarioBlock(TASK_BY_ID[at.taskId],false)}<div class="notice b"><p><strong>Do not simply copy the AI response.</strong> Formulate your own professional conclusion, using what you found and argued in the earlier stages, then reflect briefly on how your thinking moved.</p></div>
  <div class="split"><div class="panel form"><h3 style="margin:0">Your final judgment</h3>
  ${fld(at,'conclude.claim',{label:'Claim',hint:'Your position in one or two sentences.',min:8,rows:2})}
  ${fld(at,'conclude.reasoning',{label:'Reasoning',hint:'Why is the claim true or wise for this classroom? Use words such as because, since, however.',min:15,rows:5})}
  ${fld(at,'conclude.evidence',{label:'Evidence',hint:'What you checked in stage 4 and what it showed.',min:10,rows:3})}
  ${fld(at,'conclude.conclusion',{label:'Conclusion',hint:'What you will do or recommend, and how you will know if it works.',min:12,rows:3})}
  <div class="fld"><span class="lab" id="shl">Should the original AI response be accepted, modified or rejected?</span><div class="opts" role="radiogroup" aria-labelledby="shl">${[['accept','Accepted, largely as it was'],['modify','Modified, with real changes'],['reject','Rejected, in favour of my alternative']].map(([v,l])=>`<label><input type="radio" name="decision" value="${v}" data-b="conclude.decision" ${at.d.conclude.decision===v?'checked':''}> ${l}</label>`).join('')}</div></div>
  <div id="copyBox" class="notice ${cs>=0.5?'b':cs>=0.25?'w':'g'}"><p>${copyMsg(cs)}</p></div>
  <hr class="rule">
  <h3 style="margin:0">Reflect on your thinking</h3><p class="hint" style="margin-top:-4px">Your initial confidence in Context was <b>${c0||'–'}/5</b>.</p>
  ${fld(at,'conclude.reflectBefore',{label:'What did you think before consulting AI?',min:8,rows:3})}
  ${fld(at,'conclude.reflectChanged',{label:'What did AI change or challenge in your thinking?',min:8,rows:3})}
  ${fld(at,'conclude.reflectRejected',{label:'Which part of the AI response did you reject, and why?',min:8,rows:3})}
  ${fld(at,'conclude.reflectLearned',{label:'What did you learn?',min:8,rows:3})}
  ${fld(at,'conclude.reflectNext',{label:'What would you do differently next time?',min:8,rows:3})}
  ${scale(at,'conclude.confidence','How confident are you in your final conclusion?','1 = not at all confident','5 = very confident')}
  </div>
  <div class="stick panel"><h3 style="margin-top:0">Compare with your initial response</h3><div class="compare"><div class="col"><h4>Before AI (Context)</h4><p><b>Problem:</b> ${esc(x.problem)}</p><p><b>First approach:</b> ${esc(x.approach)}</p><p class="small muted">Confidence then: ${x.conf}/5</p></div><div class="col"><h4>Now (Conclude)</h4><p id="finPreview">${finPreview(at)}</p></div></div></div></div>`}
const copyMsg=cs=>cs>=0.5?'<strong>Too close to the AI text.</strong> Large parts of your claim, reasoning and conclusion match the AI response word for word. Rewrite them in your own words to continue.':cs>=0.25?'<strong>Partly similar to the AI text.</strong> Some phrases match the AI response. Check that this is your own reasoning. (This is a rough word-sequence check, not proof.)':'<strong>Written in your own words.</strong> The system compared your text with the AI response using word-sequence matching. This is a rough check, not proof.';
const finPreview=at=>{const c=at.d.conclude;return c.claim||c.conclusion?`<b>Claim:</b> ${esc(c.claim)}<br><br><b>Conclusion:</b> ${esc(c.conclusion)}`:'<span class="muted">Your final judgment will appear here as you write it.</span>'};

/* ---------- thinking trace ---------- */
function traceHTML(at){const d=at.d,c=tagCounts(at),rows=d.check.rows.filter(r=>r.verdict),vc={};rows.forEach(r=>vc[r.verdict]=(vc[r.verdict]||0)+1);
  const stanceL={agree:'Agrees',partly:'Partly agrees',disagree:'Disagrees'};
  const it=[
   [1,d.context.approach?`${esc(excerpt(d.context.approach,110))}${d.context.conf?` (confidence ${d.context.conf}/5)`:''}`:''],
   [2,d.consult.prompt?`${d.consult.mode==='live'?'Live':d.consult.mode==='demo'?'Demonstration':'Draft'} prompt: ${esc(excerpt(d.consult.prompt,100))}`:''],
   [3,d.critique.stance?`${stanceL[d.critique.stance]}. Tagged ${c.ok} convincing, ${c.q} questionable, ${c.check} to check.`:(c.ok+c.q+c.check?`Tagged ${c.ok+c.q+c.check} parts so far.`:'')],
   [4,rows.length?`${rows.length} verdict${rows.length>1?'s':''}: ${Object.entries(vc).map(([k,v])=>`${v} ${k.toLowerCase()}`).join(', ')}.`:(d.check.rows.length?`${d.check.rows.length} claim${d.check.rows.length>1?'s':''} to check.`:'')],
   [5,d.challenge.alternative?esc(excerpt(d.challenge.alternative,110)):''],
   [6,d.conclude.confidence?`${esc(excerpt(d.conclude.claim,90))} Final confidence ${d.conclude.confidence}/5 (initial ${d.context.conf||'–'}/5).`:d.conclude.claim?esc(excerpt(d.conclude.claim,110)):(d.conclude.reflectLearned?esc(excerpt(d.conclude.reflectLearned,100)):'')]];
  return it.map(([n,txt])=>`<li class="${txt?'on':''} ${n===at.stage?'now':''}"><b>${n} ${STAGES[n-1].name}</b>${txt?`<span>${txt}</span>`:`<span class="none">${n<=at.maxStage?'In progress':'Not reached yet'}</span>`}</li>`).join('')}
/* =====================================================================
   CHARTS (inline SVG)
   ===================================================================== */
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

/* ---------- ASSESSMENT ---------- */
function viewAssessment(){
  const done=completedList().reverse();
  if(!done.length)return `<div class="page"><div class="page-head"><h1>Assessment</h1><p>Rubric scores are calculated from a completed task record.</p></div>${empty('No completed record yet','Finish a task to see your scores, or load a sample record to explore this page.',`<button class="btn" data-go="library">Choose a task</button><button class="btn quiet" data-act="sample">Load sample record</button>`)}</div>`;
  const at=S.attempts[ui.assessId]&&S.attempts[ui.assessId].status==='completed'?S.attempts[ui.assessId]:done[0],t=TASK_BY_ID[at.taskId],a=computeAssessment(at),pt=profileText(a),jc=ui.justCompleted===at.id;
  const design=at.d.consult.mode==='demo'?t.design:null;
  return `<div class="page"><div class="page-head"><h1>Assessment</h1><p>Six components, each scored 1 to 4 from indicators in your record. Every indicator is shown, so you can see how each score was reached.</p></div>
  ${jc?`<div class="notice g" style="margin-bottom:18px"><p><strong>Task completed and saved.</strong> Your structured record for Task ${t.num} is stored in this browser.</p>${(ui.justBadges||[]).length?`<div class="badge-row">${ui.justBadges.map(k=>badgeHTML(k,true)).join('')}</div>`:''}</div>`:''}
  <div class="row" style="margin-bottom:18px"><div class="fld" style="min-width:260px"><label class="lab" for="asel">Record</label><select id="asel" data-sel="assess">${done.map(d=>`<option value="${d.id}" ${d.id===at.id?'selected':''}>Task ${TASK_BY_ID[d.taskId].num}: ${esc(TASK_BY_ID[d.taskId].title)}, ${fmtDate(d.completedAt)}${d.sample?' (SAMPLE)':''}</option>`).join('')}</select></div><button class="btn quiet sm" data-go="record" data-id="${at.id}">View full record</button></div>
  <div class="panel" style="margin-bottom:22px"><div class="score-top"><div class="stat"><b class="num">${a.total}</b><span>total score</span></div><div class="stat"><b class="num">${a.max}</b><span>maximum score</span></div><div class="stat"><b class="num">${a.pct}%</b><span>of maximum</span></div><div class="stat"><b style="font-size:1.5rem">${a.band}</b><span>overall level (mean ${a.mean.toFixed(1)})</span></div></div>
  <hr class="rule" style="margin:20px 0"><div class="grid2"><div><h3>Performance profile</h3><p>${esc(pt.strong)}</p><p>${esc(pt.dev)}</p>${at.sample?'<p class="chip demo">SAMPLE RECORD, pre-filled example text</p>':''}</div><div>${radarSVG(a.items.map(i=>i.level),COMP.map(c=>c.short))}</div></div></div>
  <div class="notice w" style="margin-bottom:22px"><p><strong>How to read this.</strong> Each component has three indicators. Level = 1 + indicators met. The indicators show that elements of critical thinking are present in your record, such as a counterargument or verdicts that match your sources. They cannot judge how good your ideas are. Treat the result as provisional feedback, not as a measure of ability.</p></div>
  <div class="stack">${a.items.map(it=>{const self=at.self[it.key];return `<section class="comp" aria-labelledby="c-${it.key}"><div class="comp-h"><h3 id="c-${it.key}">${it.name}</h3><span class="lvl">Level ${it.level} <span class="muted small" style="font-family:var(--sans)">${LEVELS[it.level]}</span></span></div><p class="muted small" style="margin:0">${COMP.find(c=>c.key===it.key).about}</p>
   <div class="ladder">${RUBRIC[it.key].map((d,i)=>`<div class="${it.level===i+1?'cur':''}"><b>${i+1} ${LEVELS[i+1]}</b><span>${esc(d)}</span></div>`).join('')}</div>
   <div><b class="small">Indicators found in your record (${it.met} of 3)</b><ul class="inds" style="margin-top:8px">${it.indicators.map(i=>`<li class="${i.ok?'ok':'no'}"><i>${i.ok?'✓':'–'}</i><span>${esc(i.label)}</span></li>`).join('')}</ul></div>
   <div class="selfrate"><span id="sr-${it.key}">Your own rating (optional):</span>${[1,2,3,4].map(n=>`<button data-act="self" data-c="${it.key}" data-v="${n}" aria-pressed="${self===n}" aria-label="Rate ${it.name} ${n}">${n}</button>`).join('')}${self?`<span class="small muted">${self===it.level?'Matches the record-based level.':self>it.level?`Your rating is ${self-it.level} above the record-based level. Which part of your record supports it?`:`Your rating is ${it.level-self} below the record-based level.`}</span>`:''}</div></section>`}).join('')}</div>
  ${design?`<hr class="rule"><div class="panel"><h3>What the demonstration response was designed to test</h3><p class="muted small">Shown after your analysis, so it could not shape it. The response was pre-written for this task and included deliberate weaknesses. Compare this list with your own critique and evidence checking.</p><ul>${design.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
  <div class="row" style="margin-top:22px"><button class="btn" data-go="library">Choose another task</button><button class="btn quiet" data-go="progress">See my progress</button></div></div>`}

/* ---------- MY PROGRESS ---------- */
function gameActivityHTML(){
  const xp=S.xp||0,badges=S.badges||[],rounds=S.methodRounds||[],comps=S.competitions||[];
  if(!xp&&!badges.length&&!rounds.length&&!comps.length)return'';
  const avgPct=rounds.length?Math.round(avg(rounds.map(r=>pct(r.correct,r.total)))):null;
  const lastComp=comps[comps.length-1];
  return `<div class="panel" style="margin-bottom:22px"><h3 style="margin-top:0">Game activity</h3><p class="muted small" style="margin-top:-6px">XP, badges and game results are learning-activity indicators from Method Challenge and Team Competition. They are separate from the 6C rubric above and are not a measure of critical-thinking ability.</p>
   <div class="grid4" style="margin-bottom:16px"><div class="stat"><b>${xp}</b><span>total XP</span></div><div class="stat"><b>${badges.length} / ${Object.keys(BADGES).length}</b><span>badges earned</span></div><div class="stat"><b>${rounds.length}</b><span>Method Challenge rounds</span></div><div class="stat"><b>${comps.length}</b><span>Team Competitions played</span></div></div>
   ${rounds.length?`<p class="small muted">Average Method Challenge score: ${avgPct}% correct across ${rounds.length} round${rounds.length===1?'':'s'}.</p>`:''}
   ${lastComp?`<p class="small muted">Last Team Competition: ${lastComp.mode} team${lastComp.mode===1?'':'s'}, ${lastComp.difficulty}, scores ${lastComp.results.map(r=>`${esc(r.name)} ${r.score}`).join(', ')}.</p>`:''}
   <div class="badge-row">${Object.entries(BADGES).map(([k,b])=>{const earned=badges.includes(k);return `<span class="badge" style="${earned?'':'opacity:.4;filter:grayscale(1)'}" title="${esc(b.desc)}">${b.icon} ${esc(b.name)}${earned?'':' (locked)'}</span>`}).join('')}</div></div>`}
function viewProgress(){
  const done=completedList(),as=done.map(computeAssessment),ips=attemptsList().filter(a=>a.status==='in_progress'),ga=gameActivityHTML();
  if(!done.length&&!ips.length)return `<div class="page"><div class="page-head"><h1>My progress</h1><p>Your completed tasks and how your scores change across them.</p></div>${ga}${empty('Nothing here yet','Start your first task. Progress appears when a task is completed.',`<button class="btn" data-go="library">Choose a task</button><button class="btn quiet" data-act="sample">Load sample record</button>`)}</div>`;
  const means=COMP.map((c,i)=>as.length?avg(as.map(a=>a.items[i].level)):0),uniq=new Set(done.map(a=>a.taskId)).size;
  const conf=done.map(a=>[a.d.context.conf,a.d.conclude.confidence]);
  return `<div class="page"><div class="page-head"><h1>My progress</h1><p>Your completed tasks and how the record-based scores change across them. Scores are provisional indicators, so read trends with care.</p></div>
  ${ga}
  <div class="panel" style="margin-bottom:22px"><div class="grid4"><div class="stat"><b>${uniq} / ${TASKS.length}</b><span>tasks completed</span></div><div class="stat"><b>${done.length}</b><span>completed records</span></div><div class="stat"><b>${as.length?Math.round(avg(as.map(a=>a.pct)))+'%':'—'}</b><span>average score</span></div><div class="stat"><b>${ips.length}</b><span>in progress</span></div></div></div>
  ${as.length?`<div class="grid2" style="margin-bottom:22px"><div class="panel"><h3>Average level by component</h3>${radarSVG(means,COMP.map(c=>c.short))}</div><div class="panel"><h3>Score across records</h3>${lineSVG(as.map((a,i)=>({label:'#'+(i+1),v:a.pct})),560,240,'records')}<p class="small muted">Records in the order completed. ${as.length<2?'Complete more tasks to see a trend.':''}</p></div></div>
  <h2>Records</h2><div class="tablewrap" style="margin-bottom:22px"><table><thead><tr><th>#</th><th>Task</th><th>Completed</th><th>Score</th><th>Level</th><th>Confidence (start → end)</th><th></th></tr></thead><tbody>${done.map((d,i)=>`<tr><td class="num">${i+1}</td><td>Task ${TASK_BY_ID[d.taskId].num}: ${esc(TASK_BY_ID[d.taskId].title)}${d.sample?' <span class="chip demo">SAMPLE</span>':''}</td><td>${fmtDate(d.completedAt)}</td><td class="num">${as[i].total}/24 (${as[i].pct}%)</td><td>${bandChip(as[i].band)}</td><td class="num">${conf[i][0]||'–'} → ${conf[i][1]||'–'}</td><td style="white-space:nowrap"><button class="btn sm quiet" data-go="record" data-id="${d.id}">Record</button> <button class="btn sm quiet" data-go="assessment" data-id="${d.id}">Scores</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="notice" style="margin-bottom:22px"><p>No task completed yet. Your in-progress tasks are listed below.</p></div>`}
  ${ips.length?`<h2>In progress</h2><div class="stack" style="margin-bottom:22px">${ips.map(a=>`<div class="panel row" style="justify-content:space-between"><div><b>Task ${TASK_BY_ID[a.taskId].num}: ${esc(TASK_BY_ID[a.taskId].title)}</b><div class="muted small">Stage ${a.stage} of 6, ${STAGES[a.stage-1].name}</div></div><button class="btn sm" data-act="continue" data-attempt="${a.id}">Continue</button></div>`).join('')}</div>`:''}
  <h2>Task coverage</h2><div class="grid3" style="margin-bottom:22px">${TASKS.map(t=>{const s=statusOf(t);return `<div class="panel" style="padding:14px 16px"><div class="small dim">Task ${t.num}, ${esc(t.skill)}</div><div style="margin:4px 0 8px"><b>${esc(t.title)}</b></div>${s.chip}</div>`}).join('')}</div>
  <div class="panel flat"><h3>Export structured records</h3><p class="muted small">One record per completed task: task, initial response, AI interaction, critical analysis, evidence checking, alternative solution, final conclusion, reflection and assessment profile. Files are for research piloting and contain your own text.</p><div class="row"><button class="btn quiet sm" data-act="export" data-kind="json" ${done.length?'':'disabled'}>Export JSON</button><button class="btn quiet sm" data-act="export" data-kind="csv" ${done.length?'':'disabled'}>Export CSV</button></div></div></div>`}

/* ---------- RECORD ---------- */
function viewRecord(){
  const at=S.attempts[ui.params.id];if(!at)return `<div class="page">${empty('Record not found','It may have been deleted.',`<button class="btn" data-go="progress">Back to progress</button>`)}</div>`;
  const t=TASK_BY_ID[at.taskId],d=at.d,a=computeAssessment(at),live=d.consult.mode==='live'||d.consult.mode==='backend',tn={ok:'Convincing',q:'Questionable',check:'Check this'};
  const QA=(q,v)=>`<p class="q">${esc(q)}</p><p class="a">${esc(v)||'—'}</p>`;
  return `<div class="page"><div class="page-head"><h1>Task ${t.num}: ${esc(t.title)}</h1><p>Structured record. ${at.status==='completed'?'Completed '+fmtDate(at.completedAt)+'.':'Not yet completed.'} ${at.sample?'This is a SAMPLE record with pre-filled text.':''}</p></div>
  <div class="row" style="margin-bottom:18px"><button class="btn quiet sm" data-go="progress">Back to progress</button>${at.status==='completed'?`<button class="btn sm" data-go="assessment" data-id="${at.id}">Scores</button><button class="btn quiet sm" data-act="export" data-kind="json" data-id="${at.id}">Export JSON</button><button class="btn quiet sm" data-act="export" data-kind="csv" data-id="${at.id}">Export CSV</button><button class="btn quiet sm" data-act="print">Print</button>`:`<button class="btn sm" data-act="continue" data-attempt="${at.id}">Continue task</button>`}</div>
  <div class="panel"><div class="rec-sec"><h3>Task</h3><p class="a">${esc(t.context)}</p></div>
  <div class="rec-sec"><h3>1 Initial response</h3>${QA('Main problem',d.context.problem)}${QA('Possible causes',d.context.causes)}${QA('Information needed',d.context.info)}${QA('First approach',d.context.approach)}${QA('Initial confidence',d.context.conf+' / 5')}</div>
  <div class="rec-sec"><h3>2 AI interaction</h3>${QA('Mode',d.consult.mode==='live'?'AI RESPONSE — LIVE (Claude, in-app)':d.consult.mode==='backend'?'AI RESPONSE — LIVE (Gemini, via backend)':d.consult.mode==='demo'?'AI RESPONSE — DEMONSTRATION (pre-written)':'')}${QA('Prompt written by the student',d.consult.prompt)}${QA('Prompt elements the student ticked',d.consult.checks.map(k=>(PROMPT_ELEMS.find(p=>p[0]===k)||[])[1]).filter(Boolean).join('; '))}${QA('AI response',d.consult.response)}</div>
  <div class="rec-sec"><h3>3 Critical analysis</h3>${d.consult.segs.length?`<p class="q">Tags on AI response parts</p>${d.consult.segs.map((s,i)=>`<p class="a small"><span class="chip ${d.critique.tags[i]==='ok'?'g':d.critique.tags[i]==='q'?'w':d.critique.tags[i]==='check'?'demo':''}">${tn[d.critique.tags[i]]||'Untagged'}</span> ${esc(s)}</p>`).join('')}`:''}${QA('Main claim',d.critique.claim)}${QA('Assumptions',d.critique.assumptions)}${QA('Convincing',d.critique.convincing)}${QA('Questionable',d.critique.questionable)}${QA('Weaknesses',d.critique.weaknesses)}${QA('Missing',d.critique.missing)}${QA('Fit to classroom',d.critique.fit)}${QA('Position',({agree:'Agrees',partly:'Partly agrees',disagree:'Disagrees'})[d.critique.stance]||'')}${QA('Reasons',d.critique.justification)}</div>
  <div class="rec-sec"><h3>4 Evidence checking</h3><p class="small muted">Verdicts are the student's own judgments. The platform did not verify sources.</p>${d.check.rows.map((r,i)=>`<p class="q">Claim ${i+1} ${verdictChip(r.verdict)}</p><p class="a"><b>${esc(r.claim)}</b></p><p class="a small">Source: ${esc(r.source)||'—'} (${esc(r.sourceType)||'type not given'})</p><p class="a small">Evidence: ${esc(r.evidence)||'—'}</p>`).join('')}${QA('Reliability and possible invention',d.check.reliability)}${QA('Sources to consult next',d.check.nextSources)}</div>
  <div class="rec-sec"><h3>5 Alternative solution</h3>${QA('Alternative',d.challenge.alternative)}${QA('What to change',d.challenge.change)}${QA('Disadvantages of AI approach',d.challenge.disadvantages)}${QA('Counterargument',d.challenge.counter)}${QA('Changed conditions: '+t.whatIf,d.challenge.whatif)}</div>
  <div class="rec-sec"><h3>6 Conclude (decision and reflection)</h3>${QA('Claim',d.conclude.claim)}${QA('Reasoning',d.conclude.reasoning)}${QA('Evidence',d.conclude.evidence)}${QA('Conclusion',d.conclude.conclusion)}${QA('Decision on the AI response',({accept:'Accepted',modify:'Modified',reject:'Rejected'})[d.conclude.decision]||'')}${QA('Before consulting AI',d.conclude.reflectBefore)}${QA('What AI changed or challenged',d.conclude.reflectChanged)}${QA('What was rejected',d.conclude.reflectRejected)}${QA('What was learned',d.conclude.reflectLearned)}${QA('Do differently next time',d.conclude.reflectNext)}${QA('Final confidence',d.conclude.confidence+' / 5')}</div>
  <div class="rec-sec"><h3>Assessment profile</h3><p class="a">${a.total} / ${a.max} (${a.pct}%), ${a.band}. ${a.items.map(i=>i.name+' '+i.level).join(', ')}.</p></div></div></div>`}

/* ---------- REFLECTION HISTORY ---------- */
function viewHistory(){
  const all=completedList().reverse();
  if(!all.length)return `<div class="page"><div class="page-head"><h1>Reflection history</h1><p>Every reflection you save at the end of a task, in one place.</p></div>${empty('No reflections yet','Reflections are saved when you finish the Conclude stage of a task.',`<button class="btn" data-go="library">Choose a task</button><button class="btn quiet" data-act="sample">Load sample record</button>`)}</div>`;
  const list=all.filter(a=>ui.histFilter==='All'||a.taskId===ui.histFilter);
  return `<div class="page"><div class="page-head"><h1>Reflection history</h1><p>Read across your reflections to see how your thinking and confidence change. You can add a follow-up note to any entry.</p></div>
  <div class="fld" style="max-width:340px;margin-bottom:18px"><label class="lab" for="hf">Show</label><select id="hf" data-sel="hist"><option value="All">All tasks</option>${TASKS.map(t=>`<option value="${t.id}" ${ui.histFilter===t.id?'selected':''}>Task ${t.num}: ${esc(t.title)}</option>`).join('')}</select></div>
  ${list.map(a=>{const t=TASK_BY_ID[a.taskId],r=a.d.conclude,q=[['What did you think before consulting AI?',r.reflectBefore],['What did AI change or challenge in your thinking?',r.reflectChanged],['Which part of the AI response did you reject?',r.reflectRejected],['What did you learn?',r.reflectLearned],['What would you do differently next time?',r.reflectNext]];
   return `<details class="hist"><summary><span><b>Task ${t.num}: ${esc(t.title)}</b> ${a.sample?'<span class="chip demo">SAMPLE</span>':''}<br><span class="muted small">${fmtDate(a.completedAt)}, ${esc(t.skill)}</span></span><span class="chip p">Confidence ${a.d.context.conf||'–'} → ${r.confidence}</span></summary><div class="inner">${q.map(([k,v])=>`<p class="tiny dim" style="margin:14px 0 2px">${k}</p><p style="margin:0">${esc(v)}</p>`).join('')}<div class="fld" style="margin-top:18px"><label class="lab" for="n-${a.id}">Follow-up note</label><p class="hint">Add anything you notice later, for example after trying the idea in a real class.</p><textarea id="n-${a.id}" data-note="${a.id}" placeholder="Write a follow-up note…">${esc(S.notes[a.id]||'')}</textarea></div><div class="row" style="margin-top:12px"><button class="btn sm quiet" data-go="record" data-id="${a.id}">Full record</button></div></div></details>`}).join('')||`<div class="empty"><p class="muted">No reflections for this task yet.</p></div>`}</div>`}

/* ---------- TEACHER DASHBOARD (DEMO DATA) ---------- */
const DEMO=(()=>{const m=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296},rnd=m(20260924),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  const st=[];for(let i=1;i<=24;i++){const base=1.7+rnd()*1.5,bias=COMP.map(()=>(rnd()-.5)*1.0),n=2+Math.floor(rnd()*7),at=[];
    for(let k=0;k<n;k++){const wk=Math.min(8,1+Math.floor(k*8/n+rnd()*1.5));at.push({task:Math.floor(rnd()*8),week:wk,scores:COMP.map((_,c)=>cl(Math.round(base+bias[c]+k*.07+(rnd()-.5)*1.1),1,4))})}
    st.push({id:'S'+String(i).padStart(2,'0'),at})}return st})();
const sPct=s=>pct(s.reduce((a,b)=>a+b,0),24);
function teacherStats(taskFilter){
  const rows=DEMO.map(s=>{const at=s.at.filter(a=>taskFilter==='All'||TASKS[a.task].id===taskFilter);if(!at.length)return null;
    const cm=COMP.map((_,c)=>avg(at.map(a=>a.scores[c]))),ap=avg(at.map(a=>sPct(a.scores)));return{id:s.id,n:at.length,avg:ap,cm,low:COMP[cm.indexOf(Math.min(...cm))].name,at}}).filter(Boolean);
  return rows}
function viewTeacher(){
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
   METHOD CHALLENGE — a short quiz that helps future English teachers
   recognise teaching methods from simple classroom situations.
   This is a learning game, separate from the 6C task pedagogy; it does
   not use AI and awards XP, not rubric scores.
   ===================================================================== */
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function addXP(n){S.xp=(S.xp||0)+n;persist();return S.xp}
function awardBadge(key){S.badges=S.badges||[];if(S.badges.includes(key))return false;S.badges.push(key);persistNow();return true}
function hasBadge(key){return (S.badges||[]).includes(key)}

/* Returns a COPY of a question with its options in random order. The correct
   answer is tracked by position, so it moves together with its option text.
   The shared question bank (MC_QUESTIONS) is never modified. */
function mcShuffleQ(q){
  const perm=shuffle(q.options.map((_,i)=>i));
  return {id:q.id,method:q.method,diff:q.diff,q:q.q,explain:q.explain,
    options:perm.map(i=>q.options[i]),correct:perm.indexOf(q.correct)}}
function mcNewRound(diff){
  const pool=diff==='mixed'?MC_QUESTIONS:MC_BY_DIFF[diff];
  const qs=shuffle(pool).slice(0,10).map(mcShuffleQ);
  ui.mc={phase:'play',diff,order:qs.map(q=>q.id),qs,idx:0,picked:null,correct:0,justEarned:0,newBadge:null}}

function viewMethods(){
  if(!ui.mc||ui.mc.phase==='setup')return mcSetupHTML();
  if(ui.mc.phase==='play')return mcPlayHTML();
  return mcDoneHTML()}

function mcSetupHTML(){
  return `<div class="page"><div class="game-head"><div><h1>🎮 Method Challenge</h1><p class="muted" style="margin:0">Read a short classroom situation. Choose the teaching method it shows. Get instant feedback and XP.</p></div>
   <div class="row" style="gap:10px">${xpPillHTML()}${sndToggleBtn()}</div></div>
  <div class="mc-setup">
   <div class="notice"><p>Each round has 10 quick questions with 4 options. This is a learning game to help you recognise methods — it is separate from the AI-CT 6C cycle and does not use AI.</p></div>
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

function xpPillHTML(){return `<span class="xp-pill" id="xpPill">⭐ ${S.xp||0} XP</span>`}
function badgeHTML(key,anim){const b=BADGES[key];if(!b)return'';return `<span class="badge ${anim?'new':''}">${b.icon} ${esc(b.name)}</span>`}
/* =====================================================================
   TEAM COMPETITION — a simple classroom quiz game for one shared screen.
   The teacher runs it: pick teams, question count and difficulty, then
   for each round the teacher clicks the answer each team calls out and
   reveals the result. Reuses the Method Challenge question bank so the
   two features share one source of truth instead of duplicating content.
   ===================================================================== */
const TC_COLORS=['var(--primary)','var(--ai)','var(--warn)','var(--good)'];
const TC_SECONDS=20;

function tcSetMode(n){
  const g=ui.tc,old=g.teams;
  g.mode=n;
  if(n===1){g.teams=[{name:'You',score:0}]}
  else{g.teams=Array.from({length:n},(_,i)=>({name:(old[i]&&old[i].name&&old[i].name!=='You')?old[i].name:`Team ${String.fromCharCode(65+i)}`,score:0}))}}

/* Each difficulty has exactly 10 questions (one per method). If more are
   requested (15), extra questions are added from the other difficulties
   so the round can still run — this is noted in the setup screen. */
function tcBuildOrder(diff,count){
  const primary=MC_BY_DIFF[diff]||[],rest=MC_QUESTIONS.filter(q=>q.diff!==diff);
  const pool=primary.length>=count?primary:primary.concat(shuffle(rest));
  return shuffle(pool).slice(0,Math.min(count,MC_QUESTIONS.length)).map(q=>q.id)}

function tcClearTimer(){if(ui.tc.timerId){clearInterval(ui.tc.timerId);ui.tc.timerId=null}}
function tcStartTimer(){
  tcClearTimer();ui.tc.timeLeft=TC_SECONDS;
  ui.tc.timerId=setInterval(()=>{
    ui.tc.timeLeft--;
    const el=$('#tcTimer');
    if(el){el.textContent='⏱ '+ui.tc.timeLeft+'s';el.classList.toggle('low',ui.tc.timeLeft<=5)}
    if(ui.tc.timeLeft<=0){tcClearTimer();if(!ui.tc.revealed){tcReveal();render()}}
  },1000)}

function tcStart(){
  const g=ui.tc;
  g.teams.forEach(t=>t.score=0);
  g.order=tcBuildOrder(g.diff,g.count);g.qs=g.order.map(id=>mcShuffleQ(MC_QUESTIONS.find(x=>x.id===id)));g.idx=0;g.picks={};g.revealed=false;g.justScored=[];g.phase='play';
  tcStartTimer()}

function tcReveal(){
  const g=ui.tc;if(g.revealed)return;tcClearTimer();g.revealed=true;
  const q=g.qs[g.idx];g.justScored=[];
  g.teams.forEach((t,i)=>{if(g.picks[i]===q.correct){t.score+=10;g.justScored.push(i)}});
  sndPlay(g.justScored.length?'correct':'wrong')}

function tcNextRound(){
  const g=ui.tc;g.justScored=[];
  if(g.idx+1<g.order.length){g.idx++;g.picks={};g.revealed=false;tcStartTimer()}
  else{tcClearTimer();g.phase='done';
    S.competitions.push({ts:Date.now(),mode:g.mode,questionCount:g.order.length,difficulty:g.diff,results:g.teams.map(t=>({name:t.name,score:t.score}))});
    g.newBadge=(g.mode>=2&&awardBadge('team-player'))?'team-player':null;
    persistNow();sndPlay(g.newBadge?'achievement':'complete')}}

function viewCompetition(){
  const g=ui.tc;
  if(g.phase==='play')return tcPlayHTML();
  if(g.phase==='done')return tcDoneHTML();
  return tcSetupHTML()}

function tcSetupHTML(){
  const g=ui.tc;
  return `<div class="page"><div class="game-head"><div><h1>🏆 Team Competition</h1><p class="muted" style="margin:0">A simple classroom quiz. One screen, the teacher clicks the answers each team calls out.</p></div>${sndToggleBtn()}</div>
  <div class="tc-setup">
   <div><h3 style="margin-bottom:8px">Who is playing?</h3>
    <div class="tc-choice" role="group" aria-label="Number of teams">
     <button data-act="tc-mode" data-n="1" aria-pressed="${g.mode===1}">👤 Solo</button>
     <button data-act="tc-mode" data-n="2" aria-pressed="${g.mode===2}">👥 2 Teams</button>
     <button data-act="tc-mode" data-n="3" aria-pressed="${g.mode===3}">👥 3 Teams</button>
     <button data-act="tc-mode" data-n="4" aria-pressed="${g.mode===4}">👥 4 Teams</button>
    </div></div>
   ${g.mode>1?`<div><h3 style="margin-bottom:8px">Team names</h3><div class="tc-teams">${g.teams.map((t,i)=>`<label><span class="tc-swatch" style="background:${TC_COLORS[i]}"></span><input type="text" value="${esc(t.name)}" data-team="${i}" maxlength="24" aria-label="Name for team ${i+1}"></label>`).join('')}</div></div>`:''}
   <div><h3 style="margin-bottom:8px">Number of questions</h3>
    <div class="tc-choice" role="group" aria-label="Number of questions">${[5,10,15].map(n=>`<button data-act="tc-count" data-n="${n}" aria-pressed="${g.count===n}">${n}</button>`).join('')}</div>
    ${g.count>10?'<p class="tiny dim" style="margin-top:6px">There are 10 questions per difficulty, so a few extra ones from nearby difficulties will be added to reach 15.</p>':''}</div>
   <div><h3 style="margin-bottom:8px">Difficulty</h3>
    <div class="tc-choice" role="group" aria-label="Difficulty">
     <button data-act="tc-diff" data-diff="easy" aria-pressed="${g.diff==='easy'}">🟢 Easy</button>
     <button data-act="tc-diff" data-diff="medium" aria-pressed="${g.diff==='medium'}">🟡 Medium</button>
     <button data-act="tc-diff" data-diff="advanced" aria-pressed="${g.diff==='advanced'}">🔴 Advanced</button>
    </div></div>
   <div><button class="btn" data-act="tc-start" style="min-height:52px;padding:0 28px;font-size:1.05rem">Start Competition</button></div>
  </div></div>`}

function tcPlayHTML(){
  const g=ui.tc,q=g.qs[g.idx],letters=['A','B','C','D'];
  return `<div class="page"><div class="game-head"><h1>🏆 Team Competition</h1>${sndToggleBtn()}</div>
  <div class="tc-round"><b>ROUND ${g.idx+1} / ${g.order.length}</b><span class="tc-timer ${g.timeLeft<=5?'low':''}" id="tcTimer">⏱ ${g.timeLeft}s</span></div>
  <div class="tc-board">${g.teams.map((t,i)=>`<div class="tc-team" style="--tc:${TC_COLORS[i%4]}"><div class="nm">${esc(t.name)}</div><div class="sc ${g.justScored&&g.justScored.includes(i)?'bump':''}">⭐ ${t.score}</div></div>`).join('')}</div>
  <div class="mc-card">
   <p class="mc-scenario">${esc(q.q)}</p>
   <div class="tc-options" role="list" aria-label="Answer options">${q.options.map((o,oi)=>`<div class="tc-option ${g.revealed&&oi===q.correct?'correct':''}"><b>${letters[oi]}</b><span>${esc(o)}</span></div>`).join('')}</div>
   <p class="tc-picks-label">Which answer did each team choose?</p>
   <div class="tc-picks">${g.teams.map((t,i)=>`<div class="tc-pick-row"><span class="tn" style="color:${TC_COLORS[i%4]}">${esc(t.name)}</span><span class="opts">${q.options.map((o,oi)=>{let cls='';if(g.revealed){if(oi===q.correct)cls='correct';else if(g.picks[i]===oi)cls='wrong'}
      return `<button class="${cls}" data-act="tc-pick" data-t="${i}" data-o="${oi}" aria-pressed="${g.picks[i]===oi}" ${g.revealed?'disabled':''} aria-label="${esc(t.name)}: option ${letters[oi]}, ${esc(o)}">${letters[oi]}</button>`}).join('')}</span></div>`).join('')}</div>
   ${!g.revealed?`<div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="tc-reveal">Reveal answer</button></div>`
    :`<div class="mc-explain g"><b>Correct answer: ${letters[q.correct]}</b>${esc(q.explain)}</div>
      <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="btn" data-act="tc-next">${g.idx+1<g.order.length?'Next round':'See final results'}</button></div>`}
  </div></div>`}

function tcDoneHTML(){
  const g=ui.tc,ranked=g.teams.slice().sort((a,b)=>b.score-a.score);
  return `<div class="page"><div class="mc-card tc-final" style="max-width:520px;margin:0 auto">
   <div style="font-size:2.6rem" aria-hidden="true">🏆</div>
   <h2>Competition Complete!</h2>
   <div class="tc-podium">${ranked.map((t,i)=>`<div class="${i===0&&ranked.length>1?'first':''}">${i===0&&ranked.length>1?'🏆 ':''}${esc(t.name)}<span>⭐ ${t.score}</span></div>`).join('')}</div>
   ${g.newBadge?`<div class="badge-row" style="justify-content:center">${badgeHTML(g.newBadge,true)}</div>`:''}
   <p class="muted">Great effort! Every challenge helps you learn — keep thinking and keep practising.</p>
   <div class="row" style="justify-content:center;margin-top:14px"><button class="btn" data-act="tc-restart">Play again</button><button class="btn quiet" data-go="home">Back to home</button></div>
  </div></div>`}
/* =====================================================================
   APP CONTROLLER
   ===================================================================== */
const VIEWS={home:viewHome,about:viewAbout,dashboard:viewDashboard,cycle:viewCycle,library:viewLibrary,methods:viewMethods,competition:viewCompetition,progress:viewProgress,assessment:viewAssessment,history:viewHistory,record:viewRecord,teacher:viewTeacher};
function render(keep){
  const y=window.scrollY;renderShell();
  try{$('#main').innerHTML=VIEWS[ui.page]()+footerHTML()}catch(e){console.error(e);$('#main').innerHTML=`<div class="page"><div class="notice b"><p>Something went wrong showing this page. Go back to the home page and try again.</p></div></div>`}
  afterRender();window.scrollTo(0,keep?y:0)}
function afterRender(){const tr=$('#trace');if(tr&&window.innerWidth>=1420)tr.open=true;updateLive();updateSaved()}
const HASH_PAGES=['home','about','dashboard','cycle','library','methods','competition','progress','assessment','history','teacher'];
const PAGE_TITLES={home:'AI-CT Teacher App',about:'About AI-CT Teacher',dashboard:'Student Dashboard',cycle:'AI-CT 6C Cycle',library:'Task Library',methods:'Method Challenge',competition:'Team Competition',progress:'My Progress',assessment:'Assessment',history:'Reflection History',teacher:'Teacher Dashboard (Demo Data)',record:'Task Record'};
const pageFromHash=()=>{const h=(location.hash||'').replace('#','');return HASH_PAGES.includes(h)?h:null};
function syncUrl(page){if(!window.AICT_STANDALONE)return;try{document.title=(PAGE_TITLES[page]||'AI-CT Teacher App')+' | AI-CT Teacher';if(HASH_PAGES.includes(page)&&location.hash!=='#'+page)history.pushState(null,'','#'+page)}catch(e){}}
function go(page,params={}){
  if(ui.page==='competition'&&page!=='competition')tcClearTimer();
  ui.page=page;ui.params=params||{};ui.menu=false;syncUrl(page);
  if(page==='library')ui.libCategory=null;
  if(page==='assessment'&&params&&params.id)ui.assessId=params.id;
  if(page!=='assessment'){ui.justCompleted=ui.justCompleted&&page==='record'?ui.justCompleted:null;ui.justBadges=null}
  render();const m=$('#main');m&&m.focus({preventScroll:true})}
function openAttempt(at){ui.aiErr='';go('cycle',{attemptId:at.id})}
function enterStage(at){if(at.stage===4)seedRows(at)}
function seedRows(at){const c=at.d.check;at.d.consult.segs.forEach((s,i)=>{if(at.d.critique.tags[i]==='check'&&!c.seeded.includes(i)){c.rows.push({id:uid('r'),fromSeg:i,claim:excerpt(s,220),source:'',sourceType:'',evidence:'',verdict:''});c.seeded.push(i)}})}
function rerenderStage(){const at=curAttempt(),m=$('#stageMain');if(!at||!m)return;const y=window.scrollY;m.innerHTML=stageHTML(at);updateLive();window.scrollTo(0,y)}

function updateLive(){
  if(ui.page!=='cycle')return;const at=curAttempt();if(!at)return;
  $$('[data-cnt]').forEach(el=>{const n=W(getPath(at.d,el.dataset.cnt)),min=+el.dataset.min;el.classList.toggle('ok',n>=min);el.textContent=min?`${n} / ${min} words minimum`:`${n} words`});
  const rq=reqs(at,at.stage),okc=rq.filter(r=>r.ok).length,all=okc===rq.length;
  const sum=$('#reqSum');if(sum){sum.textContent=all?'Ready to continue':`${rq.length-okc} of ${rq.length} things left before you can continue`;sum.style.color=all?'var(--good)':'var(--warn)'}
  const ul=$('#reqList');if(ul)ul.innerHTML=rq.map(r=>`<li class="${r.ok?'ok':'no'}"><i>${r.ok?'✓':'○'}</i><span>${esc(r.label)}${r.detail?' ('+esc(r.detail)+')':''}</span></li>`).join('');
  const nb=$('#nextBtn');if(nb){const allStages=[1,2,3,4,5,6].every(s=>stageOk(at,s));nb.setAttribute('aria-disabled',String(at.stage<6?!all:!(allStages)))}
  const tl=$('#traceList');if(tl)tl.innerHTML=traceHTML(at);
  $$('[data-vb]').forEach(el=>{const r=at.d.check.rows[+el.dataset.vb];el.innerHTML=verdictChip(r&&r.verdict)});
  if(at.stage===6){const cs=copyScore(at),cb=$('#copyBox');if(cb){cb.className='notice '+(cs>=0.5?'b':cs>=0.25?'w':'g');cb.innerHTML='<p>'+copyMsg(cs)+'</p>'}const fp=$('#finPreview');if(fp)fp.innerHTML=finPreview(at)}
  if(at.stage===2){const ctl=$('#aiCtl');if(ctl){const want=aiCtlHTML(at);if(ctl.dataset.h!==want){ctl.innerHTML=want;ctl.dataset.h=want}}}}
function refreshAi(){const at=curAttempt();if(!at||ui.page!=='cycle'||at.stage!==2)return;const o=$('#aiOut'),c=$('#aiCtl');if(o)o.innerHTML=aiOutHTML(at);if(c){const w=aiCtlHTML(at);c.innerHTML=w;c.dataset.h=w}updateLive()}
function refreshAiOut(){const at=curAttempt(),o=$('#aiOut');if(at&&o&&ui.page==='cycle'&&at.stage===2)o.innerHTML=aiOutHTML(at)}
function refreshAiStatus(){const s=$('#aiStatus');if(s)s.innerHTML=aiStatusHTML();const at=curAttempt();if(at&&ui.page==='cycle'&&at.stage===2)refreshAi()}

const AIERR={not_granted:'Live AI was not allowed for this page, so no request was sent. Use the demonstration response instead.',sampling_disabled:'Live AI is not available for this account. Use the demonstration response instead.',rate_limited:'Too many requests, or your usage limit was reached. Try again later, or use the demonstration response.',session_expired:'Your session expired. Sign in again to use live AI, or use the demonstration response.',refused:'The AI declined this request. Rewrite your prompt and try again, or use the demonstration response.',upstream_error:'The AI request did not complete. You can try again, or use the demonstration response.'};
async function askAI(mode){
  const at=curAttempt();if(!at||ui.streaming)return;const c=at.d.consult,prompt=c.prompt.trim();
  if(W(prompt)<12){toast('Write a prompt of at least 12 words first');return}
  if(c.response&&(Object.keys(at.d.critique.tags).length||at.d.check.rows.some(r=>r.fromSeg!=null))){
    const ok=await confirmBox('Replace the AI response?','Asking again replaces the response you are analysing. Your tags in Critique, and claims copied from them into Check, will be cleared. Your written answers stay.','Replace response');if(!ok)return}
  ui.aiErr='';
  if(mode==='demo'){const t=TASK_BY_ID[at.taskId];recordConsult(at,'demo',prompt,demoText(t),t.ai.slice());refreshAi();return}
  if(mode==='backend'){
    ui.streaming=true;ui.stream='';refreshAi();
    try{const data=await askBackendAI(TASK_BY_ID[at.taskId].context,'consult',prompt);
      ui.streaming=false;recordConsult(at,'backend',prompt,data.response,splitSegs(data.response),
        {claims:data.claims_to_check||[],assumptions:data.possible_assumptions||[],uncertainty:data.uncertainty||'',followUp:data.follow_up_question||''})}
    catch(e){ui.streaming=false;ui.aiErr='AI service is temporarily unavailable. You can continue the activity using the verification and reasoning steps.'}
    refreshAi();return}
  ui.streaming=true;ui.stream='';ui.ctl=new AbortController();refreshAi();
  try{const r=await AI.sample(FRAME+prompt,{signal:ui.ctl.signal,cache:false,onText:({text})=>{ui.stream=text;refreshAiOut()}});
    ui.streaming=false;recordConsult(at,'live',prompt,r.text,splitSegs(r.text))}
  catch(e){ui.streaming=false;const code=e&&e.code;if(code!=='cancelled'){ui.aiErr=AIERR[code]||AIERR.upstream_error;if(code==='not_granted'||code==='sampling_disabled'){AI.sample=null}}}
  refreshAi();const s=$('#aiStatus');if(s)s.innerHTML=aiStatusHTML()}

function checkFinish(at){for(let s=1;s<=6;s++)if(!stageOk(at,s))return s;return 0}

/* ---------- click handling ---------- */
document.addEventListener('click',async e=>{
  if(e.target.id==='scrim'){ui.menu=false;renderShell();return}
  const el=e.target.closest('[data-go],[data-act],[data-scale]');if(!el||el.getAttribute('aria-disabled')==='true'&&!el.dataset.act)return;
  if(el.dataset.go){go(el.dataset.go,el.dataset.id?{id:el.dataset.id}:{});return}
  if(el.dataset.scale){const at=curAttempt();if(!at)return;setPath(at.d,el.dataset.scale,+el.dataset.val);touch(at);$$(`[data-scale="${el.dataset.scale}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b===el)));updateLive();return}
  const a=el.dataset.act,at=curAttempt();
  switch(a){
   case 'menu':ui.menu=!ui.menu;renderShell();break;
   case 'theme':{const cur=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'),nx=cur==='dark'?'light':'dark';document.documentElement.dataset.theme=nx;S.prefs.theme=nx;persist();break}
   case 'station':ui.station=+el.dataset.n;render(true);break;
   case 'start-task':{const t=el.dataset.task;openAttempt(inProgressFor(t)||newAttempt(t));break}
   case 'continue':{const x=S.attempts[el.dataset.attempt];if(x)openAttempt(x);break}
   case 'lib-open':ui.libCategory=el.dataset.cat;render();break;
   case 'lib-back':ui.libCategory=null;render();break;
   case 'snd-toggle':S.prefs.sound=!sndEnabled();persist();if(sndEnabled())sndPlay('start');render(true);break;
   case 'mc-start':mcNewRound(el.dataset.diff);sndPlay('start');render();break;
   case 'mc-answer':{const g=ui.mc;if(!g||g.picked!=null)break;const i=+el.dataset.i,q=g.qs[g.idx];g.picked=i;
     if(i===q.correct){g.correct++;g.justEarned+=10;addXP(10);sndPlay('correct')}else sndPlay('wrong');render();break}
   case 'mc-next':{const g=ui.mc;if(!g)break;if(g.idx+1<g.order.length){g.idx++;g.picked=null;render()}
     else{g.phase='done';S.methodRounds.push({ts:Date.now(),diff:g.diff,correct:g.correct,total:g.order.length,xp:g.justEarned});
       if(g.correct>=8&&awardBadge('method-master')){g.newBadge='method-master';sndPlay('achievement')}else sndPlay('complete');
       persistNow();render()}break}
   case 'mc-restart':ui.mc={phase:'setup'};render();break;
   case 'tc-mode':tcSetMode(+el.dataset.n);render();break;
   case 'tc-count':ui.tc.count=+el.dataset.n;render(true);break;
   case 'tc-diff':ui.tc.diff=el.dataset.diff;render(true);break;
   case 'tc-start':tcStart();sndPlay('start');render();break;
   case 'tc-pick':{const ti=+el.dataset.t,oi=+el.dataset.o;const g=ui.tc;if(g.revealed)break;g.picks[ti]=oi;render(true);break}
   case 'tc-reveal':tcReveal();render();break;
   case 'tc-next':tcNextRound();render();break;
   case 'tc-restart':ui.tc={phase:'setup',mode:1,teams:[{name:'You',score:0}],count:10,diff:'easy'};render();break;
   case 'stage':{if(!at)break;const n=+el.dataset.stage;if(n===at.stage)break;if(canEnter(at,n)){at.stage=n;enterStage(at);persistNow();render()}else toast('Complete the earlier stages first. Stages must be done in order.');break}
   case 'next':{if(!at)break;if(!stageOk(at,at.stage)){toast('Complete the checklist to continue');const d=$('.reqs');if(d)d.open=true;break}at.stage++;at.maxStage=Math.max(at.maxStage,at.stage);enterStage(at);persistNow();render();break}
   case 'back':if(at&&at.stage>1){at.stage--;persistNow();render()}break;
   case 'save':if(at){persistNow();toast('Progress saved at '+fmtTime(Date.now()))}break;
   case 'later':if(at){persistNow();go('dashboard');toast('Progress saved. Continue any time from your dashboard.')}break;
   case 'finish':{if(!at)break;if(at.status==='completed'){go('assessment',{id:at.id});break}const bad=checkFinish(at);if(bad){toast(`Stage ${bad} (${STAGES[bad-1].name}) is not complete yet`);const d=$('.reqs');if(d)d.open=true;break}
    at.status='completed';at.completedAt=Date.now();
    const newBadges=[];
    if(completedList().length===1&&awardBadge('first-step'))newBadges.push('first-step');
    if(computeAssessment(at).band==='Advanced'&&awardBadge('deep-thinker'))newBadges.push('deep-thinker');
    if(at.d.check.rows.some(r=>r.fromSeg!=null&&rowComplete(r))&&awardBadge('ai-critic'))newBadges.push('ai-critic');
    if(newBadges.length)sndPlay('achievement');
    ui.justBadges=newBadges;persistNow();ui.justCompleted=at.id;go('assessment',{id:at.id});break}
   case 'tag':{if(!at)break;const tg=at.d.critique.tags,i=+el.dataset.i,t=el.dataset.t;if(tg[i]===t)delete tg[i];else tg[i]=t;touch(at);$('#segs').innerHTML=segsHTML(at);updateLive();break}
   case 'ask-demo':askAI('demo');break;
   case 'ask-live':askAI('live');break;
   case 'ask-backend':askAI('backend');break;
   case 'stop-ai':if(ui.ctl)ui.ctl.abort();break;
   case 'add-row':if(at){at.d.check.rows.push({id:uid('r'),claim:'',source:'',sourceType:'',evidence:'',verdict:''});touch(at);rerenderStage()}break;
   case 'del-row':if(at){at.d.check.rows.splice(+el.dataset.i,1);touch(at);rerenderStage()}break;
   case 'self':{const x=S.attempts[ui.assessId]||completedList().reverse()[0];if(x){x.self=x.self||{};x.self[el.dataset.c]=+el.dataset.v;persistNow();render(true)}break}
   case 'sample':{const x=createSample();ui.assessId=x.id;toast('Sample record loaded. It is labelled SAMPLE.');render(true);break}
   case 'reset':{const ok=await confirmBox('Delete all saved data?','This removes every task, record and note saved in this browser. It cannot be undone.','Delete everything');if(ok){try{localStorage.removeItem(KEY)}catch(x){}S={attempts:{},order:[],notes:{},prefs:S.prefs};persistNow();ui.assessId=null;go('home');toast('All saved data deleted')}break}
   case 'export':doExport(el.dataset.kind,el.dataset.id||null);break;
   case 'print':try{window.print()}catch(x){toast('Printing is not available in this view')}break;
   case 'teacher-sort':{const k=el.dataset.k;ui.tSort=ui.tSort.k===k?{k,dir:-ui.tSort.dir}:{k,dir:k==='id'||k==='low'?1:-1};render(true);break}
   case 'teacher-student':ui.tStudent=el.dataset.id||null;render(true);break;
  }});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('tr[data-act]')){e.preventDefault();e.target.click()}});

/* ---------- input handling (autosave) ---------- */
function onField(e){
  const t=e.target;
  if(t.dataset&&t.dataset.b){const at=curAttempt();if(!at||ui.page!=='cycle')return;setPath(at.d,t.dataset.b,t.value);touch(at);updateLive();return}
  if(t.dataset&&t.dataset.note!==undefined&&t.dataset.note!==''){S.notes[t.dataset.note]=t.value;persist();return}
  if(t.dataset&&t.dataset.team!==undefined){const g=ui.tc;if(!g)return;const i=+t.dataset.team;if(g.teams[i]){g.teams[i].name=t.value.slice(0,24)||`Team ${String.fromCharCode(65+i)}`}return}
  if(e.type==='change'){
   if(t.dataset.check){const at=curAttempt();if(!at)return;const l=at.d.consult.checks,k=t.dataset.check;const i=l.indexOf(k);if(t.checked&&i<0)l.push(k);if(!t.checked&&i>=0)l.splice(i,1);touch(at);return}
   const s=t.dataset.sel;
   if(s==='assess'){ui.assessId=t.value;ui.justCompleted=null;render(true)}
   if(s==='hist'){ui.histFilter=t.value;render(true)}
   if(s==='ttask'){ui.tTask=t.value;ui.tStudent=null;render(true)}}}
document.addEventListener('input',onField);document.addEventListener('change',onField);
window.addEventListener('beforeunload',()=>{try{persistNow()}catch(e){}});

/* ---------- init ---------- */
if(S.prefs.theme)document.documentElement.dataset.theme=S.prefs.theme;
if(window.AICT_STANDALONE){const hp=pageFromHash();if(hp)ui.page=hp;window.addEventListener('popstate',()=>{ui.page=pageFromHash()||'home';ui.params={};ui.menu=false;render()});try{document.title=(PAGE_TITLES[ui.page]||'AI-CT Teacher App')+' | AI-CT Teacher'}catch(e){}}
render();initCaps();
