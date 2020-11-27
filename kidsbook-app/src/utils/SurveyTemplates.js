import Config from '../config';

const personalInfo = {
    templateTitle: 'Personal Info',
    title: 'ClassBuzz Profile Page',
    preface: 'Please complete the form below to create your ClassBuzz Profile Page.',
    postface: 'https://www.youtube.com/watch?v=zomo9OKXW6I',
    questions: [
        {
            question: 'Name',
            type: 'text'
        },
        {
            question: 'About me',
            type: 'text'
        },
        {
            question: 'Date of birth',
            type: 'text'
        },
        {
            question: 'Hobbies',
            type: 'text'
        },
        {
            question: 'Favourite food',
            type: 'text'
        },
        {
            question: 'Birth certificate no',
            type: 'text'
        },
        {
            question: 'School',
            type: 'text'
        },
        {
            question: 'Email address',
            type: 'text'
        },
        {
            question: 'Home address',
            type: 'text'
        },
        {
            question: 'Phone number',
            type: 'text'
        },
        {
            question: 'My Family (names, occupation etc.)',
            type: 'text'
        },
        {
            question: 'My Favourite Hangout Place',
            type: 'text'
        },
        {
            question: 'My Travel',
            type: 'text'
        },
        {
            question: `Please read these Terms and Conditions carefully before using ClassBuzz website operated by NUS Computing School. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all users accessing this website. Do not continue to use ClassBuzz's website if you do not accept all of the terms and conditions stated on this page. 

This Agreement shall begin on the date hereof. Certain parts of this website offer the opportunity for users to post and exchange opinions, information, material and data ('Comments') in areas of the website. ClassBuzz does not screen, edit, publish or review Comments prior to their appearance on the website and Comments do not reflect the views or opinions of ClassBuzz, its agents or affiliates.          	
- You are entitled to post the Comments on our website and have all necessary licenses and consents to do so;
- The Comments do not infringe any intellectual property right, including without limitation copyright, patent or trademark, or other proprietary right of any third party;
- The Comments do not contain any defamatory, libellous, offensive, indecent or otherwise unlawful material or material which is an invasion of privacy;
- The Comments will not be used to solicit or promote business or custom or present commercial activities or unlawful activity.
                                                                                
We may modify these Terms, for any reason at any time, by posting a new version on ClassBuzz. These changes do not affect rights and obligations that arose prior to such changes. Your continued use of ClassBuzz following the posting of modified Terms will be subjected to the Terms in effect at the time of your use.`,
            type: 'checkbox',
            options: ['I agree'],
            required: true
        }
    ]
};

const bookstore = {
    templateTitle: 'Phishing Site - Generic bookstore',
    title: 'Bookstore coupon',
    preface: '',
    postface: '',
    customUrl: (surveyId) => {
        return `${Config.externalUrl}/external/book/?id=${surveyId}`;
    },
    questions: [
        {
            question: 'Full name',
            type: 'text'
        },
        {
            question: 'School',
            type: 'text'
        },
        {
            question: 'Birth certificate no',
            type: 'text'
        },
        {
            question: 'Home address',
            type: 'text'
        }
    ]
};

const bookstoreClementiPri = {
    templateTitle: 'Phishing Site - Clementi Pri bookstore',
    title: 'Bookstore coupon (Clementi Pri)',
    preface: '',
    postface: '',
    customUrl: (surveyId) => {
        return `${Config.externalUrl}/external/clementibook/?id=${surveyId}`;
    },
    questions: [
        {
            question: 'Full name',
            type: 'text'
        },
        {
            question: 'School',
            type: 'text'
        },
        {
            question: 'Handphone No',
            type: 'text'
        }
    ]
};

const bookstoreNanHuaPri = {
    templateTitle: 'Phishing Site - Nan Hua Pri bookstore',
    title: 'Bookstore coupon (Nan Hua Pri)',
    preface: '',
    postface: '',
    customUrl: (surveyId) => {
        return `${Config.externalUrl}/external/nanhuabook/?id=${surveyId}`;
    },
    questions: [
        {
            question: 'Full name',
            type: 'text'
        },
        {
            question: 'School',
            type: 'text'
        },
        {
            question: 'Contact number',
            type: 'text'
        },
        {
            question: 'Home address',
            type: 'text'
        }
    ]
};

export const allTemplates = [personalInfo, bookstore, bookstoreClementiPri, bookstoreNanHuaPri];
