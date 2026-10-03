import { SupportedLanguage } from '../types';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  languageSelectTitle: string;
  languageSelectSub: string;
  greetingHeader: string;
  initialQuestion1: string;
  initialQuestion2: string;
  initialQuestion3: string;
  initialQuestion4: string;
  quickActionTrack: string;
  quickActionReturn: string;
  quickActionAgent: string;
  quickActionPolicies: string;
  talkToSpecialist: string;
  specialistTransferNote: string;
  transferSuccess: string;
  privacyGuarantee: string;
  verifiedAccount: string;
  whatWeCheckedTitle: string;
  whatWeCheckedSub: string;
  refundPreviewTitle: string;
  refundPreviewSub: string;
  orderNumber: string;
  item: string;
  orderTotal: string;
  requestedAmount: string;
  eligibleAmount: string;
  restockingFee: string;
  finalRefundAmount: string;
  expectedProcessingTime: string;
  paymentMethod: string;
  confirmRefundBtn: string;
  confirmReturnBtn: string;
  cancelBtn: string;
  confirmedBadge: string;
  timelineTitle: string;
  timelineSub: string;
  caseId: string;
  caseOwner: string;
  expectedNextUpdate: string;
  evidenceTitle: string;
  evidenceSub: string;
  acknowledgedPriorBadge: string;
  whyPolicyBtn: string;
  policyExplainerTitle: string;
  proactiveUpdatesTitle: string;
  proactiveUpdatesSub: string;
  lightMode: string;
  darkMode: string;
  decisionAnswer: string;
  decisionAsk: string;
  decisionAct: string;
  decisionEscalate: string;
  trustFormatApproved: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'NovaMart Customer Support Desk',
    tagline: 'Deterministic Trust, Verified Evidence & Human Care',
    languageSelectTitle: 'Select your preferred language',
    languageSelectSub: 'You can switch between English, Hindi, and Marathi at any time.',
    greetingHeader: 'Hello! I am Nova, your interactive AI Customer Support Specialist.',
    initialQuestion1: 'How can I help you today?',
    initialQuestion2: 'What problems or questions do you have with your order?',
    initialQuestion3: 'Would you like to track an order or check refund eligibility?',
    initialQuestion4: 'Do you want to talk to our support agent directly?',
    quickActionTrack: '📦 How can I track an order?',
    quickActionReturn: '💰 What problems with returns/refunds?',
    quickActionAgent: '👤 Do you want to talk to our support agent directly?',
    quickActionPolicies: '🛡️ What should be store return policies?',
    talkToSpecialist: 'Talk to a Specialist',
    specialistTransferNote: 'Transfers complete message history, verified facts, and evidence without having to repeat anything.',
    transferSuccess: 'Connected directly to our Human Care Specialist. Ticket assigned.',
    privacyGuarantee: 'Your account details are protected and only used to resolve this request.',
    verifiedAccount: 'Verified Account',
    whatWeCheckedTitle: 'What We Checked (Decision Explanation)',
    whatWeCheckedSub: 'Customer-friendly breakdown of all verified items behind this determination.',
    refundPreviewTitle: 'Refund and Return Preview',
    refundPreviewSub: 'Review calculations and policy deductions before confirming.',
    orderNumber: 'Order Number',
    item: 'Item',
    orderTotal: 'Order Total',
    requestedAmount: 'Requested Amount',
    eligibleAmount: 'Eligible Amount',
    restockingFee: 'Restocking Fee',
    finalRefundAmount: 'Final Refund Amount',
    expectedProcessingTime: 'Expected Processing Time',
    paymentMethod: 'Original Payment Method',
    confirmRefundBtn: 'Confirm Refund',
    confirmReturnBtn: 'Confirm Return',
    cancelBtn: 'Cancel / Keep Order',
    confirmedBadge: 'Confirmed & Scheduled',
    timelineTitle: 'Order & Support Case Timeline',
    timelineSub: 'Visual journey across order delivery, support case, and refund lifecycle.',
    caseId: 'Case ID',
    caseOwner: 'Current Case Owner',
    expectedNextUpdate: 'Next Update Expected',
    evidenceTitle: 'Evidence & Document Checklist',
    evidenceSub: 'Items verified by our systems or provided in previous conversations.',
    acknowledgedPriorBadge: 'Previously Submitted',
    whyPolicyBtn: 'Why?',
    policyExplainerTitle: 'Policy Explainer & Return Terms',
    proactiveUpdatesTitle: 'Proactive Status Updates',
    proactiveUpdatesSub: 'Live events with realistic expectations.',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    decisionAnswer: 'Information Verified',
    decisionAsk: 'Information Needed',
    decisionAct: 'Action Executed',
    decisionEscalate: 'Human Escalation',
    trustFormatApproved: 'Your refund is eligible under policy rules.',
  },
  hi: {
    appName: 'नोवामार्ट ग्राहक सहायता केंद्र (NovaMart)',
    tagline: 'सत्यापित साक्ष्य, पारदर्शी निर्णय एवं विश्वसनीय ग्राहक सेवा',
    languageSelectTitle: 'कृपया अपनी पसंदीदा भाषा चुनें',
    languageSelectSub: 'आप कभी भी अंग्रेजी, हिंदी और मराठी के बीच भाषा बदल सकते हैं।',
    greetingHeader: 'नमस्ते! मैं नोवा हूँ, आपका इंटरएक्टिव एआई ग्राहक सहायता विशेषज्ञ।',
    initialQuestion1: 'आज मैं आपकी किस प्रकार सहायता कर सकता हूँ?',
    initialQuestion2: 'आपकी ऑर्डर या डिलीवरी में क्या समस्या है?',
    initialQuestion3: 'क्या आप ऑर्डर ट्रैक करना चाहते हैं या रिफंड की जांच करना चाहते हैं?',
    initialQuestion4: 'क्या आप सीधे हमारे सहायता विशेषज्ञ से बात करना चाहते हैं?',
    quickActionTrack: '📦 मैं अपना ऑर्डर कैसे ट्रैक करूँ?',
    quickActionReturn: '💰 रिफंड या वापसी से जुड़ी क्या समस्याएँ हैं?',
    quickActionAgent: '👤 क्या आप सीधे हमारे सहायता विशेषज्ञ से बात करना चाहते हैं?',
    quickActionPolicies: '🛡️ स्टोर की वापसी और रिफंड नीतियाँ क्या होनी चाहिए?',
    talkToSpecialist: 'सहायता विशेषज्ञ से बात करें',
    specialistTransferNote: 'आपकी पूरी चैट हिस्ट्री, सत्यापित तथ्य और दस्तावेज़ विशेषज्ञ को बिना दोहराए तुरंत ट्रांसफर किए जाएंगे।',
    transferSuccess: 'आपको हमारे वरिष्ठ सहायता विशेषज्ञ से जोड़ दिया गया है। टिकट सृजित।',
    privacyGuarantee: 'आपके खाते का विवरण सुरक्षित है और इसका उपयोग केवल इस अनुरोध को हल करने के लिए किया जाता है।',
    verifiedAccount: 'सत्यापित खाता',
    whatWeCheckedTitle: 'हमने क्या जांचा (सत्यापन विवरण)',
    whatWeCheckedSub: 'इस निर्णय के पीछे के सभी सत्यापित बिंदुओं का पारदर्शी विवरण।',
    refundPreviewTitle: 'रिफंड एवं वापसी पूर्वावलोकन',
    refundPreviewSub: 'पुष्टि करने से पहले शुल्क कटौती और अंतिम राशि की समीक्षा करें।',
    orderNumber: 'ऑर्डर संख्या',
    item: 'उत्पाद (आइटम)',
    orderTotal: 'कुल ऑर्डर मूल्य',
    requestedAmount: 'अनुरोधित राशि',
    eligibleAmount: 'पात्र राशि',
    restockingFee: 'पुनर्भंडारण शुल्क (Restocking Fee)',
    finalRefundAmount: 'अंतिम रिफंड राशि',
    expectedProcessingTime: 'अनुमानित प्रसंस्करण समय',
    paymentMethod: 'मूल भुगतान विधि',
    confirmRefundBtn: 'रिफंड की पुष्टि करें',
    confirmReturnBtn: 'वापसी की पुष्टि करें',
    cancelBtn: 'रद्द करें / ऑर्डर रखें',
    confirmedBadge: 'पुष्टि की गई एवं निर्धारित',
    timelineTitle: 'ऑर्डर एवं केस टाइमलाइन',
    timelineSub: 'ऑर्डर डिलीवरी से रिफंड निपटान तक की चरणबद्ध दृश्य समय-सारणी।',
    caseId: 'केस पहचान संख्या (Case ID)',
    caseOwner: 'वर्तमान केस प्रभारी',
    expectedNextUpdate: 'अगला अपडेट अनुमानित',
    evidenceTitle: 'दस्तावेज़ एवं साक्ष्य सूची',
    evidenceSub: 'सिस्टम द्वारा सत्यापित या पूर्व बातचीत में प्राप्त दस्तावेज़।',
    acknowledgedPriorBadge: 'पहले से प्राप्त (दोबारा देने की आवश्यकता नहीं)',
    whyPolicyBtn: 'यह नियम क्यों?',
    policyExplainerTitle: 'नीति स्पष्टीकरण एवं वापसी की शर्तें',
    proactiveUpdatesTitle: 'सक्रिय स्थिति अपडेट (Live Updates)',
    proactiveUpdatesSub: 'सटीक और वास्तविक समय अपेक्षाओं के साथ नवीनतम सूचनाएँ।',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    decisionAnswer: 'जानकारी सत्यापित',
    decisionAsk: 'अतिरिक्त जानकारी आवश्यक',
    decisionAct: 'कार्रवाई पूर्ण',
    decisionEscalate: 'विशेषज्ञ समीक्षा हेतु अग्रेषित',
    trustFormatApproved: 'आपका रिफंड नीतिगत नियमों के तहत स्वीकृत है।',
  },
  mr: {
    appName: 'नोव्हामार्ट ग्राहक सेवा केंद्र (NovaMart)',
    tagline: 'सत्यापित पुरावे, पारदर्शक निर्णय आणि विश्वासार्ह ग्राहक सेवा',
    languageSelectTitle: 'कृपया आपली पसंतीची भाषा निवडा',
    languageSelectSub: 'तुम्ही इंग्रजी, हिंदी किंवा मराठी यापैकी कोणतीही भाषा कधीही निवडू शकता.',
    greetingHeader: 'नमस्कार! मी नोव्हा आहे, आपला संवादात्मक एआय ग्राहक सेवा विशेषज्ञ.',
    initialQuestion1: 'मी आज तुम्हाला कशी मदत करू शकतो?',
    initialQuestion2: 'तुमच्या ऑर्डर किंवा डिलिव्हरीमध्ये कोणती अडचण आहे?',
    initialQuestion3: 'तुम्हाला ऑर्डर ट्रॅक करायची आहे की परतावा पात्रता तपासायची आहे?',
    initialQuestion4: 'तुम्हाला आमच्या ग्राहक प्रतिनिधीशी थेट बोलायचे आहे का?',
    quickActionTrack: '📦 मी माझी ऑर्डर कशी ट्रॅक करू शकतो?',
    quickActionReturn: '💰 परतावा किंवा परत पाठवण्याबद्दल काय अडचण आहे?',
    quickActionAgent: '👤 तुम्हाला आमच्या ग्राहक प्रतिनिधीशी थेट बोलायचे आहे का?',
    quickActionPolicies: '🛡️ स्टोअरचे परतावा आणि वापसी नियम काय असावेत?',
    talkToSpecialist: 'तज्ज्ञांशी थेट बोला',
    specialistTransferNote: 'तुमचा संपूर्ण मेसेज इतिहास आणि सत्यापित पुरावे थेट तज्ज्ञांना पाठवले जातील; पुन्हा माहिती सांगण्याची गरज नाही.',
    transferSuccess: 'आपल्याला थेट वरिष्ठ ग्राहक सेवा प्रतिनिधीशी जोडले गेले आहे. तिकीट तयार.',
    privacyGuarantee: 'तुमच्या खात्याचे तपशील सुरक्षित आहेत आणि फक्त या विनंतीचे निराकरण करण्यासाठी वापरले जातात.',
    verifiedAccount: 'सत्यापित खाते',
    whatWeCheckedTitle: 'आम्ही काय तपासले (सत्यापन तपशील)',
    whatWeCheckedSub: 'या निर्णयामागील सर्व तपासलेल्या घटकांची पारदर्शक माहिती.',
    refundPreviewTitle: 'परतावा आणि परत पाठवणे पूर्वावलोकन',
    refundPreviewSub: 'पुष्टी करण्यापूर्वी वजावट आणि अंतिम रकमेचे पुनरावलोकन करा.',
    orderNumber: 'ऑर्डर क्रमांक',
    item: 'वस्तू / उत्पादन',
    orderTotal: 'एकूण ऑर्डर रक्कम',
    requestedAmount: 'मागितलेली रक्कम',
    eligibleAmount: 'पात्र रक्कम',
    restockingFee: 'पुन्हा साठवणूक शुल्क (Restocking Fee)',
    finalRefundAmount: 'अंतिम परतावा रक्कम',
    expectedProcessingTime: 'अपेक्षित प्रक्रिया कालावधी',
    paymentMethod: 'मूळ देयक पद्धत',
    confirmRefundBtn: 'परताव्याची पुष्टी करा',
    confirmReturnBtn: 'परत पाठवण्याची पुष्टी करा',
    cancelBtn: 'रद्द करा / ऑर्डर ठेवा',
    confirmedBadge: 'पुष्टी केली आणि नियोजित',
    timelineTitle: 'ऑर्डर आणि केस टाइमलाइन',
    timelineSub: 'ऑर्डर डिलिव्हरीपासून परतावा पूर्ण होईपर्यंतचा दृश्य प्रवास.',
    caseId: 'केस आयडी (Case ID)',
    caseOwner: 'नियुक्त सेवा अधिकारी',
    expectedNextUpdate: 'पुढील अपडेट अपेक्षित',
    evidenceTitle: 'पुरावा आणि दस्तऐवज यादी',
    evidenceSub: 'प्रणालीद्वारे सत्यापित किंवा मागील संभाषणात मिळालेले पुरावे.',
    acknowledgedPriorBadge: 'यापूर्वीच सादर केले (पुन्हा देण्याची गरज नाही)',
    whyPolicyBtn: 'हा नियम का?',
    policyExplainerTitle: 'नियम स्पष्टीकरण आणि परतावा अटी',
    proactiveUpdatesTitle: 'थेट स्थिती सूचना (Live Updates)',
    proactiveUpdatesSub: 'वास्तववादी अपेक्षांसह थेट सूचना.',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    decisionAnswer: 'माहिती सत्यापित',
    decisionAsk: 'माहिती आवश्यक',
    decisionAct: 'कृती पूर्ण',
    decisionEscalate: 'तज्ज्ञांकडे वर्ग',
    trustFormatApproved: 'आपला परतावा नियमांनुसार पात्र आहे.',
  },
};
