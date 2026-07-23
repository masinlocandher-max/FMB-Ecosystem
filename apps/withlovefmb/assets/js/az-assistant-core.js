(function(){
  'use strict';
  if(location.hostname.toLowerCase()==='yoni.francinemariebautista.com')return;
  if(document.querySelector('.az-help-trigger'))return;

  const HELP_EMAIL='withlovefmb@gmail.com';
  const SITE_URL='https://www.francinemariebautista.com';
  const UNKNOWN_QUESTION_KEY='fmb.az.unmatched.v1';
  const q=(label,next,extra={})=>({label,next,...extra});
  const link=(label,href,extra={})=>({label,href,...extra});
  const contact=(label,category,extra={})=>({label,action:'contact',category,...extra});
  const back=q('Back','__back');
  const main=q('Return to Main Menu','main');

  // AZ uses an intentionally prewritten response bank. This keeps answers
  // factual, on-brand, and predictable without presenting AZ as generative AI.
  const replyBank={
    welcome:[
      'Welcome. I am AZ, the FMB&CO. website Receptionist. Ask me about the public website, FMB&CO., SENZ, Cognita, Francine Marie Bautista, news, publications, or official contact routes.',
      'Good to meet you. I am AZ, the FMB&CO. Receptionist. Tell me what you are looking for and I will guide you to the clearest next step.',
      'Welcome to FMB&CO. Digital Reception. I am AZ. You can type naturally, and I will match your question with a verified public-website answer.',
      'Hello. I am AZ, your FMB&CO. website Receptionist. I can help with website navigation, company information, published content, and official contact routes.',
      'You have reached FMB&CO. Digital Reception. I am AZ, and I am ready to help you find the right public page, company, publication, or contact route.',
      'Welcome. Tell me what you need in your own words. I am AZ, the FMB&CO. Receptionist, and my answers come from a verified premade reply bank.'
    ],
    greeting:[
      'Hello. It is lovely to welcome you. What would you like to know about the public website?',
      'Hi. I am here and ready to help. You can ask about FMB&CO., SENZ, Cognita, Francine Marie Bautista, news, publications, or any public website feature.',
      'Welcome. How may I help you today?',
      'Hello. Tell me what you are trying to find, open, or understand, and I will guide you.',
      'Good to see you. What can I help you with today?',
      'Hello. You can write your question naturally. I will match it with the closest verified answer.'
    ],
    thanks:[
      'You are very welcome. I am here whenever you need help with the public website.',
      'My pleasure. Please ask another question whenever you are ready.',
      'You are welcome. I am glad I could make the next step clearer.',
      'Gladly. I can help with another public-website question if you have one.',
      'You are most welcome. AZ Reception is always available from this button.',
      'Happy to help. You can continue typing if there is anything else you need.'
    ],
    goodbye:[
      'Thank you for visiting FMB&CO. Digital Reception. You can open Receptionist again whenever you need me.',
      'Thank you for stopping by. I will be here when you need more public-website guidance.',
      'Goodbye for now. I hope your next step is clear.',
      'It was a pleasure helping you. You can return to AZ Reception at any time.'
    ],
    identity:[
      'I am AZ, the digital Receptionist for the FMB&CO. public website. I answer verified website questions from a premade reply bank.',
      'My name is AZ. I am FMB&CO.\'s website Receptionist. The companion app and mental-health conversations are outside my role.',
      'I am AZ, tagged as Receptionist. I help visitors navigate FMB&CO. and the public website using approved premade answers.',
      'AZ is the FMB&CO. Digital Receptionist for www.francinemariebautista.com. I explain public pages, companies, publications, and official contact routes.'
    ],
    capabilities:[
      'I can explain FMB&CO., SENZ, Cognita, Francine Marie Bautista, public website pages, news, publications, community work, and official contact routes.',
      'Ask me where to find a public page, what a company does, where to read an article, or how to contact the correct FMB&CO. team.',
      'I cover public website navigation, company information, news, reading and music pages, professional inquiries, partnerships, corrections, and website reports.',
      'I am limited to verified guidance about www.francinemariebautista.com. The companion app and mental-health conversations are outside my capabilities.'
    ],
    general:[
      'Certainly. I will take you to the closest verified answer.',
      'Of course. Let me guide you to the right information.',
      'I understand. Here is the clearest next step.',
      'Thank you. I found the relevant information for you.',
      'Absolutely. Let us look at the correct public-website guidance.',
      'Understood. I will keep this clear and practical.',
      'I can help with that. Here is the verified guidance.',
      'That makes sense. Let us go directly to the most useful answer.',
      'Yes. I have a premade answer for that topic.',
      'I found the closest official guidance in my reply bank.'
    ],
    care:[
      'Thank you for telling me. I will guide you to the safest available next step.',
      'I hear you. Your safety matters, so I will keep the next step clear.',
      'You did the right thing by asking. Let us use the safest verified route.',
      'I understand. I will direct you carefully and without judgment.',
      'Thank you for reaching out. Here is the safest guidance available on the website.',
      'I am glad you said something. Let us move to the right support information.'
    ],
    contact:[
      'Certainly. I will prepare the correct official contact form.',
      'Of course. I will route this to the most relevant inquiry category.',
      'I can help you contact the team through the official form.',
      'Understood. I will open the correct FMB&CO. contact route.',
      'Yes. I will prepare a secure form with the right category selected.',
      'I will help you send the relevant details to the correct team.'
    ],
    link:[
      'Certainly. I will open the official page for you.',
      'Of course. I will take you directly to the correct page.',
      'I found it. I will open the verified destination now.',
      'Yes. I will take you to that official page.',
      'Understood. The correct page is ready to open.',
      'I will guide you to the official destination.'
    ],
    matched:[
      'I found the closest verified answer in my reply bank.',
      'Thank you. I matched your question with the most relevant guidance.',
      'I understand what you are looking for. Here is the closest official answer.',
      'I found a reliable match for your question.',
      'Your question matches one of my verified public-website topics.',
      'I have a premade answer for this. Let us go to it.',
      'I found the relevant topic and will keep the answer clear.',
      'This is covered in my verified reply bank.'
    ],
    unknownSaved:[
      'I do not have a verified premade answer for that yet, and I do not want to guess. I saved the question on this device for reply-bank review.',
      'That question is not in my verified reply bank yet. I saved it on this device so it can be included when the bank is reviewed.',
      'I could not match that with confidence. I saved the question on this device and will offer the safest next options.',
      'I do not have an approved answer for that topic yet. Your question has been saved locally for future reply-bank improvement.'
    ],
    unknownUnsaved:[
      'I do not have a verified premade answer for that yet, and I do not want to guess. This browser did not allow me to save the question.',
      'I could not match that with confidence. I also could not store the question on this device, but you can send it to the team through the contact form.',
      'That topic is not in my approved reply bank yet. Please use the official contact route if you need a confirmed answer.'
    ]
  };
  const replyPositions=new Map();
  function replyFrom(key){
    const choices=replyBank[key]||replyBank.general;
    const previous=replyPositions.get(key);
    let index=Math.floor(Math.random()*choices.length);
    if(choices.length>1&&index===previous)index=(index+1)%choices.length;
    replyPositions.set(key,index);
    return choices[index];
  }

  const screens={
    main:{
      title:'How may I help?',
      body:'Type a question naturally, or choose one of these starting points. My role is limited to the public website, its companies, published content, and official contact routes.',
      options:[
        q('Website and Brands','website'),q('News and Publications','media'),q('Work with FMB&CO.','work'),q('Report a Website Problem','report')
      ]
    },
    website:{title:'Website and Brands',body:'I can guide you through the main website, FMB&CO., the founder profile, SENZ, Cognita, news, resources, and professional inquiries.',options:[
      q('About FMB&CO.','fmbandco'),q('About SENZ','senz'),q('About Cognita','cognita'),link('About Francine Marie Bautista',`${SITE_URL}/aboutfmb/`),link('Latest News',`${SITE_URL}/news/`),q('Find Another Page','find'),q('Work with FMB&CO.','work'),main
    ]},
    fmbandco:{title:'About FMB&CO.',body:'FMB&CO. is the company home of SENZ and Cognita. Each business keeps a distinct role.',options:[link('Open FMB&CO.',`${SITE_URL}/fmbandco/`,{primary:true}),q('About SENZ','senz'),q('About Cognita','cognita'),link('Meet the Founder',`${SITE_URL}/aboutfmb/`),q('Professional Inquiry','work'),back]},
    senz:{title:'About SENZ',body:'SENZ is the marketing and digital solutions business of FMB&CO. Current information about its work is published on the official SENZ website.',options:[link('Open the FMB&CO. SENZ Gateway',`${SITE_URL}/fmbandco/senz/`,{primary:true}),link('Visit SENZ',`https://www.senzpr.com`),q('Start a Professional Inquiry','professional_inquiry'),q('About FMB&CO.','fmbandco'),back]},
    cognita:{title:'About Cognita',body:'Cognita is the knowledge and learning arm of FMB&CO. Current information about its work is published on the official Cognita website.',options:[link('Open the FMB&CO. Cognita Gateway',`${SITE_URL}/fmbandco/cognita/`,{primary:true}),link('Visit Cognita',`https://thecognitainstitute.com`),q('Start a Professional Inquiry','professional_inquiry'),q('About FMB&CO.','fmbandco'),back]},
    find:{title:'Find Something',body:'Of course. I can help you find the right part of With Love, FMB. What would you like to explore?',options:[
      link('About FMB',`${SITE_URL}/aboutfmb/`),link('Latest News',`${SITE_URL}/news/`),link('Projects',`${SITE_URL}/projects/`),link('Reading Library',`${SITE_URL}/ebooks/`),link('Music Library',`${SITE_URL}/music/`),link('Get Involved',`${SITE_URL}/withlovefmb/#volunteer`),link('Public Help Directory',`${SITE_URL}/gethelp/`),link('FMB&CO.',`${SITE_URL}/fmbandco/`),link('Work with FMB',`${SITE_URL}/aboutfmb/#work-with-fmb`),contact('Contact the Team','General Question'),q('Search the Website','search'),q('I Cannot Find a Page','missing'),main
    ]},
    search:{title:'Search the Website',body:'I understand. Enter a keyword below, or choose a category. I will match it with the closest available page.',focusSearch:true,options:[
      link('About FMB',`${SITE_URL}/aboutfmb/`),link('FMB&CO.',`${SITE_URL}/fmbandco/`),link('SENZ',`${SITE_URL}/fmbandco/senz/`),link('Cognita',`${SITE_URL}/fmbandco/cognita/`),link('News',`${SITE_URL}/news/`),link('Projects',`${SITE_URL}/projects/`),link('Reading',`${SITE_URL}/ebooks/`),link('Music',`${SITE_URL}/music/`),link('Get Involved',`${SITE_URL}/withlovefmb/#volunteer`),link('Public Help Directory',`${SITE_URL}/gethelp/`),link('Work with FMB',`${SITE_URL}/aboutfmb/#work-with-fmb`),back,main
    ]},
    missing:{title:'I Cannot Find a Page',body:'That is understandable. A public page may have moved, be temporarily unavailable, or be under maintenance. I can help you find an alternative on the website.',options:[
      q('View Public Pages','find'),q('Search Again','search'),contact('Report a Missing Page','Technical Problem'),back
    ]},

    app_boundary:{title:'Outside AZ’s Website Role',body:'AZ is available only for the public website at www.francinemariebautista.com. The companion app, Yoni, app accounts, installation, and app support are outside AZ’s capabilities.',options:[q('Browse the Public Website','find'),q('Website and Brands','website'),contact('Contact the Website Team','General Question'),main]},
    mental_health_boundary:{title:'Outside AZ’s Receptionist Role',body:'AZ is a website Receptionist and does not provide mental-health guidance, counselling, diagnosis, crisis conversation, or companion support. The public Get Help page lists independent support and emergency contacts.',options:[link('Open the Public Get Help Page',`${SITE_URL}/gethelp/`,{primary:true}),q('Browse the Public Website','find'),main]},

    media:{title:'News and Publications',body:'I can help you open the public news, reading, music, and project pages published on the website.',options:[
      link('Latest News',`${SITE_URL}/news/`),link('Reading Library',`${SITE_URL}/ebooks/`),link('Music Library',`${SITE_URL}/music/`),link('Projects',`${SITE_URL}/projects/`),q('Can I Share Published Content?','share_content'),q('Content Credits','credits'),main
    ]},
    share_content:{title:'Can I Share the Content?',body:'Yes, you may share official website links and published posts. Please keep the original credits and do not reproduce complete materials without permission.',options:[{label:'Copy Official Link',action:'copyLink',primary:true},link('View Content Guidelines','/membership-agreement.html'),contact('Request Permission','General Question'),back]},
    credits:{title:'Content Credits',body:'Thank you for caring about proper credit. Credits are listed on the relevant music, article, publication, or project page.',options:[link('View Music Credits','/music/'),link('View Reading Credits','/ebooks/'),contact('Report Missing Credit','Correction Request'),contact('Contact the Team','General Question'),q('Can I Share the Content?','share_content'),back]},

    community:{title:'Community Pages',body:'I can guide you to the public Freedom Wall, Community Engagements, volunteer information, and the published community rules.',options:[
      link('Read the Freedom Wall',`${SITE_URL}/freedom-wall.html`),link('Community Engagements',`${SITE_URL}/communityengagements/`),link('Volunteer Information',`${SITE_URL}/volunteer.html`),link('Community Guidelines',`${SITE_URL}/community-guidelines.html`),contact('Report Public Website Content','Community Concern'),main
    ]},
    privacy:{title:'Website Privacy Information',body:'I can guide you to the public policies and the official route for reporting a privacy concern about the website.',options:[
      link('Privacy Policy',`${SITE_URL}/privacy-policy.html`),link('Data Rights',`${SITE_URL}/data-rights.html`),link('Community Guidelines',`${SITE_URL}/community-guidelines.html`),q('Report a Privacy Concern','privacy_concern'),main
    ]},
    privacy_concern:{title:'Report a Website Privacy Concern',body:'Thank you for taking this seriously. Choose the public-website concern closest to what happened. Please avoid including passwords or government identification numbers in your report.',options:[
      contact('Personal Information Published','Privacy Concern',{care:true}),contact('Suspicious Website Message','Privacy Concern'),contact('Incorrect Personal Information','Privacy Concern'),contact('Cookies or Website Data','Privacy Concern'),contact('Other Website Privacy Issue','Privacy Concern'),back
    ]},
    work:{title:'Work with FMB',body:'Thank you for considering FMB. Use the official inquiry form to describe what you need. The team will confirm the correct route and whether a next step is available.',options:[
      link('Open the Inquiry Form','/aboutfmb/#work-with-fmb',{primary:true}),q('About SENZ','senz'),q('About Cognita','cognita'),q('Media Inquiry','media_inquiry'),q('Partnership Inquiry','partnerships'),q('Availability','availability'),main
    ]},
    professional_inquiry:{title:'Start a Professional Inquiry',body:'Prepare your name, the correct return email, what you need, relevant context, and any real deadline. Submission does not confirm availability, pricing, or a service agreement.',options:[link('Open Inquiry Form','/aboutfmb/#work-with-fmb',{primary:true}),q('Availability','availability'),back]},
    availability:{title:'Availability',body:'AZ does not have access to Francine’s calendar and will not guess. Submit the context through the official inquiry form. Only a direct reply can confirm whether a next step is available.',options:[link('Submit an Inquiry','/aboutfmb/#work-with-fmb',{primary:true}),back]},
    urgent_inquiry:{title:'Request Urgent Consideration',body:'We understand that some matters cannot wait. Clearly explain the deadline, importance, and required deliverables. FMB’s assistant will review the context and inform her directly when a matter is especially important. A request does not guarantee availability.',options:[link('Submit Urgent Inquiry','/aboutfmb/#work-with-fmb',{primary:true}),q('View Availability','availability'),back]},
    media_inquiry:{title:'Media Inquiry',body:'Thank you for reaching out. Interviews, features, speaking invitations, press requests, and requests for public statements should include the outlet, topic, deadline, format, and contact details.',options:[contact('Open Media Inquiry Form','Media Inquiry',{primary:true}),link('View FMB Profile','/aboutfmb/'),contact('Request Official Information','Media Inquiry'),back]},

    volunteer:{title:'Volunteer and Collaborate',body:'I can guide you to the public volunteer information or the official inquiry route for community and professional collaboration.',options:[
      link('Open Volunteer Information',`${SITE_URL}/volunteer.html`,{primary:true}),link('Community Engagements',`${SITE_URL}/communityengagements/`),q('Submit a Resource','submit_resource'),contact('Community Partnership','Partnership'),contact('Professional Partnership','Partnership'),main
    ]},
    submit_resource:{title:'Submit a Resource',body:'Thank you for helping strengthen the library. Resources should be accurate, properly credited, relevant, and safe for public use.',options:[contact('Submit a Resource','General Question',{primary:true}),link('Read Submission Guidelines','/community-guidelines.html'),contact('Report Incorrect Information','Correction Request'),back]},

    payments:{title:'Services, Fees, and Partnerships',body:'AZ does not invent prices, packages, payment instructions, or availability. Rely only on details confirmed through an official page or a direct reply from the team.',options:[
      q('Payment or Donation Question','donations'),q('Professional Inquiry','work'),q('Business Partnerships','partnerships'),contact('Verify Published Information','General Question'),q('Report a Suspicious Request','suspicious'),main
    ]},
    donations:{title:'Payment or Donation Question',body:'I do not have verified payment or donation instructions in this reply bank. Do not send money based only on an assistant response. Ask the team to confirm the correct information through an official route.',options:[q('Report a Suspicious Request','suspicious',{care:true}),contact('Ask the Team to Verify','General Question',{primary:true}),back]},
    partnerships:{title:'Business Partnerships',body:'FMB&CO. considers professional and business partnership proposals. A useful proposal includes the organization, intended audience, timeline, responsibilities, and value offered to both sides. This is separate from donations, which are not accepted.',options:[contact('Submit Partnership Proposal','Partnership',{primary:true}),link('View Partnership Information',`${SITE_URL}/aboutfmb/#work-with-fmb`),contact('Contact the Team','Partnership'),back]},
    suspicious:{title:'Report a Suspicious Request',body:'Do not send money, passwords, codes, or personal information until the request is confirmed through an official route. Submit the message and its source so the team can review it.',urgent:true,options:[contact('Submit a Report','Privacy Concern',{primary:true,care:true}),link('View Official Channels',`${SITE_URL}/aboutfmb/`),contact('Contact the Team','Privacy Concern'),back]},

    report:{title:'Report a Website Problem',body:'I am sorry something is not working as expected on the public website. Choose the closest issue so the team receives the right details.',options:[
      q('Page Is Not Loading','technical_report'),contact('Button Is Not Working','Technical Problem'),contact('Broken Link','Technical Problem'),contact('Music or Audio Problem','Technical Problem'),contact('Public Community Page Problem','Community Concern'),q('Incorrect Information','incorrect'),contact('Display or Layout Problem','Technical Problem'),q('Privacy Concern','privacy_concern'),contact('Other Website Issue','Technical Problem'),q('Try Basic Troubleshooting','troubleshoot'),main
    ]},
    technical_report:{title:'Submit a Technical Report',body:'Thank you for helping us investigate. Include the page or feature, your device and browser, what you expected, what happened instead, and a screenshot when available.',options:[contact('Submit Report','Technical Problem',{primary:true}),q('Try Basic Troubleshooting','troubleshoot'),back]},
    troubleshoot:{title:'Basic Troubleshooting',body:'No worries. Start with the simplest steps: refresh the page, check your connection, restart the browser, update it, and try another device. If you are signed in, you may also sign out and return carefully.',options:[{label:'Problem Solved',next:'closing',primary:true},contact('Submit a Report','Technical Problem'),back]},
    incorrect:{title:'Incorrect Information',body:'Thank you for helping us correct the record. Choose the type of information, and include the page plus a reliable source when possible.',options:[
      contact('Name or Credit','Correction Request'),contact('Date or Historical Information','Correction Request'),contact('Support Hotline','Correction Request',{care:true}),contact('Article or Resource','Correction Request'),contact('Profile Information','Correction Request'),contact('Broken Source','Correction Request'),contact('Other Correction','Correction Request'),back
    ]},

    faq:{title:'Frequently Asked Website Questions',body:'Certainly. Choose a public-website topic, and I will give you a clear answer or take you to the right page.',options:[
      q('About With Love, FMB','faq_about'),q('About Francine Marie Bautista','faq_fmb'),q('About FMB&CO.','fmbandco'),q('About SENZ','senz'),q('About Cognita','cognita'),q('News and Publications','media'),q('Community Pages','community'),q('Website Privacy','privacy'),q('Volunteerism','volunteer'),q('Professional Services','work'),q('Partnerships','partnerships'),q('Donation Policy','donations'),q('Content Ownership','share_content'),q('Can Website Features Change?','faq_change'),q('Can I Submit an Article or Resource?','faq_submit'),q('Can I Interview FMB?','faq_interview'),q('Can Schools Use the Resources?','faq_schools'),q('Available Outside the Philippines?','faq_international'),q('Other Languages?','faq_languages'),main
    ]},
    faq_about:{title:'What Is With Love, FMB?',body:'With Love, FMB is a public website for meaningful stories, original publications, music, community work, public resources, and the founder-led work of Francine Marie Bautista.',options:[link('Explore the Website',SITE_URL),link('Latest News',`${SITE_URL}/news/`),link('Publications',`${SITE_URL}/ebooks/`),link('Learn About FMB',`${SITE_URL}/aboutfmb/`),back]},
    faq_fmb:{title:'Who Is Francine Marie Bautista?',body:'Francine Marie Bautista is the founder, strategist, creative director, and storyteller behind the FMB ecosystem. Her official profile contains the current confirmed description of her work.',options:[link('View Official Profile',`${SITE_URL}/aboutfmb/`),q('Work with FMB','work'),link('View FMB&CO.',`${SITE_URL}/fmbandco/`),back]},
    faq_change:{title:'Can Features Change?',body:'Yes. Features, content access, design, and community tools may change as the platform develops. Maintenance notices will explain important updates when possible.',options:[link('View Latest Updates','/news/'),q('Report a Problem','report'),back]},
    faq_submit:{title:'Can I Submit an Article, Story, or Resource?',body:'Selected contributions may be considered based on relevance, quality, accuracy, permissions, safety, and editorial review.',options:[link('View Submission Guidelines','/community-guidelines.html'),contact('Submit a Contribution','General Question'),back]},
    faq_interview:{title:'Can I Interview FMB?',body:'Yes. Interview and media requests may be submitted through the official media inquiry flow. Please include the outlet, subject, format, and deadline.',options:[q('Submit Media Inquiry','media_inquiry'),link('View FMB Profile','/aboutfmb/'),back]},
    faq_schools:{title:'Can Schools or Organizations Use the Resources?',body:'Schools, organizations, and community groups may share official links. Reproduction, printing, training use, or redistribution may require written permission.',options:[contact('Request Educational Use','General Question'),link('View Usage Guidelines','/membership-agreement.html'),back]},
    faq_international:{title:'Is the Website Available Outside the Philippines?',body:'The website may be accessed internationally, although some support services, hotline listings, and programs may be specific to particular locations.',options:[link('View Support Resources','/gethelp/'),contact('Report a Location Issue','Correction Request'),back]},
    faq_languages:{title:'Is the Platform Available in Other Languages?',body:'Language availability may vary by page and feature. The team may expand language support as the platform develops.',options:[contact('Suggest a Translation','General Question'),back]},

    typed_fallback:{title:'Not in My Reply Bank Yet',body:'I do not have a verified premade answer for that yet, and I do not want to guess. You can rephrase the question or use an official contact route.',options:[q('Try Another Question','search'),contact('Ask the Team','General Question'),q('View Main Topics','main')]},
    no_results:{title:'No Results Found',body:'I could not find an answer under that topic. You are not stuck. We can try another search or send the question to the team.',options:[q('Try Another Search','search'),q('Browse Frequently Asked Questions','faq'),contact('Contact the Team','General Question'),main]},
    contact_reasons:{title:'Contact the Website Team',body:'Of course. Choose the reason for contacting the public-website team so your message can be reviewed properly.',options:[
      contact('Website Technical Problem','Technical Problem'),contact('Website Privacy Concern','Privacy Concern'),contact('Public Community Concern','Community Concern'),contact('Professional Inquiry','Professional Inquiry'),contact('Partnership','Partnership'),contact('Media Inquiry','Media Inquiry'),contact('Correction Request','Correction Request'),contact('General Website Question','General Question'),back
    ]},
    closing:{title:'Was This Helpful?',body:'I hope the information made the next step clearer. Was this information helpful?',options:[q('Yes, I Found What I Needed','helpful_yes',{primary:true}),q('I Need More Help','more_help'),main]},
    helpful_yes:{title:'You Are All Set',body:'I am glad you found what you needed. You may open Help again at any time. With love, FMB.',options:[{label:'Close Help',action:'close',primary:true},main]},
    more_help:{title:'Let Us Keep Going',body:'Of course. You are not a bother. Let us find the right next step together.',options:[q('Search Again','search'),q('Browse FAQs','faq'),q('Contact the Team','contact_reasons'),q('Report a Problem','report'),main]}
  };

  const searchIndex=[
    {words:'donate donation donations charitable giving fundraiser fundraising contribute money gift cash gcash bank transfer',screen:'donations',priority:80},
    {words:'yoni orange bear digital wellbeing companion friend inside app mascot',screen:'app_boundary',priority:95},
    {words:'az receptionist digital receptionist assistant who are you your name female chatbot',direct:'identity',priority:60},
    {words:'what can you do help topics capabilities questions answer replies reply bank',direct:'capabilities',priority:55},
    {words:'fmb&co fmb and co fmbco company companies portfolio corporate parent organization shaping what comes next',screen:'fmbandco',priority:50},
    {words:'senz strategic communications pr public relations marketing branding website digital solutions agency',screen:'senz',priority:48},
    {words:'cognita institute artificial intelligence ai education learning course training responsible ai',screen:'cognita',priority:48},
    {words:'about francine marie bautista fmb founder profile strategist creative director storyteller',screen:'faq_fmb',priority:45},
    {words:'website home page homepage navigation find page brand brands',screen:'website',priority:30},
    {words:'news latest update article story stories editorial announcement press',href:`${SITE_URL}/news/`,priority:26},
    {words:'book books ebook ebooks read reading library guide guides material materials',screen:'media',priority:24},
    {words:'music song songs audio calm relax relaxing upbeat ost soundtrack play player track tracks album',screen:'media',priority:24},
    {words:'sign in signin login log in password account email verification verify member membership profile register registration signup sign up',screen:'app_boundary',priority:80},
    {words:'forgot reset password incorrect password locked out cannot login cannot sign in',screen:'app_boundary',priority:84},
    {words:'journal diary daily check in check-in mood entry entries reflection private writing',screen:'app_boundary',priority:80},
    {words:'freedom wall community post submission submit moderation anonymous harmful content',screen:'community',priority:24},
    {words:'mental health wellbeing counseling counselling crisis self harm self-harm suicide suicidal emergency depressed depression anxiety panic distress someone talk emotional',screen:'mental_health_boundary',priority:100},
    {words:'gethelp hotline hotlines emergency contacts crisis directory',screen:'mental_health_boundary',priority:82},
    {words:'privacy policy data rights cookies website information public personal details',screen:'privacy',priority:30},
    {words:'work hire branding public relations strategy creative direction photography training speaking proposal calendar availability consultation professional service services',screen:'work',priority:28},
    {words:'volunteer volunteering collaborate contribution offer time offer skills resource community role application',screen:'volunteer',priority:25},
    {words:'partnership partner business collaboration proposal organization brand partnership',screen:'partnerships',priority:30},
    {words:'cost price fee payment receipt refund cancellation charge paid professional service services',screen:'payments',priority:34},
    {words:'app application yoni install iphone ipad ios android notification pwa home screen icon mobile update uninstall companion',screen:'app_boundary',priority:90},
    {words:'app not loading app broken blank screen app error will not open cannot open app support',screen:'app_boundary',priority:96},
    {words:'broken error problem bug layout display button link page not loading not working issue report',screen:'report',priority:30},
    {words:'contact team message inquiry email receptionist speak person human official form',screen:'contact_reasons',priority:28},
    {words:'women health womens health woman resources page article',href:`${SITE_URL}/womens-health.html`,priority:25},
    {words:'lgbt lgbtq lgbtqia coming out respect queer trans transgender resources page article',href:`${SITE_URL}/coming-out-respect.html`,priority:25},
    {words:'men can cry mens health page article',href:`${SITE_URL}/men-can-cry.html`,priority:25},
    {words:'privacy policy terms data rights agreement community guidelines',screen:'privacy',priority:22},
    {words:'interview media press feature statement journalist outlet',screen:'media_inquiry',priority:30},
    {words:'hello hi hey greetings good morning good afternoon good evening',direct:'greeting',priority:20},
    {words:'thanks thank you appreciate helpful solved perfect great',direct:'thanks',priority:20},
    {words:'bye goodbye good night see you later close exit',direct:'goodbye',priority:20}
  ];
  const searchStopWords=new Set(['a','an','and','are','about','can','could','did','do','does','for','from','how','i','in','is','it','me','my','of','on','or','our','please','that','the','this','to','we','what','when','where','which','who','why','will','with','would','you','your']);

  let current='main';
  let history=[];
  let started=false;
  let lastTrigger=null;
  let contactCategory='General Question';

  const brandMark='<img src="/assets/images/fmbandco/fmbandco-ampersand-gold.png" width="256" height="256" alt="">';
  const closeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const homeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 11 8-7 8 7v9H4Z"/><path d="M9 20v-6h6v6"/></svg>';
  const sendIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8Z"/><path d="M7 12h14"/></svg>';

  const trigger=document.createElement('button');
  trigger.className='az-help-trigger';
  trigger.type='button';
  trigger.setAttribute('aria-label','Open AZ Receptionist');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','azHelpPanel');
  trigger.innerHTML=`<span class="az-help-trigger-icon">${brandMark}</span><span class="az-help-trigger-label"><strong>Receptionist</strong><small>FMB&amp;CO.</small></span>`;

  const layer=document.createElement('div');
  layer.className='az-help-layer';
  layer.innerHTML=`<div class="az-help-backdrop" data-az-close></div><section class="az-help-panel" id="azHelpPanel" role="dialog" aria-modal="true" aria-labelledby="azHelpTitle"><header class="az-help-header"><span class="az-help-avatar">${brandMark}</span><div class="az-help-identity"><div class="az-help-title-row"><strong id="azHelpTitle">AZ</strong><span class="az-help-role">Receptionist</span></div><span class="az-help-brandline">FMB&amp;CO. Website Reception</span></div><div class="az-help-header-actions"><button class="az-help-icon-button" type="button" data-az-home aria-label="Return to Receptionist home">${homeIcon}</button><button class="az-help-icon-button" type="button" data-az-close aria-label="Close Receptionist">${closeIcon}</button></div></header><div class="az-help-transcript" role="log" aria-live="polite" aria-relevant="additions text"><div class="az-help-day-label">FMB&amp;CO. Website Reception</div></div><footer class="az-help-composer"><form class="az-help-search"><label class="sr-only" for="azHelpSearch">Type a question for AZ Receptionist</label><input id="azHelpSearch" type="search" maxlength="180" autocomplete="off" placeholder="Ask about the public website"><button type="submit" aria-label="Send question to AZ">${sendIcon}</button></form><small class="az-help-composer-note">Verified website replies. Do not enter private or payment information. AZ does not support the companion app or provide mental-health guidance.</small></footer></section>`;
  document.body.append(trigger,layer);

  const panel=layer.querySelector('.az-help-panel');
  const transcript=layer.querySelector('.az-help-transcript');
  const searchForm=layer.querySelector('.az-help-search');
  const searchInput=layer.querySelector('#azHelpSearch');

  function scrollEnd(){requestAnimationFrame(()=>{transcript.scrollTop=transcript.scrollHeight})}
  function addMessage(kind,title,text,{html='',urgent=false}={}){
    const row=document.createElement('div');
    row.className=`az-message ${kind==='user'?'is-user':'is-bot'}${urgent?' is-urgent':''}`;
    if(kind==='bot'){
      const mark=document.createElement('span');mark.className='az-message-mark';mark.textContent='AZ';row.appendChild(mark);
    }
    const bubble=document.createElement('div');bubble.className='az-message-bubble';
    if(title){const strong=document.createElement('strong');strong.textContent=title;bubble.appendChild(strong)}
    if(text){const p=document.createElement('p');p.textContent=text;bubble.appendChild(p)}
    if(html){const content=document.createElement('div');content.innerHTML=html;bubble.appendChild(content)}
    row.appendChild(bubble);transcript.appendChild(row);scrollEnd();return row;
  }
  function addTyping(){
    const row=document.createElement('div');row.className='az-message is-bot az-typing';row.innerHTML='<span class="az-message-mark">AZ</span><div class="az-message-bubble"><i></i><i></i><i></i></div>';transcript.appendChild(row);scrollEnd();return row;
  }
  function addOptions(options){
    const visible=options||[];
    const previewLimit=5;
    const wrap=document.createElement('div');wrap.className=`az-quick-replies${visible.length<3?' is-single':''}`;
    const addButton=option=>{
      const button=document.createElement('button');button.type='button';button.className=`az-quick-reply${option.primary?' is-primary':''}${option.care?' is-care':''}`;button.textContent=option.label;
      button.addEventListener('click',()=>choose(option,wrap));wrap.appendChild(button);
    };
    visible.slice(0,previewLimit).forEach(addButton);
    if(visible.length>previewLimit){
      const more=document.createElement('button');more.type='button';more.className='az-quick-reply is-more';more.textContent=`More options (${visible.length-previewLimit})`;
      more.addEventListener('click',()=>{more.remove();visible.slice(previewLimit).forEach(addButton);wrap.classList.remove('is-single');scrollEnd()});wrap.appendChild(more);
    }
    transcript.appendChild(wrap);scrollEnd();
    return wrap;
  }
  function reassuranceFor(screen){
    if(screen.urgent)return replyFrom('care');
    return screen.reassurance||'';
  }
  function showScreen(id,{push=true,delay=true}={}){
    if(id==='__back'){
      id=history.pop()||'main';push=false;
    }
    const screen=screens[id]||screens.no_results;
    if(push&&current!==id)history.push(current);
    current=id;
    const reveal=()=>{
      const text=[reassuranceFor(screen),Array.isArray(screen.body)?screen.body[Math.floor(Math.random()*screen.body.length)]:screen.body].filter(Boolean).join(' ');
      addMessage('bot',screen.title,text,{html:screen.html||'',urgent:Boolean(screen.urgent)});
      addOptions(screen.options);
      if(screen.focusSearch)setTimeout(()=>searchInput.focus({preventScroll:true}),120);
    };
    if(!delay){reveal();return}
    const typing=addTyping();setTimeout(()=>{typing.remove();reveal()},260);
  }
  function resetConversation(){
    transcript.innerHTML='<div class="az-help-day-label">FMB&amp;CO. Website Reception</div>';
    current='main';history=[];
    addMessage('bot','Welcome to FMB&CO.',replyFrom('welcome'));
    addOptions(screens.main.options);
  }
  function setOptionsInactive(wrap){wrap?.setAttribute('aria-hidden','true');wrap?.querySelectorAll('button').forEach(button=>button.disabled=true)}
  function acknowledgement(option){
    const lower=option.label.toLowerCase();
    if(option.care||/(danger|harm|privacy|suspicious|bully|threat|self-harm)/.test(lower))return replyFrom('care');
    if(option.action==='contact')return replyFrom('contact');
    if(option.href)return replyFrom('link');
    return replyFrom('general');
  }
  async function copyOfficialLink(){
    try{await navigator.clipboard.writeText(location.href);addMessage('bot','Link Copied','Done. The official page link is ready to paste, with the original source and credit intact.');addOptions(screens.closing.options)}
    catch{addMessage('bot','Copy the Address','Your browser did not allow automatic copying. You can copy the address from the browser bar instead.');addOptions(screens.closing.options)}
  }
  function choose(option,wrap){
    setOptionsInactive(wrap);addMessage('user','',option.label);addMessage('bot','I Understand',acknowledgement(option));
    if(option.next){showScreen(option.next);return}
    if(option.href){setTimeout(()=>{location.href=option.href},420);return}
    if(option.action==='contact'){contactCategory=option.category||'General Question';setTimeout(()=>renderContactForm(contactCategory),260);return}
    if(option.action==='reload'){setTimeout(()=>location.reload(),420);return}
    if(option.action==='copyLink'){copyOfficialLink();return}
    if(option.action==='focusComposer'){searchInput.placeholder='Paste or type a short note here';setTimeout(()=>searchInput.focus(),120);return}
    if(option.action==='close'){closeAssistant();return}
  }

  function renderContactForm(category){
    addMessage('bot','Contact the Team',`I have selected ${category}. Please complete the form below. Do not include passwords, payment codes, or government identification numbers.`);
    const form=document.createElement('form');form.className='az-contact-form';form.noValidate=true;
    form.innerHTML=`<label>Full Name<input name="name" maxlength="80" autocomplete="name" required></label><label>Email Address<input name="email" type="email" maxlength="254" autocomplete="email" required></label><label>Concern Category<select name="category" required>${['Technical Problem','Privacy Concern','Community Concern','Professional Inquiry','Partnership','Media Inquiry','Correction Request','General Question'].map(item=>`<option${item===category?' selected':''}>${item}</option>`).join('')}</select></label><label>Subject<input name="subject" maxlength="120" required></label><label>Message<textarea name="message" maxlength="4000" required placeholder="Tell us what happened, what you need, and the relevant public website page or feature."></textarea></label><label>Relevant Public Page<input name="page" maxlength="240" value="${location.pathname}" required></label><label>Attachment, optional<input name="attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></label><p class="az-contact-form-note">For privacy, the chat records the attachment name only. The file itself is not uploaded. The team may ask you to send it securely after reviewing your message.</p><label class="az-consent"><input name="consent" type="checkbox" required><span>I consent to the website team using these details to review and respond to my request.</span></label><button class="az-contact-submit" type="submit">Send to the Website Team</button><div class="az-contact-status" role="status" hidden></div>`;
    transcript.appendChild(form);scrollEnd();
    form.addEventListener('submit',event=>submitContact(event,form));
  }
  async function waitForServices(){
    for(let i=0;i<30;i++){
      if(window.FMB?.configured)return true;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return false;
  }
  async function submitContact(event,form){
    event.preventDefault();
    const status=form.querySelector('.az-contact-status'),button=form.querySelector('button[type="submit"]');
    const data=new FormData(form);const name=String(data.get('name')||'').trim();const email=String(data.get('email')||'').trim().toLowerCase();const category=String(data.get('category')||'').trim();const subject=String(data.get('subject')||'').trim();const message=String(data.get('message')||'').trim();const page=String(data.get('page')||'').trim();const attachment=data.get('attachment');
    const setStatus=(text,error=false)=>{status.textContent=text;status.hidden=false;status.classList.toggle('is-error',error);scrollEnd()};
    if(!name||!email||!category||!subject||!message||!page||!data.get('consent')){setStatus('Please complete every required field and confirm consent.',true);return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setStatus('Please enter a valid email address.',true);return}
    if(attachment instanceof File&&attachment.size>5*1024*1024){setStatus('Please choose an attachment smaller than 5 MB. The file is not uploaded by this chat.',true);return}
    button.disabled=true;button.textContent='Sending';setStatus('Please wait while AZ records your request.');
    const ready=await waitForServices();
    if(!ready){button.disabled=false;button.textContent='Send to the Website Team';setStatus(`The secure form is temporarily unavailable. Please email ${HELP_EMAIL} directly.`,true);return}
    const detail=[`Category: ${category}`,`Relevant page or feature: ${page}`,attachment instanceof File&&attachment.name?`Attachment selected: ${attachment.name} (file not uploaded)`:'',`Message:\n${message}`].filter(Boolean).join('\n\n');
    try{
      const client=window.FMB.createClient('local');
      const {data:reference,error}=await client.rpc('submit_contact_message',{p_name:name.slice(0,80),p_email:email.slice(0,254),p_subject:`[AZ Receptionist] ${subject}`.slice(0,120),p_message:detail.slice(0,4000),p_kind:'contact'});
      if(error||!reference)throw error||new Error('No reference returned');
      const shortRef=`AZ-${String(reference).replace(/[^a-z0-9]/gi,'').slice(-8).toUpperCase()}`;
      form.remove();
      addMessage('bot','Message Received',`Thank you, ${name}. Your message has been received. Please keep reference number ${shortRef} for future follow-up. The team will review the context you provided.`);
      addOptions([{label:'View My Request Details',next:'contact_reasons'},main,{label:'Close Help',action:'close'}]);
    }catch{
      button.disabled=false;button.textContent='Send to the Website Team';setStatus(`Your message could not be sent right now. Please try again or email ${HELP_EMAIL}.`,true);
    }
  }

  function normalise(value){
    return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
  }
  function recordUnknownQuestion(value){
    const question=String(value||'').trim().slice(0,180)
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[email removed]')
      .replace(/\b\d{6,}\b/g,'[number removed]');
    if(!question)return false;
    const record={question,path:location.pathname,createdAt:new Date().toISOString(),source:'AZ Receptionist'};
    try{
      const stored=JSON.parse(localStorage.getItem(UNKNOWN_QUESTION_KEY)||'[]');
      const queue=Array.isArray(stored)?stored:[];
      queue.push(record);
      localStorage.setItem(UNKNOWN_QUESTION_KEY,JSON.stringify(queue.slice(-40)));
      window.dispatchEvent(new CustomEvent('fmb:az-unmatched',{detail:record}));
      return true;
    }catch{return false}
  }
  function directConversation(clean){
    if(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|hello az|hi az)[\s.!?]*$/.test(clean))return 'greeting';
    if(/^(thanks|thank you|thankyou|many thanks|appreciate it|that helped|helpful|problem solved|all good)[\s.!?]*$/.test(clean))return 'thanks';
    if(/^(bye|goodbye|good night|see you|see you later|close|exit)[\s.!?]*$/.test(clean))return 'goodbye';
    if(/\b(who are you|what are you|what is az|tell me about az|are you the receptionist|are you yoni|are you an ai|are you ai|are you a chatbot)\b/.test(clean))return 'identity';
    if(/\b(what can you do|how can you help|what do you know|help topics|show capabilities)\b/.test(clean))return 'capabilities';
    return '';
  }
  function showDirectReply(key){
    const titles={greeting:'Hello',thanks:'You Are Welcome',goodbye:'Goodbye for Now',identity:'AZ, Receptionist',capabilities:'How I Can Help'};
    addMessage('bot',titles[key]||'AZ Receptionist',replyFrom(key));
    if(key==='capabilities')addOptions(screens.main.options);
  }
  function handleSearch(value){
    const raw=String(value||'').trim();const clean=normalise(raw);if(!clean)return;
    addMessage('user','',value);searchInput.value='';
    const conversational=directConversation(clean);
    if(conversational){showDirectReply(conversational);return}
    const words=[...new Set(clean.split(/\s+/).filter(word=>word.length>1&&!searchStopWords.has(word)))];
    let best=null,bestScore=0;
    searchIndex.forEach(item=>{
      const indexText=normalise(item.words);const indexWords=new Set(indexText.split(/\s+/));
      const matches=words.reduce((sum,word)=>sum+(indexWords.has(word)?1:0),0);
      const phraseBonus=clean.length>3&&indexText.includes(clean)?180:0;
      const score=matches*100+phraseBonus+(item.priority||0);
      if(matches>0&&score>bestScore){best=item;bestScore=score}
    });
    if(!best){
      const saved=recordUnknownQuestion(raw);
      addMessage('bot','Not in My Reply Bank Yet',replyFrom(saved?'unknownSaved':'unknownUnsaved'));
      addOptions(screens.typed_fallback.options);
      return;
    }
    if(best.direct){showDirectReply(best.direct);return}
    addMessage('bot','Verified Match',replyFrom('matched'));
    if(best.href){setTimeout(()=>{location.href=best.href},420);return}
    showScreen(best.screen);
  }
  function openAssistant(){
    lastTrigger=document.activeElement;layer.classList.add('is-open');trigger.setAttribute('aria-expanded','true');document.body.classList.add('az-help-open');
    requestAnimationFrame(()=>layer.classList.add('is-visible'));
    if(!started){started=true;resetConversation()}
    setTimeout(()=>panel.querySelector('[data-az-close]')?.focus({preventScroll:true}),180);
  }
  function closeAssistant(){
    layer.classList.remove('is-visible');trigger.setAttribute('aria-expanded','false');document.body.classList.remove('az-help-open');
    setTimeout(()=>layer.classList.remove('is-open'),230);setTimeout(()=>lastTrigger?.focus?.({preventScroll:true}),240);
  }
  trigger.addEventListener('click',openAssistant);
  layer.querySelectorAll('[data-az-close]').forEach(button=>button.addEventListener('click',closeAssistant));
  layer.querySelector('[data-az-home]').addEventListener('click',()=>{addMessage('user','','Return to Main Menu');resetConversation()});
  searchForm.addEventListener('submit',event=>{event.preventDefault();handleSearch(searchInput.value)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&layer.classList.contains('is-open'))closeAssistant()});
  panel.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const focusable=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(node=>node.offsetParent!==null);
    if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });
})();
