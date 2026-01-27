export const MESSAGES = {
  // Form Title
  formTitle: "MP BOARD क्लास 12 | मॉडल पेपर और उत्तर अपलोड फॉर्म (Arivihan)",

  // Global Instructions
  globalInstructions: `यह फ़ॉर्म MP Board Class 12 के विद्यार्थियों के लिए है जो अपने मॉडल पेपर या उत्तर की जाँच करवाना चाहते हैं।

कृपया फ़ॉर्म भरते समय निम्न निर्देशों का पालन करें:

1. अपना पूरा नाम और Application Number सही-सही दर्ज करें।

2. सही विषय (Subject) का चयन करें, जिस विषय का उत्तर आप अपलोड कर रहे हैं।

3. उत्तर अपने हाथ से लिखा हुआ होना चाहिए।

4. उत्तर की तस्वीर साफ़, सीधी और पूरी दिखनी चाहिए।

5. धुंधली (blur) या कटी हुई तस्वीरें स्वीकार नहीं की जाएँगी।

6. एक से अधिक पेज होने पर सभी पेज सही क्रम में अपलोड करें।

गलत जानकारी या गलत विषय चयन की स्थिति में उत्तर की जाँच नहीं की जाएगी।`,

  // Section Labels
  studentInfoSection: "Student Information / विद्यार्थी जानकारी",
  submissionTypeSection: "आप क्या सबमिट करना चाहते हैं? / What do you want to submit?",
  subjectSelectionSection: "विषय चुनें / Select Subjects",

  // Field Labels
  studentName: "Student Name / छात्र का नाम",
  mobileNumber: "Mobile Number / मोबाइल नंबर",
  mediumOfStudy: "Medium of Study / अध्ययन का माध्यम",
  mediumHindi: "हिन्दी (Hindi)",
  mediumEnglish: "अंग्रेज़ी (English)",
  admitCardNumber: "Admit Card Number / प्रवेश पत्र क्रमांक",
  admitCardUpload: "Admit Card Upload / प्रवेश पत्र अपलोड करें",

  // Placeholders
  studentNamePlaceholder: "अपना पूरा नाम लिखें",
  mobileNumberPlaceholder: "10 अंकों का मोबाइल नंबर",
  admitCardNumberPlaceholder: "अपना Admit Card Number लिखें",

  // Submission Types
  arivihan_model_paper: "Arivihan मॉडल पेपर का Answers (Arivihan Model Paper Answers)",
  own_question_paper: "अपना खुद का प्रश्न / प्रश्नपत्र (My Own Question / Question Paper)",

  // Instructions based on submission type
  arivihanInstructions: `📌 निर्देश:
• आप अधिकतम 3 विषयों की कॉपी अपलोड कर सकते हैं।
• जिस विषय की कॉपी अपलोड करनी है, उसे ✓ चुनें।
• चुनने के बाद फाइल अपलोड का ऑप्शन दिखेगा।
• आप या तो 1 PDF (अधिकतम 25 MB) या 10 Images (JPG/PNG) अपलोड कर सकते हैं।

📌 Instructions:
• You can upload copies for maximum 3 subjects.
• Select ✓ the subject for which you want to upload.
• File upload option will appear after selection.
• You can upload either 1 PDF (max 25 MB) OR up to 10 Images (JPG/PNG).`,

  ownInstructions: `📌 निर्देश:
यदि आपने हमारा मॉडल पेपर हल नहीं किया है और आप अपने किसी भी प्रश्न का उत्तर अपलोड करना चाहते हैं, तो यहाँ अपलोड करें।

1. Question Number या Chapter सही से लिखें।
2. उत्तर की साफ़ और स्पष्ट तस्वीर अपलोड करें।
3. आप या तो 1 PDF (अधिकतम 25 MB) या 10 Images (JPG/PNG) अपलोड कर सकते हैं।
4. हर प्रश्न के लिए एक ही file अपलोड करें।

📌 Instructions:
• You can upload copy for only 1 subject.
• Select ✓ the subject for which you want to upload.
• You can upload either 1 PDF (max 25 MB) OR up to 10 Images (JPG/PNG).`,

  // Error Messages
  errors: {
    nameRequired: "कृपया अपना नाम भरें / Please enter your name",
    nameMinLength: "नाम कम से कम 2 अक्षर का होना चाहिए / Name must be at least 2 characters",
    nameMaxLength: "नाम 100 अक्षरों से अधिक नहीं होना चाहिए / Name cannot exceed 100 characters",
    mobileRequired: "कृपया मोबाइल नंबर भरें / Please enter mobile number",
    mobileInvalid: "कृपया सही 10 अंकों का मोबाइल नंबर भरें / Please enter valid 10-digit mobile number",
    mediumRequired: "कृपया अध्ययन का माध्यम चुनें / Please select medium of study",
    admitCardRequired: "कृपया Admit Card Number भरें या Admit Card की फोटो अपलोड करें / Please enter Admit Card Number or upload Admit Card photo",
    submissionTypeRequired: "कृपया सबमिशन प्रकार चुनें / Please select submission type",
    subjectRequired: "कम से कम 1 विषय चुनें / Select at least 1 subject",
    fileRequired: "चुने गए विषय की फाइल अपलोड करें / Upload file for selected subject",
    maxSubjectsArivihan: "आप अधिकतम 3 विषय ही चुन सकते हैं / You can select maximum 3 subjects",
    maxSubjectsOwn: "आप केवल 1 विषय चुन सकते हैं / You can select only 1 subject",
    pdfTooLarge: "PDF फाइल का साइज़ 25 MB से कम होना चाहिए / PDF file size should be less than 25 MB",
    imageTooLarge: "Image का साइज़ 5 MB से कम होना चाहिए / Image size should be less than 5 MB",
    maxImagesExceeded: "आप अधिकतम 10 Images ही अपलोड कर सकते हैं / Maximum 10 images can be uploaded",
    invalidFileType: "केवल JPG, PNG, PDF फाइल अपलोड करें / Only JPG, PNG, PDF files allowed",
    mixedFileTypes: "एक विषय में PDF और Images दोनों अपलोड नहीं कर सकते / Cannot upload both PDF and images for same subject",
    admitCardTooLarge: "Admit Card फाइल का साइज़ 5 MB से कम होना चाहिए / Admit Card file size should be less than 5 MB",
    uploadFailed: "फाइल अपलोड में समस्या, कृपया पुनः प्रयास करें / File upload failed, please try again",
    serverError: "सर्वर में समस्या, कृपया बाद में प्रयास करें / Server error, please try again later",
  },

  // Success Messages
  success: {
    title: "फॉर्म सफलतापूर्वक जमा हो गया!",
    subtitle: "Form submitted successfully!",
    submissionIdLabel: "आपका Submission ID:",
    submittedSubjectsLabel: "जमा किए गए विषय:",
    thankYou: "आपकी कॉपी जल्द ही चेक की जाएगी। धन्यवाद!",
    thankYouEn: "Your copy will be checked soon. Thank you!",
  },

  // Duplicate Error Messages
  duplicate: {
    title: "फॉर्म पहले ही जमा हो चुका है!",
    titleEn: "Form already submitted!",
    message: "इस मोबाइल नंबर से पहले ही फॉर्म जमा किया जा चुका है।",
    messageEn: "Form has already been submitted with this mobile number.",
    previousIdLabel: "पिछला Submission ID:",
    previousDateLabel: "जमा करने की तारीख:",
    contactMessage: "यदि कोई समस्या है तो कृपया हमसे संपर्क करें।",
    contactMessageEn: "If you have any issues, please contact us.",
  },

  // UI Labels
  submit: "Submit / जमा करें",
  submitting: "Submitting... / जमा हो रहा है...",
  uploadPdf: "PDF अपलोड करें",
  uploadImages: "Images अपलोड करें",
  selectedSubjects: "चुने गए विषय:",
  imagesUploaded: "अपलोड की गई Images:",
  clearSelection: "आपका पिछला चयन हटा दिया गया है / Your previous selection has been cleared",
  close: "बंद करें / Close",
  submitAnother: "नया फॉर्म भरें / Submit Another Form",
};
