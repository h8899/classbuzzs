import csv from 'csv';
import isObject from 'is-object';
import { UserFormatter } from './formatter';

export const parse = async (input) => {
    return await new Promise((resolve, reject) => {
        csv.parse(input, (err, output) => {
            if (err) return reject(err);
            resolve(output);
        });
    });
};

export const stringify = async (input) => {
    return await new Promise((resolve, reject) => {
        csv.stringify(input, (err, output) => {
            if (err) return reject(err);
            resolve(output);
        });
    });
};

// TODO: Make specific function for our use case into separate file
// Required for user: username, fullname, password
//
// Mapping process
// username -> email_address
// fullname -> username, realname
// password -> password
// 0 -> gender
// '' -> description
//
// Required by backend: username, email_address, password, realname, gender, description
export const usersConvert = async (rawCSV) => {
    const result = await parse(rawCSV); // Throw error if fail

    if (result.length <= 0) throw new Error('The CSV file is empty');

    const header = result[0];
    // O(n^2) but we don't care
    const columnUser = header.indexOf('username');
    const columnName = header.indexOf('fullname');
    const columnPass = header.indexOf('password');

    if (columnUser < 0 || columnName < 0 || columnPass < 0)
        throw new Error('The CSV file must contain all 3 columns: username, fullname and password');

    const rows = [];
    rows.push(['username', 'email_address', 'password', 'realname', 'gender', 'description']);

    for (let i = 1, row; i < result.length; i++) {
        row = result[i];
        rows.push([row[columnName], row[columnUser], row[columnPass], row[columnName], 0, '']);
    }

    return await stringify(rows);
};

export const quickFixTncConvert = async (users, array) => {
    if (!Array.isArray(array) || !isObject(users)) return '';
    array.sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1));

    const rows = [];
    rows.push(['Username', 'Full Name', 'Time Spent', 'Checked', 'Answered']);

    const output = {};
    array.forEach((a) => {
        const user = UserFormatter.show(users[a.userId]);

        let extra = a.extra;
        try {
            extra = JSON.parse(extra);
        } catch (e) {
            // Ignored
        }

        if (!isObject(extra)) extra = {};

        const prev = output[a.userId];
        if (isObject(prev) && prev.isProcessed === 'Yes' && !a.isProcessed) return;

        output[a.userId] = {
            username: user.email || '',
            realname: user.realname || '',
            timeSpent: extra.totalTime || '',
            checked: extra.checked ? 'Yes' : 'No',
            isProcessed: a.isProcessed ? 'Yes' : 'No'
        };
    });

    Object.keys(output).forEach((userId) => {
        const out = output[userId];
        rows.push([out.username, out.realname, out.timeSpent, out.checked, out.isProcessed]);
    });

    return await stringify(rows);
};
