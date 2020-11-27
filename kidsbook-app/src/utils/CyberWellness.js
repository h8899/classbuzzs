import DialogHelper from '../utils/DialogHelper';
import DialogConfirm from '../utils/DialogConfirm';

const allMessages = [
    'Be kind and respect others',
    'Think before you post',
    'Share healthy and positive content with one another',
    'Communicate meaningfully & positively',
    'Express yourself authentically online',
    'Be accurate with factual information',
    'Extend your good nature online',
    'Promote healthy discussions',
    'Be an upstander to cyber bullying!'
];

const getRandomMessage = () => {
    return allMessages[Math.floor(Math.random() * allMessages.length)];
};

export const showRandomMessage = () => {
    return new Promise((resolve) => {
        DialogHelper.showDialog({
            title: 'Welcome to ClassBuzz!',
            body: getRandomMessage(),
            props: {
                disableBackdropClick: true,
                disableEscapeKeyDown: true
            },
            onExit: () => {
                resolve();
            }
        });
    });
};

export const showOffensiveDialog = () => {
    return new Promise((resolve) => {
        DialogConfirm.show(
            'Are you sure?',
            'ClassBuzz detects the use of offensive word(s) in your message. Please be kind with your words. Do you really want to post it?',
            (result) => {
                resolve(result);
            }
        );
    });
};

export const showAbnormalDialog = () => {
    return new Promise((resolve) => {
        DialogConfirm.show(
            'Are you sure?',
            'Think before you post. Is what you are or the way you are communicating necessary? Is it helpful? Do you really want to post it?',
            (result) => {
                resolve(result);
            }
        );
    });
};

export const isAllCaps = (text) => {
    return text.toLocaleUpperCase() === text;
};
