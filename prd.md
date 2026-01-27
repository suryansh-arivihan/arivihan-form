# 📋 Arivihan Copy Checking Form - Product Requirements Document (PRD)

**Document Version:** 1.1  
**Date:** January 26, 2026  
**Project:** Student Answer Sheet Submission Form  
**Platform:** Arivihan Technologies

---

## 1. Overview

Create a web form with Google Forms-like UI/UX for students to submit their handwritten answer sheets for checking. The form should be clean, mobile-responsive, and bilingual (Hindi + English).

---

## 2. Form Structure & Flow

```
┌─────────────────────────────────────────┐
│           HEADER IMAGE                   │
│    (Arivihan/Arivihan Branding)          │
├─────────────────────────────────────────┤
│         FORM TITLE & INSTRUCTIONS        │
├─────────────────────────────────────────┤
│    SECTION 1: Student Information        │
│    - Name (Required)                     │
│    - Mobile Number (Required)            │
│    - Admit Card (Required)               │
├─────────────────────────────────────────┤
│    SECTION 2: Submission Type            │
│    - Radio: Arivihan Model Paper          │
│    - Radio: Own Question Paper           │
├─────────────────────────────────────────┤
│    SECTION 3: Subject Selection          │
│    (Dynamic based on Section 2)          │
│    - Subject checkboxes                  │
│    - File uploads per subject            │
├─────────────────────────────────────────┤
│           SUBMIT BUTTON                  │
└─────────────────────────────────────────┘
```

---

## 3. Detailed Field Specifications

### 3.1 Header Section

| Element | Specification |
|---------|---------------|
| Header Image | Full-width banner image (like Google Forms header) |
| Dimensions | Recommended: 1600 x 400 px (will be responsive) |
| Content | Arivihan branding with exam-related graphics |

---

### 3.2 Form Title & Global Instructions

**Title:** 
```
MP BOARD क्लास 12 | मॉडल पेपर और उत्तर अपलोड फॉर्म (Arivihan)
```

**Global Instructions (Always Visible):**
```
यह फ़ॉर्म MP Board Class 12 के विद्यार्थियों के लिए है जो अपने मॉडल पेपर या उत्तर की जाँच करवाना चाहते हैं।

कृपया फ़ॉर्म भरते समय निम्न निर्देशों का पालन करें:

1. अपना पूरा नाम और Application Number सही-सही दर्ज करें।

2. सही विषय (Subject) का चयन करें, जिस विषय का उत्तर आप अपलोड कर रहे हैं।

3. उत्तर अपने हाथ से लिखा हुआ होना चाहिए।

4. उत्तर की तस्वीर साफ़, सीधी और पूरी दिखनी चाहिए। 

5. धुंधली (blur) या कटी हुई तस्वीरें स्वीकार नहीं की जाएँगी।

6. एक से अधिक पेज होने पर सभी पेज सही क्रम में अपलोड करें।

गलत जानकारी या गलत विषय चयन की स्थिति में उत्तर की जाँच नहीं की जाएगी।
```

---

### 3.3 Section 1: Student Information

#### Field 1: Student Name / छात्र का नाम *

| Property | Value |
|----------|-------|
| Field Type | Text Input |
| Label | Student Name / छात्र का नाम * |
| Placeholder | अपना पूरा नाम लिखें |
| Validation | Required, Min 2 characters, Max 100 characters |
| Error Message | कृपया अपना नाम भरें / Please enter your name |

#### Field 2: Mobile Number / मोबाइल नंबर *

| Property | Value |
|----------|-------|
| Field Type | Tel Input |
| Label | Mobile Number / मोबाइल नंबर  * |
| Placeholder | 10 अंकों का मोबाइल नंबर |
| Validation | Required, Exactly 10 digits, Numeric only |
| Error Message | कृपया सही 10 अंकों का मोबाइल नंबर भरें |
| **Special Logic** | Used for duplicate submission check (see Section 6) |

#### Field 3: Admit Card Section *

**Option A: Admit Card Number**

| Property | Value |
|----------|-------|
| Field Type | Text Input |
| Label | Admit Card Number / प्रवेश पत्र क्रमांक |
| Placeholder | अपना Admit Card Number लिखें |
| Validation | Conditional Required (if Option B not filled) |

**Option B: Admit Card Upload**

| Property | Value |
|----------|-------|
| Field Type | File Upload |
| Label | Admit Card Upload / प्रवेश पत्र अपलोड करें |
| Accepted Formats | .jpg, .jpeg, .png, .pdf |
| Max File Size | 5 MB |
| Validation | Conditional Required (if Option A not filled) |

**Combined Validation Rule:**
```
IF (Admit_Card_Number is EMPTY) AND (Admit_Card_Upload is EMPTY) THEN
    Show Error: "कृपया Admit Card Number भरें या Admit Card की फोटो अपलोड करें"
END IF
```

---

### 3.4 Section 2: Submission Type Selection

**Section Title:** 
```
आप क्या सबमिट करना चाहते हैं? / What do you want to submit? *
```

| Property | Value |
|----------|-------|
| Field Type | Radio Buttons |
| Required | Yes |
| Options | 2 (see below) |

**Option 1:**
```
Value: Arivihan_model_paper
Label: Arivihan मॉडल पेपर का Answers
       (Arivihan Model Paper Answers)
```

**Option 2:**
```
Value: own_question_paper  
Label: अपना खुद का प्रश्न / प्रश्नपत्र
       (My Own Question / Question Paper)
```

---

### 3.5 Section 3: Subject Selection & File Upload

**This section appears AFTER user selects submission type in Section 2**

#### Dynamic Instructions Based on Selection:

**If "Arivihan Model Paper" Selected:**
```
📌 निर्देश:
• आप अधिकतम 3 विषयों की कॉपी अपलोड कर सकते हैं।
• जिस विषय की कॉपी अपलोड करनी है, उसे ✓ चुनें।
• चुनने के बाद फाइल अपलोड का ऑप्शन दिखेगा।
• आप या तो 1 PDF (अधिकतम 25 MB) या 10 Images (JPG/PNG) अपलोड कर सकते हैं।

📌 Instructions:
• You can upload copies for maximum 3 subjects.
• Select ✓ the subject for which you want to upload.
• File upload option will appear after selection.
• You can upload either 1 PDF (max 25 MB) OR up to 10 Images (JPG/PNG).
```

**If "Own Question Paper" Selected:**
```
📌 निर्देश:
यदि आपने हमारा मॉडल पेपर हल नहीं किया है और आप अपने किसी भी प्रश्न का उत्तर अपलोड करना चाहते हैं, तो यहाँ अपलोड करें।  

1. Question Number या Chapter सही से लिखें।

2. उत्तर की साफ़ और स्पष्ट तस्वीर अपलोड करें।

3. आप या तो 1 PDF (अधिकतम 25 MB) या 10 Images (JPG/PNG) अपलोड कर सकते हैं।

4. हर प्रश्न के लिए एक ही file अपलोड करें।

📌 Instructions:
• You can upload copy for only 1 subject.
• Select ✓ the subject for which you want to upload.
• You can upload either 1 PDF (max 25 MB) OR up to 10 Images (JPG/PNG).
```

#### Subject List (Checkboxes):

| # | Subject (English) | Subject (Hindi) | Value |
|---|-------------------|-----------------|-------|
| 1 | Hindi | हिन्दी | hindi |
| 2 | English | अंग्रेज़ी | english |
| 3 | Physics | भौतिक विज्ञान | physics |
| 4 | Chemistry | रसायन विज्ञान | chemistry |
| 5 | Biology | जीव विज्ञान | biology |
| 6 | Mathematics | गणित | mathematics |
| 7 | History | इतिहास | history |
| 8 | Political Science | राजनीति विज्ञान | political_science |
| 9 | Economics | अर्थशास्त्र | economics |
| 10 | Geography | भूगोल | geography |
| 11 | Sociology | समाजशास्त्र | sociology |
| 12 | Business Studies | व्यवसाय अध्ययन | business_studies |
| 13 | Accountancy | लेखाशास्त्र | accountancy |

#### Subject Selection Behavior:

```
WHEN user checks a subject checkbox:
    SHOW file upload field immediately below that subject
    
WHEN user unchecks a subject checkbox:
    HIDE file upload field for that subject
    CLEAR any uploaded file for that subject
```

#### File Upload Field (Per Subject):

| Property | Value |
|----------|-------|
| Field Type | File Upload |
| Label | {Subject Name} की कॉपी अपलोड करें |
| **Upload Options** | **Option A:** 1 PDF file (max 25 MB) **OR** **Option B:** Up to 10 Images (JPG/PNG) |
| Accepted Formats | .jpg, .jpeg, .png, .pdf |
| Max File Size (PDF) | 25 MB |
| Max File Size (Images) | 5 MB per image |
| Max Image Count | 10 images per subject |
| Multiple Files | Yes (for images only) |

**File Upload Logic:**
```
WHEN user uploads a file:
    IF file is PDF:
        IF file size > 25 MB:
            SHOW error: "PDF फाइल का साइज़ 25 MB से कम होना चाहिए"
            REJECT file
        ELSE:
            ACCEPT file
            DISABLE further uploads for this subject (only 1 PDF allowed)
    
    IF file is Image (JPG/PNG):
        IF file size > 5 MB:
            SHOW error: "Image का साइज़ 5 MB से कम होना चाहिए"
            REJECT file
        ELSE IF image count >= 10:
            SHOW error: "आप अधिकतम 10 Images ही अपलोड कर सकते हैं"
            REJECT file
        ELSE:
            ACCEPT file
            UPDATE counter: "अपलोड की गई Images: X/10"
            DISABLE PDF upload option (mixing not allowed)

WHEN user removes a file:
    IF no files remaining:
        RE-ENABLE both PDF and Image upload options
    ELSE IF only images remaining:
        Keep PDF disabled, allow more images (up to 10)
```

**Visual UI Elements:**
- Toggle or tab selection: "PDF अपलोड करें" | "Images अपलोड करें"
- For Images: Show counter "अपलोड की गई Images: 3/10"
- Clear visual indication when one option is selected/disabled

---

## 4. Upload Limit Logic

### 4.1 For Arivihan Model Paper (Max 3 Subjects)

```javascript
let selectedCount = 0;
const MAX_SUBJECTS_Arivihan = 3;

WHEN user checks a subject checkbox:
    selectedCount++;
    
    IF selectedCount > MAX_SUBJECTS_Arivihan:
        PREVENT checkbox selection
        SHOW message: "आप अधिकतम 3 विषय ही चुन सकते हैं / You can select maximum 3 subjects"
    END IF

WHEN user unchecks a subject checkbox:
    selectedCount--;
    // Re-enable other checkboxes if they were disabled
```

**Visual Implementation:**
- After 3 subjects selected → Remaining checkboxes become grayed out/disabled
- Show counter: "चुने गए विषय: 2/3" (Selected subjects: 2/3)

### 4.2 For Own Question Paper (Max 1 Subject)

```javascript
let selectedCount = 0;
const MAX_SUBJECTS_OWN = 1;

WHEN user checks a subject checkbox:
    selectedCount++;
    
    IF selectedCount > MAX_SUBJECTS_OWN:
        PREVENT checkbox selection
        SHOW message: "आप केवल 1 विषय चुन सकते हैं / You can select only 1 subject"
    END IF
```

**Visual Implementation:**
- After 1 subject selected → All other checkboxes become grayed out/disabled

### 4.3 When Submission Type Changes

```
WHEN user changes submission type (Arivihan ↔ own):
    CLEAR all subject selections
    CLEAR all uploaded files
    RESET counter to 0
    UPDATE instructions text
    SHOW confirmation: "आपका पिछला चयन हटा दिया गया है"
```

---

## 5. Form Validation Rules

### 5.1 Pre-Submit Validation Checklist

| Field | Rule | Error Message |
|-------|------|---------------|
| Student Name | Required, 2-100 chars | कृपया अपना नाम भरें |
| Mobile Number | Required, 10 digits | कृपया सही मोबाइल नंबर भरें |
| Admit Card | Number OR Upload required | Admit Card जानकारी अनिवार्य है |
| Submission Type | Required selection | कृपया सबमिशन प्रकार चुनें |
| Subject Selection | At least 1 subject | कम से कम 1 विषय चुनें |
| File Upload | File required for each selected subject | चुने गए विषय की फाइल अपलोड करें |

### 5.2 Validation Flow

```
ON Submit Button Click:

1. Validate Student Name → If invalid, highlight field, show error
2. Validate Mobile Number → If invalid, highlight field, show error
3. Validate Admit Card → If both empty, highlight section, show error
4. Validate Submission Type → If not selected, highlight, show error
5. Validate Subject Selection → If none selected, highlight, show error
6. Validate File Uploads → For each selected subject, check file exists

IF all validations pass:
    → Proceed to Duplicate Check (Section 6)
ELSE:
    → Scroll to first error
    → Show summary: "कृपया सभी अनिवार्य फ़ील्ड भरें"
```

---

## 6. Duplicate Submission Check (Backend Logic)

### 6.1 Flow Diagram

```
                    ┌─────────────────┐
                    │  Form Submitted │
                    └────────┬────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Check Mobile Number in │
                │      Database          │
                └────────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐          ┌─────────────────┐
    │ Mobile Number   │          │ Mobile Number   │
    │ NOT FOUND       │          │ FOUND           │
    │ (New User)      │          │ (Existing User) │
    └────────┬────────┘          └────────┬────────┘
             │                            │
             ▼                            ▼
    ┌─────────────────┐          ┌─────────────────┐
    │ Save to DB      │          │ Show Error:     │
    │ Show Success    │          │ "Already        │
    │ Message         │          │  Submitted"     │
    └─────────────────┘          └─────────────────┘
```

### 6.3 User Messages

**Success Message (Show on new submission):**
```
✅ फॉर्म सफलतापूर्वक जमा हो गया!

आपका Submission ID: ANI-2026-XXXXX

जमा किए गए विषय:
• भौतिक विज्ञान (Physics)
• रसायन विज्ञान (Chemistry)

आपकी कॉपी जल्द ही चेक की जाएगी।
धन्यवाद!
```

**Error Message (Show on duplicate):**
```
⚠️ फॉर्म पहले ही जमा हो चुका है!

इस मोबाइल नंबर (98765XXXXX) से पहले ही फॉर्म जमा किया जा चुका है।

पिछला Submission ID: ANI-2026-XXXXX
जमा करने की तारीख: 25 जनवरी 2026

यदि कोई समस्या है तो कृपया हमसे संपर्क करें।
```

---

## 8. UI/UX Specifications

### 8.1 Google Forms-like Design Elements

| Element | Specification |
|---------|---------------|
| Form Container | Max-width: 640px, centered, white background |
| Border | Left border: 4px solid purple/blue (like Google Forms) |
| Header Image | Full width, max-height: 200px |
| Section Cards | White cards with subtle shadow, rounded corners |
| Required Indicator | Red asterisk (*) |
| Error State | Red border, red error text below field |
| Progress | Optional: Show step indicator for sections |



### 8.2 Mobile Responsiveness

- Form should be fully responsive
- Touch-friendly checkboxes and buttons
- File upload should work on mobile (camera option)
- Minimum touch target: 48x48px

---

## 9. File Upload Specifications

### 9.1 Accepted File Types

| Type | Extensions | MIME Types |
|------|------------|------------|
| Images | .jpg, .jpeg, .png | image/jpeg, image/png |
| Documents | .pdf | application/pdf |

### 9.2 File Size Limits

| File Type | Max Size | Max Count |
|-----------|----------|-----------|
| Admit Card | 5 MB | 1 file |
| Subject Answer - PDF | 25 MB | 1 PDF per subject |
| Subject Answer - Images | 5 MB per image | Up to 10 images per subject |

**Important:** For each subject, user can upload EITHER:
- **Option A:** 1 PDF file (up to 25 MB), OR
- **Option B:** Up to 10 images (JPG/PNG, up to 5 MB each)

Mixing PDF and images for the same subject is NOT allowed.

### 9.3 File Naming Convention

```
{submission_id}_{subject_code}_{timestamp}.{extension}

Example: ANI-2026-00001_physics_1706267400.pdf
Example: ANI-2026-00001_physics_1706267400_01.jpg (for multiple images)
```

---

## 10. Error Handling

### 10.1 Client-Side Errors

| Error | Message (Hindi) | Message (English) |
|-------|-----------------|-------------------|
| Empty Name | कृपया अपना नाम भरें | Please enter your name |
| Invalid Mobile | सही 10 अंकों का मोबाइल नंबर भरें | Enter valid 10-digit mobile number |
| No Admit Card | Admit Card जानकारी देना अनिवार्य है | Admit Card information is required |
| No Subject Selected | कम से कम 1 विषय चुनें | Select at least 1 subject |
| PDF Too Large | PDF फाइल का साइज़ 25 MB से कम होना चाहिए | PDF file size should be less than 25 MB |
| Image Too Large | Image का साइज़ 5 MB से कम होना चाहिए | Image size should be less than 5 MB |
| Max Images Exceeded | अधिकतम 10 Images ही अपलोड कर सकते हैं | Maximum 10 images can be uploaded |
| Invalid File Type | केवल JPG, PNG, PDF फाइल अपलोड करें | Only JPG, PNG, PDF files allowed |
| Max Subjects Exceeded (3) | अधिकतम 3 विषय चुन सकते हैं | Maximum 3 subjects can be selected |
| Max Subjects Exceeded (1) | केवल 1 विषय चुन सकते हैं | Only 1 subject can be selected |
| Mixed File Types | एक विषय में PDF और Images दोनों अपलोड नहीं कर सकते | Cannot upload both PDF and images for same subject |

### 10.2 Server-Side Errors

| Error Code | HTTP Status | Message |
|------------|-------------|---------|
| DUPLICATE_SUBMISSION | 409 | फॉर्म पहले ही जमा हो चुका है |
| UPLOAD_FAILED | 500 | फाइल अपलोड में समस्या, कृपया पुनः प्रयास करें |
| SERVER_ERROR | 500 | सर्वर में समस्या, कृपया बाद में प्रयास करें |
| INVALID_DATA | 400 | अमान्य डेटा, कृपया जांचें और पुनः भरें |

## 12. Testing Checklist

### 12.1 Functional Testing

- [ ] Student name validation works
- [ ] Mobile number accepts only 10 digits
- [ ] Admit card - either field works
- [ ] Submission type selection shows correct instructions
- [ ] Subject checkboxes show/hide file upload
- [ ] Max 3 subjects limit works for Arivihan Model Paper
- [ ] Max 1 subject limit works for Own Question Paper
- [ ] Switching submission type clears selections
- [ ] PDF upload accepts up to 25 MB
- [ ] Image upload accepts up to 10 images (5 MB each)
- [ ] Cannot mix PDF and images for same subject
- [ ] File size validation works
- [ ] Duplicate submission check works
- [ ] Success message displays correctly
- [ ] Error messages display correctly

### 12.2 Edge Cases

- [ ] User tries to select 4th subject (Arivihan)
- [ ] User tries to select 2nd subject (Own)
- [ ] User uploads PDF then tries to add images (should be blocked)
- [ ] User uploads 10 images then tries to add 11th (should be blocked)
- [ ] User uploads images then tries to add PDF (should be blocked)
- [ ] User uploads then removes file
- [ ] User switches submission type after uploading files
- [ ] User with same mobile submits again
- [ ] Very slow internet - upload timeout handling
- [ ] Browser back button behavior
- [ ] Form refresh with data filled

---
