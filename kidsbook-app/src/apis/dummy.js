const users = {
    1: {
        id: 1,
        shortName: 'TH',
        displayName: 'Hieu',
        email: 'hieu@gmail.com',
        fullName: 'Le Trung Hieu'
    },
    2: {
        id: 2,
        shortName: 'YC',
        displayName: 'Ang',
        email: 'ang@gmail.com',
        fullName: 'Ang YC'
    },
    3: {
        id: 3,
        shortName: 'HR',
        displayName: 'Herald',
        email: 'herald@gmail.com',
        fullName: 'Herald'
    },
    4: {
        id: 4,
        shortName: 'SS',
        displayName: 'Sreyans',
        email: 'sreyans@gmail.com',
        fullName: 'Sreyans Sipanis'
    },
    5: {
        id: 5,
        shortName: 'BL',
        displayName: 'Prof Ben',
        email: 'benleong@gmail.com',
        fullName: 'Ben Leong',
        photo: 'http://www.nus.edu.sg/uawards/images/2015/Ben_leong_home.jpg'
    }
};

const comments = {
    10: {
        id: 10,
        owner: users[3],
        body: 'Hmm... perhaps a rainbow cat?',
        likes: 1
    },
    11: {
        id: 11,
        owner: users[4],
        body: 'Nah, it is a nyan cat',
        likes: 5
    },
    12: {
        id: 12,
        owner: users[5],
        body: 'Great!',
        likes: 2
    },
    13: {
        id: 13,
        owner: users[1],
        body: 'Yup! Sreyans guess it correctly',
        likes: 0
    },
    14: {
        id: 14,
        owner: users[3],
        body: 'Sounds like a plan',
        likes: 0
    },
    15: {
        id: 15,
        owner: users[1],
        body: 'Ok!',
        likes: 0
    },
    16: {
        id: 16,
        owner: users[5],
        body: 'Welcome to MOE',
        likes: 3
    }
};

const posts = [
    {
        id: '1',
        body: 'Anyone know what is this?',
        type: 'photo',
        photo: 'https://webby-gallery-production.s3.amazonaws.com/uploads/asset/image/10885/3016000000107020_large.jpg',
        date: '8 hours ago',
        owner: users[1],
        comments: [comments[10], comments[11], comments[13]],
        likes: [users[1], users[3], users[5]]
    },
    {
        id: '2',
        body: "Let's build the next Facebook!",
        type: 'text',
        date: '3 days ago',
        owner: users[3],
        comments: [comments[12], comments[14]]
    },
    {
        id: '3',
        body: 'Please watch this before the class tomorrow',
        type: 'youtube',
        youtubeId: 'dQw4w9WgXcQ',
        date: '1 week ago',
        owner: users[5],
        comments: [comments[15]],
        likes: [users[1]]
    },
    {
        id: '4',
        body: 'This is the reason why we build this',
        type: 'link',
        url:
            'https://www.channelnewsasia.com/news/cnainsider/3-in-4-teens-singapore-cyberbullying-bullied-online-survey-10001480',
        og: {
            image:
                'http://www.channelnewsasia.com/image/10001598/16x9/991/557/19119905bd802dee5f7ea2f97a322373/ai/-dp--tp-cyberbullying-1.jpg',
            site_name: 'Channel NewsAsia',
            title: '3 in 4 youngsters say they have been bullied online',
            description:
                'The most up-to-date survey of the issue, commissioned by Talking Point, finds cyberbullying to be a growing problem. But parents may be none the ...',
            favicon:
                'https://www.channelnewsasia.com/image/8395690/1x1/192/192/80df7cb95b04a699c1f568572fd1fe22/Og/default-favicon.png'
        },
        date: '1 week ago',
        owner: users[2],
        comments: [comments[16]],
        likes: [users[1], users[2], users[3], users[4], users[5]]
    }
];

const groups = [
    {
        id: 100,
        photo: 'https://www.cs3216.com/img/class-photos/2017.jpg',
        name: 'CS3216 2017',
        members: 30,
        desc:
            'CS3216 Software Product Engineering for Digital Markets is not your traditional software engineering course. You will not have lectures teaching you how to write in a particular programming language. You will not have assignments that assess you only for the quality of your code'
    },
    {
        id: 101,
        photo: 'https://www.cs3216.com/img/class-photos/2016.jpg',
        name: 'CS3216 2016',
        members: 28,
        desc: "It's not just about coding"
    },
    {
        id: 102,
        photo: 'https://www.cs3216.com/img/class-photos/2015.jpg',
        name: 'CS3216 2015',
        members: 36,
        desc: 'You will not have a bar set for you. In fact, we don’t even know how high the bar is'
    }
];

const flagged = [
    {
        id: 1000,
        type: 'post',
        post: posts[1]
    },
    {
        id: 1001,
        type: 'comment',
        post: posts[2],
        comment: comments[15]
    },
    {
        id: 1002,
        type: 'comment',
        post: posts[0],
        comment: comments[11]
    }
];

const accounts = [
    {
        id: 10000,
        name: 'John Doe',
        photo:
            'https://www.aljazeera.com/mritems/imagecache/mbdxxlarge/mritems/Images/2018/8/30/78376d007f724e5ca0dcf7b4c71862c2_18.jpg',
        lastUsed: '10 days ago'
    },
    {
        id: 10001,
        name: 'Alice',
        photo:
            'https://cdn1.thehunt.com/app/public/system/zine_images/3809557/original/f6f30528102c423928eb87f8b5c4e7af.jpg',
        lastUsed: '2 weeks ago'
    },
    {
        id: 10002,
        name: 'Bob',
        photo: 'https://mglsisters.files.wordpress.com/2015/09/bob-the-builder.jpg',
        lastUsed: '5 minutes ago'
    },
    {
        id: 10003,
        name: 'Carol',
        photo: 'https://www.goombastomp.com/wp-content/uploads/2016/02/Yellow-Pokemon-Wallpaper.jpg',
        lastUsed: '1 hours ago'
    },
    {
        id: 10004,
        name: 'Dave',
        photo: 'http://www.flipgeeks.com/wp-content/uploads/2013/12/stand-by-me-doraemon-3d-800x439-500x274.jpg',
        lastUsed: '24 days ago'
    },
    {
        id: 10005,
        name: 'Eve',
        lastUsed: '1 month ago'
    }
];

const tokens = {
    'token-1': users[1],
    'token-2': users[2],
    'token-3': users[3],
    'token-4': users[4],
    'token-5': users[5]
};

export { users, comments, posts, groups, flagged, accounts, tokens };
