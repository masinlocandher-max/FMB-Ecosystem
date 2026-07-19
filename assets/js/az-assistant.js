(function(){
  'use strict';
  if(document.querySelector('.az-help-trigger'))return;

  const HELP_EMAIL='withlovefmb@gmail.com';
  const SITE_URL='https://www.francinemariebautista.com';
  const APP_URL='https://app.francinemariebautista.com';
  const UNKNOWN_QUESTION_KEY='fmb.az.unmatched.v1';
  const q=(label,next,extra={})=>({label,next,...extra});
  const link=(label,href,extra={})=>({label,href,...extra});
  const contact=(label,category,extra={})=>({label,action:'contact',category,...extra});
  const back=q('Back','__back');
  const main=q('Return to Main Menu','main');
  const guest=extra=>({...extra,guestOnly:true});
  const member=extra=>({...extra,memberOnly:true});

  // AZ uses an intentionally prewritten response bank. This keeps answers
  // factual, on-brand, and predictable without presenting AZ as generative AI.
  const replyBank={
    welcome:[
      'Welcome. I am AZ, the FMB&CO. Receptionist. Ask me a question about the website, the app, FMB&CO., SENZ, Cognita, or your account.',
      'Good to meet you. I am AZ, the FMB&CO. Receptionist. Tell me what you are looking for and I will guide you to the clearest next step.',
      'Welcome to FMB&CO. Digital Reception. I am AZ. You can type naturally, and I will match your question with a verified website or app answer.',
      'Hello. I am AZ, your FMB&CO. Receptionist. I can help with the website, the app, Yoni, membership, company information, and official contact routes.',
      'You have reached FMB&CO. Digital Reception. I am AZ, and I am ready to help you find the right website, app feature, company, or contact route.',
      'Welcome. Tell me what you need in your own words. I am AZ, the FMB&CO. Receptionist, and my answers come from a verified premade reply bank.'
    ],
    greeting:[
      'Hello. It is lovely to welcome you. What would you like to know about the website or the app?',
      'Hi. I am here and ready to help. You can ask about FMB&CO., SENZ, Cognita, Yoni, membership, or any website feature.',
      'Welcome. How may I help you today?',
      'Hello. Tell me what you are trying to find, open, or understand, and I will guide you.',
      'Good to see you. What can I help you with today?',
      'Hello. You can write your question naturally. I will match it with the closest verified answer.'
    ],
    thanks:[
      'You are very welcome. I am here whenever you need help with the website or app.',
      'My pleasure. Please ask another question whenever you are ready.',
      'You are welcome. I am glad I could make the next step clearer.',
      'Gladly. I can help with another website or app question if you have one.',
      'You are most welcome. AZ Reception is always available from this button.',
      'Happy to help. You can continue typing if there is anything else you need.'
    ],
    goodbye:[
      'Thank you for visiting FMB&CO. Digital Reception. You can open Receptionist again whenever you need me.',
      'Thank you for stopping by. I will be here when you need more website or app guidance.',
      'Goodbye for now. I hope your next step is clear.',
      'It was a pleasure helping you. You can return to AZ Reception at any time.'
    ],
    identity:[
      'I am AZ, the female digital Receptionist for FMB&CO. I answer website and app questions from a verified premade reply bank. Yoni is the separate mental-health companion inside the app.',
      'My name is AZ. I am FMB&CO.\'s digital Receptionist, not the mental-health companion. Yoni is the orange bear companion in the app.',
      'I am AZ, tagged as Receptionist. I help visitors navigate FMB&CO., the wider website, and the app using approved premade answers.',
      'AZ is the FMB&CO. Digital Receptionist. I can explain the website, app, companies, account features, and official contact routes.'
    ],
    capabilities:[
      'I can explain FMB&CO., SENZ, Cognita, Francine Marie Bautista, the website, the member account, the app, and Yoni. I can also guide technical reports and official inquiries.',
      'Ask me where to find a page, how to use the app, what Yoni does, how membership works, or how to contact the correct FMB&CO. team.',
      'I cover website navigation, app installation, accounts, FMB&CO. company information, SENZ, Cognita, content libraries, privacy, reports, and professional inquiries.',
      'I am best at verified website and app guidance. If my reply bank does not contain an answer, I will say so clearly and save the question on this device for reply-bank review.'
    ],
    general:[
      'Certainly. I will take you to the closest verified answer.',
      'Of course. Let me guide you to the right information.',
      'I understand. Here is the clearest next step.',
      'Thank you. I found the relevant information for you.',
      'Absolutely. Let us look at the correct website or app guidance.',
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
      'Your question matches one of my verified website and app topics.',
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
      body:'Type a question naturally, or choose one of these starting points. My answers cover the website, app, companies, membership, and official contact routes.',
      options:[
        q('Website and Brands','website'),q('App and Yoni','app'),q('Account and Membership','account'),q('Report a Problem','report')
      ]
    },
    website:{title:'Website and Brands',body:'I can guide you through the main website, FMB&CO., the founder profile, SENZ, Cognita, news, resources, and professional inquiries.',options:[
      q('About FMB&CO.','fmbandco'),q('About SENZ','senz'),q('About Cognita','cognita'),link('About Francine Marie Bautista',`${SITE_URL}/aboutfmb/`),link('Latest News',`${SITE_URL}/news/`),q('Find Another Page','find'),q('Work with FMB&CO.','work'),main
    ]},
    fmbandco:{title:'About FMB&CO.',body:'FMB&CO. is a strategy-led company that sets direction, builds clarity, and creates lasting value across a focused portfolio. Its companies are SENZ Strategic Communications and Cognita Institute of AI.',options:[link('Open FMB&CO.',`${SITE_URL}/fmb&co/`,{primary:true}),q('About SENZ','senz'),q('About Cognita','cognita'),link('Meet the Founder',`${SITE_URL}/aboutfmb/`),q('Professional Inquiry','work'),back]},
    senz:{title:'About SENZ',body:'SENZ Strategic Communications is the PR, marketing, branding, creative, website, and digital solutions company of FMB&CO. It helps people and organizations communicate with greater clarity, positioning, and relevance.',options:[link('Open the FMB&CO. SENZ Gateway',`${SITE_URL}/fmb&co/senz/`,{primary:true}),link('Visit SENZ',`https://www.senzpr.com`),q('Start a Professional Inquiry','professional_inquiry'),q('About FMB&CO.','fmbandco'),back]},
    cognita:{title:'About Cognita',body:'Cognita Institute of AI is the practical, responsible, and human-centered AI learning company of FMB&CO. It helps people and organizations understand AI tools and build future-ready skills with accountability.',options:[link('Open the FMB&CO. Cognita Gateway',`${SITE_URL}/fmb&co/cognita/`,{primary:true}),link('Visit Cognita',`https://thecognitainstitute.com`),q('Start a Professional Inquiry','professional_inquiry'),q('About FMB&CO.','fmbandco'),back]},
    find:{title:'Find Something',body:'Of course. I can help you find the right part of With Love, FMB. What would you like to explore?',options:[
      link('About FMB',`${SITE_URL}/aboutfmb/`),link('Latest News',`${SITE_URL}/news/`),link('Reading Library',`${SITE_URL}/ebooks/`),link('Music Library',`${SITE_URL}/music/`),link('Support Resources',`${SITE_URL}/gethelp/`),link('Volunteer Opportunities',`${SITE_URL}/volunteer.html`),link('FMB&CO.',`${SITE_URL}/fmb&co/`),link('Work with FMB&CO.',`${SITE_URL}/aboutfmb/#work-with-fmb`),contact('Contact the Team','General Question'),q('Search the Website','search'),q('I Cannot Find a Page','missing'),main
    ]},
    search:{title:'Search the Website',body:'I understand. Enter a keyword below, or choose a category. I will match it with the closest available page.',focusSearch:true,options:[
      link('Mental Health',`${SITE_URL}/reading.html`),link('Women’s Health',`${SITE_URL}/womens-health.html`),link('LGBTQIA+ Resources',`${SITE_URL}/coming-out-respect.html`),link('Music',`${SITE_URL}/music/`),link('Reading',`${SITE_URL}/ebooks/`),link('News',`${SITE_URL}/news/`),link('Community',`${SITE_URL}/freedom-wall.html`),link('Volunteerism',`${SITE_URL}/volunteer.html`),link('FMB&CO.',`${SITE_URL}/fmb&co/`),link('Professional Services',`${SITE_URL}/aboutfmb/#work-with-fmb`),back,main
    ]},
    missing:{title:'I Cannot Find a Page',body:'That is understandable. Some pages may be available only to signed-in members, temporarily unavailable, or currently being updated. We can still help you find an alternative.',options:[
      link('Sign In','/auth.html#signin',guest({primary:true})),link('Open My Profile','/profile/',member({primary:true})),q('View Public Pages','find'),q('Search Again','search'),contact('Report a Missing Page','Technical Problem'),back
    ]},

    account:{title:'Account and Membership',body:'Certainly. Your account should feel clear and manageable. What do you need help with?',options:[
      q('Create an Account','account_create',guest({})),q('Verify My Email','verify_email',guest({})),link('Sign In','/auth.html#signin',guest({})),q('Sign-In Problem','signin_problem',guest({})),link('Forgot My Password','/reset-password.html',guest({})),link('Open My Profile','/profile/',member({})),link('Update My Profile','/profile/',member({})),link('Change My Email','/profile/',member({})),link('Change My Password','/profile/',member({})),q('Membership Benefits','benefits'),q('Member-Only Content','restricted'),q('Account Security','security'),q('Delete My Account','delete_account'),main
    ]},
    account_create:{title:'Create an Account',body:'You are welcome here. Create a free member profile using your name and an active email address. Email verification helps protect your account.',options:[
      link('Create My Account','/auth.html#signup',guest({primary:true})),q('Learn About Membership','benefits'),link('Continue as a Visitor','/',guest({})),back
    ]},
    verify_email:{title:'Verify My Email',body:'No problem. Check your inbox for the verification message, then look in spam, promotions, or junk. Delivery can sometimes take a few minutes.',options:[
      link('Resend Verification Email','/auth.html#signup',guest({primary:true})),link('Change My Email Address','/auth.html#signup',guest({})),q('I Did Not Receive the Email','email_missing'),back
    ]},
    email_missing:{title:'Verification Email Not Received',body:'I understand how frustrating that can be. Confirm that the address is correct, wait a few minutes, and check spam or junk. We can help if it still does not arrive.',options:[
      link('Resend Email','/auth.html#signup',guest({primary:true})),link('Update Email Address','/auth.html#signup',guest({})),contact('Contact Support','Account Support'),back
    ]},
    signin_problem:{title:'Sign-In Problem',body:'I am sorry you are having trouble signing in. Choose the issue closest to what you see, and we will take it one step at a time.',options:[
      link('Incorrect Password','/reset-password.html'),contact('Account Not Found','Account Support'),q('Verification Required','verify_email'),q('Page Keeps Refreshing','troubleshoot'),contact('Signed Out Automatically','Technical Problem'),contact('Other Sign-In Issue','Account Support'),back
    ]},
    benefits:{title:'Membership Benefits',body:'I am glad you asked. A free member profile brings your private tools and exclusive materials into one calmer, more personal space.',options:[
      link('Complete Music Library','/music/'),link('Exclusive Reading Materials','/ebooks/'),link('Daily Emotional Check-Ins','/profile/'),link('Personal Journal Entries','/profile/'),link('Saved Reading and Music','/profile/'),link('Profile Customization','/profile/'),link('Community Submissions','/profile/'),link('Member Announcements','/profile/'),link('Join as a Member','/auth.html#signup',guest({primary:true})),link('Sign In','/auth.html#signin',guest({})),link('Open My Member Space','/profile/',member({primary:true})),link('Continue as a Visitor','/',guest({})),back
    ]},
    restricted:{title:'Why Is Some Content Restricted?',body:'That is a fair question. Selected content is reserved for registered members to support a more personal experience and help protect original materials. Creating a standard account is free.',options:[
      link('Create a Free Account','/auth.html#signup',guest({primary:true})),link('Sign In','/auth.html#signin',guest({})),link('Open My Member Space','/profile/',member({primary:true})),link('View Public Content','/ebooks/'),back
    ]},
    security:{title:'Account Security',body:'You are right to protect your account. Use a strong, unique password and avoid staying signed in on shared or public devices.',options:[
      link('Change My Password','/profile/',member({})),link('Reset My Password','/reset-password.html',guest({})),q('Sign Out of My Account','signout',member({})),contact('Report Suspicious Activity','Privacy Concern'),link('Privacy Information','/privacy-policy.html'),back
    ]},
    signout:{title:'Sign Out',body:'Of course. Signing out is a good choice when you are using a shared device. Would you like me to sign you out now?',options:[
      {label:'Yes, Sign Me Out',action:'signout',primary:true,memberOnly:true},back
    ]},
    delete_account:{title:'Delete My Account',body:'I understand this is an important decision. Account deletion may permanently remove access to saved content, journal entries, check-ins, and member features. Please review your information before continuing.',options:[
      contact('Request Account Deletion','Account Support',{care:true}),link('Download or Review My Information','/data-rights.html'),link('Keep My Account','/profile/',member({primary:true})),back
    ]},

    app:{title:'App and Yoni',body:'The FMB app brings member tools, reading, music, reflection, and support into a mobile-first experience. Yoni is the orange bear mental-health companion. I am AZ, the Receptionist for website and app questions.',options:[
      q('What Is Yoni?','yoni'),link('Open the App',APP_URL,{primary:true}),q('Install the App','install'),q('Update the App','update_app'),q('App Is Not Loading','app_loading'),q('App Looks Different','app_different'),q('Notifications','notifications'),q('Remove the App','remove_app'),q('Browser Compatibility','browser_help'),main
    ]},
    yoni:{title:'Yoni, the Mental-Health Companion',body:'Yoni is the orange bear mental-health companion inside the app. Yoni offers a warmer companion experience, while I handle website, app, account, and company questions as the FMB&CO. Receptionist. Yoni is not a replacement for emergency services or licensed professional care.',options:[link('Open Yoni in the App',APP_URL,{primary:true}),link('View Support Resources',`${SITE_URL}/gethelp/`,{care:true}),q('I May Be in Immediate Danger','danger',{care:true}),q('App and Device Help','app'),back]},
    install:{title:'Install the App',body:'I can guide you. Choose your device. Installation adds a convenient home-screen icon and does not change your account.',options:[q('iPhone or iPad','install_ios'),q('Android','install_android'),q('Desktop or Laptop','install_desktop'),link('Continue in Browser',APP_URL),back]},
    install_ios:{title:'Install on iPhone or iPad',body:'Open the app website in Safari, tap the Share button, then select Add to Home Screen. Confirm the name and tap Add.',options:[link('Continue in Browser',APP_URL),q('The Option Is Missing','browser_help'),back]},
    install_android:{title:'Install on Android',body:'Open the app website in Chrome, tap the browser menu, then choose Install App or Add to Home Screen. Confirm when prompted.',options:[link('Continue in Browser',APP_URL),q('The Option Is Missing','browser_help'),back]},
    install_desktop:{title:'Install on Desktop or Laptop',body:'Depending on your browser, an install icon may appear near the address bar. If it does not, you can continue using the app website normally.',options:[link('Continue on the App Website',APP_URL),q('View Browser Instructions','browser_help'),back]},
    update_app:{title:'Update the App',body:'You are not doing anything wrong. The app usually updates when it is reopened. Close it fully, reconnect to the internet, and open it again.',options:[{label:'Try Again',action:'reload',primary:true},q('App Is Not Loading','app_loading'),contact('Report the Problem','Technical Problem'),back]},
    app_loading:{title:'App Is Not Loading',body:'I understand. Please try these steps in order. Your account and saved information should remain unaffected by a normal refresh.',html:'<ol><li>Check your internet connection.</li><li>Close and reopen the app.</li><li>Refresh the page.</li><li>Restart your device.</li><li>Try another supported browser.</li></ol>',options:[{label:'Try Again',action:'reload',primary:true},q('Check Service Status','service_status'),q('Clear Browser Data','clear_data'),contact('Report the Problem','Technical Problem'),back]},
    app_different:{title:'App Looks Different',body:'That makes sense. The app and desktop website may use different layouts depending on the device and screen size, while supported content and account features remain connected.',options:[link('View App Features',APP_URL),link('Open Main Website',SITE_URL),contact('Report a Display Issue','Technical Problem'),back]},
    notifications:{title:'Notifications',body:'I understand. Notification availability depends on your device, browser, and the permissions you have granted. You can review the site settings in your browser or device settings.',options:[q('Turn Notifications On','notification_steps'),q('Turn Notifications Off','notification_steps'),q('I Am Not Receiving Notifications','notification_steps'),q('Notification Preferences','notification_steps'),back]},
    notification_steps:{title:'Notification Settings',body:'Open your device or browser settings, find Notifications, then choose With Love, FMB or your browser. You can allow, limit, or turn off alerts there. Some notification features are still being expanded.',options:[q('App and Device Help','app'),contact('Report a Problem','Technical Problem'),back]},
    remove_app:{title:'Remove the App',body:'No worries. Removing the home-screen app icon will not automatically delete your member account or its saved information.',options:[q('Remove from iPhone or iPad','remove_ios'),q('Remove from Android','remove_android'),q('Delete My Account Instead','delete_account'),back]},
    remove_ios:{title:'Remove from iPhone or iPad',body:'Touch and hold the app icon, choose Remove App, then confirm Remove from Home Screen or Delete App. This does not delete your account.',options:[back,main]},
    remove_android:{title:'Remove from Android',body:'Touch and hold the app icon, then choose Uninstall or Remove. This does not delete your account.',options:[back,main]},
    browser_help:{title:'Browser Compatibility',body:'For the clearest experience, use a current version of Safari, Chrome, Edge, or Firefox. Updating the browser often resolves display and installation problems.',options:[q('Basic Troubleshooting','troubleshoot'),contact('Report a Display Issue','Technical Problem'),back]},
    clear_data:{title:'Clear Browser Data',body:'This can sign you out and remove saved website preferences. Before continuing, copy any unsaved text. Open your browser settings, find website data for francinemariebautista.com, and remove only that site when possible.',options:[q('Keep My Current Data','app_loading'),contact('I Still Need Help','Technical Problem'),back]},
    service_status:{title:'Service Status',body:'Thank you for checking. If a page is still unavailable after refreshing, please report the page, time, device, and what you saw so the team can investigate.',options:[{label:'Try Again',action:'reload',primary:true},contact('Report an Outage','Technical Problem'),back]},

    media:{title:'Music and Reading',body:'Absolutely. I can help you open, play, save, or understand the music and reading collection. What do you need?',options:[
      link('Play Music','/music/'),q('Browse Music Categories','music_categories'),q('Music Is Not Playing','music_not_playing'),q('Music Stopped','music_stopped'),link('Save a Track','/profile/',member({})),link('Open Reading Materials','/ebooks/'),q('Reading Page Is Blurred','reading_blurred'),link('Save Reading Material','/profile/',member({})),q('Download Availability','downloads'),q('Can I Share the Content?','share_content'),q('Content Credits','credits'),main
    ]},
    music_categories:{title:'Browse Music Categories',body:'I am happy to help. The complete music library, including original recordings and the soundtrack, is reserved for signed-in members.',options:[
      link('Calm','/music/'),link('Relax','/music/'),link('Upbeat','/music/'),link('With Love, FMB Original Soundtrack','/music/'),link('Recently Added','/music/'),link('Saved Music','/profile/',member({})),link('Create a Free Account','/auth.html#signup',guest({primary:true})),link('Sign In','/auth.html#signin',guest({})),back
    ]},
    music_not_playing:{title:'Music Is Not Playing',body:'I understand. Please check your connection, device volume, silent mode, and browser audio permissions. Music is available after member sign-in.',options:[{label:'Try Again',action:'reload',primary:true},link('Open Another Track','/music/'),link('Sign In','/auth.html#signin',guest({})),contact('Report Audio Problem','Technical Problem'),back]},
    music_stopped:{title:'Music Stopped',body:'That can happen after a connection interruption, browser restriction, or device setting. Your place may need to be restarted after a refresh.',options:[link('Resume Playback','/music/',{primary:true}),{label:'Reload the Track',action:'reload'},link('Open Music Library','/music/'),contact('Report the Problem','Technical Problem'),back]},
    reading_blurred:{title:'Reading Page Is Blurred',body:'You are in the right place. Selected guides are public, while the complete text of other materials is reserved for members. Restricted pages will clearly explain the access needed.',options:[link('Create a Free Account','/auth.html#signup',guest({primary:true})),link('Sign In','/auth.html#signin',guest({})),link('Open My Member Space','/profile/',member({primary:true})),link('View Public Reading','/ebooks/'),back]},
    downloads:{title:'Download Availability',body:'That is a good question. Download availability depends on each material and its usage permissions. If no download button is shown, please use the official page instead.',options:[link('View Available Materials','/ebooks/'),link('Read Usage Guidelines','/membership-agreement.html'),contact('Contact the Team','General Question'),back]},
    share_content:{title:'Can I Share the Content?',body:'Yes, you may share official website links and published posts. Please keep the original credits and do not reproduce complete materials without permission.',options:[{label:'Copy Official Link',action:'copyLink',primary:true},link('View Content Guidelines','/membership-agreement.html'),contact('Request Permission','General Question'),back]},
    credits:{title:'Content Credits',body:'Thank you for caring about proper credit. Credits are listed on the relevant music, article, publication, or project page.',options:[link('View Music Credits','/music/'),link('View Reading Credits','/ebooks/'),contact('Report Missing Credit','Correction Request'),contact('Contact the Team','General Question'),q('Can I Share the Content?','share_content'),back]},

    journal:{title:'Journal and Daily Check-In',body:'I am glad you are making space for yourself. These are private member tools. What would you like to do?',options:[
      q('Start My Daily Check-In','checkin'),q('Write in My Journal','write_journal'),link('View Previous Entries','/profile/',member({})),link('Edit an Entry','/profile/',member({})),link('Delete an Entry','/profile/',member({})),link('Save an Entry','/profile/',member({})),q('Entry Did Not Save','entry_save'),link('Check-In History','/profile/',member({})),q('Privacy of Entries','entry_privacy'),link('Sign In to Continue','/auth.html#signin',guest({primary:true})),main
    ]},
    checkin:{title:'Start My Daily Check-In',body:'Take your time. There is no correct feeling. Choose what is closest to how you are arriving today.',options:[link('Start Check-In','/profile/',member({primary:true})),link('View Previous Check-Ins','/profile/',member({})),link('Open Support Resources','/gethelp/'),link('Sign In','/auth.html#signin',guest({primary:true})),back]},
    write_journal:{title:'Write in My Journal',body:'You can use your journal for personal reflections, thoughts, and experiences. You do not need to make the writing perfect.',options:[link('Write New Entry','/profile/',member({primary:true})),link('View Previous Entries','/profile/',member({})),link('Open Writing Prompts','/profile/',member({})),link('Sign In','/auth.html#signin',guest({primary:true})),back]},
    entry_save:{title:'Entry Did Not Save',body:'I am sorry that happened. First, copy your entry somewhere safe. Then check your connection and confirm that you are still signed in before trying again.',options:[link('Save Again','/profile/',member({primary:true})),{label:'Copy My Entry First',action:'focusComposer'},q('Refresh the Page','confirm_reload'),contact('Report the Problem','Technical Problem'),back]},
    entry_privacy:{title:'Privacy of Entries',body:'Your journal and daily check-ins are intended for your personal account experience. Avoid entering passwords, payment details, government identification numbers, or other highly sensitive information.',options:[link('Read Privacy Policy','/privacy-policy.html'),link('Open My Journal','/profile/',member({})),q('Can the Team Read My Journal?','team_read_journal'),q('Can I Recover a Deleted Entry?','recover_entry'),back]},
    team_read_journal:{title:'Can the Team Read My Journal?',body:'That is an important question. Personal journal entries are not intended as public community posts. Access and handling are governed by the platform’s privacy and security policies.',options:[link('Read Privacy Policy','/privacy-policy.html'),contact('Contact the Team','Privacy Concern'),back]},
    recover_entry:{title:'Recover a Deleted Entry',body:'I understand why you are asking. Deleted entries may not be recoverable, so please review carefully before confirming deletion.',options:[link('View Existing Entries','/profile/',member({})),contact('Contact Support','Account Support'),back]},
    confirm_reload:{title:'Refresh Carefully',body:'Before refreshing, copy any unsaved writing to your Notes app or another safe place. Once it is copied, you can refresh without losing the text.',options:[{label:'I Copied It, Refresh Now',action:'reload',primary:true},back]},

    community:{title:'Community and Freedom Wall',body:'Of course. The Freedom Wall is designed for encouraging, respectful community messages. How can I help?',options:[
      q('Submit a Post','submit_post'),q('Check My Submission','submission_status'),link('Edit My Submission','/profile/',member({})),link('Remove My Post','/profile/',member({})),q('Why Approval Is Required','approval'),link('Community Guidelines','/community-guidelines.html'),q('Anonymous Posting','anonymous'),q('Report Harmful Content','harmful',{care:true}),contact('Block or Report a User','Community Concern'),link('Read the Freedom Wall','/freedom-wall.html'),main
    ]},
    submit_post:{title:'Submit a Post',body:'Thank you for wanting to contribute. Choose the type of message you would like to share. Member submissions are reviewed before publication.',options:[
      link('Personal Reflection','/profile/',member({})),link('Message of Support','/profile/',member({})),link('Community Story','/profile/',member({})),link('Question for the Community','/profile/',member({})),link('Anonymous Submission','/profile/',member({})),link('Sign In to Submit','/auth.html#signin',guest({primary:true})),back
    ]},
    submission_status:{title:'Submission Status',body:'I can help you understand the status shown in your account. Review happens carefully, so some submissions may take time.',options:[q('Pending Review','pending'),link('Approved','/profile/'),link('Published','/freedom-wall.html'),q('Changes Requested','changes_requested'),q('Declined','declined'),contact('Removed','Community Concern'),contact('I Cannot Find My Submission','Community Concern'),back]},
    pending:{title:'Pending Review',body:'Your submission has been received and is awaiting review. Please avoid submitting the same content more than once.',options:[link('View My Submissions','/profile/',member({})),link('Read Community Guidelines','/community-guidelines.html'),back]},
    changes_requested:{title:'Changes Requested',body:'No worries. A request for changes means the post may still be considered after editing. Review the note and adjust only what is needed.',options:[link('Review Requested Changes','/profile/',member({})),link('Edit Submission','/profile/',member({})),contact('Withdraw Submission','Community Concern'),back]},
    approval:{title:'Why Approval Is Required',body:'That is a fair question. Submissions are reviewed to protect community safety, privacy, respectful discussion, and the integrity of the platform.',options:[link('Read Community Guidelines','/community-guidelines.html'),q('Submit a Post','submit_post'),back]},
    anonymous:{title:'Anonymous Posting',body:'Some features may allow your public name to be hidden. The platform may still retain necessary account and moderation records for safety and administration.',options:[link('Submit Anonymously','/profile/',member({})),link('Read Privacy Information','/privacy-policy.html'),link('Sign In','/auth.html#signin',guest({primary:true})),back]},
    declined:{title:'Why Was My Post Declined?',body:'I understand that this may feel disappointing. Posts may be declined when they include harmful content, harassment, private information, misleading claims, unauthorized promotions, or content outside the community’s purpose.',options:[link('Review Guidelines','/community-guidelines.html'),link('Edit and Resubmit','/profile/',member({})),contact('Contact Moderation','Community Concern'),back]},
    harmful:{title:'Report Harmful Content',body:'Thank you for speaking up. Your safety concern matters. Choose the closest category so the team can review it with the right context.',urgent:true,options:[
      contact('Harassment or Bullying','Community Concern',{care:true}),contact('Hate Speech','Community Concern',{care:true}),contact('Threats','Community Concern',{care:true}),q('Self-Harm Concern','danger',{care:true}),contact('Personal Information','Privacy Concern',{care:true}),contact('False or Misleading Information','Correction Request'),contact('Spam or Promotion','Community Concern'),contact('Other Safety Concern','Community Concern',{care:true}),back
    ]},

    support:{title:'Support and Wellbeing',body:'I am glad you reached out. You do not have to handle a difficult moment alone. What kind of support are you looking for?',urgent:false,options:[
      q('I Need Someone to Talk To','talk',{care:true}),link('Find Support Hotlines','/gethelp/'),link('Mental Health Resources','/gethelp/'),link('Women’s Health Resources','/womens-health.html'),link('LGBTQIA+ Resources','/coming-out-respect.html'),link('Support for Men','/men-can-cry.html'),q('Help for Someone Else','help_other',{care:true}),link('Calm Music','/music/'),link('Reading for Difficult Days','/ebooks/'),q('I May Be in Immediate Danger','danger',{care:true}),q('Who Operates the Hotlines?','hotline_operator'),q('A Hotline Is Not Responding','hotline_unavailable',{care:true}),q('Can FMB Provide Counselling?','counseling'),main
    ]},
    talk:{title:'I Need Someone to Talk To',body:'Thank you for telling me. You deserve support. You may explore verified contacts, reach out to someone you trust, or contact a licensed professional.',urgent:true,options:[link('View Support Hotlines','/gethelp/',{primary:true}),link('Find Professional Support','/gethelp/'),link('Open Calming Music','/music/'),link('Read Support Materials','/ebooks/'),q('I May Be in Immediate Danger','danger',{care:true}),back]},
    danger:{title:'Immediate Safety',body:'I am very glad you said something. If you or another person may be in immediate danger, contact local emergency services or go to the nearest emergency facility now. Do not wait for a website reply.',urgent:true,options:[link('View Emergency Contacts','/gethelp/',{primary:true,care:true}),link('Find Support Hotlines','/gethelp/',{care:true}),q('Help for Someone Else','help_other',{care:true}),back]},
    help_other:{title:'Help for Someone Else',body:'Thank you for caring about them. If someone may be in immediate danger, contact emergency services and remain with them when it is safe for you to do so.',urgent:true,options:[link('View Emergency Contacts','/gethelp/',{primary:true,care:true}),link('Read How to Support Someone','/gethelp/'),link('Find Professional Help','/gethelp/'),back]},
    hotline_operator:{title:'Who Operates the Hotlines?',body:'That is an important distinction. Unless specifically stated, listed hotlines belong to independent government offices, hospitals, nonprofit organizations, or professional support providers.',options:[link('View Verified Contacts','/gethelp/'),contact('Report an Incorrect Number','Correction Request'),back]},
    hotline_unavailable:{title:'A Hotline Is Not Responding',body:'I am sorry you could not get through. Availability may change because of location, operating hours, or demand. Please try another verified contact, and use emergency services if danger is immediate.',urgent:true,options:[link('Try Another Hotline','/gethelp/',{primary:true}),link('View Emergency Contacts','/gethelp/',{care:true}),contact('Report an Unavailable Hotline','Correction Request'),back]},
    counseling:{title:'Can With Love, FMB Provide Counselling?',body:'With Love, FMB provides supportive content, resources, and reflection tools. Professional counselling, diagnosis, and treatment should be provided by qualified practitioners.',options:[link('Find Support Resources','/gethelp/'),link('View Professional Services Directory','/gethelp/'),back]},

    privacy:{title:'Privacy and Safety',body:'I understand why this matters. Clear privacy choices help you use the platform with confidence. What would you like to know?',options:[
      q('How My Information Is Used','data_use'),q('Is My Information Sold?','sold'),q('Journal Privacy','entry_privacy'),q('Community Privacy','community_privacy'),q('Cookies and Browser Data','cookies'),q('Account Security','security'),q('Report a Privacy Concern','privacy_concern'),q('Request My Information','data_request'),q('Delete My Account','delete_account'),main
    ]},
    data_use:{title:'How Is My Information Used?',body:'Account information may be used to provide member features, maintain security, communicate important updates, and improve the platform. The published Privacy Policy explains the current handling rules.',options:[link('Read Privacy Policy','/privacy-policy.html'),link('Manage My Account','/profile/',member({})),contact('Contact the Team','Privacy Concern'),back]},
    sold:{title:'Is My Information Sold?',body:'Member information is not intended to be sold to advertisers. Please review the current Privacy Policy for the formal terms that govern information handling.',options:[link('Read Privacy Policy','/privacy-policy.html'),link('Manage Privacy Settings','/profile/',member({})),back]},
    data_request:{title:'Request My Information',body:'Of course. You may submit a request to review available information connected to your account. Identity verification may be required before information is released.',options:[link('Submit a Data Request','/data-rights.html',{primary:true}),link('Update My Information','/profile/',member({})),q('Delete My Account','delete_account'),back]},
    privacy_concern:{title:'Report a Privacy Concern',body:'Thank you for taking this seriously. Choose the concern closest to what happened. Please avoid including passwords or government identification numbers in your report.',options:[
      contact('Unauthorized Account Access','Privacy Concern',{care:true}),contact('Personal Information Published','Privacy Concern',{care:true}),contact('Suspicious Message','Privacy Concern'),contact('Incorrect Personal Information','Privacy Concern'),contact('Journal or Account Concern','Privacy Concern'),contact('Other Privacy Issue','Privacy Concern'),back
    ]},
    community_privacy:{title:'Community Privacy',body:'Public community posts may be visible to others after moderation. Avoid sharing addresses, contact details, health records, private messages, or information that identifies another person without permission.',options:[link('Read Community Guidelines','/community-guidelines.html'),link('Read Privacy Policy','/privacy-policy.html'),contact('Report a Concern','Community Concern'),back]},
    cookies:{title:'Cookies and Browser Data',body:'Browser storage helps keep sessions, preferences, and app features working. Clearing it may sign you out and remove local preferences.',options:[link('Read Privacy Policy','/privacy-policy.html'),q('Clear Browser Data Carefully','clear_data'),back]},

    work:{title:'Work with FMB',body:'Thank you for considering FMB. We can help you reach the right professional inquiry path. What would you like to discuss?',options:[
      link('Branding and Identity','/aboutfmb/#work-with-fmb'),link('Creative Direction','/aboutfmb/#work-with-fmb'),link('Public Relations','/aboutfmb/#work-with-fmb'),link('Strategic Communications','/aboutfmb/#work-with-fmb'),link('Personal Branding','/aboutfmb/#work-with-fmb'),link('Photography','/aboutfmb/#work-with-fmb'),link('Marketing and Content Strategy','/aboutfmb/#work-with-fmb'),link('Speaking or Training','/aboutfmb/#work-with-fmb'),q('Media Inquiry','media_inquiry'),link('Partnership or Collaboration','/aboutfmb/#work-with-fmb'),q('Project Availability','availability'),q('Request a Proposal','professional_inquiry'),main
    ]},
    professional_inquiry:{title:'Start a Professional Inquiry',body:'We appreciate the opportunity. Prepare your name, organization or brand, project type, objectives, preferred timeline, estimated scope, and contact information. Clear context helps FMB’s assistant assess the request properly.',options:[link('Open Inquiry Form','/aboutfmb/#work-with-fmb',{primary:true}),link('View Services','/aboutfmb/'),q('Check Availability','availability'),back]},
    availability:{title:'Project Availability',body:'FMB keeps a considered calendar so each conversation receives proper time and preparation. Availability depends on scope, timeline, priorities, and existing commitments.',options:[link('View Calendar','/aboutfmb/#work-with-fmb',{primary:true}),link('Submit an Inquiry','/aboutfmb/#work-with-fmb'),q('Request Urgent Consideration','urgent_inquiry'),back]},
    urgent_inquiry:{title:'Request Urgent Consideration',body:'We understand that some matters cannot wait. Clearly explain the deadline, importance, and required deliverables. FMB’s assistant will review the context and inform her directly when a matter is especially important. A request does not guarantee availability.',options:[link('Submit Urgent Inquiry','/aboutfmb/#work-with-fmb',{primary:true}),q('View Availability','availability'),back]},
    media_inquiry:{title:'Media Inquiry',body:'Thank you for reaching out. Interviews, features, speaking invitations, press requests, and requests for public statements should include the outlet, topic, deadline, format, and contact details.',options:[contact('Open Media Inquiry Form','Media Inquiry',{primary:true}),link('View FMB Profile','/aboutfmb/'),contact('Request Official Information','Media Inquiry'),back]},

    volunteer:{title:'Volunteer and Collaborate',body:'Thank you for wanting to contribute. Every thoughtful offer matters. How would you like to participate?',options:[
      link('Become a Volunteer','/volunteer.html'),q('View Volunteer Roles','volunteer_roles'),q('Submit a Resource','submit_resource'),contact('Community Partnership','Partnership'),contact('Professional Partnership','Partnership'),contact('Offer Services','Volunteer Application'),q('Check My Application','application_status'),main
    ]},
    volunteer_roles:{title:'Volunteer Roles',body:'Available roles depend on current projects and safeguarding needs. Opportunities may include the roles below.',html:'<ul><li>Peer support volunteer</li><li>Licensed counsellor or psychologist</li><li>Psychiatrist</li><li>Researcher or writer</li><li>Photographer or videographer</li><li>Designer</li><li>Community moderator</li><li>Outreach or administrative support</li></ul>',options:[link('View Open Opportunities','/volunteer.html'),contact('Submit Volunteer Application','Volunteer Application',{primary:true}),back]},
    application_status:{title:'Check My Application',body:'I understand that waiting for an update can feel uncertain. Choose the status shown in your account or email, or contact the team if no update has arrived.',options:[
      contact('Received','Volunteer Application'),contact('Under Review','Volunteer Application'),contact('Interview Requested','Volunteer Application'),contact('Additional Information Needed','Volunteer Application'),contact('Accepted','Volunteer Application'),contact('Not Selected','Volunteer Application'),contact('I Did Not Receive an Update','Volunteer Application'),back
    ]},
    submit_resource:{title:'Submit a Resource',body:'Thank you for helping strengthen the library. Resources should be accurate, properly credited, relevant, and safe for public use.',options:[contact('Submit a Resource','General Question',{primary:true}),link('Read Submission Guidelines','/community-guidelines.html'),contact('Report Incorrect Information','Correction Request'),back]},

    payments:{title:'Membership, Services, and Partnerships',body:'Standard membership is free. A specific professional service, product, event, or program may have a clearly published fee. FMB&CO. does not accept donations.',options:[
      q('Is Membership Free?','membership_free'),q('Donation Policy','donations'),q('Professional Services','work'),q('Business Partnerships','partnerships'),contact('Verify a Published Fee','General Question'),contact('Request a Service Receipt','General Question'),contact('Service Refund or Cancellation','General Question'),q('Report a Suspicious Request','suspicious'),main
    ]},
    membership_free:{title:'Is Membership Free?',body:'Yes. Creating a standard member account is free unless a specific paid service, product, event, or program clearly states otherwise.',options:[link('Create an Account','/auth.html#signup',guest({primary:true})),q('View Member Benefits','benefits'),link('Open My Profile','/profile/',member({primary:true})),back]},
    donations:{title:'Donation Policy',body:'We do not accept donations. FMB&CO., With Love, FMB, SENZ, and Cognita do not have an official donation channel. Do not send money to anyone requesting a donation in our name. A published fee for a specific professional service, product, event, or program is not a donation.',options:[q('Report a Donation Request','suspicious',{care:true}),q('Professional Services','work'),q('Business Partnerships','partnerships'),back]},
    partnerships:{title:'Business Partnerships',body:'FMB&CO. considers professional and business partnership proposals. A useful proposal includes the organization, intended audience, timeline, responsibilities, and value offered to both sides. This is separate from donations, which are not accepted.',options:[contact('Submit Partnership Proposal','Partnership',{primary:true}),link('View Partnership Information',`${SITE_URL}/aboutfmb/#work-with-fmb`),contact('Contact the Team','Partnership'),back]},
    suspicious:{title:'Report a Suspicious Request',body:'You did the right thing by checking. FMB&CO. does not accept donations, so any request for donation money in the name of FMB&CO., With Love, FMB, SENZ, or Cognita is not official. Do not send money, passwords, codes, or personal information.',urgent:true,options:[contact('Submit a Report','Privacy Concern',{primary:true,care:true}),link('View Official Channels',`${SITE_URL}/aboutfmb/`),contact('Contact the Team','Privacy Concern'),back]},

    report:{title:'Report a Problem',body:'I am sorry something is not working as expected. Choose the closest issue so the team receives the right details.',options:[
      q('Page Is Not Loading','technical_report'),contact('Button Is Not Working','Technical Problem'),contact('Broken Link','Technical Problem'),q('Sign-In Problem','signin_problem'),q('Verification Problem','verify_email'),contact('Music or Audio Problem','Technical Problem'),contact('Journal Problem','Technical Problem'),contact('Community Submission Problem','Community Concern'),q('Incorrect Information','incorrect'),contact('Display or Layout Problem','Technical Problem'),q('Privacy or Safety Concern','privacy_concern'),contact('Other Technical Issue','Technical Problem'),q('Try Basic Troubleshooting','troubleshoot'),main
    ]},
    technical_report:{title:'Submit a Technical Report',body:'Thank you for helping us investigate. Include the page or feature, your device and browser, what you expected, what happened instead, and a screenshot when available.',options:[contact('Submit Report','Technical Problem',{primary:true}),q('Try Basic Troubleshooting','troubleshoot'),back]},
    troubleshoot:{title:'Basic Troubleshooting',body:'No worries. Start with the simplest steps: refresh the page, check your connection, restart the browser, update it, and try another device. If you are signed in, you may also sign out and return carefully.',options:[{label:'Problem Solved',next:'closing',primary:true},contact('Submit a Report','Technical Problem'),back]},
    incorrect:{title:'Incorrect Information',body:'Thank you for helping us correct the record. Choose the type of information, and include the page plus a reliable source when possible.',options:[
      contact('Name or Credit','Correction Request'),contact('Date or Historical Information','Correction Request'),contact('Support Hotline','Correction Request',{care:true}),contact('Article or Resource','Correction Request'),contact('Profile Information','Correction Request'),contact('Broken Source','Correction Request'),contact('Other Correction','Correction Request'),back
    ]},

    faq:{title:'Frequently Asked Questions',body:'Certainly. Choose a topic, and I will give you a clear answer or take you to the right page.',options:[
      q('About With Love, FMB','faq_about'),q('About Francine Marie Bautista','faq_fmb'),q('Membership','faq_account'),q('App Experience','app'),q('Content Access','restricted'),q('Music','media'),q('Reading','media'),q('Journal and Check-In','journal'),q('Community','community'),q('Mental Health Support','support',{care:true}),q('Privacy','privacy'),q('Volunteerism','volunteer'),q('Professional Services','work'),q('Partnerships','partnerships'),q('Content Ownership','share_content'),q('Can Features Change?','faq_change'),q('Can I Submit an Article or Resource?','faq_submit'),q('Can I Interview FMB?','faq_interview'),q('Can Schools Use the Resources?','faq_schools'),q('Available Outside the Philippines?','faq_international'),q('Other Languages?','faq_languages'),main
    ]},
    faq_about:{title:'What Is With Love, FMB?',body:'With Love, FMB is a digital space for meaningful stories, wellbeing resources, personal reflection, music, reading, community connection, and conversations about identity, courage, and belonging.',options:[link('Explore the Website','/'),link('Become a Member','/auth.html#signup',guest({primary:true})),link('Open My Member Space','/profile/',member({primary:true})),link('Learn About FMB','/aboutfmb/'),back]},
    faq_fmb:{title:'Who Is Francine Marie Bautista?',body:'Francine Marie Bautista is a Filipina transgender woman, Zambaleña, and Masinloqueña who connects strategy, creativity, education, communication, technology, and public purpose. She is the founder and chief executive of FMB&CO.',options:[link('View Full Profile',`${SITE_URL}/aboutfmb/`),q('Work with FMB&CO.','work'),link('View FMB&CO.',`${SITE_URL}/fmb&co/`),back]},
    faq_account:{title:'Do I Need an Account?',body:'No. Visitors may access selected public content. A free member account is required for personal tools, the complete music library, and selected exclusive materials.',options:[link('Continue as a Visitor','/'),link('Create an Account','/auth.html#signup',guest({primary:true})),link('Open My Profile','/profile/',member({primary:true})),q('View Member Benefits','benefits'),back]},
    faq_change:{title:'Can Features Change?',body:'Yes. Features, content access, design, and community tools may change as the platform develops. Maintenance notices will explain important updates when possible.',options:[link('View Latest Updates','/news/'),q('Report a Problem','report'),back]},
    faq_submit:{title:'Can I Submit an Article, Story, or Resource?',body:'Selected contributions may be considered based on relevance, quality, accuracy, permissions, safety, and editorial review.',options:[link('View Submission Guidelines','/community-guidelines.html'),contact('Submit a Contribution','General Question'),back]},
    faq_interview:{title:'Can I Interview FMB?',body:'Yes. Interview and media requests may be submitted through the official media inquiry flow. Please include the outlet, subject, format, and deadline.',options:[q('Submit Media Inquiry','media_inquiry'),link('View FMB Profile','/aboutfmb/'),back]},
    faq_schools:{title:'Can Schools or Organizations Use the Resources?',body:'Schools, organizations, and community groups may share official links. Reproduction, printing, training use, or redistribution may require written permission.',options:[contact('Request Educational Use','General Question'),link('View Usage Guidelines','/membership-agreement.html'),back]},
    faq_international:{title:'Is the Website Available Outside the Philippines?',body:'The website may be accessed internationally, although some support services, hotline listings, and programs may be specific to particular locations.',options:[link('View Support Resources','/gethelp/'),contact('Report a Location Issue','Correction Request'),back]},
    faq_languages:{title:'Is the Platform Available in Other Languages?',body:'Language availability may vary by page and feature. The team may expand language support as the platform develops.',options:[contact('Suggest a Translation','General Question'),back]},

    typed_fallback:{title:'Not in My Reply Bank Yet',body:'I do not have a verified premade answer for that yet, and I do not want to guess. You can rephrase the question or use an official contact route.',options:[q('Try Another Question','search'),contact('Ask the Team','General Question'),q('View Main Topics','main')]},
    no_results:{title:'No Results Found',body:'I could not find an answer under that topic. You are not stuck. We can try another search or send the question to the team.',options:[q('Try Another Search','search'),q('Browse Frequently Asked Questions','faq'),contact('Contact the Team','General Question'),main]},
    contact_reasons:{title:'Contact the Team',body:'Of course. Choose the reason for contacting the team so your message can be reviewed properly.',options:[
      contact('Account Support','Account Support'),contact('Technical Problem','Technical Problem'),contact('Privacy Concern','Privacy Concern'),contact('Community Concern','Community Concern'),contact('Professional Inquiry','Professional Inquiry'),contact('Partnership','Partnership'),contact('Volunteer Application','Volunteer Application'),contact('Media Inquiry','Media Inquiry'),contact('Correction Request','Correction Request'),contact('General Question','General Question'),back
    ]},
    closing:{title:'Was This Helpful?',body:'I hope the information made the next step clearer. Was this information helpful?',options:[q('Yes, I Found What I Needed','helpful_yes',{primary:true}),q('I Need More Help','more_help'),main]},
    helpful_yes:{title:'You Are All Set',body:'I am glad you found what you needed. You may open Help again at any time. With love, FMB.',options:[{label:'Close Help',action:'close',primary:true},main]},
    more_help:{title:'Let Us Keep Going',body:'Of course. You are not a bother. Let us find the right next step together.',options:[q('Search Again','search'),q('Browse FAQs','faq'),q('Contact the Team','contact_reasons'),q('Report a Problem','report'),main]}
  };

  const searchIndex=[
    {words:'donate donation donations charitable giving fundraiser fundraising contribute money gift cash gcash bank transfer',screen:'donations',priority:80},
    {words:'yoni orange bear mental health companion friend inside app mascot',screen:'yoni',priority:70},
    {words:'az receptionist digital receptionist assistant who are you your name female chatbot',direct:'identity',priority:60},
    {words:'what can you do help topics capabilities questions answer replies reply bank',direct:'capabilities',priority:55},
    {words:'fmb&co fmb and co fmbco company companies portfolio corporate parent organization shaping what comes next',screen:'fmbandco',priority:50},
    {words:'senz strategic communications pr public relations marketing branding website digital solutions agency',screen:'senz',priority:48},
    {words:'cognita institute artificial intelligence ai education learning course training responsible ai',screen:'cognita',priority:48},
    {words:'about francine marie bautista fmb founder chief executive ceo profile strategist creative director filipina zambalena zambaleña masinloc masinloquena masinloqueña transgender advocate',screen:'faq_fmb',priority:45},
    {words:'website home page homepage navigation find page brand brands',screen:'website',priority:30},
    {words:'news latest update article story stories editorial announcement press',href:`${SITE_URL}/news/`,priority:26},
    {words:'book books ebook ebooks read reading library guide guides material materials',screen:'media',priority:24},
    {words:'music song songs audio calm relax relaxing upbeat ost soundtrack play player track tracks album',screen:'media',priority:24},
    {words:'sign in signin login log in password account email verification verify member membership profile register registration signup sign up',screen:'account',priority:30},
    {words:'forgot reset password incorrect password locked out cannot login cannot sign in',screen:'signin_problem',priority:34},
    {words:'journal diary daily check in check-in mood entry entries reflection private writing',screen:'journal',priority:24},
    {words:'freedom wall community post submission submit moderation anonymous harmful content',screen:'community',priority:24},
    {words:'help hotline danger crisis wellbeing counseling counselling support self harm self-harm suicide emergency someone talk',screen:'support',priority:40},
    {words:'privacy security delete data information cookies suspicious hacked personal details journal private',screen:'privacy',priority:30},
    {words:'work hire branding public relations strategy creative direction photography training speaking proposal calendar availability consultation professional service services',screen:'work',priority:28},
    {words:'volunteer volunteering collaborate contribution offer time offer skills resource community role application',screen:'volunteer',priority:25},
    {words:'partnership partner business collaboration proposal organization brand partnership',screen:'partnerships',priority:30},
    {words:'membership free cost price fee payment receipt refund cancellation charge paid',screen:'payments',priority:34},
    {words:'app install iphone ipad ios android browser notification loading device pwa home screen icon mobile desktop update uninstall remove',screen:'app',priority:30},
    {words:'install add home screen download app iphone ipad ios android desktop',screen:'install',priority:36},
    {words:'app not loading app broken blank screen app error will not open cannot open',screen:'app_loading',priority:40},
    {words:'broken error problem bug layout display button link page not loading not working issue report',screen:'report',priority:30},
    {words:'contact team message inquiry email receptionist speak person human official form',screen:'contact_reasons',priority:28},
    {words:'women health womens health woman resources',href:`${SITE_URL}/womens-health.html`,priority:25},
    {words:'lgbt lgbtq lgbtqia coming out respect queer trans transgender resources',href:`${SITE_URL}/coming-out-respect.html`,priority:25},
    {words:'men can cry mens health man emotional support',href:`${SITE_URL}/men-can-cry.html`,priority:25},
    {words:'privacy policy terms data rights agreement community guidelines',screen:'privacy',priority:22},
    {words:'interview media press feature statement journalist outlet',screen:'media_inquiry',priority:30},
    {words:'hello hi hey greetings good morning good afternoon good evening',direct:'greeting',priority:20},
    {words:'thanks thank you appreciate helpful solved perfect great',direct:'thanks',priority:20},
    {words:'bye goodbye good night see you later close exit',direct:'goodbye',priority:20}
  ];

  let isMember=Boolean(window.FMB_MEMBER?.isMember);
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
  layer.innerHTML=`<div class="az-help-backdrop" data-az-close></div><section class="az-help-panel" id="azHelpPanel" role="dialog" aria-modal="true" aria-labelledby="azHelpTitle"><header class="az-help-header"><span class="az-help-avatar">${brandMark}</span><div class="az-help-identity"><div class="az-help-title-row"><strong id="azHelpTitle">AZ</strong><span class="az-help-role">Receptionist</span></div><span class="az-help-brandline">FMB&amp;CO. Digital Reception</span></div><div class="az-help-header-actions"><button class="az-help-icon-button" type="button" data-az-home aria-label="Return to Receptionist home">${homeIcon}</button><button class="az-help-icon-button" type="button" data-az-close aria-label="Close Receptionist">${closeIcon}</button></div></header><div class="az-help-transcript" role="log" aria-live="polite" aria-relevant="additions text"><div class="az-help-day-label">FMB&amp;CO. Digital Reception</div></div><footer class="az-help-composer"><form class="az-help-search"><label class="sr-only" for="azHelpSearch">Type a question for AZ Receptionist</label><input id="azHelpSearch" type="search" maxlength="180" autocomplete="off" placeholder="Ask about the website or app"><button type="submit" aria-label="Send question to AZ">${sendIcon}</button></form><small class="az-help-composer-note">Verified premade replies. Do not enter private or payment information. AZ is not Yoni or an emergency service.</small></footer></section>`;
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
  const visibleOption=option=>!(option.guestOnly&&isMember)&&!(option.memberOnly&&!isMember);
  function addOptions(options){
    const visible=(options||[]).filter(visibleOption);
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
    transcript.innerHTML='<div class="az-help-day-label">FMB&amp;CO. Digital Reception</div>';
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
  async function signOut(){
    addMessage('bot','Signing Out','I understand. I am securely signing this browser out now.');
    const clients=window.FMB_MEMBER?.clients||[];
    try{await Promise.all(clients.map(client=>client.auth.signOut({scope:'local'}).catch(()=>{})))}catch{}
    try{sessionStorage.removeItem('fmb_music_state_v2')}catch{}
    location.replace('/');
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
    if(option.action==='signout'){signOut();return}
    if(option.action==='reload'){setTimeout(()=>location.reload(),420);return}
    if(option.action==='copyLink'){copyOfficialLink();return}
    if(option.action==='focusComposer'){searchInput.placeholder='Paste or type a short note here';setTimeout(()=>searchInput.focus(),120);return}
    if(option.action==='close'){closeAssistant();return}
  }

  function renderContactForm(category){
    addMessage('bot','Contact the Team',`I have selected ${category}. Please complete the form below. Do not include passwords, payment codes, or government identification numbers.`);
    const form=document.createElement('form');form.className='az-contact-form';form.noValidate=true;
    form.innerHTML=`<label>Full Name<input name="name" maxlength="80" autocomplete="name" required></label><label>Email Address<input name="email" type="email" maxlength="254" autocomplete="email" required></label><label>Concern Category<select name="category" required>${['Account Support','Technical Problem','Privacy Concern','Community Concern','Professional Inquiry','Partnership','Volunteer Application','Media Inquiry','Correction Request','General Question'].map(item=>`<option${item===category?' selected':''}>${item}</option>`).join('')}</select></label><label>Subject<input name="subject" maxlength="120" required></label><label>Message<textarea name="message" maxlength="4000" required placeholder="Tell us what happened, what you need, and the relevant page or feature."></textarea></label><label>Relevant Page or Feature<input name="page" maxlength="240" value="${location.pathname}" required></label><label>Attachment, optional<input name="attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></label><p class="az-contact-form-note">For privacy, the chat records the attachment name only. The file itself is not uploaded. The team may ask you to send it securely after reviewing your message.</p><label class="az-consent"><input name="consent" type="checkbox" required><span>I consent to the team using these details to review and respond to my request.</span></label><button class="az-contact-submit" type="submit">Send to the Team</button><div class="az-contact-status" role="status" hidden></div>`;
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
    if(!ready){button.disabled=false;button.textContent='Send to the Team';setStatus(`The secure form is temporarily unavailable. Please email ${HELP_EMAIL} directly.`,true);return}
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
      button.disabled=false;button.textContent='Send to the Team';setStatus(`Your message could not be sent right now. Please try again or email ${HELP_EMAIL}.`,true);
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
    const words=[...new Set(clean.split(/\s+/).filter(word=>word.length>1))];
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
  window.addEventListener('fmb:auth-ready',event=>{isMember=Boolean(event.detail?.isMember)});
})();
