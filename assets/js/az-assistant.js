(function(){
  'use strict';
  if(document.querySelector('.az-help-trigger'))return;

  const HELP_EMAIL='withlovefmb@gmail.com';
  const q=(label,next,extra={})=>({label,next,...extra});
  const link=(label,href,extra={})=>({label,href,...extra});
  const contact=(label,category,extra={})=>({label,action:'contact',category,...extra});
  const back=q('Back','__back');
  const main=q('Return to Main Menu','main');
  const guest=extra=>({...extra,guestOnly:true});
  const member=extra=>({...extra,memberOnly:true});

  const screens={
    main:{
      title:'How can I help?',
      body:'Hello. How may we help you today? Choose a topic below, or type a few words in the search box. I will guide you to the clearest next step.',
      options:[
        q('Find Something','find'),q('Account and Membership','account'),q('App and Device Help','app'),q('Music and Reading','media'),q('Journal and Daily Check-In','journal'),q('Community and Freedom Wall','community'),q('Support and Wellbeing','support',{care:true}),q('Privacy and Safety','privacy'),q('Work with FMB','work'),q('Volunteer and Collaborate','volunteer'),q('Payments, Donations, and Partnerships','payments'),q('Report a Problem','report'),q('Frequently Asked Questions','faq')
      ]
    },
    find:{title:'Find Something',body:'Of course. I can help you find the right part of With Love, FMB. What would you like to explore?',options:[
      link('About FMB','/aboutfmb/'),link('Latest News','/news/'),link('Reading Library','/ebooks/'),link('Music Library','/music/'),link('Support Resources','/gethelp/'),link('Volunteer Opportunities','/volunteer.html'),link('Our Projects','/fmbandco/'),link('Work with FMB','/aboutfmb/#work-with-fmb'),contact('Contact the Team','General Question'),q('Search the Website','search'),q('I Cannot Find a Page','missing'),main
    ]},
    search:{title:'Search the Website',body:'I understand. Enter a keyword below, or choose a category. I will match it with the closest available page.',focusSearch:true,options:[
      link('Mental Health','/reading.html'),link('Women’s Health','/womens-health.html'),link('LGBTQIA+ Resources','/coming-out-respect.html'),link('Music','/music/'),link('Reading','/ebooks/'),link('News','/news/'),link('Community','/freedom-wall.html'),link('Volunteerism','/volunteer.html'),link('FMB Projects','/fmbandco/'),link('Professional Services','/aboutfmb/#work-with-fmb'),back,main
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

    app:{title:'App and Device Help',body:'Of course. Device issues can be inconvenient, but we can work through them. What would you like help with?',options:[
      q('Install the App','install'),link('Open the App','/'),q('Update the App','update_app'),q('App Is Not Loading','app_loading'),q('App Looks Different','app_different'),q('Notifications','notifications'),q('Home Screen Icon','install'),q('Remove the App','remove_app'),q('Browser Compatibility','browser_help'),main
    ]},
    install:{title:'Install the App',body:'I can guide you. Choose your device. Installation adds a convenient home-screen icon and does not change your account.',options:[q('iPhone or iPad','install_ios'),q('Android','install_android'),q('Desktop or Laptop','install_desktop'),link('Continue in Browser','/'),back]},
    install_ios:{title:'Install on iPhone or iPad',body:'Open the website in Safari, tap the Share button, then select Add to Home Screen. Confirm the name and tap Add.',options:[link('Continue in Browser','/'),q('The Option Is Missing','browser_help'),back]},
    install_android:{title:'Install on Android',body:'Open the website in Chrome, tap the browser menu, then choose Install App or Add to Home Screen. Confirm when prompted.',options:[link('Continue in Browser','/'),q('The Option Is Missing','browser_help'),back]},
    install_desktop:{title:'Install on Desktop or Laptop',body:'Depending on your browser, an install icon may appear near the address bar. If it does not, you can continue using the website normally.',options:[link('Continue on the Website','/'),q('View Browser Instructions','browser_help'),back]},
    update_app:{title:'Update the App',body:'You are not doing anything wrong. The app usually updates when it is reopened. Close it fully, reconnect to the internet, and open it again.',options:[{label:'Try Again',action:'reload',primary:true},q('App Is Not Loading','app_loading'),contact('Report the Problem','Technical Problem'),back]},
    app_loading:{title:'App Is Not Loading',body:'I understand. Please try these steps in order. Your account and saved information should remain unaffected by a normal refresh.',html:'<ol><li>Check your internet connection.</li><li>Close and reopen the app.</li><li>Refresh the page.</li><li>Restart your device.</li><li>Try another supported browser.</li></ol>',options:[{label:'Try Again',action:'reload',primary:true},q('Check Service Status','service_status'),q('Clear Browser Data','clear_data'),contact('Report the Problem','Technical Problem'),back]},
    app_different:{title:'App Looks Different',body:'That makes sense. The app and desktop website may use different layouts depending on the device and screen size, while the content and account remain connected.',options:[link('View App Features','/'),link('Open Desktop Website','https://www.francinemariebautista.com/'),contact('Report a Display Issue','Technical Problem'),back]},
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
      link('Become a Volunteer','/volunteer.html'),q('View Volunteer Roles','volunteer_roles'),q('Submit a Resource','submit_resource'),contact('Community Partnership','Partnership'),contact('Professional Partnership','Partnership'),contact('Sponsor an Initiative','Partnership'),contact('Offer Services','Volunteer Application'),q('Check My Application','application_status'),main
    ]},
    volunteer_roles:{title:'Volunteer Roles',body:'Available roles depend on current projects and safeguarding needs. Opportunities may include the roles below.',html:'<ul><li>Peer support volunteer</li><li>Licensed counsellor or psychologist</li><li>Psychiatrist</li><li>Researcher or writer</li><li>Photographer or videographer</li><li>Designer</li><li>Community moderator</li><li>Outreach or administrative support</li></ul>',options:[link('View Open Opportunities','/volunteer.html'),contact('Submit Volunteer Application','Volunteer Application',{primary:true}),back]},
    application_status:{title:'Check My Application',body:'I understand that waiting for an update can feel uncertain. Choose the status shown in your account or email, or contact the team if no update has arrived.',options:[
      contact('Received','Volunteer Application'),contact('Under Review','Volunteer Application'),contact('Interview Requested','Volunteer Application'),contact('Additional Information Needed','Volunteer Application'),contact('Accepted','Volunteer Application'),contact('Not Selected','Volunteer Application'),contact('I Did Not Receive an Update','Volunteer Application'),back
    ]},
    submit_resource:{title:'Submit a Resource',body:'Thank you for helping strengthen the library. Resources should be accurate, properly credited, relevant, and safe for public use.',options:[contact('Submit a Resource','General Question',{primary:true}),link('Read Submission Guidelines','/community-guidelines.html'),contact('Report Incorrect Information','Correction Request'),back]},

    payments:{title:'Payments, Donations, and Partnerships',body:'I am glad you checked first. Clear, official payment information helps protect everyone. What do you need help with?',options:[
      q('Is Membership Free?','membership_free'),q('Donations','donations'),q('Sponsorships','partnerships'),q('Brand Partnerships','partnerships'),contact('Payment Verification','General Question'),contact('Request a Receipt','General Question'),contact('Refund or Cancellation','General Question'),q('Report a Suspicious Request','suspicious'),main
    ]},
    membership_free:{title:'Is Membership Free?',body:'Yes. Creating a standard member account is free unless a specific paid service, product, event, or program clearly states otherwise.',options:[link('Create an Account','/auth.html#signup',guest({primary:true})),q('View Member Benefits','benefits'),link('Open My Profile','/profile/',member({primary:true})),back]},
    donations:{title:'Donations',body:'Thank you for wanting to support the work. Only use payment details published through official With Love, FMB channels. If no official option is displayed, please do not send money.',options:[contact('View Official Donation Options','General Question'),contact('Request a Receipt','General Question'),q('Report a Suspicious Request','suspicious'),back]},
    partnerships:{title:'Sponsorships and Partnerships',body:'We appreciate your interest. A useful proposal includes the organization, intended audience, timeline, responsibilities, and the value offered to both sides.',options:[contact('Submit Partnership Proposal','Partnership',{primary:true}),link('View Partnership Guidelines','/aboutfmb/#work-with-fmb'),contact('Contact the Team','Partnership'),back]},
    suspicious:{title:'Report a Suspicious Request',body:'You did the right thing by checking. Do not send money, passwords, codes, or personal information to unverified accounts claiming to represent FMB or With Love, FMB.',urgent:true,options:[contact('Submit a Report','Privacy Concern',{primary:true,care:true}),link('View Official Channels','/aboutfmb/'),contact('Contact the Team','Privacy Concern'),back]},

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
    faq_fmb:{title:'Who Is Francine Marie Bautista?',body:'Francine Marie Bautista is a Filipina transgender creative director, strategist, entrepreneur, photographer, storyteller, PR practitioner, branding consultant, educator, and advocate from Masinloc, Zambales.',options:[link('View Full Profile','/aboutfmb/'),q('Work with FMB','work'),link('View Projects','/fmbandco/'),back]},
    faq_account:{title:'Do I Need an Account?',body:'No. Visitors may access selected public content. A free member account is required for personal tools, the complete music library, and selected exclusive materials.',options:[link('Continue as a Visitor','/'),link('Create an Account','/auth.html#signup',guest({primary:true})),link('Open My Profile','/profile/',member({primary:true})),q('View Member Benefits','benefits'),back]},
    faq_change:{title:'Can Features Change?',body:'Yes. Features, content access, design, and community tools may change as the platform develops. Maintenance notices will explain important updates when possible.',options:[link('View Latest Updates','/news/'),q('Report a Problem','report'),back]},
    faq_submit:{title:'Can I Submit an Article, Story, or Resource?',body:'Selected contributions may be considered based on relevance, quality, accuracy, permissions, safety, and editorial review.',options:[link('View Submission Guidelines','/community-guidelines.html'),contact('Submit a Contribution','General Question'),back]},
    faq_interview:{title:'Can I Interview FMB?',body:'Yes. Interview and media requests may be submitted through the official media inquiry flow. Please include the outlet, subject, format, and deadline.',options:[q('Submit Media Inquiry','media_inquiry'),link('View FMB Profile','/aboutfmb/'),back]},
    faq_schools:{title:'Can Schools or Organizations Use the Resources?',body:'Schools, organizations, and community groups may share official links. Reproduction, printing, training use, or redistribution may require written permission.',options:[contact('Request Educational Use','General Question'),link('View Usage Guidelines','/membership-agreement.html'),back]},
    faq_international:{title:'Is the Website Available Outside the Philippines?',body:'The website may be accessed internationally, although some support services, hotline listings, and programs may be specific to particular locations.',options:[link('View Support Resources','/gethelp/'),contact('Report a Location Issue','Correction Request'),back]},
    faq_languages:{title:'Is the Platform Available in Other Languages?',body:'Language availability may vary by page and feature. The team may expand language support as the platform develops.',options:[contact('Suggest a Translation','General Question'),back]},

    typed_fallback:{title:'I Could Not Match That Yet',body:'Thank you for explaining. We could not match your message to an available topic, but that is okay. Choose one of the options below and I will keep helping.',options:[q('Search Help Topics','search'),q('Frequently Asked Questions','faq'),contact('Contact the Team','General Question'),q('Report a Problem','report'),main]},
    no_results:{title:'No Results Found',body:'I could not find an answer under that topic. You are not stuck. We can try another search or send the question to the team.',options:[q('Try Another Search','search'),q('Browse Frequently Asked Questions','faq'),contact('Contact the Team','General Question'),main]},
    contact_reasons:{title:'Contact the Team',body:'Of course. Choose the reason for contacting the team so your message can be reviewed properly.',options:[
      contact('Account Support','Account Support'),contact('Technical Problem','Technical Problem'),contact('Privacy Concern','Privacy Concern'),contact('Community Concern','Community Concern'),contact('Professional Inquiry','Professional Inquiry'),contact('Partnership','Partnership'),contact('Volunteer Application','Volunteer Application'),contact('Media Inquiry','Media Inquiry'),contact('Correction Request','Correction Request'),contact('General Question','General Question'),back
    ]},
    closing:{title:'Was This Helpful?',body:'I hope the information made the next step clearer. Was this information helpful?',options:[q('Yes, I Found What I Needed','helpful_yes',{primary:true}),q('I Need More Help','more_help'),main]},
    helpful_yes:{title:'You Are All Set',body:'I am glad you found what you needed. You may open Help again at any time. With love, FMB.',options:[{label:'Close Help',action:'close',primary:true},main]},
    more_help:{title:'Let Us Keep Going',body:'Of course. You are not a bother. Let us find the right next step together.',options:[q('Search Again','search'),q('Browse FAQs','faq'),q('Contact the Team','contact_reasons'),q('Report a Problem','report'),main]}
  };

  const searchIndex=[
    {words:'about francine fmb profile strategist creative director filipina zambalena masinloc transgender advocate',screen:'faq_fmb'},
    {words:'news latest update article',href:'/news/'},
    {words:'book books ebook ebooks read reading mental health women lgbt men',screen:'media'},
    {words:'music song audio calm relax upbeat ost soundtrack play',screen:'media'},
    {words:'sign in login log in password account email verification member membership profile',screen:'account'},
    {words:'journal diary daily check in mood entry reflection',screen:'journal'},
    {words:'freedom wall community post submission moderation',screen:'community'},
    {words:'help hotline danger crisis wellbeing counseling support self harm suicide',screen:'support'},
    {words:'privacy security delete data cookies suspicious',screen:'privacy'},
    {words:'work hire branding pr strategy photography training proposal calendar availability',screen:'work'},
    {words:'volunteer collaborate partnership sponsor donate donation',screen:'volunteer'},
    {words:'app install iphone ipad android browser notification loading device',screen:'app'},
    {words:'broken error problem bug layout button page not loading',screen:'report'},
    {words:'contact team message inquiry email',screen:'contact_reasons'}
  ];

  let isMember=Boolean(window.FMB_MEMBER?.isMember);
  let current='main';
  let history=[];
  let started=false;
  let lastTrigger=null;
  let contactCategory='General Question';

  const chatIcon='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5.5 6.5h14a5 5 0 0 1 5 5v5.2a5 5 0 0 1-5 5h-6.7L8 25.6v-3.9H5.5a4 4 0 0 1-4-4v-7.2a4 4 0 0 1 4-4Z" fill="rgba(255,255,255,.14)" stroke="currentColor" stroke-width="1.6"/><path d="M18 4.2h6.8a5.2 5.2 0 0 1 5.2 5.2v4.1a4.2 4.2 0 0 1-4.2 4.2H24" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M11.3 12a3 3 0 1 1 4.4 2.7c-1.1.6-1.6 1.2-1.6 2.3M14.1 19.3h.01M23.1 7.8a1.7 1.7 0 1 1 2.3 1.6c-.7.4-1 .8-1 1.4M24.4 12.7h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const closeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  const homeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 11 8-7 8 7v9H4Z"/><path d="M9 20v-6h6v6"/></svg>';
  const sendIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8Z"/><path d="M7 12h14"/></svg>';

  const trigger=document.createElement('button');
  trigger.className='az-help-trigger';
  trigger.type='button';
  trigger.setAttribute('aria-label','Open AZ help assistant');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','azHelpPanel');
  trigger.innerHTML=`<span class="az-help-trigger-icon">${chatIcon}</span><span class="az-help-trigger-label"><strong>Ask AZ</strong><small>Help assistant</small></span>`;

  const layer=document.createElement('div');
  layer.className='az-help-layer';
  layer.innerHTML=`<div class="az-help-backdrop" data-az-close></div><section class="az-help-panel" id="azHelpPanel" role="dialog" aria-modal="true" aria-labelledby="azHelpTitle"><header class="az-help-header"><span class="az-help-avatar">${chatIcon}</span><div class="az-help-identity"><strong id="azHelpTitle">AZ, With Love FMB Help</strong><span>Here to guide you</span></div><div class="az-help-header-actions"><button class="az-help-icon-button" type="button" data-az-home aria-label="Return to main help menu">${homeIcon}</button><button class="az-help-icon-button" type="button" data-az-close aria-label="Close help">${closeIcon}</button></div></header><div class="az-help-transcript" role="log" aria-live="polite" aria-relevant="additions text"><div class="az-help-day-label">With Love, FMB Help</div></div><footer class="az-help-composer"><form class="az-help-search"><label class="sr-only" for="azHelpSearch">Type a help question</label><input id="azHelpSearch" type="search" maxlength="180" autocomplete="off" placeholder="Type a question or keyword"><button type="submit" aria-label="Search help">${sendIcon}</button></form><small class="az-help-composer-note">AZ provides guided website help. For urgent danger, contact emergency services.</small></footer></section>`;
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
    const wrap=document.createElement('div');wrap.className=`az-quick-replies${visible.length<3?' is-single':''}`;
    visible.forEach(option=>{
      const button=document.createElement('button');button.type='button';button.className=`az-quick-reply${option.primary?' is-primary':''}${option.care?' is-care':''}`;button.textContent=option.label;
      button.addEventListener('click',()=>choose(option,wrap));wrap.appendChild(button);
    });
    transcript.appendChild(wrap);scrollEnd();
    return wrap;
  }
  function reassuranceFor(screen){
    if(screen.urgent)return 'I hear you, and I am glad you reached out. Your safety matters.';
    return screen.reassurance||'Of course. You are in the right place, and I will help you find the next step.';
  }
  function showScreen(id,{push=true,delay=true}={}){
    if(id==='__back'){
      id=history.pop()||'main';push=false;
    }
    const screen=screens[id]||screens.no_results;
    if(push&&current!==id)history.push(current);
    current=id;
    const reveal=()=>{
      addMessage('bot',screen.title,`${reassuranceFor(screen)} ${screen.body}`,{html:screen.html||'',urgent:Boolean(screen.urgent)});
      addOptions(screen.options);
      if(screen.focusSearch)setTimeout(()=>searchInput.focus({preventScroll:true}),120);
    };
    if(!delay){reveal();return}
    const typing=addTyping();setTimeout(()=>{typing.remove();reveal()},260);
  }
  function resetConversation(){
    transcript.innerHTML='<div class="az-help-day-label">With Love, FMB Help</div>';
    current='main';history=[];
    addMessage('bot','Welcome',"Hi, I am AZ, your assistant for today. I am here to help, and we can take this one step at a time. How can I help?");
    showScreen('main',{push:false,delay:false});
  }
  function setOptionsInactive(wrap){wrap?.setAttribute('aria-hidden','true');wrap?.querySelectorAll('button').forEach(button=>button.disabled=true)}
  function acknowledgement(option){
    const lower=option.label.toLowerCase();
    if(option.care||/(danger|harm|privacy|suspicious|bully|threat|self-harm)/.test(lower))return 'Thank you for telling me. I will help you reach the safest next step.';
    if(option.action==='contact')return 'Absolutely. I will prepare the correct contact form so the team receives the context.';
    if(option.href)return `Certainly. I will take you to ${option.label}.`;
    return `I understand. Let us look at ${option.label}.`;
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
    button.disabled=true;button.textContent='Sending with care';setStatus('Please wait while AZ records your request.');
    const ready=await waitForServices();
    if(!ready){button.disabled=false;button.textContent='Send to the Team';setStatus(`The secure form is temporarily unavailable. Please email ${HELP_EMAIL} directly.`,true);return}
    const detail=[`Category: ${category}`,`Relevant page or feature: ${page}`,attachment instanceof File&&attachment.name?`Attachment selected: ${attachment.name} (file not uploaded)`:'',`Message:\n${message}`].filter(Boolean).join('\n\n');
    try{
      const client=window.FMB.createClient('local');
      const {data:reference,error}=await client.rpc('submit_contact_message',{p_name:name.slice(0,80),p_email:email.slice(0,254),p_subject:`[AZ Help] ${subject}`.slice(0,120),p_message:detail.slice(0,4000),p_kind:'contact'});
      if(error||!reference)throw error||new Error('No reference returned');
      const shortRef=`AZ-${String(reference).replace(/[^a-z0-9]/gi,'').slice(-8).toUpperCase()}`;
      form.remove();
      addMessage('bot','Message Received',`Thank you, ${name}. Your message has been received. Please keep reference number ${shortRef} for future follow-up. The team will review the context you provided.`);
      addOptions([{label:'View My Request Details',next:'contact_reasons'},main,{label:'Close Help',action:'close'}]);
    }catch{
      button.disabled=false;button.textContent='Send to the Team';setStatus(`Your message could not be sent right now. Please try again or email ${HELP_EMAIL}.`,true);
    }
  }

  function handleSearch(value){
    const clean=String(value||'').trim().toLowerCase();if(!clean)return;
    addMessage('user','',value);searchInput.value='';
    const words=clean.split(/\s+/).filter(word=>word.length>2);
    let best=null,bestScore=0;
    searchIndex.forEach(item=>{const score=words.reduce((sum,word)=>sum+(item.words.includes(word)?1:0),0);if(score>bestScore){best=item;bestScore=score}});
    if(!best||bestScore===0){showScreen('typed_fallback');return}
    addMessage('bot','I Found a Match','Thank you for explaining. I found the closest help topic, and I will guide you from there.');
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
