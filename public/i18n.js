(() => {
  const entries = [
    ["Smart Clinical Intake", "स्मार्ट क्लिनिकल इनटेक", "স্মার্ট ক্লিনিক্যাল ইনটেক"],
    ["Patient Care", "रोगी सेवा", "রোগীর যত্ন"],
    ["Dashboard", "डैशबोर्ड", "ড্যাশবোর্ড"],
    ["Start Intake", "इनटेक शुरू करें", "ইনটেক শুরু করুন"],
    ["Patient History", "रोगी का इतिहास", "রোগীর ইতিহাস"],
    ["Reports", "रिपोर्ट", "রিপোর্ট"],
    ["AI Summary", "एआई सारांश", "এআই সারাংশ"],
    ["Doctor Review", "डॉक्टर की समीक्षा", "ডাক্তারের পর্যালোচনা"],
    ["Health Timeline", "स्वास्थ्य समयरेखा", "স্বাস্থ্য সময়রেখা"],
    ["🚨 Medical Emergency?", "🚨 चिकित्सा आपातकाल?", "🚨 চিকিৎসা জরুরি অবস্থা?"],
    ["If you are experiencing severe symptoms, seek immediate professional help.", "गंभीर लक्षण होने पर तुरंत किसी स्वास्थ्य पेशेवर से सहायता लें।", "গুরুতর উপসর্গ হলে অবিলম্বে স্বাস্থ্যকর্মীর সাহায্য নিন।"],
    ["☎ Emergency Help", "☎ आपातकालीन सहायता", "☎ জরুরি সহায়তা"],
    ["🔐 Your data is encrypted & secure", "🔐 आपका डेटा एन्क्रिप्टेड और सुरक्षित है", "🔐 আপনার তথ্য এনক্রিপ্ট করা ও সুরক্ষিত"],
    ["Search patient, UHID, mobile…", "रोगी, UHID या मोबाइल खोजें…", "রোগী, UHID বা মোবাইল খুঁজুন…"],
    ["OPD · General Medicine", "ओपीडी · जनरल मेडिसिन", "ওপিডি · জেনারেল মেডিসিন"],
    ["Namaste! 👋", "नमस्ते! 👋", "নমস্কার! 👋"],
    ["How can I help you today?", "आज मैं आपकी कैसे मदद कर सकता हूँ?", "আজ আপনাকে কীভাবে সাহায্য করতে পারি?"],
    ["Speak naturally in your preferred language or type your symptoms. ChikitsaKendra AI organises your information into a structured clinical draft, ready for professional review.", "अपनी पसंदीदा भाषा में बोलें या लक्षण लिखें। ChikitsaKendra AI आपकी जानकारी को स्वास्थ्य पेशेवर की समीक्षा के लिए व्यवस्थित करता है।", "আপনার পছন্দের ভাষায় বলুন বা উপসর্গ লিখুন। ChikitsaKendra AI স্বাস্থ্যকর্মীর পর্যালোচনার জন্য তথ্য সাজিয়ে দেয়।"],
    ["Tap to Speak", "बोलने के लिए टैप करें", "বলতে ট্যাপ করুন"],
    ["Voice & touch enabled · 15+ languages", "आवाज़ और टच उपलब्ध · 15+ भाषाएँ", "ভয়েস ও টাচ সুবিধা · ১৫টিরও বেশি ভাষা"],
    ["🎙 Voice & Touch", "🎙 आवाज़ और टच", "🎙 ভয়েস ও টাচ"],
    ["🌐 Multilingual", "🌐 बहुभाषी", "🌐 বহুভাষিক"],
    ["✅ Doctor Verified", "✅ डॉक्टर द्वारा सत्यापित", "✅ ডাক্তার দ্বারা যাচাইকৃত"],
    ["🔐 Encrypted", "🔐 एन्क्रिप्टेड", "🔐 এনক্রিপ্ট করা"],
    ["Your Intake Progress", "आपकी इनटेक प्रगति", "আপনার ইনটেকের অগ্রগতি"],
    ["2 of 5 steps completed", "5 में से 2 चरण पूरे", "৫টির মধ্যে ২টি ধাপ সম্পন্ন"],
    ["Basic Information", "बुनियादी जानकारी", "প্রাথমিক তথ্য"],
    ["✓ Done", "✓ पूरा", "✓ সম্পন্ন"],
    ["Describe Symptoms", "लक्षण बताएं", "উপসর্গ বর্ণনা করুন"],
    ["Active", "चालू", "চলমান"],
    ["Upload Reports", "रिपोर्ट अपलोड करें", "রিপোর্ট আপলোড করুন"],
    ["Pending", "बाकी", "অপেক্ষমাণ"],
    ["🔒 Consent & Privacy", "🔒 सहमति और गोपनीयता", "🔒 সম্মতি ও গোপনীয়তা"],
    ["Your privacy is our top priority.", "आपकी गोपनीयता हमारी प्राथमिकता है।", "আপনার গোপনীয়তা আমাদের অগ্রাধিকার।"],
    ["I understand why my information is being collected.", "मैं समझता/समझती हूँ कि मेरी जानकारी क्यों एकत्र की जा रही है।", "আমার তথ্য কেন সংগ্রহ করা হচ্ছে তা আমি বুঝি।"],
    ["I consent to processing of my health data.", "मैं अपने स्वास्थ्य डेटा के उपयोग की सहमति देता/देती हूँ।", "আমি আমার স্বাস্থ্যতথ্য প্রক্রিয়াকরণে সম্মতি দিচ্ছি।"],
    ["My information will remain confidential.", "मेरी जानकारी गोपनीय रखी जाएगी।", "আমার তথ্য গোপন রাখা হবে।"],
    ["I Agree & Continue →", "मैं सहमत हूँ और आगे बढ़ें →", "আমি সম্মত এবং এগিয়ে যান →"],
    ["Tell us about your health", "अपने स्वास्थ्य के बारे में बताएं", "আপনার স্বাস্থ্য সম্পর্কে বলুন"],
    ["Complete the sections relevant to your consultation today.", "आज की परामर्श से जुड़े अनुभाग भरें।", "আজকের পরামর্শের জন্য প্রাসঙ্গিক অংশগুলি পূরণ করুন।"],
    ["PATIENT INPUT", "रोगी की जानकारी", "রোগীর তথ্য"],
    ["Chief Complaint", "मुख्य शिकायत", "প্রধান সমস্যা"],
    ["What is your main problem today?", "आज आपकी मुख्य समस्या क्या है?", "আজ আপনার প্রধান সমস্যা কী?"],
    ["+ Add Details", "+ विवरण जोड़ें", "+ বিস্তারিত যোগ করুন"],
    ["Symptoms", "लक्षण", "উপসর্গ"],
    ["Select or describe your symptoms.", "अपने लक्षण चुनें या बताएं।", "আপনার উপসর্গ বেছে নিন বা বর্ণনা করুন।"],
    ["Vitals", "महत्वपूर्ण संकेत", "গুরুত্বপূর্ণ লক্ষণ"],
    ["Enter recent measurements if available.", "उपलब्ध होने पर हाल के माप दर्ज करें।", "থাকলে সাম্প্রতিক পরিমাপ লিখুন।"],
    ["Medical History", "चिकित्सा इतिहास", "চিকিৎসার ইতিহাস"],
    ["Past illnesses and surgeries.", "पिछली बीमारियाँ और सर्जरी।", "আগের অসুস্থতা ও অস্ত্রোপচার।"],
    ["Medications", "दवाइयाँ", "ওষুধ"],
    ["Current medicines you take.", "वर्तमान में ली जा रही दवाइयाँ।", "বর্তমানে যে ওষুধগুলি খান।"],
    ["Allergies", "एलर्जी", "অ্যালার্জি"],
    ["Known allergies or reactions.", "ज्ञात एलर्जी या प्रतिक्रियाएँ।", "পরিচিত অ্যালার্জি বা প্রতিক্রিয়া।"],
    ["Medical Reports", "चिकित्सा रिपोर्ट", "চিকিৎসার রিপোর্ট"],
    ["Prescriptions, labs, scans & discharge summaries.", "पर्चे, लैब रिपोर्ट, स्कैन और डिस्चार्ज सारांश।", "প্রেসক্রিপশন, ল্যাব রিপোর্ট, স্ক্যান ও ছাড়পত্রের সারাংশ।"],
    ["Drag & drop files here or click to browse", "फ़ाइलें यहाँ छोड़ें या चुनने के लिए क्लिक करें", "ফাইল এখানে টেনে আনুন অথবা বেছে নিতে ক্লিক করুন"],
    ["Drag & drop medical reports here", "चिकित्सा रिपोर्ट यहाँ छोड़ें", "চিকিৎসার রিপোর্ট এখানে টেনে আনুন"],
    ["or browse from your device", "या अपने डिवाइस से चुनें", "অথবা ডিভাইস থেকে বেছে নিন"],
    ["PDF · JPG · PNG · up to 20 MB each", "PDF · JPG · PNG · प्रत्येक अधिकतम 20 MB", "PDF · JPG · PNG · প্রতিটি সর্বোচ্চ ২০ MB"],
    ["PDF · JPG · PNG · Max 20 MB each", "PDF · JPG · PNG · प्रत्येक अधिकतम 20 MB", "PDF · JPG · PNG · প্রতিটি সর্বোচ্চ ২০ MB"],
    ["Choose Files", "फ़ाइलें चुनें", "ফাইল বেছে নিন"],
    ["Blood Test Report.pdf", "रक्त जाँच रिपोर्ट.pdf", "রক্ত পরীক্ষার রিপোর্ট.pdf"],
    ["2.4 MB · Uploaded", "2.4 MB · अपलोड किया गया", "২.৪ MB · আপলোড হয়েছে"],
    ["X-Ray Chest.jpg", "छाती का एक्स-रे.jpg", "বুকের এক্স-রে.jpg"],
    ["1.3 MB · Uploaded", "1.3 MB · अपलोड किया गया", "১.৩ MB · আপলোড হয়েছে"],
    ["Generated from patient information.", "रोगी की जानकारी से तैयार किया गया।", "রোগীর তথ্য থেকে তৈরি।"],
    ["🟢 78% Confidence", "🟢 78% विश्वास स्तर", "🟢 ৭৮% নির্ভরযোগ্যতা"],
    ["History", "इतिहास", "ইতিহাস"],
    ["Fever with body ache and headache since 2 days.", "दो दिनों से बुखार, बदन दर्द और सिरदर्द।", "দুই দিন ধরে জ্বর, শরীর ব্যথা ও মাথাব্যথা।"],
    ["Patient reports moderate fever with fatigue. Further clinical clarification required.", "रोगी को मध्यम बुखार और थकान है। आगे चिकित्सकीय जानकारी आवश्यक है।", "রোগীর মাঝারি জ্বর ও ক্লান্তি রয়েছে। আরও চিকিৎসাগত তথ্য প্রয়োজন।"],
    ["AI Observation", "एआई का अवलोकन", "এআই পর্যবেক্ষণ"],
    ["Pattern requires professional assessment. No diagnosis is established by this interface.", "इस स्थिति का स्वास्थ्य पेशेवर द्वारा आकलन आवश्यक है। यह इंटरफ़ेस निदान नहीं करता।", "এই অবস্থার স্বাস্থ্যকর্মীর মূল্যায়ন প্রয়োজন। এই ইন্টারফেস কোনো রোগ নির্ণয় করে না।"],
    ["Red Flags", "चेतावनी संकेत", "ঝুঁকির লক্ষণ"],
    ["✓ No immediate red flags entered.", "✓ कोई तात्कालिक चेतावनी संकेत दर्ज नहीं है।", "✓ তাৎক্ষণিক ঝুঁকির কোনো লক্ষণ নথিভুক্ত নেই।"],
    ["Pending verification.", "सत्यापन बाकी है।", "যাচাই বাকি।"],
    ["To be verified by physician.", "डॉक्टर द्वारा सत्यापित किया जाएगा।", "চিকিৎসক যাচাই করবেন।"],
    ["⚠️ This AI-generated summary must be reviewed and verified by a qualified healthcare professional before clinical use.", "⚠️ चिकित्सकीय उपयोग से पहले इस एआई सारांश की योग्य स्वास्थ्य पेशेवर से समीक्षा और पुष्टि आवश्यक है।", "⚠️ চিকিৎসায় ব্যবহারের আগে যোগ্য স্বাস্থ্যকর্মীকে এই এআই সারাংশ পর্যালোচনা ও যাচাই করতে হবে।"],
    ["⬇ Download", "⬇ डाउनलोड", "⬇ ডাউনলোড"],
    ["🖨 Print", "🖨 प्रिंट", "🖨 প্রিন্ট"],
    ["Send to Doctor →", "डॉक्टर को भेजें →", "ডাক্তারের কাছে পাঠান →"],
    ["Send to Doctor Review →", "डॉक्टर की समीक्षा के लिए भेजें →", "ডাক্তারের পর্যালোচনার জন্য পাঠান →"],
    ["Patient record journey", "रोगी के स्वास्थ्य रिकॉर्ड का क्रम", "রোগীর স্বাস্থ্য নথির ধারাবাহিকতা"],
    ["VIEW ALL", "सभी देखें", "সব দেখুন"],
    ["Blood Test", "रक्त जाँच", "রক্ত পরীক্ষা"],
    ["Complete Blood Count · 2023", "कम्प्लीट ब्लड काउंट · 2023", "কমপ্লিট ব্লাড কাউন্ট · ২০২৩"],
    ["Consultation", "परामर्श", "পরামর্শ"],
    ["General Medicine · 2023", "जनरल मेडिसिन · 2023", "জেনারেল মেডিসিন · ২০২৩"],
    ["X-Ray", "एक्स-रे", "এক্স-রে"],
    ["Chest X-Ray · 2024", "छाती का एक्स-रे · 2024", "বুকের এক্স-রে · ২০২৪"],
    ["Prescription", "दवा का पर्चा", "প্রেসক্রিপশন"],
    ["Medication record · 2024", "दवा रिकॉर्ड · 2024", "ওষুধের নথি · ২০২৪"],
    ["Current Intake", "वर्तमान इनटेक", "বর্তমান ইনটেক"],
    ["In progress · Today", "जारी · आज", "চলছে · আজ"],
    ["Intake Completion", "इनटेक पूरा", "ইনটেক সম্পন্ন"],
    ["Keep going!", "आगे बढ़ते रहें!", "এগিয়ে চলুন!"],
    ["Reports Uploaded", "अपलोड की गई रिपोर्ट", "আপলোড করা রিপোর্ট"],
    ["Documents", "दस्तावेज़", "নথি"],
    ["Information Captured", "दर्ज की गई जानकारी", "সংগৃহীত তথ্য"],
    ["65%", "65%", "৬৫%"],
    ["Good progress", "अच्छी प्रगति", "ভালো অগ্রগতি"],
    ["AI Confidence", "एआई विश्वास स्तर", "এআই নির্ভরযোগ্যতা"],
    ["78%", "78%", "৭৮%"],
    ["Moderate", "मध्यम", "মাঝারি"],
    ["Review Status", "समीक्षा की स्थिति", "পর্যালোচনার অবস্থা"],
    ["With Doctor", "डॉक्टर के पास", "ডাক্তারের কাছে"],
    ["© 2026 ChikitsaKendra AI · Smart Clinical Intake Assistant", "© 2026 ChikitsaKendra AI · स्मार्ट क्लिनिकल इनटेक सहायक", "© ২০২৬ ChikitsaKendra AI · স্মার্ট ক্লিনিক্যাল ইনটেক সহায়ক"],
    ["🔐 Privacy · Consent · Human-in-the-loop", "🔐 गोपनीयता · सहमति · मानवीय समीक्षा", "🔐 গোপনীয়তা · সম্মতি · মানবীয় পর্যালোচনা"],
    ["AI Patient Intake", "एआई रोगी इनटेक", "এআই রোগী ইনটেক"],
    ["Conversational history-taking with multilingual voice support.", "बहुभाषी आवाज़ के साथ संवादात्मक स्वास्थ्य जानकारी।", "বহুভাষিক ভয়েসসহ কথোপকথনের মাধ্যমে স্বাস্থ্যতথ্য সংগ্রহ।"],
    ["STEP 2 · IN PROGRESS", "चरण 2 · जारी", "ধাপ ২ · চলছে"],
    ["QUESTION 01", "प्रश्न 01", "প্রশ্ন ০১"],
    ["Tell us in your own words — or tap the microphone to speak.", "अपने शब्दों में बताएं — या बोलने के लिए माइक्रोफ़ोन दबाएं।", "নিজের ভাষায় বলুন — অথবা মাইক্রোফোনে ট্যাপ করে বলুন।"],
    ["Tap microphone to speak", "बोलने के लिए माइक्रोफ़ोन दबाएं", "বলতে মাইক্রোফোনে ট্যাপ করুন"],
    ["Save & Continue →", "सहेजें और आगे बढ़ें →", "সংরক্ষণ করে এগিয়ে যান →"],
    ["Structured information collected during intake.", "इनटेक के दौरान एकत्र की गई व्यवस्थित जानकारी।", "ইনটেকের সময় সংগৃহীত সাজানো তথ্য।"],
    ["PATIENT RECORD", "रोगी रिकॉर्ड", "রোগীর নথি"],
    ["Fever with body ache and headache.", "बुखार, बदन दर्द और सिरदर्द।", "জ্বর, শরীর ব্যথা ও মাথাব্যথা।"],
    ["Fever, headache, body ache.", "बुखार, सिरदर्द, बदन दर्द।", "জ্বর, মাথাব্যথা, শরীর ব্যথা।"],
    ["Not entered.", "दर्ज नहीं किया गया।", "লেখা হয়নি।"],
    ["Awaiting confirmation.", "पुष्टि बाकी है।", "নিশ্চিতকরণ বাকি।"],
    ["To be verified.", "सत्यापन किया जाएगा।", "যাচাই করা হবে।"],
    ["To be confirmed.", "पुष्टि की जाएगी।", "নিশ্চিত করা হবে।"],
    ["Medical Report Vault", "चिकित्सा रिपोर्ट संग्रह", "চিকিৎসার রিপোর্ট ভাণ্ডার"],
    ["Upload and organise previous reports.", "पुरानी रिपोर्ट अपलोड और व्यवस्थित करें।", "আগের রিপোর্ট আপলোড ও সাজান।"],
    ["STEP 3 · DOCUMENTS", "चरण 3 · दस्तावेज़", "ধাপ ৩ · নথি"],
    ["Human-reviewable clinical draft generated from patient input.", "रोगी की जानकारी से बना चिकित्सकीय मसौदा, जिसे स्वास्थ्यकर्मी जाँच सकते हैं।", "রোগীর তথ্য থেকে তৈরি চিকিৎসার খসড়া, যা স্বাস্থ্যকর্মী পর্যালোচনা করতে পারেন।"],
    ["Patient-provided history requires professional clarification.", "रोगी द्वारा दी गई जानकारी को स्वास्थ्य पेशेवर से स्पष्ट कराना आवश्यक है।", "রোগীর দেওয়া ইতিহাস স্বাস্থ্যকর্মীর মাধ্যমে স্পষ্ট করা প্রয়োজন।"],
    ["Patient-entered symptoms pending structured review.", "रोगी द्वारा दर्ज लक्षणों की व्यवस्थित समीक्षा बाकी है।", "রোগীর লেখা উপসর্গের পর্যালোচনা বাকি।"],
    ["Not available.", "उपलब्ध नहीं।", "পাওয়া যায়নি।"],
    ["Medications & Allergies", "दवाइयाँ और एलर्जी", "ওষুধ ও অ্যালার্জি"],
    ["Must be confirmed by clinician.", "चिकित्सक द्वारा पुष्टि आवश्यक है।", "চিকিৎসকের মাধ্যমে নিশ্চিত করতে হবে।"],
    ["⚠️ AI output is workflow support only and must not be treated as a diagnosis. All findings require clinician review.", "⚠️ एआई का सुझाव केवल कार्य-सहायता है, इसे निदान न मानें। सभी निष्कर्षों की चिकित्सक द्वारा समीक्षा आवश्यक है।", "⚠️ এআই ফলাফল কেবল কাজের সহায়তা, রোগ নির্ণয় নয়। সব তথ্য চিকিৎসককে পর্যালোচনা করতে হবে।"],
    ["Doctor Review Center", "डॉक्टर समीक्षा केंद्र", "ডাক্তার পর্যালোচনা কেন্দ্র"],
    ["Human-in-the-loop review of AI-generated clinical drafts.", "एआई द्वारा बनाए गए चिकित्सकीय मसौदों की मानवीय समीक्षा।", "এআই-তৈরি চিকিৎসার খসড়া মানুষের মাধ্যমে পর্যালোচনা।"],
    ["CLINICIAN VIEW", "चिकित्सक दृश्य", "চিকিৎসক ভিউ"],
    ["Clinician", "चिकित्सक", "চিকিৎসক"],
    ["Access Portal", "प्रवेश पोर्टल", "প্রবেশ পোর্টাল"],
    ["Secure sign-in for doctors and admin staff to review AI-generated patient summaries.", "डॉक्टरों और प्रशासकों के लिए एआई रोगी सारांश की समीक्षा हेतु सुरक्षित साइन-इन।", "এআই রোগীর সারাংশ পর্যালোচনার জন্য ডাক্তার ও প্রশাসকদের নিরাপদ সাইন-ইন।"],
    ["Review AI clinical drafts", "एआई चिकित्सकीय मसौदे की समीक्षा करें", "এআই চিকিৎসার খসড়া পর্যালোচনা করুন"],
    ["Manage patient queue", "रोगी कतार प्रबंधित करें", "রোগীর তালিকা পরিচালনা করুন"],
    ["Approve / reject summaries", "सारांश स्वीकार / अस्वीकार करें", "সারাংশ অনুমোদন / প্রত্যাখ্যান করুন"],
    ["View intake analytics", "इनटेक विश्लेषण देखें", "ইনটেক বিশ্লেষণ দেখুন"],
    ["🔐 Staff accounts provisioned by admin only", "🔐 कर्मचारी खाते केवल प्रशासक बना सकते हैं", "🔐 কর্মী অ্যাকাউন্ট শুধু প্রশাসক তৈরি করতে পারেন"],
    ["Welcome back, Doctor", "वापसी पर स्वागत है, डॉक्टर", "ফিরে আসায় স্বাগতম, ডাক্তার"],
    ["Sign in to access the review dashboard.", "समीक्षा डैशबोर्ड खोलने के लिए साइन इन करें।", "পর্যালোচনা ড্যাশবোর্ডে যেতে সাইন-ইন করুন।"],
    ["🩺 Doctor", "🩺 डॉक्टर", "🩺 ডাক্তার"],
    ["🛡 Admin", "🛡 प्रशासक", "🛡 প্রশাসক"],
    ["👩‍⚕️ Nurse", "👩‍⚕️ नर्स", "👩‍⚕️ নার্স"],
    ["Username or Staff ID", "उपयोगकर्ता नाम या कर्मचारी आईडी", "ব্যবহারকারীর নাম বা কর্মী আইডি"],
    ["Password", "पासवर्ड", "পাসওয়ার্ড"],
    ["Forgot password?", "पासवर्ड भूल गए?", "পাসওয়ার্ড ভুলে গেছেন?"],
    ["Sign in to Review Center →", "समीक्षा केंद्र में साइन इन करें →", "পর্যালোচনা কেন্দ্রে সাইন-ইন করুন →"],
    ["Recent Staff", "हाल के कर्मचारी", "সাম্প্রতিক কর্মী"],
    ["Doctor", "डॉक्टर", "ডাক্তার"],
    ["Online", "ऑनलाइन", "অনলাইন"],
    ["↩ Sign out", "↩ साइन आउट", "↩ সাইন-আউট"],
    ["Patient Queue", "रोगी कतार", "রোগীর তালিকা"],
    ["3 ACTIVE", "3 सक्रिय", "৩টি সক্রিয়"],
    ["AI summary ready", "एआई सारांश तैयार", "এআই সারাংশ প্রস্তুত"],
    ["Needs Review", "समीक्षा आवश्यक", "পর্যালোচনা প্রয়োজন"],
    ["Follow-up consultation", "अनुवर्ती परामर्श", "ফলো-আপ পরামর্শ"],
    ["Verified", "सत्यापित", "যাচাইকৃত"],
    ["Reports uploaded", "रिपोर्ट अपलोड की गईं", "রিপোর্ট আপলোড হয়েছে"],
    ["✓ Approve Current Draft", "✓ वर्तमान मसौदा स्वीकृत करें", "✓ বর্তমান খসড়া অনুমোদন করুন"],
    ["Review Checklist", "समीक्षा सूची", "পর্যালোচনার তালিকা"],
    ["Patient complaint captured", "रोगी की शिकायत दर्ज है", "রোগীর সমস্যা নথিভুক্ত হয়েছে"],
    ["Documents linked", "दस्तावेज़ जुड़े हैं", "নথি সংযুক্ত হয়েছে"],
    ["AI confidence score displayed", "एआई विश्वास स्तर दिखाया गया है", "এআই নির্ভরযোগ্যতার মাত্রা দেখানো হয়েছে"],
    ["Red-flag section visible", "चेतावनी संकेत अनुभाग दिख रहा है", "ঝুঁকির লক্ষণ বিভাগ দৃশ্যমান"],
    ["Doctor verification required", "डॉक्टर का सत्यापन आवश्यक है", "ডাক্তারের যাচাই প্রয়োজন"],
    ["⚠️ Doctor approval is mandatory before an AI draft enters the clinical workflow.", "⚠️ एआई मसौदे को चिकित्सकीय प्रक्रिया में शामिल करने से पहले डॉक्टर की स्वीकृति आवश्यक है।", "⚠️ এআই খসড়া চিকিৎসা প্রক্রিয়ায় যুক্ত করার আগে ডাক্তারের অনুমোদন আবশ্যক।"],
    ["Chronological view of consultations and health records.", "परामर्श और स्वास्थ्य रिकॉर्ड का कालानुक्रमिक दृश्य।", "পরামর্শ ও স্বাস্থ্য নথির কালানুক্রমিক দৃশ্য।"],
    ["Enter your latest measurements", "अपने नवीनतम माप दर्ज करें", "আপনার সাম্প্রতিক পরিমাপ লিখুন"],
    ["TEMPERATURE", "तापमान", "তাপমাত্রা"],
    ["BLOOD PRESSURE", "रक्तचाप", "রক্তচাপ"],
    ["HEART RATE", "हृदय गति", "হৃদস্পন্দন"],
    ["OXYGEN SATURATION (SpO₂)", "ऑक्सीजन संतृप्ति (SpO₂)", "অক্সিজেন স্যাচুরেশন (SpO₂)"],
    ["WEIGHT", "वज़न", "ওজন"],
    ["HEIGHT", "लंबाई", "উচ্চতা"],
    ["BLOOD GLUCOSE", "रक्त शर्करा", "রক্তে গ্লুকোজ"],
    ["MEASURED DATE", "माप की तारीख", "পরিমাপের তারিখ"],
    ["ADDITIONAL NOTES", "अतिरिक्त टिप्पणी", "অতিরিক্ত নোট"],
    ["Cancel", "रद्द करें", "বাতিল"],
    ["Save Vitals ✓", "महत्वपूर्ण संकेत सहेजें ✓", "গুরুত্বপূর্ণ লক্ষণ সংরক্ষণ করুন ✓"],
    ["Past illnesses, surgeries & family history", "पिछली बीमारियाँ, सर्जरी और पारिवारिक इतिहास", "আগের অসুস্থতা, অস্ত্রোপচার ও পারিবারিক ইতিহাস"],
    ["PAST ILLNESSES", "पिछली बीमारियाँ", "আগের অসুস্থতা"],
    ["PAST SURGERIES / PROCEDURES", "पिछली सर्जरी / प्रक्रियाएँ", "আগের অস্ত্রোপচার / প্রক্রিয়া"],
    ["CHRONIC CONDITIONS", "दीर्घकालिक स्थितियाँ", "দীর্ঘস্থায়ী রোগ"],
    ["Diabetes", "मधुमेह", "ডায়াবেটিস"],
    ["Hypertension", "उच्च रक्तचाप", "উচ্চ রক্তচাপ"],
    ["Asthma", "अस्थमा", "হাঁপানি"],
    ["Heart Disease", "हृदय रोग", "হৃদরোগ"],
    ["Thyroid Disorder", "थायरॉइड विकार", "থাইরয়েডের সমস্যা"],
    ["Kidney Disease", "गुर्दे की बीमारी", "কিডনির রোগ"],
    ["Liver Disease", "यकृत की बीमारी", "যকৃতের রোগ"],
    ["Epilepsy", "मिर्गी", "মৃগী"],
    ["FAMILY HISTORY", "पारिवारिक इतिहास", "পারিবারিক ইতিহাস"],
    ["SMOKING STATUS", "धूम्रपान की स्थिति", "ধূমপানের অবস্থা"],
    ["Select…", "चुनें…", "নির্বাচন করুন…"],
    ["Never", "कभी नहीं", "কখনও নয়"],
    ["Former (quit)", "पहले करते थे (छोड़ दिया)", "আগে করতেন (ছেড়েছেন)"],
    ["Current smoker", "वर्तमान में धूम्रपान करते हैं", "বর্তমানে ধূমপান করেন"],
    ["ALCOHOL", "शराब", "অ্যালকোহল"],
    ["None", "नहीं", "নেই"],
    ["Occasional", "कभी-कभी", "মাঝেমধ্যে"],
    ["Regular", "नियमित", "নিয়মিত"],
    ["Save History ✓", "इतिहास सहेजें ✓", "ইতিহাস সংরক্ষণ করুন ✓"],
    ["Current Medications", "वर्तमान दवाइयाँ", "বর্তমান ওষুধ"],
    ["Medicines you are currently taking", "वर्तमान में ली जा रही दवाइयाँ", "বর্তমানে যে ওষুধগুলি খাচ্ছেন"],
    ["MEDICINE NAME", "दवा का नाम", "ওষুধের নাম"],
    ["DOSAGE & FREQUENCY", "खुराक और आवृत्ति", "মাত্রা ও ব্যবহারের সময়"],
    ["+ Add another medicine", "+ एक और दवा जोड़ें", "+ আরেকটি ওষুধ যোগ করুন"],
    ["VITAMINS / SUPPLEMENTS", "विटामिन / सप्लीमेंट", "ভিটামিন / সাপ্লিমেন্ট"],
    ["NOTES FOR DOCTOR", "डॉक्टर के लिए टिप्पणी", "ডাক্তারের জন্য নোট"],
    ["Save Medications ✓", "दवाइयाँ सहेजें ✓", "ওষুধ সংরক্ষণ করুন ✓"],
    ["Allergies & Reactions", "एलर्जी और प्रतिक्रियाएँ", "অ্যালার্জি ও প্রতিক্রিয়া"],
    ["Known allergies to medicines, foods or substances", "दवाइयों, खाद्य पदार्थों या अन्य चीज़ों से ज्ञात एलर्जी", "ওষুধ, খাবার বা অন্য কিছুর পরিচিত অ্যালার্জি"],
    ["DRUG ALLERGIES — type and press Enter", "दवा से एलर्जी — लिखें और Enter दबाएँ", "ওষুধে অ্যালার্জি — লিখে Enter চাপুন"],
    ["FOOD ALLERGIES — type and press Enter", "खाद्य एलर्जी — लिखें और Enter दबाएँ", "খাবারে অ্যালার্জি — লিখে Enter চাপুন"],
    ["ENVIRONMENTAL ALLERGIES — type and press Enter", "पर्यावरणीय एलर्जी — लिखें और Enter दबाएँ", "পরিবেশগত অ্যালার্জি — লিখে Enter চাপুন"],
    ["REACTION DESCRIPTION", "प्रतिक्रिया का विवरण", "প্রতিক্রিয়ার বিবরণ"],
    ["Save Allergies ✓", "एलर्जी सहेजें ✓", "অ্যালার্জি সংরক্ষণ করুন ✓"],
    ["🔔 Notifications", "🔔 सूचनाएँ", "🔔 বিজ্ঞপ্তি"],
    ["Mark all read", "सभी को पढ़ा हुआ चिह्नित करें", "সব পড়া হিসেবে চিহ্নিত করুন"],
    ["Vitals Not Updated", "महत्वपूर्ण संकेत अपडेट नहीं हैं", "গুরুত্বপূর্ণ লক্ষণ আপডেট হয়নি"],
    ["Please enter your latest vitals before your upcoming checkup.", "आगामी जाँच से पहले अपने नवीनतम महत्वपूर्ण संकेत दर्ज करें।", "আসন্ন চেকআপের আগে সাম্প্রতিক গুরুত্বপূর্ণ লক্ষণ লিখুন।"],
    ["Now", "अभी", "এখন"],
    ["Medical History Pending", "चिकित्सा इतिहास बाकी है", "চিকিৎসার ইতিহাস বাকি"],
    ["Your medical history section is incomplete.", "आपका चिकित्सा इतिहास अनुभाग अधूरा है।", "আপনার চিকিৎসার ইতিহাসের অংশটি অসম্পূর্ণ।"],
    ["5m ago", "5 मिनट पहले", "৫ মিনিট আগে"],
    ["Medications List Empty", "दवाइयों की सूची खाली है", "ওষুধের তালিকা খালি"],
    ["Add your current medications for your doctor to review.", "डॉक्टर की समीक्षा के लिए अपनी वर्तमान दवाइयाँ जोड़ें।", "ডাক্তারের পর্যালোচনার জন্য বর্তমান ওষুধ যোগ করুন।"],
    ["10m ago", "10 मिनट पहले", "১০ মিনিট আগে"],
    ["Allergy Info Missing", "एलर्जी की जानकारी नहीं है", "অ্যালার্জির তথ্য নেই"],
    ["Please list any known allergies before your appointment.", "अपनी मुलाक़ात से पहले ज्ञात एलर्जी दर्ज करें।", "সাক্ষাতের আগে পরিচিত অ্যালার্জিগুলি লিখুন।"],
    ["15m ago", "15 मिनट पहले", "১৫ মিনিট আগে"],
    ["📋 Reminder: Update your health card before your checkup!", "📋 याद दिलाना: जाँच से पहले अपना स्वास्थ्य कार्ड अपडेट करें!", "📋 মনে করিয়ে দিচ্ছি: চেকআপের আগে স্বাস্থ্য কার্ড আপডেট করুন!"],
    ["Example: I have had fever and headache for two days…", "उदाहरण: मुझे दो दिनों से बुखार और सिरदर्द है…", "উদাহরণ: আমার দুই দিন ধরে জ্বর ও মাথাব্যথা…"],
    ["e.g. 98.6°F or 37°C", "जैसे 98.6°F या 37°C", "যেমন 98.6°F বা 37°C"],
    ["e.g. 120/80 mmHg", "जैसे 120/80 mmHg", "যেমন 120/80 mmHg"],
    ["e.g. 72 bpm", "जैसे 72 bpm", "যেমন 72 bpm"],
    ["e.g. 98%", "जैसे 98%", "যেমন 98%"],
    ["e.g. 70 kg", "जैसे 70 kg", "যেমন 70 kg"],
    ["e.g. 170 cm", "जैसे 170 cm", "যেমন 170 cm"],
    ["e.g. 95 mg/dL (fasting)", "जैसे 95 mg/dL (खाली पेट)", "যেমন 95 mg/dL (খালি পেটে)"],
    ["Any other observations…", "अन्य टिप्पणी…", "অন্য কোনো পর্যবেক্ষণ…"],
    ["e.g. Diabetes (2018), Hypertension (2020)…", "जैसे मधुमेह (2018), उच्च रक्तचाप (2020)…", "যেমন ডায়াবেটিস (২০১৮), উচ্চ রক্তচাপ (২০২০)…"],
    ["e.g. Appendectomy (2015), Knee surgery (2019)…", "जैसे अपेंडिक्स सर्जरी (2015), घुटने की सर्जरी (2019)…", "যেমন অ্যাপেন্ডিক্স অস্ত্রোপচার (২০১৫), হাঁটুর অস্ত্রোপচার (২০১৯)…"],
    ["e.g. Father: Diabetes, Mother: Hypertension…", "जैसे पिता: मधुमेह, माता: उच्च रक्तचाप…", "যেমন বাবা: ডায়াবেটিস, মা: উচ্চ রক্তচাপ…"],
    ["e.g. Metformin 500mg", "जैसे Metformin 500mg", "যেমন Metformin 500mg"],
    ["e.g. Twice daily after meals", "जैसे भोजन के बाद दिन में दो बार", "যেমন খাবারের পর দিনে দুবার"],
      ["e.g. Amlodipine 5mg", "जैसे Amlodipine 5mg", "যেমন Amlodipine 5mg"],
      ["e.g. Once daily at night", "जैसे रात में दिन में एक बार", "যেমন রাতে দিনে একবার"],
    ["e.g. Vitamin D, Iron tablets…", "जैसे विटामिन D, आयरन की गोलियाँ…", "যেমন ভিটামিন D, আয়রন ট্যাবলেট…"],
    ["Any concerns about your current medicines…", "अपनी वर्तमान दवाइयों से जुड़ी कोई चिंता…", "বর্তমান ওষুধ নিয়ে কোনো উদ্বেগ…"],
    ["e.g. Penicillin, Sulfa…", "जैसे Penicillin, Sulfa…", "যেমন Penicillin, Sulfa…"],
    ["e.g. Peanuts, Shellfish, Dairy…", "जैसे मूँगफली, शंख-शुक्ति, डेयरी…", "যেমন চিনাবাদাম, শামুক-ঝিনুক, দুগ্ধজাত খাবার…"],
    ["e.g. Dust, Pollen, Pet hair…", "जैसे धूल, परागकण, पालतू जानवरों के बाल…", "যেমন ধুলো, পরাগরেণু, পোষা প্রাণীর লোম…"],
    ["Describe the reaction experienced (e.g. rash, swelling, anaphylaxis)…", "हुई प्रतिक्रिया बताएं (जैसे चकत्ते, सूजन, गंभीर एलर्जी)…", "কী প্রতিক্রিয়া হয়েছিল লিখুন (যেমন ফুসকুড়ি, ফোলা, অ্যানাফাইল্যাক্সিস)…"],
    ["Toggle dark mode", "डार्क मोड बदलें", "ডার্ক মোড বদলান"],
    ["Dr. R. Sharma", "डॉ. आर. शर्मा", "ডা. আর. শর্মা"],
    ["Dr. K. Mehta", "डॉ. के. मेहता", "ডা. কে. মেহতা"],
    ["Dr. A. Patel", "डॉ. ए. पटेल", "ডা. এ. প্যাটেল"],
    ["Language preference saved: English", "भाषा प्राथमिकता सहेजी गई: English", "ভাষার পছন্দ সংরক্ষিত: English"],
    ["Language preference saved: हिंदी", "भाषा प्राथमिकता सहेजी गई: हिंदी", "ভাষার পছন্দ সংরক্ষিত: हिंदी"],
    ["Language preference saved: বাংলা", "ভাষার পছন্দ সংরক্ষিত: বাংলা", "ভাষার পছন্দ সংরক্ষিত: বাংলা"],
    ["Language changed to English", "भाषा बदली गई: English", "ভাষা পরিবর্তন করা হয়েছে: English"],
    ["Language changed to हिंदी", "भाषा बदली गई: हिंदी", "ভাষা পরিবর্তন করা হয়েছে: हिंदी"],
    ["Language changed to বাংলা", "भाषा बदली गई: বাংলা", "ভাষা পরিবর্তন করা হয়েছে: বাংলা"],
    ["Interface language: English", "इंटरफ़ेस भाषा: English", "ইন্টারফেসের ভাষা: English"],
    ["Interface language: हिंदी", "इंटरफ़ेस भाषा: हिंदी", "ইন্টারফেসের ভাষা: हिंदी"],
    ["Interface language: বাংলা", "ইন্টারफ़ेस भाषा: বাংলা", "ইন্টারফেসের ভাষা: বাংলা"],
    ["Please describe your main problem first.", "पहले अपनी मुख्य समस्या बताएं।", "আগে আপনার প্রধান সমস্যাটি বর্ণনা করুন।"],
    ["Database session is not ready yet. Please try again.", "डेटाबेस सत्र तैयार नहीं है। कृपया फिर से कोशिश करें।", "ডেটাবেস সেশন প্রস্তুত নয়। আবার চেষ্টা করুন।"],
    ["Database session is not ready yet.", "डेटाबेस सत्र तैयार नहीं है।", "ডেটাবেস সেশন প্রস্তুত নয়।"],
    ["✓ Intake saved to MySQL.", "✓ इनटेक MySQL में सहेजा गया।", "✓ ইনটেক MySQL-এ সংরক্ষিত হয়েছে।"],
    ["✓ Consent recorded securely in MySQL.", "✓ सहमति MySQL में सुरक्षित रूप से दर्ज की गई।", "✓ সম্মতি MySQL-এ নিরাপদে নথিভুক্ত হয়েছে।"],
    ["✓ Patient summary sent to the doctor review queue.", "✓ रोगी का सारांश डॉक्टर की समीक्षा कतार में भेजा गया।", "✓ রোগীর সারাংশ ডাক্তারের পর্যালোচনা তালিকায় পাঠানো হয়েছে।"],
    ["Enter a username and password.", "उपयोगकर्ता नाम और पासवर्ड दर्ज करें।", "ব্যবহারকারীর নাম ও পাসওয়ার্ড লিখুন।"],
    ["No reviews in the queue.", "कतार में कोई समीक्षा नहीं है।", "তালিকায় কোনো পর্যালোচনা নেই।"],
    ["Contact your administrator to reset your password.", "पासवर्ड रीसेट करने के लिए प्रशासक से संपर्क करें।", "পাসওয়ার্ড রিসেট করতে প্রশাসকের সঙ্গে যোগাযোগ করুন।"],
    ["Draft approved in prototype mode.", "प्रोटोटाइप मोड में मसौदा स्वीकृत हुआ।", "প্রোটোটাইপ মোডে খসড়া অনুমোদিত হয়েছে।"],
    ["⚠️ Fill at least one vital field.", "⚠️ महत्वपूर्ण संकेत का कम-से-कम एक फ़ील्ड भरें।", "⚠️ গুরুত্বপূর্ণ লক্ষণের অন্তত একটি ঘর পূরণ করুন।"],
    ["Recorded", "दर्ज किया गया", "নথিভুক্ত"],
    ["✅ Vitals saved!", "✅ महत्वपूर्ण संकेत सहेजे गए!", "✅ গুরুত্বপূর্ণ লক্ষণ সংরক্ষিত হয়েছে!"],
    ["⚠️ Fill at least one history field.", "⚠️ इतिहास का कम-से-कम एक फ़ील्ड भरें।", "⚠️ ইতিহাসের অন্তত একটি ঘর পূরণ করুন।"],
    ["✅ Medical history saved!", "✅ चिकित्सा इतिहास सहेजा गया!", "✅ চিকিৎসার ইতিহাস সংরক্ষিত হয়েছে!"],
    ["⚠️ Add at least one medicine.", "⚠️ कम-से-कम एक दवा जोड़ें।", "⚠️ অন্তত একটি ওষুধ যোগ করুন।"],
    ["✅ Medications saved!", "✅ दवाइयाँ सहेजी गईं!", "✅ ওষুধ সংরক্ষিত হয়েছে!"],
    ["⚠️ Type an allergy and press Enter to add.", "⚠️ एलर्जी लिखें और जोड़ने के लिए Enter दबाएँ।", "⚠️ অ্যালার্জি লিখে যোগ করতে Enter চাপুন।"],
    ["✅ Allergies saved!", "✅ एलर्जी सहेजी गई!", "✅ অ্যালার্জি সংরক্ষিত হয়েছে!"],
    ["All notifications marked as read.", "सभी सूचनाएँ पढ़ी हुई चिह्नित की गईं।", "সব বিজ্ঞপ্তি পড়া হিসেবে চিহ্নিত হয়েছে।"],
    ["Voice captured ✓", "आवाज़ दर्ज की गई ✓", "কণ্ঠস্বর রেকর্ড হয়েছে ✓"],
    ["Voice captured successfully.", "आवाज़ सफलतापूर्वक दर्ज की गई।", "কণ্ঠস্বর সফলভাবে রেকর্ড হয়েছে।"],
    ["Demo voice interaction completed.", "डेमो वॉइस प्रक्रिया पूरी हुई।", "ডেমো ভয়েস প্রক্রিয়া সম্পন্ন হয়েছে।"],
    ["Voice recognition is not supported by this browser.", "यह ब्राउज़र वॉइस पहचान का समर्थन नहीं करता।", "এই ব্রাউজারে ভয়েস শনাক্তকরণ সমর্থিত নয়।"],
    ["Voice input is not supported in this browser.", "इस ब्राउज़र में वॉइस इनपुट समर्थित नहीं है।", "এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়।"],
    ["Voice capture unavailable.", "आवाज़ दर्ज नहीं हो सकी।", "কণ্ঠস্বর রেকর্ড করা যায়নি।"],
    ["Patient response saved successfully.", "रोगी का जवाब सफलतापूर्वक सहेजा गया।", "রোগীর উত্তর সফলভাবে সংরক্ষিত হয়েছে।"],
    ["Consent recorded for this session.", "इस सत्र के लिए सहमति दर्ज की गई।", "এই সেশনের সম্মতি নথিভুক্ত হয়েছে।"],
    ["Emergency workflow activated. Seek immediate professional help.", "आपातकालीन प्रक्रिया शुरू हुई। तुरंत स्वास्थ्य पेशेवर से सहायता लें।", "জরুরি প্রক্রিয়া শুরু হয়েছে। অবিলম্বে স্বাস্থ্যকর্মীর সাহায্য নিন।"],
    ["Allow pop-ups to print.", "प्रिंट करने के लिए पॉप-अप की अनुमति दें।", "প্রিন্ট করতে পপ-আপ অনুমতি দিন।"],
    ["Please allow pop-ups to print.", "प्रिंट करने के लिए पॉप-अप की अनुमति दें।", "প্রিন্ট করতে পপ-আপ অনুমতি দিন।"],
    ["pending", "लंबित", "অপেক্ষমাণ"],
    ["in_review", "समीक्षा जारी", "পর্যালোচনা চলছে"],
    ["approved", "स्वीकृत", "অনুমোদিত"],
    ["rejected", "अस्वीकृत", "প্রত্যাখ্যাত"],
    ["Start review", "समीक्षा शुरू करें", "পর্যালোচনা শুরু করুন"],
    ["Approve", "स्वीकृत करें", "অনুমোদন করুন"],
    ["Reject", "अस्वीकार करें", "প্রত্যাখ্যান করুন"],
    ["document(s) selected.", "दस्तावेज़ चुने गए।", "টি নথি বেছে নেওয়া হয়েছে।"],
      ["report(s) saved to MySQL.", "रिपोर्ट MySQL में सहेजी गईं।", "টি রিপোর্ট MySQL-এ সংরক্ষিত হয়েছে।"],
    ["Your data is encrypted & secure", "आपका डेटा एन्क्रिप्टेड और सुरक्षित है", "আপনার তথ্য এনক্রিপ্ট করা ও সুরক্ষিত"],
    ["📋 Health Card Reminder", "📋 स्वास्थ्य कार्ड अनुस्मारक", "📋 স্বাস্থ্য কার্ডের অনুস্মারক"],
    ["Your checkup is approaching — please update your Vitals, Medical History, Medications & Allergies before you arrive.", "आपकी जाँच नजदीक है — आने से पहले अपने महत्वपूर्ण संकेत, चिकित्सा इतिहास, दवाइयाँ और एलर्जी अपडेट करें।", "আপনার চেকআপ এগিয়ে আসছে — আসার আগে গুরুত্বপূর্ণ লক্ষণ, চিকিৎসার ইতিহাস, ওষুধ ও অ্যালার্জি আপডেট করুন।"],
    ["Update Now", "अभी अपडेट करें", "এখনই আপডেট করুন"],
    ["🤖 AI-Assisted Patient History · Digital Health", "🤖 एआई-सहायता प्राप्त रोगी इतिहास · डिजिटल स्वास्थ्य", "🤖 এআই-সহায়তায় রোগীর ইতিহাস · ডিজিটাল স্বাস্থ্য"],
    ["🤖 AI Summary", "🤖 एआई सारांश", "🤖 এআই সারাংশ"],
    ["Consent & Privacy", "सहमति और गोपनीयता", "সম্মতি ও গোপনীয়তা"],
    ["AI Clinical Summary", "एआई क्लिनिकल सारांश", "এআই ক্লিনিক্যাল সারাংশ"],
    ["AI Clinical Summary — Draft for Doctor Review", "एआई क्लिनिकल सारांश — डॉक्टर की समीक्षा के लिए मसौदा", "এআই ক্লিনিক্যাল সারাংশ — ডাক্তারের পর্যালোচনার খসড়া"],
    ["🔐 Encrypted · Human-in-the-loop", "🔐 एन्क्रिप्टेड · मानवीय समीक्षा", "🔐 এনক্রিপ্ট করা · মানবীয় পর্যালোচনা"],
    ["ChikitsaKendra AI | Digital Healthcare", "ChikitsaKendra AI | डिजिटल स्वास्थ्य", "ChikitsaKendra AI | ডিজিটাল স্বাস্থ্য"],
    ["ChikitsaKendra AI Summary", "ChikitsaKendra AI सारांश", "ChikitsaKendra AI সারাংশ"]
  ];

  const phraseMaps = {
    "हिंदी": new Map(entries.map(([english, hindi]) => [english.replace(/\s+/g, " ").trim(), hindi])),
    "বাংলা": new Map(entries.map(([english, _hindi, bengali]) => [english.replace(/\s+/g, " ").trim(), bengali]))
  };
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  let activeLanguage = "English";
  let updateQueued = false;

  function normalized(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  
  function translatedValue(value, translations) {
    const key = normalized(value);
    if (translations.has(key)) return translations.get(key);
    const fileSelection = key.match(/^(\d+) document\(s\) selected\.$/);
    if (fileSelection) return `${fileSelection[1]} ${translations.get("document(s) selected.") || key}`;
    const reportSave = key.match(/^✓ (\d+) report\(s\) saved to MySQL\.$/);
    if (reportSave) return `✓ ${reportSave[1]} ${translations.get("report(s) saved to MySQL.") || key}`;
    const printSubtitle = key.match(/^AI Clinical Summary — Draft for Doctor Review(?: · (.+))?$/);
    if (printSubtitle) {
      const translated = translations.get("AI Clinical Summary — Draft for Doctor Review");
      if (translated) return `${translated}${printSubtitle[1] ? ` · ${printSubtitle[1]}` : ""}`;
    }
    return null;
  }

  function translateTextNode(node, translations) {
    let record = textSources.get(node);
    if (!record) {
      record = { source: node.nodeValue, rendered: node.nodeValue };
      textSources.set(node, record);
    } else if (node.nodeValue !== record.rendered) {
      record.source = node.nodeValue;
    }

    const match = record.source.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return;
    const translated = translatedValue(match[2], translations) || match[2];
    const output = `${match[1]}${translated}${match[3]}`;
    if (node.nodeValue !== output) node.nodeValue = output;
    record.rendered = output;

    const option = node.parentElement?.tagName === "OPTION" ? node.parentElement : null;
    if (option && !option.hasAttribute("value") && !option.dataset.translationValue) {
      option.value = normalized(record.source);
      option.dataset.translationValue = "true";
    }
  }

  function translateAttribute(element, name, translations) {
    let attributes = attributeSources.get(element);
    if (!attributes) {
      attributes = new Map();
      attributeSources.set(element, attributes);
    }
    const current = element.getAttribute(name);
    if (current === null) return;
    let record = attributes.get(name);
    if (!record) {
      record = { source: current, rendered: current };
      attributes.set(name, record);
    } else if (current !== record.rendered) {
      record.source = current;
    }
    const translated = translations.get(normalized(record.source)) || record.source;
    if (current !== translated) element.setAttribute(name, translated);
    record.rendered = translated;
  }

  function applyTranslations(language = activeLanguage) {
    activeLanguage = phraseMaps[language] ? language : "English";
    document.documentElement.lang = activeLanguage === "हिंदी" ? "hi" : activeLanguage === "বাংলা" ? "bn" : "en";
    const translations = phraseMaps[activeLanguage] || new Map();
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (["SCRIPT", "STYLE"].includes(node.parentElement?.tagName)) continue;
      translateTextNode(node, translations);
    }
    document.querySelectorAll("[placeholder], [title], [aria-label]").forEach(element => {
      ["placeholder", "title", "aria-label"].forEach(name => translateAttribute(element, name, translations));
    });
    document.querySelectorAll(".lang-group button").forEach(button => {
      button.classList.toggle("active", button.textContent.trim() === activeLanguage);
    });
    return activeLanguage;
  }

  window.applyTranslations = applyTranslations;

  const observer = new MutationObserver(() => {
    if (updateQueued) return;
    updateQueued = true;
    queueMicrotask(() => {
      updateQueued = false;
      applyTranslations(activeLanguage);
    });
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"]
  });
})();